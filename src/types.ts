export type DealType = "structured" | "spia";

export interface LinkRecord {
  url: string;
  label: string;
  labelIsCustom: boolean;
  addedAt: string;
  updatedAt?: string;
  updatedBy?: string;
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
  /** Extra life-contingent documents. Missing on older records means false. */
  lifeContingent: boolean;
  /** Optional IPA Invoice and W9. Required states show those pieces even when this is false. */
  ipa: boolean;
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
