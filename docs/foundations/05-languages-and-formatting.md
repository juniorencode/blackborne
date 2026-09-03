# 05 · Languages and formatting

> Every component is multi-language by construction. The project picks the
> language; the library never does.
> "Supporting several languages" is not translating labels: there are five
> fronts, and the second costs more than the first.

**Status:** adopted · **Date:** 2026-09-02
**Still open:** whether Spanish ships out of the box later on (by the rule of
two).
**Depends on:** [01 · Principles](./01-principles.md) P2 and P3 ·
[04 · Responsive](./04-responsive.md)

---

## 1. The five fronts

| #   | Front                                                                                    | Who solves it                                                              |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | **Internal strings** — what the component says on its own, accessibility labels included | Library: declares and exposes them. Project: translates them               |
| 2   | **Formatting** — dates, times, numbers, currency, sorting, plurals                       | Library, resting on the platform's locale APIs and on the headless base    |
| 3   | **Direction** — LTR / RTL                                                                | Library (logical properties + headless base). Project: states the language |
| 4   | **Text expansion** — a language may take 30% more room                                   | Library: no width sized for one particular language                        |
| 5   | **Where the language comes from**                                                        | **Always the project.** The library does not detect, choose or remember    |

Front 2 is the underestimated one. Translating "Cancel" is trivial; having a
date display in the correct order, with the correct first day of the week, and
sorted correctly, is not.

## 2. Internal strings

### 2.1 First, have few

The best way to solve translation is not to need it. Surface-reduction rule:

> If the consumer can supply a string, ask for it as a prop. The dictionary is
> **only** for what the consumer cannot know.

Belonging in the dictionary: accessibility labels for internal controls
("close", "next page", "sort"), month and day names, and generic status
messages ("no results", "loading"). Not belonging: anything that is application
content.

### 2.2 Rules

1. **Zero literals in the code.** Including — above all — the accessibility
   ones: an accessibility label is text for a person even though it is not
   seen. Watched by lint.
2. **English always present as the fallback.** A missing key returns English,
   **never** an empty string. An empty string is a silent failure: half an
   interface goes blank with no error in the console.
3. **In development, a missing key warns.** In production, it falls back
   silently.
4. **Flat, stable keys.** Changing a key is a breaking change and goes with a
   major version.
5. **No complex interpolation.** Simple value substitution, and no building
   sentences by gluing fragments: word order changes between languages.
6. **Plurals by the language's own rules**, not with a singular/plural
   conditional. Some languages have more than two forms.
7. **The library ships English only.** Other languages are injected by the
   project. If over time both projects write the same Spanish dictionary, it
   moves in by the rule of two.

## 3. Formatting

Delegated to the platform's locale capabilities and to the headless base. The
library does not reimplement formatting rules and **does not drag in a date
library as its own dependency**.

| What               | What has to be respected                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Dates**          | Order of day, month and year; month and day names; **the first day of the week**; non-Gregorian calendars where applicable |
| **Times**          | 12 or 24 hours according to the locale, not according to a hand-written preference                                         |
| **Numbers**        | Decimal and thousands separators                                                                                           |
| **Currency**       | The symbol, and whether it goes before or after the number, with its spacing                                               |
| **Sorting**        | Accents and ñ do not sort the same way in every language. Never a raw string comparison for sorting visible text           |
| **Relative dates** | "3 days ago" is built with the language's rules, not by concatenation                                                      |

### 3.1 Time zone: never the browser's

**The library never uses the browser's time zone.** It receives the zone it
must apply and works with that.

This is here because it is an expensive, recurring mistake: the browser's zone
belongs to the machine of whoever is looking, not to the context of the data. A
schedule that appears shifted by an hour depending on who opens it is exactly
this bug. The library cannot know which zone applies, so it does not guess: it
requires it.

Same with currency: the component does not know which currency the business
operates in. It receives it.

## 4. Direction (RTL)

- **Never physical measurements.** Always start and end, never left and right.
  It is half of the support, and it is watched by lint (doc 03, rule 4).
- **Direction is derived from the language**, not passed separately: switching
  to an RTL language flips the interface on its own.
- **Directional icons do flip** (navigation arrows, previous/next indicators,
  indentation). **What does not flip** are icons representing real-world
  objects (clocks, logos) and data charts.
- **Numbers, codes and technical data stay LTR** even when the surrounding text
  is RTL.
- Scrolling and keyboard shortcuts invert where appropriate too: the right
  arrow key advances or retreats according to direction.

## 5. Text expansion

- No width or height sized so one particular label fits.
- Buttons and labels grow with their content or truncate explicitly; they never
  let it overflow silently.
- When text is truncated, the full text stays accessible (a tooltip or an
  accessible equivalent).
- Short strings are the most dangerous: "OK" in one language can be a
  twelve-character word in another.

## 6. What the library does not do

1. It does not detect the user's language.
2. It does not persist or remember it (P3).
3. It brings no translation library as a dependency: it receives an object of
   strings and a locale code.
4. It brings no translations beyond English.
5. It does not validate or interpret data by country (identity documents,
   addresses, names): that is the project's domain (P1). The exception is
   formats a specialised library solves, such as phone numbers.

## 7. The contract

A single configuration provider, with defaults that work (P3): language,
dictionary, time zone and, where applicable, currency. Direction is derived
from the language.

Without wrapping anything, a component must render in English, in LTR, and with
the default locale's formatting. Working without configuration is what makes
the library usable in a quick trial, and what avoids the mandatory provider
nobody wants to set up.

## 8. Verification

- [ ] Zero literals in the code, accessibility labels included
- [ ] With no dictionary, everything comes out in English and nothing comes out
      empty
- [ ] With a key deleted, it falls back to English and warns in development
- [ ] With **pseudo-localisation** (artificially lengthened strings) nothing
      breaks or overlaps
- [ ] In an RTL language: the interface flips, directional icons invert,
      numbers do not
- [ ] With a different formatting locale: the date order, the decimal separator
      and the first day of the week all change
- [ ] With a time zone different from the browser's, the dates shown are
      correct
- [ ] Sorting a text column respects accents and ñ

Pseudo-localisation is the highest-return test on this list: lengthening every
string by 40% finds layout breaks in minutes that otherwise surface the day
someone translates to German.
