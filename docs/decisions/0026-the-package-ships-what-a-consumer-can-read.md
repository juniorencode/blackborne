# 0026 — The package ships what a consumer can read

**Status:** accepted · **Date:** 2026-09-11

## Context

[Decision 0025](./0025-the-package-ships-one-declaration-file.md)'s wave
measured the published tarball for the first time, because doc 10 §7 asks for
the number and nothing had been reading it. It was **398.8 kB**, and two thirds
of that was `dist/index.js.map` — 967 kB of source map, raw.

The obvious question was whether a library should ship a map at all. The answer
turned out to depend on a second setting nobody had looked at: `vite build`
minifies by default in library mode, so `dist/index.js` was mangled. Measured:

| What is published    | Tarball      | `index.js`   | An identifier reads |
| -------------------- | ------------ | ------------ | ------------------- |
| minified, with a map | 398.8 kB     | 149.3 kB     | `cs`, `lc`, `L`     |
| minified, no map     | **113.4 kB** | 155.7 kB     | `cs`, `lc`, `L`     |
| neither              | 165.4 kB     | **304.1 kB** | `useConfig`         |

All three measured, and the middle row is the one that makes this a decision
rather than an obvious cut: **it is the smallest package of the three**, by
52 kB, and it is the only one that cannot be debugged at all. So the map was
never the right way to buy names back — it cost 285 kB to undo something the
line above it had done for free.

## Decision

**`sourcemap: false` and `minify: false`.** The two are one decision.

A library is an input to somebody else's bundler, and that bundler minifies the
application. Minifying here buys the end user nothing — their minifier runs
either way — and costs them the only thing a stack trace carries, which is
names.

## What it costs

**52 kB of tarball, against the smallest option.** That is the real price of
this decision and it should be stated as the trade it is: not shipping a map
saves 285 kB either way, and the remaining 52 kB is what names cost.

The intermediate file also doubles: 304.1 kB reaches the consumer's bundler
instead of 155.7 kB, and 85.0 kB instead of 32.7 kB over the wire if they fetch
it compressed. What reaches their _user_ is whatever their own minifier
produces, which is the same either way — the install is a one-time cost and the
runtime cost is zero.

**It is a real cost to exactly one consumer: one who ships unminified.** That
is rare enough, and visible enough to whoever chose it, to be the right trade
against a 59% smaller download and readable names for everybody else.

## Evidence rather than taste

`react-aria` and `react-aria-components` — the two packages this library is
built on — publish this exact shape: unminified, with no source map. Measured
in `node_modules` rather than assumed.

## How it is held

`check:package` no longer allows a `.map` beside the file it belongs to. That
allowance was written a day earlier, when a map was being published, and
keeping it would let `sourcemap: true` come back silently. A `.map` appearing in
`dist` now fails the build naming the file, which is what a reversal of this
decision should have to argue with.

Verified: planting `dist/index.js.map` by hand fails with
`published by files:["dist"] and named by no export condition:
dist/index.js.map`.

The tarball ceiling in the package README came down from 450 kB to 220 kB in the
same change. It had been written the day before against a 398.8 kB measurement;
a ceiling with 285 kB of slack in it is not a ceiling (doc 10 §7).
