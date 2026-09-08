/*
 * The cursor pager has no structure to change and no numbers to arrange, so
 * unlike its offset sibling almost all of it holds here: two buttons, four
 * states between them, and where the names come from.
 *
 * What is not here is the pair of them side by side — that they cannot be
 * confused for each other is a picture, and it is a baseline.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { CursorPagination } from './CursorPagination';

const noop = () => {};

/*
 * A named GROUP rather than a landmark, for the reason its sibling records: a
 * pager at each end of a table is normal, and two landmarks with the same role
 * and name are indistinguishable. A group claims no region.
 */
test('it is a named group with two ends', () => {
  render(
    <CursorPagination hasPrevious hasNext onPrevious={noop} onNext={noop} />
  );

  expect(screen.getByRole('group').getAttribute('aria-label')).toBe(
    'Pagination'
  );
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.getAllByRole('button')).toHaveLength(2);
});

/*
 * Availability is RECEIVED, not deduced (P2, decision 0014). Each direction is
 * switched off on its own, which is the difference that makes this a separate
 * component: a cursor pager can have something behind it and nothing ahead.
 */
test('each direction is available on its own', () => {
  const { rerender } = render(
    <CursorPagination
      hasPrevious={false}
      hasNext
      onPrevious={noop}
      onNext={noop}
    />
  );

  const previous = () => screen.getByRole('button', { name: 'Previous page' });
  const next = () => screen.getByRole('button', { name: 'Next page' });

  expect(previous().hasAttribute('disabled')).toBe(true);
  expect(next().hasAttribute('disabled')).toBe(false);

  rerender(
    <CursorPagination
      hasPrevious
      hasNext={false}
      onPrevious={noop}
      onNext={noop}
    />
  );
  expect(previous().hasAttribute('disabled')).toBe(false);
  expect(next().hasAttribute('disabled')).toBe(true);
});

test('the ends call what they were given', async () => {
  const user = userEvent.setup();
  const onPrevious = vi.fn();
  const onNext = vi.fn();

  render(
    <CursorPagination
      hasPrevious
      hasNext
      onPrevious={onPrevious}
      onNext={onNext}
    />
  );

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  await user.click(screen.getByRole('button', { name: 'Previous page' }));

  expect(onNext).toHaveBeenCalledTimes(1);
  expect(onPrevious).toHaveBeenCalledTimes(1);
});

/*
 * While a page is on its way, neither end is offered — a second press would
 * ask for a page nobody has a cursor for yet.
 */
test('a page on its way switches both ends off', async () => {
  const user = userEvent.setup();
  const onNext = vi.fn();

  render(
    <CursorPagination
      hasPrevious
      hasNext
      isPending
      onPrevious={noop}
      onNext={onNext}
    />
  );

  for (const button of screen.getAllByRole('button')) {
    expect(button.hasAttribute('disabled')).toBe(true);
  }

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(onNext).not.toHaveBeenCalled();
});

test('the names come from the dictionary', () => {
  render(
    <ConfigProvider
      dictionary={{
        pagination: 'Paginación',
        previousPage: 'Anterior',
        nextPage: 'Siguiente'
      }}
    >
      <CursorPagination hasPrevious hasNext onPrevious={noop} onNext={noop} />
    </ConfigProvider>
  );

  expect(screen.getByRole('group').getAttribute('aria-label')).toBe(
    'Paginación'
  );
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDefined();
});

test('className and the ref reach the outermost element and nothing else', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(
    <CursorPagination
      ref={ref}
      className="placed-by-the-consumer"
      hasPrevious
      hasNext
      onPrevious={noop}
      onNext={noop}
    />
  );

  expect(ref.current).toBe(container.firstElementChild);
  expect(ref.current?.tagName).toBe('DIV');
  expect(container.querySelectorAll('.placed-by-the-consumer')).toHaveLength(1);
});
