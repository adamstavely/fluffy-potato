import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormFieldModule, type FloatLabelType } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

let nextTextFieldId = 0;

/**
 * Text input with visible or screen-reader-only label (WCAG 3.3.2 Labels or Instructions).
 */
@Component({
  selector: 'sa-text-field',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SaTextFieldComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field
      appearance="outline"
      [floatLabel]="floatLabel()"
      [ngClass]="'sa-mat-field w-full ' + fieldClass()"
      [subscriptSizing]="'dynamic'"
    >
      @if (label()) {
        <mat-label [class.sr-only]="labelHidden()" [attr.id]="labelHidden() ? null : labelIdValue()">
          {{ label() }}
        </mat-label>
      }
      <ng-content select="[matPrefix]" />
      <input
        matInput
        [id]="resolvedInputId()"
        [type]="type()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.spellcheck]="spellcheck()"
        [attr.name]="name() || null"
        [attr.aria-label]="effectiveAriaLabel()"
        [attr.aria-labelledby]="ariaLabelledby() || null"
        [attr.readonly]="readOnly() || null"
        [attr.min]="min() ?? null"
        [attr.max]="max() ?? null"
        [attr.step]="step() ?? null"
        [attr.inputmode]="inputmode() || null"
        [class]="inputClass()"
        [disabled]="isDisabled()"
        [ngModel]="value()"
        (ngModelChange)="onModelChange($event)"
        (blur)="onBlur()"
      />
      <ng-content select="[matSuffix]" />
    </mat-form-field>
  `,
})
export class SaTextFieldComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  /** `always`: label stays in the outline notch (recommended with leading icons). `auto`: Material default. */
  readonly floatLabel = input<FloatLabelType>('auto');
  /** When true, label is visually hidden but exposed to assistive tech. */
  readonly labelHidden = input(false);
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly autocomplete = input<string | undefined>(undefined);
  readonly spellcheck = input<boolean | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly readOnly = input(false);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input<number | undefined>(undefined);
  readonly inputmode = input<string | undefined>(undefined);
  /** Extra classes on the native input (e.g. font-mono). */
  readonly inputClass = input<string>('');
  /** Extra classes on mat-form-field (layout). */
  readonly fieldClass = input<string>('');
  /** Stable id for the input element (for label association). */
  readonly fieldId = input<string | undefined>(undefined);
  /** Disables the field from the parent (e.g. while a timer runs). */
  readonly hostDisabled = input(false, { transform: booleanAttribute });

  protected readonly value = signal<string>('');
  protected readonly disabled = signal(false);

  private readonly uid = nextTextFieldId++;
  protected readonly labelIdValue = signal(`sa-tf-l-${this.uid}`);
  private readonly autoInputId = `sa-tf-${this.uid}`;

  protected resolvedInputId(): string {
    return this.fieldId() ?? this.autoInputId;
  }

  protected isDisabled(): boolean {
    return this.hostDisabled() || this.disabled();
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

  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledby = input<string | undefined>(undefined);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | number | null): void {
    this.value.set(v == null || v === '' ? '' : String(v));
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
    this.value.set(v);
    this.onChange(v);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
