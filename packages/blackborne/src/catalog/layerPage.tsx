import { useState } from 'react';
import { ConfigProvider } from '../config';

/*
 * The page a layer story is shown on: one theme scope, and the element the
 * layer is portalled into.
 *
 * ## Why it is shared
 *
 * It was copied seven times, and what forced the extraction is that one of the
 * copies had a bug — which means three of them did. It went unnoticed for six
 * components because nothing looked wrong (see below), and a defect that has
 * to be fixed in seven files is a defect that will be fixed in five.
 *
 * The extraction landed on its own, faithful, with the property that no
 * baseline moved. This is the commit that changes behaviour.
 *
 * ## The bug, measured
 *
 * The host is also the portal container, so an open layer is a CHILD of this
 * element. In the three copies that centred their content with
 * `display: grid; place-items: center`, that child became a **grid item**: the
 * base's overlay wrapper is `position: static`, so it takes part in layout.
 *
 * Two auto-sized rows in a grid taller than its contents share the free space
 * between them — `place-items` sets `align-items`, not `align-content` — so
 * opening a tooltip gave the trigger half the page instead of all of it, and
 * the trigger moved. Measured on `Tooltip / RTL`:
 *
 *   trigger before opening the tooltip : y = 441
 *   trigger after                      : y = 239   ← 202px, under the pointer
 *
 * Nothing looked wrong because the shifted layout is what every baseline of an
 * open anchored layer was generated from. What DID go wrong was intermittent
 * and looked like something else: the base positions a layer against the
 * trigger's box, the box then moves, and whether the reposition lands before
 * an assertion is a race. Three separate checks failed that way under load and
 * passed in isolation.
 *
 * It is also doc 09 §7 — "nothing moves under the cursor" — broken by the
 * catalog itself, in the fixture for the components that rule is most about.
 *
 * ## The fix
 *
 * The host stops being the element that lays anything out. It is a flex
 * column; the label and the stage are its items; and a layer portalled into it
 * arrives as a third item whose height is zero, because everything a layer
 * paints is absolutely or fixed positioned. The stage claims the leftover
 * height with `flex: 1`, so the zero-height item cannot take any of it back.
 *
 * The centring that three of the copies wanted now happens INSIDE the stage,
 * where a portalled layer never lands.
 */

interface LayerPageProps {
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  /** A BCP-47 tag. Left out means the provider's default. */
  locale?: string;
  dir?: 'ltr' | 'rtl';
  /** The catalog's alternate brand, for the theme-override stories. */
  brand?: boolean;
  /**
   * Greyscale, for the "colour is not the only channel" check (doc 06 §3).
   *
   * The filter goes on the HOST, which is also the portal container, so the
   * layer is inside it. Put on the stage instead — the obvious place — and the
   * dialog escapes it entirely: it is portalled to this element, not to the
   * stage. Measured, and the story showed full colour while claiming to be the
   * greyscale check.
   */
  isGreyscale?: boolean;
  /** A line of prose above the stage. The scrim needs something to cover. */
  label?: string;
  children: React.ReactNode;
}

function Page({
  mode = 'light',
  density = 'normal',
  locale,
  dir = 'ltr',
  brand = false,
  isGreyscale = false,
  label,
  centred,
  children
}: LayerPageProps & { centred: boolean }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  return (
    <div
      className="catalog-layer-page"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      ref={setHost}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
      {...(isGreyscale ? { style: { filter: 'grayscale(1)' } } : {})}
    >
      {label === undefined ? null : <p className="catalog-label">{label}</p>}
      <div
        className="catalog-layer-stage"
        {...(centred ? { 'data-centred': 'true' } : {})}
      >
        {/*
         * Nothing renders until the host exists, because the provider needs
         * the element and a ref callback runs after the first paint. One
         * render's delay, and it is the reason this is `useState` rather than
         * `useRef`.
         */}
        {host === null ? null : (
          <ConfigProvider
            portalContainer={host}
            {...(locale === undefined ? {} : { locale })}
          >
            {children}
          </ConfigProvider>
        )}
      </div>
    </div>
  );
}

/**
 * A page for a layer that covers or pins itself: a dialog, a drawer, a
 * confirmation, a notice. Content starts at the top, as a page's does.
 */
export function LayerPage(props: LayerPageProps): React.ReactNode {
  return <Page {...props} centred={false} />;
}

/**
 * A page for a layer ANCHORED to a control: a tooltip, a popover, a preview.
 *
 * The trigger sits in the middle, and that is not decoration — an anchored
 * layer is placed on one of twelve sides of it (doc 02 §3.3), and a trigger
 * against an edge of the window makes the base flip the ones that will not
 * fit. The stories that demonstrate a placement need room on every side of it.
 */
export function CentredLayerPage(props: LayerPageProps): React.ReactNode {
  return <Page {...props} centred={true} />;
}
