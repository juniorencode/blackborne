# 0013 · The portal container arrives with the configuration

**Date:** 2026-09-07 · **Status:** accepted

## Context

Everything that floats renders in a portal, and
[doc 08](../foundations/08-layers-and-focus.md) §8 has said since it was
adopted that the mount container is the consumer's business and that
`document.body` is never assumed. An application with its own stacking context
needs it, and P3 forbids the library from reaching for the document on its own.

None of it could be acted on without answering a question the base's own API
had moved on from. In `react-aria-components` 1.21.0:

- The per-component prop that would do it — `UNSTABLE_portalContainer` on
  `Modal`, `Popover` and `Tooltip` — is **deprecated**, and its deprecation
  notice points at a provider instead.
- That provider, `UNSAFE_PortalProvider`, is **not re-exported** by
  `react-aria-components`. It lives in `react-aria`, which is a transitive
  dependency of the package we depend on, not a direct one.
- `ToastRegion` has **no container prop at all**. Read in its implementation:
  it calls the portal context and nothing else.

So the rule was written and there was no route to it that did not cost
something.

## Decision

**`react-aria` becomes a direct dependency, pinned exactly, and the portal
container is a prop of `ConfigProvider`.**

With nothing supplied, the base's own default — `document.body` — stands, so no
component gains a provider requirement and the entry gate's "works with no
provider around it" still holds.

Doc 08 §8's wording changes with it, from "a component accepts where to mount"
to "the container is received, not assumed", because the container turns out to
belong beside the locale, the dictionary and the time zone rather than beside a
component's own props.

## Reasoning

**A prop per component cannot do the job, and that is measured rather than
argued.** `ToastRegion` reads only the provider context, so a per-component
route cannot reach the toast region even in principle — a consumer who mounted
five layers correctly would still have their notifications escape to the
document. And the per-component prop the base does expose is the one it is
removing.

**The prefix is not the one that deferred the toasts.** In this base's
vocabulary `UNSTABLE_` marks an API subject to change and `UNSAFE_` marks one
that is supported but easy to hurt yourself with — the prefix
`UNSAFE_className` has carried for years in React Spectrum as stable API. The
deprecation notice on the old prop points at this provider, so it is the route
the base recommends, not a back door. The argument that deferred `Toast`
(doc 08 §7.1) does not transfer.

**The dependency costs nothing to install.** `react-aria` is already in the
tree: `react-aria-components` 1.21.0 depends on `react-aria` at **exactly**
`3.52.0`, with no range. So our direct declaration is the same exact pin, and
the two can only ever move together — in the same pull request, since neither
carries a caret.

**It belongs with the configuration because it is the same kind of thing.**
`ConfigProvider` already exists to receive what the library refuses to detect:
the language, the dictionary, the time zone, the currency, the resolved colour
mode. Where to mount a portal is one more fact about the host application that
only the host application knows. Putting it there also means it is set once,
where a prop on six components means five correct calls and one that escapes.

**The alternative was to ship the layer batch against a written rule.** Doc 08
§8 is adopted, and this repository's own rule is that foundations change before
the code, never afterwards to justify it. Shipping without a container would
have meant either violating an adopted rule or editing it to say "not yet". At
the price of one exact pin and a few lines in a provider that already exists,
neither was worth paying.

## Consequences

1. **`react-aria` appears in the published package's dependencies.** It was
   already installed for every consumer as a transitive dependency, so no
   install grows; what changes is that we now have to keep our pin in step with
   the base's. A bump of `react-aria-components` that moves its `react-aria`
   pin must move ours in the same commit, or two copies end up in the tree and
   the portal context is not shared between them — which would fail as a layer
   mounting in the wrong place, with no error.
2. **The base's context takes a function, not an element.** It asks for
   `getContainer(): HTMLElement | null`. A new closure on every render changes
   the context value and remounts every portal under it, so the value is
   memoised against the element — a detail with no visible symptom other than
   layers flickering.
3. **After this, `pnpm verify:clean` is required, not optional.** A local
   `pnpm install` reuses what is already in `node_modules`, so a dependency
   left in a pending state passes locally and fails only on a clean install.
   That has already broken CI on a branch that was green everywhere.

## When to revisit

When `react-aria-components` re-exports the provider itself, at which point the
direct dependency can go and consequence 1 with it. Also worth revisiting if
the `UNSAFE_` prefix is ever dropped or renamed, since that is the moment the
base has decided something about this API.
