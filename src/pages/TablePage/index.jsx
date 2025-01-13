import { DataTableLayout } from '../../../lib/layouts';

export const TablePage = () => {
  const breadcrumb = [
    {
      label: 'Item1',
      url: 'https://google.com/'
    },
    {
      label: 'Item2'
    }
  ];

  return <DataTableLayout breadcrumb={breadcrumb} />;
};
