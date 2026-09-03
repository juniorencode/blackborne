# 0006 · No container query polyfill

**Date:** 2026-09-02 · **Status:** accepted

## Context

The library's adaptive behavior is based on container width, not viewport width
(P4). That relies on container queries.

The reflex is to ship a polyfill so the library works everywhere. The question
is who pays for it.

## Context in numbers

Support in self-updating browsers has been settled for years. The consumers are
management applications with professional users, not public websites reached
from arbitrary old devices.

## Decision

**The library ships no container query polyfill.**

## Consequences

- A polyfill is JavaScript observing the DOM at runtime, with a cost and with
  known limitations on dynamic content. Including it would impose that cost on
  every project, including the ones that do not need it.
- **Missing support degrades gracefully**, and this is not luck — it is what
  two other rules buy us:
  - Container queries are written narrow-first and widened
    (doc 04, §4.1), so a query that does not apply leaves the component in its
    narrow layout, which is usable at any width.
  - Components are fluid by default (N0), so most of them need no query at all.

  What is lost is an optimal layout, not functionality.

- If a particular project needs to support an old browser, **that project loads
  the polyfill**. It is global, installed once in the application, and works
  the same from there. There is no reason for it to travel inside the package.

## Revisit when

A reference consumer acquires a hard requirement for a browser without support.
Even then, the first answer is the project-level polyfill, not the package.
