/*
 * The public surface of the library.
 *
 * Deliberately narrow: what is not exported does not exist, and opening an
 * export later is easy while closing one is not (doc 02 §10).
 *
 * Before adding anything here, read docs/contributing/new-component.md. A
 * component becomes public only once it passes the twelve-checkbox entry gate
 * in docs/foundations/01-principles.md.
 */
export { Button } from './components/Button';
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant
} from './components/Button';
