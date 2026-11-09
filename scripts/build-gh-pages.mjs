/**
 * Assembles the unified GitHub Pages static site into dist/gh-pages/:
 *   - dist/gh-pages/                -> Next.js static export (Interactive Showcase + Shadcn Registry Explorer + OPD Form)
 *   - dist/gh-pages/storybook/      -> Angular Storybook static build (when available or built with --with-storybook)
 *   - dist/gh-pages/registry/       -> Shadcn JSON registry (index.json + items/<slug>.json)
 *   - dist/gh-pages/.nojekyll       -> Ensures GitHub Pages serves _next/ assets
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(rootDir, 'dist/gh-pages');
const nextOutDir = join(rootDir, 'packages/emr-react/harness/next/out');
const registryDir = join(rootDir, 'registry');
const storybookDir = join(rootDir, 'storybook-static');

const withStorybook = process.argv.includes('--with-storybook');
const basePathArg = process.argv.find((a) => a.startsWith('--base-path='))?.slice('--base-path='.length);
const basePath = basePathArg ?? process.env.EMR_GH_PAGES_BASE_PATH ?? '';

function run(cmd, env = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

run('pnpm build:controller');
run('pnpm registry:build');
run('pnpm --filter @drguptavivek/emr-react harness:build', {
  EMR_GH_PAGES_BASE_PATH: basePath,
});

if (withStorybook) {
  run('ng run emr-ui:build-storybook');
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 1. Copy Next.js static export to root of dist/gh-pages/
cpSync(nextOutDir, outDir, { recursive: true });

// 2. Copy registry JSON files to dist/gh-pages/registry/
cpSync(registryDir, join(outDir, 'registry'), { recursive: true });

// 3. Copy Angular Storybook static build to dist/gh-pages/storybook/ if present
if (existsSync(storybookDir)) {
  cpSync(storybookDir, join(outDir, 'storybook'), { recursive: true });
}

// 4. Write .nojekyll so GitHub Pages serves _next/ without Jekyll filtering
writeFileSync(join(outDir, '.nojekyll'), '');

console.log(`Built unified GitHub Pages site -> dist/gh-pages/ (basePath: "${basePath || '/'}")`);
