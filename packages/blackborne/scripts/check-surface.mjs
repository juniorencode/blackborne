/*
 * THE PUBLIC SURFACE, AS A REVIEWED DIFF.
 *
 * `validate` and `validationBehavior` reached ten fields and were
 * documented nowhere. They did not arrive in a diff: each field extends the
 * base's props with an `Omit`, which is a blacklist, so the base already
 * had them and the day the field was written its declaration read the same
 * either way. Measured on the built package: 2,131 of this library's 2,700
 * public prop lines are inherited, against 569 it declares itself.
 *
 * So this reads the surface STRUCTURALLY rather than textually. A snapshot
 * of the declaration text — api-extractor's report, or a normalised
 * `dist/index.d.ts` — cannot see it: the `Omit` is never expanded and the
 * base is imported rather than inlined, so a base upgrade that adds a prop
 * to four of our public types changes not one character of our own file.
 * Measured, by patching the base in memory: that upgrade is a four-line
 * diff here and a zero-line diff there.
 *
 * What is in the artefact and why:
 *
 *   - every exported name, sorted, values with their signature
 *   - every property of every exported type, INCLUDING inherited ones,
 *     with `?` and with `(own)` or `(base)` — so `- validate? (base)`
 *     reads as "the base grew and nobody decided"
 *   - a literal union as its sorted members
 *
 * What is deliberately NOT in it: the type of each property. It doubles the
 * artefact to 223 kB — as large as the declaration file — and the
 * interesting half is the names. `tone?: AlertTone` widening to
 * `tone?: string` is therefore invisible here and caught by review.
 *
 * The compiler options are written out rather than read from a tsconfig, so
 * the artefact cannot drift when a tsconfig is edited. There is no absolute
 * path in the output: `UseFullyQualifiedType` puts one in every line —
 * measured, and it would have made a committed file differ per machine,
 * which is doc 10 §11 in a new costume.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';

const HERE = resolve(import.meta.dirname, '..');
const SURFACE = join(HERE, 'api-surface.txt');
const TYPES = join(HERE, 'dist/index.d.ts');
const UPDATE = process.argv.includes('--update');

if (!existsSync(TYPES)) {
  process.stderr.write(
    `\n${TYPES} is missing. Run \`pnpm --filter blackborne build\` first.\n`
  );
  process.exit(1);
}

const options = {
  noEmit: true,
  skipLibCheck: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX
};
const program = ts.createProgram([TYPES], options);
const checker = program.getTypeChecker();
const file = program.getSourceFile(TYPES);
const entry = checker.getSymbolAtLocation(file);
if (!entry) {
  process.stderr.write(`\n${TYPES} is not a module.\n`);
  process.exit(1);
}

const FORMAT = ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.NoTruncation;
const show = type =>
  checker.typeToString(type, undefined, FORMAT).replace(/\s+/gu, ' ');
const target = symbol =>
  symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
const LITERAL =
  ts.TypeFlags.StringLiteral |
  ts.TypeFlags.NumberLiteral |
  ts.TypeFlags.BooleanLiteral |
  ts.TypeFlags.Undefined |
  ts.TypeFlags.Null |
  ts.TypeFlags.Never;
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const origin = property =>
  (property.declarations ?? []).some(d => d.getSourceFile() === file)
    ? 'own'
    : 'base';

const members = type => {
  const properties = checker.getPropertiesOfType(type);
  if (!properties.length) return null;
  return properties
    .map(
      p =>
        `  ${p.getName()}${p.flags & ts.SymbolFlags.Optional ? '?' : ''} (${origin(p)})`
    )
    .sort(byText);
};

/* A union's constituents are emitted as blocks sorted BY CONTENT, so
   reordering them in the source is not a diff. */
const blocks = (name, type) => {
  if (type.isUnion() && type.types.every(t => (t.flags & LITERAL) !== 0)) {
    return [`type ${name} = ${type.types.map(show).sort(byText).join(' | ')}`];
  }
  if (type.isUnion()) {
    const parts = type.types
      .map(t => (members(t) ?? [`  = ${show(t)}`]).join('\n'))
      .sort(byText);
    return parts.map(
      (body, i) => `type ${name} (${i + 1} of ${parts.length})\n${body}`
    );
  }
  const ms = members(type);
  return [
    ms ? `type ${name}\n${ms.join('\n')}` : `type ${name} = ${show(type)}`
  ];
};

const out = [];
const exported = [...checker.getExportsOfModule(entry)].sort((a, b) =>
  byText(a.getName(), b.getName())
);
for (const symbol of exported) {
  const name = symbol.getName();
  const it = target(symbol);
  if (it.flags & ts.SymbolFlags.Value) {
    const type = checker.getTypeOfSymbolAtLocation(
      it,
      it.valueDeclaration ?? file
    );
    out.push(`value ${name}: ${show(type)}`);
  }
  if (
    it.flags &
    (ts.SymbolFlags.Type | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)
  ) {
    out.push(...blocks(name, checker.getDeclaredTypeOfSymbol(it)));
  }
}
const built = `${out.join('\n')}\n`;

if (UPDATE) {
  writeFileSync(SURFACE, built);
  process.stdout.write(
    `  wrote ${SURFACE}: ${exported.length} exported names, ${out.length} blocks\n`
  );
  process.exit(0);
}

if (!existsSync(SURFACE)) {
  process.stderr.write(
    `\nThere is no committed public surface at ${SURFACE}.\n` +
      'Run `pnpm --filter blackborne check:surface -- --update` and commit the result.\n'
  );
  process.exit(1);
}

/* Read through a newline normalisation: the artefact is generated on Linux
   in CI and on Windows locally, and a developer with core.autocrlf=true
   gets CRLF in the working tree. There is no .gitattributes in this repo. */
const committed = readFileSync(SURFACE, 'utf8').replace(/\r\n/gu, '\n');
if (committed === built) {
  process.stdout.write(
    `  the public surface is unchanged: ${exported.length} exported names, ${out.length} blocks\n`
  );
  process.exit(0);
}

/* Report per block, which is the unit a reviewer reads. The committed file
   is the real diff; this is so CI says what changed without one. */
const parse = text => {
  const map = new Map();
  for (const block of text.split('\n').reduce((acc, line) => {
    if (line.startsWith('  ') && acc.length) acc[acc.length - 1].push(line);
    else if (line) acc.push([line]);
    return acc;
  }, [])) {
    map.set(block[0], block.slice(1));
  }
  return map;
};
const was = parse(committed);
const now = parse(built);
const report = [];
for (const header of new Set([...was.keys(), ...now.keys()])) {
  if (!was.has(header)) {
    report.push(`+ ${header}   (new)`);
    continue;
  }
  if (!now.has(header)) {
    report.push(`- ${header}   (gone)`);
    continue;
  }
  const before = was.get(header);
  const after = now.get(header);
  const added = after.filter(l => !before.includes(l));
  const removed = before.filter(l => !after.includes(l));
  if (!added.length && !removed.length) continue;
  report.push(header);
  for (const l of removed) report.push(`  -${l.trim()}`);
  for (const l of added) report.push(`  +${l.trim()}`);
}
process.stderr.write(
  '\nThe public API surface changed.\n\n' +
    `${report.join('\n')}\n\n` +
    'If every line above is intended, run\n' +
    '  pnpm --filter blackborne check:surface -- --update\n' +
    'and commit api-surface.txt in the same pull request, so the change is a reviewed diff.\n'
);
process.exit(1);
