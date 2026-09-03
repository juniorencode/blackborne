/*
 * Throwaway spike. Its only job is to force the decisions that documents
 * 02 (API conventions) and 08 (layers and focus) have to settle.
 *
 * Two panels, chosen because together they stress both bottlenecks of the
 * build order:
 *   1. A field: label + control + description + error, in every state.
 *   2. A dialog with a select inside it and a toast above it.
 *
 * Everything is styled against React Aria's own DOM state attributes
 * ([data-focused], [data-invalid], [data-disabled]) and never against
 * conditional class strings built in JS. That is the hypothesis under test.
 */
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  FieldError,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  ModalOverlay,
  Popover,
  Select,
  SelectValue,
  Text,
  TextField,
  type TextFieldProps,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion
} from 'react-aria-components';

// --- Toast queue. Note it is module-level global state, which principle P3
// --- forbids the library from owning. Open question for document 08.
const toasts = new ToastQueue<{ title: string }>({ maxVisibleToasts: 3 });

/*
 * FINDING for document 02: with exactOptionalPropertyTypes on, forwarding an
 * optional prop by name (isInvalid={isInvalid}) is a TYPE ERROR, because our
 * value is `boolean | undefined` and React Aria's prop is `boolean?`.
 *
 * The workaround is to forward by rest spread, which preserves optionality.
 * It works, but it means our wrappers cannot name the props they pass through
 * one by one — which is exactly the style document 02 has to choose.
 */
type FieldProps = Omit<TextFieldProps, 'children' | 'className'> & {
  label: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
};

function Field({
  label,
  description,
  errorMessage,
  placeholder,
  ...textFieldProps
}: FieldProps) {
  return (
    <TextField className="field" {...textFieldProps}>
      <Label>{label}</Label>
      {/* Same problem one level down, and the conditional spread is the cost. */}
      <Input {...(placeholder === undefined ? {} : { placeholder })} />
      {description ? <Text slot="description">{description}</Text> : null}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}

function FieldPanel() {
  return (
    <section>
      <h2>1 · Field, every state</h2>
      <p className="note">
        Tab through all of them. Focus must be visible on every one, and the
        description and error must be announced with the field.
      </p>
      <div className="stack">
        <Field label="Empty" placeholder="Placeholder text" />
        <Field label="With value" defaultValue="Typed value" />
        <Field
          label="With description"
          defaultValue="Typed value"
          description="Help text that stays visible when an error appears."
        />
        <Field
          label="Invalid"
          defaultValue="wrong"
          description="Help text that stays visible when an error appears."
          isInvalid
          errorMessage="Say what happened and what to do about it."
        />
        <Field label="Required" isRequired placeholder="Required field" />
        <Field label="Disabled" defaultValue="Cannot be used" isDisabled />
        <Field
          label="Read only"
          defaultValue="Can be read and copied"
          isReadOnly
        />
      </div>
    </section>
  );
}

const OPTIONS = [
  { id: 'draft', name: 'Draft' },
  { id: 'review', name: 'In review' },
  { id: 'published', name: 'Published' },
  { id: 'archived', name: 'Archived' }
];

function LayersPanel() {
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <section>
      <h2>2 · Dialog, with a select inside and a toast above</h2>
      <p className="note">
        The questions this panel exists to answer: with the select open inside
        the dialog, what does <kbd>Escape</kbd> close — the select, or both?
        Where does focus go when the dialog closes? Does the toast appear above
        the dialog, and can you reach it with the keyboard while the dialog is
        open?
      </p>

      <DialogTrigger>
        <Button className="btn">Open dialog</Button>
        <ModalOverlay className="overlay" isDismissable>
          <Modal className="modal">
            <Dialog className="dialog">
              {({ close }) => (
                <>
                  <Heading slot="title">Edit status</Heading>

                  <Select className="field" defaultSelectedKey="draft">
                    <Label>Status</Label>
                    <Button className="btn btn-select">
                      <SelectValue />
                      <span aria-hidden="true">▾</span>
                    </Button>
                    <Text slot="description">
                      A layer inside another layer. This is the interesting
                      part.
                    </Text>
                    <Popover className="popover">
                      <ListBox className="listbox" items={OPTIONS}>
                        {item => (
                          <ListBoxItem className="listbox-item">
                            {item.name}
                          </ListBoxItem>
                        )}
                      </ListBox>
                    </Popover>
                  </Select>

                  <Field
                    label="Note"
                    placeholder="A field inside a dialog"
                    description="Focus containment should keep you inside."
                  />

                  <div className="row">
                    <Button className="btn" onPress={close}>
                      Cancel
                    </Button>
                    <Button
                      className="btn btn-primary"
                      onPress={() => {
                        setSaved(new Date().toISOString());
                        toasts.add(
                          { title: 'Status updated' },
                          { timeout: 5000 }
                        );
                        close();
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>

      <p className="note">
        {saved ? `Last saved at ${saved}` : 'Nothing saved yet.'}
      </p>

      <Button
        className="btn"
        onPress={() =>
          toasts.add({ title: 'A toast on its own' }, { timeout: 5000 })
        }
      >
        Toast without a dialog
      </Button>
    </section>
  );
}

export function App() {
  return (
    <main className="page">
      <h1>React Aria spike</h1>
      <p className="note">
        Throwaway. Exists only to settle documents 02 and 08.
      </p>
      <FieldPanel />
      <LayersPanel />
      <ToastRegion className="toast-region" queue={toasts}>
        {({ toast }) => (
          <Toast className="toast" toast={toast}>
            <ToastContent>{toast.content.title}</ToastContent>
            <Button slot="close" className="btn btn-small">
              Dismiss
            </Button>
          </Toast>
        )}
      </ToastRegion>
    </main>
  );
}
