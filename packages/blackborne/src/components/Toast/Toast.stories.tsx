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
import { useEffect, useState } from 'react';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { LayerPage as Page } from '../../catalog/layerPage';
import { ToastRegion, type ToastPlacement } from './ToastRegion';
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

/*
 * THE EIGHT PLACEMENTS, ONE STORY EACH, AND ONE PICTURE BETWEEN THEM.
 *
 * The first version of this put all eight regions on one page, to get the
 * whole axis into a single baseline. axe refused it, correctly and for the
 * reason this component's own props document: a region is a LANDMARK, and
 * eight landmarks with one role and one name is `landmark-unique`. The rule
 * that says a page has one toast region is not a style guideline, and a
 * catalog that models a broken arrangement to save a screenshot is teaching
 * the wrong thing.
 *
 * So the axis is covered the way an axis should be: by a CHECK that walks all
 * eight and measures where each box lands (`toast.spec.ts`), and by ONE
 * picture — `top`, the placement most unlike the default — so the feature is
 * visible in the catalog without eight near-identical baselines of one card in
 * eight corners.
 */
/*
 * THE ANNOTATION ON EACH EXPORT IS LOAD-BEARING, not decoration.
 *
 * This catalog finds its stories by matching `export const X: Story` across
 * the source, in two places: `check:claims`, which counts them without a
 * build, and the accessibility suite's guard that the built index and the
 * files agree. A factory export with the type inferred is invisible to both —
 * measured, these eight were in `index.json` and absent from the scan, and
 * the guard reported them as stories the catalog had invented.
 *
 * Which is the guard working: the two sides disagreed and it said so.
 */
const placed = (placement: ToastPlacement): Story => ({
  render: () => {
    function Demo() {
      const toasts = useToasts();
      /* On mount: a press per story is a press that can be missed. */
      useEffect(() => {
        toasts.add({ tone: 'neutral', title: placement, isPersistent: true });
      }, [toasts]);
      return (
        <Page label={`A region placed at ${placement}.`}>
          <ToastRegion queue={toasts} placement={placement} />
        </Page>
      );
    }

    return <Demo />;
  }
});

export const PlacedTopStart: Story = placed('top start');
export const PlacedTop: Story = placed('top');
export const PlacedTopEnd: Story = placed('top end');
export const PlacedMiddleStart: Story = placed('middle start');
export const PlacedMiddleEnd: Story = placed('middle end');
export const PlacedBottomStart: Story = placed('bottom start');
export const PlacedBottom: Story = placed('bottom');
export const PlacedBottomEnd: Story = placed('bottom end');

/*
 * THE TINTED VARIANT, which is the other way a notice can carry its tone: the
 * whole card in the tone's own surface rather than a neutral card with the
 * tone on its edge.
 *
 * A story of its own rather than a second scope inside `Tones`, because a
 * region is `position: fixed` and two of them in one story would stack in the
 * same corner rather than sit side by side.
 */
export const Tinted: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();

      return (
        <Page label="The same five tones, filled." mode="light">
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
          <ToastRegion queue={toasts} variant="tinted" />
        </Page>
      );
    }

    return <Demo />;
  }
};

export const TintedDark: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();

      return (
        <Page label="The same five tones, filled." mode="dark">
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
          <ToastRegion queue={toasts} variant="tinted" />
        </Page>
      );
    }

    return <Demo />;
  }
};

/*
 * `neutral`, and WHETHER A NOTICE STAYS, which are the two things that are
 * easiest to believe without looking.
 *
 * A neutral notice has no badge at all — there is no outcome for a silhouette
 * to carry — so this is where that absence is visible beside four that have
 * one.
 *
 * And persistence is no longer the tone's: the `danger` here leaves on a timer
 * because it was told to, and the `success` stays because it was told to. Doc
 * 09 §4.1 separates the two questions, and a picture of a ring on one card and
 * none on the other is what makes the separation checkable.
 */
export const NeutralAndPersistence: Story = {
  render: () => {
    function Demo() {
      const toasts = useToasts();

      return (
        <Page label="No state, and two notices with the default reversed.">
          <Button
            data-testid="send"
            onPress={() => {
              toasts.add({
                tone: 'success',
                title: 'The export is ready — it stays until dismissed',
                isPersistent: true
              });
              toasts.add({
                tone: 'danger',
                title: 'Nothing matched — this one leaves',
                isPersistent: false
              });
              toasts.add({
                tone: 'neutral',
                title: 'The plan renews on 3 March'
              });
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
