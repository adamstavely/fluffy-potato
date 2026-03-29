# Third-party tool integration

This document describes what **tool creators and maintainers** need to do so a tool appears in the Tools catalog and behaves correctly with launch, authentication, auditing, and feature flags.

The app loads tool metadata from a **registry** (JSON array of `ToolDefinition` objects). It can read from a **remote API** or fall back to a **bundled file** when the API is missing or unreachable.

---

## 1. Registry contract

Each tool is one object in the registry array. The shape matches `ToolDefinition` in the codebase (`src/app/tools/models/tool.model.ts`).

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | Stable slug, URL-safe (e.g. `my-tool`). Used in routes as `/tools/{id}`. |
| `name` | Yes | Display name in the catalog. |
| `shortDescription` | Yes | One line on tool cards. |
| `description` | Yes | Longer copy for the detail drawer. |
| `version` | Yes | Semver string; must stay in sync with what the shell expects (see §5). |
| `category` | Yes | One of: `language`, `data`, `identity`, `financial`, `productivity`. |
| `icon` | Yes | **Lucide** icon name in **PascalCase** (e.g. `Languages`, `Braces`). The app only renders icons that are registered in `src/app/tools/tools-icons.module.ts`. |
| `launchUrl` | Yes | Where **Launch** navigates (see §2). |
| `maintainer` | Yes | `teamName`, `party` (`first_party` \| `third_party`), `contact`, optional `slackChannel`. |
| `changelog` | Yes | Array of version entries (`version`, `date`, `bump`, `notes`). |
| `accessLevel` | Yes | Human-readable access summary (e.g. “All authenticated users”). |
| `auditLogEnabled` | Yes | Boolean; aligns with org audit expectations. |
| `featureFlag` | No | If set, the tool is hidden unless that flag is enabled (catalog and `/tools/:toolId` route). |

**Template:** `tools/scaffold-template/tool-definition.json`

**Where data lives**

- **Production-style:** Configure `toolsRegistryApiUrl` in environment so the app fetches `GET` that URL for the JSON array. On failure, it falls back to the bundled asset.
- **Fallback / local:** `src/assets/tools-registry.json` is the default bundled registry (`toolsRegistryAssetUrl` in `src/environments/environment.ts`).

Third parties typically **coordinate with the platform team** to publish their object on the API or to merge an update to the bundled JSON.

---

## 2. Two ways to integrate

### A. External tool (hosted outside this app)

Use this when the UI runs on **your own origin** (or another HTTPS URL).

1. **Implement and deploy** your tool at a stable URL.
2. **Add a registry entry** with:
   - `maintainer.party`: `third_party`
   - `launchUrl`: full HTTPS URL to your app (e.g. `https://tools.example.com/my-tool`)

**Launch behavior:** Choosing **Launch** on a card or in the drawer opens that URL in a **new tab** (`noopener,noreferrer`). Audit and analytics record the launch.

**No Angular code** in this repository is required for listing and launching, as long as the registry is updated.

**Optional:** If the tool should also be reachable under this app’s auth shell only for certain users, discuss **feature flags** (`featureFlag`) with the platform team.

---

### B. In-app tool (embedded in this Angular app)

Use this when the experience should run **inside** this app at `/tools/{toolId}` (same session, branding bar, scaffold).

1. **Add your registry entry** with `launchUrl` set to the **in-app route**, e.g. `/tools/your-tool-id` (path-only URLs are resolved against the current origin).

2. **Implement a standalone Angular component** that:
   - Is registered in `TOOL_HOST_COMPONENTS` in `src/app/tools/tool-component.registry.ts`, keyed by **`id`**.
   - Accepts the registry payload via a required input named **`tool`** of type `ToolDefinition` (see existing tools under `src/app/tools/components/`).

   **Exception:** `cyberchef` uses a dedicated host with no `tool` input; new tools should follow the `tool` input pattern unless the platform agrees on a special case.

3. **Icons:** If you need a Lucide icon that is not already picked in `tools-icons.module.ts`, add it there so the catalog can render your `icon` field.

4. **Without a host mapping:** If `id` is not in `TOOL_HOST_COMPONENTS`, the route still loads, but the UI shows `GenericToolPlaceholderComponent` until a real host is registered.

**Runtime behavior:** `ToolHostComponent` wraps the host in `ToolScaffoldComponent`, which enforces authentication, audit (entry/exit), analytics, and validates that the tool exists in the registry.

---

## 3. Routing and access

- **Catalog:** `/tools` (authenticated).
- **In-app tool:** `/tools/:toolId` (authenticated; **feature flag guard** runs if `featureFlag` is set).

Deep-linking to `/tools/{id}` requires the tool definition to exist in the registry (including when hidden by flags—resolution uses `getToolByIdAny` for existence; visibility still applies for catalog and guard).

---

## 4. Feature flags

If `featureFlag` is present:

- The tool is **omitted** from the catalog when the flag is off.
- Direct navigation to `/tools/{id}` is **blocked** with a snackbar and redirect to `/tools` when the flag is off.

Coordinate flag names and rollout with the platform team.

---

## 5. Version and identity consistency

`ToolScaffoldComponent` compares the loaded definition’s `id` and `version` to the scaffold config built from the registry. **Keep registry `version` aligned** with releases so telemetry and error reporting stay meaningful. When you bump the tool version, update the registry entry in the same change (or deployment) as the host code.

---

## 6. Checklist for third-party maintainers

**External tool**

- [ ] Stable HTTPS `launchUrl`
- [ ] Registry entry with `party: "third_party"` and complete metadata
- [ ] Changelog entry for each user-visible release
- [ ] Optional: `featureFlag` name agreed with platform

**In-app tool**

- [ ] Registry entry with `launchUrl` = `/tools/{id}` matching `id`
- [ ] Standalone host component + `TOOL_HOST_COMPONENTS` mapping
- [ ] Lucide `icon` registered in `tools-icons.module.ts` if needed
- [ ] Tests / QA for `/tools/{id}` under auth and with flag on/off if applicable

---

## 7. Who changes what

| Change | Typical owner |
| --- | --- |
| JSON/API registry content | Tool team + platform (merge or API publish) |
| New Angular host component & registry map | Tool team via PR to this repo (or platform) |
| New environment URL for registry API | Platform / DevOps |
| Feature flag creation and wiring | Platform |

For questions about contact channels, use the `maintainer.contact` and `slackChannel` fields in your registry entry and the platform’s documented support path.
