/*
 * What can be asserted without a browser, which for this component is less
 * than usual.
 *
 * The whole reason `Link` exists is what a browser does with an anchor —
 * middle-click, ctrl-click, "copy link address", the list of links a screen
 * reader builds — and jsdom has no new tab to open. So the interesting half
 * lives in `apps/catalog/e2e/link.spec.ts`, and what is here is the element,
 * its attributes, and the router wiring.
 *
 * One thing is deliberately NOT tested here: a click with no router installed.
 * The base prevents the default only when it is going to handle the press
 * itself, so without a router the click reaches jsdom's unimplemented
 * navigation and prints an error that says nothing about this library.
 *
 * TWO TESTS BELOW DO PRINT IT, and the message is the point rather than noise:
 * `Not implemented: navigation to another Document` is jsdom saying the press
 * went to the browser. Those are the two the base refuses to route — a link
 * with a `target`, and a download — so the message and the assertion that
 * `navigate` was never called are the same fact from both sides.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { Link } from './Link';

test('it is an anchor with an address, which is the point', () => {
  render(<Link href="/customers/4821">Astilleros del Sur</Link>);

  const link = screen.getByRole('link', { name: 'Astilleros del Sur' });
  expect(link.tagName).toBe('A');
  expect(link.getAttribute('href')).toBe('/customers/4821');
});

test('the standard anchor attributes are forwarded', () => {
  render(
    <Link href="/report.pdf" target="_blank" rel="noreferrer" download>
      Download the report
    </Link>
  );

  const link = screen.getByRole('link', { name: 'Download the report' });
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toBe('noreferrer');
  expect(link.hasAttribute('download')).toBe(true);
});

test('className and the ref reach the anchor and nothing else', () => {
  const ref = createRef<HTMLAnchorElement>();
  const { container } = render(
    <Link ref={ref} className="placed-by-the-consumer" href="/x">
      Somewhere
    </Link>
  );

  const root = container.firstElementChild;
  expect(ref.current).toBe(root);
  expect(root?.className).toContain('placed-by-the-consumer');
  expect(container.querySelectorAll('.placed-by-the-consumer')).toHaveLength(1);
});

/*
 * The second half of decision 0016. Without this the component is an anchor
 * that reloads a single-page application, which is the worst kind of wrong
 * because it looks like it works.
 */
test('a press goes through the navigate function on the provider', async () => {
  const user = userEvent.setup();
  const navigate = vi.fn<(href: string) => void>();

  render(
    <ConfigProvider navigate={navigate}>
      <Link href="/customers/4821">Astilleros del Sur</Link>
    </ConfigProvider>
  );

  await user.click(screen.getByRole('link'));

  expect(navigate).toHaveBeenCalledWith('/customers/4821');
});

/*
 * The base decides what the router may have, and this is the half a consumer
 * would otherwise have to write: a link with a `target` is not the router's,
 * because the person asked for another tab.
 */
test('a link with a target of its own is left to the browser', async () => {
  const user = userEvent.setup();
  const navigate = vi.fn<(href: string) => void>();

  render(
    <ConfigProvider navigate={navigate}>
      <Link href="/customers/4821" target="_blank">
        In another tab
      </Link>
    </ConfigProvider>
  );

  await user.click(screen.getByRole('link'));

  expect(navigate).not.toHaveBeenCalled();
});

test('and so is a download', async () => {
  const user = userEvent.setup();
  const navigate = vi.fn<(href: string) => void>();

  render(
    <ConfigProvider navigate={navigate}>
      <Link href="/report.pdf" download>
        The report
      </Link>
    </ConfigProvider>
  );

  await user.click(screen.getByRole('link'));

  expect(navigate).not.toHaveBeenCalled();
});

/*
 * The function is held by a ref, so a consumer who writes an inline arrow —
 * which is what anybody writes first — does not rebuild the base's router
 * context on every render. What has to keep working is that the LATEST one is
 * called, which is the thing a ref can get wrong.
 */
test('the newest navigate function is the one that runs', async () => {
  const user = userEvent.setup();
  const first = vi.fn<(href: string) => void>();
  const second = vi.fn<(href: string) => void>();

  const { rerender } = render(
    <ConfigProvider navigate={first}>
      <Link href="/a">Somewhere</Link>
    </ConfigProvider>
  );

  rerender(
    <ConfigProvider navigate={second}>
      <Link href="/a">Somewhere</Link>
    </ConfigProvider>
  );

  await user.click(screen.getByRole('link'));

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith('/a');
});

/*
 * P3's test, on the provider rather than on the component: a lone `Link` with
 * nothing wrapped around it is still an anchor with an address. The press
 * itself is the browser's and is measured in a browser.
 */
test('it needs no provider to be a link', () => {
  render(<Link href="/x">Somewhere</Link>);

  const link = screen.getByRole('link');
  expect(link.getAttribute('href')).toBe('/x');
  expect(link.getAttribute('aria-disabled')).toBeNull();
});
