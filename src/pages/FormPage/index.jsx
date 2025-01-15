import { DataFormLayout } from '../../../lib/layouts';
import { useForm } from '../../../lib/hooks';
import {
  FormSection,
  InputCheck,
  InputColor,
  InputNumber,
  InputPassword,
  InputSearch,
  InputSelect,
  InputSwitch,
  InputText,
  InputTextarea
} from '../../../lib/main';

export const FormPage = () => {
  const Form = useForm({
    text: '@juniorencode',
    textOptions: 'galaxy',
    textMultiple: ['apple', 'banana', 'cherry'],
    password: '1234ABCDC',
    number: 200,
    numberOptions: 460,
    textarea:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec odio.',
    select: '2',
    selectMultiple: ['3', '4', '5'],
    search: '2',
    searchMultiple: ['3', '4', '5']
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
        <FormSection title="Input Text">
          <InputText
            className="col-span-12"
            name="text"
            label="Text"
            register={Form.register}
            funcDelete={id => console.log('delete item: ' + id)}
            minLength={2}
          />
          <InputText
            className="col-span-12"
            name="textOptions"
            label="Text Options"
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
            className="col-span-12"
            name="textMultiple"
            label="Text Multiple"
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
        </FormSection>
        <FormSection title="Input Password">
          <InputPassword
            className="col-span-12"
            name="password"
            label="Password"
            register={Form.register}
          />
        </FormSection>
        <FormSection title="Input Number">
          <InputNumber
            className="col-span-12"
            name="number"
            label="Number"
            register={Form.register}
          />
          <InputNumber
            className="col-span-12"
            name="numberOptions"
            label="Number Options"
            options={[30, 50, 120, 10, 460, 1720, 2, 600]}
            register={Form.register}
          />
        </FormSection>
        <FormSection title="Input Textarea">
          <InputTextarea
            className="col-span-12"
            name="textarea"
            label="Textarea"
            register={Form.register}
          />
        </FormSection>
        <FormSection title="Input Select">
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
            label="Select Multiple"
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
        </FormSection>
        <FormSection title="Input Search">
          <InputSearch
            className="col-span-12"
            name="search"
            label="Search"
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
            register={Form.register}
          />
          <InputSearch
            className="col-span-12"
            name="searchMultiple"
            label="Search Multiple"
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
            register={Form.register}
            multiple
          />
        </FormSection>
        <FormSection title="Input Check">
          <InputCheck
            name="checkbox"
            label="Checkbox"
            labelCheck="Active"
            register={Form.register}
          />
        </FormSection>
        <FormSection title="Input Check">
          <InputSwitch
            name="switch"
            label="Switch"
            labelCheck="Active"
            register={Form.register}
          />
        </FormSection>
        <FormSection title="Input Color">
          <InputColor
            className="col-span-4"
            label="Color"
            name="color"
            register={Form.register}
          />
        </FormSection>
      </form>
    </DataFormLayout>
  );
};
