/**
 * Format a phone-like value as (555) 555-5555.
 * Any other characters are kept as typed.
 */
export function formatContactNumber(raw: string): string {
  const extra = raw.replace(/[\d\s()\-]/g, "");
  if (extra) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, 10);
  const rest = digits.slice(10);
  if (digits.length <= 3) return `(${area}`;
  if (digits.length <= 6) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${line}${rest}`;
}
