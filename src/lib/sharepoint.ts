import { m365Config } from "../config/m365";
import type { Client, PersistedState, Rep } from "../types";
import { graphToken } from "./auth";
import { emptyIndex, linkKey, planSync, type RemoteIndex, type SyncOp } from "./syncPlan";

const LIST_REPS = "ProgrumReps";
const LIST_CLIENTS = "ProgrumClients";
const LIST_LINKS = "ProgrumLinks";

interface GraphError extends Error {
  status: number;
}

interface ListRef {
  siteId: string;
  reps: string;
  clients: string;
  links: string;
  createdReps: boolean;
}

let listsPromise: Promise<ListRef> | null = null;

export function explainGraphError(error: unknown): string {
  const status = typeof error === "object" && error && "status" in error ? Number((error as GraphError).status) : 0;
  if (status === 401) return "The sign-in expired. Sign in again.";
  if (status === 403) {
    return "This account cannot edit the Progrum SharePoint site. Ask the Microsoft 365 admin to grant the app write access on that site, and to give you Edit permission there.";
  }
  if (status === 404) return "The SharePoint site in the config was not found, or the signed-in account cannot open it.";
  if (status) return `SharePoint returned status ${status}. The boards on screen were not saved.`;
  if (error instanceof Error && error.message === "Redirecting to sign in.") return error.message;
  return "SharePoint could not be reached. Nothing was sent anywhere else.";
}

