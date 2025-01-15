import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utilities/styles.utilities';

export const Stepper = props => {
  const { children } = props;
  const [activeStep, setActiveStep] = useState(0);
  const [fadeTransition, setFadeTransition] = useState(false);
  const containerRef = useRef(null);
  const titleRefs = useRef([]);

  const handleStepClick = index => {
    if (index === activeStep) return;

    setFadeTransition(true);
    setTimeout(() => {
      setActiveStep(index);
      setFadeTransition(false);
    }, 300);
  };

  const steps = React.Children.toArray(children);

  useEffect(() => {
    const updateStepWidths = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const stepCount = steps.length;
        const availableWidth =
          containerWidth - stepCount * 40 - (stepCount - 1) * 20;
        const minWidth = 60;

        let remainingWidth = availableWidth;
        let remainingSteps = stepCount;

        titleRefs.current.forEach(titleRef => {
          if (titleRef) {
            const naturalWidth = titleRef.scrollWidth;
            const allocatedWidth = Math.max(
              Math.min(naturalWidth, remainingWidth / remainingSteps),
              minWidth
            );
            titleRef.style.width = `${allocatedWidth}px`;
            remainingWidth -= allocatedWidth;
            remainingSteps--;
          }
        });
      }
    };

    updateStepWidths();
    window.addEventListener('resize', updateStepWidths);

    return () => window.removeEventListener('resize', updateStepWidths);
  }, [steps.length]);

  return (
    <div className="flex flex-col w-full" ref={containerRef}>
      <div className="flex items-center mb-4 w-full overflow-x-auto scroll-hide">
        {steps.map((_, index) => (
          <React.Fragment key={index}>
            <button
              className="flex items-center flex-shrink-0 outline-none select-none"
              type="button"
              onClick={() => handleStepClick(index)}
            >
              <div
                className={cn(
                  'cursor-pointer flex items-center justify-center w-8 h-8 rounded-full border flex-shrink-0 font-semibold transition duration-300 border-neutral-300 dark:border-neutral-600',
                  {
                    'bg-primary-500 dark:bg-primary-700 border-primary-500 dark:border-primary-700':
                      index === activeStep
                  }
                )}
              >
                <span
                  className={cn(
                    'text-center text-neutral-800 dark:text-neutral-100',
                    {
                      'text-white': index === activeStep
                    }
                  )}
                >
                  {index + 1}
                </span>
              </div>
              {steps[index].props.title && (
                <div
                  ref={el => (titleRefs.current[index] = el)}
                  className="cursor-pointer ml-2 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 hidden sm:block"
                >
                  {steps[index].props.title}
                </div>
              )}
            </button>
            {index < steps.length - 1 && (
              <div className="flex-grow flex-shrink-0 h-1 mx-2 min-w-[20px]">
                <div
                  className={cn('h-full bg-neutral-300 dark:bg-neutral-600', {
                    'bg-primary-600 dark:bg-primary-400': index < activeStep
                  })}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div
        className={cn('transition-opacity duration-300 ease-in-out', {
          'opacity-0': fadeTransition
        })}
      >
        {steps[activeStep]}
      </div>
    </div>
  );
};

Stepper.propTypes = {
  children: PropTypes.node.isRequired
};
