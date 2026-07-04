import { validateEuVat, validateUkNi, validateUsEin } from './tax-id-validators';

describe('tax-id-validators', () => {
  describe('validateEuVat', () => {
    it('accepts valid DE VAT (BZSt check digit)', () => {
      const r = validateEuVat('DE115235681');
      expect(r.valid).toBe(true);
    });

    it('rejects bad DE check digit', () => {
      const r = validateEuVat('DE115235682');
      expect(r.valid).toBe(false);
    });

    it('accepts NL BTW that passes the eleven-test check digit', () => {
      // base 123456782: 1·9+2·8+3·7+4·6+5·5+6·4+7·3+8·2 = 156, 156 % 11 = 2 = 9th digit.
      const r = validateEuVat('NL123456782B01');
      expect(r.valid).toBe(true);
    });

    it('rejects NL BTW whose check digit fails the eleven-test', () => {
      const r = validateEuVat('NL123456789B01');
      expect(r.valid).toBe(false);
    });
  });

  describe('validateUsEin', () => {
    it('formats and validates an assigned prefix', () => {
      const r = validateUsEin('10-3456789');
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe('10-3456789');
    });

    it('accepts prefixes 11, 12, 98 and 99 (previously rejected in error)', () => {
      for (const p of ['11', '12', '98', '99']) {
        expect(validateUsEin(`${p}-3456789`).valid).toBe(true);
      }
    });

    it('rejects an unassigned prefix', () => {
      expect(validateUsEin('07-3456789').valid).toBe(false);
    });
  });

  describe('validateUkNi', () => {
    it('accepts standard pattern', () => {
      expect(validateUkNi('JK 12 34 56 A').valid).toBe(true);
    });

    it('accepts a valid second letter A (not an HMRC restriction)', () => {
      expect(validateUkNi('MA123456A').valid).toBe(true);
    });

    it('rejects forbidden first letter', () => {
      expect(validateUkNi('DD123456A').valid).toBe(false);
    });

    it('rejects disallowed prefix pair GB', () => {
      expect(validateUkNi('GB123456A').valid).toBe(false);
    });
  });
});
