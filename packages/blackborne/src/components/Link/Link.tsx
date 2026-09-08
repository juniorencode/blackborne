import { forwardRef } from 'react';
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';

/*
 * The ink. There is no shared block with `Button variant="link"`, and that is
 * the measurement rather than an omission.
 *
 * Decision 0016 predicted the appearance would be extracted and shared the way
 * the cross and the tone surfaces were, with no visual baseline moving. Laid
 * side by side, the two overlap in exactly two classes — `underline-offset-4`
 * and the two colour tokens — because they are deliberately DIFFERENT:
 *
 *   Button variant="link"  ordinary text at rest, accent and underlined on
 *                          hover, no ring (the underline replaces it)
 *   Link                   accent and underlined at rest, deeper on hover,
 *                          and a ring
 *
 * Button's own file says why in as many words: its link variant takes the
 * ordinary text colour "deliberately NOT the accent, so it does not compete
 * with a real link, which is what accent-coloured text means everywhere else".
 * A shared module would have to be parameterised into two opposite defaults,
 * which is a module that exists to hold an if. The correction is recorded in
 * the decision.
 *
 * UNDERLINED AT REST, which is not decoration. Doc 06 §3: colour is never the
 * only channel, and a link inside a paragraph has nothing else to distinguish
 * it. It is also the one place in this library where an underline appears at
 * rest, which is what makes it recognisable as a link and not as a button
 * wearing accent text.
 *
 * THE FOCUS RING IS AN OUTLINE HERE, and it is the first in the library. Every
 * other control rings with a border in the ring colour plus a halo, and
 * neither works on a run of text: a border on an inline element widens its
 * inline box, so the words after it move two pixels sideways every time focus
 * lands — and a halo with no crisp edge is a weak indicator on a transparent
 * background. An outline paints outside the box without taking part in layout,
 * and on a link that wraps it follows each fragment, which is the behaviour a
 * browser's own focus ring has for the same reason. Doc 06 §3 permits changing
 * the indicator and never removing it; the check that the text does not move
 * is what keeps this honest.
 *
 * `cursor` is not set. An anchor with an href gets `pointer` from the browser,
 * and unlike `Button` — where the element is a `<button>` and would get
 * `default` — there is nothing to correct.
 */
const LINK = cx(
  'bb:font-sans bb:text-link',
  'bb:underline bb:underline-offset-4 bb:decoration-1',
  'bb:transition-[color,text-decoration-thickness]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  /*
   * Hover deepens the colour AND thickens the rule, so the change is not
   * carried by colour alone — the same rule doc 06 §3 applies to state applies
   * to a state that only a pointer can reach.
   *
   * Pressed is deliberately the same as hover. A link navigates on release, so
   * a third appearance would be a frame almost nobody sees, and the two
   * remaining tokens — `--bb-link` and `--bb-link-active` — are enough for
   * three states without inventing a `--bb-link-hover` that doc 03's catalog
   * would then have to carry forever.
   */
  'bb:data-hovered:text-link-active bb:data-hovered:decoration-2',
  'bb:data-pressed:text-link-active bb:data-pressed:decoration-2',
  'bb:data-focused:outline-2 bb:data-focused:outline-focus-ring',
  'bb:data-focused:outline-offset-2'
);

export interface LinkProps extends Pick<
  AriaLinkProps,
  'target' | 'rel' | 'download'
> {
  /**
   * Where it goes. **Required**, and that is the component's whole reason to
   * exist: an anchor with an address is what a browser can open in a new tab,
   * offer to copy, and list among a page's links.
   *
   * A link without one is a button — see `Button variant="link"`, which is for
   * an action that should weigh almost nothing.
   */
  href: string;
  /** The text. A link is named by what it says, so this is never empty. */
  children: React.ReactNode;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A link: text that navigates.
 *
 * ```tsx
 * <Link href="/customers/4821">Astilleros del Sur</Link>
 * ```
 *
 * ## Which one is this
 *
 * > **`Link` navigates. `Button` acts** — including `Button variant="link"`.
 *
 * The test is whether there is an address. If the thing has one, an anchor is
 * the right element and everything a browser does with links comes free:
 * middle-click, ctrl-click, "copy link address", and the list a screen reader
 * builds of a page's links. If pressing it runs a function, it is a button
 * whatever it is wearing. Doc 02 §7.1.
 *
 * ## Client-side navigation
 *
 * By default a press does what an anchor has always done: it loads the page.
 * In a single-page application that is a restart, so pass your router's
 * navigate function once, to the provider:
 *
 * ```tsx
 * <ConfigProvider navigate={href => router.push(href)}>
 * ```
 *
 * Every link below it then goes through your router — and a ctrl-click, a
 * middle-click, a `target` or a `download` still opens a new tab or downloads,
 * because the base checks all of that before handing the press over. The
 * library adds no router and requires none (decision 0016).
 *
 * ## No `isDisabled`
 *
 * Read in the installed source rather than guessed: with an anchor element the
 * base's `useLink` adds `aria-disabled` **and nothing else** — the `href`
 * stays, the element stays in the tab order, and the browser still follows it.
 * So the prop would announce something the component cannot deliver, which is
 * worse than not having it.
 *
 * A link that must not be followed is not a link. It is text, or it is the
 * current page — which is what `aria-current` is for, on the component that
 * knows it is a navigation.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { children, className, style, ...linkProps },
  ref
) {
  return (
    <AriaLink
      ref={ref}
      className={cx(LINK, className)}
      {...linkProps}
      {...(style === undefined ? {} : { style })}
    >
      {children}
    </AriaLink>
  );
});
