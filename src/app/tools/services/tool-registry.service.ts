import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import bundledToolsRegistry from '../../../assets/tools-registry.json';
import { environment } from '../../../environments/environment';
import type { ToolDefinition } from '../models/tool.model';

/** Bundled copy so registry resolution works when HTTP fails (e.g. new tab, base-href edge cases). */
const BUNDLED_TOOLS = bundledToolsRegistry as ToolDefinition[];

@Injectable({ providedIn: 'root' })
export class ToolRegistryService {
  private readonly http = inject(HttpClient);

  private rawToolsCache$?: Observable<ToolDefinition[]>;

  /** All tools from the registry (API and/or bundled asset). */
  getVisibleTools(): Observable<ToolDefinition[]> {
    return this.fetchRawTools();
  }

  getToolById(id: string): Observable<ToolDefinition | undefined> {
    return this.fetchRawTools().pipe(map((tools) => tools.find((t) => t.id === id)));
  }

  getToolByIdAny(id: string): Observable<ToolDefinition | undefined> {
    return this.fetchRawTools().pipe(map((tools) => tools.find((t) => t.id === id)));
  }

  /**
   * Synchronous lookup against the bundled registry only (no HTTP). Use in guards so activation
   * does not depend on async fetch in a cold new tab.
   */
  lookupBundledToolById(id: string): ToolDefinition | undefined {
    return BUNDLED_TOOLS.find((t) => t.id === id);
  }

  private fetchRawTools(): Observable<ToolDefinition[]> {
    if (!this.rawToolsCache$) {
      this.rawToolsCache$ = this.loadRawToolsOnce().pipe(shareReplay(1));
    }
    return this.rawToolsCache$;
  }

  /**
   * Resolution order when `toolsRegistryApiUrl` is set: remote API → bundled asset GET → bundled import.
   * When API is unset: asset GET → bundled import on failure or empty body.
   */
  private loadRawToolsOnce(): Observable<ToolDefinition[]> {
    const api = environment.toolsRegistryApiUrl?.trim() ?? '';
    const fallbackUrl = environment.toolsRegistryAssetUrl;

    const withBundledFallback = (tools: ToolDefinition[]): ToolDefinition[] =>
      tools.length > 0 ? tools : BUNDLED_TOOLS;

    if (!api) {
      return this.http.get<ToolDefinition[]>(fallbackUrl).pipe(
        catchError(() => of([])),
        map(withBundledFallback),
      );
    }

    return this.http.get<ToolDefinition[]>(api).pipe(
      catchError(() => this.http.get<ToolDefinition[]>(fallbackUrl)),
      catchError(() => of([])),
      map(withBundledFallback),
    );
  }
}
