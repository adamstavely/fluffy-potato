import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import { decodeModelYearCode } from './vin-model-year';
import { nhtsaVinCheckDigitValid } from './vin-nhtsa-check';
import { regionHint, wmiHint } from './vin-wmi-hints';

function normalizeVin(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '');
}

@Component({
  selector: 'sa-vin-decoder-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-2xl space-y-4">
      <p class="text-sm text-slate-600">
        VINs are 17 characters (no I, O, Q). Check-digit validation applies to North American–style
        VINs; WMI hints are illustrative only.
      </p>

      <sa-text-field
        label="VIN"
        placeholder="1HGBH41JXMN109186"
        [(ngModel)]="raw"
        (ngModelChange)="bump()"
        inputClass="font-mono text-sm uppercase"
        [spellcheck]="false"
        autocomplete="off"
      />

      @if (info(); as i) {
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900">
          @if (i.valid) {
            <ul class="list-inside list-disc space-y-1 text-xs">
              <li>WMI: <span class="font-mono">{{ i.wmi }}</span> — {{ i.wmiNote }}</li>
              <li>VDS: <span class="font-mono">{{ i.vds }}</span></li>
              <li>VIS: <span class="font-mono">{{ i.vis }}</span></li>
              <li>Check digit (pos 9): <span class="font-mono">{{ i.checkChar }}</span> — {{ i.checkNote }}</li>
              <li>Model year (pos 10): <span class="font-mono">{{ i.yearChar }}</span> — {{ i.yearNote }}</li>
              <li>Plant code (pos 11): <span class="font-mono">{{ i.plant }}</span></li>
              <li>Serial (pos 12–17): <span class="font-mono">{{ i.serial }}</span></li>
              <li>Region (rough): {{ i.region }}</li>
            </ul>
          } @else {
            <p class="text-rose-800">{{ i.reason }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class VinDecoderToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly info = computed(() => {
    this.version();
    const v = normalizeVin(this.raw);
    if (!v) {
      return null;
    }
    if (v.length !== 17) {
      return { valid: false as const, reason: `Expected 17 characters (got ${v.length}).` };
    }
    if (/[IOQ]/i.test(v)) {
      return { valid: false as const, reason: 'VIN cannot contain I, O, or Q.' };
    }
    const wmi = v.slice(0, 3);
    const vds = v.slice(3, 8);
    const checkChar = v[8]!;
    const yearChar = v[9]!;
    const plant = v[10]!;
    const vis = v.slice(8);
    const serial = v.slice(11);
    const wmiNote = wmiHint(wmi) ?? 'No curated WMI match';
    const nhtsa = nhtsaVinCheckDigitValid(v);
    const checkNote = nhtsa ? 'ISO check digit valid' : 'ISO check digit mismatch';
    return {
      valid: true as const,
      wmi,
      vds,
      vis,
      checkChar,
      checkNote,
      yearChar,
      yearNote: decodeModelYearCode(yearChar),
      plant,
      serial,
      region: regionHint(wmi[0]!),
      wmiNote,
    };
  });
}
