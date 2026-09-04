# 01 · Principles and non-goals

> The founding document. It is the first one written and the last one changed.
> If an argument about what to build is not settled here, this document is
> missing a line.

**Status:** adopted · **Date:** 2026-09-02

---

## 1. What this is

A component library for **management applications** — internal dashboards,
CRUD screens, dense forms, listings with filters and data tables — distributed
as a versioned package and consumed by several independent projects.

It is not an extraction. It is written from scratch, inheriting no API, prop
name, DOM structure or test id from any previous code.

## 2. Who it is for

|                              |                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| **Reference consumers**      | Two management applications, in different domains, developed alongside the library              |
| **External consumers**       | Considered from the start: the library is open source and published to a public registry        |
| **Consumers not considered** | Content sites, e-commerce and marketing pages. Not the use case, and they influence no decision |

The reference consumers exist for a concrete reason: they are the design
pressure. An API that satisfies only its author is untested. That there are
**two**, in different domains, is deliberate — with one you do not generalise,
and with many you do not ship.

**They do not exist yet**, and this document says so rather than describing an
intention as a fact. Until they do, the library is designed against judgement
instead of evidence, which is a real limitation and the reason P5 was narrowed
([decision 0008](../decisions/0008-the-rule-of-two-splits.md)). The first
application to use the library in earnest will change API decisions, and that
is the point of having one.

They are not named here, and never will be. They are private projects, and no
document in this repository refers to one.

## 3. Principles

Six. They are written so they can be broken: a principle nobody would argue
with is useless.

**P1 · Zero domain.**
No component knows about business entities, permissions or sessions. If a
component name only makes sense inside one industry or one application, it does
not belong here.
_Test:_ does this component make sense in both applications at once, and in a
third that does not exist yet?

**P2 · Zero network.**
No component makes requests, knows a URL, or knows how anyone authenticates.
What needs data receives it as props; what needs to cause an effect receives a
function.
_Test:_ does it render correctly with no network and no server?

**P3 · Zero hidden global state.**
The library does not write to `document`, to `localStorage`, or to singletons.
Everything cross-cutting — theme, language, direction, formatting — enters
through a single provider **whose defaults work**: any component must be usable
without wrapping anything.
_Test:_ does a lone component, with no provider around it, render correctly?

**P4 · The container decides, not the window.**
Adaptive behavior is based on the width of the container. Viewport breakpoints
are the exception and must be justified in writing. Everything is fluid by
default: nothing has a fixed width.
_Test:_ does it work in a 320px side panel inside a 1920px screen?

**P5 · Components are chosen; props are earned.**
Which components exist is a deliberate decision. Which props they carry is not:
a new prop, variant or entry point on an existing component needs a real place
that needs it today — not one somebody can imagine.

The asymmetry is the whole point. One component too many sits apart, gets
imported by nobody, and can be deprecated away. One prop too many lives on a
component people do use, and removing it costs a major version. Every warning
sign in §7 is about props; not one is about how many components exist.
_Test:_ for a new prop, can you name the place that needs it today?

This principle was narrower before — it required **two** consumers for
anything at all, components included. See
[decision 0008](../decisions/0008-the-rule-of-two-splits.md) for why it
changed and what would bring the stricter form back.

**P6 · State is separate from presentation.**
Anything with logic lives in a hook or a pure function, testable without
rendering. Components paint and delegate. A new capability is a new hook, never
one more prop on an existing component.

Corollary for composed sets (tables, complex forms): a ready-to-use assembly
may — and should — exist, but **it may not have a single capability its pieces
lack**. If something can only be achieved by passing a prop to the assembly,
the model is wrong and that capability belongs in a hook.
_Test:_ can you rebuild the assembly from the public pieces, losing nothing?

## 4. Non-goals

What the library will never do. This list is the useful part of the document.

1. **It is not an application framework.** No routing, no server state
   management, no data layer, no authentication, and no application layout
   (shell, side navigation, user header). That belongs to each project.
2. **It contains no business components.** No entity pickers, no session
   banners, no chats, no assistants. See P1.
3. **It does not solve whole screens.** There is no "listing page" and no
   "create form". The library provides pieces; composition belongs to the
   consumer.
4. **There are no monolithic components.** Complex sets — data table, dense
   forms — **are** part of the library and are one of its reasons to exist: a
   data table with search, configurable filters, sorting by column (or only by
   some), column reordering and pinning, row dragging, a relative-index column
   and pagination is first-class functionality, not an extra. What is forbidden
   is _how_ not to build it: one component that does everything through
   accumulated props. They are built as a **suite**: state hooks +
   presentational pieces + a thin optional assembly, subject to P6.
5. **It does not validate business rules.** The library restricts input — a
   numeric field rejects letters, a phone number formats as you type, an
   impossible date cannot be typed, `min`/`max`, length — and **presents** the
   error with correct accessibility. Deciding whether a value is valid, writing
   the messages, and cross-field validation belong to the project. No schema
   library is a dependency of this package.
6. **It does not reimplement accessibility.** Dialogs, menus, comboboxes,
   dates, focus and keyboard rest on the headless base. If something is not
   covered, search first; building it by hand is the last resort and requires a
   written justification.
