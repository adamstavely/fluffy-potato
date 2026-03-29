import { Component, input, signal } from '@angular/core';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';

import type { ToolDefinition } from '../models/tool.model';
import { PII_PASTE_WARNING } from '../constants/data-tool-scope';

@Component({
  selector: 'sa-barcode-qr-tool',
  standalone: true,
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">{{ piiNotice }}</p>

      <p class="text-sm text-slate-600">
        Upload an image containing a barcode or QR code. Decoding runs locally in your browser.
      </p>

      <label class="block text-xs font-medium text-slate-700">
        Image file
        <input
          type="file"
          accept="image/*"
          class="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-sm"
          (change)="onFile($event)"
        />
      </label>

      @if (busy()) {
        <p class="text-sm text-slate-600">Decoding…</p>
      }

      @if (error()) {
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {{ error() }}
        </div>
      }

      @if (decoded(); as d) {
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
          <p class="font-medium">Format: {{ d.format }}</p>
          <p class="mt-2 break-all font-mono text-xs">{{ d.text }}</p>
          <button
            type="button"
            class="mt-3 text-xs text-emerald-900 underline decoration-emerald-400 hover:decoration-emerald-700"
            (click)="copy(d.text)"
          >
            Copy text
          </button>
        </div>
      }
    </div>
  `,
})
export class BarcodeQrToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly piiNotice = PII_PASTE_WARNING;

  private readonly reader = new BrowserMultiFormatReader(
    new Map<DecodeHintType, unknown>([
      [
        DecodeHintType.POSSIBLE_FORMATS,
        [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.PDF_417,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.AZTEC,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.ITF,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ],
      ],
    ]),
    {},
  );

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly decoded = signal<{ format: string; text: string } | null>(null);

  protected async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    this.error.set(null);
    this.decoded.set(null);
    if (!file) {
      return;
    }
    this.busy.set(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    }).catch(() => {
      this.error.set('Could not read that image.');
      this.busy.set(false);
      URL.revokeObjectURL(url);
      return;
    });

    try {
      const result = await this.reader.decodeFromImageElement(img);
      this.decoded.set({
        format: String(result.getBarcodeFormat()),
        text: result.getText(),
      });
    } catch (e) {
      if (e instanceof NotFoundException) {
        this.error.set('No barcode detected. Try a clearer crop or higher resolution.');
      } else {
        this.error.set(e instanceof Error ? e.message : 'Decode failed.');
      }
    } finally {
      this.busy.set(false);
      URL.revokeObjectURL(url);
    }
    input.value = '';
  }

  protected async copy(text: string): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(text);
  }
}
