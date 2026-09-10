import { useEffect, useState } from 'react';

/*
 * THE ONE VIEWPORT QUESTION THIS LIBRARY IS ALLOWED TO ASK, and it is allowed
 * only where doc 04 §5 allows it: a component rendered in a PORTAL, whose real
 * container is the window.
 *
 * Everything else adapts to its own container, through `useContainerStep`.
 * This exists because one component cannot: a range calendar inside a popover
 * has to decide how many months to build, and inline-size containment computes
 * an element's width as though it had no contents — so a declared container
 * inside a content-sized layer collapses to its borders (doc 04 §4.3, and the
 * popover that rendered 2px wide is the measurement). The catalog predicted
 * this component would be the exception before either half existed.
 *
 * ## Why a media query and not the container scale
 *
 * `Dialog.css` settled it and the wording is worth repeating: the container
 * scale "describes how wide a CONTAINER is, not when a window has run out of
 * room. The two mean different things and tying them together would make one
 * unchangeable without the other." So a portalled component declares its own
 * number, in the component, with the reason beside it.
 *
 * ## Why JavaScript and not CSS
 *
 * `Dialog` answers its own viewport question in plain CSS, because what
 * changes is presentation. What changes here is the TREE: one month or two is
 * a different number of grids, and the base's state has to be told which,
 * because paging and the range's own arithmetic are computed from the visible
 * duration. Hiding the second month with CSS would leave the state believing
 * in a month nobody can see.
 *
 * ## The first answer is always the narrower one
 *
 * `matchMedia` is read in an effect rather than during render — a server has
 * no window, and rule 3 forbids painting one structure and swapping it, so the
 * first paint is the structure that is safe at any size (§4.1). Widening
 * happens once, in the first frame, which is the same contract
 * `useContainerStep` has.
 */
export function useWindowFits(query: string): boolean {
  const [fits, setFits] = useState(false);

  useEffect(() => {
    /* No window: a server, and the answer stays the narrow one. */
    if (typeof window === 'undefined' || typeof matchMedia !== 'function')
      return;

    const media = matchMedia(query);
    const read = () => setFits(media.matches);
    read();
    media.addEventListener('change', read);
    return () => media.removeEventListener('change', read);
  }, [query]);

  return fits;
}
