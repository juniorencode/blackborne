import { Children, Fragment, isValidElement } from 'react';
import { Tab, type TabProps } from './Tab';

/** One tab's declaration, as `Tabs` uses it. */
export interface TabDeclaration {
  id: string;
  title: React.ReactNode;
  textValue?: string;
  isDisabled: boolean;
  children: React.ReactNode;
}

export interface ReadTabs {
  /** The declarations, in the order they were written. */
  tabs: TabDeclaration[];
  /**
   * How many children were not usable declarations — anything that is not a
   * `Tab`, and any `Tab` repeating an id already seen.
   *
   * Counted rather than thrown, and reported rather than swallowed: `Tabs`
   * turns a non-zero count into one development warning. A component that
   * silently drops what it was given is the failure this project keeps
   * finding, and the count is what makes it loud.
   */
  strays: number;
}

/*
 * Reading the declarations is a PURE FUNCTION, which is P6 and also the only
 * way this part is testable at all: it decides what a structure contains, and
 * neither structure exists until something renders.
 *
 * Two things it has to survive, because both are how people write JSX:
 *
 * - `{items.map(…)}` — an array, which `Children.toArray` flattens.
 * - a fragment around a group of tabs, which it does NOT: a fragment arrives
 *   as one child holding its own children, so the walk recurses into it.
 *
 * What it cannot survive, and no collection API anywhere can: a consumer's own
 * component that returns a `Tab`. The element in the tree is theirs, its props
 * are theirs, and nothing about it says "tab". That is the constraint that
 * comes with declarations, and it is reported rather than guessed at.
 */
export function readTabs(children: React.ReactNode): ReadTabs {
  const tabs: TabDeclaration[] = [];
  const seen = new Set<string>();
  let strays = 0;

  const walk = (nodes: React.ReactNode): void => {
    for (const child of Children.toArray(nodes)) {
      if (!isValidElement(child)) {
        /*
         * A string, a number, `false` or `null`. Whitespace and the falsy half
         * of a conditional are how JSX is written and are not mistakes —
         * `Children.toArray` has already removed `null`, `undefined` and the
         * booleans, so what is left here is text somebody meant to put in a
         * tab and put beside one.
         */
        strays++;
        continue;
      }

      if (child.type === Fragment) {
        walk((child.props as { children?: React.ReactNode }).children);
        continue;
      }

      if (child.type !== Tab) {
        strays++;
        continue;
      }

      const {
        id,
        title,
        textValue,
        isDisabled,
        children: content
      } = child.props as TabProps;

      /*
       * A repeated id is dropped rather than kept, and the reason is that
       * keeping it is worse: `selectedKey` would name two tabs, so the
       * structure the width chose would decide which one a person sees.
       */
      if (seen.has(id)) {
        strays++;
        continue;
      }
      seen.add(id);

      tabs.push({
        id,
        title,
        ...(textValue === undefined ? {} : { textValue }),
        isDisabled: isDisabled ?? false,
        children: content
      });
    }
  };

  walk(children);
  return { tabs, strays };
}
