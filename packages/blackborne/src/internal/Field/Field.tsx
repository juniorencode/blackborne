import { FieldError, Label, Text } from 'react-aria-components';
import { Spinner } from '../../components/Spinner';
import { useMessage } from '../../config';
import { cx } from '../cx';

/*
 * INTERNAL. Not exported from the package.
 *
 * Every field type is built from this, so its design is the bottleneck the
 * build order warns about: more than twenty components depend on it and
 * redesigning it later means touching all of them.
 *
 * It is not public yet because nobody has asked twice for the ability to build
 * a custom field (P5). When a second consumer does, it goes public unchanged —
 * that is the point of getting it right now rather than later.
 *
 * It must be rendered inside one of the base's field containers (TextField,
 * NumberField, Select…). That container owns the ARIA wiring: the label is
 * associated with the control, the description and the error are referenced by
 * it, and the error is announced when it appears. Doing that by hand is
 * non-goal 6, and it is the part that most often looks right and is not.
 */

export interface FieldStructureProps {
  /**
   * Always present. It may be visually hidden, but a control without a label
   * has no name for anyone who cannot see the layout (doc 07 §4).
   */
  label: React.ReactNode;
  /** Persistent help text. It is not replaced by an error; it accompanies one. */
  description?: React.ReactNode;
  /**
   * The error to show. The library presents it; deciding there is one, and
   * writing it, belongs to the project (doc 07 §1).
   */
  errorMessage?: React.ReactNode;
  /**
   * Marks the label. On a field with an INPUT the announcement comes from the
   * base's `aria-required`; where the base publishes no such attribute, the
   * component says the word itself (decision 0017).
   */
  isRequired?: boolean;
  /** Waiting for data the field needs, such as a list of options. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /**
   * How much of a limit has been used, at the trailing end of the description
   * row.
   *
   * Beside the description rather than under the control, because it is help
   * text and not part of the value — and doc 03 §4.6c allows a form exactly
   * two vertical gaps, so a third row here would be a third gap.
   */
  counter?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  description,
  errorMessage,
  isRequired = false,
  isLoading = false,
  isSaving = false,
  isLabelHidden = false,
  counter,
  className,
  children
}: FieldStructureProps): React.ReactNode {
  const loadingMessage = useMessage('fieldLoading');
  const savingMessage = useMessage('fieldSaving');

  const busy = isLoading || isSaving;
  const busyMessage = isSaving ? savingMessage : loadingMessage;

  return (
    /*
     * `gap-(--bb-field-gap-inner)` is the SMALL gap, between label, control and
     * message. The larger gap between fields belongs to whatever lays the form
     * out. Two values, decided once — doc 03 §4.6c is explicit that six gaps is
     * how a form starts looking untidy without anyone knowing why.
     */
    <div
      className={cx(
        'bb:flex bb:flex-col bb:gap-(--bb-field-gap-inner)',
        'bb:font-sans bb:text-md',
        className
      )}
    >
      <Label
        className={cx(
          isLabelHidden
            ? 'bb:sr-only'
            : /*
               * The same size as the value it labels, not smaller.
               *
               * Doc 03 §4.6a: hierarchy comes from colour and weight, not
               * size. A 12px bold label used BOTH, which is the rule broken
               * twice over — and the document says the fix makes an interface
               * look calmer without anything shrinking.
               */
              'bb:text-md bb:font-strong bb:text-text',
          'bb:w-fit'
        )}
      >
        {label}
        {isRequired ? (
          /*
           * Decoration only, and the reason is the ATTRIBUTE rather than the
           * asterisk: the base sets `aria-required` on a control a person types
           * in, so reading the mark aloud would say it twice. Doc 07 §4 asks
           * that "required" reach the reader — through the channel screen
           * readers already know.
           *
           * WHICH IS NOT TRUE OF EVERY FIELD, and this comment used to claim it
           * was. Measured on `Select`: the base puts nothing on the button a
           * person operates, so the asterisk would have been the only channel.
           * A field whose base publishes no attribute says the word itself, in
           * the label, where the name comes from — decision 0017. `Field`
           * cannot do it here, because it cannot know which container is above
           * it.
           */
          <span aria-hidden="true" className="bb:text-danger-text bb:ms-1">
            *
          </span>
        ) : null}
      </Label>

      <div className="bb:relative bb:flex bb:items-center">
        {children}
        {busy ? (
          <span className="bb:absolute bb:end-3 bb:text-text-muted bb:pointer-events-none">
            <Spinner size="sm" isDecorative />
          </span>
        ) : null}
      </div>

      {/*
       * The busy state announced, not merely drawn. A change nobody announces
       * leaves a screen reader user unaware anything happened (doc 06 §3).
       * `polite` because it interrupts nothing: the person is still typing.
       */}
      <span aria-live="polite" className="bb:sr-only">
        {busy ? busyMessage : ''}
      </span>

      {/*
       * With a counter the description shares a row with it; without one, the
       * description is rendered exactly as it was before counters existed.
       *
       * The branch is deliberate rather than tidy. Wrapping unconditionally
       * would put every description in the library inside a flex row, and a
       * text node's baseline in a flex row is not always where it was as a
       * block — so a field that never asked for a counter would move by a
       * pixel and every baseline in the catalog would need reapproving for a
       * feature it does not use.
       */}
      {counter === undefined ? (
        description ? (
          <Text slot="description" className="bb:text-xs bb:text-text-muted">
            {description}
          </Text>
        ) : null
      ) : (
        <div className="bb:flex bb:items-baseline bb:gap-(--bb-space-3)">
          {description ? (
            <Text slot="description" className="bb:text-xs bb:text-text-muted">
              {description}
            </Text>
          ) : null}
          {/* `ms-auto` on the counter itself, so it sits at the trailing end
              whether or not there is a description beside it. */}
          {counter}
        </div>
      )}

      {/*
       * Rendered by the base only while the field is invalid, and referenced by
       * the control. The text itself is the second channel alongside the border
       * colour, which is what keeps the state readable in greyscale (doc 06 §3).
       */}
      <FieldError className="bb:text-xs bb:text-danger-text">
        {errorMessage}
      </FieldError>
    </div>
  );
}
