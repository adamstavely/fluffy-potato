import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, shareReplay } from 'rxjs';

/**
 * Session-cached flags (MVP). Replace with host API.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags$ = new BehaviorSubject<Record<string, boolean>>({
    'tools.cyberchef': true,
  });

  isEnabled(key: string): Observable<boolean> {
    return this.flags$.pipe(
      map((f) => f[key] ?? true),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /** Dev helper */
  setFlag(key: string, value: boolean): void {
    this.flags$.next({ ...this.flags$.value, [key]: value });
  }

  snapshot(key: string): boolean {
    return this.flags$.value[key] ?? true;
  }
}
