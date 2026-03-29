# CyberChef static build (MVP)

Place the upstream **CyberChef v10.22.1** production build artifacts here (for example `CyberChef.js` and supporting assets from the GCHQ release).

The `sa-cyberchef-host` component loads **`index.html`** in an **iframe** so CyberChef’s own SPA cannot replace the SuperApp top-level URL (injecting `CyberChef.js` into the shell document commonly navigates the address bar to `/`). `index.html` loads `CyberChef.js` from this folder.

Until `CyberChef.js` exists, the iframe shows an empty or broken page; the shell stays on `/tools/cyberchef`.
