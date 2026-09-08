/*
 * The visual catalog for Pagination.
 *
 * `Steps` is the story this component exists to be looked at in, and the first
 * story in the library to show doc 04's level N3 at all: three fixed widths
 * side by side, three different rows of controls. The widths are chosen
 * against the scale rather than by eye — the nav's own width is what the query
 * asks about, and a `.catalog-panel` takes 24px of it in padding:
 *
 *   320px panel → 296px nav → 18.5rem → narrower than `narrow` → the floor
 *   440px panel → 416px nav → 26rem   → `narrow`                → five
 *   560px panel → 536px nav → 33.5rem → `medium`                → seven
 *
 * The step is read from the container, so resizing the catalog's own frame
 * changes the row in the `Overview` story too. That is worth doing by hand
 * once: it is the whole point of P4, and the numbers appear and go without the
 * page ever reloading.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ConfigProvider } from '../../config';
import { Pagination } from './Pagination';

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  locale,
  width,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  locale?: string;
  width?: number;
  children: React.ReactNode;
}) {
  const scoped = (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(width === undefined ? {} : { style: { width } })}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );

  return locale === undefined ? (
    scoped
  ) : (
    <ConfigProvider locale={locale}>{scoped}</ConfigProvider>
  );
}

/** A pagination that actually pages, for the stories where pressing matters. */
function Pager({ pages = 12, from = 1 }: { pages?: number; from?: number }) {
  const [page, setPage] = useState(from);
  return <Pagination page={page} pages={pages} onPageChange={setPage} />;
}

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  args: { page: 6, pages: 12, onPageChange: () => {} },
  argTypes: { onPageChange: { control: false } }
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working pagination. Press the numbers, and drag the catalog's frame narrow
 * to watch the row change shape.
 *
 * **The page you are on is text, not a button.** It is not somewhere to go —
 * the same decision `Breadcrumbs` makes about its last step — so `Tab` walks
 * only the pages you can reach.
 */
export const Overview: Story = {
  render: () => <Pager />
};

/**
 * The same component at three widths, which is level N3 of doc 04: not a
 * restyle but a different set of controls.
 *
 * At the floor there is no number at all, and no count either. That is what
 * doc 04 §11 says the floor is; the alternative — "6 / 12" — needs a string
 * with a number in it that the dictionary has no key for, and it is recorded
 * in the catalog as pending a decision rather than quietly left out.
 */
export const Steps: Story = {
  render: () => (
    <div className="catalog-stack">
      <Scope label="320px · the floor" width={320}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
      <Scope label="440px · narrow, five numbers" width={440}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
      <Scope label="560px · medium, seven numbers" width={560}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
    </div>
  )
};

/**
 * Where the window sits, and where the gaps go.
 *
 * The first and the last page are always there, because they are the two
 * anybody aims for. And the count of numbers never changes as the current page
 * moves — a row of buttons that changed width while you were pressing them is
 * doc 09 §7's "nothing moves under the cursor".
 *
 * Note the second row: a gap standing in for one page would cost the same
 * width as the page and tell you less, so it does not appear.
 */
export const Positions: Story = {
  render: () => (
    <div className="catalog-stack">
      {[1, 4, 6, 9, 12].map(page => (
        <Scope key={page} label={`page ${page} of 12`} width={560}>
          <Pagination page={page} pages={12} onPageChange={() => {}} />
        </Scope>
      ))}
    </div>
  )
};

/** Light, dark and compact. Density trims the controls and the gaps between
 * them, and moves no colour (doc 03 §3). */
export const Together: Story = {
  render: () => (
    <div className="catalog-stack">
      <Scope label="Light" mode="light" width={560}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
      <Scope label="Dark" mode="dark" width={560}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
      <Scope label="Compact" density="compact" width={560}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
    </div>
  )
};

/**
 * RTL, and the story where two rules meet.
 *
 * The chevrons turn round, because previous and next are directional and the
 * library draws them itself (doc 02 §11.4). And the numbers are **Arabic-Indic
 * digits**, because `ar-EG` uses them and a page number is a number formatted
 * for the locale (doc 05 §3) — a row of Latin digits here would be the tell
 * that something was concatenated rather than formatted.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div className="catalog-stack">
      <Scope label="LTR · en-GB" width={560}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
      <Scope label="RTL · ar-EG" dir="rtl" locale="ar-EG" width={560}>
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
    </div>
  )
};

/**
 * Nine hundred and ninety-nine pages, which is where the figures matter.
 *
 * The numbers are tabular (doc 03 §4.2), so a row that reads `1 … 500 501 502
 * … 999` is exactly as wide as one reading `1 … 111 112 113 … 999`. With
 * proportional figures it would not be, and the row would breathe in and out
 * as somebody paged through it.
 */
export const ManyPages: Story = {
  name: 'Many pages',
  render: () => (
    <div className="catalog-stack">
      <Scope label="page 501 of 999" width={560}>
        <Pagination page={501} pages={999} onPageChange={() => {}} />
      </Scope>
      <Scope label="page 112 of 999" width={560}>
        <Pagination page={112} pages={999} onPageChange={() => {}} />
      </Scope>
    </div>
  )
};

/** One page is a pagination with nothing to do, and both ends say so. */
export const Edges: Story = {
  render: () => (
    <div className="catalog-stack">
      <Scope label="one page" width={560}>
        <Pagination page={1} pages={1} onPageChange={() => {}} />
      </Scope>
      <Scope label="three pages, on the first" width={560}>
        <Pagination page={1} pages={3} onPageChange={() => {}} />
      </Scope>
    </div>
  )
};
