import { Component, computed, effect, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaSelectComponent } from '../../../ui/sa-select.component';
import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';
import {
  convertValue,
  listMeasures,
  listUnitsForMeasure,
  measureLabel,
} from './unit-convert';

@Component({
  selector: 'sa-unit-converter-tool',
  standalone: true,
  imports: [FormsModule, SaSelectComponent, SaTextFieldComponent, SaButtonComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-5">
      <p class="text-sm leading-relaxed text-slate-600">
        Conversions run locally in your browser. Temperature uses the units supported by the converter (for example °C,
        °F, K).
      </p>

      <div class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <sa-select
          label="Measure"
          [options]="measureOptions()"
          [ngModel]="measure()"
          (ngModelChange)="measure.set($event)"
          fieldClass="sm:col-span-2"
        />

        <sa-select
          label="From"
          [options]="unitOptions()"
          [ngModel]="fromUnit()"
          (ngModelChange)="fromUnit.set($event)"
        />

        <sa-select
          label="To"
          [options]="unitOptions()"
          [ngModel]="toUnit()"
          (ngModelChange)="toUnit.set($event)"
        />

        <sa-text-field
          label="Value"
          inputmode="decimal"
          inputClass="font-mono text-sm"
          [ngModel]="valueText()"
          (ngModelChange)="onValueChange($event)"
          autocomplete="off"
          fieldClass="sm:col-span-2"
        />
      </div>

      @if (conversion().error) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
          {{ conversion().error }}
        </div>
      }

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
      >
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Result</p>
          <p class="font-mono text-lg font-semibold text-slate-900">{{ conversion().result }}</p>
        </div>
        <sa-button
          variant="stroked"
          ariaLabel="Copy conversion result"
          innerClass="px-3 py-2 text-sm font-medium"
          [disabled]="!canCopy()"
          (click)="copyResult()"
        >
          Copy
        </sa-button>
      </div>
    </div>
  `,
})
export class UnitConverterToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly measureLabelFn = measureLabel;

  readonly measure = signal(this.pickInitialMeasure());
  readonly fromUnit = signal('');
  readonly toUnit = signal('');
  readonly valueText = signal('1');

  protected readonly measures = signal(listMeasures());

  protected readonly units = computed(() => listUnitsForMeasure(this.measure()));

  protected readonly measureOptions = computed(() =>
    this.measures().map((m) => ({ value: m, label: this.measureLabelFn(m) })),
  );

  protected readonly unitOptions = computed(() =>
    this.units().map((u) => ({ value: u.abbr, label: `${u.singular} (${u.abbr})` })),
  );

  protected readonly conversion = computed((): { result: string; error: string | null } => {
    const raw = this.valueText().trim();
    if (raw === '' || raw === '-') {
      return { result: '—', error: null };
    }
    const v = Number(raw);
    if (!Number.isFinite(v)) {
      return { result: '—', error: null };
    }
    const from = this.fromUnit();
    const to = this.toUnit();
    if (!from || !to) {
      return { result: '—', error: null };
    }
    try {
      const out = convertValue(v, this.measure(), from, to);
      if (!Number.isFinite(out)) {
        return { result: '—', error: null };
      }
      return { result: formatResult(out), error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Conversion failed';
      return { result: '—', error: msg };
    }
  });

  constructor() {
    effect(() => {
      const m = this.measure();
      const u = listUnitsForMeasure(m);
      if (u.length === 0) {
        this.fromUnit.set('');
        this.toUnit.set('');
        return;
      }
      let from = this.fromUnit();
      if (!u.some((x) => x.abbr === from)) {
        from = u[0].abbr;
        this.fromUnit.set(from);
      }
      const to = this.toUnit();
      if (!u.some((x) => x.abbr === to) || to === from) {
        const nextTo = u.find((x) => x.abbr !== from) ?? u[0];
        this.toUnit.set(nextTo.abbr);
      }
    });
  }

  protected onValueChange(v: string): void {
    this.valueText.set(v);
  }

  protected canCopy(): boolean {
    const c = this.conversion();
    return c.result !== '—' && !c.error;
  }

  protected copyResult(): void {
    const r = this.conversion().result;
    if (r === '—') {
      return;
    }
    void navigator.clipboard.writeText(r);
  }

  private pickInitialMeasure(): string {
    const all = listMeasures();
    return all.includes('length') ? 'length' : all[0] ?? 'length';
  }
}

function formatResult(n: number): string {
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-6 || abs >= 1e12)) {
    return n.toExponential(6);
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 10 }).format(n);
}
