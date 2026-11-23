import { clientInsurerLabel, stateName } from "../config/catalog";
import { piecesFor } from "../config/pieces";
import type { Client, PieceDef, Rep } from "../types";

export interface Progress {
  filled: number;
  total: number;
  missing: PieceDef[];
  pieces: PieceDef[];
}

export function pieceWaived(client: Client, piece: PieceDef): boolean {
  return piece.optional === true && client.notApplicable.includes(piece.id);
}

export function progressFor(client: Client): Progress {
  const pieces = piecesFor(client);
  const required = pieces.filter((piece) => !pieceWaived(client, piece));
  const missing = required.filter((piece) => !client.links[piece.id]?.url);
  return {
    filled: required.length - missing.length,
    total: required.length,
    missing,
    pieces,
  };
}

export function sumProgress(clients: Client[]): { filled: number; total: number } {
  return clients.reduce(
    (sum, client) => {
      const progress = progressFor(client);
      return { filled: sum.filled + progress.filled, total: sum.total + progress.total };
    },
    { filled: 0, total: 0 },
  );
}

export function searchClients(query: string, clients: Client[], reps: Rep[]): Client[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return clients
    .filter((client) => {
      const rep = reps.find((item) => item.id === client.repId);
      const haystack = [
        client.name,
        rep?.name ?? "",
        stateName(client.state),
        clientInsurerLabel(client),
        client.state,
        client.laAbuse ? "LA abuse" : "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .slice(0, 12);
}

export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}
