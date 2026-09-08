import { createContext, forwardRef, useContext } from 'react';
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  DisclosurePanel as AriaDisclosurePanel,
  Heading,
  type Key
} from 'react-aria-components';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';

/**
 * The heading levels a component may render. `1` is deliberately absent: a
 * page has one first-level heading and it is the page's, so a component that
 * rendered one would be claiming to be the document.
 */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/*
 * The heading level, travelling from the group down to its sections.
 *
 * Doc 02 §3.1.1 is the shape of this: a property that belongs to the SET
 * rather than to one member reaches the members through context, and the
 * context is never exported. It carries a primitive, so there is no object
 * identity to memoise and no way for a consumer to be surprised by a
 * re-render.
 *
 * `null` is not a missing value here — it is the difference between the two
 * ARIA patterns this file covers. A section on its own is a disclosure and
 * renders no heading; a section inside a group is an accordion header and must
 * be one. Doc 06 §2.1 cases 2 and 3, and the same component is both because
 * an accordion IS a stack of disclosures.
 */
const HeadingLevelContext = createContext<AccordionHeadingLevel | null>(null);

/*
 * The group: a column of sections with air between them.
 *
 * SEPARATE BOXES RATHER THAN ONE JOINED LIST, which is a real choice and not
 * the lazy one. The joined look — one border round the whole stack, a divider
 * between each pair — needs the first and last section styled differently from
 * the middle, and `:first-child` is a claim about the DOM that breaks the
 * moment a consumer renders a section conditionally. The failure is silent and
 * looks like a rounding bug three screens away from the `{condition && ...}`
 * that caused it.
 *
 * What decides it, though, is that a section has to look right ALONE — it is a
 * component in its own right — and a section whose corners are square until it
 * is put in a group is a section with two appearances.
 */
const GROUP = cx(
  'bb-accordion',
  'bb:box-border bb:flex bb:flex-col bb:gap-(--bb-space-3)'
);

/*
 * One section. The box, and `bb:group` so the chevron inside can read the
 * expanded state off it.
 *
 * NO `overflow-hidden` HERE, which is the tempting addition: the panel clips
 * itself and does not need a second clip, and this box is what the trigger's
 * focus halo spreads over. Hiding overflow at this level would cut the ring on
 * the one control the section has — the rule doc 06 §3 says is broken most
 * often, broken by a class that looks like tidiness.
 */
const SECTION = cx(
  'bb-collapsible',
  'bb:group',
  'bb:box-border bb:rounded-md bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-raised bb:text-text'
);

/*
 * The heading that wraps the trigger inside a group.
 *
 * `m-0` and the type read from tokens, because the package ships no reset: an
 * `<h3>` left alone carries the browser's own margins and its own font size,
 * and neither has anything to do with this design. The weight lives on the
 * button inside, which is the thing that is read.
 */
const HEADING = cx('bb:m-0 bb:font-sans bb:text-md bb:font-normal');

/*
 * The trigger: the whole header row is the button.
 *
 * - A TRANSPARENT BORDER IS ALWAYS THERE. The focus ring is the library's
 *   single one — a border in the ring colour plus a halo — and a border that
 *   only exists while focused would move the title by a pixel every time
 *   somebody tabbed onto it.
 * - `rounded-md` matches the section, so the ring follows the corner it sits
 *   in rather than cutting across it.
 * - `data-focused`, not `data-focus-visible`. The convention is
 *   focus-visible and the reason to break it is consistency: every other
 *   control in this library shows its ring on click too, and doc 09 §8 is
 *   blunt about what one exception costs the other twenty-nine. `Button`
 *   records the same decision at length.
 * - `text-start`, never `text-left`. Half of the RTL support is that this
 *   file contains no physical direction (doc 03 §5 rule 4).
 * - Nothing sets a height. The row is padding plus its content, so a title
 *   that wraps to two lines makes the header taller instead of overflowing —
 *   which is what doc 05 §5 asks of everything that holds text.
 */
