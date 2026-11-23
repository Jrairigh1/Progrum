/** Point values for the LA County abuse settlement, paid in five annual cycles, 2026–2030. */
export const CYCLE1_PER_POINT = 1010.94;
export const FIVE_YEAR_PER_POINT = 5532.5;
export const LATER_CYCLE_GROSS_PER_POINT = (FIVE_YEAR_PER_POINT - CYCLE1_PER_POINT) / 4;
export const LATER_CYCLE_COSTS_PER_POINT = 7.7;
export const LINE6_FACTOR = 0.843;

export const LATER_CYCLES = [
  { cycle: 2, year: 2027 },
  { cycle: 3, year: 2028 },
  { cycle: 4, year: 2029 },
  { cycle: 5, year: 2030 },
] as const;

/** Net payment for one later cycle (2027–2030). Fee is a percent, such as 40. */
export function laterCyclePayment(points: number, feePercent: number): number {
  const netPerPoint = LATER_CYCLE_GROSS_PER_POINT * (1 - feePercent / 100) - LATER_CYCLE_COSTS_PER_POINT;
  return points * netPerPoint;
}

export function line6CrossCheck(line6: number): number {
  return line6 * LINE6_FACTOR;
}

export interface LaAbuseHelp {
  id: "points" | "fee" | "line6";
  /** Site path such as help/la-notice-help.png. Empty means no image. */
  image: string;
  imageAlt: string;
  caption: string;
  body: string;
}

const NOTICE_IMAGE = "help/la-notice-help.png";
const NOTICE_ALT = "Example Point-Based Allocation Payment Notice with line 1 and line 6 highlighted";
const NOTICE_CAPTION = "Line 1 is Total Points. Line 6 is the Net Cycle 1 Payment.";

export const LA_ABUSE_HELP: LaAbuseHelp[] = [
  {
    id: "points",
    image: NOTICE_IMAGE,
    imageAlt: NOTICE_ALT,
    caption: NOTICE_CAPTION,
    body: "On the green-bar Point-Based Allocation Payment Notice from the LA County Child Victims Act Settlement Program. It's line 1, the client's total allocated points.",
  },
  {
    id: "fee",
    image: "",
    imageAlt: "",
    caption: "",
    body: "From the client's attorney retainer or fee agreement, or ask the client's attorney. It's usually 40%, sometimes 45% or 50%.",
  },
  {
    id: "line6",
    image: NOTICE_IMAGE,
    imageAlt: NOTICE_ALT,
    caption: NOTICE_CAPTION,
    body: "On the same Point-Based Allocation Payment Notice. It's line 6, 'Net Point-Based Allocation Payment in Cycle 1'. It's optional and only used as a cross-check.",
  },
];
