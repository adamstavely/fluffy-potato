import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ExternalLink, Star, X } from 'lucide-angular';

import { SaIconButtonComponent } from '../../ui/sa-icon-button.component';
import { ToolsIconsModule } from '../tools-icons.module';
import { ToolLaunchService } from '../services/tool-launch.service';
import type { ChangelogBump, ToolDefinition } from '../models/tool.model';
import { TOOL_CATEGORY_LABEL } from '../models/tool.model';

@Component({
  selector: 'sa-tool-detail-drawer',
  standalone: true,
  imports: [ToolsIconsModule, RouterLink, SaIconButtonComponent],
  template: `
    @if (tool()) {
      <div
        class="flex h-full min-h-0 flex-col bg-[var(--app-surface)]"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'drawer-title-' + tool()!.id"
      >
        <div
          class="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--app-border-subtle)] px-6 pb-5 pt-6"
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-[9px] text-[var(--app-text-primary)]"
            >
              <lucide-icon [name]="tool()!.icon" [size]="36" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <h2
                class="font-display text-[17px] font-bold leading-tight tracking-[-0.03em] text-[var(--app-text-primary)]"
                [id]="'drawer-title-' + tool()!.id"
              >
                {{ tool()!.name }}
              </h2>
              <p class="mt-0.5 font-mono text-xs text-[var(--app-text-muted)]">v{{ tool()!.version }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <sa-icon-button
              [ariaLabel]="isFavorited() ? 'Remove from favorites' : 'Add to favorites'"
              [innerClass]="drawerFavBtnClass()"
              (click)="favoriteToggle.emit(); $event.stopPropagation()"
            >
              <lucide-icon
                [img]="Star"
                [size]="18"
                aria-hidden="true"
                [class]="
                  isFavorited()
                    ? 'fill-[var(--app-favorite-gold)] stroke-[var(--app-favorite-gold)]'
                    : ''
                "
              />
            </sa-icon-button>
            <sa-icon-button
              ariaLabel="Close detail"
              innerClass="flex size-[30px] shrink-0 items-center justify-center rounded-md border border-[var(--app-border)] bg-transparent text-[var(--app-text-secondary)] transition-colors hover:bg-[var(--app-bg)] hover:text-[var(--app-text-primary)]"
              (click)="drawerClose.emit()"
            >
              <lucide-icon [img]="X" [size]="15" aria-hidden="true" />
            </sa-icon-button>
          </div>
        </div>

        <div
          class="drawer-body-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6 text-[13.5px] text-[var(--app-text-secondary)]"
        >
          <section class="mb-7">
            <h3
              class="font-display mb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--app-text-muted)]"
            >
              About
            </h3>
            <p class="font-light leading-relaxed">{{ tool()!.description }}</p>
          </section>

          <section class="mb-7">
            <h3
              class="font-display mb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--app-text-muted)]"
            >
              Maintainer
            </h3>
            <div class="flex flex-col">
              <div class="info-row-drawer flex gap-2 border-b border-[var(--app-border-subtle)] py-2.5 text-[13.5px] first:pt-0">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Team</span>
                <span class="min-w-0 font-normal text-[var(--app-text-primary)]">{{
                  tool()!.maintainer.teamName
                }}</span>
              </div>
              <div class="info-row-drawer flex gap-2 border-b border-[var(--app-border-subtle)] py-2.5 text-[13.5px]">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Source</span>
                <span class="min-w-0 font-normal text-[var(--app-text-primary)]">{{
                  tool()!.maintainer.party === 'first_party' ? '1st-party (SuperApp)' : '3rd-party integration'
                }}</span>
              </div>
              <div class="info-row-drawer flex gap-2 py-2.5 text-[13.5px] last:border-b-0">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Contact</span>
                <span class="min-w-0 break-words font-normal text-[var(--app-text-primary)]">
                  <a class="text-[#2563eb] no-underline hover:underline" [href]="contactHref()">{{
                    tool()!.maintainer.contact
                  }}</a>
                </span>
              </div>
            </div>
          </section>

          <section class="mb-7">
            <h3
              class="font-display mb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--app-text-muted)]"
            >
              Details
            </h3>
            <div class="flex flex-col">
              <div class="info-row-drawer flex gap-2 border-b border-[var(--app-border-subtle)] py-2.5 text-[13.5px] first:pt-0">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Version</span>
                <span class="font-mono font-normal text-[var(--app-text-primary)]">{{ tool()!.version }}</span>
              </div>
              <div class="info-row-drawer flex gap-2 border-b border-[var(--app-border-subtle)] py-2.5 text-[13.5px]">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Category</span>
                <span class="capitalize font-normal text-[var(--app-text-primary)]">{{
                  categoryLabel(tool()!.category)
                }}</span>
              </div>
              <div class="info-row-drawer flex gap-2 border-b border-[var(--app-border-subtle)] py-2.5 text-[13.5px]">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Access</span>
                <span class="font-normal text-[var(--app-text-primary)]">{{ tool()!.accessLevel }}</span>
              </div>
              <div class="info-row-drawer flex gap-2 py-2.5 text-[13.5px] last:border-b-0">
                <span class="w-[90px] shrink-0 text-[13px] text-[var(--app-text-muted)]">Audit log</span>
                <span class="font-normal text-[var(--app-text-primary)]">{{
                  tool()!.auditLogEnabled ? 'Enabled' : 'Disabled'
                }}</span>
              </div>
            </div>
          </section>

          <section>
            <h3
              class="font-display mb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--app-text-muted)]"
            >
              Changelog
            </h3>
            @for (e of tool()!.changelog; track e.version + e.date) {
              <div class="border-b border-[var(--app-border-subtle)] py-3 last:border-b-0">
                <div class="mb-1.5 flex flex-wrap items-center gap-2">
                  <span
                    class="rounded border border-[var(--app-border)] bg-[var(--app-bg)] px-1.5 py-px font-mono text-xs font-semibold text-[var(--app-text-primary)]"
                    >{{ e.version }}</span
                  >
                  <span class="text-xs text-[var(--app-text-muted)]">{{ e.date }}</span>
                  <span [class]="bumpClass(e.bump)">{{ e.bump }}</span>
                </div>
                <ul class="changelog-list-mock list-none pl-0 text-[13px] font-light leading-[1.55] text-[var(--app-text-secondary)]">
                  @for (n of e.notes; track n) {
                    <li class="relative mb-0.5 pl-3">{{ n }}</li>
                  }
                </ul>
              </div>
            }
          </section>
        </div>

        <div class="shrink-0 px-6 pb-6">
          @if (tool(); as t) {
            @if (useRouterLinkForLaunch(t)) {
              <a
                class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--app-radius-button)] border-0 bg-[var(--app-accent)] font-sans text-[13.5px] font-medium tracking-tight text-[var(--app-accent-fg)] no-underline transition-opacity hover:opacity-85"
                [routerLink]="['/tools', t.id]"
                [attr.aria-label]="'Launch ' + t.name"
                (click)="onLaunch()"
              >
                <lucide-icon [img]="ExternalLink" [size]="15" aria-hidden="true" />
                Launch Tool
              </a>
            } @else {
              <a
                class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--app-radius-button)] border-0 bg-[var(--app-accent)] font-sans text-[13.5px] font-medium tracking-tight text-[var(--app-accent-fg)] no-underline transition-opacity hover:opacity-85"
                [href]="launchHref()"
                [attr.target]="drawerLaunchTarget()"
                rel="noopener noreferrer"
                [attr.aria-label]="'Launch ' + t.name"
                (click)="onLaunch()"
              >
                <lucide-icon [img]="ExternalLink" [size]="15" aria-hidden="true" />
                Launch Tool
              </a>
            }
          }
        </div>
      </div>
    }
  `,
  styles: `
    .changelog-list-mock li::before {
      content: '—';
      position: absolute;
      left: 0;
      color: var(--app-text-muted);
    }
    .drawer-body-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .drawer-body-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .drawer-body-scroll::-webkit-scrollbar-thumb {
      background: var(--app-border);
      border-radius: 4px;
    }
  `,
})
export class ToolDetailDrawerComponent {
  protected readonly X = X;
  protected readonly Star = Star;
  protected readonly ExternalLink = ExternalLink;

