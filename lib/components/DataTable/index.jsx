import PropTypes from 'prop-types';
import { Filter } from './Filter';
import { Search } from './Search';

export const DataTable = props => {
  const { filter, setDate, setSearch } = props;

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
    </>
  );
};

DataTable.propTypes = {
  filter: PropTypes.object,
  setDate: PropTypes.func,
  setSearch: PropTypes.func
};
