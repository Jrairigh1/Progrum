export interface CopyLine {
  label: string;
  url: string;
}

export function buildCopyText(input: {
  clientName: string;
  bestContactNumber?: string;
  timeAtAddress?: string;
  filled: CopyLine[];
  missingLabels: string[];
  includeMissing: boolean;
  stateForms: CopyLine[];
  includeStateForms: boolean;
}): { plain: string; html: string } {
  const plain: string[] = [input.clientName, ""];
  const html: string[] = [`<p><strong>${escapeHtml(input.clientName)}</strong></p>`];
  const details = [
    ["Best contact number", input.bestContactNumber?.trim() ?? ""],
    ["Time at address", input.timeAtAddress?.trim() ?? ""],
  ].filter(([, value]) => value);
  if (details.length > 0) {
    for (const [label, value] of details) {
      plain.push(`${label}: ${value}`);
      html.push(`<p>${escapeHtml(label)}: ${escapeHtml(value)}</p>`);
    }
    plain.push("");
  }

  if (input.filled.length === 0) {
    plain.push("No links saved yet.");
    html.push("<p>No links saved yet.</p>");
  } else {
    for (const line of input.filled) {
      plain.push(`${line.label}: ${line.url}`);
      html.push(`<p><a href="${escapeHtml(line.url)}">${escapeHtml(line.label)}</a></p>`);
    }
  }

  if (input.includeMissing && input.missingLabels.length > 0) {
    const list = input.missingLabels.join(", ");
    plain.push("", `Still needed: ${list}`);
    html.push(`<p>Still needed: ${escapeHtml(list)}</p>`);
  }

  if (input.includeStateForms && input.stateForms.length > 0) {
    plain.push("", "State forms");
    html.push("<p><strong>State forms</strong></p>");
    for (const form of input.stateForms) {
      plain.push(`${form.label}: ${form.url}`);
      html.push(`<p><a href="${escapeHtml(form.url)}">${escapeHtml(form.label)}</a></p>`);
    }
  }

  return { plain: plain.join("\n"), html: html.join("") };
}

export async function writeClipboard(plain: string, html: string): Promise<"copied" | "plain" | "fallback"> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return "fallback";
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return "copied";
    } catch {
      /* try plain text next */
    }
  }
  if (navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(plain);
      return "plain";
    } catch {
      return "fallback";
    }
  }
  return "fallback";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
