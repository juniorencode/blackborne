# 0003 · CSS ships compiled and prefixed

**Date:** 2026-09-02 · **Status:** accepted

## Context

Tailwind is used to build the library. The question is whether that choice
should reach the consumer.

Requiring a consumer to install Tailwind, add the library to their `content`
globs, and load a plugin means the library imposes a build tool, a version, and
a configuration on every project that uses it. It also means a project that
does not use Tailwind cannot use the library at all.

There is a second problem, subtler: if the consumer compiles our classes with
their Tailwind, their configuration silently changes how our components look.

## Decision

**Tailwind is an internal implementation detail. CSS ships compiled, in a
single file, with the library's own prefix on every class and every variable.**

The consumer imports one stylesheet. They are never required to install or
configure Tailwind, and their Tailwind — if they have one — cannot collide with
ours or alter our output.

## Consequences

- **Customization goes through CSS variables, not classes.** This is what makes
  the three theme axes work, and it is why doc 03 insists tokens are variables:
  variables are the public contract, classes are not.
- The prefix is mandatory on everything. A single unprefixed class is a latent
  collision in someone else's application.
- **The CSS has a published weight budget** (doc 10, §7). A single file that
  nobody measures grows without limit.
- Consumers cannot use Tailwind utilities to override our internals, which is
  intended: that is non-goal 10, the ban on escape hatches, enforced by
  construction rather than by asking.

## Revisit when

Never, in the direction of requiring Tailwind from consumers. The internal tool
can change freely — that is the whole point of the decision.
