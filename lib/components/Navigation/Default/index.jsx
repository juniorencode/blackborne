import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { PiSignOutBold } from 'react-icons/pi';
import { RxHamburgerMenu } from 'react-icons/rx';
import { cn } from '../../../utilities/styles.utilities';

export const Default = props => {
  const { systemName, options, isCollapse, setIsCollapse, handleLogout } =
    props;

  return (
    <aside
      className={cn(
        'fixed hidden z-20 sm:block w-64 h-full border-r transform bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700',
        {
          'w-[53px]': isCollapse
        }
      )}
    >
      <div className="flex flex-col justify-between px-2 py-4 h-full">
        <div>
          <div className="flex items-center mb-2">
            <button
              className="rounded-lg text-secondary-900 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700"
              onClick={() => setIsCollapse(!isCollapse)}
            >
              <div className="flex items-center justify-center p-[7px]">
                <RxHamburgerMenu size={22} />
              </div>
            </button>
            <NavLink to="/">
              <span
                className={cn(
                  'p-2 text-xl text-nowrap font-semibold text-secondary-700 dark:text-white',
                  {
                    hidden: isCollapse
                  }
                )}
              >
                {systemName}
              </span>
            </NavLink>
          </div>
          <hr className="my-4 border-secondary-300 dark:border-secondary-600" />
          <ul className="flex flex-col gap-2 text-xl">
            {options.map((menuItem, index) => (
              <li key={index}>
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-1 rounded-lg transition-all text-secondary-900 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700',
                      {
                        'text-primary-600 dark:text-primary-400': isActive
                      }
                    )
                  }
                  to={menuItem.path}
                >
                  <div className="static p-[10px] opacity-60 dark:opacity-75">
                    {menuItem.icon}
                  </div>
                  <span
                    className={cn(
                      'text-sm text-left rtl:text-right text-nowrap',
                      {
                        'absolute hidden left-full ml-2 px-3 py-1 group-hover:block rounded-lg text-white bg-black':
                          isCollapse
                      }
                    )}
                  >
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
              <span
                className={cn('text-sm text-left rtl:text-right text-nowrap', {
                  'absolute hidden left-full group-hover:block ml-2 px-3 py-1 rounded-lg text-white bg-black':
                    isCollapse
                })}
              >
                Cerrar Sesión
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

Default.propTypes = {
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
