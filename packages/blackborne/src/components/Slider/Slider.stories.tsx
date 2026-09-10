/*
 * The visual catalog for Slider.
 *
 * WHAT TO LOOK AT is the rail against the thumb. The rail is `Progress`'s
 * track down to the token — a well in `surface-sunken` with the accent filling
 * it — and the thumb is a circle bigger than the rail is thick, sitting on top
 * of it. The two have to read as one control rather than as a bar with a dot
 * near it.
 *
 * `Interaction` is the one that cannot be reached by looking at the component
 * in the catalog: hover, focus and dragging are all states of the thumb, and
 * the last one only exists while a pointer is held down.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ConfigProvider } from '../../config';
import { Force, type ForcedState } from '../../catalog/forceState';
import { Slider } from './Slider';

/*
 * One scope of the theme axes, with a label — AND A DECLARED LOCALE, which
 * this component needs and most do not.
 *
 * Two reasons, both measured. The number is formatted by the base through the
 * locale it is given, so a story that declares none is photographed in
 * whatever locale the machine happens to have, which is doc 10 §11 exactly.
 * And the direction is read from the locale by the base's JAVASCRIPT, not from
 * the `dir` attribute: with `dir="rtl"` alone the fill flipped and the thumb
 * did not — measured, the thumb's centre at 30% from the left of the rail
 * while the fill occupied the right 30%, a handle at the wrong end of its own
 * fill. `ConfigProvider` supplies both.
 */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  locale = 'en-US',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  locale?: string;
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider locale={locale}>
      <div
        className="catalog-panel"
        data-bb-mode={mode}
        data-bb-density={density}
        dir={dir}
        style={{ width: 320 }}
        {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
      >
        <p className="catalog-label">{label}</p>
        {children}
      </div>
    </ConfigProvider>
  );
}

const meta = {
  title: 'Components/Slider',
  component: Slider,
  args: { label: 'Opacity', defaultValue: 40 }
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working slider.
 *
 * **Worth doing with the keyboard**: `Tab` reaches the thumb, the arrows move
 * it one step, `PageUp` and `PageDown` move it further, and `Home` and `End`
 * go to the ends. None of that is ours — it is what the base's range input
 * gives, which is the reason this is not a div with a drag handler.
 *
 * Note the two callbacks. This one reports on `onChangeEnd`, so the number
 * below settles when the drag stops; `onChange` fires on every step, which is
 * what a preview wants and a request does not.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [live, setLive] = useState(40);
      const [settled, setSettled] = useState(40);

      return (
        <ConfigProvider locale="en-US">
          <div className="catalog-stack" style={{ width: 320 }}>
            <Slider
              {...args}
              value={live}
              onChange={setLive}
              onChangeEnd={setSettled}
              maxValue={100}
            />
            <p className="catalog-label">
              {`onChange: ${live} · onChangeEnd: ${settled}`}
            </p>
          </div>
        </ConfigProvider>
      );
    }

    return <Demo />;
  }
};

/**
 * Every state worth looking at, in both modes.
 *
 * **A percentage needs its step.** The base snaps the initial value to the
 * step and the default step is 1 — measured, `0.4` on a `0..1` range with no
 * step reports `0`, so the percentage row here declares `step={0.01}`.
 *
 * **There is no invalid state** and no `errorMessage`. A value is clamped to
 * the range and snapped to the step, so there is no way to hold one that is
 * wrong; a rule about acceptable values is a rule about `minValue` and
 * `maxValue`.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            <Slider label="Opacity" defaultValue={40} maxValue={100} />
            <Slider
              label="Sample rate"
              defaultValue={0.4}
              maxValue={1}
              step={0.01}
              formatOptions={{ style: 'percent' }}
              description="Higher values cost more to render"
            />
            <Slider
              label="Threshold"
              defaultValue={80}
              maxValue={100}
              isValueHidden
            />
            <Slider
              label="Volume"
              defaultValue={20}
              maxValue={100}
              isLabelHidden
            />
            <Slider
              label="Weight"
              defaultValue={60}
              maxValue={100}
              isDisabled
            />
            <Slider label="At the end" defaultValue={100} maxValue={100} />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * THE THUMB'S THREE STATES, forced so they can be photographed.
 *
 * Dragging is the one that matters and the one nothing else in this library
 * has: it exists only while a pointer is held down, so it cannot be seen by
 * poking at the component in a catalog. Doc 09 §3 asks for a visible response
 * to every interaction, and the fill moving is the VALUE responding rather
 * than the handle.
 */
export const Interaction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            {(
              [
                ['Hovered', 'data-hovered'],
                ['Focused', 'data-focused'],
                ['Dragging', 'data-dragging']
              ] as const satisfies readonly (readonly [string, ForcedState])[]
            ).map(([name, state]) => (
              <Force key={name} state={state} target=".bb-slider-thumb">
                <Slider label={name} defaultValue={40} maxValue={100} />
              </Force>
            ))}
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL, where the fill grows from the other end.
 *
 * **The locale is what does it, not the `dir` attribute.** The fill's offset is
 * `insetInlineStart`, a logical CSS property, so the stylesheet flips it for
 * free. The thumb's position is a computed `left` percentage that the base
 * mirrors only when the LOCALE it was given is right-to-left — so a story with
 * `dir="rtl"` and no locale draws the fill at one end and the handle at the
 * other. Measured, before this story declared `ar-EG`.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <Scope label="العربية" dir="rtl" locale="ar-EG">
        <div className="catalog-stack">
          <Slider label="الشفافية" defaultValue={30} maxValue={100} />
          <Slider
            label="الحجم"
            defaultValue={70}
            maxValue={100}
            description="القيم الأعلى تستهلك المزيد"
          />
        </div>
      </Scope>
    </div>
  )
};

/**
 * Compact density.
 *
 * Three things move and one does not. The thumb shrinks with every other box
 * in the library (20px to 16px), the gaps close, and the type stays where it
 * is — compact trims air, not legibility. What does not move is the TARGET:
 * the track's floor is 28px and 24px, and 24 is the minimum at every density
 * (doc 06 §3). The rail's own 8px is fixed too, the same thickness
 * `Progress` draws.
 */
export const Compact: Story = {
  render: () => (
    <Scope label="Compact" density="compact">
      <div className="catalog-stack">
        <Slider label="Opacity" defaultValue={40} maxValue={100} />
        <Slider
          label="Sample rate"
          defaultValue={70}
          maxValue={100}
          description="The thumb shrinks and the target does not"
        />
      </div>
    </Scope>
  )
};

/** An overridden brand, which the fill and the thumb's edge both follow. */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: () => (
    <Scope label="Overridden brand" brand>
      <div className="catalog-stack">
        <Slider label="Opacity" defaultValue={40} maxValue={100} />
        <Force state="data-focused" target=".bb-slider-thumb">
          <Slider label="Focused" defaultValue={70} maxValue={100} />
        </Force>
      </div>
    </Scope>
  )
};
