/*
 * The hook, which is where every capability an "async combo box" would have
 * been a component for actually lives (P6).
 *
 * Rendered through a tiny fixture rather than not at all, because a hook is a
 * hook and React has to run it — but nothing here renders a field, and no test
 * in this file touches the network. `load` is a function that returns an
 * array, which is the whole of P2 made testable.
 *
 * The timers are FAKE, because the two things this hook adds are a delay and a
 * threshold, and a test that waits 300 real milliseconds thirty times is a
 * suite nobody runs.
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  useAsyncOptions,
  type AsyncOptions,
  type OptionsRequest
} from './useAsyncOptions';

interface Doctor {
  id: string;
  name: string;
}

const page = (...names: string[]): Doctor[] =>
  names.map(name => ({ id: name.toLowerCase(), name }));

/*
 * The loader's type, given to `vi.fn` rather than written as a parameter the
 * body ignores: a mock needs the signature so `mock.calls[0][0]` exists, and a
 * parameter nobody reads is a lint error rather than documentation.
 */
type Loader = (
  request: OptionsRequest
) => Promise<{ items: readonly Doctor[]; cursor?: string | undefined }>;

/** The hook's whole surface, on screen, so a test can read it. */
function Probe({
  load,
  debounce,
  minQueryLength,
  onReady
}: {
  load: (request: OptionsRequest) => Promise<{
    items: readonly Doctor[];
    cursor?: string | undefined;
  }>;
  debounce?: number;
  minQueryLength?: number;
  onReady?: (options: AsyncOptions<Doctor>) => void;
}) {
  const options = useAsyncOptions<Doctor>({
    load,
    ...(debounce === undefined ? {} : { debounce }),
    ...(minQueryLength === undefined ? {} : { minQueryLength })
  });
  onReady?.(options);

  return (
    <ul>
      <li data-testid="items">
        {options.items.map(item => item.name).join(', ')}
      </li>
      <li data-testid="query">{options.query}</li>
      <li data-testid="loading">{String(options.isLoading)}</li>
      <li data-testid="loading-more">{String(options.isLoadingMore)}</li>
      <li data-testid="waiting">{String(options.isWaitingForQuery)}</li>
      <li data-testid="error">{options.error?.message ?? ''}</li>
    </ul>
  );
}

const read = (name: string): string =>
  screen.getByTestId(name).textContent ?? '';

/** Let the timers run and the promises settle, in that order. */
const settle = async (ms = 1000): Promise<void> => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('it asks once on mount, with an empty query and no cursor', async () => {
  const load = vi.fn<Loader>(async () => ({
    items: page('Ana Vega', 'Luis Salas')
  }));

  render(<Probe load={load} />);
  await settle();

  expect(load).toHaveBeenCalledTimes(1);
  expect(load.mock.calls[0]?.[0]).toMatchObject({ query: '' });
  expect(load.mock.calls[0]?.[0]?.cursor).toBeUndefined();
  expect(read('items')).toBe('Ana Vega, Luis Salas');
});

test('a loader is handed an abort signal, whatever it does with it', async () => {
  const load = vi.fn(async ({ signal }: OptionsRequest) => {
    expect(signal).toBeInstanceOf(AbortSignal);
    return { items: page('Ana Vega') };
  });

  render(<Probe load={load} />);
  await settle();

  expect(load).toHaveBeenCalled();
});

/*
 * THE FIRST OF THE TWO THINGS THIS HOOK EXISTS FOR. `useAsyncList` asks the
 * moment it is told, so a run of keystrokes would be a run of requests.
 */
test('a run of keystrokes makes one request, after the wait', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      debounce={300}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();
  load.mockClear();

  for (const text of ['v', 've', 'veg']) {
    act(() => {
      options?.onQueryChange(text);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
  }

  // 300ms of typing, and nothing asked yet: the wait keeps restarting.
  expect(load).not.toHaveBeenCalled();

  await settle();

  expect(load).toHaveBeenCalledTimes(1);
  expect(load.mock.calls[0]?.[0]).toMatchObject({ query: 'veg' });
});

test('and the box shows what was typed while the wait runs', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();

  act(() => {
    options?.onQueryChange('veg');
  });

  /*
   * Two values, and this is why: the query is what somebody can see in the
   * box, and it moves on the keystroke. What has been ASKED for lags behind it
   * by the length of the wait.
   */
  expect(read('query')).toBe('veg');
  expect(read('loading')).toBe('true');
});

test('a pending keystroke counts as loading, so a stale list says so', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();
  expect(read('loading')).toBe('false');

  act(() => {
    options?.onQueryChange('zz');
  });
  expect(read('loading')).toBe('true');

  await settle();
  expect(read('loading')).toBe('false');
});

