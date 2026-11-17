import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { isM365Configured } from "./config/m365";
import { cleanLabel, cleanName } from "./lib/backup";
import { idbGet, idbSet, loadOrSeed } from "./lib/db";
import { initAuth, login, logout, type SignedInUser } from "./lib/auth";
import { friendlyNameFromUrl, parseHttpsUrl } from "./lib/links";
import { explainGraphError, loadSharePoint, pushChanges } from "./lib/sharepoint";
import { emptyIndex, mergeLocal, type RemoteIndex } from "./lib/syncPlan";
import { isKnownPieceId } from "./config/pieces";
import { INSURERS, STATES } from "./config/catalog";
import type { Client, DealType, PersistedState, Rep } from "./types";

export type StoreMode = "local" | "sharepoint";

interface StoreValue {
  ready: boolean;
  fatal: string | null;
  mode: StoreMode;
  account: SignedInUser | null;
  localBoardCount: number;
  reps: Rep[];
  clients: Client[];
  toast: string | null;
  dismissToast: () => void;
  notify: (message: string) => void;
  signIn: () => void;
  signOut: () => void;
  importLocalBoards: () => void;
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
  const [mode, setMode] = useState<StoreMode>("local");
  const [account, setAccount] = useState<SignedInUser | null>(null);
  const [localBoardCount, setLocalBoardCount] = useState(0);
  const stateRef = useRef<PersistedState | null>(null);
  const modeRef = useRef<StoreMode>("local");
  const indexRef = useRef<RemoteIndex>(emptyIndex());
  const actorRef = useRef("");
  const writing = useRef(0);
  const generation = useRef(0);
  const queue = useRef(Promise.resolve());
  stateRef.current = state;

  useEffect(() => {
    let cancel = false;
    void (async () => {
      if (!isM365Configured()) {
        try {
          const loaded = await loadOrSeed();
          if (cancel) return;
          modeRef.current = "local";
          setMode("local");
          setState(loaded);
          setReady(true);
        } catch (error: unknown) {
          if (cancel) return;
          const message = error instanceof Error ? error.message : "";
          setFatal(
            message.startsWith("Saved data")
              ? `${message} It was left untouched. Nothing was sent to a server.`
              : "This browser blocked IndexedDB. Progrum will not store names or links anywhere else.",
          );
          setReady(true);
        }
        return;
      }
      let signedIn: SignedInUser | null = null;
      try {
        signedIn = await initAuth();
      } catch {
        if (cancel) return;
        modeRef.current = "sharepoint";
        setMode("sharepoint");
        setFatal("Microsoft sign-in could not be completed. Try again.");
        setReady(true);
        return;
      }
      if (cancel) return;
      modeRef.current = "sharepoint";
      setMode("sharepoint");
      setAccount(signedIn);
      if (!signedIn) {
        setReady(true);
        return;
      }
      actorRef.current = signedIn.name;
      try {
        const loaded = await loadSharePoint({ seed: true });
        if (cancel) return;
        indexRef.current = loaded.index;
        setState(loaded.state);
        const local = await idbGet().catch(() => null);
        setLocalBoardCount(local?.clients.length ?? 0);
        setReady(true);
      } catch (error: unknown) {
        if (cancel) return;
        setFatal(explainGraphError(error));
        setReady(true);
      }
    })();
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
    if (mode !== "sharepoint" || !account || !ready) return;
    let stop = false;
    const refresh = () => {
      if (stop || writing.current > 0) return;
      const seen = generation.current;
      void loadSharePoint({ seed: false })
        .then((loaded) => {
          if (stop || writing.current > 0 || generation.current !== seen) return;
          indexRef.current = loaded.index;
          stateRef.current = loaded.state;
          setState(loaded.state);
        })
        .catch(() => {
          /* keep the last good copy; the next poll can try again */
        });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [account, mode, ready]);

  const api = useMemo<StoreValue>(() => {
    const notify = (message: string) => setToast(message);
    const commit = (recipe: (prev: PersistedState) => PersistedState) => {
      const prev = stateRef.current;
      if (!prev) return;
      const next = recipe(prev);
      generation.current += 1;
      const gen = generation.current;
      writing.current += 1;
      stateRef.current = next;
      setState(next);
      queue.current = queue.current
        .then(async () => {
          if (modeRef.current === "local") {
            await idbSet(next);
            return;
          }
          indexRef.current = await pushChanges(indexRef.current, prev, next, actorRef.current);
        })
        .catch(async (error: unknown) => {
          notify(modeRef.current === "local" ? "Could not save on this browser. Nothing was sent to a server." : explainGraphError(error));
          if (modeRef.current !== "sharepoint" || generation.current !== gen) return;
          try {
            const loaded = await loadSharePoint({ seed: false });
            if (generation.current !== gen) return;
            indexRef.current = loaded.index;
            stateRef.current = loaded.state;
            setState(loaded.state);
          } catch {
            /* leave the screen as the user last edited it */
          }
        })
        .finally(() => {
          writing.current -= 1;
        });
    };

    return {
      ready,
      fatal,
      mode,
      account,
      localBoardCount,
      reps: state?.reps ?? [],
      clients: state?.clients ?? [],
      toast,
      dismissToast: () => setToast(null),
      notify,
      signIn: () => {
        void login().catch(() => setFatal("Sign-in could not start. Check the Microsoft 365 settings and try again."));
      },
      signOut: () => {
        void logout().catch(() => setFatal("Sign-out could not be completed."));
      },
      importLocalBoards: () => {
        void idbGet()
          .then((local) => {
            const prev = stateRef.current;
            if (!local || !prev || (local.reps.length === 0 && local.clients.length === 0)) {
              notify("Nothing is saved on this browser.");
              return;
            }
            const merged = mergeLocal(prev, local, actorRef.current);
            if (merged.addedReps === 0 && merged.addedClients === 0 && merged.addedLinks === 0) {
              notify("Those boards are already on the shared lists.");
              return;
            }
            commit(() => merged.state);
            notify(
              `Added ${merged.addedReps} reps, ${merged.addedClients} clients, and ${merged.addedLinks} links to SharePoint.`,
            );
          })
          .catch(() => notify("The boards on this browser could not be read."));
      },
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
            const nextState = patch.state === undefined ? client.state : STATES[patch.state] ? patch.state : "";
            const insurer = patch.insurer === undefined ? client.insurer : INSURERS[patch.insurer] ? patch.insurer : "";
            const dealType = patch.dealType === "spia" ? "spia" : patch.dealType === "structured" ? "structured" : client.dealType;
            return { ...client, state: nextState, insurer, dealType, updatedAt: new Date().toISOString() };
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
        const now = new Date().toISOString();
        commit((prev) => ({
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.id !== clientId) return client;
            const previous = client.links[pieceId];
            return {
              ...client,
              updatedAt: now,
              links: {
                ...client.links,
                [pieceId]: {
                  url: parsed.url,
                  label: custom || friendlyNameFromUrl(parsed.url),
                  labelIsCustom: Boolean(custom),
                  addedAt: previous && previous.url === parsed.url ? previous.addedAt : now,
                  updatedAt: now,
                  updatedBy: actorRef.current || undefined,
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
        commit(() => next);
      },
    };
  }, [account, fatal, localBoardCount, mode, ready, state, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Store missing");
  return value;
}
