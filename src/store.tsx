import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cleanLabel, cleanName } from "./lib/backup";
import { idbGet } from "./lib/db";
import {
  explainFirestoreError,
  listenBoards,
  removeClient,
  removeLink,
  removeRep,
  replaceBoards,
  saveClient,
  saveLink,
  saveRep,
  seedJamesIfEmpty,
} from "./lib/firestore";
import { friendlyNameFromUrl, parseHttpsUrl } from "./lib/links";
import { mergeLocal } from "./lib/syncPlan";
import { getYourName } from "./lib/yourName";
import { isKnownPieceId } from "./config/pieces";
import { INSURERS, STATES } from "./config/catalog";
import type { Client, DealType, PersistedState, Rep } from "./types";

interface StoreValue {
  ready: boolean;
  fatal: string | null;
  localBoardCount: number;
  reps: Rep[];
  clients: Client[];
  toast: string | null;
  dismissToast: () => void;
  notify: (message: string) => void;
  importLocalBoards: () => void;
  addRep: (name: string) => { id: string } | { error: string };
  renameRep: (id: string, name: string) => string | null;
  deleteRep: (id: string) => void;
  addClient: (input: {
    repId: string;
    name: string;
    state: string;
    insurer: string;
    dealType: DealType;
    lifeContingent?: boolean;
  }) => { id: string } | { error: string };
  renameClient: (id: string, name: string) => string | null;
  updateClient: (id: string, patch: Partial<Pick<Client, "state" | "insurer" | "dealType" | "lifeContingent">>) => void;
  moveClient: (id: string, repId: string) => void;
  deleteClient: (id: string) => void;
  setLink: (clientId: string, pieceId: string, url: string, customLabel: string) => string | null;
  clearLink: (clientId: string, pieceId: string) => void;
  replaceAll: (state: PersistedState) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [reps, setReps] = useState<Rep[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [localBoardCount, setLocalBoardCount] = useState(0);
  const repsRef = useRef<Rep[]>([]);
  const clientsRef = useRef<Client[]>([]);
  const seen = useRef({ reps: false, clients: false });

  function publish(nextReps: Rep[], nextClients: Client[]) {
    repsRef.current = nextReps;
    clientsRef.current = nextClients;
    setReps(nextReps);
    setClients(nextClients);
  }

  useEffect(() => {
    let cancel = false;
    const stop = listenBoards(
      (next) => {
        repsRef.current = next;
        setReps(next);
        seen.current.reps = true;
        if (seen.current.clients) setReady(true);
      },
      (next) => {
        clientsRef.current = next;
        setClients(next);
        seen.current.clients = true;
        if (seen.current.reps) setReady(true);
      },
      (error) => {
        if (!cancel) setFatal(explainFirestoreError(error));
      },
    );
    void seedJamesIfEmpty().catch((error: unknown) => {
      if (!cancel) setFatal(explainFirestoreError(error));
    });
    void idbGet()
      .then((local) => {
        if (!cancel) setLocalBoardCount(local?.clients.length ?? 0);
      })
      .catch(() => {
        /* a missing local copy just means there is nothing to import */
      });
    return () => {
      cancel = true;
      stop();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const api = useMemo<StoreValue>(() => {
    const notify = (message: string) => setToast(message);
    const fail = (error: unknown) => notify(explainFirestoreError(error));
    const snapshot = (): PersistedState => ({ version: 1, reps: repsRef.current, clients: clientsRef.current });

    return {
      ready,
      fatal,
      localBoardCount,
      reps,
      clients,
      toast,
      dismissToast: () => setToast(null),
      notify,
      importLocalBoards: () => {
        void idbGet()
          .then(async (local) => {
            if (!local || (local.reps.length === 0 && local.clients.length === 0)) {
              notify("Nothing is saved on this browser.");
              return;
            }
            const merged = mergeLocal(snapshot(), local, getYourName() || "Imported from a browser");
            if (merged.addedReps === 0 && merged.addedClients === 0 && merged.addedLinks === 0) {
              notify("Those boards are already on the shared list.");
              return;
            }
            await replaceBoards(snapshot(), merged.state);
            notify(`Added ${merged.addedReps} reps, ${merged.addedClients} clients, and ${merged.addedLinks} links.`);
          })
          .catch((error: unknown) => fail(error));
      },
      addRep: (name) => {
        const clean = cleanName(name);
        if (!clean) return { error: "Enter a rep name." };
        const rep: Rep = { id: crypto.randomUUID(), name: clean, createdAt: new Date().toISOString() };
        publish([...repsRef.current, rep], clientsRef.current);
        void saveRep(rep).catch(fail);
        return { id: rep.id };
      },
      renameRep: (id, name) => {
        const clean = cleanName(name);
        if (!clean) return "Enter a rep name.";
        const current = repsRef.current.find((rep) => rep.id === id);
        if (!current) return "That rep is not on the shared boards.";
        const next = { ...current, name: clean };
        publish(repsRef.current.map((rep) => (rep.id === id ? next : rep)), clientsRef.current);
        void saveRep(next).catch(fail);
        return null;
      },
      deleteRep: (id) => {
        const clientIds = clientsRef.current.filter((client) => client.repId === id).map((client) => client.id);
        publish(
          repsRef.current.filter((rep) => rep.id !== id),
          clientsRef.current.filter((client) => client.repId !== id),
        );
        void removeRep(id, clientIds).catch(fail);
      },
      addClient: (input) => {
        const clean = cleanName(input.name);
        if (!clean) return { error: "Enter a client name." };
        if (!repsRef.current.some((rep) => rep.id === input.repId)) return { error: "Choose a rep first." };
        const now = new Date().toISOString();
        const client: Client = {
          id: crypto.randomUUID(),
          repId: input.repId,
          name: clean,
          state: STATES[input.state] ? input.state : "",
          insurer: INSURERS[input.insurer] ? input.insurer : "",
          dealType: input.dealType === "spia" ? "spia" : "structured",
          lifeContingent: input.lifeContingent === true,
          links: {},
          createdAt: now,
          updatedAt: now,
        };
        publish(repsRef.current, [...clientsRef.current, client]);
        void saveClient(client).catch(fail);
        return { id: client.id };
      },
      renameClient: (id, name) => {
        const clean = cleanName(name);
        if (!clean) return "Enter a client name.";
        const current = clientsRef.current.find((client) => client.id === id);
        if (!current) return "That client is not on the shared boards.";
        const next = { ...current, name: clean, updatedAt: new Date().toISOString() };
        publish(repsRef.current, clientsRef.current.map((client) => (client.id === id ? next : client)));
        void saveClient(next).catch(fail);
        return null;
      },
      updateClient: (id, patch) => {
        const current = clientsRef.current.find((client) => client.id === id);
        if (!current) return;
        const next: Client = {
          ...current,
          state: patch.state === undefined ? current.state : STATES[patch.state] ? patch.state : "",
          insurer: patch.insurer === undefined ? current.insurer : INSURERS[patch.insurer] ? patch.insurer : "",
          dealType: patch.dealType === "spia" || patch.dealType === "structured" ? patch.dealType : current.dealType,
          lifeContingent: typeof patch.lifeContingent === "boolean" ? patch.lifeContingent : current.lifeContingent === true,
          updatedAt: new Date().toISOString(),
        };
        publish(repsRef.current, clientsRef.current.map((client) => (client.id === id ? next : client)));
        void saveClient(next).catch(fail);
      },
      moveClient: (id, repId) => {
        if (!repsRef.current.some((rep) => rep.id === repId)) return;
        const current = clientsRef.current.find((client) => client.id === id);
        if (!current) return;
        const next = { ...current, repId, updatedAt: new Date().toISOString() };
        publish(repsRef.current, clientsRef.current.map((client) => (client.id === id ? next : client)));
        void saveClient(next).catch(fail);
      },
      deleteClient: (id) => {
        publish(repsRef.current, clientsRef.current.filter((client) => client.id !== id));
        void removeClient(id).catch(fail);
      },
      setLink: (clientId, pieceId, url, customLabel) => {
        const parsed = parseHttpsUrl(url);
        if (!parsed.ok) return parsed.message;
        if (!isKnownPieceId(pieceId)) return "That document is not on this board.";
        const current = clientsRef.current.find((client) => client.id === clientId);
        if (!current) return "That client is not on the shared boards.";
        const now = new Date().toISOString();
        const custom = cleanLabel(customLabel);
        const previous = current.links[pieceId];
        const yourName = getYourName();
        const link = {
          url: parsed.url,
          label: custom || friendlyNameFromUrl(parsed.url),
          labelIsCustom: Boolean(custom),
          addedAt: previous && previous.url === parsed.url ? previous.addedAt : now,
          updatedAt: now,
          updatedBy: yourName || undefined,
        };
        const next = { ...current, updatedAt: now, links: { ...current.links, [pieceId]: link } };
        publish(repsRef.current, clientsRef.current.map((client) => (client.id === clientId ? next : client)));
        void saveLink(clientId, pieceId, link, now).catch(fail);
        return null;
      },
      clearLink: (clientId, pieceId) => {
        const current = clientsRef.current.find((client) => client.id === clientId);
        if (!current?.links[pieceId]) return;
        const links = { ...current.links };
        delete links[pieceId];
        const now = new Date().toISOString();
        publish(
          repsRef.current,
          clientsRef.current.map((client) => (client.id === clientId ? { ...client, links, updatedAt: now } : client)),
        );
        void removeLink(clientId, pieceId, now).catch(fail);
      },
      replaceAll: (next) => {
        const previous = snapshot();
        publish(next.reps, next.clients);
        void replaceBoards(previous, next).catch(fail);
      },
    };
  }, [clients, fatal, localBoardCount, ready, reps, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Store missing");
  return value;
}
