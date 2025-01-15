import PropTypes from 'prop-types';

export const Button = props => {
  const { icon, onClick } = props;

  return (
    <button
      className="flex items-center justify-center w-8 h-8 hover:bg-opacity-40 focus:bg-opacity-50 focus:ring-4 focus:ring-opacity-40 rounded-lg transition-all text-secondary-600 hover:text-primary-600 focus:text-primary-600 bg-transparent hover:bg-secondary-400 focus:bg-secondary-400 dark:focus:bg-secondary-800 dark:hover:bg-secondary-800 border-neutral-300 focus:ring-primary-500"
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

Button.propTypes = {
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func
};
