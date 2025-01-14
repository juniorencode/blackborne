import PropTypes from 'prop-types';
import { cn } from '../../../utilities/styles.utilities';

export const Skeleton = props => {
  const { isScrolling, columns, orderNumber, dndFunc, actions } = props;

  return (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <tr key={`skeleton-row-${index}`} className="select-none animate-pulse">
          {dndFunc && (
            <td className="px-4 py-1.5">
              <svg
                fill="currentColor"
                viewBox="0 0 256 256"
                height="1em"
                width="1em"
              >
                <path d="M108,60A16,16,0,1,1,92,44,16,16,0,0,1,108,60Zm56,16a16,16,0,1,0-16-16A16,16,0,0,0,164,76ZM92,112a16,16,0,1,0,16,16A16,16,0,0,0,92,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,112ZM92,180a16,16,0,1,0,16,16A16,16,0,0,0,92,180Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,180Z"></path>
              </svg>
            </td>
          )}
          {orderNumber && (
            <td className="px-4 py-1.5">
              <div className="w-8 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
            </td>
          )}
          {columns.map((column, index) => (
            <td
              key={`skeleton-col-${index}`}
              className={cn('px-4 py-1.5', {
                'border-l-4 dark:border-secondary-400': column.line
              })}
            >
              {column.type === 'important' && (
                <svg
                  fill="currentColor"
                  viewBox="0 0 576 512"
                  height="18"
                  width="18"
                >
                  <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
                </svg>
              )}
              {column.type === 'thumbnail' && (
                <div
                  className={`w-20 h-12 bg-secondary-300 dark:bg-secondary-700 rounded`}
                ></div>
              )}
              {column.type === 'idCard' && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-300 dark:bg-secondary-700"></div>
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-4 rounded bg-secondary-300 dark:bg-secondary-700"></div>
                    <div className="w-24 h-4 rounded bg-secondary-300 dark:bg-secondary-700"></div>
                  </div>
                </div>
              )}
              {(column.type === 'text' ||
                column.type === 'bold' ||
                column.type === 'link') && (
                <div className="w-20 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
              )}
              {column.type === 'tag' && (
                <div className="flex items-center justify-center w-fit border-2 border-secondary-300 dark:border-secondary-700 rounded">
                  <div className="mx-1.5 my-1 w-20 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                </div>
              )}
              {column.type === 'tags' && (
                <div className="flex flex-wrap gap-2">
                  <div className="w-16 h-6 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                  <div className="w-16 h-6 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                </div>
              )}
              {column.type === 'photo' && (
                <div className="w-10 h-10 rounded-full bg-secondary-300 dark:bg-secondary-700"></div>
              )}
              {column.type === 'users' && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary-300 dark:bg-secondary-700"></div>
                    <div className="w-32 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary-300 dark:bg-secondary-700"></div>
                    <div className="w-32 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                  </div>
                </div>
              )}
              {column.type === 'files' && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 384 512"
                      height="1em"
                      width="1em"
                    >
                      <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                    </svg>
                    <div className="w-32 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                  </div>
                  <div className="flex gap-1">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 384 512"
                      height="1em"
                      width="1em"
                    >
                      <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                    </svg>
                    <div className="w-32 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                  </div>
                </div>
              )}
              {column.type === 'filesIcon' && (
                <div className="flex gap-2">
                  <svg
                    fill="currentColor"
                    viewBox="0 0 384 512"
                    height="18"
                    width="18"
                  >
                    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                  </svg>
                  <svg
                    fill="currentColor"
                    viewBox="0 0 384 512"
                    height="18"
                    width="18"
                  >
                    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                  </svg>
                  <svg
                    fill="currentColor"
                    viewBox="0 0 384 512"
                    height="18"
                    width="18"
                  >
                    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                  </svg>
                </div>
              )}
              {column.type === 'status' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-300 dark:bg-secondary-700"></div>
                  <div className="w-14 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                </div>
              )}
              {column.type === 'date' && (
                <div className="flex flex-col items-end gap-2">
                  <div className="w-20 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                  <div className="w-14 h-4 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
                </div>
              )}
            </td>
          ))}
          {actions && (
            <td
              className={cn(
                'sticky top-0 right-0 flex gap-2 px-4 py-5 bg-white dark:bg-secondary-800',
                {
                  'border-special border-opacity-20 dark:border-opacity-100':
                    isScrolling
                }
              )}
            >
              <div className="w-8 h-8 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
              <div className="w-8 h-8 bg-secondary-300 dark:bg-secondary-700 rounded"></div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

Skeleton.propTypes = {
  isScrolling: PropTypes.bool.isRequired,
  columns: PropTypes.array.isRequired,
  orderNumber: PropTypes.bool,
  dndFunc: PropTypes.func,
  actions: PropTypes.bool
};
