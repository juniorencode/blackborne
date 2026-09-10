/*
 * What holds without a browser: the zone's name, what a row shows, and the
 * fact that nothing in here sends anything anywhere.
 *
 * NOT HERE: the drop itself. React Aria's drop target listens for native drag
 * events with a data transfer, which jsdom does not implement — so the shape
 * of a drop is tested as a function in `internal/files.test.ts` and the drop
 * itself in `apps/catalog/e2e/file-upload.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { FileUpload, type FileUploadItem } from './FileUpload';

const FILES: FileUploadItem[] = [
  { id: 'a', name: 'photo.jpg', size: 1_440_000 },
  { id: 'b', name: 'report.pdf', size: 2400, progress: 43 },
  { id: 'c', name: 'huge.zip', size: 3_200_000_000, errorMessage: 'Too big' }
];

const field = (props: Partial<React.ComponentProps<typeof FileUpload>> = {}) =>
  render(
    <ConfigProvider>
      <FileUpload label="Attachments" {...props} />
    </ConfigProvider>
  );

test('the zone is named by the field, not by the base', () => {
  field();

  /*
   * BY PATTERN RATHER THAN BY EQUALITY, and the reason is measured: the base
   * puts its labelling on a visually hidden button inside the zone, as
   * `aria-label="DropZone"` plus an `aria-labelledby` referencing ITSELF and
   * then what we passed — so the name is "DropZone Attachments".
   *
   * The assertion is that OUR half reaches it. Pinning the whole string would
   * pin the base's English word, which is theirs to change and is localised in
   * thirty-odd languages besides.
   */
  expect(screen.getByRole('button', { name: /Attachments/ })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Choose files' })).toBeDefined();
});

test('choosing files reports them and sends nothing', async () => {
  const onSelect = vi.fn();

  field({ onSelect });

  const input = document.querySelector('input[type=file]')!;
  const chosen = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

  await userEvent.upload(input as HTMLInputElement, chosen);

  /*
   * A `File[]`, and that is the whole contract: hard rule 6 allows this
   * library no request at all, so the component reports what was chosen and
   * the project sends it. Settled in the catalog's §3.3 before this existed.
   */
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect.mock.calls[0]?.[0]).toHaveLength(1);
  expect(onSelect.mock.calls[0]?.[0][0].name).toBe('photo.jpg');
});

test('it takes no address, because it makes no request', () => {
  render(
    <ConfigProvider>
      {/* @ts-expect-error nothing here knows a url (hard rule 6) */}
      <FileUpload label="Attachments" url="/api/files" />
    </ConfigProvider>
  );

  /*
   * ASSERTED WITH THE TYPE CHECKER, so adding an endpoint fails the build
   * rather than passing quietly. It is the same shape `Progress` uses to prove
   * it has no indeterminate mode, applied to a rule rather than to a variant.
   */
  expect(document.querySelector('.bb-file-upload')).not.toBeNull();
});

test('no files is no list at all', () => {
  field();

  expect(screen.queryByRole('list')).toBeNull();
});

test('a row shows the name, the size and nothing it was not given', () => {
  field({ files: FILES });

  const rows = screen.getAllByRole('listitem');

  expect(rows).toHaveLength(3);
  expect(rows[0]?.textContent).toContain('photo.jpg');

  /*
   * The size goes through `Intl` in the received locale, which is doc 05 §3 —
   * and the units are the ones an operating system shows.
   */
  expect(rows[0]?.textContent).toContain('1.4 MB');
  expect(rows[1]?.textContent).toContain('2.4 kB');
});

test('a file being sent has a bar, named after the file', () => {
  field({ files: FILES });

  /*
   * THE COMPONENT THIS ONE WAITED FOR. A file shows progress per file, which
   * is why `Progress` stopped being one of F8's leftovers and shipped ahead of
   * this — and the bar is NAMED by the file, so a reader hears which one is at
   * 43% rather than "Uploading" three times.
   */
  const bars = screen.getAllByRole('progressbar');

  expect(bars).toHaveLength(1);
  expect(screen.getByRole('progressbar', { name: 'report.pdf' })).toBeDefined();
  expect(bars[0]?.getAttribute('aria-valuenow')).toBe('43');
});

test('and a file that failed says why', () => {
  field({ files: FILES });

  /*
   * In the project's words: the library presents an error and does not decide
   * there is one (doc 07 §1). This component never sent anything, so it cannot
   * know.
   */
  expect(screen.getByText('Too big')).toBeDefined();
});

test('the cross is named by the file it removes', async () => {
  const onRemove = vi.fn();

  field({ files: FILES, onRemove });

  /*
   * A list of five crosses all called "Remove" is five identical controls, and
   * which one a reader is on is the only thing they need to know before
   * pressing it.
   */
  const remove = screen.getByRole('button', { name: 'Remove photo.jpg' });
  await userEvent.click(remove);

  expect(onRemove).toHaveBeenCalledWith('a');
});

test('and the crosses are absent when nothing can answer them', () => {
  field({ files: FILES });

  expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
});

test('a retry belongs to the row that failed, and only when it can be served', async () => {
  const onRetry = vi.fn();

  const { unmount } = field({ files: FILES });
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();

  unmount();
  field({ files: FILES, onRetry });

  /*
   * THE ANSWER TO A QUESTION OPEN SINCE THE LOADING STATES WERE BUILT: a
   * retry belongs to the thing that failed rather than to the field, and it
   * appears only where the consumer can service it. One row of three has an
   * error, so there is one retry.
   */
  const retries = screen.getAllByRole('button', { name: 'Retry' });
  expect(retries).toHaveLength(1);
  expect(screen.getAllByRole('listitem')[2]?.textContent).toContain('Retry');

  await userEvent.click(retries[0]!);
  expect(onRetry).toHaveBeenCalledWith('c');
});

test('the description is referenced by the button that opens the dialog', () => {
  field({ description: 'Up to ten files, images or PDFs' });

  /*
   * NOT BY THE ZONE, which was tried and measured: the base's drop zone
   * forwards nothing but its own labelling to the hidden button it renders, so
   * an `aria-describedby` passed to it never reaches the DOM at all. The same
   * shape `ColorSwatchField` found on a base collection.
   *
   * So it hangs off the control that IS ours, which is the one a keyboard
   * lands on anyway.
   */
  const choose = screen.getByRole('button', { name: 'Choose files' });
  const id = choose.getAttribute('aria-describedby');

  expect(id).not.toBeNull();
  expect(document.getElementById(id ?? '')?.textContent).toBe(
    'Up to ten files, images or PDFs'
  );
});

test('the class name lands on the outermost element only', () => {
  field({ className: 'placed' });

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
  expect(document.querySelector('.placed')?.classList).toContain(
    'bb-file-upload'
  );
});
