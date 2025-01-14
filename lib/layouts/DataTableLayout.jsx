import PropTypes from 'prop-types';
import { FaFilePdf, FaPlus } from 'react-icons/fa6';
import { BaseLayout } from './BaseLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Breadcrumb } from '../components/Breadcrumb';
import { DataTable } from '../components/DataTable';

export const DataTableLayout = props => {
  const {
    breadcrumb,
    title,
    structure,
    data,
    loading,
    filter,
    pagination,
    setDate,
    setPage,
    setSearch,
    dndFunc,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleExport,
    handleFeature,
    orderNumber,
    manageColumns = true
  } = props;

  return (
    <BaseLayout>
      <div className="mb-2">
        <Breadcrumb options={breadcrumb} />
      </div>
      {(title || handleCreate || handleExport) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          {title && (
            <h1 className="text-3xl font-bold dark:text-white">{title}</h1>
          )}
          <div className="flex gap-2">
            {handleCreate && (
              <Button onClick={handleCreate}>
                <FaPlus size={18} />
                <span className="hidden md:inline-block">Agregar</span>
              </Button>
            )}
            {handleExport && (
              <Button color="darkSwitch" onClick={handleExport}>
                <FaFilePdf size={18} />
                <span className="hidden md:inline-block">Exportar</span>
              </Button>
            )}
          </div>
        </div>
      )}
      <Card>
        <DataTable
          structure={structure}
          data={data}
          loading={loading}
          filter={filter}
          pagination={pagination}
          setDate={setDate}
          setPage={setPage}
          setSearch={setSearch}
          dndFunc={dndFunc}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          handleFeature={handleFeature}
          orderNumber={orderNumber}
          manageColumns={manageColumns}
        />
      </Card>
    </BaseLayout>
  );
};

DataTableLayout.propTypes = {
  breadcrumb: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string
    })
  ),
  title: PropTypes.string,
  structure: PropTypes.array,
  data: PropTypes.array,
  loading: PropTypes.bool,
  filter: PropTypes.object,
  pagination: PropTypes.object,
  setDate: PropTypes.func,
  setPage: PropTypes.func,
  setSearch: PropTypes.func,
  dndFunc: PropTypes.func,
  handleCreate: PropTypes.func,
  handleUpdate: PropTypes.func,
  handleDelete: PropTypes.func,
  handleExport: PropTypes.func,
  handleFeature: PropTypes.func,
  orderNumber: PropTypes.bool,
  manageColumns: PropTypes.bool
};
