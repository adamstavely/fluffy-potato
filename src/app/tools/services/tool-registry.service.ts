import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { FeatureFlagService } from '../../platform/feature-flag.service';
import type { ToolDefinition } from '../models/tool.model';

@Injectable({ providedIn: 'root' })
export class ToolRegistryService {
  private readonly http = inject(HttpClient);
  private readonly flags = inject(FeatureFlagService);

  /** All tools with feature flags applied */
  getVisibleTools(): Observable<ToolDefinition[]> {
    return this.fetchRawTools().pipe(switchMap((tools) => this.filterByFlags(tools)));
  }

  getToolById(id: string): Observable<ToolDefinition | undefined> {
    return this.getVisibleTools().pipe(map((tools) => tools.find((t) => t.id === id)));
  }

  /** Includes tools hidden by flags — for guard resolution */
  getToolByIdAny(id: string): Observable<ToolDefinition | undefined> {
    return this.fetchRawTools().pipe(map((tools) => tools.find((t) => t.id === id)));
  }

  private fetchRawTools(): Observable<ToolDefinition[]> {
    const api = environment.toolsRegistryApiUrl?.trim() ?? '';
    const fallback = environment.toolsRegistryAssetUrl;

    if (!api) {
      return this.http.get<ToolDefinition[]>(fallback).pipe(catchError(() => of([])));
    }

    return this.http.get<ToolDefinition[]>(api).pipe(
      catchError(() => this.http.get<ToolDefinition[]>(fallback)),
      catchError(() => of([])),
    );
  }

  private filterByFlags(tools: ToolDefinition[]): Observable<ToolDefinition[]> {
    if (tools.length === 0) {
      return of([]);
    }
    const vis$ = tools.map((t) => this.visibility$(t));
    return combineLatest(vis$).pipe(
      map((flags) => tools.filter((_, i) => flags[i])),
    );
  }

  private visibility$(tool: ToolDefinition): Observable<boolean> {
    if (!tool.featureFlag) {
      return of(true);
    }
    return this.flags.isEnabled(tool.featureFlag);
  }
}
