/*
 * Visual regression.
 *
 * What it is for, precisely: changing a token and knowing within a minute
 * WHICH components changed appearance, instead of opening them one at a time.
 * Doc 10 §6 calls it the only thing that makes touching tokens safe once there
 * are thirty components — and it was adopted early, at ten, because approving
 * ten baselines is an afternoon and approving thirty is not.
 *
 * It does not detect that something is wrong. It detects that something
 * CHANGED, and a person decides whether the change was intended. That decision
 * is the whole value: updating baselines without looking gives you the cost
 * and none of the benefit.
 *
 * ---
 *
 * Not every story is captured. Photographing all of them would be slow, and
 * most of the extra shots would be near-duplicates that fail together and
 * teach nothing. What is captured:
 *
 *   - one per component showing EVERY state, which is where a token change
 *     surfaces
 *   - the pages that put components together, which doc 09 §10 calls the check
 *     that finds the most
 *   - the three theme axes, on the composite pages rather than on every
 *     component (doc 10 §6)
 *
 * Doc 10 §6's four conditions are met in playwright.config.ts: animations
 * disabled, fixed viewport and scale, caret hidden, and every change approved
 * explicitly. Sample data is fixed by construction — the stories contain no
 * dates, ids or random values.
 */
import { expect, test } from '@playwright/test';
import { pinClock } from './clock';
import { travelTo } from './pointer';
import { imagesSettled } from './settle';
import { gotoStory } from './story';

/*
 * Refuse to run anywhere but linux.
 *
 * The references exist for linux alone, on purpose — they are generated in the
 * container so that a capture taken on a laptop is byte-identical to one taken
 * in CI, which is what lets the tolerance stay at zero. The platform is part
 * of the reference filename, so running this suite on Windows or macOS finds
 * nothing to compare against, fails, and writes a fresh set of references
 * named for that platform. They look entirely plausible. Committing them by
 * accident gives the repository two sets of baselines that can never agree.
 *
 * A refusal that says where to go is better than a red run that leaves a full
 * set of plausible-looking references behind.
 */
test.beforeAll(() => {
  if (process.platform !== 'linux') {
    throw new Error(
      `The visual baselines exist for linux only, and this is ${process.platform}. ` +
        'Run `pnpm visual` from the repository root: it runs this same suite ' +
        'inside the container the references were generated in. Running it ' +
        'here would write a second set that CI can never match.'
    );
  }
});

/*
 * THE CLOCK IS FIXED FOR THE WHOLE FILE, and doc 10 §6.1 says where as well as
 * why: a component that knows what day it is reads the clock, so a reference
 * taken on one day does not match the same page on the next.
 *
 * It used to be fixed inside `capture`, which is 176 of the 196 references —
 * the hover and the press paths reach `gotoStory` themselves, so twenty were
 * photographed at whatever instant the run happened to be at. None of those
 * twenty renders a date, so none of them was wrong; a guard that one shutter
 * in three goes through is the kind nobody can see is missing, which is the
 * reason it moves rather than the reason it mattered.
 */
test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

/**
 * THE SHOT, and the guard that belongs to the shot rather than to one path.
 *
 * `imagesSettled` sat inside `capture` too, and the other two shutters did
 * without it. An `<img>` that has not resolved photographs as the browser's
 * broken-image mark, and `e2e/settle` carries what that cost: `avatar-states`
 * came back 225 pixels different on CI.
 *
 * The story root rather than the viewport: a full-page shot would include the
 * scrollbar, which differs between platforms even inside one container.
 */
const shoot = async (
  page: import('@playwright/test').Page,
  name: string
): Promise<void> => {
  await imagesSettled(page);
  await expect(page.locator('body')).toHaveScreenshot(`${name}.png`);
};

/** One screenshot of a whole story. */
const capture = async (
  page: import('@playwright/test').Page,
  id: string,
  name: string
) => {
  // gotoStory, not page.goto: it waits for the story to MOUNT. Without that
  // this line can photograph an empty page, and --update-snapshots has nothing
  // to match against, so the empty page becomes the committed reference. See
  // the note on gotoStory.
  await gotoStory(page, id);
  await shoot(page, name);
};

/*
 * Every state of every component. These are the baselines a token change
 * lands on: alter --bb-border and this is the set that tells you where.
 */
