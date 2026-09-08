/*
 * The visual catalog for ConfirmDialog.
 *
 * Read the note at the top of `Dialog.stories.tsx` first: a layer renders in a
 * portal, so `data-bb-mode` on a catalog panel never reaches it, and the way
 * round is to pass a themed page as `portalContainer`. One layer per story,
 * never two side by side — a fixed scrim fills the window and two open modal
 * layers make each other `inert`, which is the state axe skips.
 *
 * The story that matters most here is `Failing`. It is the one place the whole
 * async decision is visible: the promise rejects, the dialog STAYS OPEN, and
 * the consumer puts an `Alert` in it. Doc 09 §4 — the error is shown where the
 * problem happened, and the problem happened in this dialog.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayerPage as Page } from '../../catalog/layerPage';
import { ConfirmDialog, type ConfirmTone } from './ConfirmDialog';
import { Alert } from '../Alert';
import { Button } from '../Button';

const TONES = [
  'info',
  'warning',
  'danger'
] as const satisfies readonly ConfirmTone[];

/*
 * Fails to compile if a tone is added to the component and not here. A plain
 * `ConfirmTone[]` annotation only checks that every entry IS a tone, not that
 * every tone is an entry, so a fourth would drop silently out of every story
 * and out of the screenshots guarding them.
 */
const MISSING: Exclude<ConfirmTone, (typeof TONES)[number]>[] = [];
void MISSING;

/** Real questions, in the words doc 09 §5.4 asks for: the button names the
 * action, and the body says what it costs. */
const QUESTION: Record<
  ConfirmTone,
  { title: string; body: string; action: string }
> = {
  info: {
    title: 'Send the statement to 42 customers?',
    body: 'Each one receives their own balance as at today. Nothing is charged.',
    action: 'Send the statements'
  },
  warning: {
    title: 'Discard the changes to this invoice?',
    body: 'The three lines you added and the changed due date are not kept.',
    action: 'Discard'
  },
  danger: {
    title: 'Delete customer 4821?',
    body: 'Their invoices are kept and stay searchable. This cannot be undone.',
    action: 'Delete'
  }
};

const meta = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  args: { title: 'Delete customer 4821?', confirmLabel: 'Delete' },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opened and closed for real, which is where the focus decision is visible:
 * it lands on Cancel, not on Delete. */
export const Overview: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setOpen] = useState(false);
      const [deleted, setDeleted] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            Focus lands on Cancel (doc 09 §5.5), so a reflex press deletes
            nothing.
          </p>
          <div className="catalog-row">
            <Button
              variant="danger"
              data-testid="open"
              onPress={() => setOpen(true)}
            >
              Delete customer
            </Button>
            <Button variant="ghost" data-testid="decoy">
              A decoy, so focus return has somewhere wrong to land
            </Button>
          </div>
          {deleted ? (
            <Alert tone="success" title="Customer deleted">
              4821 is gone. Their invoices are still searchable.
            </Alert>
          ) : null}
          <ConfirmDialog
            isOpen={isOpen}
            onOpenChange={setOpen}
            tone="danger"
            title={QUESTION.danger.title}
            confirmLabel={QUESTION.danger.action}
            onConfirm={() => setDeleted(true)}
          >
            {QUESTION.danger.body}
          </ConfirmDialog>
        </div>
      );
    }
    return <Demo />;
  }
};

/** The three tones, one at a time. `success` is not one of them: you confirm
 * only when there is no way back, and nothing has happened yet. */
export const Tones: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState<ConfirmTone | null>(null);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            Three tones, two button appearances. `warning` confirms in danger
            too: discarding what somebody typed is destructive even when nothing
            is deleted.
          </p>
          <div className="catalog-row">
            {TONES.map(tone => (
              <Button
                key={tone}
                data-testid={`open-${tone}`}
                onPress={() => setOpen(tone)}
              >
                {tone}
              </Button>
            ))}
          </div>
          {open === null ? null : (
            <ConfirmDialog
              isOpen
              onOpenChange={() => setOpen(null)}
              tone={open}
              title={QUESTION[open].title}
              confirmLabel={QUESTION[open].action}
            >
              {QUESTION[open].body}
            </ConfirmDialog>
          )}
        </div>
      );
    }
    return <Demo />;
  }
};

/** Light, at rest. The glyph carries the tone, and the words stay the ordinary
 * text colour so the message does not compete with the question. */
export const Light: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="danger"
        title={QUESTION.danger.title}
        confirmLabel={QUESTION.danger.action}
      >
        {QUESTION.danger.body}
      </ConfirmDialog>
    </Page>
  )
};

