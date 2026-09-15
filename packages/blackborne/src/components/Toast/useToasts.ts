import { useState } from 'react';
import { UNSTABLE_ToastQueue as BaseToastQueue } from 'react-aria-components';
import type { Tone } from '../../internal/ToneGlyph';
import { TOAST_ACTION_TIMEOUT, TOAST_TIMEOUT } from '../../internal/Layer';

/** The four kinds of message the library can carry, as `Alert` uses them. */
export type ToastTone = Tone;

/**
 * One notice, as a consumer describes it.
 *
 * Deliberately close to `Alert`'s vocabulary, because they say the same kinds
 * of thing in two places: a tone, a line about what happened, and — here only
 * — something to do about it.
 */
export interface ToastMessage {
  /**
   * Which of the five kinds this is. Defaults to `neutral`, which draws no
   * badge at all: a notice that declares no tone is reporting no outcome, and
   * a blue `information` glyph would be claiming one on its behalf.
   *
   * `danger` carries one behaviour of its own: it does not go away on a timer
   * (doc 09 §4.1). A message about something going wrong that removes itself
   * leaves somebody with a broken state and no explanation.
   */
  tone?: ToastTone;
  /**
   * Stay until somebody dismisses it, instead of leaving on a timer.
   *
   * **The tone sets the default and this overrides it, in either direction.**
   * A `danger` notice stays unless told not to; every other tone leaves unless
   * told to stay. Doc 09 §4.1 separates the two questions and says why: an
   * error somebody can safely miss has no business holding a corner of the
   * screen, and a success about something irreversible may have every business
   * doing so. Persistence is a property of the MESSAGE, not of its colour.
   *
   * What this does NOT open is how long a timed notice lasts. Six seconds and
   * ten remain the library's, for §3.1's reason — per-instance timings are what
   * make two screens in one application feel like two applications.
   */
  isPersistent?: boolean;
  /**
   * What happened, in a line. Doc 09 §4: what happened and what to do, with no
   * codes, no apologies and no jokes.
   */
  title: React.ReactNode;
  /**
   * One thing to do about it, and in this library the case that matters is
   * **undo**.
   *
   * Doc 09 §5 prefers undo over confirmation wherever it is technically
   * possible, because a confirmation answered a hundred times is answered
   * automatically and stops protecting anything. A notice carrying an action
   * stays four seconds longer than one that does not, because the action is
   * the point.
   *
   * The label is a string the consumer supplies — "Undo", "View", "Retry" —
   * and it names the action, never "OK" (doc 09 §5.4).
   */
  action?: {
    label: React.ReactNode;
    onPress: () => void;
  };
}

/**
 * A queue of notices: what a consumer holds, adds to, and hands to a
 * `ToastRegion`.
 *
 * Three methods and nothing else. In particular there is no way to read the
 * queue, and that is deliberate: the region renders it, and a consumer who
 * needs to know what is on screen is building a second notification system
 * beside this one.
 */
export interface ToastQueue {
  /**
   * Show a notice, and get back the key that closes it.
   *
   * The key is returned rather than accepted, because two notices that happen
   * to describe the same thing are still two notices, and a caller choosing
   * keys would eventually reuse one.
   */
  add(message: ToastMessage): string;
  /** Close one early, by the key `add` returned. */
  close(key: string): void;
  /** Close all of them. For a route change, or a sign-out. */
  clear(): void;
}

/*
 * The base's queue, kept out of the consumer's types.
 *
 * WHY A WeakMap RATHER THAN A FIELD. Doc 08 §7.1 turns on one point: the queue
 * is the only part of a toast that a consumer HOLDS, so it is the only part a
 * wrapper of ours cannot rename for them later. A rename inside our files
 * costs them nothing; a change to a class that appears in their own type
 * signatures costs them a migration — and the base marks its toast components
 * `UNSTABLE_` precisely because that assembly may still move.
 *
 * So `useToasts` returns three functions and the region looks the real queue up
 * here. The alternatives were worse: a field on the returned object puts the
 * base's type back into the public surface through that field, and a cast in
 * the region does the same job while telling the type system a lie. A WeakMap
 * needs neither, holds nothing alive, and keeps the escape hatch this library
 * forbids from existing at all.
 */
