import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import { imeiLuhnValid } from './imei-luhn';
import { tacHintForImei } from './imei-tac-hints';

function normalizeImei(raw: string): string {
  return raw.replace(/\D/g, '');
}

@Component({
  selector: 'sa-imei-decoder-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-2xl space-y-4">
      <p class="text-sm text-slate-600">
        Type Allocation Code (TAC) is the first eight digits. Check digit uses Luhn over all 15 digits.
        Manufacturer hints below are illustrative only; use GSMA TAC for authoritative allocation data.
      </p>

      <sa-text-field
        label="IMEI (15 digits)"
        placeholder="123456789012345"
        [(ngModel)]="raw"
        (ngModelChange)="bump()"
        inputClass="font-mono text-sm"
        [spellcheck]="false"
        autocomplete="off"
      />

      @if (info(); as i) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="i.ok"
          [class.bg-emerald-50]="i.ok"
          [class.border-rose-200]="!i.ok"
          [class.bg-rose-50]="!i.ok"
        >
          <p class="font-medium" [class.text-emerald-900]="i.ok" [class.text-rose-900]="!i.ok">
            {{ i.ok ? 'Structure valid' : 'Invalid IMEI' }}
          </p>
          @if (i.digits.length === 15) {
            <ul class="mt-2 list-inside list-disc space-y-1 text-xs text-slate-800">
              <li>TAC: <span class="font-mono select-all">{{ i.tac }}</span></li>
              <li>Serial: <span class="font-mono select-all">{{ i.serial }}</span></li>
              <li>Check digit: <span class="font-mono">{{ i.check }}</span></li>
              <li>Luhn: {{ i.luhnOk ? 'pass' : 'fail' }}</li>
              @if (i.hint) {
                <li>Hint: {{ i.hint }}</li>
              }
            </ul>
          } @else {
            <p class="mt-1 text-xs text-rose-800">Expected 15 digits (found {{ i.digits.length }}).</p>
          }
        </div>
      }
    </div>
  `,
})
export class ImeiDecoderToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly info = computed(() => {
    this.version();
    const digits = normalizeImei(this.raw);
    if (!digits) {
      return null;
    }
    const luhnOk = digits.length === 15 && imeiLuhnValid(digits);
    const tac = digits.slice(0, 8);
    const serial = digits.slice(8, 14);
    const check = digits.slice(14);
    const hint = digits.length === 15 ? tacHintForImei(digits) : null;
    return { ok: luhnOk, digits, tac, serial, check, luhnOk, hint };
  });
}
