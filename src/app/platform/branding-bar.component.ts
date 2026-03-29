import { Component, input } from '@angular/core';

@Component({
  selector: 'sa-branding-bar',
  standalone: true,
  template: `
    <header
      class="flex h-14 items-center border-b border-slate-200 bg-white px-4 text-slate-800 shadow-sm"
      role="banner"
    >
      <span class="text-sm font-semibold tracking-tight">{{ title() }}</span>
      @if (subtitle()) {
        <span class="ml-2 text-xs text-slate-500">{{ subtitle() }}</span>
      }
    </header>
  `,
})
export class BrandingBarComponent {
  readonly title = input('SuperApp');
  readonly subtitle = input<string | undefined>(undefined);
}
