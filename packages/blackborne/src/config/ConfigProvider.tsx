import { createContext, useContext, useMemo } from 'react';
import { I18nProvider } from 'react-aria-components';
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
  children?: React.ReactNode;
}

/**
 * Supplies locale, strings, time zone and currency to everything beneath it.
 *
 * The library detects none of these and remembers none of them (P3). It does
 * not read the system colour scheme, does not read the browser's locale, and
 * writes to no storage. Your application decides and passes the resolved
 * values in.
 *
 * Nestable: a region can run in a different locale by wrapping it again.
 */
export function ConfigProvider({
  children,
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
   * I18nProvider is what makes the base format dates and numbers correctly and
   * flip direction for an RTL language. Reimplementing that is non-goal 6.
   */
  return (
    <ConfigContext.Provider value={value}>
      <I18nProvider locale={value.locale}>{children}</I18nProvider>
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
