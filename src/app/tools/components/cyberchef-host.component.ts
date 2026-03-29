import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChild,
} from '@angular/core';

import { ErrorService } from '../../platform/error.service';

/**
 * MVP: host div for CyberChef static build (no iframe). Place v10.22.1 output under `assets/cyberchef/`.
 */
@Component({
  selector: 'sa-cyberchef-host',
  standalone: true,
  template: `
    <div
      #host
      class="min-h-[480px] w-full rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600"
      role="region"
      aria-label="CyberChef"
    >
      <p class="mb-2 font-medium text-slate-800">CyberChef</p>
      <p class="mb-4 text-xs">
        Add the upstream v10.22.1 build to <code class="rounded bg-slate-100 px-1">assets/cyberchef/</code> to
        load the full UI here (wrapper, no iframe).
      </p>
    </div>
  `,
})
export class CyberChefHostComponent implements AfterViewInit, OnDestroy {
  private readonly errors = inject(ErrorService);
  private readonly host = viewChild<ElementRef<HTMLElement>>('host');

  private scripts: HTMLScriptElement[] = [];

  ngAfterViewInit(): void {
    const host = this.host();
    if (!host) {
      return;
    }
    const el = host.nativeElement;
    try {
      const s = document.createElement('script');
      s.src = 'assets/cyberchef/CyberChef.js';
      s.async = true;
      s.onerror = (): void => {
        this.errors.capture(new Error('CyberChef script failed to load'), { toolId: 'cyberchef' });
      };
      el.appendChild(s);
      this.scripts.push(s);
    } catch (e) {
      this.errors.capture(e instanceof Error ? e : new Error(String(e)), { toolId: 'cyberchef' });
    }
  }

  ngOnDestroy(): void {
    for (const s of this.scripts) {
      s.remove();
    }
  }
}
