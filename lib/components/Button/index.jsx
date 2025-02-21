import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cn } from '../../utilities/styles.utilities';

export const Button = props => {
  const { children, className, to, color, ...params } = props;

  const defaultStyles =
    'flex gap-2 items-center justify-center h-10 px-5 py-2.5 text-nowrap font-medium text-sm rounded-lg focus:ring-4 focus:ring-opacity-30 checked:focus:ring-opacity-40 focus:dark:ring-opacity-50 checked:focus:dark:ring-opacity-50 outline-none select-none transition-all text-white bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-800 focus:ring-primary-600 dark:focus:ring-primary-800 disabled:bg-primary-300 dark:disabled:bg-primary-400';

  const colorClasses = {
    blue: 'text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-blue-600 dark:focus:ring-blue-800 disabled:bg-blue-300 dark:disabled:bg-blue-400',
    red: 'text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-600 dark:focus:ring-red-800 disabled:bg-red-300 dark:disabled:bg-red-400',
    lightSwitch:
      'text-neutral-900 bg-white hover:bg-neutral-100 border-neutral-200 focus:ring-neutral-100 hover:text-blue-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-400 dark:border-neutral-600 dark:hover:text-white dark:focus:ring-neutral-700',
    darkSwitch:
      'text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-600 focus:ring-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:border-neutral-300 dark:hover:border-neutral-600 dark:focus:ring-neutral-100'
  };

  return to ? (
    <Link
      className={cn(defaultStyles, colorClasses[color], className)}
      to={to}
      {...params}
    >
      {children}
    </Link>
  ) : (
    <button
      className={cn(defaultStyles, colorClasses[color], className)}
      role="button"
      {...params}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  to: PropTypes.string,
  color: PropTypes.string
};
