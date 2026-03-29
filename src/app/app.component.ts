import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen min-h-[100dvh] flex-col bg-[var(--app-bg)]">
      <a class="skip-to-main" href="#main-content">Skip to main content</a>
      <header
        class="sticky top-0 z-[60] border-b border-[var(--app-border)] bg-[var(--app-surface)]"
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
          <div
            class="font-display flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-xs font-semibold text-[var(--app-accent-fg)]"
            aria-hidden="true"
          >
            AJ
          </div>
        </div>
      </header>
      <main id="main-content" class="min-h-0 flex-1" tabindex="-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
