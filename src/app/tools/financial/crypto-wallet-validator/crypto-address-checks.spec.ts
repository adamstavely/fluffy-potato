import {
  base58Decode,
  validateBtcBase58Check,
  validateCryptoAddressInput,
  validateEthEip55,
} from './crypto-address-checks';

describe('crypto-address-checks', () => {
  describe('base58Decode', () => {
    it('decodes leading zero bytes as 1s', () => {
      const d = base58Decode('11');
      expect(d).toEqual(new Uint8Array([0, 0]));
    });
  });

  describe('validateBtcBase58Check', () => {
    it('accepts genesis coinbase address', () => {
      const r = validateBtcBase58Check('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(r).toEqual(
        jasmine.objectContaining({
          kind: 'btc',
          valid: true,
          detail: 'base58check_ok',
          versionByte: 0x00,
        }),
      );
    });

    it('rejects bad checksum', () => {
      const r = validateBtcBase58Check('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb');
      expect(r).toEqual(
        jasmine.objectContaining({ kind: 'btc', valid: false, detail: 'checksum' }),
      );
    });

    it('notes Bech32 is out of scope', () => {
      const r = validateBtcBase58Check('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      expect(r).toEqual(jasmine.objectContaining({ kind: 'btc', detail: 'bech32_skipped' }));
    });
  });

  describe('validateEthEip55', () => {
    it('accepts all-lowercase hex', () => {
      const r = validateEthEip55('0x0000000000000000000000000000000000000000');
      expect(r).toEqual(
        jasmine.objectContaining({ kind: 'eth', valid: true, checksum: 'case_insensitive' }),
      );
    });

    it('accepts EIP-55 mixed-case example', () => {
      const r = validateEthEip55('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      expect(r).toEqual(
        jasmine.objectContaining({ kind: 'eth', valid: true, checksum: 'eip55_ok' }),
      );
    });

    it('rejects wrong mixed case', () => {
      const r = validateEthEip55('0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      expect(r).toEqual(
        jasmine.objectContaining({ kind: 'eth', valid: false, detail: 'eip55_mismatch' }),
      );
    });
  });

  describe('validateCryptoAddressInput', () => {
    it('routes 40-char hex without 0x to Ethereum', () => {
      const r = validateCryptoAddressInput('0000000000000000000000000000000000000000');
      expect(r).toEqual(
        jasmine.objectContaining({ kind: 'eth', valid: true, checksum: 'case_insensitive' }),
      );
    });

    it('routes genesis address to Bitcoin', () => {
      const r = validateCryptoAddressInput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(r).toEqual(
        jasmine.objectContaining({ kind: 'btc', valid: true, detail: 'base58check_ok' }),
      );
    });
  });
});
