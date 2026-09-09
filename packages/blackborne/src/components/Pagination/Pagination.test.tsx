/*
 * What holds without a browser, which for this component is the FLOOR and
 * nothing above it.
 *
 * jsdom implements neither `ResizeObserver` nor container queries, so the
 * hook that decides the structure answers `base` — and that is not a gap
 * papered over with a fake. A fake observer feeding a fake computed style
 * would test the fake; the same answer is what a real first paint gives
 * (doc 04 §6.1), and the wider rows are measured in
 * `apps/catalog/e2e/pagination.spec.ts` where a container query exists.
 *
 * The arithmetic — which numbers, where the gaps go — is in `pageWindow.ts`
 * and tested there, rendering nothing at all (P6).
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { Pagination } from './Pagination';

/*
 * A named LIST rather than a landmark, and the reason is in the component: a
 * pager at each end of a table is normal, and two landmarks with the same role
 * and name are indistinguishable — axe reports `landmark-unique` and it is
 * right to. Named lists have no such rule, and `Breadcrumbs` already has this
 * shape.
 */
test('it is a named list, and claims no landmark', () => {
  render(<Pagination page={3} pages={12} onPageChange={() => {}} />);

  expect(screen.getByRole('list').getAttribute('aria-label')).toBe(
    'Pagination'
  );
  expect(screen.queryByRole('navigation')).toBeNull();
});

test('at the floor it offers the two ends and no numbers', () => {
  render(<Pagination page={3} pages={12} onPageChange={() => {}} />);

  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(2);
  expect(buttons[0]?.getAttribute('aria-label')).toBe('Previous page');
  expect(buttons[1]?.getAttribute('aria-label')).toBe('Next page');

  // No number on screen, which is what doc 04 §11 says the floor is.
  expect(screen.queryByText('3')).toBeNull();
});

test('the ends stop at the ends', () => {
  const { rerender } = render(
    <Pagination page={1} pages={12} onPageChange={() => {}} />
  );

  const previous = () => screen.getByRole('button', { name: 'Previous page' });
  const next = () => screen.getByRole('button', { name: 'Next page' });

  expect(previous().hasAttribute('disabled')).toBe(true);
  expect(next().hasAttribute('disabled')).toBe(false);

  rerender(<Pagination page={12} pages={12} onPageChange={() => {}} />);
  expect(previous().hasAttribute('disabled')).toBe(false);
  expect(next().hasAttribute('disabled')).toBe(true);
});

test('a single page has both ends switched off', () => {
  render(<Pagination page={1} pages={1} onPageChange={() => {}} />);

  for (const button of screen.getAllByRole('button')) {
    expect(button.hasAttribute('disabled')).toBe(true);
  }
});

test('the ends ask for the page either side', async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn<(page: number) => void>();

  render(<Pagination page={3} pages={12} onPageChange={onPageChange} />);

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(onPageChange).toHaveBeenLastCalledWith(4);

  await user.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(onPageChange).toHaveBeenLastCalledWith(2);
});

test('no pages is no pagination', () => {
  const { container } = render(
    <Pagination page={1} pages={0} onPageChange={() => {}} />
  );

  expect(container.firstElementChild).toBeNull();
});

/*
 * Every name comes from the dictionary, so a project translating one word
 * translates it everywhere it appears. The page label is the only key in the
 * library with a placeholder, and this is the test that the substitution
 * happens rather than the brace reaching a screen — measurable here even at
 * the floor, through the two ends.
 */
test('the names come from the dictionary', () => {
  render(
    <ConfigProvider
      dictionary={{
        pagination: 'Paginación',
        previousPage: 'Página anterior',
        nextPage: 'Página siguiente'
      }}
    >
      <Pagination page={3} pages={12} onPageChange={() => {}} />
    </ConfigProvider>
  );

  expect(screen.getByRole('list').getAttribute('aria-label')).toBe(
    'Paginación'
  );
  expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDefined();
  expect(
    screen.getByRole('button', { name: 'Página siguiente' })
  ).toBeDefined();
});

test('className and the ref reach the outermost element and nothing else', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(
    <Pagination
      ref={ref}
      className="placed-by-the-consumer"
      page={1}
      pages={3}
      onPageChange={() => {}}
    />
  );

  expect(ref.current).toBe(container.firstElementChild);
  expect(ref.current?.tagName).toBe('DIV');
  expect(container.querySelectorAll('.placed-by-the-consumer')).toHaveLength(1);
});
