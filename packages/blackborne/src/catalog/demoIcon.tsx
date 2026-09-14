/*
 * A glyph for the stories that show a field's `icon` slot, and nothing else.
 *
 * It lives here rather than in each story file because six components gained
 * that prop at once and six copies of one drawing is how the cross reached
 * four different geometries before anybody noticed.
 *
 * **The library ships no icons.** This is catalog furniture, in the same
 * directory as `Force` and `LayerPage`, and it is deliberately something a
 * consumer would never want: a pin. An icon set is a consumer's decision
 * (hard rule 9), and a demo that looked usable would be a set of one.
 *
 * It carries only a `viewBox` ON PURPOSE. An svg with no intrinsic size is
 * exactly what rendered at 0 by 0 before the affix slot was taught to size
 * what arrives in it, so the story is the check for that too.
 */
export const DemoIcon = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="8" cy="6.2" r="2.2" />
    <path d="M8 13.8C8 13.8 3.4 9.6 3.4 6.2a4.6 4.6 0 1 1 9.2 0c0 3.4-4.6 7.6-4.6 7.6Z" />
  </svg>
);
