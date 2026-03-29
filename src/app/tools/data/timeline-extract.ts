export interface ExtractedDate {
  /** ISO yyyy-mm-dd when parseable, else original match */
  isoOrRaw: string;
  match: string;
  /** Short context around match */
  context: string;
}

const PATTERNS: { re: RegExp; toIso: (m: RegExpMatchArray) => string | null }[] = [
  {
    re: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    toIso: (m) => `${m[1]}-${m[2]}-${m[3]}`,
  },
  {
    re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
    toIso: (m) => {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const y = Number(m[3]);
      const mm = String(b).padStart(2, '0');
      const dd = String(a).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    },
  },
  {
    re: /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
    toIso: (m) => {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const y = Number(m[3]);
      return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    },
  },
];

function contextAround(text: string, start: number, end: number, radius = 40): string {
  const a = Math.max(0, start - radius);
  const b = Math.min(text.length, end + radius);
  return text.slice(a, b).replace(/\s+/g, ' ').trim();
}

/** Extract date-like substrings from free text; dedupe by match+position not needed — sort by date. */
export function extractDatesFromText(text: string, maxResults = 500): ExtractedDate[] {
  const found: ExtractedDate[] = [];
  const seen = new Set<string>();

  for (const { re, toIso } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (found.length >= maxResults) {
        return sortExtracted(found);
      }
      const iso = toIso(m);
      const match = m[0];
      const key = `${m.index}:${match}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      found.push({
        isoOrRaw: iso ?? match,
        match,
        context: contextAround(text, m.index, m.index + match.length),
      });
    }
  }

  return sortExtracted(found);
}

function sortExtracted(items: ExtractedDate[]): ExtractedDate[] {
  return [...items].sort((a, b) => a.isoOrRaw.localeCompare(b.isoOrRaw));
}
