import { DataFormLayout } from '../../../lib/layouts';
import { useForm } from '../../../lib/hooks';
import { InputSelect, InputText } from '../../../lib/main';

export const FormPage = () => {
  const Form = useForm({
    text: 'galaxy',
    textMultiple: ['apple', 'banana', 'cherry'],
    select: '2',
    selectMultiple: ['3', '4', '5']
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
        <InputSelect
          className="col-span-12"
          name="select"
          label="Select"
          options={[
            { value: '1', label: 'Lion' },
            { value: '2', label: 'Wolf' },
            { value: '3', label: 'Sunset' },
            { value: '4', label: 'Moonlight' },
            { value: '5', label: 'Galaxy' },
            { value: '6', label: 'Ocean' },
            { value: '7', label: 'Mountain Peak' },
            { value: '8', label: 'Waterfall' },
            { value: '9', label: 'Visionary' }
          ]}
          funcDelete={id => console.log('delete item: ' + id)}
          register={Form.register}
        />
        <InputSelect
          className="col-span-12"
          name="selectMultiple"
          label="Select"
          options={[
            { value: '1', label: 'Lion' },
            { value: '2', label: 'Wolf' },
            { value: '3', label: 'Sunset' },
            { value: '4', label: 'Moonlight' },
            { value: '5', label: 'Galaxy' },
            { value: '6', label: 'Ocean' },
            { value: '7', label: 'Mountain Peak' },
            { value: '8', label: 'Waterfall' },
            { value: '9', label: 'Visionary' }
          ]}
          funcDelete={id => console.log('delete item: ' + id)}
          register={Form.register}
          multiple
        />
      </form>
    </DataFormLayout>
  );
};
