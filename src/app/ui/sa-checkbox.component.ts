import { booleanAttribute, Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'sa-checkbox',
  standalone: true,
  imports: [MatCheckboxModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SaCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <mat-checkbox
      [disabled]="isDisabled()"
      [ngModel]="value()"
      (ngModelChange)="onModelChange($event)"
      (blur)="onBlur()"
    >
      <ng-content />
    </mat-checkbox>
  `,
})
export class SaCheckboxComponent implements ControlValueAccessor {
  /** Static disabled from parent (merged with reactive disabled from forms). */
  readonly hostDisabled = input(false, { transform: booleanAttribute });

  protected readonly value = signal(false);
  protected readonly disabledState = signal(false);

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: boolean | null): void {
    this.value.set(!!v);
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  protected isDisabled(): boolean {
    return this.hostDisabled() || this.disabledState();
  }

  protected onModelChange(v: boolean): void {
    this.value.set(v);
    this.onChange(v);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