const STATES: Array<[string, string]> = [
  ['components-button--states', 'button-states'],
  ['components-textfield--states', 'textfield-states'],
  ['components-textarea--states', 'textarea-states'],
  ['components-numberfield--states', 'numberfield-states'],
  ['components-checkbox--states', 'checkbox-states'],
  ['components-radiogroup--states', 'radiogroup-states'],
  ['components-switch--states', 'switch-states'],
  /*
   * THE TABLE EARNS THREE, and none of them is the ordinary table.
   *
   * `table-states` is the row doc 10 §6 asks of every component: a disabled
   * row beside a 320px container, so a token change lands somewhere visible.
   *
   * `table-absences` is the one that pays. A listing with no rows is in one of
   * THREE states, and the product this suite was read against showed the same
   * screen for two of them — a failed load was indistinguishable from an empty
   * result, with no way to try again. Five panels here, and what a reader
   * checks is that no two of them look alike.
   *
   * `table-too-wide` is the only way to see the overflow indication at all.
   * Doc 04 §7 requires that content hidden by overflow be INDICATED, and the
   * indication is four background layers with no JavaScript behind them. A
   * computed style cannot say whether an edge looks like there is more beyond
   * it; the picture can.
   */
  /*
   * A FOURTH FOR THE TABLE: the selection column, which is entirely ours —
   * the base renders none. Two panels, because the two modes differ in the
   * heading rather than in the rows: several rows get a select-all box there,
   * one row at a time gets a visually hidden name instead, since a select-all
   * above single-choice rows would offer something the mode cannot do. The
   * disabled row is in this picture too, unchoosable and not in "all".
   */
  /*
   * A FIFTH: the arrangement. What it photographs is not a state of the table
   * so much as a demonstration — the manage-columns panel beside it is a
   * `Checkbox` per column and a `Button`, built from public pieces, because
   * non-goal 3 leaves that dialog to the consumer and P6's corollary says an
   * assembly may have no capability its pieces lack. A picture is how anybody
   * checks the claim without reading the story.
   */
  ['components-table--arranging', 'table-arranging'],
  ['components-table--selection', 'table-selection'],
  ['components-table--states', 'table-states'],
  ['components-table--absences', 'table-absences'],
  ['components-table--too-wide', 'table-too-wide'],
  ['components-checkbox--marks', 'checkbox-marks'],
  ['components-badge--tones', 'badge-tones'],
  ['components-badge--states', 'badge-states'],
  ['components-alert--together', 'alert-together'],
  /*
   * THE GREYSCALE CHECK DOC 06 §3 NAMES, and until now the library had one
   * picture of it: `confirm-greyscale`, which renders a SINGLE tone of a
   * component that can never carry a success one. A rule about telling tones
   * apart cannot be checked against one tone.
   *
   * `Alert / Greyscale` is the whole set twice over — four tones in colour
   * beside the same four with the hue filtered out — so what a reader looks
   * for here is whether each glyph's SILHOUETTE still says which tone it is
   * once the colour is gone. That is the claim: colour is never the only
   * channel.
   */
  ['components-alert--greyscale', 'alert-greyscale'],
  ['components-emptystate--the-two-states', 'emptystate-two-states'],
  ['components-separator--orientations', 'separator-orientations'],
  ['components-skeleton--variants', 'skeleton-variants'],
  /*
   * A SPINNER EARNS ONE, and it is the colour rather than the sizes.
   *
   * It had none at all until its catalog was written, because it had no story
   * — the one component in the library outside both the accessibility suite
   * and this one.
   *
   * `InheritsItsColour` over `Sizes` on purpose. The three sizes are geometry
   * against the type scale, which a resolved `size-*` already governs; what
   * only a picture shows is `color: currentColor` doing its job — the same
   * element beside body text, beside muted text, inside a FILLED button where
   * the surrounding colour is the button's foreground, and in dark. That is
   * also the only Spinner story that carries a second mode.
   *
   * The rotation is not in the picture and cannot be: `animations: 'disabled'`
   * CANCELS an infinite animation rather than finishing it, so the arc is
   * photographed where it starts. What the shot holds is the arc, the faint
   * track behind it, and the four foregrounds.
   */
  ['components-spinner--inherits-its-colour', 'spinner-in-context'],
  ['components-card--containers', 'card-containers'],
  /*
   * A section that folds has two states no other component has — open and
   * closed — and the open one is the picture worth keeping: the divider, the
   * air inside the panel and the chevron turned over. The animation between
   * them cannot be photographed at all (`animations: 'disabled'` finishes it
   * before the shutter), so it is measured in accordion.spec.ts instead.
   */
  ['components-accordion--states', 'accordion-states'],
  ['components-collapsible--states', 'collapsible-states'],
  /*
   * A link is the one component whose REST state is the interesting picture:
   * accent-coloured and underlined before anything is pointed at it, which is
   * doc 06 §3 (colour is never the only channel) and the thing that tells it
   * apart from a button dressed as one.
   *
   * And `wrapping` is the outline crossing a line break, which is the case it
   * was chosen over a border for. No component that is always a box can show
   * it.
   */
  ['components-link--states', 'link-states'],
  ['components-link--wrapping', 'link-wrapping'],
  /* A trail's states are its LENGTHS: one step, two, and five. One shot holds
     all three, and the interesting one is the trail of one — where the only
     separator there is, is the one that is dropped. */
  /*
   * The trail's own four. `structures` is the one to look at: one trail, three
   * widths, and two of them have folded their middle into a "…".
   */
  ['components-breadcrumbs--structures', 'breadcrumbs-structures'],
  ['components-breadcrumbs--lengths', 'breadcrumbs-lengths'],
  ['components-breadcrumbs--wrapping', 'breadcrumbs-wrapping'],
  ['components-breadcrumbs--a-step-with-no-page', 'breadcrumbs-no-page'],
  /*
   * `pagination-steps` is the first picture of doc 04's level N3 in this
   * repository: the same component at three widths, with three different sets
   * of controls. It is also the baseline that would catch the structural
   * decision silently reverting to one shape, which no assertion about a
   * single width would.
   */
  ['components-pagination--steps', 'pagination-steps'],
  /*
   * A menu is photographed OPEN through its own `defaultOpen`, which is what
   * makes these deterministic: a tooltip and a preview both needed a helper
   * that travels the pointer and waits, because they have no other way to be
   * open. A menu does.
   */
  ['components-menu--open', 'menu-open'],
  /*
   * A select is a field and a layer, so it earns both kinds of baseline: the
   * closed states doc 07 §6 asks for, and the open list where the tick and the
   * matched width are.
   */
  /*
   * The tabs' own four, and the first is the one to look at: the same
   * component at three widths, two of them a select. Doc 04's N3, in a
   * picture.
   */
  /*
   * The split button's own three, and the seam is what to look at: a
   * secondary one turns two borders into one line, a primary one has no
   * visible border and draws its own divider.
   */
  ['components-splitbutton--sizes', 'split-button-sizes'],
  ['components-splitbutton--states', 'split-button-states'],
  ['components-tabs--structures', 'tabs-structures'],
  ['components-tabs--states', 'tabs-states'],
  ['components-tabs--wrapping', 'tabs-wrapping'],
  ['components-tabs--rich-titles', 'tabs-titles-with-a-count'],
  ['components-select--states', 'select-states'],
  ['components-select--open', 'select-open'],
  ['components-select--long-options', 'select-long-options'],
  /*
   * A combo box earns three, and each one is a picture no other baseline
   * holds. `states` is the field half, and it is the only field in this
   * library with all EIGHT of doc 07 §6's states — read-only included, which
   * a select cannot have. `open` is the list, where the tick, the matched
   * width and the highlight are. And `no-options` is the row that says WHICH
   * kind of empty a list is: doc 09's distinction, which this field makes
   * three ways and which would otherwise only exist in a comment.
   */
  ['components-combobox--states', 'combobox-states'],
  ['components-combobox--open', 'combobox-open'],
  ['components-combobox--no-options', 'combobox-no-options'],
  /*
   * And two more for the field that holds SEVERAL, because the chips are a
   * different box: `several-states` is the one to look at — read-only and
   * disabled keeping their chips while their crosses go, saving keeping the
   * cross and its room, and four values making the field two lines tall with
   * its toggle still at the top of the edge. `several-narrow` is the same box
   * in 320px, where the chips wrap and one of them truncates.
   */
  /*
   * A list loading a further page, which is the one picture of the
   * asynchronous half worth keeping: the options, then the row at the end
   * saying more is on its way. The other four things an empty list can say are
   * one line of muted text each, and the browser checks read them by text.
   */
  /*
   * A calendar earns three, and each holds something no assertion does.
   *
   * `states` is where the appearances of a day sit together — chosen, today
   * beside a different chosen day, struck through because it is unavailable,
   * and dimmed because the whole calendar is off — and telling the last two
   * apart is doc 07 §6's rule arriving on a grid. There is no read-only panel
   * on it, which is the point: this picture is what removed the state, because
   * it photographed identically to an ordinary calendar. `together` is the
   * density claim: the same month at both densities, where the cells shrink and
   * the targets do not. And `rtl` is the grid reading from the right with the
   * arrows swapped, which is half of what RTL support means.
   */
  ['components-calendar--states', 'calendar-states'],
  ['components-calendar--together', 'calendar-together'],
  ['components-calendar--direction', 'calendar-rtl'],
  /*
   * A RANGE CALENDAR EARNS A FOURTH, and it is `structures`.
   *
   * Two of the same component at two container widths in one window: one month
   * below the medium step and two from it up. Nothing else in this suite
   * photographs a structural change at all — `Tabs` and the folded trail are
   * asserted rather than pictured — and it is the one thing about this
   * component that a number cannot show, because what matters is that both
   * structures look like finished calendars rather than one looking like a
   * broken version of the other.
   *
   * `states` carries the band across a month boundary, which is the shape the
   * two logical corners and the square middle exist to make. `together` is the
   * band in dark mode, where the soft accent is a different step of the scale
   * and today's ring changes with it. And `rtl` is a range whose corners follow
   * the reading direction.
   */
  /*
   * THE DATE FAMILY EARNS FIVE, and two of them are about the same edge.
   *
   * `date-field-states` is doc 07 §6 on one page, and the panel worth looking
   * at is the empty one: the cross is unreachable there and still occupying
   * its width, which is rule 1 and the thing a bounding box can assert but
   * only a picture shows as "nothing moved". `date-field-locales` is the claim
   * no number makes well — month first, day first, year first, with the
   * locale's own marks between them. `date-field-together` is density: the
   * segments shrink and the targets do not.
   *
   * `date-picker-opened` is the composition itself, the field and the layer
   * and the calendar in one frame. And `date-picker-together` is doc 07
   * §2.2a's exception photographed at three densities, dark included — two
   * library-owned controls at one edge, which no other field in this library
   * is allowed and which is the picture to look at if the rule is ever
   * questioned.
   */
  /*
   * THE DATE FAMILY'S LAST THREE. `time-field-locales` is the picture that
   * corrected this component's own documentation — two locales agreeing on a
   * twelve-hour clock and disagreeing about how to write the marker, which is
   * the argument for the boundary being `14:30` made visible.
   *
   * `date-range-picker-opened` is the widest composition this library has:
   * two segment rows, two edge controls and two synchronised months in a
   * layer. And `date-range-picker-states` is doc 07 §6 on a control with two
   * halves, where an empty one has to read as one field rather than two.
   */
  /*
   * A BAR EARNS TWO. `progress-states` is the five values worth looking at, and
   * the two ends are why: at 2% the fill has to be a dot rather than a sliver
   * with square corners, and at 100% its corners have to be the track's —
   * neither of which a width in pixels shows. `progress-together` is the fill
   * against its track in dark mode, which is the pairing a check measures at
   * 4.58:1 in light and which a picture is what makes anybody believe.
   */
  /*
   * STEPS EARNS THREE, and `structures` is the one no number replaces: two of
   * the same component at two container widths in one window, where the narrow
   * one has to read as a finished chain of indicators rather than as a row
   * whose labels went missing. `states` is doc 06 §3's requirement made
   * visible — four states that differ in shape before they differ in hue — and
   * it is also the picture that found the connectors were three different
   * lengths. `together` is the tone surfaces in dark mode, where a soft green
   * and a soft red are two steps of a scale rather than two hues.
   */
  /*
   * A BUTTON GROUP EARNS THREE, and every one of them is a thing no assertion
   * reaches. `button-group-variants` is the SEAM in both modes: a secondary
   * row has two borders turned into one, and the other two have no visible
   * border at all, so the line is mixed from the pair's own text colour and a
   * row without it is one accent blob. `button-group-states` is the group of
   * one that keeps all four corners, a member overriding the row, and a
   * pending button holding its width in the middle of a joint.
   *
   * `button-group-focus` is the one that matters most. The ring is a border
   * plus a 4px halo drawn as a box-shadow, and the buttons overlap by a pixel
   * — so with no z-index the later sibling paints over the halo and the ring
   * of anything but the last button is cut in half down one edge. Nothing in
   * the DOM is wrong when that happens, a box-shadow is not hit-tested, and no
   * computed value says who painted over whom.
   */
  /*
   * A SLIDER EARNS TWO. `slider-states` is the rail against the thumb in both
   * modes — the rail is `Progress`'s track down to the token, and the two have
   * to read as one control rather than as a bar with a dot near it — plus the
   * value at each end of the range, where a fill at 100% has to be the rail's
   * own shape and one at 0 has to be nothing at all.
   *
   * `slider-interaction` is the one nothing else replaces: hover, focus and
   * DRAGGING, the last of which exists only while a pointer is held down and
   * therefore cannot be seen by poking at the component. It is the first state
   * in `Force`'s union that is unreachable by hand.
   */
  /*
   * A TIME PICKER EARNS THREE, and this comment said two while three entries
   * followed it — corrected rather than enforced, because the third is the one
   * that turned out to be load-bearing.
   *
   * The first two are not about the trigger: it is a `Select` with its rows
   * generated, so the trigger, the panel and the tick are already photographed
   * under that component. `time-picker-states` IS about the trigger, and it
   * earns its place for a reason a select cannot cover — a time picker is a
   * FIELD, so it carries the field states doc 07 §6 lists, and a select's own
   * states picture is taken on a select's label and help text rather than on
   * these.
   *
   * `time-picker-opened` is the list in both modes, with the no-time row
   * first — the route doc 07 §2.2 rule 5 relies on, provided by the component
   * because the component owns its options. `time-picker-locales` is the
   * argument for decision 0020 made visible: one value, `14:00`, read three
   * ways — `2:00 PM`, `2:00 p. m.` and `14:00`. Two of those locales are both
   * twelve-hour and disagree about how to write the marker.
   */
  /*
   * AN AVATAR EARNS TWO, and neither is the circle. `avatar-states` is the
   * three sizes with a picture, the three without, a picture that did not
   * arrive and a fallback that is a glyph rather than letters — in both modes,
   * because the fallback's surface is a pair and the border is what separates
   * an unknown image from an unknown background.
   *
   * `avatar-in-a-row` is the one that carries the argument for the SCALE: an
   * avatar beside a button and a field of the same size, three times. The
   * check measures that the three heights are equal; the picture is where
   * "equal" either looks right or looks like three things that happen to
   * measure the same.
   */
  /*
   * A PALETTE EARNS TWO. `color-swatch-field-states` is the states in both
   * modes, and the border round every swatch is the thing to check: white on
   * the light surface and near-black on the dark one have no edge without it,
   * and a palette holds colours the library has never seen.
   *
   * `color-swatch-field-rings` is the one that carries a decision. Nothing may
   * be drawn INSIDE a swatch — a mark on a colour we do not control is white
   * on pale half the time — so both marks are outside, in the two mechanisms
   * doc 06 §3.1 names: an offset outline for chosen, the border and halo for
   * focus. The third row is one swatch carrying both, which is the picture that
   * says whether they compose or fight.
   */
  /*
   * A COLOUR PICKER EARNS TWO, and the thumb is what to read in both. Every
   * other handle in this library sits on a surface the library chose; this one
   * sits on the colour itself, anywhere in a gradient, so it carries a light
   * ring and a dark one. `color-picker-opened` is the whole layer in both
   * modes, and `color-picker-alpha` is the second slider plus the checkerboard
   * a transparent colour needs behind it to be legible at all.
   */
  /*
   * AN UPLOADER EARNS TWO, and the second one is the whole reason this
   * component gets a baseline at all: `file-upload-zone` is the zone at rest,
   * hovered, focused and WITH SOMETHING OVER IT — the one state in this
   * library that exists only while a person is holding a file and deciding
   * whether to let go. Nobody can see it by poking at the catalog, and the
   * browser check can only say the colours differ; whether the difference
   * reads as "let go here" is what the picture is for. It is also the only
   * dashed border in the library, which is a convention borrowed on purpose.
   *
   * `file-upload-states` is a row per thing a project can know about a file:
   * waiting, going, and failed with its reason under it — in both modes,
   * because a row is a bordered card on a surface and the failure's text is
   * the danger step, which is defined per mode rather than derived.
   */
  ['components-fileupload--zone', 'file-upload-zone'],
  ['components-fileupload--states', 'file-upload-states'],
  ['components-colorpicker--opened', 'color-picker-opened'],
  ['components-colorpicker--with-alpha', 'color-picker-alpha'],
  ['components-colorswatchfield--states', 'color-swatch-field-states'],
  ['components-colorswatchfield--rings', 'color-swatch-field-rings'],
  ['components-avatar--states', 'avatar-states'],
  ['components-avatar--in-a-row', 'avatar-in-a-row'],
  ['components-timepicker--opened', 'time-picker-opened'],
  ['components-timepicker--in-every-locale', 'time-picker-locales'],
  ['components-timepicker--states', 'time-picker-states'],
  ['components-slider--states', 'slider-states'],
  ['components-slider--interaction', 'slider-interaction'],
  ['components-buttongroup--variants', 'button-group-variants'],
  ['components-buttongroup--states', 'button-group-states'],
  ['components-buttongroup--the-focus-ring', 'button-group-focus'],
  ['components-steps--states', 'steps-states'],
  ['components-steps--structures', 'steps-structures'],
  ['components-steps--together', 'steps-together'],
  ['components-progress--states', 'progress-states'],
  ['components-progress--together', 'progress-together'],
  ['components-timefield--in-every-locale', 'time-field-locales'],
  ['components-daterangepicker--opened', 'date-range-picker-opened'],
  ['components-daterangepicker--states', 'date-range-picker-states'],
  ['components-datefield--states', 'date-field-states'],
  ['components-datefield--in-every-locale', 'date-field-locales'],
  ['components-datefield--together', 'date-field-together'],
  ['components-datepicker--opened', 'date-picker-opened'],
  ['components-datepicker--together', 'date-picker-together'],
  ['components-rangecalendar--structures', 'range-calendar-structures'],
  ['components-rangecalendar--states', 'range-calendar-states'],
  ['components-rangecalendar--together', 'range-calendar-together'],
  ['components-rangecalendar--direction', 'range-calendar-rtl'],
  ['components-combobox--loading-more', 'combobox-loading-more'],
  ['components-combobox--several-states', 'combobox-several-states'],
  ['components-combobox--several-in-a-narrow-panel', 'combobox-several-narrow'],
  ['components-menu--long-list', 'menu-long-list'],
  ['components-menu--long-label', 'menu-long-label'],
  ['components-pagination--positions', 'pagination-positions'],
  ['components-cursorpagination--states', 'cursor-pagination-states'],
  /*
   * A component with nothing to look at still earns a baseline, and this is
   * the one that earns it most: the story is two rulers that must stay the
   * same width. If the hiding ever stops working, the picture changes — which
   * is the only way a sighted reviewer would ever notice.
   */
  [
    'components-visuallyhidden--takes-no-space',
    'visuallyhidden-takes-no-space'
  ],
  ['components-searchfield--states', 'searchfield-states'],
  ['components-checkboxgroup--states', 'checkboxgroup-states'],
  /*
   * The trailing edge, which doc 07 §2.2 settles and which no other baseline
   * would catch: the clear button present, absent because the field is empty,
   * and absent because the field is busy. Three states of the same pixels,
   * decided by rules that live in three different places.
   */
  ['components-searchfield--the-trailing-edge', 'searchfield-trailing-edge'],
  /*
   * Two components people pick the wrong one of. The same reason the catalog
   * already puts Switch beside Checkbox — doc 09 §10.
   */
  [
    'components-checkboxgroup--against-radio-group',
    'checkboxgroup-vs-radiogroup'
  ],
  /*
   * Decision 0011 in one picture: the same fields with the stepper off, on,
   * and overruled by a busy state. What to look at is the width of usable
   * box, because that is the argument the decision makes.
   */
  ['components-numberfield--the-stepper', 'numberfield-stepper'],
  /*
   * Affixes and alignment, on both fields that take them. The Arabic panel is
   * the one that earns its place: `end` is the left-hand side there, and a
   * physical value would have been invisible in English.
   */
  ['components-textfield--affixes-and-alignment', 'textfield-affixes'],
  ['components-numberfield--affixes-and-alignment', 'numberfield-affixes'],
  /*
   * The counter, including the panel where the same limit is written in two
   * languages — the one place a field writes a number of its own.
   */
  ['components-textfield--character-count', 'textfield-counter'],
  ['components-textarea--character-count', 'textarea-counter'],
  /*
   * The clear button, and the panel that matters: four states where it has
   * nothing to offer and still holds its width. If the room ever stops being
   * reserved, those four boxes get wider than the ones beside them.
   */
  ['components-textfield--clearing', 'textfield-clearing'],
  ['components-tagsinput--states', 'tagsinput-states'],
  ['components-passwordfield--states', 'passwordfield-states'],
  /*
   * The three stories that photograph a rule rather than a component.
   *
   * A pasted block split into values; the reveal toggle surviving a busy state
   * where every other edge control yields (doc 07 §2.2 rule 2); and a text
   * area grown to its content beside a fixed one with the same words in it.
   */
  ['components-tagsinput--pasting-a-block', 'tagsinput-pasting'],
  [
    'components-passwordfield--the-trailing-edge',
    'passwordfield-trailing-edge'
  ],
  ['components-textarea--growing', 'textarea-growing'],
  ['components-radiogroup--card-states', 'radiogroup-card-states'],
  /*
   * The card variant beside the plain one, which is the only way to see
   * whether the two read as one component (doc 09 §10) — and the numeric
   * cross, where the third panel is rule 4 refusing two controls at one edge.
   */
  ['components-radiogroup--cards', 'radiogroup-cards'],
  ['components-numberfield--clearing', 'numberfield-clearing'],
  /*
   * The first layer, and the first stories that had to solve a problem no flat
   * component has: a dialog renders in a PORTAL, so `data-bb-mode` on a
   * catalog panel never reaches it. These pictures work because the story
   * passes its own page as the portal container, which means they are also the
   * proof that doc 08 §8's received container works — in the wrong mode they
   * would be visibly wrong.
   *
   * One dialog per picture, never two side by side. A fixed scrim fills the
   * window so two would overlap, and two open modal layers make each other
   * inert, which is the state axe skips — so a side-by-side story would also
   * be the one story where contrast went unchecked.
   *
   * `dialog-scrolling` is the one to look at hardest: the header and footer pin
   * INSIDE the scrolling element, which is the same element the base focuses,
   * and that structure exists so the keyboard can scroll from the moment the
   * dialog opens.
   */
  ['components-dialog--light', 'dialog-light'],
  ['components-dialog--dark', 'dialog-dark'],
  ['components-dialog--scrolling', 'dialog-scrolling'],
  ['components-dialog--with-a-form', 'dialog-with-form'],
  ['components-dialog--without-a-footer', 'dialog-no-footer'],
  /*
   * The drawer. `drawer-rtl` is the one that earns its place: the SAME
   * `side="start"` has to be on the other side of the window in Arabic, with
   * its border on the other edge, and that is invisible in English.
   */
  ['components-drawer--light', 'drawer-light'],
  ['components-drawer--dark', 'drawer-dark'],
  ['components-drawer--bottom-sheet', 'drawer-bottom'],
  ['components-drawer--scrolling', 'drawer-scrolling'],
  /*
   * The confirmation. `confirm-greyscale` is the one that earns its place and
   * it is not decoration: doc 06 §3 forbids colour as the only channel, so the
   * glyph's SILHOUETTE has to carry the tone with the hue gone — and a
   * screenshot in greyscale is the only way to see whether it does.
   *
   * `confirm-after-a-failure` photographs the decision: a rejected promise
   * leaves the dialog open so the consumer can say what went wrong where it
   * went wrong.
   *
   * And both of them photograph something nobody planned for: the FOCUS RING
   * is on Cancel. `ConfirmDialog` is the only component that focuses a control
   * on open — doc 09 §5.5, the destructive answer is not the focused one — so
   * a change that moved focus to Delete would change these pictures as well as
   * failing `confirm.spec.ts`. A second, accidental guard on the decision that
   * matters most here, and worth not breaking by making these stories
   * unfocused.
   */
  ['components-confirmdialog--light', 'confirm-light'],
  ['components-confirmdialog--dark', 'confirm-dark'],
  ['components-confirmdialog--greyscale', 'confirm-greyscale'],
  ['components-confirmdialog--after-a-failure', 'confirm-after-a-failure'],
  ['components-confirmdialog--long-words', 'confirm-long-words'],
  /*
   * The popover, and unlike a tooltip it CAN be photographed at rest —
   * `defaultOpen` is a real prop rather than one invented for this suite.
   *
   * `popover-long-text` is the one that earns its place, and it earns it
   * because of what these pictures did not catch. The panel is the only one in
   * the library sized BY its content, and with inline-size containment on it
   * every popover rendered 2px wide: a picture would have shown that
   * instantly, and there was no picture. The width is now asserted in
   * `popover.spec.ts` as well, with a floor rather than only a ceiling — a
   * baseline and an assertion, because this failure was invisible to the
   * assertions that existed and there was nothing else looking.
   *
   * `popover-arrow` photographs the shared arrow on its second caller, where
   * the shape has to keep agreeing with a border that is now a different
   * radius from a tooltip's.
   */
  ['components-popover--light', 'popover-light'],
  ['components-popover--dark', 'popover-dark'],
  ['components-popover--arrow', 'popover-arrow'],
  ['components-popover--scrolling', 'popover-scrolling'],
  ['components-popover--no-footer', 'popover-no-footer'],
  ['components-popover--long-text', 'popover-long-text'],
  ['components-popover--not-dismissable', 'popover-not-dismissable']
];

