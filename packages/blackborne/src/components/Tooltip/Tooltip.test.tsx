/*
 * The assertion this file exists for is the one nobody expects: a tooltip
 * DESCRIBES its trigger and does not NAME it. An icon-only button with a
 * tooltip and no `aria-label` is announced as "button", and the tooltip is read
 * as the description of nothing.
 *
 * That is invisible in every other kind of check — the screenshot is right, the
 * hover works, the words are there — so it is asserted twice: once that the
 * description is wired, and once that the name is still missing when the
 * consumer did not give one.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Button } from '../Button';
import { Tooltip } from './Tooltip';

const withTooltip = (
  props: Partial<React.ComponentProps<typeof Tooltip>> = {}
) =>
  render(
    <Tooltip content="Save and close" {...props}>
      <Button aria-label="Save">S</Button>
    </Tooltip>
  );

test('the trigger renders, and the tooltip does not', () => {
  withTooltip();

  expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  /*
   * Not merely hidden. A tooltip in the document at rest would put the words of
   * every tooltip on a toolbar into the accessibility tree at once.
   */
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(screen.queryByText('Save and close')).toBeNull();
});

test('focus opens it', async () => {
  withTooltip();

  await userEvent.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Save' })
  );

  /*
   * Focus and not only hover, and that is the half that matters: focus is the
   * only route somebody using a keyboard has. The base opens on both by
   * default, and the one configuration that would break this — hover only —
   * does not exist in its API at all.
   */
  expect(await screen.findByRole('tooltip')).toBeTruthy();
  expect(screen.getByText('Save and close')).toBeTruthy();
});

test('and it describes the trigger', async () => {
  withTooltip();
  await userEvent.tab();

  const button = screen.getByRole('button', { name: 'Save' });
  const tooltip = await screen.findByRole('tooltip');

  const describedBy = button.getAttribute('aria-describedby');
  expect(describedBy, 'the tooltip is not wired to the trigger').toBeTruthy();
  expect(describedBy).toBe(tooltip.getAttribute('id'));
});

test('IT DOES NOT NAME THE TRIGGER', async () => {
  render(
    <Tooltip content="Save and close">
      {/* Deliberately no `aria-label`, which is the mistake being asserted. */}
      <Button>
        <svg aria-hidden="true" viewBox="0 0 16 16" />
      </Button>
    </Tooltip>
  );

  await userEvent.tab();
  await screen.findByRole('tooltip');

  /*
   * The trap, stated as a test. `aria-describedby` is not `aria-labelledby`:
   * the tooltip is read AFTER the control's name, and if there is no name the
   * control is announced as "button" and the tooltip describes nothing.
   *
   * So an icon-only trigger still needs its own name (doc 02 §11.3), and this
   * asserts that the library does not quietly fill it in — which would look
   * like a kindness and would hide the problem in every case where the
   * description is not a good name.
   */
  expect(
    screen.queryByRole('button', { name: 'Save and close' }),
    'the tooltip is being used as the name'
  ).toBeNull();

  const button = screen.getByRole('button');
  expect(button.getAttribute('aria-label')).toBeNull();
  expect(button.getAttribute('aria-labelledby')).toBeNull();
});

test('Escape closes it', async () => {
  withTooltip();

  await userEvent.tab();
  expect(await screen.findByRole('tooltip')).toBeTruthy();

  /*
   * Doc 09 §8: Escape cancels the current level, one at a time. A tooltip is a
   * level, and one that could not be dismissed would sit over whatever it
   * overlaps for as long as focus stayed put.
   */
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).toBeNull();
});

test('isDisabled turns it off without unmounting the trigger', async () => {
  withTooltip({ isDisabled: true });

  await userEvent.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Save' })
  );

  // The control is untouched; only the tooltip is off.
  expect(screen.queryByRole('tooltip')).toBeNull();
});

test('a non-focusable trigger gets no tooltip at all', async () => {
  render(
    <Tooltip content="The full, untruncated value">
      {/* Deliberately not focusable: that is what is being measured. */}
      <span>Astilleros del Sur, S.A.C.</span>
    </Tooltip>
  );

  /*
   * Measured rather than assumed, because the prop documentation makes a claim
   * about it: `TooltipTrigger` supplies its hover and focus handling through a
   * focusable context, so a bare `<span>` receives none of it.
   *
   * The failure is one-sided and that is what makes it worth a test: a mouse
   * still gets nothing here, so it is visible in development — but if the
   * base ever started attaching handlers to arbitrary children, a tooltip
   * would appear for a pointer and stay unreachable by keyboard, which is the
   * silent version.
   */
  await userEvent.tab();
  expect(screen.queryByRole('tooltip')).toBeNull();

  await userEvent.hover(screen.getByText('Astilleros del Sur, S.A.C.'));
  expect(screen.queryByRole('tooltip')).toBeNull();
});

test('the content may be nodes rather than a string', async () => {
  render(
    <Tooltip
      content={
        <>
          Save and close <kbd>Ctrl</kbd>+<kbd>S</kbd>
        </>
      }
    >
      <Button aria-label="Save">S</Button>
    </Tooltip>
  );

  await userEvent.tab();
  const tooltip = await screen.findByRole('tooltip');
  expect(tooltip.textContent).toContain('Ctrl');
  expect(tooltip.querySelectorAll('kbd')).toHaveLength(2);
});
