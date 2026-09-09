/*
 * A tab, and what is behind it — declared together, in one element.
 *
 * ## Why this component renders nothing
 *
 * It is a DECLARATION, read by `Tabs`, and it has to be: the tabs pattern puts
 * every title inside one container and every panel outside it, so a component
 * holding both cannot render itself in one place. `Tabs` splits it — the
 * titles become a tab list, the selected one's children become the panel.
 *
 * The base does it the other way, with a `Tab` for the label and a `TabPanel`
 * for the content, matched by id. That shape repeats every id twice, lets the
 * two halves drift apart, and — measured — leaves a panel labelled by
 * `aria-labelledby="undefined-tab-b"` the moment the list stops being
 * rendered, which is exactly what a narrow structure does. One declaration
 * cannot drift from itself, and it is also the only shape from which the
 * narrow structure can be derived at all: a select needs the titles and the
 * content of one of them.
 *
 * It is the same contract a collection item has anywhere — the element is
 * data, not markup — and the same constraint comes with it: a consumer's own
 * component wrapping a `Tab` is not a `Tab`, and `Tabs` says so in
 * development rather than dropping it silently.
 */

export interface TabProps {
  /** Its identity, and what `selectedKey` names. */
  id: string;
  /**
   * What the tab says. A node, so it can carry a count or an icon beside the
   * word — which is the case that rejected an `items` array in the first place.
   */
  title: React.ReactNode;
  /**
   * The title as plain text, for a title that is not.
   *
   * MEASURED on `Select`, and this is the same trap one level up: the base
   * derives a collection item's searchable text from its children, and
   * anything that is not a string derives nothing — so the typeahead over the
   * tab list silently stops working, with a development warning nobody reads.
   * A string title needs none of this.
   */
  textValue?: string;
  /** Present but not selectable. */
  isDisabled?: boolean;
  /** What is behind it. Rendered only while this tab is the selected one. */
  children: React.ReactNode;
}

/**
 * One tab of a `Tabs`, and the content it reveals.
 *
 * ```tsx
 * <Tab id="lines" title="Lines">…</Tab>
 * ```
 *
 * Only meaningful inside `Tabs`, which reads it rather than rendering it —
 * the file's own note says why that has to be so. On its own it renders
 * nothing.
 */
export const Tab: (props: TabProps) => React.ReactNode = () => null;
