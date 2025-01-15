import PropTypes from 'prop-types';
import { useEffect, useId, useRef, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';
import { SelectDropdown } from '../SelectDropdown';

export const InputText = props => {
  const {
    className,
    name,
    label,
    options = [],
    uppercase,
    align,
    prefix,
    postfix,
    multiple,
    funcDelete,
    register,
    required,
    minLength,
    maxLength,
    maxElem,
    isEmail,
    focused,
    autoComplete,
    disabled,
    ...params
  } = props;

  const domId = useId();
  const domRef = useClickOutside(() => setIsOpen(false));
  const inputRef = useRef(null);
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
  const separators = [',', ';', '|'];

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
    !multiple && filterOptions(value);
    // eslint-disable-next-line
  }, [value]);

  const filterOptions = value => {
    const string = normalizeString(value?.trim());
    if (!string) setFilteredOptions(options);
    if (!string || !options) return;
    const filtered = options.filter(option =>
      normalizeString(option.label).includes(string)
    );
    if (filtered.length === 1 && filtered[0] === string) setFilteredOptions([]);
    else setFilteredOptions(filtered);
  };

  const normalizeString = (str = '') => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,#!$%&*;:{}=\-_`~()]/g, '')
      .toLowerCase();
  };

  const onChange = e => {
    handleChange(uppercase ? e.target.value.toUpperCase() : e.target.value);
  };

  const onChangeDropdown = e => {
    const _value = e.target.value;
    const _label = options.filter(item => item.value === _value)[0].label;
    handleChange(uppercase ? _label.toUpperCase() : _label);
  };

  //multiple
  const handleInput = e => {
    if (!separators.includes(e.nativeEvent.key)) return;

    const regex = new RegExp(`[${separators.join('')}]+`, 'g');
    const tag = e.target.value?.replace(regex, '').trim();

    insertItem(tag);
    e.preventDefault();
    e.target.value = '';
  };

  const handleSearch = e => filterOptions(e.target.value);

  const handlePaste = e => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');
    e.preventDefault();

    const tags = pastedData
      .split(new RegExp(`[${separators.join('')}]+`))
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (tags.length > 0) {
      const uniqueTags = value
        ? tags.filter(tag => !value.includes(tag))
        : tags;
      const updatedTags = value ? [...value, ...uniqueTags] : [...uniqueTags];
      handleChange(updatedTags);
    }
  };

  const insertItem = tag => {
    if (tag.length < 1) return;
    if (value) !value.includes(tag) && handleChange([...value, tag]);
    else handleChange([tag]);

    inputRef.current.value = '';
    inputRef.current.focus();
  };

  const handleRemove = (e, elem) => {
    e.preventDefault();
    if (value?.includes(elem)) {
      const tags = value.filter(item => item !== elem);
      handleChange(tags);
    }
  };

  const handleFocus = () => inputRef.current.focus();

  const handleBlur = e => {
    const tag = e.target.value?.trim();

    if (tag.length > 0 && !isOpen) {
      const tags = value ? [...value, tag] : [tag];
      setFilteredOptions(options);
      handleChange(tags);
    }

    e.target.value = '';
    setFocus(false);
  };

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={errors[name]?.message}
    >
      <div className="relative" ref={domRef}>
        {multiple ? (
          <div
            className={cn(
              'flex items-center p-2.5 w-full min-h-12 sm:text-sm border rounded-lg cursor-text transition-all text-secondary-900 dark:text-white bg-secondary-50 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 dark:placeholder-secondary-400',
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
                  {elem}
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
                className="outline-none bg-transparent"
                ref={inputRef}
                id={domId}
                name={name}
                type="text"
                spellCheck="false"
                autoComplete="off"
                onClick={() => setIsOpen(true)}
                onKeyDown={handleInput}
                onChange={handleSearch}
                onPaste={handlePaste}
                onFocus={() => {
                  setFocus(true);
                  setIsOpen(true);
                }}
                onBlur={handleBlur}
                {...params}
              />
            </ul>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center w-full border rounded-lg overflow-hidden transition-all text-secondary-900 dark:text-white bg-secondary-50 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 dark:placeholder-secondary-400',
              {
                'ring-4 ring-opacity-30 dark:ring-opacity-40 border-primary-500 dark:border-primary-500 ring-primary-600 dark:ring-primary-500':
                  focus || isOpen,
                'cursor-text': !disabled
              }
            )}
            onClick={() => inputRef.current && inputRef.current.focus()}
          >
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
              value={value !== undefined && value !== null ? value : ''}
              onChange={onChange}
              onClick={() => setIsOpen(true)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              autoComplete={autoComplete ? 'on' : 'off'}
              disabled={disabled}
              {...params}
            />
            {postfix && <span className="mr-2.5">{postfix}</span>}
          </div>
        )}
        <SelectDropdown
          domRef={domRef}
          name={name}
          value={null}
          isOpen={isOpen}
          options={filteredOptions}
          onChange={e => {
            multiple ? insertItem(e.target.value.trim()) : onChangeDropdown(e);
            options && setFilteredOptions(options);
          }}
          setIsOpen={setIsOpen}
          funcDelete={funcDelete}
        />
      </div>
    </InputContainer>
  );
};

InputText.propTypes = {
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
  multiple: PropTypes.bool,
  funcDelete: PropTypes.func,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  maxElem: PropTypes.number,
  isEmail: PropTypes.bool,
  focused: PropTypes.bool,
  autoComplete: PropTypes.bool,
  disabled: PropTypes.bool
};
