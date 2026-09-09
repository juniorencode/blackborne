/*
 * The declarations, read without rendering anything.
 *
 * This is the half of `Tabs` that decides what either structure CONTAINS, and
 * it is a pure function for exactly that reason: neither structure exists
 * until something renders, and P6 asks that the logic not need one.
 */
import { createElement, Fragment } from 'react';
import { describe, expect, test } from 'vitest';
import { Tab } from './Tab';
import { readTabs } from './readTabs';

const tab = (props: {
  id: string;
  title: string;
  isDisabled?: boolean;
  textValue?: string;
  children?: string;
}) => createElement(Tab, { key: props.id, children: 'content', ...props });

describe('readTabs', () => {
  test('reads what was written, in the order it was written', () => {
    const { tabs, strays } = readTabs([
      tab({ id: 'a', title: 'Alpha' }),
      tab({ id: 'b', title: 'Beta' })
    ]);

    expect(tabs.map(t => t.id)).toEqual(['a', 'b']);
    expect(tabs.map(t => t.title)).toEqual(['Alpha', 'Beta']);
    expect(strays).toBe(0);
  });

  test('a disabled tab says so, and the rest default to enabled', () => {
    const { tabs } = readTabs([
      tab({ id: 'a', title: 'Alpha' }),
      tab({ id: 'b', title: 'Beta', isDisabled: true })
    ]);

    expect(tabs.map(t => t.isDisabled)).toEqual([false, true]);
  });

  test('a fragment is walked into, because that is how JSX is written', () => {
    const { tabs, strays } = readTabs([
      tab({ id: 'a', title: 'Alpha' }),
      createElement(Fragment, { key: 'group' }, [
        tab({ id: 'b', title: 'Beta' }),
        tab({ id: 'c', title: 'Gamma' })
      ])
    ]);

    /*
     * `Children.toArray` flattens arrays and does NOT flatten fragments, so
     * without the walk a group of tabs behind one would simply be missing —
     * and it would be missing silently, which is the class of defect this
     * repository keeps finding rather than the kind it predicts.
     */
    expect(tabs.map(t => t.id)).toEqual(['a', 'b', 'c']);
    expect(strays).toBe(0);
  });

  test('an id used twice is dropped and counted', () => {
    const { tabs, strays } = readTabs([
      tab({ id: 'a', title: 'Alpha' }),
      tab({ id: 'a', title: 'Alpha again' })
    ]);

    /*
     * Dropped rather than kept, because keeping it is worse: `selectedKey`
     * would name two tabs and the structure would decide which one a person
     * sees.
     */
    expect(tabs).toHaveLength(1);
    expect(tabs[0]?.title).toBe('Alpha');
    expect(strays).toBe(1);
  });

  test('anything that is not a Tab is counted rather than swallowed', () => {
    const { tabs, strays } = readTabs([
      tab({ id: 'a', title: 'Alpha' }),
      createElement('div', { key: 'stray' }, 'not a tab'),
      'loose text'
    ]);

    expect(tabs.map(t => t.id)).toEqual(['a']);
    expect(strays).toBe(2);
  });

  test('the falsy half of a conditional is not a stray', () => {
    /*
     * `{isAdmin && <Tab …/>}` is how a conditional tab is written, and
     * `Children.toArray` removes what it evaluates to. Counting those as
     * mistakes would make the warning fire on correct code, which is how a
     * warning stops being read.
     */
    const { tabs, strays } = readTabs([
      tab({ id: 'a', title: 'Alpha' }),
      false,
      null,
      undefined
    ]);

    expect(tabs).toHaveLength(1);
    expect(strays).toBe(0);
  });

  test('no children is no tabs, and not an error', () => {
    expect(readTabs(null)).toEqual({ tabs: [], strays: 0 });
  });

  test('a title that is not text carries its own searchable string', () => {
    const rich = createElement('span', null, 'Lines');
    const { tabs } = readTabs([
      createElement(Tab, {
        id: 'lines',
        title: rich,
        textValue: 'Lines',
        children: 'content'
      })
    ]);

    expect(tabs[0]?.textValue).toBe('Lines');
    expect(tabs[0]?.title).toBe(rich);
  });
});
