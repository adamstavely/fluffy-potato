import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sa-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-[1280px] px-8 pb-20 pt-16">
      <h1
        class="font-display text-[22px] font-bold leading-tight tracking-[-0.03em] text-[var(--app-text-primary)]"
      >
        Page not found
      </h1>
      <p class="mt-3 text-sm text-[var(--app-text-secondary)]">
        This tool does not exist or is not available in the app.
      </p>
      <a
        routerLink="/tools"
        class="mt-6 inline-block text-sm font-medium text-[var(--app-text-primary)] underline decoration-[var(--app-border)] underline-offset-2 transition-colors hover:decoration-[var(--app-text-primary)]"
      >
        Back to Tools
      </a>
    </div>
  `,
})
export class NotFoundPageComponent {}
