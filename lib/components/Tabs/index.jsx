import PropTypes from 'prop-types';
import { useState, Children, cloneElement, useRef, useEffect } from 'react';
import { cn } from '../../utilities/styles.utilities';

const Tabs = props => {
  const { tabs, openDefault = 0, disabled = [], children } = props;
  const totalTabs = tabs ? tabs.length : Children.count(children);
  const validDefaultTab =
    openDefault > 0 && openDefault <= totalTabs ? openDefault - 1 : 0;

  const [activeTab, setActiveTab] = useState(validDefaultTab);
  const [fadeTransition, setFadeTransition] = useState(false);

  const underlineRef = useRef(null);
  const tabsRef = useRef([]);

  useEffect(() => {
    const currentTab = tabsRef.current[activeTab];
    if (currentTab) {
      const underline = underlineRef.current;
      underline.style.left = `${currentTab.offsetLeft}px`;
      underline.style.width = `${currentTab.offsetWidth}px`;
    }
  }, [activeTab]);

  const handleTabClick = (index, isDisabled) => {
    if (isDisabled || index === activeTab) return;

    setFadeTransition(true);
    setTimeout(() => {
      setActiveTab(index);
      setFadeTransition(false);
    }, 300);
  };

  const renderTabs = () => {
    if (tabs) {
      return tabs.map((tab, index) => {
        const isDisabled = disabled.includes(index + 1);
        return (
          <button
            key={index}
            className={cn(
              'mb-1 text-nowrap outline-none select-none transition-all duration-300 ease-in-out',
              {
                'cursor-not-allowed opacity-50': isDisabled
              }
            )}
            ref={el => (tabsRef.current[index] = el)}
            onClick={() => handleTabClick(index, isDisabled)}
            disabled={isDisabled}
          >
            {tab.tab}
          </button>
        );
      });
    } else {
      return Children.map(children, (child, index) => {
        if (!child) return null;
        const isDisabled = disabled.includes(index + 1);
        return cloneElement(child, {
          onClick: () => handleTabClick(index, isDisabled),
          isActive: index === activeTab,
          disabled: child.props?.disabled || isDisabled
        });
      });
    }
  };

  const renderContent = () => {
    if (tabs) {
      return (
        <>
          {tabs[activeTab]?.title && (
            <h2 className="text-xl mb-2">{tabs[activeTab].title}</h2>
          )}
          <div>{tabs[activeTab].content}</div>
        </>
      );
    } else {
      const activeChild = Children.toArray(children)[activeTab];
      return activeChild ? activeChild.props.children : null;
    }
  };

  return (
    <div className="p-4 rounded-lg dark:text-gray-100 text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex gap-4 w-full overflow-x-auto scroll-hide">
          {renderTabs()}
          <div
            ref={underlineRef}
            className="absolute bottom-0 border-b-2 border-primary-500 transition-all duration-300 ease-out"
            style={{ width: '0px', left: '0px' }}
          ></div>
        </div>
      </div>

      <div
        className={cn('transition-opacity duration-300 ease-in-out', {
          'opacity-0': fadeTransition
        })}
      >
        {renderContent()}
      </div>
    </div>
  );
};

const Tab = ({ title, disabled, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'pb-1 border-b-2 transition-all duration-300 ease-in-out border-transparent',
        {
          'border-b-2 border-primary-500': isActive,
          'cursor-not-allowed opacity-50': disabled
        }
      )}
    >
      {title}
    </button>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.string.isRequired,
      tab: PropTypes.string.isRequired,
      title: PropTypes.string
    })
  ),
  openDefault: PropTypes.number,
  disabled: PropTypes.arrayOf(PropTypes.number),
  children: PropTypes.node
};

Tab.propTypes = {
  title: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  isActive: PropTypes.bool,
  onClick: PropTypes.func
};

export { Tabs, Tab };
