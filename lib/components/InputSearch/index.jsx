import PropTypes from 'prop-types';
import { useEffect, useId, useRef, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';
import { SelectDropdown } from '../SelectDropdown';

export const InputSearch = props => {
  const {
    className,
    name,
    label,
    options = [],
    uppercase,
    align,
    prefix,
    postfix,
    funcDelete,
    register,
    required,
    minLength,
    maxLength,
    isEmail,
    focused,
    autoComplete,
    multiple,
    maxElem,
    disabled,
    ...params
  } = props;

  const domId = useId();
  const domRef = useClickOutside(() => setIsOpen(false));
  const inputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const { errors, value, handleChange } = register(name, {
    required,
    minLength,
    maxLength,
    maxElem,
    isEmail
  });

  useEffect(() => {
    if (options.length === 0) return;
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    if (inputRef.current) {
      focused && inputRef.current.focus();
      focused && inputRef.current.value && inputRef.current.select();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const string = normalizeString(search?.trim());
    if (!string) setFilteredOptions(options);
    if (!string || !options) return;
    const filtered = options.filter(option =>
      normalizeString(option.label).includes(string)
    );
    setFilteredOptions(filtered);
    // eslint-disable-next-line
  }, [search]);

  const normalizeString = (str = '') => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,#!$%&*;:{}=\-_`~()]/g, '')
      .toLowerCase();
  };

  const onChange = e => {
    const _value = e.target.value;
    setSearch(uppercase ? _value.toUpperCase() : _value);
  };

  const handleInput = string => {
    const tag = string.trim();
    if (value) {
      if (!value.includes(tag)) {
        handleChange([...value, tag]);
      }
    } else {
      handleChange([tag]);
    }
    setSearch('');
    inputRef.current && inputRef.current.focus();
    setIsOpen(true);
  };

  const handleRemove = (e, elem) => {
    e.preventDefault();
    if (value?.includes(elem)) {
      const tags = value.filter(item => item !== elem);
      handleChange(tags);
    }
  };

  const handleBlur = e => {
    e.target.value = '';
    setFocus(false);
  };
  const handleFocus = () => inputRef.current.focus();

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={errors[name]?.message}
    >
      <div className="relative" ref={domRef}>
        <div
          className={cn(
            'flex items-center w-full border rounded-lg overflow-hidden transition-all bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white border-secondary-300 dark:border-secondary-600 dark:placeholder-secondary-400',
            {
              'ring-4 ring-opacity-30 dark:ring-opacity-40 border-primary-500 dark:border-primary-500 ring-primary-600 dark:ring-primary-500':
                focus || isOpen,
              'cursor-text': !disabled
            }
          )}
          onClick={() => {
            inputRef.current && inputRef.current.focus();
            setIsOpen(true);
          }}
        >
          {!multiple ? (
            <>
              {prefix && <span className="ml-2.5">{prefix}</span>}
              <input
                className={cn(
                  'p-2.5 w-full h-12 text-sm outline-none bg-transparent',
                  {
                    'text-left': align === 'left',
                    'text-center': align === 'center',
                    'text-right': align === 'right'
                  }
                )}
                ref={inputRef}
                role="textbox"
                id={domId}
                type="text"
                name={name}
                value={
                  value !== undefined && value !== null
                    ? options.filter(option => option.value === value).length >
                      0
                      ? options.filter(option => option.value === value)[0]
                          .label
                      : value
                    : search
                }
                onChange={onChange}
                onFocus={() => setFocus(true)}
                onBlur={() => {
                  setFocus(false);
                }}
                autoComplete={autoComplete ? 'on' : 'off'}
                disabled={disabled}
                {...params}
              />
              {postfix && <span className="mr-2.5">{postfix}</span>}
              {!disabled && value && (
                <button
                  className="ml-1 mr-2.5 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                  type="button"
                  onClick={() => {
                    handleChange('');
                    setSearch('');
                    setIsOpen(true);
                  }}
                >
                  <IoMdClose />
                </button>
              )}
            </>
          ) : (
            <div
              className={cn(
                'flex items-center p-2.5 w-full min-h-12 sm:text-sm border-1 rounded-lg cursor-text transition-all text-secondary-900 dark:text-white bg-secondary-50 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 dark:placeholder-secondary-400',
                {
                  'ring-4 ring-opacity-30 dark:ring-opacity-40 border-primary-500 dark:border-primary-500 ring-primary-600 dark:ring-primary-500':
                    focus || isOpen
                }
              )}
              onClick={handleFocus}
            >
              <ul className="flex flex-wrap gap-2 min-h-5">
                {value?.map(elem => (
                  <li
                    key={elem}
                    className="flex items-center pl-2 pr-1.5 py-0.5 h-6 rounded border bg-secondary-200 border-secondary-300 dark:bg-secondary-500 dark:border-secondary-400"
                  >
                    {options.find(opt => opt.value === elem)?.label}
                    <button
                      className="ml-1 transition-all text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                      type="button"
                      onClick={e => handleRemove(e, elem)}
                    >
                      <IoMdClose />
                    </button>
                  </li>
                ))}
                <input
                  className={cn('text-sm outline-none bg-transparent', {
                    'text-left': align === 'left',
                    'text-center': align === 'center',
                    'text-right': align === 'right'
                  })}
                  ref={inputRef}
                  role="textbox"
                  id={domId}
                  type="text"
                  name={name}
                  onClick={() => setIsOpen(true)}
                  onFocus={() => {
                    setFocus(true);
                    setIsOpen(true);
                  }}
                  autoComplete={autoComplete ? 'on' : 'off'}
                  disabled={disabled}
                  onChange={onChange}
                  onBlur={handleBlur}
                  {...params}
                />
              </ul>
            </div>
          )}
        </div>
        <SelectDropdown
          domRef={domRef}
          name={name}
          value={value}
          isOpen={isOpen}
          options={filteredOptions}
          onChange={e => {
            multiple
              ? handleInput(e.target.value)
              : handleChange(e.target.value);
          }}
          setIsOpen={setIsOpen}
          funcDelete={funcDelete}
        />
      </div>
    </InputContainer>
  );
};

InputSearch.propTypes = {
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
  uppercase: PropTypes.bool,
  align: PropTypes.string,
  prefix: PropTypes.string,
  postfix: PropTypes.string,
  funcDelete: PropTypes.func,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  maxElem: PropTypes.number,
  isEmail: PropTypes.bool,
  focused: PropTypes.bool,
  autoComplete: PropTypes.bool,
  disabled: PropTypes.bool,
  multiple: PropTypes.bool
};
