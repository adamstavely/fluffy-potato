import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  NgZone,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaFileInputComponent } from '../../../ui/sa-file-input.component';
import { SaSelectComponent, type SaSelectOption } from '../../../ui/sa-select.component';
import { SaSliderComponent } from '../../../ui/sa-slider.component';
import { SaTextareaComponent } from '../../../ui/sa-textarea.component';
import type { ToolDefinition } from '../../models/tool.model';
import { extractTextFromDocxFile } from './docx-text';
import { extractTextFromPdfFile } from './pdf-text';
import { orpPivotIndex, splitOrpDisplay, tokenizeWords } from './orp-pivot';

const STORAGE_KEY = 'tools.speed-reader.settings';

const FONT_STACK: Record<string, string> = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

type FontFamilyKey = keyof typeof FONT_STACK;

interface SpeedReaderSettings {
  wpm: number;
  fontSizePx: number;
  fontFamily: FontFamilyKey;
  sourceText: string;
}

function clampWpm(n: number): number {
  if (!Number.isFinite(n)) {
    return 250;
  }
  return Math.min(900, Math.max(60, Math.round(n)));
}

function clampFontSize(n: number): number {
  if (!Number.isFinite(n)) {
    return 48;
  }
  return Math.min(120, Math.max(20, Math.round(n)));
}

function loadSettings(): SpeedReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        wpm: 250,
        fontSizePx: 48,
        fontFamily: 'sans',
        sourceText: '',
      };
    }
    const p = JSON.parse(raw) as Partial<SpeedReaderSettings>;
    const fam = p.fontFamily;
    const fontFamily: FontFamilyKey =
      fam && fam in FONT_STACK ? fam : 'sans';
    return {
      wpm: clampWpm(p.wpm ?? 250),
      fontSizePx: clampFontSize(p.fontSizePx ?? 48),
      fontFamily,
      sourceText: typeof p.sourceText === 'string' ? p.sourceText : '',
    };
  } catch {
    return {
      wpm: 250,
      fontSizePx: 48,
      fontFamily: 'sans',
      sourceText: '',
    };
  }
}

