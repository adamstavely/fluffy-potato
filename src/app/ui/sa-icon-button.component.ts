import { booleanAttribute, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * Icon-only actions (replaces &lt;button&gt; with icon + aria-label).
 */
@Component({
  selector: 'sa-icon-button',
  standalone: true,
  imports: [MatButtonModule],
  host: { class: 'sa-icon-button' },
  template: `
    <button
      type="button"
      mat-icon-button
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-expanded]="ariaExpanded()"
      [attr.aria-pressed]="ariaPressed()"
      [class]="innerClass()"
    >
      <ng-content />
    </button>
  `,
})
export class SaIconButtonComponent {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input.required<string>();
  readonly ariaExpanded = input<boolean | undefined>(undefined);
  readonly ariaPressed = input<boolean | undefined>(undefined);
  readonly innerClass = input<string>('');
}
