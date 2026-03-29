/** Split a paste into lines with optional trim and blank filtering. */
export function parseLines(
  raw: string,
  trimLines: boolean,
  ignoreEmpty: boolean,
): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const mapped = trimLines ? lines.map((l) => l.trim()) : lines;
  if (ignoreEmpty) {
    return mapped.filter((l) => l.length > 0);
  }
  return mapped;
}

export function normalizeForCompareKey(s: string, caseInsensitive: boolean): string {
  return caseInsensitive ? s.toLocaleLowerCase() : s;
}