for (const [id, name] of STATES) {
  test(`states: ${name}`, async ({ page }) => {
    await capture(page, id, name);
  });
}

/*
 * The composite pages. Doc 09 §10: "component by component everything looks
 * correct; together is where the three greys you thought were one show up."
 * These are the highest-value baselines in the file.
 */
const TOGETHER: Array<[string, string]> = [
  ['components-checkbox--in-a-form', 'form-light-normal'],
  ['components-checkbox--in-a-form-dark-compact', 'form-dark-compact'],
  ['components-numberfield--aligns-with-others', 'alignment-across-controls'],
  ['components-textfield--aligns-with-button', 'alignment-field-and-button'],
  /* Three surfaces that are three different tokens and look like one grey
     until they are beside each other: the page, a Card, and the sections
     inside it. */
  ['components-accordion--inside-a-card', 'accordion-inside-a-card'],
  ['components-collapsible--together', 'collapsible-together'],
  /* The two nobody must confuse: a link is accent and underlined at rest, a
     link-shaped button is ordinary text until pointed at. Apart, either looks
     fine; the baseline that matters is the one with both in it. */
  ['components-link--against-a-button', 'link-against-a-button'],
  /* The two pagers side by side. Apart they look like one component with a
     feature missing; together the difference is the point (decision 0014). */
  [
    'components-cursorpagination--against-the-other-one',
    'pagers-against-each-other'
  ],
  /* Where a menu actually goes: behind a mark at the end of a row, with the
     name on the button and nowhere else. */
  ['components-menu--in-a-row', 'menu-in-a-row'],
  /* Where a split button actually goes: the primary action of a footer, beside
     the ordinary way out. Doc 03 §9's alignment check, one control further. */
  ['components-splitbutton--in-a-footer', 'split-button-in-a-footer'],
  /* The row doc 03 §9 asks for by name: a field, a select and a button of the
     same size, the same height, from the same tokens. */
  ['components-select--aligns-with-others', 'alignment-select-in-a-row'],
  /* Where a trail actually goes: above a heading and the page it describes,
     quieter than both. */
  ['components-breadcrumbs--above-page-content', 'breadcrumbs-above-content']
];

