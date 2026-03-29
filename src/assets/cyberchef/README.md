# CyberChef static build (MVP)

Place the upstream **CyberChef v10.22.1** production build artifacts here (for example `CyberChef.js` and supporting assets from the GCHQ release).

The `sa-cyberchef-host` component loads `assets/cyberchef/CyberChef.js` into a non-iframe container. Until files exist, the script load fails gracefully and errors are reported via `ErrorService`.
