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

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

@Component({
  selector: 'sa-iban-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <sa-text-field
        label="IBAN"
        placeholder="e.g. NL91 ABNA 0417 1643 00"
        [(ngModel)]="ibanInput"
        (ngModelChange)="bump()"
        inputClass="font-mono text-sm"
        [spellcheck]="false"
        autocomplete="off"
      />

      <sa-text-field
        label="BIC / SWIFT (optional)"
        placeholder="e.g. ABNANL2A"
        [(ngModel)]="bicInput"
        (ngModelChange)="bump()"
        inputClass="font-mono text-sm uppercase"
        [spellcheck]="false"
        autocomplete="off"
      />

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
