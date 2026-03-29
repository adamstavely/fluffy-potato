import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  electronicFormatIBAN,
  extractBIC,
  extractIBAN,
  friendlyFormatIBAN,
  validateBIC,
  validateIBAN,
} from 'ibantools';

import type { ToolDefinition } from '../../models/tool.model';

const PII_PASTE_WARNING =
  'Do not paste secrets, credentials, or sensitive personal data unless policy allows. All processing happens in this browser session.';

@Component({
  selector: 'sa-iban-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">{{ piiNotice }}</p>

      <label class="block text-xs font-medium text-slate-700">
        IBAN
        <input
          type="text"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="ibanInput"
          (ngModelChange)="bump()"
          placeholder="e.g. NL91 ABNA 0417 1643 00"
          spellcheck="false"
          autocomplete="off"
        />
      </label>

      <label class="block text-xs font-medium text-slate-700">
        BIC / SWIFT (optional)
        <input
          type="text"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm uppercase text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="bicInput"
          (ngModelChange)="bump()"
          placeholder="e.g. ABNANL2A"
          spellcheck="false"
          autocomplete="off"
        />
      </label>

      @if (ibanBlock(); as b) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="b.valid"
          [class.bg-emerald-50]="b.valid"
          [class.border-rose-200]="!b.valid"
          [class.bg-rose-50]="!b.valid"
        >
          <p class="font-medium" [class.text-emerald-900]="b.valid" [class.text-rose-900]="!b.valid">
            {{ b.valid ? 'IBAN valid' : 'IBAN not valid' }}
          </p>
          @if (b.electronic) {
            <p class="mt-1 font-mono text-xs text-slate-800">
              Electronic: <span class="select-all">{{ b.electronic }}</span>
            </p>
          }
          @if (b.friendly) {
            <p class="mt-1 font-mono text-xs text-slate-800">
              Grouped: <span class="select-all">{{ b.friendly }}</span>
            </p>
          }
          @if (b.countryCode) {
            <p class="mt-1 text-slate-700">Country: {{ b.countryCode }}</p>
          }
          @if (b.bban) {
            <p class="mt-1 font-mono text-xs text-slate-700">BBAN: {{ b.bban }}</p>
          }
        </div>
      }

      @if (bicBlock(); as bc) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="bc.valid"
          [class.bg-emerald-50]="bc.valid"
          [class.border-amber-200]="!bc.valid"
          [class.bg-amber-50]="!bc.valid"
        >
          <p
            class="font-medium"
            [class.text-emerald-900]="bc.valid"
            [class.text-amber-900]="!bc.valid"
          >
            {{ bc.valid ? 'BIC format valid' : 'BIC format not valid' }}
          </p>
          @if (bc.bank) {
            <p class="mt-1 text-xs text-slate-700">
              Bank: {{ bc.bank }}, Country: {{ bc.countryCode }}, Location: {{ bc.location }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class IbanToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly piiNotice = PII_PASTE_WARNING;
  protected ibanInput = '';
  protected bicInput = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly ibanBlock = computed(() => {
    this.version();
    const raw = this.ibanInput.trim();
    if (!raw) {
      return null;
    }
    const v = validateIBAN(raw, { allowQRIBAN: true });
    const electronic = electronicFormatIBAN(raw);
    const friendly = friendlyFormatIBAN(raw, ' ');
    const ex = extractIBAN(raw);
    return {
      valid: v.valid,
      electronic: electronic ?? undefined,
      friendly: friendly ?? undefined,
      countryCode: ex.countryCode,
      bban: ex.bban,
    };
  });

  protected readonly bicBlock = computed(() => {
    this.version();
    const raw = this.bicInput.trim().toUpperCase();
    if (!raw) {
      return null;
    }
    const v = validateBIC(raw);
    const ex = extractBIC(raw);
    return {
      valid: v.valid,
      bank: ex.bankCode,
      countryCode: ex.countryCode,
      location: ex.locationCode,
    };
  });
}
