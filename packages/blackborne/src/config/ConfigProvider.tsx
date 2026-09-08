import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef
} from 'react';
import { I18nProvider, RouterProvider } from 'react-aria-components';
/*
 * From `react-aria`, not from `react-aria-components`, which does not
 * re-export it. That is the whole reason `react-aria` is a direct dependency,
 * pinned to the exact version the components package pins
 * (decision 0013) — and the two only ever move together.
 */
import { UNSAFE_PortalProvider } from 'react-aria';
import { isDev } from '../internal/isDev';
import { en, type Dictionary, type DictionaryKey } from './dictionary';

export interface Config {
  /**
   * A BCP-47 language tag, e.g. `en-GB`, `es-PE`, `ar-EG`. Text direction is
   * derived from it — RTL languages flip the interface on their own, and
   * direction is never passed separately (doc 05 §4).
   */
  locale: string;
  /** Overrides for the library's own strings. Missing keys fall back to English. */
  dictionary: Dictionary;
  /**
   * The IANA time zone dates are rendered in, e.g. `America/Lima`.
   *
   * Received, never taken from the browser. The browser's zone belongs to the
   * machine of whoever is looking, not to the context of the data — a schedule
   * that appears shifted by an hour depending on who opens it is exactly this
   * bug (doc 05 §3.1). Undefined means the consumer has not said, and any
   * component that needs one must ask for it rather than guess.
   */
  timeZone?: string | undefined;
  /** ISO 4217 code, e.g. `PEN`. The library does not know what a business trades in. */
  currency?: string | undefined;
}

/*
 * Defaults that work. P3 is explicit that any component must be usable without
 * wrapping anything: a lone component with no provider around it renders in
 * English, in LTR, with the default locale's formatting. That is what makes
 * the library usable in a five-minute trial, and it is why there is no
 * mandatory provider to set up.
 */
const DEFAULTS: Config = {
  locale: 'en-US',
  dictionary: {}
};

const ConfigContext = createContext<Config>(DEFAULTS);

export interface ConfigProviderProps extends Partial<Config> {
  /**
   * Where everything that floats mounts: dialogs, drawers, popovers, menus,
   * tooltips and the toast region.
   *
   * Deliberately **not** part of `Config` and not readable through
   * `useConfig()`. Nothing in the library asks where it is mounted — the
   * base's own provider delivers it — and an export is easier to open than to
   * close (doc 02 §10).
   *
   * Leave it out and the base's default stands, which is `document.body`. That
   * is what keeps the entry gate's "works with no provider around it" true: a
   * lone `Dialog` with nothing wrapped around it mounts correctly.
   *
   * Supply it when your application has a stacking context of its own — a
   * shell that establishes one, a shadow root, an `<iframe>`-less embed — and
   * a layer parked on `document.body` would sit behind it or outside it. The
   * library will not reach for the document to work that out (P3, doc 08 §8).
   *
   * Three values, three meanings:
   *
   * - **omitted** — inherit from whatever provider is above, or the base's
   *   default if there is none
   * - **an element** — mount here
   * - **`null`** — mount at the base's default, ignoring an outer provider.
   *   The escape hatch for a region that must not follow its surroundings
   *
   * `null` rather than `undefined` for that last case because `undefined`
   * already means "I am not saying", and a provider that could not tell the
   * two apart would make an inner region unable to opt out of an outer one.
   */
  portalContainer?: HTMLElement | null | undefined;
  /**
   * How a link navigates. Your router's function, called with the `href`.
   *
   * Deliberately **not** part of `Config` and not readable through
   * `useConfig()`, for the same reason as `portalContainer`: nothing in the
   * library asks how navigation happens — the base's own provider delivers it
   * to every link beneath (decision 0016).
   *
   * Leave it out and a link does what an anchor has always done: it loads the
   * page. That is correct with no provider and wrong in a single-page
   * application, where it is a restart — and it is the worst kind of wrong,
   * because it looks like it works. Pass it once here and every `Link` below
   * goes through your router.
   *
   * **What it is NOT asked to handle.** The base checks first, so this is
   * called only for a press it would be right to intercept: a same-origin
   * `href`, no `target`, no `download`, and none of ctrl, meta, alt or shift
   * held. A ctrl-click still opens a new tab, and a middle-click never reaches
   * JavaScript at all. So a `navigate` that simply pushes onto a history stack
   * is complete — there is no modifier handling to write, and writing some
   * would break what already works.
   *
   * **Keep it, or do not — it is held by a ref either way.** The base memoises
   * its router context on the function's identity, so an inline arrow would
   * make a new context on every render of your application and re-render every
   * link under it. A stable wrapper is passed down instead, calling whichever
   * function was given last.
   *
   * The library adds no router, requires none, and knows no URL: an address
   * arrives by prop and the effect arrives as a function (P2, non-goal 1).
   */
  navigate?: ((href: string) => void) | undefined;
  children?: React.ReactNode;
}

