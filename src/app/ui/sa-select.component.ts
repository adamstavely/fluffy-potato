import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface SaSelectOption<T = unknown> {
  value: T;
  label: string;
}

let nextSelId = 0;

@Component({
  selector: 'sa-select',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SaSelectComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field
      appearance="outline"
      [ngClass]="'sa-mat-field w-full ' + fieldClass()"
      [subscriptSizing]="'dynamic'"
    >
      @if (label()) {
        <mat-label [class.sr-only]="labelHidden()">{{ label() }}</mat-label>
      }
      <mat-select
        [id]="resolvedId()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [multiple]="multiple()"
        [compareWith]="compareWith()"
        [panelClass]="panelClass() || ''"
        [ngModel]="value()"
        (ngModelChange)="onModelChange($event)"
        (closed)="onTouchedCb()"
      >
        @for (opt of options(); track trackOpt(opt)) {
          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class SaSelectComponent<T = unknown> implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly labelHidden = input(false);
  readonly placeholder = input<string>('');
  readonly options = input<SaSelectOption<T>[]>([]);
  readonly multiple = input(false);
  readonly panelClass = input<string | string[] | Set<string> | { [key: string]: any }>('');
  readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);
  readonly fieldId = input<string | undefined>(undefined);
  readonly fieldClass = input<string>('');
  readonly hostDisabled = input(false, { transform: booleanAttribute });

  protected readonly value = signal<T | null>(null);
  protected readonly disabled = signal(false);

  private readonly autoId = `sa-sel-${nextSelId++}`;

  protected resolvedId(): string {
    return this.fieldId() ?? this.autoId;
  }

  protected isDisabled(): boolean {
    return this.hostDisabled() || this.disabled();
  }

  protected trackOpt(opt: SaSelectOption<T>): unknown {
    return opt.value;
  }

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
  }

  protected onTouchedCb(): void {
    this.onTouched();
  }
}
