/**
 * Format and checksum helpers for common tax / national identifiers.
 * These checks do not prove a number is assigned or active—only shape and local rules.
 */

export type TaxIdKind = 'eu-vat' | 'us-ein' | 'uk-ni';

export interface TaxIdValidationResult {
  kind: TaxIdKind;
  normalized: string;
  valid: boolean;
  message: string;
}

/** BZSt algorithm for DE USt-IdNr check digit (9 digits after DE: 8 base + 1 check). */
export function deVatCheckDigit(body8: string): number {
  let p = 10;
  for (let i = 0; i < 8; i++) {
    const d = parseInt(body8[i]!, 10);
    let s = (d + p) % 10;
    if (s === 0) {
      s = 10;
    }
    p = (s * 2) % 11;
  }
  const c = 11 - p;
  return c === 10 ? 0 : c;
}

function normalizeEuVat(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function validateEuVat(raw: string): TaxIdValidationResult {
  const s = normalizeEuVat(raw);
  if (!s) {
    return {
      kind: 'eu-vat',
      normalized: '',
      valid: false,
      message: 'Enter a VAT number (e.g. DE115235681).',
    };
  }
  const m = /^([A-Z]{2})(.+)$/.exec(s);
  if (!m) {
    return {
      kind: 'eu-vat',
      normalized: s,
      valid: false,
      message: 'Must start with a two-letter country code.',
    };
  }
  const cc = m[1];
  const body = m[2].replace(/[^A-Z0-9]/g, '');
  const full = cc + body;

  if (cc === 'DE') {
    if (!/^DE\d{9}$/.test(full)) {
      return {
        kind: 'eu-vat',
        normalized: full,
        valid: false,
        message: 'Germany (DE): expect DE followed by exactly 9 digits.',
      };
    }
    const eight = body.slice(0, 8);
    const check = parseInt(body.slice(8, 9), 10);
    const expected = deVatCheckDigit(eight);
    const ok = check === expected;
    return {
      kind: 'eu-vat',
      normalized: full,
      valid: ok,
      message: ok
        ? 'Germany USt-IdNr structure and check digit match.'
        : 'Germany USt-IdNr check digit does not match the first eight digits.',
    };
  }

  if (cc === 'NL') {
    if (!/^NL\d{9}B\d{2}$/.test(full)) {
      return {
        kind: 'eu-vat',
        normalized: full,
        valid: false,
        message: 'Netherlands (NL): expect NL + 9 digits + B + 2 digits (e.g. NL859761971B02).',
      };
    }
    // Legacy/company NL numbers carry an "elevenproef" check digit: weight the first
    // 8 digits 9..2, take mod 11, and compare to the 9th digit (a result of 10 is invalid).
    // Note: personal VAT IDs issued since 2020 are randomized and do not satisfy this test.
    const nine = body.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(nine[i]!, 10) * (9 - i);
    }
    const remainder = sum % 11;
    const checkDigit = parseInt(nine[8]!, 10);
    const ok = remainder !== 10 && remainder === checkDigit;
    return {
      kind: 'eu-vat',
      normalized: full,
      valid: ok,
      message: ok
        ? 'Netherlands BTW number structure and eleven-test check digit match.'
        : 'Netherlands BTW check digit fails the eleven-test (note: post-2020 personal numbers are randomized).',
    };
  }

  if (cc === 'FR') {
    const ok = /^FR[A-Z0-9]{2}\d{9}$/.test(full);
    return {
      kind: 'eu-vat',
      normalized: full,
      valid: ok,
      message: ok
        ? 'France: format FR + 2 alphanumeric + 9 digits (checksum not verified).'
        : 'France: expect FR + 2 characters + 9 digits.',
    };
  }

  if (cc === 'GB') {
    const ok = /^GB(\d{9}(\d{3})?|GD[0-4]\d{2}|HA[5-9]\d{2})$/.test(full);
    return {
      kind: 'eu-vat',
      normalized: full,
      valid: ok,
      message: ok
        ? 'United Kingdom: format looks valid (checksum not verified).'
        : 'United Kingdom: expect GB + 9 or 12 digits, or government/health patterns (GD/HA).',
    };
  }

  if (cc === 'ES') {
    const ok = /^ES[A-Z0-9]\d{7}[A-Z0-9]$/.test(full);
    return {
      kind: 'eu-vat',
      normalized: full,
      valid: ok,
      message: ok
        ? 'Spain: format matches common NIF/CIF-style VAT (checksum not verified).'
        : 'Spain: expect ES + letter/digit + 7 digits + trailing character.',
    };
  }

  return {
    kind: 'eu-vat',
    normalized: full,
    valid: false,
    message:
      'Supported with full checks: DE, NL. Format-only: FR, GB, ES. Verify other countries with official sources.',
  };
}

/**
 * IRS-published set of valid EIN campus prefixes (first two digits).
 * Source: irs.gov "How EINs are Assigned and Valid EIN Prefixes". This is a discrete
 * allow-list, not a contiguous range — e.g. 07–09, 17–19, 28–29, 49, 69, 70, 78–79, 89,
 * 96–97 are unassigned, while 98–99 (foreign/other) are valid.
 */
const VALID_EIN_PREFIXES = new Set<number>([
  1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58,
  59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 71, 72, 73, 74, 75, 76, 77, 80, 81, 82, 83, 84, 85, 86,
  87, 88, 90, 91, 92, 93, 94, 95, 98, 99,
]);

export function validateUsEin(raw: string): TaxIdValidationResult {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 9) {
    return {
      kind: 'us-ein',
      normalized: digits,
      valid: false,
      message: 'EIN must contain exactly 9 digits.',
    };
  }
  const prefix = parseInt(digits.slice(0, 2), 10);
  if (!VALID_EIN_PREFIXES.has(prefix)) {
    return {
      kind: 'us-ein',
      normalized: `${digits.slice(0, 2)}-${digits.slice(2)}`,
      valid: false,
      message: 'EIN prefix (first two digits) is not an assigned IRS campus code.',
    };
  }
  const normalized = `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return {
    kind: 'us-ein',
    normalized,
    valid: true,
    message: 'Format and IRS prefix range look valid (does not confirm assignment).',
  };
}

export function validateUkNi(raw: string): TaxIdValidationResult {
  const compact = raw.replace(/\s+/g, '').toUpperCase();
  if (!compact) {
    return {
      kind: 'uk-ni',
      normalized: '',
      valid: false,
      message: 'Enter a National Insurance number.',
    };
  }
  // HMRC rules: first letter excludes D,F,I,Q,U,V; second excludes D,F,I,O,Q,U,V
  // (both enforced by the character classes below). Suffix is A–D.
  const NI_RE = /^[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]$/;
  // Prefix pairs HMRC never allocates, regardless of the per-letter rules above.
  const disallowedPrefixes = new Set(['BG', 'GB', 'KN', 'NK', 'NT', 'TN', 'ZZ']);
  const ok = NI_RE.test(compact) && !disallowedPrefixes.has(compact.slice(0, 2));
  return {
    kind: 'uk-ni',
    normalized: compact,
    valid: ok,
    message: ok
      ? 'Format matches the usual NI pattern (does not confirm the number is issued).'
      : 'Format should be 2 letters, 6 digits, 1 letter (A–D), with HMRC letter restrictions.',
  };
}
