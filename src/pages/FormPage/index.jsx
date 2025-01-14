import { DataFormLayout } from '../../../lib/layouts';
import { useForm } from '../../../lib/hooks';
import { InputText } from '../../../lib/main';

export const FormPage = () => {
  const Form = useForm({
    text: 'perro',
    textMultiple: ['gato', 'perro', 'mentalista']
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

  Form.registerSubmit(form => {
    console.log(form);
  });

  return (
    <DataFormLayout breadcrumb={breadcrumb} title="Module" form={Form}>
      <form className="flex flex-col gap-2" onKeyDown={Form.handleAssistant}>
        <InputText
          name="text"
          label="Text"
          options={[
            { value: 'gato', label: 'gato' },
            { value: 'perro', label: 'perro' },
            { value: 'sol', label: 'sol' },
            { value: 'luna', label: 'luna' },
            { value: 'estrella', label: 'estrella' },
            { value: 'mar', label: 'mar' },
            { value: 'montaña', label: 'montaña' },
            { value: 'río', label: 'río' },
            { value: 'mentalista', label: 'mentalista' }
          ]}
          register={Form.register}
          funcDelete={id => console.log('delete item: ' + id)}
          minLength={2}
        />
        <InputText
          name="textMultiple"
          label="Text"
          options={[
            { value: 'gato', label: 'gato' },
            { value: 'perro', label: 'perro' },
            { value: 'sol', label: 'sol' },
            { value: 'luna', label: 'luna' },
            { value: 'estrella', label: 'estrella' },
            { value: 'mar', label: 'mar' },
            { value: 'montaña', label: 'montaña' },
            { value: 'río', label: 'río' },
            { value: 'mentalista', label: 'mentalista' }
          ]}
          multiple
          register={Form.register}
          funcDelete={id => console.log('delete item: ' + id)}
          minLength={2}
        />
      </form>
    </DataFormLayout>
  );
};
