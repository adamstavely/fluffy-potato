import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaSelectComponent, type SaSelectOption } from '../../../ui/sa-select.component';
import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import { WORLD_CLOCK_ZONES } from '../world-clock/world-clock-zones';

@Component({
  selector: 'sa-epoch-timestamp-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent, SaSelectComponent, SaButtonComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-5">
      <p class="text-sm text-slate-600">
        Convert between Unix epoch and human-readable times. Display uses the selected IANA time zone;
        ISO field is always UTC (Z).
      </p>

      <div class="flex flex-wrap items-end gap-3">
        <sa-select
          label="Time zone (for display)"
          [options]="zoneOptions"
          [(ngModel)]="displayZone"
          (ngModelChange)="bump()"
          fieldClass="min-w-[220px] max-w-md"
        />
        <sa-select
          label="Epoch unit"
          [options]="unitOptions"
          [(ngModel)]="epochUnit"
          (ngModelChange)="onEpochUnitChange()"
          fieldClass="w-[140px]"
        />
        <sa-button variant="stroked" (click)="setNow()">Now</sa-button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <sa-text-field
          label="Unix epoch"
          [placeholder]="epochUnit === 'seconds' ? '1710000000' : '1710000000000'"
          [(ngModel)]="epochText"
          (ngModelChange)="onEpochTextChange()"
          inputClass="font-mono text-sm"
          [spellcheck]="false"
          autocomplete="off"
        />
        <sa-text-field
          label="ISO 8601 (UTC)"
          placeholder="2026-03-29T12:00:00.000Z"
          [(ngModel)]="isoText"
          (ngModelChange)="onIsoTextChange()"
          inputClass="font-mono text-sm"
          [spellcheck]="false"
          autocomplete="off"
        />
      </div>

      @if (parseError(); as err) {
        <p class="text-sm text-rose-700">{{ err }}</p>
      }

      <div
        class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">In selected zone</p>
        <p class="mt-1 font-mono text-base">{{ formattedInZone() }}</p>
        <p class="mt-2 text-xs text-slate-600">
          Offset: {{ offsetLabel() }} · Local parts: {{ localParts() }}
        </p>
      </div>
    </div>
  `,
})
export class EpochTimestampToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly zoneOptions: SaSelectOption<string>[] = WORLD_CLOCK_ZONES.map((z) => ({
    value: z.id,
    label: `${z.label} (${z.id})`,
  }));

  protected readonly unitOptions: SaSelectOption<'seconds' | 'milliseconds'>[] = [
    { value: 'seconds', label: 'Seconds' },
    { value: 'milliseconds', label: 'Milliseconds' },
  ];

  protected displayZone = 'UTC';
  protected epochUnit: 'seconds' | 'milliseconds' = 'seconds';

  protected epochText = '';
  protected isoText = '';

  private readonly version = signal(0);
  private readonly epochMs = signal<number>(Date.now());

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  constructor() {
    this.syncFieldsFromEpoch();
  }

  protected setNow(): void {
    this.epochMs.set(Date.now());
    this.syncFieldsFromEpoch();
    this.bump();
  }

  protected onEpochUnitChange(): void {
    this.syncEpochFromMs();
    this.bump();
  }

  protected onEpochTextChange(): void {
    const raw = this.epochText.trim().replace(/\s+/g, '');
    if (raw === '') {
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return;
    }
    const ms = this.epochUnit === 'seconds' ? Math.round(n * 1000) : Math.round(n);
    this.epochMs.set(ms);
    this.isoText = new Date(ms).toISOString();
    this.bump();
  }

  protected onIsoTextChange(): void {
    const raw = this.isoText.trim();
    if (raw === '') {
      return;
    }
    const ms = Date.parse(raw);
    if (Number.isNaN(ms)) {
      return;
    }
    this.epochMs.set(ms);
    this.syncEpochFromMs();
    this.bump();
  }

  protected readonly parseError = computed(() => {
    this.version();
    const raw = this.isoText.trim();
    if (raw === '') {
      return null;
    }
    const ms = Date.parse(raw);
    if (Number.isNaN(ms)) {
      return 'ISO field is not a valid date string.';
    }
    return null;
  });

  protected readonly formattedInZone = computed(() => {
    this.version();
    const ms = this.epochMs();
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: this.displayZone,
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(new Date(ms));
    } catch {
      return new Date(ms).toISOString();
    }
  });

  protected readonly offsetLabel = computed(() => {
    this.version();
    const ms = this.epochMs();
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: this.displayZone,
        timeZoneName: 'longOffset',
      });
      const parts = dtf.formatToParts(new Date(ms));
      const raw = parts.find((p) => p.type === 'timeZoneName')?.value;
      return raw ? raw.replace(/^GMT/i, 'UTC') : '';
    } catch {
      return '';
    }
  });

  protected readonly localParts = computed(() => {
    this.version();
    const ms = this.epochMs();
    try {
      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: this.displayZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      return dtf.format(new Date(ms));
    } catch {
      return '';
    }
  });

  private syncFieldsFromEpoch(): void {
    const ms = this.epochMs();
    this.syncEpochFromMs();
    this.isoText = new Date(ms).toISOString();
  }

  private syncEpochFromMs(): void {
    const ms = this.epochMs();
    this.epochText =
      this.epochUnit === 'seconds' ? String(Math.floor(ms / 1000)) : String(Math.round(ms));
  }
}
