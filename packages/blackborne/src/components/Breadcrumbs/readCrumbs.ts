import { readDeclarations } from '../../internal/readDeclarations';
import { Breadcrumb, type BreadcrumbProps } from './Breadcrumb';

/** One step's declaration, as `Breadcrumbs` uses it. */
export interface CrumbDeclaration {
  /** Stable enough for a collection key, and derived rather than asked for. */
  id: string;
  href?: string;
  children: React.ReactNode;
}

export interface ReadCrumbs {
  /** The steps, outermost first. */
  crumbs: CrumbDeclaration[];
  /** How many children were not `Breadcrumb` elements. */
  strays: number;
}

/*
 * The steps, read without rendering — P6, and the only way the collapse is
 * testable at all: which steps are shown and which are folded away is a
 * decision about a list, and it has to be right before either structure
 * exists.
 *
 * **No id is asked of a consumer**, which is a difference from `Tabs` worth
 * writing down rather than leaving as an inconsistency. A tab's id is part of
 * its API — `selectedKey` names one — and a step's is not: a trail has no
 * selection, and the address is already unique wherever there is one. So the
 * key comes from the address, or from the position for a step that has none,
 * and a consumer never writes one.
 */
export function readCrumbs(children: React.ReactNode): ReadCrumbs {
  const { found, strays } = readDeclarations<BreadcrumbProps>(
    children,
    Breadcrumb
  );

  return {
    crumbs: found.map((crumb, index) => ({
      id: crumb.href ?? `step-${index}`,
      ...(crumb.href === undefined ? {} : { href: crumb.href }),
      children: crumb.children
    })),
    strays
  };
}

/** How a trail is laid out at one width: every step, or the middle folded. */
export interface TrailShape {
  /** The steps to draw, in order. `null` is where the "…" goes. */
  shown: (CrumbDeclaration | null)[];
  /** The steps behind the "…", in order. Empty when nothing is folded. */
  folded: CrumbDeclaration[];
}

/*
 * WHICH STEPS SURVIVE A NARROW CONTAINER, as a pure function of the list and
 * one boolean.
 *
 * Two ends are kept and never folded, and they are not chosen for symmetry:
 * the FIRST is the way home, which is the link people reach for when they are
 * lost, and the LAST is where they are, which is the whole reason a trail is
 * on the screen. Everything between them is what a menu is for.
 *
 * **The "…" never hides one step.** Folding a single step replaces something
 * you can read with something you have to open, and a menu of one is a worse
 * control than the thing in it. `Pagination` reached the same rule from the
 * other direction — a gap never hides one page — so this is one rule the
 * library now applies twice rather than two rules that happen to agree.
 */
export function trailShape(
  crumbs: CrumbDeclaration[],
  isCollapsed: boolean
): TrailShape {
  const middle = crumbs.slice(1, -1);

  if (!isCollapsed || middle.length < 2) {
    return { shown: crumbs, folded: [] };
  }

  const first = crumbs[0];
  const last = crumbs[crumbs.length - 1];

  /* `middle.length >= 2` guarantees both ends exist; the types do not know. */
  return {
    shown: [
      ...(first === undefined ? [] : [first]),
      null,
      ...(last === undefined ? [] : [last])
    ],
    folded: middle
  };
}
