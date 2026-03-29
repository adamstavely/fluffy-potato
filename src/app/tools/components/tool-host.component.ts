import { NgComponentOutlet } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map, of, startWith, switchMap } from 'rxjs';

import type { ToolDefinition } from '../models/tool.model';
import { ToolRegistryService } from '../services/tool-registry.service';
import { resolveToolHostComponent } from '../tool-component.registry';
import { ToolScaffoldComponent } from './tool-scaffold.component';

type ToolHostLoadState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'ready'; tool: ToolDefinition };

@Component({
  selector: 'sa-tool-host',
  standalone: true,
  imports: [ToolScaffoldComponent, NgComponentOutlet],
  template: `
    @if (loadState().kind === 'loading') {
      <p class="p-6 text-sm text-slate-600">Loading tool…</p>
    }
    @if (readyTool(); as t) {
      <sa-tool-scaffold [config]="scaffoldConfig(t)">
        <ng-container
          [ngComponentOutlet]="hostComponentType(t)!"
          [ngComponentOutletInputs]="hostInputs(t)"
        />
      </sa-tool-scaffold>
    }
  `,
})
export class ToolHostComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(ToolRegistryService);
  private readonly router = inject(Router);

  readonly loadState = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('toolId') ?? ''),
      switchMap((id) => {
        if (!id) {
          return of<ToolHostLoadState>({ kind: 'missing' });
        }
        return this.registry.getToolByIdAny(id).pipe(
          map((tool): ToolHostLoadState => {
            if (!tool) {
              return { kind: 'missing' };
            }
            return resolveToolHostComponent(tool.id)
              ? { kind: 'ready', tool }
              : { kind: 'missing' };
          }),
          startWith<ToolHostLoadState>({ kind: 'loading' }),
        );
      }),
    ),
    { initialValue: { kind: 'loading' } satisfies ToolHostLoadState },
  );

  readonly readyTool = computed(() => {
    const s = this.loadState();
    return s.kind === 'ready' ? s.tool : null;
  });

  constructor() {
    effect(() => {
      if (this.loadState().kind === 'missing') {
        void this.router.navigateByUrl('/not-found');
      }
    });
  }

  hostComponentType(tool: ToolDefinition) {
    return resolveToolHostComponent(tool.id);
  }

  readonly hostInputs = (tool: ToolDefinition): Record<string, unknown> => {
    if (tool.id === 'cyberchef') {
      return {};
    }
    return { tool };
  };

  readonly scaffoldConfig = (tool: ToolDefinition) => ({
    toolId: tool.id,
    toolName: tool.name,
    version: tool.version,
  });
}
