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
