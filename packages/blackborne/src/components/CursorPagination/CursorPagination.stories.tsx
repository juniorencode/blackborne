/*
 * The visual catalog for CursorPagination.
 *
 * `Against the other one` is the story that earns its existence: two pagers
 * side by side, taking different data, doing what each can. Apart they look
 * like the same component with a feature missing; together the difference is
 * the point (decision 0014).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Pagination } from '../Pagination';
import { CursorPagination } from './CursorPagination';

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/CursorPagination',
  component: CursorPagination,
  args: {
    hasPrevious: true,
    hasNext: true,
    onPrevious: () => {},
    onNext: () => {},
    isPending: false
  },
  argTypes: { onPrevious: { control: false }, onNext: { control: false } }
} satisfies Meta<typeof CursorPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A pager walking a list whose length nobody knows — which is the normal shape
 * of a cursor-paged API, and the reason this component cannot show numbers:
 * there is no total on its side of the network to count towards.
 *
 * Press it: after three pages forward there is nothing ahead, and the end
 * switches off on its own.
 */
export const Overview: Story = {
  render: () => {
    function Demo() {
      const [index, setIndex] = useState(0);
      const last = 3;

      return (
        <div className="catalog-stack">
          <p className="catalog-label">
            Page {index + 1} of however many there are.
          </p>
          <CursorPagination
            hasPrevious={index > 0}
            hasNext={index < last}
            onPrevious={() => setIndex(n => n - 1)}
            onNext={() => setIndex(n => n + 1)}
          />
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * Every state, and there are only four of them plus waiting.
 *
 * Availability is **received** in each direction rather than deduced from a
 * total (P2), which is what lets the second row exist at all: something behind
 * and nothing ahead.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-stack">
      {(
        [
          ['both ways', true, true, false],
          ['at the start', false, true, false],
          ['at the end', true, false, false],
          ['nowhere to go', false, false, false],
          ['a page on its way', true, true, true]
        ] as const
      ).map(([label, hasPrevious, hasNext, isPending]) => (
        <div key={label} className="catalog-row">
          <span
            className="catalog-label"
            style={{ width: 140, marginBlockEnd: 0 }}
          >
            {label}
          </span>
          <CursorPagination
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            isPending={isPending}
            onPrevious={() => {}}
            onNext={() => {}}
          />
        </div>
      ))}
    </div>
  )
};

/**
 * The two pagers together.
 *
 * They share no prop. One is given a total and computes a window from it; the
 * other is given two booleans and **cannot know a total, ever** — the number
 * does not exist on its side of the network. Two different questions that
 * happen to be answered by controls in the same corner, which is why they are
 * two components and not a mode (decision 0014).
 *
 * Note what is the same: the two ends, their chevrons, and their names. To
 * somebody listening they are the same thing, which is why they share the
 * dictionary's `pagination`, `previousPage` and `nextPage`.
 */
export const AgainstTheOtherOne: Story = {
  name: 'Against the other one',
  render: () => (
    <div className="catalog-stack">
      <Scope label="Pagination · a total, and a window into it">
        <Pagination page={6} pages={12} onPageChange={() => {}} />
      </Scope>
      <Scope label="CursorPagination · two booleans, and no total">
        <CursorPagination
          hasPrevious
          hasNext
          onPrevious={() => {}}
          onNext={() => {}}
        />
      </Scope>
    </div>
  )
};

/** Light, dark, compact, and RTL — where the chevrons turn round because
 * previous and next are directional (doc 02 §11.4). */
export const Together: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', { mode: 'light' as const }],
          ['Dark', { mode: 'dark' as const }],
          ['Compact', { density: 'compact' as const }],
          ['RTL · العربية', { dir: 'rtl' as const }]
        ] as const
      ).map(([label, scope]) => (
        <Scope key={label} label={label} {...scope}>
          <CursorPagination
            hasPrevious
            hasNext
            onPrevious={() => {}}
            onNext={() => {}}
          />
        </Scope>
      ))}
    </div>
  )
};
