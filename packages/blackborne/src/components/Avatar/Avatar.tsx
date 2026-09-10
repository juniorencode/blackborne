import { forwardRef, useState } from 'react';
import { cx } from '../../internal/cx';

export type AvatarSize = 'sm' | 'md' | 'lg';

/*
 * THE CONTROL HEIGHTS, and not a scale of its own.
 *
 * An avatar sits in a row with things: a button, a field, a table cell. Sizing
 * it off `--bb-control-height-*` is what keeps that row aligned, and it makes
 * compact density free — those tokens already move, so an avatar in a dense
 * table shrinks with the row rather than being the one thing that did not get
 * the message (doc 03 §3).
 *
 * The type size goes with it, because initials in a 48px circle and initials
 * in a 32px one are not the same problem. `Button`'s own three sizes use these
 * three type steps, so nothing new is invented here either.
 *
 * AND THE WIDTH COMES FROM `aspect-square`, not from a token. The theme has
 * `--height-control-*` and no `--width-control-*`, which is right: a control's
 * width is its contents. So `w-control-md` would have compiled to NOTHING and
 * left a circle with a height and no width — the same trap the theme's own
 * comment records for `min-w-hit`, and the same way to check it, which is to
 * grep the compiled stylesheet. A square element takes its width from its
 * height instead, and one ratio serves all three sizes.
 */
const SIZE: Record<AvatarSize, string> = {
  sm: 'bb:h-control-sm bb:text-xs',
  md: 'bb:h-control-md bb:text-md',
  lg: 'bb:h-control-lg bb:text-lg'
} satisfies Record<AvatarSize, string>;

/*
 * `overflow-hidden` so a rectangular photograph is clipped to the circle, and
 * `flex-none` because an avatar in a flex row must never be the thing that
 * shrinks — a squashed face reads as a bug and a squashed initial reads as a
 * different letter.
 *
 * THE BORDER IS NOT DECORATION. An avatar holds an image the library has never
 * seen, and a photograph with pale edges on a pale surface has no edge at all.
 * `--bb-border` at 1px is the same argument doc 03 §5 makes about a graphical
 * element needing to be distinguishable from what it sits on, arriving on the
 * one component whose contents nobody can predict.
 */
const ROOT = cx(
  'bb-avatar',
  'bb:box-border bb:flex bb:aspect-square bb:flex-none bb:items-center',
  'bb:justify-center',
  'bb:overflow-hidden bb:rounded-full bb:border bb:border-solid',
  'bb:border-border bb:bg-surface-control bb:text-surface-control-on',
  'bb:font-sans bb:font-strong bb:leading-none bb:select-none'
);

/*
 * The image fills the box and keeps its own proportions, which is what
 * `object-cover` is for: a portrait and a landscape both end up as a circle
 * with the middle of the picture in it, rather than one of them stretched.
 */
const IMAGE = cx('bb-avatar-image', 'bb:h-full bb:w-full bb:object-cover');

/*
 * THE FALLBACK'S SLOT SIZES WHAT ARRIVES IN IT, which is doc 02 §11's own
 * convention and was missing from the first version of this file. The first
 * baseline is what found it: a silhouette passed in as an svg rendered as an
 * EMPTY CIRCLE, because an svg with a `viewBox` and no dimensions has no size
 * of its own to fall back on and this slot gave it none.
 *
 * `em` rather than a token, so the glyph follows the same scale the letters
 * do: one rule covers all three sizes, because the type size is what changes
 * between them.
 *
 * `truncate` for the other direction — a fallback wider than its circle would
 * paint over whatever is beside it, and an avatar in a row is always beside
 * something.
 */
const FALLBACK = cx(
  'bb-avatar-fallback',
  'bb:truncate bb:px-0.5',
  'bb:[&>svg]:h-[1.5em] bb:[&>svg]:w-[1.5em] bb:[&>svg]:flex-none'
);

