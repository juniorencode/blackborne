import { DataFormLayout } from '../../../lib/layouts';
import { useForm } from '../../../lib/hooks';

export const FormPage = () => {
  const Form = useForm({});

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
    <DataFormLayout breadcrumb={breadcrumb} title="Module" form={Form}>
      Hello World!
    </DataFormLayout>
  );
};
