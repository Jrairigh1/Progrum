import type { Client, LinkRecord, PersistedState, Rep } from "../types";

export interface RemoteIndex {
  reps: Record<string, string>;
  clients: Record<string, string>;
  links: Record<string, string>;
}

export function emptyIndex(): RemoteIndex {
  return { reps: {}, clients: {}, links: {} };
}

export function linkKey(clientId: string, pieceId: string): string {
  return `${clientId}\n${pieceId}`;
}

export type SyncOp =
  | { op: "deleteLink"; clientId: string; pieceId: string }
  | { op: "deleteClient"; clientId: string }
  | { op: "deleteRep"; repId: string }
  | { op: "upsertRep"; rep: Rep }
  | { op: "upsertClient"; client: Client }
  | { op: "upsertLink"; clientId: string; pieceId: string; link: LinkRecord };

export function planSync(prev: PersistedState, next: PersistedState): SyncOp[] {
  const ops: SyncOp[] = [];
  const nextClients = new Map(next.clients.map((client) => [client.id, client]));
  const nextReps = new Map(next.reps.map((rep) => [rep.id, rep]));

  for (const client of prev.clients) {
    const updated = nextClients.get(client.id);
    const nextLinks = updated?.links ?? {};
    for (const pieceId of Object.keys(client.links)) {
      if (!nextLinks[pieceId]) ops.push({ op: "deleteLink", clientId: client.id, pieceId });
    }
    if (!updated) ops.push({ op: "deleteClient", clientId: client.id });
  }
  for (const rep of prev.reps) {
    if (!nextReps.has(rep.id)) ops.push({ op: "deleteRep", repId: rep.id });
  }
  for (const rep of next.reps.values()) {
    const previous = prev.reps.find((item) => item.id === rep.id);
    if (!previous || previous.name !== rep.name) ops.push({ op: "upsertRep", rep });
  }
  for (const client of next.clients.values()) {
    const previous = prev.clients.find((item) => item.id === client.id);
    if (!previous || clientCoreChanged(previous, client)) ops.push({ op: "upsertClient", client });
    for (const [pieceId, link] of Object.entries(client.links)) {
      const before = previous?.links[pieceId];
      if (!before || linkChanged(before, link)) ops.push({ op: "upsertLink", clientId: client.id, pieceId, link });
    }
  }
  return ops;
}

function clientCoreChanged(previous: Client, next: Client): boolean {
  return (
    previous.name !== next.name ||
    previous.repId !== next.repId ||
    previous.state !== next.state ||
    previous.insurer !== next.insurer ||
    previous.dealType !== next.dealType ||
    previous.lifeContingent !== next.lifeContingent ||
    previous.ipa !== next.ipa ||
    previous.laAbuse !== next.laAbuse ||
    previous.estate !== next.estate ||
    previous.poa !== next.poa ||
    previous.leadPaint !== next.leadPaint ||
    previous.notApplicable.join("\n") !== next.notApplicable.join("\n") ||
    previous.funded !== next.funded ||
    previous.fundedAt !== next.fundedAt ||
    previous.bestContactNumber !== next.bestContactNumber ||
    previous.timeAtAddress !== next.timeAtAddress
  );
}

function linkChanged(previous: LinkRecord, next: LinkRecord): boolean {
  return (
    previous.url !== next.url ||
    previous.label !== next.label ||
    previous.labelIsCustom !== next.labelIsCustom ||
    previous.addedAt !== next.addedAt ||
    previous.updatedAt !== next.updatedAt ||
    previous.updatedBy !== next.updatedBy
  );
}

export function mergeLocal(
  remote: PersistedState,
  local: PersistedState,
  actor: string,
): { state: PersistedState; addedReps: number; addedClients: number; addedLinks: number } {
  const reps = [...remote.reps];
  const clients = remote.clients.map((client) => ({ ...client, links: { ...client.links } }));
  let addedReps = 0;
  let addedClients = 0;
  let addedLinks = 0;
  const repMap = new Map<string, string>();

  for (const rep of local.reps) {
    const existing = reps.find((item) => item.name.toLowerCase() === rep.name.toLowerCase());
    if (existing) {
      repMap.set(rep.id, existing.id);
    } else {
      reps.push(rep);
      repMap.set(rep.id, rep.id);
      addedReps += 1;
    }
  }

  for (const client of local.clients) {
    const repId = repMap.get(client.repId) ?? client.repId;
    if (!reps.some((rep) => rep.id === repId)) continue;
    let target = clients.find((item) => item.repId === repId && item.name.toLowerCase() === client.name.toLowerCase());
    if (!target) {
      target = { ...client, repId, links: {} };
      clients.push(target);
      addedClients += 1;
    }
    for (const [pieceId, link] of Object.entries(client.links)) {
      if (target.links[pieceId]) continue;
      target.links[pieceId] = {
        ...link,
        updatedBy: link.updatedBy || actor || "Imported from a browser",
        updatedAt: link.updatedAt || link.addedAt,
      };
      addedLinks += 1;
    }
  }

  return {
    state: { version: 1, reps, clients },
    addedReps,
    addedClients,
    addedLinks,
  };
}
