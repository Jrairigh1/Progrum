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
  /** LA abuse file. No insurer, plus Point Allocation and First Payment Breakdown. Missing means false. */
  laAbuse: boolean;
  /** Estate file. Adds the estate documents. Missing means false. */
  estate: boolean;
  /** Power of attorney. Adds Proof of POA. Missing means false. */
  poa: boolean;
  /** Optional pieces marked not applicable, such as Will. Missing means none. */
  notApplicable: string[];
  /** Funded deals leave the rep's active list and stay on the same rep. Missing means false. */
  funded: boolean;
  fundedAt?: string;
  /** Optional phone. Missing on older records means empty. */
  bestContactNumber: string;
  /** Optional free text, such as "3 years". Missing on older records means empty. */
  timeAtAddress: string;
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
  /** Empty does not count as missing when the client marks it not applicable. */
  optional?: boolean;
}
