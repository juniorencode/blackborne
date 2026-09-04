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
  decrement: 'Decrease'
} as const;

export type DictionaryKey = keyof typeof en;

/**
 * A partial dictionary: a project translates what it wants and the rest falls
 * back to English, one key at a time rather than all or nothing.
 */
export type Dictionary = Partial<Record<DictionaryKey, string>>;
