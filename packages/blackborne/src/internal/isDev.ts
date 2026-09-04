/*
 * `process.env.NODE_ENV` appears in exactly this file and nowhere else.
 *
 * It is the one environment check the library makes, and it is deliberately
 * fenced in. Every bundler replaces this expression at build time, so it is
 * the portable way to ship a warning that costs nothing in production — but
 * it is a Node global in browser code, and letting it spread would be how the
 * library starts depending on an environment it should know nothing about.
 *
 * The declaration is local because the package typechecks WITHOUT Node types:
 * a stray `process.cwd()` should not compile.
 */
declare const process: { env: Record<string, string | undefined> } | undefined;

/**
 * True outside a production build.
 *
 * Used only to make a mistake loud while you are working — a missing
 * translation key, for instance — and silent for the people using the app
 * (doc 05 §2.2, rule 3).
 */
export function isDev(): boolean {
  try {
    return (
      typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production'
    );
  } catch {
    // Some sandboxed environments throw on touching an undeclared global.
    return false;
  }
}