7. **It does not reimplement solved engines.** Table state (sorting, filters,
   visibility, column order and pinning, pagination, selection) rests on an
   existing headless table engine; dragging on an existing drag library. Same
   for rich text, dates, phone numbers and currency. The library contributes
   the skin, a coherent API, and convenience hooks. Rewriting an engine by hand
   is the direct route to the thousand-line component.
8. **It does not require the consumer to use Tailwind.** CSS ships compiled and
   prefixed. That Tailwind is used internally is an implementation detail.
9. **It does not require the consumer to use a form library.** The core of
   every field is controlled. Adapters live behind a separate entry point and
   are optional.
10. **There are no escape hatches.** No props that inject classes into
    arbitrary internal nodes, and no overrides that depend on internal DOM
    structure. If a consumer needs something, they get a named prop or
    composition — not a hole.
11. **There is no infinite backward compatibility.** Before 1.0 the API breaks
    when it needs to. After that, it breaks with a major version and a
    migration guide.
12. **No support is promised.** This is open source published in good faith and
    used in production by its authors. Reports and proposals are accepted, with
    no commitment to timelines or to acceptance. This is stated visibly: an
    unmet expectation does more damage than an expectation never created.

## 5. The entry gate

To enter the library, **all** of these must hold:

- [ ] It belongs in the catalog, and any new prop it carries has a real case (P5)
- [ ] Its name mentions no business domain (P1)
- [ ] It does not need to know where its data comes from (P2)
- [ ] It works with no provider around it (P3)
- [ ] It works in a 320px container (P4)
- [ ] Its logic lives in hooks or pure functions, with their own tests that
      render nothing (P6)
- [ ] If it is an assembly, it can be rebuilt from the public pieces with
      nothing lost (P6)
- [ ] It works in light and dark mode, and with an overridden brand theme
- [ ] It works in LTR and RTL
- [ ] It survives a language change: text, date and number formatting, and
      labels 30% longer
- [ ] It is keyboard navigable, with visible focus
- [ ] Every state is in the visual catalog: default, hover, focus, active,
      disabled, loading, error, empty
- [ ] It contains no literal user-facing string outside the dictionary

Thirteen. A component that meets twelve of them does not enter: it stays in
the project that needed it until it meets all thirteen.

## 6. Decisions already taken

Recorded so they are not re-argued. The ones with their own record live under
[`../decisions/`](../decisions/).

| Decision           | Choice                                                                                                    | Immediate consequence                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Distribution**   | Versioned package, no copy-paste templates                                                                | All customization goes through props → P6 and non-goal 4 are the containment                                  |
| **Headless base**  | React Aria Components                                                                                     | Styling targets DOM state attributes, not conditional classes built in JS                                     |
| **Styles**         | Tailwind inside, compiled prefixed CSS outside                                                            | Tokens are CSS variables; the consumer overrides variables, not classes                                       |
| **Themes**         | Three independent axes: mode, brand color, density                                                        | None is implemented with per-component special classes: everything comes from variables                       |
| **Palette**        | Scales where every step has a defined role, not ordered only by lightness                                 | One semantic mapping valid for every family and both modes. A dev dependency: it never reaches the consumer   |
| **Text direction** | RTL supported from day one                                                                                | `left`/`right` forbidden in CSS: always `start`/`end`. Watched by lint, not by review                         |
| **Languages**      | Every component is multi-language by construction; the project picks the language, the library never does | English fallback always present: a missing key never produces an empty string. The library ships English only |
| **Validation**     | Schemas and business rules in the project; the library only restricts input and presents the error        | Fields expose "is invalid" and "error message"; no schema library becomes a dependency                        |
| **Complex sets**   | Suite: state hooks + pieces + thin assembly                                                               | Subject to P6. The data table is first-class functionality, not an extra                                      |
| **Publication**    | Open source, public registry, from day one                                                                | The API is designed for strangers. No references to private projects in code, examples or docs                |
| **Stability**      | The `0.x` series while the API moves; `1.0` only once settled by real use                                 | In `0.x` it can break with notice; after that, only with a major version and a migration guide                |

## 7. Signs this document is being broken

Revisit when any of these appear:

- A component passes ~500 lines
- A component accumulates more than ~15 props
- An assembly has a capability its pieces lack (a direct P6 violation)
- A new capability is implemented as a prop on an existing component instead of
  as a hook
- Loose boolean props appear for one project's specific case (`isCompact`,
  `hideHeaderOnMobile`, `showLegacyFooter`)
- A consumer has to wrap the library in order to use it
- A consumer maintains a fork, or patches CSS from outside
- A literal string appears in the code, and above all inside an `aria-label`
- A fixed width or height exists so one particular label fits
- There are two different ways to do the same thing inside the library
- Someone proposes adding a prop "since we're already here" — the half of P5
  that still bites

## 8. How this document changes

Principles and non-goals are changed **before** writing the code that
contradicts them, never afterwards to justify it. Every change leaves a record:
what changed, why, and what real case motivated it.
