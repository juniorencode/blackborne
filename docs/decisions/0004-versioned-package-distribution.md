# 0004 · Distribution as a versioned package

**Date:** 2026-09-02 · **Status:** accepted

## Context

There are two live models for distributing components. One publishes a
versioned package that consumers install. The other hands consumers the source
of each component to copy into their own repository, where they own and modify
it.

The copy model is genuinely good at one thing: it removes every argument about
customization, because the consumer can change anything. That is also its cost.

## Decision

**A versioned package, installed from a public registry. No copy-paste
templates.**

## Consequences

- **Every customization has to pass through the API.** There is no "just edit
  the file" escape, which means every real need surfaces as a request instead
  of being solved invisibly in one project.
- That makes P6 and non-goal 4 the containment: without them, the pressure to
  accept "just one more prop" has nowhere to go and the components bloat. The
  suite model — hooks, pieces, thin assembly — is what absorbs that pressure
  correctly.
- A fix reaches every consumer with a version bump, rather than needing to be
  applied by hand in each repository. This is the main reason for the choice.
- Breaking changes are a real event with a real cost, which is why the
  stability policy and the deprecation policy (doc 10, §9) exist before they
  are needed.
- A consumer maintaining a fork, or patching our CSS from outside, is a
  **signal that this decision is failing** — it is listed in doc 01, §7 for
  that reason.

## Revisit when

Two consumers independently end up forking. That would mean the API is not
absorbing real needs, and the fix is the API, not the distribution model.
