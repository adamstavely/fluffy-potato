import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Minimal auth facade. Replace with host integration in production.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly userId$ = new BehaviorSubject<string>('dev-user-1');

  getUserId(): Observable<string> {
    return this.userId$.asObservable();
  }

  getUserIdSnapshot(): string {
    return this.userId$.value;
  }

  /**
   * Optional bearer token for `authInterceptor`. Host apps should return a real token.
   */
  getAccessToken(): string | null {
    return null;
  }

  assertAuthenticated(): void {
    // Host app would validate session; MVP is always authenticated
  }

  redirectToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
