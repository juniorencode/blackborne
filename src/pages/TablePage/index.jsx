import { useEffect, useState } from 'react';
import { useFilter } from '../../../lib/hooks';
import { DataTableLayout } from '../../../lib/layouts';
import Data from './data.json';

export const TablePage = () => {
  const [loading, setLoading] = useState(true);
  const { filter, setDate, setPage, setSearch } = useFilter({
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

  const structure = [
    {
      label: '',
      attr: 'featured',
      type: 'featured'
    },
    {
      label: 'thumbnail',
      attr: 'thumbnail',
      type: 'thumbnail'
    },
    { type: 'line' },
    {
      label: 'idCard',
      attr: 'idCard',
      type: 'idCard'
    },
    {
      label: 'text',
      attr: 'text',
      type: 'text'
    },
    {
      label: 'textN',
      attr: 'textN',
      type: 'bold'
    },
    {
      label: 'tag',
      attr: 'tag',
      type: 'tag'
    },
    {
      label: 'tags',
      attr: 'tags',
      type: 'tags'
    },
    {
      label: 'link',
      attr: 'link',
      type: 'link'
    },
    {
      label: 'photo',
      attr: 'photo',
      type: 'photo'
    },
    {
      label: 'users',
      attr: 'users',
      type: 'users'
    },
    {
      label: 'files',
      attr: 'files',
      type: 'files'
    },
    {
      label: 'filesIcon',
      attr: 'filesIcon',
      type: 'filesIcon'
    },
    {
      label: 'Estado',
      attr: 'status',
      type: 'status'
    },
    {
      label: 'Fecha',
      attr: 'createdAt',
      type: 'date'
    }
  ];

  const pagination = {
    currentPage: 1,
    limit: 50,
    from: 1,
    to: 8,
    total: 15000,
    totalPages: 1
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <DataTableLayout
      breadcrumb={breadcrumb}
      title="Module"
      structure={structure}
      data={Data.data}
      loading={loading}
      filter={filter}
      pagination={pagination}
      setDate={setDate}
      setPage={setPage}
      setSearch={setSearch}
      dndFunc={() => console.log('drag and drop')}
      handleCreate={() => console.log('create')}
      handleUpdate={() => console.log('update')}
      handleDelete={() => console.log('delete')}
      handleExport={() => console.log('export')}
      handleFeature={() => console.log('feature')}
      orderNumber={true}
      manageColumns={true}
    />
  );
};
