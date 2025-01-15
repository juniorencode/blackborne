import PropTypes from 'prop-types';
import { useEffect, useId, useRef } from 'react';
import { cn } from '../../utilities/styles.utilities';
import { InputContainer } from '../InputContainer';

export const InputTextarea = props => {
  const {
    className,
    name,
    label,
    uppercase,
    register,
    required,
    minLength,
    maxLength,
    focused,
    disabled,
    ...params
  } = props;

  const domId = useId();
  const domRef = useRef(null);
  const { errors, value, handleChange } = register(name, {
    required,
    minLength,
    maxLength
  });

  useEffect(() => {
    if (domRef.current) {
      focused && domRef.current.focus();
      focused && domRef.current.value && domRef.current.select();
    }
    // eslint-disable-next-line
  }, []);

  const onChange = e =>
    handleChange(uppercase ? e.target.value.toUpperCase() : e.target.value);

  const handleKeyDown = e => e.stopPropagation();

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={errors[name]?.message}
    >
      <textarea
        className={cn(
          'flex gap-2 p-2.5 w-full min-h-12 rounded-lg border outline-none focus:ring-4 focus:ring-opacity-30 checked:focus:ring-opacity-30 focus:dark:ring-opacity-40 checked:focus:dark:ring-opacity-40 transition-all bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white border-secondary-300 dark:border-secondary-600 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-600 dark:focus:ring-primary-500 dark:placeholder-secondary-400',
          className
        )}
        ref={domRef}
        id={domId}
        name={name}
        value={value !== undefined && value !== null ? value + '' : ''}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...params}
      ></textarea>
    </InputContainer>
  );
};

InputTextarea.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  uppercase: PropTypes.bool,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  focused: PropTypes.bool,
  disabled: PropTypes.bool
};
