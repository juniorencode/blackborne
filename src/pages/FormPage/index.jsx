import { DataFormLayout } from '../../../lib/layouts';
import { useForm } from '../../../lib/hooks';
import { InputText } from '../../../lib/main';

export const FormPage = () => {
  const Form = useForm({
    text: 'galaxy',
    textMultiple: ['apple', 'banana', 'cherry']
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
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'cherry', label: 'Cherry' },
            { value: 'dragon', label: 'Dragon' },
            { value: 'eagle', label: 'Eagle' },
            { value: 'forest', label: 'Forest' },
            { value: 'galaxy', label: 'Galaxy' },
            { value: 'horizon', label: 'Horizon' },
            { value: 'island', label: 'Island' }
          ]}
          register={Form.register}
          funcDelete={id => console.log('delete item: ' + id)}
          minLength={2}
        />
        <InputText
          name="textMultiple"
          label="Text"
          options={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'cherry', label: 'Cherry' },
            { value: 'dragon', label: 'Dragon' },
            { value: 'eagle', label: 'Eagle' },
            { value: 'forest', label: 'Forest' },
            { value: 'galaxy', label: 'Galaxy' },
            { value: 'horizon', label: 'Horizon' },
            { value: 'island', label: 'Island' }
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
