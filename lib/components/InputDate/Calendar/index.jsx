import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { cn } from '../../../utilities/styles.utilities';
import { nameOfMonths } from '../../../utilities/time.utilities';

export const Calendar = props => {
  const {
    selectedDate,
    daySelected,
    formatDate,
    onChange,
    previousMonth,
    nextMonth
  } = props;

  const daysInMonth = date => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return new Date(year, month, 0).getDate();
  };

  const renderCalendar = useMemo(() => {
    const days = [];
    const _selectedDate = new Date(selectedDate);
    const totalDays = daysInMonth(_selectedDate);
    const firstDayOfWeek =
      _selectedDate.getDay() % 7 === 0 ? 7 : _selectedDate.getDay();

    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push(<span key={`empty-${i}`} className="block"></span>);
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(
        _selectedDate.getFullYear(),
        _selectedDate.getMonth(),
        i
      );
      days.push(
        <span
          key={i}
          className={cn(
            'block text-sm text-center font-semibold leading-9 rounded-lg cursor-pointer hover:bg-opacity-20 dark:hover:bg-opacity-20 select-none transition-all text-secondary-800 dark:text-secondary-200 hover:bg-primary-500 dark:hover:bg-primary-600',
            {
              'hover:bg-opacity-100 dark:hover:bg-opacity-100 text-white bg-primary-600 dark:bg-primary-600':
                daySelected === formatDate(date)
            }
          )}
          onClick={() => onChange(date.toISOString())}
        >
          {i}
        </span>
      );
    }

    return days;
  }, [selectedDate, daySelected, formatDate, onChange]);

  return (
    <>
      <div className="flex justify-between mb-2">
        <button
          className="p-2.5 text-lg focus:ring-4 focus:ring-opacity-40 dark:focus:ring-opacity-40 rounded-lg outline-none text-secondary-500 dark:text-white hover:text-secondary-900 dark:hover:text-white bg-transparent dark:bg-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-600 focus:ring-primary-600 dark:focus:ring-primary-500"
          type="button"
          onClick={previousMonth}
        >
          <IoIosArrowBack />
        </button>
        <span className="px-5 py-2.5 text-sm font-semibold rounded-lg text-secondary-900 dark:text-white bg-transparent dark:bg-secondary-700">
          {`${nameOfMonths[new Date(selectedDate).getMonth()]} ${new Date(
            selectedDate
          ).getFullYear()}`}
        </span>
        <button
          className="p-2.5 text-lg focus:ring-4 focus:ring-opacity-40 dark:focus:ring-opacity-40 rounded-lg outline-none text-secondary-500 dark:text-white hover:text-secondary-900 dark:hover:text-white bg-transparent dark:bg-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-600 focus:ring-primary-600 dark:focus:ring-primary-500"
          type="button"
          onClick={nextMonth}
        >
          <IoIosArrowForward />
        </button>
      </div>
      <div className="p-1">
        <div>
          <div className="grid grid-cols-7 mb-1">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((day, index) => (
              <span
                key={index}
                className="text-center h-6 leading-6 text-sm font-medium select-none text-secondary-400 dark:text-secondary-400"
              >
                {day}
              </span>
            ))}
          </div>
          <div className="w-64 grid grid-cols-7 grid-rows-6">
            {renderCalendar}
          </div>
        </div>
      </div>
      <div className="flex space-x-2 rtl:space-x-reverse mt-2">
        <button
          className="px-5 py-2 w-1/2 text-sm text-center font-medium rounded-lg border focus:ring-4 focus:ring-opacity-30 dark:focus:ring-opacity-50 select-none transition-all text-white bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 border-primary-600 dark:border-primary-600 hover:border-primary-500 dark:hover:border-primary-700 focus:ring-primary-600 dark:focus:ring-primary-700"
          type="button"
          onClick={() => onChange(new Date().toISOString())}
        >
          Hoy
        </button>
        <button
          className="px-5 py-2 w-1/2 text-sm text-center font-medium rounded-lg border focus:ring-4 focus:ring-opacity-30 dark:focus:ring-opacity-50 select-none transition-all text-secondary-900 dark:text-white bg-white dark:bg-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-600 border-secondary-300 dark:border-secondary-600 focus:border-transparent dark:focus:border-transparent focus:ring-primary-600 dark:focus:ring-primary-700"
          type="button"
          onClick={() => onChange(null)}
        >
          Limpiar
        </button>
      </div>
    </>
  );
};

Calendar.propTypes = {
  selectedDate: PropTypes.string,
  daySelected: PropTypes.string,
  formatDate: PropTypes.func,
  onChange: PropTypes.func,
  previousMonth: PropTypes.func,
  nextMonth: PropTypes.func
};
