import PropTypes from 'prop-types';
import { cn } from '../../utilities/styles.utilities';

export const Card = props => {
  const { children, className, ...params } = props;

  return (
    <div
      className={cn(
        'block border rounded-lg shadow bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700',
        className
      )}
      {...params}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
