import { Injectable } from '@angular/core';

export type ToolLaunchSource = 'card' | 'drawer' | 'favorites_chip';

/**
 * Analytics facade; forward to Elastic ingest in production.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  track(event: string, props: Record<string, unknown>): void {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[Analytics] ${event}`, props);
    }
  }

  trackPageView(toolId: string): void {
    this.track('page_view', { toolId, context: 'tool_host' });
  }
}
