import PropTypes from 'prop-types';
import { Search } from './Search';
import { Filter } from './Filter';
import { Table } from '../Table';

export const DataTable = props => {
  const {
    structure,
    data,
    loading,
    filter,
    setDate,
    setSearch,
    dndFunc,
    handleUpdate,
    handleDelete,
    handleFeature,
    orderNumber,
    manageColumns
  } = props;

  return (
    <>
      <div className="flex items-center justify-between gap-4 m-3 h-10">
        <Search search={filter.search} setSearch={setSearch} />
        <Filter
          startDate={filter.start}
          endDate={filter.end}
          setDate={setDate}
        />
      </div>
      <Table
        className="h-[calc(100vh_-_19.1rem)] sm:h-[calc(100vh_-_15.1rem)] border-t border-b border-secondary-200 dark:border-secondary-500"
        structure={structure}
        data={data}
        loading={loading}
        size={filter.page.size}
        page={filter.page.number}
        dndFunc={dndFunc}
        highlighted={filter.search}
        handleUpdate={handleUpdate}
        handleDelete={handleDelete}
        handleFeature={handleFeature}
        orderNumber={orderNumber}
        manageColumns={manageColumns}
      />
    </>
  );
};

DataTable.propTypes = {
  structure: PropTypes.array,
  data: PropTypes.array,
  loading: PropTypes.bool,
  filter: PropTypes.object,
  setDate: PropTypes.func,
  setSearch: PropTypes.func,
  dndFunc: PropTypes.func,
  handleUpdate: PropTypes.func,
  handleDelete: PropTypes.func,
  handleFeature: PropTypes.func,
  orderNumber: PropTypes.bool,
  manageColumns: PropTypes.bool
};
