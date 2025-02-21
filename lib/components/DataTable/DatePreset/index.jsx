import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { cn } from '../../../utilities/styles.utilities';
import {
  getDate,
  changeDay,
  convertDatetoEnd
} from '../../../utilities/time.utilities';

export const DatePreset = props => {
  const { startDate, endDate, setDate } = props;
  const [select, setSelect] = useState(0);

  useEffect(() => {
    if (startDate === getDate() && endDate === convertDatetoEnd(getDate())) {
      setSelect(1);
    } else if (
      startDate === changeDay(getDate(), -1) &&
      endDate === convertDatetoEnd(changeDay(getDate(), -1))
    ) {
      setSelect(2);
    } else if (
      startDate === changeDay(getDate(), -7) &&
      endDate === convertDatetoEnd(getDate())
    ) {
      setSelect(3);
    } else if (
      startDate === changeDay(getDate(), -30) &&
      endDate === convertDatetoEnd(getDate())
    ) {
      setSelect(4);
    } else {
      setSelect(0);
    }
  }, [startDate, endDate]);

  const handleSetToday = () => {
    setSelect(1);
    setDate(getDate(), convertDatetoEnd(getDate()));
  };

  const handleSetYesterday = () => {
    setSelect(2);
    setDate(
      changeDay(getDate(), -1),
      convertDatetoEnd(changeDay(getDate(), -1))
    );
  };

  const handleSetLast7Days = () => {
    setSelect(3);
    setDate(changeDay(getDate(), -7), convertDatetoEnd(getDate()));
  };

  const handleSetLast30Days = () => {
    setSelect(4);
    setDate(changeDay(getDate(), -30), convertDatetoEnd(getDate()));
  };

  return (
    <ul className="hidden lg:flex items-center justify-center gap-4 w-[320px] text-nowrap border-r border-secondary-300 dark:border-secondary-600">
      <li>
        <button
          className={cn(
            'text-sm text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-100',
            {
              'font-medium transition-all text-primary-500 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-400':
                select === 1
            }
          )}
          onClick={handleSetToday}
        >
          Hoy
        </button>
      </li>
      <li>
        <button
          className={cn(
            'text-sm text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-100',
            {
              'font-medium transition-all text-primary-500 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-400':
                select === 2
            }
          )}
          onClick={handleSetYesterday}
        >
          Ayer
        </button>
      </li>
      <li>
        <button
          className={cn(
            'text-sm text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-100',
            {
              'font-medium transition-all text-primary-500 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-400':
                select === 3
            }
          )}
          onClick={handleSetLast7Days}
        >
          Últimos 7 días
        </button>
      </li>
      <li>
        <button
          className={cn(
            'text-sm text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-100',
            {
              'font-medium transition-all text-primary-500 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-400':
                select === 4
            }
          )}
          onClick={handleSetLast30Days}
        >
          Últimos 30 días
        </button>
      </li>
    </ul>
  );
};

DatePreset.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  setDate: PropTypes.func
};
