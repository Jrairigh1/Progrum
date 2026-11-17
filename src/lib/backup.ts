import { isKnownPieceId } from "../config/pieces";
import { INSURERS, STATES } from "../config/catalog";
import type { Client, DealType, LinkRecord, PersistedState, Rep } from "../types";
import { friendlyNameFromUrl, parseHttpsUrl } from "./links";

export interface BackupFile {
  app: "progrum";
  version: 1;
  exportedAt: string;
  reps: Rep[];
  clients: Client[];
}

export function toBackup(state: PersistedState): BackupFile {
  return {
    app: "progrum",
    version: 1,
    exportedAt: new Date().toISOString(),
    reps: state.reps,
    clients: state.clients,
  };
}

export function downloadBackup(state: PersistedState): void {
  const file = toBackup(state);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const day = file.exportedAt.slice(0, 10);
  anchor.href = url;
  anchor.download = `progrum-backup-${day}.json`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; state: PersistedState; skippedLinks: number }
  | { ok: false; error: string };

export function parseBackup(raw: unknown): ImportResult {
  if (!isRecord(raw)) return { ok: false, error: "That file is not a Progrum backup." };
  if (raw.app !== "progrum" || raw.version !== 1) {
    return { ok: false, error: "This backup was made by a different version of Progrum." };
  }
  return sanitizeState(raw, true);
}

export function sanitizeStored(raw: unknown): ImportResult {
  return sanitizeState(raw, false);
}

function sanitizeState(raw: unknown, strictApp: boolean): ImportResult {
  if (!isRecord(raw)) return { ok: false, error: "Saved data on this browser could not be read." };
  if (raw.version !== 1) return { ok: false, error: "Saved data on this browser is from a different version." };
  if (strictApp && raw.app !== "progrum") return { ok: false, error: "That file is not a Progrum backup." };
  if (!Array.isArray(raw.reps) || !Array.isArray(raw.clients)) {
    return { ok: false, error: "The file is missing reps or clients." };
  }

  const reps: Rep[] = [];
  const repIds = new Set<string>();
  for (const item of raw.reps) {
    const rep = sanitizeRep(item);
    if (!rep) return { ok: false, error: "A rep in the file is missing a name or id." };
    if (repIds.has(rep.id)) return { ok: false, error: "The file has two reps with the same id." };
    repIds.add(rep.id);
    reps.push(rep);
  }

  const clients: Client[] = [];
  const clientIds = new Set<string>();
  let skippedLinks = 0;
  for (const item of raw.clients) {
    const result = sanitizeClient(item);
    if (!result) return { ok: false, error: "A client in the file is missing a name or id." };
    if (clientIds.has(result.client.id)) return { ok: false, error: "The file has two clients with the same id." };
    if (!repIds.has(result.client.repId)) {
      return { ok: false, error: `Client “${result.client.name}” points at a rep that is not in the file.` };
    }
    clientIds.add(result.client.id);
    skippedLinks += result.skippedLinks;
    clients.push(result.client);
  }

  return { ok: true, state: { version: 1, reps, clients }, skippedLinks };
}

function sanitizeRep(raw: unknown): Rep | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.name !== "string") return null;
  const name = cleanName(raw.name);
  if (!name) return null;
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  return { id: raw.id, name, createdAt };
}

function sanitizeClient(raw: unknown): { client: Client; skippedLinks: number } | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.repId !== "string" || !raw.repId) return null;
  if (typeof raw.name !== "string") return null;
  const name = cleanName(raw.name);
  if (!name) return null;
  const now = new Date().toISOString();
  const linksResult = sanitizeLinks(raw.links);
  const state = typeof raw.state === "string" && STATES[raw.state] ? raw.state : "";
  const insurer = typeof raw.insurer === "string" && INSURERS[raw.insurer] ? raw.insurer : "";
  const dealType: DealType = raw.dealType === "spia" ? "spia" : "structured";
  return {
    skippedLinks: linksResult.skipped,
    client: {
      id: raw.id,
      repId: raw.repId,
      name,
      state,
      insurer,
      dealType,
      links: linksResult.links,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
    },
  };
}

function sanitizeLinks(raw: unknown): { links: Record<string, LinkRecord>; skipped: number } {
  const links: Record<string, LinkRecord> = {};
  if (!isRecord(raw)) return { links, skipped: 0 };
  let skipped = 0;
  for (const [pieceId, value] of Object.entries(raw)) {
    if (!isKnownPieceId(pieceId) || !isRecord(value) || typeof value.url !== "string") {
      skipped += 1;
      continue;
    }
    const parsed = parseHttpsUrl(value.url);
    if (!parsed.ok) {
      skipped += 1;
      continue;
    }
    const custom = value.labelIsCustom === true && typeof value.label === "string" ? cleanLabel(value.label) : "";
    links[pieceId] = {
      url: parsed.url,
      label: custom || friendlyNameFromUrl(parsed.url),
      labelIsCustom: Boolean(custom),
      addedAt: typeof value.addedAt === "string" ? value.addedAt : new Date().toISOString(),
    };
  }
  return { links, skipped };
}

export function cleanName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) return null;
  return name;
}

export function cleanLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
