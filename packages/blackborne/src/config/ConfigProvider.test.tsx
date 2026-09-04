/*
 * The provider's whole job is to make the library configurable WITHOUT the
 * library ever detecting anything. These tests are mostly about what it
 * refuses to do.
 */
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { ConfigProvider, useConfig, useMessage } from './ConfigProvider';

function ShowLocale() {
  return <span data-testid="locale">{useConfig().locale}</span>;
}

function ShowMessage() {
  return <span data-testid="msg">{useMessage('loading')}</span>;
}

test('works with no provider around it', () => {
  // P3: a lone component must render correctly with nothing wrapping it.
  // If this fails, the provider has become mandatory, which it must not be.
  render(<ShowLocale />);
  expect(screen.getByTestId('locale').textContent).toBe('en-US');
});

test('a missing key falls back to English rather than an empty string', () => {
  render(
    <ConfigProvider locale="es-PE" dictionary={{}}>
      <ShowMessage />
    </ConfigProvider>
  );
  // An empty string would be a silent failure: half an interface blank with
  // no error in the console (doc 05 §2.2, rule 2).
  expect(screen.getByTestId('msg').textContent).toBe('Loading');
});

test('a missing key warns in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <ConfigProvider dictionary={{}}>
      <ShowMessage />
    </ConfigProvider>
  );
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

test('a supplied translation is used', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <ConfigProvider locale="es-PE" dictionary={{ loading: 'Cargando' }}>
      <ShowMessage />
    </ConfigProvider>
  );
  expect(screen.getByTestId('msg').textContent).toBe('Cargando');
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test('providers nest, and an inner one overrides only what it sets', () => {
  render(
    <ConfigProvider locale="es-PE" timeZone="America/Lima">
      <ConfigProvider locale="ar-EG">
        <ShowLocale />
      </ConfigProvider>
    </ConfigProvider>
  );
  // Nestable is the point: a region can run in another language without
  // restating everything above it.
  expect(screen.getByTestId('locale').textContent).toBe('ar-EG');
});

test('the time zone is whatever was passed, never the browser', () => {
  function ShowZone() {
    return <span data-testid="tz">{useConfig().timeZone ?? 'unset'}</span>;
  }

  render(
    <ConfigProvider timeZone="Asia/Tokyo">
      <ShowZone />
    </ConfigProvider>
  );
  expect(screen.getByTestId('tz').textContent).toBe('Asia/Tokyo');

  // Unset means the consumer has not said. It does NOT mean "use the
  // browser's" — the browser's zone belongs to whoever is looking, not to the
  // data (doc 05 §3.1).
  render(<ShowZone />);
  expect(screen.getAllByTestId('tz')[1]?.textContent).toBe('unset');
});
