import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ToolDefinition } from '../models/tool.model';
import { luhnValid } from '../data/luhn';

const PCI_NOTICE =
  'For compliance, avoid pasting real primary account numbers (PANs) unless your policy explicitly allows it. This tool only runs the Luhn check and length heuristics in your browser—it does not verify that a card is active or issued.';

function guessBrand(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (!d.length) {
    return '—';
  }
  const c0 = d[0]!;
  const c01 = d.slice(0, 2);
  const c012 = d.slice(0, 3);
  const c0123 = d.slice(0, 4);
  if (c0 === '4') {
    return 'Visa';
  }
  if (c01 >= '51' && c01 <= '55') {
    return 'Mastercard';
  }
  if (c012 === '220' && d.length >= 6) {
    const n = parseInt(d.slice(0, 6), 10);
    if (n >= 222100 && n <= 272099) {
      return 'Mastercard';
    }
  }
  if (c0123 === '6011' || c012 === '644' || c012 === '645' || c012 === '646' || c012 === '647' || c012 === '648' || c012 === '649' || (c01 >= '65' && c01 <= '65')) {
    return 'Discover';
  }
  if (c01 === '34' || c01 === '37') {
    return 'American Express';
  }
  if (c012 === '300' || c012 === '301' || c012 === '302' || c012 === '303' || c012 === '304' || c012 === '305' || c012 === '36' || c012 === '38') {
    return 'Diners Club';
  }
  if (c0123 === '3528' || c0123 === '3529' || (parseInt(c0123, 10) >= 3530 && parseInt(c0123, 10) <= 3589)) {
    return 'JCB';
  }
  return 'Unknown / other';
}

@Component({
  selector: 'sa-payment-card-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-amber-900">{{ pciNotice }}</p>

      <label class="block text-xs font-medium text-slate-700">
        Card number (digits only; spaces ignored)
        <input
          type="text"
          inputmode="numeric"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="raw"
          (ngModelChange)="bump()"
          placeholder="4111 1111 1111 1111"
          spellcheck="false"
          autocomplete="off"
        />
      </label>

      @if (info(); as i) {
        <div
          class="rounded-lg border px-3 py-3 text-sm"
          [class.border-emerald-200]="i.luhnOk && i.lengthOk"
          [class.bg-emerald-50]="i.luhnOk && i.lengthOk"
          [class.border-rose-200]="!(i.luhnOk && i.lengthOk)"
          [class.bg-rose-50]="!(i.luhnOk && i.lengthOk)"
        >
          <p class="font-medium text-slate-900">Luhn: {{ i.luhnOk ? 'pass' : 'fail' }}</p>
          <p class="mt-1 text-slate-800">Length ({{ i.len }} digits): {{ i.lengthOk ? 'typical range' : 'unusual' }}</p>
          <p class="mt-1 text-slate-800">Heuristic brand: {{ i.brand }}</p>
        </div>
      }
    </div>
  `,
})
export class PaymentCardToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly pciNotice = PCI_NOTICE;
  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly info = computed(() => {
    this.version();
    const digits = this.raw.replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    const len = digits.length;
    const lengthOk = len >= 12 && len <= 19;
    const luhnOk = luhnValid(digits);
    return {
      len,
      lengthOk,
      luhnOk,
      brand: guessBrand(digits),
    };
  });
}
