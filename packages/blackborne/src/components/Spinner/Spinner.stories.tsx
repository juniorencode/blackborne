/*
 * The catalog for Spinner, and it exists because the component had none.
 *
 * Measured on 2026-09-11: fifty-one components, fifty stories. `Spinner` was
 * the one without, so it was the one component in the library with **no axe
 * check and no picture** — the accessibility suite builds its list from
 * Storybook's own index, and the visual suite photographs stories by id.
 * `components.test.ts` is the guard that now says so out loud.
 *
 * Nothing here is a demo of the API. Three of the four claims this component
 * makes are invisible to a unit test:
 *
 *   - the arc ROTATES, which is a keyframe animation
 *   - under reduced motion it stops rotating and becomes a complete ring,
 *     which is a `d:` path swapped by a media query — CSS-only, and the one
 *     thing about this component nothing checked at all
 *   - it inherits its colour, so the same element is legible on a page and
 *     inside a filled button, which needs a resolved `currentColor`
 *
 * jsdom answers none of those.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Spinner } from './Spinner';

function Scope({
  label,
  mode = 'light',
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-panel" data-bb-mode={mode}>
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/Spinner',
  component: Spinner
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The three sizes, against the type scale rather than the control scale.
 *
 * A spinner sits beside text as often as it sits inside a control, so it is
 * sized like an icon: `size-3`, `size-4`, `size-5` (doc 03 §4.6d).
 */
export const Sizes: Story = {
  render: () => (
    <div className="catalog-row">
      <Scope label="sm — beside small text">
        <Spinner size="sm" />
      </Scope>
      <Scope label="md — the default">
        <Spinner size="md" />
      </Scope>
      <Scope label="lg">
        <Spinner size="lg" />
      </Scope>
    </div>
  )
};

/**
 * IT INHERITS ITS COLOUR, which is the claim that makes it usable inside a
 * control it knows nothing about.
 *
 * The same element beside body text, beside muted text, and inside a filled
 * primary button — where the surrounding colour is the button's foreground and
 * not the page's. `color: currentColor` is the whole mechanism, and a resolved
 * colour is the one thing jsdom cannot report.
 */
export const InheritsItsColour: Story = {
  render: () => (
    <div className="catalog-row">
      <Scope label="on the page">
        <span className="bb:flex bb:items-center bb:gap-2">
          <Spinner isDecorative /> Loading the invoice
        </span>
      </Scope>
      <Scope label="muted text">
        <span className="bb:flex bb:items-center bb:gap-2 bb:text-text-muted">
          <Spinner isDecorative /> Checking
        </span>
      </Scope>
      <Scope label="inside a filled button">
        {/* `primary` explicitly: the default variant is `secondary`, which is
            outlined rather than filled, so the panel's label was describing
            something the picture did not show. Found by opening the baseline. */}
        <Button variant="primary" isPending>
          Saving
        </Button>
      </Scope>
      <Scope label="dark" mode="dark">
        <span className="bb:flex bb:items-center bb:gap-2">
          <Spinner isDecorative /> Loading the invoice
        </span>
      </Scope>
    </div>
  )
};

/**
 * NAMED OR DECORATIVE, NEVER NEITHER.
 *
 * An indicator nobody can perceive is a change that happens in silence for
 * anyone using a screen reader (doc 06 §3). So the component takes one of two
 * shapes: a `progressbar` with an accessible name, or `aria-hidden` — for when
 * the element around it already announces the busy state and a second
 * announcement would be noise.
 *
 * The default name comes from the dictionary, in the active language, which is
 * why there is no literal string in the component (doc 05 §2.2).
 */
export const Naming: Story = {
  render: () => (
    <div className="catalog-row">
      <Scope label="default — the dictionary's own word">
        <Spinner />
      </Scope>
      <Scope label="a better name, which only the consumer knows">
        <Spinner label="Loading customers" />
      </Scope>
      <Scope label="decorative — the row around it already says it">
        <span className="bb:flex bb:items-center bb:gap-2">
          <Spinner isDecorative /> Loading customers
        </span>
      </Scope>
    </div>
  )
};

/**
 * UNDER REDUCED MOTION IT STOPS ROTATING AND BECOMES A COMPLETE RING.
 *
 * Doc 09 §2 taken literally: motion is removed, not softened. And the still
 * form is a whole ring on purpose — a spinner frozen part-way round reads as
 * something broken, which is a worse outcome than the one the preference asked
 * for.
 *
 * This story cannot show it by itself, and that is worth stating rather than
 * implying: the swap is a `d:` path inside
 * `@media (prefers-reduced-motion: reduce)`, so it depends on the VIEWER's
 * setting. A browser check emulates it — `progress.spec.ts` and
 * `accordion.spec.ts` both do, per test — and this is the page it would be
 * emulated on.
 */
export const ReducedMotion: Story = {
  render: () => (
    <div className="catalog-stack">
      <p className="catalog-label">
        Turn on “reduce motion” in the operating system to see the arc become a
        full ring. It is a CSS media query, so nothing on this page can switch
        it.
      </p>
      <div className="catalog-row">
        <Scope label="sm">
          <Spinner size="sm" label="Loading" />
        </Scope>
        <Scope label="md">
          <Spinner size="md" label="Loading" />
        </Scope>
        <Scope label="lg">
          <Spinner size="lg" label="Loading" />
        </Scope>
      </div>
    </div>
  )
};
