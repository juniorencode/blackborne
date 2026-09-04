/*
 * The public surface of the library.
 *
 * Deliberately narrow: what is not exported does not exist, and opening an
 * export later is easy while closing one is not (doc 02 §10).
 *
 * Before adding anything here, read docs/contributing/new-component.md. A
 * component becomes public only once it passes the twelve-checkbox entry gate
 * in docs/foundations/01-principles.md.
 *
 * Not exported on purpose: the internal Field that every field type is built
 * from. Nobody has asked twice for the ability to build a custom field (P5),
 * and an export is easier to open than to close.
 */
export { ConfigProvider, useConfig } from './config';
export type {
  Config,
  ConfigProviderProps,
  Dictionary,
  DictionaryKey
} from './config';
export { defaultDictionary } from './config';

export { Button } from './components/Button';
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant
} from './components/Button';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { NumberField } from './components/NumberField';
export type {
  NumberFieldProps,
  NumberFieldSize
} from './components/NumberField';

export { Radio, RadioGroup } from './components/RadioGroup';
export type { RadioGroupProps, RadioProps } from './components/RadioGroup';

export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize } from './components/Spinner';

export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';

export { TextArea } from './components/TextArea';
export type { TextAreaProps } from './components/TextArea';

export { TextField } from './components/TextField';
export type { TextFieldProps, TextFieldSize } from './components/TextField';
