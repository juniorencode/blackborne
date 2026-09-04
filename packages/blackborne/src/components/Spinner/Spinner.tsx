import { forwardRef } from 'react';
import { useMessage } from '../../config';
import { cx } from '../../internal/cx';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/*
 * Sized against the type scale rather than the control scale: a spinner sits
 * next to text as often as it sits inside a control, and one icon size used
 * almost everywhere is what keeps the system from drifting (doc 03 §4.6d).
 */
const SIZE: Record<SpinnerSize, string> = {
  sm: 'bb:size-3',
  md: 'bb:size-4',
  lg: 'bb:size-5'
} satisfies Record<SpinnerSize, string>;

export interface SpinnerProps {
  size?: SpinnerSize;
  /**
   * An accessible name. Defaults to the library's own "Loading" from the
   * dictionary, in the active language.
   *
   * Pass one when you can say something more useful — "Loading customers"
   * beats "Loading", and only the consumer knows that (doc 05 §2.1).
   */
  label?: string;
  /**
   * Hide it from assistive technology, for when the surrounding element
   * already announces the busy state and a second announcement would be noise.
   */
  isDecorative?: boolean;
  className?: string;
}

/**
 * An indeterminate loading indicator.
 *
 * Under reduced motion it stops rotating and becomes a static ring. That is
 * doc 09 §2 taken literally: motion is removed, not softened. A spinner frozen
 * mid-rotation would read as broken, so the still form is drawn as a complete
 * shape on purpose.
 *
 * It does not decide when to appear. Doc 09 §3: under about 300ms, show
 * nothing at all — appearing and vanishing produces a flicker that reads worse
 * than silence. Whoever owns the timing owns that call.
 */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { size = 'md', label, isDecorative = false, className },
  ref
) {
  const fallback = useMessage('loading');
  const accessibleName = label ?? fallback;

  return (
    <svg
      ref={ref}
      className={cx('bb-spinner', SIZE[size], className)}
      viewBox="0 0 16 16"
      fill="none"
      /*
       * Decorative or named, never neither. An indicator nobody can perceive
       * is a change that happens in silence for anyone using a screen reader
       * (doc 06 §3).
       */
      {...(isDecorative
        ? { 'aria-hidden': true }
        : { role: 'progressbar', 'aria-label': accessibleName })}
    >
      {/* The track. Deliberately faint: it is orientation, not information. */}
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      {/* The arc that moves. */}
      <path
        className="bb-spinner-arc"
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
});
