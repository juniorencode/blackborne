import { useEffect } from 'react';
import { isDev } from './isDev';

/*
 * INTERNAL. Tell a developer they have wired something impossible, once.
 *
 * In an effect and not in the render body, which is the part that matters. A
 * warning written where the component renders fires again on every render — so
 * a field warns once per keystroke, the console fills, and the message people
 * needed to read scrolls away. Measured while adding the first one: three
 * warnings from a single mounted component before anybody typed anything.
 *
 * Silent in production. `isDev` is the one environment check the library
 * makes and it stays fenced in its own file.
 */
export function useDevWarning(condition: boolean, message: string): void {
  useEffect(() => {
    if (!condition || !isDev()) return;
    console.warn(`blackborne: ${message}`);
  }, [condition, message]);
}
