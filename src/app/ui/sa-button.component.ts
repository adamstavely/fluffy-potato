import { booleanAttribute, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

export type SaButtonVariant = 'text' | 'flat' | 'raised' | 'stroked';

/**
 * Replaces raw &lt;button&gt; with Material button semantics and focus styles.
 */
@Component({
  selector: 'sa-button',
  standalone: true,
  imports: [MatButtonModule],
  host: { class: 'sa-button' },
  template: `
    @switch (variant()) {
      @case ('text') {
        <button
          type="button"
          mat-button
          [disabled]="disabled()"
          [attr.role]="role() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-expanded]="ariaExpanded()"
          [attr.aria-pressed]="ariaPressed()"
          [attr.aria-selected]="ariaSelected() ?? null"
          [class]="innerClass()"
        >
          <ng-content />
        </button>
      }
      @case ('flat') {
        <button
          type="button"
          mat-flat-button
          [disabled]="disabled()"
          [attr.role]="role() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-expanded]="ariaExpanded()"
          [attr.aria-pressed]="ariaPressed()"
          [attr.aria-selected]="ariaSelected() ?? null"
          [class]="innerClass()"
        >
          <ng-content />
        </button>
      }
      @case ('raised') {
        <button
          type="button"
          mat-raised-button
          [disabled]="disabled()"
          [attr.role]="role() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-expanded]="ariaExpanded()"
          [attr.aria-pressed]="ariaPressed()"
          [attr.aria-selected]="ariaSelected() ?? null"
          [class]="innerClass()"
        >
          <ng-content />
        </button>
      }
      @case ('stroked') {
        <button
          type="button"
          mat-stroked-button
          [disabled]="disabled()"
          [attr.role]="role() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-expanded]="ariaExpanded()"
          [attr.aria-pressed]="ariaPressed()"
          [attr.aria-selected]="ariaSelected() ?? null"
          [class]="innerClass()"
        >
          <ng-content />
        </button>
      }
    }
  `,
})
export class SaButtonComponent {
  readonly variant = input<SaButtonVariant>('flat');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaExpanded = input<boolean | undefined>(undefined);
  readonly ariaPressed = input<boolean | undefined>(undefined);
  /** Optional ARIA role (e.g. tab for tablist children). */
  readonly role = input<string | undefined>(undefined);
  readonly ariaSelected = input<boolean | undefined>(undefined);
  readonly innerClass = input<string>('');
}
