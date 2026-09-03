# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Added

- `Button`, the first component of the rewrite. Five variants, three sizes,
  and every state styled from React Aria's DOM state attributes.
- The token layer: layer-1 primitives baked from Radix Colors (a development
  dependency that never ships), layer-2 semantic tokens, and the three theme
  axes — mode, brand colour and density — each set by an attribute on a
  container.
- `blackborne/styles.css`: one compiled stylesheet, every class and variable
  carrying the `bb` prefix. **No global reset**, so it cannot overwrite a
  consumer's own styles, and no font is imposed.
- Public stacking tokens `--bb-layer-overlay`, `--bb-layer-popover` and
  `--bb-layer-toast`, with wide gaps so a consumer can place their own layers
  between them.

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
