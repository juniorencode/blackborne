import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { FaRegStar } from 'react-icons/fa';
import { FaTableColumns } from 'react-icons/fa6';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { useAlert } from '../../hooks/useAlert.hook';
import { Alert } from '../Alert';
import { Skeleton } from './Skeleton';
import { InputCheck } from './InputCheck';
import { SortableRow } from './SortableRow';

export const Table = props => {
  const {
    className,
    minHeight,
    structure = [],
    data = [],
    loading,
    size = 50,
    page = 1,
    noSeqNum,
    highlighted,
    dndFunc,
    handleUpdate,
    handleDelete,
    handleFeature,
    manageColumns
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside(() => setIsOpen(false));
  const localStorageKey = window.location.pathname;

  const calculateLine = _columns => {
    const _newColumns = JSON.parse(JSON.stringify(_columns)).map(col => ({
      ...col,
      line: false
    }));

    for (let i = 0; i < _newColumns.length; i++) {
      if (_newColumns[i].type === 'line') {
        for (let j = i + 1; j < _newColumns.length; j++) {
          if (_newColumns[j].type !== 'line' && !_newColumns[j].hidden) {
            _newColumns[j].line = true;
            break;
          }
        }
      }
    }

    return _newColumns;
  };

  const arraysAreEqual = (arr1, arr2) => {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;

    const cleanObject = obj => ({ ...obj, hidden: null, line: null });

    for (let i = 0; i < arr1.length; i++) {
      if (
        JSON.stringify(cleanObject(arr1[i])) !==
        JSON.stringify(cleanObject(arr2[i]))
      ) {
        return false;
      }
    }

    return true;
  };

  const [columns, setColumns] = useState(() => {
    const _storage = JSON.parse(localStorage.getItem(localStorageKey));
    const _default = calculateLine(
      structure.map(col => ({ ...col, hidden: false }))
    );
    return arraysAreEqual(_storage, _default) ? _storage : _default;
  });

  const handleColumns = (attr, value) => {
    const updatedColumns = columns.map(item => {
      if (item.attr === attr) {
        return { ...item, hidden: !value };
      }
      return item;
    });

    setColumns(calculateLine(updatedColumns));
    localStorage.setItem(
      localStorageKey,
      JSON.stringify(calculateLine(updatedColumns))
    );
  };

  const AlertDelete = useAlert();
  const [currentId, setCurrentId] = useState(null);
  const [items, setItems] = useState(data);

  useEffect(() => {
    if (data.length < 1) return;
    setItems(data);
  }, [data]);

  const tableContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = () => {
    const scrollLeft = tableContainerRef.current.scrollLeft;
    const maxScrollLeft =
      tableContainerRef.current.scrollWidth -
      tableContainerRef.current.clientWidth;

    setIsScrolling(scrollLeft < maxScrollLeft);
  };

  useEffect(() => {
    setTimeout(handleScroll, 1);

    const tableContainer = tableContainerRef.current;
    tableContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      tableContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    handleScroll();
  }, [data, columns, loading]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = event => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id && item);
      const newIndex = items.findIndex(item => item.id === over.id && item);
      setItems(items => {
        const newItems = arrayMove(items, oldIndex, newIndex);

        return newItems.map((item, index) => ({
          ...item,
          order: index + 1
        }));
      });
      const oldChange = items.find(item => item.id === active.id && item);
      const newChange = items.find(item => item.id === over.id && item);
      dndFunc(oldChange.id, { ...oldChange, order: newChange.order });
    }
  };

  const handleDeleteEvent = id => {
    AlertDelete.openAlert();
    setCurrentId(id);
  };

  const handleConfirm = async () => {
    try {
      await handleDelete(currentId);
    } finally {
      AlertDelete.closeAlert();
    }
  };

  const handleCancel = () => setCurrentId(null);

  const shortFileName = originalName => {
    if (!originalName) return;
    const extension = originalName.split('.').pop();
    let name = originalName.replace(/\.[^.]+$/, '');

    if (name.length > 20) {
      name = name.substring(0, 20) + '..';
    }

    return `${name}.${extension}`;
  };

  return (
    <div
      className={cn('relative overflow-auto', className)}
      ref={tableContainerRef}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <table className="min-w-full text-sm text-left rtl:text-right border-separate border-spacing-0 text-secondary-500 dark:text-secondary-400">
            <thead className="text-xs uppercase text-secondary-500 dark:text-secondary-400">
              <tr className="sticky top-0 left-0 z-10 bg-secondary-100 dark:bg-secondary-700">
                {dndFunc && (
                  <th className="px-4 py-3 w-1 tracking-wider font-medium border-l first:border-l-0 bg-secondary-100 dark:bg-secondary-700 sticky top-0 left-0 border-secondary-200 dark:border-secondary-600"></th>
                )}
                {!noSeqNum && (
                  <th className="px-4 py-3 w-1 tracking-wider font-medium border-l first:border-l-0 bg-secondary-100 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600 sticky top-0 left-0">
                    #
                  </th>
                )}
                {columns
                  .filter(col => col.type !== 'line' && !col.hidden)
                  .map(column => (
                    <th
                      key={column.attr}
                      className={cn(
                        'px-4 py-3 tracking-wider font-medium text-nowrap bg-secondary-100 dark:bg-secondary-700 sticky top-0 left-0 border-l first:border-l-0 border-secondary-200 dark:border-secondary-600',
                        {
                          'border-l-4 dark:border-secondary-400': column.line
                        }
                      )}
                    >
                      {column.type === 'featured' ? (
                        <FaRegStar size={18} />
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                {(handleUpdate || handleDelete) && (
                  <th
                    className={cn(
                      'px-4 py-3 w-1 tracking-wider font-medium bg-secondary-100 dark:bg-secondary-700 sticky top-0 right-0 border-l border-secondary-200 dark:border-secondary-600',
                      {
                        'border-special border-opacity-20 dark:border-opacity-100':
                          isScrolling
                      }
                    )}
                  >
                    {manageColumns && (
                      <div
                        ref={dropdownRef}
                        className="relative flex items-center gap-2 justify-center"
                      >
                        <button onClick={() => setIsOpen(!isOpen)}>
                          <FaTableColumns size={20} />
                        </button>
                        <div
                          className={cn(
                            'absolute top-full right-0 hidden mt-2 py-2 text-sm normal-case border shadow-bottom dark:shadow-neutral-900 rounded-lg overflow-y-auto bg-secondary-50 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600',
                            {
                              block: isOpen
                            }
                          )}
                        >
                          <div className="min-w-[200px] max-h-[300px] overflow-y-auto">
                            {columns
                              .filter(col => col.type !== 'line')
                              .map((row, index) => (
                                <InputCheck
                                  key={`ske-row-${index}`}
                                  name={row.attr}
                                  label={row.label}
                                  value={!row.hidden}
                                  handleChange={val =>
                                    handleColumns(row.attr, val)
                                  }
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {structure.filter(item => item.type === 'filesIcon').length >
                0 && (
                <tr>
                  {dndFunc && (
                    <td className="border-l first:border-l-0 h-2 bg-secondary-100 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600"></td>
                  )}
                  {!noSeqNum && (
                    <td className="h-2 border-l first:border-l-0 bg-secondary-100 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600"></td>
                  )}
                  {columns
                    .filter(col => col.type !== 'line' && !col.hidden)
                    .map((col, index) => (
                      <td
                        key={`fill-${index}`}
                        className={cn(
                          'border-l first:border-l-0 h-2 bg-secondary-100 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600',
                          {
                            'border-l-4 dark:border-secondary-400': col.line
                          }
                        )}
                      ></td>
                    ))}
                  {(handleUpdate || handleDelete) && (
                    <td
                      className={cn(
                        'h-2 sticky top-0 right-0 border-l bg-secondary-100 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600',
                        {
                          'border-special border-opacity-20 dark:border-opacity-100':
                            isScrolling
                        }
                      )}
                    ></td>
                  )}
                </tr>
              )}
              {loading && (
                <Skeleton
                  isScrolling={isScrolling}
                  columns={columns.filter(
                    col => col.type !== 'line' && !col.hidden
                  )}
                  noSeqNum={noSeqNum}
                  dndFunc={dndFunc}
                  actions={Boolean(handleUpdate || handleDelete)}
                />
              )}
              {!loading &&
                items.map((row, index) => (
                  <SortableRow
                    key={row.id || index}
                    minHeight={minHeight}
                    row={row}
                    index={index}
                    size={size}
                    page={page}
                    handleUpdate={handleUpdate}
                    handleDelete={handleDelete}
                    handleFeature={handleFeature}
                    highlighted={highlighted}
                    noSeqNum={noSeqNum}
                    shortFileName={shortFileName}
                    handleDeleteEvent={handleDeleteEvent}
                    structure={columns.filter(
                      col => col.type !== 'line' && !col.hidden
                    )}
                    dndFunc={dndFunc}
                    isScrolling={isScrolling}
                  />
                ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 text-secondary-600 dark:text-secondary-200">
              No hay registros disponibles
            </div>
          )}
          <Alert
            handleConfirm={handleConfirm}
            handleCancel={handleCancel}
            {...AlertDelete.register}
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

Table.propTypes = {
  className: PropTypes.string,
  minHeight: PropTypes.number,
  structure: PropTypes.array,
  data: PropTypes.array,
  loading: PropTypes.bool,
  size: PropTypes.number,
  page: PropTypes.number,
  noSeqNum: PropTypes.bool,
  highlighted: PropTypes.string,
  dndFunc: PropTypes.func,
  handleUpdate: PropTypes.func,
  handleDelete: PropTypes.func,
  handleFeature: PropTypes.func,
  manageColumns: PropTypes.bool
};
