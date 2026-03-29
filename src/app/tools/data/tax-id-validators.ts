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
    const nine = body.slice(0, 9);
    const suf = body.slice(10, 12);
    let product = 0;
    for (let i = 0; i < 9; i++) {
      product += parseInt(nine[i]!, 10) * (9 - i);
    }
    const mod = product % 97;
    const expected = mod === 0 ? 97 : mod;
    const ok = parseInt(suf, 10) === expected;
    return {
      kind: 'eu-vat',
      normalized: full,
      valid: ok,
      message: ok
        ? 'Netherlands BTW number structure and 97-check match.'
        : 'Netherlands BTW suffix does not match the nine-digit base (mod 97).',
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
  if (prefix < 10 || prefix === 11 || prefix === 12 || prefix > 95) {
    return {
      kind: 'us-ein',
      normalized: `${digits.slice(0, 2)}-${digits.slice(2)}`,
      valid: false,
      message: 'EIN prefix (first two digits) is not in a valid IRS range.',
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
  const forbiddenFirst = /^[DFIQUV]/.test(compact);
  const forbiddenSecond = /^.[DFIQUAO]/.test(compact);
  const ok =
    /^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}\d{6}[A-D]{1}$/.test(compact) &&
    !forbiddenFirst &&
    !forbiddenSecond;
  return {
    kind: 'uk-ni',
    normalized: compact,
    valid: ok,
    message: ok
      ? 'Format matches the usual NI pattern (does not confirm the number is issued).'
      : 'Format should be 2 letters, 6 digits, 1 letter (A–D), with HMRC letter restrictions.',
  };
}
