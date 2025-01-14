import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { cn } from '../../utilities/styles.utilities';

export const Pagination = props => {
  const { totalPages, currentPage, setCurrentPage = () => {} } = props;
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
  let pagination = [];

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (totalPages <= (isSmallScreen ? 5 : 7)) {
    for (let i = 2; i < totalPages; i++) {
      pagination.push(i);
    }
  } else {
    if (currentPage <= (isSmallScreen ? 3 : 5)) {
      if (currentPage <= 4 || isSmallScreen) {
        pagination.push(2);
        pagination.push(3);
      }
      !isSmallScreen && pagination.push(4);
      !isSmallScreen && pagination.push(5);
    }

    if (
      currentPage >= (isSmallScreen ? 3 : 5) &&
      currentPage <= totalPages - 2
    ) {
      !isSmallScreen && pagination.push(currentPage - 1);
      pagination.push(currentPage);
      !isSmallScreen && pagination.push(currentPage + 1);
    }

    if (currentPage >= totalPages - (isSmallScreen ? 2 : 3)) {
      pagination.push(totalPages - 1);
      pagination.push(totalPages - 2);
      !isSmallScreen && pagination.push(totalPages - 3);
      !isSmallScreen && pagination.push(totalPages - 4);
    }
  }

  pagination = pagination
    .filter((item, index) => pagination.indexOf(item) === index)
    .sort((a, b) => a - b);

  return (
    <nav>
      <ul className="flex items-center -space-x-px h-10 text-sm">
        <li>
          <button
            className="flex items-center justify-center w-10 h-9 ms-0 leading-tight rounded-s-lg border text-secondary-500 bg-white border-secondary-300 hover:bg-secondary-100 hover:text-secondary-700 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-white disabled:bg-secondary-100 disabled:text-secondary-400 disabled:border-secondary-300 dark:disabled:border-secondary-700 dark:disabled:text-secondary-700 dark:disabled:bg-secondary-800 dark:disabled:hover:text-secondary-700 dark:disabled:hover:bg-secondary-800"
            disabled={currentPage - 1 < 1}
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
            }}
          >
            <IoIosArrowBack />
          </button>
        </li>
        <li>
          <button
            className={cn(
              'flex items-center justify-center w-10 h-9 leading-tight text-secondary-500 bg-white border border-secondary-300 hover:bg-secondary-100 hover:text-secondary-700 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-white',
              {
                'relative z-10 border text-white dark:text-white bg-primary-600 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-800 border-primary-700 dark:border-primary-500':
                  currentPage === 1
              }
            )}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
        </li>
        {totalPages > 7 && pagination[0] !== 2 && (
          <li>
            <button
              className="flex items-center justify-center w-10 h-9 leading-tight text-secondary-500 bg-white border border-secondary-300 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400"
              disabled
            >
              ...
            </button>
          </li>
        )}
        {pagination.map(page => (
          <li key={page}>
            <button
              className={cn(
                'flex items-center justify-center w-10 h-9 leading-tight text-secondary-500 bg-white border border-secondary-300 hover:bg-secondary-100 hover:text-secondary-700 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-white',
                {
                  'relative z-10 border text-white dark:text-white bg-primary-600 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-800 border-primary-700 dark:border-primary-500':
                    currentPage === page
                }
              )}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          </li>
        ))}
        {totalPages > 7 &&
          pagination[pagination.length - 1] !== totalPages - 1 && (
            <li>
              <button
                className="flex items-center justify-center w-10 h-9 leading-tight text-secondary-500 bg-white border border-secondary-300 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400"
                disabled
              >
                ...
              </button>
            </li>
          )}
        <li>
          {totalPages > 1 && (
            <button
              className={cn(
                'flex items-center justify-center w-10 h-9 leading-tight text-secondary-500 bg-white border border-secondary-300 hover:bg-secondary-100 hover:text-secondary-700 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-white',
                {
                  'relative z-10 border text-white dark:text-white bg-primary-600 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-800 border-primary-700 dark:border-primary-500':
                    currentPage === totalPages
                }
              )}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </button>
          )}
        </li>
        <li>
          <button
            className="flex items-center justify-center w-10 h-9 leading-tight rounded-e-lg border text-secondary-500 bg-white border-secondary-300 hover:bg-secondary-100 hover:text-secondary-700 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-white disabled:bg-secondary-100 disabled:text-secondary-400 disabled:border-secondary-300 dark:disabled:border-secondary-700 dark:disabled:text-secondary-700 dark:disabled:bg-secondary-800 dark:disabled:hover:text-secondary-700 dark:disabled:hover:bg-secondary-800"
            disabled={currentPage + 1 > totalPages}
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
              }
            }}
          >
            <IoIosArrowForward />
          </button>
        </li>
      </ul>
    </nav>
  );
};

Pagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func
};
