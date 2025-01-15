import PropTypes from 'prop-types';

export const StepperItem = props => {
  const { children } = props;

  return <div className=" dark:text-gray-100 text-gray-900">{children}</div>;
};

StepperItem.propTypes = {
  children: PropTypes.node.isRequired
};