for (const [id, name] of TOGETHER) {
  test(`together: ${name}`, async ({ page }) => {
    await capture(page, id, name);
  });
}

/*
 * The theme axes. Captured on stories that already show two scopes side by
 * side, so one screenshot covers both halves of an axis — and a difference
 * between them is visible in the image itself, not only in the diff.
 */
const AXES: Array<[string, string]> = [
  ['components-button--modes', 'axis-modes'],
  ['components-button--densities', 'axis-densities'],
  ['components-button--direction', 'axis-direction'],
  ['components-button--brand-override', 'axis-brand'],
  ['components-button--all-axes', 'axis-all-at-once'],
  ['components-numberfield--locales', 'axis-locales'],
  ['components-switch--direction', 'axis-switch-direction'],
  /* The two axes a layer can genuinely differ on: the scrim's inset and the
     panel's padding both follow density, and the cross and the footer's
     actions both change end in RTL. */
  ['components-dialog--compact', 'axis-dialog-compact'],
  ['components-dialog--direction', 'axis-dialog-rtl'],
  ['components-dialog--brand-override', 'axis-dialog-brand'],
  /* The drawer's own two axes: the direction, where start and end swap sides
     and the border swaps with them, and density on every padding inside. */
  ['components-drawer--direction', 'axis-drawer-rtl'],
  ['components-drawer--compact', 'axis-drawer-compact'],
  ['components-confirmdialog--direction', 'axis-confirm-rtl'],
  /* The popover's two: RTL, where the panel aligns to the other edge of its
     trigger and the close button crosses the header, and density on the
     paddings of a panel whose WIDTH is its content — so compact changes the
     size of the box itself here, which it does not do to a dialog. */
  ['components-popover--direction', 'axis-popover-rtl'],
  ['components-popover--compact', 'axis-popover-compact'],
  /* A section's two: RTL, where the chevron crosses to the other edge and the
     mark itself does NOT turn round because down is down in Arabic, and
     density, which trims the header, the panel and the gap between sections
     at once. */
  ['components-accordion--direction', 'axis-accordion-rtl'],
  ['components-accordion--densities', 'axis-accordion-densities'],
  /* A link's colour is defined per mode rather than derived — step 9 in light,
     step 11 in dark — and it is accent text, so it follows an overridden
     brand. RTL is deliberately not captured: nothing in the component is
     directional, so the shot would be a near-duplicate (the story is still
     there, and axe walks it). */
  ['components-link--modes', 'axis-link-modes'],
  ['components-link--brand-override', 'axis-link-brand'],
  /* The separator is the first icon the library draws that is DIRECTIONAL, so
     RTL is the highest-value shot this component has: the chevron turns the
     other quarter and the order of the whole trail reverses. */
  ['components-breadcrumbs--direction', 'axis-breadcrumbs-rtl'],
  ['components-breadcrumbs--together', 'axis-breadcrumbs-together'],
  /* A pager's own axes: RTL, where the chevrons turn round AND the digits
     become Arabic-Indic, and the three theme scopes on one page. */
  ['components-pagination--direction', 'axis-pagination-rtl'],
  ['components-pagination--together', 'axis-pagination-together'],
  /* A menu's three: the dark surface, the density that reaches a portalled
     layer, and RTL where it aligns to the other edge of its trigger. */
  ['components-menu--dark', 'axis-menu-dark'],
  ['components-menu--compact', 'axis-menu-compact'],
  ['components-menu--direction', 'axis-menu-rtl'],
  /* A select's own three, all with the list open — the axis reaches a
     portalled layer only because it is mounted inside the page. */
  ['components-select--dark', 'axis-select-dark'],
  ['components-select--compact', 'axis-select-compact'],
  ['components-select--direction', 'axis-select-rtl'],
  /* And the brand, because the accent is what marks the chosen option: the
     tick and the ring are the two places an overridden theme has to arrive,
     and one of them is inside a portalled layer. */
  ['components-select--brand-override', 'axis-select-brand'],
  /* And the tabs' three axes plus the brand, which has to reach the one thing
     that marks the open tab: the rule under it. */
  /* And the time picker's RTL, where the list aligns to the other edge of the
     trigger and the rows are read from the right. */
  ['components-timepicker--direction', 'axis-time-picker-rtl'],
  /* And the slider's RTL, which is the axis it has a defect history on: the
     fill's offset is a logical CSS property and the handle's is a computed
     percentage the base mirrors from the LOCALE, so the two can disagree and
     put the handle at the wrong end of its own fill. Measured once, asserted
     in the checks, and photographed here because it is a geometry. */
  ['components-slider--direction', 'axis-slider-rtl'],
  /* And the uploader's two, where RTL is the interesting one for a reason
     that is not the layout: the row mirrors in CSS, and the SIZE beside the
     name goes through `Intl` in the received locale — so the story declares
     `ar-EG` rather than a direction and the picture is the two mechanisms
     agreeing (doc 05 §4.1). Compact trims the zone's padding and the gap
     between rows while the file names keep their size. */
  ['components-fileupload--direction', 'axis-file-upload-rtl'],
  ['components-fileupload--compact', 'axis-file-upload-compact'],
  /* And the button group's brand, for the half of the seam a default theme
     cannot show: the primary line is mixed from `--bb-accent-on` rather than
     chosen beside it, so an overridden brand has to arrive in it without
     anything being told. The same claim the split button's divider makes, on
     an unknown number of children. */
  ['components-buttongroup--brand-override', 'axis-button-group-brand'],
  /* And the split button's four, because the divider is mixed from the pair's
     own text colour and has to follow every one of them. */
  ['components-splitbutton--dark', 'axis-split-button-dark'],
  ['components-splitbutton--compact', 'axis-split-button-compact'],
  ['components-splitbutton--direction', 'axis-split-button-rtl'],
  ['components-splitbutton--brand-override', 'axis-split-button-brand'],
  ['components-tabs--dark', 'axis-tabs-dark'],
  ['components-tabs--compact', 'axis-tabs-compact'],
  ['components-tabs--direction', 'axis-tabs-rtl'],
  ['components-tabs--brand-override', 'axis-tabs-brand'],
  /*
   * The right-to-left capture is for the LAYOUT, and the first version of this
   * comment said it was for the sort mark — which is wrong twice. The mark is
   * invisible until a column is sorted, and it is a chevron on the block axis,
   * so it does not mirror at all. What the panel checks is the column order,
   * the alignment `text-start` resolves to, and the inline padding.
   *
   * The story it photographs also had to be corrected: set the locale alone
   * and the table renders left to right, because `I18nProvider` tells
   * JAVASCRIPT and puts no `dir` in the DOM.
   */
  ['components-table--dark', 'axis-table-dark'],
  ['components-table--compact', 'axis-table-compact'],
  ['components-table--direction', 'axis-table-rtl'],
  ['components-table--brand-override', 'axis-table-brand']
];

