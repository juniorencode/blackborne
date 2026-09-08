/*
 * What can be asserted without a browser, and nothing that belongs to the
 * base.
 *
 * `aria-expanded`, `aria-controls`, the toggle on Enter and Space, the arrow
 * keys: all of that is React Aria's and testing it here would be testing a
 * dependency (doc 10 §4). What IS asserted is the layer this file adds — the
 * heading that appears only inside a group, the string keys that leave our
 * side of the API, and the two promises the doc comments make about a closed
 * panel.
 *
 * Deliberately absent: any assertion about a class name. The animation, the
 * chevron turning over and the collapsed panel measuring exactly zero are all
 * in `apps/catalog/e2e/accordion.spec.ts`, because none of them exists in
 * jsdom — it has no layout and resolves no variables.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Accordion, Collapsible } from './Accordion';

const HEADING_LEVELS = [2, 3, 4, 5, 6] as const;

test('a section on its own shows its title and its content', () => {
  render(
    <Collapsible title="Advanced" defaultExpanded>
      <p>Everything nobody needs on the first pass.</p>
    </Collapsible>
  );

  expect(screen.getByRole('button', { name: 'Advanced' })).toBeDefined();
  expect(
    screen.getByText('Everything nobody needs on the first pass.')
  ).toBeDefined();
});

/*
 * Doc 06 §2.1 case 2. The disclosure pattern asks for no heading, so a lone
 * section renders none — and the level is not a prop it can be given.
 */
test('a section on its own renders no heading at all', () => {
  const { container } = render(
    <Collapsible title="Advanced">
      <p>Content</p>
    </Collapsible>
  );

  expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
});

/*
 * Doc 06 §2.1 case 3, and the reason `headingLevel` is required: inside a
 * group the header IS a heading, at the level the page says.
 */
test.each(HEADING_LEVELS)('a group renders its headers at level %i', level => {
  const { container } = render(
    <Accordion headingLevel={level}>
      <Collapsible title="Billing">
        <p>Content</p>
      </Collapsible>
    </Accordion>
  );

  const heading = screen.getByRole('heading', { name: 'Billing', level });
  expect(heading).toBeDefined();
  // The trigger is INSIDE the heading, which is what the pattern asks for —
  // a heading beside the button would name nothing.
  expect(heading.querySelector('button')).not.toBeNull();
  expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1);
});

/*
 * The chevron is decoration and must not reach the name. If it ever gained a
 * label, every header in a management screen would be announced as "Billing,
 * chevron" — and the accessible name is what somebody navigating by headings
 * hears.
 */
test('the chevron adds nothing to the accessible name', () => {
  render(
    <Accordion headingLevel={3}>
      <Collapsible title="Tax codes">
        <p>Content</p>
      </Collapsible>
    </Accordion>
  );

  const trigger = screen.getByRole('button');
  expect(trigger.textContent).toBe('Tax codes');
  expect(trigger.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
    'true'
  );
});

/*
 * The two claims the component's doc comment makes about a closed panel, both
 * worth a test because a consumer plans around them: something expensive
 * inside a closed section still costs, and find-in-page still finds it.
 */
test('a closed panel keeps its content in the page, hidden until found', () => {
  const { container } = render(
    <Collapsible title="Advanced">
      <p>A sentence somebody might search for.</p>
    </Collapsible>
  );

  expect(
    screen.getByText('A sentence somebody might search for.')
  ).toBeDefined();

  const panel = container.querySelector('[role="group"]');
  expect(panel).not.toBeNull();
  // `until-found` and not the bare attribute: the bare one cannot be revealed
  // by a browser's find-in-page, and the difference is one string.
  expect(panel?.getAttribute('hidden')).toBe('until-found');
});

test('pressing the header opens the section', async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn();

  render(
    <Collapsible title="Advanced" onExpandedChange={onExpandedChange}>
      <p>Content</p>
    </Collapsible>
  );

  await user.click(screen.getByRole('button', { name: 'Advanced' }));

  expect(onExpandedChange).toHaveBeenCalledWith(true);
});

