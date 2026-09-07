import { Dialog as AriaDialog, Heading } from 'react-aria-components';
import { Button } from '../../components/Button';
import { useMessage } from '../../config';
import { BODY, FOOTER, HEADER, SHEET, TITLE } from './layerBox';

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

  return (
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
          // -my/-me pull the button's own padding back so the cross aligns
          // with the title's first line and the panel's inner edge, rather
          // than sitting a hair inside both.
          className="bb:-my-1 bb:-me-2 bb:flex-none"
        >
          {/*
           * Drawn, not received: doc 02 §11.4 separates the icons the library
           * draws for its own controls from the ones it receives. The same
           * cross and stroke as the fields' clear button, so the marks inside
           * the library's own controls are one shape.
           */}
          <svg
            viewBox="0 0 16 16"
            className="bb:h-4 bb:w-4"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </header>

      <div className={BODY}>{children}</div>

      {footer === undefined || footer === null ? null : (
        <footer className={FOOTER}>{footer}</footer>
      )}
    </AriaDialog>
  );
}
