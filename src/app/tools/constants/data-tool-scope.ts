/**
 * Browser-only limits and copy for future table/profiler/dedupe tools and shared
 * data workflows. Processing stays in-memory in the client; no uploads.
 */
export const DATA_TOOL_MAX_ROWS = 50_000;

/** Rows rendered in the table workspace grid (export still includes full parsed set up to max). */
export const TABLE_WORKSPACE_DISPLAY_MAX = 10_000;

/** Crosswalk / join uses the same cap to avoid main-thread stalls on large pastes. */
export const CROSSWALK_MAX_ROWS = 25_000;

/** Shown near large paste inputs; future table tools should reuse this string. */
export const PII_PASTE_WARNING =
  'Do not paste secrets, credentials, or sensitive personal data unless policy allows. All processing happens in this browser session.';
