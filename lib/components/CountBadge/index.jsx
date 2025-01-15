import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export const CountBadge = props => {
  const { title, count, to, icon, height = 1 } = props;

  return (
    <div
      className="flex items-center justify-between gap-2 dark:text-secondary-100 bg-white dark:bg-secondary-800"
      style={{ height: 86.5 * height + 16 * (height - 1) + 'px' }}
    >
      <div className="pl-2 border-l-4 border-primary-500 dark:border-primary-600">
        <p className="text-sm dark:text-secondary-400">{title}</p>
        <span className="text-4xl">{count}</span>
      </div>
      <div className="p-2 rounded-lg bg-opacity-20 text-primary-500 dark:text-white bg-primary-400 dark:bg-primary-500">
        <Link to={to}>{icon}</Link>
      </div>
    </div>
  );
};

CountBadge.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number,
  to: PropTypes.string,
  icon: PropTypes.node,
  height: PropTypes.number
};
