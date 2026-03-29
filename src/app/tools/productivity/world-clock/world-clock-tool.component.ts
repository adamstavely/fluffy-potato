import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';

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

@Component({
  selector: 'sa-world-clock-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-5">
      <p class="text-sm leading-relaxed text-slate-600">
        Times use your browser’s locale formatting. Zones are saved in this browser only.
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="block min-w-0 flex-1 text-xs font-medium text-slate-700">
          Add time zone
          <input
            type="search"
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Search cities…"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            autocomplete="off"
          />
        </label>
      </div>

      <div class="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white">
        @if (filteredZones().length === 0) {
          <p class="px-3 py-4 text-sm text-slate-500">No matches.</p>
        } @else {
          <ul class="divide-y divide-slate-100" role="listbox">
            @for (z of filteredZones(); track z.id) {
              <li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40"
                  [disabled]="isAdded(z.id)"
                  (click)="addZone(z.id)"
                >
                  <span>{{ z.label }}</span>
                  <span class="font-mono text-xs text-slate-500">{{ z.id }}</span>
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        @for (id of zoneIds(); track id) {
          <div
            class="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div>
                <p class="font-medium text-slate-900">{{ labelForZone(id) }}</p>
                <p class="font-mono text-xs text-slate-500">{{ id }}</p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-md px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                (click)="removeZone(id)"
              >
                Remove
              </button>
            </div>
            <p
              class="font-display text-2xl font-semibold tabular-nums text-slate-900"
              [attr.aria-live]="'polite'"
            >
              {{ clockParts()[id].time }}
            </p>
            <p class="mt-1 text-sm text-slate-600">{{ clockParts()[id].date }}</p>
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
    const out: Record<string, { time: string; date: string }> = {};
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
        };
      } catch {
        out[id] = { time: 'Invalid zone', date: '' };
      }
    }
    return out;
  });

  protected labelForZone = labelForZone;

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
