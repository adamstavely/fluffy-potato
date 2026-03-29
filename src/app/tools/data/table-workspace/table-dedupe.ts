/** Deduplicate rows by exact string equality of selected columns (order matters). */
export function dedupeByColumns(rows: string[][], columnIndices: number[]): string[][] {
  if (columnIndices.length === 0) {
    return dedupeExactRows(rows);
  }
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const row of rows) {
    const key = columnIndices.map((i) => row[i] ?? '').join('\u0001');
    if (!seen.has(key)) {
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

/** Split one column’s cell text into multiple columns at a delimiter (pads ragged rows). */
export function splitColumnAt(
  rows: string[][],
  colIndex: number,
  delimiter: string,
): string[][] {
  if (delimiter.length === 0) {
    return rows.map((r) => [...r]);
  }
  const expanded = rows.map((row) => {
    const cell = row[colIndex] ?? '';
    const parts = cell.split(delimiter).map((p) => p.trim());
    const before = row.slice(0, colIndex);
    const after = row.slice(colIndex + 1);
    return [...before, ...parts, ...after];
  });
  const maxLen = Math.max(0, ...expanded.map((r) => r.length));
  return expanded.map((r) => {
    const copy = [...r];
    while (copy.length < maxLen) {
      copy.push('');
    }
    return copy;
  });
}

/** Whole-row dedupe (JSON key). */
export function dedupeExactRows(rows: string[][]): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}
