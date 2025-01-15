import PropTypes from 'prop-types';
import { cn } from '../../utilities/styles.utilities';

export const Kbd = props => {
  const { children, size = 'md', color } = props;
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <kbd
      className={cn(
        'hover:translate-y-[1px] inline-flex items-center justify-center text-nowrap font-mono font-semibold border rounded-md shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] hover:shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.2)] dark:shadow-[inset_0_-2px_0_0_rgba(255,255,255,0.1)] dark:hover:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.1)] select-none transition-all duration-150 ease-in-out text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
        sizeClasses[size],
        {
          'bg-primary-100 text-primary-800 border border-primary-200 dark:bg-primary-700 dark:text-primary-100 dark:border-primary-600':
            color === 'primary',
          'bg-secondary-100 text-secondary-800 border border-secondary-200 dark:bg-secondary-700 dark:text-secondary-100 dark:border-secondary-600':
            color === 'secondary'
        }
      )}
    >
      {children}
    </kbd>
  );
};

Kbd.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'secondary'])
};
