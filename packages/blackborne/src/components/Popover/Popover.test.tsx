/*
 * Some of these tests exist because a foundation said the opposite, and the
 * measurement is what corrects it.
 *
 * Doc 08 §4 said a popover does not contain focus, does not block the page,
 * and that the base draws the same line — `Modal` asking for containment and
 * `Popover` not. Half of that is wrong and the half that is right is right for
 * a reason the document did not have.
 *
 * MEASURED in 1.21.0, and written down here because the shape is surprising:
 * the base renders a full-window underlay, locks the page scroll and hides
 * everything outside the popover from the accessibility tree, all three keyed
 * on nothing but `!isNonModal` — so a popover blocks the page as completely as
 * a dialog does, minus only the visible scrim. Containment is keyed elsewhere:
 * `shouldContainFocus: isDialog`, and `isDialog` is turned OFF by a nested
 * `role="dialog"`, which is exactly what the shared sheet renders.
 *
 * A blocked page that focus can still walk into is the defect that follows,
 * and the fix is in `Popover.tsx`. What is asserted here is the structure it
 * rests on. Where `Tab` actually goes is in `popover.spec.ts`, because jsdom
 * has no tab order.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { useDialog } from '../Dialog';
import { Popover } from './Popover';

const open = (props: Partial<React.ComponentProps<typeof Popover>> = {}) =>
  render(
    <>
      {/* Something on the page, to measure what the layer does to it. */}
      <Button>Behind</Button>
      <Popover
        title="Filter invoices"
        trigger={<Button>Filters</Button>}
        {...props}
      >
        <TextField label="Reference" />
      </Popover>
    </>
  );

test('the trigger renders, and the panel does not', () => {
  open();

  expect(screen.getByRole('button', { name: 'Filters' })).toBeTruthy();
  /*
   * Not merely hidden: a panel in the document at rest would put its fields in
   * the tab order and its words in the accessibility tree before anybody asked
   * for it.
   */
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByText('Filter invoices')).toBeNull();
});

test('pressing the trigger opens it', async () => {
  open();

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  expect(
    await screen.findByRole('dialog', { name: 'Filter invoices' })
  ).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Reference' })).toBeTruthy();
});

test('the panel is not the dialog — the sheet inside it is', async () => {
  open();
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

  const panel = await screen.findByRole('dialog', { name: 'Filter invoices' });
  /*
   * Exactly one dialog, and it is the sheet. The base looks for a nested
   * `role="dialog"` and steps aside when it finds one, so there is one rather
   * than two — good for the accessibility tree, and the direct cause of the
   * base declining to contain focus, since it keys containment on the role it
   * just decided not to add.
   *
   * This is asserted rather than merely known because it is load-bearing: if a
   * future change stopped nesting a dialog in the sheet, the base would take
   * the role back and start containing focus itself, and the containment this
   * component adds would be doubled.
   */
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(panel.tagName).toBe('SECTION');
  expect(
    document.querySelector('.bb-popover')?.getAttribute('role')
  ).toBeNull();
});

test('the page behind is blocked in all three of the base ways', async () => {
  open();
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  /*
   * The correction to doc 08 §4, which had a popover down as a layer that
   * leaves the page alone. All three of these are the base's, all three are
   * keyed on `!isNonModal`, and none of them is affected by `isDismissable`.
   *
   * Geometry is not checked here — jsdom has no layout — but the underlay's
   * inline style is the base's own literal `position: fixed; inset: 0`, so its
   * presence is the whole claim. The browser check measures that it really
   * covers the window and really swallows a click.
   */
  const underlay = document.querySelector('[data-testid="underlay"]');
  expect(underlay).toBeTruthy();
  expect(underlay?.getAttribute('aria-hidden')).toBe('true');

  // The page's own controls leave the accessibility tree while it is open,
  // which is `ariaHideOutside` — the text stays, the role goes.
  expect(screen.queryByRole('button', { name: 'Behind' })).toBeNull();
  expect(screen.getByText('Behind')).toBeTruthy();

  // And the page cannot scroll, which for an anchored layer is right: a page
  // that scrolled would slide out from under a panel pinned to its trigger.
  expect(document.documentElement.style.overflow).toBe('hidden');
});

test('Escape closes it', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  await userEvent.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

test('the close button closes it, and is named from the dictionary', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

test('a click outside closes it BY DEFAULT', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  /*
   * Doc 08 §5.1's decision, in the direction it was decided. A popover does not
   * block the page the way a modal layer does, so clicking outside one is
   * clicking deliberately at something else — the person meant to reach the
   * thing they clicked.
   */
  await userEvent.click(document.body);
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

test('and not when isDismissable is off', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange, isDismissable: false });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  const panel = await screen.findByRole('dialog');

  await userEvent.click(document.body);

  /*
   * The prop doc 08 §5.1 chose over a rule: a popover holding something that
   * must not be lost keeps it. The panel is still there and nothing was told
   * to close.
   */
  expect(onOpenChange).not.toHaveBeenCalledWith(false);
  expect(panel).toBeTruthy();
});

test('and Escape still closes it when dismissal is off', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange, isDismissable: false });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  /*
   * Nothing in this library lets a layer swallow `Escape` except a component
   * holding a promise it was given (doc 09 §5.1). A popover that could not be
   * dismissed by a click AND could not be dismissed by the key would be a trap.
   */
  await userEvent.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

test('a footer button closes it through useDialog', async () => {
  const onOpenChange = vi.fn();

  function Apply() {
    const { close } = useDialog();
    return (
      <Button variant="primary" onPress={close}>
        Apply
      </Button>
    );
  }

  open({ onOpenChange, footer: <Apply /> });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  /*
   * The hook is shared with `Dialog` and `Drawer`, and this is the caller that
   * makes it earn its name: applying a filter is the ordinary case for a
   * consumer's own button closing a layer.
   */
  await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

test('it can be opened from outside as well', async () => {
  const onOpenChange = vi.fn();
  const { rerender } = render(
    <Popover
      title="Filter invoices"
      trigger={<Button>Filters</Button>}
      isOpen={false}
      onOpenChange={onOpenChange}
    >
      <TextField label="Reference" />
    </Popover>
  );

  expect(screen.queryByRole('dialog')).toBeNull();

  // Doc 02 §8: controlled, with the trigger as the shortcut.
  rerender(
    <Popover
      title="Filter invoices"
      trigger={<Button>Filters</Button>}
      isOpen
      onOpenChange={onOpenChange}
    >
      <TextField label="Reference" />
    </Popover>
  );

  expect(
    await screen.findByRole('dialog', { name: 'Filter invoices' })
  ).toBeTruthy();
});

test('the arrow is off by default and on by prop', async () => {
  const { unmount } = open();
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');

  /*
   * The opposite default from `Tooltip`, and for a reason worth asserting: on a
   * tooltip the arrow says which of five icon buttons the bubble belongs to,
   * and on a panel opened by a press there is nothing in doubt.
   */
  expect(document.querySelector('.bb-layer-arrow')).toBeNull();
  unmount();

  open({ hasArrow: true });
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await screen.findByRole('dialog');
  expect(document.querySelector('.bb-layer-arrow')).toBeTruthy();
});
