import PropTypes from 'prop-types';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PiSignOutBold } from 'react-icons/pi';
import { RxHamburgerMenu } from 'react-icons/rx';
import { cn } from '../../../utilities/styles.utilities';

export const Responsive = props => {
  const { systemName, options, handleLogout } = props;
  const [isCollapse, setIsCollapse] = useState(true);

  const handleShowHiden = e =>
    e.target === e.currentTarget && setIsCollapse(true);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-20 sm:hidden w-screen h-screen transition-none duration-0 bg-opacity-50 dark:bg-opacity-90 bg-secondary-900',
        {
          'h-54': isCollapse
        }
      )}
      onClick={handleShowHiden}
    >
      <div className="fixed z-30 flex items-center px-2 w-full h-[62px] border-b bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700">
        <button
          className="rounded-lg text-secondary-900 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700"
          onClick={() => setIsCollapse(!isCollapse)}
        >
          <div className="flex items-center justify-center p-[7px]">
            <RxHamburgerMenu size={22} />
          </div>
        </button>
        <NavLink to="/">
          <span className="p-2 text-xl text-nowrap font-semibold text-secondary-700 dark:text-white">
            {systemName}
          </span>
        </NavLink>
      </div>
      <aside
        className={cn(
          'fixed top-0 left-0 w-64 h-full border-r transform bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700',
          {
            hidden: isCollapse
          }
        )}
      >
        <div className="flex flex-col justify-between px-2 py-4 h-full">
          <div>
            <ul className="flex flex-col gap-2 mt-[62px] text-xl">
              {options.map((menuItem, index) => (
                <li key={index}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-1 rounded-lg transition-all text-secondary-900 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700',
                        {
                          'text-primary-600 dark:text-primary-400': isActive
                        }
                      )
                    }
                    to={menuItem.path}
                    onClick={() => {
                      menuItem.path === window.location.pathname &&
                        setIsCollapse(true);
                    }}
                  >
                    <div className="static p-[10px] opacity-60 dark:opacity-75">
                      {menuItem.icon}
                    </div>
                    <span className="text-sm text-left rtl:text-right text-nowrap">
                      {menuItem.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
          {handleLogout && (
            <div>
              <hr className="my-4 border-secondary-300 dark:border-secondary-600" />
              <button
                className="group relative flex items-center gap-1 w-full rounded-lg transition-all text-red-600 dark:text-red-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                onClick={handleLogout}
              >
                <div className="static p-[10px]">
                  <PiSignOutBold size={18} />
                </div>
                <span className="text-sm text-left rtl:text-right text-nowrap">
                  Cerrar Sesión
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

Responsive.propTypes = {
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
