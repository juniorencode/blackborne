import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { IoIosArrowBack, IoMdClose } from 'react-icons/io';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';
import { SelectDropdown } from '../SelectDropdown';

export const InputSelect = props => {
  const {
    className,
    name,
    label,
    options = [],
    firstValue,
    callback,
    funcDelete,
    toNumber,
    toBoolean,
    register,
    required,
    multiple,
    disabled,
    ...params
  } = props;

  const domRef = useClickOutside(() => setIsOpen(false));
  const [isOpen, setIsOpen] = useState(false);
  const output = toNumber ? 'NUMBER' : toBoolean ? 'BOOLEAN' : 'STRING';
  const {
    errors,
    value: initialValue,
    handleChange
  } = register(name, { required }, output);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!firstValue || options.length < 1) return;
    if (value === options[0].value) return;
    handleChange(options[0].value);
    setValue(options[0].value);
    // eslint-disable-next-line
  }, [options]);

  const onChange = e => {
    callback && callback(e.target.value);
    handleChange(e.target.value);
  };

  const handleClick = () => setIsOpen(!isOpen);

  const handleInput = string => {
    const tag = string.trim();
    if (value) {
      if (!value.includes(tag)) {
        handleChange([...value, tag]);
      }
    } else {
      handleChange([tag]);
    }
    setIsOpen(true);
  };

  const handleRemove = (e, elem) => {
    e.preventDefault();
    if (value?.includes(elem)) {
      const tags = value.filter(item => item !== elem);
      handleChange(tags);
    }
  };

  return (
    <InputContainer
      className={className}
      label={label}
      name={name}
      error={errors[name]?.message}
    >
      <div className="relative" ref={domRef}>
        <button
          className={cn(
            'flex items-center w-full justify-between border rounded-lg overflow-hidden transition-all bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white border-secondary-300 dark:border-secondary-600 dark:placeholder-secondary-400 p-2.5 min-h-12 sm:text-sm cursor-pointer',
            {
              'ring-4 ring-opacity-30 dark:ring-opacity-40 border-primary-500 dark:border-primary-500 ring-primary-600 dark:ring-primary-500':
                isOpen,
              'cursor-default': disabled
            }
          )}
          type="button"
          onClick={!disabled ? handleClick : null}
          {...params}
        >
          {!multiple ? (
            <div className="flex items-center justify-start pr-4 w-full h-full overflow-hidden">
              <span className="truncate">
                {options?.filter(item => item.value === value)[0]?.label || ''}
              </span>
            </div>
          ) : (
            <>
              <ul className="flex items-center flex-wrap gap-2 min-h-5">
                {value?.map(elem => (
                  <li
                    key={elem}
                    className="flex items-center pl-2 pr-1.5 py-0.5 rounded border bg-secondary-200 border-secondary-300 dark:bg-secondary-500 dark:border-secondary-400"
                  >
                    {options.find(opt => opt.value === elem).label}

                    <span
                      className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemove(e, elem);
                        setIsOpen(true);
                      }}
                    >
                      <IoMdClose />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {multiple ? (
            <div className="flex-shrink-0">
              <IoIosArrowBack
                className={cn(
                  'transition-transform duration-200 text-neutral-500 dark:text-neutral-400',
                  {
                    'text-primary-500 dark:text-primary-500 -rotate-90': isOpen
                  }
                )}
                size={16}
              />
            </div>
          ) : value ? (
            !disabled && (
              <span
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                onClick={() => {
                  handleChange('');
                }}
              >
                <IoMdClose
                  className={cn(
                    'transition-transform duration-200 select-none text-neutral-500 dark:text-neutral-400',
                    {
                      'text-primary-500 dark:text-primary-500 rotate-180':
                        isOpen
                    }
                  )}
                  size={16}
                />
              </span>
            )
          ) : (
            <div className="flex-shrink-0">
              <IoIosArrowBack
                className={cn(
                  'transition-transform duration-200 text-neutral-500 dark:text-neutral-400',
                  {
                    'text-primary-500 dark:text-primary-500 -rotate-90': isOpen
                  }
                )}
                size={16}
              />
            </div>
          )}
        </button>
        <SelectDropdown
          domRef={domRef}
          name={name}
          value={value}
          isOpen={!disabled ? isOpen : false}
          options={options}
          onChange={e => {
            multiple ? handleInput(e.target.value) : onChange(e);
          }}
          setIsOpen={setIsOpen}
          funcDelete={funcDelete}
        />
      </div>
    </InputContainer>
  );
};

InputSelect.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
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
  firstValue: PropTypes.bool,
  callback: PropTypes.func,
  funcDelete: PropTypes.func,
  toNumber: PropTypes.bool,
  maxElem: PropTypes.number,
  toBoolean: PropTypes.bool,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool
};
