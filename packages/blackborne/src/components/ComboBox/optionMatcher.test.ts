/*
 * The filter, with no rendering at all.
 *
 * The collator comes in as an argument, so these tests use the real one from
 * the platform. That is deliberate: a fake `contains` would prove the loop and
 * nothing about the behaviour anybody notices, and the behaviour anybody
 * notices is whether "jose" finds "José".
 */
import { expect, test } from 'vitest';
import { optionMatcher, type OptionTerms } from './optionMatcher';

/*
 * The same collator the base builds, with the same options — read from its
 * source: `useFilter({ sensitivity: 'base' })`. Constructed directly because
 * `useFilter` is a hook and this file renders nothing.
 */
const collator = new Intl.Collator('en', {
  usage: 'search',
  sensitivity: 'base'
});

const contains = (text: string, query: string): boolean => {
  if (query.length === 0) return true;
  for (let index = 0; index <= text.length - query.length; index++)
    if (collator.compare(text.slice(index, index + query.length), query) === 0)
      return true;
  return false;
};

const doctors: OptionTerms[] = [
  { label: 'José Ruiz', terms: ['cardiology'] },
  { label: 'Ana Vega', terms: ['paediatrics', 'neonatology'] },
  { label: 'Luis Salas', terms: [] }
];

const matches = (query: string): string[] =>
  doctors
    .filter(option => optionMatcher(doctors, contains)(option.label, query))
    .map(option => option.label);

test('nothing typed keeps every option', () => {
  expect(matches('')).toEqual(['José Ruiz', 'Ana Vega', 'Luis Salas']);
});

test('a query matches the visible text', () => {
  expect(matches('vega')).toEqual(['Ana Vega']);
});

test('and it matches a keyword the row does not show', () => {
  // The feature this component exists for: a doctor found by a speciality.
  expect(matches('cardio')).toEqual(['José Ruiz']);
});

test('any one term is enough, not all of them', () => {
  expect(matches('neonat')).toEqual(['Ana Vega']);
});

test('a match is anywhere in a term, not only at its start', () => {
  expect(matches('ruiz')).toEqual(['José Ruiz']);
  expect(matches('alas')).toEqual(['Luis Salas']);
});

/*
 * THE MEASUREMENT THAT MATTERS, and the reason the collator is passed in
 * rather than built here out of `includes`: accents and case are the
 * difference between a search that works in Spanish and one that looks like it
 * does.
 */
test('accents and capitals make no difference', () => {
  expect(matches('jose')).toEqual(['José Ruiz']);
  expect(matches('JOSÉ')).toEqual(['José Ruiz']);
  expect(matches('josé')).toEqual(['José Ruiz']);
});

test('nothing matching gives nothing, rather than everything', () => {
  // The other way round is the failure that makes a filter look like it works.
  expect(matches('zzz')).toEqual([]);
});

/*
 * The one deliberate difference from the base's own filter, written down in
 * the function: `contains('Alpha', 'al ')` is false, so a trailing space would
 * empty a list that matched a moment ago.
 */
test('a query is trimmed, so a stray space does not empty the list', () => {
  expect(matches('vega ')).toEqual(['Ana Vega']);
  expect(matches('  vega')).toEqual(['Ana Vega']);
});

test('and a query of nothing but spaces keeps everything', () => {
  expect(matches('   ')).toHaveLength(3);
});

test('an option with no text and no keywords can never match', () => {
  /*
   * Which is what the component warns about in development: an option whose
   * children are an element, carrying neither `textValue` nor a keyword, is
   * present until somebody types and gone from then on.
   */
  const withEmpty: OptionTerms[] = [...doctors, { label: '', terms: [] }];
  const match = optionMatcher(withEmpty, contains);

  expect(match('', '')).toBe(true);
  expect(match('', 'a')).toBe(false);
});

test('but a keyword rescues one, because a keyword is a way in', () => {
  const match = optionMatcher([{ label: '', terms: ['cardiology'] }], contains);

  expect(match('', 'cardio')).toBe(true);
});

/*
 * The limitation the function states out loud, asserted so that it is a known
 * behaviour rather than a surprise: the base offers a row's TEXT to look it up
 * by and nothing else, so two rows reading the same thing are one entry here.
 */
test('two options with the same text share their keywords', () => {
  const twins: OptionTerms[] = [
    { label: 'Ana Vega', terms: ['paediatrics'] },
    { label: 'Ana Vega', terms: ['radiology'] }
  ];
  const match = optionMatcher(twins, contains);

  expect(match('Ana Vega', 'radiology')).toBe(true);
  expect(match('Ana Vega', 'paediatrics')).toBe(true);
});

test('it holds no state: the same matcher answers the same twice', () => {
  const match = optionMatcher(doctors, contains);

  expect(match('José Ruiz', 'cardio')).toBe(true);
  expect(match('José Ruiz', 'cardio')).toBe(true);
});
