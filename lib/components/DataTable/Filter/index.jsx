import PropTypes from 'prop-types';
import { GrRefresh } from 'react-icons/gr';
import { DatePreset } from '../DatePreset';
import { DatePickerRange } from '../DatePickerRange';

export const Filter = props => {
  const { startDate, endDate, setDate } = props;

  return (
    <div className="hidden sm:flex">
      {(startDate || endDate) && (
        <button
          className="flex items-center justify-center w-[32px] h-[38px] text-secondary-400 dark:text-white hover:text-primary-500"
          onClick={() => setDate('', '')}
        >
          <GrRefresh size={18} />
        </button>
      )}
      <div className="flex items-stretch h-[38px] border rounded-lg bg-secondary-50 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600">
        <DatePreset startDate={startDate} endDate={endDate} setDate={setDate} />
        <DatePickerRange
          startDate={startDate}
          setStartDate={start => setDate(start, endDate)}
          endDate={endDate}
          setEndDate={end => setDate(startDate, end)}
        />
      </div>
    </div>
  );
};

Filter.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  setDate: PropTypes.func
};
