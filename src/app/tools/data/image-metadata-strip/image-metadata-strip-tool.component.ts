import { Component, input, OnDestroy, signal } from '@angular/core';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaFileInputComponent } from '../../../ui/sa-file-input.component';
import type { ToolDefinition } from '../../models/tool.model';
import { outputFilename, stripImageMetadata } from './strip-image-metadata';

interface StrippedItem {
  name: string;
  url: string;
}

@Component({
  selector: 'sa-image-metadata-strip-tool',
  standalone: true,
  imports: [SaFileInputComponent, SaButtonComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm text-slate-600">
        EXIF, GPS, and other embedded metadata are removed by re-encoding the image in your browser.
        Nothing is uploaded. JPEG and PNG stay the same format when your browser supports encoding;
        other types are saved as PNG. Animated GIFs become a single still (first frame).
      </p>

      <sa-file-input
        label="Image files"
        accept="image/*"
        [multiple]="true"
        triggerLabel="Choose images"
        [disabled]="busy()"
        (fileChange)="onFiles($event)"
      />

      @if (busy()) {
        <p class="text-sm text-slate-600">Processing…</p>
      }

      @if (error()) {
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {{ error() }}
        </div>
      }

      @if (results().length) {
        <ul class="space-y-2" role="list">
          @for (r of results(); track r.url) {
            <li
              class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
            >
              <span class="min-w-0 break-all font-mono text-xs">{{ r.name }}</span>
              <a
                class="shrink-0 font-medium text-[var(--app-accent)] underline decoration-slate-300 underline-offset-2 hover:decoration-[var(--app-accent)]"
                [href]="r.url"
                [download]="r.name"
              >
                Download
              </a>
            </li>
          }
        </ul>
        <sa-button variant="text" ariaLabel="Clear list" innerClass="!text-xs" (click)="clearResults()">
          Clear list
        </sa-button>
      }
    </div>
  `,
})
export class ImageMetadataStripToolComponent implements OnDestroy {
  readonly tool = input.required<ToolDefinition>();

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly results = signal<StrippedItem[]>([]);

  private readonly objectUrls = new Set<string>();

  protected async onFiles(files: FileList | null): Promise<void> {
    this.error.set(null);
    if (!files?.length) {
      return;
    }
    this.busy.set(true);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      this.error.set('No image files selected.');
      this.busy.set(false);
      return;
    }
    const next: StrippedItem[] = [];
    try {
      for (const file of list) {
        try {
          const { blob, mimeType } = await stripImageMetadata(file);
          const name = outputFilename(file.name, mimeType);
          const url = URL.createObjectURL(blob);
          this.objectUrls.add(url);
          next.push({ name, url });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Processing failed.';
          this.error.set(`${file.name}: ${msg}`);
          break;
        }
      }
      if (next.length) {
        this.results.update((prev) => [...next, ...prev]);
      }
    } finally {
      this.busy.set(false);
    }
  }

  protected clearResults(): void {
    for (const r of this.results()) {
      if (this.objectUrls.has(r.url)) {
        URL.revokeObjectURL(r.url);
        this.objectUrls.delete(r.url);
      }
    }
    this.results.set([]);
  }

  ngOnDestroy(): void {
    for (const u of this.objectUrls) {
      URL.revokeObjectURL(u);
    }
    this.objectUrls.clear();
  }
}
