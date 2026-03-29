/**
 * convert-units pulls in lodash.support / lodash.foreach, which reference Node's `global`.
 * Browsers only guarantee `globalThis`; map `global` before those CJS modules run.
 */
(globalThis as unknown as { global: typeof globalThis }).global = globalThis;
