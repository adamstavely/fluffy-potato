import { Component } from '@angular/core';

import { ToolsSectionComponent } from '../components/tools-section.component';

@Component({
  selector: 'sa-tools-page',
  standalone: true,
  imports: [ToolsSectionComponent],
  template: `
    <div class="mx-auto max-w-[1280px] px-8 pb-20 pt-10">
      <header class="mb-8">
        <h1
          class="font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-[var(--app-text-primary)]"
        >
          Tools
        </h1>
        <p
          class="mt-1.5 text-sm font-light tracking-tight text-[var(--app-text-secondary)] [letter-spacing:-0.01em]"
        >
          Utility tools for language, data, identity, financial, and productivity workflows
        </p>
      </header>
      <sa-tools-section />
    </div>
  `,
})
export class ToolsPageComponent {}
