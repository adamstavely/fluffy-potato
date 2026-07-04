import { Component, input } from '@angular/core';

/** Center line under the tool title in the shell bar. */
export type BrandingCenterBanner = 'browser' | 'external' | 'none';

@Component({
  selector: 'sa-branding-bar',
  standalone: true,
  template: `
    <div
      class="relative flex h-14 items-center border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-[var(--app-text-primary)] shadow-sm"
    >
      <div class="relative z-10 flex min-w-0 max-w-[45%] items-baseline gap-2 sm:max-w-[50%]">
        <h1 class="m-0 truncate text-sm font-semibold tracking-tight">{{ title() }}</h1>
        @if (subtitle()) {
          <span class="shrink-0 text-xs text-[var(--app-text-secondary)]">{{ subtitle() }}</span>
        }
      </div>
      @if (centerBanner() === 'browser') {
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
          <span class="text-center text-xs text-[var(--app-text-muted)]">
            All processing happens in this browser session.
          </span>
        </div>
      } @else if (centerBanner() === 'external') {
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
          <span class="text-center text-xs text-[var(--app-text-muted)]">
            This tool may send data to external services.
          </span>
        </div>
      }
    </div>
  `,
})
export class BrandingBarComponent {
  readonly title = input('SuperApp');
  readonly subtitle = input<string | undefined>(undefined);
  readonly centerBanner = input<BrandingCenterBanner>('none');
}
