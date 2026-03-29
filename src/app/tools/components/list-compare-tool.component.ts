import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CROSSWALK_MAX_ROWS,
  PII_PASTE_WARNING,
} from '../constants/data-tool-scope';
import { crosswalkExact, crosswalkFuzzy as crosswalkFuzzyJoin } from '../data/crosswalk-join';
import {
  type DelimiterMode,
  parseDelimitedTable,
} from '../data/delimited-table';
import { parseLines, normalizeForCompareKey } from '../data/list-parse';
import type { ToolDefinition } from '../models/tool.model';

@Component({
  selector: 'sa-list-compare-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <p class="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
        {{ piiNotice }}
      </p>

      <div
        class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium text-slate-700"
        role="group"
        aria-label="Compare mode"
      >
        <button
          type="button"
          class="rounded-md px-3 py-1.5 transition-colors"
          [class.bg-white]="compareMode() === 'lines'"
          [class.shadow-sm]="compareMode() === 'lines'"
          [class.text-slate-900]="compareMode() === 'lines'"
          [attr.aria-pressed]="compareMode() === 'lines'"
          (click)="setMode('lines')"
        >
          Lines
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 transition-colors"
          [class.bg-white]="compareMode() === 'crosswalk'"
          [class.shadow-sm]="compareMode() === 'crosswalk'"
          [class.text-slate-900]="compareMode() === 'crosswalk'"
          [attr.aria-pressed]="compareMode() === 'crosswalk'"
          (click)="setMode('crosswalk')"
        >
          Crosswalk
        </button>
      </div>

      @if (compareMode() === 'lines') {
        <p class="text-sm leading-relaxed text-slate-600">
          Compare two line-based lists. Matching is by whole line after optional trimming and case
          folding.
        </p>

        <div class="flex flex-wrap gap-4 text-xs text-slate-700">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" [(ngModel)]="trimLines" (ngModelChange)="bump()" />
            Trim each line
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" [(ngModel)]="ignoreEmpty" (ngModelChange)="bump()" />
            Ignore blank lines
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" [(ngModel)]="caseInsensitive" (ngModelChange)="bump()" />
            Case-insensitive match
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="block text-xs font-medium text-slate-700">
            List A
            <textarea
              class="mt-1 min-h-[180px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
              [(ngModel)]="listA"
              (ngModelChange)="bump()"
              placeholder="One item per line…"
              spellcheck="false"
            ></textarea>
          </label>
          <label class="block text-xs font-medium text-slate-700">
            List B
            <textarea
              class="mt-1 min-h-[180px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
              [(ngModel)]="listB"
              (ngModelChange)="bump()"
              placeholder="One item per line…"
              spellcheck="false"
            ></textarea>
          </label>
        </div>
      } @else {
        <p class="text-sm leading-relaxed text-slate-600">
          Paste two delimited tables (e.g. TSV from Excel). Pick the key column on each side to see
          rows only in A, only in B, and matched pairs. Fuzzy matching uses normalized edit
          similarity on the key cells.
        </p>

        <div class="flex flex-wrap gap-3 text-xs text-slate-700">
          <label class="inline-flex items-center gap-1.5">
            Delimiter
            <select
              class="rounded border border-slate-200 bg-white px-2 py-1 font-mono"
              [(ngModel)]="delimiterUi"
              (ngModelChange)="onDelimiterChange($event); bump()"
            >
              <option value="auto">Auto</option>
              <option value="tab">Tab</option>
              <option value="comma">Comma</option>
            </select>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              [(ngModel)]="crosswalkFirstRowHeader"
              (ngModelChange)="bump()"
            />
            First row is header
          </label>
          <label class="inline-flex items-center gap-1.5">
            Key column A
            <input
              type="number"
              min="1"
              class="w-14 rounded border border-slate-200 bg-white px-2 py-1 text-center font-mono"
              [(ngModel)]="keyColA1"
              (ngModelChange)="bump()"
            />
          </label>
          <label class="inline-flex items-center gap-1.5">
            Key column B
            <input
              type="number"
              min="1"
              class="w-14 rounded border border-slate-200 bg-white px-2 py-1 text-center font-mono"
              [(ngModel)]="keyColB1"
              (ngModelChange)="bump()"
            />
          </label>
          <span class="text-slate-500">(1 = leftmost)</span>
        </div>

        <div class="flex flex-wrap gap-4 text-xs text-slate-700">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" [(ngModel)]="crosswalkTrimKeys" (ngModelChange)="bump()" />
            Trim key cells
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              [(ngModel)]="crosswalkCaseInsensitive"
              (ngModelChange)="bump()"
            />
            Case-insensitive key
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" [(ngModel)]="crosswalkFuzzyEnabled" (ngModelChange)="bump()" />
            Fuzzy key match
          </label>
          @if (crosswalkFuzzyEnabled) {
            <label class="inline-flex items-center gap-1.5">
              Min similarity
              <input
                type="range"
                min="50"
                max="100"
                [(ngModel)]="fuzzyThresholdPercent"
                (ngModelChange)="bump()"
                [attr.aria-valuetext]="fuzzyThresholdPercent + ' percent'"
              />
              <span class="font-mono tabular-nums" aria-hidden="true">{{ fuzzyThresholdPercent }}%</span>
            </label>
          }
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="block text-xs font-medium text-slate-700">
            Table A
            <textarea
              class="mt-1 min-h-[200px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
              [(ngModel)]="tableA"
              (ngModelChange)="bump()"
              placeholder="Paste TSV or CSV…"
              spellcheck="false"
            ></textarea>
          </label>
          <label class="block text-xs font-medium text-slate-700">
            Table B
            <textarea
              class="mt-1 min-h-[200px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
              [(ngModel)]="tableB"
              (ngModelChange)="bump()"
              placeholder="Paste TSV or CSV…"
              spellcheck="false"
            ></textarea>
          </label>
        </div>

        @if (crosswalkError()) {
          <p class="text-sm text-rose-700" role="alert">{{ crosswalkError() }}</p>
        }
      }

      <dl
        class="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm"
        aria-label="Comparison summary counts"
      >
        <div>
          <dt class="text-xs text-slate-600">Only in A</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ stats().onlyA }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-600">Only in B</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ stats().onlyB }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-600">In both / matched</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ stats().both }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-600">Total A / B</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ stats().totalA }} / {{ stats().totalB }}</dd>
        </div>
      </dl>

      <div class="grid gap-4 lg:grid-cols-3">
        @for (block of resultBlocks(); track block.title) {
          <div class="rounded-lg border border-slate-200 bg-white p-3">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-600">{{
                block.title
              }}</span>
              <button
                type="button"
                class="text-xs text-slate-600 underline decoration-slate-300 hover:decoration-slate-600"
                [disabled]="!block.text"
                [attr.aria-label]="'Copy ' + block.title + ' to clipboard'"
                (click)="copyBlock(block.text)"
              >
                Copy
              </button>
            </div>
            <pre
              class="max-h-[220px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-800"
              [attr.aria-label]="block.title + ' results'"
              >{{ block.text || '—' }}</pre
            >
          </div>
        }
      </div>
    </div>
  `,
})
export class ListCompareToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly piiNotice = PII_PASTE_WARNING;

  protected readonly compareMode = signal<'lines' | 'crosswalk'>('lines');

  protected listA = '';
  protected listB = '';
  protected trimLines = true;
  protected ignoreEmpty = true;
  protected caseInsensitive = false;

  protected tableA = '';
  protected tableB = '';
  protected delimiterUi: 'auto' | 'tab' | 'comma' = 'auto';
  protected crosswalkFirstRowHeader = true;
  protected keyColA1 = 1;
  protected keyColB1 = 1;
  protected crosswalkTrimKeys = true;
  protected crosswalkCaseInsensitive = false;
  protected crosswalkFuzzyEnabled = false;
  protected fuzzyThresholdPercent = 85;

  private readonly version = signal(0);

  protected setMode(m: 'lines' | 'crosswalk'): void {
    this.compareMode.set(m);
    this.bump();
  }

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected onDelimiterChange(v: string): void {
    if (v === 'auto' || v === 'tab' || v === 'comma') {
      this.delimiterUi = v;
    }
  }

  private delimiterMode(): DelimiterMode {
    if (this.delimiterUi === 'tab') {
      return '\t';
    }
    if (this.delimiterUi === 'comma') {
      return ',';
    }
    return 'auto';
  }

  private readonly lineParsed = computed(() => {
    this.version();
    if (this.compareMode() !== 'lines') {
      return null;
    }
    const a = parseLines(this.listA, this.trimLines, this.ignoreEmpty);
    const b = parseLines(this.listB, this.trimLines, this.ignoreEmpty);
    const ci = this.caseInsensitive;

    const mapA = new Map<string, string>();
    const mapB = new Map<string, string>();
    for (const line of a) {
      const key = normalizeForCompareKey(line, ci);
      if (!mapA.has(key)) {
        mapA.set(key, line);
      }
    }
    for (const line of b) {
      const key = normalizeForCompareKey(line, ci);
      if (!mapB.has(key)) {
        mapB.set(key, line);
      }
    }

    const onlyA: string[] = [];
    const onlyB: string[] = [];
    const both: string[] = [];

    for (const [key, display] of mapA) {
      if (mapB.has(key)) {
        both.push(display);
      } else {
        onlyA.push(display);
      }
    }
    for (const [key, display] of mapB) {
      if (!mapA.has(key)) {
        onlyB.push(display);
      }
    }

    onlyA.sort((x, y) => x.localeCompare(y));
    onlyB.sort((x, y) => x.localeCompare(y));
    both.sort((x, y) => x.localeCompare(y));

    return {
      onlyA,
      onlyB,
      both,
      totalA: a.length,
      totalB: b.length,
    };
  });

  private readonly crosswalkComputed = computed(() => {
    this.version();
    if (this.compareMode() !== 'crosswalk') {
      return null;
    }

    const parsedA = parseDelimitedTable(
      this.tableA,
      this.delimiterMode(),
      this.crosswalkFirstRowHeader,
    );
    const parsedB = parseDelimitedTable(
      this.tableB,
      this.delimiterMode(),
      this.crosswalkFirstRowHeader,
    );

    const rowsA = parsedA.rows;
    const rowsB = parsedB.rows;

    if (rowsA.length > CROSSWALK_MAX_ROWS || rowsB.length > CROSSWALK_MAX_ROWS) {
      return {
        onlyA: [] as string[],
        onlyB: [] as string[],
        both: [] as string[],
        totalA: rowsA.length,
        totalB: rowsB.length,
        error: `Each table is limited to ${CROSSWALK_MAX_ROWS.toLocaleString()} data rows. Trim the paste or split the job.`,
      };
    }

    const maxColsA = rowsA.reduce((m, r) => Math.max(m, r.length), 0);
    const maxColsB = rowsB.reduce((m, r) => Math.max(m, r.length), 0);
    const idxA = Math.floor(this.keyColA1) - 1;
    const idxB = Math.floor(this.keyColB1) - 1;

    if (this.keyColA1 < 1 || this.keyColB1 < 1) {
      return {
        onlyA: [],
        onlyB: [],
        both: [],
        totalA: rowsA.length,
        totalB: rowsB.length,
        error: 'Key column indexes must be at least 1.',
      };
    }
    if (maxColsA > 0 && idxA >= maxColsA) {
      return {
        onlyA: [],
        onlyB: [],
        both: [],
        totalA: rowsA.length,
        totalB: rowsB.length,
        error: `Key column A (${this.keyColA1}) is past the last column in table A (${maxColsA}).`,
      };
    }
    if (maxColsB > 0 && idxB >= maxColsB) {
      return {
        onlyA: [],
        onlyB: [],
        both: [],
        totalA: rowsA.length,
        totalB: rowsB.length,
        error: `Key column B (${this.keyColB1}) is past the last column in table B (${maxColsB}).`,
      };
    }

    const opts = {
      keyColA: idxA,
      keyColB: idxB,
      trimKeys: this.crosswalkTrimKeys,
      caseInsensitive: this.crosswalkCaseInsensitive,
    };

    const threshold = this.fuzzyThresholdPercent / 100;
    const result = this.crosswalkFuzzyEnabled
      ? crosswalkFuzzyJoin(rowsA, rowsB, opts, threshold)
      : crosswalkExact(rowsA, rowsB, opts);

    return { ...result, error: result.error };
  });

  protected readonly crosswalkError = computed(() => {
    const c = this.crosswalkComputed();
    if (!c?.error) {
      return '';
    }
    return c.error;
  });

  private readonly activeParsed = computed(() => {
    if (this.compareMode() === 'lines') {
      return this.lineParsed();
    }
    const c = this.crosswalkComputed();
    if (!c) {
      return {
        onlyA: [] as string[],
        onlyB: [] as string[],
        both: [] as string[],
        totalA: 0,
        totalB: 0,
      };
    }
    return {
      onlyA: c.onlyA,
      onlyB: c.onlyB,
      both: c.both,
      totalA: c.totalA,
      totalB: c.totalB,
    };
  });

  protected readonly stats = computed(() => {
    const p = this.activeParsed();
    if (!p) {
      return { onlyA: 0, onlyB: 0, both: 0, totalA: 0, totalB: 0 };
    }
    return {
      onlyA: p.onlyA.length,
      onlyB: p.onlyB.length,
      both: p.both.length,
      totalA: p.totalA,
      totalB: p.totalB,
    };
  });

  protected readonly resultBlocks = computed(() => {
    const p = this.activeParsed();
    if (!p) {
      return [
        { title: 'Only in A', text: '' },
        { title: 'Only in B', text: '' },
        { title: this.compareMode() === 'crosswalk' ? 'Matched pairs' : 'In both', text: '' },
      ];
    }
    const join = (xs: string[]): string => xs.join('\n\n');
    const bothTitle = this.compareMode() === 'crosswalk' ? 'Matched pairs' : 'In both';
    return [
      { title: 'Only in A', text: join(p.onlyA) },
      { title: 'Only in B', text: join(p.onlyB) },
      { title: bothTitle, text: join(p.both) },
    ];
  });

  protected async copyBlock(text: string): Promise<void> {
    if (!text || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(text);
  }
}
