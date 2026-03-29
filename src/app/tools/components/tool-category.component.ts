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
      <div class="mb-4 flex flex-wrap items-center gap-2.5">
        <span [class]="badgeClass()">{{ label() }}</span>
        <span class="text-xs font-normal text-[var(--app-text-muted)]"
          >{{ tools().length }} tool{{ tools().length !== 1 ? 's' : '' }}</span
        >
      </div>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5"
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

  protected badgeClass(): string {
    const base =
      'font-display inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]';
    switch (this.category()) {
      case 'language':
        return `${base} bg-[var(--app-tag-lang-bg)] text-[var(--app-tag-lang-text)]`;
      case 'data':
        return `${base} bg-[var(--app-tag-data-bg)] text-[var(--app-tag-data-text)]`;
      case 'identity':
        return `${base} bg-[var(--app-tag-sec-bg)] text-[var(--app-tag-sec-text)]`;
    }
  }
}
