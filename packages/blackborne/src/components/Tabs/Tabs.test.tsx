/*
 * WHAT THESE TESTS SEE IS THE NARROW STRUCTURE, and that is worth saying at
 * the top rather than discovering halfway down the file.
 *
 * `useContainerStep` reads a value a container query publishes, and jsdom
 * implements neither container queries nor `ResizeObserver` — so the answer is
 * `base` and stays there. Doc 04 §6.2 calls that the hook's floor and says why
 * it is not a gap to be patched with a fake: it is exactly what a real
 * browser's first paint renders. So everything below is the select, and the
 * row of tabs is measured in `apps/catalog/e2e/tabs.spec.ts`, where a
 * container can have a width.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Tab } from './Tab';
import { Tabs } from './Tabs';

const Invoice = (props: Partial<Parameters<typeof Tabs>[0]> = {}) => (
  <Tabs label="Invoice" {...props}>
    <Tab id="lines" title="Lines">
      <p>Three line items.</p>
    </Tab>
    <Tab id="tax" title="Tax">
      <p>Eighteen per cent.</p>
    </Tab>
    <Tab id="history" title="History" isDisabled>
      <p>Nothing yet.</p>
    </Tab>
  </Tabs>
);

test('with no width to measure, the structure is a select and not a tab list', () => {
  render(<Invoice />);

  // The floor, asserted rather than assumed: there is no tablist here at all.
  expect(screen.queryAllByRole('tablist')).toHaveLength(0);
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  expect(screen.getByRole('button', { name: /Invoice/ })).toBeDefined();
});

test('the first tab is open, and only its content is rendered', () => {
  render(<Invoice />);

  expect(screen.getByText('Three line items.')).toBeDefined();
  expect(screen.queryByText('Eighteen per cent.')).toBeNull();
});

test('the uncontrolled shortcut opens the tab it names', () => {
  render(<Invoice defaultSelectedKey="tax" />);

  expect(screen.getByText('Eighteen per cent.')).toBeDefined();
  expect(screen.queryByText('Three line items.')).toBeNull();
});

test('choosing another one swaps the content and reports the id', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn<(key: string) => void>();

  render(<Invoice onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button', { name: /Invoice/ }));
  await user.click(screen.getByRole('option', { name: 'Tax' }));

  expect(onSelectionChange).toHaveBeenCalledWith('tax');
  expect(typeof onSelectionChange.mock.calls[0]?.[0]).toBe('string');
  expect(screen.getByText('Eighteen per cent.')).toBeDefined();
});

test('controlled, it moves only when the consumer moves it', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();

  render(<Invoice selectedKey="lines" onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button', { name: /Invoice/ }));
  await user.click(screen.getByRole('option', { name: 'Tax' }));

  // Reported, and not acted on: the value is the consumer's to change.
  expect(onSelectionChange).toHaveBeenCalledWith('tax');
  expect(screen.getByText('Three line items.')).toBeDefined();
});

test('a disabled tab cannot be opened', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();

  render(<Invoice onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button', { name: /Invoice/ }));
  await user.click(screen.getByRole('option', { name: 'History' }));

  expect(onSelectionChange).not.toHaveBeenCalled();
  expect(screen.getByText('Three line items.')).toBeDefined();
});

/*
 * The two edges a consumer's own state produces, and the second one is the
 * reason the first is not enough: a screen that removes a tab while it is open
 * would otherwise show a component with a control and no content.
 */
test('a key naming no tab falls back to the first rather than to nothing', () => {
  render(<Invoice selectedKey="gone" />);

  expect(screen.getByText('Three line items.')).toBeDefined();
});

test('a disabled first tab is not the one that opens', () => {
  render(
    <Tabs label="Invoice">
      <Tab id="history" title="History" isDisabled>
        <p>Nothing yet.</p>
      </Tab>
      <Tab id="lines" title="Lines">
        <p>Three line items.</p>
      </Tab>
    </Tabs>
  );

  expect(screen.getByText('Three line items.')).toBeDefined();
  expect(screen.queryByText('Nothing yet.')).toBeNull();
});

test('no tabs renders nothing', () => {
  const { container } = render(<Tabs label="Invoice">{null}</Tabs>);

  expect(container.textContent).toBe('');
});

/*
 * A `Tab` is READ rather than rendered, so a child that is not one is dropped
 * — and a component that drops what it was given has to say so. The warning is
 * the thing being tested here, not the dropping.
 */
test('a child that is not a Tab is reported in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <Tabs label="Invoice">
      <Tab id="lines" title="Lines">
        <p>Three line items.</p>
      </Tab>
      <div>Not a tab.</div>
    </Tabs>
  );

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('Tab');
  expect(screen.queryByText('Not a tab.')).toBeNull();

  warn.mockRestore();
});

test('and a conditional tab that is switched off is not reported', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const isAdmin = false;

  render(
    <Tabs label="Invoice">
      <Tab id="lines" title="Lines">
        <p>Three line items.</p>
      </Tab>
      {isAdmin ? (
        <Tab id="audit" title="Audit">
          <p>Who changed what.</p>
        </Tab>
      ) : null}
    </Tabs>
  );

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test('it needs no provider', () => {
  render(<Invoice />);

  expect(screen.getByRole('button', { name: /Invoice/ })).toBeDefined();
});
