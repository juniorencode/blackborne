import { useState } from 'react';
import { ConfigProvider } from '../config';

/*
 * The page a layer story is shown on: one theme scope, and the element the
 * layer is portalled into.
 *
 * ## Why it is shared
 *
 * It was copied seven times — one per layer — and every copy was
 * near-identical: the same scope attributes, the same `useState` for the host,
 * the same `ConfigProvider`, the same one-render delay before the children
 * appear. What differed was small and mechanical: three centred their content
 * and four did not, four carried a line of prose above it and three did not,
 * and one each wanted a greyscale filter and the alternate brand.
 *
 * This commit is the extraction ALONE, and it is deliberately faithful: the
 * centring stays where the copies had it, on the host. Nothing about the
 * rendered page changes, which is what makes the property attached to this
 * commit checkable — **no visual baseline may move.** Seven files at once is
 * exactly where a refactor needs that property stated and verified rather than
 * assumed.
 *
 * There is a bug in what is being copied. It is not fixed here.
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
   * layer is inside it. Put on an inner wrapper instead — the obvious place —
   * and the dialog escapes it entirely: it is portalled to this element, not
   * to the wrapper. Measured, and the story showed full colour while claiming
   * to be the greyscale check.
   */
  isGreyscale?: boolean;
  /** A line of prose above the content. The scrim needs something to cover. */
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
      {...(centred ? { 'data-centred': 'true' } : {})}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
      {...(isGreyscale ? { style: { filter: 'grayscale(1)' } } : {})}
    >
      {label === undefined ? null : <p className="catalog-label">{label}</p>}
      {/*
       * Nothing renders until the host exists, because the provider needs the
       * element and a ref callback runs after the first paint. One render's
       * delay, and it is the reason this is `useState` rather than `useRef`.
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
