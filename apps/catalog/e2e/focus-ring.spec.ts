/*
 * THE FOCUS RING, AGAINST EVERY GROUND IT LANDS ON.
 *
 * Doc 03 §5 rule 2 asks 3:1 of a graphical element carrying information, and a
 * focus indicator is the purest example there is: it is the ONLY channel for
 * where the keyboard is. **Nothing measures it.** axe checks the contrast of
 * TEXT, and a border and a box-shadow are not text — which is the same gap
 * that let today's ring ship at 1.86:1, a range calendar's at 1.12:1 and a
 * disabled slider's fill at 1.00:1, all three found by a person opening a
 * picture.
 *
 * ## Why this cannot be derived the way the pairs are
 *
 * `contrast.spec.ts` reads its list out of the stylesheet, because `--bb-X-on`
 * is by definition the text on `--bb-X`. Nothing in the token layer says which
 * ground a ring lands on: that is a fact about each COMPONENT — a primary
 * button's edge is drawn on the accent fill, a table header's on the sunken
 * surface, a toast action's on a tone-subtle. So the registry below is
 * explicit, every row names what it stands for, and the whole file is only
 * worth as much as that list is honest.
 *
 * Two things keep it honest rather than hoped:
 *
 * - the last test reads a REAL focused control out of a story and checks that
 *   the colours the registry models are the colours the browser computed. A
 *   model of a ring is not a ring.
 * - `--bb-focus-ring` is re-pointed by some callers — to `--bb-danger` on an
 *   invalid field and on a danger button, to `transparent` on a link-shaped
 *   button, where an underline replaces it — so each row carries the ring it
 *   actually gets rather than assuming the default.
 *
 * ## What "against" means for a ring, which is the part that is easy to get
 * ## wrong
 *
 * A focused control has two boundaries and the indication only has to be
 * visible at one of them:
 *
 *   the 1px EDGE against the control's own fill      (inside)
 *   the 4px HALO against the control's fill          (the one a person sees on
 *                                                     a solid button)
 *   the 4px HALO against the surrounding surface     (outside)
 *
 * Measured while writing this: on a primary button the edge is `--bb-focus-ring`
 * on `--bb-accent`, which are the SAME COLOUR — 1.00:1, an edge that does not
 * exist — and the halo over the page reads 1.43:1 against that page. Neither
 * number is the answer; the halo against the button's own fill is 3.51:1, and
 * a magnified photograph shows exactly that: a pale band whose visible boundary
 * is the one with the blue.
 *
 * The halo is `color-mix(… , transparent)`, so it is COMPOSITED over the
 * surface before anything is compared. Painting it alone reads the
 * premultiplied colour and means nothing.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoStory } from './story';

/** Doc 03 §5 rule 2, for a graphical element carrying information. */
const FLOOR = 3;

/**
 * TWO OPEN DEFECTS, PINNED. These are not allowances.
 *
 * This file found them on 2026-09-13, both in dark mode, both invisible to
 * every other layer. They are recorded here rather than fixed because the fix
 * is a change to the library's SINGLE focus ring (doc 03 §4), and the search
 * for it was made and came back empty:
 *
 * - Re-pointing the ring in dark mode does not work. Swept against this whole
 *   registry, `--bb-x-brand-10` and `-11` each still leave the primary button
 *   under 3:1, because that control's fill IS the accent and any colour near
 *   enough to be "the brand" is near enough to disappear on it. The one
 *   candidate that clears every row, `--bb-x-brand-12`, measures **1.00:1
 *   against `--bb-x-gray-12`** — so a focused colour swatch would become
 *   indistinguishable from a chosen one, which is a defect `ColorSwatchField`
 *   has already had once and fixed.
 * - What does work is a two-colour ring — a gap of the surrounding surface
 *   between the fill and the ring, which is the technique WCAG's own guidance
 *   suggests for an indicator on a coloured control. That changes the geometry
 *   of every focused control in the library and moves every baseline with one
 *   in it, so it is a decision with a document rather than a line in a checks
 *   change.
 *
 * So each entry PINS its measurement, and it is asserted in both directions:
 * a row that gets worse fails, and a row that reaches the floor fails too,
 * because then the defect is fixed and the entry is a lie. The catalog's §7
 * carries the row.
 */
const OPEN: Record<string, number> = {
  'dark · a primary Button, and a selected checkbox, radio or switch': 2.59,
  'dark · a hovered Table row': 2.55
};

type Ground = {
  /** What this row stands for, named so a failure says which control. */
  what: string;
  /** The token `--bb-focus-ring` resolves to for this caller. */
  ring: string;
  /** The control's own background — what the 1px edge is drawn on. */
  fill: string;
  /** The surface around it — what the halo composites over. */
  surface: string;
};

