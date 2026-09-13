import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * HOW MANY STORIES THE SOURCE DECLARES, in one place because two things ask.
 *
 * `check-claims` asks because the documentation states the number as fact.
 * `check-catalog` asks because a BUILT catalog states its own, and the two
 * disagreeing is what a stale build looks like — which is the whole reason
 * this moved out of one script and into a module. A counter written twice is
 * two answers waiting to differ, and the thing it would be counting is whether
 * two answers differ.
 */

/**
 * The stories, counted the way Storybook counts them.
 *
 * Checked against the built index rather than assumed: `export const X: Story`
 * across every `.stories.tsx` gave 484, and so did `storybook-static`'s own
 * `index.json`. The parse is used where the answer is wanted without a catalog
 * build, which is the fast gate.
 */
export const countStories = (root = 'packages/blackborne/src') => {
  let total = 0;
  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.stories.tsx')) {
        total += (
          readFileSync(path, 'utf8').match(/^export const \w+\s*:\s*Story/gm) ??
          []
        ).length;
      }
    }
  };
  walk(root);
  return total;
};
