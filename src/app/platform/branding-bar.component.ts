import { Component, input } from '@angular/core';

@Component({
  selector: 'sa-branding-bar',
  standalone: true,
  template: `
    <div class="flex h-14 items-center border-b border-slate-200 bg-white px-4 text-slate-800 shadow-sm">
      <h1 class="m-0 text-sm font-semibold tracking-tight">{{ title() }}</h1>
      @if (subtitle()) {
        <span class="ml-2 text-xs text-slate-600">{{ subtitle() }}</span>
      }
    </div>
  `,
})
export class BrandingBarComponent {
  readonly title = input('SuperApp');
  readonly subtitle = input<string | undefined>(undefined);
}
