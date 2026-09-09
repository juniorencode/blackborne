/*
 * What holds without a browser: the elements, the marking of the current step,
 * the fact that the separator says nothing to a reader — and, since the trail
 * learned to fold, the whole of the collapsed structure.
 *
 * THE COLLAPSED STRUCTURE IS WHAT JSDOM SEES, and that is worth saying at the
 * top. `useContainerStep` reads a value a container query publishes, and jsdom
 * implements neither container queries nor `ResizeObserver`, so the step is
 * `base` and stays there — the floor, which doc 04 §6.2 explains is exactly
 * what a real browser's first paint renders. A trail with a middle to fold
 * therefore folds it here, and the full trail at a wider step is measured in
 * `apps/catalog/e2e/breadcrumbs.spec.ts`.
 *
 * Not here either: which separators are VISIBLE. The first step's is dropped
 * by a CSS rule keyed on `:first-child`, and jsdom applies no stylesheet.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Breadcrumb } from './Breadcrumb';
import { Breadcrumbs } from './Breadcrumbs';

/** Three steps: nothing to fold, so this is the trail at any width. */
const Trail = () => (
  <Breadcrumbs>
    <Breadcrumb href="/customers">Customers</Breadcrumb>
    <Breadcrumb href="/customers/4821">Astilleros del Sur</Breadcrumb>
    <Breadcrumb>Invoices</Breadcrumb>
  </Breadcrumbs>
);

/** Five steps: three in the middle, so the narrow structure folds them. */
const LongTrail = () => (
  <Breadcrumbs>
    <Breadcrumb href="/customers">Customers</Breadcrumb>
    <Breadcrumb href="/customers/4821">Astilleros del Sur</Breadcrumb>
    <Breadcrumb href="/customers/4821/invoices">Invoices</Breadcrumb>
    <Breadcrumb>Drafts</Breadcrumb>
    <Breadcrumb>INV-4821</Breadcrumb>
  </Breadcrumbs>
);

test('it is an ordered list of steps', () => {
  const { container } = render(<Trail />);

  const list = container.querySelector('ol');
  expect(list).not.toBeNull();
  expect(list?.querySelectorAll(':scope > li')).toHaveLength(3);
});

/*
 * The base labels the list from its own localised strings, which is why this
 * library adds no string of its own for it (doc 05 §2.3). Asserted as
 * "present and not empty" rather than by its text: the words are the base's
 * and would change with the locale.
 */
test('the list is named', () => {
  const { container } = render(<Trail />);

  const label = container.querySelector('ol')?.getAttribute('aria-label');
  expect(label).not.toBeNull();
  expect(label).not.toBe('');
});

test('the last step is marked as the page you are on, and only the last', () => {
  render(<Trail />);

  const current = screen.getByText('Invoices');
  expect(current.getAttribute('aria-current')).toBe('page');

  expect(
    screen.getByRole('link', { name: 'Customers' }).getAttribute('aria-current')
  ).toBeNull();
});

test('the steps before it are links, with their addresses', () => {
  render(<Trail />);

  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(2);
  expect(links[0]?.getAttribute('href')).toBe('/customers');
  expect(links[1]?.getAttribute('href')).toBe('/customers/4821');
});

/*
 * A step in the middle can be text too — a grouping with no page of its own —
 * and it must not be mistaken for the current one.
 */
test('a step with no address is text, and is not the current page', () => {
  render(
    <Breadcrumbs>
      <Breadcrumb href="/customers">Customers</Breadcrumb>
      <Breadcrumb>Archived</Breadcrumb>
      <Breadcrumb>Astilleros del Sur</Breadcrumb>
    </Breadcrumbs>
  );

  expect(screen.getByText('Archived').getAttribute('aria-current')).toBeNull();
  expect(
    screen.getByText('Astilleros del Sur').getAttribute('aria-current')
  ).toBe('page');
});

/*
 * The separator is decoration. If it ever reached the accessibility tree, a
 * trail of four steps would be read as seven things, three of which are a
 * shape.
 */
test('the separator says nothing to a reader', () => {
  const { container } = render(<Trail />);

  const glyphs = container.querySelectorAll('svg');
  expect(glyphs).toHaveLength(3);
  for (const glyph of glyphs) {
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
  }

  // And the trail reads as its words, with nothing between them.
  expect(container.querySelector('ol')?.textContent).toBe(
    'CustomersAstilleros del SurInvoices'
  );
});

