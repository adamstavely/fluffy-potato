import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'tools.favorites';

@Injectable({ providedIn: 'root' })
export class UserPrefsService {
  private readonly favorites$ = new BehaviorSubject<Set<string>>(this.readStorage());

  getFavoriteToolIds(): Observable<Set<string>> {
    return this.favorites$.asObservable();
  }

  snapshotFavorites(): Set<string> {
    return new Set(this.favorites$.value);
  }

  toggleFavorite(toolId: string): void {
    const next = new Set(this.favorites$.value);
    if (next.has(toolId)) {
      next.delete(toolId);
    } else {
      next.add(toolId);
    }
    this.favorites$.next(next);
    this.persist(next);
  }

  isFavorite(toolId: string): boolean {
    return this.favorites$.value.has(toolId);
  }

  private readStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return new Set();
      }
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  }

  private persist(ids: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      /* ignore */
    }
  }
}
