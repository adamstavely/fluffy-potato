import { ErrorHandler, Injectable, inject } from '@angular/core';

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
    if (typeof console !== 'undefined' && console.error) {
      console.error('[ErrorService]', error, context);
    }
  }
}
