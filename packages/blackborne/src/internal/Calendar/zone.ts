import { useMemo } from 'react';
import {
  DateFormatter,
  today,
  type CalendarDate
} from '@internationalized/date';
import { useConfig } from '../../config';
import { useDevWarning } from '../useDevWarning';
import type { PeriodFormatters } from './Chrome';

/**
 * Today, from the zone the provider supplies — or nothing.
 *
 * The base marks a `data-today` of its own, computed from the value's zone
 * when the value carries one and from the BROWSER's otherwise, and neither
 * calendar styles it: doc 05 §3.1 is unambiguous that the browser's zone
 * belongs to the machine of whoever is looking rather than to the data
 * (decision 0023).
 *
 * So with a zone configured, today is marked from it; with none, nothing is
 * marked and development says why rather than guessing which day it is. The
 * component's own name goes in the warning, because two components now share
 * this and "Calendar: no time zone" on a range calendar would send somebody
 * looking in the wrong file.
 */
export function useTodayHere(component: string): CalendarDate | undefined {
  const { timeZone } = useConfig();

  useDevWarning(
    timeZone === undefined,
    `${component}: no time zone is configured, so today is not marked. The ` +
      "browser's zone belongs to the machine of whoever is looking rather " +
      'than to the data (doc 05 §3.1), so this component will not guess ' +
      'it. Set `timeZone` on ConfigProvider.'
  );

  return timeZone === undefined ? undefined : today(timeZone);
}

/**
 * The formatters a calendar's headings need, and all of them render a DAY
 * rather than an instant.
 *
 * `timeZone: 'UTC'` is not a zone the calendar is in — a day has no zone at
 * all, and formatting it against UTC is what keeps the ninth from printing as
 * the eighth somewhere. Which day it is TODAY is the only question that needs
 * the real zone, and `useTodayHere` is where it is answered.
 */
export function useDayFormatters(): PeriodFormatters & {
  monthRange: (first: CalendarDate, last: CalendarDate) => string;
} {
  const { locale } = useConfig();

  return useMemo(() => {
    const month = new DateFormatter(locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
    const year = new DateFormatter(locale, {
      year: 'numeric',
      timeZone: 'UTC'
    });
    const monthName = new DateFormatter(locale, {
      month: 'long',
      timeZone: 'UTC'
    });

    return {
      month: (date: CalendarDate) => month.format(date.toDate('UTC')),
      year: (date: CalendarDate) => year.format(date.toDate('UTC')),
      monthName: (date: CalendarDate) => monthName.format(date.toDate('UTC')),
      /*
       * A RANGE FORMATTED BY THE PLATFORM, rather than two numbers and a
       * dash. Doc 05 §2.2 rule 5 forbids building a sentence out of
       * fragments, and "2020 – 2031" is exactly the fragment-gluing that
       * comes out backwards in some locales. `formatRange` is the tool that
       * exists for it.
       */
      years: (first: CalendarDate, last: CalendarDate) =>
        year.formatRange(first.toDate('UTC'), last.toDate('UTC')),
      /*
       * And the same tool for the two months a range calendar shows at once,
       * which is where it earns its keep twice over: `formatRange` collapses
       * a shared year on its own — "September – October 2026" rather than
       * "September 2026 – October 2026" — and nothing in this library had to
       * know that rule.
       */
      monthRange: (first: CalendarDate, last: CalendarDate) =>
        month.formatRange(first.toDate('UTC'), last.toDate('UTC'))
    };
  }, [locale]);
}
