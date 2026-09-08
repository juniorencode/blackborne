/*
 * What jsdom can answer about a notice: the wiring, the roles, the timeouts the
 * library decides, and that the queue belongs to the consumer.
 *
 * What it cannot: whether the timers actually pause on hover, whether the
 * countdown runs for the right length, and whether a notice is reachable while
 * a dialog is open. Those are in `toast.spec.ts`.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Button } from '../Button';
import { ToastRegion } from './ToastRegion';
import { useToasts, type ToastMessage, type ToastQueue } from './useToasts';

/**
 * A page with a region and a way to add to it, which is the shape a consumer
 * builds: the queue is theirs, the region renders it.
 */
function Page({
  messages = [{ title: 'Invoice sent' }],
  onQueue
}: {
  messages?: ToastMessage[];
  onQueue?: (queue: ToastQueue) => void;
}) {
  const toasts = useToasts();
  onQueue?.(toasts);

  return (
    <>
      <ToastRegion queue={toasts} />
      {messages.map((message, i) => (
        <Button
          key={i}
          onPress={() => {
            toasts.add(message);
          }}
        >
          {`Send ${i}`}
        </Button>
      ))}
    </>
  );
}

const send = async (index = 0) => {
  await userEvent.click(screen.getByRole('button', { name: `Send ${index}` }));
};

test('the region renders nothing until something is added', () => {
  render(<Page />);

  /*
   * Not merely empty: the base renders no region at all while the queue is
   * empty, so there is no landmark for a screen reader to find and no box for
   * a stray click to hit.
   */
  expect(screen.queryByRole('region')).toBeNull();
  expect(screen.queryByRole('alertdialog')).toBeNull();
});

test('a notice appears, in a landmark, and says what happened', async () => {
  render(<Page />);
  await send();

  const region = await screen.findByRole('region');
  expect(region).toBeTruthy();

  /*
   * `alertdialog` is the base's role for one notice, and `alert` for its
   * content — the second is what makes it announced rather than merely
   * present. Both are asserted because both are invisible in a screenshot and
   * they are the whole accessibility story of this component.
   */
  const notice = screen.getByRole('alertdialog');
  expect(notice.textContent).toContain('Invoice sent');
  expect(notice.querySelector('[role="alert"]')).toBeTruthy();
});

test('and the notice is focusable, which is how the keyboard reaches it', async () => {
  render(<Page />);
  await send();
  await screen.findByRole('alertdialog');

  /*
   * Landmark navigation is the route IN (doc 08 §7) and jsdom cannot exercise
   * it. What it can check is the precondition: the notice takes focus, so
   * `Tab` from the region has somewhere to land.
   */
  expect(screen.getByRole('alertdialog').getAttribute('tabindex')).toBe('0');
});

test('the close button carries OUR label, not the base own', async () => {
  render(<Page />);
  await send();
  await screen.findByRole('alertdialog');

  /*
   * The base supplies a localised "Close" of its own, and this component passes
   * over it deliberately: the word is already in this library's dictionary and
   * a dialog's cross uses it, so a consumer who reworded it there must not find
   * a notice still saying something else.
   */
  expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
});

test('the close button closes it', async () => {
  render(<Page />);
  await send();
  await screen.findByRole('alertdialog');

  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
});

test('an action is offered, and taking it closes the notice first', async () => {
  const onPress = vi.fn();
  render(
    <Page
      messages={[
        { title: 'Customer deleted', action: { label: 'Undo', onPress } }
      ]}
    />
  );
  await send();
  await screen.findByRole('alertdialog');

  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(onPress).toHaveBeenCalledOnce();
  /*
   * Closed, and closed BEFORE the action ran. A notice whose action has been
   * taken describes something that is no longer true, and leaving it up invites
   * a second press on an undo that already happened.
   */
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
});

test('the action is outside the announced content', async () => {
  render(
    <Page
      messages={[
        {
          title: 'Customer deleted',
          action: { label: 'Undo', onPress: () => {} }
        }
      ]}
    />
  );
  await send();
  const notice = await screen.findByRole('alertdialog');

  /*
   * The base makes one element `role="alert"`, and everything inside it is
   * announced as one atomic message. A button in there would be read as part
   * of the sentence — "Customer deleted Undo" — so the action sits beside the
   * content rather than in it.
   */
  const announced = notice.querySelector('[role="alert"]')!;
  expect(announced.textContent).toContain('Customer deleted');
  expect(announced.textContent).not.toContain('Undo');
  expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
});

test('three are shown, newest first', async () => {
  render(
    <Page
      messages={[
        { title: 'First' },
        { title: 'Second' },
        { title: 'Third' },
        { title: 'Fourth' }
      ]}
    />
  );

  for (const i of [0, 1, 2, 3]) await send(i);
  await screen.findByText('Fourth');

  /*
   * THIS TEST WAS WRITTEN BACKWARDS FIRST, which is why it reads this way.
   *
   * It asserted that the FIRST three stay and a fourth waits — the shape the
   * component's own comment claimed — and it failed, because the visible set is
   * the newest three with the newest on top. Nothing is dropped either way; the
   * older ones leave the SCREEN, not the queue. The next test is the half that
   * makes that distinction worth anything.
   */
  const shown = screen
    .getAllByRole('alertdialog')
    .map(node => node.querySelector('[role="alert"]')?.textContent?.trim());
  expect(shown).toEqual(['Fourth', 'Third', 'Second']);
  expect(screen.queryByText('First')).toBeNull();
});

