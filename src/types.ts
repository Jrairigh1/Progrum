export type DealType = "structured" | "spia";

export interface LinkRecord {
  url: string;
  label: string;
  labelIsCustom: boolean;
  addedAt: string;
}

export interface Rep {
  id: string;
  name: string;
  createdAt: string;
}

export interface Client {
  id: string;
  repId: string;
  name: string;
  state: string;
  insurer: string;
  dealType: DealType;
  links: Record<string, LinkRecord>;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedState {
  version: 1;
  reps: Rep[];
  clients: Client[];
}

export interface PieceDef {
  id: string;
  label: string;
  short: string;
  hint: string;
  group: "core" | "extra";
  badge?: string;
  formUrl?: string;
  formLabel?: string;
}
