import { forwardRef, useRef } from 'react';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs
} from 'react-aria-components';
import { Button } from '../Button';
import { Link } from '../Link';
import { Menu, MenuItem } from '../Menu';
import { useMessage } from '../../config';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import { useDevWarning } from '../../internal/useDevWarning';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';
import { readCrumbs, trailShape } from './readCrumbs';

/*
 * The container the query asks about, and it is new: the trail used to BE the
 * list.
 *
 * `w-full` beside `@container` is doc 04 §4.3's law — inline-size containment
 * computes a width as though the element had no contents, so anything sized by
 * its contents collapses to its borders, and a trail is sized by its contents
 * everywhere. `Pagination` and `Tabs` pair the two for the same reason.
 */
const ROOT = cx('bb-breadcrumbs-root', 'bb:@container bb:box-border bb:w-full');

/*
 * The trail. An ordered list, and the base's own element rather than ours.
 *
 * NO `<nav>` AROUND IT, and that is a decision rather than an oversight.
 *
 * The breadcrumb pattern's own guidance wraps a trail in a landmark, and the
 * base does not: `useBreadcrumbs` returns a labelled list — the label comes
 * from the base's own localised strings, so it is already in the reader's
 * language — and no role at all. Doc 06 §2 settles what to do about that in
 * one sentence: a component may add the layout and may NOT add the ARIA, and
 * the base leaving an attribute out is usually a decision.
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
 * `flex-wrap` is the floor UNDERNEATH the collapse rather than an alternative
 * to it: a query counts pixels and cannot know whether these particular words
 * fit, so a trail of two long steps in a wide container still needs somewhere
 * to go. It wraps. Doc 04 §11.2, and `Tabs` needed exactly the same pair.
 *
 * It also carries the four step classes, because the step has to be read from
 * an element INSIDE the container — a container query asks an ancestor — and
 * the list exists in both structures. `Tabs` needed a box of its own for that;
 * a trail does not, because the list is what stays.
 */
const TRAIL = cx(
  'bb-breadcrumbs',
  CONTAINER_STEPS,
  'bb:box-border bb:m-0 bb:flex bb:list-none bb:flex-wrap bb:items-center',
  'bb:gap-x-(--bb-space-2) bb:p-0',
  'bb:font-sans bb:text-sm bb:leading-normal bb:text-text-muted'
);

/*
 * One step. The separator belongs to the item that FOLLOWS it, which is what
 * lets CSS drop it on the first one — and a rule keyed on `:first-child`
 * re-evaluates on its own when the structure changes underneath it, which is
 * now something that happens.
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

/** A step with no address and no page: a grouping level, as plain as it reads. */
const PLAIN = cx('bb:min-w-0');

/*
 * The "…" that holds the middle.
 *
 * A ghost button, so the trail does not grow a box in the middle of itself,
 * and the ellipsis is the visible content while the NAME comes from the
 * dictionary — the same division a required field's asterisk has, and hard
 * rule 3: an accessibility label is text a person reads even though it is not
 * seen.
 */
const MORE = cx('bb-breadcrumbs-more', 'bb:px-(--bb-space-1)');

/*
 * Which widths keep the whole trail.
 *
 * A select below `medium` and a row of tabs above it is the boundary `Tabs`
 * chose, and a trail takes the same one for a reason that is not symmetry:
 * both are a line of labels whose length nobody can predict, and one scale
 * with one boundary is what stops two components disagreeing about what
 * "narrow" means at the width where it matters.
 *
 * Above it, nothing folds — a trail that hid its middle in a container with
 * room for it would be hiding something for no reason. Below it, the middle
 * folds, unless folding would hide a single step (see `trailShape`).
 */
