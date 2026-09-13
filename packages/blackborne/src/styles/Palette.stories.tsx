/*
 * The catalogue of colours a project can switch to, on a screen.
 *
 * ## Why this story reads layer 1 directly
 *
 * Hard rule 1 says a component may not touch `--bb-x-*`, and this file does,
 * on purpose: the palette IS layer 1, and a catalogue of it that showed only
 * semantic tokens would be showing the mapping rather than the colours. The
 * project's lint rule already excludes `*.stories.tsx` from that block, so this
 * is an allowance that exists rather than one being taken.
 *
 * ## Why the families are read out of the stylesheet
 *
 * They are not listed here. `palette.css` is generated from
 * `scripts/palette.mjs`, and a second list in a story is a second place to
 * forget: the catalog has already paid for that once, where five hand-written
 * copies of the alternate brand had drifted apart and three of them were
 * missing steps. So the story walks the CSSOM and shows whatever the
 * stylesheet actually contains — add a family to the palette and it appears
 * here with nothing else edited.
 *
 * It also makes a missing import LOUD rather than silent: with no
 * `palette.css` the scan finds nothing, and an empty story would look like a
 * story with nothing in it rather than like a broken build.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Link } from '../components/Link';

/** The twelve steps, in order. */
const STEPS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Every family the stylesheet declares a scope for, in the order it declares
 * them.
 *
 * A sheet from another origin throws on `cssRules`, which is why the read is
 * guarded — nothing in this catalog loads one, and a guard that only matters
 * elsewhere costs one line.
 */
function familiesIn(attribute: 'data-bb-accent' | 'data-bb-base'): string[] {
  const found = new Set<string>();
  /* Both quote styles: the property is written with apostrophes and a browser
     may hand it back with double quotes. */
  const shape = new RegExp(`^\\[${attribute}=["']([a-z]+)["']\\]$`);

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      const match = shape.exec(rule.selectorText);
      if (match) found.add(match[1]!);
    }
  }
  return [...found];
}

