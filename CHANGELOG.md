# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Changed

- The library is being rewritten from scratch. Nothing from `0.1.1` is carried
  over: no component, prop name, DOM structure or test id. The rewrite will
  ship as `0.2.0`.
- Repository restructured as a pnpm workspace: the package lives in
  `packages/blackborne`, the visual catalog in `apps/catalog`.

### Removed

- The entire `0.1.1` codebase. It stays available under the `v0.1.1` git tag.
- `react-router-dom` as a peer dependency. The library provides no routing
  (non-goal 1).
- `react-icons` as a dependency. Icons are received, never distributed.

## [0.1.1] - 2025-02-20

Last release of the original library. Deprecated on npm; superseded by the
rewrite.

[Unreleased]: https://github.com/juniorencode/blackborne/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/juniorencode/blackborne/releases/tag/v0.1.1
