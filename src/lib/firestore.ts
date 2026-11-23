import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseConfig } from "../config/firebase";
import { isKnownPieceId } from "../config/pieces";
import { parseHttpsUrl } from "./links";
import type { Client, DealType, LinkRecord, PersistedState, Rep } from "../types";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const repsCol = collection(db, "progrum", "data", "reps");
const clientsCol = collection(db, "progrum", "data", "clients");
const metaRef = doc(db, "progrum", "meta");

export function explainFirestoreError(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as FirestoreError).code) : "";
  if (code.includes("permission-denied")) {
    return "Firestore refused this change. Writes are only allowed under the progrum collection.";
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return "The shared boards could not be reached. Check the connection and try again.";
  }
  return "The shared boards could not be updated.";
}

export function listenBoards(
  onReps: (reps: Rep[]) => void,
  onClients: (clients: Client[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const stopReps = onSnapshot(
    repsCol,
    (snap) => {
      onReps(
        snap.docs.flatMap((item) => {
          const data = item.data();
          const name = typeof data.name === "string" ? data.name.trim() : "";
          if (!name) return [];
          return [{ id: item.id, name, createdAt: stringField(data.createdAt) || new Date().toISOString() }];
        }),
      );
    },
    onError,
  );
  const stopClients = onSnapshot(
    clientsCol,
    (snap) => {
      onClients(
        snap.docs.flatMap((item) => {
          const data = item.data();
          const name = typeof data.name === "string" ? data.name.trim() : "";
          const repId = typeof data.repId === "string" ? data.repId : "";
          if (!name || !repId) return [];
          const now = new Date().toISOString();
          return [
            {
              id: item.id,
              repId,
              name,
              state: stringField(data.state),
              insurer: data.laAbuse === true ? "" : stringField(data.insurer),
              dealType: data.dealType === "spia" ? "spia" : "structured",
              lifeContingent: data.lifeContingent === true,
              ipa: data.ipa === true,
              laAbuse: data.laAbuse === true,
              funded: data.funded === true,
              fundedAt: data.funded === true ? stringField(data.fundedAt) || undefined : undefined,
              bestContactNumber: stringField(data.bestContactNumber),
              timeAtAddress: stringField(data.timeAtAddress),
              links: readLinks(data.links),
              createdAt: stringField(data.createdAt) || now,
              updatedAt: stringField(data.updatedAt) || now,
            } satisfies Client,
          ];
        }),
      );
    },
    onError,
  );
  return () => {
    stopReps();
    stopClients();
  };
}

export async function seedJamesIfEmpty(): Promise<void> {
  await runTransaction(db, async (tx) => {
    const meta = await tx.get(metaRef);
    if (meta.exists() && meta.data()?.seeded === true) return;
    const jamesRef = doc(repsCol, "james");
    const james = await tx.get(jamesRef);
    if (!james.exists()) {
      tx.set(jamesRef, { name: "James", createdAt: new Date().toISOString() });
    }
    tx.set(metaRef, { seeded: true }, { merge: true });
  });
}

/**
 * Move boards parked on a rep named "Funded Files" onto James and mark them funded.
 * Deletes only that empty rep. Client boards are never deleted. Safe to run again.
 */
export async function migrateFundedFiles(reps: Rep[], clients: Client[]): Promise<number | null> {
  const fundedReps = reps.filter((rep) => rep.name.trim().toLowerCase() === "funded files");
  if (fundedReps.length === 0) return null;
  const james =
    reps.find((rep) => rep.id === "james" && rep.name.trim().toLowerCase() === "james") ??
    reps.find((rep) => rep.name.trim().toLowerCase() === "james");
  if (!james || fundedReps.some((rep) => rep.id === james.id)) return null;
  const fundedIds = new Set(fundedReps.map((rep) => rep.id));
  const moving = clients.filter((client) => fundedIds.has(client.repId));
  const now = new Date().toISOString();
  for (const client of moving) {
    await saveClient({
      ...client,
      repId: james.id,
      funded: true,
      fundedAt: client.fundedAt || now,
      updatedAt: now,
    });
  }
  for (const rep of fundedReps) {
    await removeRep(rep.id, []);
  }
  await setDoc(metaRef, { fundedFilesMoved: moving.length }, { merge: true });
  return moving.length;
}

export async function saveRep(rep: Rep): Promise<void> {
  await setDoc(doc(repsCol, rep.id), { name: rep.name, createdAt: rep.createdAt });
}

export async function removeRep(repId: string, clientIds: string[]): Promise<void> {
  await commitChunks([
    ...clientIds.map((id) => ({ kind: "delete" as const, ref: doc(clientsCol, id) })),
    { kind: "delete", ref: doc(repsCol, repId) },
  ]);
}

const clientQueues = new Map<string, Promise<void>>();

function enqueue(clientId: string, job: () => Promise<void>): Promise<void> {
  const previous = clientQueues.get(clientId) ?? Promise.resolve();
  const next = previous.then(job, job);
  clientQueues.set(clientId, next);
  return next;
}

export function saveClient(client: Client): Promise<void> {
  return enqueue(client.id, () => setDoc(doc(clientsCol, client.id), clientPayload(client)));
}

export function removeClient(clientId: string): Promise<void> {
  return enqueue(clientId, () => deleteDoc(doc(clientsCol, clientId)));
}

export function saveLink(clientId: string, pieceId: string, link: LinkRecord, updatedAt: string): Promise<void> {
  return enqueue(clientId, () =>
    updateDoc(
      doc(clientsCol, clientId),
      new FieldPath("links", pieceId),
      linkPayload(link),
      new FieldPath("updatedAt"),
      updatedAt,
    ),
  );
}

export function removeLink(clientId: string, pieceId: string, updatedAt: string): Promise<void> {
  return enqueue(clientId, () =>
    updateDoc(doc(clientsCol, clientId), new FieldPath("links", pieceId), deleteField(), new FieldPath("updatedAt"), updatedAt),
  );
}

export async function replaceBoards(previous: PersistedState, next: PersistedState): Promise<void> {
  const nextReps = new Set(next.reps.map((rep) => rep.id));
  const nextClients = new Set(next.clients.map((client) => client.id));
  const ops: ChunkOp[] = [];
  for (const rep of previous.reps) {
    if (!nextReps.has(rep.id)) ops.push({ kind: "delete", ref: doc(repsCol, rep.id) });
  }
  for (const client of previous.clients) {
    if (!nextClients.has(client.id)) ops.push({ kind: "delete", ref: doc(clientsCol, client.id) });
  }
  for (const rep of next.reps) ops.push({ kind: "set", ref: doc(repsCol, rep.id), data: { name: rep.name, createdAt: rep.createdAt } });
  for (const client of next.clients) ops.push({ kind: "set", ref: doc(clientsCol, client.id), data: clientPayload(client) });
  await commitChunks(ops);
}

export async function sharedBoardsExist(): Promise<boolean> {
  const meta = await getDoc(metaRef);
  return meta.exists();
}

function clientPayload(client: Client): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: client.name,
    repId: client.repId,
    state: client.state,
    insurer: client.laAbuse ? "" : client.insurer,
    dealType: client.dealType satisfies DealType,
    lifeContingent: client.lifeContingent === true,
    ipa: client.ipa === true,
    laAbuse: client.laAbuse === true,
    funded: client.funded === true,
    bestContactNumber: client.bestContactNumber,
    timeAtAddress: client.timeAtAddress,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    links: Object.fromEntries(Object.entries(client.links).map(([id, link]) => [id, linkPayload(link)])),
  };
  if (client.funded && client.fundedAt) payload.fundedAt = client.fundedAt;
  return payload;
}

