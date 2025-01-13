import PropTypes from 'prop-types';
import { Breadcrumb } from '../components/Breadcrumb';
import { BaseLayout } from './BaseLayout';

export const DataTableLayout = props => {
  const { breadcrumb } = props;

  return (
    <BaseLayout>
      <div className="mb-2">
        <Breadcrumb options={breadcrumb} />
      </div>
    </BaseLayout>
  );
};

DataTableLayout.propTypes = {
  breadcrumb: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string
    })
  )
};
