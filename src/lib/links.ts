const MAX_URL_LENGTH = 4000;

export type UrlResult = { ok: true; url: string } | { ok: false; message: string };

export function parseHttpsUrl(input: string): UrlResult {
  const extracted = extractCandidate(input);
  if (!extracted) {
    return { ok: false, message: "Paste a full https link from the shared drive." };
  }
  if (extracted.length > MAX_URL_LENGTH) {
    return { ok: false, message: "That link is too long to store." };
  }
  let url: URL;
  try {
    url = new URL(extracted);
  } catch {
    return { ok: false, message: "That does not look like a full web address." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, message: "Use an https link. The file stays on the shared drive." };
  }
  if (url.username || url.password) {
    return { ok: false, message: "Remove any username or password from the link before saving it." };
  }
  if (!url.hostname) {
    return { ok: false, message: "That https link needs a host name." };
  }
  return { ok: true, url: url.toString() };
}

function extractCandidate(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith("<") && raw.endsWith(">")) raw = raw.slice(1, -1).trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }
  try {
    const direct = new URL(raw);
    if (direct.protocol === "https:") return raw;
  } catch {
    /* fall through to a search inside the text */
  }
  const match = raw.match(/https:\/\/[^\s<>"']+/i);
  if (!match) return null;
  return match[0].replace(/[),.;]+$/g, "");
}

export function friendlyNameFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i -= 1) {
      let segment = segments[i] ?? "";
      try {
        segment = decodeURIComponent(segment);
      } catch {
        /* keep the raw segment */
      }
      if (/\.[a-z0-9]{2,5}$/i.test(segment) && segment.length <= 120) {
        const base = segment.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim();
        if (base) return base;
      }
    }
    return host || "Linked document";
  } catch {
    return "Linked document";
  }
}

export function formatAdded(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function readDroppedText(data: DataTransfer): { kind: "file" } | { kind: "empty" } | { kind: "text"; value: string } {
  if (data.files && data.files.length > 0) return { kind: "file" };
  const uri = data.getData("text/uri-list");
  const plain = data.getData("text/plain");
  const lines = `${uri}\n${plain}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const value = lines[0];
  if (!value) return { kind: "empty" };
  return { kind: "text", value };
}

export function dragMightBeLink(data: DataTransfer): boolean {
  const types = Array.from(data.types ?? []);
  return types.includes("text/uri-list") || types.includes("text/plain") || types.includes("Files") || types.includes("text/html");
}
