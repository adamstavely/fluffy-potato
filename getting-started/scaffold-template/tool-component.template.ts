import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

/**
 * Standalone tool host — replace the placeholder UI with real behavior.
 * Use `sa-*` UI components from `src/app/ui/` instead of raw HTML form controls.
 */
@Component({
  selector: 'sa-__TOOL_ID__-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">{{ tool().description }}</p>

      <sa-text-field
        label="Input"
        placeholder="…"
        [(ngModel)]="draft"
        inputClass="font-mono text-sm"
        [spellcheck]="false"
        autocomplete="off"
      />
    </div>
  `,
})
export class __TOOL_CLASS__ {
  readonly tool = input.required<ToolDefinition>();

  protected draft = '';
}
