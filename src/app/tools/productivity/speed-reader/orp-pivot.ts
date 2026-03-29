/**
 * Spritz-style optimal recognition point (ORP): pivot index by word length buckets.
 * Aligns the emphasized character in a stable column for RSVP reading.
 */
export function orpPivotIndex(word: string): number {
  const n = word.length;
  if (n === 0) {
    return 0;
  }
  if (n <= 2) {
    return 0;
  }
  if (n <= 5) {
    return 1;
  }
  if (n <= 9) {
    return 2;
  }
  if (n <= 13) {
    return 3;
  }
  const p = 4 + Math.floor((n - 14) / 4);
  return Math.min(p, n - 1);
}

export function splitOrpDisplay(word: string): { before: string; pivot: string; after: string } {
  if (word.length === 0) {
    return { before: '', pivot: '', after: '' };
  }
  const idx = orpPivotIndex(word);
  return {
    before: word.slice(0, idx),
    pivot: word.charAt(idx),
    after: word.slice(idx + 1),
  };
}

/** Split on whitespace; keeps punctuation attached to words. */
export function tokenizeWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}
