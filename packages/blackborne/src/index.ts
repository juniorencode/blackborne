/*
 * The public surface of the library.
 *
 * Deliberately narrow: what is not exported does not exist, and opening an
 * export later is easy while closing one is not (doc 02 §10).
 *
 * Before adding anything here, read docs/contributing/new-component.md. A
 * component becomes public only once it passes the thirteen-checkbox entry gate
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

/*
 * `Collapsible` ships beside `Accordion` because it IS the accordion's
 * section: a group of them is the accordion pattern, one of them alone is the
 * disclosure pattern, and the only difference in the markup is the heading
 * (doc 06 §2.1).
 */
export { Accordion, Collapsible } from './components/Accordion';
export type {
  AccordionHeadingLevel,
  AccordionProps,
  CollapsibleProps
} from './components/Accordion';

export { Alert } from './components/Alert';
export type { AlertProps, AlertTone } from './components/Alert';

export { Badge } from './components/Badge';
export type { BadgeProps, BadgeTone, BadgeVariant } from './components/Badge';

/*
 * Normalization: pure functions, composed by the consumer, passed to a field's
 * `normalize` prop. Doc 07 §2 is careful that this is a THIRD thing, not part
 * of restriction — it accepts a keystroke and rewrites it, where restriction
 * refuses one and validation judges the result.
 */
export {
  allowOnly,
  caretAfter,
  foldAccents,
  lowerCase,
  normalize,
  stripSpaces,
  trimEdges,
  upperCase
} from './normalize';
export type { Normalizer } from './normalize';

/*
 * `Breadcrumb` ships with `Breadcrumbs` because it is only useful inside one,
 * the way `Radio` ships with `RadioGroup`. It DECLARES a step rather than
 * rendering one — a label and an address — because a narrow container folds
 * the middle of a trail into a menu, so the same step has to be able to be a
 * link in the row or a row in the menu (decision 0019).
 */
export { Breadcrumb, Breadcrumbs } from './components/Breadcrumbs';
export type {
  BreadcrumbProps,
  BreadcrumbsProps
} from './components/Breadcrumbs';

/*
 * A picture of somebody, with something in its place when there is none. The
 * fallback arrives as CHILDREN: turning a name into initials is a
 * locale-dependent transformation and doc 05 §4.2 forbids the library doing it.
 */
export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarSize } from './components/Avatar';

/*
 * A colour chosen from a closed palette. The value is the string from `colors`,
 * verbatim — decision 0024's exception, because the answer is one of the
 * inputs.
 */
/*
 * A colour chosen from a gradient, for one nobody has decided yet. Its value's
 * format is DECLARED (decision 0024), because a value dragged out of an area
 * was never one of the inputs.
 */
/*
 * A field for choosing files. IT DOES NOT UPLOAD — hard rule 6 allows the
 * library no request at all, so it reports the files and the project sends
 * them, feeding the progress and any failure back through `files`.
 */
export { FileUpload } from './components/FileUpload';
export type { FileUploadItem, FileUploadProps } from './components/FileUpload';

export { ColorPicker } from './components/ColorPicker';
export type {
  ColorPickerProps,
  ColorPickerSize
} from './components/ColorPicker';

export { ColorSwatchField } from './components/ColorSwatchField';
export type { ColorSwatchFieldProps } from './components/ColorSwatchField';

export { Button } from './components/Button';
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant
} from './components/Button';

/*
 * A row of buttons joined into one control, with the size and the variant
 * declared once for the set. The context that carries them is NOT exported —
 * doc 02 §3.1.1, and §10's not-public list.
 */
export { ButtonGroup } from './components/ButtonGroup';
export type {
  ButtonGroupProps,
  ButtonGroupVariant
} from './components/ButtonGroup';

/*
 * A month of days, and the content of the picker that will open one. Its value
 * crosses as an ISO string rather than as the base's calendar object
 * (decision 0020),
 * and today is marked from the zone the provider supplies rather than from the
 * browser's
 * (decision 0023).
 */
