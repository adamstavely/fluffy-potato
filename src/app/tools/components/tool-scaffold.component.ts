import {
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { take } from 'rxjs';

import { AnalyticsService } from '../../platform/analytics.service';
import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import { ErrorService } from '../../platform/error.service';
import { BrandingBarComponent } from '../../platform/branding-bar.component';
import type { ToolScaffoldConfig } from '../models/tool.model';
import { ToolRegistryService } from '../services/tool-registry.service';
import { TOOL_SCAFFOLD_TOOL_ID } from '../tokens/tool-scaffold-context';

@Component({
  selector: 'sa-tool-scaffold',
  standalone: true,
  imports: [BrandingBarComponent],
  providers: [
    {
      provide: TOOL_SCAFFOLD_TOOL_ID,
      useFactory: () => inject(ToolScaffoldComponent).config().toolId,
    },
  ],
  template: `
    <div class="flex min-h-screen flex-col bg-slate-50">
      <sa-branding-bar
        [title]="config().toolName"
        [subtitle]="'v' + config().version"
        [centerBanner]="config().allProcessingInBrowser ? 'browser' : 'external'"
      />
      <div class="flex-1 p-4">
        @if (loadError()) {
          <div
            class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
            role="alert"
          >
            {{ loadError() }}
          </div>
        } @else {
          <ng-content />
        }
      </div>
    </div>
  `,
})
export class ToolScaffoldComponent implements OnInit, OnDestroy {
  readonly config = input.required<ToolScaffoldConfig>();

  private readonly auth = inject(AuthService);
  private readonly audit = inject(AuditService);
  private readonly analytics = inject(AnalyticsService);
  private readonly errors = inject(ErrorService);
  private readonly registry = inject(ToolRegistryService);

  private started = 0;
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.started = performance.now();
    this.auth.assertAuthenticated();
    const c = this.config();
    const userId = this.auth.getUserIdSnapshot();
    this.audit.logEntry(c.toolId, userId);
    this.analytics.trackPageView(c.toolId);
    this.registry
      .getToolById(c.toolId)
      .pipe(take(1))
      .subscribe((def) => {
        if (!def) {
          this.loadError.set('Tool is not registered.');
          return;
        }
        if (def.version !== c.version || def.id !== c.toolId) {
          this.errors.capture(new Error('ToolScaffoldConfig mismatch vs registry'), {
            toolId: c.toolId,
            userId,
          });
        }
      });
  }

  ngOnDestroy(): void {
    const c = this.config();
    const userId = this.auth.getUserIdSnapshot();
    const durationMs = Math.round(performance.now() - this.started);
    this.audit.logExit(c.toolId, userId, durationMs);
  }
}
