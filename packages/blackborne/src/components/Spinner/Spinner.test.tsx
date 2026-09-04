import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ConfigProvider } from '../../config';
import { Spinner } from './Spinner';

test('it has an accessible name by default', () => {
  render(<Spinner />);
  // An indicator nobody can perceive is a change that happens in silence for
  // anyone using a screen reader (doc 06 §3).
  expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeTruthy();
});

test('the name follows the active language', () => {
  render(
    <ConfigProvider locale="es-PE" dictionary={{ loading: 'Cargando' }}>
      <Spinner />
    </ConfigProvider>
  );
  expect(screen.getByRole('progressbar', { name: 'Cargando' })).toBeTruthy();
});

test('a supplied label wins, because only the consumer knows the context', () => {
  render(<Spinner label="Loading customers" />);
  expect(
    screen.getByRole('progressbar', { name: 'Loading customers' })
  ).toBeTruthy();
});

test('decorative spinners are hidden from assistive technology', () => {
  const { container } = render(<Spinner isDecorative />);
  // For when the surrounding element already announces the busy state and a
  // second announcement would just be noise.
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
});
