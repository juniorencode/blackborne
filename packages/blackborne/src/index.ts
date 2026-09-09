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
 * the way `Radio` ships with `RadioGroup`. The step is composed rather than
 * configured: a `Link` for a level you can return to, text for the one you are
 * on.
 */
export { Breadcrumb, Breadcrumbs } from './components/Breadcrumbs';
export type {
  BreadcrumbProps,
  BreadcrumbsProps
} from './components/Breadcrumbs';

export { Button } from './components/Button';
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant
} from './components/Button';

export { Card } from './components/Card';
export type { CardProps } from './components/Card';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { CheckboxGroup } from './components/CheckboxGroup';
export type { CheckboxGroupProps } from './components/CheckboxGroup';

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

export { Separator } from './components/Separator';
export type {
  SeparatorOrientation,
  SeparatorProps
} from './components/Separator';

export { Skeleton } from './components/Skeleton';
export type { SkeletonProps, SkeletonVariant } from './components/Skeleton';

export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize } from './components/Spinner';

export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';

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
