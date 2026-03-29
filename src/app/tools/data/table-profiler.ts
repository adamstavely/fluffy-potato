export type InferredType = 'empty' | 'number' | 'date' | 'text';

export interface ColumnProfile {
  columnLabel: string;
  inferredType: InferredType;
  nullOrEmpty: number;
  distinctCount: number;
  /** For number/date columns when parseable */
  minSample?: string;
  maxSample?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NUM = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

function inferCellType(raw: string): InferredType {
  const t = raw.trim();
  if (t.length === 0) {
    return 'empty';
  }
  if (NUM.test(t)) {
    return 'number';
  }
  if (ISO_DATE.test(t) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) {
    return 'date';
  }
  return 'text';
}

function parseSortable(s: string): number | null {
  const t = s.trim();
  if (t.length === 0) {
    return null;
  }
  if (NUM.test(t)) {
    return Number(t);
  }
  if (ISO_DATE.test(t)) {
    return new Date(t + 'T00:00:00').getTime();
  }
  return null;
}

/** Profile each column of a rectangular row matrix (data rows only). */
export function profileColumns(
  headers: string[] | null,
  rows: string[][],
  maxDistinct = 50_000,
): ColumnProfile[] {
  if (rows.length === 0) {
    return [];
  }
  const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const out: ColumnProfile[] = [];

  for (let c = 0; c < colCount; c++) {
    const label =
      headers && headers[c] !== undefined && headers[c].trim().length > 0
        ? headers[c].trim()
        : `Column ${c + 1}`;

    let nullOrEmpty = 0;
    const distinct = new Set<string>();
    const types: InferredType[] = [];
    const nums: number[] = [];

    for (const row of rows) {
      const cell = row[c] ?? '';
      if (cell.trim().length === 0) {
        nullOrEmpty++;
      }
      const it = inferCellType(cell);
      types.push(it);
      const n = parseSortable(cell);
      if (n !== null && !Number.isNaN(n)) {
        nums.push(n);
      }
      if (distinct.size < maxDistinct) {
        distinct.add(cell);
      }
    }

    let inferred: InferredType = 'text';
    const nonEmpty = rows.length - nullOrEmpty;
    if (nonEmpty === 0) {
      inferred = 'empty';
    } else {
      const numCount = types.filter((t) => t === 'number').length;
      const dateCount = types.filter((t) => t === 'date').length;
      if (numCount >= nonEmpty * 0.85) {
        inferred = 'number';
      } else if (dateCount >= nonEmpty * 0.85) {
        inferred = 'date';
      } else {
        inferred = 'text';
      }
    }

    let minSample: string | undefined;
    let maxSample: string | undefined;
    if (nums.length > 0) {
      const mn = Math.min(...nums);
      const mx = Math.max(...nums);
      minSample = String(mn);
      maxSample = String(mx);
    }

    out.push({
      columnLabel: label,
      inferredType: inferred,
      nullOrEmpty,
      distinctCount: distinct.size,
      minSample,
      maxSample,
    });
  }

  return out;
}
