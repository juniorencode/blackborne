import { Button } from 'react-aria-components';
import { useMessage } from '../../config';
import { cx } from '../cx';

/*
 * INTERNAL. The cross that empties a field.
 *
 * One button for three fields. It was written once for SearchField, where the
 * base supplies the behaviour, and the moment a text field wanted one it had
 * to become shared — the alternative is three crosses that agree today and
 * drift the first time one of them is adjusted (doc 01 §7).
 *
 * It lives in the frame's trailing slot, in the flow, which is what keeps it
 * out of the busy indicator's pixels. The frame owns what happens when it has
 * nothing to offer (doc 07 §2.2): unreachable, and still the same width.
 */

export interface ClearButtonProps {
  /**
   * What to do. Omitted inside a `SearchField`, where the base's own context
   * gives the button its behaviour and adding a handler would run it twice.
   */
  onPress?: () => void;
}

const CLEAR = cx(
  'bb:box-border bb:flex bb:items-center bb:justify-center',
  /*
   * The target, and the part of a control like this that is usually wrong.
   *
   * A cross drawn at 14px is a 14px target unless something says otherwise,
   * and doc 06 §3 wants the minimum at EVERY density, compact included. Both
   * axes take the hit-area token, so compact trims the mark and never the
   * target — 28px normal, 24px compact, with the mark going 14px to 11px
   * underneath it.
   */
  'bb:min-h-hit bb:min-w-hit',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent bb:text-text-muted',
  'bb:rounded-md',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover bb:data-hovered:text-text',
  'bb:data-pressed:bg-surface-active',
  // Inside the frame's own ring, so it must not draw a second one — the
  // library has one ring and two nested is noise.
  'bb:outline-hidden',
  'bb:data-focus-visible:bg-surface-hover bb:data-focus-visible:text-text',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export function ClearButton({ onPress }: ClearButtonProps): React.ReactNode {
  const label = useMessage('clear');

  return (
    <Button
      className={CLEAR}
      /*
       * The name comes from our dictionary, replacing the base's own localised
       * "Clear search" inside a search field. Two dictionaries in one
       * interface is one too many: a project that translated `clear` would see
       * its word on every other cross in the library and not on that one. Ours
       * wins because the base merges its context props underneath the
       * element's — verified against the installed source, not assumed.
       *
       * An `aria-label` and not visually hidden text, which is the opposite of
       * the numeric steppers: there the base points `aria-labelledby` at the
       * field's label and labelledby beats label, so a name given here would
       * be dropped. There is no labelledby on this button, so doc 02 §11.3
       * applies plainly — the name of an icon-only control goes on the control.
       */
      aria-label={label}
      {...(onPress === undefined ? {} : { onPress })}
    >
      {/*
       * Drawn rather than received: doc 02 §11.4 lets the library draw and
       * size the icons belonging to its own controls. The same cross and the
       * same mark size Badge's remove button uses, so the marks inside small
       * controls are one size and follow density together.
       */}
      <svg
        viewBox="0 0 16 16"
        className="bb:h-mark bb:w-mark"
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
  );
}