/** A row of twelve swatches for one family, with its name beside them. */
function Strip({
  name,
  attribute,
  token
}: {
  name: string;
  attribute: 'data-bb-accent' | 'data-bb-base';
  token: 'brand' | 'gray';
}) {
  return (
    <div
      {...{ [attribute]: name }}
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <span
        style={{
          width: 64,
          flex: 'none',
          fontSize: 12,
          color: 'var(--bb-text-muted)'
        }}
      >
        {name}
      </span>
      <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
        {STEPS.map(step => (
          <div
            key={step}
            style={{
              flex: 1,
              height: 24,
              background: `var(--bb-x-${token}-${String(step)})`
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A panel carrying one mode, and optionally one scope.
 *
 * The attribute sits on the same element as `data-bb-mode` here, which is one
 * of the two arrangements doc 03 §3.2 allows. The other — the scope inside the
 * mode — is what `Nesting` below is for.
 */
function Panel({
  label,
  mode,
  scope,
  children
}: {
  label: string;
  mode: 'light' | 'dark';
  /* `| undefined` rather than a bare optional: this package compiles with
     `exactOptionalPropertyTypes`, so "absent" and "present and undefined" are
     different types and a caller passing the second needs it spelled out. */
  scope?: Record<string, string> | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-panel" data-bb-mode={mode} {...scope}>
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/** The things an accent actually moves, small enough to repeat. */
function Sample() {
  return (
    <div className="catalog-row">
      <Button variant="primary">Save</Button>
      <Button variant="subtle">Subtle</Button>
      <Badge tone="accent" variant="soft">
        Accent
      </Badge>
      <Link href="#palette">A link</Link>
    </div>
  );
}

const meta = {
  title: 'Foundations/Palette'
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every accent, twelve steps each, in both modes.
 *
 * Swatches rather than components, and that is not squeamishness: four of the
 * eighteen solids are mid-tones that cannot carry a run of text at 4.5:1 —
 * cyan 4.48, emerald 4.31, sky 4.07 and teal 4.39, measured — so a page of
 * eighteen filled buttons would be a page with four known contrast failures on
 * it. Decision 0028 names them and `Switching` below shows the ones that hold.
 */
export const Accents: Story = {
  render: function Accents() {
    const [names] = useState(() => familiesIn('data-bb-accent'));
    return (
      <div className="catalog-pair">
        {(['light', 'dark'] as const).map(mode => (
          <Panel key={mode} label={mode} mode={mode}>
            <div className="catalog-stack" style={{ gap: 4 }}>
              {names.length === 0 && (
                <p>No accents found — is palette.css imported?</p>
              )}
              {names.map(name => (
                <Strip
                  key={name}
                  name={name}
                  attribute="data-bb-accent"
                  token="brand"
                />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    );
  }
};

/** Every base. The greys a project sits on, from cool to warm. */
export const Bases: Story = {
  render: function Bases() {
    const [names] = useState(() => familiesIn('data-bb-base'));
    return (
      <div className="catalog-pair">
        {(['light', 'dark'] as const).map(mode => (
          <Panel key={mode} label={mode} mode={mode}>
            <div className="catalog-stack" style={{ gap: 4 }}>
              {names.length === 0 && (
                <p>No bases found — is palette.css imported?</p>
              )}
              {names.map(name => (
                <Strip
                  key={name}
                  name={name}
                  attribute="data-bb-base"
                  token="gray"
                />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    );
  }
};

/**
 * What switching actually does, on real components.
 *
 * `amber` is in here deliberately: its solid is a LIGHT colour, so the scope
 * declares dark text on it and moves hover and press the other way up the
 * scale. That is the half of this feature a swatch cannot show.
 */
export const Switching: Story = {
  render: () => (
    <div className="catalog-stack">
      {(['light', 'dark'] as const).map(mode => (
        <div key={mode} className="catalog-pair">
          {[undefined, 'red', 'violet', 'amber'].map(accent => (
            <Panel
              key={accent ?? 'default'}
              label={`${mode} · ${accent ?? 'default'}`}
              mode={mode}
              scope={accent ? { 'data-bb-accent': accent } : undefined}
            >
              <Sample />
            </Panel>
          ))}
        </div>
      ))}
    </div>
  )
};

/**
 * The base and the accent are independent, and the tones follow neither.
 *
 * Decision 0028: a listing whose accent is red still marks an error in
 * `danger`. Two reds beside each other is avoided by not choosing red, and
 * that is the project's call rather than this library's — so the four tone
 * badges are the same colour in every panel here.
 */
export const TonesDoNotFollow: Story = {
  render: () => (
    <div className="catalog-pair">
      {[
        { label: 'default', scope: undefined },
        { label: 'accent red', scope: { 'data-bb-accent': 'red' } },
        { label: 'base stone', scope: { 'data-bb-base': 'stone' } },
        {
          label: 'both',
          scope: { 'data-bb-accent': 'red', 'data-bb-base': 'stone' }
        }
      ].map(({ label, scope }) => (
        <Panel key={label} label={label} mode="light" scope={scope}>
          <div className="catalog-row">
            <Badge tone="accent">accent</Badge>
            <Badge tone="danger">danger</Badge>
            <Badge tone="warning">warning</Badge>
            <Badge tone="success">success</Badge>
            <Badge tone="info">info</Badge>
          </div>
        </Panel>
      ))}
    </div>
  )
};

/**
 * The scope INSIDE the mode, which is the arrangement a real application is in.
 *
 * An app sets `data-bb-mode` once, high up, and a scope lands somewhere under
 * it. Doc 03 §3.2 says the mode goes outermost, and the thing that has to be
 * true for that to work is that the dark mapping survives a scope re-declaring
 * the light one — measured here as a raised surface still sitting above the
 * page rather than level with it.
 */
export const Nesting: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['light', 'dark'] as const).map(mode => (
        <div key={mode} className="catalog-panel" data-bb-mode={mode}>
          <p className="catalog-label">{mode} · scope inside the mode</p>
          <div className="catalog-stack">
            {['red', 'amber'].map(accent => (
              <div
                key={accent}
                data-bb-accent={accent}
                style={{
                  background: 'var(--bb-surface-raised)',
                  color: 'var(--bb-text)',
                  borderRadius: 'var(--bb-radius-md)',
                  padding: 12
                }}
              >
                <p className="catalog-label">{accent}</p>
                <Sample />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
};
