import { ErrorHandler, Injectable } from '@angular/core';
import { apm } from '@elastic/apm-rum';

export interface ErrorContext {
  toolId?: string;
  userId?: string;
  route?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorService implements ErrorHandler {
  handleError(error: unknown): void {
    this.capture(error instanceof Error ? error : new Error(String(error)), {});
  }

  capture(error: Error, context: ErrorContext): void {
    console.error('[ErrorService]', error, context);
    if (Object.keys(context).length > 0) {
      apm.setCustomContext(context);
    }
    apm.captureError(error);
  }
}
