import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

import type { ToolDefinition } from '../../models/tool.model';

const PII_PASTE_WARNING =
  'Do not paste secrets, credentials, or sensitive personal data unless policy allows. All processing happens in this browser session.';

const REGIONS: { code: CountryCode; label: string }[] = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
];

@Component({
  selector: 'sa-phone-number-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">{{ piiNotice }}</p>

      <label class="block text-xs font-medium text-slate-700">
        Default region (when number has no country code)
        <select
          class="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="defaultRegion"
          (ngModelChange)="bump()"
        >
          @for (r of regions; track r.code) {
            <option [ngValue]="r.code">{{ r.label }} ({{ r.code }})</option>
          }
        </select>
      </label>

      <label class="block text-xs font-medium text-slate-700">
        Phone number
        <input
          type="text"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="raw"
          (ngModelChange)="bump()"
          placeholder="+1 415 555 0100"
          spellcheck="false"
          autocomplete="off"
        />
      </label>

      @if (formattedPreview()) {
        <p class="text-xs text-slate-600">
          As-you-type: <span class="font-mono text-slate-800">{{ formattedPreview() }}</span>
        </p>
      }

      @if (info(); as i) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="i.valid"
          [class.bg-emerald-50]="i.valid"
          [class.border-rose-200]="!i.valid"
          [class.bg-rose-50]="!i.valid"
        >
          <p class="font-medium" [class.text-emerald-900]="i.valid" [class.text-rose-900]="!i.valid">
            {{ i.valid ? 'Valid number' : 'Could not parse as valid' }}
          </p>
          @if (i.valid) {
            <ul class="mt-2 list-inside list-disc space-y-1 text-xs text-slate-800">
              <li>E.164: <span class="font-mono select-all">{{ i.e164 }}</span></li>
              <li>Country: {{ i.country }} ({{ i.countryCallingCode }})</li>
              <li>Type: {{ i.type }}</li>
              @if (i.national) {
                <li>National: <span class="font-mono">{{ i.national }}</span></li>
              }
            </ul>
          } @else if (i.reason) {
            <p class="mt-1 text-xs text-rose-800">{{ i.reason }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class PhoneNumberToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly piiNotice = PII_PASTE_WARNING;
  protected readonly regions = REGIONS;
  protected defaultRegion: CountryCode = 'US';
  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly formattedPreview = computed(() => {
    this.version();
    if (!this.raw.trim()) {
      return '';
    }
    const a = new AsYouType(this.defaultRegion);
    return a.input(this.raw);
  });

  protected readonly info = computed(() => {
    this.version();
    const t = this.raw.trim();
    if (!t) {
      return null;
    }
    try {
      const p = parsePhoneNumberFromString(t, this.defaultRegion);
      if (!p || !p.isValid()) {
        return {
          valid: false as const,
          reason: 'Number is not valid for the selected default region.',
        };
      }
      return {
        valid: true as const,
        e164: p.format('E.164'),
        country: p.country ?? '—',
        countryCallingCode: `+${p.countryCallingCode}`,
        type: p.getType() ?? 'unknown',
        national: p.formatNational(),
      };
    } catch {
      return { valid: false as const, reason: 'Could not parse this input.' };
    }
  });
}