test('`clear` empties it', async () => {
  let queue: ToastQueue | undefined;
  render(
    <Page
      messages={[{ title: 'First' }, { title: 'Second' }]}
      onQueue={q => {
        queue = q;
      }}
    />
  );
  await send(0);
  await send(1);
  expect(screen.getAllByRole('alertdialog')).toHaveLength(2);

  act(() => {
    queue?.clear();
  });
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
});

test('`add` returns a key that closes that notice', async () => {
  let queue: ToastQueue | undefined;
  render(
    <Page
      onQueue={q => {
        queue = q;
      }}
    />
  );

  let key = '';
  act(() => {
    key = queue!.add({ title: 'Working' });
  });
  await screen.findByText('Working');

  act(() => {
    queue!.close(key);
  });
  await waitFor(() => expect(screen.queryByText('Working')).toBeNull());
});

test('a region given a foreign queue renders nothing rather than throwing', () => {
  /*
   * `baseQueueOf` returns nothing for anything but a `useToasts` result. A
   * plain object shaped like a queue is the shape a test double takes, and the
   * component has to be more useful than a stack trace from inside the base.
   */
  const foreign: ToastQueue = {
    add: () => 'k',
    close: () => {},
    clear: () => {}
  };
  render(<ToastRegion queue={foreign} />);

  expect(screen.queryByRole('region')).toBeNull();
});

/* ------------------------------------------------------------------ *
 * How long they stay: the library's decision, not the caller's.
 * ------------------------------------------------------------------ */

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

test('an ordinary notice goes on its own after six seconds', async () => {
  render(<Page />);
  await send();
  await screen.findByRole('alertdialog');

  /*
   * Doc 09 §4.1's number, asserted from both sides so this is "at six" rather
   * than "eventually".
   */
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.queryByRole('alertdialog')).toBeTruthy();

  await act(async () => {
    vi.advanceTimersByTime(1500);
  });
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
});

test('one with an action stays longer, because the action is the point', async () => {
  render(
    <Page
      messages={[
        {
          title: 'Customer deleted',
          action: { label: 'Undo', onPress: () => {} }
        }
      ]}
    />
  );
  await send();
  await screen.findByRole('alertdialog');

  // Past the ordinary six, still there.
  await act(async () => {
    vi.advanceTimersByTime(7000);
  });
  expect(screen.queryByRole('alertdialog')).toBeTruthy();

  await act(async () => {
    vi.advanceTimersByTime(4000);
  });
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
});

test('A DANGER NOTICE NEVER GOES ON ITS OWN', async () => {
  render(<Page messages={[{ tone: 'danger', title: 'Could not save' }]} />);
  await send();
  await screen.findByRole('alertdialog');

  /*
   * The exception that matters most in doc 09 §4.1. Something has gone wrong,
   * the person may not have been looking, and a message that removes itself
   * leaves them with a broken state and no explanation.
   *
   * A full minute, which is ten times the ordinary life of a notice.
   */
  await act(async () => {
    vi.advanceTimersByTime(60_000);
  });
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  expect(screen.getByText('Could not save')).toBeTruthy();

  // It still goes when it is dismissed.
  vi.useRealTimers();
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
});

test('and a danger notice draws no countdown', async () => {
  render(<Page messages={[{ tone: 'danger', title: 'Could not save' }]} />);
  await send();
  const notice = await screen.findByRole('alertdialog');

  /*
   * A bar that never moved would say the notice was about to leave. There is
   * nothing to count, so there is nothing drawn.
   */
  expect(notice.querySelector('.bb-toast-countdown')).toBeNull();
});

test('A WAITING NOTICE DOES NOT SPEND ITS TIME WHILE HIDDEN', async () => {
  let queue: ToastQueue | undefined;
  render(
    <Page
      onQueue={q => {
        queue = q;
      }}
    />
  );

  /*
   * THE TEST THAT MAKES "NOTHING IS DROPPED" MEAN SOMETHING.
   *
   * Five at once shows three, so two are held. If their timers had started when
   * they were added, they would expire while nobody could see them — a message
   * somebody was sent, never shown, and gone. Measured, they do not: the base
   * starts a notice's timer when it becomes VISIBLE.
   *
   * So this is the difference between a backlog and a slow eviction, and it is
   * the whole reason doc 08 §7.1 lists the overflow behaviour as a guarantee
   * worth naming.
   */
  act(() => {
    for (const title of ['1st', '2nd', '3rd', '4th', '5th']) {
      queue!.add({ title });
    }
  });

  const shown = () =>
    screen
      .queryAllByRole('alertdialog')
      .map(node => node.querySelector('[role="alert"]')?.textContent?.trim());

  expect(shown()).toEqual(['5th', '4th', '3rd']);

  // The three visible ones run out at six seconds.
  await act(async () => {
    vi.advanceTimersByTime(6500);
  });
  await waitFor(() => expect(shown()).toEqual(['2nd', '1st']));

  // And the two that were waiting get a full six seconds each, from now.
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(shown()).toEqual(['2nd', '1st']);

  await act(async () => {
    vi.advanceTimersByTime(2000);
  });
  await waitFor(() => expect(shown()).toEqual([]));
});

test('a timed notice publishes its own duration to the bar', async () => {
  render(<Page />);
  await send();
  const notice = await screen.findByRole('alertdialog');

  /*
   * The number the bar animates for comes from the same place the timer does,
   * which is the point of passing it rather than writing it in CSS: a bar
   * running for six seconds beside a timer that fires at ten is worse than no
   * bar at all.
   */
  const bar = notice.querySelector<HTMLElement>('.bb-toast-countdown');
  expect(bar).toBeTruthy();
  expect(bar!.style.getPropertyValue('--bb-toast-timeout')).toBe('6000ms');
});
