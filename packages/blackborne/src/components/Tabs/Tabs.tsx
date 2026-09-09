import { forwardRef, useRef, useState } from 'react';
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type Key
} from 'react-aria-components';
import { Select, SelectItem } from '../Select';
import { cx } from '../../internal/cx';
import { useDevWarning } from '../../internal/useDevWarning';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';
import { readTabs } from './readTabs';

/*
 * The container, and the query container the step is asked of.
 *
 * `w-full` beside `@container` is doc 04 §4.3's law and not a layout
 * preference: inline-size containment computes a width as though the element
 * had no contents, so anything sized BY its contents collapses to its borders.
 * `Pagination` pairs the two for the same reason and the package guide carries
 * the measurement.
 */
const ROOT = cx('bb-tabs', 'bb:@container bb:box-border bb:w-full');

/*
 * THE HEADER IS THE ELEMENT THAT OUTLIVES BOTH STRUCTURES, and that is the
 * whole reason it is its own box rather than being whichever control is in it.
 *
 * It is what the step is read from — a container query asks an ANCESTOR, so
 * the observed element cannot be the container — and it holds either the tab
 * list or the select. If the observed element were the control, it would
 * unmount every time the structure changed, leaving the observer watching a
 * detached node; a detached node reports a width of zero, the step would fall
 * back to `base`, that would swap the structure back, and the next one would
 * detach in turn. A component flickering between two structures at one width,
 * forever.
 *
 * One element that outlives both removes the loop rather than damping it.
 */
const HEADER = cx('bb-tabs-header', CONTAINER_STEPS, 'bb:box-border bb:w-full');

/*
 * The tab list wraps, and that is the N1 half of this component.
 *
 * The structural change below handles a container with no room for a row of
 * tabs. What it cannot know is whether these particular labels fit — CSS
 * counts pixels, not words — so eight long titles in a wide container would
 * still overflow, and doc 04 §7 is blunt about what overflow costs: content
 * hidden by it is content lost. Wrapping is the floor that holds at every
 * width and needs no measurement, which is the answer `Breadcrumbs` reached
 * before its collapse existed.
 */
const LIST = cx(
  'bb-tabs-list',
  'bb:box-border bb:flex bb:flex-wrap bb:items-end',
  'bb:gap-x-(--bb-space-4) bb:border-b bb:border-border'
);

/*
 * One tab.
 *
 * **The weight does not change with selection**, and that is deliberate: a
 * bold word is wider than the same word unbolded, so every tab after the
 * selected one would slide sideways as somebody moved along the row — doc 09
 * §7's "nothing moves under the cursor", in the one component whose controls
 * sit in a line. Selection is said by colour and by the rule underneath, and
 * neither costs a pixel of width.
 *
 * That rule is drawn on the tab and pulled down over the list's own border by
 * a pixel, so the two read as one line. `border-b-2` carries its own width and
 * style, which is why nothing here adds `border-solid` — the package guide has
 * the 3px measurement that lesson came from.
 *
 * `data-focused` rather than `data-focus-visible` is `Button`'s reasoning
 * about consistency, and the halo without a border is because a tab has no box
 * of its own to recolour.
 */
