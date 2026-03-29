export type PivotAgg = 'sum' | 'count';

export interface PivotRow {
  groupKey: string;
  value: number;
}

function parseNumber(s: string): number | null {
  const t = s.trim();
  if (t.length === 0) {
    return null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Group by one column; aggregate another (sum or count rows per group). */
export function simplePivot(
  rows: string[][],
  groupCol: number,
  valueCol: number,
  agg: PivotAgg,
): PivotRow[] {
  const map = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const g = (row[groupCol] ?? '').trim();
    const key = g.length > 0 ? g : '(blank)';
    let prev = map.get(key);
    if (!prev) {
      prev = { sum: 0, count: 0 };
      map.set(key, prev);
    }
    prev.count += 1;
    if (agg === 'sum') {
      const n = parseNumber(row[valueCol] ?? '');
      if (n !== null) {
        prev.sum += n;
      }
    }
  }

  const out: PivotRow[] = [];
  for (const [groupKey, { sum, count }] of map) {
    out.push({
      groupKey,
      value: agg === 'sum' ? sum : count,
    });
  }
  out.sort((a, b) => a.groupKey.localeCompare(b.groupKey));
  return out;
}
