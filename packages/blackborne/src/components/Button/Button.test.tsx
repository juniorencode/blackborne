/*
 * Behaviour, from the perspective of someone using the button.
 *
 * Deliberately absent: any assertion about class names. Checking that an
 * element carries `bb:bg-accent` proves nothing about how it looks, and turns
 * every refactor into a wall of false failures (doc 10 §4). Appearance is the
 * visual catalog's job, and later visual regression's.
 *
 * Also absent: tests for React Aria. It is tested by the people who maintain
 * it; what is tested here is what we added on top.
 *
 * Button has no logic and no hooks, so it has no logic tests. That is not an
 * omission — P6 puts logic in hooks, and this component only paints.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Button } from './Button';

test('renders its children', () => {
  render(<Button>Save changes</Button>);
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
});

test('responds to a click', async () => {
  const onPress = vi.fn();
  const user = userEvent.setup();
  render(<Button onPress={onPress}>Save</Button>);

  await user.click(screen.getByRole('button'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('responds to Enter and to Space', async () => {
  const onPress = vi.fn();
  const user = userEvent.setup();
  render(<Button onPress={onPress}>Save</Button>);

  screen.getByRole('button').focus();
  await user.keyboard('{Enter}');
  await user.keyboard(' ');

  // Doc 09 §8 fixes what the keys mean across the library: Enter confirms the
  // primary action, Space toggles. A button answers to both.
  expect(onPress).toHaveBeenCalledTimes(2);
});

test('is reachable by keyboard', async () => {
  const user = userEvent.setup();
  render(<Button>Save</Button>);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button'));
});

test('when disabled, it does not fire and is announced as disabled', async () => {
  const onPress = vi.fn();
  const user = userEvent.setup();
  render(
    <Button isDisabled onPress={onPress}>
      Save
    </Button>
  );

  const button = screen.getByRole('button');
  expect(button.hasAttribute('disabled')).toBe(true);

  await user.click(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('an icon-only button takes its name from aria-label', () => {
  render(<Button aria-label="Close" />);
  // Doc 06 §3: a button with only an icon always needs an accessible name.
  expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
});

test('the ref reaches the button element, and nothing else', () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>Save</Button>);

  expect(ref.current).toBe(screen.getByRole('button'));
  expect(ref.current?.tagName).toBe('BUTTON');
});

test('className is applied to the root, alongside the component classes', () => {
  render(<Button className="consumer-layout-class">Save</Button>);

  const button = screen.getByRole('button');
  // The consumer's class is present for layout (doc 02 §6) and it has not
  // replaced the component's own classes.
  expect(button.className).toContain('consumer-layout-class');
  expect(button.className.split(' ').length).toBeGreaterThan(1);
});

test('every variant and size renders without crashing', () => {
  const variants = [
    'primary',
    'secondary',
    'subtle',
    'danger',
    'ghost'
  ] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  for (const variant of variants) {
    for (const size of sizes) {
      const { unmount } = render(
        <Button variant={variant} size={size}>
          {`${variant} ${size}`}
        </Button>
      );
      expect(
        screen.getByRole('button', { name: `${variant} ${size}` })
      ).toBeTruthy();
      unmount();
    }
  }
});
