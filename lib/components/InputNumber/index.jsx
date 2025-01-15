import PropTypes from 'prop-types';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';
import { SelectDropdown } from '../SelectDropdown';

export const InputNumber = props => {
  const {
    className,
    name,
    label,
    options = [],
    align,
    prefix,
    postfix,
    toString,
    funcDelete,
    register,
    required,
    minValue,
    maxValue,
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
  const output = typeof toString === 'boolean' ? 'STRING' : 'NUMBER';
  const { errors, value, handleChange } = register(
    name,
    {
      required,
      minValue,
      maxValue
    },
    output
  );

  useEffect(() => {
    if (inputRef.current) {
      focused && inputRef.current.focus();
      focused && inputRef.current.value && inputRef.current.select();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const string = value?.toString();
    if (!string) setFilteredOptions(options);
    if (!string || !options) return;
    const filtered = options.filter(option =>
      option.toString().startsWith(string)
    );
    if (filtered.length === 1 && filtered[0] === value) setFilteredOptions([]);
    else setFilteredOptions(filtered);
    // eslint-disable-next-line
  }, [value]);

  const onChange = e => {
    let newValue = e.target.value
      .replace(/[^\d.-]/g, '')
      .replace(/^(\d*\.\d*).*$/, '$1');

    if (newValue.includes('-') && !newValue.startsWith('-'))
      newValue = newValue.replace(/-/g, '');

    if (newValue.includes('.'))
      newValue = newValue.replace(/^([^.]*\.)|\./g, '$1');

    if (minValue && Math.sign(minValue) !== -1)
      newValue = newValue.replace(/-/g, '');

    if (maxValue && parseFloat(newValue) > maxValue) return;

    if (parseFloat(newValue) && !newValue.endsWith('.'))
      handleChange(parseFloat(newValue));
    else handleChange(newValue);
  };

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
              'ring-4 ring-opacity-30 checked:ring-opacity-30 dark:ring-opacity-40 checked:dark:ring-opacity-40 border-primary-500 dark:border-primary-500 ring-primary-600 dark:ring-primary-500':
                focus,
              'cursor-text': !disabled
            }
          )}
          onClick={() => inputRef.current?.focus()}
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
        <SelectDropdown
          domRef={domRef}
          name={name}
          value={value}
          isOpen={isOpen}
          options={filteredOptions.map(option => ({
            value: option,
            label: option
          }))}
          onChange={onChange}
          setIsOpen={setIsOpen}
          funcDelete={funcDelete}
        />
      </div>
    </InputContainer>
  );
};

InputNumber.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
      .isRequired
  ),
  align: PropTypes.string,
  prefix: PropTypes.string,
  postfix: PropTypes.string,
  toString: PropTypes.any,
  funcDelete: PropTypes.func,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  focused: PropTypes.bool,
  autoComplete: PropTypes.bool,
  disabled: PropTypes.bool
};
