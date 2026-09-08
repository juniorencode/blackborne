/*
 * The visual catalog for Link.
 *
 * Two stories here are doing something no other component's stories do.
 *
 * `Against a button` is the composite doc 09 §10 asks for, and it is the whole
 * reason both exist: a link is accent-coloured and underlined at rest, and
 * `Button variant="link"` is ordinary text until you point at it. Side by side
 * the difference is obvious; apart, somebody will use the wrong one.
 *
 * `Wrapping` is a link that crosses a line break with focus on it. That is the
 * case the outline was chosen for — it follows both fragments — and it is
 * impossible to see in a component that is always a box.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { Force } from '../../catalog/forceState';
import { Link } from './Link';

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  dir = 'ltr',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/*
 * Every href here is a hash, on purpose. A story that reloaded the catalog
 * would be a story nobody could look at twice, and the browser checks that
 * DO need a real navigation say so where they need it.
 */
const meta = {
  title: 'Components/Link',
  component: Link,
  args: { href: '#the-terms', children: 'the terms of the agreement' },
  argTypes: { href: { control: 'text' } }
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A link in a sentence, which is where a link belongs.
 *
 * **Worth trying by hand**, because everything this component is for is a
 * thing the keyboard and the pointer do rather than a thing to look at: point
 * at it and the rule thickens, tab to it and the ring appears, middle-click it
 * and it opens in another tab, and the context menu offers to copy the
 * address. A button dressed as a link does none of those.
 */
export const Overview: Story = {
  render: args => (
    <p
      style={{
        maxWidth: 460,
        margin: 0,
        fontSize: 14,
        lineHeight: 1.6,
        color: 'var(--bb-text)'
      }}
    >
      Invoices are issued against <Link {...args} />, which the customer
      accepted on 4 March.
    </p>
  )
};

/**
 * The pair, and how to choose.
 *
 * > **`Link` navigates. `Button` acts** — including `Button variant="link"`.
 *
 * The test is whether there is an address. Note what the button variant does
 * at rest: it takes the ordinary text colour on purpose, so it does not
 * compete with a real link. Accent-coloured text means "this goes somewhere"
 * everywhere in this library.
 */
export const AgainstAButton: Story = {
  name: 'Against a button',
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 460 }}>
      <div className="catalog-panel">
        <p className="catalog-label">Link · goes somewhere</p>
        <Link {...args} href="/customers/4821">
          Astilleros del Sur
        </Link>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">
          Button variant=&quot;link&quot; · does something
        </p>
        <Button variant="link">Add another line</Button>
      </div>
    </div>
  )
};

/** Every state. Rest is already underlined, which is the point. */
export const States: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 320 }}>
      {(
        [
          ['default', undefined],
          ['hover', 'data-hovered'],
          ['pressed', 'data-pressed'],
          ['focus', 'data-focused']
        ] as const
      ).map(([label, state]) => (
        <div key={label} className="catalog-row">
          <span
            className="catalog-label"
            style={{ width: 64, marginBlockEnd: 0 }}
          >
            {label}
          </span>
          {state === undefined ? (
            <Link {...args}>the terms</Link>
          ) : (
            <Force state={state}>
              <Link {...args}>the terms</Link>
            </Force>
          )}
        </div>
      ))}
    </div>
  )
};

/**
 * A link that crosses a line break, with focus on it.
 *
 * This is the case the outline was chosen for. The library's usual ring is a
 * border plus a halo, and a border on a run of text widens its inline box, so
 * every word after it would shift when focus landed. An outline paints outside
 * the box without taking part in layout, and it follows each fragment of a
 * wrapped link — which is what a browser's own ring does, for the same reason.
 */
export const Wrapping: Story = {
  render: args => (
    <div
      style={{
        maxWidth: 260,
        fontSize: 14,
        lineHeight: 1.8,
        color: 'var(--bb-text)'
      }}
    >
      Everything about this is set out in{' '}
      <Force state="data-focused">
        <Link {...args}>
          the schedule of terms agreed with this customer in March
        </Link>
      </Force>{' '}
      and nowhere else.
    </div>
  )
};

/**
 * A link that opens elsewhere, and one that downloads.
 *
 * Both are left to the browser even when a router is installed — the base
 * checks the `target` and the `download` attribute before handing a press
 * over, so neither needs anything from the application.
 *
 * `rel` is not added for you. Browsers have implied `noopener` for
 * `target="_blank"` for years, and `noreferrer` is a decision about analytics
 * that belongs to whoever owns the page being opened.
 */
export const Elsewhere: Story = {
  render: () => (
    <div className="catalog-row">
      <Link href="#a-tab" target="_blank">
        Open in another tab
      </Link>
      <Link href="#a-file" download>
        Download the statement
      </Link>
    </div>
  )
};

/**
 * With a router. Press the link: nothing loads, and the function is called
 * with the address.
 *
 * ```tsx
 * <ConfigProvider navigate={href => router.push(href)}>
 * ```
 *
 * Set once on the provider, for every link beneath it (decision 0016). Try a
 * ctrl-click as well — that still opens a new tab, because the base checks the
 * modifiers before handing anything over, so there is no modifier handling to
 * write.
 */
export const WithARouter: Story = {
  name: 'With a router',
  render: () => {
    function Demo() {
      const [went, setWent] = useState<string | null>(null);

      return (
        <ConfigProvider navigate={href => setWent(href)}>
          <div className="catalog-stack" style={{ maxWidth: 420 }}>
            <div className="catalog-row">
              <Link href="/customers/4821">Astilleros del Sur</Link>
              <Link href="/invoices/INV-4821">Invoice INV-4821</Link>
            </div>
            <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
              {went === null
                ? 'The router has not been asked for anything yet.'
                : `The router was asked for ${went}`}
            </p>
          </div>
        </ConfigProvider>
      );
    }

    return <Demo />;
  }
};

/**
 * Light and dark. The link colour is defined per mode rather than derived:
 * step 9 in light measures 4.63:1 and step 11 in dark measures 9.15:1, and
 * step 10 was tried and rejected at 4.40:1 (doc 03, beside the token).
 */
export const Modes: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Link {...args}>the terms of the agreement</Link>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Link {...args}>the terms of the agreement</Link>
      </Scope>
    </div>
  )
};

/** An overridden brand. A link is accent-coloured text, so it follows the
 * theme — and so does its focus ring (doc 03 §7). */
export const BrandOverride: Story = {
  name: 'Overridden brand',
  render: args => (
    <div className="catalog-pair">
      <Scope label="Library brand">
        <Force state="data-focused">
          <Link {...args}>the terms</Link>
        </Force>
      </Scope>
      <Scope label="Overridden" brand>
        <Force state="data-focused">
          <Link {...args}>the terms</Link>
        </Force>
      </Scope>
    </div>
  )
};

/**
 * RTL. Nothing in the component knows which way the line runs — the underline
 * and the ring follow the text, and the address is not translated.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR">
        <Link href="#terms">the terms of the agreement</Link>
      </Scope>
      <Scope label="RTL · العربية" dir="rtl">
        <Link href="#terms">شروط الاتفاقية</Link>
      </Scope>
    </div>
  )
};
