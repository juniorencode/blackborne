import { forwardRef, useId } from 'react';
import { DropZone as AriaDropZone, FileTrigger } from 'react-aria-components';
import { Button } from '../Button';
import { Progress } from '../Progress';
import { useConfig, useMessage } from '../../config';
import { FieldMessages, describedBy } from '../../internal/Field';
import { CrossGlyph } from '../../internal/CrossGlyph';
import { cx } from '../../internal/cx';
import { filesFromDrop, formatBytes } from '../../internal/files';

const ROOT = cx(
  'bb-file-upload',
  'bb:box-border bb:flex bb:w-full bb:flex-col',
  'bb:gap-(--bb-field-gap-inner) bb:font-sans bb:text-md bb:text-text'
);

const LABEL = cx(
  'bb-file-upload-label',
  'bb:w-fit bb:text-md bb:font-strong bb:text-text'
);

/*
 * THE ZONE, AND IT IS A DASHED BOX FOR ONCE ON PURPOSE.
 *
 * Nothing else in this library has a dashed border. A drop target is the one
 * place where the convention carries meaning rather than decoration: it says
 * "this is an area, not a control", which is exactly the difference between
 * this and the button inside it.
 *
 * `data-drop-target` is the base's, and it is what a person sees while
 * something is over the zone — the state doc 09 §3 asks for and the one thing
 * about a drop that cannot be discovered any other way.
 */
const ZONE = cx(
  'bb-file-upload-zone',
  'bb:box-border bb:flex bb:w-full bb:flex-col bb:items-center',
  'bb:justify-center bb:gap-(--bb-space-2)',
  'bb:rounded-lg bb:border bb:border-dashed bb:border-border',
  'bb:bg-surface-sunken bb:p-(--bb-space-5)',
  'bb:transition-[background-color,border-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:border-border-strong',
  'bb:data-drop-target:border-accent bb:data-drop-target:bg-accent-subtle',
  'bb:outline-hidden',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  /*
   * AND INVALID IS AN EDGE, because a box in this library carries the state
   * its field is in. `controlBox` has drawn a danger border since the first
   * field and this is the same box one level out — found by opening the first
   * baseline, where the invalid zone was pixel-identical to an ordinary one
   * with a red line of text underneath it. Doc 06 §3 is satisfied either way
   * (the message is text), and a frame saying nothing while the message says
   * "required" is the frame lying by omission.
   *
   * One variable recolours the edge AND the halo, so they cannot drift apart
   * — which is exactly what `controlBox` does with it.
   */
  'bb:data-invalid:border-danger',
  'bb:data-invalid:[--bb-focus-ring:var(--bb-danger)]',
  /*
   * SWITCHED OFF IS THE FILL GOING AWAY, not the whole box dimmed.
   *
   * `opacity-50` was the first version and axe failed it: the hint inside the
   * zone is real text a person has to read, and half of `text-muted` is below
   * the floor on both surfaces. No field in this library dims its own label
   * either — the slider tried and lost the same argument.
   *
   * `bg-surface-disabled` is the token that NAMES the state and it cannot
   * carry it here: measured, it is `--bb-x-gray-2` in both modes and the
   * zone's rest fill is `surface-sunken`, which is gray-3 in light and **the
   * same gray-2** in dark — so a disabled zone would have been identical to a
   * live one on the dark side. The same shape as the slider's invisible fill.
   *
   * So the sunken fill goes instead. It is the fill that says "drop here", and
   * a zone that can receive nothing should not look like a target; the greyed
   * "Choose files" button inside it is the loudest signal either way.
   */
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:bg-surface'
);

const HINT = cx('bb-file-upload-hint', 'bb:text-xs bb:text-text-muted');

const LIST = cx(
  'bb-file-upload-list',
  'bb:box-border bb:m-0 bb:flex bb:w-full bb:list-none bb:flex-col',
  'bb:gap-(--bb-space-2) bb:p-0'
);

const ITEM = cx(
  'bb-file-upload-item',
  'bb:box-border bb:flex bb:w-full bb:flex-col bb:gap-(--bb-space-1)',
  'bb:rounded-md bb:border bb:border-solid bb:border-border',
  'bb:bg-surface bb:p-(--bb-space-2)'
);

const ITEM_ROW = cx(
  'bb-file-upload-item-row',
  'bb:box-border bb:flex bb:w-full bb:items-center bb:gap-(--bb-space-2)'
);

const NAME = cx('bb-file-upload-name', 'bb:min-w-0 bb:flex-1 bb:truncate');

const SIZE = cx(
  'bb-file-upload-size',
  'bb:flex-none bb:tabular-nums bb:text-xs bb:text-text-muted'
);

const ERROR = cx('bb-file-upload-error', 'bb:text-xs bb:text-danger-text');

const REMOVE = cx('bb-file-upload-remove', 'bb:flex-none');

/**
 * One file in the list, as the consumer holds it.
 *
 * A DECLARED SHAPE rather than a `File`: the component shows what a project
 * knows about a file, and a project knows things the file does not — how far
 * an upload has got, and why it failed. The `File` itself is what `onSelect`
 * hands over, and it is the project's to keep.
 */
