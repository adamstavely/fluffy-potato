import { booleanAttribute, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

let nextFileId = 0;

/**
 * Accessible file picker: label + native file input (visually hidden) + visible trigger.
 */
@Component({
  selector: 'sa-file-input',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="flex flex-col gap-1">
      <span
        [id]="labelId"
        [class]="labelHidden() ? 'sr-only' : 'block text-xs font-medium text-slate-700'"
        >{{ label() }}</span
      >
      <input
        #fileEl
        type="file"
        class="sr-only"
        tabindex="-1"
        [id]="inputId"
        [disabled]="disabled()"
        [attr.accept]="accept() || null"
        [attr.aria-labelledby]="labelId"
        (change)="emitFiles($event)"
      />
      <button
        type="button"
        mat-stroked-button
        class="w-fit"
        [disabled]="disabled()"
        (click)="fileEl.click()"
      >
        {{ triggerLabel() }}
      </button>
    </div>
  `,
})
export class SaFileInputComponent {
  readonly label = input.required<string>();
  readonly triggerLabel = input<string>('Choose file');
  readonly accept = input<string | undefined>(undefined);
  /** Hide the label visually; it remains for `aria-labelledby`. */
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly fileChange = output<FileList | null>();

  private readonly uid = nextFileId++;
  protected readonly labelId = `sa-file-l-${this.uid}`;
  protected readonly inputId = `sa-file-${this.uid}`;

  protected emitFiles(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.fileChange.emit(t.files);
  }
}
