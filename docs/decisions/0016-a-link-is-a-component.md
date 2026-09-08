# 0016 · A link is a component, and navigation arrives with the configuration

**Date:** 2026-09-08 · **Status:** accepted

## Context

Until now a link in this library was `Button variant="link"` — a button that
looks like a link. That was enough for what it was used for: an action that
should not shout, in an empty state or beside a field.

`Breadcrumbs` is what made it insufficient, and not for a reason about
appearance. A breadcrumb trail is the thing people open in another tab. A
`<button>` cannot be middle-clicked, offers no "copy link address", ignores
ctrl-click and cmd-click, and does not appear in the list of links a screen
reader builds for a page.

Then a second problem appeared behind the first. The headless base has a
provider that hands link presses to a client-side router — and it is an export
of **our** dependency, not the consumer's. A consumer has no way to reach it.

## Decision

Two halves, one decision, because neither is any use alone.

**1. `Link` is a component.** It renders an anchor, `href` is required, and it
is the first use of the escape doc 02 §7 has always left open. `Button
variant="link"` stays, for actions.

**2. A navigate function arrives on `ConfigProvider`**, and the library
installs the base's router provider itself. Nothing from the base is
re-exported.

## Reasoning

The first half is argued in doc 02 §7.1, and the short version is that `Link`
navigates while `Button` acts — the test being whether there is an address.

The second half:

**Without it, every link in the library is a full page load.** In a single-page
management application that is the worst kind of wrong default, because it
looks like it works. The press does something, the right screen appears, and
the application has just been restarted.

**The consumer cannot fix it themselves.** They do not depend on
`react-aria-components`; we do. The provider they would need to wrap our
components in is not in their `package.json`.

**Where it goes is already decided.**
[Decision 0013](./0013-the-portal-container-arrives-with-the-configuration.md)
put the portal container on the configuration for the same reason: one provider
the consumer already wraps, rather than a second one from a library they did not
install and whose existence they have to be told about.

**P2 is not broken.** "No component knows a URL" is about fetching. An address
arriving by prop is data, and a navigate function is precisely P2's own
"effects arrive as functions passed in".

**P3 is not broken either.** The default works: with no navigate function a
link is an anchor, and anchors have navigated correctly for thirty years.

**And no router is added.** Non-goal 1 stands. The library does not route; it
hands the press to whatever the consumer already uses.

## Consequences

- `ConfigProvider` gains one optional prop and installs the base's provider
  inside itself. Its tests gain the case where the prop is absent — the
  default, and the one that has to keep working.
- ~~The link's appearance is **shared** with the button variant rather than
  copied, extracted the way the cross and the tone surfaces were, with the same
  property attached: no visual baseline may move.~~
  **Withdrawn on 2026-09-08 — there is nothing to share.** See the correction
  below.
- `href` is required. A link without an address is a button, and typing it as
  optional would invite the base's `role="link"` span — a link that goes
  nowhere, announced as one.
- A routed tab becomes possible later without a second decision, since the
  base's tab already accepts an address.
- Middle-click, ctrl-click and open-in-new-tab are the reason this exists, so
  they are checked in a browser. jsdom has no such thing as a new tab.
- The library now has two things that look like links. Doc 02 §7.1 carries the
  one-line rule for choosing, because "which one is this" is a question a
  consumer will have exactly once and should not have to ask twice.

## Correction · 2026-09-08

**The consequence about a shared appearance was wrong, and it is struck through
rather than deleted so that what was believed stays visible.** It was reasoned
from the fact that the two look similar, without laying the two class lists
side by side.

Measured, they overlap in exactly two places — `underline-offset-4` and the two
colour tokens — because they are deliberately opposite:

|                         | At rest                     | Pointed at           | Focused                      |
| ----------------------- | --------------------------- | -------------------- | ---------------------------- |
| `Button variant="link"` | ordinary text, no underline | accent, underlined   | accent, underlined (no ring) |
| `Link`                  | accent, underlined          | deeper, thicker rule | a ring                       |

And the reason is already written in `Button`'s own file: its link variant takes
the ordinary text colour "deliberately NOT the accent, so it does not compete
with a real link, which is what accent-coloured text means everywhere else". A
shared module would have to be parameterised into two opposite defaults, which
is a module whose whole content is an `if`.

So there is no extraction, and the property that came with it — no visual
baseline may move — was satisfied for free: nothing existing was touched.

What replaced it is a **check** rather than a shared file. A browser test
measures the two in the same story and asserts that their colours differ and
that only one of them is underlined at rest, so a change that made them agree
fails somewhere instead of quietly making the library ambiguous.

## Revisit when

The base changes how a router is supplied, or somebody needs two navigate
functions in one tree — which would be an argument about the provider, not
about `Link`.
