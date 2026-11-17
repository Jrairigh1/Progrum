import { sanitizeStored } from "./backup";
import type { PersistedState } from "../types";

const DB_NAME = "progrum";
const DB_VERSION = 1;
const STORE = "kv";
const KEY = "state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB failed to open"));
  });
}

export async function idbGet(): Promise<PersistedState | null> {
  const db = await openDb();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
    });
    if (raw === undefined) return null;
    const parsed = sanitizeStored(raw);
    if (!parsed.ok) throw new Error(parsed.error);
    return parsed.state;
  } finally {
    db.close();
  }
}

export async function idbSet(state: PersistedState): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB write aborted"));
    });
  } finally {
    db.close();
  }
}

export function seedState(): PersistedState {
  const now = new Date().toISOString();
  return {
    version: 1,
    reps: [{ id: crypto.randomUUID(), name: "James", createdAt: now }],
    clients: [],
  };
}

let loadOnce: Promise<PersistedState> | null = null;

export function loadOrSeed(): Promise<PersistedState> {
  if (!loadOnce) {
    loadOnce = (async () => {
      const existing = await idbGet();
      if (existing) return existing;
      const seeded = seedState();
      await idbSet(seeded);
      return seeded;
    })();
  }
  return loadOnce;
}
