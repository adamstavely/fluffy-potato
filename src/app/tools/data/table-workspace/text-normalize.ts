export interface TextNormalizeOptions {
  collapseWhitespace: boolean;
  unifyLineEndings: boolean;
  nfc: boolean;
  nfd: boolean;
  stripInvisible: boolean;
}

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

/** Normalize a single cell or free text. */
export function normalizeText(input: string, opts: TextNormalizeOptions): string {
  let s = input;
  if (opts.unifyLineEndings) {
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
  if (opts.stripInvisible) {
    s = s.replace(ZERO_WIDTH, '');
  }
  if (opts.collapseWhitespace) {
    s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  }
  if (opts.nfc) {
    s = s.normalize('NFC');
  } else if (opts.nfd) {
    s = s.normalize('NFD');
  }
  return s;
}

/** Apply normalization to every cell in-place copy. */
export function normalizeTableCells(
  rows: string[][],
  opts: TextNormalizeOptions,
): string[][] {
  return rows.map((row) => row.map((cell) => normalizeText(cell, opts)));
}
