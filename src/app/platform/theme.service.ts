import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'sa-theme';

/**
 * Light/dark theme controller (DS §8 Theming — `.dark` class on <html>).
 * Persists the explicit choice in localStorage; falls back to the OS preference.
 * A tiny inline script in index.html applies the class before bootstrap to avoid FOUC.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<AppTheme>(this.readInitial());
  readonly theme = this._theme.asReadonly();

  constructor() {
    // Reconcile the signal with whatever the pre-bootstrap script already applied.
    this.apply(this._theme());
  }

  toggle(): void {
    this.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: AppTheme): void {
    this._theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable (private mode) — theme still applies for this session */
    }
  }

  private apply(theme: AppTheme): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private readInitial(): AppTheme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
}
