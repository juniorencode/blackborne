/*
 * The rules a story is not responsible for, in ONE place.
 *
 * There are two things running axe over this catalog and they used to disagree
 * about six of these. `accessibility.spec.ts` is the authority — it walks every
 * story in the built catalog and fails the build — and Storybook's own
 * accessibility panel is the convenience, for whoever is writing a story right
 * now. A panel that reports six violations the suite deliberately excludes is
 * a panel people learn to ignore, which is worse than no panel: it is the
 * only one a person looks at while the code is still in their head.
 *
 * Measured: the addon disables exactly one rule of its own (`region`), where
 * this list disables seven. So both import this, and one list is the whole
 * point of the file.
 *
 * ## Why each one is here
 *
 * Every story is a FRAGMENT mounted at a root, so there is no page for it to
 * structure. Landmarks, heading hierarchy, the document's language and its
 * title all belong to the consuming application — doc 06 §2's third column —
 * and asserting them here would measure the catalog rather than the library.
 *
 * The list is deliberately short and deliberately explicit. It is not a tag
 * filter: filtering by WCAG tags reads as the careful choice and silently
 * dropped `color-contrast`, which carries none of them and is the single most
 * valuable rule in the set. `accessibility.spec.ts` has that measurement and
 * the assertion that now guards it.
 */
export const RULES_A_FRAGMENT_IS_NOT_RESPONSIBLE_FOR = [
  'region',
  'page-has-heading-one',
  'landmark-one-main',
  'html-has-lang',
  'html-lang-valid',
  'document-title',
  /* The catalog's own iframe wrapper, not something the library renders. */
  'meta-viewport'
] as const;

/**
 * The same list in the shape Storybook's accessibility parameter wants.
 *
 * The addon takes `config.rules` as axe's own configuration objects, while
 * `AxeBuilder` takes names — so the list is written once as names and shaped
 * here, rather than written twice in two shapes.
 */
export const a11yParameter = {
  config: {
    rules: RULES_A_FRAGMENT_IS_NOT_RESPONSIBLE_FOR.map(id => ({
      id,
      enabled: false
    }))
  }
};
