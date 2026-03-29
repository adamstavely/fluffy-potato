import { booleanAttribute, Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

/**
 * Accessible range input (Material slider) for percentages and similar bounded values.
 */
@Component({
  selector: 'sa-slider',
  standalone: true,
  imports: [MatSliderModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SaSliderComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-wrap items-center gap-2">
      @if (label()) {
        <span [id]="labelId" class="text-xs text-slate-700">{{ label() }}</span>
      }
      <mat-slider
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [disabled]="isDisabled()"
        discrete
        [attr.aria-labelledby]="label() ? labelId : null"
        [attr.aria-valuetext]="value() + (valueSuffix() || '')"
      >
        <input
          matSliderThumb
          [ngModel]="value()"
          (ngModelChange)="onChange($event)"
        />
      </mat-slider>
      @if (showValue()) {
        <span class="font-mono tabular-nums text-xs text-slate-600" aria-hidden="true">{{
          value() + (valueSuffix() || '')
        }}</span>
      }
    </div>
  `,
})
export class SaSliderComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly showValue = input(true);
  /** Shown after the numeric value (e.g. "%"). */
  readonly valueSuffix = input<string | undefined>(undefined);
  readonly hostDisabled = input(false, { transform: booleanAttribute });

  protected readonly value = signal(0);
  private static nextId = 0;
  private readonly uid = SaSliderComponent.nextId++;
  protected readonly labelId = `sa-slider-l-${this.uid}`;

  private onChangeFn: (v: number) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private disabledState = false;

  writeValue(v: number | null): void {
    this.value.set(v ?? 0);
  }

  registerOnChange(fn: (v: number) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState = isDisabled;
  }

  protected isDisabled(): boolean {
    return this.hostDisabled() || this.disabledState;
  }

  protected onChange(v: number): void {
    this.value.set(v);
    this.onChangeFn(v);
    this.onTouchedFn();
  }
}
