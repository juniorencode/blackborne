import { useFilter } from '../../../lib/hooks';
import { DataTableLayout } from '../../../lib/layouts';

export const TablePage = () => {
  const { filter, setDate, setSearch } = useFilter({
    page: { size: 20 },
    search: 'Hello World..!!'
  });

  const breadcrumb = [
    {
      label: 'Item1',
      url: 'https://google.com/'
    },
    {
      label: 'Item2'
    }
  ];

  return (
    <DataTableLayout
      breadcrumb={breadcrumb}
      filter={filter}
      setDate={setDate}
      setSearch={setSearch}
    />
  );
};
