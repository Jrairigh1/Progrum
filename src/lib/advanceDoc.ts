import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const ADVANCE_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface AdvancePreview {
  clientName: string;
  date: string;
  fileDate: string;
  feeLabel: string;
  amountToClient: string;
  feeAmount: string;
  feeMoney: string;
  advanceAmount: string;
  fileName: string;
}

export function feeLabelFor(wire: boolean): string {
  return wire ? "WIRE/ORIGINATION FEE" : "FEDEX/ORIGINATION FEE";
}

export function parseMoney(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatPlainAmount(amount: number): string {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function todayLetterDate(now = new Date()): string {
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
}

export function parseLetterDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const check = new Date(year, month - 1, day);
  if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
  return { year, month, day };
}

export function fileDateFromLetter(value: string): string | null {
  const parsed = parseLetterDate(value);
  if (!parsed) return null;
  const month = String(parsed.month).padStart(2, "0");
  const day = String(parsed.day).padStart(2, "0");
  return `${parsed.year}-${month}-${day}`;
}

export function advanceFileName(clientName: string, fileDate: string): string {
  const safe = clientName.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim();
  return `Advance - ${safe} - ${fileDate}.docx`;
}

export function previewAdvance(input: {
  clientName: string;
  amountRaw: string;
  feeRaw: string;
  wire: boolean;
  date: string;
}): { ok: true; preview: AdvancePreview } | { ok: false; error: string } {
  const clientName = input.clientName.trim();
  if (!clientName) return { ok: false, error: "Enter a client name." };
  const amount = parseMoney(input.amountRaw);
  if (amount === null) return { ok: false, error: "Enter the amount to the client, like 2000 or $2,000.00." };
  const fee = parseMoney(input.feeRaw);
  if (fee === null) return { ok: false, error: input.wire ? "Enter the wire fee." : "Enter the fee. Use 0.00 when there is none." };
  const fileDate = fileDateFromLetter(input.date);
  if (!fileDate) return { ok: false, error: "Enter the date as M/D/YYYY." };
  const advance = Math.round((amount + fee) * 100) / 100;
  return {
    ok: true,
    preview: {
      clientName,
      date: input.date.trim(),
      fileDate,
      feeLabel: feeLabelFor(input.wire),
      amountToClient: formatMoney(amount),
      feeAmount: formatPlainAmount(fee),
      feeMoney: formatMoney(fee),
      advanceAmount: formatMoney(advance),
      fileName: advanceFileName(clientName, fileDate),
    },
  };
}

export function renderAdvanceDoc(template: ArrayBuffer | Uint8Array, preview: AdvancePreview): Uint8Array {
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{", end: "}" },
    paragraphLoop: false,
    linebreaks: false,
  });
  doc.render({
    date: preview.date,
    clientName: preview.clientName,
    advanceAmount: preview.advanceAmount,
    amountToClient: preview.amountToClient,
    feeLabel: preview.feeLabel,
    feeAmount: preview.feeAmount,
  });
  return doc.getZip().generate({ type: "uint8array" });
}

export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: ADVANCE_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

let templateRequest: Promise<ArrayBuffer> | null = null;

export function loadAdvanceTemplate(): Promise<ArrayBuffer> {
  if (!templateRequest) {
    const url = new URL("templates/advance-template.docx", document.baseURI).href;
    templateRequest = fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error("The advance template could not be loaded.");
        return response.arrayBuffer();
      })
      .catch((error: unknown) => {
        templateRequest = null;
        throw error;
      });
  }
  return templateRequest;
}
