# Getting started: tools

This guide covers the **registry contract** for listing tools in the catalog, **external vs in-app** integration, the **scaffold workflow** for new in-app tools, and **scaffold compliance (SC-01–SC-12)** for contributions to `tools-contrib`.

The app loads tool metadata from a **registry** (JSON array of `ToolDefinition` objects). It can read from a **remote API** or fall back to a **bundled file** when the API is missing or unreachable.

---

## Registry contract

Each tool is one object in the registry array. The shape matches `ToolDefinition` in the codebase (`src/app/tools/models/tool.model.ts`).

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | Stable slug, URL-safe (e.g. `my-tool`). Used in routes as `/tools/{id}`. |
| `name` | Yes | Display name in the catalog. |
| `shortDescription` | Yes | One line on tool cards. |
| `description` | Yes | Longer copy for the detail drawer. |
| `version` | Yes | Semver string; must stay in sync with what the shell expects (see [Version and identity consistency](#version-and-identity-consistency)). |
| `category` | Yes | One of: `language`, `data`, `identity`, `financial`, `productivity`, `temporal`, `geospatial`. |
| `icon` | Yes | **Lucide** icon name in **PascalCase** (e.g. `Languages`, `Braces`). The app only renders icons that are registered in `src/app/tools/tools-icons.module.ts`. |
| `launchUrl` | Yes | Where **Launch** navigates (see [Two ways to integrate](#two-ways-to-integrate)). |
| `maintainer` | Yes | `teamName`, `party` (`first_party` \| `third_party`), `contact`. |
| `changelog` | Yes | Array of version entries (`version`, `date`, `bump`, `notes`). |
| `accessLevel` | Yes | Human-readable access summary (e.g. “All authenticated users”). |
| `auditLogEnabled` | Yes | Boolean; aligns with org audit expectations. |

**Template:** [`scaffold-template/tool-definition.json`](scaffold-template/tool-definition.json) (or run `npm run generate-tool -- <category> <tool-id>` to materialize a copy under `src/app/tools/<category>/<tool-id>/`).

### Where registry data lives

- **Production-style:** Configure `toolsRegistryApiUrl` in environment so the app fetches `GET` that URL for the JSON array. On failure, it falls back to the bundled asset.
- **Fallback / local:** `src/assets/tools-registry.json` is the default bundled registry (`toolsRegistryAssetUrl` in `src/environments/environment.ts`).

Third parties typically **coordinate with the platform team** to publish their object on the API or to merge an update to the bundled JSON.

---

## Two ways to integrate

### A. External tool (hosted outside this app)

Use this when the UI runs on **your own origin** (or another HTTPS URL).

1. **Implement and deploy** your tool at a stable URL.
2. **Add a registry entry** with:
   - `maintainer.party`: `third_party`
   - `launchUrl`: full HTTPS URL to your app (e.g. `https://tools.example.com/my-tool`)

**Launch behavior:** Choosing **Launch** on a card or in the drawer opens that URL in a **new tab** (`noopener,noreferrer`). Audit and analytics record the launch.

**No Angular code** in this repository is required for listing and launching, as long as the registry is updated.

---

### B. In-app tool (embedded in this Angular app)

Use this when the experience should run **inside** this app at `/tools/{toolId}` (same session, branding bar, scaffold).

1. **Add your registry entry** with `launchUrl` set to the **in-app route**, e.g. `/tools/your-tool-id` (path-only URLs are resolved against the current origin).

2. **Implement a standalone Angular component** that:
   - Is registered in `TOOL_HOST_COMPONENTS` in `src/app/tools/tool-component.registry.ts`, keyed by **`id`**.
   - Accepts the registry payload via a required input named **`tool`** of type `ToolDefinition` (see existing tools under `src/app/tools/<category>/<tool-id>/`, e.g. `language/translation/`).

   **Exception:** `cyberchef` uses a dedicated host with no `tool` input; new tools should follow the `tool` input pattern unless the platform agrees on a special case.

3. **Icons:** If you need a Lucide icon that is not already picked in `tools-icons.module.ts`, add it there so the catalog can render your `icon` field.

4. **Host mapping:** If `id` is not in `TOOL_HOST_COMPONENTS`, the route guard sends users to **`/not-found`**. There is no placeholder UI.

**Runtime behavior:** `ToolHostComponent` wraps the host in `ToolScaffoldComponent`, which enforces authentication, audit (entry/exit), analytics, and validates that the tool exists in the registry.

#### Scaffold: generate a folder

From the repo root:

```bash
npm run generate-tool -- <category> <tool-id>
```

**Categories** (must match `ToolCategory` in `src/app/tools/models/tool.model.ts`): `language`, `data`, `identity`, `financial`, `productivity`, `temporal`, `geospatial`.

**`<tool-id>`** must match `^[a-z0-9-]+$` (lowercase letters, digits, hyphens). It becomes the route segment `/tools/<tool-id>` and the registry `id`.

This creates:

```text
src/app/tools/<category>/<tool-id>/
  tool-definition.json    # Template manifest; edit name, description, icon, etc.
```

#### Scaffold: implement the host component

Add a **standalone** Angular component under the same folder, following existing tools (for example `src/app/tools/identity/phone-number/phone-number-tool.component.ts`):

- File name: `<tool-id>-tool.component.ts`
- Selector: `sa-<tool-id>-tool` (use hyphens in the selector)

#### Scaffold: wire the app

1. **Host mapping** — Add `toolId: YourToolComponent` to `TOOL_HOST_COMPONENTS` in [`src/app/tools/tool-component.registry.ts`](../src/app/tools/tool-component.registry.ts).
2. **Icons** — Register any new Lucide icon names in [`src/app/tools/tools-icons.module.ts`](../src/app/tools/tools-icons.module.ts).
3. **Registry payload** — Add or merge the tool definition in [`src/assets/tools-registry.json`](../src/assets/tools-registry.json) (or your registry API). Keep `id` and `version` aligned with the scaffold and registry entry.

---

## Routing and access

- **Catalog:** `/tools`.
- **In-app tool:** `/tools/:toolId` — `toolRouteGuard` requires the tool to exist in the registry (including when loaded from the remote API) **and** to have a matching `TOOL_HOST_COMPONENTS` entry.

Deep-linking to `/tools/{id}` requires both the registry entry and the host map. Otherwise the app navigates to **`/not-found`**.

---

## Version and identity consistency

`ToolScaffoldComponent` compares the loaded definition’s `id` and `version` to the scaffold config built from the registry. **Keep registry `version` aligned** with releases so telemetry and error reporting stay meaningful. When you bump the tool version, update the registry entry in the same change (or deployment) as the host code.

---

## Scaffold compliance

Items **SC-01** through **SC-12** — self-certify each row before opening a PR to `tools-contrib`.

| ID | Requirement | Pass |
| --- | --- | --- |
| SC-01 | Angular standalone component | [ ] |
| SC-02 | TypeScript strict mode | [ ] |
| SC-03 | `ToolScaffoldConfig` matches registry | [ ] |
| SC-04 | No direct injection of platform audit/analytics/auth/error services | [ ] |
| SC-05 | No unapproved external network calls | [ ] |
| SC-06 | No iframe / shadow DOM escape | [ ] |
| SC-07 | No global CSS leakage | [ ] |
| SC-08 | `ErrorService.capture` on caught errors | [ ] |
| SC-09 | No raw `localStorage` / `sessionStorage` | [ ] |
| SC-10 | Harness smoke test (no console errors on load) | [ ] |
| SC-11 | `ToolDefinition` manifest complete with changelog | [ ] |
| SC-12 | Accessibility baseline (axe / labels) | [ ] |

---

## Checklist for third-party maintainers

**External tool**

- [ ] Stable HTTPS `launchUrl`
- [ ] Registry entry with `party: "third_party"` and complete metadata
- [ ] Changelog entry for each user-visible release

**In-app tool**

- [ ] Registry entry with `launchUrl` = `/tools/{id}` matching `id`
- [ ] Standalone host component + `TOOL_HOST_COMPONENTS` mapping
- [ ] Lucide `icon` registered in `tools-icons.module.ts` if needed
- [ ] Tests / QA for `/tools/{id}` with a valid registry + host mapping
- [ ] For `tools-contrib` PRs, complete [Scaffold compliance](#scaffold-compliance) (SC-01–SC-12) above

---

## Who changes what

| Change | Typical owner |
| --- | --- |
| JSON/API registry content | Tool team + platform (merge or API publish) |
| New Angular host component & registry map | Tool team via PR to this repo (or platform) |
| New environment URL for registry API | Platform / DevOps |

For questions about contact channels, use the `maintainer.contact` field in your registry entry and the platform’s documented support path.

---

## Further reading

- Project overview and tooling: [`README.md`](../README.md)
