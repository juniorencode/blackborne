import { useEffect, useRef, useState } from 'react';
import { useAsyncList } from 'react-aria-components';

/*
 * OPTIONS THAT ARRIVE FROM SOMEWHERE, as a hook rather than as a component.
 *
 * The proposal this answers was a second component — an "async combo box"
 * beside the ordinary one. It is not one, and P6's corollary says why in a
 * sentence: an assembly may not have a capability its pieces lack. A component
 * would have been `ComboBox` plus paging, debouncing and three states, and
 * every one of those is logic. So the logic is a hook, the field is the field
 * it already was, and the two meet at one prop.
 *
 * It is also the shape `Toast` established: `useToasts()` makes the queue and
 * the consumer hands it to `ToastRegion`. Here `useAsyncOptions()` makes the
 * source and the consumer hands it to `ComboBox`.
 *
 * ## What is the base's, measured rather than assumed
 *
 * `useAsyncList` does the paging. Measured: it calls `load` with the current
 * filter text, the cursor the previous page handed over, and an `AbortSignal`;
 * a new filter resets the cursor; and **`loadMore()` past the last page calls
 * nothing at all** — the loader returning no cursor is how it learns there is
 * an end, so reaching the bottom of a finished list does not ask again. That
 * last one is worth knowing, because the alternative would have been a request
 * loop nobody notices until a server bill arrives.
 *
 * ## What is ours
 *
 * The waiting. `useAsyncList` asks the moment it is told, so a debounce and a
 * minimum query length are this file's, and they are the two things that
 * separate a search box from a denial-of-service on your own API.
 *
 * ## What is nobody's
 *
 * **The page size.** The loader closes over it: it is the consumer's request
 * to make, and the same answer the page-size selector got — how many rows to
 * fetch is not a property of the thing that displays them.
 *
 * **And the network.** P2: nothing here makes a request. `load` is a function
 * that returns a promise, and a test hands it an array.
 */

/** One page of options, and how to ask for the next. */
export interface OptionsPage<T> {
  /** The options in this page, in the order they should appear. */
  items: readonly T[];
  /**
   * What the next request should carry, or nothing when this was the last
   * page.
   *
   * **Nothing is how the end is declared.** A page with no cursor stops the
   * list asking, which is what makes scrolling to the bottom of a complete
   * list quiet.
   */
  cursor?: string | undefined;
}

/** What a loader is asked for. */
export interface OptionsRequest {
  /**
   * What has been typed, trimmed, and past the minimum length if there is one.
   * Empty on the first load and whenever the field is emptied.
   */
  query: string;
  /** The cursor the previous page handed over. Absent for a first page. */
  cursor?: string;
  /**
   * Aborted when the query moves on while this request is in flight.
   *
   * Worth passing to `fetch`: the answer to a query nobody is waiting for any
   * more is not just useless, it is a race with the answer they are.
   */
  signal: AbortSignal;
}

export interface AsyncOptionsConfig<T> {
  /** Where the options come from. Called with a query, a cursor and a signal. */
  load: (request: OptionsRequest) => Promise<OptionsPage<T>>;
  /**
   * How long to wait after a keystroke before asking, in milliseconds.
   *
   * One of the two numbers this hook exists for. It is a prop rather than one
   * value for the library — which is the exception doc 09 §3.1's "one decision
   * for the library" would otherwise cover — because it is not about how the
   * interface feels: it is about how much traffic somebody's server can take,
   * and the library has no opinion about a server it never talks to.
   *
   * @default 300
   */
  debounce?: number;
  /**
   * How much has to be typed before asking at all.
   *
   * `0` asks immediately, which is right for a list of forty. A catalogue of
   * two hundred thousand wants two or three characters first, and until then
   * the list says so rather than showing a page of nothing in particular.
   *
   * @default 0
   */
  minQueryLength?: number;
}

/**
 * The source a `ComboBox` reads its options from.
 *
 * Half of this is for the consumer — `items` to render, and the three states
 * to react to if they want. The other half is what the field reads out of it,
 * and a consumer needs none of that: it is listed rather than hidden because a
 * type nobody can read is a type nobody can test against.
 */
export interface AsyncOptions<T> {
  /** The options loaded so far, for the consumer to render as options. */
  items: readonly T[];
  /**
   * A first page is on its way: the list has nothing to show yet, either
   * because nothing has been loaded or because the query changed.
   */
  isLoading: boolean;
  /** A further page is on its way, under the options already shown. */
  isLoadingMore: boolean;
  /** The last request failed. `retry` asks again. */
  error: Error | undefined;
  /** Ask again after a failure, with the query as it stands. */
  retry: () => void;
  /** Less than `minQueryLength` has been typed, so nothing has been asked. */
  isWaitingForQuery: boolean;

  /* ---- what the field reads; a consumer wires none of it ---- */

  /** What is in the box right now, including what has not been asked yet. */
  query: string;
  /** The field reports every keystroke here. */
  onQueryChange: (query: string) => void;
  /** The field calls this when the end of the list comes into view. */
  loadMore: () => void;
}