/**
 * Supplies locale, strings, time zone, currency and the portal container to
 * everything beneath it.
 *
 * The library detects none of these and remembers none of them (P3). It does
 * not read the system colour scheme, does not read the browser's locale, and
 * writes to no storage. Your application decides and passes the resolved
 * values in.
 *
 * `portalContainer` and `navigate` are here for the same reason as the rest:
 * where a layer mounts and how a link navigates are facts about the host
 * application that only the host application knows (doc 08 §8, decisions 0013
 * and 0016). Each is set once here rather than on each of the components that
 * needs it, where five correct calls and one omission is a layer that escapes
 * or a link that reloads the application.
 *
 * Nestable: a region can run in a different locale by wrapping it again.
 */
export function ConfigProvider({
  children,
  portalContainer,
  navigate,
  ...overrides
}: ConfigProviderProps): React.ReactNode {
  const parent = useContext(ConfigContext);

  /*
   * Memoised on the individual fields rather than the object. A context whose
   * value is a fresh object every render re-renders every consumer, and in a
   * library the consumer cannot fix that — they inherit it (doc 10 §5).
   */
  const value = useMemo<Config>(
    () => ({
      locale: overrides.locale ?? parent.locale,
      dictionary: overrides.dictionary ?? parent.dictionary,
      timeZone: overrides.timeZone ?? parent.timeZone,
      currency: overrides.currency ?? parent.currency
    }),
    [
      overrides.locale,
      overrides.dictionary,
      overrides.timeZone,
      overrides.currency,
      parent
    ]
  );

  /*
   * The base asks for a FUNCTION returning the element, not the element.
   *
   * So it is memoised against the element, and that is not tidiness: a fresh
   * closure every render is a new context value, and a new portal context
   * unmounts and remounts every layer under it. The symptom would be a dialog
   * that flickers, or loses the focus it had just taken, whenever anything
   * above it re-rendered — with nothing in the console to say why.
   *
   * `null` is passed through as `null` deliberately: that is how the base's
   * context is CLEARED, which is what lets an inner region opt out of an outer
   * provider. `undefined` means "not saying", and returns no provider at all
   * so the outer one keeps applying.
   */
  const getContainer = useCallback(
    () => portalContainer ?? null,
    [portalContainer]
  );

  /*
   * The navigate function, behind a ref, for the same reason `getContainer` is
   * memoised: the base's `RouterProvider` builds its context with
   * `useMemo(..., [navigate])`, so a fresh closure every render is a new
   * router context and every link beneath it re-renders. Read in the installed
   * source, not assumed.
   *
   * A ref rather than a memo because the identity is the CONSUMER's to control
   * and they should not have to: an inline arrow is what anybody writes first,
   * and it would be a performance trap with no symptom worth noticing until an
   * application is large. The wrapper is stable for the life of the provider
   * and calls whichever function was given last, so a consumer who does
   * memoise loses nothing either.
   */
  const latest = useRef(navigate);
  /*
   * Updated in an effect and not during render, which the project's own lint
   * rule enforces — a ref written while rendering is a value React cannot see
   * changing. Safe here because the gap it leaves is unreachable: the wrapper
   * is only ever called from a press, and a press cannot arrive between a
   * render and the effect that follows it.
   */
  useEffect(() => {
    latest.current = navigate;
  }, [navigate]);
  const stableNavigate = useCallback((href: string) => {
    latest.current?.(href);
  }, []);

  /*
   * I18nProvider is what makes the base format dates and numbers correctly and
   * flip direction for an RTL language. Reimplementing that is non-goal 6.
   */
  const localised = (
    <I18nProvider locale={value.locale}>{children}</I18nProvider>
  );

  const portalled =
    portalContainer === undefined ? (
      localised
    ) : (
      <UNSAFE_PortalProvider
        getContainer={portalContainer === null ? null : getContainer}
      >
        {localised}
      </UNSAFE_PortalProvider>
    );

  return (
    <ConfigContext.Provider value={value}>
      {navigate === undefined ? (
        portalled
      ) : (
        /*
         * Only when asked. With no provider the base's own default router is
         * the native one — an anchor behaving like an anchor — which is what
         * keeps the entry gate's "works with no provider around it" true.
         */
        <RouterProvider navigate={stableNavigate}>{portalled}</RouterProvider>
      )}
    </ConfigContext.Provider>
  );
}

/** The resolved configuration. Works with no provider above it. */
export function useConfig(): Config {
  return useContext(ConfigContext);
}

/**
 * One of the library's own strings, in the active language.
 *
 * Falls back to English for a missing key and warns in development, so a gap
 * is loud while you are working and silent in production (doc 05 §2.2).
 */
export function useMessage(key: DictionaryKey): string {
  const { dictionary } = useConfig();
  const translated = dictionary[key];

  if (translated === undefined && isDev()) {
    console.warn(
      `[blackborne] no translation for "${key}"; falling back to English.`
    );
  }

  return translated ?? en[key];
}
