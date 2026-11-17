import { blankLine, cleanDocText, documentFileName, fileDateOrToday, renderTemplate } from "./advanceDoc";

export const LIFE_QUESTIONS = [
  "Am I under the influence of alcohol?",
  "Am I under the influence of illegal drugs?",
  "Am I under duress?",
  "Do I suffer from dementia?",
  "Do I suffer from bi-polar disorder?",
  "Do I suffer from schizophrenia?",
  "Do I suffer from any other psychotic disorders?",
  "Have I ever been in a coma?",
  "Have I ever had brain surgery?",
  "Are my medical decisions being determined by a third party?",
] as const;

export type YesNo = "yes" | "no";

const MARK =
  '<w:b/><w:bCs/><w:highlight w:val="yellow"/><w:bdr w:val="single" w:sz="16" w:space="1" w:color="042047"/>';

export function emphasizeChoice(xml: string, placeholder: string): string {
  const needle = `{${placeholder}}`;
  const at = xml.indexOf(needle);
  if (at < 0) throw new Error("The life affidavit template is missing an answer.");
  const runStart = xml.lastIndexOf("<w:r", at);
  const runEnd = xml.indexOf("</w:r>", at);
  if (runStart < 0 || runEnd < 0) throw new Error("The life affidavit template is missing an answer.");
  let run = xml.slice(runStart, runEnd);
  if (run.includes("<w:rPr>")) run = run.replace("<w:rPr>", `<w:rPr>${MARK}`);
  else run = run.replace(/^(<w:r\b[^>]*>)/, `$1<w:rPr>${MARK}</w:rPr>`);
  return xml.slice(0, runStart) + run + xml.slice(runEnd);
}

export function buildLifeAffidavit(input: {
  clientName: string;
  answers: Array<YesNo | "">;
  date: string;
}): { ok: true; data: Record<string, string>; fileName: string; prepare: (xml: string) => string } | { ok: false; error: string } {
  const clientName = cleanDocText(input.clientName);
  if (!clientName) return { ok: false, error: "Enter a client name." };
  if (input.answers.length !== LIFE_QUESTIONS.length || input.answers.some((answer) => answer !== "yes" && answer !== "no")) {
    return { ok: false, error: "Answer every question." };
  }
  const fileDate = fileDateOrToday(input.date);
  if (!fileDate) return { ok: false, error: "Enter the date as M/D/YYYY, or leave it blank." };
  const data: Record<string, string> = {
    clientName,
    signDate: input.date.trim() ? input.date.trim() : blankLine("", 14),
  };
  for (let index = 0; index < input.answers.length; index += 1) {
    const number = index + 1;
    data[`q${number}Yes`] = "Yes";
    data[`q${number}No`] = "No";
  }
  const chosen = input.answers.map((answer, index) => (answer === "yes" ? `q${index + 1}Yes` : `q${index + 1}No`));
  return {
    ok: true,
    data,
    fileName: documentFileName("Life Affidavit", clientName, fileDate),
    prepare: (xml) => chosen.reduce((current, tag) => emphasizeChoice(current, tag), xml),
  };
}

export function renderLifeAffidavit(template: ArrayBuffer | Uint8Array, data: Record<string, string>, prepare: (xml: string) => string): Uint8Array {
  return renderTemplate(template, data, prepare);
}