/**
 * Options that arrive from somewhere, paged and debounced.
 *
 * ```tsx
 * const doctors = useAsyncOptions<Doctor>({
 *   minQueryLength: 2,
 *   load: async ({ query, cursor, signal }) => {
 *     const page = await fetch(url(query, cursor), { signal }).then(r => r.json());
 *     return { items: page.rows, cursor: page.next };
 *   }
 * });
 *
 * <ComboBox label="Doctor" source={doctors} onSelectionChange={setDoctor}>
 *   {doctors.items.map(doctor => (
 *     <ComboBoxItem key={doctor.id} id={doctor.id}>{doctor.name}</ComboBoxItem>
 *   ))}
 * </ComboBox>
 * ```
 *
 * The consumer renders the options, because an option is a declaration and
 * only they know what a row should say (decision 0021). What the field takes
 * from the source is the query wiring, the three states and the request for
 * one more page.
 *
 * **The filtering is the server's now.** A field with a source does not filter
 * what it is given — the query went out and these came back — so `keywords` on
 * an option have nothing to do here, and searching by something the row does
 * not show is a `WHERE` clause rather than a prop.
 */
export function useAsyncOptions<T>({
  load,
  debounce = 300,
  minQueryLength = 0
}: AsyncOptionsConfig<T>): AsyncOptions<T> {
  /*
   * The typed text, held here and reported to the base's list only once it has
   * settled. Two values rather than one, because they answer different
   * questions: what somebody can see in the box, and what has been asked for.
   */
  const [query, setQuery] = useState('');

  /*
   * The loader, held in a ref and read through it.
   *
   * A consumer writes `load` inline — that is the whole point of it — so it is
   * a new function on every render. Handed to `useAsyncList` directly it would
   * be a new option every time; kept here, the list sees one stable function
   * that calls whatever the latest render passed.
   */
  const loader = useRef(load);
  /*
   * Kept fresh in an effect rather than in the render body, which the
   * project's lint rules refuse for a reason worth restating: a ref written
   * during render is a write React may throw away or repeat. The first render
   * seeds it, so the first load already has the right function.
   */
  useEffect(() => {
    loader.current = load;
  }, [load]);

  const list = useAsyncList<T, string>({
    load: async ({ filterText, cursor, signal }) => {
      const asked = (filterText ?? '').trim();

      /*
       * BELOW THE MINIMUM, NOBODY IS ASKED — and the guard is here rather than
       * in the effect below because `useAsyncList` loads once on mount whether
       * anything told it to or not. Without this, a field with a minimum of
       * three characters fetched a first page for the empty query before
       * anybody had typed, and then showed it: the "keep typing" row was only
       * ever visible during that request, which is a message that appears for
       * the length of a network call.
       *
       * Found by a browser check that passed for the wrong reason — it was
       * racing the load rather than reading a state.
       */
      if (asked.length < minQueryLength) return { items: [] };

      const page = await loader.current({
        query: asked,
        ...(cursor === undefined ? {} : { cursor }),
        signal
      });

      /*
       * The cursor is spread rather than assigned, because a page with none is
       * the end and `exactOptionalPropertyTypes` tells the difference between
       * a missing property and one holding `undefined`. A consumer writing
       * `cursor: page.next` where `next` may be undefined would otherwise have
       * to narrow it themselves, in their own loader, for a distinction that
       * is ours to make.
       */
      return {
        items: page.items,
        ...(page.cursor === undefined ? {} : { cursor: page.cursor })
      };
    }
  });

  const wanted = query.trim();
  const isWaitingForQuery = wanted.length < minQueryLength;

  /*
   * THE WAIT, and it is the only timer in this library.
   *
   * Cleared on every keystroke, so a run of them makes one request rather than
   * one each. And when the query is too short the list is told to go empty
   * immediately rather than after the delay: there is nothing to wait for, and
   * leaving the previous query's answers on screen would be showing results
   * for a question nobody asked any more.
   */
  useEffect(() => {
    if (isWaitingForQuery) {
      if (list.filterText !== '') list.setFilterText('');
      return;
    }

    if (list.filterText === wanted) return;

    const timer = setTimeout(() => {
      list.setFilterText(wanted);
    }, debounce);

    return () => {
      clearTimeout(timer);
    };
    // `list` is a new object every render; what this depends on is its text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, isWaitingForQuery, debounce, list.filterText]);

  /*
   * The three states, from the base's own `loadingState` plus one of ours.
   *
   * `loading` is a first page and `filtering` is a first page for a new query
   * — the same thing to somebody looking at the list, which is why they are
   * one boolean here. **And a pending keystroke counts as loading**, which is
   * the one judgement in this file: the alternative is a list showing the
   * previous query's answers with nothing saying they are stale, and a list
   * that quietly answers the wrong question is worse than one that says it is
   * thinking.
   */
  const isBehind = !isWaitingForQuery && list.filterText !== wanted;
  const isLoading =
    isBehind ||
    list.loadingState === 'loading' ||
    list.loadingState === 'filtering';

  return {
    items: list.items,
    isLoading,
    isLoadingMore: list.loadingState === 'loadingMore',
    /*
     * READ THROUGH THE STATE, not straight off the list. Measured: the base
     * keeps the last error on hand after a load succeeds, so a field reading
     * `list.error` would show "could not load" over a list that had just
     * arrived. The state is what says whether the last attempt failed.
     */
    error: list.loadingState === 'error' ? list.error : undefined,
    retry: () => {
      list.reload();
    },
    isWaitingForQuery,
    query,
    onQueryChange: setQuery,
    loadMore: () => {
      list.loadMore();
    }
  };
}
