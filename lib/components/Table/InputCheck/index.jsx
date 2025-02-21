import PropTypes from 'prop-types';
import { useId } from 'react';
import { cn } from '../../../utilities/styles.utilities';

export const InputCheck = props => {
  const { className, name, label, value, handleChange, ...params } = props;

  const domId = useId();

  return (
    <div
      className={cn(
        'flex items-center px-4 py-2 w-full cursor-pointer hover:bg-secondary-200 dark:hover:bg-secondary-600',
        className
      )}
      onClick={() => handleChange(!value)}
    >
      <input
        className="w-6 h-6 border rounded cursor-pointer transition-all bg-secondary-200 dark:bg-secondary-700 checked:bg-primary-600 checked:dark:bg-primary-600 border-secondary-300 dark:border-secondary-600 checked:border-primary-600 checked:dark:border-primary-600 checked:focus:border-primary-500"
        id={domId}
        name={name}
        type="checkbox"
        checked={value}
        readOnly
        {...params}
      />
      {label && (
        <label
          className="ml-2 px-2 text-sm font-medium cursor-pointer text-neutral-600 dark:text-neutral-300 pointer-events-none"
          htmlFor={domId}
        >
          {label}
        </label>
      )}
    </div>
  );
};

InputCheck.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.bool,
  handleChange: PropTypes.func
};
