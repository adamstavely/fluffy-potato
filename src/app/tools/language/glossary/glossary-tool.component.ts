import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExternalLink } from 'lucide-angular';

import { ToolScaffoldComponent } from '../../components/tool-scaffold.component';
import type { ToolDefinition } from '../../models/tool.model';
import { ToolLaunchService } from '../../services/tool-launch.service';
import { ToolsIconsModule } from '../../tools-icons.module';

@Component({
  selector: 'sa-glossary-tool',
  standalone: true,
  imports: [ToolScaffoldComponent, ToolsIconsModule, RouterLink],
  template: `
    <sa-tool-scaffold [config]="scaffoldConfig()">
      <div class="mx-auto max-w-lg px-6 py-10 text-center">
        <p class="mb-6 text-[13.5px] leading-relaxed text-[var(--app-text-secondary)]">
          The glossary lives in the main SuperApp. Open it in the top window to browse terms and
          definitions.
        </p>
        <a
          class="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--app-radius-button)] border-0 bg-[var(--app-accent)] px-6 font-sans text-[13.5px] font-medium text-[var(--app-accent-fg)] no-underline transition-opacity hover:opacity-85"
          [href]="href()"
          [attr.target]="launchTarget()"
          rel="noopener noreferrer"
        >
          <lucide-icon [img]="ExternalLink" [size]="15" aria-hidden="true" />
          Open glossary
        </a>
        <p class="mt-8 text-xs text-[var(--app-text-muted)]">
          <a class="text-[#2563eb] no-underline hover:underline" routerLink="/tools">Back to tools</a>
        </p>
      </div>
    </sa-tool-scaffold>
  `,
})
export class GlossaryToolComponent {
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