async function graph(pathOrUrl: string, init?: RequestInit): Promise<unknown> {
  const token = await graphToken();
  const url = pathOrUrl.startsWith("https://") ? pathOrUrl : `https://graph.microsoft.com/v1.0${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (response.status === 204) return null;
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    const error = new Error("Graph request failed") as GraphError;
    error.status = response.status;
    throw error;
  }
  return body;
}

function sitePath(): string {
  const url = new URL(m365Config.sharePointSiteUrl);
  const path = url.pathname.replace(/\/$/, "");
  return `/sites/${url.hostname}:${path || "/"}`;
}

async function ensureLists(): Promise<ListRef> {
  if (!listsPromise) {
    listsPromise = (async () => {
      const site = (await graph(`${sitePath()}?$select=id`)) as { id: string };
      const existing = (await graph(`/sites/${site.id}/lists?$select=id,displayName&$top=200`)) as {
        value: { id: string; displayName: string }[];
      };
      const byName = new Map(existing.value.map((list) => [list.displayName, list.id]));
      const createdReps = !byName.has(LIST_REPS);
      const repsId = byName.get(LIST_REPS) ?? (await createList(site.id, LIST_REPS, repColumns()));
      const clientsId = byName.get(LIST_CLIENTS) ?? (await createList(site.id, LIST_CLIENTS, clientColumns()));
      const linksId = byName.get(LIST_LINKS) ?? (await createList(site.id, LIST_LINKS, linkColumns()));
      await ensureColumns(site.id, repsId, repColumns());
      await ensureColumns(site.id, clientsId, clientColumns());
      await ensureColumns(site.id, linksId, linkColumns());
      return { siteId: site.id, reps: repsId, clients: clientsId, links: linksId, createdReps };
    })().catch((error) => {
      listsPromise = null;
      throw error;
    });
  }
  return listsPromise;
}

async function createList(siteId: string, displayName: string, columns: unknown[]): Promise<string> {
  try {
    const created = (await graph(`/sites/${siteId}/lists`, {
      method: "POST",
      body: JSON.stringify({ displayName, columns, list: { template: "genericList" } }),
    })) as { id: string };
    return created.id;
  } catch (error) {
    const status = (error as GraphError).status;
    if (status !== 409) throw error;
    const again = (await graph(`/sites/${siteId}/lists?$select=id,displayName&$top=200`)) as {
      value: { id: string; displayName: string }[];
    };
    const found = again.value.find((list) => list.displayName === displayName);
    if (!found) throw error;
    return found.id;
  }
}

async function ensureColumns(siteId: string, listId: string, columns: { name: string }[]): Promise<void> {
  const current = (await graph(`/sites/${siteId}/lists/${listId}/columns?$select=name&$top=200`)) as {
    value: { name: string }[];
  };
  const names = new Set(current.value.map((column) => column.name));
  for (const column of columns) {
    if (names.has(column.name)) continue;
    await graph(`/sites/${siteId}/lists/${listId}/columns`, {
      method: "POST",
      body: JSON.stringify(column),
    });
  }
}

function textColumn(name: string, maxLength = 255) {
  return { name, text: { allowMultipleLines: false, maxLength } };
}

function noteColumn(name: string) {
  return {
    name,
    text: { allowMultipleLines: true, textType: "plain", linesForEditing: 6 },
  };
}

function repColumns() {
  return [textColumn("RepId", 80), textColumn("CreatedAt", 40)];
}

function clientColumns() {
  return [
    textColumn("ClientId", 80),
    textColumn("RepId", 80),
    textColumn("StateCode", 8),
    textColumn("InsurerCode", 16),
    textColumn("DealType", 20),
    textColumn("CreatedAt", 40),
    textColumn("UpdatedAt", 40),
  ];
}

function linkColumns() {
  return [
    textColumn("ClientId", 80),
    textColumn("PieceId", 80),
    noteColumn("LinkUrl"),
    textColumn("LabelIsCustom", 8),
    textColumn("AddedAt", 40),
    textColumn("UpdatedAt", 40),
    textColumn("UpdatedBy", 200),
  ];
}

async function readItems(siteId: string, listId: string): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  const items: { id: string; fields: Record<string, unknown> }[] = [];
  let next: string | null = `/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=200`;
  while (next) {
    const page = (await graph(next)) as {
      value: { id: string; fields?: Record<string, unknown> }[];
      "@odata.nextLink"?: string;
    };
    for (const item of page.value) items.push({ id: item.id, fields: item.fields ?? {} });
    next = page["@odata.nextLink"] ?? null;
  }
  return items;
}

function text(fields: Record<string, unknown>, name: string): string {
  const value = fields[name];
  return typeof value === "string" ? value : "";
}

export async function loadSharePoint(options: { seed: boolean }): Promise<{ state: PersistedState; index: RemoteIndex }> {
  const lists = await ensureLists();
  const [repItems, clientItems, linkItems] = await Promise.all([
    readItems(lists.siteId, lists.reps),
    readItems(lists.siteId, lists.clients),
    readItems(lists.siteId, lists.links),
  ]);
  const index = emptyIndex();
  const reps: Rep[] = [];
  for (const item of repItems) {
    const id = text(item.fields, "RepId");
    const name = text(item.fields, "Title");
    if (!id || !name) continue;
    index.reps[id] = item.id;
    reps.push({ id, name, createdAt: text(item.fields, "CreatedAt") || new Date().toISOString() });
  }
  const clients: Client[] = [];
  for (const item of clientItems) {
    const id = text(item.fields, "ClientId");
    const name = text(item.fields, "Title");
    const repId = text(item.fields, "RepId");
    if (!id || !name || !repId) continue;
    index.clients[id] = item.id;
    const now = new Date().toISOString();
    clients.push({
      id,
      repId,
      name,
      state: text(item.fields, "StateCode"),
      insurer: text(item.fields, "InsurerCode"),
      dealType: text(item.fields, "DealType") === "spia" ? "spia" : "structured",
      links: {},
      createdAt: text(item.fields, "CreatedAt") || now,
      updatedAt: text(item.fields, "UpdatedAt") || now,
    });
  }
  const byId = new Map(clients.map((client) => [client.id, client]));
  for (const item of linkItems) {
    const clientId = text(item.fields, "ClientId");
    const pieceId = text(item.fields, "PieceId");
    const url = text(item.fields, "LinkUrl");
    const client = byId.get(clientId);
    if (!client || !pieceId || !url) continue;
    index.links[linkKey(clientId, pieceId)] = item.id;
    const addedAt = text(item.fields, "AddedAt") || new Date().toISOString();
    client.links[pieceId] = {
      url,
      label: text(item.fields, "Title") || pieceId,
      labelIsCustom: text(item.fields, "LabelIsCustom") === "yes",
      addedAt,
      updatedAt: text(item.fields, "UpdatedAt") || addedAt,
      updatedBy: text(item.fields, "UpdatedBy") || undefined,
    };
  }
  const state: PersistedState = { version: 1, reps, clients };
  if (options.seed && lists.createdReps && reps.length === 0 && clients.length === 0) {
    const now = new Date().toISOString();
    const seeded: PersistedState = {
      version: 1,
      reps: [{ id: crypto.randomUUID(), name: "James", createdAt: now }],
      clients: [],
    };
    const nextIndex = await pushChanges(index, state, seeded, "Progrum");
    return { state: seeded, index: nextIndex };
  }
  return { state, index };
}

export async function pushChanges(
  index: RemoteIndex,
  prev: PersistedState,
  next: PersistedState,
  actor: string,
): Promise<RemoteIndex> {
  const lists = await ensureLists();
  const updated: RemoteIndex = {
    reps: { ...index.reps },
    clients: { ...index.clients },
    links: { ...index.links },
  };
  for (const op of planSync(prev, next)) {
    await applyOp(lists, updated, op, actor);
  }
  return updated;
}

async function applyOp(lists: ListRef, index: RemoteIndex, op: SyncOp, actor: string): Promise<void> {
  if (op.op === "deleteLink") {
    await removeItem(lists, lists.links, index.links, linkKey(op.clientId, op.pieceId));
    return;
  }
  if (op.op === "deleteClient") {
    await removeItem(lists, lists.clients, index.clients, op.clientId);
    return;
  }
  if (op.op === "deleteRep") {
    await removeItem(lists, lists.reps, index.reps, op.repId);
    return;
  }
  if (op.op === "upsertRep") {
    await upsert(lists, lists.reps, index.reps, op.rep.id, {
      Title: op.rep.name,
      RepId: op.rep.id,
      CreatedAt: op.rep.createdAt,
    });
    return;
  }
  if (op.op === "upsertClient") {
    await upsert(lists, lists.clients, index.clients, op.client.id, {
      Title: op.client.name,
      ClientId: op.client.id,
      RepId: op.client.repId,
      StateCode: op.client.state,
      InsurerCode: op.client.insurer,
      DealType: op.client.dealType,
      CreatedAt: op.client.createdAt,
      UpdatedAt: op.client.updatedAt,
    });
    return;
  }
  const key = linkKey(op.clientId, op.pieceId);
  await upsert(lists, lists.links, index.links, key, {
    Title: op.link.label.slice(0, 255) || op.pieceId,
    ClientId: op.clientId,
    PieceId: op.pieceId,
    LinkUrl: op.link.url,
    LabelIsCustom: op.link.labelIsCustom ? "yes" : "no",
    AddedAt: op.link.addedAt,
    UpdatedAt: op.link.updatedAt || op.link.addedAt,
    UpdatedBy: op.link.updatedBy || actor,
  });
}

function payload(fields: Record<string, string>): Record<string, string | null> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value === "" ? null : value]));
}

async function upsert(
  lists: ListRef,
  listId: string,
  map: Record<string, string>,
  key: string,
  fields: Record<string, string>,
): Promise<void> {
  const itemId = map[key];
  const body = JSON.stringify(payload(fields));
  if (!itemId) {
    const created = (await graph(`/sites/${lists.siteId}/lists/${listId}/items`, {
      method: "POST",
      body: JSON.stringify({ fields: payload(fields) }),
    })) as { id: string };
    map[key] = created.id;
    return;
  }
  await graph(`/sites/${lists.siteId}/lists/${listId}/items/${itemId}/fields`, {
    method: "PATCH",
    headers: { "If-Match": "*" },
    body,
  });
}

async function removeItem(lists: ListRef, listId: string, map: Record<string, string>, key: string): Promise<void> {
  const itemId = map[key];
  if (!itemId) return;
  try {
    await graph(`/sites/${lists.siteId}/lists/${listId}/items/${itemId}`, {
      method: "DELETE",
      headers: { "If-Match": "*" },
    });
  } catch (error) {
    if ((error as GraphError).status !== 404) throw error;
  }
  delete map[key];
}
