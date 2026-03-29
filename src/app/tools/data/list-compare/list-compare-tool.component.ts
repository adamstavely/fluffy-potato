import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaCheckboxComponent } from '../../../ui/sa-checkbox.component';
import { SaSelectComponent, type SaSelectOption } from '../../../ui/sa-select.component';
import { SaSliderComponent } from '../../../ui/sa-slider.component';
import { SaTextareaComponent } from '../../../ui/sa-textarea.component';
import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import { crosswalkExact, crosswalkFuzzy as crosswalkFuzzyJoin } from './crosswalk-join';
import {
  type DelimiterMode,
  parseDelimitedTable,
} from '../shared/delimited-table';
import { parseLines, normalizeForCompareKey } from './list-parse';

/** Crosswalk / join cap to avoid main-thread stalls on large pastes. */
const CROSSWALK_MAX_ROWS = 25_000;

@Component({
  selector: 'sa-list-compare-tool',
  standalone: true,
  imports: [
    FormsModule,
    SaButtonComponent,
    SaCheckboxComponent,
    SaSelectComponent,
    SaSliderComponent,
    SaTextareaComponent,
    SaTextFieldComponent,
  ],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <div
        class="inline-flex shrink-0 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-0.5 divide-x divide-[var(--app-border)]"
        role="group"
        aria-label="Compare mode"
      >
        <button
          type="button"
          class="sa-segmented-btn min-h-[34px] shrink-0 whitespace-nowrap px-3 py-1.5 text-center text-[13px] font-medium leading-tight"
          [class.sa-segmented-btn--active]="compareMode() === 'lines'"
          [attr.aria-pressed]="compareMode() === 'lines' ? 'true' : 'false'"
          (click)="setMode('lines')"
        >
          Lines
        </button>
        <button
          type="button"
          class="sa-segmented-btn min-h-[34px] shrink-0 whitespace-nowrap px-3 py-1.5 text-center text-[13px] font-medium leading-tight"
          [class.sa-segmented-btn--active]="compareMode() === 'crosswalk'"
          [attr.aria-pressed]="compareMode() === 'crosswalk' ? 'true' : 'false'"
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
          <sa-checkbox [(ngModel)]="trimLines" (ngModelChange)="bump()"> Trim each line </sa-checkbox>
          <sa-checkbox [(ngModel)]="ignoreEmpty" (ngModelChange)="bump()"> Ignore blank lines </sa-checkbox>
          <sa-checkbox [(ngModel)]="caseInsensitive" (ngModelChange)="bump()">
            Case-insensitive match
          </sa-checkbox>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <sa-textarea
            label="List A"
            [rows]="8"
            [(ngModel)]="listA"
            (ngModelChange)="bump()"
            placeholder="One item per line…"
            [spellcheck]="false"
            inputClass="font-mono text-sm"
            fieldClass="min-h-[180px]"
          />
          <sa-textarea
            label="List B"
            [rows]="8"
            [(ngModel)]="listB"
            (ngModelChange)="bump()"
            placeholder="One item per line…"
            [spellcheck]="false"
            inputClass="font-mono text-sm"
            fieldClass="min-h-[180px]"
          />
        </div>
      } @else {
        <p class="text-sm leading-relaxed text-slate-600">
          Paste two delimited tables (e.g. TSV from Excel). Pick the key column on each side to see
          rows only in A, only in B, and matched pairs. Fuzzy matching uses normalized edit
          similarity on the key cells.
        </p>

        <div class="flex flex-wrap items-end gap-3 text-xs text-slate-700">
          <sa-select
            label="Delimiter"
            [options]="delimiterOptions"
            [(ngModel)]="delimiterUi"
            (ngModelChange)="onDelimiterChange($event); bump()"
            fieldClass="max-w-[200px]"
          />
          <sa-checkbox [(ngModel)]="crosswalkFirstRowHeader" (ngModelChange)="bump()">
            First row is header
          </sa-checkbox>
          <sa-text-field
            label="Key column A"
            type="number"
            [min]="1"
            [ngModel]="keyColA1"
            (ngModelChange)="keyColA1 = $event; bump()"
            fieldClass="w-24"
            inputClass="text-center font-mono"
          />
          <sa-text-field
            label="Key column B"
            type="number"
            [min]="1"
            [ngModel]="keyColB1"
            (ngModelChange)="keyColB1 = $event; bump()"
            fieldClass="w-24"
            inputClass="text-center font-mono"
          />
          <span class="text-slate-500">(1 = leftmost)</span>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          <sa-checkbox [(ngModel)]="crosswalkTrimKeys" (ngModelChange)="bump()"> Trim key cells </sa-checkbox>
          <sa-checkbox [(ngModel)]="crosswalkCaseInsensitive" (ngModelChange)="bump()">
            Case-insensitive key
          </sa-checkbox>
          <sa-checkbox [(ngModel)]="crosswalkFuzzyEnabled" (ngModelChange)="bump()">
            Fuzzy key match
          </sa-checkbox>
          @if (crosswalkFuzzyEnabled) {
            <sa-slider
              label="Min similarity"
              [min]="50"
              [max]="100"
              [step]="1"
              valueSuffix="%"
              [(ngModel)]="fuzzyThresholdPercent"
              (ngModelChange)="bump()"
            />
          }
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <sa-textarea
            label="Table A"
            [rows]="8"
            [(ngModel)]="tableA"
            (ngModelChange)="bump()"
            placeholder="Paste TSV or CSV…"
            [spellcheck]="false"
            inputClass="font-mono text-sm"
            fieldClass="min-h-[200px]"
          />
          <sa-textarea
            label="Table B"
            [rows]="8"
            [(ngModel)]="tableB"
            (ngModelChange)="bump()"
            placeholder="Paste TSV or CSV…"
            [spellcheck]="false"
            inputClass="font-mono text-sm"
            fieldClass="min-h-[200px]"
          />
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
              <sa-button
                variant="text"
                [ariaLabel]="'Copy ' + block.title + ' to clipboard'"
                [disabled]="!block.text"
                innerClass="!text-xs !text-slate-600 !underline !decoration-slate-300 hover:!decoration-slate-600"
                (click)="copyBlock(block.text)"
              >
                Copy
              </sa-button>
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

  protected readonly delimiterOptions: SaSelectOption<'auto' | 'tab' | 'comma'>[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'tab', label: 'Tab' },
    { value: 'comma', label: 'Comma' },
  ];

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

  protected onDelimiterChange(v: 'auto' | 'tab' | 'comma'): void {
    this.delimiterUi = v;
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
