#!/usr/bin/env node
/**
 * Shadcn-style CLI for the EMR component system:
 *   pnpm emr list [--layer <0-6>]
 *   pnpm emr info <slug>
 *   pnpm emr init [--framework angular|react|expo] [--cwd <dir>]
 *   pnpm emr add <slug...> [--framework angular|react|expo] [--cwd <dir>]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const registryDir = join(rootDir, 'registry');

function loadIndex() {
  const indexPath = join(registryDir, 'index.json');
  if (!existsSync(indexPath)) {
    throw new Error('Registry not built yet. Run `pnpm registry:build` first.');
  }
  return JSON.parse(readFileSync(indexPath, 'utf8'));
}

function loadItem(slug) {
  const itemPath = join(registryDir, 'items', `${slug}.json`);
  if (!existsSync(itemPath)) {
    throw new Error(`Unknown component "${slug}". Run \`pnpm emr list\` to see available slugs.`);
  }
  return JSON.parse(readFileSync(itemPath, 'utf8'));
}

function parseFlags(args) {
  const positional = [];
  const flags = { framework: 'react', cwd: process.cwd(), layer: undefined, all: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--framework' || arg === '-f') {
      flags.framework = args[++i];
    } else if (arg.startsWith('--framework=')) {
      flags.framework = arg.slice('--framework='.length);
    } else if (arg === '--cwd' || arg === '-c') {
      flags.cwd = resolve(args[++i]);
    } else if (arg.startsWith('--cwd=')) {
      flags.cwd = resolve(arg.slice('--cwd='.length));
    } else if (arg === '--layer' || arg === '-l') {
      flags.layer = Number(args[++i]);
    } else if (arg.startsWith('--layer=')) {
      flags.layer = Number(arg.slice('--layer='.length));
    } else if (arg === '--all') {
      flags.all = true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

export function resolveInstallPlan(slugs, framework = 'react') {
  const ordered = [];
  const seen = new Set();

  function visit(slug) {
    if (seen.has(slug)) return;
    seen.add(slug);
    const item = loadItem(slug);
    for (const dep of item.registryDependencies ?? []) {
      visit(dep);
    }
    ordered.push(item);
  }

  for (const slug of slugs) {
    visit(slug);
  }

  const files = new Map();
  for (const item of ordered) {
    for (const file of item.files) {
      if (framework === 'angular' && file.framework !== 'angular') continue;
      if (framework === 'lit' && file.framework !== 'lit') continue;
      if ((framework === 'react' || framework === 'expo') && file.framework !== 'react') continue;
      if (framework === 'expo' && file.target.endsWith('.web.tsx')) continue;
      files.set(file.target, file.content);
    }
  }

  return {
    framework,
    components: ordered.map((item) => item.name),
    files: [...files.entries()].map(([target, content]) => ({ target, content })),
  };
}

export function runCli(argv = process.argv.slice(2)) {
  const [command = 'list', ...rest] = argv;
  const { positional, flags } = parseFlags(rest);

  if (command === 'list') {
    const index = loadIndex();
    const filtered =
      flags.layer !== undefined ? index.items.filter((i) => i.layer === flags.layer) : index.items;
    const lines = filtered.map(
      (i) =>
        `L${i.layer}  ${i.name.padEnd(34)} ${(i.reactName ?? 'foundations').padEnd(32)} ${i.status}`
    );
    console.log(`EMR Component Registry (${filtered.length} components):\n` + lines.join('\n'));
    return filtered;
  }

  if (command === 'info') {
    const slug = positional[0];
    if (!slug) throw new Error('Usage: emr info <slug>');
    const item = loadItem(slug);
    const { files, ...meta } = item;
    console.log(JSON.stringify({ ...meta, files: files.map((f) => f.target) }, null, 2));
    return item;
  }

  if (command === 'init') {
    const configPath = join(flags.cwd, 'emr.json');
    const config = {
      $schema: 'https://ui.shadcn.com/schema.json',
      framework: flags.framework,
      aliases: {
        components: '@/components/emr',
        controller: '@drguptavivek/emr-controller',
      },
    };
    mkdirSync(flags.cwd, { recursive: true });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    const plan = resolveInstallPlan(['foundations'], flags.framework);
    for (const file of plan.files) {
      const dest = join(flags.cwd, file.target);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, file.content);
    }
    console.log(`Initialized emr.json (${flags.framework}) and installed L0 foundations in ${flags.cwd}`);
    return { config, plan };
  }

  if (command === 'add') {
    const index = loadIndex();
    const targetSlugs = flags.all
      ? index.items.map((i) => i.name)
      : flags.layer !== undefined
        ? index.items.filter((i) => i.layer === flags.layer).map((i) => i.name)
        : positional;
    if (!targetSlugs.length) {
      throw new Error('Usage: emr add <slug...> [--framework angular|react|expo] [--cwd <dir>]');
    }
    const plan = resolveInstallPlan(targetSlugs, flags.framework);
    for (const file of plan.files) {
      const dest = join(flags.cwd, file.target);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, file.content);
    }
    console.log(
      `Installed ${plan.components.length} component(s) [${plan.components.join(', ')}] (${plan.files.length} files) for ${flags.framework} into ${flags.cwd}`
    );
    return plan;
  }

  throw new Error(`Unknown command "${command}". Expected: list, info, init, add`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
