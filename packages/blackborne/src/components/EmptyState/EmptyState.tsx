import { forwardRef } from 'react';
import { useMessage, type DictionaryKey } from '../../config';
import { cx } from '../../internal/cx';

export type EmptyStateVariant = 'no-data' | 'no-results';

export type EmptyStateSize = 'sm' | 'md';

/*
 * The variant map, and the reason the component exists at all.
 *
 * Doc 09 §6 keeps these apart on purpose: "there is nothing yet" tells someone
 * how to start, "the filter matched nothing" tells them what was searched and
 * offers to clear it. Showing the first when the second is true — "no
 * customers" when there are a thousand and the filter missed — is named there
 * as one of the most common experience bugs there is.
 *
 * What the map holds is a dictionary key rather than a class string, because
 * the two states are not two appearances. They look identical, and they should:
 * a different colour or a different frame would say one of them is a failure,
 * and neither is. The whole difference is the sentence.
 *
 * `satisfies` is what stops the union and the map drifting — adding a variant
 * without adding its key here is a type error.
 */
const VARIANT: Record<EmptyStateVariant, DictionaryKey> = {
  'no-data': 'emptyStateNoData',
  'no-results': 'emptyStateNoResults'
} satisfies Record<EmptyStateVariant, DictionaryKey>;

interface SizeClasses {
  root: string;
  icon: string;
  title: string;
}

/*
 * Two sizes, and `sm` is the one used most: an empty state sits inside a table
 * body, a dropdown or a side panel far more often than it gets a screen of its
 * own, and 48px of air above the title pushes everything below it out of view.
 *
 * `sm` and `md` rather than the `compact` this was first written with, for two
 * reasons. One vocabulary: doc 02 §3 fixes `sm | md | lg` for every `size` in
 * the library, and a component with its own words for the same idea is the
 * "two different ways to do the same thing" of doc 01 §7. And `compact` is
 * already taken — it is a value of the density axis, so a `size="compact"`
 * that has nothing to do with compact density is a collision waiting to
 * confuse somebody.
 *
 * A closed `size` prop and not an `isCompact` boolean, either. Doc 01 §7 lists
 * that exact boolean as a sign the rules are slipping: booleans arrive one per
 * case and allow combinations that mean nothing, while a closed set cannot be
 * in two states at once.
 *
 * The density axis is a different thing entirely: it belongs to the
 * application and is set on a container (doc 03 §3). Both are live at once and
 * they compose, because the spacing below is read from the density tokens
 * rather than written as numbers — a small empty state in a compact
 * application is trimmed twice, by two people who each decided one thing.
 */
const SIZE: Record<EmptyStateSize, SizeClasses> = {
  md: {
    root: 'bb:gap-(--bb-space-5) bb:px-(--bb-space-5) bb:py-(--bb-space-8)',
    icon: 'bb:size-8',
    title: 'bb:text-lg'
  },
  sm: {
    root: 'bb:gap-(--bb-space-3) bb:px-(--bb-space-4) bb:py-(--bb-space-5)',
    /*
     * The one place a second icon size is justified (doc 03 §4.6d). Every other
     * icon in the library sits on a line of text and is sized to it; this one
     * stands alone above the title, and at text size it reads as a stray glyph
     * somebody forgot to delete rather than as part of the message.
     */
    icon: 'bb:size-5',
    /*
     * Compact drops the title to the body size and leans on weight and colour
     * instead, which is doc 03 §4.6a: hierarchy is made with colour, not size.
     * Two type sizes across the component, not four competing.
     */
    title: 'bb:text-md'
  }
} satisfies Record<EmptyStateSize, SizeClasses>;

/*
 * No background, no border and no radius, which is the one thing about this
 * component that looks unfinished and is not: it is placed inside a table, a
 * card or a panel that already drew one, and a second box inside the first
 * reads as a component that lost its place.
 */
const ROOT = cx(
  /*
   * The package ships no reset, so a box with a width and padding has to say
   * box-border itself. Without it `w-full` plus padding measures wider than
   * its container and overflows the exact 320px panel this has to survive.
   */
  'bb:box-border',
  'bb:flex bb:w-full bb:flex-col bb:items-center bb:text-center',
  'bb:font-sans bb:text-md bb:text-text'
);

const TEXT = cx(
  'bb:flex bb:flex-col bb:gap-(--bb-space-2)',
  /*
   * A max-width, never a width (doc 04 §3). It caps the line length of a
   * description across a wide table and does nothing at all inside a 320px
   * panel, which is the whole difference between the two.
   */
  'bb:max-w-narrow',
  /*
   * The one string here that nobody wrote: a "no results" description usually
   * quotes what somebody typed into the filter, and an unbroken 60-character
   * term bursts the box in silence. Doc 04 §3 asks for long text to wrap
   * explicitly rather than by luck.
   */
  'bb:break-words'
);

/*
 * A div and not a heading: doc 06 §2 puts heading hierarchy in the project's
 * column, and the library cannot see the document it lands in — a hard-coded
 * `h3` under someone's `h2` is either a level skipped or a level too deep, with
 * no way for them to correct it.
 *
 * Not a `p` either, and that one is mechanical: with no reset shipped, a
 * paragraph arrives carrying the browser's own block margins, which fight the
 * gap that spaces this and put the description a full line away from its title.
 */
const TITLE = 'bb:font-strong bb:leading-tight';

const DESCRIPTION = 'bb:text-text-muted bb:leading-normal';

