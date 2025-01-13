import PropTypes from 'prop-types';
import { Search } from './Search';

export const DataTable = props => {
  const { filter, setSearch } = props;

  return (
    <>
      <div className="flex items-center justify-between gap-4 m-3 h-10">
        <Search search={filter?.search} setSearch={setSearch} />
      </div>
    </>
  );
};

DataTable.propTypes = {
  filter: PropTypes.object,
  setSearch: PropTypes.func
};
