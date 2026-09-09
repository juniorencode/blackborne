import { readDeclarations } from '../../internal/readDeclarations';
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
 * The walk itself is `internal/readDeclarations`, shared with the trail that
 * collapses into a menu — its own file says why that one is shared at two
 * callers when the library's rule is four. What is left here is the part that
 * is only true of tabs: an id has to be unique, because `selectedKey` names
 * one.
 */
export function readTabs(children: React.ReactNode): ReadTabs {
  const { found, strays } = readDeclarations<TabProps>(children, Tab);

  const tabs: TabDeclaration[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const tab of found) {
    /*
     * A repeated id is dropped rather than kept, because keeping it is worse:
     * `selectedKey` would name two tabs, so the structure the width chose
     * would decide which one a person sees.
     */
    if (seen.has(tab.id)) {
      dropped++;
      continue;
    }
    seen.add(tab.id);

    tabs.push({
      id: tab.id,
      title: tab.title,
      ...(tab.textValue === undefined ? {} : { textValue: tab.textValue }),
      isDisabled: tab.isDisabled ?? false,
      children: tab.children
    });
  }

  return { tabs, strays: strays + dropped };
}
