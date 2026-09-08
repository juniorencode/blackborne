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
  cancel: 'Cancel'
} as const;

export type DictionaryKey = keyof typeof en;

/**
 * A partial dictionary: a project translates what it wants and the rest falls
 * back to English, one key at a time rather than all or nothing.
 */
export type Dictionary = Partial<Record<DictionaryKey, string>>;