export interface FileUploadItem {
  /** Its identity, and what `onRemove` and `onRetry` are called with. */
  id: string;
  /** What it is called. Shown, and read out as the progress bar's name. */
  name: string;
  /** In bytes. Formatted in the received locale; left out where unknown. */
  size?: number;
  /**
   * How far it has got, from 0 to 100.
   *
   * Left out for a file that is not being sent — waiting, finished or failed
   * are all "no bar". This is the prop `Progress` shipped for: a file shows
   * progress per file, which is why that component went before this one.
   */
  progress?: number;
  /**
   * Why it failed, in the project's own words.
   *
   * The library presents an error and does not decide there is one (doc 07
   * §1). Too big, the wrong type, a request that came back 500 — all of them
   * are judgements this component cannot make, because it never sent anything.
   */
  errorMessage?: string;
}

export interface FileUploadProps {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`, about the field rather than about one file. */
  errorMessage?: React.ReactNode;
  /** Marks the field invalid, which is the project's judgement (doc 07 §1). */
  isInvalid?: boolean;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /**
   * The files, as the project holds them. Empty is empty: no list is rendered.
   */
  files?: readonly FileUploadItem[];
  /**
   * Called with the files a person chose or dropped.
   *
   * **This component does not send them anywhere.** Hard rule 6 allows it no
   * request at all, so what happens next — where they go, how the progress is
   * measured, what a failure means — belongs to the project. The arrangement
   * `useToasts` has, and it was settled in the catalog's §3.3 before any of
   * this was written.
   */
  onSelect?: (files: File[]) => void;
  /** Called with a file's `id`. The row's cross appears only when it is given. */
  onRemove?: (id: string) => void;
  /**
   * Called with a failed file's `id`.
   *
   * The retry appears on a row that has an `errorMessage` AND only when this
   * is given — which is the answer to a question that has been open since the
   * loading states were built: a retry belongs to the thing that failed, and
   * only where somebody can service it.
   */
  onRetry?: (id: string) => void;
  /**
   * Which types the file dialog offers, as mime types or extensions.
   *
   * A RESTRICTION rather than a judgement, which is the line doc 07 §1 draws:
   * this narrows what a person can pick, the way `maxLength` narrows what they
   * can type. Whether a file they did pick is acceptable — too big, the wrong
   * shape, a duplicate — is the project's call, and it says so through
   * `errorMessage` on the row.
   */
  accept?: readonly string[];
  /** Whether more than one file may be chosen at a time. Defaults to `true`. */
  allowsMultiple?: boolean;
  /** Switches the zone and every row's controls off. */
  isDisabled?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * A field for choosing files, with a row per file.
 *
 * ```tsx
 * <FileUpload
 *   label="Attachments"
 *   files={files}
 *   onSelect={send}
 *   onRemove={forget}
 *   accept={['image/*', '.pdf']}
 * />
 * ```
 *
 * ## It does not upload
 *
 * The thing everybody expects it to do is the one thing it may not: hard
 * rule 6 allows this library no request at all. So it receives files and
 * reports them, and the project sends them, measures the progress and decides
 * what a failure means — feeding both back through `files`.
 *
 * That is the same shape `Toast` has, where `useToasts` makes the queue and
 * the consumer owns it, and it was settled in writing before this component
 * existed (the catalog's §3.3).
 *
 * ## Three routes in, and the base supplies all three
 *
 * **A pointer** drops onto the zone. **The file dialog** opens from the button
 * inside it. And **a keyboard** reaches the zone and pastes — the base renders
 * a visually hidden button in there and wires the clipboard to it, which is
 * what lets a drop target pass this library's entry gate at all.
 *
 * ## A row shows what the project knows
 *
 * The name, the size formatted in the received locale, a bar while it is
 * going, the reason it failed, and the two controls that answer those states.
 * `Progress` per file is why that component shipped first.
 */
export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  function FileUpload(
    {
      label,
      description,
      errorMessage,
      isInvalid = false,
      isLabelHidden = false,
      files = [],
      onSelect,
      onRemove,
      onRetry,
      accept,
      allowsMultiple = true,
      isDisabled = false,
      className
    },
    ref
  ) {
    const { locale } = useConfig();
    const chooseLabel = useMessage('chooseFiles');
    const dropHint = useMessage('dropFiles');
    const removeLabel = useMessage('remove');
    const retryLabel = useMessage('retry');

    const id = useId();
    const labelId = `${id}-label`;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;

    const hasDescription = description !== undefined && description !== null;
    const hasError =
      isInvalid && errorMessage !== undefined && errorMessage !== null;

    const describedByValue = describedBy({
      hasDescription,
      hasError,
      descriptionId,
      errorId
    });

    const take = (chosen: File[]) => {
      if (chosen.length > 0) onSelect?.(chosen);
    };

    return (
      <div ref={ref} className={cx(ROOT, className)}>
        <span id={labelId} className={cx(LABEL, isLabelHidden && 'bb:sr-only')}>
          {label}
        </span>

        <AriaDropZone
          className={ZONE}
          isDisabled={isDisabled}
          /*
           * THE ZONE HAS TO BE TOLD, because a drop zone knows nothing about
           * validity — there is no `isInvalid` on it and no group context
           * underneath it to read one from. A `data-*` attribute is what the
           * base's prop filter does pass, unlike the aria attributes
           * `ColorSwatchField` measured it dropping.
           */
          {...(isInvalid ? { 'data-invalid': true } : {})}
          /*
           * NAMED BY THE FIELD'S LABEL, AND THE BASE ADDS ITS OWN WORD TO IT.
           *
           * Measured: the zone's own element carries no aria attributes at
           * all — the base puts them on a visually hidden button inside it,
           * as `aria-label="DropZone"` plus an `aria-labelledby` that
           * references ITSELF and then whatever we passed. So the name comes
           * out as "DropZone Attachments".
           *
           * Left as it is, which is the same call `ComboBox` made when its
           * toggle came out "Show suggestions Doctor": the base is gluing its
           * own word to ours through element references rather than string
           * concatenation, and it does say what the thing is. Both are on
           * doc 06 §5's list for a person with a screen reader.
           */
          aria-labelledby={labelId}
          /*
           * The event's type is INFERRED rather than annotated: the base does
           * not export `DropEvent`, and naming a type it keeps to itself would
           * mean reaching past its public entry point for a signature the
           * compiler already knows.
           */
          onDrop={event => {
            /*
             * A DROP IS ASYNCHRONOUS, and that is the base's shape rather than
             * a choice: an item's contents arrive through a promise. The
             * filtering lives in `internal/files` so the shape of a drop can
             * be checked without a pointer.
             */
            void filesFromDrop(event.items).then(take);
          }}
        >
          <FileTrigger
            {...(accept === undefined ? {} : { acceptedFileTypes: accept })}
            allowsMultiple={allowsMultiple}
            onSelect={(chosen: FileList | null) => {
              take(chosen === null ? [] : [...chosen]);
            }}
          >
            <Button
              size="sm"
              isDisabled={isDisabled}
              /*
               * THE DESCRIPTION IS REFERENCED FROM HERE, because the zone
               * drops it. Measured: the base's drop zone forwards nothing but
               * its own labelling to the hidden button it renders, so an
               * `aria-describedby` passed to it never reaches the DOM — the
               * same shape `ColorSwatchField` found on a base collection,
               * where a filter passes four attributes and discards the rest.
               *
               * This button is ours, so it can carry it: whoever tabs into the
               * field hears the help text on the control that opens the
               * dialog. A description nobody references does not exist for a
               * screen reader (doc 06 §3).
               */
              {...(describedByValue === undefined
                ? {}
                : { 'aria-describedby': describedByValue })}
            >
              {chooseLabel}
            </Button>
          </FileTrigger>
          <span className={HINT}>{dropHint}</span>
        </AriaDropZone>

        {files.length === 0 ? null : (
          /*
           * A LIST, because it is one: a reader is told how many files there
           * are before walking them, which is the thing a stack of divs does
           * not say. It carries no name of its own — every row says what it
           * is, and a second copy of the field's name would be said twice.
           */
          <ul className={LIST}>
            {files.map(one => (
              <li key={one.id} className={ITEM}>
                <div className={ITEM_ROW}>
                  <span className={NAME}>{one.name}</span>
                  {one.size === undefined ? null : (
                    <span className={SIZE}>
                      {formatBytes(one.size, locale)}
                    </span>
                  )}
                  {onRetry === undefined ||
                  one.errorMessage === undefined ? null : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={REMOVE}
                      isDisabled={isDisabled}
                      onPress={() => {
                        onRetry(one.id);
                      }}
                    >
                      {retryLabel}
                    </Button>
                  )}
                  {onRemove === undefined ? null : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={REMOVE}
                      isDisabled={isDisabled}
                      /*
                       * NAMED BY THE FILE IT REMOVES, not by the word alone. A
                       * list of five crosses all called "Remove" is five
                       * identical controls, and which one a reader is on is
                       * the only thing they need to know before pressing it.
                       */
                      aria-label={`${removeLabel} ${one.name}`}
                      onPress={() => {
                        onRemove(one.id);
                      }}
                    >
                      <CrossGlyph className="bb:h-mark bb:w-mark" />
                    </Button>
                  )}
                </div>

                {one.progress === undefined ? null : (
                  /*
                   * THE COMPONENT THIS ONE WAITED FOR. A file shows progress
                   * per file, which is why `Progress` stopped being one of
                   * F8's leftovers and shipped ahead of this.
                   *
                   * Named by the file, and the name is hidden: the row already
                   * shows it, and a bar announcing "Uploading" five times says
                   * nothing about which file is which.
                   */
                  <Progress
                    size="sm"
                    label={one.name}
                    isLabelHidden
                    value={one.progress}
                  />
                )}

                {one.errorMessage === undefined ? null : (
                  <span className={ERROR}>{one.errorMessage}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <FieldMessages
          {...(hasDescription ? { description } : {})}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isInvalid={isInvalid}
          descriptionId={descriptionId}
          errorId={errorId}
        />
      </div>
    );
  }
);
