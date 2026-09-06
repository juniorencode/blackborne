/*
 * Behaviour, from the perspective of someone reading the message.
 *
 * Deliberately absent: any assertion about class names. Checking for
 * `bb:bg-danger-subtle` proves nothing about how it looks and turns every
 * refactor into a wall of false failures (doc 10 §4). Appearance belongs to
 * the visual catalog.
 *
 * One thing here IS about the drawing, and on purpose: that the four glyphs
 * differ from each other. That is not a style assertion — it is the second
 * channel doc 06 §3 requires, and if the four tones ever drew the same shape
 * the component would be back to communicating by colour alone with nothing
 * failing anywhere.
 *
 * Alert has no logic and no hooks, so it has no logic tests. That is not an
 * omission: P6 puts logic in hooks, and this component only paints.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
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
 * A plain `AlertTone[]` annotation only checks that every entry IS a tone —
 * not that every tone is an entry — so a fifth tone would silently stop being
 * covered by every test that walks this list.
 */
const MISSING: Exclude<AlertTone, (typeof TONES)[number]>[] = [];
void MISSING;

test('the message is in a polite live region', () => {
  render(<Alert>The import finished with three warnings.</Alert>);

  const alert = screen.getByRole('status');
  expect(alert.textContent).toContain(
    'The import finished with three warnings.'
  );
});

test('it is role=status and not role=alert', () => {
  render(<Alert tone="danger">Could not save.</Alert>);

  // Decided in the component, and asserted here because it is exactly the kind
  // of thing that gets "corrected" by someone who reads danger and assumes
  // assertive. An inline message sits in the reading order in front of the
  // person already; interrupting for it is the noise doc 09 §4 warns about.
  expect(screen.getByRole('status')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('a title is read as part of the message', () => {
  render(<Alert title="Import finished">Three rows were skipped.</Alert>);

  const alert = screen.getByRole('status');
  expect(alert.textContent).toContain('Import finished');
  expect(alert.textContent).toContain('Three rows were skipped.');
});

test('without a title it announces the message alone', () => {
  render(<Alert>Three rows were skipped.</Alert>);

  expect(screen.getByRole('status').textContent).toBe(
    'Three rows were skipped.'
  );
});

test('the status glyph is hidden from the reader', () => {
  render(<Alert tone="warning">Three rows were skipped.</Alert>);

  const svg = screen.getByRole('status').querySelector('svg');
  // Decorative: the text already says what happened, and announcing the shape
  // as well would be one more thing to listen past (doc 06 §3).
  expect(svg).not.toBeNull();
  expect(svg?.getAttribute('aria-hidden')).toBe('true');
});

test('each tone draws a different glyph, so greyscale still tells them apart', () => {
  const drawings = new Set<string>();

  for (const tone of TONES) {
    const { unmount } = render(<Alert tone={tone}>Something happened.</Alert>);
    const svg = screen.getByRole('status').querySelector('svg');
    drawings.add(svg?.innerHTML ?? '');
    unmount();
  }

  // Colour is not the only channel (doc 06 §3). Four tones, four drawings.
  expect(drawings.size).toBe(TONES.length);
});

test('every tone renders its message', () => {
  for (const tone of TONES) {
    const { unmount } = render(<Alert tone={tone}>{`${tone} message`}</Alert>);
    expect(screen.getByRole('status').textContent).toBe(`${tone} message`);
    unmount();
  }
});

test('the default tone is info', () => {
  const { container: withDefault } = render(<Alert>Message.</Alert>);
  const fromDefault = withDefault.querySelector('svg')?.innerHTML;

  const { container: explicit } = render(<Alert tone="info">Message.</Alert>);
  expect(explicit.querySelector('svg')?.innerHTML).toBe(fromDefault);
});

test('the ref reaches the outermost element, and nothing else', () => {
  const ref = createRef<HTMLDivElement>();
  render(<Alert ref={ref}>Message.</Alert>);

  expect(ref.current).toBe(screen.getByRole('status'));
});

test('className is applied to the root, alongside the component classes', () => {
  render(<Alert className="consumer-layout-class">Message.</Alert>);

  const alert = screen.getByRole('status');
  // The consumer's class is there for layout (doc 02 §6) and it has not
  // replaced the component's own classes.
  expect(alert.className).toContain('consumer-layout-class');
  expect(alert.className.split(' ').length).toBeGreaterThan(1);
});

test('style reaches the root', () => {
  render(<Alert style={{ maxWidth: 400 }}>Message.</Alert>);

  expect(screen.getByRole('status').style.maxWidth).toBe('400px');
});

test('it renders with no children at all', () => {
  // Nothing here is required, and a component that throws on an empty message
  // fails at exactly the moment somebody is already handling an error.
  render(<Alert title="Nothing to report" />);
  expect(screen.getByRole('status').textContent).toBe('Nothing to report');
});
