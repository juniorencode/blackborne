/*
 * The base's validation hooks, named once so ten fields can refuse them.
 *
 * ## Why they are refused
 *
 * [Decision 0005](../../../../docs/decisions/0005-validation-stays-in-the-project.md)
 * settled this library's answer to "is this value valid": the PROJECT decides
 * and passes `isInvalid` with a message it wrote. The library restricts input
 * and presents errors, and it deliberately takes no schema dependency
 * (doc 07 §1).
 *
 * `validate` is the other answer to the same question, and nobody chose it: it
 * arrives with the base's props and every field here extends those with an
 * `Omit`, so it was reachable, typed and documented nowhere. Measured before
 * removing it — **ten fields** published it, and nothing in this repository
 * used it.
 *
 * `ComboBox` refused it first and for a different reason: its
 * `Validation<…<M>>` argument carries the selection mode, so forwarding it
 * pinned that component's generic and the plural branch would not compile. The
 * other nine forwarded it in silence, because nothing about them refused to
 * build — which is why the count took a measurement rather than a compiler.
 * `Radio` and `Switch` never had it: the base puts validation on the group,
 * and a switch has none.
 *
 * `validationBehavior` travels with it and is the more expensive half. It
 * chooses between the base reporting a message to us and the BROWSER doing it
 * natively, which is a second way for an error to reach a person: our text
 * under the field, or the browser's own bubble beside it, in the browser's
 * wording and the browser's language. Doc 05 says every user-facing string
 * comes from the dictionary; a native validation bubble comes from Chrome.
 *
 * So supporting `validate` honestly would mean documenting and testing both
 * presentations, which is a whole story rather than a prop. One question, one
 * mechanism (doc 01 §7).
 *
 * ## What a consumer does instead
 *
 * Call the validation yourself and pass the result down, which is what a form
 * library's field does anyway:
 *
 * ```tsx
 * const problem = validateEmail(value);
 *
 * <TextField
 *   label="Email"
 *   value={value}
 *   onChange={setValue}
 *   isInvalid={problem !== null}
 *   {...(problem === null ? {} : { errorMessage: problem })}
 * />
 * ```
 *
 * ## The refusal is in the TYPE, which is what the public API is
 *
 * Every field here destructures the props it uses and spreads the rest onto
 * the base, so a consumer who casts past the type still reaches `validate` at
 * run time. That is deliberate rather than an oversight: stripping the pair
 * would mean destructuring two names the type no longer has, in ten
 * components, to prevent something that was never documented. The precedent is
 * `Progress` refusing an indeterminate mode the same way — the surface is a
 * type, so the refusal and the test for it are both types.
 *
 * ## And the shape underneath is the actual cause
 *
 * `Omit` is a blacklist: it publishes everything the base has except what is
 * named, so a base upgrade adds props to this library's public API with nobody
 * deciding — which is hard rule 8 read backwards. Every component built from
 * `Calendar` onward uses `Pick` instead, which is a whitelist, and none of
 * them ever had this problem. Converting the ten is a bigger change than
 * this one and has its own row in the catalog's §7.
 */
export type ValidationProps = 'validate' | 'validationBehavior';
