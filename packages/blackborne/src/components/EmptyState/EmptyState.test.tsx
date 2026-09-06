/*
 * Behaviour, from the perspective of someone reading the empty state.
 *
 * Deliberately absent: any assertion about class names. That an element
 * carries `bb:text-lg` proves nothing about how it looks and turns every
 * refactor into a wall of false failures (doc 10 §4). Appearance is the visual
 * catalog's job, and the two checks that need a real browser — the 320px
 * container and the pseudo-localised labels — live in the stories.
 *
 * EmptyState has no state and no hooks: it paints and delegates, so there are
 * no logic tests to write without rendering. That is P6 holding, not an
 * omission.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { EmptyState } from './EmptyState';

test('the two variants say different things', () => {
  const { unmount } = render(<EmptyState />);
  const noData = screen.getByText('Nothing here yet');
  unmount();

  render(<EmptyState variant="no-results" />);
  const noResults = screen.getByText('No results');

  /*
   * The one assertion the component exists for. Doc 09 §6: showing "there is
   * nothing yet" when a filter matched nothing is one of the most common
   * experience bugs there is, and a map that quietly pointed both variants at
   * one key would pass every other test in this file.
   */
  expect(noData.textContent).not.toBe(noResults.textContent);
});

test('with no variant it is the "nothing yet" state', () => {
  render(<EmptyState />);
  expect(screen.getByText('Nothing here yet')).toBeTruthy();
});

test('the fallback title follows the active language', () => {
  render(
    <ConfigProvider
      locale="es-PE"
      dictionary={{ emptyStateNoResults: 'Sin resultados' }}
    >
      <EmptyState variant="no-results" />
    </ConfigProvider>
  );

  expect(screen.getByText('Sin resultados')).toBeTruthy();
  expect(screen.queryByText('No results')).toBeNull();
});

test('a supplied title wins, because only the consumer knows what the list holds', () => {
  render(<EmptyState variant="no-results" title="No invoices match" />);

  expect(screen.getByText('No invoices match')).toBeTruthy();
  expect(screen.queryByText('No results')).toBeNull();
});

test('there is no default description, and nothing stands in for one', () => {
  const { container } = render(<EmptyState />);

  /*
   * How someone starts, and what was searched for, are facts about the
   * consumer's data (doc 09 §6, doc 05 §2.1). A generic second line invented
   * here would be exactly the filler doc 09 §9 rules out.
   */
  expect(container.textContent).toBe('Nothing here yet');
});

test('a description is shown when there is one', () => {
  render(<EmptyState description="Add your first customer to get started." />);
  expect(
    screen.getByText('Add your first customer to get started.')
  ).toBeTruthy();
});

test('the actions belong to the consumer, and they work', async () => {
  const onPress = vi.fn();
  const user = userEvent.setup();

  render(
    <EmptyState>
      <Button variant="primary" onPress={onPress}>
        New customer
      </Button>
    </EmptyState>
  );

  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'New customer' })
  );

  await user.keyboard('{Enter}');
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('the illustration is hidden from assistive technology', () => {
  const { container } = render(
    <EmptyState
      icon={<svg data-testid="illustration" viewBox="0 0 16 16" />}
      title="No invoices match"
    />
  );

  /*
   * The title beside it already says what this is, so announcing the drawing
   * as well is noise (doc 02 §11.3). The attribute goes on the library's own
   * slot, never on the consumer's element.
   */
  const slot = container.querySelector('[aria-hidden="true"]');
  expect(slot).not.toBeNull();
  expect(slot?.querySelector('[data-testid="illustration"]')).not.toBeNull();
});

test('the title is not a heading', () => {
  render(<EmptyState title="No invoices match" />);

  /*
   * Heading hierarchy belongs to the project (doc 06 §2). The library cannot
   * see the document it lands in, so it contributes no level rather than
   * guessing one and skipping or repeating the consumer's.
   */
  expect(screen.queryByRole('heading')).toBeNull();
});

test('the ref reaches the outermost element, and nothing else', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(<EmptyState ref={ref} />);

  expect(ref.current).toBe(container.firstElementChild);
});

test('className and style land on the root, for placement in a layout', () => {
  const { container } = render(
    <EmptyState className="consumer-class" style={{ maxWidth: 400 }} />
  );

  const root = container.firstElementChild as HTMLElement;
  expect(root.classList.contains('consumer-class')).toBe(true);
  expect(root.style.maxWidth).toBe('400px');
});
