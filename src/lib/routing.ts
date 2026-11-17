export type Route =
  | { name: "reps" }
  | { name: "rep"; repId: string }
  | { name: "client"; clientId: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  if (parts[0] === "rep" && parts[1]) return { name: "rep", repId: decodeURIComponent(parts[1]) };
  if (parts[0] === "client" && parts[1]) return { name: "client", clientId: decodeURIComponent(parts[1]) };
  return { name: "reps" };
}

export function repHref(repId: string): string {
  return `#/rep/${encodeURIComponent(repId)}`;
}

export function clientHref(clientId: string): string {
  return `#/client/${encodeURIComponent(clientId)}`;
}