const TRIGGER = cx(
  'bb-collapsible-trigger',
  'bb:box-border bb:flex bb:w-full bb:items-center bb:justify-between',
  'bb:gap-(--bb-space-3) bb:px-(--bb-space-4) bb:py-(--bb-space-3)',
  'bb:rounded-md bb:border bb:border-solid bb:border-transparent',
  'bb:bg-transparent bb:text-start',
  'bb:font-sans bb:text-md bb:font-strong bb:leading-normal bb:text-text',
  'bb:cursor-pointer bb:select-none',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:outline-hidden',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:data-focused:border-focus-ring bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/** The title, which yields before the chevron does. */
const TITLE = cx('bb:min-w-0 bb:flex-1 bb:[overflow-wrap:break-word]');

/*
 * The chevron, pointing down when closed and turned over when open.
 *
 * `rotate` and not `transform`: Tailwind emits the individual property, so the
 * transition has to name that property or nothing moves. Bounded by the
 * duration token, which reduced motion sets to 0ms — so the mark still turns
 * over, it just arrives there without the journey (doc 09 §2).
 *
 * Down and up rather than end and down, because down is down in Arabic too.
 * A chevron that pointed along the inline axis would need the direction, and
 * doc 05 §4 is clear that movement along that axis is the one thing with no
 * logical property to lean on.
 */
const CHEVRON = cx(
  'bb-collapsible-chevron',
  'bb:h-mark bb:w-mark bb:flex-none bb:text-text-muted',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-data-expanded:rotate-180'
);

/*
 * The panel, and the height animation the base does the hard half of.
 *
 * MEASURED, in the installed source rather than assumed: `useDisclosure`
 * publishes `--disclosure-panel-height` on this element. It sets it to the
 * scroll height in pixels on the way open, switches it to `auto` once the
 * animations have finished so the content can still resize, and on the way
 * closed sets the pixel height, forces a reflow, sets `0px`, and then waits
 * for `getAnimations()` on THIS element before applying the `hidden`
 * attribute. So a plain CSS transition on `height` is all that is missing, and
 * it works in every browser: no `interpolate-size`, no grid trick, no
 * observer of our own.
 *
 * Two things follow, and both are the reason this note exists.
 *
 * The wait is on animations belonging to THIS element, so the transition has
 * to be here and not on a wrapper. Put it on a parent and the base sees no
 * animation, hides the content immediately, and the box closes on nothing.
 *
 * And the variable is the base's, spelled its way. If a future version renames
 * it the declaration becomes invalid, `height` falls back to `auto`, and the
 * section simply stops animating — no error, nothing in the console. That is
 * what the browser check asserting the height changes over time is for.
 *
 * NO PADDING HERE. Under `box-sizing: border-box` a declared height is floored
 * at padding plus border, so a padded panel would rest 24px tall when it is
 * meant to be closed, with a visible strip of nothing under every collapsed
 * header. The padding and the divider both belong to the content inside.
 */
const PANEL = cx(
  'bb-collapsible-panel',
  'bb:box-border bb:h-(--disclosure-panel-height) bb:overflow-hidden',
  'bb:transition-[height] bb:duration-(--bb-duration-normal) bb:ease-standard'
);

/*
 * Inside the panel: the divider, the air, and the reading type.
 *
 * `border-t` WITHOUT `border-solid`, which looks like an oversight beside the
 * section above and is the opposite. The package ships no reset, so nothing
 * sets `border-width: 0` anywhere — and `border-solid` sets the style on all
 * four sides, which leaves the other three at the browser's initial `medium`.
 * Measured: 1px on top and **3px** on the other three, a box drawn round every
 * open panel and 2px wider than the section holding it.
 *
 * The per-side utility needs no help: Tailwind emits
 * `border-top-style: var(--tw-border-style)` with the variable registered at
 * `solid`, so `border-t` alone carries both the width and the style. Every
 * other `border-solid` in this library is paired with the all-sides `border`,
 * where the width is set on all four and the pairing is harmless.
 *
 * Nothing automated caught it. axe passed, the overflow checks passed, all
 * fourteen browser checks passed — it was found by LOOKING at the new baseline,
 * which is the one step the visual-regression guide insists on.
 */
const CONTENT = cx(
  'bb-collapsible-content',
  'bb:box-border bb:border-t bb:border-border',
  'bb:px-(--bb-space-4) bb:py-(--bb-space-4)',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text'
);

export interface CollapsibleProps {
  /**
   * The header. A node rather than a string, so a count, a badge or an icon
   * can sit in it — composed by the consumer, because doc 02 §11.1 has no
   * `icon` prop and P5 has no case for a `count` one.
   *
   * **It must contain nothing interactive.** The whole row is the button that
   * opens the section, and a button inside a button is invalid HTML that
   * behaves differently in every browser. A section header that needs its own
   * control is a different component and does not exist yet.
   */
  title: React.ReactNode;
  /** What is inside. Rendered whether the section is open or not — see below. */
  children: React.ReactNode;
  /**
   * Identity inside an `Accordion`, matching the keys in `expandedKeys`.
   *
   * Optional, because the base generates one when it is absent and the group
   * works without it. It is needed only to name a section from outside: to
   * open one by default, or to control which are open.
   */
  id?: string;
  /** Controlled. Ignored inside an `Accordion`, which owns that state. */
  isExpanded?: boolean;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultExpanded?: boolean;
  /** Called with the new state, inside a group as well as outside one. */
  onExpandedChange?: (isExpanded: boolean) => void;
  /** Switched off. Inherited from an `Accordion` that is. */
  isDisabled?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A section that folds: a header you press, and content that appears under it.
 *
 * Use it on its own for one block that is not always needed — a panel of
 * filters above a table, the advanced half of a form. For several of them
 * together, put them in an `Accordion`, which is where "one at a time" lives.
 *
 * ## The content is always in the page
 *
 * Measured in the base's source, and worth knowing before putting something
 * expensive in one. A closed panel is hidden with `hidden="until-found"`
 * rather than unmounted, and that is a good trade rather than an oversight:
 *
 * - **Find-in-page works.** A browser searching the page opens a closed
 *   section to show the match. Content that was unmounted cannot be found, and
 *   somebody pressing ctrl-F does not know it is there to look for.
 * - **Nothing inside is reachable while it is closed.** The attribute takes
 *   the panel out of the accessibility tree and out of the tab order, so it is
 *   hidden in every sense that matters — which is the half of doc 06 §4 rule 5
 *   that gets missed.
 *
 * The cost is that a closed section still renders. If what goes inside is a
 * chart or a thousand rows, mount it yourself when the section opens, using
 * `onExpandedChange`.
 *
 * ## `role="group"`, not `role="region"`
 *
 * The panel takes the base's default. A region is a landmark, and the
 * accordion pattern permits one here — but a settings screen with eight
 * sections would put eight entries in a screen reader's landmark list, all
 * named the same as the headings directly above them. Inside an `Accordion`
 * the headings are the route in, which is what doc 06 §2.1 case 3 makes them
 * for.
 */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(
  function Collapsible(
    { title, children, className, style, ...disclosureProps },
    ref
  ) {
    const headingLevel = useContext(HeadingLevelContext);

    const trigger = (
      <AriaButton slot="trigger" className={TRIGGER}>
        <span className={TITLE}>{title}</span>
        <ChevronGlyph className={CHEVRON} />
      </AriaButton>
    );

    return (
      <AriaDisclosure
        ref={ref}
        className={cx(SECTION, className)}
        {...disclosureProps}
        {...(style === undefined ? {} : { style })}
      >
        {headingLevel === null ? (
          trigger
        ) : (
          <Heading level={headingLevel} className={HEADING}>
            {trigger}
          </Heading>
        )}
        <AriaDisclosurePanel className={PANEL}>
          <div className={CONTENT}>{children}</div>
        </AriaDisclosurePanel>
      </AriaDisclosure>
    );
  }
);

export interface AccordionProps {
  /**
   * The level of the headings this renders, from 2 to 6.
   *
   * **Required, and that is the point.** Doc 06 §2.1: the accordion pattern
   * needs each header to be a heading, nothing supplies the level, and a
   * wrong one is invisible — nothing warns, nothing looks wrong, and the only
   * symptom is an outline that reads wrongly to somebody moving through the
   * page by its headings. Being told costs one number.
   *
   * One level for the whole group rather than one per section, because a
   * group whose headers sit at three different depths is not a group.
   */
  headingLevel: AccordionHeadingLevel;
  /** The sections. `Collapsible` elements. */
  children: React.ReactNode;
  /**
   * Whether more than one may be open at a time.
   *
   * Defaults to false — one at a time — because that is what makes an
   * accordion worth using instead of a stack of sections: it keeps the page
   * about the length it started at.
   */
  allowsMultipleExpanded?: boolean;
  /** Controlled: the ids of the open sections. */
  expandedKeys?: Iterable<string>;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultExpandedKeys?: Iterable<string>;
  /** Called with the ids that are open after the change. */
  onExpandedChange?: (keys: Set<string>) => void;
  /** Switches every section off, and each one reports it. */
  isDisabled?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Several sections that fold, with one open at a time unless told otherwise.
 *
 * It is a stack of `Collapsible`s and nothing more — which is why they are one
 * file. What the group adds is the state that has to be shared to be worth
 * anything (opening one closes the last), and the heading level that makes the
 * stack navigable.
 *
 * ```tsx
 * <Accordion headingLevel={3}>
 *   <Collapsible id="billing" title="Billing">…</Collapsible>
 *   <Collapsible id="tax" title="Tax">…</Collapsible>
 * </Accordion>
 * ```
 *
 * Reach for it when a screen has several blocks somebody works through one at
 * a time. Not for the primary structure of a page: a form that is entirely
 * folded away hides how much work is left, and doc 09 §1 is about not making
 * people guess.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      headingLevel,
      children,
      className,
      style,
      onExpandedChange,
      ...groupProps
    },
    ref
  ) {
    return (
      <AriaDisclosureGroup
        ref={ref}
        className={cx(GROUP, className)}
        {...groupProps}
        {...(style === undefined ? {} : { style })}
        {...(onExpandedChange === undefined
          ? {}
          : {
              /*
               * The base's keys are `string | number`; ours are strings, and
               * that is the narrower promise on purpose — doc 08 §7.1's rule
               * that the base's own types stay out of a consumer's
               * signatures. Every key in this group came from our own `string`
               * id or from the base's generated one, so this is a no-op at
               * runtime; it is a map rather than a cast because a cast proves
               * it once and then hopes.
               */
              onExpandedChange: (keys: Set<Key>) => {
                onExpandedChange(new Set([...keys].map(String)));
              }
            })}
      >
        <HeadingLevelContext.Provider value={headingLevel}>
          {children}
        </HeadingLevelContext.Provider>
      </AriaDisclosureGroup>
    );
  }
);
