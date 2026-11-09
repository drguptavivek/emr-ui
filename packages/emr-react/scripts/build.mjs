/**
 * Builds @drguptavivek/emr-react into packages/emr-react/dist:
 *  1. Emits TypeScript declarations (.d.ts) and individual ESM modules via tsc
 *  2. Rewrites relative specifiers in dist/*.js to include explicit .js extensions for Node ESM
 *  3. Emits platform-resolved bundles dist/index.web.mjs (.web.tsx priority) and dist/index.native.mjs (.tsx priority)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const pkgRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(pkgRoot, 'dist');

rmSync(distDir, { recursive: true, force: true });

execFileSync('pnpm', ['exec', 'tsc', '-p', join(pkgRoot, 'tsconfig.build.json')], {
  stdio: 'inherit',
});

for (const name of readdirSync(distDir)) {
  if (!name.endsWith('.js') && !name.endsWith('.d.ts')) continue;
  const fullPath = join(distDir, name);
  const text = readFileSync(fullPath, 'utf8');
  const rewritten = text.replace(
    /((?:from|import)\s+['"])(\.\/[^'"]+)(['"])/g,
    (match, prefix, spec, suffix) => {
      if (spec.endsWith('.js') || spec.endsWith('.mjs') || spec.endsWith('.json')) return match;
      return `${prefix}${spec}.js${suffix}`;
    }
  );
  if (rewritten !== text) {
    writeFileSync(fullPath, rewritten);
  }
}

const external = ['react', 'react/*', 'react-dom', 'react-native', 'react-native-web', '@drguptavivek/emr-controller'];

await esbuild.build({
  entryPoints: [join(pkgRoot, 'src/index.ts')],
  outfile: join(distDir, 'index.web.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  jsx: 'automatic',
  resolveExtensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js'],
  external,
  sourcemap: true,
});

await esbuild.build({
  entryPoints: [join(pkgRoot, 'src/index.ts')],
  outfile: join(distDir, 'index.native.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  jsx: 'automatic',
  resolveExtensions: ['.tsx', '.ts', '.js'],
  external,
  sourcemap: true,
});

if (!existsSync(join(distDir, 'index.d.ts'))) {
  throw new Error('Expected dist/index.d.ts to be generated');
}
console.log('Built @drguptavivek/emr-react -> packages/emr-react/dist');
