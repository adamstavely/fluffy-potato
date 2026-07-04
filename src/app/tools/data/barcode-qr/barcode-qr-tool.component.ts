import { Component, input, signal } from '@angular/core';
import type { BrowserMultiFormatReader } from '@zxing/browser';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaFileInputComponent } from '../../../ui/sa-file-input.component';
import type { ToolDefinition } from '../../models/tool.model';

@Component({
  selector: 'sa-barcode-qr-tool',
  standalone: true,
  imports: [SaFileInputComponent, SaButtonComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm text-[var(--app-text-secondary)]">
        Upload an image containing a barcode or QR code. Decoding runs locally in your browser.
      </p>

      <sa-file-input
        label="Image file"
        accept="image/*"
        triggerLabel="Choose image"
        (fileChange)="onFiles($event)"
      />

      @if (busy()) {
        <p class="text-sm text-[var(--app-text-secondary)]">Decoding…</p>
      }

      @if (error()) {
        <div class="rounded-lg border border-[color-mix(in_srgb,var(--app-warning)_45%,transparent)] bg-[var(--app-warning-subtle)] px-3 py-2 text-sm text-[var(--app-warning-text)]" role="alert">
          {{ error() }}
        </div>
      }

      @if (decoded(); as d) {
        <div class="rounded-lg border border-[color-mix(in_srgb,var(--app-success)_35%,transparent)] bg-[var(--app-success-subtle)] px-3 py-3 text-sm text-[var(--app-success-text)]">
          <p class="font-medium">Format: {{ d.format }}</p>
          <p class="mt-2 break-all font-mono text-xs">{{ d.text }}</p>
          <sa-button
            variant="text"
            ariaLabel="Copy decoded text"
            innerClass="mt-3 !text-xs !text-[var(--app-success-text)] !underline !decoration-[var(--app-success-text)]"
            (click)="copy(d.text)"
          >
            Copy text
          </sa-button>
        </div>
      }
    </div>
  `,
})
export class BarcodeQrToolComponent {
  readonly tool = input.required<ToolDefinition>();

  /** Constructed on first decode so the zxing bundle is only fetched when an image is chosen. */
  private reader: BrowserMultiFormatReader | null = null;

  private async getReader(): Promise<BrowserMultiFormatReader> {
    if (this.reader) {
      return this.reader;
    }
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ]);
    this.reader = new BrowserMultiFormatReader(
      new Map<number, unknown>([
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
    return this.reader;
  }

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly decoded = signal<{ format: string; text: string } | null>(null);

  protected async onFiles(files: FileList | null): Promise<void> {
    const file = files?.[0];
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
      const reader = await this.getReader();
      const result = await reader.decodeFromImageElement(img);
      this.decoded.set({
        format: String(result.getBarcodeFormat()),
        text: result.getText(),
      });
    } catch (e) {
      // zxing throws NotFoundException (name-tagged) when no code is present in the image.
      if (e instanceof Error && e.name === 'NotFoundException') {
        this.error.set('No barcode detected. Try a clearer crop or higher resolution.');
      } else {
        this.error.set(e instanceof Error ? e.message : 'Decode failed.');
      }
    } finally {
      this.busy.set(false);
      URL.revokeObjectURL(url);
    }
  }

  protected async copy(text: string): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(text);
  }
}
