/*
 * Which steps survive a narrow container, decided without rendering anything.
 *
 * This is where the collapse actually lives: given a list and one boolean, it
 * says what is drawn and what is folded away. P6 asks for exactly this, and it
 * is also the only way to test the rule that matters — a "…" must never hide a
 * single step — without a browser wide enough to have two structures.
 */
import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { Breadcrumb } from './Breadcrumb';
import { readCrumbs, trailShape } from './readCrumbs';

const crumb = (props: { href?: string; children: string }) =>
  createElement(Breadcrumb, { key: props.children, ...props });

const trail = (...labels: string[]) =>
  readCrumbs(
    labels.map((label, index) =>
      crumb(
        index === labels.length - 1
          ? { children: label }
          : { href: `/${label.toLowerCase()}`, children: label }
      )
    )
  ).crumbs;

describe('readCrumbs', () => {
  test('reads the steps in the order they were written', () => {
    const { crumbs, strays } = readCrumbs([
      crumb({ href: '/customers', children: 'Customers' }),
      crumb({ children: 'Astilleros del Sur' })
    ]);

    expect(crumbs.map(step => step.children)).toEqual([
      'Customers',
      'Astilleros del Sur'
    ]);
    expect(crumbs.map(step => step.href)).toEqual(['/customers', undefined]);
    expect(strays).toBe(0);
  });

  /*
   * The key is DERIVED, and no consumer writes one. A trail has no selection,
   * so there is nothing for an id to name — unlike a tab, where `selectedKey`
   * names one and the id is part of the API.
   */
  test('the key comes from the address, or from the position without one', () => {
    const { crumbs } = readCrumbs([
      crumb({ href: '/customers', children: 'Customers' }),
      crumb({ children: 'Archived' }),
      crumb({ children: 'Astilleros del Sur' })
    ]);

    expect(crumbs.map(step => step.id)).toEqual([
      '/customers',
      'step-1',
      'step-2'
    ]);
  });

  test('anything that is not a Breadcrumb is counted rather than swallowed', () => {
    const { crumbs, strays } = readCrumbs([
      crumb({ href: '/customers', children: 'Customers' }),
      createElement('li', { key: 'stray' }, 'not a step')
    ]);

    expect(crumbs).toHaveLength(1);
    expect(strays).toBe(1);
  });
});

describe('trailShape', () => {
  test('a wide container keeps every step', () => {
    const crumbs = trail('Customers', 'Astilleros', 'Invoices', 'INV-4821');
    const { shown, folded } = trailShape(crumbs, false);

    expect(shown).toEqual(crumbs);
    expect(folded).toEqual([]);
  });

  test('a narrow one keeps the way home and where you are', () => {
    const crumbs = trail('Customers', 'Astilleros', 'Invoices', 'INV-4821');
    const { shown, folded } = trailShape(crumbs, true);

    // The `null` is where the "…" goes.
    expect(shown.map(step => step?.children ?? '…')).toEqual([
      'Customers',
      '…',
      'INV-4821'
    ]);
    expect(folded.map(step => step.children)).toEqual([
      'Astilleros',
      'Invoices'
    ]);
  });

  /*
   * THE RULE THAT MATTERS, and the reason this is a function rather than a
   * ternary in a render: folding one step replaces something you can read with
   * something you have to open. `Pagination` reached the same rule from the
   * other direction — a gap never hides one page — so the library now applies
   * one rule twice instead of two rules that happen to agree.
   */
  test('the ellipsis never hides a single step', () => {
    const three = trail('Customers', 'Astilleros', 'Invoices');
    const { shown, folded } = trailShape(three, true);

    expect(shown).toEqual(three);
    expect(folded).toEqual([]);
  });

  test('and there is nothing to fold in a trail of two, or of one', () => {
    for (const labels of [['Customers', 'Astilleros'], ['Customers']]) {
      const crumbs = trail(...labels);
      expect(trailShape(crumbs, true)).toEqual({ shown: crumbs, folded: [] });
    }
  });

  test('a long trail folds everything between the ends', () => {
    const crumbs = trail('A', 'B', 'C', 'D', 'E', 'F');
    const { shown, folded } = trailShape(crumbs, true);

    expect(shown).toHaveLength(3);
    expect(folded.map(step => step.children)).toEqual(['B', 'C', 'D', 'E']);
  });

  test('no steps at all is not an error', () => {
    expect(trailShape([], true)).toEqual({ shown: [], folded: [] });
  });
});