/*
 * One at a time is what this component documents as its default, so it is
 * asserted here rather than left to the base. A change of default in a
 * dependency would otherwise change our documented behaviour silently.
 */
test('one section at a time, unless told otherwise', async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn<(keys: Set<string>) => void>();

  render(
    <Accordion headingLevel={3} onExpandedChange={onExpandedChange}>
      <Collapsible id="billing" title="Billing">
        <p>One</p>
      </Collapsible>
      <Collapsible id="tax" title="Tax">
        <p>Two</p>
      </Collapsible>
    </Accordion>
  );

  await user.click(screen.getByRole('button', { name: 'Billing' }));
  await user.click(screen.getByRole('button', { name: 'Tax' }));

  const last = onExpandedChange.mock.calls.at(-1)?.[0];
  expect(last).toEqual(new Set(['tax']));
});

test('more than one at a time when asked', async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn<(keys: Set<string>) => void>();

  render(
    <Accordion
      headingLevel={3}
      allowsMultipleExpanded
      onExpandedChange={onExpandedChange}
    >
      <Collapsible id="billing" title="Billing">
        <p>One</p>
      </Collapsible>
      <Collapsible id="tax" title="Tax">
        <p>Two</p>
      </Collapsible>
    </Accordion>
  );

  await user.click(screen.getByRole('button', { name: 'Billing' }));
  await user.click(screen.getByRole('button', { name: 'Tax' }));

  const last = onExpandedChange.mock.calls.at(-1)?.[0];
  expect(last).toEqual(new Set(['billing', 'tax']));
});

/*
 * The keys that leave this API are strings, not the base's `string | number`.
 * Doc 08 §7.1's rule about the base's types staying out of a consumer's
 * signatures, and this is the test that the mapping actually happens rather
 * than being a cast that compiles.
 */
test('the keys handed back are strings', async () => {
  const user = userEvent.setup();
  const seen: unknown[] = [];

  render(
    <Accordion
      headingLevel={3}
      onExpandedChange={keys => {
        seen.push(...keys);
      }}
    >
      <Collapsible id="billing" title="Billing">
        <p>One</p>
      </Collapsible>
    </Accordion>
  );

  await user.click(screen.getByRole('button', { name: 'Billing' }));

  expect(seen).toHaveLength(1);
  expect(typeof seen[0]).toBe('string');
});

test('a named section can start open', () => {
  render(
    <Accordion headingLevel={3} defaultExpandedKeys={['tax']}>
      <Collapsible id="billing" title="Billing">
        <p>One</p>
      </Collapsible>
      <Collapsible id="tax" title="Tax">
        <p>Two</p>
      </Collapsible>
    </Accordion>
  );

  const [billing, tax] = screen.getAllByRole('button');
  expect(billing?.getAttribute('aria-expanded')).toBe('false');
  expect(tax?.getAttribute('aria-expanded')).toBe('true');
});

/*
 * Documented as inherited, so asserted: a consumer switching a whole group off
 * should not have to also switch off every section in it.
 */
test('a disabled group disables every section in it', () => {
  render(
    <Accordion headingLevel={3} isDisabled>
      <Collapsible title="Billing">
        <p>One</p>
      </Collapsible>
      <Collapsible title="Tax">
        <p>Two</p>
      </Collapsible>
    </Accordion>
  );

  for (const trigger of screen.getAllByRole('button')) {
    expect(trigger.getAttribute('disabled')).not.toBeNull();
  }
});

test('className and the ref reach the outermost element and nothing else', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(
    <Collapsible ref={ref} className="placed-by-the-consumer" title="Advanced">
      <p>Content</p>
    </Collapsible>
  );

  const root = container.firstElementChild;
  expect(ref.current).toBe(root);
  expect(root?.className).toContain('placed-by-the-consumer');
  expect(container.querySelectorAll('.placed-by-the-consumer')).toHaveLength(1);
});