for (const [id, name] of AXES) {
  test(`axis: ${name}`, async ({ page }) => {
    await capture(page, id, name);
  });
}

/*
 * Some layers cannot be photographed at rest.
 *
 * A tooltip has no `isOpen` prop — its whole behaviour is hover and focus, and
 * a prop to pin one open would exist for this suite and for nobody else (P5).
 * So the shot is taken after an interaction, and the interaction is part of
 * what the picture is of.
 *
 * THE MOUSE HAS TO TRAVEL, which is `travelTo` in `e2e/pointer.ts`. That file
 * carries the measured reason, and it is not the one this comment used to
 * give: the base's `useHover` filters nothing about movement — the gate is the
 * global interaction modality, which a single move cannot set for itself
 * because the boundary events precede the move that caused them.
 *
 * And the layer has to have STOPPED. It scales in, so a frame captured while
 * `data-entering` is set is a frame mid-animation. `animations: 'disabled'`
 * freezes at the end state, which handles it — but waiting for the attribute
 * to go is what makes the shot deterministic rather than dependent on that.
 */
const captureAfterHover = async (
  page: import('@playwright/test').Page,
  id: string,
  name: string,
  testId: string,
  /*
   * WHICH LAYER TO WAIT FOR, and it is a parameter because there are now two
   * kinds of hover layer with nothing in common to wait on. A tooltip is
   * `role="tooltip"`; a preview's panel is `role="dialog"`, which every modal
   * layer in the catalog also is, so waiting for the role would resolve
   * against the wrong thing. Its class is what identifies it.
   *
   * A default keeps the tooltip rows reading as they did.
   */
  layerSelector = '[role=tooltip]'
) => {
  await gotoStory(page, id);

  await travelTo(page, page.getByTestId(testId));

  const layer = page.locator(layerSelector);
  await expect(layer).toBeVisible({ timeout: 3000 });
  await expect(layer).not.toHaveAttribute('data-entering', /.*/);

  await shoot(page, name);
};

