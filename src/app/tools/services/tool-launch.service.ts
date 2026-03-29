import { Injectable, inject } from '@angular/core';

import { AnalyticsService, type ToolLaunchSource } from '../../platform/analytics.service';
import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';

@Injectable({ providedIn: 'root' })
export class ToolLaunchService {
  private readonly audit = inject(AuditService);
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);

  launch(url: string, toolId: string, source: ToolLaunchSource): void {
    window.open(url, '_blank', 'noopener,noreferrer');
    const userId = this.auth.getUserIdSnapshot();
    this.audit.logLaunch(toolId, userId, url);
    this.analytics.track('tool_launched', { toolId, source });
  }
}
