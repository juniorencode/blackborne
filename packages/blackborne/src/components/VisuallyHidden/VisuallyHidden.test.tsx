/*
 * A component that is invisible by definition decides what this file can
 * honestly claim.
 *
 * jsdom does no layout and resolves no stylesheet, so `bb:sr-only` is an inert
 * string here. Nothing below proves the content is off-screen, and nothing
 * below proves it occupies no space in a row. Those are browser checks.
 *
 * What jsdom does see is the failure that actually happens. Hiding content the
 * wrong way removes it from the accessibility tree, and every mechanism that
 * does so — `aria-hidden`, the `hidden` attribute, `inert`, an inline
 * `display: none` or `visibility: hidden` — is observable without laying
 * anything out. So is the effect: an accessible name computed from this
 * content either exists or does not.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { VisuallyHidden } from './VisuallyHidden';

test('its content reaches the accessible name of the control around it', () => {
  render(
    <button type="button">
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Close</VisuallyHidden>
    </button>
  );

  /*
   * The assertion that matters, and the one a wrong implementation fails.
   * Name computation skips hidden subtrees, so if this component hid its
   * content in any of the ways that remove it from the tree, the button would
   * come out named "×" — or named nothing at all.
   */
  expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
});

test('the content is rendered, not dropped', () => {
  render(<VisuallyHidden>Loading customers</VisuallyHidden>);
  expect(screen.getByText('Loading customers')).toBeTruthy();
});

test('it hides the pixels without removing the node', () => {
  const { container } = render(<VisuallyHidden>Saved</VisuallyHidden>);
  const element = container.firstElementChild as HTMLElement;

  expect(element.tagName).toBe('SPAN');
  // Each of these would leave the screen looking identical and the content
  // gone for anyone who cannot see it.
  expect(element.hasAttribute('aria-hidden')).toBe(false);
  expect(element.hasAttribute('hidden')).toBe(false);
  expect(element.hasAttribute('inert')).toBe(false);
  expect(element.style.display).toBe('');
  expect(element.style.visibility).toBe('');
});

test('a consumer className is added to the hiding, never substituted for it', () => {
  const { container } = render(
    <VisuallyHidden className="consumer-layout">Saved</VisuallyHidden>
  );
  const element = container.firstElementChild as HTMLElement;

  /*
   * The one class-name assertion in this file, and the reason it is not the
   * usual mistake: this class is not appearance, it is the hiding mechanism,
   * and with no stylesheet resolved it is the only trace of it jsdom can see.
   * `className={className}` instead of `cx(...)` would unhide the component
   * and break nothing else — including every other test here.
   */
  expect(element.classList.contains('bb:sr-only')).toBe(true);
  expect(element.classList.contains('consumer-layout')).toBe(true);
});

test('style reaches the outermost element', () => {
  const { container } = render(
    <VisuallyHidden style={{ marginBlockStart: 4 }}>Saved</VisuallyHidden>
  );
  const element = container.firstElementChild as HTMLElement;
  expect(element.style.marginBlockStart).toBe('4px');
});

test('the ref reaches the span', () => {
  const ref = createRef<HTMLSpanElement>();
  render(<VisuallyHidden ref={ref}>Saved</VisuallyHidden>);
  expect(ref.current?.tagName).toBe('SPAN');
  expect(ref.current?.textContent).toBe('Saved');
});