/*
 * The hover layers. One per mode plus the two that carry a rule: the arrow
 * turning with the direction, and a long value wrapping at the maximum width
 * rather than spanning the window.
 */
const ON_HOVER: Array<[string, string, string, string?]> = [
  ['components-tooltip--light', 'tooltip-light', 'trigger'],
  ['components-tooltip--dark', 'tooltip-dark', 'trigger'],
  ['components-tooltip--direction', 'tooltip-rtl', 'trigger'],
  ['components-tooltip--long-text', 'tooltip-long-text', 'trigger'],
  ['components-tooltip--nodes', 'tooltip-nodes', 'trigger'],
  /*
   * The preview, the second hover layer and the first one with a picture worth
   * arguing about: `preview-interactive` is the shot that shows what separates
   * this component from a tooltip, because the thing in the card is something
   * you can press.
   *
   * `preview-long-text` is here for the reason `Popover` taught: the panel is
   * content-sized, and the failure mode of a content-sized panel is a picture
   * nobody took. Its width is asserted in `preview.spec.ts` as well, with a
   * floor.
   */
  ['components-preview--light', 'preview-light', 'trigger', '.bb-preview'],
  ['components-preview--dark', 'preview-dark', 'trigger', '.bb-preview'],
  [
    'components-preview--interactive',
    'preview-interactive',
    'trigger',
    '.bb-preview'
  ],
  [
    'components-preview--text-only',
    'preview-text-only',
    'trigger',
    '.bb-preview'
  ],
  [
    'components-preview--long-text',
    'preview-long-text',
    'trigger',
    '.bb-preview'
  ],
  /* The preview's own two axes: RTL, where the card aligns to the other edge of
     its trigger and the arrow turns with it, and density on its paddings —
     which moves the size of the box itself, because the width is the content's. */
  [
    'components-preview--direction',
    'axis-preview-rtl',
    'trigger',
    '.bb-preview'
  ],
  [
    'components-preview--compact',
    'axis-preview-compact',
    'trigger',
    '.bb-preview'
  ]
];

