import { Component, inject, input } from '@angular/core';

import type { ToolDefinition } from '../models/tool.model';
import { TOOL_SCAFFOLD_TOOL_ID } from '../tokens/tool-scaffold-context';

@Component({
  selector: 'sa-generic-tool-placeholder',
  standalone: true,
  template: `
    <div class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-700">
      <p class="text-sm font-medium">{{ tool().name }}</p>
      <p class="mt-1 text-xs text-slate-500">Stub tool surface — replace with real implementation.</p>
      @if (scaffoldToolId) {
        <p class="mt-3 font-mono text-xs text-slate-400">
          <span class="text-slate-500">TOOL_SCAFFOLD_TOOL_ID:</span> {{ scaffoldToolId }}
        </p>
      }
    </div>
  `,
})
export class GenericToolPlaceholderComponent {
  readonly tool = input.required<ToolDefinition>();

  /** Present when rendered under `sa-tool-scaffold` (tool host route). */
  protected readonly scaffoldToolId = inject(TOOL_SCAFFOLD_TOOL_ID, { optional: true });
}
