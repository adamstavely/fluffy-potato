import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { parse, type ParseResult } from 'mrz';

import type { ToolDefinition } from '../models/tool.model';

function normalizeMrzInput(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim().toUpperCase().replace(/\s+/g, '<').replace(/[^A-Z0-9<]/g, ''))
    .filter((line) => line.length > 0);
  return lines.join('\n');
}

/** MRZ stores YYMMDD; expand to a calendar date using a sliding century (common tool heuristic). */
function expandMrzDate(yyMMDD: string | null | undefined): string {
  if (!yyMMDD || yyMMDD.length !== 6 || !/^\d{6}$/.test(yyMMDD)) {
    return '—';
  }
  const yy = parseInt(yyMMDD.slice(0, 2), 10);
  const mm = yyMMDD.slice(2, 4);
  const dd = yyMMDD.slice(4, 6);
  const pivot = new Date().getFullYear() % 100;
  const year = yy > pivot ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

function parseIsoLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return null;
  }
  const y = +m[1]!;
  const mo = +m[2]! - 1;
  const d = +m[3]!;
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function ageYears(birth: Date, ref: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

@Component({
  selector: 'sa-mrz-decoder-tool',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">
        Paste the machine-readable zone from a passport or ID card (ICAO TD1, TD2, TD3). Spaces are
        treated as filler (<span class="font-mono">&lt;</span>), input is uppercased, and non-MRZ
        characters are stripped.
      </p>

      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" [(ngModel)]="autocorrect" (ngModelChange)="bump()" />
        Autocorrect single-character OCR errors (when supported)
      </label>

      <label class="block text-xs font-medium text-slate-700">
        MRZ text
        <textarea
          class="mt-1 min-h-[140px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="mrzRaw"
          (ngModelChange)="bump()"
          placeholder="Example (TD3 passport, 2×44 characters):&#10;P&lt;UTOERIKSSON&lt;&lt;ANNA&lt;MARIA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&#10;L898902C36UTO7408122F1204159ZE184226B&lt;&lt;&lt;&lt;&lt;10"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      </label>

      @if (error()) {
        <div
          class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="alert"
        >
          {{ error() }}
        </div>
      }

      @if (result(); as r) {
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span
            class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
            [class.border-emerald-200]="r.valid"
            [class.bg-emerald-50]="r.valid"
            [class.text-emerald-800]="r.valid"
            [class.border-rose-200]="!r.valid"
            [class.bg-rose-50]="!r.valid"
            [class.text-rose-800]="!r.valid"
          >
            {{ r.valid ? 'Checks passed' : 'Validation issues' }}
          </span>
          <span class="text-slate-600"
            >Format <span class="font-mono font-semibold text-slate-900">{{ r.format }}</span></span
          >
          @if (r.documentNumber) {
            <span class="text-slate-600"
              >Document #
              <span class="font-mono font-semibold text-slate-900">{{ r.documentNumber }}</span></span
            >
          }
          <button
            type="button"
            class="ml-auto text-xs text-slate-600 underline decoration-slate-300 hover:decoration-slate-600"
            (click)="copyJson(r)"
          >
            Copy JSON
          </button>
        </div>

        <div class="overflow-hidden rounded-lg border border-slate-200">
          <table class="w-full border-collapse text-left text-sm">
            <caption class="sr-only">
              Parsed MRZ fields: name, document data, and validation status per field
            </caption>
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th class="border-b border-slate-200 px-3 py-2">Field</th>
                <th class="border-b border-slate-200 px-3 py-2">Value</th>
                <th class="border-b border-slate-200 px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (row of detailRows(); track row.label) {
                <tr [ngClass]="{ 'bg-rose-50/50': !row.valid }">
                  <td class="px-3 py-2 align-top text-slate-700">{{ row.label }}</td>
                  <td class="px-3 py-2 align-top font-mono text-xs text-slate-900">
                    {{ row.displayValue }}
                  </td>
                  <td class="px-3 py-2 align-top text-xs">
                    @if (row.valid) {
                      <span class="text-emerald-700">OK</span>
                    } @else {
                      <span class="text-rose-700">{{ row.error ?? 'Invalid' }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (lifeSummary(); as ls) {
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">From parsed dates</p>
            <ul class="mt-2 list-inside list-disc space-y-1">
              @if (ls.ageText) {
                <li>{{ ls.ageText }}</li>
              }
              @if (ls.expiryText) {
                <li>{{ ls.expiryText }}</li>
              }
            </ul>
          </div>
        }

        <p class="text-xs text-slate-500">
          Dates shown as <span class="font-mono">YYYY-MM-DD</span> use a common century heuristic on
          YYMMDD only; always verify against the printed document.
        </p>
      }
    </div>
  `,
})
export class MrzDecoderToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected mrzRaw = '';
  protected autocorrect = false;

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  private readonly parsed = computed(() => {
    this.version();
    const normalized = normalizeMrzInput(this.mrzRaw);
    if (!normalized) {
      return { kind: 'empty' as const };
    }
    try {
      const r = parse(normalized, { autocorrect: this.autocorrect });
      return { kind: 'ok' as const, result: r, normalized };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { kind: 'error' as const, message: msg };
    }
  });

  protected readonly error = computed(() => {
    const p = this.parsed();
    return p.kind === 'error' ? p.message : null;
  });

  protected readonly result = computed((): ParseResult | null => {
    const p = this.parsed();
    return p.kind === 'ok' ? p.result : null;
  });

  protected readonly lifeSummary = computed((): {
    ageText: string | null;
    expiryText: string | null;
  } | null => {
    const r = this.result();
    if (!r) {
      return null;
    }
    const birthRaw = r.fields.birthDate;
    const expRaw = r.fields.expirationDate;
    const birthIso = birthRaw && birthRaw.length === 6 ? expandMrzDate(birthRaw) : null;
    const expIso = expRaw && expRaw.length === 6 ? expandMrzDate(expRaw) : null;
    const today = todayLocal();
    let ageText: string | null = null;
    let expiryText: string | null = null;
    if (birthIso && birthIso !== '—') {
      const bd = parseIsoLocal(birthIso);
      if (bd) {
        const age = ageYears(bd, today);
        ageText = `Approximate age (from birth date ${birthIso}): ${age} years`;
      }
    }
    if (expIso && expIso !== '—') {
      const ed = parseIsoLocal(expIso);
      if (ed) {
        const d = diffDays(today, ed);
        if (d > 0) {
          expiryText = `Document expiry ${expIso}: in ${d} day${d === 1 ? '' : 's'}`;
        } else if (d === 0) {
          expiryText = `Document expiry ${expIso}: today`;
        } else {
          expiryText = `Document expiry ${expIso}: expired ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} ago`;
        }
      }
    }
    if (!ageText && !expiryText) {
      return null;
    }
    return { ageText, expiryText };
  });

  protected readonly detailRows = computed(() => {
    const r = this.result();
    if (!r) {
      return [];
    }
    return r.details.map((d) => {
      let display = d.value ?? '—';
      if (
        d.field === 'birthDate' ||
        d.field === 'expirationDate' ||
        d.field === 'issueDate'
      ) {
        const raw = d.value;
        if (raw && raw.length === 6) {
          const expanded = expandMrzDate(raw);
          display = `${raw} (${expanded})`;
        }
      }
      return {
        label: d.label,
        displayValue: display,
        valid: d.valid,
        error: d.error,
      };
    });
  });

  protected async copyJson(r: ParseResult): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      return;
    }
    const payload = {
      format: r.format,
      valid: r.valid,
      documentNumber: r.documentNumber,
      fields: r.fields,
      details: r.details.map(({ label, field, value, valid, error: err }) => ({
        label,
        field,
        value,
        valid,
        error: err,
      })),
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  }
}
