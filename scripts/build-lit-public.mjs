/**
 * Bundles `@drguptavivek/emr-elements` and copies foundation stylesheets into
 * `packages/emr-react/harness/next/public/lit/` so `next dev` (`pnpm site`) and
 * the React ⇄ Lit Parity Workbench load live custom elements and token/print CSS.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextPublicLitDir = join(rootDir, 'packages/emr-react/harness/next/public/lit');
const emrCssPath = join(rootDir, 'packages/emr-ui/src/lib/foundations/emr.css');
const emrPrintCssPath = join(rootDir, 'packages/emr-ui/src/lib/foundations/emr-print.css');

mkdirSync(nextPublicLitDir, { recursive: true });

await esbuild.build({
  stdin: {
    resolveDir: rootDir,
    contents: [
      "export * from './examples/clinical-matrix/lit-host.mjs';",
      "export { createClinicalNoteDemo } from './examples/clinical-notes/clinical-note.fixture.ts';",
      "export { makeSpecialtyExamFixture, reduceSpecialtyExamFixture } from './packages/emr-react/harness/gallery/specialty-exam.fixture.ts';",
      "export { AsyncSearchController } from './packages/emr-controller/dist/search.controller.js';",
      "export { syntheticFormularyRepository, clearFixturePrescriptionProduct, resolveFixturePrescriptionProduct, PRESCRIBING_PRESETS } from './packages/emr-react/harness/gallery/prescribing-formulary.fixture.ts';",
    ].join('\n'),
  },
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: join(nextPublicLitDir, 'emr-elements.bundle.js'),
});

writeFileSync(join(nextPublicLitDir, 'emr.css'), readFileSync(emrCssPath, 'utf8'));
writeFileSync(join(nextPublicLitDir, 'emr-print.css'), readFileSync(emrPrintCssPath, 'utf8'));

console.log('Built public/lit/{emr-elements.bundle.js,emr.css,emr-print.css}');