const COLLAPSED = { base: true, narrow: true, medium: false, wide: false };

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
 *   <Breadcrumb href="/customers">Customers</Breadcrumb>
 *   <Breadcrumb href="/customers/4821">Astilleros del Sur</Breadcrumb>
 *   <Breadcrumb>Invoices</Breadcrumb>
 * </Breadcrumbs>
 * ```
 *
 * **The last step is text, and the ones before it are links.** That is the
 * whole shape of it: a link goes somewhere and the page you are on is not
 * somewhere to go. The last step is marked as the current page for you, and a
 * step with no `href` is a grouping level that has no page of its own.
 *
 * ## In a narrow container the middle folds into a menu
 *
 * Below the medium step the trail keeps the two steps that matter — the way
 * home and where you are — and everything between them moves into a "…" that
 * opens a menu of ADDRESSES. Doc 04 §11.2, and the third caller of §6's one
 * hook.
 *
 * Two rules come with it, and both exist to stop the collapse making things
 * worse. **The "…" never hides one step**, because a menu of one is a worse
 * control than the thing in it — the same rule `Pagination` reached from the
 * other direction, where a gap never hides one page. And a folded step with no
 * address appears in the menu dimmed rather than as somewhere to go, which is
 * what it already was in the row.
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
 * **No `onAction`.** A step goes somewhere and where it goes is an address.
 */
export const Breadcrumbs = forwardRef<HTMLDivElement, BreadcrumbsProps>(
  function Breadcrumbs({ children, className, style }, ref) {
    const list = useRef<HTMLOListElement>(null);
    const step = useContainerStep(list);
    const { crumbs, strays } = readCrumbs(children);
    const moreSteps = useMessage('moreSteps');

    useDevWarning(
      strays > 0,
      'Breadcrumbs: some children are not Breadcrumb elements and were ' +
        'dropped. A Breadcrumb is read rather than rendered, so a component ' +
        'of your own that returns one is not one.'
    );

    const { shown, folded } = trailShape(crumbs, COLLAPSED[step]);

    /* No steps is no trail, the way zero pages renders no pager. */
    if (shown.length === 0) return null;

    return (
      <div
        ref={ref}
        className={cx(ROOT, className)}
        {...(style === undefined ? {} : { style })}
      >
        <AriaBreadcrumbs ref={list} className={TRAIL}>
          {shown.map(crumb =>
            crumb === null ? (
              /*
               * The "…" is a STEP of the list rather than something beside it,
               * so the separator rule applies to it like any other and the
               * trail stays a well-formed list of steps. It is also the only
               * way it could work: a menu is a collection, and an element the
               * base's list builder does not recognise is not in the list at
               * all — measured on a menu's own separator.
               */
              <AriaBreadcrumb key="folded" className={STEP}>
                <ChevronGlyph className={SEPARATOR} />
                <Menu
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={moreSteps}
                      className={MORE}
                    >
                      …
                    </Button>
                  }
                >
                  {folded.map(hidden =>
                    hidden.href === undefined ? (
                      <MenuItem key={hidden.id} id={hidden.id} isDisabled>
                        {hidden.children}
                      </MenuItem>
                    ) : (
                      <MenuItem
                        key={hidden.id}
                        id={hidden.id}
                        href={hidden.href}
                      >
                        {hidden.children}
                      </MenuItem>
                    )
                  )}
                </Menu>
              </AriaBreadcrumb>
            ) : (
              <AriaBreadcrumb key={crumb.id} className={STEP}>
                {/*
                 * The base's render prop, used INSIDE the component. Doc 02 §5
                 * keeps render props out of the public API; it does not forbid
                 * reading the base's own state where the base offers it.
                 *
                 * `aria-current` is here because of what the base does with it
                 * rather than in spite of it: measured in the installed
                 * source, the base publishes `aria-current: 'page'` for the
                 * last step through the LINK context — so a step whose content
                 * is a link is marked, and a step whose content is text
                 * receives nothing at all. Filling that in completes the
                 * base's own intent for the case its mechanism does not reach,
                 * which is the narrow divergence doc 06 §2 allows, with the
                 * reason written where it happens.
                 */}
                {({ isCurrent }) => (
                  <>
                    <ChevronGlyph className={SEPARATOR} />
                    {isCurrent ? (
                      <span aria-current="page" className={CURRENT}>
                        {crumb.children}
                      </span>
                    ) : crumb.href === undefined ? (
                      <span className={PLAIN}>{crumb.children}</span>
                    ) : (
                      <Link href={crumb.href}>{crumb.children}</Link>
                    )}
                  </>
                )}
              </AriaBreadcrumb>
            )
          )}
        </AriaBreadcrumbs>
      </div>
    );
  }
);
