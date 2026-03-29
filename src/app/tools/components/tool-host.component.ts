import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import type { ToolDefinition } from '../models/tool.model';
import { ToolRegistryService } from '../services/tool-registry.service';
import { resolveToolHostComponent } from '../tool-component.registry';
import { ToolScaffoldComponent } from './tool-scaffold.component';

@Component({
  selector: 'sa-tool-host',
  standalone: true,
  imports: [ToolScaffoldComponent, NgComponentOutlet],
  template: `
    @if (tool(); as t) {
      <sa-tool-scaffold [config]="scaffoldConfig()">
        @if (hostComponent(); as comp) {
          <ng-container
            [ngComponentOutlet]="comp"
            [ngComponentOutletInputs]="hostInputs()"
          />
        }
      </sa-tool-scaffold>
    } @else {
      <p class="p-6 text-sm text-slate-600">Loading tool…</p>
    }
  `,
})
export class ToolHostComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(ToolRegistryService);

  private readonly tool$ = this.route.paramMap.pipe(
    map((p) => p.get('toolId') ?? ''),
    switchMap((id) => (id ? this.registry.getToolByIdAny(id) : of(undefined))),
  );

  readonly tool = toSignal(this.tool$, { initialValue: undefined as ToolDefinition | undefined });

  readonly hostComponent = computed(() => {
    const t = this.tool();
    if (!t) {
      return null;
    }
    return resolveToolHostComponent(t.id);
  });

  readonly hostInputs = computed((): Record<string, unknown> => {
    const t = this.tool();
    if (!t) {
      return {};
    }
    if (t.id === 'cyberchef') {
      return {};
    }
    return { tool: t };
  });

  readonly scaffoldConfig = computed(() => {
    const t = this.tool();
    if (!t) {
      return { toolId: '', toolName: '', version: '' };
    }
    return {
      toolId: t.id,
      toolName: t.name,
      version: t.version,
      featureFlag: t.featureFlag,
    };
  });
}
