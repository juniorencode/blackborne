/*
 * The visual catalog for FileUpload.
 *
 * WHAT TO LOOK AT is the zone in its four states, which is `The zone` — a
 * dashed box is the one place in this library where that convention carries
 * meaning rather than decoration, and the only state a person cannot discover
 * by poking at it is the one that matters: `data-drop-target`, while something
 * is being dragged over it.
 *
 * AND THE OVERVIEW UPLOADS NOTHING. It fakes progress with a timer, because
 * the component cannot send a file and the catalog has no server — which is
 * the component's whole contract made visible rather than described.
 */
import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfigProvider } from '../../config';
import { Force, type ForcedState } from '../../catalog/forceState';
import { FileUpload, type FileUploadItem } from './FileUpload';

/*
 * ONE OPTIONAL FIELD, REMOVED. `exactOptionalPropertyTypes` is strict about
 * `progress: undefined` — rightly, because `progress?: number` means "there or
 * not", and a row that is no longer going has no progress rather than an
 * undefined one. Destructuring the key away leaves an unused binding, which
 * the project's lint rule objects to with equal justice, so this deletes it.
 */
const without = (
  one: FileUploadItem,
  key: 'progress' | 'errorMessage'
): FileUploadItem => {
  const copy = { ...one };
  delete copy[key];
  return copy;
};

const FILES: FileUploadItem[] = [
  { id: 'a', name: 'contract-signed.pdf', size: 184_000 },
  { id: 'b', name: 'site-photo-01.jpg', size: 2_400_000, progress: 43 },
  {
    id: 'c',
    name: 'archive-of-everything.zip',
    size: 3_200_000_000,
    errorMessage: 'The server refused anything over 50 MB'
  }
];

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  locale,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  locale?: string;
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider {...(locale === undefined ? {} : { locale })}>
      <div
        className="catalog-panel"
        data-bb-mode={mode}
        data-bb-density={density}
        dir={dir}
        style={{ width: 360 }}
      >
        <p className="catalog-label">{label}</p>
        {children}
      </div>
    </ConfigProvider>
  );
}

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  args: { label: 'Attachments' }
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working field, with the project doing the work.
 *
 * **Nothing here is uploaded.** Hard rule 6 allows this library no request at
 * all, so the component reports the files and this story pretends to send them
 * — a timer advances each one, and one of them fails on purpose so the retry
 * has something to answer.
 *
 * That division is the point rather than a limitation of the demo: where the
 * files go, how the progress is measured and what a failure means are all the
 * project's, and only the project knows them.
 *
 * **Three routes in.** Press the button for the file dialog, drag files onto
 * the zone, or reach the zone with `Tab` and paste — the base renders a
 * visually hidden button in there and wires the clipboard to it.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [files, setFiles] = useState<FileUploadItem[]>([]);

      /*
       * A FAKE UPLOADER, which is what a consumer's real one replaces. It
       * advances every file that is going, finishes them, and fails anything
       * with `fail` in its name so the retry can be seen.
       */
      useEffect(() => {
        const timer = window.setInterval(() => {
          setFiles(current =>
            current.map(one => {
              if (one.progress === undefined) return one;
              const next = one.progress + 20;
              if (next < 100) return { ...one, progress: next };

              const settled = without(one, 'progress');
              return one.name.includes('fail')
                ? { ...settled, errorMessage: 'The upload failed' }
                : settled;
            })
          );
        }, 400);
        return () => {
          window.clearInterval(timer);
        };
      }, []);

      return (
        <ConfigProvider>
          <div className="catalog-stack" style={{ width: 360 }}>
            <FileUpload
              {...args}
              description="Anything with “fail” in its name will fail"
              files={files}
              onSelect={chosen => {
                setFiles(current => [
                  ...current,
                  ...chosen.map(one => ({
                    id: `${one.name}-${String(current.length)}`,
                    name: one.name,
                    size: one.size,
                    progress: 0
                  }))
                ]);
              }}
              onRemove={id => {
                setFiles(current => current.filter(one => one.id !== id));
              }}
              onRetry={id => {
                setFiles(current =>
                  current.map(one =>
                    one.id === id
                      ? { ...without(one, 'errorMessage'), progress: 0 }
                      : one
                  )
                );
              }}
            />
            <p className="catalog-label">
              {files.length === 0
                ? 'Nothing chosen'
                : `${String(files.length)} file(s) held by the story`}
            </p>
          </div>
        </ConfigProvider>
      );
    }

    return <Demo />;
  }
};

/**
 * EVERY STATE OF A ROW, in both modes.
 *
 * Waiting, going, and failed — which are the three things a project can know
 * about a file it is sending, and the reason the row's shape is a declared
 * item rather than a `File`. A `File` knows its name and its size and nothing
 * about what happened to it.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            <FileUpload label="Empty" />
            <FileUpload
              label="With files"
              files={FILES}
              onRemove={() => {}}
              onRetry={() => {}}
            />
            <FileUpload
              label="With help"
              description="Up to ten files, images or PDFs"
            />
            <FileUpload
              label="Invalid"
              isInvalid
              errorMessage="At least one attachment is required"
            />
            <FileUpload label="Disabled" files={FILES.slice(0, 1)} isDisabled />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * THE ZONE'S FOUR STATES, forced so they can be photographed.
 *
 * `data-drop-target` is the one that matters and the one nothing else in this
 * library has: it exists only while something is being dragged over the zone,
 * so it cannot be seen by poking at the component. Doc 09 §3 asks for a
 * visible response to every interaction, and a drop is an interaction that
 * happens before anything is released.
 */
export const Zone: Story = {
  render: () => (
    <Scope label="The zone">
      <div className="catalog-stack">
        <FileUpload label="At rest" />
        {(
          [
            ['Hovered', 'data-hovered'],
            ['Focused', 'data-focus-visible'],
            ['A file over it', 'data-drop-target']
          ] as const satisfies readonly (readonly [string, ForcedState])[]
        ).map(([name, state]) => (
          <Force key={name} state={state} target=".bb-file-upload-zone">
            <FileUpload label={name} />
          </Force>
        ))}
      </div>
    </Scope>
  )
};

/** Compact density, where the rows lose air and keep their type size. */
export const Compact: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Normal', 'normal'],
          ['Compact', 'compact']
        ] as const
      ).map(([label, density]) => (
        <Scope key={label} label={label} density={density}>
          <FileUpload
            label="Attachments"
            files={FILES.slice(0, 2)}
            onRemove={() => {}}
          />
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL, where a row's name and its controls change hands.
 *
 * AND THE LOCALE IS DECLARED, not just the direction. A `dir` attribute
 * mirrors the layout and tells `Intl` nothing (doc 05 §4.1), so a story with
 * Arabic labels and a size reading “184 kB” would be showing two mechanisms
 * disagreeing. `formatBytes` goes through the received locale, so this shows
 * what a person in Cairo sees: the unit's name in Arabic and the digits in the
 * numbering system their locale uses.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <Scope label="العربية" dir="rtl" locale="ar-EG">
        <FileUpload
          label="المرفقات"
          description="حتى عشرة ملفات"
          files={[
            { id: 'a', name: 'العقد.pdf', size: 184_000 },
            { id: 'b', name: 'صورة.jpg', size: 2_400_000, progress: 43 }
          ]}
          onRemove={() => {}}
        />
      </Scope>
    </div>
  )
};