/** Dark. Worth looking at the glyph: the tone families are restated per mode,
 * and this is the first component to draw one on a raised surface. */
export const Dark: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="dark"
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="warning"
        title={QUESTION.warning.title}
        confirmLabel={QUESTION.warning.action}
      >
        {QUESTION.warning.body}
      </ConfirmDialog>
    </Page>
  )
};

/** In greyscale, which is the check the glyph exists for: three tones that must
 * be tellable apart with the hue gone (doc 06 §3). */
export const Greyscale: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
      isGreyscale
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="warning"
        title={QUESTION.warning.title}
        confirmLabel={QUESTION.warning.action}
      >
        {QUESTION.warning.body}
      </ConfirmDialog>
    </Page>
  )
};

/**
 * A confirmation that waits for its work, so the pending state is real rather
 * than described. Two seconds, because doc 09 §3 puts "indicate it is still
 * going" past one.
 */
export const Asynchronous: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setOpen] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            While it is in flight: the button says it is working, cancelling is
            off, and Escape does nothing.
          </p>
          <Button
            variant="danger"
            data-testid="open"
            onPress={() => setOpen(true)}
          >
            Delete customer
          </Button>
          <ConfirmDialog
            isOpen={isOpen}
            onOpenChange={setOpen}
            tone="danger"
            title={QUESTION.danger.title}
            confirmLabel={QUESTION.danger.action}
            onConfirm={() =>
              new Promise(resolve => {
                setTimeout(resolve, 2000);
              })
            }
          >
            {QUESTION.danger.body}
          </ConfirmDialog>
        </div>
      );
    }
    return <Demo />;
  }
};

/**
 * **The decision, made visible.** The promise rejects and the dialog stays
 * open, so the consumer can say what went wrong where it went wrong (doc 09
 * §4). Closing instead would leave somebody looking at a listing with no idea
 * whether the delete happened.
 *
 * And a consumer who would rather it closed is one `.catch()` away: catching
 * makes the promise fulfil.
 */
export const Failing: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setOpen] = useState(false);
      const [error, setError] = useState<string | null>(null);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <Button
            variant="danger"
            data-testid="open"
            onPress={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Delete customer
          </Button>
          <ConfirmDialog
            isOpen={isOpen}
            onOpenChange={setOpen}
            tone="danger"
            title={QUESTION.danger.title}
            confirmLabel={QUESTION.danger.action}
            onConfirm={() =>
              new Promise((_resolve, reject) => {
                setTimeout(() => {
                  setError(
                    'The customer has an unpaid invoice. Settle it first, or void the invoice.'
                  );
                  reject(new Error('unpaid invoice'));
                }, 800);
              })
            }
          >
            <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
              {error === null ? null : (
                <Alert tone="danger" title="The customer was not deleted">
                  {error}
                </Alert>
              )}
              {QUESTION.danger.body}
            </div>
          </ConfirmDialog>
        </div>
      );
    }
    return <Demo />;
  }
};

/** The same failure at rest, for the picture. */
export const AfterAFailure: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="danger"
        title={QUESTION.danger.title}
        confirmLabel={QUESTION.danger.action}
      >
        <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
          <Alert tone="danger" title="The customer was not deleted">
            The customer has an unpaid invoice. Settle it first, or void the
            invoice.
          </Alert>
          {QUESTION.danger.body}
        </div>
      </ConfirmDialog>
    </Page>
  )
};

/** Compact density. */
export const Compact: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      density="compact"
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="danger"
        title={QUESTION.danger.title}
        confirmLabel={QUESTION.danger.action}
      >
        {QUESTION.danger.body}
      </ConfirmDialog>
    </Page>
  )
};

/** RTL. The glyph moves to the other end of the header and the answers
 * reverse, with the confirming one still at the inline end. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      dir="rtl"
      locale="ar-EG"
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="danger"
        title="حذف العميل ٤٨٢١؟"
        confirmLabel="حذف"
      >
        تُحفظ فواتيره وتبقى قابلة للبحث. لا يمكن التراجع عن هذا.
      </ConfirmDialog>
    </Page>
  )
};

/**
 * A long question and a long action, which doc 05 §5 asks of everything: no
 * width is sized so one particular label fits, and a short string is the
 * dangerous one — "Delete" is one word in English and several in German.
 */
export const LongWords: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
    >
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        tone="warning"
        title="Discard the changes to this invoice and every credit note issued against it?"
        confirmLabel="Discard everything and start again"
      >
        The three lines you added, the changed due date and both credit notes
        are not kept.
      </ConfirmDialog>
    </Page>
  )
};