function linkPayload(link: LinkRecord): Record<string, string | boolean> {
  const payload: Record<string, string | boolean> = {
    url: link.url,
    label: link.label,
    labelIsCustom: link.labelIsCustom,
    addedAt: link.addedAt,
    updatedAt: link.updatedAt || link.addedAt,
  };
  if (link.updatedBy) payload.updatedBy = link.updatedBy;
  return payload;
}

function readLinks(raw: unknown): Record<string, LinkRecord> {
  if (!raw || typeof raw !== "object") return {};
  const links: Record<string, LinkRecord> = {};
  for (const [pieceId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isKnownPieceId(pieceId) || !value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    if (typeof record.url !== "string") continue;
    const parsed = parseHttpsUrl(record.url);
    if (!parsed.ok) continue;
    const addedAt = stringField(record.addedAt) || new Date().toISOString();
    links[pieceId] = {
      url: parsed.url,
      label: stringField(record.label) || pieceId,
      labelIsCustom: record.labelIsCustom === true,
      addedAt,
      updatedAt: stringField(record.updatedAt) || addedAt,
      updatedBy: stringField(record.updatedBy) || undefined,
    };
  }
  return links;
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

type ChunkOp =
  | { kind: "delete"; ref: ReturnType<typeof doc> }
  | { kind: "set"; ref: ReturnType<typeof doc>; data: Record<string, unknown> };

async function commitChunks(ops: ChunkOp[]): Promise<void> {
  for (let index = 0; index < ops.length; index += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(index, index + 400)) {
      if (op.kind === "delete") batch.delete(op.ref);
      else batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
}
