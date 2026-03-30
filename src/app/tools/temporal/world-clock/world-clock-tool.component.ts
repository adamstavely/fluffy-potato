import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import { WORLD_CLOCK_ZONES } from './world-clock-zones';

const STORAGE_KEY = 'tools.world-clock.zones';

function loadZoneIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultZoneIds();
    }
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      return defaultZoneIds();
    }
    const ids = arr.filter((x): x is string => typeof x === 'string' && x.length > 0);
    return ids.length > 0 ? ids : defaultZoneIds();
  } catch {
    return defaultZoneIds();
  }
}

function defaultZoneIds(): string[] {
  let local: string;
  try {
    local = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  } catch {
    local = 'UTC';
  }
  const base = [local, 'UTC', 'Europe/London'];
  return [...new Set(base)];
}

function persistZoneIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function labelForZone(id: string): string {
  const found = WORLD_CLOCK_ZONES.find((z) => z.id === id);
  return found?.label ?? id;
}

/** Current offset vs UTC for an IANA zone (e.g. `UTC+05:30`, `UTC−05:00`). */
function formatUtcOffset(timeZone: string, date: Date): string {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = dtf.formatToParts(date);
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (!raw) {
      return '';
    }
    return raw.replace(/^GMT/i, 'UTC');
  } catch {
    return '';
  }
}

@Component({
  selector: 'sa-world-clock-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent, SaButtonComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-5">
      <p class="text-sm leading-relaxed text-slate-600">
        Times use your browser’s locale formatting. Zones are saved in this browser only.
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="min-w-0 flex-1">
          <sa-text-field
            label="Add time zone"
            type="search"
            placeholder="Search cities…"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white">
        @if (filteredZones().length === 0) {
          <p class="px-3 py-4 text-sm text-slate-500">No matches.</p>
        } @else {
          <ul class="divide-y divide-slate-100" role="listbox">
            @for (z of filteredZones(); track z.id) {
              <li>
                <sa-button
                  variant="text"
                  [ariaLabel]="'Add time zone ' + z.label"
                  [disabled]="isAdded(z.id)"
                  [innerClass]="
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm !normal-case hover:bg-slate-50 disabled:!opacity-40'
                  "
                  (click)="addZone(z.id)"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block">{{ z.label }}</span>
                    <span class="font-mono text-xs text-slate-500">{{ offsetForZone(z.id) }}</span>
                  </span>
                  <span class="shrink-0 font-mono text-xs text-slate-500">{{ z.id }}</span>
                </sa-button>
              </li>
            }
          </ul>
        }
      </div>

      <div
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        @for (id of zoneIds(); track id) {
          <div
            class="group relative flex flex-col overflow-hidden rounded-[var(--app-radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-card)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:border-[#d8d4ce] hover:shadow-[var(--app-shadow-card-hover)]"
          >
            <div
              class="h-1 shrink-0 bg-gradient-to-r from-[#d4cfc5] via-[#e8e4dc] to-[#d4cfc5]"
              aria-hidden="true"
            ></div>
            <div class="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <div class="mb-4 flex items-start justify-between gap-3 border-b border-[var(--app-border-subtle)] pb-3">
                <div class="min-w-0 flex-1">
                  <p
                    class="font-display text-[15px] font-semibold leading-tight tracking-tight text-[var(--app-text-primary)]"
                  >
                    {{ labelForZone(id) }}
                  </p>
                  <p class="mt-1 font-mono text-[11px] leading-snug text-[var(--app-text-muted)]">
                    {{ id }}
                  </p>
                  @if (clockParts()[id].utcOffset) {
                    <p
                      class="mt-2 inline-flex max-w-full items-center rounded-full bg-[var(--app-bg)] px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-[var(--app-text-secondary)] ring-1 ring-[var(--app-border-subtle)]"
                    >
                      {{ clockParts()[id].utcOffset }}
                    </p>
                  }
                </div>
                <sa-button
                  variant="text"
                  ariaLabel="Remove time zone from list"
                  innerClass="shrink-0 px-2 py-1 !text-xs !text-rose-700 hover:!bg-rose-50"
                  (click)="removeZone(id)"
                >
                  Remove
                </sa-button>
              </div>
              <div
                class="mt-auto rounded-[10px] bg-[var(--app-bg)] px-4 py-3 ring-1 ring-[var(--app-border-subtle)]"
              >
                <p
                  class="font-display text-[1.65rem] font-semibold leading-none tabular-nums tracking-tight text-[var(--app-text-primary)] sm:text-[1.75rem]"
                  [attr.aria-live]="'polite'"
                >
                  {{ clockParts()[id].time }}
                </p>
                <p
                  class="mt-2 text-[13px] leading-snug text-[var(--app-text-secondary)]"
                >
                  {{ clockParts()[id].date }}
                </p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class WorldClockToolComponent {
  readonly tool = input.required<ToolDefinition>();

  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchQuery = signal('');

  private readonly nowMs = signal(Date.now());
  protected readonly zoneIds = signal<string[]>(loadZoneIds());

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.nowMs.set(Date.now()));
  }

  protected filteredZones = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = WORLD_CLOCK_ZONES;
    if (!q) {
      return list;
    }
    return list.filter(
      (z) =>
        z.label.toLowerCase().includes(q) ||
        z.id.toLowerCase().includes(q),
    );
  });

  protected clockParts = computed(() => {
    const t = this.nowMs();
    const ids = this.zoneIds();
    const out: Record<string, { time: string; date: string; utcOffset: string }> = {};
    for (const id of ids) {
      try {
        const d = new Date(t);
        const timeFmt = new Intl.DateTimeFormat(undefined, {
          timeZone: id,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const dateFmt = new Intl.DateTimeFormat(undefined, {
          timeZone: id,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        out[id] = {
          time: timeFmt.format(d),
          date: dateFmt.format(d),
          utcOffset: formatUtcOffset(id, d),
        };
      } catch {
        out[id] = { time: 'Invalid zone', date: '', utcOffset: '' };
      }
    }
    return out;
  });

  protected labelForZone = labelForZone;

  protected offsetForZone(zoneId: string): string {
    return formatUtcOffset(zoneId, new Date(this.nowMs()));
  }

  protected isAdded(id: string): boolean {
    return this.zoneIds().includes(id);
  }

  protected addZone(id: string): void {
    if (this.zoneIds().includes(id)) {
      return;
    }
    const next = [...this.zoneIds(), id];
    this.zoneIds.set(next);
    persistZoneIds(next);
  }

  protected removeZone(id: string): void {
    const next = this.zoneIds().filter((z) => z !== id);
    if (next.length === 0) {
      return;
    }
    this.zoneIds.set(next);
    persistZoneIds(next);
  }
}
