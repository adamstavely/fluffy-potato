import { normalizeForCompareKey } from './list-parse';
import { keySimilarity } from './string-similarity';
import { rowToTsv } from './delimited-table';

export interface CrosswalkOptions {
  keyColA: number;
  keyColB: number;
  trimKeys: boolean;
  caseInsensitive: boolean;
}

export interface CrosswalkResult {
  onlyA: string[];
  onlyB: string[];
  both: string[];
  totalA: number;
  totalB: number;
  /** Set when inputs exceed max rows or columns are invalid. */
  error?: string;
}

function cellAt(row: string[], colIndex: number): string {
  if (colIndex < 0 || colIndex >= row.length) {
    return '';
  }
  return row[colIndex] ?? '';
}

function normKey(
  raw: string,
  trimKeys: boolean,
  caseInsensitive: boolean,
): string {
  const t = trimKeys ? raw.trim() : raw;
  return normalizeForCompareKey(t, caseInsensitive);
}

/** Exact join on normalized key; first row wins on duplicate keys per side. */
export function crosswalkExact(
  rowsA: string[][],
  rowsB: string[][],
  opts: CrosswalkOptions,
): CrosswalkResult {
  const { keyColA, keyColB, trimKeys, caseInsensitive } = opts;
  const mapA = new Map<string, string[]>();
  const mapB = new Map<string, string[]>();

  for (const row of rowsA) {
    const k = normKey(cellAt(row, keyColA), trimKeys, caseInsensitive);
    if (!mapA.has(k)) {
      mapA.set(k, row);
    }
  }
  for (const row of rowsB) {
    const k = normKey(cellAt(row, keyColB), trimKeys, caseInsensitive);
    if (!mapB.has(k)) {
      mapB.set(k, row);
    }
  }

  const onlyA: string[] = [];
  const onlyB: string[] = [];
  const both: string[] = [];

  for (const [key, row] of mapA) {
    if (mapB.has(key)) {
      const aLine = rowToTsv(row);
      const bLine = rowToTsv(mapB.get(key)!);
      both.push(`${aLine}\n${bLine}`);
    } else {
      onlyA.push(rowToTsv(row));
    }
  }
  for (const [key, row] of mapB) {
    if (!mapA.has(key)) {
      onlyB.push(rowToTsv(row));
    }
  }

  onlyA.sort((x, y) => x.localeCompare(y));
  onlyB.sort((x, y) => x.localeCompare(y));
  both.sort((x, y) => x.localeCompare(y));

  return {
    onlyA,
    onlyB,
    both,
    totalA: rowsA.length,
    totalB: rowsB.length,
  };
}

/** Greedy fuzzy match: each A row picks best unused B row above threshold (in A order). */
export function crosswalkFuzzy(
  rowsA: string[][],
  rowsB: string[][],
  opts: CrosswalkOptions,
  threshold: number,
): CrosswalkResult {
  const { keyColA, keyColB, trimKeys, caseInsensitive } = opts;
  const usedB = new Set<number>();
  const onlyA: string[] = [];
  const both: string[] = [];

  for (let i = 0; i < rowsA.length; i++) {
    const rowA = rowsA[i];
    const keyA = normKey(cellAt(rowA, keyColA), trimKeys, caseInsensitive);
    let bestJ = -1;
    let bestSim = -1;
    for (let j = 0; j < rowsB.length; j++) {
      if (usedB.has(j)) {
        continue;
      }
      const keyB = normKey(cellAt(rowsB[j], keyColB), trimKeys, caseInsensitive);
      const sim = keySimilarity(keyA, keyB);
      if (sim >= threshold && sim > bestSim) {
        bestSim = sim;
        bestJ = j;
      }
    }
    if (bestJ >= 0) {
      usedB.add(bestJ);
      const aLine = rowToTsv(rowA);
      const bLine = rowToTsv(rowsB[bestJ]);
      both.push(`${aLine}\n${bLine}`);
    } else {
      onlyA.push(rowToTsv(rowA));
    }
  }

  const onlyB: string[] = [];
  for (let j = 0; j < rowsB.length; j++) {
    if (!usedB.has(j)) {
      onlyB.push(rowToTsv(rowsB[j]));
    }
  }

  onlyA.sort((x, y) => x.localeCompare(y));
  onlyB.sort((x, y) => x.localeCompare(y));
  both.sort((x, y) => x.localeCompare(y));

  return {
    onlyA,
    onlyB,
    both,
    totalA: rowsA.length,
    totalB: rowsB.length,
  };
}
