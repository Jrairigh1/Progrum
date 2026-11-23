/**
 * Standard intake documents. Add, rename, or remove pieces here.
 * Order is the order on the puzzle and in the missing list.
 * State and insurer rules below can append extra pieces. They do not
 * replace this list.
 */
import {
  AFFIDAVIT_FORMS,
  AUTHORIZATION_FORM,
  FASANO_FORM,
  INSURERS,
  ESTATE_PIECES,
  LA_ABUSE_PIECES,
  STATE_EXTRA_PIECES,
  STATES,
  ipaRequired,
  type InsurerRule,
  type StateRule,
} from "./catalog";
import type { DealType, PieceDef } from "../types";

interface PieceSeed {
  id: string;
  label: string;
  short: string;
  hint: string;
}

export const CORE_PIECES: PieceSeed[] = [
  { id: "contract", label: "Contract", short: "Contract", hint: "Signed funding contract." },
  { id: "id", label: "ID", short: "ID", hint: "Government-issued photo identification." },
  { id: "proof-social", label: "Proof of Social", short: "Proof of Social", hint: "Proof of Social Security number." },
  { id: "residence-1", label: "Proof of Residence #1", short: "Residence #1", hint: "First proof of residence." },
  { id: "residence-2", label: "Proof of Residence #2", short: "Residence #2", hint: "Second proof of residence." },
  {
    id: "hold-time",
    label: "Hold Time",
    short: "Hold Time",
    hint: "Hold-time document. The day count from the state list appears once a state is chosen.",
  },
  {
    id: "docusign-contract",
    label: "DocuSign Summary for Contract",
    short: "DocuSign · Contract",
    hint: "DocuSign certificate of completion for the contract.",
  },
  {
    id: "docusign-hold",
    label: "DocuSign Summary for Hold Time",
    short: "DocuSign · Hold Time",
    hint: "DocuSign certificate of completion for hold time.",
  },
  { id: "settlement", label: "Settlement Agreement", short: "Settlement", hint: "Underlying settlement agreement." },
  { id: "benefits", label: "Benefits Letter", short: "Benefits Letter", hint: "Current benefits letter from the insurer." },
  { id: "funding", label: "Funding Instructions", short: "Funding", hint: "Instructions for where funds are sent." },
];

export interface PieceProfile {
  state: string;
  insurer: string;
  dealType: DealType;
  lifeContingent?: boolean;
  ipa?: boolean;
  laAbuse?: boolean;
  estate?: boolean;
}

interface PieceContext extends PieceProfile {
  stateRule?: StateRule;
  insurerRule?: InsurerRule;
}

interface ExtraRule {
  id: string;
  label: string;
  short: string;
  hint: string;
  when: (ctx: PieceContext) => boolean;
  badge?: (ctx: PieceContext) => string | undefined;
  formUrl?: (ctx: PieceContext) => string | undefined;
  formLabel?: string;
  optional?: boolean;
}

const CLEARING_PAYS = new Set(["AG", "FM", "USNY", "US"]);

/**
 * Extra documents drawn from CBCisstant. A rule adds a piece only when
 * the client's state, insurer, or deal type calls for it.
 */
