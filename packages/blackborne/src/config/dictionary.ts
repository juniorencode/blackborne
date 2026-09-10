/**
 * Every string the library says on its own.
 *
 * Kept deliberately small. Doc 05 §2.1: if the consumer can supply a string,
 * it is a prop — the dictionary is only for what the consumer cannot know.
 * Accessibility labels for internal controls belong here; application content
 * never does.
 *
 * English is always present as the fallback. A missing key returns English,
 * never an empty string: an empty string is a silent failure that blanks half
 * an interface with no error in the console (doc 05 §2.2, rule 2).
 *
 * Keys are flat and stable. Renaming one is a breaking change.
 */
export const en = {
  /** Accessible name for a loading indicator, which has no visible text. */
  loading: 'Loading',
  /** Announced while a field is waiting for data it needs. */
  fieldLoading: 'Loading',
  /** Announced while a value is being submitted. */
  fieldSaving: 'Saving',
  /**
   * The stepper buttons on a number field, which carry an icon and no text.
   *
   * A button whose only content is an icon always needs an accessible name
   * (doc 06 §3), and the consumer cannot supply these: they are internal
   * controls of a component, not application content (doc 05 §2.1).
   */
  increment: 'Increase',
  decrement: 'Decrease',
  /**
   * The button that takes a removable badge away. It carries a cross and no
   * text, and what it removes is named by the badge beside it.
   */
  remove: 'Remove',
  /**
   * The two empty states, which doc 09 §6 insists are different states with
   * different messages: "there is nothing yet" tells someone how to start,
   * "the filter matched nothing" tells them what was searched.
   *
   * These are fallbacks, not the expected content. A consumer who knows what
   * the list holds passes a better title, and only they can — but a component
   * with no title at all shows an empty box, and the generic version of these
   * two sentences is identical in every application there has ever been.
   */
  emptyStateNoData: 'Nothing here yet',
  emptyStateNoResults: 'No results',
  /**
   * The two an option list says when it is loaded from somewhere.
   *
   * `keepTyping` is what a field with a minimum query length shows before that
   * minimum is reached, and it carries NO NUMBER on purpose: "type at least 3
   * characters" would need a placeholder in a sentence, and how far doc 05
   * §2.2 rule 5's "simple value substitution" stretches is a question the
   * catalog has open rather than one to settle in passing.
   *
   * `loadFailed` is the row a list shows when the load did not arrive. It says
   * what happened and not what to do about it, because what to do depends on
   * the application: typing again asks again, and the hook hands a consumer a
   * `retry` for a control of their own.
   */
  keepTyping: 'Keep typing',
  loadFailed: 'Could not load',
  /**
   * The button that empties a field. It carries a cross and no text, and what
   * it clears is named by the field's own label beside it.
   */
  clear: 'Clear',
  /**
   * Announced once, when a field with a maximum reaches it.
   *
   * The counter itself is silent — a number that changed on every keystroke
   * would turn typing into a drum roll. But the moment the limit is reached
   * the next keystroke is dropped and nothing else says so, which is a change
   * happening in silence for anyone who cannot see the counter (doc 06 §3).
   */
  characterLimitReached: 'Character limit reached',
  /**
   * The two halves of a password field's reveal toggle. The label changes with
   * the state rather than staying fixed, because a button called "Toggle
   * visibility" tells somebody what it is and never what it will do.
   */
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  /**
   * The button that closes a layer — a dialog's cross, and a drawer's.
   *
   * It carries a cross and no text, and unlike the fields' `clear` there is
   * nothing beside it naming what it acts on, so this is the whole name. Not
   * "Close dialog": a screen reader already announces the dialog and its
   * title when focus enters, so the word would be the second time in one
   * breath (doc 06 §3).
   */
  close: 'Close',
  /**
   * The way out of a confirmation.
   *
   * The asymmetry with the confirm button is deliberate and it is the whole
   * decision: **"Cancel" is here and the confirming word is a required prop.**
   *
   * Doc 09 §5.4 says the button names the ACTION — "Delete", "Discard" — never
   * "OK". A default for that would be shipped as "Confirm" by everyone, and the
   * rule would be dead the first day. There is no default, so a consumer has to
   * say what pressing it does.
   *
   * "Cancel" needs no such pressure. It is the one word in a confirmation that
   * nobody customises, it names the action perfectly already, and asking for it
   * would be asking every consumer to type the same string.
   */
  cancel: 'Cancel',
  /**
   * The name of a pagination, on the navigation itself.
   *
   * Ours rather than the base's, because there is no base component here: no
   * headless library in the dependency list covers pagination, so the library
   * implements the pattern and owns its strings (non-goal 6's last resort,
   * with the justification in `pageWindow.ts`).
   *
   * Shared by `Pagination` and `CursorPagination`. They are two components
   * because they take different data (decision 0014), and they are the same
   * thing to somebody listening.
   */
  pagination: 'Pagination',
  /**
   * The two ends. Both carry a chevron and no text, so this is the whole name.
   */
  previousPage: 'Previous page',
  nextPage: 'Next page',
  /**
   * A page button, whose visible content is a number.
   *
   * `{page}` is substituted with the number, formatted for the locale — the
   * only key in this dictionary with a placeholder in it. Doc 05 §2.2 rule 5
   * permits simple value substitution and forbids building a sentence from
   * fragments, which is exactly the line this sits on: one whole sentence,
   * one value, and a translation free to put the number wherever its own
   * grammar wants it.
   *
   * A translation that drops the placeholder loses the number, so the
   * placeholder is part of the contract rather than a convenience.
   */
  page: 'Page {page}',
  /**
   * "Required", for a field whose control cannot say so itself.
   *
   * MEASURED, and it is the reason this key exists at all. `Field` marks a
   * required label with an asterisk and hides it from the reader, because for
   * an input the base sets `aria-required` and reading the star aloud would
   * say it twice. The base's SELECT does not: `required` goes on the hidden
   * native control it renders for the form, and the button a person actually
   * uses carries nothing.
   *
   * So for that field the asterisk is the only channel, and an asterisk
   * announces nothing. This word goes into the label — visually hidden — where
   * it becomes part of the control's accessible name: "Currency required".
   *
   * A word rather than a symbol, because a symbol is not translatable and
   * "asterisk" is not what anybody means.
   */
  required: 'required',
  /*
   * THE TWO STATUSES A STEP HAS TO SAY IN WORDS.
   *
   * A step indicator is `aria-hidden` — a tick and a triangle announce
   * nothing — so the status joins the step title as visually hidden text, the
   * same arrangement `Select` uses for its required state: the visible
   * channel is the mark, the announced one is a word, and nothing is said
   * twice.
   *
   * Two and not four. `active` is `aria-current="step"`, which the platform
   * already announces; `pending` says nothing on purpose, because it is the
   * absence of the other three and a reader hearing it on five steps of seven
   * would hear the word more often than the useful part.
   */
  stepCompleted: 'completed',
  stepFailed: 'failed',
  /**
   * The name of the "…" that holds the middle of a collapsed breadcrumb trail.
   *
   * The visible content is the ellipsis, which says nothing to a reader — the
   * same shape as a required field's asterisk — so this is the whole name, and
   * it names what pressing it gives you rather than what it looks like.
   *
   * Not "Show more", which is the phrase that says nothing: more of what, and
   * a trail has exactly one kind of thing in it.
   */
  moreSteps: 'More steps',
  /**
   * The name of a `SplitButton`'s arrow — the half that opens the menu.
   *
   * Its visible content is a chevron, so this is the whole name, and it names
   * what pressing it gives you rather than the shape it is. It also names the
   * MENU: the base points a menu's accessible name at the control that opened
   * it, which was measured while `Menu` was built.
   *
   * Deliberately not "Save options" or anything derived from the primary
   * action's words. The library does not build sentences out of fragments (doc
   * 05 §2.2 rule 5), and a label glued together from a consumer's own string
   * is exactly that in the language where the word order is different.
   */
  moreActions: 'More actions',

  /*
   * The row of a `TimePicker` that means no time, which is the route doc 07
   * §2.2 rule 5 relies on: a field that opens a layer keeps the chevron and
   * has no clear button, BECAUSE emptying has a route costing no width — "an
   * option that returns to no value". Every other field with a list has a
   * consumer writing its options; this one generates them, so the row has to
   * come from here.
   *
   * "No time" rather than "None", which reads as an absence of anything in a
   * list of times.
   */
  noTime: 'No time'
} as const;

export type DictionaryKey = keyof typeof en;

/**
 * A partial dictionary: a project translates what it wants and the rest falls
 * back to English, one key at a time rather than all or nothing.
 */
export type Dictionary = Partial<Record<DictionaryKey, string>>;