/*
 * And some layers cannot be photographed until something HAPPENS.
 *
 * A notice exists because an action had an outcome, and there is no prop to
 * conjure one: the queue belongs to the consumer, so the only way to get a
 * notice on screen is to add one. So the shot is taken after a press, and the
 * press is part of what the picture is of.
 *
 * WHAT THESE PICTURES CANNOT SHOW, stated here because a reader will look for
 * it: the countdown. `animations: 'disabled'` finishes every animation before
 * capturing, which is what makes these baselines reproducible at a zero pixel
 * threshold — and the countdown's finished state is a bar of no width. So the
 * bar is absent from every one of these, and its behaviour is measured instead,
 * in `toast.spec.ts`: that it shrinks, that it stops while the pointer is on
 * the stack, that a ten-second notice has more left than a six-second one, and
 * that a `danger` notice has no bar to begin with.
 *
 * That is the right division rather than a shortfall. A photograph of a bar
 * part-way along would be a photograph of one moment, and the assertion that
 * two bars differ after the same wait says the thing that actually matters.
 */
const AFTER_PRESS: Array<[string, string, string]> = [
  ['components-toast--light', 'toast-light', 'send'],
  ['components-toast--dark', 'toast-dark', 'send'],
  ['components-toast--tones', 'toast-tones', 'send'],
  ['components-toast--long-text', 'toast-long-text', 'send'],
  ['components-toast--overflow', 'toast-overflow', 'send'],
  /*
   * The one that earns its place twice over: a notice above an open dialog is
   * the arrangement doc 08 §1 verified for the layer base, and the one that
   * made no exit animation non-negotiable (doc 09 §2.1).
   */
  ['components-toast--above-a-dialog', 'toast-above-a-dialog', 'send'],
  /* The toast's own two axes: RTL, where the stack pins to the other side and
     the glyph and cross swap with it, and density on the paddings. */
  ['components-toast--direction', 'axis-toast-rtl', 'send'],
  ['components-toast--compact', 'axis-toast-compact', 'send']
];

