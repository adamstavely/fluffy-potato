import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ThemeService } from './platform/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen min-h-[100dvh] flex-col bg-[var(--app-bg)]">
      <a class="skip-to-main" href="#main-content">Skip to main content</a>
      <header
        class="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--app-border)] bg-[var(--app-surface)]"
      >
        <div class="mx-auto flex h-14 max-w-[1280px] items-center gap-8 px-8">
          <a routerLink="/tools" class="font-display flex items-center gap-2 text-base font-bold tracking-tight text-[var(--app-text-primary)]">
            <span class="size-[7px] shrink-0 rounded-full bg-[var(--app-accent)]" aria-hidden="true"></span>
            SuperApp
          </a>
          <nav class="flex flex-1 gap-1" aria-label="Primary">
            <span
              class="cursor-default rounded-md px-3 py-1.5 text-[13.5px] tracking-tight text-[var(--app-text-secondary)]"
              aria-disabled="true"
              >Home</span
            >
            <span
              class="cursor-default rounded-md px-3 py-1.5 text-[13.5px] tracking-tight text-[var(--app-text-secondary)]"
              aria-disabled="true"
              >Workspace</span
            >
            <a
              routerLink="/tools"
              routerLinkActive="nav-link-tools-active"
              [routerLinkActiveOptions]="{ exact: false }"
              class="nav-link-tools"
              >Tools</a
            >
            <span
              class="cursor-default rounded-md px-3 py-1.5 text-[13.5px] tracking-tight text-[var(--app-text-secondary)]"
              aria-disabled="true"
              >Reports</span
            >
            <span
              class="cursor-default rounded-md px-3 py-1.5 text-[13.5px] tracking-tight text-[var(--app-text-secondary)]"
              aria-disabled="true"
              >Admin</span
            >
          </nav>
          <div class="flex shrink-0 items-center gap-3">
          <button
            type="button"
            (click)="theme.toggle()"
            class="flex size-[30px] shrink-0 items-center justify-center rounded-md border border-[var(--app-border)] bg-transparent text-[var(--app-text-secondary)] transition-colors hover:bg-[var(--app-bg)] hover:text-[var(--app-text-primary)]"
            [attr.aria-pressed]="theme.theme() === 'dark'"
            [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          >
            @if (theme.theme() === 'dark') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            }
          </button>
          <div
            class="font-display flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--app-interactive)] text-xs font-semibold text-[var(--app-accent-fg)]"
            aria-hidden="true"
          >
            AJ
          </div>
          </div>
        </div>
      </header>
      <main id="main-content" class="min-h-0 flex-1" tabindex="-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
}
