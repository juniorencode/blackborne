import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { cn } from '../../utilities/styles.utilities';

export const Badge = props => {
  const { className, label, position, children, color = 'red' } = props;
  const parentRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    if (parentRef.current && badgeRef.current) {
      const findBackgroundColor = element => {
        const bgColor = getComputedStyle(element).backgroundColor;
        if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          return bgColor;
        }
        if (element.parentElement) {
          return findBackgroundColor(element.parentElement);
        }
        return null;
      };

      const backgroundColor = findBackgroundColor(parentRef.current);
      if (backgroundColor) {
        badgeRef.current.style.borderColor = backgroundColor;
      }
    }
  }, []);

  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500'
  };

  return (
    <div ref={parentRef} className={cn('relative', className)}>
      <div
        ref={badgeRef}
        className={cn(
          'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 flex flex-shrink-0 items-center justify-center px-1 min-w-7 h-7 text-xs font-semibold border-4 rounded-full select-none text-gray-100',
          {
            'top-0 left-0 -translate-x-1/2 -translate-y-1/2':
              position === 'left'
          },
          colorClasses[color]
        )}
      >
        <span className="flex items-center justify-center pb-[1px] w-full h-full">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
};
Badge.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  position: PropTypes.string,
  color: PropTypes.string,
  children: PropTypes.node.isRequired
};
