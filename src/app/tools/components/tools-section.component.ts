import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';

import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import { AnalyticsService } from '../../platform/analytics.service';
import { UserPrefsService } from '../../platform/user-prefs.service';
import type { ToolCategory, ToolDefinition } from '../models/tool.model';
import { TOOL_CATEGORY_ORDER } from '../models/tool.model';
import { ToolLaunchService } from '../services/tool-launch.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { ToolsIconsModule } from '../tools-icons.module';
import { ToolCardComponent } from './tool-card.component';
import { ToolCategoryComponent } from './tool-category.component';
import { ToolDetailDrawerComponent } from './tool-detail-drawer.component';

type FilterKey = 'all' | ToolCategory;

@Component({
  selector: 'sa-tools-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToolsIconsModule,
    ToolCardComponent,
    ToolCategoryComponent,
    ToolDetailDrawerComponent,
  ],
  template: `
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="mb-9 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative max-w-[360px] flex-1">
          <lucide-icon
            name="Search"
            [size]="15"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]"
          />
          <input
            id="tool-search"
            type="search"
            class="h-[38px] w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] pl-[38px] pr-3 font-sans text-[13.5px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] outline-none transition-[border-color] focus:border-[#c4c0ba]"
            placeholder="Search tools…"
            [formControl]="searchControl"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          @for (chip of filterChips; track chip.key) {
            <button
              type="button"
              class="flex h-[38px] items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 font-sans text-[13px] transition-colors"
              [class.border-[var(--app-accent)]]="activeFilter() === chip.key"
              [class.bg-[var(--app-accent)]]="activeFilter() === chip.key"
              [class.text-[var(--app-accent-fg)]]="activeFilter() === chip.key"
              [class.border-[var(--app-border)]]="activeFilter() !== chip.key"
              [class.bg-[var(--app-surface)]]="activeFilter() !== chip.key"
              [class.text-[var(--app-text-secondary)]]="activeFilter() !== chip.key"
              [class.hover:border-[#c4c0ba]]="activeFilter() !== chip.key"
              [class.hover:text-[var(--app-text-primary)]]="activeFilter() !== chip.key"
              (click)="setFilter(chip.key)"
            >
              {{ chip.label }}
            </button>
          }
        </div>
      </div>

      <section class="mb-10">
        <div
          class="font-display mb-3.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--app-text-muted)]"
        >
          <span>Favorites</span>
          <span class="h-px flex-1 bg-[var(--app-border-subtle)]" aria-hidden="true"></span>
        </div>
        @if (favoriteToolList().length === 0) {
          <p class="py-1 text-[13px] italic text-[var(--app-text-muted)]">
            Mark a tool as favorite to access it quickly here.
          </p>
        } @else {
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5"
            role="list"
          >
            @for (t of favoriteToolList(); track t.id) {
              <sa-tool-card
                role="listitem"
                [tool]="t"
                [isFavorited]="favoriteIds().has(t.id)"
                [isDrawerActive]="drawerTool()?.id === t.id"
                (favoriteToggle)="toggleFavorite(t.id)"
                (drawerOpen)="onDrawerRequest($event)"
                (launched)="onLaunch($event)"
              />
            }
          </div>
        }
      </section>

      @if (drawerTool()) {
        <div
          class="fixed inset-0 z-40 bg-black/[0.08]"
          role="presentation"
          (click)="closeDrawer()"
        ></div>
      }

      <div class="relative flex min-h-0 flex-1">
        <div
          class="relative z-10 min-w-0 flex-1 transition-[margin] duration-300 ease-out"
          [ngClass]="drawerTool() ? 'mr-[var(--app-drawer-width)]' : ''"
        >
          @for (cat of TOOL_CATEGORY_ORDER; track cat) {
            @if (grouped()[cat].length > 0) {
              <sa-tool-category
                [category]="cat"
                [tools]="grouped()[cat]"
                [favoriteIds]="favoriteIds()"
                [activeToolId]="drawerTool()?.id ?? null"
                (favoriteToggle)="toggleFavorite($event)"
                (drawerOpen)="onDrawerRequest($event)"
                (launched)="onLaunch($event)"
              />
            }
          }

          @if (visibleCount() === 0) {
            <p class="py-12 text-center text-sm text-slate-500">No tools match your filters.</p>
          }
        </div>

        @if (drawerTool(); as dt) {
          <div
            #drawerPanel
            class="fixed bottom-0 right-0 z-50 flex w-[var(--app-drawer-width)] flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] shadow-[-8px_0_32px_rgba(0,0,0,0.06)]"
            style="top: 56px"
          >
            <sa-tool-detail-drawer
              [tool]="dt"
              [isFavorited]="favoriteIds().has(dt.id)"
              (drawerClose)="closeDrawer()"
              (favoriteToggle)="toggleFavorite(dt.id)"
              (launched)="onLaunch($event)"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class ToolsSectionComponent {
  protected readonly TOOL_CATEGORY_ORDER = TOOL_CATEGORY_ORDER;

  private readonly registry = inject(ToolRegistryService);
  private readonly prefs = inject(UserPrefsService);
  private readonly launch = inject(ToolLaunchService);
  private readonly audit = inject(AuditService);
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);

  readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly debouncedQuery = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      startWith(''),
    ),
    { initialValue: '' },
  );

  private readonly tools = toSignal(this.registry.getVisibleTools(), {
    initialValue: [] as ToolDefinition[],
  });

  readonly activeFilter = signal<FilterKey>('all');

  readonly drawerTool = signal<ToolDefinition | null>(null);

  private readonly drawerPanel = viewChild<ElementRef<HTMLElement>>('drawerPanel');

  readonly favoriteIds = toSignal(this.prefs.getFavoriteToolIds(), {
    initialValue: new Set<string>(),
  });

  readonly filterChips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'language', label: 'Language' },
    { key: 'data', label: 'Data' },
    { key: 'identity', label: 'Identity' },
  ];

  private readonly filtered = computed(() => {
    const q = this.debouncedQuery().trim().toLowerCase();
    const f = this.activeFilter();
    return this.tools().filter((t) => {
      if (f !== 'all' && t.category !== f) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        t.name.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  });

  readonly grouped = computed(() => {
    const out: Record<ToolCategory, ToolDefinition[]> = {
      language: [],
      data: [],
      identity: [],
    };
    for (const t of this.filtered()) {
      out[t.category].push(t);
    }
    return out;
  });

  readonly visibleCount = computed(() => this.filtered().length);

  readonly favoriteToolList = computed(() => {
    const ids = this.favoriteIds();
    return this.tools().filter((t) => ids.has(t.id));
  });

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.drawerTool()) {
      this.closeDrawer();
    }
  }

  /** Close drawer when clicking outside (PRD: overlay click). Clicks on tool cards are ignored. */
  @HostListener('document:click', ['$event'])
  protected onDocClick(ev: MouseEvent): void {
    if (!this.drawerTool()) {
      return;
    }
    const panel = this.drawerPanel()?.nativeElement;
    if (panel?.contains(ev.target as Node)) {
      return;
    }
    const el = ev.target as HTMLElement | null;
    if (el?.closest('sa-tool-card')) {
      return;
    }
    this.closeDrawer();
  }

  constructor() {
    effect(() => {
      const q = this.debouncedQuery();
      const count = this.filtered().length;
      untracked(() => {
        this.analytics.track('tool_searched', { query: q, resultsCount: count });
      });
    });
  }

  protected setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
    this.analytics.track('tool_filtered', { filter: key });
  }

  protected toggleFavorite(toolId: string): void {
    const was = this.prefs.snapshotFavorites().has(toolId);
    this.prefs.toggleFavorite(toolId);
    this.analytics.track(was ? 'tool_unfavorited' : 'tool_favorited', { toolId });
  }

  protected onDrawerRequest(tool: ToolDefinition): void {
    const current = this.drawerTool();
    if (current?.id === tool.id) {
      this.closeDrawer();
      return;
    }
    this.drawerTool.set(tool);
    const userId = this.auth.getUserIdSnapshot();
    this.audit.logView(tool.id, userId);
    this.analytics.track('tool_drawer_opened', { toolId: tool.id, source: 'card_button' });
  }

  protected closeDrawer(): void {
    this.drawerTool.set(null);
  }

  protected onLaunch(event: {
    tool: ToolDefinition;
    source: 'card' | 'drawer' | 'favorites_chip';
  }): void {
    const url = this.resolveUrl(event.tool.launchUrl);
    this.launch.launch(url, event.tool.id, event.source);
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  }
}
