/*
 * The visual catalog for ColorPicker.
 *
 * WHAT TO LOOK AT is the thumb, in all four places it appears. Every other
 * handle in this library sits on a surface the library chose; this one sits on
 * the colour itself, anywhere in a gradient — so a single ring in any one
 * token is invisible against half of it. It carries a light ring and a dark
 * one, and `Opened` is where that either holds across the whole area or does
 * not.
 *
 * THE LAYER IS OPENED BY PRESSING THE TRIGGER, not by a prop. `DatePicker`
 * established that: a story needs the layer open to be photographed, the base
 * has a `defaultOpen`, and a prop this library exposes has to be earned by a
 * place that needs it today — a screenshot is not one (rule 8). So the story
 * does what a person does.
 */
import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorPicker } from './ColorPicker';
import { ConfigProvider } from '../../config';
import { LayerPage } from '../../catalog/layerPage';

/** Presses the trigger on the next paint, the way the date picker's does. */
function Opened({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current
        ?.querySelector<HTMLElement>('.bb-color-picker-trigger')
        ?.click();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/*
 * THE OPEN STORIES USE `LayerPage`, AND THE FIRST BASELINE IS WHY.
 *
 * A `catalog-panel` with `data-bb-mode="dark"` on it dresses everything
 * INSIDE it — and a layer is portalled to `document.body`, which is outside.
 * So the first dark picture showed a light panel of gradients floating over a
 * dark card: the theme scope and the layer were in different trees.
 *
 * `LayerPage` is the theme scope AND the portal container, which is the whole
 * reason it exists. It also solves the other half a `minHeight` was propping
 * up: the captured element has to contain the layer for it to be photographed
 * at all.
 */

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  args: { label: 'Brand colour' }
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Four ways to one value.
 *
 * **Drag in the area** for saturation and brightness, **the slider** for hue,
 * **or type the hex** if you already know it. Every one of them is
 * keyboard-operable — the arrows move in the area as well as on the sliders —
 * which is the thing that usually makes a colour picker fail this library's
 * entry gate.
 *
 * Note the value below: it is a string in the declared format, never the
 * base's `Color` object and never `toString()`'s default. After a drag in the
 * area the colour's own space is `hsb`, so the default would have reported
 * `hsb(226, 72%, 87%)` to a project that wanted hex.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [colour, setColour] = useState('#3e63dd');

      return (
        <ConfigProvider>
          <div className="catalog-stack" style={{ width: 280 }}>
            <ColorPicker {...args} value={colour} onChange={setColour} />
            <p className="catalog-label">{`Value: ${colour}`}</p>
          </div>
        </ConfigProvider>
      );
    }

    return <Demo />;
  }
};

/**
 * THE LAYER, OPEN, in both modes.
 *
 * The thumb is the thing to read. It sits on the colour itself, so it carries
 * a light ring and a dark one — the calendar's rule that a ring is the text
 * colour of what it sits on cannot be applied here, because what it sits on is
 * unknown by construction.
 *
 * The panel declares a width, which doc 04 §4.3 requires of a layer that says
 * anything about its own size — and here it is what the area is a fraction of.
 * A gradient has no content to be sized by.
 */
export const Opened_: Story = {
  name: 'Opened',
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <LayerPage
          key={label}
          mode={mode}
          label={`${label} — the page behind.`}
        >
          <div style={{ width: 260 }}>
            <Opened>
              <ColorPicker label="Brand colour" defaultValue="#3e63dd" />
            </Opened>
          </div>
        </LayerPage>
      ))}
    </div>
  )
};

/**
 * WITH TRANSPARENCY, which is a second slider and a format that can carry it.
 *
 * `hex` drops the alpha silently — measured — so this combination says so in
 * development. Here the format is `hexa`, and the value below has eight
 * digits.
 */
export const WithAlpha: Story = {
  name: 'With transparency',
  render: () => {
    function Demo() {
      const [colour, setColour] = useState('#3e63dd80');

      return (
        <LayerPage label="Transparency — the page behind.">
          <div style={{ width: 260 }}>
            <Opened>
              <div className="catalog-stack">
                <ColorPicker
                  label="Brand colour"
                  value={colour}
                  onChange={setColour}
                  format="hexa"
                  hasAlpha
                />
                <p className="catalog-label">{`Value: ${colour}`}</p>
              </div>
            </Opened>
          </div>
        </LayerPage>
      );
    }

    return <Demo />;
  }
};

/**
 * EVERY STATE of the field itself, closed.
 *
 * There is no empty one, and that is the base's shape rather than an omission:
 * a two-dimensional area always points somewhere, so the state falls back to
 * black and its setter refuses null. Where "no colour" is a real state it
 * belongs to something beside this field.
 */
export const States: Story = {
  render: () => (
    <ConfigProvider>
      <div className="catalog-pair">
        {(
          [
            ['Light', 'light'],
            ['Dark', 'dark']
          ] as const
        ).map(([label, mode]) => (
          <div
            key={label}
            className="catalog-panel"
            data-bb-mode={mode}
            style={{ width: 280 }}
          >
            <p className="catalog-label">{label}</p>
            <div className="catalog-stack">
              <ColorPicker label="Default" defaultValue="#3e63dd" />
              <ColorPicker label="In rgb" defaultValue="#30a46c" format="rgb" />
              <ColorPicker
                label="With help"
                defaultValue="#f76b15"
                description="Used across the whole workspace"
              />
              <ColorPicker
                label="Invalid"
                defaultValue="#e5484d"
                isInvalid
                errorMessage="That colour is too light for text"
              />
              <ColorPicker label="Disabled" defaultValue="#8e4ec6" isDisabled />
            </div>
          </div>
        ))}
      </div>
    </ConfigProvider>
  )
};

/** Every size, so the field lines up with a control beside it. */
export const Sizes: Story = {
  render: () => (
    <ConfigProvider>
      <div className="catalog-panel" style={{ width: 280 }}>
        <p className="catalog-label">Sizes</p>
        <div className="catalog-stack">
          {(['sm', 'md', 'lg'] as const).map(size => (
            <ColorPicker
              key={size}
              label={size}
              size={size}
              defaultValue="#3e63dd"
            />
          ))}
        </div>
      </div>
    </ConfigProvider>
  )
};

/** RTL, where the field's row changes hands and the gradients do not. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <LayerPage dir="rtl" locale="ar-EG" label="الصفحة خلفه.">
      <div style={{ width: 260 }}>
        <Opened>
          <ColorPicker label="لون العلامة" defaultValue="#3e63dd" />
        </Opened>
      </div>
    </LayerPage>
  )
};
