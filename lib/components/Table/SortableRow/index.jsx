import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { PiDotsSixVerticalBold } from 'react-icons/pi';
import { FaFile, FaRegStar, FaRegTrashAlt, FaStar } from 'react-icons/fa';
import { BiSolidEdit } from 'react-icons/bi';
import { getHighlightedText } from '../../../utilities/highlightedText.utilities';
import {
  formatDateCasual,
  formatTimeCasual
} from '../../../utilities/time.utilities';
import { cn } from '../../../utilities/styles.utilities';
import { Thumbnail } from '../../Thumbnail';

export const SortableRow = props => {
  const {
    minHeight,
    row,
    index,
    size,
    page,
    handleUpdate,
    handleDelete,
    handleFeature,
    highlighted,
    noSeqNum,
    shortFileName,
    structure,
    handleDeleteEvent,
    dndFunc,
    isScrolling
  } = props;

  const [isHovering, setIsHovering] = useState([null, null]);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group hover:filter hover:brightness-100 dark:hover:brightness-125 bg-white dark:bg-secondary-800 hover:bg-[#fafafa] dark:hover:bg-secondary-800"
    >
      {dndFunc && (
        <td
          className="px-4 py-1.5 text-center cursor-ns-resize"
          {...listeners}
          {...attributes}
        >
          <PiDotsSixVerticalBold />
        </td>
      )}
      {!noSeqNum && (
        <td className="items-center px-4 py-1.5 font-semibold whitespace-nowrap text-secondary-900 dark:text-white">
          {(page - 1) * size + (index + 1)}
        </td>
      )}
      {structure.map((column, indexColum) => {
        switch (column.type) {
          case 'featured':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn(
                  'items-center px-4 py-1.5 w-1 font-semibold whitespace-nowrap text-yellow-500 dark:text-yellow-500',
                  {
                    'border-l-4 dark:border-secondary-400': column.line
                  }
                )}
              >
                {handleFeature ? (
                  <button
                    onClick={e => {
                      e.preventDefault();
                      handleFeature(row.id);
                    }}
                  >
                    {row[column.attr] ? (
                      <FaStar size={18} />
                    ) : (
                      <FaRegStar size={18} />
                    )}
                  </button>
                ) : (
                  <label>
                    {row[column.attr] ? (
                      <FaStar size={18} />
                    ) : (
                      <FaRegStar size={18} />
                    )}
                  </label>
                )}
              </td>
            );
          case 'idCard':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn(
                  'items-center px-4 py-1.5 whitespace-nowrap dark:text-white',
                  {
                    'border-l-4 dark:border-secondary-400': column.line
                  }
                )}
              >
                <div className="flex">
                  <div className="relative w-10 h-10 bg-secondary-100 dark:bg-secondary-600 rounded-full overflow-hidden">
                    {!row[column.attr].photo ? (
                      <svg
                        className="absolute w-auto h-auto text-secondary-400 -bottom-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <img
                        className="w-full h-full object-cover"
                        src={row[column.attr].photo}
                      />
                    )}
                  </div>
                  <div className="ps-3">
                    <div className="text-base font-semibold text-secondary-600 dark:text-white">
                      {getHighlightedText(
                        row[column.attr]?.fullname,
                        highlighted
                      )}
                    </div>
                    <div className="font-normal text-secondary-400">
                      {getHighlightedText(row[column.attr]?.email, highlighted)}
                    </div>
                  </div>
                </div>
              </td>
            );
          case 'photo':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn(
                  'items-center px-4 py-1.5 w-1 text-secondary-900 whitespace-nowrap dark:text-white',
                  {
                    'border-l-4 dark:border-secondary-400': column.line
                  }
                )}
              >
                <div className="flex">
                  <div className="relative w-10 h-10 bg-secondary-100 dark:bg-secondary-600 rounded-full overflow-hidden">
                    {!row.photo ? (
                      <svg
                        className="absolute w-auto h-auto text-secondary-400 -bottom-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <img
                        className="w-full h-full object-cover"
                        src={row.photo}
                      />
                    )}
                  </div>
                </div>
              </td>
            );
          case 'tag':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                <span
                  className={`text-sm font-normal px-2.5 py-0.5 whitespace-nowrap rounded border ${
                    row[column.attr].color === 'GREEN'
                      ? 'bg-green-200 dark:bg-transparent border-green-200 dark:border-green-400 text-green-800 dark:text-green-400'
                      : row[column.attr].color === 'RED'
                      ? 'bg-red-200 dark:bg-transparent border-red-200 dark:border-red-400 text-red-800 dark:text-red-400'
                      : 'bg-secondary-200 dark:bg-transparent border-secondary-200 dark:border-secondary-400 text-secondary-800 dark:text-secondary-400'
                  }`}
                >
                  {getHighlightedText(row[column.attr].label, highlighted)}
                </span>
              </td>
            );
          case 'tags':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                <div className="flex gap-2 flex-wrap">
                  {row[column.attr]?.map((tag, i) => (
                    <span
                      key={row.id + '_' + column.attr + '_' + i}
                      className="bg-secondary-100 text-secondary-500 text-sm font-normal px-2.5 py-0.5 rounded dark:bg-secondary-700 dark:text-secondary-300 whitespace-nowrap"
                    >
                      {getHighlightedText(tag, highlighted)}
                    </span>
                  ))}
                </div>
              </td>
            );
          case 'link':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5  text-nowrap', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                <Link
                  className="text-primary-500 dark:text-primary-400 hover:underline"
                  to={row[column.attr]?.url}
                >
                  {getHighlightedText(row[column.attr]?.label, highlighted)}
                </Link>
              </td>
            );
          case 'text':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5 text-nowrap', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
                style={{ height: minHeight + 'px' }}
              >
                {getHighlightedText(row[column.attr], highlighted)}
              </td>
            );
          case 'bold':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn(
                  'px-4 py-1.5 text-secondary-500 dark:text-secondary-300 text-nowrap font-medium',
                  {
                    'border-l-4 dark:border-secondary-400': column.line
                  }
                )}
              >
                {getHighlightedText(row[column.attr], highlighted)}
              </td>
            );
          case 'files':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                {row[column.attr]?.map((item, indexCol) => (
                  <Link
                    key={indexCol}
                    className="flex items-center gap-1 py-1 transition-all text-secondary-500 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-500"
                    to={item.url}
                    target="_blank"
                  >
                    <FaFile />
                    <span className="text-nowrap">
                      {shortFileName(item.label)}
                    </span>
                  </Link>
                ))}
              </td>
            );
          case 'filesIcon':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn(
                  'px-4 text-secondary-500 dark:text-secondary-300',
                  {
                    'border-l-4 dark:border-secondary-400': column.line
                  }
                )}
              >
                <div className="flex items-center gap-2 h-full">
                  {row[column.attr]?.map((item, indexItem) => (
                    <Link
                      key={indexItem}
                      className="relative h-[20px] transition-all text-secondary-500 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-500"
                      to={item.url}
                      target="_blank"
                      onMouseEnter={() =>
                        setIsHovering([indexItem, indexColum, index])
                      }
                      onMouseLeave={() => setIsHovering([null, null])}
                    >
                      <FaFile size={18} />
                      <span
                        className={cn(
                          'absolute -top-[26px] left-1/2 -translate-x-1/2 px-3 py-1 hidden w-max text-xs rounded-lg text-secondary-100 bg-black',
                          {
                            flex:
                              isHovering[0] === indexItem &&
                              isHovering[1] === indexColum &&
                              isHovering[2] === index
                          }
                        )}
                      >
                        {shortFileName(item.label)}
                      </span>
                    </Link>
                  ))}
                </div>
              </td>
            );
          case 'users':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn(
                  'px-4 py-1.5 text-secondary-500 dark:text-secondary-300 text-nowrap',
                  {
                    'border-l-4 dark:border-secondary-400': column.line
                  }
                )}
              >
                <div className="flex flex-col">
                  {row[column.attr]?.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 py-1">
                      {item.photo && (
                        <div className="relative w-5 h-5 bg-secondary-100 dark:bg-secondary-600 rounded-full overflow-hidden">
                          <img
                            className="w-5 h-5 rounded-full object-cover"
                            src={item.photo}
                          />
                        </div>
                      )}
                      <span className="text-nowrap">{item.label}</span>
                    </div>
                  ))}
                </div>
              </td>
            );
          case 'status':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                <div className="flex items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full me-2 ${
                      row[column.attr] ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  {row[column.attr] ? 'Activo' : 'Inactivo'}
                </div>
              </td>
            );
          case 'thumbnail':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5 w-1', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                <Thumbnail file={row.thumbnail} />
              </td>
            );
          case 'date':
            return (
              <td
                key={row.id + '_' + column.attr}
                className={cn('px-4 py-1.5', {
                  'border-l-4 dark:border-secondary-400': column.line
                })}
              >
                <div className="flex flex-col items-end">
                  <span className="text-nowrap">
                    {formatDateCasual(row[column.attr])}
                  </span>
                  <span className="text-nowrap">
                    {formatTimeCasual(row[column.attr])}
                  </span>
                </div>
              </td>
            );
        }
      })}
      {(handleUpdate || handleDelete) && (
        <td
          className={cn(
            'pl-3 pr-2 py-1.5 sticky top-0 right-0 bg-white dark:bg-secondary-800 group-hover:bg-[#fafafa] group-hover:dark:bg-secondary-800',
            {
              'border-special border-opacity-20 dark:border-opacity-100':
                isScrolling
            }
          )}
        >
          <div className="flex gap-2 items-center justify-center">
            {handleUpdate && (
              <button
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-opacity-10 hover:bg-opacity-20 text-blue-500 bg-blue-500"
                onClick={e => {
                  e.preventDefault();
                  handleUpdate(row.id || index);
                }}
              >
                <BiSolidEdit size={20} />
              </button>
            )}
            {handleDelete && (
              <button
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-opacity-10 hover:bg-opacity-20 text-red-500 bg-red-500"
                onClick={e => {
                  e.preventDefault();
                  handleDeleteEvent(row.id || index);
                }}
              >
                <FaRegTrashAlt size={16} />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

SortableRow.propTypes = {
  minHeight: PropTypes.number,
  row: PropTypes.object,
  index: PropTypes.number,
  className: PropTypes.string,
  structure: PropTypes.array,
  data: PropTypes.array,
  size: PropTypes.number,
  page: PropTypes.number,
  handleUpdate: PropTypes.func,
  handleDelete: PropTypes.func,
  handleFeature: PropTypes.func,
  handleDeleteEvent: PropTypes.func,
  shortFileName: PropTypes.func,
  highlighted: PropTypes.string,
  noSeqNum: PropTypes.bool,
  dndFunc: PropTypes.func,
  isScrolling: PropTypes.bool
};
