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

    it('validates NL BTW with mod-97 suffix', () => {
      const r = validateEuVat('NL859761971B02');
      expect(r.valid).toBe(true);
    });
  });

  describe('validateUsEin', () => {
    it('formats and validates prefix range', () => {
      const r = validateUsEin('10-3456789');
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe('10-3456789');
    });

    it('rejects invalid prefix', () => {
      const r = validateUsEin('11-3456789');
      expect(r.valid).toBe(false);
    });
  });

  describe('validateUkNi', () => {
    it('accepts standard pattern', () => {
      expect(validateUkNi('JK 12 34 56 A').valid).toBe(true);
    });

    it('rejects forbidden first letter', () => {
      expect(validateUkNi('DD123456A').valid).toBe(false);
    });
  });
});
