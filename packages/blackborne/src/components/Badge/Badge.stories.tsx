/*
 * The visual catalog for Badge.
 *
 * Several checkboxes on the entry gate can only be ticked here: every state
 * visible at once, light and dark side by side rather than toggled, both
 * densities, LTR next to RTL, and the component in a narrow container.
 *
 * This one carries a second job. Badge is the first component to read the
 * success, warning and info token families, in solid and in soft, so the grid
 * below is the first time those tokens have ever been on a screen. A token
 * nothing renders is a token nobody has checked.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, type BadgeTone, type BadgeVariant } from './Badge';
import { Button } from '../Button';
import { Force } from '../../catalog/forceState';

const VARIANTS = ['solid', 'soft'] as const satisfies readonly BadgeVariant[];

const TONES = [
  'neutral',
  'accent',
  'success',
  'warning',
  'danger',
  'info'
] as const satisfies readonly BadgeTone[];

/*
 * Fails to compile if a variant or a tone is added to the component and not to
 * the lists above.
 *
 * A plain `BadgeTone[]` annotation only checks that every entry IS a tone —
 * not that every tone is an entry. Button learned that the hard way: a variant
 * was added, every story that walks the list silently stopped being complete,
 * and the screenshots kept approving it. A catalog that covers less than it
 * appears to is worse than one that covers nothing, because it is trusted.
 */
const MISSING_VARIANTS: Exclude<BadgeVariant, (typeof VARIANTS)[number]>[] = [];
const MISSING_TONES: Exclude<BadgeTone, (typeof TONES)[number]>[] = [];
void MISSING_VARIANTS;
void MISSING_TONES;

/**
 * A panel carrying one combination of the three theme axes.
 *
 * `data-bb-theme` is what makes a brand override take effect: the semantic
 * tokens are recomputed inside that scope. Without it the override silently
 * does nothing (doc 03 §3.1).
 */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/**
 * The whole surface: both variants against all six tones.
 *
 * What to look at is the pairing. Every cell is a background and the text
 * colour declared for it, never one of each (doc 03 §4.0) — and the warning
 * row is the reason that rule exists: amber's solid step is a light colour, so
 * it is the one solid badge with dark text.
 */
