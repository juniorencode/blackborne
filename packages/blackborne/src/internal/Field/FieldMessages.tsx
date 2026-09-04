import { cx } from '../cx';

/*
 * INTERNAL. The description and error of a field, for controls the base does
 * NOT wire itself.
 *
 * Why this exists alongside Field, rather than replacing it: the two
 * situations are genuinely different, and treating them the same would mean
 * replacing working base behaviour with our own.
 *
 *   - Inside a base field container (TextField, NumberField, Select…), the
 *     base renders the description and error AND references them from the
 *     control. Field uses those components and touches nothing.
 *   - A lone Checkbox has no such container. `CheckboxField` renders the two
 *     messages but does not reference them from the input — verified: no
 *     aria-describedby, no aria-invalid. A description nobody references is a
 *     description that does not exist for a screen reader (doc 06 §3).
 *
 * So for those controls we supply the association the base leaves to the
 * caller. This is not reimplementing accessibility — the roles, keyboard and
 * announcements still come from the base. It is filling in one attribute the
 * base declines to fill, which doc 06 §2 permits with the reason written down.
 *
 * The ids come from the caller so a single `useId` covers the whole field.
 */
export interface FieldMessagesProps {
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  /** Rendered only while invalid, matching the base's own behaviour. */
  isInvalid?: boolean;
  descriptionId: string;
  errorId: string;
}

export function FieldMessages({
  description,
  errorMessage,
  isInvalid = false,
  descriptionId,
  errorId
}: FieldMessagesProps): React.ReactNode {
  const showError =
    isInvalid && errorMessage !== undefined && errorMessage !== null;

  return (
    <>
      {description ? (
        <span id={descriptionId} className="bb:text-xs bb:text-text-muted">
          {description}
        </span>
      ) : null}
      {showError ? (
        <span
          id={errorId}
          /*
           * The text itself is the second channel alongside any colour, which
           * is what keeps the state readable in greyscale (doc 06 §3).
           */
          className={cx('bb:text-xs bb:text-danger-text')}
        >
          {errorMessage}
        </span>
      ) : null}
    </>
  );
}

/**
 * The `aria-describedby` value for a control, from whichever messages are
 * actually present. Returns undefined when there are none, so the attribute is
 * omitted rather than pointing at nothing.
 */
export function describedBy(options: {
  hasDescription: boolean;
  hasError: boolean;
  descriptionId: string;
  errorId: string;
}): string | undefined {
  const ids = [
    options.hasDescription ? options.descriptionId : null,
    options.hasError ? options.errorId : null
  ].filter((id): id is string => id !== null);

  return ids.length > 0 ? ids.join(' ') : undefined;
}