test('className and the ref reach the outermost element', () => {
  const trail = createRef<HTMLDivElement>();

  const { container } = render(
    <Breadcrumbs ref={trail} className="placed-by-the-consumer">
      <Breadcrumb>Only</Breadcrumb>
    </Breadcrumbs>
  );

  /*
   * The root is the container the query asks about, not the list: a trail is
   * sized by its contents, and inline-size containment computes a width as
   * though it had none (doc 04 §4.3). So the ref is a div holding the `<ol>`,
   * which is a breaking change and is in the changelog as one.
   */
  expect(trail.current?.tagName).toBe('DIV');
  expect(trail.current?.className).toContain('placed-by-the-consumer');
  expect(trail.current?.querySelector('ol')).toBe(
    container.querySelector('ol')
  );
});

test('a trail of one is the page you are on', () => {
  render(
    <Breadcrumbs>
      <Breadcrumb>Customers</Breadcrumb>
    </Breadcrumbs>
  );

  expect(screen.getByText('Customers').getAttribute('aria-current')).toBe(
    'page'
  );
  expect(screen.queryAllByRole('link')).toHaveLength(0);
});

test('no steps renders nothing', () => {
  const { container } = render(<Breadcrumbs>{null}</Breadcrumbs>);

  expect(container.textContent).toBe('');
});

/* ------------------------------------------------------------------ *
 * The collapsed structure, which is the one jsdom sees.
 * ------------------------------------------------------------------ */

test('a narrow container keeps the way home, a "…", and where you are', () => {
  const { container } = render(<LongTrail />);

  expect(container.querySelectorAll('ol > li')).toHaveLength(3);
  expect(screen.getByRole('link', { name: 'Customers' })).toBeDefined();
  expect(screen.getByText('INV-4821').getAttribute('aria-current')).toBe(
    'page'
  );

  // The three in between are not in the row.
  expect(screen.queryByText('Astilleros del Sur')).toBeNull();
  expect(screen.queryByText('Drafts')).toBeNull();
});

/*
 * The name is the whole point of the control: the ellipsis is visible and says
 * nothing, so what a reader gets is the dictionary's word — hard rule 3, and
 * the same division a required field's asterisk has.
 */
test('the "…" is named from the dictionary', () => {
  render(<LongTrail />);

  const more = screen.getByRole('button', { name: 'More steps' });
  expect(more.textContent).toBe('…');
});

test('and it holds the middle, as addresses', async () => {
  const user = userEvent.setup();
  render(<LongTrail />);

  await user.click(screen.getByRole('button', { name: 'More steps' }));

  const rows = screen.getAllByRole('menuitem');
  expect(rows.map(row => row.textContent)).toEqual([
    'Astilleros del Sur',
    'Invoices',
    'Drafts'
  ]);

  /*
   * LINKS, not commands, and that is the reason `MenuItem` grew an `href`:
   * a row that navigated by calling a function would be a button wearing a
   * link's clothes, and nothing a browser does with an address would survive
   * it — no middle-click, no "copy link address", and none of it failing
   * loudly. Doc 02 §7.1, inside a menu.
   */
  expect(rows[0]?.getAttribute('href')).toBe('/customers/4821');
  expect(rows[1]?.getAttribute('href')).toBe('/customers/4821/invoices');
});

test('a folded step with no address is present and cannot be pressed', async () => {
  const user = userEvent.setup();
  render(<LongTrail />);

  await user.click(screen.getByRole('button', { name: 'More steps' }));

  /*
   * "Drafts" is a grouping with no page of its own. It was text in the row and
   * folding it cannot turn it into somewhere to go, so it appears dimmed —
   * which is what `MenuItem`'s third shape exists to make unrepresentable any
   * other way.
   */
  const drafts = screen.getByRole('menuitem', { name: 'Drafts' });
  expect(drafts.getAttribute('aria-disabled')).toBe('true');
  expect(drafts.getAttribute('href')).toBeNull();
});

test('the "…" never hides a single step', () => {
  render(<Trail />);

  // Three steps, one in the middle: folding it would replace something you can
  // read with something you have to open.
  expect(screen.queryByRole('button', { name: 'More steps' })).toBeNull();
  expect(screen.getByText('Astilleros del Sur')).toBeDefined();
});

test('a child that is not a Breadcrumb is reported in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <Breadcrumbs>
      <Breadcrumb href="/customers">Customers</Breadcrumb>
      <li>Not a step.</li>
    </Breadcrumbs>
  );

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('Breadcrumb');
  expect(screen.queryByText('Not a step.')).toBeNull();

  warn.mockRestore();
});

test('it needs no provider', () => {
  render(<LongTrail />);

  expect(screen.getByRole('button', { name: 'More steps' })).toBeDefined();
});
