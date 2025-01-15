import PropTypes from 'prop-types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { FaCalendar } from 'react-icons/fa';
import { cn } from '../../utilities/styles.utilities';
import { usePopper } from '../../utilities/popper.utilities';
import { nameOfMonths } from '../../utilities/time.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';
import { Calendar } from './Calendar';

export const InputDate = props => {
  const { className, name, label, today, register, required, ...params } =
    props;

  const domRef = useClickOutside(() => setIsOpen(false));
  const popperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString());
  const [daySelected, setDaySelected] = useState(null);
  const { errors, value, handleChange } = register(name, { required });

  const { styles, placement } = usePopper(domRef, popperRef);

  useEffect(() => {
    setDaySelected(formatDate(value));
    value && setSelectedDate(new Date(value).toISOString());
    // eslint-disable-next-line
  }, [value]);

  useEffect(() => {
    if (today) handleChange(new Date().toISOString());
    // eslint-disable-next-line
  }, [today]);

  const formatDate = useCallback(string => {
    if (!string) return;
    const date = new Date(string);
    const month = nameOfMonths[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }, []);

  const onChange = useCallback(
    date => {
      handleChange(date);
      setIsOpen(false);
    },
    [handleChange]
  );

  const previousMonth = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const nextMonth = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  return (
    <InputContainer
      className={className}
      label={label}
      name={name}
      error={errors[name]?.message}
    >
      <div className="relative" ref={domRef}>
        {isOpen && (
          <div
            className={cn(
              'absolute top-full left-0 z-50 inline-block my-2 p-4 h-96 border rounded-lg shadow-top dark:shadow-neutral-900 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600',
              {
                'shadow-bottom': placement === 'bottom'
              }
            )}
            ref={popperRef}
            style={styles}
          >
            <Calendar
              selectedDate={selectedDate}
              daySelected={daySelected}
              formatDate={formatDate}
              onChange={onChange}
              previousMonth={previousMonth}
              nextMonth={nextMonth}
            />
          </div>
        )}
        <button
          className={cn(
            'flex items-center justify-between p-2.5 w-full h-12 text-sm text-center border focus:ring-4 focus:ring-opacity-30 dark:focus:ring-opacity-40 rounded-lg outline-none text-secondary-900 dark:text-white dark:placeholder-secondary-400 bg-secondary-50 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 focus:border-primary-600 dark:focus:border-primary-500 focus:ring-primary-600 dark:focus:ring-primary-500',
            {
              'ring-4 ring-opacity-30 dark:ring-opacity-40 border-primary-600 dark:border-primary-500 ring-primary-600 dark:ring-primary-500':
                isOpen
            }
          )}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          {...params}
        >
          <FaCalendar />
          {formatDate(value)}
        </button>
      </div>
    </InputContainer>
  );
};

InputDate.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  today: PropTypes.bool,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool
};
