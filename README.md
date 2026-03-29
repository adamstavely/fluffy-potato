# SuperApp — Tools section

Angular 19 standalone application that implements the **Tools** area of the SuperApp product: a browsable catalog of internal and third-party tools with search, categories, favorites, and in-app or external launch flows.

The npm package name is `superapp`; the Angular project id is `superapp` (output under `dist/superapp`).

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick start](#quick-start)
5. [Scripts](#scripts)
6. [Project structure](#project-structure)
7. [Routing](#routing)
8. [Configuration](#configuration)
9. [How the Tools feature works](#how-the-tools-feature-works)
10. [Extending the app](#extending-the-app)
11. [Host integration (platform)](#host-integration-platform)
12. [Testing and builds](#testing-and-builds)
13. [Additional resources](#additional-resources)

---

## Features

- **Catalog UI** — Responsive grid grouped by category (`language`, `data`, `identity`), with debounced search and category filters.
- **Favorites** — Persisted via `UserPrefsService` and `localStorage`.
- **Detail drawer** — Rich metadata (maintainer, changelog, access level) with a push layout on larger viewports.
- **Launch** — Open in a new tab with hooks for audit (`AuditService`) and analytics (`AnalyticsService`).
- **Registry-driven** — `ToolRegistryService` loads tools from a remote API and/or bundled JSON (`src/assets/tools-registry.json`).
- **In-app tools** — `ToolScaffoldComponent` + `ToolHostComponent` host per-tool routes; optional **CyberChef** wrapper assets live under `src/assets/cyberchef/`.
- **Feature flags** — Tools may declare `featureFlag`; visibility is enforced in the list and by `featureFlagGuard` on `/tools/:toolId`.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Angular 19 (standalone components, application builder) |
| UI | Angular Material (Azure Blue theme), Tailwind CSS 4 (PostCSS) |
| Icons | lucide-angular (registered in `ToolsIconsModule` for tool cards) |
| HTTP | `HttpClient` + `authInterceptor` for `Authorization: Bearer` when a token exists |
| State / UX | RxJS, zone.js, `UserPrefsService` for favorites |

---

## Prerequisites

- **Node.js** — Use an LTS version compatible with Angular 19 (see [Angular compatibility](https://angular.dev/reference/versions)).
- **npm** — Comes with Node; this repo uses `package-lock.json`.

Install dependencies from the repository root:

```bash
npm install
```

---

## Quick start

Start the dev server (default: development build, source maps):

```bash
npm start
```

Or:

```bash
ng serve
```

Open **http://localhost:4200/** — the app redirects `/` to `/tools`. The dev server reloads when source files change.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | `ng serve` — local development server |
| `npm run build` | Production build → `dist/superapp` |
| `npm run watch` | Development build with `--watch` |
| `npm test` | Karma + Jasmine unit tests |
| `npm run generate-tool -- <tool-id>` | Scaffolds `src/tools/<tool-id>/` from `tools/scaffold-template/` |

`<tool-id>` must match `^[a-z0-9-]+$` (lowercase letters, digits, hyphens).

---

## Project structure

High-level layout (not every file):

```text
.
├── angular.json              # CLI project "superapp"
├── package.json
├── scripts/
│   └── generate-tool.mjs     # Tool folder scaffold
├── tools/
│   └── scaffold-template/    # Templates for generate-tool
├── public/                   # Copied to site root
└── src/
    ├── assets/
    │   ├── tools-registry.json   # Default registry when API is unset or fails
    │   └── cyberchef/            # CyberChef-related static assets
    ├── environments/
    │   ├── environment.ts        # Dev: API URL, asset fallback
    │   └── environment.prod.ts   # Prod replacements
    └── app/
        ├── app.component.*       # Shell + router outlet
        ├── app.config.ts         # Router, HTTP (interceptors), animations, ErrorHandler
        ├── app.routes.ts         # `/tools`, `/tools/:toolId`
        ├── platform/             # Stand-in services for host integration
        │   ├── auth.service.ts
        │   ├── auth.interceptor.ts
        │   ├── user-prefs.service.ts
        │   ├── feature-flag.service.ts
        │   ├── analytics.service.ts
        │   ├── audit.service.ts
        │   ├── error.service.ts
        │   └── branding-bar.component.ts
        └── tools/
            ├── models/tool.model.ts
            ├── services/         # ToolRegistryService, ToolLaunchService
            ├── guards/           # authGuard, featureFlagGuard
            ├── components/       # Catalog, cards, drawer, scaffold, hosts
            ├── directives/
            ├── tools-icons.module.ts
            └── tool-component.registry.ts   # toolId → host component
```

Generated tool folders (`npm run generate-tool`) live under **`src/tools/<tool-id>/`** (metadata templates), separate from **`src/app/tools/`** (Angular feature code).

---

## Routing

| Path | Component | Guards |
|------|-----------|--------|
| `/` | Redirect to `/tools` | — |
| `/tools` | `ToolsPageComponent` | `authGuard` |
| `/tools/:toolId` | `ToolHostComponent` | `authGuard`, `featureFlagGuard` |
| `**` | Redirect to `/tools` | — |

`authGuard` calls `AuthService.assertAuthenticated()`; in the MVP stand-in it still allows navigation. `featureFlagGuard` resolves the tool from the registry (including flag-hidden tools) and redirects to `/tools` with a snackbar if the flag is off.

---

## Configuration

### Environments

- **`src/environments/environment.ts`** — Development. Set `toolsRegistryApiUrl` to your `GET` endpoint that returns a JSON array of `ToolDefinition` objects (same shape as the bundled file). If empty or whitespace-only, only `toolsRegistryAssetUrl` is used.
- **`src/environments/environment.prod.ts`** — Production; `fileReplacements` swaps this in for `ng build` production configuration.

### Registry API

- When **`toolsRegistryApiUrl`** is set, the client requests that URL first. On failure, it falls back to **`toolsRegistryAssetUrl`** (default `/assets/tools-registry.json`).
- **`authInterceptor`** attaches `Authorization: Bearer <token>` when `AuthService.getAccessToken()` returns a value.

### Tool definition shape

Types live in [`src/app/tools/models/tool.model.ts`](src/app/tools/models/tool.model.ts). The bundled registry in [`src/assets/tools-registry.json`](src/assets/tools-registry.json) is the reference payload for local development.

---

## How the Tools feature works

1. **Load** — `ToolRegistryService` fetches the registry (API and/or asset). Tools with `featureFlag` are filtered using `FeatureFlagService`.
2. **Browse** — The tools page shows cards by category, supports search and filters, and persists favorites.
3. **Detail** — Selecting a card opens a drawer with full description, maintainer, changelog, and launch actions.
4. **Launch external** — `ToolLaunchService` uses `launchUrl` and triggers audit/analytics hooks as configured.
5. **Open in app** — Navigating to `/tools/:toolId` loads `ToolHostComponent`, which picks a host component from `TOOL_HOST_COMPONENTS` in [`tool-component.registry.ts`](src/app/tools/tool-component.registry.ts) or falls back to `GenericToolPlaceholderComponent`.
6. **Scaffold** — `sa-tool-scaffold` wraps tool content; child components can inject `TOOL_SCAFFOLD_TOOL_ID` from [`src/app/tools/tokens/tool-scaffold-context.ts`](src/app/tools/tokens/tool-scaffold-context.ts).

---

## Extending the app

1. **Add or update tools in the registry** — Edit `src/assets/tools-registry.json` and/or your API so each entry matches `ToolDefinition` (categories, Lucide `icon` name, optional `featureFlag`, etc.).
2. **Register Lucide icons** — Add new icon names to the `pick({ ... })` list in [`src/app/tools/tools-icons.module.ts`](src/app/tools/tools-icons.module.ts) so cards can render them without duplicate imports elsewhere.
3. **Custom in-app UI for a tool id** — Create a standalone (or imported) component and add `toolId: YourComponent` to `TOOL_HOST_COMPONENTS` in [`src/app/tools/tool-component.registry.ts`](src/app/tools/tool-component.registry.ts). Unlisted ids use the generic placeholder.
4. **New tool folder from CLI** — Run `npm run generate-tool -- my-tool-id`, then implement the Angular host component and wire it in the registry as above. The script creates `tool-definition.json` and `compliance-checklist.md` under `src/tools/my-tool-id/`.

---

## Host integration (platform)

Code under **`src/app/platform/`** is intentionally minimal so the app runs in isolation. For a real SuperApp deployment:

- Replace or wrap **`AuthService`**, **`FeatureFlagService`**, **`UserPrefsService`**, **`AnalyticsService`**, **`AuditService`**, and **`ErrorService`** with your platform providers.
- Adjust **`branding-bar.component.ts`** if the shell chrome is owned by the host.
- Narrow or remove stand-ins once real services are wired.

---

## Testing and builds

**Unit tests** (Karma + Jasmine):

```bash
npm test
```

**Production build**:

```bash
npm run build
```

Artifacts are written to **`dist/superapp/`**. Production configuration enables hashing, budgets, and replaces `environment.ts` with `environment.prod.ts`.

End-to-end tests are **not** configured in this repository’s `angular.json`. To add E2E coverage, use your preferred runner (for example Cypress or Playwright) and follow the current [Angular testing documentation](https://angular.dev/guide/testing).

---

## Additional resources

- [Angular CLI overview](https://angular.dev/tools/cli) — schematics, `ng generate`, build options.
- This project was generated with **Angular CLI 19.2.x** (see `package.json` for exact versions).
