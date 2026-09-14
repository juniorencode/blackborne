import { Dialog as AriaDialog, Heading } from 'react-aria-components';
import { Button } from '../../components/Button';
import { NoButtonSet } from '../buttonAppearance';
import { useMessage } from '../../config';
import { useScrollableRegion } from '../useScrollableRegion';
import { BODY, FOOTER, HEADER, SHEET, TITLE } from './layerBox';
import { CrossGlyph } from '../CrossGlyph';

/*
 * INTERNAL. The inside of a modal layer: the element that carries
 * `role="dialog"`, a pinned header with the title and a close button, the
 * content, and a pinned footer.
 *
 * Identical in `Dialog` and `Drawer` — the two differ in where the panel lands
 * and how big it may get, never in what is inside it.
 */

export interface ModalSheetProps {
  /** The layer's name, shown as its heading and announced when focus enters. */
  title: React.ReactNode;
  /** The content. It scrolls when it is taller than the panel. */
  children?: React.ReactNode;
  /** The actions, in a footer that stays visible while the content scrolls. */
  footer?: React.ReactNode;
}

export function ModalSheet({
  title,
  children,
  footer
}: ModalSheetProps): React.ReactNode {
  const closeLabel = useMessage('close');
  const { ref: bodyRef, tabIndex: bodyTabIndex } =
    useScrollableRegion<HTMLDivElement>();

  return (
    /*
     * THE SET STOPS HERE. A `ButtonGroup` publishes its appearance through a
     * context, and a React context crosses a portal — so a dialog opened from
     * a row of small buttons would render its own footer small. Measured, and
     * `Button` is the only member type it can happen to.
     *
     * This is the sheet, so it is four layers at one call site: a dialog, a
     * drawer, a confirmation and a popover. It renders no DOM of its own.
     */
    <NoButtonSet>
      <AriaDialog className={SHEET}>
        <header className={HEADER}>
          {/*
           * `Heading slot="title"` and not a plain `<h2>`. This is the only route
           * that gives the layer a name.
           *
           * The base generates the id its `aria-labelledby` points at and hands
           * it down through the title slot's context. Measured with a
           * hand-written heading instead: the id comes from `useSlotId`, which
           * returns undefined when nothing claims the slot, so `aria-labelledby`
           * is never set — and the accessible name comes back empty. The layer is
           * announced as "dialog", which says that something happened and not
           * what.
           *
           * Development does catch it: the base checks the rendered element in an
           * effect and warns. What it cannot catch is production, where that
           * check is compiled out and the only symptom is a screen reader saying
           * nothing useful — which is why the name is asserted in a test rather
           * than left to a console message somebody has to be looking at.
           *
           * The context also supplies `level: 2`, so the element is an `<h2>`
           * without this file choosing.
           */}
          <Heading slot="title" className={TITLE}>
            {title}
          </Heading>
          {/*
           * `slot="close"` is the base's own: a dialog publishes a button slot by
           * that name whose `onPress` closes it, so there is no handler to write
           * and no state to reach for. Our Button forwards `slot` by spread
           * (doc 02 §2).
           *
           * Always rendered, with no prop to remove it. Doc 09 §7 is about
           * accidental closing, not about deliberate exits: `Escape` is
           * invisible, and a layer that is not dismissable by clicking outside
           * would otherwise have no visible way out at all unless its footer
           * happened to provide one. Something that must be answered rather than
           * dismissed is a different component, with a different role.
           */}
          <Button
            slot="close"
            variant="ghost"
            size="sm"
            aria-label={closeLabel}
            /*
             * `-my-1` only, and the `-me-2` that used to sit beside it is
             * gone.
             *
             * Its comment said the pull aligned the cross with "the panel's
             * inner edge", and measured, it did not: the button's box came to
             * rest 8px from the panel while the footer's action rests at 16,
             * and the cross's own ink landed at 21px — past the 16px padding
             * edge it was supposed to meet, and nowhere near the footer
             * button. Neither alignment, from a number nobody had checked.
             *
             * With the pull gone the two boxes agree at 16px, which is what a
             * person compares: the way out at the top and the way through at
             * the bottom, the same distance from the same edge. The vertical
             * pull stays — that one is about the title's first line, which is
             * a different question and still true.
             */
            className="bb:-my-1 bb:flex-none"
          >
            {/*
             * The library's own cross, shared rather than copied — the same
             * shape and stroke as the fields' clear button, which is the point
             * of it being shared (doc 02 §11.4).
             *
             * Bigger than the mark token the small controls use, because this
             * one sits alone in a header rather than beside text.
             */}
            <CrossGlyph className="bb:h-4 bb:w-4" />
          </Button>
        </header>

        {/*
         * The scroll region, and a tab stop while it has somewhere to go.
         * `useScrollableRegion` says why it is conditional and what it
         * observes; doc 08 §4.1 says why the scroll is here at all rather
         * than on the element the base focuses.
         */}
        <div className={BODY} ref={bodyRef} tabIndex={bodyTabIndex}>
          {children}
        </div>

        {footer === undefined || footer === null ? null : (
          <footer className={FOOTER}>{footer}</footer>
        )}
      </AriaDialog>
    </NoButtonSet>
  );
}
