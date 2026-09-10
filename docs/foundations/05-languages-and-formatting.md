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
   moves in — that is package content earning its place, the same test a new
   prop faces (P5).

### 2.3 Some strings are the base's, and the dictionary cannot reach them

The base ships its own translations, in thirty-odd locales, for the
instructions attached to patterns it implements — "Press Delete to remove tag"
on a tag, the name of a search field's clear button. They follow the locale the
provider supplies, so they are never in the wrong language.

But they are **not overridable from the dictionary**, and that is worth knowing
before somebody spends an afternoon looking for the key. Where it matters — a
name a project would want in its own words — the library sets it explicitly and
wins, which is what `clear` and the numeric steppers do. Where it does not, the
base's wording stands.

The line: a string a project would plausibly want to change is ours and lives
in the dictionary. An instruction about how a widget works is the base's, and
re-declaring all of them would be maintaining a second translation set for
nothing.

**And one of them is not an instruction but a vocabulary.** Added with
`ColorSwatchField`: the base names every colour swatch with
`color.getColorName(locale)` — `#3e63dd` is announced as "dark vibrant blue",
localised — and gives it a role description of "color swatch" from
`@react-aria/color`'s own strings. Neither is reachable from the dictionary and
neither should be: naming ten thousand colours in every language is not a job
for a component library, and it is the clearest case yet of the line above
being drawn in the right place.

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
- **The block axis is not part of this, and `top`/`bottom` are literal.** This
  rule is about direction — which way the inline axis runs — and not about
  writing mode. The library supports RTL; it does not support vertical text, and
  in every locale it claims to support the block start is the top. So a drawer
  takes `start | end | top | bottom` and only the first two flip. Written down
  because the asymmetry looks like an oversight, and somebody will otherwise
  "fix" it into `block-start`, which nobody reading a prop list understands.
- **There is no logical `translate`, and that is the one gap you will hit.**
  Placement, padding, borders and radii all have logical properties that flip on
  their own. Movement does not: a percentage on the x axis is physical, positive
  meaning right, in every direction. Anything that SLIDES therefore needs the
  direction as a value — read from the locale with the base's `useLocale`, never
  detected, and confined to as few rules as possible with the reason beside
  them. `Drawer` is the worked example.
- **Direction is derived from the language**, not passed separately: switching
  to an RTL language flips the interface on its own.
- **And where BOTH mechanisms are in play they have to agree**, which is the
  failure §4.1 records: a stylesheet flips a logical property on its own and
  JavaScript flips a percentage only if it was told the locale, so a component
  using one of each can end up internally inconsistent with nothing wrong in
  either half.
- **Directional icons do flip** (navigation arrows, previous/next indicators,
  indentation). **What does not flip** are icons representing real-world
  objects (clocks, logos) and data charts.
- **Numbers, codes and technical data stay LTR** even when the surrounding text
  is RTL.
- Scrolling and keyboard shortcuts invert where appropriate too: the right
  arrow key advances or retreats according to direction.

### 4.1 Two mechanisms, one question, and they can disagree

**Date:** 2026-09-10, with `Slider`.

A slider draws two things against the same rail. The fill's offset is
`inset-inline-start`, a logical CSS property that the stylesheet mirrors on its
own. The handle's is a computed `left` percentage, and the base mirrors it only
when the LOCALE it was given is right-to-left — the rule above, arriving as a
consequence rather than as advice.

So a story that set `dir="rtl"` and declared no locale produced this, measured:

| At value 30, out of 100 | Where it was drawn        |
| ----------------------- | ------------------------- |
| The fill                | the right 30% of the rail |
| The handle              | 30% from the LEFT         |

A handle at the wrong end of its own fill, with nothing wrong in the DOM,
nothing wrong in either mechanism, and no assertion about either one failing.

Three things follow.

**A `dir` attribute is not a locale.** Anything whose JavaScript positions
something needs `ConfigProvider` with a right-to-left locale, not just a
direction on an ancestor — which is what the catalog's RTL stories must
therefore declare, and half of them did not need to because their layout is
pure CSS.

**The assertion belongs on the AGREEMENT, not on the two halves.** "The fill
starts at the right" and "the handle is at 70%" are both true in the broken
case. "The handle is at the leading edge of the fill" is the invariant, and it
fails whatever the cause.

**And the keyboard confirmed the last bullet of §4** rather than needing a rule
of its own: with the locale right, the arrow pointing right decreases the value
AND moves the handle rightwards — the handle follows the key, the number
follows the axis. The block axis does not mirror: up is more, in every
language.

### 4.2 A name is not a source of initials

**Date:** 2026-09-10, with `Avatar`.

Taking "CR" from "Carlos Ramos" looks like string handling and is a
**transformation of a person's name**, which is the one kind of text this
library is least entitled to touch.

It fails in more languages than it works in. A Japanese name is written with no
space between its parts, so there is nothing to split on. Arabic and Hebrew are
read the other way, so "the first letter" is not the first character in the
string. Spanish surnames come in pairs and Dutch ones carry particles, so
"de la Cruz" yields "D" from any rule simple enough to write. And a single
Chinese character is a whole given name rather than an initial of anything.

**So the library does not do it.** A component that shows a fallback for a
missing image receives that fallback as CHILDREN, the way an icon arrives
(doc 02 §11) — initials, a monogram, a silhouette the consumer already owns.
Only the project knows how names are written where its people are.

What the library still owns is the accessible name: the component takes the
full name as a prop and puts it on the box, so a fallback reading "CR" on the
screen is named "Carlos Ramos" in the accessibility tree. The two channels
carry different things on purpose, and that much is measured.

**Whether a reader ALSO says the letters is not settled.** The ARIA
specification marks `img` as "children presentational", so it should not — and
an aria snapshot of the component reads `- img "Ana Vega": AV`, with the text
still in the node. The tool does not answer the question, so it is on
[doc 06](./06-accessibility.md) §5's list rather than claimed here.

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