for (const [id, name, testId] of AFTER_PRESS) {
  test(`after press: ${name}`, async ({ page }) => {
    await gotoStory(page, id);
    await page.getByTestId(testId).click();

    const notice = page.locator('.bb-toast').first();
    await expect(notice).toBeVisible();
    await expect(notice).not.toHaveAttribute('data-entering', /.*/);

    try {
      await shoot(page, name);
    } catch (cause) {
      /*
       * WHICH OF THE TWO FAILURES THIS IS. A notice carries its own life —
       * six seconds, ten with an action (`internal/Layer/timing.ts`) — and
       * `e2e/clock` FIXES the instant rather than freezing it, deliberately,
       * so that timer runs while `toHaveScreenshot` retries a mismatch.
       * Retried past the dismissal, the comparison is against an empty page
       * and the diff reads "everything moved" rather than saying what changed.
       *
       * Read only once the shot has already failed, and that placement is the
       * point: the same assertion after a PASSING shot would redden a run
       * whose only fault was being slow, and would never run on the path it
       * was written for (doc 10 §11.3).
       */
      throw new Error(
        `${name} did not match, and the notice was ` +
          ((await notice.count()) === 0
            ? 'already gone — read the diff as a dismissal rather than as a change'
            : 'still on screen, so the diff is a real difference'),
        { cause }
      );
    }
  });
}

for (const [id, name, testId, layerSelector] of ON_HOVER) {
  test(`on hover: ${name}`, async ({ page }) => {
    await captureAfterHover(page, id, name, testId, layerSelector);
  });
}