const ICON = cx(
  'bb:box-border bb:flex bb:shrink-0 bb:items-center bb:justify-center',
  /*
   * Colour comes from the slot and from nowhere else (doc 02 §11.2). The
   * consumer passes none, the icon is drawn with currentColor, and it inherits
   * this. Muted deliberately: the illustration is the quietest thing in the
   * block, and doc 03 §4.6a builds hierarchy out of colour.
   */
  'bb:text-text-muted',
  /*
   * Size comes from the slot too, and the rule has to land on the SVG rather
   * than on this wrapper: an icon set writes its own width and height
   * attributes, and a CSS declaration beats a presentation attribute. That is
   * what lets a set that defaults to 24px come out at ours with nothing
   * configured (doc 02 §11.2).
   */
  'bb:[&_svg]:size-full'
);

const ACTIONS = cx(
  /*
   * Wrapping is not optional. Two actions with real labels in a 320px panel do
   * not fit on one line in any language, and a row that refuses to wrap pushes
   * the second button out of the container instead (doc 04 §3).
   */
  'bb:flex bb:flex-wrap bb:items-center bb:justify-center',
  'bb:gap-(--bb-space-3)'
);

export interface EmptyStateProps {
  /**
   * Which of the two empty states this is. A closed set, and the component's
   * reason for existing (doc 09 §6).
   *
   * `no-data` when there is nothing yet, `no-results` when a filter or a search
   * came back with nothing. It selects the fallback title, and only that: the
   * two look the same on purpose.
   */
  variant?: EmptyStateVariant;
  /**
   * Vertical air. `sm` for an empty state embedded in a table body, a dropdown
   * or a narrow panel, which is where most of them live. It is not the density
   * axis, which the application sets on a container and which composes with
   * this.
   */
  size?: EmptyStateSize;
  /**
   * An illustration above the title.
   *
   * **This is a named slot and it is meant to be one — please do not "fix" it
   * into children.** Doc 02 §11.1 states the test: could the consumer have put
   * it there themselves by ordering children? Here they could not. It sits
   * above the title, outside the flow of the text, in a place no ordering of
   * children reaches — which is precisely the exception the convention allows,
   * and the document names this component while stating it. The slot is named
   * for its role, not for a position.
   *
   * Pass no size and no colour: both come from the slot (doc 02 §11.2). The
   * icon must be drawn with `currentColor`, as every mainstream set already is;
   * one that hard-codes a colour will not follow the theme.
   *
   * It is hidden from assistive technology, because the title beside it always
   * says the same thing and a second announcement is noise (doc 02 §11.3).
   */
  icon?: React.ReactNode;
  /**
   * What this is. Falls back to the library's own sentence for the variant, in
   * the active language.
   *
   * Pass one whenever you can, and you usually can: only the consumer knows
   * what the list holds, and "No invoices match these filters" orients someone
   * where "No results" merely informs them (doc 09 §9). The fallback exists so
   * that a component with no title is never an empty box (doc 05 §2.1).
   */
  title?: React.ReactNode;
  /**
   * The line under the title: how to start, or what was searched for.
   *
   * No default, and there cannot be one. Doc 09 §6 asks the "no data" state to
   * say how to begin and the "no results" state to say what was searched — both
   * are facts about the consumer's data that the library has no way to know
   * (doc 05 §2.1).
   */
  description?: React.ReactNode;
  /**
   * The actions, at the end. Composed by the consumer: a primary action for
   * "no data", an offer to clear the filter for "no results" (doc 09 §6).
   *
   * Structure is composition (doc 02 §3), so there is no `action` prop and no
   * `secondaryAction` beside it — that pair is how a component starts growing
   * one prop per arrangement.
   */
  children?: React.ReactNode;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * What a listing shows when it has nothing to show.
 *
 * There are two of those and they are not interchangeable, which is the whole
 * point of the `variant` prop — see doc 09 §6, and the note on `VARIANT` above.
 *
 * Nothing here has a fixed width and the text wraps, so it works in a 320px
 * panel with no query written (doc 04 §3).
 *
 * **What it does not do**, written down rather than left to be found later
 * (doc 06 §7): it declares no live region. This component cannot tell whether
 * it has been on the screen since the page loaded or has just replaced a table
 * because a filter came back empty, and only the second is a change worth
 * announcing. Whatever swaps the content owns that announcement, because it is
 * the only thing that knows a swap happened.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      variant = 'no-data',
      size = 'md',
      icon,
      title,
      description,
      children,
      className,
      style
    },
    ref
  ) {
    /*
     * One call, with a key that varies. The fallback is per variant because the
     * two sentences are the component (doc 09 §6), and both keys are the
     * library's own text, so they come from the dictionary in the active
     * language rather than from a literal in here (doc 05 §2.2).
     */
    const fallbackTitle = useMessage(VARIANT[variant]);

    return (
      <div
        ref={ref}
        className={cx(ROOT, SIZE[size].root, className)}
        style={style}
      >
        {icon ? (
          /*
           * aria-hidden on the library's own wrapper, not on the consumer's
           * icon. Doc 02 §11.3 leaves the attribute to the consumer for an icon
           * passed as a child, because wrapping arbitrary children to add one
           * is the internal-node reach §6 forbids. A named slot is the case
           * where that reasoning does not apply: this element is ours, and the
           * illustration is decorative by construction — the title always
           * exists, so the icon is never the only carrier of meaning
           * (doc 02 §11.5).
           */
          <div className={cx(ICON, SIZE[size].icon)} aria-hidden="true">
            {icon}
          </div>
        ) : null}

        <div className={TEXT}>
          <div className={cx(TITLE, SIZE[size].title)}>
            {title ?? fallbackTitle}
          </div>
          {description ? (
            <div className={DESCRIPTION}>{description}</div>
          ) : null}
        </div>

        {children ? <div className={ACTIONS}>{children}</div> : null}
      </div>
    );
  }
);
