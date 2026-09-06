/*
 * The visual catalog for Alert.
 *
 * These stories are not decoration. Several boxes on the entry gate can only
 * be ticked here: every tone visible at once, light and dark side by side
 * rather than toggled, both densities, LTR next to RTL, a 320px container, and
 * the greyscale check that is the whole reason this component draws a glyph.
 *
 * `Together` is the one doc 09 §10 calls the check that finds the most: tone
 * by tone everything looks right; in one column is where the four greys you
 * thought were one show up.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, type AlertTone } from './Alert';

const TONES = [
  'info',
  'success',
  'warning',
  'danger'
] as const satisfies readonly AlertTone[];

/*
 * Fails to compile if a tone is added to the component and not to TONES.
 *
 * A plain `AlertTone[]` annotation only checks that every entry IS a tone, not
 * that every tone is an entry — so a fifth tone would silently drop out of
 * every story that walks this list, and out of the screenshots guarding them.
 * A catalog that quietly covers less than it appears to is worse than one that
 * covers nothing, because it is trusted.
 */
const MISSING: Exclude<AlertTone, (typeof TONES)[number]>[] = [];
void MISSING;

/** Real management-application messages: what happened, and what to do. */
const TITLE: Record<AlertTone, string> = {
  info: 'Scheduled maintenance on Sunday',
  success: 'Import finished',
  warning: 'Three rows were skipped',
  danger: 'The changes were not saved'
};

const BODY: Record<AlertTone, string> = {
  info: 'The system will be read-only between 02:00 and 04:00. Anything you save before then is kept.',
  success: '1,248 customers were added and 12 were updated.',
  warning:
    'Rows 14, 27 and 31 had no tax identifier. Add one and import those rows again.',
  danger:
    'The connection dropped while saving. What you typed is still here — try again.'
};

/**
 * A panel carrying one combination of the three theme axes.
 *
 * `data-bb-theme` is what makes a brand override take effect: the semantic
 * tokens are recomputed inside that scope. Without it the override silently
 * does nothing (doc 03 §3.1).
 */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/** The four tones, titled, stacked in one column. */
function AllTones({ withTitle = true }: { withTitle?: boolean }) {
  return (
    <div
      className="catalog-stack"
      style={{ maxWidth: 560, gap: 'var(--bb-space-3)' }}
    >
      {TONES.map(tone => (
        <Alert
          key={tone}
          tone={tone}
          {...(withTitle ? { title: TITLE[tone] } : {})}
        >
          {BODY[tone]}
        </Alert>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: {
    tone: 'warning',
    title: TITLE.warning,
    children: BODY.warning
  },
  argTypes: {
    tone: { control: 'select', options: TONES }
  }
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The interactive one. Change the tone from the controls panel. */
export const Playground: Story = {
  render: args => (
    <div style={{ maxWidth: 560 }}>
      <Alert {...args} />
    </div>
  )
};

/**
 * THE STORY THAT FINDS THE MOST (doc 09 §10).
 *
 * All four tones in one column, which is how they actually appear when a save
 * half-succeeded. Two things to look for, and neither is visible one at a
 * time: that the four tints read as one family rather than four unrelated
 * chips, and that the four glyphs sit on the same vertical line beside the
 * first line of each message.
 */
export const Together: Story = {
  render: () => <AllTones />
};

/**
 * THE GREYSCALE CHECK, which is the reason this component draws its own glyph.
 *
 * Doc 06 §3 forbids colour as the only channel, and doc 06 §5 says to verify
 * it by looking at the interface in greyscale. Here that is done for you.
 *
 * What has to be true: a warning and a danger alert are still tellable apart
 * with the hue removed. The triangle against the circles carries most of it,
 * and the "i" and the "!" are each other's inverse so the two circles that
 * remain do not converge.
 */
export const Greyscale: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="In colour">
        <AllTones />
      </Scope>
      <div className="catalog-panel" style={{ filter: 'grayscale(1)' }}>
        <p className="catalog-label">Greyscale</p>
        <AllTones />
      </div>
    </div>
  )
};

/**
 * With and without a title.
 *
 * The title is optional because most messages are one sentence and a title
 * that merely restates it is noise (doc 09 §1). Both shapes have to look
 * deliberate: the untitled one must not read as a titled one whose title
 * failed to load.
 */
export const WithAndWithoutTitle: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="With a title">
        <AllTones />
      </Scope>
      <Scope label="Message only">
        <AllTones withTitle={false} />
      </Scope>
    </div>
  )
};

/**
 * A long, multi-paragraph message.
 *
 * Two things are being checked. The glyph must stay beside the FIRST line
 * rather than drifting to the middle of the paragraph — the failure mode that
 * an alignment done in pixels rather than in line boxes produces. And the
 * paragraphs are the consumer's own elements, which is the point of `children`
 * being a node rather than a string: composition, not a `paragraphs` prop.
 */
export const LongMessage: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Alert tone="danger" title="The import was rolled back">
        <p style={{ margin: 0 }}>
          The file had 1,248 rows. Row 613 referenced a customer that no longer
          exists, and because the whole file is imported as one transaction,
          nothing was written — the previous data is untouched.
        </p>
        <p style={{ margin: 'var(--bb-space-3) 0 0' }}>
          Fix row 613 and import the file again. Rows already accepted in an
          earlier run are recognised and will not be duplicated, so there is no
          need to split the file.
        </p>
        <p style={{ margin: 'var(--bb-space-3) 0 0' }}>
          If the same row fails a second time, the customer reference is
          probably from a different environment. Check the identifier against
          the customer list before retrying.
        </p>
      </Alert>
    </div>
  )
};

