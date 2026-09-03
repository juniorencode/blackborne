# Security Policy

## Supported versions

| Version                       | Supported                                     |
| ----------------------------- | --------------------------------------------- |
| `0.2.x` (rewrite, unreleased) | Yes, once released                            |
| `0.1.x`                       | No — deprecated and superseded by the rewrite |

While the library is in the `0.x` series, only the latest minor version
receives fixes.

## Reporting a vulnerability

Please report privately, not in a public issue.

Use GitHub's private vulnerability reporting:
[Report a vulnerability](https://github.com/juniorencode/blackborne/security/advisories/new).

Include what you can: affected version, a description, and steps to reproduce.

You will get an acknowledgement. Be aware of the support expectation stated in
the README: this is open source published in good faith, with no commitment to
timelines. Security reports are prioritised over everything else, but they are
still handled on a best-effort basis.

## Scope

This is a client-side component library. It makes no network requests, reads no
credentials, and writes to no storage. The most likely classes of issue are
therefore rendering untrusted content unsafely, or a dependency vulnerability.

Reports about the deprecated `0.1.x` line will not be fixed; upgrade paths are
the answer there.
