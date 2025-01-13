import PropTypes from 'prop-types';
import { cn } from '../../utilities/styles.utilities';

export const ThemePreview = props => {
  const { isDarkMode } = props;

  return (
    <div
      className={cn(
        'flex items-end justify-center w-[260px] h-[180px] bg-white',
        {
          'bg-secondary-900': isDarkMode
        }
      )}
    >
      <div
        className={cn(
          'flex w-[220px] h-[160px] rounded-t-lg overflow-hidden bg-secondary-100',
          {
            'bg-secondary-800': isDarkMode
          }
        )}
      >
        <div
          className={cn(
            'flex flex-col justify-between p-[5px] w-[20px] h-[160px] bg-secondary-200',
            {
              'bg-secondary-700': isDarkMode
            }
          )}
        >
          <div className="flex flex-col gap-[10px]">
            <div className="w-[8px] h-[8px] rounded-full bg-secondary-400"></div>
            <div className="w-[8px] h-[8px] rounded-full bg-primary-400"></div>
            <div className="w-[8px] h-[8px] rounded-full bg-secondary-400"></div>
            <div className="w-[8px] h-[8px] rounded-full bg-secondary-400"></div>
            <div className="w-[8px] h-[8px] rounded-full bg-secondary-400"></div>
          </div>
          <div>
            <div className="w-[8px] h-[8px] rounded-full bg-secondary-400"></div>
          </div>
        </div>
        <div className="flex flex-col gap-[10px] p-[10px]">
          <div className="flex gap-[5px]">
            <div
              className={cn('w-[20px] h-[6px] rounded-lg bg-secondary-400', {
                'bg-secondary-600': isDarkMode
              })}
            ></div>
            <div
              className={cn('w-[20px] h-[6px] rounded-lg bg-secondary-400', {
                'bg-secondary-600': isDarkMode
              })}
            ></div>
            <div
              className={cn('w-[20px] h-[6px] rounded-lg bg-secondary-400', {
                'bg-secondary-600': isDarkMode
              })}
            ></div>
          </div>
          <div
            className={cn(
              'ml-[5px] mt-[5px] w-[30px] h-[30px] rounded-full bg-secondary-300',
              {
                'bg-secondary-400': isDarkMode
              }
            )}
          ></div>
          <div className="w-[50px] h-[8px] rounded-lg bg-primary-500"></div>
          <div className="flex flex-wrap gap-[10px]">
            <div
              className={cn('w-[85px] h-[8px] rounded-full bg-secondary-400', {
                'bg-secondary-500': isDarkMode
              })}
            ></div>
            <div
              className={cn('w-[85px] h-[8px] rounded-full bg-secondary-400', {
                'bg-secondary-500': isDarkMode
              })}
            ></div>
            <div
              className={cn('w-[85px] h-[8px] rounded-full bg-secondary-400', {
                'bg-secondary-500': isDarkMode
              })}
            ></div>
            <div
              className={cn('w-[85px] h-[8px] rounded-full bg-secondary-400', {
                'bg-secondary-500': isDarkMode
              })}
            ></div>
            <div
              className={cn('w-[180px] h-[8px] rounded-full bg-secondary-400', {
                'bg-secondary-500': isDarkMode
              })}
            ></div>
            <div className="flex justify-between w-full">
              <div
                className={cn(
                  'w-[40px] h-[10px] rounded-full bg-secondary-400',
                  {
                    'bg-secondary-500': isDarkMode
                  }
                )}
              ></div>
              <div className="w-[40px] h-[10px] rounded-full bg-primary-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ThemePreview.propTypes = {
  isDarkMode: PropTypes.bool
};
