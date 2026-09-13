/*
 * THE RULE OF PAIRS, MEASURED — every pair, not the ones a story happens to
 * render.
 *
 * Doc 03 §4.0: every background token declares the text token that goes on it,
 * and they are always used together. That is a rule about the TOKEN LAYER, and
 * until this file nothing checked it. What existed was axe, which measures the
 * contrast of text on a RENDERED page — so a pair reaches the accessibility
 * suite only if some component paints it in some story, and a pair nothing
 * paints yet is a pair nobody has ever looked at.
 *
 * That is not hypothetical. `--bb-accent-on` was the literal `#fff` for as
 * long as the token layer had existed, correct for one dark blue brand and for
 * nothing else, and it took shipping eighteen accents to find out — nine of
 * them under 4.5:1 with white (decision 0029). The pair rule had been written
 * down since the beginning; it had never been measured.
 *
 * ## Why it derives the list instead of carrying one
 *
 * A list of pairs written here is a second copy of `semantic.css`, and this
 * repository has paid for that shape before: five hand-written copies of one
 * brand override had drifted apart, three of them missing steps, and every
 * missing step fell back to the default while looking deliberate.
 *
 * So the pairs are read out of the CSSOM. `--bb-X-on` is the text on
 * `--bb-X` — that IS the naming convention, stated in doc 03 §4.0 and in the
 * package guide — and the backgrounds it has to hold over are `--bb-X` plus
 * whichever of `--bb-X-hover` and `--bb-X-active` the stylesheet declares.
 * Add a pair to `semantic.css` and it is covered here with nothing edited.
 *
 * The hover and active half is not pedantry. `--bb-accent-subtle-on` is step
 * 12 rather than 11 precisely because the pairing has to hold on the DARKEST
 * of its three backgrounds — step 11 on step 5 measures 4.46:1 — and that was
 * found by making the pressed state real in the catalog so axe could see it.
 * Here it needs no story at all.
 *
 * ## And the colours that are text on an ordinary surface
 *
 * A `-on` token is half of a pair. `--bb-text-muted`, `--bb-link` and the four
 * tone `-text` tokens are not: they are text on whatever surface they land on,
 * and the library has exactly four of those. Every combination is measured,
 * which is 4 backgrounds rather than 1.
 *
 * ## Why a browser and not a node script
 *
 * Three reasons, and each one has cost this repository something:
 *
 * - jsdom does not resolve CSS variables, so it cannot say what colour a token
 *   ended up. A token bug that made dark mode do nothing at all passed every
 *   unit test.
 * - A mode is a redefinition of variables on a container (doc 03 §3), so the
 *   answer depends on WHERE it is asked. The probes sit inside the scope.
 * - The palette ships in `oklch`, and decision 0028 says a contrast is
 *   measured against the CLIPPED sRGB value, because that is what an ordinary
 *   screen paints. `e2e/colour` paints and reads the bytes, which is the one
 *   copy of that arithmetic in this catalog.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { contrast } from './colour';
import { gotoStory } from './story';

/**
 * Any story will do: the subject is the STYLESHEET, which the catalog imports
 * from the built package, and the probes are this file's own elements. A
 * playground is the cheapest page that loads it.
 */
const ANY_STORY = 'components-button--playground';

/**
 * AA for a run of text. Doc 03 §5 rule 2.
 *
 * One pairing sits exactly on it: `--bb-link` over `--bb-surface-sunken`
 * measures **4.50** in light mode. That is a pass and it is one hundredth from
 * not being one, so the first time this file goes red it is probably that —
 * and the answer is to move the token, not the floor (doc 10 §11).
 */
const TEXT_FLOOR = 4.5;

/** The four surfaces the library has. Anything else is half of a pair. */
const SURFACES = [
  '--bb-surface',
  '--bb-surface-raised',
  '--bb-surface-sunken',
  '--bb-surface-control'
];

/**
 * Pairs that are deliberately below the floor, with the reason and the numbers
 * as measured on 2026-09-13.
 *
 * WCAG 1.4.3 exempts an inactive control by name, and axe does not flag one
 * either. Both entries are the same exemption twice: the surface of a disabled
 * control with its text, and the text colour a disabled thing uses anywhere.
 *
 * ASSERTED IN BOTH DIRECTIONS, which is the `lint:rules` pattern: an exemption
 * that is no longer needed is a lie in a file nobody re-reads, so a pair listed
 * here has to actually FAIL the floor. If one of these is ever raised above
 * 4.5:1, this file goes red and the entry comes out.
 */
const EXEMPT: Record<string, string> = {
  '--bb-surface-disabled-on': 'a disabled control. 3.12 light, 3.44 dark',
  '--bb-text-disabled': 'disabled text. 2.88 to 3.21 light, 3.09 to 3.69 dark'
};

type Pairing = { text: string; background: string };

/**
 * Every token the stylesheet declares, read from the rules rather than from a
 * computed style.
 *
 * The rules are what is DECLARED; a computed style also carries whatever the
 * theme block emits, which is four more and none of them a colour. A sheet
 * from another origin throws on `cssRules` and is skipped — nothing here loads
 * one, and the guard costs a line.
 */
