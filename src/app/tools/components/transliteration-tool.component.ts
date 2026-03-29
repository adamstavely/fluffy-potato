import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ToolDefinition } from '../models/tool.model';
import {
  transliterateText,
  type TransliterationPreset,
} from '../services/transliteration-maps';

const PRESETS: { id: TransliterationPreset; label: string; hint: string }[] = [
  {
    id: 'cyrillic-latin',
    label: 'Cyrillic → Latin (Russian-style)',
    hint: 'Maps Russian Cyrillic letters to Latin letters (ISO 9–inspired). Other Cyrillic letters pass through unchanged.',
  },
  {
    id: 'greek-latin',
    label: 'Greek → Latin',
    hint: 'Transliterate Greek alphabet to Latin equivalents.',
  },
  {
    id: 'kana-romaji',
    label: 'Hiragana / Katakana → Romaji',
    hint: 'Converts Japanese kana to Hepburn-style romaji (common mora; long vowels and kanji are not expanded).',
  },
];

@Component({
  selector: 'sa-transliteration-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-6xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">
        Convert text from one script to another <strong class="font-medium text-slate-800">without</strong> changing
        meaning (transliteration). This runs entirely in your browser.
      </p>

      <label class="block text-xs font-medium text-slate-700">
        Preset
        <select
          class="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          [ngModel]="preset()"
          (ngModelChange)="onPresetChange($event)"
        >
          @for (p of presets; track p.id) {
            <option [value]="p.id">{{ p.label }}</option>
          }
        </select>
      </label>

      <p class="text-xs text-slate-500">{{ activeHint() }}</p>

      <div class="grid gap-4 md:grid-cols-2 md:items-stretch">
        <label class="flex min-h-0 flex-col text-xs font-medium text-slate-700">
          Input
          <textarea
            class="mt-1 min-h-[180px] flex-1 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400 md:min-h-[240px]"
            [(ngModel)]="inputText"
            (ngModelChange)="apply()"
            placeholder="Paste text…"
            spellcheck="false"
          ></textarea>
        </label>

        <div class="flex min-h-0 flex-col">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-700">
            <label for="transliteration-output">Output</label>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-normal text-slate-700 hover:bg-slate-50"
              [disabled]="!output()"
              (click)="copy()"
            >
              Copy output
            </button>
          </div>
          <textarea
            id="transliteration-output"
            class="mt-1 min-h-[180px] w-full flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900 outline-none md:min-h-[240px]"
            [value]="output()"
            readonly
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>
  `,
})
export class TransliterationToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly presets = PRESETS;
  protected readonly preset = signal<TransliterationPreset>('cyrillic-latin');
  protected inputText = '';

  protected readonly output = signal('');

  protected readonly activeHint = computed(() => {
    const id = this.preset();
    return PRESETS.find((p) => p.id === id)?.hint ?? '';
  });

  protected onPresetChange(value: string): void {
    this.preset.set(value as TransliterationPreset);
    this.apply();
  }

  protected apply(): void {
    this.output.set(transliterateText(this.inputText, this.preset()));
  }

  protected async copy(): Promise<void> {
    const t = this.output();
    if (!t || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(t);
  }
}
