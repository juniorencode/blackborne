/*
 * What holds without a browser: the list of buttons, the absence of a role
 * over the top of them, and where the set reaches.
 *
 * NOT HERE: whether the appearance actually arrives. A group's whole job is a
 * size and a variant, and both are CSS — jsdom resolves no variables and lays
 * nothing out, so a test here could only assert class names, which proves
 * nothing about appearance and turns a refactor into a wall of false failures.
 * The heights and the seam are measured in `apps/catalog/e2e/button-group.spec.ts`.
 *
 * What IS asserted here is the wiring underneath it, through a probe that
 * reads the context and renders what it found as text. That is a mechanism
 * test on purpose: the mechanism is a context crossing a portal, and the one
 * question a browser cannot answer more cheaply is which value a subtree sees.
 */
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Button } from '../Button';
import { ButtonGroup } from './ButtonGroup';
import { ConfigProvider } from '../../config';
import { Popover } from '../Popover';
import { useButtonSet } from '../../internal/buttonAppearance';

/** Reports the set it is standing in. */
function Probe({ name }: { name: string }) {
  const { variant, size } = useButtonSet();
  return <span data-testid={name}>{`${variant}/${size}`}</span>;
}

const Row = (props: Partial<React.ComponentProps<typeof ButtonGroup>> = {}) => (
  <ButtonGroup {...props}>
    <Button>Day</Button>
    <Button>Week</Button>
    <Button>Month</Button>
  </ButtonGroup>
);

test('it is the buttons and nothing over the top of them', () => {
  render(<Row />);

  /*
   * NO ROLE AND NO NAME, which is a decision rather than an omission: three
   * buttons in a row are three buttons, every one already named, and a
   * `role="group"` would add something to announce and nothing to do with it.
   * The same argument `SplitButton` and `Pagination` settled (doc 06 §2).
   */
  expect(screen.queryByRole('group')).toBeNull();
  expect(screen.getAllByRole('button').map(one => one.textContent)).toEqual([
    'Day',
    'Week',
    'Month'
  ]);
});

test('the appearance travels to every member', () => {
  render(
    <ButtonGroup variant="primary" size="lg">
      <Probe name="first" />
      <Probe name="second" />
    </ButtonGroup>
  );

  expect(screen.getByTestId('first').textContent).toBe('primary/lg');
  expect(screen.getByTestId('second').textContent).toBe('primary/lg');
});

test('and it reaches a component the consumer wrote', () => {
  /*
   * THE REASON THIS IS A CONTEXT AND NOT A CLONE. Cloning the children would
   * put the props on THIS element, and nothing about it says button — the
   * constraint decision 0018 records for the sets that do read their children.
   * A context does not care what the element is.
   */
  const Mine = () => (
    <div>
      <Probe name="theirs" />
    </div>
  );

  render(
    <ButtonGroup size="sm">
      <Mine />
    </ButtonGroup>
  );

  expect(screen.getByTestId('theirs').textContent).toBe('secondary/sm');
});

test('a button outside a group sees the library defaults', () => {
  render(<Probe name="loose" />);

  /*
   * No null and no third state: the context's own default IS the default the
   * destructuring used to carry, so a button outside a group reads the same
   * answer it always had.
   */
  expect(screen.getByTestId('loose').textContent).toBe('secondary/md');
});

test('the set stops at a layer', () => {
  render(
    <ConfigProvider>
      <ButtonGroup variant="primary" size="sm">
        <Popover
          title="Filters"
          trigger={<Button>Filter</Button>}
          defaultOpen
          footer={<Probe name="footer" />}
        >
          <Probe name="body" />
        </Popover>
      </ButtonGroup>
    </ConfigProvider>
  );

  /*
   * A REACT CONTEXT CROSSES A PORTAL, so this popover is inside the group as
   * far as React is concerned and its content would otherwise be small
   * primaries. Every layer that can hold a button closes the set around its
   * content — one call site for four of them, because they share the sheet.
   *
   * `Button` is the only member type this can happen to, which is why the
   * problem arrives with `ButtonGroup` and not with `RadioGroup`: a radio
   * inside a dialog inside a radio group is not a thing.
   */
  expect(screen.getByTestId('body').textContent).toBe('secondary/md');
  expect(screen.getByTestId('footer').textContent).toBe('secondary/md');
});

test('a member keeps whatever it says about itself', () => {
  /*
   * The visible half of this is measured in a browser. What is asserted here
   * is that the button still receives its own prop at all — the set is a
   * default, and a group of secondaries with one primary in it is a thing
   * somebody will write.
   */
  render(
    <ButtonGroup size="sm">
      <Button variant="primary" size="lg">
        Publish
      </Button>
    </ButtonGroup>
  );

  expect(screen.getByRole('button', { name: 'Publish' })).toBeDefined();
});

test('the class name lands on the outermost element only', () => {
  render(<Row className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
  expect(document.querySelector('.placed')?.classList).toContain(
    'bb-button-group'
  );
});

test('a group of one is still a group', () => {
  render(
    <ButtonGroup>
      <Button>Only</Button>
    </ButtonGroup>
  );

  expect(document.querySelectorAll('.bb-button-group > *')).toHaveLength(1);
});