/* THE SECOND THING. A catalogue of two hundred thousand is not a first page. */
test('nothing is asked until the minimum query length is reached', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      minQueryLength={3}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();
  load.mockClear();

  act(() => {
    options?.onQueryChange('ve');
  });
  await settle();

  expect(load).not.toHaveBeenCalled();
  expect(read('waiting')).toBe('true');

  act(() => {
    options?.onQueryChange('veg');
  });
  await settle();

  expect(read('waiting')).toBe('false');
  expect(load).toHaveBeenCalledTimes(1);
  expect(load.mock.calls[0]?.[0]).toMatchObject({ query: 'veg' });
});

test('and a query that falls back under the minimum asks for nothing', async () => {
  const load = vi.fn(async ({ query }: OptionsRequest) => ({
    items: query === '' ? [] : page('Ana Vega')
  }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      minQueryLength={3}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();

  act(() => {
    options?.onQueryChange('veg');
  });
  await settle();
  expect(read('items')).toBe('Ana Vega');

  act(() => {
    options?.onQueryChange('v');
  });
  await settle();

  /*
   * The previous answers are gone rather than left on screen: they answer a
   * question nobody is asking any more, and the field says "keep typing"
   * instead.
   */
  expect(read('waiting')).toBe('true');
  expect(read('items')).toBe('');
});

test('the query is trimmed before it is asked for', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();
  load.mockClear();

  act(() => {
    options?.onQueryChange('  veg  ');
  });
  await settle();

  expect(load.mock.calls[0]?.[0]).toMatchObject({ query: 'veg' });
});

test('one more page is appended, with the cursor the last one gave', async () => {
  const load = vi.fn(async ({ cursor }: OptionsRequest) =>
    cursor === undefined
      ? { items: page('Ana Vega'), cursor: 'page-2' }
      : { items: page('Luis Salas') }
  );
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();

  act(() => {
    options?.loadMore();
  });
  await settle();

  expect(load).toHaveBeenCalledTimes(2);
  expect(load.mock.calls[1]?.[0]).toMatchObject({ cursor: 'page-2' });
  expect(read('items')).toBe('Ana Vega, Luis Salas');
});

/*
 * MEASURED ON THE BASE and asserted here, because the alternative is a request
 * loop nobody notices until a bill arrives: a page with no cursor is how the
 * end is declared, and asking past it does nothing.
 */
test('asking past the last page asks for nothing', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();
  load.mockClear();

  act(() => {
    options?.loadMore();
  });
  await settle();
  act(() => {
    options?.loadMore();
  });
  await settle();

  expect(load).not.toHaveBeenCalled();
});

test('a failed load is reported, and retry asks again', async () => {
  let attempt = 0;
  const load = vi.fn<Loader>(async () => {
    attempt += 1;
    if (attempt === 1) throw new Error('the server said no');
    return { items: page('Ana Vega') };
  });
  let options: AsyncOptions<Doctor> | undefined;

  render(
    <Probe
      load={load}
      onReady={next => {
        options = next;
      }}
    />
  );
  await settle();

  expect(read('error')).toBe('the server said no');
  expect(read('items')).toBe('');

  act(() => {
    options?.retry();
  });
  await settle();

  expect(read('error')).toBe('');
  expect(read('items')).toBe('Ana Vega');
});

test('a loader written inline is not a reason to load again', async () => {
  /*
   * The reason the loader is held in a ref: a consumer writes `load` inline,
   * so it is a new function on every render. If the list saw that, every
   * render would be a request.
   */
  const calls = { count: 0 };
  let options: AsyncOptions<Doctor> | undefined;

  const Fixture = ({ label }: { label: string }) => (
    <>
      <span>{label}</span>
      <Probe
        load={async () => {
          calls.count += 1;
          return { items: page('Ana Vega') };
        }}
        onReady={next => {
          options = next;
        }}
      />
    </>
  );

  const { rerender } = render(<Fixture label="one" />);
  await settle();
  expect(calls.count).toBe(1);

  rerender(<Fixture label="two" />);
  rerender(<Fixture label="three" />);
  await settle();

  expect(calls.count).toBe(1);
  expect(options?.items).toHaveLength(1);
});

/*
 * FOUND BY A BROWSER CHECK THAT PASSED FOR THE WRONG REASON. `useAsyncList`
 * loads once on mount whether anything asked it to or not, so a field with a
 * minimum query length used to fetch a first page for the empty query — and
 * the "keep typing" row was only visible for the length of that request.
 */
test('a minimum query length means nothing is asked on mount either', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));

  render(<Probe load={load} minQueryLength={3} />);
  await settle();

  expect(load).not.toHaveBeenCalled();
  expect(read('items')).toBe('');
  expect(read('waiting')).toBe('true');
});

test('and with no minimum, the first page still arrives unasked', async () => {
  const load = vi.fn<Loader>(async () => ({ items: page('Ana Vega') }));

  render(<Probe load={load} />);
  await settle();

  // Which is what a list of forty wants: open it and it is there.
  expect(load).toHaveBeenCalledTimes(1);
  expect(read('items')).toBe('Ana Vega');
});