const queues = new WeakMap<ToastQueue, BaseToastQueue<ToastMessage>>();

/** INTERNAL. The base queue behind a public one. */
export function baseQueueOf(
  queue: ToastQueue
): BaseToastQueue<ToastMessage> | undefined {
  return queues.get(queue);
}

/*
 * How many are shown at once, and what happens to the rest.
 *
 * THREE, NEWEST FIRST, and the rest WAIT — measured rather than assumed,
 * because the assumption was wrong in a way that reads perfectly well.
 *
 * A burst of five shows `[5th, 4th, 3rd]`: the newest three, with the newest at
 * the top. A fourth notice pushes the oldest off the SCREEN and not out of the
 * queue. Then, and this is the part worth knowing: when the three visible ones
 * expire, `[2nd, 1st]` appear and get their full six seconds each. **A waiting
 * notice does not spend its time while it is hidden** — the base starts a
 * timer when a toast becomes visible, not when it is added.
 *
 * So nothing is dropped and nothing expires unseen, which is what doc 08 §7.1
 * means by a backlog rather than an eviction. The first version of this comment
 * claimed the same conclusion from the wrong mechanism — that the FIRST three
 * are shown and a fourth waits its turn — and a test written from it failed,
 * which is the only reason it was measured at all.
 *
 * Three, because a stack that reaches the middle of the screen has stopped
 * being a notification and started being a dialog nobody opened.
 */
const MAX_VISIBLE = 3;

/**
 * Create a queue of notices.
 *
 * **The consumer owns it**, which is the whole shape of this component and not
 * an implementation detail. The library owns no global state (P3), so it cannot
 * keep a queue of its own — and a queue is exactly the kind of thing a
 * notification library usually keeps at module level because the examples do.
 *
 * Hold what this returns wherever the application already keeps things
 * everything can reach, pass it to one `ToastRegion`, and add to it from
 * anywhere:
 *
 * ```tsx
 * const toasts = useToasts();
 *
 * <ToastRegion queue={toasts} />
 *
 * toasts.add({ tone: 'success', title: 'Invoice sent' });
 * toasts.add({
 *   title: 'Customer deleted',
 *   action: { label: 'Undo', onPress: restore }
 * });
 * ```
 *
 * One region per queue. Two regions rendering the same queue would announce
 * every notice twice, and a screen reader would find two landmarks with the
 * same name.
 */
export function useToasts(): ToastQueue {
  /*
   * State and not a ref, so the queue survives a re-render and is created
   * exactly once. A ref initialised inline constructs a queue on every render
   * and throws all but the first away — harmless here, and the kind of thing
   * that stops being harmless when a constructor does work.
   */
  const [api] = useState<ToastQueue>(() => {
    const base = new BaseToastQueue<ToastMessage>({
      maxVisibleToasts: MAX_VISIBLE
    });

    const queue: ToastQueue = {
      add(message) {
        /*
         * WHETHER there is a timer is the message's, and HOW LONG is the
         * library's. Doc 09 §4.1 draws the line exactly there.
         *
         * The tone supplies the default — `danger` stays, everything else
         * leaves — and `isPersistent` overrides it either way. The base treats
         * a missing timeout as "stays until closed", so persisting is the
         * absence of a number rather than a flag it carries.
         */
        const persists = message.isPersistent ?? message.tone === 'danger';

        const timeout = persists
          ? undefined
          : message.action === undefined
            ? TOAST_TIMEOUT
            : TOAST_ACTION_TIMEOUT;

        return base.add(message, timeout === undefined ? {} : { timeout });
      },
      close(key) {
        base.close(key);
      },
      clear() {
        base.clear();
      }
    };

    queues.set(queue, base);
    return queue;
  });

  return api;
}