export interface AvatarProps {
  /**
   * Whose it is, in full. It is the accessible name and it is required —
   * "Carlos Ramos", not "CR".
   *
   * The library will not derive one from the other: turning a name into
   * initials is a locale-dependent transformation and doc 05 §4.2 has the
   * list of languages it fails in. So the two channels carry different things,
   * and this is the one a screen reader gets.
   */
  name: string;
  /**
   * What shows when there is no image, or when the image does not arrive.
   * **Required**, for the same reason a label is: an avatar with nothing in it
   * is a grey circle, which says less than one letter would.
   *
   * Initials, a monogram, a silhouette the consumer already owns — it arrives
   * as children the way an icon does (doc 02 §11), because only the project
   * knows how names are written where its people are.
   */
  children: React.ReactNode;
  /** The picture. Absent, or failing to load, and the children show instead. */
  src?: string;
  /**
   * Hide it from assistive technology, for an avatar sitting beside the name
   * it belongs to.
   *
   * The arrangement `Spinner` has, and for the same reason: the alternative is
   * a screen reader saying "Carlos Ramos" twice in one breath, once for the
   * face and once for the text next to it. Named or decorative, never neither.
   */
  isDecorative?: boolean;
  /** Height, width and type size. Aligns with a control of the same size. */
  size?: AvatarSize;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * A picture of somebody, with something in its place when there is none.
 *
 * ```tsx
 * <Avatar name="Carlos Ramos" src={photo}>
 *   CR
 * </Avatar>
 * ```
 *
 * ## What it is, precisely
 *
 * A box holding an image that may not arrive, with something in its place.
 * That is the whole of it, and it is worth saying plainly because the piece
 * underneath is the one a file uploader's thumbnails will want — the same
 * mechanism, with a glyph for the file's type instead of initials.
 *
 * ## It does not make the initials
 *
 * Doc 05 §4.2, written with this component: "CR" from "Carlos Ramos" looks
 * like string handling and is a transformation of a person's NAME, which fails
 * in more languages than it works in. A Japanese name has no space to split
 * on; Arabic is read the other way, so the first letter is not the first
 * character; a Spanish surname comes in pairs and "de la Cruz" yields "D" from
 * any rule short enough to write.
 *
 * So the fallback arrives as children and the full name arrives as a prop. The
 * screen shows what the project decided; a screen reader gets the name.
 *
 * ## Named or decorative, and never neither
 *
 * `name` is required and `isDecorative` decides whether it is announced. An
 * avatar next to the name it belongs to is decorative — otherwise a reader
 * hears it twice — and an avatar standing alone in a row is not. There is no
 * third state, which is what keeps an unnamed picture of a person from being
 * expressible at all.
 *
 * ## What it is not
 *
 * **Not a loading state.** An avatar waiting for data is
 * `<Skeleton variant="circle" />`, which exists.
 *
 * **Not a group.** A row of overlapping faces with "+3" at the end is a second
 * component: the number is a count of children, which is the constraint
 * decision 0018 records, and "+{n}" is a string with a placeholder in it.
 * It has a row of its own rather than a prop here.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, children, src, isDecorative = false, size = 'md', className },
  ref
) {
  /*
   * THE SRC THAT FAILED, rather than a boolean.
   *
   * A boolean would have to be reset when `src` changes, which is an effect
   * that runs after a paint — so the moment a consumer swaps one person for
   * another, the new image is shown as broken for a frame, or worse, never
   * tried at all. Remembering WHICH url failed makes the comparison the state
   * itself: a new url has not failed, so it is attempted.
   */
  const [failed, setFailed] = useState<string | null>(null);
  const shows = src !== undefined && src !== '' && failed !== src;

  return (
    <span
      ref={ref}
      className={cx(ROOT, SIZE[size], className)}
      data-size={size}
      /*
       * `role="img"` ON THE BOX, with the name on it, and the reason is the
       * FALLBACK rather than the image.
       *
       * An `<img alt="Carlos Ramos">` names itself perfectly well. Initials
       * cannot: their accessible name would be "CR", which is what the screen
       * says and not what the person is called. So the name lives one level up
       * and the same element carries it either way — measured, and that half
       * holds: the accessible name is "Carlos Ramos" whether the picture
       * arrived or not.
       *
       * WHAT IS NOT SETTLED is whether a reader also says the letters. The
       * ARIA specification marks `img` as "children presentational", so it
       * should not — and an aria snapshot reads
       * `- img "Ana Vega": AV`, with the text still in the node. The tool does
       * not answer it, so the question is on doc 06 §5's list rather than
       * asserted here as though it were.
       */
      {...(isDecorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': name })}
    >
      {shows ? (
        <img
          className={IMAGE}
          src={src}
          /*
           * EMPTY ON PURPOSE. The box above is `role="img"` and carries the
           * name, so an `alt` here would be the second copy of it — the same
           * thing being said twice, which is doc 06 §3's noise.
           */
          alt=""
          /*
           * `lazy`, and it is the component's decision rather than a prop
           * because of where an avatar lives: a table of fifty rows with a
           * face in each is fifty requests on mount, and that is exactly the
           * screen this library is for. A browser loads an above-the-fold
           * image eagerly anyway, so the hint costs nothing where it does not
           * apply.
           */
          loading="lazy"
          onError={() => {
            setFailed(src);
          }}
        />
      ) : (
        <span className={FALLBACK}>{children}</span>
      )}
    </span>
  );
});
