import { Children, Fragment, isValidElement } from 'react';

/*
 * INTERNAL. Reading a set of declarations out of what a consumer wrote.
 *
 * Some components take children that are DATA rather than markup, because the
 * pieces they describe land in different places: a `Tab` carries a title for
 * the row and a body for the panel, and a `Breadcrumb` carries a step that
 * appears in the trail or inside the menu the trail collapses into. Neither
 * can render itself, so the parent reads them.
 *
 * ## Why this is shared at two callers rather than at four
 *
 * The library's own rule, written on `controlBox`, is to extract at the fourth
 * copy: an abstraction drawn from two cases fits two cases. It does not apply
 * here, and the difference is worth stating because the rule is a good one.
 *
 * That rule is about STYLE, where two similar-looking class lists often encode
 * two different intentions. This is a walk over React children, and it has one
 * correct behaviour: flatten what `Children.toArray` flattens, step into what
 * it does not, keep what is of the right type, and count everything else. The
 * risk of two copies is not that the abstraction misfits — it is that a fix
 * lands in one of them. The fragment case below is exactly that fix, and it
 * was nearly missed once already.
 *
 * ## What it cannot do
 *
 * See through a component of the consumer's own. `<Invoice />` returning three
 * `Tab` elements is one element whose type is `Invoice`, and nothing about it
 * says tab. Every collection API has this constraint; what this one adds is
 * that the parent can COUNT what it could not use, so a component built on it
 * warns instead of quietly rendering less than it was given.
 */

export interface Declarations<P> {
  /** The props of each matching element, in the order they were written. */
  found: P[];
  /**
   * How many children were not one — anything of another type, and any text
   * or number sitting loose among them.
   *
   * `Children.toArray` has already removed `null`, `undefined` and the
   * booleans, so the falsy half of `{isAdmin && <Tab …/>}` is not counted.
   * Counting it would make a warning fire on correct code, which is how a
   * warning stops being read.
   */
  strays: number;
}

/** Read every child of the given type, with everything else counted. */
export function readDeclarations<P>(
  children: React.ReactNode,
  type: unknown
): Declarations<P> {
  const found: P[] = [];
  let strays = 0;

  const walk = (nodes: React.ReactNode): void => {
    for (const child of Children.toArray(nodes)) {
      if (!isValidElement(child)) {
        strays++;
        continue;
      }

      /*
       * A fragment is stepped into, because that is how JSX is written:
       * `Children.toArray` flattens arrays and does NOT flatten fragments, so
       * a group of declarations behind one would simply be missing — silently,
       * which is the class of defect worth writing a walk for.
       */
      if (child.type === Fragment) {
        walk((child.props as { children?: React.ReactNode }).children);
        continue;
      }

      if (child.type !== type) {
        strays++;
        continue;
      }

      found.push(child.props as P);
    }
  };

  walk(children);
  return { found, strays };
}
