import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExternalLink } from 'lucide-angular';

import { ToolScaffoldComponent } from '../../components/tool-scaffold.component';
import type { ToolDefinition } from '../../models/tool.model';
import { ToolLaunchService } from '../../services/tool-launch.service';
import { ToolsIconsModule } from '../../tools-icons.module';

@Component({
  selector: 'sa-georepo-tool',
  standalone: true,
  imports: [ToolScaffoldComponent, ToolsIconsModule, RouterLink],
  template: `
    <sa-tool-scaffold [config]="scaffoldConfig()">
      <div class="mx-auto max-w-lg px-6 py-10 text-center">
        <p class="mb-6 text-[13.5px] leading-relaxed text-[var(--app-text-secondary)]">
          GeoRepo is an external service for polygon and vector data: browse datasets, run
          geospatial queries, and publish layers for maps and OGC clients. Opens in a new tab.
        </p>
        <a
          class="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--app-radius-button)] border-0 bg-[var(--app-accent)] px-6 font-sans text-[13.5px] font-medium text-[var(--app-accent-fg)] no-underline transition-opacity hover:opacity-85"
          [href]="href()"
          [attr.target]="launchTarget()"
          rel="noopener noreferrer"
        >
          <lucide-icon [img]="ExternalLink" [size]="15" aria-hidden="true" />
          Open GeoRepo
        </a>
        <p class="mt-8 text-xs text-[var(--app-text-muted)]">
          <a class="text-[#2563eb] no-underline hover:underline" routerLink="/tools">Back to tools</a>
        </p>
      </div>
    </sa-tool-scaffold>
  `,
})
export class GeoRepoToolComponent {
  protected readonly ExternalLink = ExternalLink;

  private readonly launch = inject(ToolLaunchService);
  readonly tool = input.required<ToolDefinition>();

  protected readonly href = computed(() => this.launch.getLaunchHref(this.tool()));
  protected readonly launchTarget = computed(() => this.launch.getLaunchTarget(this.tool()));

  protected readonly scaffoldConfig = computed(() => {
    const t = this.tool();
    return {
      toolId: t.id,
      toolName: t.name,
      version: t.version,
      allProcessingInBrowser: t.allProcessingInBrowser,
    };
  });
}
