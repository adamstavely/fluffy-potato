/**
 * Small curated TAC prefix hints (first 8 digits of IMEI = TAC). Full GSMA allocation is not bundled.
 */
export const TAC_PREFIX_HINTS: { prefix: string; hint: string }[] = [
  { prefix: '35332506', hint: 'Apple (example allocation — verify against current GSMA data)' },
  { prefix: '35407110', hint: 'Samsung (example allocation — verify against current GSMA data)' },
  { prefix: '86802003', hint: 'Generic handset OEM (example — verify)' },
];

export function tacHintForImei(imei15: string): string | null {
  const tac = imei15.slice(0, 8);
  const exact = TAC_PREFIX_HINTS.find((h) => tac.startsWith(h.prefix));
  if (exact) {
    return exact.hint;
  }
  const partial = TAC_PREFIX_HINTS.find((h) => tac.startsWith(h.prefix.slice(0, 6)));
  return partial?.hint ?? null;
}
