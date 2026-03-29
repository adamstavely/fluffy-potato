import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Team-wide favorite tool ids (SuperApp host). Replace with a server-backed
 * implementation when embedding in the parent shell.
 */
@Injectable({ providedIn: 'root' })
export class TeamToolFavoritesService {
  private readonly teamFavoriteIds$ = new BehaviorSubject<Set<string>>(new Set());

  getTeamFavoriteToolIds(): Observable<Set<string>> {
    return this.teamFavoriteIds$.asObservable();
  }

  snapshotTeamFavorites(): Set<string> {
    return new Set(this.teamFavoriteIds$.value);
  }
}
