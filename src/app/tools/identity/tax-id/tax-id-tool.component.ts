import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ToolDefinition } from '../../models/tool.model';
import {
  validateEuVat,
  validateUkNi,
  validateUsEin,
  type TaxIdKind,
} from './tax-id-validators';

const PII_PASTE_WARNING =
  'Do not paste secrets, credentials, or sensitive personal data unless policy allows. All processing happens in this browser session.';

@Component({
  selector: 'sa-tax-id-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">{{ piiNotice }}</p>

      <fieldset class="space-y-2">
        <legend class="text-xs font-medium text-slate-700">Identifier type</legend>
        <div class="flex flex-wrap gap-3 text-sm">
          @for (opt of kinds; track opt.id) {
            <label class="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="taxKind"
                [value]="opt.id"
                [(ngModel)]="kind"
                (ngModelChange)="bump()"
              />
              {{ opt.label }}
            </label>
          }
        </div>
      </fieldset>

      <label class="block text-xs font-medium text-slate-700">
        Value
        <textarea
          class="mt-1 min-h-[88px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="valueRaw"
          (ngModelChange)="bump()"
          [placeholder]="placeholder()"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      </label>

      @if (result(); as r) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="r.valid"
          [class.bg-emerald-50]="r.valid"
          [class.border-rose-200]="!r.valid"
          [class.bg-rose-50]="!r.valid"
        >
          <p class="font-medium" [class.text-emerald-900]="r.valid" [class.text-rose-900]="!r.valid">
            {{ r.valid ? 'Looks good' : 'Does not validate' }}
          </p>
          <p class="mt-1 text-slate-800">{{ r.message }}</p>
          @if (r.normalized) {
            <p class="mt-2 font-mono text-xs text-slate-700">
              Normalized: <span class="select-all">{{ r.normalized }}</span>
            </p>
          }
        </div>
      }

      <p class="text-xs text-slate-500">
        EU VAT: full checksum for DE and NL; format-only for FR, GB, ES. Always confirm with official
        registers when it matters.
      </p>
    </div>
  `,
})
export class TaxIdToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly piiNotice = PII_PASTE_WARNING;
  protected readonly kinds: { id: TaxIdKind; label: string }[] = [
    { id: 'eu-vat', label: 'EU VAT' },
    { id: 'us-ein', label: 'US EIN' },
    { id: 'uk-ni', label: 'UK National Insurance' },
  ];
  protected kind: TaxIdKind = 'eu-vat';
  protected valueRaw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected placeholder(): string {
    switch (this.kind) {
      case 'eu-vat':
        return 'e.g. DE115235681 or NL859761971B02';
      case 'us-ein':
        return 'e.g. 12-3456789';
      default:
        return 'e.g. QQ 12 34 56 C';
    }
  }

  protected readonly result = computed(() => {
    this.version();
    const v = this.valueRaw.trim();
    if (!v) {
      return null;
    }
    switch (this.kind) {
      case 'eu-vat':
        return validateEuVat(v);
      case 'us-ein':
        return validateUsEin(v);
      default:
        return validateUkNi(v);
    }
  });
}
