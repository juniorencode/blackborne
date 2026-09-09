/*
 * One step of a trail — declared, and read by `Breadcrumbs`.
 *
 * ## Why the address is a prop, and why this renders nothing
 *
 * It used to be composed: a step held whatever it should be, usually a `Link`.
 * That works for one structure and cannot work for two. A trail in a narrow
 * container folds its middle into a menu, so the SAME step has to appear
 * either as a link in the row or as a row in a menu — and a `Link` handed in
 * as children can only be the first of those. Reading an address out of
 * somebody else's element is worse than asking for it: it works until they
 * wrap it in a component of their own, and then it fails silently.
 *
 * So the step declares what it is: a label, and an address if there is one.
 * `Breadcrumbs` decides which element that becomes, which is the same shape
 * `Tab` has and for the same reason ([decision
 * 0018](../../../../docs/decisions/0018-a-tab-declares-its-own-panel.md), and
 * 0019 for this one).
 *
 * Nothing is lost by it. A step goes somewhere and where it goes is an
 * address — the catalog rejected `onAction` on a trail for exactly that
 * reason — so the only shapes a step ever had were a link, plain text for a
 * grouping with no page of its own, and the current page. All three are this.
 */

export interface BreadcrumbProps {
  /**
   * Where this step goes.
   *
   * Left out for a step that is not a link: the page you are on, which is the
   * last one, and a grouping level that has no page of its own.
   */
  href?: string;
  /**
   * What the step says. A node, so it can carry a glyph beside the word —
   * received as children, never distributed by us (doc 02 §11).
   */
  children: React.ReactNode;
}

/**
 * One step of a `Breadcrumbs`.
 *
 * ```tsx
 * <Breadcrumb href="/customers">Customers</Breadcrumb>
 * <Breadcrumb>Astilleros del Sur</Breadcrumb>
 * ```
 *
 * Only meaningful inside a trail, which reads it rather than rendering it —
 * the file's note says why that has to be so. On its own it renders nothing.
 */
export const Breadcrumb: (props: BreadcrumbProps) => React.ReactNode = () =>
  null;
