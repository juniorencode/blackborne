import PropTypes from 'prop-types';
import { BaseLayout } from './BaseLayout';
import { Card } from '../components/Card';
import { DataForm } from '../components/DataForm';
import { Breadcrumb } from '../components/Breadcrumb';

export const DataFormLayout = props => {
  const { children, className, breadcrumb, title, form, handleCancel, modal } =
    props;

  return (
    <BaseLayout>
      <div className="mb-2">
        <Breadcrumb options={breadcrumb} />
      </div>
      {title && (
        <h1 className="mb-4 text-3xl font-bold dark:text-white">{title}</h1>
      )}
      <Card>
        <DataForm
          className={className}
          form={form}
          handleCancel={handleCancel}
          modal={modal}
        >
          {children}
        </DataForm>
      </Card>
    </BaseLayout>
  );
};

DataFormLayout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  breadcrumb: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string
    })
  ),
  title: PropTypes.string,
  form: PropTypes.object.isRequired,
  handleCancel: PropTypes.func,
  modal: PropTypes.bool
};
