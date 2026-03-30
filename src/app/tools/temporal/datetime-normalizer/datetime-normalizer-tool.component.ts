import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaSelectComponent, type SaSelectOption } from '../../../ui/sa-select.component';
import type { ToolDefinition } from '../../models/tool.model';

type AmbiguousStyle = 'eu' | 'us';

function parseFlexibleLine(line: string, ambiguous: AmbiguousStyle): Date | null {
  const s = line.trim();
  if (!s) {
    return null;
  }

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) {
      return null;
    }
    if (n > 1e15) {
      return null;
    }
    if (n > 1e12) {
      return new Date(n);
    }
    if (n > 1e10) {
      return new Date(n);
    }
    return new Date(n * 1000);
  }

  const isoTry = Date.parse(s);
  if (!Number.isNaN(isoTry)) {
    return new Date(isoTry);
  }

  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    let a = Number(m[1]);
    let b = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) {
      y += y >= 70 ? 1900 : 2000;
    }
    let day: number;
    let month: number;
    if (ambiguous === 'eu') {
      day = b;
      month = a;
    } else {
      month = a;
      day = b;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    const hh = m[4] !== undefined ? Number(m[4]) : 0;
    const mm = m[5] !== undefined ? Number(m[5]) : 0;
    const ss = m[6] !== undefined ? Number(m[6]) : 0;
    return new Date(y, month - 1, day, hh, mm, ss);
  }

  return null;
}

@Component({
  selector: 'sa-datetime-normalizer-tool',
  standalone: true,
  imports: [FormsModule, SaSelectComponent],
  template: `
    <div class="mx-auto max-w-4xl space-y-4">
      <p class="text-sm text-slate-600">
        One value per line. Numeric strings are treated as Unix seconds (unless magnitude suggests
        milliseconds). Ambiguous <span class="font-mono">dd/mm</span> vs
        <span class="font-mono">mm/dd</span> dates follow the style below.
      </p>

      <sa-select
        label="Ambiguous numeric dates"
        [options]="ambiguousOptions"
        [(ngModel)]="ambiguousStyle"
        (ngModelChange)="bump()"
        fieldClass="max-w-md"
      />

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-700" for="norm-input">Input</label>
        <textarea
          id="norm-input"
          class="min-h-[160px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
          [(ngModel)]="raw"
          (ngModelChange)="bump()"
          [spellcheck]="false"
          autocomplete="off"
        ></textarea>
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead class="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-3 py-2">Line</th>
              <th class="px-3 py-2">Normalized (ISO 8601)</th>
              <th class="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (row of rows(); track $index) {
              <tr>
                <td class="px-3 py-2 font-mono text-xs text-slate-500">{{ row.line }}</td>
                <td class="px-3 py-2 font-mono text-xs break-all">
                  @if (row.iso) {
                    {{ row.iso }}
                  } @else {
                    <span class="text-rose-700">—</span>
                  }
                </td>
                <td class="px-3 py-2 text-xs text-slate-600">{{ row.note }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DatetimeNormalizerToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly ambiguousOptions: SaSelectOption<AmbiguousStyle>[] = [
    { value: 'us', label: 'US — month first (M/D/Y)' },
    { value: 'eu', label: 'EU — day first (D/M/Y)' },
  ];

  protected ambiguousStyle: AmbiguousStyle = 'us';
  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly rows = computed(() => {
    this.version();
    const lines = this.raw.split(/\r?\n/);
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return { line: i + 1, iso: '', note: 'empty' };
      }
      const d = parseFlexibleLine(trimmed, this.ambiguousStyle);
      if (!d || Number.isNaN(d.getTime())) {
        return { line: i + 1, iso: '', note: 'unrecognized' };
      }
      return { line: i + 1, iso: d.toISOString(), note: '' };
    });
  });
}
