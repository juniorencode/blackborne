import type { ReactNode } from 'react';
import { cx } from '../cx';

/**
 * A control at a field's edge, unreachable in every sense that matters and
 * still exactly as wide.
 *
 * Doc 07 §2.2 rule 1, and the mechanism lives in one place so no field can get
 * it wrong: hidden from the reader, unfocusable, unclickable — and still
 * taking up its width, because closing the gap widens the box and slides the
 * value across (doc 09 §3).
 *
 * `inert` rather than a class alone, because `visibility: hidden` is invisible
 * to a test environment with no stylesheet: the control would keep answering
 * to `getByRole` and a check asserting it is gone would pass for the wrong
 * reason. `inert` takes it out of focus order and hit testing, `aria-hidden`
 * out of the accessibility tree, and the class out of sight.
 *
 * **Extracted at the second caller.** `ControlFrame` had it for the whole
 * trailing slot, which was enough while a field owned at most one control
 * there. Doc 07 §2.2a admits a second one for the date family, and two
 * controls at one edge appear and disappear on different conditions — the
 * cross goes when there is nothing to clear, the chevron stays — so the
 * mechanism had to become something a single control can wear.
 */
export function KeepsItsRoom({
  isReachable,
  children
}: {
  isReachable: boolean;
  children: ReactNode;
}): ReactNode {
  return (
    <span
      className={cx(
        'bb:flex bb:flex-none bb:items-stretch',
        !isReachable && 'bb:invisible'
      )}
      {...(isReachable ? {} : { inert: true, 'aria-hidden': true })}
    >
      {children}
    </span>
  );
}
