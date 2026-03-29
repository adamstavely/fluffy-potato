import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import type { ToolDefinition } from '../models/tool.model';

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
}

/** Unofficial Google Translate JSON shape (client=gtx). */
type GtxResponse = [Array<[string, ...unknown[]]>, ...unknown[]];

const ENGINES: { id: 'mymemory' | 'google'; label: string }[] = [
  { id: 'mymemory', label: 'MyMemory' },
  { id: 'google', label: 'Google Translate' },
];

const LANGS: { code: string; label: string }[] = [
  { code: 'autodetect', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'tr', label: 'Turkish' },
];

/** Target-only languages (no autodetect in target list). */
const TARGET_LANGS = LANGS.filter((l) => l.code !== 'autodetect');

function parseGtxTranslation(data: unknown): string {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return '';
  }
  return data[0].map((seg) => (Array.isArray(seg) ? String(seg[0] ?? '') : '')).join('');
}

@Component({
  selector: 'sa-translation-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-6xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">
        Translate plain text using a public translation API. Daily limits and provider terms apply. For sensitive
        content, use an approved enterprise translator instead.
      </p>

      @if (error()) {
        <div
          class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
          role="alert"
        >
          {{ error() }}
        </div>
      }

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label class="block text-xs font-medium text-slate-700 sm:col-span-2 lg:col-span-1">
          Translation engine
          <select
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            [(ngModel)]="engine"
          >
            @for (e of engines; track e.id) {
              <option [value]="e.id">{{ e.label }}</option>
            }
          </select>
        </label>
        <label class="block text-xs font-medium text-slate-700">
          Source language
          <select
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            [(ngModel)]="sourceLang"
          >
            @for (l of langs; track l.code) {
              <option [value]="l.code">{{ l.label }}</option>
            }
          </select>
        </label>
        <label class="block text-xs font-medium text-slate-700">
          Target language
          <select
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            [(ngModel)]="targetLang"
          >
            @for (l of targetLangs; track l.code) {
              <option [value]="l.code">{{ l.label }}</option>
            }
          </select>
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <label class="flex min-h-0 flex-1 flex-col text-xs font-medium text-slate-700">
          Text
          <textarea
            class="mt-1 min-h-[180px] w-full flex-1 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
            [(ngModel)]="sourceText"
            placeholder="Paste text to translate…"
            spellcheck="false"
          ></textarea>
        </label>
        <label class="flex min-h-0 flex-1 flex-col text-xs font-medium text-slate-700">
          Translation
          <textarea
            class="mt-1 min-h-[180px] w-full flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900 outline-none"
            [value]="output()"
            readonly
            placeholder="Translation appears here…"
            spellcheck="false"
          ></textarea>
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="loading() || !sourceText.trim()"
          (click)="translate()"
        >
          {{ loading() ? 'Translating…' : 'Translate' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          [disabled]="!output()"
          (click)="copyOutput()"
        >
          Copy result
        </button>
      </div>
    </div>
  `,
})
export class TranslationToolComponent {
  readonly tool = input.required<ToolDefinition>();

  private readonly http = inject(HttpClient);

  protected readonly engines = ENGINES;
  protected readonly langs = LANGS;
  protected readonly targetLangs = TARGET_LANGS;
  protected engine: 'mymemory' | 'google' = 'mymemory';
  protected sourceLang = 'autodetect';
  protected targetLang = 'es';
  protected sourceText = '';

  protected readonly loading = signal(false);
  protected readonly output = signal('');
  protected readonly error = signal<string | null>(null);

  protected async translate(): Promise<void> {
    const q = this.sourceText.trim();
    if (!q) {
      return;
    }
    if (this.sourceLang !== 'autodetect' && this.sourceLang === this.targetLang) {
      this.error.set('Choose different source and target languages.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    try {
      if (this.engine === 'mymemory') {
        await this.translateMyMemory(q);
      } else {
        await this.translateGoogle(q);
      }
    } catch {
      this.error.set(
        'Could not reach the translation service (network or CORS). Try again or switch engines.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async translateMyMemory(q: string): Promise<void> {
    const langpair =
      this.sourceLang === 'autodetect'
        ? `autodetect|${this.targetLang}`
        : `${this.sourceLang}|${this.targetLang}`;
    const params = new HttpParams().set('q', q.slice(0, 4500)).set('langpair', langpair);
    const res = await firstValueFrom(
      this.http.get<MyMemoryResponse>('https://api.mymemory.translated.net/get', {
        params,
      }),
    );
    const text = res.responseData?.translatedText?.trim();
    if (res.responseStatus === 200 && text) {
      this.output.set(text);
    } else if (res.responseStatus === 429 || res.responseStatus === 403) {
      this.error.set('Translation service rate limit reached. Try again later or shorten the text.');
    } else {
      this.error.set('Translation failed. Check languages or try again.');
    }
  }

  private async translateGoogle(q: string): Promise<void> {
    const sl = this.sourceLang === 'autodetect' ? 'auto' : this.sourceLang;
    const tl = this.googleTargetCode(this.targetLang);
    const params = new HttpParams()
      .set('client', 'gtx')
      .set('sl', sl)
      .set('tl', tl)
      .set('dt', 't')
      .set('q', q.slice(0, 4500));
    const res = await firstValueFrom(
      this.http.get<GtxResponse>('https://translate.googleapis.com/translate_a/single', { params }),
    );
    const text = parseGtxTranslation(res).trim();
    if (text) {
      this.output.set(text);
    } else {
      this.error.set('Translation failed. Check languages or try again.');
    }
  }

  /** Google expects zh-CN for simplified Chinese. */
  private googleTargetCode(code: string): string {
    return code === 'zh' ? 'zh-CN' : code;
  }

  protected async copyOutput(): Promise<void> {
    const t = this.output();
    if (!t || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(t);
  }
}
