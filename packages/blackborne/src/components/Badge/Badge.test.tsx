/*
 * Behaviour, from the perspective of someone using a badge — and, for half of
 * these, from the perspective of someone who never sees it.
 *
 * Deliberately absent: any assertion about class names. That a badge carries
 * `bb:bg-success-subtle` proves nothing about what colour it ended up, and
 * turns every refactor into a wall of false failures (doc 10 §4). What the
 * tone tokens actually resolve to is a question for a real browser, because
 * jsdom does not resolve CSS variables at all — the catalog and the visual
 * checks own it.
 *
 * Also absent: tests for React Aria. What is tested here is what we added on
 * top of it, and the accessible name of the remove button is most of that.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { Badge } from './Badge';

test('renders its children', () => {
  render(<Badge>Active</Badge>);
  expect(screen.getByText('Active')).toBeTruthy();
});

test('every variant and tone renders without crashing', () => {
  const variants = ['solid', 'soft'] as const;
  const tones = [
    'neutral',
    'accent',
    'success',
    'warning',
    'danger',
    'info'
  ] as const;

  for (const variant of variants) {
    for (const tone of tones) {
      const { unmount } = render(
        <Badge variant={variant} tone={tone}>
          {`${variant} ${tone}`}
        </Badge>
      );
      expect(screen.getByText(`${variant} ${tone}`)).toBeTruthy();
      unmount();
    }
  }
});

test('carries no control until it is given something to remove', () => {
  render(<Badge>Active</Badge>);
  // A badge is a label, not a control: nothing to tab to and nothing to press.
  expect(screen.queryByRole('button')).toBe(null);
});

test('the remove button is named for what it removes', () => {
  render(<Badge onRemove={() => {}}>Active</Badge>);

  /*
   * Not "Remove". A row of filters where every button announces itself the
   * same way tells a screen reader user nothing about which one they are on,
   * so the name composes the dictionary word with the badge's own label.
   */
  expect(screen.getByRole('button', { name: 'Remove Active' })).toBeTruthy();
});

test('the remove button takes its word from the dictionary, not from English', async () => {
  render(
    <ConfigProvider locale="es-PE" dictionary={{ remove: 'Quitar' }}>
      <Badge onRemove={() => {}}>Activo</Badge>
    </ConfigProvider>
  );

  // Doc 05 §2.2: an accessibility label is text a person reads, so it is
  // translated like any other string.
  expect(screen.getByRole('button', { name: 'Quitar Activo' })).toBeTruthy();
});

test('pressing remove calls onRemove once', async () => {
  const onRemove = vi.fn();
  const user = userEvent.setup();
  render(<Badge onRemove={onRemove}>Active</Badge>);

  await user.click(screen.getByRole('button'));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test('remove is reachable by keyboard, and answers Enter and Space', async () => {
  const onRemove = vi.fn();
  const user = userEvent.setup();
  render(<Badge onRemove={onRemove}>Active</Badge>);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button'));

  await user.keyboard('{Enter}');
  await user.keyboard(' ');
  expect(onRemove).toHaveBeenCalledTimes(2);
});

test('the dot is not announced', () => {
  const { container } = render(<Badge dot>Active</Badge>);

  // It repeats the tone, which the label already says. Announcing it a second
  // time is noise (doc 06 §3).
  expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
  expect(screen.getByText('Active').textContent).toBe('Active');
});

test('an icon child is rendered as it was given', () => {
  const { container } = render(
    <Badge>
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
        <path d="M5 12h14" stroke="currentColor" />
      </svg>
      Active
    </Badge>
  );

  /*
   * The icon arrives as a child and is left alone: no wrapper, no rewritten
   * attributes (doc 02 §11). Its 24px comes out at the library's size because
   * CSS beats those attributes — which is a question for a browser, so what is
   * asserted here is only that nothing touched the element on the way through.
   */
  const icon = container.querySelector('svg');
  expect(icon?.getAttribute('width')).toBe('24');
  expect(screen.getByText('Active')).toBeTruthy();
});

test('the ref reaches the outermost element, and nothing else', () => {
  const ref = createRef<HTMLSpanElement>();
  render(
    <Badge ref={ref} onRemove={() => {}}>
      Active
    </Badge>
  );

  expect(ref.current?.tagName).toBe('SPAN');
  expect(ref.current?.contains(screen.getByRole('button'))).toBe(true);
});

test('className is applied to the root, alongside the component classes', () => {
  const ref = createRef<HTMLSpanElement>();
  render(
    <Badge ref={ref} className="consumer-layout-class">
      Active
    </Badge>
  );

  // The consumer's class is there for layout (doc 02 §6) and has not replaced
  // the component's own.
  expect(ref.current?.className).toContain('consumer-layout-class');
  expect((ref.current?.className ?? '').split(' ').length).toBeGreaterThan(1);
});

test('style reaches the root', () => {
  const ref = createRef<HTMLSpanElement>();
  render(
    <Badge ref={ref} style={{ maxWidth: 120 }}>
      Active
    </Badge>
  );

  expect(ref.current?.style.maxWidth).toBe('120px');
});
