/**
 * Joins class names, dropping anything falsy.
 *
 * Deliberately not `tailwind-merge`: with a variant map as the single source
 * of a component's classes (doc 03 §4.4) and no consumer classes reaching
 * internal nodes (doc 02 §6), there are no conflicts left to resolve. A
 * dependency that exists to fix a problem the architecture already prevents is
 * weight for nothing.
 *
 * Internal. Never exported from the package.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
