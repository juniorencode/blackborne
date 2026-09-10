/*
 * Decision 0005, asserted with the type checker on every field that could
 * break it.
 *
 * The library restricts input and presents errors; whether a value is valid is
 * the project's judgement, arriving as `isInvalid` and a message it wrote. The
 * base offers a second answer to that same question — `validate`, plus a
 * `validationBehavior` that hands the whole presentation to the browser — and
 * nobody here chose it: it came with the base's props, because every field
 * below extends them with an `Omit`.
 *
 * Measured before it was removed: **ten fields** published both, and nothing
 * in this repository used either.
 *
 * This is a TYPE claim, so the check has to be one. `@ts-expect-error` fails
 * the build if the prop comes back — which is the only way a claim about a
 * surface can be made, and the shape `Progress` uses to prove it has no
 * indeterminate mode. A run-time assertion would pass either way.
 */
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ConfigProvider } from '../config';
import { Checkbox } from '../components/Checkbox';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { NumberField } from '../components/NumberField';
import { PasswordField } from '../components/PasswordField';
import { RadioGroup } from '../components/RadioGroup';
import { SearchField } from '../components/SearchField';
import { Select } from '../components/Select';
import { TagsInput } from '../components/TagsInput';
import { TextArea } from '../components/TextArea';
import { TextField } from '../components/TextField';

const never = () => null;

test('no field takes the base validate, on any of the ten that could', () => {
  render(
    <ConfigProvider>
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <TextField label="Email" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <TextArea label="Notes" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <NumberField label="Amount" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <SearchField label="Search" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <PasswordField label="Password" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <TagsInput label="Tags" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <Checkbox validate={never}>Agreed</Checkbox>
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <CheckboxGroup label="Channels" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <RadioGroup label="Size" validate={never} />
      {/* @ts-expect-error validation stays in the project (decision 0005) */}
      <Select label="Currency" validate={never} />
    </ConfigProvider>
  );

  expect(document.querySelectorAll('label').length).toBeGreaterThan(0);
});

test('nor the behaviour that hands the message to the browser', () => {
  /*
   * THE MORE EXPENSIVE HALF. `validationBehavior: 'native'` moves the error
   * from our text under the field to the browser's own bubble beside it — in
   * the browser's wording and the browser's language, where doc 05 says every
   * string a person reads comes from the dictionary.
   */
  render(
    <ConfigProvider>
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <TextField label="Email" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <TextArea label="Notes" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <NumberField label="Amount" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <SearchField label="Search" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <PasswordField label="Password" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <TagsInput label="Tags" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <Checkbox validationBehavior="native">Agreed</Checkbox>
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <CheckboxGroup label="Channels" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <RadioGroup label="Size" validationBehavior="native" />
      {/* @ts-expect-error a message a person reads comes from the dictionary */}
      <Select label="Currency" validationBehavior="native" />
    </ConfigProvider>
  );

  expect(document.querySelectorAll('label').length).toBeGreaterThan(0);
});

test('and the route that stays is the project passing what it decided', async () => {
  /*
   * The replacement is not a smaller version of `validate` — it is the thing
   * decision 0005 always asked for, and it works with no form library present
   * because the field is controlled.
   */
  const { findByText } = render(
    <ConfigProvider>
      <TextField
        label="Email"
        value="not-an-address"
        onChange={() => {}}
        isInvalid
        errorMessage="That is not an email address"
      />
    </ConfigProvider>
  );

  expect(await findByText('That is not an email address')).toBeDefined();
});
