import './checkerboard.css';

/**
 * INTERNAL. The class that puts a checkerboard behind a colour which might be
 * transparent.
 *
 * Applied to a WRAPPER, never to the element holding the colour — the base
 * writes that colour inline, and a background image on the same element paints
 * over the colour rather than behind it. `checkerboard.css` has the
 * measurement and the construction.
 */
export const CHECKERBOARD = 'bb-checkerboard';
