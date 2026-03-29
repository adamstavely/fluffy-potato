export function escapeCsvCell(c: string): string {
  if (/[",\n\r]/.test(c)) {
    return `"${c.replace(/"/g, '""')}"`;
  }
  return c;
}

export function rowToCsvLine(cells: string[]): string {
  return cells.map(escapeCsvCell).join(',');
}

export function exportDelimited(
  headers: string[] | null,
  rows: string[][],
  format: 'csv' | 'tsv',
): string {
  const lines: string[] = [];
  const colCount = Math.max(
    headers?.length ?? 0,
    ...rows.map((r) => r.length),
    0,
  );
  const pad = (r: string[]): string[] => {
    const copy = [...r];
    while (copy.length < colCount) {
      copy.push('');
    }
    return copy.slice(0, colCount);
  };

  if (headers && headers.length > 0) {
    lines.push(
      format === 'csv' ? rowToCsvLine(pad(headers)) : pad(headers).join('\t'),
    );
  }
  for (const row of rows) {
    const p = pad(row);
    lines.push(format === 'csv' ? rowToCsvLine(p) : p.join('\t'));
  }
  return lines.join('\n');
}
