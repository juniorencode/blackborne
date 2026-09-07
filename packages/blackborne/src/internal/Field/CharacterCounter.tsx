import { useMemo } from 'react';
import { useConfig, useMessage } from '../../config';
import { cx } from '../cx';

/*
 * INTERNAL. How much of a field's limit has been used.
 *
 * It exists because `maxLength` is a silent restriction: the browser drops the
 * keystroke past the limit and says nothing. Doc 09 §3 wants a visible
 * response to every interaction, and typing that does nothing is the clearest
 * case there is of an interaction with no response.
 */

export interface CharacterCounterProps {
  length: number;
  max: number;
}

export function CharacterCounter({
  length,
  max
}: CharacterCounterProps): React.ReactNode {
  const { locale } = useConfig();
  const reached = useMessage('characterLimitReached');

  /*
   * Formatted, not concatenated. `1,200` in English is `1.200` in German and
   * `١٢٠٠` in Arabic-Indic digits, and a counter is the one place in a field
   * where the library writes a number of its own (doc 05 §3).
   */
  const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const isFull = length >= max;

  return (
    <>
      <span
        /*
         * Silent, on purpose. A number that changed on every keystroke would
         * turn typing into a drum roll — and it is derived from a value the
         * reader already has, so it adds nothing even when it is quiet.
         */
        aria-hidden="true"
        className={cx(
          'bb:flex-none bb:ms-auto bb:text-xs',
          // Tabular figures so the count does not jitter as it passes 9 to 10.
          'bb-tabular',
          /*
           * Muted until the limit, then ordinary text. Emphasis by colour and
           * not by size (doc 03 §4.6a), and deliberately NOT the danger
           * colour: at the limit nothing is wrong, there is simply no more
           * room. A red counter would say the value is invalid, which is the
           * project's judgement to make and not this component's.
           */
          isFull ? 'bb:text-text' : 'bb:text-text-muted'
        )}
      >
        {format.format(length)}/{format.format(max)}
      </span>
      {/*
       * And the one thing worth saying out loud, said once.
       *
       * At the limit the next keystroke is dropped and nothing else reports
       * it, so for anyone who cannot see the counter the field simply stops
       * responding. `polite` because it interrupts nothing: the person is
       * still typing (doc 06 §3).
       */}
      <span aria-live="polite" className="bb:sr-only">
        {isFull ? reached : ''}
      </span>
    </>
  );
}