  private readonly launch = inject(ToolLaunchService);

  readonly tool = input<ToolDefinition | null>(null);

  protected readonly launchHref = computed(() => {
    const t = this.tool();
    return t ? this.launch.getLaunchHref(t) : '#';
  });

  protected readonly drawerLaunchTarget = computed(() => {
    const t = this.tool();
    return t ? this.launch.getLaunchTarget(t) : '_blank';
  });

  protected readonly drawerFavBtnClass = computed(() => {
    const base =
      'flex size-[30px] items-center justify-center rounded-md border-0 bg-transparent text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-bg)] hover:text-[var(--app-favorite-gold)] [--mdc-icon-button-icon-size:18px]';
    return this.isFavorited() ? `${base} text-[var(--app-favorite-gold)]` : base;
  });

  protected useRouterLinkForLaunch(t: ToolDefinition): boolean {
    return !this.launch.isExternalLaunch(t);
  }
  readonly isFavorited = input(false);

  readonly drawerClose = output<void>();
  readonly favoriteToggle = output<void>();
  readonly launched = output<{ tool: ToolDefinition; source: 'drawer' }>();

  protected categoryLabel(cat: ToolDefinition['category']): string {
    return TOOL_CATEGORY_LABEL[cat] ?? String(cat);
  }

  protected bumpClass(b: ChangelogBump): string {
    const base =
      'rounded-[10px] px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-[0.04em]';
    switch (b) {
      case 'major':
        return `${base} bg-[#fdf4ff] text-[#7e22ce]`;
      case 'minor':
        return `${base} bg-[#eff6ff] text-[#1d4ed8]`;
      case 'patch':
        return `${base} bg-[#f0fdf4] text-[#15803d]`;
    }
  }

  protected contactHref(): string {
    const t = this.tool();
    if (!t) {
      return '#';
    }
    const c = t.maintainer.contact;
    // Allowlist only safe schemes — anything else (javascript:, data:, etc.) renders as '#'
    if (c.startsWith('https://') || c.startsWith('http://') || c.startsWith('mailto:')) {
      return c;
    }
    return '#';
  }

  protected onLaunch(): void {
    const t = this.tool();
    if (t) {
      this.launched.emit({ tool: t, source: 'drawer' });
    }
  }
}
