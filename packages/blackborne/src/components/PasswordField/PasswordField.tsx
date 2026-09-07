import { forwardRef, useState } from 'react';
import {
  Input,
  TextField as AriaTextField,
  ToggleButton,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import {
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ControlFrame,
  EDGE_BUTTON,
  Field
} from '../../internal/Field';
import { useMessage } from '../../config';
import { cx } from '../../internal/cx';

/*
 * WHAT THIS FIELD DELIBERATELY DOES NOT DO.
 *
 * Both of these are recorded as permanent "never" in the catalog, and both
 * look like features somebody forgot. Written here so the next person finds
 * the argument before writing the code.
 *
 * **It does not score the password.** Scoring is a policy — minimum length,
 * character classes, banned lists — and that is non-goal 5 and decision 0005.
 * A strength meter would be this component deciding a value is bad, which is
 * exactly the line doc 07 §1 draws: the library presents the judgement and
 * never makes it. So a project that wants a meter passes `description` or
 * `errorMessage` with its own verdict, the same way every other field takes an
 * error.
 *
 * **It does not block paste, copy or cut.** Measured against the standard
 * rather than intuition: NIST SP 800-63B says a verifier SHOULD permit paste,
 * because blocking it breaks password managers and people fall back to a short
 * secret they can retype — so blocking paste makes security worse, not better.
 * It also protects nothing, since the value is in the DOM either way. If you
 * find yourself reaching for `onPaste`, that row in the catalog is the answer.
 */

export type PasswordFieldSize = 'sm' | 'md' | 'lg';

/*
 * Heights come from the same tokens as Button and TextField, which is what
 * makes a field and a button of the same size line up in a row — doc 03 §9's
 * alignment check, and one of the details that most gives away a system that
 * is not one.
 */
interface SizeClasses {
  /** The height, on the frame — it is the frame that draws the box. */
  frame: string;
  /** The type size, on the CONTROL: an input inherits no font. */
  text: string;
}

const SIZE: Record<PasswordFieldSize, SizeClasses> = {
  sm: { frame: 'bb:h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-control-lg', text: 'bb:text-lg' }
} satisfies Record<PasswordFieldSize, SizeClasses>;

/*
 * The frame draws the box; what is left on the control is the value's own
 * typography and the fact that it fills the row. Identical to TextField's,
 * because the two are meant to be indistinguishable until one is asked to do
 * something the other cannot.
 */
const INPUT = cx(CONTROL_INSIDE, CONTROL_TEXT);

/*
 * ClearButton's list, class for class, and that is the point rather than an
 * accident: doc 06 §3 wants the minimum hit area at EVERY density, and both
 * axes taking `--bb-control-hit-area` is how the cross already solves it —
 * 28px normal, 24px compact, with the mark going 14px to 11px underneath. An
 * eye drawn at 14px is a 14px target unless something says otherwise, which is
 * the part of a control like this that is usually wrong.
 *
 * Repeated rather than shared because `src/internal/Field` exports no style
 * for an edge control, only the components that use one. This is now the third
 * caller of the same idea — the cross, the numeric stepper and this — so it
 * has earned a home there; that file is not this component's to change.
 *
 * The one addition to the list is `data-selected`: the revealed state is
 * styled from the attribute the base publishes, never from a class computed in
 * render (doc 02 §4). It is the second channel beside the glyph, and the glyph
 * is the one that survives greyscale (doc 06 §3).
 */
const TOGGLE = cx(
  EDGE_BUTTON,
  /*
   * The only thing this adds to a clear cross: the glyph brightens while the
   * value is revealed, so the button says which state it is IN as well as what
   * pressing it will do. Doc 06 §3 — a toggle whose only signal is its label
   * has one channel.
   */
  'bb:data-selected:text-text'
);

/*
 * Drawn, not received: doc 02 §11.4 separates the icons the library draws for
 * its own controls — a select's chevron, a pagination arrow — from the ones it
 * receives, and this is the same case as Checkbox's tick and ClearButton's
 * cross. Deliberately primitive: one lens, one dot, one stroke.
 *
 * The GLYPH NAMES THE ACTION, not the state, so it agrees with the accessible
 * name beside it: masked shows an eye and offers to show, revealed shows a
 * struck eye and offers to hide. The two silhouettes differ before their
 * interiors do — the struck one drops the pupil as well as gaining the stroke
 * — which is what keeps them apart at the 11px compact mark, in greyscale.
 */
const EYE = (
  <>
    <path d="M1.6 8Q8 2 14.4 8Q8 14 1.6 8Z" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="2" />
  </>
);

const EYE_STRUCK = (
  <>
    <path d="M1.6 8Q8 2 14.4 8Q8 14 1.6 8Z" strokeLinejoin="round" />
    <path d="M2.8 13.2 13.2 2.8" />
  </>
);

interface RevealToggleProps {
  isRevealed: boolean;
  isDisabled: boolean;
  onChange: (isRevealed: boolean) => void;
}

function RevealToggle({
  isRevealed,
  isDisabled,
  onChange
}: RevealToggleProps): React.ReactNode {
  const showLabel = useMessage('showPassword');
  const hideLabel = useMessage('hidePassword');

  return (
    /*
     * `ToggleButton` and not `Button`: this is a control with an on and an off,
     * and `aria-pressed` is what says so. The base already owns that pattern —
     * it sets the attribute from `isSelected` and publishes `data-selected`
     * beside it — and reimplementing a role or an ARIA attribute by hand is
     * non-goal 6 (doc 06 §2, first column).
     */
    <ToggleButton
      className={TOGGLE}
      isSelected={isRevealed}
      onChange={onChange}
      isDisabled={isDisabled}
      /*
       * THE NAME CHANGES WITH THE STATE, and it names what pressing will do.
       * A button called "Toggle visibility" says what it is and never what it
       * will do, which is the whole reason the dictionary carries two keys
       * instead of one (doc 05 §2.1, and the catalog row for this component).
       *
       * This is a deliberate divergence from the ARIA practice that a toggle's
       * label should stay fixed while `aria-pressed` carries the change. Taken
       * knowingly, and the cost is verbosity rather than ambiguity: a reader
       * announces "Hide password, toggle button, pressed", which says the same
       * thing twice and is wrong in neither half. The alternative is a fixed
       * name that leaves a sighted-and-a-reader user reading the glyph to find
       * out what the button offers.
       *
       * An `aria-label` rather than visually hidden text, and unlike the
       * numeric steppers that is safe here: those get `aria-labelledby` from
       * the base pointing at the field's label, and labelledby beats label, so
       * a name given there is dropped. Nothing points a labelledby at this
       * button, so doc 02 §11.3 applies plainly — the name of an icon-only
       * control goes on the control.
       */
      aria-label={isRevealed ? hideLabel : showLabel}
    >
      <svg
        viewBox="0 0 16 16"
        className="bb:h-mark bb:w-mark"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        // Decorative: the button's own name says what it does (doc 06 §3).
        aria-hidden="true"
      >
        {isRevealed ? EYE_STRUCK : EYE}
      </svg>
    </ToggleButton>
  );
}

/*
 * The `Omit` is the whole prop list, and what it lets through is worth
 * knowing: everything the base accepts, which is everything an `<input>`
 * accepts. `name`, `maxLength`, `minLength`, `pattern`, `autoComplete` and the
 * rest are already props of this component and already forwarded by the
 * spread — there is nothing to add for them, and a named prop would break the
 * spread for no gain (doc 02 §2).
 *
 * `type` is the one taken away rather than forwarded. The mask is what this
 * component IS, and a password field switched to `text` is a TextField and
 * should be one — the same line SearchField draws around its own role.
 *
 * TextField's other props are absent on purpose, and each absence is a rule
 * rather than an omission:
 *
 * - `isClearable` and `prefix`/`suffix` — doc 07 §2.2 rules 3 and 4. The
 *   trailing edge belongs to the reveal toggle, at most one library-owned
 *   control sits there at a time, and an affix may not share an edge with a
 *   target because sharing one halves it.
 * - `normalize` — rewriting a value somebody cannot see, while they type it,
 *   is a change with no channel to report it. A password is not upper-cased or
 *   stripped of spaces by anybody's field.
 * - `align` and `isCounterVisible` — no real place needs either today, and a
 *   prop is earned by that place and not by symmetry (doc 01 §5, P5).
 */
export interface PasswordFieldProps extends Omit<
  AriaTextFieldProps,
  'children' | 'className' | 'style' | 'type'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** Waiting for data the field needs. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a Button or TextField of the same size. */
  size?: PasswordFieldSize;
  placeholder?: string;
  className?: string;
}