export const EXTRA_PIECE_RULES: ExtraRule[] = [
  {
    id: "ipa-invoice",
    label: "IPA Invoice",
    short: "IPA Invoice",
    hint: "Invoice from the independent professional advisor.",
    when: (ctx) => ipaApplies(ctx),
    badge: (ctx) => (ipaRequired(ctx.state) ? "State required" : "IPA"),
  },
  {
    id: "ipa-w9",
    label: "IPA W9",
    short: "IPA W9",
    hint: "W-9 from the independent professional advisor.",
    when: (ctx) => ipaApplies(ctx),
    badge: (ctx) => (ipaRequired(ctx.state) ? "State required" : "IPA"),
  },
  {
    id: "affidavit",
    label: "Affidavit",
    short: "Affidavit",
    hint: "Court affidavit required by this state.",
    when: (ctx) => ctx.dealType !== "spia" && ctx.stateRule?.requiresAffDec === "Aff",
    badge: () => "State required",
    formUrl: (ctx) => AFFIDAVIT_FORMS[ctx.state],
    formLabel: "Open company affidavit form",
  },
  {
    id: "declaration",
    label: "Declaration",
    short: "Declaration",
    hint: "Court declaration required by this state.",
    when: (ctx) => ctx.dealType !== "spia" && ctx.stateRule?.requiresAffDec === "Dec",
    badge: () => "State required",
    formUrl: (ctx) => AFFIDAVIT_FORMS[ctx.state],
    formLabel: "Open company declaration form",
  },
  ...Object.entries(STATE_EXTRA_PIECES).flatMap(([code, pieces]) =>
    pieces.map((piece) => ({
      id: piece.id,
      label: piece.label,
      short: piece.short,
      hint: piece.hint,
      when: (ctx: PieceContext) => ctx.state === code,
      badge: () => "State required",
    })),
  ),
  {
    id: "auth-release",
    label: "Authorization to Release Information",
    short: "Auth to Release",
    hint: "Signed authorization and benefits request used to clear pays with this insurer.",
    when: (ctx) => CLEARING_PAYS.has(ctx.insurer),
    badge: () => "Insurer required",
    formUrl: () => AUTHORIZATION_FORM,
    formLabel: "Open company authorization form",
  },
  {
    id: "policyholder-affidavit",
    label: "Policyholder Affidavit",
    short: "Policyholder Affidavit",
    hint: "Symetra requires a policyholder affidavit.",
    when: (ctx) => ctx.insurer === "SY",
    badge: () => "Insurer required",
  },
  {
    id: "signed-consent",
    label: "Signed Consent Form",
    short: "Signed Consent",
    hint: "Pacific Life needs a signed consent form.",
    when: (ctx) => ctx.insurer === "PL",
    badge: () => "Insurer required",
  },
  {
    id: "policy-copy",
    label: "Policy Copy",
    short: "Policy Copy",
    hint: "Transamerica asks for a policy copy with the application.",
    when: (ctx) => ctx.insurer === "TA",
    badge: () => "Insurer required",
  },
  {
    id: "payment-history",
    label: "Payment History",
    short: "Payment History",
    hint: "Mass Mutual requires a detailed payment history.",
    when: (ctx) => ctx.insurer === "MM",
    badge: () => "Insurer required",
  },
  {
    id: "life-affidavit",
    label: "Life Affidavit",
    short: "Life Affidavit",
    hint: "Life affidavit required when the file is life contingent.",
    when: (ctx) => ctx.lifeContingent === true,
    badge: () => "Life contingent",
  },
  {
    id: "two-person-notifier",
    label: "2 Person Notifier",
    short: "2 Person Notifier",
    hint: "Two-person notifier required when the file is life contingent.",
    when: (ctx) => ctx.lifeContingent === true,
    badge: () => "Life contingent",
  },
  {
    id: "fasano",
    label: "Fasano",
    short: "Fasano",
    hint: "Fasano document required when the file is life contingent.",
    when: (ctx) => ctx.lifeContingent === true,
    badge: () => "Life contingent",
    formUrl: () => FASANO_FORM,
    formLabel: "Open blank Fasano form",
  },
  {
    id: "docucert-fasano",
    label: "DocuCert for Fasano",
    short: "DocuCert for Fasano",
    hint: "DocuCert certificate for the Fasano document, required when the file is life contingent.",
    when: (ctx) => ctx.lifeContingent === true,
    badge: () => "Life contingent",
  },
  {
    id: "life-expectancy",
    label: "Life Expectancy Doc",
    short: "Life Expectancy Doc",
    hint: "Life expectancy document required when the file is life contingent.",
    when: (ctx) => ctx.lifeContingent === true,
    badge: () => "Life contingent",
  },
  ...LA_ABUSE_PIECES.map((piece) => ({
    id: piece.id,
    label: piece.label,
    short: piece.short,
    hint: piece.hint,
    when: (ctx: PieceContext) => ctx.laAbuse === true,
    badge: () => "LA abuse",
  })),
  ...ESTATE_PIECES.map((piece) => ({
    id: piece.id,
    label: piece.label,
    short: piece.short,
    hint: piece.hint,
    optional: piece.optional === true,
    when: (ctx: PieceContext) => ctx.estate === true,
    badge: () => "Estate",
  })),
];

