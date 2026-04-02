import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaSelectComponent, type SaSelectOption } from '../../../ui/sa-select.component';
import { SaTextareaComponent } from '../../../ui/sa-textarea.component';
import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import { HOLIDAY_CALENDARS, type HolidayCalendarId, getHolidaySet } from './holidays';

function parseInstant(raw: string): number | null {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? null : ms;
}

/** Accepts YYYY-MM-DD only; interprets as UTC midnight. */
function parseDate(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const ms = Date.parse(`${t}T00:00:00.000Z`);
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

interface BdDetail {
  businessDays: number;
  calendarDays: number;
  weekendsSkipped: number;
  holidaysSkipped: number;
}

function countBusinessDaysDetailed(
  startMs: number,
  endMs: number,
  holidays: Set<string>,
): BdDetail {
  const a = Math.min(startMs, endMs);
  const b = Math.max(startMs, endMs);
  let calendarDays = 0;
  let weekendsSkipped = 0;
  let holidaysSkipped = 0;
  let businessDays = 0;
  for (let t = a; t <= b; t += 86400000) {
    calendarDays++;
    const wd = new Date(t).getUTCDay();
    if (wd === 0 || wd === 6) {
      weekendsSkipped++;
    } else {
      const iso = new Date(t).toISOString().slice(0, 10);
      if (holidays.has(iso)) {
        holidaysSkipped++;
      } else {
        businessDays++;
      }
    }
  }
  return {
    businessDays: startMs <= endMs ? businessDays : -businessDays,
    calendarDays,
    weekendsSkipped,
    holidaysSkipped,
  };
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
  imports: [FormsModule, SaTextFieldComponent, SaSelectComponent, SaTextareaComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-8">

      <!-- ── Section 1: Elapsed between two instants ───────────────────── -->
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

      <!-- ── Section 2: Business day counter ───────────────────────────── -->
      <section class="space-y-3 border-t border-slate-200 pt-6">
        <h2 class="text-base font-semibold text-slate-900">Business day counter</h2>
        <p class="text-sm text-slate-600">
          Counts working days between two dates, excluding weekends and an optional public-holiday
          calendar. Useful for SLA and compliance calculations. All computation runs in this browser
          session — no data is sent anywhere.
        </p>
        <div class="grid gap-4 md:grid-cols-2">
          <sa-text-field
            label="Start date"
            placeholder="2026-01-01"
            [(ngModel)]="bdStartIso"
            (ngModelChange)="bump()"
            inputClass="font-mono text-sm"
            [spellcheck]="false"
            autocomplete="off"
          />
          <sa-text-field
            label="End date"
            placeholder="2026-12-31"
            [(ngModel)]="bdEndIso"
            (ngModelChange)="bump()"
            inputClass="font-mono text-sm"
            [spellcheck]="false"
            autocomplete="off"
          />
        </div>
        <sa-select
          label="Holiday calendar"
          [options]="calendarOptions"
          [(ngModel)]="bdCalendar"
          (ngModelChange)="bump()"
          fieldClass="max-w-xs"
        />
        <sa-textarea
          label="Additional holidays (one YYYY-MM-DD per line)"
          placeholder="2026-04-03&#10;2026-12-28"
          [rows]="3"
          [(ngModel)]="bdCustom"
          (ngModelChange)="bump()"
          inputClass="font-mono text-sm"
          hint="Supplement the selected calendar, or use alone with 'None' to define your own set."
        />
        @if (bdError(); as err) {
          <p class="text-sm text-rose-700">{{ err }}</p>
        } @else {
          @if (bdResult(); as r) {
            <div class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm space-y-1">
              <p class="text-base font-semibold text-slate-900">
                {{ r.businessDays }} business {{ r.businessDays === 1 ? 'day' : 'days' }}
              </p>
              <p class="text-slate-500">
                {{ r.calendarDays }} calendar {{ r.calendarDays === 1 ? 'day' : 'days' }} total
              </p>
              <p class="text-slate-500">{{ r.weekendsSkipped }} weekend days excluded</p>
              @if (r.holidaysSkipped > 0) {
                <p class="text-slate-500">{{ r.holidaysSkipped }} public holidays excluded</p>
              }
            </div>
          }
        }
        @if (bdCalendar !== 'none') {
          <p class="text-xs text-slate-400">
            Holiday data is computed algorithmically. Exceptional substitutions (e.g. special
            bank holidays announced at short notice) are not included — add them in the field above.
          </p>
        }
      </section>

      <!-- ── Section 3: Add years / months / days ───────────────────────── -->
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

  // Section 1 state
  protected startIso = '';
  protected endIso = '';

  // Section 2 state
  protected bdStartIso = '';
  protected bdEndIso = '';
  protected bdCalendar: HolidayCalendarId = 'none';
  protected bdCustom = '';

  // Section 3 state
  protected baseIso = '';
  protected addYears = '0';
  protected addMonths = '0';
  protected addDays = '0';

  protected readonly calendarOptions: SaSelectOption<HolidayCalendarId>[] = HOLIDAY_CALENDARS.map(
    (c) => ({ value: c.id, label: c.label }),
  );

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  // ── Section 1: elapsed ──────────────────────────────────────────────────

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

  // ── Section 2: business day counter ────────────────────────────────────

  protected readonly bdError = computed((): string | null => {
    this.version();
    const startRaw = this.bdStartIso.trim();
    const endRaw = this.bdEndIso.trim();
    if (!startRaw || !endRaw) {
      return null;
    }
    if (parseDate(startRaw) === null) {
      return 'Invalid start date — use YYYY-MM-DD.';
    }
    if (parseDate(endRaw) === null) {
      return 'Invalid end date — use YYYY-MM-DD.';
    }
    return null;
  });

  protected readonly bdResult = computed((): BdDetail | null => {
    this.version();
    if (this.bdError() !== null) {
      return null;
    }
    const a = parseDate(this.bdStartIso.trim());
    const b = parseDate(this.bdEndIso.trim());
    if (a === null || b === null) {
      return null;
    }
    const startYear = new Date(Math.min(a, b)).getUTCFullYear();
    const endYear = new Date(Math.max(a, b)).getUTCFullYear();
    const holidays = getHolidaySet(this.bdCalendar, startYear, endYear);
    for (const line of this.bdCustom.split('\n')) {
      const d = line.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        holidays.add(d);
      }
    }
    return countBusinessDaysDetailed(a, b, holidays);
  });

  // ── Section 3: statute-style date addition ──────────────────────────────

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
