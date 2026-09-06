/*
 * Behaviour, from the perspective of someone using the card.
 *
 * WHAT IS NOT HERE, and why it is not an omission: there is no assertion that
 * the card declares a query container. jsdom implements neither containment
 * nor container queries, so `getComputedStyle` cannot answer it, and the only
 * thing left to assert would be that a `bb:@container` class is on the
 * element — which proves nothing about what the browser did with it and turns
 * every refactor into a false failure (doc 10 §4). Decision 0010 says this
 * outright: it is verified in a browser. Card.stories.tsx carries the story
 * that makes it visible, and the catalog is where it is checked.
 *
 * Card has no logic and no hooks, so it has no logic tests. P6 puts logic in
 * hooks; this component only paints.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Card } from './Card';

test('renders its children', () => {
  render(
    <Card>
      <p>Invoice 4821</p>
    </Card>
  );
  expect(screen.getByText('Invoice 4821')).toBeTruthy();
});

test('renders a plain div, with no role of its own', () => {
  const { container } = render(<Card>Grouped content</Card>);
  const root = container.firstElementChild;

  /*
   * A Card groups content visually and claims nothing about what that content
   * is. A role — or a <section>, which is a landmark — would be a claim the
   * consumer never made, and it would need a name to be useful, which is a
   * string the library does not have and must not invent (doc 05 §2.2). A
   * consumer who needs a labelled region wraps the Card in one.
   */
  expect(root?.tagName).toBe('DIV');
  expect(root?.hasAttribute('role')).toBe(false);
});

test('the ref reaches the root element', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(<Card ref={ref}>Grouped content</Card>);

  expect(ref.current).toBe(container.firstElementChild);
  expect(ref.current?.tagName).toBe('DIV');
});

test('className is applied to the root, alongside the component classes', () => {
  const { container } = render(
    <Card className="consumer-layout-class">Grouped content</Card>
  );
  const root = container.firstElementChild as HTMLElement;

  // The consumer's class is present for layout (doc 02 §6) and it has not
  // replaced the component's own classes.
  expect(root.className).toContain('consumer-layout-class');
  expect(root.className.split(' ').length).toBeGreaterThan(1);
});

test('style reaches the root, for placement in the consumer layout', () => {
  const { container } = render(
    <Card style={{ maxWidth: 480 }}>Grouped content</Card>
  );
  const root = container.firstElementChild as HTMLElement;

  expect(root.style.maxWidth).toBe('480px');
});

test('an empty card renders without children', () => {
  // A card is a surface before it is a container of anything, and a screen
  // that has not loaded yet renders the frame with nothing in it. Nothing
  // here may assume children exist.
  const { container } = render(<Card />);
  expect(container.firstElementChild?.childNodes.length).toBe(0);
});
