/*
 * WHAT COUNTS AS A MATCH, as a pure function — the whole of what a combo box
 * does that a select does not (P6), and the entry gate box that otherwise gets
 * ticked on faith.
 *
 * ## The shape of this is a measurement, not a preference
 *
 * The base filters a combo box's list itself, and it filters well: read in its
 * source, it builds `useFilter({ sensitivity: 'base' })`, so "jose" finds
 * "José" and "manana" finds "Mañana" through the platform's collator rather
 * than through anybody's regular expression.
 *
 * What it cannot do is look at the OPTION. Its filter is
 * `(textValue, inputValue) => boolean` — the row's text and what was typed —
 * so an option that should also be findable by a word it does not display, a
 * doctor by a speciality, has nowhere to put that word.
 *
 * **Two routes were tried before this one, and both were measured dead.**
 *
 * Putting the extra words in `textValue` filters correctly and is not
 * announced — measured, the row's accessible name stays what the row says.
 * But the base writes `textValue` into the input when an option is chosen, so
 * choosing "Dr. Ruiz" left the field reading "Ruiz cardiology dermatology".
 *
 * Filtering the declarations in the component and rendering only the
 * survivors — the obvious answer, and the one the catalog predicted — does not
 * work at all. The base builds its collection from the list's children in a
 * render pass of its own, and that pass is detached from the surrounding
 * context: measured, a component reading `ComboBoxStateContext` there sees
 * `null`, so it computes an empty query, so every option survives. The visible
 * list came from that pass and showed all three options while the component's
 * own render had correctly narrowed them to one. A filter that cannot be seen
 * from inside the collection is not a filter.
 *
 * So the filtering stays the base's, and this EXTENDS it: the base hands over a
 * row's text, and this answers for the whole option behind that text. Nothing
 * about the input, the selection or the reopening has to be reproduced,
 * because none of it moves.
 */

/** One option, as the two things a query can hit. */
export interface OptionTerms {
  /**
   * The row's text — which is also the key the base filters by, so it is what
   * an option is looked up with here.
   */
  label: string;
  /** The words it can also be found by, which the row does not show. */
  terms: readonly string[];
}

/**
 * The locale-sensitive "contains" the base builds from a collator.
 *
 * Received rather than created, so this file is pure and so the component
 * cannot end up filtering by rules the base's own list does not share.
 */
export type Contains = (text: string, query: string) => boolean;

/** The base's filter signature: a row's text, and what was typed. */
export type OptionFilter = (label: string, query: string) => boolean;

/**
 * The filter to hand the base, built from what the options declared.
 *
 * **Two options with the same text share their keywords**, because the base
 * offers only that text to look them up by. It is a real limitation and a
 * small one — two rows that read identically are indistinguishable to the
 * person reading them too — and the alternative was owning the input's value,
 * the selection and the reopening in order to key by id.
 */
export function optionMatcher(
  options: readonly OptionTerms[],
  contains: Contains
): OptionFilter {
  const byLabel = new Map<string, string[]>();

  for (const { label, terms } of options) {
    const already = byLabel.get(label);
    if (already === undefined) byLabel.set(label, [...terms]);
    else already.push(...terms);
  }

  return (label, query) => {
    /*
     * TRIMMED, which is one deliberate difference from the base.
     *
     * `contains('Alpha', 'al ')` is false, so with the base's own filter a
     * trailing space empties the list and the person typing sees "no results"
     * for a query that matched a moment ago. A space at either end of a query
     * is not a search term — it is what a keyboard leaves behind. Written down
     * because every other rule in this file is "do what the base does".
     */
    const wanted = query.trim();

    /* Nothing typed keeps everything, which is a list nobody has narrowed. */
    if (wanted === '') return true;

    return [label, ...(byLabel.get(label) ?? [])].some(
      term => term !== '' && contains(term, wanted)
    );
  };
}
