import type { Decorator, Preview } from '@storybook/react-vite';

/*
 * The catalog imports the BUILT package, exactly as a consumer does — not the
 * source. That means it validates the artifact that actually ships: the
 * compiled, prefixed stylesheet and the published exports. The cost is that
 * `pnpm --filter blackborne build` has to run before changes show up, which is
 * the right trade: a catalog that renders something consumers never receive
 * proves nothing.
 */
import 'blackborne/styles.css';
import './catalog.css';

/*
 * A RESIZABLE CONTAINER, not a resizable window.
 *
 * Doc 04 §10 is explicit that the real test is narrowing the container with
 * the window wide, because that is the situation a consumer is in: the same
 * component in a 320px side panel inside a 1920px screen. Storybook's viewport
 * tool resizes the iframe, which is the window — the wrong axis.
 *
 * So every story sits in a box with `resize: horizontal`. Drag its bottom-right
 * corner. Without this, half the responsive checklist cannot be checked at all
 * and the document becomes decorative.
 */
const resizableContainer: Decorator = Story => (
  <div className="catalog-resizable">
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [resizableContainer],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'error' },
    options: {
      storySort: {
        order: ['Overview', 'Components', ['Button']]
      }
    }
  }
};

export default preview;
