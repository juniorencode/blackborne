/*
 * WHERE THE CHECKS FIND THE CATALOG, in one place because two files need it
 * and they must never disagree.
 *
 * ## Why this is not 6006
 *
 * 6006 belongs to `storybook dev`, which is what a person runs while working
 * on a story. The checks are served from the STATIC build instead, and the
 * separate port is what keeps the two from being mistaken for each other.
 *
 * That is not tidiness. Playwright reuses a server it finds already listening,
 * so with both on one port a run would silently verify whatever happened to be
 * up — and a long-lived dev server serves the modules it started with. This
 * repository has already paid for that once: a component rewritten in place
 * kept rendering its old markup through a dev server that had been running for
 * an hour, and the checks reported the old behaviour as if it were current.
 * The package guide records it as "build, restart, then look"; this removes the
 * chance to forget.
 *
 * The static build is also why the checks can be run in parallel at all. A dev
 * server compiles each story the first time it is asked for, and three
 * measured timeouts in one evening came from exactly that — a story waiting
 * more than thirty seconds for its stylesheet while the server compiled it
 * under load. A built directory has nothing left to compile.
 */

/**
 * The port the built catalog is served on for verification.
 *
 * The same number appears in the `preview` script, because a package.json
 * script cannot import a constant — and that duplication is safe for one
 * reason worth stating: **it cannot disagree quietly.** Playwright waits for
 * this address before running anything, so a mismatch fails the run with
 * "timed out waiting for the server" rather than verifying the wrong thing.
 * The pair that must agree is checked by the thing that uses it.
 */
export const CATALOG_PORT = 6007;

/** Its base address. */
export const CATALOG_URL = `http://127.0.0.1:${CATALOG_PORT}`;

/**
 * Storybook's own index, which is where the accessibility suite gets the list
 * of stories: a new story is covered the moment it exists rather than when
 * somebody remembers to add it to an array.
 */
export const CATALOG_INDEX = `${CATALOG_URL}/index.json`;
