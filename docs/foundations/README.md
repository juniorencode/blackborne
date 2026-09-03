# Foundations

Permanent rules. These are written _before_ the code they govern, and changed
_before_ writing code that contradicts them — never afterwards to justify it.

Read in order. 01 is the one the others hang off.

| #   | Document                                                     | What it settles                                                                                             |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 01  | [Principles and non-goals](./01-principles.md)               | What the library is, the six principles, the twelve non-goals, and the entry gate every component must pass |
| 02  | API conventions                                              | _Pending — written after the React Aria spike, which is what decides its content_                           |
| 03  | [Tokens and theme](./03-tokens-and-theme.md)                 | The visual vocabulary: three token layers, three theme axes, and how they are restricted                    |
| 04  | [Responsive and adaptability](./04-responsive.md)            | How a component behaves when space changes. The container decides, not the window                           |
| 05  | [Languages and formatting](./05-languages-and-formatting.md) | The five fronts of multi-language, and why the time zone is never the browser's                             |
| 06  | [Accessibility](./06-accessibility.md)                       | WCAG 2.2 AA as an entry condition, and who is responsible for what                                          |
| 07  | [Forms](./07-forms.md)                                       | Where the library ends and the project begins: restrict input, present the error                            |
| 08  | Layers and focus                                             | _Pending — written after the React Aria spike_                                                              |
| 09  | [Behavior and interaction](./09-behavior.md)                 | How it feels. Built for people who use it eight hours a day                                                 |
| 10  | [Quality and verification](./10-quality-and-verification.md) | What turns every rule above into an automated check                                                         |

## The two that are missing on purpose

Documents 02 and 08 are not late — they are sequenced. Both describe things
that can only be decided by building: how props are named and how variants are
expressed (02), and how portals, focus, cascading dismissal and scroll locking
compose (08).

Writing them from imagination would produce rules the first real component
contradicts. They are written after a day spent with the headless base building
a dialog with a dropdown inside and a field with a label, description and
error — which is also the day that validates the two bottlenecks of the build
order.

Until then: **do not invent a rule these documents will define.** Ask.

## Related, but deliberately not a foundation

[Catalog and build order](../catalog-and-build-order.md) — which components
exist, in what order, and what has been ruled out. It is a living list that
changes weekly; mixing it in here would make these documents look less stable
than they are.
