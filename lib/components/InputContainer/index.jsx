import PropTypes from 'prop-types';

export const InputContainer = props => {
  const { children, className, name, label, error = '' } = props;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block mb-2 w-min text-sm text-nowrap font-medium text-neutral-600 dark:text-neutral-300"
        >
          {label}
        </label>
      )}
      {children}
      <span className="flex justify-end mt-1 h-4 text-xs text-red-600 dark:text-red-400">
        {error}
      </span>
    </div>
  );
};

InputContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  error: PropTypes.string
};