const TAB = cx(
  'bb-tabs-tab',
  'bb:box-border bb:-mb-px bb:flex bb:min-h-hit bb:items-center',
  'bb:px-(--bb-space-1) bb:pb-(--bb-space-2)',
  'bb:border-b-2 bb:border-b-transparent',
  'bb:font-sans bb:text-md bb:font-strong bb:leading-tight',
  'bb:cursor-pointer bb:select-none bb:whitespace-nowrap',
  'bb:rounded-t-md bb:outline-hidden bb:text-text-muted',
  'bb:transition-[color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:text-text',
  'bb:data-selected:border-b-accent bb:data-selected:text-text',
  'bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/*
 * The panel. `outline-hidden` because the base makes it focusable — a tabpanel
 * is in the tab sequence so the content can be reached from the keyboard — and
 * a ring round a whole block of content says nothing useful.
 */
const PANEL = cx(
  'bb-tabs-panel',
  'bb:box-border bb:pt-(--bb-space-4)',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text',
  'bb:outline-hidden'
);

/*
 * Which structure each step of the scale gets.
 *
 * Four steps, two structures, and the boundary is `medium`: a select below it,
 * tabs from it up. The reason is what a tab list needs and a select does not —
 * room for several labels SIDE BY SIDE. The narrow step is 24rem, which holds
 * two short words and a third if you are lucky, so a row of tabs there either
 * overflows or wraps into a stack of one-tab rows that has stopped looking
 * like tabs at all.
 *
 * It is an approximation of "when they do not fit", which is what the catalog
 * asked for, and it is the honest kind. The alternative is measuring the row's
 * own scroll width in JavaScript, which puts a second set of thresholds inside
 * a component — the thing doc 04 §6 rule 1 forbids in as many words.
 */
const STRUCTURE = {
  base: 'select',
  narrow: 'select',
  medium: 'tabs',
  wide: 'tabs'
} as const;

export interface TabsProps {
  /**
   * What the set of tabs is called.
   *
   * Never drawn, and always present: it names the tab list for a screen
   * reader, and it is the label of the select the narrow structure becomes —
   * which is a field, and a field with no label is not one. A string rather
   * than a node, because `aria-label` takes text.
   */
  label: string;
  /** The tabs. `Tab` elements. */
  children: React.ReactNode;
  /** Which tab is open, by its `id`. */
  selectedKey?: string;
  /** The uncontrolled shortcut (doc 02 §8). Defaults to the first tab. */
  defaultSelectedKey?: string;
  /** Called with the id of the tab that is now open. */
  onSelectionChange?: (key: string) => void;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * One thing at a time, out of several.
 *
 * ```tsx
 * <Tabs label="Invoice">
 *   <Tab id="lines" title="Lines">…</Tab>
 *   <Tab id="tax" title="Tax">…</Tab>
 * </Tabs>
 * ```
 *
 * **The component doc 04 §6 was written for**, and the second thing to call
 * its hook: below the medium step there is no room for a row of tabs, so the
 * row becomes a `Select` and the panel stays where it was. The first paint is
 * always the select, because a `ResizeObserver` reports after layout and §4.1
 * establishes the narrow structure as the one that is safe at any width.
 *
 * ## What the narrow structure is, and is not
 *
 * It is a select above the content. It is **not** a tab list dressed as one:
 * there are no tabs in it, nothing announces itself as one, and the arrow keys
 * belong to the select. Doc 06 §2's rule is that a component may add the
 * layout and may not add the ARIA — a tabpanel announced where no tablist is
 * reachable is semantics nobody can act on.
 *
 * The price is written down rather than hidden: the panel is a different
 * element in the two structures, so crossing the threshold remounts what is
 * inside it. The selected tab survives, because this component holds that
 * state and the structure is chosen below it — but a form halfway through
 * being typed does not, and a consumer whose panels hold one should hold its
 * state above the tabs. That is P3's own shape rather than an exception to it.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    label,
    children,
    selectedKey,
    defaultSelectedKey,
    onSelectionChange,
    className,
    style
  },
  ref
) {
  const header = useRef<HTMLDivElement>(null);
  const step = useContainerStep(header);
  const { tabs, strays } = readTabs(children);

  useDevWarning(
    strays > 0,
    'Tabs: some children are not Tab elements, or repeat an id, and were ' +
      'dropped. A Tab is read rather than rendered, so a component of your ' +
      'own that returns one is not one.'
  );

  /*
   * The uncontrolled half, and the fallback that keeps it honest: a
   * `selectedKey` naming a tab that is not there — one removed while the
   * screen was open — falls back to the first rather than showing nothing,
   * because an empty panel under a live tab list is a component that looks
   * broken and reports nothing.
   */
  const [chosen, setChosen] = useState<string | undefined>(defaultSelectedKey);
  const asked = selectedKey ?? chosen;
  const current =
    tabs.find(tab => tab.id === asked)?.id ??
    tabs.find(tab => !tab.isDisabled)?.id ??
    tabs[0]?.id;

  const choose = (key: Key | null) => {
    if (key === null) return;
    const id = String(key);
    if (selectedKey === undefined) setChosen(id);
    onSelectionChange?.(id);
  };

  /* Zero tabs renders nothing, the way zero pages renders no pager. */
  if (current === undefined) return null;

  const open = tabs.find(tab => tab.id === current);
  const asTabs = STRUCTURE[step] === 'tabs';

  return (
    <AriaTabs
      ref={ref}
      selectedKey={current}
      onSelectionChange={choose}
      className={cx(ROOT, className)}
      {...(style === undefined ? {} : { style })}
    >
      <div ref={header} className={HEADER}>
        {asTabs ? (
          <AriaTabList aria-label={label} className={LIST}>
            {tabs.map(tab => (
              <AriaTab
                key={tab.id}
                id={tab.id}
                isDisabled={tab.isDisabled}
                className={TAB}
                {...(tab.textValue === undefined
                  ? {}
                  : { textValue: tab.textValue })}
              >
                {tab.title}
              </AriaTab>
            ))}
          </AriaTabList>
        ) : (
          <Select
            label={label}
            isLabelHidden
            selectedKey={current}
            onSelectionChange={choose}
          >
            {tabs.map(tab => (
              <SelectItem
                key={tab.id}
                id={tab.id}
                isDisabled={tab.isDisabled}
                {...(tab.textValue === undefined
                  ? {}
                  : { textValue: tab.textValue })}
              >
                {tab.title}
              </SelectItem>
            ))}
          </Select>
        )}
      </div>
      {asTabs ? (
        <AriaTabPanel id={current} className={PANEL}>
          {open?.children}
        </AriaTabPanel>
      ) : (
        <div className={PANEL}>{open?.children}</div>
      )}
    </AriaTabs>
  );
});
