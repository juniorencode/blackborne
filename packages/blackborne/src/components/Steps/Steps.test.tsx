/*
 * What holds without a browser: the list, the marking, and the words a shape
 * cannot say.
 *
 * Not here: the connectors' length, the four states told apart in greyscale,
 * and the numbers the CSS counter renders — jsdom applies no stylesheet, so
 * generated content does not exist in it at all. Those are in
 * `apps/catalog/e2e/steps.spec.ts` and in the baselines.
 */
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ConfigProvider } from '../../config';
import { Step, Steps } from './Steps';

const Onboarding = (props: Partial<Parameters<typeof Steps>[0]> = {}) => (
  <ConfigProvider>
    <Steps label="Onboarding" {...props}>
      <Step status="completed">Details</Step>
      <Step status="active" description="Two documents">
        Documents
      </Step>
      <Step status="error">Review</Step>
      <Step>Signature</Step>
    </Steps>
  </ConfigProvider>
);

const items = () => screen.getAllByRole('listitem');

test('it is a named list of steps', () => {
  render(<Onboarding />);

  expect(screen.getByRole('list', { name: 'Onboarding' })).toBeDefined();
  expect(items()).toHaveLength(4);
});

test('nothing in it can be pressed', () => {
  render(<Onboarding />);

  /*
   * DECISION 0015 MADE AN ASSERTION. `Steps` reports; the half that navigates
   * is `Tabs` with disabled tabs. A button here would be a promise the
   * component cannot keep, and a disabled one would be doc 06 §4 rule 7 —
   * switched off with no way to know why.
   */
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  expect(screen.queryAllByRole('link')).toHaveLength(0);
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
});

test('the active step is marked as current, and only it', () => {
  render(<Onboarding />);

  const current = items().filter(
    item => item.getAttribute('aria-current') === 'step'
  );

  expect(current).toHaveLength(1);
  expect(current[0]?.textContent).toContain('Documents');
});

test('completed and error say their status in words', () => {
  render(<Onboarding />);

  /*
   * The indicator is `aria-hidden`, so a tick and a triangle announce nothing.
   * The word joins the title as visually hidden text — `Select`'s arrangement
   * for its required state, where the visible channel is the mark and the
   * announced one is a word.
   */
  expect(items()[0]?.textContent).toContain('completed');
  expect(items()[2]?.textContent).toContain('failed');
});

test('pending and active say nothing extra', () => {
  render(<Onboarding />);

  /*
   * Two and not four. `active` is `aria-current`, which the platform
   * announces; `pending` is the absence of the other three, and a reader
   * hearing it on five steps of seven would hear the word more often than the
   * useful part.
   */
  expect(items()[1]?.textContent).toBe('DocumentsTwo documents');
  expect(items()[3]?.textContent).toBe('Signature');
});

test('the indicator is out of the accessibility tree', () => {
  render(<Onboarding />);

  const indicators = document.querySelectorAll('.bb-step-indicator');
  expect(indicators).toHaveLength(4);
  for (const one of indicators)
    expect(one.getAttribute('aria-hidden')).toBe('true');
});

test('a step is pending unless it says otherwise', () => {
  render(
    <ConfigProvider>
      <Steps label="Onboarding">
        <Step>Only</Step>
      </Steps>
    </ConfigProvider>
  );

  expect(items()[0]?.getAttribute('data-status')).toBe('pending');
  expect(items()[0]?.hasAttribute('aria-current')).toBe(false);
});

test('the narrow structure is the floor, and the titles stay in the tree', () => {
  render(<Onboarding />);

  /*
   * jsdom has neither `ResizeObserver` nor container queries, so
   * `useContainerStep` answers `base` and the titles are hidden — the same
   * structure a first paint renders, which is doc 04 §4.1's narrow-first rule.
   *
   * And the titles are STILL READABLE, which is the half worth asserting: the
   * first version hid them with `display: none`, which would have left a list
   * of four items with no names in it. Nothing here is focusable, so out of
   * sight costs a reader nothing — but out of the TREE costs them everything.
   */
  expect(document.querySelector('.bb-steps')?.getAttribute('data-titles')).toBe(
    'hidden'
  );
  expect(screen.getByText('Details')).toBeDefined();
  expect(screen.getByText('Signature')).toBeDefined();
});

test('a label can be hidden and the list keeps its name', () => {
  render(<Onboarding isLabelHidden />);

  expect(screen.getByRole('list', { name: 'Onboarding' })).toBeDefined();
});

test('the class name lands on the outermost element only', () => {
  render(<Onboarding className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