export { Calendar } from './components/Calendar';
export { DateField } from './components/DateField';
export { DatePicker } from './components/DatePicker';
export { DateRangePicker } from './components/DateRangePicker';
export type {
  DateRangePickerProps,
  DateRangePickerSize
} from './components/DateRangePicker';
export { TimeField } from './components/TimeField';
export type {
  TimeFieldProps,
  TimeFieldSize,
  TimePrecision
} from './components/TimeField';

/*
 * The choosing half of a time control, where a minute step can be honoured.
 * `TimeField` types and this chooses — decision 0015's shape, and the reason
 * there are no segments in here.
 */
export { TimePicker } from './components/TimePicker';
export type { TimePickerProps, TimePickerSize } from './components/TimePicker';
export type { DatePickerProps, DatePickerSize } from './components/DatePicker';
export type { DateFieldProps, DateFieldSize } from './components/DateField';
export type { CalendarProps } from './components/Calendar';
export { Progress } from './components/Progress';
export { Step, Steps } from './components/Steps';
export type { StepProps, StepsProps, StepStatus } from './components/Steps';
export type { ProgressProps, ProgressSize } from './components/Progress';
export { RangeCalendar } from './components/RangeCalendar';
export type { DateRange, RangeCalendarProps } from './components/RangeCalendar';

export { Card } from './components/Card';
export type { CardProps } from './components/Card';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { CheckboxGroup } from './components/CheckboxGroup';
export type { CheckboxGroupProps } from './components/CheckboxGroup';

/*
 * The risk component of the composed fields, and the second component whose
 * children are DECLARATIONS rather than markup — `ComboBoxItem` renders
 * nothing, because deciding which options exist right now is the whole
 * difference between a combo box and a select (decision 0021).
 *
 * Both branches of its props are exported beside the union, because a
 * consumer writing a wrapper needs to name one: props typed as the union
 * cannot be spread and then added to, since the addition has to satisfy both
 * branches (decision 0022).
 * Its own stories hit that first.
 *
 * `matchOptions`, which is that decision's other half, is NOT exported yet:
 * it is pure and it is the logic, which is the shape `pageWindow` was
 * published as — but P5 asks which screen needs it today, and the one that
 * will is the consumer filtering on a server, who arrives with the
 * asynchronous hook rather than now.
 */
export { ComboBox, ComboBoxItem } from './components/ComboBox';
export type {
  ComboBoxItemProps,
  ComboBoxOneProps,
  ComboBoxProps,
  ComboBoxSeveralProps,
  ComboBoxSize,
  ComboBoxSource
} from './components/ComboBox';

/*
 * Options that arrive from somewhere, as a HOOK rather than as a second
 * component — the shape `useToasts` established, and what P6's corollary asks
 * for: paging, waiting and three states are logic, and an assembly may not
 * have a capability its pieces lack.
 *
 * It brings no network with it (P2): `load` is a function that returns a
 * promise, and a test hands it an array.
 */
export { useAsyncOptions } from './components/ComboBox';
export type {
  AsyncOptions,
  AsyncOptionsConfig,
  OptionsPage,
  OptionsRequest
} from './components/ComboBox';

/*
 * `useDialog` is exported alongside the component, and it is the hook doc 02
 * §5 promises by name: render props are not part of this API, and the `close`
 * a consumer needs for their own footer button has to arrive some other way.
 */
export { ConfirmDialog } from './components/ConfirmDialog';
export type {
  ConfirmDialogProps,
  ConfirmTone
} from './components/ConfirmDialog';

export { Dialog, useDialog } from './components/Dialog';
export type { DialogProps, DialogSize, DialogState } from './components/Dialog';

export { Drawer } from './components/Drawer';
export type { DrawerProps, DrawerSide, DrawerSize } from './components/Drawer';

export { EmptyState } from './components/EmptyState';
export type {
  EmptyStateProps,
  EmptyStateSize,
  EmptyStateVariant
} from './components/EmptyState';

export { PasswordField } from './components/PasswordField';
export type {
  PasswordFieldProps,
  PasswordFieldSize
} from './components/PasswordField';

