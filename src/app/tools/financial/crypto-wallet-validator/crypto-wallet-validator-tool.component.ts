import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import {
  validateCryptoAddressInput,
  type CryptoAddressResult,
} from './crypto-address-checks';

const NOTICE =
  'Validation is algorithmic only (Bitcoin Base58Check; Ethereum EIP-55). It does not prove an address exists on-chain or belongs to anyone.';

function btcVersionLabel(byte: number): string {
  switch (byte) {
    case 0x00:
      return 'P2PKH (mainnet)';
    case 0x05:
      return 'P2SH (mainnet)';
    case 0x6f:
      return 'P2PKH (testnet)';
    case 0xc4:
      return 'P2SH (testnet)';
    default:
      return `0x${byte.toString(16).padStart(2, '0')}`;
  }
}

@Component({
  selector: 'sa-crypto-wallet-validator-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">{{ notice }}</p>

      <sa-text-field
        label="Wallet address (Bitcoin Base58 or Ethereum hex)"
        placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa or 0x…"
        [(ngModel)]="raw"
        (ngModelChange)="bump()"
        inputClass="font-mono text-sm"
        [spellcheck]="false"
        autocomplete="off"
      />

      @if (summary(); as s) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="s.ok"
          [class.bg-emerald-50]="s.ok"
          [class.border-rose-200]="!s.ok"
          [class.bg-rose-50]="!s.ok"
        >
          <p class="font-medium text-slate-900">{{ s.title }}</p>
          @if (s.lines.length) {
            <ul class="mt-2 list-inside list-disc space-y-1 text-slate-800">
              @for (line of s.lines; track line) {
                <li>{{ line }}</li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class CryptoWalletValidatorToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly notice = NOTICE;
  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly summary = computed(() => {
    this.version();
    const r = validateCryptoAddressInput(this.raw);
    return formatResult(r);
  });
}

function formatResult(r: CryptoAddressResult): { ok: boolean; title: string; lines: string[] } | null {
  if (r.kind === 'unknown') {
    if (r.detail === 'empty') {
      return null;
    }
    return {
      ok: false,
      title: 'Could not classify this string',
      lines: [
        'Use a Bitcoin Base58 address (starts with 1, 3, etc.), or Ethereum 40 hex characters (with or without 0x).',
        'Bech32 (bc1…) is not checked here.',
      ],
    };
  }
  if (r.kind === 'eth') {
    if (r.valid) {
      return {
        ok: true,
        title: 'Ethereum address: valid',
        lines:
          r.checksum === 'eip55_ok'
            ? ['EIP-55 checksum matches (mixed-case encoding).']
            : ['Length and hex OK; case is uniform or all-numeric (EIP-55 checksum not applied).'],
      };
    }
    const lines: string[] = [];
    if (r.detail === 'length') {
      lines.push('Expected exactly 40 hex digits after optional 0x.');
    } else if (r.detail === 'charset') {
      lines.push('Only hex characters are allowed.');
    } else if (r.detail === 'eip55_mismatch') {
      lines.push('Mixed-case hex does not match EIP-55 checksum encoding.');
    }
    return { ok: false, title: 'Ethereum address: invalid', lines };
  }
  if (r.kind === 'btc') {
    if (r.valid) {
      return {
        ok: true,
        title: 'Bitcoin address: Base58Check valid',
        lines: [
          `Version byte 0x${r.versionByte.toString(16).padStart(2, '0')} → ${btcVersionLabel(r.versionByte)}.`,
        ],
      };
    }
    if (r.detail === 'bech32_skipped') {
      return { ok: false, title: 'Bitcoin (Bech32)', lines: [r.note] };
    }
    const lines: string[] = [];
    if (r.detail === 'checksum') {
      lines.push('Checksum failed (double SHA-256).');
    } else if (r.detail === 'length') {
      lines.push('Expected 25 bytes after Base58 decode for P2PKH / P2SH.');
    } else if (r.detail === 'version') {
      lines.push('Version byte is not a known P2PKH/P2SH mainnet or testnet value.');
    } else if (r.detail === 'invalid_charset') {
      lines.push('String contains characters outside Base58.');
    } else if (r.detail === 'decode') {
      lines.push('Could not decode as Base58.');
    }
    return { ok: false, title: 'Bitcoin address: Base58Check invalid', lines };
  }
  return null;
}