function Grid() {
  return (
    <div className="catalog-stack">
      {VARIANTS.map(variant => (
        <div key={variant} className="catalog-row">
          <span
            className="catalog-label"
            style={{ width: 56, marginBlockEnd: 0 }}
          >
            {variant}
          </span>
          {TONES.map(tone => (
            <Badge key={tone} variant={variant} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

/*
 * A stand-in for whatever icon set a consumer uses, and it declares 24px on
 * purpose — which is what most sets ship.
 *
 * If the slot is doing its job the icon comes out at the library's size
 * anyway, because CSS beats the width and height attributes (doc 02 §11.2).
 * It is drawn in `currentColor`, which is the one condition the library cannot
 * enforce, so it inherits the badge's text colour in all twelve cells.
 */
function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Active', variant: 'soft', tone: 'neutral', dot: false },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    tone: { control: 'select', options: TONES },
    onRemove: { control: false }
  }
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The interactive one. Change variant, tone and dot from the controls panel. */
export const Playground: Story = {};

export const Tones: Story = {
  render: () => <Grid />
};

/**
 * The dot, on both variants.
 *
 * It is emphasis on a tone, not a channel of its own: in greyscale the success
 * dot and the danger dot are the same circle, so the word beside it is what
 * carries the meaning (doc 06 §3). Look at this story with the colour turned
 * off — that is the check, and the answer has to be "the text still says it".
 */
export const Dot: Story = {
  render: () => (
    <div className="catalog-stack">
      {VARIANTS.map(variant => (
        <div key={variant} className="catalog-row">
          {TONES.map(tone => (
            <Badge key={tone} variant={variant} tone={tone} dot>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  )
};

/**
 * An icon arrives as a child — there is no `icon` prop and there will not be
 * one (doc 02 §11.1).
 *
 * The icon in this story declares `width="24"`, the size most icon sets ship.
 * It renders at the library's standard size regardless, and in the badge's own
 * text colour, without the consumer configuring either.
 */
export const WithIcon: Story = {
  render: () => (
    <div className="catalog-stack">
      {VARIANTS.map(variant => (
        <div key={variant} className="catalog-row">
          {TONES.map(tone => (
            <Badge key={tone} variant={variant} tone={tone}>
              <CheckIcon />
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  )
};

/**
 * Removable badges, and the detail that is usually wrong.
 *
 * The cross is small and its target is not: the button measures a full
 * `--bb-control-hit-area` on both axes, which is the minimum doc 06 §3
 * requires at every density. Compare against the compact story below — the
 * chip gets shorter and the target does not fall under the minimum.
 *
 * Nothing here is removed by the badge. The list belongs to this story, which
 * is the point: the library reports the press and the project decides.
 */
function RemovableRow() {
  const initial = [
    { id: 'a', label: 'Status: active', tone: 'success' as BadgeTone },
    { id: 'b', label: 'Region: Lima', tone: 'neutral' as BadgeTone },
    { id: 'c', label: 'Overdue', tone: 'danger' as BadgeTone },
    { id: 'd', label: 'Created this month', tone: 'info' as BadgeTone }
  ];
  const [filters, setFilters] = useState(initial);

  return (
    <div className="catalog-stack">
      <div className="catalog-row">
        {filters.map(filter => (
          <Badge
            key={filter.id}
            tone={filter.tone}
            onRemove={() =>
              setFilters(current =>
                current.filter(other => other.id !== filter.id)
              )
            }
          >
            {filter.label}
          </Badge>
        ))}
      </div>
      <div className="catalog-row">
        <Button variant="subtle" size="sm" onPress={() => setFilters(initial)}>
          Reset the row
        </Button>
      </div>
    </div>
  );
}

export const Removable: Story = {
  render: () => <RemovableRow />
};

function AllStates() {
  return (
    <div className="catalog-stack">
      {VARIANTS.map(variant => (
        <div key={variant} className="catalog-row">
          <span
            className="catalog-label"
            style={{ width: 56, marginBlockEnd: 0 }}
          >
            {variant}
          </span>
          <Badge variant={variant} tone="danger" onRemove={() => {}}>
            default
          </Badge>
          <Force state="data-hovered">
            <Badge variant={variant} tone="danger" onRemove={() => {}}>
              hover
            </Badge>
          </Force>
          <Force state="data-pressed">
            <Badge variant={variant} tone="danger" onRemove={() => {}}>
              pressed
            </Badge>
          </Force>
          <Force state="data-focused">
            <Badge variant={variant} tone="danger" onRemove={() => {}}>
              focus
            </Badge>
          </Force>
        </div>
      ))}
      {/*
        A removable badge beside a static one, because that is the row this
        component is usually in and the pair that can break: the height comes
        from the hit-area token on BOTH, so adding `onRemove` does not resize
        anything and a filter row does not end up with two heights.
      */}
      <div className="catalog-row">
        <Badge tone="success" dot>
          Static
        </Badge>
        <Badge tone="success" dot onRemove={() => {}}>
          Removable
        </Badge>
        <Badge tone="success">
          <CheckIcon />
          With an icon
        </Badge>
      </div>
    </div>
  );
}

/**
 * Every state of the remove button, visible at once and without interaction.
 *
 * Hover, focus and pressed are normally reachable only by pointing at the
 * thing. `Force` puts the same DOM attributes React Aria puts there — the real
 * attribute the CSS targets, not a fake one — because a screenshot cannot
 * hover and the gate wants every state in the catalog.
 *
 * The badge itself has no states: it is a label, not a control. The only thing
 * that reacts here is the button, and its hover tint is mixed from the badge's
 * own text colour so it never leaves the tone's colour family.
 *
 * AND IT IS LIGHT AND DARK, both of them on this page. A forced-state story is
 * the only place these states are ever rendered, so a light-only one leaves
 * every one of them in dark mode unreachable by anything automated here — axe
 * reads what is on a page and the baselines photograph one. What lived in that
 * gap on `Button` was a pressed primary at 2.08:1 in dark, under 501 stories
 * and 211 baselines (doc 10 §11.9). The tint above is mixed from the badge's
 * text colour, which is a different colour in each mode, so the two panels are
 * two measurements rather than the same one twice.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllStates />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllStates />
      </Scope>
    </div>
  )
};

/**
 * Light and dark SIDE BY SIDE, never by toggling (doc 03 §6).
 *
 * This is the story the status families were waiting for. The solid state
 * colours are mapped separately in dark — a bright fill with dark text, rather
 * than the light-mode fill dimmed — and nothing had ever rendered them.
 */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Grid />
      </Scope>
      <Scope label="Dark" mode="dark">
        <Grid />
      </Scope>
    </div>
  )
};

/**
 * Density moves the chip and the target together, and no colour (doc 03 §3).
 *
 * The badge is as tall as `--bb-control-hit-area`, so compact takes it from
 * 28px to 24px — and 24 is the floor, because the minimum target holds at
 * every density (doc 06 §3). The text size does not move: compact trims air,
 * not legibility.
 */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Normal" density="normal">
        <div className="catalog-stack">
          <Grid />
          <div className="catalog-row">
            <Badge tone="warning" dot onRemove={() => {}}>
              Pending review
            </Badge>
          </div>
        </div>
      </Scope>
      <Scope label="Compact" density="compact">
        <div className="catalog-stack">
          <Grid />
          <div className="catalog-row">
            <Badge tone="warning" dot onRemove={() => {}}>
              Pending review
            </Badge>
          </div>
        </div>
      </Scope>
    </div>
  )
};

/**
 * LTR next to RTL. The dot moves to the other side, the remove button moves
 * with it, and no measurement in the component is physical — the negative
 * margin that makes the target reach the chip's edge is a logical one, so it
 * follows the writing direction rather than needing a second rule.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <div className="catalog-row">
          <Badge tone="success" dot>
            Active
          </Badge>
          <Badge tone="danger" onRemove={() => {}}>
            Overdue
          </Badge>
          <Badge tone="info" variant="solid">
            <CheckIcon />
            Verified
          </Badge>
        </div>
      </Scope>
      <Scope label="RTL" dir="rtl">
        <div className="catalog-row">
          <Badge tone="success" dot>
            نشط
          </Badge>
          <Badge tone="danger" onRemove={() => {}}>
            متأخر
          </Badge>
          <Badge tone="info" variant="solid">
            <CheckIcon />
            مُتحقق
          </Badge>
        </div>
      </Scope>
    </div>
  )
};

/**
 * A brand override, which is level 1 of the customisation contract: redefine
 * the scale and the semantic tokens recompute on their own.
 *
 * Only the accent tone moves. The status families are not the brand — a
 * success that turned violet because someone changed the brand colour would be
 * a defect, and this story is where that would show.
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <Grid />
      </Scope>
      <Scope label="Overridden brand · light" brand>
        <Grid />
      </Scope>
      <Scope label="Overridden brand · dark" mode="dark" brand>
        <Grid />
      </Scope>
    </div>
  )
};

/**
 * All three axes at once, plus RTL. Doc 03 §9 requires this combination
 * explicitly: component by component everything looks fine, and combined is
 * where the three greys you thought were one show up.
 */
export const AllAxes: Story = {
  render: () => (
    <Scope
      label="Dark · compact · RTL · overridden brand"
      mode="dark"
      density="compact"
      dir="rtl"
      brand
    >
      <div className="catalog-stack">
        <Grid />
        <div className="catalog-row">
          <Badge tone="warning" dot onRemove={() => {}}>
            قيد المراجعة
          </Badge>
        </div>
      </div>
    </Scope>
  )
};

/**
 * Pseudo-localisation. Doc 05 §8 calls this the highest-return test on its
 * list: lengthening every string by roughly 40% finds layout breaks in minutes
 * that otherwise surface the day someone translates to German.
 *
 * What to look for here: the label wraps and the chip grows, rather than the
 * text being cut or the row bursting. Nothing is sized to fit one particular
 * word, and the remove target does not shrink when the label gets long.
 */
const LONG: Record<BadgeTone, string> = {
  neutral: 'Sin asignar a ningún responsable',
  accent: 'Seleccionado para la revisión mensual',
  success: 'Aprobado por el área de contabilidad',
  warning: 'Pendiente de revisión documentaria',
  danger: 'Vencido hace más de treinta días',
  info: 'Creado durante el último cierre'
};

export const LongLabels: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <div className="catalog-row">
        {TONES.map(tone => (
          <Badge key={tone} tone={tone} dot>
            {LONG[tone]}
          </Badge>
        ))}
      </div>
      <div className="catalog-row">
        {TONES.map(tone => (
          <Badge key={tone} variant="solid" tone={tone} onRemove={() => {}}>
            {LONG[tone]}
          </Badge>
        ))}
      </div>
    </div>
  )
};

/**
 * The 320px container from the entry gate, pinned rather than dragged so it is
 * always checked. The window stays wide — that is the point.
 */
export const NarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack">
        <Grid />
        <div className="catalog-row">
          <Badge tone="danger" dot onRemove={() => {}}>
            Vencido hace más de treinta días
          </Badge>
        </div>
      </div>
    </div>
  )
};
