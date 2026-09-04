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
  /** Marks the label. The announcement comes from the base's `aria-required`. */
  isRequired?: boolean;
  /** Waiting for data the field needs, such as a list of options. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
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
            : 'bb:text-xs bb:font-strong bb:text-text',
          'bb:w-fit'
        )}
      >
        {label}
        {isRequired ? (
          /*
           * Decoration only. The announcement comes from the base's
           * aria-required, so reading the asterisk aloud would say it twice.
           * Doc 07 §4 asks that "required" reach the reader — it does, through
           * the attribute, which is the channel screen readers already know.
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

      {description ? (
        <Text slot="description" className="bb:text-xs bb:text-text-muted">
          {description}
        </Text>
      ) : null}

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
