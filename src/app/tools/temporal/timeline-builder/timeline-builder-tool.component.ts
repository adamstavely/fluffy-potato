import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

interface TimelineEvent {
  sortKey: number;
  label: string;
  rawWhen: string;
}

function parseEventLine(line: string): TimelineEvent | null {
  const s = line.trim();
  if (!s) {
    return null;
  }
  const tab = s.indexOf('\t');
  let whenRaw: string;
  let label: string;
  if (tab >= 0) {
    whenRaw = s.slice(0, tab).trim();
    label = s.slice(tab + 1).trim();
  } else {
    const pipe = s.indexOf('|');
    if (pipe >= 0) {
      whenRaw = s.slice(0, pipe).trim();
      label = s.slice(pipe + 1).trim();
    } else {
      const sp = s.indexOf(' ');
      if (sp < 0) {
        return null;
      }
      whenRaw = s.slice(0, sp).trim();
      label = s.slice(sp + 1).trim();
    }
  }
  if (!whenRaw || !label) {
    return null;
  }
  let sortKey = Date.parse(whenRaw);
  if (Number.isNaN(sortKey)) {
    if (/^\d+$/.test(whenRaw)) {
      const n = Number(whenRaw);
      sortKey = n > 1e12 ? n : n * 1000;
    } else {
      return null;
    }
  }
  return { sortKey, label, rawWhen: whenRaw };
}

@Component({
  selector: 'sa-timeline-builder-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm text-slate-600">
        One event per line: <span class="font-mono">when</span> then a tab, pipe, or first space, then
        <span class="font-mono">label</span>. “When” can be ISO 8601 or Unix seconds.
      </p>

      <sa-text-field
        label="Title (optional)"
        placeholder="Incident timeline"
        [(ngModel)]="timelineTitle"
        (ngModelChange)="bump()"
      />

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-700" for="tl-events">Events</label>
        <textarea
          id="tl-events"
          class="min-h-[180px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
          [(ngModel)]="raw"
          (ngModelChange)="bump()"
          [spellcheck]="false"
          autocomplete="off"
          placeholder="2024-01-05T14:00:00Z&#10;1640995200	Backup verified"
        ></textarea>
      </div>

      @if (parseErrors().length) {
        <ul class="list-inside list-disc text-sm text-rose-700">
          @for (e of parseErrors(); track e) {
            <li>{{ e }}</li>
          }
        </ul>
      }

      @if (sorted().length) {
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          @if (timelineTitle.trim()) {
            <h2 class="mb-4 text-base font-semibold text-slate-900">{{ timelineTitle.trim() }}</h2>
          }
          <ol class="relative border-s border-slate-200 ps-6">
            @for (ev of sorted(); track ev.sortKey + ev.label + $index) {
              <li class="mb-6 ms-2">
                <span
                  class="absolute -start-[9px] mt-1.5 h-3 w-3 rounded-full border border-white bg-slate-400"
                ></span>
                <time class="mb-1 block font-mono text-xs text-slate-500">{{
                  formatWhen(ev.sortKey)
                }}</time>
                <p class="text-sm text-slate-900">{{ ev.label }}</p>
              </li>
            }
          </ol>
        </div>
      }
    </div>
  `,
})
export class TimelineBuilderToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected timelineTitle = '';
  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly parseErrors = computed((): string[] => {
    this.version();
    const errs: string[] = [];
    const lines = this.raw.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (!line.trim()) {
        return;
      }
      if (!parseEventLine(line)) {
        errs.push(`Line ${i + 1}: could not parse date/time and label.`);
      }
    });
    return errs;
  });

  protected readonly sorted = computed((): TimelineEvent[] => {
    this.version();
    const events: TimelineEvent[] = [];
    for (const line of this.raw.split(/\r?\n/)) {
      const ev = parseEventLine(line);
      if (ev) {
        events.push(ev);
      }
    }
    return events.sort((a, b) => a.sortKey - b.sortKey);
  });

  protected formatWhen(ms: number): string {
    try {
      return new Date(ms).toISOString();
    } catch {
      return String(ms);
    }
  }
}
