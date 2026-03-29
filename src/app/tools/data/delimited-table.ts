export type DelimiterMode = 'auto' | '\t' | ',';

export interface ParsedTable {
  /** First row when `firstRowIsHeader` is true; otherwise null. */
  headers: string[] | null;
  /** Data rows (excluding header row when applicable). */
  rows: string[][];
}

function detectDelimiter(firstLine: string): '\t' | ',' {
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs >= commas ? '\t' : ',';
}

function splitRow(line: string, delimiter: '\t' | ','): string[] {
  if (delimiter === '\t') {
    return line.split('\t');
  }
  return line.split(',');
}

/**
 * Parse pasted text into rows. Simple splitting (no CSV quoting rules).
 */
export function parseDelimitedTable(
  raw: string,
  delimiterMode: DelimiterMode,
  firstRowIsHeader: boolean,
): ParsedTable {
  const normalized = raw.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const nonEmpty = lines.filter((l) => l.length > 0);
  if (nonEmpty.length === 0) {
    return { headers: null, rows: [] };
  }

  const delim =
    delimiterMode === 'auto'
      ? detectDelimiter(nonEmpty[0])
      : delimiterMode;

  const allRows = nonEmpty.map((line) => splitRow(line, delim));

  if (firstRowIsHeader && allRows.length > 0) {
    return {
      headers: allRows[0].map((c) => c.trim()),
      rows: allRows.slice(1),
    };
  }

  return { headers: null, rows: allRows };
}

export function rowToTsv(cells: string[]): string {
  return cells.join('\t');
}
