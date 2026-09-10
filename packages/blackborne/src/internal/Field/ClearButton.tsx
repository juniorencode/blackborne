import { Button } from 'react-aria-components';
import { useMessage } from '../../config';
import { cx } from '../cx';
import { EDGE_BUTTON } from './controlBox';
import { CrossGlyph } from '../CrossGlyph';

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
  /**
   * Which of the surrounding component's button slots this fills, or `null` to
   * fill none of them.
   *
   * **This is not optional decoration.** A base component that publishes NAMED
   * button slots throws on a slotless button inside it — measured, twice:
   * inside a numeric field the error reads "A slot prop is required. Valid slot
   * names are increment and decrement", and inside a tag the valid name is
   * `remove`. A shared button therefore has to be able to say which slot it is,
   * or say that it is none of them.
   *
   * Left undefined inside a search field, where the base publishes an unnamed
   * context and that context IS the behaviour.
   */
  slot?: string | null;
}

/*
 * A NAME A CHECK CAN FIND. `EDGE_BUTTON` is shared with the steppers and the
 * reveal toggle, so the marker belongs to this button rather than to the
 * shared shape — and doc 07 §2.2a's first condition is a measurement of this
 * control's hit area beside another one's, which needs something to select.
 */
const CLEAR = cx('bb-field-clear', EDGE_BUTTON);

export function ClearButton({
  onPress,
  slot
}: ClearButtonProps): React.ReactNode {
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
      {...(slot === undefined ? {} : { slot })}
    >
      {/*
       * The library's own cross, shared rather than copied. The default size
       * is the mark token, the same one Badge's remove button takes, so the
       * marks inside small controls follow density together (doc 02 §11.4).
       */}
      <CrossGlyph />
    </Button>
  );
}
