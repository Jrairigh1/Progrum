/** Midpoint of the published fee string. Null when the fee is not a number (for example TBD). */
export function midpointFee(feeStr: string): number | null {
  if (!feeStr) return null;
  if (feeStr === "No Fee") return 0;
  if (feeStr === "TBD") return null;
  const nums = feeStr.match(/[0-9][0-9,]*(?:\.[0-9]+)?/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map((n) => Number.parseFloat(n.replace(/,/g, "")));
  if (values.some((value) => Number.isNaN(value))) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

export function formatDollars(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
