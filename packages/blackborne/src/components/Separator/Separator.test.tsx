/*
 * Behaviour, from the perspective of someone using the separator.
 *
 * Deliberately absent: any assertion about class names. Checking that the
 * element carries `bb:self-stretch` proves nothing about whether the line is
 * visible, and turns every refactor into a wall of false failures (doc 10 §4).
 * Whether a vertical separator actually has a height is a question for a real
 * browser, and it is covered in the catalog rather than pretended at here —
 * jsdom resolves no layout at all.
 *
 * Also absent: tests for React Aria. What is tested is what we added on top,
 * and for this component that is one thing above all: the component renders
 * through two different code paths — the base's for the semantic case, our own
 * for the decorative one — and the two must not drift. Most of what follows is
 * asserted for both.
 *
 * Separator has no logic and no hooks, so it has no logic tests. That is not
 * an omission: P6 puts logic in hooks, and this component only paints.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Separator } from './Separator';

test('is announced as a separator by default', () => {
  render(<Separator />);
  expect(screen.getByRole('separator')).toBeTruthy();
});

test('a vertical separator reports its orientation', () => {
  render(<Separator orientation="vertical" />);
  expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe(
    'vertical'
  );
});

test('a horizontal separator leaves the orientation implicit', () => {
  render(<Separator />);
  // Horizontal is the default in ARIA, so stating it would be noise. This
  // guards against "helpfully" adding it later.
  expect(screen.getByRole('separator').hasAttribute('aria-orientation')).toBe(
    false
  );
});

test('a semantic separator can carry a name', () => {
  render(<Separator aria-label="End of the results" />);
  expect(
    screen.getByRole('separator', { name: 'End of the results' })
  ).toBeTruthy();
});

test('a decorative separator is not announced at all', () => {
  render(<Separator isDecorative data-testid="rule" />);

  // Nothing in the accessibility tree: no separator, and nothing else either.
  // getByRole ignores aria-hidden subtrees, which is exactly the question.
  expect(screen.queryByRole('separator')).toBe(null);
  expect(screen.getByTestId('rule').getAttribute('aria-hidden')).toBe('true');
});

test('a decorative separator is decorative in both orientations', () => {
  const { rerender } = render(
    <Separator isDecorative orientation="vertical" />
  );
  expect(screen.queryByRole('separator')).toBe(null);

  rerender(<Separator isDecorative orientation="horizontal" />);
  expect(screen.queryByRole('separator')).toBe(null);
});

test('it is not in the tab order', async () => {
  const user = userEvent.setup();
  render(
    <div>
      <button type="button">before</button>
      <Separator />
      <button type="button">after</button>
    </div>
  );

  await user.tab();
  await user.tab();
  // A separator is not a control. Landing on one would be a focus stop with
  // nothing to do there (doc 06 §4, item 5 is the mirror of this).
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'after' })
  );
});

test('the ref reaches the outermost element, and nothing else', () => {
  const ref = createRef<HTMLElement>();
  render(<Separator ref={ref} />);

  expect(ref.current).toBe(screen.getByRole('separator'));
  expect(ref.current?.parentElement).toBe(document.body.firstElementChild);
});

test('the ref reaches the decorative element too', () => {
  const ref = createRef<HTMLElement>();
  render(<Separator ref={ref} isDecorative data-testid="rule" />);

  expect(ref.current).toBe(screen.getByTestId('rule'));
});

test('className is applied to the root, alongside the component classes', () => {
  render(<Separator className="consumer-layout-class" />);

  const separator = screen.getByRole('separator');
  // The consumer's class is present for layout (doc 02 §6) and it has not
  // replaced the component's own classes.
  expect(separator.className).toContain('consumer-layout-class');
  expect(separator.className.split(' ').length).toBeGreaterThan(1);
});

test('className and style reach the decorative element identically', () => {
  render(
    <Separator
      isDecorative
      data-testid="rule"
      className="consumer-layout-class"
      style={{ marginBlock: '8px' }}
    />
  );

  const separator = screen.getByTestId('rule');
  // The two branches are one component. A prop that works on one and is
  // silently dropped by the other is the failure this whole file is watching
  // for.
  expect(separator.className).toContain('consumer-layout-class');
  expect(separator.className.split(' ').length).toBeGreaterThan(1);
  expect(separator.style.marginBlock).toBe('8px');
});

test('style reaches the semantic element', () => {
  render(<Separator style={{ marginBlock: '8px' }} />);
  expect((screen.getByRole('separator') as HTMLElement).style.marginBlock).toBe(
    '8px'
  );
});

test('id and data attributes are forwarded down both paths', () => {
  const { rerender } = render(<Separator id="rule" data-kind="section" />);

  let separator = screen.getByRole('separator');
  expect(separator.id).toBe('rule');
  expect(separator.getAttribute('data-kind')).toBe('section');

  rerender(<Separator isDecorative id="rule" data-kind="section" />);
  separator = document.getElementById('rule') as HTMLElement;
  expect(separator).toBeTruthy();
  expect(separator.getAttribute('data-kind')).toBe('section');
});

test('every orientation renders in both modes without crashing', () => {
  const orientations = ['horizontal', 'vertical'] as const;

  for (const orientation of orientations) {
    for (const isDecorative of [false, true]) {
      const { unmount } = render(
        <Separator
          orientation={orientation}
          isDecorative={isDecorative}
          data-testid="rule"
        />
      );
      expect(screen.getByTestId('rule')).toBeTruthy();
      unmount();
    }
  }
});
