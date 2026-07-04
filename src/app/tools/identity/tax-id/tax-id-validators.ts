/**
 * Format and checksum helpers for common tax / national identifiers.
 * These checks do not prove a number is assigned or active—only shape and local rules.
 */
import { checkVAT, countries as vatCountries } from 'jsvat-next';

export type TaxIdKind = 'eu-vat' | 'us-ein' | 'uk-ni';

export interface TaxIdValidationResult {
  kind: TaxIdKind;
  normalized: string;
  valid: boolean;
  message: string;
}

/**
 * VAT number validation via jsvat-next: structure + checksum for all 27 EU member states
 * plus Andorra, Australia, Brazil, Norway, Russia, Serbia, Switzerland, and the UK.
 */
export function validateEuVat(raw: string): TaxIdValidationResult {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (!s) {
    return {
      kind: 'eu-vat',
      normalized: '',
      valid: false,
      message: 'Enter a VAT number with its country prefix (e.g. DE115235681).',
    };
  }
  const res = checkVAT(s, vatCountries);
  if (!res.country) {
    return {
      kind: 'eu-vat',
      normalized: s,
      valid: false,
      message:
        'Unrecognized VAT prefix. Supported: the 27 EU states plus AD, AU, BR, CH, GB, NO, RS, RU.',
    };
  }
  const name = res.country.name;
  return {
    kind: 'eu-vat',
    normalized: res.value || s,
    valid: res.isValid,
    message: res.isValid
      ? `${name} VAT number: structure and checksum are valid.`
      : `${name}: the structure or checksum does not validate.`,
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