/**
 * Light and dark SIDE BY SIDE, never by toggling (doc 03 §6). A dark theme
 * derived from the light one is recognisable at a glance, and the only way to
 * see that is to have both in view.
 */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllTones />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllTones />
      </Scope>
    </div>
  )
};

/**
 * Density moves spacing and no colour (doc 03 §3). Compare the two: the
 * padding tightens, the tints do not move, and the text size does not shrink —
 * compact trims air, not legibility.
 */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Normal" density="normal">
        <AllTones />
      </Scope>
      <Scope label="Compact" density="compact">
        <AllTones />
      </Scope>
    </div>
  )
};

/**
 * LTR next to RTL. The glyph moves to the other side on its own, because
 * nothing here is measured physically — the gap is `gap-x` and the padding is
 * uniform (doc 03 §5, rule 4).
 *
 * The glyphs themselves do not flip, and that is correct: none of them is
 * directional. Doc 02 §11.4 says the library flips the icons it draws when
 * their meaning is directional, and a circle with an exclamation in it means
 * the same thing in both directions.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <AllTones />
      </Scope>
      <Scope label="RTL · Arabic" dir="rtl">
        <div
          className="catalog-stack"
          style={{ maxWidth: 560, gap: 'var(--bb-space-3)' }}
        >
          <Alert tone="success" title="اكتمل الاستيراد">
            تمت إضافة 1,248 عميلاً وتحديث 12 عميلاً.
          </Alert>
          <Alert tone="danger" title="لم يتم حفظ التغييرات">
            انقطع الاتصال أثناء الحفظ. ما كتبته لا يزال موجوداً — حاول مرة أخرى.
          </Alert>
        </div>
      </Scope>
    </div>
  )
};

/**
 * A brand override, which is level 1 of the customisation contract. The four
 * tones must NOT move: they are the state families, and a warning that follows
 * the brand colour stops meaning "warning" (doc 03 §7).
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <AllTones />
      </Scope>
      <Scope label="Overridden brand · light" brand>
        <AllTones />
      </Scope>
      <Scope label="Overridden brand · dark" mode="dark" brand>
        <AllTones />
      </Scope>
    </div>
  )
};

/**
 * All three axes at once, plus RTL. Doc 03 §9 requires this combination
 * explicitly: dark, an alternate brand and compact together.
 */
export const AllAxes: Story = {
  render: () => (
    <Scope
      label="Dark · compact · RTL · overridden brand"
      mode="dark"
      density="compact"
      dir="rtl"
      brand
    >
      <AllTones />
    </Scope>
  )
};

/**
 * Pseudo-localisation. Doc 05 §8 calls this the highest-return test on its
 * list: lengthening every string by roughly 40% finds layout breaks in minutes
 * that otherwise surface the day someone translates to German.
 *
 * The last one is a single unbroken token — the case that bursts a box in
 * silence, and the reason the message column sets `overflow-wrap`.
 */
export const LongLabels: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 560, gap: 'var(--bb-space-3)' }}
    >
      <Alert
        tone="warning"
        title="Drei Zeilen wurden übersprungen und nicht importiert"
      >
        Die Zeilen 14, 27 und 31 enthielten keine Steuernummer. Ergänzen Sie
        diese und importieren Sie die betroffenen Zeilen erneut.
      </Alert>
      <Alert tone="danger" title="Los cambios no se guardaron">
        La conexión se interrumpió mientras se guardaba. Lo que escribiste sigue
        aquí — vuelve a intentarlo.
      </Alert>
      <Alert tone="info" title="Reference">
        IMPORT-2026-09-06-TRANSACTION-8f21c4d9a7b30e15f6c2489de07ab3915c6d240f
      </Alert>
    </div>
  )
};

/**
 * The 320px container from the entry gate, pinned rather than dragged so it is
 * always checked. The window stays wide — that is the point.
 */
export const NarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <AllTones />
    </div>
  )
};
