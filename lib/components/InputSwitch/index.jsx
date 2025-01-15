import PropTypes from 'prop-types';
import { useId, useState } from 'react';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';

export const InputSwitch = props => {
  const { className, name, label, labelCheck, register, ...params } = props;

  const domId = useId();
  const [focus, setFocus] = useState(false);
  const domRef = useClickOutside(() => setFocus(false));
  const { errors, value, handleChange } = register(name);

  const onChange = e => handleChange(e.target.checked);

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={errors[name]?.message}
    >
      <div className="flex items-center" ref={domRef}>
        <label
          className="flex items-center w-fit cursor-pointer"
          onClick={() => setFocus(true)}
        >
          <input
            type="checkbox"
            className="hidden peer"
            checked={value || false}
            onChange={onChange}
            {...params}
          />
          <div
            className={cn(
              'relative after:content-[""] after:absolute after:top-[2px] after:start-[2px] w-[42px] h-[24px] after:h-[18px] after:w-[18px] border after:border rounded-full after:rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full outline-none transition-all after:transition-all bg-secondary-200 after:bg-white dark:bg-secondary-700 after:border-neutral-300 border-secondary-300 dark:border-secondary-600 peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-checked:after:border-white',
              {
                'ring-4 ring-opacity-30 checked:ring-opacity-30 dark:ring-opacity-40 checked:dark:ring-opacity-40  border-primary-500 dark:border-primary-500 peer-checked:border-primary-500 peer-checked:dark:border-primary-500 ring-primary-500 dark:ring-primary-500':
                  focus
              }
            )}
          ></div>
          {labelCheck && (
            <span className="ml-2 px-2 text-sm font-medium text-neutral-900 dark:text-neutral-300">
              {labelCheck}
            </span>
          )}
        </label>
      </div>
    </InputContainer>
  );
};

InputSwitch.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelCheck: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired
};