function persistSettings(s: SpeedReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

@Component({
  selector: 'sa-speed-reader-tool',
  standalone: true,
  imports: [
    FormsModule,
    SaButtonComponent,
    SaFileInputComponent,
    SaSelectComponent,
    SaSliderComponent,
    SaTextareaComponent,
  ],
  template: `
    <div class="mx-auto max-w-3xl space-y-5">
      <p class="text-sm leading-relaxed text-slate-600">
        Paste text or load a plain-text file, PDF, or Word (.docx). Words flash one at a time with an ORP pivot for
        faster reading. PDF and Word parsing run in your browser; scanned PDFs may yield little or no text.
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <sa-file-input
          label="Load a plain text or Markdown file"
          [labelHidden]="true"
          triggerLabel="Load .txt"
          accept=".txt,text/plain,.md,text/markdown"
          [disabled]="loadingFile()"
          (fileChange)="onTextFile($event)"
        />
        <sa-file-input
          label="Load a PDF file"
          [labelHidden]="true"
          triggerLabel="Load PDF"
          accept="application/pdf,.pdf"
          [disabled]="loadingFile()"
          (fileChange)="onPdfFile($event)"
        />
        <sa-file-input
          label="Load a Word document"
          [labelHidden]="true"
          triggerLabel="Load .docx"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          [disabled]="loadingFile()"
          (fileChange)="onDocxFile($event)"
        />
        @if (loadingLabel()) {
          <span class="text-sm text-slate-500" role="status">{{ loadingLabel() }}</span>
        }
      </div>
      @if (fileError()) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
          {{ fileError() }}
        </div>
      }

      <div [style.font-family]="fontStack()" [style.font-size.px]="fontSizePx()">
        <sa-textarea
          label="Source text (loading a file replaces this)"
          [rows]="6"
          [ngModel]="sourceText()"
          (ngModelChange)="onSourceChange($event)"
          [disabled]="isPlaying()"
          inputClass="text-sm text-slate-900"
        />
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-[140px] flex-1">
            <sa-slider
              label="Words per minute"
              [min]="60"
              [max]="900"
              [step]="10"
              [ngModel]="wpm()"
              (ngModelChange)="setWpm($event)"
              [hostDisabled]="isPlaying()"
              valueSuffix=" WPM"
            />
          </div>
          <div class="min-w-[140px] flex-1">
            <sa-slider
              label="Font size"
              [min]="20"
              [max]="120"
              [step]="2"
              [ngModel]="fontSizePx()"
              (ngModelChange)="setFontSize($event)"
              valueSuffix="px"
            />
          </div>
          <sa-select
            label="Font"
            [options]="fontFamilyOptions"
            [ngModel]="fontFamily()"
            (ngModelChange)="setFontFamily($event)"
            fieldClass="min-w-[160px]"
          />
        </div>

        <div
          class="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-8"
          aria-live="polite"
          aria-atomic="true"
        >
          @if (words().length === 0) {
            <p class="text-center text-sm text-slate-500">Add text to start reading.</p>
          } @else {
            <div
              class="grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-baseline gap-0 tabular-nums"
              [style.font-family]="fontStack()"
              [style.font-size.px]="fontSizePx()"
            >
              <span class="block text-right text-slate-800">{{ orp().before }}</span>
              <span class="px-0.5 font-semibold text-rose-600">{{ orp().pivot }}</span>
              <span class="block text-left text-slate-800">{{ orp().after }}</span>
            </div>
            <p class="mt-3 font-mono text-xs text-slate-500">
              ORP index {{ orpIndexDisplay() }} · {{ positionLabel() }}
            </p>
          }
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          @if (!isPlaying()) {
            <sa-button
              variant="flat"
              ariaLabel="Start or resume speed reading"
              innerClass="!bg-slate-900 px-5 py-2.5 text-sm font-medium !text-white hover:!bg-slate-800 disabled:!opacity-40"
              [disabled]="words().length === 0"
              (click)="startOrResume()"
            >
              {{ hasStarted() ? 'Resume' : 'Play' }}
            </sa-button>
          } @else {
            <sa-button
              variant="stroked"
              ariaLabel="Pause speed reading"
              innerClass="px-5 py-2.5 text-sm font-medium"
              (click)="pause()"
            >
              Pause
            </sa-button>
          }
          <sa-button
            variant="stroked"
            ariaLabel="Restart from the beginning"
            innerClass="px-5 py-2.5 text-sm font-medium"
            [disabled]="words().length === 0"
            (click)="restart()"
          >
            Restart
          </sa-button>
        </div>

        @if (words().length > 0) {
          <div class="mt-4">
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-slate-800 transition-[width] duration-150"
                [style.width.%]="progressPercent()"
              ></div>
            </div>
            <p class="mt-1 text-center font-mono text-xs text-slate-500">
              {{ progressLabel() }}
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class SpeedReaderToolComponent implements OnDestroy {
  readonly tool = input.required<ToolDefinition>();

  protected readonly fontFamilyOptions: SaSelectOption<FontFamilyKey>[] = [
    { value: 'system', label: 'System UI' },
    { value: 'sans', label: 'Sans (Inter)' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Monospace' },
  ];

  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private readonly settingsSig = signal<SpeedReaderSettings>(loadSettings());

  protected readonly sourceText = computed(() => this.settingsSig().sourceText);
  protected readonly wpm = computed(() => this.settingsSig().wpm);
  protected readonly fontSizePx = computed(() => this.settingsSig().fontSizePx);
  protected readonly fontFamily = computed(() => this.settingsSig().fontFamily);

  private readonly indexSig = signal(0);
  private readonly isPlayingSig = signal(false);
  private readonly hasStartedSig = signal(false);
  private readonly loadingLabelSig = signal<string | null>(null);
  private readonly fileErrorSig = signal<string | null>(null);

  protected readonly isPlaying = this.isPlayingSig.asReadonly();
  protected readonly hasStarted = this.hasStartedSig.asReadonly();
  protected readonly loadingFile = computed(() => this.loadingLabelSig() !== null);
  protected readonly loadingLabel = this.loadingLabelSig.asReadonly();
  protected readonly fileError = this.fileErrorSig.asReadonly();

  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly words = computed(() => tokenizeWords(this.settingsSig().sourceText));

  protected readonly fontStack = computed(
    () => FONT_STACK[this.settingsSig().fontFamily] ?? FONT_STACK['sans'],
  );

  protected readonly currentWord = computed(() => {
    const ws = this.words();
    const i = this.indexSig();
    if (ws.length === 0 || i < 0 || i >= ws.length) {
      return '';
    }
    return ws[i];
  });

  protected readonly orp = computed(() => splitOrpDisplay(this.currentWord()));

  protected readonly orpIndexDisplay = computed(() => {
    const w = this.currentWord();
    if (!w) {
      return '—';
    }
    return String(orpPivotIndex(w));
  });

  protected readonly positionLabel = computed(() => {
    const ws = this.words();
    const i = this.indexSig();
    if (ws.length === 0) {
      return '';
    }
    return `Word ${i + 1} of ${ws.length}`;
  });

  protected readonly progressLabel = computed(() => {
    const ws = this.words();
    const i = this.indexSig();
    if (ws.length === 0) {
      return '';
    }
    return `${i + 1} / ${ws.length}`;
  });

  protected readonly progressPercent = computed(() => {
    const ws = this.words();
    if (ws.length === 0) {
      return 0;
    }
    const i = this.indexSig();
    return ((i + 1) / ws.length) * 100;
  });

  constructor() {
    effect(() => {
      const ws = this.words();
      const i = this.indexSig();
      if (ws.length > 0 && i >= ws.length) {
        this.indexSig.set(ws.length - 1);
      }
      if (ws.length === 0) {
        this.indexSig.set(0);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected onSourceChange(text: string): void {
    this.pause();
    this.hasStartedSig.set(false);
    this.indexSig.set(0);
    const next = { ...this.settingsSig(), sourceText: text };
    this.settingsSig.set(next);
    persistSettings(next);
  }

  protected setWpm(v: number): void {
    const next = { ...this.settingsSig(), wpm: clampWpm(Number(v)) };
    this.settingsSig.set(next);
    persistSettings(next);
    if (this.isPlayingSig()) {
      this.restartInterval();
    }
  }

  protected setFontSize(v: number): void {
    const next = { ...this.settingsSig(), fontSizePx: clampFontSize(Number(v)) };
    this.settingsSig.set(next);
    persistSettings(next);
  }

  protected setFontFamily(v: string): void {
    const key = v as FontFamilyKey;
    const fontFamily = key in FONT_STACK ? key : 'sans';
    const next = { ...this.settingsSig(), fontFamily };
    this.settingsSig.set(next);
    persistSettings(next);
  }

  protected startOrResume(): void {
    if (this.words().length === 0) {
      return;
    }
    this.fileErrorSig.set(null);
    this.hasStartedSig.set(true);
    this.isPlayingSig.set(true);
    this.startInterval();
  }

  protected pause(): void {
    this.isPlayingSig.set(false);
    this.clearTimer();
  }

  protected restart(): void {
    this.clearTimer();
    this.indexSig.set(0);
    this.isPlayingSig.set(false);
    this.hasStartedSig.set(false);
  }

  protected onTextFile(files: FileList | null): void {
    const file = files?.[0];
    if (!file) {
      return;
    }
    this.fileErrorSig.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      this.applyLoadedText(text);
    };
    reader.onerror = () => {
      this.fileErrorSig.set('Could not read the text file.');
    };
    reader.readAsText(file);
  }

  protected async onPdfFile(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) {
      return;
    }
    this.fileErrorSig.set(null);
    this.loadingLabelSig.set('Extracting PDF…');
    try {
      const text = await extractTextFromPdfFile(file, this.document.baseURI);
      if (!text.trim()) {
        this.fileErrorSig.set('No extractable text found in this PDF. It may be scanned or image-only.');
        return;
      }
      this.applyLoadedText(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to parse PDF.';
      this.fileErrorSig.set(msg);
    } finally {
      this.loadingLabelSig.set(null);
    }
  }

  protected async onDocxFile(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) {
      return;
    }
    this.fileErrorSig.set(null);
    this.loadingLabelSig.set('Reading Word document…');
    try {
      const text = await extractTextFromDocxFile(file);
      if (!text.trim()) {
        this.fileErrorSig.set('No text found in this Word document.');
        return;
      }
      this.applyLoadedText(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to read Word document.';
      this.fileErrorSig.set(msg);
    } finally {
      this.loadingLabelSig.set(null);
    }
  }

  private applyLoadedText(text: string): void {
    this.pause();
    this.hasStartedSig.set(false);
    this.indexSig.set(0);
    const next = { ...this.settingsSig(), sourceText: text };
    this.settingsSig.set(next);
    persistSettings(next);
  }

  private tick(): void {
    const ws = this.words();
    if (ws.length === 0) {
      this.pause();
      return;
    }
    const i = this.indexSig();
    if (i >= ws.length - 1) {
      this.pause();
      return;
    }
    this.indexSig.set(i + 1);
  }

  private startInterval(): void {
    this.clearTimer();
    const delay = 60000 / this.settingsSig().wpm;
    this.zone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.zone.run(() => this.tick());
      }, delay);
    });
  }

  private restartInterval(): void {
    if (this.isPlayingSig()) {
      this.startInterval();
    }
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
