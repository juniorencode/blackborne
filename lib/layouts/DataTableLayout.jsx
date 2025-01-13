import PropTypes from 'prop-types';
import { FaFilePdf, FaPlus } from 'react-icons/fa6';
import { BaseLayout } from './BaseLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Breadcrumb } from '../components/Breadcrumb';
import { DataTable } from '../components/DataTable';

export const DataTableLayout = props => {
  const { breadcrumb, setSearch } = props;

  return (
    <BaseLayout>
      <div className="mb-2">
        <Breadcrumb options={breadcrumb} />
      </div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold dark:text-white">Module</h1>
        <div className="flex gap-2">
          <Button onClick={() => {}}>
            <FaPlus size={18} />
            <span className="hidden md:inline-block">Agregar</span>
          </Button>
          <Button color="DarkSwitch" onClick={() => {}}>
            <FaFilePdf size={18} />
            <span className="hidden md:inline-block">Exportar</span>
          </Button>
        </div>
      </div>
      <Card>
        <DataTable setSearch={setSearch} />
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
  setSearch: PropTypes.func
};
