/*
 * The visual catalog for Toast.
 *
 * **The queue is the consumer's**, so every story here builds the shape a
 * consumer builds: `useToasts()` at the top, one `ToastRegion`, and buttons
 * that add to it. There is no story that shows a notice without somebody
 * having asked for one, because there is no way to make one appear without
 * adding it — which is the point of the component owning no global state.
 *
 * **Nothing can be photographed at rest**, and for a different reason from the
 * hover layers: a notice exists because something happened. The visual suite
 * presses a button and then captures, and the press is part of what the picture
 * is of.
 *
 * **And every story that is photographed uses `Page`**, which is not decoration
 * either. The region is `position: fixed` at the bottom of the window, and the
 * visual suite photographs the `body` element rather than the viewport — so in
 * a story whose content is 160px tall, the notice appears 700px below anything
 * the picture contains. Two baselines were generated that way before it was
 * noticed: a button, a label, and no notice at all. `Page` fills the window, so
 * the two boxes coincide.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { LayerPage as Page } from '../../catalog/layerPage';
import { ToastRegion } from './ToastRegion';
import { useToasts } from './useToasts';

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
  /*
   * `queue` is required and every story makes its own with the hook, so this
   * only satisfies the type. A queue built here rather than in a component
   * would be shared between stories, which is the one thing this component's
   * whole design is against.
   */
  args: { queue: { add: () => '', close: () => {}, clear: () => {} } },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What a consumer builds: a queue, one region, and something that adds to it.
 *
 * **Worth trying by hand**, because three things are only visible in the doing:
 *
 * - The bar along the bottom edge is the time left, and **hovering the stack
 *   stops it** — every timer in the region at once. That pair is what makes an
 *   automatic dismissal acceptable rather than a trap (doc 09 §4.1).
 * - Press *Delete* and the notice carrying **Undo** stays four seconds longer
 *   than the plain one, because the action is the point.
 * - Press *Fail* and nothing counts down at all. A `danger` notice does not
 *   leave on its own, ever.
 */
export const Overview: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();

      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            Press one. Then put the pointer on the notice.
          </p>
          <div className="catalog-row">
            <Button
              data-testid="send"
              onPress={() => {
                toasts.add({ tone: 'success', title: 'Invoice INV-4821 sent' });
              }}
            >
              Send
            </Button>
            <Button
              variant="danger"
              data-testid="delete"
              onPress={() => {
                toasts.add({
                  title: 'Customer 4821 deleted',
                  action: { label: 'Undo', onPress: () => {} }
                });
              }}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              data-testid="fail"
              onPress={() => {
                toasts.add({
                  tone: 'danger',
                  title: 'Could not reach the tax service. Nothing was sent.'
                });
              }}
            >
              Fail
            </Button>
          </div>
          <ToastRegion queue={toasts} />
        </div>
      );
    }

    return <Demo />;
  }
};

/** The four tones, which are `Alert`'s four and carry the same glyphs — in
 * greyscale the silhouette is what tells a warning from a danger (doc 06 §3). */
export const Tones: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();

      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          mode="light"
        >
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({
                tone: 'danger',
                title: 'Could not save the invoice'
              });
              toasts.add({
                tone: 'warning',
                title: 'Two lines have no tax code'
              });
              toasts.add({ tone: 'success', title: 'Invoice INV-4821 sent' });
            }}
          >
            Show three
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/** Light, with the countdown running. */
export const Light: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();
      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          mode="light"
        >
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({ tone: 'success', title: 'Invoice INV-4821 sent' });
            }}
          >
            Send
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();
      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          mode="dark"
        >
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({ tone: 'success', title: 'Invoice INV-4821 sent' });
            }}
          >
            Send
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/** Compact: the density axis reaches a portalled layer because it is mounted
 * inside the page that declares it. */
export const Compact: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();
      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          density="compact"
        >
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({
                title: 'Customer 4821 deleted',
                action: { label: 'Undo', onPress: () => {} }
              });
            }}
          >
            Delete
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/**
 * RTL. The stack is pinned to the inline end, which is the LEFT here, the
 * glyph and the cross swap sides, and the countdown empties from the side the
 * text starts on — nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => {
    function Demo() {
      const toasts = useToasts();
      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          dir="rtl"
          locale="ar-EG"
        >
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({ tone: 'success', title: 'تم إرسال الفاتورة' });
            }}
          >
            إرسال
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/**
 * A notice above an open dialog, which doc 08 §1 verified and this shows: the
 * stacking token puts the region above the overlay, and the notice stays
 * reachable while the dialog is open.
 *
 * It is also the case that made no exit animation non-negotiable (doc 09 §2.1):
 * a layer still mounted while it animates away goes on consuming `Escape`, and
 * a notice is the one layer that can be on screen while a dialog is up.
 */
export const AboveADialog: Story = {
  name: 'Above a dialog',
  render: () => {
    function Demo() {
      const toasts = useToasts();
      const [isOpen, setOpen] = useState(true);

      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          mode="light"
        >
          <Button data-testid="open" onPress={() => setOpen(true)}>
            Edit invoice
          </Button>
          <Dialog
            isOpen={isOpen}
            onOpenChange={setOpen}
            title="Edit invoice INV-4821"
            footer={
              <Button
                variant="primary"
                data-testid="send"
                onPress={() => {
                  toasts.add({
                    tone: 'success',
                    title: 'Invoice INV-4821 sent'
                  });
                }}
              >
                Send
              </Button>
            }
          >
            <p className="catalog-label">
              Press Send. The notice appears above this, and stays reachable.
            </p>
          </Dialog>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/**
 * More than three at once. The newest three are shown, and the rest wait with
 * their full time — a notice that was dropped because two others arrived first
 * would be a message somebody was sent and never saw.
 */
export const Overflow: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();

      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          mode="light"
        >
          <Button
            data-testid="send"
            onPress={() => {
              for (const n of [1, 2, 3, 4, 5]) {
                toasts.add({ title: `Invoice INV-482${n} sent` });
              }
            }}
          >
            Send five
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};

/**
 * A long message, which doc 05 §5 asks of everything. The notice stops at
 * `--container-narrow` and wraps; the glyph stays at the top of the first line
 * and the cross stays where it is.
 */
export const LongText: Story = {
  name: 'Long text',
  render: () => {
    function Demo() {
      const toasts = useToasts();
      return (
        <Page
          label="The page behind, which a notice must not cover the important part of."
          mode="light"
        >
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({
                tone: 'warning',
                title:
                  'Two of the eleven lines on this invoice have no tax code, so the totals shown do not include tax for them.'
              });
            }}
          >
            Save
          </Button>
          <ToastRegion queue={toasts} />
        </Page>
      );
    }

    return <Demo />;
  }
};
