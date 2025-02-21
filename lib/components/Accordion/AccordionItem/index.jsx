import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';
import { FaChevronLeft } from 'react-icons/fa6';
import { cn } from '../../../utilities/styles.utilities';

export const AccordionItem = props => {
  const { isActive, onToggle, title, subtitle, children, disabled } = props;
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;

    if (isActive) {
      const scrollHeight = contentRef.current?.scrollHeight || 0;
      contentRef.current.style.maxHeight = `${scrollHeight}px`;
    } else {
      contentRef.current.style.maxHeight = '0px';
    }
  }, [isActive]);

  return (
    <div className={`border-b last:border-b-0 border-primary-500 `}>
      <button
        className={`w-full flex justify-between items-center text-left py-4 px-6 focus:outline-none ${
          disabled && ' opacity-70 '
        } `}
        onClick={disabled ? null : onToggle}
        disabled={disabled}
      >
        <div className="flex flex-col">
          <span
            className={cn(
              'font-medium focus:outline-none text-neutral-800 dark:text-neutral-100',
              {
                'text-neutral-400 dark:text-neutral-400': disabled
              }
            )}
          >
            {title}
          </span>
          {subtitle && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </span>
          )}
        </div>
        <span
          className={cn('ml-2 text-primary-500 transform transition', {
            '-rotate-90': isActive,
            'text-neutral-400': disabled
          })}
        >
          <FaChevronLeft />
        </span>
      </button>
      <div
        ref={contentRef}
        className="px-6 overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{
          maxHeight: isActive
            ? `${contentRef.current?.scrollHeight || 0}px`
            : '0px'
        }}
      >
        <div className="pb-3 dark:text-neutral-100">{children}</div>
      </div>
    </div>
  );
};

AccordionItem.propTypes = {
  isActive: PropTypes.bool,
  onToggle: PropTypes.func,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool
};
