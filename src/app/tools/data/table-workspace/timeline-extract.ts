export interface ExtractedDate {
  /** ISO yyyy-mm-dd when parseable, else original match */
  isoOrRaw: string;
  match: string;
  /** Short context around match */
  context: string;
}

/** Return `yyyy-mm-dd` only when the (year, month, day) triple is a real calendar date. */
function isoIfValid(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1) {
    return null;
  }
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]!) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const PATTERNS: { re: RegExp; toIso: (m: RegExpMatchArray) => string | null }[] = [
  {
    re: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    toIso: (m) => isoIfValid(Number(m[1]), Number(m[2]), Number(m[3])),
  },
  {
    // Slash dates are ambiguous (US MDY vs EU DMY). Use a field > 12 to disambiguate
    // when possible; otherwise fall back to DMY. Invalid triples return null (kept as raw).
    re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
    toIso: (m) => {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const y = Number(m[3]);
      let day: number;
      let month: number;
      if (a > 12 && b <= 12) {
        day = a;
        month = b;
      } else if (b > 12 && a <= 12) {
        month = a;
        day = b;
      } else {
        // Ambiguous or both invalid: default to day/month order.
        day = a;
        month = b;
      }
      return isoIfValid(y, month, day);
    },
  },
  {
    re: /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
    toIso: (m) => isoIfValid(Number(m[3]), Number(m[2]), Number(m[1])),
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
