import { Component, input, output } from '@angular/core';

import type { ToolCategory, ToolDefinition } from '../models/tool.model';
import { TOOL_CATEGORY_LABEL } from '../models/tool.model';
import { ToolCardComponent } from './tool-card.component';

@Component({
  selector: 'sa-tool-category',
  standalone: true,
  imports: [ToolCardComponent],
  template: `
    <section class="mb-11" [attr.aria-labelledby]="headingId()">
      <h2
        [id]="headingId()"
        class="font-display mb-3.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--app-text-secondary)]"
      >
        <span>{{ label() }} | {{ tools().length }} tool{{ tools().length !== 1 ? 's' : '' }}</span>
        <span class="h-px flex-1 bg-[var(--app-border)]" aria-hidden="true"></span>
      </h2>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5 2xl:grid-cols-4"
        role="list"
      >
        @for (tool of tools(); track tool.id) {
          <sa-tool-card
            role="listitem"
            [tool]="tool"
            [isFavorited]="favoriteIds().has(tool.id)"
            [isDrawerActive]="activeToolId() === tool.id"
            (favoriteToggle)="favoriteToggle.emit(tool.id)"
            (drawerOpen)="drawerOpen.emit(tool)"
            (launched)="launched.emit($event)"
          />
        }
      </div>
    </section>
  `,
})
export class ToolCategoryComponent {
  readonly category = input.required<ToolCategory>();
  readonly tools = input.required<ToolDefinition[]>();
  readonly favoriteIds = input.required<Set<string>>();
  readonly activeToolId = input<string | null>(null);

  readonly favoriteToggle = output<string>();
  readonly drawerOpen = output<ToolDefinition>();
  readonly launched = output<{ tool: ToolDefinition; source: 'card' | 'drawer' | 'favorites_chip' }>();

  protected headingId(): string {
    return `cat-${this.category()}`;
  }

  protected label(): string {
    return TOOL_CATEGORY_LABEL[this.category()];
  }
}
