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

function getRegistryDir() {
  return process.env.EMR_REGISTRY_DIR ? resolve(process.env.EMR_REGISTRY_DIR) : join(rootDir, 'registry');
}

function loadIndex() {
  const indexPath = join(getRegistryDir(), 'index.json');
  if (!existsSync(indexPath)) {
    throw new Error('Registry not built yet. Run `pnpm registry:build` first.');
  }
  return JSON.parse(readFileSync(indexPath, 'utf8'));
}

function loadItem(slug) {
  const itemPath = join(getRegistryDir(), 'items', `${slug}.json`);
  if (!existsSync(itemPath)) {
    throw new Error(`Unknown component "${slug}". Run \`pnpm emr list\` to see available slugs.`);
  }
  return JSON.parse(readFileSync(itemPath, 'utf8'));
}

export function loadProjectConfig(cwd) {
  const configPath = join(cwd, 'emr.json');
  if (!existsSync(configPath)) return null;
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

function normalizeAliasDir(alias, fallback) {
  if (!alias || typeof alias !== 'string') return fallback;
  const stripped = alias.replace(/^(?:[@~]\/|\.\.?\/)+/, '').replace(/\/+$/, '');
  return stripped || fallback;
}

function parseFlags(args) {
  const positional = [];
  const flags = { framework: undefined, cwd: process.cwd(), layer: undefined, all: false };
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

export function resolveInstallPlan(slugs, framework, config = null) {
  const resolvedFramework = framework ?? config?.framework ?? 'react';
  const componentsDir = normalizeAliasDir(config?.aliases?.components, 'components/emr');
  const stylesDir = normalizeAliasDir(config?.aliases?.styles, 'styles');
  const controllerAlias = config?.aliases?.controller;
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

  const dependencies = new Set(['@drguptavivek/emr-controller']);
  if (resolvedFramework === 'react') dependencies.add('react-native-web');
  if (resolvedFramework === 'expo') dependencies.add('react-native');
  if (resolvedFramework === 'lit') dependencies.add('lit');

  const files = new Map();
  for (const item of ordered) {
    const itemDeps = item[resolvedFramework]?.dependencies ?? item.dependencies ?? [];
    for (const dep of itemDeps) {
      if (resolvedFramework !== 'react' && dep === 'react-native-web') continue;
      dependencies.add(dep);
    }
    for (const file of item.files) {
      if (resolvedFramework === 'angular' && file.framework !== 'angular') continue;
      if (
        resolvedFramework === 'lit'
        && file.framework !== 'lit'
        && !(item.name === 'foundations' && file.target.startsWith('styles/'))
      ) {
        continue;
      }
      if ((resolvedFramework === 'react' || resolvedFramework === 'expo') && file.framework !== 'react') continue;
      if (resolvedFramework === 'expo' && file.target.endsWith('.web.tsx')) continue;

      let target = file.target;
      if (target.startsWith('components/emr/')) {
        target = `${componentsDir}/${target.slice('components/emr/'.length)}`;
      } else if (target.startsWith('styles/')) {
        target = `${stylesDir}/${target.slice('styles/'.length)}`;
      }

      let content = file.content;
      if (controllerAlias && controllerAlias !== '@drguptavivek/emr-controller') {
        content = content.replaceAll('@drguptavivek/emr-controller', controllerAlias);
      }

      files.set(target, content);
    }
  }

  return {
    framework: resolvedFramework,
    components: ordered.map((item) => item.name),
    dependencies: [...dependencies],
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
    const framework = flags.framework ?? 'react';
    const configPath = join(flags.cwd, 'emr.json');
    const config = {
      $schema: 'https://ui.shadcn.com/schema.json',
      framework,
      aliases: {
        components: '@/components/emr',
        controller: '@drguptavivek/emr-controller',
      },
    };
    mkdirSync(flags.cwd, { recursive: true });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    const plan = resolveInstallPlan(['foundations'], framework, config);
    for (const file of plan.files) {
      const dest = join(flags.cwd, file.target);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, file.content);
    }
    console.log(`Initialized emr.json (${framework}) and installed L0 foundations in ${flags.cwd}`);
    return { config, plan };
  }

  if (command === 'add') {
    const index = loadIndex();
    const projectConfig = loadProjectConfig(flags.cwd);
    const framework = flags.framework ?? projectConfig?.framework ?? 'react';
    const targetSlugs = flags.all
      ? index.items.map((i) => i.name)
      : flags.layer !== undefined
        ? index.items.filter((i) => i.layer === flags.layer).map((i) => i.name)
        : positional;
    if (!targetSlugs.length) {
      throw new Error('Usage: emr add <slug...> [--framework angular|react|expo|lit] [--cwd <dir>]');
    }
    const plan = resolveInstallPlan(targetSlugs, framework, projectConfig);
    for (const file of plan.files) {
      const dest = join(flags.cwd, file.target);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, file.content);
    }
    console.log(
      `Installed ${plan.components.length} component(s) [${plan.components.join(', ')}] (${plan.files.length} files) for ${framework} into ${flags.cwd}`
    );
    return plan;
  }

  throw new Error(`Unknown command "${command}". Expected: list, info, init, add`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
