import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utilities/styles.utilities';
import { InputContainer } from '../InputContainer';

const InputColor = props => {
  const { className, label, name, register, required, disabled, ...params } =
    props;
  const domId = useId();
  const domRef = useRef(null);
  const [focus, setFocus] = useState(false);
  const { errors, value, handleChange } = register(name, {
    required
  });

  useEffect(() => {
    if (params.focus) {
      domRef.current.focus();
    }
  }, [params.focus]);

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={errors[name]?.message}
    >
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-2 p-2.5 w-full h-12 rounded-lg border cursor-pointer bg-secondary-50 border-secondary-300 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-white',
            {
              'outline-none ring-4 ring-opacity-30 dark:ring-opacity-40 ring-blue-600 border-blue-600 dark:ring-blue-500 dark:border-blue-500':
                focus,
              'cursor-default': disabled
            }
          )}
          onClick={() => domRef.current.focus()}
        >
          <input
            className="w-full h-full text-sm bg-transparent focus:outline-none"
            ref={domRef}
            id={domId}
            type="color"
            name={name}
            value={value || '#000000'}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            disabled={disabled}
            {...params}
          />
        </div>
      </div>
    </InputContainer>
  );
};

InputColor.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

export { InputColor };
