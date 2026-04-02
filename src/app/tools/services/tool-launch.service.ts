import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AnalyticsService, type ToolLaunchSource } from '../../platform/analytics.service';
import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import type { ToolDefinition } from '../models/tool.model';

/** External tools use https? launch URLs; in-app tools open at `/tools/:toolId` (canonical path from `tool.id`). */
const EXTERNAL_URL = /^https?:\/\//i;

/** Path-only URL outside `/tools/*` (e.g. parent shell route `/glossary`). */
function isParentAppPathLaunch(launchUrl: string): boolean {
  const t = launchUrl.trim();
  return t.startsWith('/') && !t.startsWith('/tools/');
}

/**
 * Ensures a non-empty path starting with `/`, never `//…` (scheme-relative), never bare `/` alone.
 * `prepareExternalUrl` can return `''` or `/` in edge cases; `new URL('', origin)` yields origin-only hrefs.
 */
function normalizeInAppPath(prepared: string, fallback: string): string {
  const t = prepared?.trim() ?? '';
  const raw = !t || t === '/' ? fallback : t;
  if (raw.startsWith('//')) {
    return fallback;
  }
  let out = raw.startsWith('/') ? raw : `/${raw}`;
  out = out.replace(/\/+/g, '/');
  if (out === '/' || out === '') {
    return fallback;
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class ToolLaunchService {
  private readonly audit = inject(AuditService);
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly location = inject(Location);

  /**
   * In-app tools (path-only `launchUrl` or same-origin root misconfig) should use `RouterLink`
   * so `href` respects `APP_BASE_HREF` without manual `origin + prepareExternalUrl` (avoids
   * bounce / wrong-tab URL when combined with `target="_blank"`).
   */
  isExternalLaunch(tool: ToolDefinition): boolean {
    const lu = tool.launchUrl?.trim() ?? '';
    if (isParentAppPathLaunch(lu)) {
      return true;
    }
    if (!lu || !EXTERNAL_URL.test(lu)) {
      return false;
    }
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const u = new URL(lu);
      if (u.origin === window.location.origin) {
        const p = u.pathname.replace(/\/+$/, '') || '/';
        if (p === '/') {
          return false;
        }
      }
    } catch {
      return true;
    }
    return true;
  }

  /**
   * Absolute URL for opening a tool (in-app or external). Use with `<a target="_blank">` for
   * reliable new-tab navigation; avoid `window.open` alone for same.
   */
  getLaunchHref(tool: ToolDefinition): string {
    return this.resolveLaunchUrl(tool);
  }

  /**
   * Anchor `target` for catalog launch. Parent-app paths use `_top` so embedded tools break out
   * to the shell; https links use `_blank`.
   */
  getLaunchTarget(tool: ToolDefinition): '_blank' | '_top' {
    const lu = tool.launchUrl?.trim() ?? '';
    if (isParentAppPathLaunch(lu)) {
      return '_top';
    }
    return '_blank';
  }

  /** Audit + analytics only (navigation is via anchor `href` or `launchTool`). */
  recordLaunch(tool: ToolDefinition, source: ToolLaunchSource): void {
    const url = this.getLaunchHref(tool);
    const userId = this.auth.getUserIdSnapshot();
    this.audit.logLaunch(tool.id, userId, url);
    this.analytics.track('tool_launched', { toolId: tool.id, source });
  }

  /**
   * Opens via `window.open` (tests, callers that cannot use an anchor). Prefer `getLaunchHref` +
   * `<a target="_blank">` in UI.
   */
  launchTool(tool: ToolDefinition, source: ToolLaunchSource): void {
    const url = this.getLaunchHref(tool);
    if (!environment.production) {
      console.debug('[ToolLaunchService] launch', { toolId: tool.id, url });
    }
    const target = this.getLaunchTarget(tool);
    window.open(url, target, 'noopener,noreferrer');
    this.recordLaunch(tool, source);
  }

  private resolveLaunchUrl(tool: ToolDefinition): string {
    const lu = tool.launchUrl?.trim() ?? '';
    if (lu && EXTERNAL_URL.test(lu)) {
      if (typeof window !== 'undefined') {
        try {
          const u = new URL(lu);
          if (u.origin === window.location.origin) {
            const p = u.pathname.replace(/\/+$/, '') || '/';
            if (p === '/') {
              return this.absoluteInAppUrl(tool.id);
            }
          }
        } catch {
          // Malformed URL — do not expose the raw string as an href
          return this.absoluteInAppUrl(tool.id);
        }
      }
      return lu;
    }
    if (isParentAppPathLaunch(lu)) {
      const prepared = this.location.prepareExternalUrl(lu);
      const normalized = normalizeInAppPath(prepared, lu);
      if (typeof window === 'undefined') {
        return normalized;
      }
      return `${window.location.origin}${normalized}`;
    }
    return this.absoluteInAppUrl(tool.id);
  }

  private absoluteInAppUrl(toolId: string): string {
    const fallback = `/tools/${encodeURIComponent(toolId)}`;
    const prepared = this.location.prepareExternalUrl(fallback);
    const normalized = normalizeInAppPath(prepared, fallback);
    if (typeof window === 'undefined') {
      return normalized;
    }
    const result = `${window.location.origin}${normalized}`;
    return result;
  }
}