/**
 * A masked text field with a control that reveals its value.
 *
 * The unit of composition is the whole set — label, control, description,
 * error, related to each other — exactly as in TextField, because that
 * relationship is what makes an error perceivable to someone who cannot see it
 * (doc 07 §4).
 *
 * **The reveal toggle never yields** (doc 07 §2.2 rule 2). Everything else
 * that wants the trailing edge of a field gives way to the busy indicator; the
 * toggle does not, because taking it away removes a capability rather than an
 * affordance — the value becomes unreadable rather than merely harder to
 * reach. It works while the field is read-only for the same reason: a
 * read-only password is still a value somebody may need to check, and
 * revealing it changes nothing about it.
 *
 * **`autoComplete` is yours, and this is the one field where its value carries
 * real meaning.** The library leaves the attribute at the browser's default
 * and always will: turning autocomplete off breaks password managers and
 * address autofill, it is a developer preference paid for by whoever uses the
 * screen, and P3 says the library does not make that call for the project.
 * But `current-password` and `new-password` behave differently in every
 * password manager there is — the first offers the stored secret, the second
 * offers to generate and store one — and nothing here can know which screen it
 * landed on:
 *
 * ```tsx
 * <PasswordField label="Password" autoComplete="current-password" />
 * <PasswordField label="New password" autoComplete="new-password" />
 * ```
 *
 * So pass it. There is deliberately no default and no development warning:
 * guessing wrong would have a filter form asking for a stored credential, and
 * warning on every field that omits it would fire on the fields that are right
 * to omit it.
 *
 * **It does not judge the password.** No strength meter, no rules, no score —
 * that is a policy and it belongs to your project (non-goal 5). Pass
 * `isInvalid` and `errorMessage` from whatever decides, like any other field.
 * The reasoning, and the reasoning against blocking paste, is at the top of
 * this file.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    {
      label,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
      placeholder,
      className,
      ...ariaProps
    },
    ref
  ) {
    /*
     * Internal, and it starts masked.
     *
     * No `isRevealed` prop and no `onRevealChange`: nothing outside needs to
     * drive this, and doc 02 §10 keeps the surface at the minimum because
     * opening an export later is easy and closing one is not. There is no hook
     * either, which is worth saying since P6 asks for one — a hook is where
     * LOGIC goes, and there is none here: one boolean, toggled by the base,
     * read by one attribute. `usePasswordReveal` would be an export that could
     * not be used for anything.
     *
     * Nothing re-masks on its own — not on blur, not on submit. Whether a
     * revealed secret should hide itself again after a while is a policy, and
     * policies are the project's.
     */
    const [isRevealed, setIsRevealed] = useState(false);

    const busy = isLoading || isSaving;

    return (
      <AriaTextField
        /*
         * `aria` rather than the base's default `native`: native validation
         * pops the browser's own bubble, which the library cannot style, cannot
         * translate and cannot time. Presenting the error is our job, and the
         * project owns when it happens.
         */
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        /*
         * After the spread, so the mask is the component's to decide and not
         * something a consumer can talk it out of — `type` is already gone
         * from the props above, and this is the other half of the same
         * guarantee.
         *
         * It goes on the base's own prop rather than on the input: verified in
         * the installed source, `useTextField` carries `type` into the context
         * the `Input` below reads, so the base knows what kind of control it
         * is describing instead of finding out from the DOM.
         */
        type={isRevealed ? 'text' : 'password'}
      >
        <Field
          label={label}
          {...(description === undefined ? {} : { description })}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isRequired={ariaProps.isRequired ?? false}
          isLabelHidden={isLabelHidden}
          isLoading={isLoading}
          isSaving={isSaving}
        >
          <ControlFrame
            trailing={
              <RevealToggle
                isRevealed={isRevealed}
                onChange={setIsRevealed}
                /*
                 * Disabled with the field, which is the one state the toggle
                 * DOES follow — and beside "it works while read-only" that
                 * reads like an inconsistency. It is the distinction doc 07 §6
                 * insists on, expressed in the one control this field owns:
                 * read-only says "this value applies, read it, select it, copy
                 * it", so revealing it is that state's own affordance;
                 * disabled says "this does not apply right now", and a live
                 * control inside a box that does not apply is a target that
                 * tabbing through a form has no reason to stop on.
                 *
                 * No document settles this one. Doc 07 §2.2 rule 2 is about
                 * the busy edge and the catalog names read-only; disabled is
                 * neither, so this is a rule read off §6 rather than quoted
                 * from it.
                 *
                 * Disabled, not hidden: it keeps its width and its place, so
                 * nothing moves when a field is enabled (doc 07 §2.2 rule 1),
                 * and the reason it cannot be pressed is visible in the field
                 * around it (doc 06 §4, point 7).
                 */
                isDisabled={ariaProps.isDisabled ?? false}
              />
            }
            /*
             * `isTrailingHidden` is deliberately never passed. It is the
             * mechanism doc 07 §2.2 rule 1 gives the cross and the stepper —
             * unreachable while busy, and still the same width — and rule 2
             * exempts this one control from it.
             *
             * Which leaves the collision the rule creates: Field draws the
             * busy indicator over the trailing edge, 12px in, and the toggle
             * is 28px wide at that same edge, so the spinner would land on the
             * glyph. So the field CLEARS the indicator's lane while busy, the
             * same 36px TextField and NumberField clear when nothing else
             * holds that edge, and the toggle moves inside it.
             *
             * The toggle shifting inward for the duration is the one movement
             * rule 2 makes unavoidable, and it is the cheaper half of the
             * trade: the value does not move — it is start-aligned and the
             * control only narrows — and the alternative was an indicator
             * painted on top of the one control that is meant to stay usable.
             */
            className={cx(SIZE[size].frame, busy && 'bb:pe-9')}
          >
            <Input
              ref={ref}
              className={cx(INPUT, SIZE[size].text)}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </ControlFrame>
        </Field>
      </AriaTextField>
    );
  }
);
