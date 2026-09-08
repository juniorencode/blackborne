import { forwardRef } from 'react';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs
} from 'react-aria-components';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';

/*
 * The trail. An ordered list, and the base's own element rather than ours.
 *
 * NO `<nav>` AROUND IT, and that is a decision rather than an oversight.
 *
 * The accordion pattern's own guidance wraps a breadcrumb trail in a landmark,
 * and the base does not: `useBreadcrumbs` returns a labelled list — the label
 * comes from the base's own localised strings, so it is already in the
 * reader's language — and no role at all. Doc 06 §2 settles what to do about
 * that in one sentence: a component may add the layout and may NOT add the
 * ARIA, and the base leaving an attribute out is usually a decision.
 *
 * Adding the landmark would also cost something measurable: the list is
 * already named, so a `<nav>` named the same thing says the word twice in one
 * breath — which is exactly why a dialog's close button is called "Close" and
 * not "Close dialog" (doc 08 §7.2).
 *
 * It goes on the screen-reader list instead, because whether the landmark is
 * worth the repetition is a question about what a reader hears, and that is
 * the one thing nothing here can measure.
 *
 * `flex-wrap` rather than truncation: a trail too long for its container drops
 * to a second line, which is legible at any width and needs no query. The
 * proper answer for a narrow container — the middle collapsing into a menu —
 * waits for `Menu`, and doc 04 §11 carries the row.
 */
const TRAIL = cx(
  'bb-breadcrumbs',
  'bb:box-border bb:m-0 bb:flex bb:list-none bb:flex-wrap bb:items-center',
  'bb:gap-x-(--bb-space-2) bb:p-0',
  'bb:font-sans bb:text-sm bb:leading-normal bb:text-text-muted'
);

/*
 * One step. The separator belongs to the item that FOLLOWS it, which is what
 * lets CSS drop it on the first one — and a rule keyed on `:first-child`
 * re-evaluates on its own when a consumer renders the first step
 * conditionally.
 */
const STEP = cx(
  'bb-breadcrumb',
  'bb:group bb:box-border bb:flex bb:min-w-0 bb:items-center',
  'bb:gap-x-(--bb-space-2)'
);

/*
 * The separator, and the library's own directional icon.
 *
 * Doc 02 §11.4: the library flips the icons it DRAWS, and this is one of them.
 * The glyph points down, so it is turned a quarter turn to point along the
 * reading direction — anti-clockwise in a left-to-right language and clockwise
 * in a right-to-left one. Nothing about it is a physical `left` or `right`.
 *
 * This is also the reason a consumer cannot supply their own: doc 02 §11.4
 * forbids flipping an icon the library did not draw, because only the meaning
 * decides — so a chevron passed in would point the wrong way in Arabic, and it
 * would do it silently.
 */
const SEPARATOR = cx(
  'bb-breadcrumb-separator',
  'bb:h-mark bb:w-mark bb:flex-none bb:text-text-muted',
  'bb:-rotate-90 bb:rtl:rotate-90',
  // The first step has nothing before it to be separated from.
  'bb:group-first:hidden'
);

/** The step you are on. Not a link, and the weight is what says so. */
const CURRENT = cx('bb:min-w-0 bb:font-strong bb:text-text');

export interface BreadcrumbsProps {
  /** The steps, as `Breadcrumb` elements, outermost first. */
  children: React.ReactNode;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Where you are, and the way back.
 *
 * ```tsx
 * <Breadcrumbs>
 *   <Breadcrumb>
 *     <Link href="/customers">Customers</Link>
 *   </Breadcrumb>
 *   <Breadcrumb>Astilleros del Sur</Breadcrumb>
 * </Breadcrumbs>
 * ```
 *
 * **The last step is text, and the ones before it are links.** That is the
 * whole shape of it: a link goes somewhere and the page you are on is not
 * somewhere to go. The last step is marked as the current page for you.
 *
 * A step is composed rather than configured, so what it holds is whatever it
 * should be: a `Link` for a level you can return to, plain text for one you
 * cannot — a grouping that has no page of its own — and, if an application
 * genuinely navigates by function rather than by address,
 * `Button variant="link"`. The component does not need to know which.
 *
 * ## What it deliberately does not have
 *
 * **No separator prop.** One separator for the library, drawn here so it can
 * be turned round in a right-to-left language. An icon arriving from outside
 * could not be (doc 02 §11.4), so a chevron passed in would point the wrong
 * way in Arabic with nothing to say so.
 *
 * **No first-step prop.** It is the first child.
 *
 * **No collapse yet.** A trail too long for its container wraps to a second
 * line. Folding the middle into a "…" that opens a menu needs `Menu`, and a
 * "…" that opens nothing is doc 04 §7's lost content.
 */
export const Breadcrumbs = forwardRef<HTMLOListElement, BreadcrumbsProps>(
  function Breadcrumbs({ children, className, style }, ref) {
    return (
      <AriaBreadcrumbs
        ref={ref}
        className={cx(TRAIL, className)}
        {...(style === undefined ? {} : { style })}
      >
        {children}
      </AriaBreadcrumbs>
    );
  }
);

export interface BreadcrumbProps {
  /**
   * The step: a `Link`, or text for the one you are on.
   *
   * A `Link` in the last position works and is not what to write: the base
   * marks that link as the current page and disables it, so it becomes a link
   * to where you already are.
   */
  children: React.ReactNode;
  /** Applied to the step itself, for placement. Nothing reaches inside. */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * One step of a trail. Only useful inside `Breadcrumbs`.
 *
 * It draws the separator before its content, and marks itself when it is the
 * last one.
 */
export const Breadcrumb = forwardRef<HTMLLIElement, BreadcrumbProps>(
  function Breadcrumb({ children, className, style }, ref) {
    return (
      <AriaBreadcrumb
        ref={ref}
        className={cx(STEP, className)}
        {...(style === undefined ? {} : { style })}
      >
        {/*
         * The base's render prop, used INSIDE the component. Doc 02 §5 keeps
         * render props out of the public API; it does not forbid reading the
         * base's own state where the base offers it.
         *
         * `aria-current` is here because of what the base does with it rather
         * than in spite of it: measured in the installed source, the base
         * publishes `aria-current: 'page'` for the last step through the LINK
         * context — so a step whose content is a link is marked, and a step
         * whose content is text receives nothing at all. Filling that in is
         * completing the base's own intent for the case its mechanism does not
         * reach, which is the narrow kind of divergence doc 06 §2 allows, with
         * the reason written where it happens.
         */}
        {({ isCurrent }) => (
          <>
            <ChevronGlyph className={SEPARATOR} />
            {isCurrent ? (
              <span aria-current="page" className={CURRENT}>
                {children}
              </span>
            ) : (
              children
            )}
          </>
        )}
      </AriaBreadcrumb>
    );
  }
);
