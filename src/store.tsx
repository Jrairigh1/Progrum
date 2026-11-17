import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cleanLabel, cleanName } from "./lib/backup";
import { idbGet, idbSet, loadOrSeed } from "./lib/db";
import { friendlyNameFromUrl, parseHttpsUrl } from "./lib/links";
import { isKnownPieceId } from "./config/pieces";
import { INSURERS, STATES } from "./config/catalog";
import type { Client, DealType, PersistedState, Rep } from "./types";

interface StoreValue {
  ready: boolean;
  fatal: string | null;
  reps: Rep[];
  clients: Client[];
  toast: string | null;
  dismissToast: () => void;
  notify: (message: string) => void;
  addRep: (name: string) => { id: string } | { error: string };
  renameRep: (id: string, name: string) => string | null;
  deleteRep: (id: string) => void;
  addClient: (input: { repId: string; name: string; state: string; insurer: string; dealType: DealType }) => { id: string } | { error: string };
  renameClient: (id: string, name: string) => string | null;
  updateClient: (id: string, patch: Partial<Pick<Client, "state" | "insurer" | "dealType">>) => void;
  moveClient: (id: string, repId: string) => void;
  deleteClient: (id: string) => void;
  setLink: (clientId: string, pieceId: string, url: string, customLabel: string) => string | null;
  clearLink: (clientId: string, pieceId: string) => void;
  replaceAll: (state: PersistedState) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState | null>(null);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef<PersistedState | null>(null);
  const writing = useRef(0);
  const queue = useRef(Promise.resolve());
  stateRef.current = state;

  useEffect(() => {
    let cancel = false;
    loadOrSeed().then(
      (loaded) => {
        if (cancel) return;
        setState(loaded);
        setReady(true);
      },
      (error: unknown) => {
        if (cancel) return;
        const message = error instanceof Error ? error.message : "";
        setFatal(
          message.startsWith("Saved data")
            ? `${message} It was left untouched. Nothing was sent to a server.`
            : "This browser blocked IndexedDB. Progrum will not store names or links anywhere else.",
        );
        setReady(true);
      },
    );
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" || writing.current > 0) return;
      void idbGet()
        .then((saved) => {
          if (saved && writing.current === 0) setState(saved);
        })
        .catch(() => {
          /* keep the copy already on screen */
        });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const api = useMemo<StoreValue>(() => {
    const notify = (message: string) => setToast(message);
    const commit = (recipe: (prev: PersistedState) => PersistedState) => {
      const prev = stateRef.current;
      if (!prev) return;
      const next = recipe(prev);
      stateRef.current = next;
      setState(next);
      writing.current += 1;
      queue.current = queue.current
        .then(() => idbSet(next))
        .catch(() => notify("Could not save on this browser. Nothing was sent to a server."))
        .finally(() => {
          writing.current -= 1;
        });
    };

    return {
      ready,
      fatal,
      reps: state?.reps ?? [],
      clients: state?.clients ?? [],
      toast,
      dismissToast: () => setToast(null),
      notify,
      addRep: (name) => {
        const clean = cleanName(name);
        if (!clean) return { error: "Enter a rep name." };
        const id = crypto.randomUUID();
        commit((prev) => ({
          ...prev,
          reps: [...prev.reps, { id, name: clean, createdAt: new Date().toISOString() }],
        }));
        return { id };
      },
      renameRep: (id, name) => {
        const clean = cleanName(name);
        if (!clean) return "Enter a rep name.";
        commit((prev) => ({ ...prev, reps: prev.reps.map((rep) => (rep.id === id ? { ...rep, name: clean } : rep)) }));
        return null;
      },
      deleteRep: (id) => {
        commit((prev) => ({
          ...prev,
          reps: prev.reps.filter((rep) => rep.id !== id),
          clients: prev.clients.filter((client) => client.repId !== id),
        }));
      },
      addClient: (input) => {
        const clean = cleanName(input.name);
        if (!clean) return { error: "Enter a client name." };
        if (!stateRef.current?.reps.some((rep) => rep.id === input.repId)) return { error: "Choose a rep first." };
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        commit((prev) => ({
          ...prev,
          clients: [
            ...prev.clients,
            {
              id,
              repId: input.repId,
              name: clean,
              state: STATES[input.state] ? input.state : "",
              insurer: INSURERS[input.insurer] ? input.insurer : "",
              dealType: input.dealType === "spia" ? "spia" : "structured",
              links: {},
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
        return { id };
      },
      renameClient: (id, name) => {
        const clean = cleanName(name);
        if (!clean) return "Enter a client name.";
        commit((prev) => ({
          ...prev,
          clients: prev.clients.map((client) =>
            client.id === id ? { ...client, name: clean, updatedAt: new Date().toISOString() } : client,
          ),
        }));
        return null;
      },
      updateClient: (id, patch) => {
        commit((prev) => ({
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.id !== id) return client;
            const state = patch.state === undefined ? client.state : STATES[patch.state] ? patch.state : "";
            const insurer = patch.insurer === undefined ? client.insurer : INSURERS[patch.insurer] ? patch.insurer : "";
            const dealType = patch.dealType === "spia" ? "spia" : patch.dealType === "structured" ? "structured" : client.dealType;
            return { ...client, state, insurer, dealType, updatedAt: new Date().toISOString() };
          }),
        }));
      },
      moveClient: (id, repId) => {
        if (!stateRef.current?.reps.some((rep) => rep.id === repId)) return;
        commit((prev) => ({
          ...prev,
          clients: prev.clients.map((client) =>
            client.id === id ? { ...client, repId, updatedAt: new Date().toISOString() } : client,
          ),
        }));
      },
      deleteClient: (id) => {
        commit((prev) => ({ ...prev, clients: prev.clients.filter((client) => client.id !== id) }));
      },
      setLink: (clientId, pieceId, url, customLabel) => {
        const parsed = parseHttpsUrl(url);
        if (!parsed.ok) return parsed.message;
        if (!isKnownPieceId(pieceId)) return "That document is not on this board.";
        const custom = cleanLabel(customLabel);
        commit((prev) => ({
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.id !== clientId) return client;
            const previous = client.links[pieceId];
            return {
              ...client,
              updatedAt: new Date().toISOString(),
              links: {
                ...client.links,
                [pieceId]: {
                  url: parsed.url,
                  label: custom || friendlyNameFromUrl(parsed.url),
                  labelIsCustom: Boolean(custom),
                  addedAt: previous && previous.url === parsed.url ? previous.addedAt : new Date().toISOString(),
                },
              },
            };
          }),
        }));
        return null;
      },
      clearLink: (clientId, pieceId) => {
        commit((prev) => ({
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.id !== clientId || !client.links[pieceId]) return client;
            const links = { ...client.links };
            delete links[pieceId];
            return { ...client, links, updatedAt: new Date().toISOString() };
          }),
        }));
      },
      replaceAll: (next) => {
        stateRef.current = next;
        setState(next);
        writing.current += 1;
        queue.current = queue.current
          .then(() => idbSet(next))
          .catch(() => notify("Could not save the backup on this browser."))
          .finally(() => {
            writing.current -= 1;
          });
      },
    };
  }, [fatal, ready, state, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Store missing");
  return value;
}
