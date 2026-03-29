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
13. [Contributor documentation](#contributor-documentation)
14. [Additional resources](#additional-resources)

---

## Features

- **Catalog UI** — Responsive grid grouped by category (`language`, `data`, `identity`, `financial`, `productivity`), with debounced search and category filters.
- **Favorites** — Persisted via `UserPrefsService` and `localStorage`.
- **Detail drawer** — Full `ToolDefinition` metadata: maintainer (team, first- vs third-party source, contact link), version, category, access level, audit-log flag, and changelog entries with semver **bump** badges (major / minor / patch); push layout on larger viewports.
- **Launch** — Open in a new tab with hooks for audit (`AuditService`) and analytics (`AnalyticsService`).
- **Registry-driven** — `ToolRegistryService` loads tools from a remote API and/or bundled JSON (`src/assets/tools-registry.json`).
- **In-app tools** — `ToolScaffoldComponent` + `ToolHostComponent` host per-tool routes; optional **CyberChef** wrapper assets live under `src/assets/cyberchef/`.
- **Strict routes** — `/tools/:toolId` is guarded: unknown ids or tools without an Angular host mapping redirect to `/not-found`.

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
| `npm run generate-tool -- <category> <tool-id>` | Scaffolds `src/app/tools/<category>/<tool-id>/` (see [`getting-started/README.md`](getting-started/README.md)) |

`<category>` is one of: `language`, `data`, `identity`, `financial`, `productivity`. `<tool-id>` must match `^[a-z0-9-]+$` (lowercase letters, digits, hyphens).

---

## Project structure

High-level layout (not every file):

```text
.
├── angular.json              # CLI project "superapp"
├── package.json
├── getting-started/          # Contributor guide + scaffold (CLI, template JSON; see Contributor documentation)
│   ├── README.md             # Registry contract, external vs in-app, SC-01–SC-12
│   ├── generate-tool.mjs
│   └── scaffold-template/
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
        ├── app.routes.ts         # `/tools`, `/tools/:toolId`, `/not-found`
        ├── pages/                # e.g. not-found page
        ├── platform/             # Stand-in services for host integration
        │   ├── auth.service.ts
        │   ├── auth.interceptor.ts
        │   ├── user-prefs.service.ts
        │   ├── analytics.service.ts
        │   ├── audit.service.ts
        │   ├── error.service.ts
        │   └── branding-bar.component.ts
        └── tools/
            ├── models/tool.model.ts
            ├── services/         # ToolRegistryService, ToolLaunchService
            ├── guards/           # toolRouteGuard (+ lazy loader)
            ├── components/       # Catalog, cards, drawer, scaffold, hosts
            ├── directives/
            ├── tools-icons.module.ts
            └── tool-component.registry.ts   # toolId → host component
```

Generated tool folders (`npm run generate-tool`) live under **`src/app/tools/<category>/<tool-id>/`** next to the host component you add. See [`getting-started/README.md`](getting-started/README.md).

---

## Routing

| Path | Component | Guards |
|------|-----------|--------|
| `/` | Redirect to `/tools` | — |
| `/tools` | `ToolsPageComponent` | — |
| `/tools/:toolId` | `ToolHostComponent` | `toolRouteGuard` (lazy-loaded; registry + host mapping) |
| `/not-found` | `NotFoundPageComponent` | — |
| `**` | Redirect to `/tools` | — |

`toolRouteGuard` ensures the `toolId` exists in the registry and has an entry in `TOOL_HOST_COMPONENTS`; otherwise navigation goes to `/not-found`.

---

## Configuration

### Environments

- **`src/environments/environment.ts`** — Development. Set `toolsRegistryApiUrl` to your `GET` endpoint that returns a JSON array of `ToolDefinition` objects (same shape as the bundled file). If empty or whitespace-only, only `toolsRegistryAssetUrl` is used.
- **`src/environments/environment.prod.ts`** — Production; `fileReplacements` swaps this in for `ng build` production configuration.

### Registry API

- When **`toolsRegistryApiUrl`** is set, the client requests that URL first. On failure, it falls back to **`toolsRegistryAssetUrl`** (default `/assets/tools-registry.json`).
- **`authInterceptor`** attaches `Authorization: Bearer <token>` when `AuthService.getAccessToken()` returns a value.

### Tool definition shape

Types live in [`src/app/tools/models/tool.model.ts`](src/app/tools/models/tool.model.ts). Each tool includes **`maintainer`** (`teamName`, `party`: `first_party` \| `third_party`, `contact`), **`changelog`** (entries with `version`, `date`, `bump`, `notes`), plus **`accessLevel`** and **`auditLogEnabled`**. The bundled registry in [`src/assets/tools-registry.json`](src/assets/tools-registry.json) is the reference payload for local development.

---

## How the Tools feature works

1. **Load** — `ToolRegistryService` fetches the registry (API and/or asset) and exposes the full list to the catalog.
2. **Browse** — The tools page shows cards by category, supports search and filters, and persists favorites.
3. **Detail** — Selecting a card opens a drawer with description, maintainer (including party and contact), structured changelog with bump labels, access and audit settings, and launch actions.
4. **Launch external** — `ToolLaunchService` uses `launchUrl` and triggers audit/analytics hooks as configured.
5. **Open in app** — Navigating to `/tools/:toolId` runs `toolRouteGuard`, then loads `ToolHostComponent`, which picks a host component from `TOOL_HOST_COMPONENTS` in [`tool-component.registry.ts`](src/app/tools/tool-component.registry.ts). Unknown ids or ids without a host mapping redirect to `/not-found`.
6. **Scaffold** — `sa-tool-scaffold` wraps tool content; child components can inject `TOOL_SCAFFOLD_TOOL_ID` from [`src/app/tools/tokens/tool-scaffold-context.ts`](src/app/tools/tokens/tool-scaffold-context.ts).

---

## Extending the app

1. **Add or update tools in the registry** — Edit `src/assets/tools-registry.json` and/or your API so each entry matches `ToolDefinition` (categories, Lucide `icon` name, etc.).
2. **Register Lucide icons** — Add new icon names to the `pick({ ... })` list in [`src/app/tools/tools-icons.module.ts`](src/app/tools/tools-icons.module.ts) so cards can render them without duplicate imports elsewhere.
3. **Custom in-app UI for a tool id** — Create a standalone (or imported) component and add `toolId: YourComponent` to `TOOL_HOST_COMPONENTS` in [`src/app/tools/tool-component.registry.ts`](src/app/tools/tool-component.registry.ts). Every in-app registry tool must have a mapping, or `/tools/:toolId` shows the not-found page.
4. **New tool folder from CLI** — Run `npm run generate-tool -- <category> my-tool-id`, then implement the Angular host component and wire it in the registry as above. The script creates `tool-definition.json` under `src/app/tools/<category>/my-tool-id/`. Scaffold compliance (SC-01–SC-12) and the full workflow are in [`getting-started/README.md`](getting-started/README.md).

---

## Host integration (platform)

Code under **`src/app/platform/`** is intentionally minimal so the app runs in isolation. For a real SuperApp deployment:

- Replace or wrap **`AuthService`**, **`UserPrefsService`**, **`AnalyticsService`**, **`AuditService`**, and **`ErrorService`** with your platform providers.
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

## Contributor documentation

Tool authors and platform contributors should start with **[`getting-started/README.md`](getting-started/README.md)**. It documents the registry contract, **external** (new tab) vs **in-app** (`/tools/:id`) integration, the `npm run generate-tool` workflow, **SC-01–SC-12** scaffold compliance, and checklists for third-party maintainers.

**Layout**

| Path | Role |
|------|------|
| [`getting-started/README.md`](getting-started/README.md) | Single guide: API vs bundled registry, launch behavior, routing, versioning, compliance table |
| [`getting-started/generate-tool.mjs`](getting-started/generate-tool.mjs) | CLI invoked by `npm run generate-tool` |
| [`getting-started/scaffold-template/tool-definition.json`](getting-started/scaffold-template/tool-definition.json) | Template manifest aligned with `ToolDefinition` |

**Consolidation** — This `getting-started/` folder replaces the older split between **`scripts/generate-tool.mjs`**, **`tools/scaffold-template/`**, and **`docs/third-party-tool-integration.md`**, so scaffolding and third-party integration docs live in one place. The npm script **`generate-tool`** runs `node getting-started/generate-tool.mjs` (see [`package.json`](package.json)).

---

## Additional resources

- [Angular CLI overview](https://angular.dev/tools/cli) — schematics, `ng generate`, build options.
- This project was generated with **Angular CLI 19.2.x** (see `package.json` for exact versions).