const declaredTokens = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const found = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (!(rule instanceof CSSStyleRule)) continue;
        for (const name of Array.from(rule.style)) {
          if (name.startsWith('--bb-')) found.add(name);
        }
      }
    }
    return [...found].sort();
  });

/**
 * What one token resolves to INSIDE a mode, as a string a canvas can paint.
 *
 * A probe element rather than reading the scope's own computed style, because
 * a custom property is substituted at the element that declares it: asking the
 * scope for `--bb-accent` returns the declaration, and asking a child for
 * `color: var(--bb-accent)` returns the colour. The probe is removed either
 * way.
 */
const resolve = (page: Page, mode: 'light' | 'dark', token: string) =>
  page.evaluate(
    ([mode, token]) => {
      const scope = document.querySelector(`[data-bb-contrast='${mode}']`);
      if (scope === null) throw new Error(`no ${mode} scope`);
      const probe = document.createElement('div');
      probe.style.color = `var(${token})`;
      scope.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      if (resolved === '' || resolved === 'rgba(0, 0, 0, 0)') {
        throw new Error(`${token} resolved to nothing in ${mode}`);
      }
      return resolved;
    },
    [mode, token] as const
  );

test.beforeEach(async ({ page }) => {
  await gotoStory(page, ANY_STORY);
  /*
   * Two scopes appended to the body, outside anything the story declares.
   * `data-bb-mode` is how a consumer chooses a mode, so the probes are asked
   * the same question a real page asks.
   */
  await page.evaluate(() => {
    for (const mode of ['light', 'dark']) {
      const scope = document.createElement('div');
      scope.setAttribute('data-bb-mode', mode);
      scope.setAttribute('data-bb-contrast', mode);
      document.body.append(scope);
    }
  });
});

/*
 * THE DERIVATION ITSELF, asserted before anything is measured with it.
 *
 * A regex that stops matching returns an empty list, every loop below runs
 * zero times, and the file passes green while checking nothing — which is the
 * silent-pass shape doc 10 §11.1 is about, and the exact failure the
 * accessibility suite's own story list once had. So the instrument is checked
 * first: a known pair is present, and the count cannot fall.
 */
test('the pairs are derived from the stylesheet, and there are still at least sixteen', async ({
  page
}) => {
  const tokens = await declaredTokens(page);
  const ons = tokens.filter(name => name.endsWith('-on'));

  expect(ons).toContain('--bb-accent-on');
  expect(ons).toContain('--bb-surface-on');
  expect(ons.length).toBeGreaterThanOrEqual(16);
});

test('every background reads against the text it declares, in both modes', async ({
  page
}) => {
  const tokens = await declaredTokens(page);
  const pairings: Pairing[] = [];

  for (const text of tokens.filter(name => name.endsWith('-on'))) {
    const base = text.slice(0, -'-on'.length);
    for (const background of [base, `${base}-hover`, `${base}-active`]) {
      if (tokens.includes(background)) pairings.push({ text, background });
    }
  }

  /*
   * Twenty-two combinations from sixteen pairs, because three families —
   * accent, accent-subtle and surface — have a hovered and a pressed
   * background their one text colour has to hold over. It can only grow, so
   * the floor is what is asserted.
   */
  expect(pairings.length).toBeGreaterThanOrEqual(22);

  const failures: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    for (const { text, background } of pairings) {
      const ratio = await contrast(
        page,
        await resolve(page, mode, text),
        await resolve(page, mode, background)
      );
      const exempt = text in EXEMPT;
      if (!exempt && ratio < TEXT_FLOOR) {
        failures.push(`${mode}  ${text} on ${background}  ${ratio}:1`);
      }
      if (exempt && ratio >= TEXT_FLOOR) {
        failures.push(
          `${mode}  ${text} on ${background} is ${ratio}:1 and is listed as exempt — the exemption is stale, delete it`
        );
      }
    }
  }

  expect(failures, failures.join('\n  ')).toEqual([]);
});

test('every text colour reads on all four surfaces, in both modes', async ({
  page
}) => {
  const tokens = await declaredTokens(page);

  /*
   * Every colour meant to be read ON a surface rather than as half of a pair.
   * `--bb-text` matches the `-text` suffix on its own, hence the set.
   */
  const texts = [
    ...new Set([
      ...tokens.filter(name => name.endsWith('-text')),
      '--bb-text',
      '--bb-text-muted',
      '--bb-text-disabled',
      '--bb-link',
      '--bb-link-active'
    ])
  ].filter(name => tokens.includes(name));

  expect(texts).toContain('--bb-danger-text');
  expect(texts.length).toBeGreaterThanOrEqual(9);

  const failures: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    for (const text of texts) {
      for (const surface of SURFACES) {
        const ratio = await contrast(
          page,
          await resolve(page, mode, text),
          await resolve(page, mode, surface)
        );
        const exempt = text in EXEMPT;
        if (!exempt && ratio < TEXT_FLOOR) {
          failures.push(`${mode}  ${text} on ${surface}  ${ratio}:1`);
        }
        if (exempt && ratio >= TEXT_FLOOR) {
          failures.push(
            `${mode}  ${text} on ${surface} is ${ratio}:1 and is listed as exempt — the exemption is stale, delete it`
          );
        }
      }
    }
  }

  expect(failures, failures.join('\n  ')).toEqual([]);
});
