/*
 * INTERNAL.
 *
 * A component that forwards a ref to its outermost element (doc 02 §9) and
 * also needs that element itself has two claims on one ref. This settles them
 * without either party knowing about the other.
 *
 * Written here rather than imported from `@react-aria/utils`, which has one:
 * that package is a transitive dependency of the base and not a direct one,
 * and reaching into it would be a phantom dependency — pnpm's strict layout
 * refuses it, and rightly, because the version we would be depending on is
 * one nothing declares.
 */
export type AnyRef<T> = React.Ref<T> | undefined;

export function mergeRefs<T>(...refs: AnyRef<T>[]): React.RefCallback<T> {
  return value => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref !== null && ref !== undefined) {
        (ref as React.RefObject<T | null>).current = value;
      }
    }
  };
}
