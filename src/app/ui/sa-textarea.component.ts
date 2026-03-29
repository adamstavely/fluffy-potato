import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

let nextTaId = 0;

@Component({
  selector: 'sa-textarea',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SaTextareaComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field
      appearance="outline"
      floatLabel="always"
      [ngClass]="'sa-mat-field w-full ' + fieldClass()"
      [subscriptSizing]="'dynamic'"
    >
      @if (label()) {
        <mat-label [class.sr-only]="labelHidden()">{{ label() }}</mat-label>
      }
      <textarea
        matInput
        [id]="resolvedId()"
        [rows]="rows()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.name]="name() || null"
        [attr.aria-label]="effectiveAriaLabel()"
        [attr.spellcheck]="spellcheck()"
        [attr.aria-labelledby]="ariaLabelledby() || null"
        [class]="inputClass()"
        [readonly]="readOnly()"
        [disabled]="disabled()"
        [ngModel]="value()"
        (ngModelChange)="onModelChange($event)"
        (blur)="onBlur()"
      ></textarea>
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
})
export class SaTextareaComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  /** Helper / subscript text below the field (Material subscript spacing). */
  readonly hint = input<string | undefined>(undefined);
  readonly labelHidden = input(false);
  readonly placeholder = input<string>('');
  readonly rows = input(4);
  readonly name = input<string | undefined>(undefined);
  readonly autocomplete = input<string | undefined>(undefined);
  readonly spellcheck = input<boolean | undefined>(undefined);
  readonly fieldId = input<string | undefined>(undefined);
  readonly fieldClass = input<string>('');
  readonly inputClass = input<string>('');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledby = input<string | undefined>(undefined);
  readonly readOnly = input(false, { transform: booleanAttribute });

  protected readonly value = signal<string>('');
  protected readonly disabled = signal(false);

  private readonly autoId = `sa-ta-${nextTaId++}`;

  protected resolvedId(): string {
    return this.fieldId() ?? this.autoId;
  }

  protected effectiveAriaLabel(): string | null {
    if (this.ariaLabelledby()) {
      return null;
    }
    if (this.labelHidden() && this.label()) {
      return this.label()!;
    }
    if (this.ariaLabel()) {
      return this.ariaLabel()!;
    }
    return null;
  }

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onModelChange(v: string): void {
    if (this.readOnly()) {
      return;
    }
    this.value.set(v);
    this.onChange(v);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
