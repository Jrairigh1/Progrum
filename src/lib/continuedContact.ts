import { blankLine, cleanDocText, documentFileName, fileDateOrToday, renderTemplate } from "./advanceDoc";

export interface ContactPerson {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
  email: string;
  relationship: string;
}

export const EMPTY_CONTACT: ContactPerson = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  fax: "",
  email: "",
  relationship: "",
};

const REQUIRED: Array<[keyof ContactPerson, string]> = [
  ["name", "name"],
  ["address", "address"],
  ["city", "city"],
  ["state", "state"],
  ["zip", "ZIP code"],
  ["phone", "telephone"],
  ["email", "email"],
  ["relationship", "relationship"],
];

export function buildContinuedContact(input: {
  clientName: string;
  fileNumber: string;
  first: ContactPerson;
  second: ContactPerson;
  date: string;
}): { ok: true; data: Record<string, string>; fileName: string } | { ok: false; error: string } {
  const clientName = cleanDocText(input.clientName);
  if (!clientName) return { ok: false, error: "Enter the seller's printed name." };
  const missing = personError(input.first, "Contact 1") || personError(input.second, "Contact 2");
  if (missing) return { ok: false, error: missing };
  const fileDate = fileDateOrToday(input.date);
  if (!fileDate) return { ok: false, error: "Enter the date as M/D/YYYY, or leave it blank." };
  return {
    ok: true,
    fileName: documentFileName("Designation of Continued Contact", clientName, fileDate),
    data: {
      fileNumber: blankLine(input.fileNumber, 8),
      ...personFields("c1", input.first),
      ...personFields("c2", input.second),
      contactDate: input.date.trim() ? cleanDocText(input.date) : blankLine("", 20),
      sellerName: clientName,
    },
  };
}

export function renderContinuedContact(template: ArrayBuffer | Uint8Array, data: Record<string, string>): Uint8Array {
  return renderTemplate(template, data);
}

function personError(person: ContactPerson, label: string): string | null {
  for (const [key, name] of REQUIRED) {
    if (!cleanDocText(person[key])) return `Enter the ${name} for ${label}.`;
  }
  return null;
}

function personFields(prefix: "c1" | "c2", person: ContactPerson): Record<string, string> {
  return {
    [`${prefix}Name`]: cleanDocText(person.name),
    [`${prefix}Address`]: cleanDocText(person.address),
    [`${prefix}City`]: cleanDocText(person.city),
    [`${prefix}State`]: cleanDocText(person.state),
    [`${prefix}Zip`]: cleanDocText(person.zip),
    [`${prefix}Phone`]: cleanDocText(person.phone),
    [`${prefix}Fax`]: blankLine(person.fax, 31),
    [`${prefix}Email`]: cleanDocText(person.email),
    [`${prefix}Relationship`]: cleanDocText(person.relationship),
  };
}
