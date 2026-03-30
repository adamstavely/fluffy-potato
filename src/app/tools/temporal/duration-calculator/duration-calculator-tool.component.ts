import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

function parseInstant(raw: string): number | null {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? null : ms;
}

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const sign = ms < 0 ? '−' : '';
  const s = Math.floor(abs / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (h || days) {
    parts.push(`${h}h`);
  }
  if (m || h || days) {
    parts.push(`${m}m`);
  }
  parts.push(`${sec}s`);
  return sign + parts.join(' ');
}

function countBusinessDaysUtc(startMs: number, endMs: number): number {
  const a = Math.min(startMs, endMs);
  const b = Math.max(startMs, endMs);
  const startDay = new Date(a);
  startDay.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(b);
  endDay.setUTCHours(0, 0, 0, 0);
  let count = 0;
  for (let t = startDay.getTime(); t <= endDay.getTime(); t += 86400000) {
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) {
      count++;
    }
  }
  return startMs <= endMs ? count : -count;
}

function addCalendarUtc(d: Date, years: number, months: number, days: number): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear() + years,
      d.getUTCMonth() + months,
      d.getUTCDate() + days,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  );
}

@Component({
  selector: 'sa-duration-calculator-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-8">
      <section class="space-y-3">
        <h2 class="text-base font-semibold text-slate-900">Elapsed between two instants</h2>
        <p class="text-sm text-slate-600">
          Paste ISO 8601 strings (include offset or Z). Durations use absolute span; business-day
          counts use UTC midnights and exclude Saturdays and Sundays (not holidays).
        </p>
        <div class="grid gap-4 md:grid-cols-2">
          <sa-text-field
            label="Start"
            placeholder="2026-01-01T00:00:00.000Z"
            [(ngModel)]="startIso"
            (ngModelChange)="bump()"
            inputClass="font-mono text-sm"
            [spellcheck]="false"
            autocomplete="off"
          />
          <sa-text-field
            label="End"
            placeholder="2026-12-31T23:59:59.999Z"
            [(ngModel)]="endIso"
            (ngModelChange)="bump()"
            inputClass="font-mono text-sm"
            [spellcheck]="false"
            autocomplete="off"
          />
        </div>
        @if (elapsedError(); as err) {
          <p class="text-sm text-rose-700">{{ err }}</p>
        } @else {
          @if (elapsed(); as e) {
            <div class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              <p><span class="text-slate-500">Total:</span> {{ e.human }}</p>
              <p class="mt-1 font-mono text-xs text-slate-700">{{ e.ms }} ms</p>
              <p class="mt-2">
                <span class="text-slate-500">Weekdays (Mon–Fri, UTC days):</span>
                {{ e.businessDays }}
              </p>
            </div>
          }
        }
      </section>

      <section class="space-y-3 border-t border-slate-200 pt-6">
        <h2 class="text-base font-semibold text-slate-900">Add years / months / days (statute-style)</h2>
        <p class="text-xs leading-relaxed text-slate-500">
          Adds calendar components in UTC to the parsed start instant. This is a generic date calculator
          only—not legal advice; statutes and filing rules vary by jurisdiction.
        </p>
        <sa-text-field
          label="Start instant"
          placeholder="2024-06-15T12:00:00.000Z"
          [(ngModel)]="baseIso"
          (ngModelChange)="bump()"
          inputClass="font-mono text-sm"
          [spellcheck]="false"
          autocomplete="off"
        />
        <div class="flex flex-wrap gap-4">
          <sa-text-field
            label="Years"
            type="number"
            [(ngModel)]="addYears"
            (ngModelChange)="bump()"
            fieldClass="w-[100px]"
          />
          <sa-text-field
            label="Months"
            type="number"
            [(ngModel)]="addMonths"
            (ngModelChange)="bump()"
            fieldClass="w-[100px]"
          />
          <sa-text-field
            label="Days"
            type="number"
            [(ngModel)]="addDays"
            (ngModelChange)="bump()"
            fieldClass="w-[100px]"
          />
        </div>
        @if (statuteError(); as err) {
          <p class="text-sm text-rose-700">{{ err }}</p>
        } @else {
          @if (statuteResult(); as r) {
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              <p class="font-mono text-xs break-all">{{ r.iso }}</p>
              <p class="mt-1 text-xs text-emerald-800">{{ r.human }}</p>
            </div>
          }
        }
      </section>
    </div>
  `,
})
export class DurationCalculatorToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected startIso = '';
  protected endIso = '';
  protected baseIso = '';
  protected addYears = '0';
  protected addMonths = '0';
  protected addDays = '0';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly elapsedError = computed((): string | null => {
    this.version();
    const a = parseInstant(this.startIso);
    const b = parseInstant(this.endIso);
    if (a === null || this.startIso.trim() === '') {
      return 'Enter a valid start instant.';
    }
    if (b === null || this.endIso.trim() === '') {
      return 'Enter a valid end instant.';
    }
    return null;
  });

  protected readonly elapsed = computed(() => {
    this.version();
    if (this.elapsedError()) {
      return null;
    }
    const a = parseInstant(this.startIso)!;
    const b = parseInstant(this.endIso)!;
    const ms = b - a;
    return {
      ms,
      human: formatDuration(ms),
      businessDays: countBusinessDaysUtc(a, b),
    };
  });

  protected readonly statuteError = computed((): string | null => {
    this.version();
    const base = parseInstant(this.baseIso);
    if (base === null || this.baseIso.trim() === '') {
      return 'Enter a valid start instant.';
    }
    return null;
  });

  protected readonly statuteResult = computed(() => {
    this.version();
    if (this.statuteError()) {
      return null;
    }
    const base = parseInstant(this.baseIso)!;
    const y = Number(this.addYears) || 0;
    const mo = Number(this.addMonths) || 0;
    const d = Number(this.addDays) || 0;
    const out = addCalendarUtc(new Date(base), y, mo, d);
    return {
      iso: out.toISOString(),
      human: out.toUTCString(),
    };
  });
}
