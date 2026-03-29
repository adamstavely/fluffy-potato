import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { ExternalLink, PanelRightClose, PanelRightOpen, Star } from 'lucide-angular';

import { ToolCardViewDirective } from '../directives/tool-card-view.directive';
import { ToolsIconsModule } from '../tools-icons.module';
import type { ToolCategory, ToolDefinition } from '../models/tool.model';
import { TOOL_CATEGORY_LABEL } from '../models/tool.model';
import { ToolLaunchService } from '../services/tool-launch.service';

@Component({
  selector: 'sa-tool-card',
  standalone: true,
  imports: [CommonModule, ToolsIconsModule, ToolCardViewDirective],
  template: `
    <article
      saTrackCardView
      [saTrackCardViewToolId]="tool().id"
      [saTrackCardViewCategory]="categoryLabel()"
      class="relative flex h-full cursor-default flex-col rounded-[var(--app-radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-card)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:border-[#d8d4ce] hover:shadow-[var(--app-shadow-card-hover)]"
      [class.border-[var(--app-accent)]]="isDrawerActive()"
      [ngClass]="
        isDrawerActive()
          ? 'shadow-[0_0_0_3px_rgba(26,25,23,0.06),var(--app-shadow-card-hover)]'
          : ''
      "
    >
      <div class="mb-3 flex items-start justify-between">
        <div class="flex min-w-0 items-center gap-2.5">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-[9px] text-[var(--app-text-primary)]"
          >
            <lucide-icon [name]="tool().icon" [size]="36" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h3
              class="font-display truncate text-[15px] font-semibold leading-tight tracking-tight text-[var(--app-text-primary)]"
            >
              {{ tool().name }}
            </h3>
            <p class="mt-0.5 font-mono text-[11px] font-normal text-[var(--app-text-muted)]">
              v{{ tool().version }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-bg)] hover:text-[#d4af37]"
          [class.text-[#d4af37]]="isFavorited()"
          [attr.aria-label]="isFavorited() ? 'Remove from favorites' : 'Add to favorites'"
          (click)="favoriteToggle.emit(); $event.stopPropagation()"
        >
          <lucide-icon
            [img]="Star"
            [size]="15"
            aria-hidden="true"
            [class]="isFavorited() ? 'fill-[#d4af37]' : ''"
          />
        </button>
      </div>

      <p
        class="mb-[18px] flex-1 font-light text-[13.5px] leading-[1.55] tracking-tight text-[var(--app-text-secondary)] [letter-spacing:-0.01em]"
      >
        {{ tool().shortDescription }}
      </p>

      <div class="mt-auto flex items-center gap-2">
        <a
          class="inline-flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-[7px] border-0 bg-[var(--app-accent)] font-sans text-[13px] font-medium tracking-tight text-[var(--app-accent-fg)] no-underline transition-opacity hover:opacity-85"
          [href]="launchHref()"
          target="_blank"
          rel="noopener noreferrer"
          [attr.aria-label]="'Launch ' + tool().name"
          (click)="onLaunch('card')"
        >
          <lucide-icon [img]="ExternalLink" [size]="13" aria-hidden="true" />
          Launch
        </a>
        <button
          type="button"
          class="inline-flex h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-[7px] border border-[var(--app-border)] bg-transparent px-3 font-sans text-[13px] font-medium tracking-tight text-[var(--app-text-secondary)] transition-colors hover:border-[#c4c0ba] hover:text-[var(--app-text-primary)]"
          [class.border-[var(--app-accent)]]="isDrawerActive()"
          [class.bg-[var(--app-accent)]]="isDrawerActive()"
          [class.text-[var(--app-accent-fg)]]="isDrawerActive()"
          [attr.aria-expanded]="isDrawerActive()"
          [attr.aria-label]="isDrawerActive() ? 'Close tool details' : 'View tool details'"
          (click)="drawerOpen.emit(tool())"
        >
          View Details
          @if (isDrawerActive()) {
            <lucide-icon [img]="PanelRightClose" [size]="15" aria-hidden="true" />
          } @else {
            <lucide-icon [img]="PanelRightOpen" [size]="15" aria-hidden="true" />
          }
        </button>
      </div>
    </article>
  `,
})
export class ToolCardComponent {
  protected readonly Star = Star;
  protected readonly ExternalLink = ExternalLink;
  protected readonly PanelRightOpen = PanelRightOpen;
  protected readonly PanelRightClose = PanelRightClose;

  private readonly launch = inject(ToolLaunchService);

  readonly tool = input.required<ToolDefinition>();

  /** Memoized: avoid calling `getLaunchHref` on every change-detection pass (template-bound). */
  protected readonly launchHref = computed(() => this.launch.getLaunchHref(this.tool()));
  readonly isFavorited = input(false);
  readonly isDrawerActive = input(false);

  readonly favoriteToggle = output<void>();
  readonly drawerOpen = output<ToolDefinition>();
  readonly launched = output<{ tool: ToolDefinition; source: 'card' }>();

  protected categoryLabel(): string {
    const c = this.tool().category as ToolCategory;
    return TOOL_CATEGORY_LABEL[c] ?? String(c);
  }

  protected onLaunch(source: 'card'): void {
    this.launched.emit({ tool: this.tool(), source });
  }
}