/**
 * Every ground the ring lands on in this library.
 *
 * Taken from the components rather than imagined: the field box
 * (`internal/Field/controlBox`), `Button`'s four filled variants, the three
 * choice controls, `Accordion`, `FileUpload`, `Tabs`, `Link`, `Table` and
 * `Toast`. Where several components share a ground they share a row, because
 * the measurement is of the colours and not of the markup.
 */
const GROUNDS: Ground[] = [
  {
    what: 'a field, a checkbox, a radio or a switch at rest',
    ring: '--bb-focus-ring',
    fill: '--bb-surface-control',
    surface: '--bb-surface'
  },
  {
    what: 'an invalid field, whose ring is re-pointed to danger',
    ring: '--bb-danger',
    fill: '--bb-surface-control',
    surface: '--bb-surface'
  },
  {
    what: 'a primary Button, and a selected checkbox, radio or switch',
    ring: '--bb-focus-ring',
    fill: '--bb-accent',
    surface: '--bb-surface'
  },
  {
    what: 'a subtle Button',
    ring: '--bb-focus-ring',
    fill: '--bb-accent-subtle',
    surface: '--bb-surface'
  },
  {
    what: 'a danger Button, whose ring is re-pointed to danger',
    ring: '--bb-danger',
    fill: '--bb-danger',
    surface: '--bb-surface'
  },
  {
    what: 'an Accordion trigger',
    ring: '--bb-focus-ring',
    fill: '--bb-surface-raised',
    surface: '--bb-surface'
  },
  {
    what: 'a FileUpload zone, and a Table column header',
    ring: '--bb-focus-ring',
    fill: '--bb-surface-sunken',
    surface: '--bb-surface'
  },
  {
    what: 'a Tab, which draws the halo with no edge under it',
    ring: '--bb-focus-ring',
    fill: '--bb-surface',
    surface: '--bb-surface'
  },
  {
    what: 'a Link, whose ring is an offset outline on the page',
    ring: '--bb-focus-ring',
    fill: '--bb-surface',
    surface: '--bb-surface'
  },
  {
    what: 'a hovered Table row',
    ring: '--bb-focus-ring',
    fill: '--bb-surface-hover',
    surface: '--bb-surface'
  },
  {
    what: 'a selected Table row',
    ring: '--bb-focus-ring',
    fill: '--bb-surface-selected',
    surface: '--bb-surface'
  },
  {
    what: 'a control inside a layer',
    ring: '--bb-focus-ring',
    fill: '--bb-surface-control',
    surface: '--bb-surface-raised'
  },
  {
    what: 'an action inside a Toast',
    ring: '--bb-focus-ring',
    fill: '--bb-danger-subtle',
    surface: '--bb-surface-raised'
  }
];

/** The recipe, spelled exactly as `internal/buttonAppearance` and the field box do. */
const halo = (ring: string) =>
  `color-mix(in oklab, var(${ring}) var(--bb-focus-ring-halo-strength), transparent)`;

type Boundaries = {
  edgeOnFill: number;
  haloOnFill: number;
  haloOnSurface: number;
};

/**
 * The three boundaries of one focused control, in one mode.
 *
 * Everything is flattened onto a canvas before it is compared, which does two
 * jobs at once: it composites the translucent halo over its ground, and it
 * gives the CLIPPED sRGB value the palette's `oklch` is actually painted as
 * (decision 0028).
 */
const boundaries = (
  page: Page,
  mode: 'light' | 'dark',
  ground: Ground
): Promise<Boundaries> =>
  page.evaluate(
    ([mode, ring, fill, surface, haloRecipe]) => {
      const host = document.querySelector(`[data-bb-focus='${mode}']`);
      if (host === null) throw new Error(`no ${mode} scope`);

      const resolve = (value: string) => {
        const probe = document.createElement('div');
        probe.style.color = value;
        host.append(probe);
        const out = getComputedStyle(probe).color;
        probe.remove();
        if (out === '' || out === 'rgba(0, 0, 0, 0)') {
          throw new Error(`${value} resolved to nothing in ${mode}`);
        }
        return out;
      };

      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('no 2d context');
      const flatten = (...layers: string[]) => {
        ctx.clearRect(0, 0, 1, 1);
        for (const layer of layers) {
          ctx.fillStyle = layer;
          ctx.fillRect(0, 0, 1, 1);
        }
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r!, g!, b!] as [number, number, number];
      };

      const luminance = ([r, g, b]: [number, number, number]) => {
        const channel = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const ratio = (
        a: [number, number, number],
        b: [number, number, number]
      ) => {
        const x = luminance(a);
        const y = luminance(b);
        return (
          Math.round(
            ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100
          ) / 100
        );
      };

      const edge = flatten(resolve(`var(${ring})`));
      const theFill = flatten(resolve(`var(${fill})`));
      const theSurface = flatten(resolve(`var(${surface})`));
      const theHalo = flatten(resolve(`var(${surface})`), resolve(haloRecipe));

      return {
        edgeOnFill: ratio(edge, theFill),
        haloOnFill: ratio(theHalo, theFill),
        haloOnSurface: ratio(theHalo, theSurface)
      };
    },
    [mode, ground.ring, ground.fill, ground.surface, halo(ground.ring)] as const
  );

