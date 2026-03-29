import { Injectable } from '@angular/core';

export interface AuditPayload {
  toolId: string;
  userId: string;
  timestamp: string;
  url?: string;
  durationMs?: number;
}

/**
 * Audit sink; wire to platform endpoint when integrating.
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  logView(toolId: string, userId: string): void {
    this.emit('tool.view', { toolId, userId, timestamp: new Date().toISOString() });
  }

  logLaunch(toolId: string, userId: string, url: string): void {
    this.emit('tool.launch', { toolId, userId, timestamp: new Date().toISOString(), url });
  }

  logEntry(toolId: string, userId: string): void {
    this.emit('tool.enter', { toolId, userId, timestamp: new Date().toISOString() });
  }

  logExit(toolId: string, userId: string, durationMs: number): void {
    this.emit('tool.exit', { toolId, userId, timestamp: new Date().toISOString(), durationMs });
  }

  private emit(event: string, payload: AuditPayload): void {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[Audit] ${event}`, payload);
    }
  }
}
