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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';

import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import { AnalyticsService } from '../../platform/analytics.service';
import { TeamToolFavoritesService } from '../../platform/team-tool-favorites.service';
import { UserPrefsService } from '../../platform/user-prefs.service';
import type { ToolCategory, ToolDefinition } from '../models/tool.model';
import { TOOL_CATEGORY_ORDER } from '../models/tool.model';
import { ToolLaunchService } from '../services/tool-launch.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { ToolsIconsModule } from '../tools-icons.module';
import { ToolCategoryComponent } from './tool-category.component';
import { CdkTrapFocus } from '@angular/cdk/a11y';

import { SaSelectComponent, type SaSelectOption } from '../../ui/sa-select.component';
import { SaTextFieldComponent } from '../../ui/sa-text-field.component';
import { ToolDetailDrawerComponent } from './tool-detail-drawer.component';

type FilterKey = 'all' | ToolCategory;

type CatalogScopeKey = 'all' | 'mine' | 'team';

@Component({
  selector: 'sa-tools-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToolsIconsModule,
    ToolCategoryComponent,
    ToolDetailDrawerComponent,
    CdkTrapFocus,
    SaSelectComponent,
    SaTextFieldComponent,
  ],
  template: `
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="mb-9 flex flex-wrap items-center gap-3">
        <div
          class="inline-flex shrink-0 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-0.5 divide-x divide-[var(--app-border)]"
          role="group"
          aria-label="Catalog scope"
        >
          @for (chip of scopeChips; track chip.key) {
            <button
              type="button"
              class="sa-segmented-btn min-h-[34px] shrink-0 whitespace-nowrap px-3 py-1.5 text-center text-[13px] font-medium leading-tight"
              [class.sa-segmented-btn--active]="catalogScope() === chip.key"
              [attr.aria-pressed]="catalogScope() === chip.key ? 'true' : 'false'"
              (click)="setCatalogScope(chip.key)"
            >
              {{ chip.label }}
            </button>
          }
        </div>
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
          <sa-select
            label="Category"
            fieldId="tool-category-filter"
            [options]="categoryFilterOptions"
            [ngModel]="activeFilter()"
            (ngModelChange)="setFilter($event)"
            fieldClass="!w-[min(100%,160px)] min-w-[140px] shrink-0"
          />
          <div class="min-w-0 flex-1">
            <sa-text-field
              floatLabel="always"
              fieldClass="sa-tools-search w-full min-w-0"
              [formControl]="searchControl"
              label="Search"
              fieldId="tool-search"
              type="search"
              placeholder="Type to filter…"
              autocomplete="off"
            >
              <span
                matPrefix
                class="inline-flex shrink-0 items-center text-[var(--app-text-muted)]"
              >
                <lucide-icon name="Search" [size]="15" aria-hidden="true" />
              </span>
            </sa-text-field>
          </div>
        </div>
      </div>

      @if (drawerTool()) {
        <div
          class="fixed inset-0 z-[90] bg-black/[0.08]"
          role="presentation"
          (click)="closeDrawer()"
        ></div>
      }

      <div class="relative flex min-h-0 flex-1">
        <div class="relative min-w-0 flex-1">
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
            cdkTrapFocus
            cdkTrapFocusAutoCapture
            class="fixed bottom-0 right-0 z-[100] flex w-[var(--app-drawer-width)] flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-drawer-shadow)]"
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
  private readonly teamFavorites = inject(TeamToolFavoritesService);
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

  readonly teamFavoriteIds = toSignal(this.teamFavorites.getTeamFavoriteToolIds(), {
    initialValue: new Set<string>(),
  });

  readonly catalogScope = signal<CatalogScopeKey>('all');

  readonly scopeChips: { key: CatalogScopeKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine' },
    { key: 'team', label: 'My Team' },
  ];

  readonly filterChips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'language', label: 'Language' },
    { key: 'data', label: 'Data' },
    { key: 'identity', label: 'Identity' },
    { key: 'financial', label: 'Financial' },
    { key: 'productivity', label: 'Productivity' },
  ];

  readonly categoryFilterOptions: SaSelectOption<FilterKey>[] = this.filterChips.map((c) => ({
    value: c.key,
    label: c.label,
  }));

  private readonly filtered = computed(() => {
    const q = this.debouncedQuery().trim().toLowerCase();
    const f = this.activeFilter();
    const scope = this.catalogScope();
    const fav = this.favoriteIds();
    const teamFav = this.teamFavoriteIds();
    return this.tools().filter((t) => {
      if (scope === 'mine' && !fav.has(t.id)) {
        return false;
      }
      if (scope === 'team' && !teamFav.has(t.id)) {
        return false;
      }
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
      financial: [],
      productivity: [],
    };
    for (const t of this.filtered()) {
      out[t.category].push(t);
    }
    return out;
  });

  readonly visibleCount = computed(() => this.filtered().length);

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

  protected setCatalogScope(key: CatalogScopeKey): void {
    this.catalogScope.set(key);
    this.analytics.track('tool_catalog_scope', { scope: key });
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
    this.launch.recordLaunch(event.tool, event.source);
  }
}
