/*
 * What jsdom can answer about a preview: the wiring, the naming, and that the
 * page behind it is left alone.
 *
 * What it cannot: where `Tab` goes, whether the pointer can travel from the
 * trigger into the card, and whether the warmup delay behaves. Those are in
 * `preview.spec.ts` — jsdom has no tab order, no hover, and no layout for a
 * safe-area polygon to be computed against.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Button } from '../Button';
import { Preview } from './Preview';

const show = (props: Partial<React.ComponentProps<typeof Preview>> = {}) =>
  render(
    <>
      <Preview
        title="Astilleros del Sur SAC"
        trigger={<Button variant="link">Astilleros del Sur</Button>}
        {...props}
      >
        Callao · Terms 30 days
      </Preview>
      {/*
       * Something on the page, to measure what the layer does to it — and
       * AFTER the preview, so the first `Tab` lands on the trigger. It was
       * before it first, and six tests then failed on a preview that had not
       * opened because nothing had focused its trigger.
       */}
      <Button>Behind</Button>
    </>
  );

/*
 * Focus is the route in that works here. Hover is not: `useHover` ignores a
 * pointer event whose modality is not a pointer, and jsdom has no pointer —
 * measured on `Tooltip`, where four different hover attempts opened nothing.
 * The base opens on keyboard focus after the same warmup delay.
 */
const openByFocus = async (name: RegExp | string) => {
  await userEvent.tab();

  /*
   * And it takes the warmup delay to arrive — measured at ~700ms against the
   * library's 600ms, because the base opens a preview on keyboard focus only
   * after the delay rather than immediately as a tooltip does. Its own comment
   * says why: tabbing quickly through a page would otherwise open previews and
   * add their tab stops on the way past.
   */
  await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy(), {
    timeout: 2000
  });
  return screen.getByRole('dialog', { name });
};

test('the trigger renders, and the card does not', () => {
  show();

  expect(
    screen.getByRole('button', { name: 'Astilleros del Sur' })
  ).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByText('Callao · Terms 30 days')).toBeNull();
});

test('the trigger says a preview is there, and which one', async () => {
  show();
  const trigger = screen.getByRole('button', { name: 'Astilleros del Sur' });

  /*
   * The base's wiring, asserted because it is the whole accessibility story of
   * this component and it is invisible in a screenshot. `aria-haspopup` says
   * something can be opened; `aria-describedby` is what makes the card's
   * content reach somebody who never sees it appear.
   */
  expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');

  const panel = await openByFocus(/Astilleros/);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
  expect(trigger.getAttribute('aria-describedby') ?? '').toContain(panel.id);
});

test('THE PANEL IS NAMED, which the base does not do', async () => {
  show();
  const panel = await openByFocus('Astilleros del Sur SAC');

  /*
   * The measurement this component's required `title` exists for. The base
   * gives a preview's panel `role="dialog"` even though it is non-modal, and
   * names it with nothing — measured before this component was written:
   * `aria-labelledby` absent, `aria-label` absent, accessible name `null`.
   *
   * Queried BY NAME rather than by reading the attribute, because the
   * attribute being present is not the claim: the claim is that a reader
   * announces the customer rather than the word "dialog".
   */
  expect(panel).toBeTruthy();
  expect(panel.getAttribute('aria-labelledby')).toBeTruthy();
  expect(document.getElementById(panel.getAttribute('aria-labelledby')!)).toBe(
    screen.getByText('Astilleros del Sur SAC')
  );
});

test('and its title is not a heading', async () => {
  show();
  await openByFocus(/Astilleros/);

  /*
   * Doc 06 §2: a heading's level belongs to the project, and this component
   * cannot derive one — the machinery that would give it level 2 is the nested
   * dialog it is not allowed to render. So the title names the panel without
   * joining the document outline.
   *
   * Asserted rather than left implicit because the opposite is the obvious
   * thing to write, and it looks harmless.
   */
  expect(screen.queryByRole('heading')).toBeNull();
});

test('the page behind is left alone in all three of the base ways', async () => {
  show();
  await openByFocus(/Astilleros/);

  /*
   * The opposite of `Popover`, measured the same way, and the reason these are
   * two components rather than one prop. `PreviewTrigger` sets `isNonModal`,
   * so none of the three things a popover does to the page happens here.
   */
  expect(document.querySelector('[data-testid="underlay"]')).toBeNull();
  expect(document.documentElement.style.overflow || '(unset)').toBe('(unset)');
  // Still in the accessibility tree: `ariaHideOutside` did not run.
  expect(screen.getByRole('button', { name: 'Behind' })).toBeTruthy();
});

test('there is no close button', async () => {
  show();
  await openByFocus(/Astilleros/);

  /*
   * It closes when you stop hovering, when focus leaves, or on `Escape`. A
   * cross would be a fourth way to dismiss something that dismisses itself,
   * and it is also the visible half of the structural decision: the shared
   * sheet would have brought one, and the shared sheet would have contained
   * the focus (doc 08 §4).
   */
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
});

test('Escape closes it', async () => {
  show();
  await openByFocus(/Astilleros/);

  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('isDisabled opens nothing and leaves the trigger alone', async () => {
  show({ isDisabled: true });

  const trigger = screen.getByRole('button', { name: 'Astilleros del Sur' });
  await userEvent.tab();
  expect(document.activeElement).toBe(trigger);

  /*
   * A moment longer than the open delay, so this is "it did not open" rather
   * than "it had not opened yet". The delay is the library's 600ms and the
   * base pays it on keyboard focus too.
   *
   * THIS TEST HAS ALREADY FAILED ONCE, which is why it reads this way. Passing
   * `isDisabled` through to the base is the obvious implementation and it
   * leaves the keyboard route open: `PreviewTrigger` gives the prop to
   * `useHover` and `useLongPress` and its focus handler never consults it, so
   * the card appeared here after 700ms. `Preview` declines to mount the
   * trigger wrapper instead, and the second assertion is what pins that down —
   * a trigger that still claimed `aria-haspopup` would mean the prop had been
   * passed rather than obeyed.
   */
  await new Promise(resolve => setTimeout(resolve, 800));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger.getAttribute('aria-haspopup')).toBeNull();
});

test('interactive content is allowed, unlike in a tooltip', async () => {
  render(
    <Preview
      title="Astilleros del Sur SAC"
      trigger={<Button variant="link">Astilleros del Sur</Button>}
    >
      <Button variant="link">Open statement</Button>
    </Preview>
  );

  await openByFocus(/Astilleros/);

  /*
   * That the link is IN the card is all jsdom can say; that the keyboard can
   * reach it is `preview.spec.ts`, and it is the reason this component exists
   * beside `Tooltip`.
   */
  expect(screen.getByRole('button', { name: 'Open statement' })).toBeTruthy();
});

test('two previews in one row name their own panels', async () => {
  render(
    <>
      <Preview
        title="Astilleros del Sur SAC"
        trigger={<Button variant="link">Astilleros</Button>}
      >
        Callao
      </Preview>
      <Preview
        title="Pesquera Nor-Oriente SA"
        trigger={<Button variant="link">Pesquera</Button>}
      >
        Paita
      </Preview>
    </>
  );

  /*
   * The reason the title's id comes from `useId`. Two cards naming each
   * other's panels would look correct in the DOM and be wrong in a reader, and
   * a table of customer names is the ordinary case rather than a contrived one.
   */
  const panel = await openByFocus('Astilleros del Sur SAC');
  expect(panel).toBeTruthy();
  expect(
    screen.queryByRole('dialog', { name: 'Pesquera Nor-Oriente SA' })
  ).toBeNull();
});
