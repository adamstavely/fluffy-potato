import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaSelectComponent } from '../../../ui/sa-select.component';
import { SaTextareaComponent } from '../../../ui/sa-textarea.component';
import type { ToolDefinition } from '../../models/tool.model';
import {
  transliterateText,
  type TransliterationPreset,
} from './transliteration-maps';

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
  imports: [FormsModule, SaSelectComponent, SaTextareaComponent, SaButtonComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">
        Convert text from one script to another <strong class="font-medium text-slate-800">without</strong> changing
        meaning (transliteration). This runs entirely in your browser.
      </p>

      <sa-select
        label="Preset"
        [options]="presetOptions"
        [ngModel]="preset()"
        (ngModelChange)="onPresetChange($event)"
        fieldClass="max-w-md"
      />

      <p class="text-xs text-slate-500">{{ activeHint() }}</p>

      <div class="grid gap-4 md:grid-cols-2 md:items-stretch">
        <sa-textarea
          label="Input"
          [rows]="10"
          [(ngModel)]="inputText"
          (ngModelChange)="apply()"
          placeholder="Paste text…"
          [spellcheck]="false"
          inputClass="font-mono text-sm"
          fieldClass="min-h-[180px] md:min-h-[240px]"
        />

        <div class="flex min-h-0 flex-col gap-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-700" id="transliteration-output-label">Output</span>
            <sa-button
              variant="stroked"
              ariaLabel="Copy transliteration output"
              innerClass="shrink-0 px-3 py-1.5 !text-sm !font-normal"
              [disabled]="!output()"
              (click)="copy()"
            >
              Copy output
            </sa-button>
          </div>
          <sa-textarea
            label="Transliteration output"
            [labelHidden]="true"
            ariaLabelledby="transliteration-output-label"
            fieldId="transliteration-output"
            [rows]="10"
            [ngModel]="output()"
            [readOnly]="true"
            [spellcheck]="false"
            inputClass="font-mono text-sm bg-slate-50"
            fieldClass="min-h-[180px] md:min-h-[240px]"
          />
        </div>
      </div>
    </div>
  `,
})
export class TransliterationToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly presetOptions = PRESETS.map((p) => ({ value: p.id, label: p.label }));
  protected readonly preset = signal<TransliterationPreset>('cyrillic-latin');
  protected inputText = '';

  protected readonly output = signal('');

  protected readonly activeHint = computed(() => {
    const id = this.preset();
    return PRESETS.find((p) => p.id === id)?.hint ?? '';
  });

  protected onPresetChange(value: TransliterationPreset): void {
    this.preset.set(value);
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
