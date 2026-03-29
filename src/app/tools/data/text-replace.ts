function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace all occurrences in every cell (empty find is a no-op). */
export function replaceInCells(
  rows: string[][],
  find: string,
  replace: string,
  caseInsensitive: boolean,
): string[][] {
  if (find.length === 0) {
    return rows.map((r) => [...r]);
  }
  const re = new RegExp(escapeRegExp(find), caseInsensitive ? 'gi' : 'g');
  return rows.map((row) => row.map((cell) => cell.replace(re, replace)));
}
