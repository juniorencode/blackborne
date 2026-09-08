/*
 * What holds without a browser: the elements, the marking of the current step,
 * and the fact that the separator says nothing to a reader.
 *
 * Not here: which separators are VISIBLE. The first step's is dropped by a CSS
 * rule keyed on `:first-child`, and jsdom applies no stylesheet — so every
 * separator exists in the DOM here and the count is measured in
 * `apps/catalog/e2e/breadcrumbs.spec.ts`, along with which way each one points.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Link } from '../Link';
import { Breadcrumb, Breadcrumbs } from './Breadcrumbs';

const Trail = () => (
  <Breadcrumbs>
    <Breadcrumb>
      <Link href="/customers">Customers</Link>
    </Breadcrumb>
    <Breadcrumb>
      <Link href="/customers/4821">Astilleros del Sur</Link>
    </Breadcrumb>
    <Breadcrumb>Invoices</Breadcrumb>
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
      <Breadcrumb>
        <Link href="/customers">Customers</Link>
      </Breadcrumb>
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

test('className and the ref reach the outermost element of each', () => {
  const trail = createRef<HTMLOListElement>();
  const step = createRef<HTMLLIElement>();

  const { container } = render(
    <Breadcrumbs ref={trail} className="placed-by-the-consumer">
      <Breadcrumb ref={step} className="one-step">
        Only
      </Breadcrumb>
    </Breadcrumbs>
  );

  /*
   * `querySelector('ol')` and not `firstElementChild`: a collection component
   * renders a `<template>` beside its list — the base's collection builder
   * keeps the described content in it — so the first element in the container
   * is not the component's root.
   */
  expect(trail.current).toBe(container.querySelector('ol'));
  expect(trail.current?.className).toContain('placed-by-the-consumer');
  expect(step.current?.tagName).toBe('LI');
  expect(step.current?.className).toContain('one-step');
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
