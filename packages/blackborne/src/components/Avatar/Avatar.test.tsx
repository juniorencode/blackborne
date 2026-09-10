/*
 * What holds without a browser: the name, the two channels, and the fallback.
 *
 * NOT HERE: whether the circle is a circle. Its width comes from
 * `aspect-square` against a height token, and jsdom resolves no variables and
 * lays nothing out — so the sizes are measured in
 * `apps/catalog/e2e/avatar.spec.ts`, where a `w-control-md` that compiled to
 * nothing would have shown up as a 0px box.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Avatar } from './Avatar';

test('it is one image with the full name on it', () => {
  render(
    <Avatar name="Carlos Ramos" src="/carlos.jpg">
      CR
    </Avatar>
  );

  /*
   * THE NAME IS ON THE BOX, not on the picture, and the reason is the
   * FALLBACK: an `<img alt="Carlos Ramos">` names itself perfectly well, and
   * initials cannot — their name would be "CR", which is what the screen says
   * and not what the person is called. So the name lives one level up and the
   * same element carries it either way.
   */
  expect(screen.getByRole('img', { name: 'Carlos Ramos' })).toBeDefined();

  /* And exactly one thing in the tree is an image, rather than two. */
  expect(screen.getAllByRole('img')).toHaveLength(1);
  expect(document.querySelector('img')?.getAttribute('alt')).toBe('');
});

test('the same name reaches a reader when the initials are what shows', () => {
  render(<Avatar name="Carlos Ramos">CR</Avatar>);

  expect(screen.getByRole('img', { name: 'Carlos Ramos' })).toBeDefined();
  expect(screen.getByText('CR')).toBeDefined();
  expect(document.querySelector('img')).toBeNull();
});

test('decorative means it says nothing at all', () => {
  render(
    <Avatar name="Carlos Ramos" isDecorative>
      CR
    </Avatar>
  );

  /*
   * For an avatar sitting beside the name it belongs to. The alternative is a
   * reader saying "Carlos Ramos" twice in one breath — the arrangement
   * `Spinner` has, and the reason it has it.
   */
  expect(screen.queryByRole('img')).toBeNull();
  expect(
    document.querySelector('.bb-avatar')?.getAttribute('aria-hidden')
  ).toBe('true');
});

test('an image that does not arrive falls back to the children', () => {
  render(
    <Avatar name="Carlos Ramos" src="/gone.jpg">
      CR
    </Avatar>
  );

  const image = document.querySelector('img')!;
  expect(screen.queryByText('CR')).toBeNull();

  fireEvent.error(image);

  /*
   * Fired by hand, because jsdom loads nothing: a broken url there produces no
   * error event at all, so the real failure is only reachable in a browser and
   * the wiring is only reachable here.
   */
  expect(screen.getByText('CR')).toBeDefined();
  expect(document.querySelector('img')).toBeNull();
  expect(screen.getByRole('img', { name: 'Carlos Ramos' })).toBeDefined();
});

test('and a different image afterwards is tried rather than assumed broken', () => {
  const { rerender } = render(
    <Avatar name="Carlos Ramos" src="/gone.jpg">
      CR
    </Avatar>
  );

  fireEvent.error(document.querySelector('img')!);
  expect(document.querySelector('img')).toBeNull();

  rerender(
    <Avatar name="Ana Vega" src="/ana.jpg">
      AV
    </Avatar>
  );

  /*
   * THE STATE IS WHICH URL FAILED, not a boolean. A boolean would need
   * resetting when `src` changes — an effect that runs after a paint — so
   * swapping one person for another would show the new image as broken for a
   * frame, or never try it at all. This is the assertion that says the
   * comparison is the state itself.
   */
  expect(document.querySelector('img')?.getAttribute('src')).toBe('/ana.jpg');
});

test('an avatar can be neither unnamed nor empty', () => {
  render(
    <>
      {/* @ts-expect-error a picture of a person with no name is not offered */}
      <Avatar src="/carlos.jpg">CR</Avatar>
      {/* @ts-expect-error and neither is one with nothing to fall back to */}
      <Avatar name="Carlos Ramos" src="/carlos.jpg" />
    </>
  );

  /*
   * ASSERTED WITH THE TYPE CHECKER, so adding a default for either fails the
   * build rather than passing quietly. The library will not invent a name for
   * a person and will not derive initials from one (doc 05 §4.2) — which
   * leaves both as required, and leaves the impossible state unwritable.
   */
  expect(document.querySelectorAll('.bb-avatar')).toHaveLength(2);
});

test('the class name lands on the outermost element only', () => {
  render(
    <Avatar name="Carlos Ramos" className="placed">
      CR
    </Avatar>
  );

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
  expect(document.querySelector('.placed')?.classList).toContain('bb-avatar');
});