export const LIFE_PIECE_IDS = ["life-affidavit", "two-person-notifier", "fasano", "docucert-fasano", "life-expectancy"] as const;

export const IPA_PIECE_IDS = ["ipa-invoice", "ipa-w9"] as const;

const SPIA_SKIPPED = new Set(["residence-1", "residence-2", "hold-time", "docusign-hold"]);
const LA_ABUSE_SKIPPED = new Set(["benefits", "settlement"]);

function skipCorePiece(ctx: PieceContext, pieceId: string): boolean {
  if (ctx.dealType === "spia" && SPIA_SKIPPED.has(pieceId)) return true;
  if (ctx.laAbuse === true && LA_ABUSE_SKIPPED.has(pieceId)) return true;
  return false;
}

function ipaApplies(ctx: PieceContext): boolean {
  if (ctx.dealType === "spia") return false;
  return ipaRequired(ctx.state) || ctx.ipa === true;
}

const KNOWN_IDS = new Set<string>([
  ...CORE_PIECES.map((piece) => piece.id),
  ...EXTRA_PIECE_RULES.map((rule) => rule.id),
]);

export function isKnownPieceId(id: string): boolean {
  return KNOWN_IDS.has(id);
}

function contextFor(profile: PieceProfile): PieceContext {
  return {
    ...profile,
    stateRule: STATES[profile.state],
    insurerRule: INSURERS[profile.insurer],
  };
}

function holdBadge(ctx: PieceContext): string | undefined {
  const days = ctx.stateRule?.holdTime;
  if (ctx.dealType === "spia") {
    if (days && days !== "N/A") return `SPIA · state lists ${days} days`;
    return "SPIA · confirm hold";
  }
  if (!days) return undefined;
  if (days === "N/A") return "No statutory hold";
  return `${days} days`;
}

export function piecesFor(profile: PieceProfile): PieceDef[] {
  const ctx = contextFor(profile);
  const core: PieceDef[] = CORE_PIECES.filter((piece) => !skipCorePiece(ctx, piece.id)).map((piece) => ({
    ...piece,
    group: "core",
    badge: piece.id === "hold-time" ? holdBadge(ctx) : undefined,
  }));
  const extras: PieceDef[] = EXTRA_PIECE_RULES.filter((rule) => rule.when(ctx)).map((rule) => ({
    id: rule.id,
    label: rule.label,
    short: rule.short,
    hint: rule.hint,
    group: "extra",
    badge: rule.badge?.(ctx),
    formUrl: rule.formUrl?.(ctx),
    formLabel: rule.formLabel,
    optional: rule.optional === true,
  }));
  return [...core, ...extras];
}

export function corePieceCount(): number {
  return CORE_PIECES.length;
}

/** Core puzzle cells in their fixed places. SPIA leaves both residence proofs and Hold Time empty. LA abuse leaves Benefits Letter and Settlement Agreement empty. */
export function puzzleSlots(pieces: PieceDef[]): (PieceDef | null)[] {
  const core = new Map(pieces.filter((piece) => piece.group === "core").map((piece) => [piece.id, piece]));
  return CORE_PIECES.map((piece) => core.get(piece.id) ?? null);
}