test.beforeEach(async ({ page }) => {
  await gotoStory(page, 'components-button--playground');
  await page.evaluate(() => {
    for (const mode of ['light', 'dark']) {
      const scope = document.createElement('div');
      scope.setAttribute('data-bb-mode', mode);
      scope.setAttribute('data-bb-focus', mode);
      document.body.append(scope);
    }
  });
});

test('the focus indication is visible at one of its boundaries, in both modes', async ({
  page
}) => {
  expect(GROUNDS.length).toBeGreaterThanOrEqual(13);

  const failures: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    for (const ground of GROUNDS) {
      const seen = await boundaries(page, mode, ground);
      const best = Math.max(
        seen.edgeOnFill,
        seen.haloOnFill,
        seen.haloOnSurface
      );
      const detail =
        `(edge/fill ${seen.edgeOnFill}, halo/fill ${seen.haloOnFill}, ` +
        `halo/surface ${seen.haloOnSurface})`;
      const pinned = OPEN[`${mode} · ${ground.what}`];

      if (pinned === undefined) {
        if (best < FLOOR) {
          failures.push(
            `${mode}  ${ground.what}: best boundary ${best}:1 ${detail}`
          );
        }
        continue;
      }

      /* A pinned row, asserted in both directions. */
      if (best >= FLOOR) {
        failures.push(
          `${mode}  ${ground.what} now measures ${best}:1 and is pinned as an ` +
            `OPEN DEFECT at ${pinned}:1 — it has been fixed, so delete the entry`
        );
      } else if (best < pinned) {
        failures.push(
          `${mode}  ${ground.what} got worse: ${best}:1 against a pinned ` +
            `${pinned}:1 ${detail}`
        );
      }
    }
  }

  expect(
    failures,
    `a focus indication under ${FLOOR}:1 at every boundary it has, so there is ` +
      `nothing to see (doc 03 §5 rule 2):\n  ${failures.join('\n  ')}`
  ).toEqual([]);
});

/*
 * AND THE MODEL IS THE THING, checked against a real control.
 *
 * Everything above is arithmetic on tokens. It is worth nothing if the
 * component draws its ring some other way — and the registry above is
 * hand-written, so a caller that changes its recipe would leave this file
 * measuring a ring nobody paints.
 *
 * So: a real focused primary button, read out of a story, has to carry exactly
 * the border colour and the shadow colour the registry models. Both modes,
 * because the recipe is one declaration and the tokens under it are not.
 */
test('a real focused control carries the colours the registry models', async ({
  page
}) => {
  await gotoStory(page, 'components-button--states');

  for (const [mode, label] of [
    ['light', 'Light'],
    ['dark', 'Dark']
  ] as const) {
    const panel = page.locator(
      `.catalog-panel:has(> .catalog-label:text-is("${label}"))`
    );
    const button = panel
      .locator('.catalog-row')
      .filter({ hasText: 'primary' })
      .getByRole('button', { name: 'focus' })
      .first();

    const drawn = await button.evaluate((node: Element) => {
      const style = getComputedStyle(node);
      return {
        border: style.borderTopColor,
        width: style.borderTopWidth,
        shadow: style.boxShadow
      };
    });

    const modelled = await page.evaluate(
      ([mode, haloRecipe]) => {
        const host = document.querySelector(`[data-bb-mode='${mode}']`);
        if (host === null) throw new Error(`no ${mode} scope`);
        const read = (value: string) => {
          const probe = document.createElement('div');
          probe.style.color = value;
          host.append(probe);
          const out = getComputedStyle(probe).color;
          probe.remove();
          return out;
        };
        return {
          ring: read('var(--bb-focus-ring)'),
          halo: read(haloRecipe)
        };
      },
      [mode, halo('--bb-focus-ring')] as const
    );

    expect(drawn.width, `the edge is 1px in ${mode}`).toBe('1px');
    expect(drawn.border, `the edge is --bb-focus-ring in ${mode}`).toBe(
      modelled.ring
    );
    expect(
      drawn.shadow,
      `the halo is the modelled mix, 4px, in ${mode}`
    ).toContain(`${modelled.halo} 0px 0px 0px 4px`);
  }
});
