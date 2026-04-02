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
    @if (readyTool()) {
      <sa-tool-scaffold [config]="scaffoldConfig()!">
        <ng-container
          [ngComponentOutlet]="hostComponentType()!"
          [ngComponentOutletInputs]="hostInputs()"
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
        return this.registry.getToolById(id).pipe(
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

  /** Resolved registry entry — single lookup shared by all derived computeds below. */
  private readonly resolvedEntry = computed(() => {
    const tool = this.readyTool();
    if (!tool) return null;
    const entry = resolveToolHostComponent(tool.id);
    return entry ? { tool, entry } : null;
  });

  readonly hostComponentType = computed(() => this.resolvedEntry()?.entry.component ?? null);

  readonly hostInputs = computed((): Record<string, unknown> => {
    const r = this.resolvedEntry();
    if (!r) return {};
    return r.entry.passToolInput ? { tool: r.tool } : {};
  });

  readonly scaffoldConfig = computed(() => {
    const tool = this.readyTool();
    if (!tool) return null;
    return {
      toolId: tool.id,
      toolName: tool.name,
      version: tool.version,
      allProcessingInBrowser: tool.allProcessingInBrowser ?? true,
    };
  });

  constructor() {
    effect(() => {
      if (this.loadState().kind === 'missing') {
        void this.router.navigateByUrl('/not-found');
      }
    });
  }
}
