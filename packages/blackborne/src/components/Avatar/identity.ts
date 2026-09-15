/*
 * Which of the identity colours a name gets, as a pure function.
 *
 * Doc 01's hard rule 7: logic lives in a function that can be tested without
 * rendering anything. This one has a property worth testing rather than a
 * behaviour worth watching — the same name gives the same answer, always and
 * everywhere — which is exactly the shape a unit test is good at and a
 * screenshot is useless for.
 */

/** How many colours identity is spread across. See `--bb-identity-N`. */
export const IDENTITY_COLOURS = 6;

/**
 * A stable index for a name, in `0 .. IDENTITY_COLOURS - 1`.
 *
 * ## Why a hash rather than a counter
 *
 * A counter would give the first avatar on a page colour 1 and the second
 * colour 2, which means the same person changes colour when the list is
 * sorted, filtered or paged. The whole value of the colour is that it is the
 * same one tomorrow, so it has to come from the name and from nothing else —
 * no state, no order, no hook.
 *
 * ## The hash
 *
 * djb2, which is five lines and has no dependency. It is not a cryptographic
 * hash and does not need to be: the requirement is that two different names
 * usually land on different colours, not that a name cannot be recovered from
 * one of six values — which it obviously can.
 *
 * `>>> 0` after each step keeps it inside 32 bits. JavaScript's `<<` and `+`
 * operate on 32-bit integers but the running value is a double, so without
 * this it drifts past 2^53 and the low bits — the only ones that matter here —
 * stop being exact.
 *
 * ## What it normalises, and what it deliberately does not
 *
 * The name is trimmed and cased down, so "carlos ramos" and "Carlos Ramos" are
 * one person. It is NOT stripped of accents: doc 05 is clear that José and
 * Jose are different strings and the library does not decide they are the same
 * person. A project that wants them unified passes one name.
 */
export function identityIndex(name: string): number {
  const key = name.trim().toLowerCase();

  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (((hash << 5) + hash + key.charCodeAt(i)) >>> 0) as number;
  }

  return hash % IDENTITY_COLOURS;
}
