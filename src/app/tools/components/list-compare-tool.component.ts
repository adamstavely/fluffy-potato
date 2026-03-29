import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ToolDefinition } from '../models/tool.model';

function parseLines(raw: string, trimLines: boolean, ignoreEmpty: boolean): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const mapped = trimLines ? lines.map((l) => l.trim()) : lines;
  if (ignoreEmpty) {
    return mapped.filter((l) => l.length > 0);
  }
  return mapped;
}

function normalizeForCompare(s: string, caseInsensitive: boolean): string {
  return caseInsensitive ? s.toLocaleLowerCase() : s;
}

@Component({
  selector: 'sa-list-compare-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">
        Compare two line-based lists. Matching is by whole line after optional trimming and case folding.
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

      <div
        class="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm"
      >
        <div>
          <div class="text-xs text-slate-500">Only in A</div>
          <div class="font-semibold text-slate-900">{{ stats().onlyA }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">Only in B</div>
          <div class="font-semibold text-slate-900">{{ stats().onlyB }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">In both</div>
          <div class="font-semibold text-slate-900">{{ stats().both }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">Total A / B</div>
          <div class="font-semibold text-slate-900">{{ stats().totalA }} / {{ stats().totalB }}</div>
        </div>
      </div>

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
                (click)="copyBlock(block.text)"
              >
                Copy
              </button>
            </div>
            <pre
              class="max-h-[220px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-800"
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

  protected listA = '';
  protected listB = '';
  protected trimLines = true;
  protected ignoreEmpty = true;
  protected caseInsensitive = false;

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  private readonly parsed = computed(() => {
    this.version();
    const a = parseLines(this.listA, this.trimLines, this.ignoreEmpty);
    const b = parseLines(this.listB, this.trimLines, this.ignoreEmpty);
    const ci = this.caseInsensitive;

    const mapA = new Map<string, string>();
    const mapB = new Map<string, string>();
    for (const line of a) {
      const key = normalizeForCompare(line, ci);
      if (!mapA.has(key)) {
        mapA.set(key, line);
      }
    }
    for (const line of b) {
      const key = normalizeForCompare(line, ci);
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

  protected readonly stats = computed(() => {
    const p = this.parsed();
    return {
      onlyA: p.onlyA.length,
      onlyB: p.onlyB.length,
      both: p.both.length,
      totalA: p.totalA,
      totalB: p.totalB,
    };
  });

  protected readonly resultBlocks = computed(() => {
    const p = this.parsed();
    const join = (xs: string[]): string => xs.join('\n');
    return [
      { title: 'Only in A', text: join(p.onlyA) },
      { title: 'Only in B', text: join(p.onlyB) },
      { title: 'In both', text: join(p.both) },
    ];
  });

  protected async copyBlock(text: string): Promise<void> {
    if (!text || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(text);
  }
}
