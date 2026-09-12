/*
 * The actions a row carries, and the one thing this component decides: how
 * many of them are too many for the room there is.
 *
 * The step is provided directly rather than measured, because measuring it
 * needs a container query and a `ResizeObserver` and jsdom has neither — which
 * is the point of doc 04 §6.2's design: the fold is a pure function of a step
 * and a count, and the step comes from CSS. What a browser has to answer is
 * whether the step is right, and that is the visual suite's and the browser
 * checks'.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { RowAction, RowActions, TableStep } from './RowActions';
import type { ContainerStep } from '../../internal/useContainerStep';

afterEach(() => {
  vi.restoreAllMocks();
});

const Dot = () => <svg data-testid="glyph" />;

const at = (step: ContainerStep, children: React.ReactNode) =>
  render(
    <TableStep.Provider value={step}>
      <RowActions label="Invoice A-001">{children}</RowActions>
    </TableStep.Provider>
  );

const THREE = (
  <>
    <RowAction icon={<Dot />} label="Edit" onAction={() => undefined} />
    <RowAction icon={<Dot />} label="Duplicate" onAction={() => undefined} />
    <RowAction
      icon={<Dot />}
      label="Delete"
      onAction={() => undefined}
      tone="danger"
    />
  </>
);

test('with room, every action is a button named by its label', () => {
  at('wide', THREE);

  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Duplicate' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
});

test('and pressing one calls what it was given', async () => {
  const onAction = vi.fn();
  render(
    <TableStep.Provider value="wide">
      <RowActions label="Invoice A-001">
        <RowAction icon={<Dot />} label="Edit" onAction={onAction} />
      </RowActions>
    </TableStep.Provider>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

  expect(onAction).toHaveBeenCalledTimes(1);
});

/*
 * DOC 04 §11.2, ARRIVING FOR THE FOURTH TIME. "The '…' never hides one step",
 * because folding a single thing replaces something you can read with
 * something you have to open. `Pagination` reached it from the other
 * direction — a gap never hides one page — and the collapsed breadcrumb trail
 * from a third. It needed no new argument here.
 */
test('one action never folds, however narrow it gets', () => {
  at(
    'base',
    <RowAction icon={<Dot />} label="Edit" onAction={() => undefined} />
  );

  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Invoice A-001' })).toBeNull();
});

test('three fold below medium, and not at it', () => {
  const { unmount } = at('narrow', THREE);
  expect(screen.getByRole('button', { name: 'Invoice A-001' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  unmount();

  at('medium', THREE);
  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
});

test('and four fold below wide, because more buttons need more room', () => {
  const four = (
    <>
      {THREE}
      <RowAction icon={<Dot />} label="Archive" onAction={() => undefined} />
    </>
  );

  const { unmount } = at('medium', four);
  expect(screen.getByRole('button', { name: 'Invoice A-001' })).toBeTruthy();
  unmount();

  at('wide', four);
  expect(screen.getByRole('button', { name: 'Archive' })).toBeTruthy();
});

/*
 * THE TRIGGER IS NAMED BY THE ROW. A table of forty rows with forty buttons
 * all called "More" is a list of forty identical things, which is why the
 * label is required rather than defaulted.
 */
test('the folded trigger is named by the row it belongs to', () => {
  at('base', THREE);

  expect(screen.getByRole('button', { name: 'Invoice A-001' })).toBeTruthy();
});

test('and the menu holds every action, with the danger one marked', async () => {
  at('base', THREE);

  await userEvent.click(screen.getByRole('button', { name: 'Invoice A-001' }));

  expect(await screen.findByRole('menuitem', { name: /Edit/ })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: /Duplicate/ })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeTruthy();
});

test('choosing one from the menu calls what it was given', async () => {
  const onAction = vi.fn();
  render(
    <TableStep.Provider value="base">
      <RowActions label="Invoice A-001">
        <RowAction icon={<Dot />} label="Edit" onAction={onAction} />
        <RowAction icon={<Dot />} label="Delete" onAction={() => undefined} />
      </RowActions>
    </TableStep.Provider>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Invoice A-001' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/ }));

  expect(onAction).toHaveBeenCalledTimes(1);
});

/*
 * DECISION 0018'S COST, SAID OUT LOUD. A component of your own that returns a
 * `RowAction` is not one — the element in the tree is yours and nothing about
 * it says row action — and the failure is silent: the action is simply absent.
 * Asserted in both directions, because a warning that cannot stay quiet is not
 * a warning.
 */
test('a child it could not read is counted and said once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const Mine = () => (
    <RowAction icon={<Dot />} label="Edit" onAction={() => undefined} />
  );

  at(
    'wide',
    <>
      <RowAction icon={<Dot />} label="Keep" onAction={() => undefined} />
      <Mine />
    </>
  );

  expect(screen.getByRole('button', { name: 'Keep' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('could not read');
});

test('and a set it could read entirely says nothing', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  at('wide', THREE);

  expect(warn).not.toHaveBeenCalled();
});

/* An array from `.map()` is the shareable form, and it has to keep working. */
test('actions from an array are read', () => {
  at(
    'wide',
    ['Edit', 'Delete'].map(label => (
      <RowAction
        icon={<Dot />}
        key={label}
        label={label}
        onAction={() => undefined}
      />
    ))
  );

  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
});

test('a disabled action is offered and refused', () => {
  at(
    'wide',
    <>
      <RowAction icon={<Dot />} label="Edit" onAction={() => undefined} />
      <RowAction
        icon={<Dot />}
        isDisabled
        label="Delete"
        onAction={() => undefined}
      />
    </>
  );

  expect(
    screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
  ).toBe(true);
});
