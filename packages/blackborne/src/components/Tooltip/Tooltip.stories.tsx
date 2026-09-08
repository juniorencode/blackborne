/*
 * The visual catalog for Tooltip.
 *
 * Two things make these stories unlike every other component's, and both come
 * from what a tooltip IS rather than from how it is built.
 *
 * **Nothing here can be photographed at rest.** A tooltip has no `isOpen` prop
 * — its whole behaviour is hover and focus, and a prop to pin one open would
 * exist for the catalog and for nobody else (P5). So the visual suite hovers a
 * trigger and waits before it captures, which is a small extension of the
 * harness that `Popover` and `Preview` will want too.
 *
 * **And only one can be open at once.** The base keeps a global warmup timer
 * that ensures it, which is correct — two tooltips on screen is two
 * explanations competing — and it means the twelve placements cannot be shown
 * side by side. They are checked by MEASUREMENT instead: `tooltip.spec.ts`
 * asserts each one's box against its trigger's, which says more precisely what
 * "below, aligned to the start" means than a picture of it would.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { PLACEMENTS } from '../../internal/Layer';

/** A page carrying one combination of the theme axes, and the portal target so
 * the tooltip inherits them. See Dialog's stories for the reasoning. */
function Page({
  mode = 'light',
  density = 'normal',
  locale,
  dir = 'ltr',
  children
}: {
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  locale?: string;
  dir?: 'ltr' | 'rtl';
  children: React.ReactNode;
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  return (
    <div
      className="catalog-layer-page"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      ref={setHost}
      style={{ display: 'grid', placeItems: 'center' }}
    >
      {host === null ? null : (
        <ConfigProvider
          portalContainer={host}
          {...(locale === undefined ? {} : { locale })}
        >
          {children}
        </ConfigProvider>
      )}
    </div>
  );
}

/*
 * A save icon, drawn here rather than distributed: doc 02 §11 says icons are
 * received, so a STORY has to supply its own the way a consumer would.
 */
function SaveIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M3 2h8l3 3v9H3z M6 2v4h4V2 M5 10h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  /*
   * `content` and `children` are both required on the component, so they are
   * supplied here rather than in every story — the same shape Dialog uses for
   * its required `title`. Every story renders its own tooltip and trigger, so
   * these args are only what satisfies the type.
   */
  args: {
    content: 'Save and close',
    children: <Button aria-label="Save">S</Button>
  },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A toolbar of icon-only buttons, which is what a tooltip is mostly for.
 *
 * **Every trigger carries its own `aria-label`**, and that is the thing to copy
 * rather than the thing to skip: a tooltip is wired through
 * `aria-describedby`, so it describes the control and never names it. Without
 * the label these would be announced as "button" with a description attached
 * to nothing.
 *
 * Worth trying by hand: cross the row slowly. The first tooltip waits 600ms;
 * the rest appear at once, because the base keeps a global warmup timer and the
 * delay is paid per approach to a group rather than per control.
 */
export const Overview: Story = {
  render: () => (
    <div className="catalog-stack" style={{ padding: 24 }}>
      <p className="catalog-label">
        Hover or focus. The first waits; its neighbours do not.
      </p>
      <div className="catalog-row">
        <Tooltip content="Save and close">
          <Button variant="ghost" aria-label="Save" data-testid="trigger">
            <SaveIcon />
          </Button>
        </Tooltip>
        <Tooltip content="Duplicate this invoice">
          <Button variant="ghost" aria-label="Duplicate">
            <SaveIcon />
          </Button>
        </Tooltip>
        <Tooltip content="Issue a credit note against it">
          <Button variant="ghost" aria-label="Credit note">
            <SaveIcon />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
};

/**
 * All twelve placements, one at a time — because only one tooltip can be open
 * at once, by design.
 *
 * The four sides are the block and inline axes; the three alignments are how it
 * lines up on the other one. `start` and `end` follow the writing direction, so
 * this row reads mirrored in Arabic and the words do not change.
 *
 * The base repositions anything that would not fit, so a placement is a
 * preference. Try one near the edge of the window: the tooltip flips, and the
 * arrow follows it rather than the prop.
 */
export const Placements: Story = {
  render: () => (
    /*
     * Generous horizontal room on purpose. The base repositions a tooltip that
     * will not fit, which is correct — and measured, a `start` tooltip against
     * 96px of padding flipped to the other side, so the geometry checks were
     * measuring the flip rather than the placement. The content is the bare
     * value for the same reason: a narrower bubble needs less room to be where
     * it was asked for.
     */
    <div className="catalog-stack" style={{ padding: '32px 200px' }}>
      <p className="catalog-label">
        Twelve logical values (doc 02 §3.3). The other twelve the base offers
        are the same positions spelled physically, and wrong in Arabic.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, max-content)',
          gap: 'var(--bb-space-6)'
        }}
      >
        {PLACEMENTS.map(placement => (
          <Tooltip key={placement} placement={placement} content={placement}>
            <Button
              variant="secondary"
              size="sm"
              data-testid={`trigger-${placement.replace(' ', '-')}`}
            >
              {placement}
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
};

/** Light. The same panel surface as every other floating thing in the library,
 * at the control radius, with an arrow that says which control it belongs to. */
export const Light: Story = {
  render: () => (
    <Page mode="light">
      <Tooltip content="Save and close">
        <Button aria-label="Save" data-testid="trigger">
          <SaveIcon />
        </Button>
      </Tooltip>
    </Page>
  )
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: () => (
    <Page mode="dark">
      <Tooltip content="Save and close">
        <Button aria-label="Save" data-testid="trigger">
          <SaveIcon />
        </Button>
      </Tooltip>
    </Page>
  )
};

/**
 * RTL, with `placement="end"`. The tooltip is on the LEFT here, because `end`
 * is the inline end and the inline axis runs the other way — and the arrow
 * turns with it.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page dir="rtl" locale="ar-EG">
      <Tooltip placement="end" content="احفظ وأغلق">
        <Button aria-label="احفظ" data-testid="trigger">
          <SaveIcon />
        </Button>
      </Tooltip>
    </Page>
  )
};

/**
 * Content as nodes: a shortcut marked up rather than spelled out in prose.
 *
 * Nothing interactive, though — and for a narrower reason than it looks. A
 * pointer CAN travel into a tooltip without it closing, which WCAG 1.4.13
 * requires and which was measured rather than assumed. The keyboard cannot: a
 * tooltip is not focusable and the base closes it when the trigger blurs, so a
 * link in here would exist for a pointer and for nobody else.
 */
export const Nodes: Story = {
  render: () => (
    <Page mode="light">
      <Tooltip
        content={
          <>
            Save and close <kbd>Ctrl</kbd> + <kbd>S</kbd>
          </>
        }
      >
        <Button aria-label="Save" data-testid="trigger">
          <SaveIcon />
        </Button>
      </Tooltip>
    </Page>
  )
};

/**
 * The legitimate case for a tooltip carrying something you might actually need:
 * text that had to be truncated.
 *
 * Doc 05 §5 requires the full text to stay accessible when it is cut. Note the
 * trigger is a **button**, not the truncated span — a tooltip opens on focus as
 * well as hover, so a non-focusable trigger produces one that exists for a
 * mouse and for nobody else. The full value is also still in the DOM, so a
 * screen reader has it regardless.
 */
export const Truncation: Story = {
  render: () => (
    <div className="catalog-stack" style={{ padding: 24, maxWidth: 260 }}>
      <p className="catalog-label">A cell too narrow for its value.</p>
      <Tooltip content="Astilleros del Sur, Sociedad Anónima Cerrada">
        <Button
          variant="link"
          data-testid="trigger"
          className="bb:block bb:w-full bb:truncate bb:text-start"
        >
          Astilleros del Sur, Sociedad Anónima Cerrada
        </Button>
      </Tooltip>
    </div>
  )
};

/**
 * Turned off without unmounting, for a tooltip that only applies some of the
 * time — a cell that is not truncated at this width, a disabled control whose
 * reason has gone.
 */
export const Disabled: Story = {
  render: () => (
    <div className="catalog-stack" style={{ padding: 24 }}>
      <p className="catalog-label">
        Neither hover nor focus opens anything. The button is untouched.
      </p>
      <Tooltip isDisabled content="You will not see this">
        <Button aria-label="Save" data-testid="trigger">
          <SaveIcon />
        </Button>
      </Tooltip>
    </div>
  )
};

/**
 * A long value, which doc 05 §5 asks of everything. The bubble stops at
 * `--container-narrow` and wraps; a tooltip that spanned the window would be a
 * paragraph, and a paragraph belongs on the page.
 */
export const LongText: Story = {
  render: () => (
    <Page mode="light">
      <Tooltip content="Sending the statement e-mails the current balance to each customer with an address on file, and records the send against their account. Customers with no address are skipped and listed afterwards.">
        <Button aria-label="Send statements" data-testid="trigger">
          <SaveIcon />
        </Button>
      </Tooltip>
    </Page>
  )
};
