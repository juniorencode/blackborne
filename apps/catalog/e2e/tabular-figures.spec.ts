/*
 * Tabular figures, from doc 03 §4.2: every number read in a column uses them,
 * so digits take the same width and the column lines up.
 *
 * The document calls it one of the details that most distinguishes a careful
 * table from a careless one, and it is invisible until you put two numbers on
 * top of each other. A browser is the only thing that can answer it: the
 * question is how wide the browser drew a digit.
 */
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('a number field declares tabular figures', async ({ page }) => {
  await page.goto(story('components-numberfield--aligns-with-others'));

  const variant = await page
    .getByTestId('nf-column')
    .getByRole('textbox')
    .first()
    .evaluate(el => getComputedStyle(el).fontVariantNumeric);

  expect(variant).toContain('tabular-nums');
  // Slashed zero comes along deliberately: when someone is checking an amount,
  // a zero that cannot be mistaken for an O is worth having.
  expect(variant).toContain('slashed-zero');
});

test('digits of different values occupy the same width', async ({ page }) => {
  await page.goto(story('components-numberfield--aligns-with-others'));

  /*
   * The real test of tabular figures. Measured by replacing the value with
   * strings of the same LENGTH but different digits: with proportional
   * figures a row of ones is visibly narrower than a row of zeros, and with
   * tabular figures they are identical.
   */
  const widths = await page
    .getByTestId('nf-column')
    .getByRole('textbox')
    .first()
    .evaluate(el => {
      const input = el as HTMLInputElement;
      const probe = document.createElement('span');
      const style = getComputedStyle(input);
      probe.style.font = style.font;
      probe.style.fontVariantNumeric = style.fontVariantNumeric;
      probe.style.position = 'absolute';
      probe.style.whiteSpace = 'pre';
      document.body.append(probe);

      const measure = (text: string) => {
        probe.textContent = text;
        return probe.getBoundingClientRect().width;
      };

      const result = {
        ones: measure('1111111111'),
        zeros: measure('0000000000'),
        mixed: measure('1234567890')
      };
      probe.remove();
      return result;
    });

  expect(widths.ones).toBeCloseTo(widths.zeros, 1);
  expect(widths.mixed).toBeCloseTo(widths.zeros, 1);
});

test('a number field aligns with a text field and a button', async ({
  page
}) => {
  await page.goto(story('components-numberfield--aligns-with-others'));

  for (const size of ['sm', 'md', 'lg']) {
    const row = page.getByTestId(`nf-align-${size}`);

    /*
     * The NUMBER field's height is its group, not its input: the input sits
     * inside a group alongside the stepper buttons, and the group is what
     * carries the border and the height. Measuring the input would compare
     * the wrong box.
     */
    const heights = {
      number: (await row.getByRole('group').boundingBox())?.height,
      text: (await row.getByRole('textbox', { name: 'Text' }).boundingBox())
        ?.height,
      button: (await row.getByRole('button', { name: 'Save' }).boundingBox())
        ?.height
    };

    // Exactly equal, not approximately: all three read the same
    // control-height token, so a difference means one stopped doing that.
    expect(heights.text, `size ${size}`).toBe(heights.number);
    expect(heights.button, `size ${size}`).toBe(heights.number);
  }
});
