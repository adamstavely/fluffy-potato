import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

interface MatchRow {
  index: number;
  match: string;
  groups: string[];
}

@Component({
  selector: 'sa-regex-pattern-tester-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-4xl space-y-5">
      <div class="grid gap-4 md:grid-cols-2">
        <sa-text-field
          label="Pattern"
          placeholder="e.g. \\d{3}-\\w+"
          [(ngModel)]="pattern"
          (ngModelChange)="bump()"
          inputClass="font-mono text-sm"
          [spellcheck]="false"
          autocomplete="off"
        />
        <sa-text-field
          label="Replacement (optional)"
          placeholder="$1-$2"
          [(ngModel)]="replacement"
          (ngModelChange)="bump()"
          inputClass="font-mono text-sm"
          [spellcheck]="false"
          autocomplete="off"
        />
      </div>

      <fieldset class="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
        <legend class="px-1 text-xs font-medium text-slate-600">Flags</legend>
        <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          @for (f of flagDefs; track f.key) {
            <label class="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                [checked]="flags()[f.key]"
                (change)="toggleFlag(f.key, $event)"
              />
              <span class="font-mono">{{ f.key }}</span>
              <span class="text-slate-500">— {{ f.hint }}</span>
            </label>
          }
        </div>
      </fieldset>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-700" for="regex-sample"
          >Sample text</label
        >
        <textarea
          id="regex-sample"
          class="min-h-[140px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
          [(ngModel)]="sample"
          (ngModelChange)="bump()"
          [spellcheck]="false"
          autocomplete="off"
          aria-describedby="regex-hint"
        ></textarea>
        <p id="regex-hint" class="mt-1 text-xs text-slate-500">
          Matching runs in the browser; large samples may be slow with global flag.
        </p>
      </div>

      @if (error(); as err) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {{ err }}
        </div>
      }

      @if (!error() && matches().length > 0) {
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full min-w-[320px] border-collapse text-left text-sm">
            <thead class="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th class="px-3 py-2">#</th>
                <th class="px-3 py-2">Index</th>
                <th class="px-3 py-2">Match</th>
                <th class="px-3 py-2">Groups</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (m of matches(); track m.index + '-' + $index) {
                <tr>
                  <td class="px-3 py-2 text-slate-500">{{ $index + 1 }}</td>
                  <td class="px-3 py-2 font-mono text-xs">{{ m.index }}</td>
                  <td class="max-w-[240px] px-3 py-2 font-mono text-xs break-all">{{ m.match }}</td>
                  <td class="px-3 py-2 font-mono text-xs text-slate-700">
                    @if (m.groups.length) {
                      @for (g of m.groups; track $index) {
                        <span class="mr-2 inline-block rounded bg-slate-100 px-1"
                          >{{ $index + 1 }}: {{ g }}</span
                        >
                      }
                    } @else {
                      —
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (!error() && replacementPreview() !== null) {
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <p class="font-medium text-emerald-900">Replace preview</p>
          <p class="mt-1 font-mono text-xs break-all text-emerald-950">{{ replacementPreview() }}</p>
        </div>
      }
    </div>
  `,
})
export class RegexPatternTesterToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected pattern = '';
  protected sample = '';
  protected replacement = '';

  protected readonly flagDefs = [
    { key: 'g' as const, hint: 'global' },
    { key: 'i' as const, hint: 'ignore case' },
    { key: 'm' as const, hint: 'multiline' },
    { key: 's' as const, hint: 'dotAll' },
    { key: 'u' as const, hint: 'unicode' },
  ];

  protected readonly flags = signal<Record<'g' | 'i' | 'm' | 's' | 'u', boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected toggleFlag(key: 'g' | 'i' | 'm' | 's' | 'u', ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.flags.update((f) => ({ ...f, [key]: checked }));
    this.bump();
  }

  protected readonly error = computed(() => {
    this.version();
    const p = this.pattern;
    if (!p.trim()) {
      return null;
    }
    const f = this.flagsString();
    try {
      new RegExp(p, f);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid regular expression';
    }
  });

  protected readonly matches = computed((): MatchRow[] => {
    this.version();
    const p = this.pattern;
    if (!p.trim() || this.error()) {
      return [];
    }
    let re: RegExp;
    try {
      re = new RegExp(p, this.flagsString());
    } catch {
      return [];
    }
    const text = this.sample;
    const out: MatchRow[] = [];
    if (re.global) {
      let m: RegExpExecArray | null;
      const copy = new RegExp(re.source, re.flags);
      while ((m = copy.exec(text)) !== null) {
        out.push({
          index: m.index,
          match: m[0],
          groups: m.slice(1),
        });
        if (m[0].length === 0) {
          copy.lastIndex++;
        }
      }
    } else {
      const m = re.exec(text);
      if (m) {
        out.push({ index: m.index, match: m[0], groups: m.slice(1) });
      }
    }
    return out;
  });

  protected readonly replacementPreview = computed((): string | null => {
    this.version();
    const rep = this.replacement;
    if (!rep) {
      return null;
    }
    const p = this.pattern;
    if (!p.trim() || this.error()) {
      return null;
    }
    let re: RegExp;
    try {
      re = new RegExp(p, this.flagsString());
    } catch {
      return null;
    }
    return this.sample.replace(re, rep);
  });

  private flagsString(): string {
    const f = this.flags();
    let s = '';
    if (f.g) {
      s += 'g';
    }
    if (f.i) {
      s += 'i';
    }
    if (f.m) {
      s += 'm';
    }
    if (f.s) {
      s += 's';
    }
    if (f.u) {
      s += 'u';
    }
    return s;
  }
}
