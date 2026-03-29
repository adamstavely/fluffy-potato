import { luhnValid } from './luhn';

describe('luhn', () => {
  it('accepts valid test numbers', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('5555555555554444')).toBe(true);
  });

  it('rejects invalid checksum', () => {
    expect(luhnValid('4111111111111112')).toBe(false);
  });
});
