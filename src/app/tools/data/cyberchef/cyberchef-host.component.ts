import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Hosts the upstream CyberChef static build inside an **iframe** so its SPA cannot replace the
 * shell URL (loading CyberChef.js in the main document commonly navigates the top window to `/`).
 *
 * Place v10.22.1 artifacts under `assets/cyberchef/` (see `index.html` + `CyberChef.js`).
 */
@Component({
  selector: 'sa-cyberchef-host',
  standalone: true,
  template: `
    <!--
      Sandbox WITHOUT allow-same-origin: the embedded third-party CyberChef build runs in an
      opaque origin, so it cannot read the shell's localStorage, cookies, or DOM even though the
      document is served from our own /assets. allow-scripts (run), allow-downloads (save output),
      allow-popups (help links). Trade-off: CyberChef can't persist recipes to localStorage.
    -->
    <iframe
      [src]="frameSrc"
      title="CyberChef"
      class="block h-[min(80vh,900px)] w-full min-h-[480px] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)]"
      loading="lazy"
      referrerpolicy="same-origin"
      sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox"
    ></iframe>
  `,
})
export class CyberChefHostComponent {
  private readonly location = inject(Location);

  /** Path to the embedded CyberChef document (respects APP_BASE_HREF). */
  protected readonly frameSrc = this.resolveFrameSrc();

  private resolveFrameSrc(): string {
    const fallback = '/assets/cyberchef/index.html';
    const prepared = this.location.prepareExternalUrl(fallback);
    const t = prepared?.trim() ?? '';
    if (!t || t === '/') {
      return fallback;
    }
    return t.startsWith('//') ? fallback : t;
  }
}
