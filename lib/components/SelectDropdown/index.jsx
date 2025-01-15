import PropTypes from 'prop-types';
import { useRef } from 'react';
import { MdClose } from 'react-icons/md';
import { cn } from '../../utilities/styles.utilities';
import { usePopper } from '../../utilities/popper.utilities';

export const SelectDropdown = props => {
  const {
    domRef,
    name,
    value,
    isOpen,
    options = [],
    onClick,
    onChange,
    setIsOpen,
    funcDelete
  } = props;

  const popperRef = useRef(null);

  const { styles, placement } = usePopper(domRef, popperRef);

  return (
    <>
      {options.length > 0 && isOpen && (
        <div
          className={cn(
            'listbox absolute top-full z-20 my-2 w-full h-max border rounded-lg shadow-top dark:shadow-neutral-900 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600',
            {
              'shadow-bottom': placement === 'bottom'
            }
          )}
          ref={popperRef}
          role="listbox"
          style={styles}
        >
          <ul className="my-2 max-h-[200px] text-sm overflow-y-auto text-neutral-700 dark:text-neutral-200">
            {options?.map(item => (
              <li key={item.value}>
                <input
                  className="hidden"
                  id={item.value}
                  name={name}
                  type="radio"
                  value={item.value}
                  onChange={onChange}
                  onClick={() => {
                    setIsOpen(!isOpen);
                    onClick && onClick();
                  }}
                  checked={item.value === value}
                />
                <label
                  className={cn(
                    'flex items-center justify-between pl-4 pr-2 h-9 text-sm cursor-pointer transition-all duration-200 group hover:bg-opacity-20 dark:hover:bg-opacity-20 hover:bg-primary-500 hover:dark:bg-primary-500 dark:hover:text-white',
                    {
                      'bg-opacity-50 dark:bg-opacity-40 hover:bg-opacity-50 dark:hover:bg-opacity-40 bg-primary-500 dark:bg-primary-500':
                        item.value === value
                    }
                  )}
                  htmlFor={item.value}
                >
                  {item.label}
                  {funcDelete && (
                    <button
                      className="p-2 opacity-0 group-hover:opacity-100 group-hover:inline transition-all duration-200 text-neutral-400 hover:text-red-500"
                      onClick={e => {
                        e.preventDefault();
                        funcDelete(item.value);
                      }}
                    >
                      <MdClose size={20} />
                    </button>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

SelectDropdown.propTypes = {
  domRef: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.number,
    PropTypes.bool
  ]),
  isOpen: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool
      ]).isRequired,
      label: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool
      ]).isRequired
    })
  ),
  onClick: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  funcDelete: PropTypes.func
};
