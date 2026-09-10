import { useContext, type ReactNode } from 'react';
import {
  DateFieldStateContext,
  DatePickerStateContext,
  DateRangePickerStateContext,
  TimeFieldStateContext
} from 'react-aria-components';
import { ClearButton } from './ClearButton';
import { KeepsItsRoom } from './KeepsItsRoom';

/*
 * THE ONE ROUTE BY WHICH A DATE BECOMES NOTHING.
 *
 * Doc 07 §2.2a is the exception this exists under, and its fourth condition is
 * why it exists at all: emptying a date field is otherwise **unobservable**.
 * Measured on the base's segments, in jsdom and then in a browser — clearing
 * the month and the day leaves the reported value at the last complete date,
 * and the year segment does not clear at all. So a person can blank what they
 * see while the field neither holds nothing nor says so, and a project cannot
 * offer its own cross because nothing tells it the value changed.
 *
 * This clears the base's own state, which is what makes the callback fire: the
 * value changes, the component's `onChange` maps it, and the consumer hears
 * `null` for the first time.
 *
 * ## Whichever of the two states is above
 *
 * FOUR components hold a date or a time and every one of them publishes its
 * own state context: `DateFieldStateContext`, `TimeFieldStateContext`,
 * `DatePickerStateContext` and `DateRangePickerStateContext`. None publishes
 * another's — the same shape as the two calendars, and read the same way the
 * base's own components read them.
 *
 * A cross that knew only one would silently do nothing in the other three, and
 * silently is the word: there is no error, the button simply does not clear.
 * Which is why the reachability and the clearing are asserted per component
 * rather than once.
 */
const useEitherDateState = () => {
  const date = useContext(DateFieldStateContext);
  const time = useContext(TimeFieldStateContext);
  const picker = useContext(DatePickerStateContext);
  const range = useContext(DateRangePickerStateContext);
  return date ?? time ?? picker ?? range;
};

/**
 * The cross that empties a date field or a picker.
 *
 * Unreachable rather than absent when it has nothing to offer — an empty
 * field — which is rule 1 and the reason it is wrapped rather than returned
 * as `null`: 24px appearing at the edge the moment somebody types a month
 * would move the value on that keystroke and move it back on a backspace.
 */
export function ClearDate({
  hasValue,
  isDisabled
}: {
  hasValue: boolean;
  isDisabled: boolean;
}): ReactNode {
  const state = useEitherDateState();

  return (
    <KeepsItsRoom isReachable={hasValue && !isDisabled}>
      <ClearButton
        /*
         * TAKE NO BUTTON CONTEXT. A `DatePicker` publishes an UNSLOTTED
         * `ButtonContext` carrying the toggle's own props — measured in the
         * base's source, and the same collision decision 0022 records for a
         * combo box. Without this the cross would wear the toggle's id, its
         * name and its press handler, and pressing it would open the layer.
         *
         * Which leaves the toggle as the only button in the row that does NOT
         * name a slot, so it is the one the context reaches. That is the whole
         * arrangement, and it only works while there are exactly two.
         */
        slot={null}
        onPress={() => {
          state?.setValue(null);
        }}
      />
    </KeepsItsRoom>
  );
}
