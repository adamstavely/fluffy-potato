import { Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

export interface SaRadioOption<T extends string | number = string> {
  value: T;
  label: string;
}

@Component({
  selector: 'sa-radio-group',
  standalone: true,
  imports: [MatRadioModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SaRadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <mat-radio-group
      [name]="name() ?? ''"
      [disabled]="disabled()"
      [ngModel]="value()"
      (ngModelChange)="onModelChange($event)"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
    >
      @for (opt of options(); track opt.value) {
        <mat-radio-button [value]="opt.value">{{ opt.label }}</mat-radio-button>
      }
    </mat-radio-group>
  `,
})
export class SaRadioGroupComponent<T extends string | number = string>
  implements ControlValueAccessor
{
  readonly name = input<string | undefined>(undefined);
  readonly options = input<SaRadioOption<T>[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledby = input<string | undefined>(undefined);

  protected readonly value = signal<T | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (v: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: T | null): void {
    this.value.set(v);
  }

  registerOnChange(fn: (v: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onModelChange(v: T | null): void {
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }
}
