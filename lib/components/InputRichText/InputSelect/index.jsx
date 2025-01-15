import PropTypes from 'prop-types';
import { useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { cn } from '../../../utilities/styles.utilities';
import { useClickOutside } from '../../../hooks/useClickOutside.hook';

export const InputSelect = props => {
  const { className, options = [], handleChange } = props;

  const domRef = useClickOutside(() => setIsOpen(false));
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(options[0].value);

  const onSelect = value => {
    setValue(value);
    handleChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={domRef}>
      <button
        className={cn(
          'group flex items-center justify-between p-2.5 h-8 text-sm text-center rounded-lg hover:bg-opacity-40 focus:bg-opacity-40 border-0 focus:ring-4 focus:ring-opacity-40 outline-none transition-all text-secondary-600 dark:text-secondary-400 bg-transparent hover:bg-secondary-400 focus:bg-secondary-400 dark:focus:bg-secondary-800 dark:hover:bg-secondary-800 border-secondary-300 focus:ring-primary-500',
          {
            'bg-opacity-40 ring-4 ring-opacity-40 bg-secondary-400 dark:bg-secondary-800 ring-primary-500':
              isOpen
          },
          className
        )}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {options?.find(item => item.value === value)?.label}
        <IoIosArrowDown
          className={cn(
            'transition-all group-hover:text-primary-600 group-focus:text-primary-600',
            {
              'rotate-180 text-primary-600': isOpen
            }
          )}
          size={16}
        />
      </button>
      {options.length > 0 && isOpen && (
        <div
          className={cn(
            'absolute top-full z-20 my-2 w-full border rounded-lg shadow-bottom dark:shadow-neutral-900 bg-secondary-200 dark:bg-secondary-800 border-neutral-300 dark:border-neutral-800'
          )}
        >
          <div>
            <ul className="my-2 max-h-32 text-sm overflow-y-auto text-secondary-700 dark:text-secondary-200">
              {options?.map(item => (
                <li key={item.value}>
                  <button
                    className={cn(
                      'block px-4 py-2 w-full text-left transition-all dark:hover:text-white hover:bg-secondary-300 dark:hover:bg-secondary-700',
                      {
                        'bg-secondary-300 dark:bg-secondary-700':
                          item.value === value
                      }
                    )}
                    onClick={() => onSelect(item.value)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

InputSelect.propTypes = {
  className: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool
      ]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  handleChange: PropTypes.func
};
