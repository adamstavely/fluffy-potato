import { keccak_256 } from '@noble/hashes/sha3';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

const BASE58 =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Bitcoin mainnet / testnet version bytes we accept for 25-byte Base58Check payloads. */
const BTC_VERSION_OK = new Set<number>([0x00, 0x05, 0x6f, 0xc4]);

export type BtcValidation =
  | { kind: 'btc'; valid: true; detail: 'base58check_ok'; versionByte: number }
  | { kind: 'btc'; valid: false; detail: 'empty' | 'invalid_charset' | 'decode' | 'length' | 'checksum' | 'version' }
  | { kind: 'btc'; valid: false; detail: 'bech32_skipped'; note: string };

export type EthValidation =
  | { kind: 'eth'; valid: true; checksum: 'eip55_ok' | 'case_insensitive' }
  | { kind: 'eth'; valid: false; detail: 'empty' | 'length' | 'charset' | 'eip55_mismatch' };

export type CryptoAddressResult =
  | { kind: 'unknown'; detail: 'empty' | 'ambiguous' }
  | BtcValidation
  | EthValidation;

function sha256d(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/** Decode Base58 into bytes (Bitcoin style with leading zero run as `1` chars). */
export function base58Decode(s: string): Uint8Array | null {
  const str = s.trim();
  if (!str.length) {
    return null;
  }
  let zeros = 0;
  while (zeros < str.length && str[zeros] === '1') {
    zeros++;
  }
  const rest = str.slice(zeros);
  if (!rest.length) {
    return new Uint8Array(zeros);
  }
  let num = 0n;
  for (const c of rest) {
    const idx = BASE58.indexOf(c);
    if (idx < 0) {
      return null;
    }
    num = num * 58n + BigInt(idx);
  }
  const outBytes: number[] = [];
  let n = num;
  while (n > 0n) {
    outBytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  const result = new Uint8Array(zeros + outBytes.length);
  if (outBytes.length) {
    result.set(outBytes, zeros);
  }
  return result;
}

export function validateBtcBase58Check(address: string): BtcValidation {
  const trimmed = address.trim();
  if (!trimmed.length) {
    return { kind: 'btc', valid: false, detail: 'empty' };
  }
  if (/^bc1/i.test(trimmed)) {
    return {
      kind: 'btc',
      valid: false,
      detail: 'bech32_skipped',
      note: 'Native SegWit (Bech32) uses a different checksum; this tool only runs Base58Check.',
    };
  }
  for (const c of trimmed) {
    if (BASE58.indexOf(c) < 0) {
      return { kind: 'btc', valid: false, detail: 'invalid_charset' };
    }
  }
  const decoded = base58Decode(trimmed);
  if (!decoded || decoded.length < 5) {
    return { kind: 'btc', valid: false, detail: 'decode' };
  }
  if (decoded.length !== 25) {
    return { kind: 'btc', valid: false, detail: 'length' };
  }
  const body = decoded.slice(0, 21);
  const chk = decoded.slice(21);
  const expect = sha256d(body).slice(0, 4);
  if (chk[0] !== expect[0] || chk[1] !== expect[1] || chk[2] !== expect[2] || chk[3] !== expect[3]) {
    return { kind: 'btc', valid: false, detail: 'checksum' };
  }
  const version = body[0]!;
  if (!BTC_VERSION_OK.has(version)) {
    return { kind: 'btc', valid: false, detail: 'version' };
  }
  return { kind: 'btc', valid: true, detail: 'base58check_ok', versionByte: version };
}

function eip55MixedCaseAddress(lower40: string): string {
  const hash = keccak_256(new TextEncoder().encode(lower40));
  const hashHex = bytesToHex(hash);
  let out = '0x';
  for (let i = 0; i < 40; i++) {
    const c = lower40[i]!;
    const h = parseInt(hashHex[i]!, 16);
    if (c >= '0' && c <= '9') {
      out += c;
    } else {
      out += h >= 8 ? c.toUpperCase() : c;
    }
  }
  return out;
}

export function validateEthEip55(address: string): EthValidation {
  const trimmed = address.trim();
  if (!trimmed.length) {
    return { kind: 'eth', valid: false, detail: 'empty' };
  }
  const hex = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? trimmed.slice(2) : trimmed;
  if (hex.length !== 40) {
    return { kind: 'eth', valid: false, detail: 'length' };
  }
  if (!/^[0-9a-fA-F]{40}$/.test(hex)) {
    return { kind: 'eth', valid: false, detail: 'charset' };
  }
  const hasLower = /[a-f]/.test(hex);
  const hasUpper = /[A-F]/.test(hex);
  const mixed = hasLower && hasUpper;
  if (!mixed) {
    return { kind: 'eth', valid: true, checksum: 'case_insensitive' };
  }
  const expected = eip55MixedCaseAddress(hex.toLowerCase());
  const norm = `0x${hex}`;
  if (norm === expected) {
    return { kind: 'eth', valid: true, checksum: 'eip55_ok' };
  }
  return { kind: 'eth', valid: false, detail: 'eip55_mismatch' };
}

function looksEth(s: string): boolean {
  const t = s.trim();
  if (!t.length) {
    return false;
  }
  if (t.startsWith('0x') || t.startsWith('0X')) {
    return /^0x[0-9a-fA-F]{40}$/i.test(t);
  }
  return /^[0-9a-fA-F]{40}$/.test(t);
}

function looksBtcBase58(s: string): boolean {
  const t = s.trim();
  if (!t.length || /^bc1/i.test(t)) {
    return false;
  }
  if (/^0x/i.test(t)) {
    return false;
  }
  if (/^[0-9a-fA-F]{40}$/.test(t)) {
    return false;
  }
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/** Classify input and validate as Bitcoin Base58Check or Ethereum (EIP-55). */
export function validateCryptoAddressInput(raw: string): CryptoAddressResult {
  const t = raw.trim();
  if (!t.length) {
    return { kind: 'unknown', detail: 'empty' };
  }
  if (/^bc1/i.test(t)) {
    return validateBtcBase58Check(t);
  }
  if (looksEth(t)) {
    return validateEthEip55(t);
  }
  if (looksBtcBase58(t)) {
    return validateBtcBase58Check(t);
  }
  return { kind: 'unknown', detail: 'ambiguous' };
}
