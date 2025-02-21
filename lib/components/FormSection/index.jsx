import PropTypes from 'prop-types';
import { cn } from '../../utilities/styles.utilities';

export const FormSection = props => {
  const { children, className, title, box } = props;

  return (
    <div
      className={cn(
        'w-full',
        {
          'border rounded-lg border-primary-500 dark:border-primary-600': box
        },
        className
      )}
    >
      {title && (
        <h1
          className={cn('text-xs font-bold tracking-widest uppercase', {
            'p-4 rounded-t-lg dark:bg-opacity-50 text-white dark:text-secondary-300 bg-primary-600 dark:bg-primary-700':
              box,
            'py-2 text-primary-600 dark:text-primary-400': !box
          })}
        >
          {title}
        </h1>
      )}
      <div
        className={cn('grid grid-cols-12 gap-2 p-4', {
          'p-0 py-4 border-t-2 border-primary-500 dark:border-primary-400': !box
        })}
      >
        {children}
      </div>
    </div>
  );
};

FormSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
  box: PropTypes.bool
};
