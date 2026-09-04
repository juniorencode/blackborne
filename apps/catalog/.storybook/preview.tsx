import type { Decorator, Preview } from '@storybook/react-vite';

/*
 * The stylesheet is the BUILT artifact; the components are the source.
 *
 * Worth stating precisely, because the split is deliberate and an earlier
 * version of this comment overstated it:
 *
 *   - `blackborne/styles.css` resolves through the workspace link to
 *     dist/styles.css, so the catalog renders against the compiled, prefixed
 *     CSS a consumer actually receives. That is where prefixing, the token
 *     layers and the absence of a global reset live, and none of it can be
 *     verified against source.
 *   - The components come from source, because the stories sit beside them and
 *     import them by relative path. That buys fast reloading while building.
 *
 * The consequence to remember: after changing anything under styles/, run
 * `pnpm --filter blackborne build` or the catalog keeps showing the old CSS.
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
