import { booleanAttribute, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export type SaButtonVariant = 'text' | 'flat' | 'raised' | 'stroked';

/**
 * Replaces raw &lt;button&gt; with Material button semantics and focus styles.
 *
 * The projected label lives in a single `<ng-content>` captured by the `#label` template and
 * rendered into whichever variant is active. A previous version placed a separate `<ng-content>`
 * inside each `@case`; Angular only projects light-DOM content into ONE `<ng-content>`, so every
 * variant except the last (`stroked`) rendered an empty label. Keep exactly one `<ng-content>`.
 */
@Component({
  selector: 'sa-button',
  standalone: true,
  imports: [MatButtonModule, NgTemplateOutlet],
  host: { class: 'sa-button' },
  template: `
    <ng-template #label><ng-content /></ng-template>
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
          <ng-container [ngTemplateOutlet]="label" />
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
          <ng-container [ngTemplateOutlet]="label" />
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
          <ng-container [ngTemplateOutlet]="label" />
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
          <ng-container [ngTemplateOutlet]="label" />
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
