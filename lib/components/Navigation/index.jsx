import PropTypes from 'prop-types';
import { Default } from './Default';

export const Navigation = props => {
  const { systemName, options, isCollapse, setIsCollapse, handleLogout } =
    props;

  return (
    <Default
      systemName={systemName}
      options={options}
      isCollapse={isCollapse}
      setIsCollapse={setIsCollapse}
      handleLogout={handleLogout}
    />
  );
};

Navigation.propTypes = {
  systemName: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired
    })
  ),
  isCollapse: PropTypes.bool,
  setIsCollapse: PropTypes.func,
  handleLogout: PropTypes.func
};
