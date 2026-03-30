import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ToolDefinition } from '../../models/tool.model';

function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function bytesToBase64Standard(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function base64StandardToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function padBase64(s: string): string {
  const mod = s.length % 4;
  if (mod === 2) {
    return s + '==';
  }
  if (mod === 3) {
    return s + '=';
  }
  if (mod === 1 && s.length > 0) {
    throw new Error('Invalid Base64 length');
  }
  return s;
}

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_');
}

function fromUrlSafe(safe: string): string {
  const std = safe.replace(/-/g, '+').replace(/_/g, '/');
  return padBase64(std);
}

@Component({
  selector: 'sa-base64-encode-decode-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-5">
      <fieldset class="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3">
        <legend class="px-1 text-xs font-medium text-slate-600">Mode</legend>
        <div class="flex flex-wrap gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="b64-mode"
              [value]="'encode'"
              [(ngModel)]="mode"
              (ngModelChange)="bump()"
            />
            <span>Encode text → Base64</span>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="b64-mode"
              [value]="'decode'"
              [(ngModel)]="mode"
              (ngModelChange)="bump()"
            />
            <span>Decode Base64 → text</span>
          </label>
        </div>
      </fieldset>

      <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" [(ngModel)]="urlSafe" (ngModelChange)="bump()" />
        <span>URL-safe alphabet (<span class="font-mono">-</span> and <span class="font-mono">_</span>)</span>
      </label>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-700" for="b64-input">{{
          mode === 'encode' ? 'Plain text' : 'Base64'
        }}</label>
        <textarea
          id="b64-input"
          class="min-h-[160px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
          [(ngModel)]="inputText"
          (ngModelChange)="bump()"
          [spellcheck]="false"
          autocomplete="off"
          [attr.aria-describedby]="'b64-hint'"
        ></textarea>
        <p id="b64-hint" class="mt-1 text-xs text-slate-500">
          All processing runs in your browser. Decoding expects UTF-8 after binary decode.
        </p>
      </div>

      @if (error(); as err) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {{ err }}
        </div>
      }

      @if (!error()) {
        <div>
          <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
            <label class="text-xs font-medium text-slate-700" for="b64-output">{{
              mode === 'encode' ? 'Base64 output' : 'Decoded text'
            }}</label>
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              (click)="copyOutput()"
            >
              Copy output
            </button>
          </div>
          <textarea
            id="b64-output"
            readonly
            class="min-h-[160px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900"
            [value]="outputText()"
          ></textarea>
        </div>
      }
    </div>
  `,
})
export class Base64EncodeDecodeToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected mode: 'encode' | 'decode' = 'encode';
  protected inputText = '';
  protected urlSafe = false;

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly error = computed((): string | null => {
    this.version();
    const raw = this.inputText;
    if (!raw || this.mode === 'encode') {
      return null;
    }
    try {
      const normalized = raw.replace(/\s+/g, '');
      const padded = this.urlSafe ? fromUrlSafe(normalized) : padBase64(normalized);
      const bytes = base64StandardToBytes(padded);
      bytesToUtf8(bytes);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Could not decode Base64';
    }
  });

  protected readonly outputText = computed((): string => {
    this.version();
    const raw = this.inputText;
    if (!raw) {
      return '';
    }
    if (this.mode === 'encode') {
      const std = bytesToBase64Standard(utf8ToBytes(raw));
      return this.urlSafe ? toUrlSafe(std) : std;
    }
    try {
      const normalized = raw.replace(/\s+/g, '');
      const padded = this.urlSafe ? fromUrlSafe(normalized) : padBase64(normalized);
      const bytes = base64StandardToBytes(padded);
      return bytesToUtf8(bytes);
    } catch {
      return '';
    }
  });

  protected async copyOutput(): Promise<void> {
    const t = this.outputText();
    if (!t || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(t);
  }
}