/*
 * `Link` navigates and `Button` acts, which is the whole of choosing between
 * this and `Button variant="link"` (doc 02 §7.1). Client-side navigation
 * arrives on the provider above, not on the component (decision 0016).
 */
export { Link } from './components/Link';
export type { LinkProps } from './components/Link';

/*
 * A menu is three exports because a command and a divider are elements the
 * consumer writes, and the base's collection reads them: our `MenuItem` and
 * `MenuSeparator` wrap the base's own so the menu's structure is what the base
 * sees.
 */
export { Menu, MenuItem, MenuSeparator } from './components/Menu';
export type {
  MenuItemProps,
  MenuItemTone,
  MenuProps,
  MenuSeparatorProps
} from './components/Menu';

export { NumberField } from './components/NumberField';
export type {
  NumberFieldProps,
  NumberFieldSize
} from './components/NumberField';

/*
 * Two pagers, because the two take different data and share no prop: one is
 * given a total and computes a window from it, the other is given two
 * booleans and cannot know a total at all (decision 0014).
 *
 * `pageWindow` is public with them. It is the whole of the offset pager's
 * logic as a pure function (P6), and a consumer building their own row of
 * numbers — inside a table's own footer, say — should not have to rewrite the
 * arithmetic to get the same shape.
 */
export { Pagination, pageWindow } from './components/Pagination';
export type { PageSlot, PaginationProps } from './components/Pagination';
export { CursorPagination } from './components/CursorPagination';
export type { CursorPaginationProps } from './components/CursorPagination';

export { Popover } from './components/Popover';
export type { PopoverProps } from './components/Popover';
export { Preview } from './components/Preview';
export type { PreviewProps } from './components/Preview';
export { ToastRegion, useToasts } from './components/Toast';
export type {
  ToastMessage,
  ToastQueue,
  ToastRegionProps,
  ToastTone
} from './components/Toast';

export { Radio, RadioGroup } from './components/RadioGroup';
export type {
  RadioGroupProps,
  RadioGroupVariant,
  RadioProps
} from './components/RadioGroup';

export { SearchField } from './components/SearchField';
export type {
  SearchFieldProps,
  SearchFieldSize
} from './components/SearchField';

/*
 * The first composed field: the field structure with a layer hanging off it.
 * `SelectItem` is public with it because an option is an element the consumer
 * writes and the base's collection reads.
 */
export { Select, SelectItem } from './components/Select';
export type {
  SelectItemProps,
  SelectProps,
  SelectSize
} from './components/Select';

export { Separator } from './components/Separator';
export type {
  SeparatorOrientation,
  SeparatorProps
} from './components/Separator';

export { Skeleton } from './components/Skeleton';
export type { SkeletonProps, SkeletonVariant } from './components/Skeleton';

export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize } from './components/Spinner';

/*
 * One action with the near alternatives behind an arrow. Two buttons, so it
 * exports no item type of its own: the rows are `MenuItem`s.
 */
/*
 * One value on a range. A slider is for a value where the approximate is the
 * point; where an exact figure matters it is a `NumberField`.
 */
export { Slider } from './components/Slider';
export type { SliderProps } from './components/Slider';

export { SplitButton } from './components/SplitButton';
export type {
  SplitButtonProps,
  SplitButtonVariant
} from './components/SplitButton';

export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';

/*
 * Composition, and the second caller of the structural-change hook: below the
 * medium step the row of tabs becomes a `Select`. `Tab` is public because a
 * tab and its panel are one declaration the consumer writes.
 */
export { Tab, Tabs } from './components/Tabs';
export type { TabProps, TabsProps } from './components/Tabs';

export { TagsInput } from './components/TagsInput';
export type { TagsInputProps, TagsInputSize } from './components/TagsInput';

export { TextArea } from './components/TextArea';
export type { TextAreaProps } from './components/TextArea';

export { TextField } from './components/TextField';
export type { TextFieldProps, TextFieldSize } from './components/TextField';

export type { Placement } from './internal/Layer';

export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip';

export { VisuallyHidden } from './components/VisuallyHidden';
export type { VisuallyHiddenProps } from './components/VisuallyHidden';
