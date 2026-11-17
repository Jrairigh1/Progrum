import {
  BIFCO_STATES,
  INSURERS,
  IPA_FEE,
  METLIFE_SPLIT_STATES,
  STATES,
  insurerName,
  ipaRequired,
  stateName,
  underwriterFor,
} from "../config/catalog";
import type { DealType } from "../types";
import { formatDollars, midpointFee } from "./money";

export interface GuidanceRow {
  label: string;
  value: string;
  detail?: string;
}

export interface GuidanceAlert {
  tone: "warn" | "info";
  title: string;
  body: string;
}

export interface GuidanceCost {
  lines: GuidanceRow[];
  total: string | null;
  note: string | null;
}

export interface GuidanceModel {
  alerts: GuidanceAlert[];
  stateTitle: string | null;
  stateRows: GuidanceRow[];
  insurerTitle: string | null;
  insurerRows: GuidanceRow[];
  costs: GuidanceCost | null;
}

export function guidanceFor(profile: { state: string; insurer: string; dealType: DealType; ipa?: boolean }): GuidanceModel {
  const state = STATES[profile.state];
  const insurer = INSURERS[profile.insurer];
  const spia = profile.dealType === "spia";
  const alerts: GuidanceAlert[] = [];

  if (spia) {
    alerts.push({
      tone: "info",
      title: "SPIA file",
      body: "No court process, and no legal or administrative fees. Only the paperwork the insurer asks for. There is no rate cap, but the deal must not be egregious. Court extras such as IPA, affidavits, and declarations are left off this board.",
    });
  }

  if (state?.noPoachState === "Yes") {
    alerts.push({
      tone: "warn",
      title: "No-poach state",
      body: `${stateName(profile.state)} prohibits soliciting clients away from other funding companies.`,
    });
  }

  if (state?.additionalNotes) {
    alerts.push({
      tone: "warn",
      title: "County and court notes",
      body: state.additionalNotes,
    });
  }

  if (profile.insurer === "BK" && BIFCO_STATES.includes(profile.state)) {
    alerts.push({
      tone: "warn",
      title: "Bifco issues may apply with Berkshire",
      body: "Berkshire may send counsel to the hearing to urge the judge to deny the deal if the client will take Berkshire's offer. Fees and the work stay with the client.",
    });
  }

  const stateRows: GuidanceRow[] = [];
  if (state) {
    stateRows.push({ label: "Rate cap", value: spia ? "None on a SPIA, but the deal must not be egregious" : state.rateCap });
    stateRows.push({
      label: "Hold time",
      value: holdText(state.holdTime, spia),
      detail: "Days the state gives the client to be sure about the transfer. The Hold Time piece is still part of the standard 11.",
    });
    stateRows.push({
      label: "Independent professional advice",
      value: ipaRequired(profile.state) ? "Required" : profile.ipa ? "Added for this file" : "Optional",
      detail: "IPA Invoice and IPA W9. Required states always include them. Every other state can add them from the board. CBCisstant prices required IPA at $1,500 on a structured settlement.",
    });
    stateRows.push({
      label: "Affidavit or declaration",
      value: spia ? "Not added on a SPIA" : affText(state.requiresAffDec),
    });
    stateRows.push({ label: "Legal counsel", value: state.legalCounsel });
    stateRows.push({ label: "Expected legal fee", value: spia ? "None on a SPIA" : state.expectedLegalFee });
    stateRows.push({ label: "Underwriter", value: underwriterFor(profile.state) });
  }

  const insurerRows: GuidanceRow[] = [];
  if (insurer) {
    insurerRows.push({ label: "Processing", value: insurer.notes });
    insurerRows.push({
      label: "Conference calls",
      value: insurer.conferenceCalls === "Yes" ? "Yes" : "No",
      detail: "Whether this insurer uses a conference call to confirm payment details.",
    });
    insurerRows.push({ label: "How to confirm payments", value: insurer.paymentConfirmation });
    insurerRows.push({ label: "Credit rating", value: insurer.creditRating });
    insurerRows.push({ label: "Admin fee", value: spia ? "None on a SPIA" : insurer.adminFee });
    insurerRows.push({ label: "Request procedure", value: procedureText(insurer.requestProcedure) });
    if (profile.insurer === "ML") {
      const allowed = profile.state && METLIFE_SPLIT_STATES.includes(profile.state);
      insurerRows.push({
        label: "Allow splits",
        value: profile.state ? (allowed ? "Yes" : "No") : "Choose a state to see whether MetLife allows splits.",
      });
    }
  }

  return {
    alerts,
    stateTitle: state ? stateName(profile.state) : null,
    stateRows,
    insurerTitle: insurer ? insurerName(profile.insurer) : null,
    insurerRows,
    costs: spia ? spiaCosts() : costBlock(profile.state, profile.insurer, ipaRequired(profile.state) || profile.ipa === true),
  };
}

function holdText(holdTime: string, spia: boolean): string {
  if (spia) {
    if (holdTime === "N/A") return "SPIA skips the court process. This state has no statutory hold.";
    return `SPIA skips the court process. This state otherwise lists ${holdTime} days. Confirm before relying on it.`;
  }
  if (holdTime === "N/A") return "No statutory hold";
  return `${holdTime} days`;
}

function affText(value: string): string {
  if (value === "Aff") return "Affidavit required";
  if (value === "Dec") return "Declaration required";
  return "Not required";
}

function procedureText(value: string): string {
  switch (value) {
    case "requires notary":
      return "Request forms need a notary.";
    case "original signature":
      return "Request forms need an original (ink) signature.";
    case "accepts docusign":
      return "This insurer accepts DocuSign on request forms.";
    case "TBD":
      return "Request procedure is not recorded yet.";
    default:
      return value;
  }
}

function spiaCosts(): GuidanceCost {
  return {
    lines: [{ label: "SPIA", value: "No legal or administrative fees." }],
    total: formatDollars(0),
    note: null,
  };
}

function costBlock(stateCode: string, insurerCode: string, includeIpa: boolean): GuidanceCost | null {
  const state = STATES[stateCode];
  const insurer = INSURERS[insurerCode];
  if (!state || !insurer) return null;
  const lines: GuidanceRow[] = [
    { label: "Expected legal fee", value: state.expectedLegalFee },
    { label: "Admin fee", value: insurer.adminFee },
  ];
  let total = 0;
  let incomplete = false;
  const legal = midpointFee(state.expectedLegalFee);
  const admin = midpointFee(insurer.adminFee);
  if (legal === null) incomplete = true;
  else total += legal;
  if (admin === null) incomplete = true;
  else total += admin;
  if (includeIpa) {
    lines.push({ label: "IPA fee", value: formatDollars(IPA_FEE) });
    total += IPA_FEE;
  }
  const ranged = /[-–]| or |for first deal|Life Contingent/i.test(`${state.expectedLegalFee} ${insurer.adminFee}`);
  return {
    lines,
    total: formatDollars(total),
    note: incomplete
      ? "A published fee is still TBD, so it is left out of the estimate."
      : ranged
        ? "Where CBCisstant publishes a range, the estimate uses the midpoint."
        : null,
  };
}
