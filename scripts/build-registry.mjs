/**
 * Generates the shadcn-compatible EMR component registry from packages/emr-ui/catalog.manifest.ts
 * and packages/emr-react/src, writing:
 *   - registry/index.json
 *   - registry/items/<slug>.json
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const uiLibDir = join(rootDir, 'packages/emr-ui/src/lib');
const reactSrcDir = join(rootDir, 'packages/emr-react/src');
const litSrcDir = join(rootDir, 'packages/emr-elements/src');
const registryDir = join(rootDir, 'registry');
const itemsDir = join(registryDir, 'items');

export function slugForEntry(entry) {
  if (entry.selector && entry.selector.trim()) return entry.selector.trim();
  return entry.id
    .replace(/(?:Component|Directive)$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

export function reactNameForEntry(entry) {
  if (entry.id === 'EmrClinicalCellRendererDirective') return 'EmrCustomRenderers';
  return entry.id.replace(/(?:Component|Directive)$/, '');
}

export function litNameForEntry(entry) {
  if (entry.id === 'EmrClinicalCellRendererDirective') return 'EmrClinicalCellRendererElement';
  return `${entry.id.replace(/(?:Component|Directive)$/, '')}Element`;
}

function litFilesForLayer(layer) {
  if (layer === 1) return ['l1-primitives.ts'];
  if (layer === 2) return ['l2-fields.ts'];
  if (layer === 3) return ['l3-structures.ts'];
  if (layer === 4) return ['l4-domain.ts'];
  if (layer === 6) return ['l6-authoring.ts'];
  return ['foundations.ts'];
}

function collectReactFileMap() {
  const map = new Map();
  const files = readdirSync(reactSrcDir).filter(
    (f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.spec.ts') && !f.endsWith('.spec.tsx')
  );
  for (const file of files) {
    const full = join(reactSrcDir, file);
    const text = readFileSync(full, 'utf8');
    for (const m of text.matchAll(/export\s+(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/g)) {
      const name = m[1];
      const list = map.get(name) ?? [];
      if (!list.includes(file)) list.push(file);
      map.set(name, list);
    }
    for (const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
      for (const part of m[1].split(',')) {
        const cleaned = part.replace(/\btype\b/g, '').trim();
        if (!cleaned) continue;
        const asParts = cleaned.split(/\s+as\s+/);
        const exported = (asParts[1] ?? asParts[0]).trim();
        const list = map.get(exported) ?? [];
        if (!list.includes(file)) list.push(file);
        map.set(exported, list);
      }
    }
  }
  return map;
}

function relatedReactFiles(primaryFiles) {
  const all = new Set();
  const queue = [...primaryFiles];
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || all.has(file)) continue;
    const full = join(reactSrcDir, file);
    if (!existsSync(full)) continue;
    all.add(file);
    const stem = file.replace(/\.(?:web\.)?tsx?$/, '');
    for (const ext of ['.tsx', '.web.tsx', '.logic.ts', '.types.ts']) {
      const candidate = `${stem}${ext}`;
      if (existsSync(join(reactSrcDir, candidate)) && !all.has(candidate)) {
        queue.push(candidate);
      }
    }
    const text = readFileSync(full, 'utf8');
    for (const m of text.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
      const rel = m[1].replace(/^\.\//, '');
      for (const ext of ['.tsx', '.ts', '.web.tsx']) {
        const candidate = rel.endsWith(ext) ? rel : `${rel}${ext}`;
        if (existsSync(join(reactSrcDir, candidate)) && !all.has(candidate)) {
          queue.push(candidate);
        }
      }
    }
  }
  return [...all].sort();
}

function relatedAngularFiles(relFile) {
  const all = new Set([relFile]);
  const full = join(uiLibDir, relFile);
  if (existsSync(full)) {
    const dir = dirname(relFile);
    const text = readFileSync(full, 'utf8');
    for (const m of text.matchAll(/from\s+['"](\.\/[^'"]+\.logic)['"]/g)) {
      const logicRel = join(dir, `${m[1].replace(/^\.\//, '')}.ts`);
      if (existsSync(join(uiLibDir, logicRel))) all.add(logicRel);
    }
  }
  return [...all].sort();
}

export async function generateRegistry({ writeFiles = true } = {}) {
  const { EMR_CATALOG, EMR_LAYERS } = await import(join(rootDir, 'packages/emr-ui/catalog.manifest.ts'));
  const reactFileMap = collectReactFileMap();
  const byId = new Map(EMR_CATALOG.map((e) => [e.id, e]));

  function resolveTransitiveSlugs(entry, visited = new Set()) {
    const slugs = new Set(['foundations']);
    for (const depId of entry.dependsOn) {
      if (visited.has(depId)) continue;
      visited.add(depId);
      const dep = byId.get(depId);
      if (!dep) continue;
      slugs.add(slugForEntry(dep));
      for (const s of resolveTransitiveSlugs(dep, visited)) slugs.add(s);
    }
    return [...slugs];
  }

  const foundationsItem = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'foundations',
    type: 'registry:style',
    layer: 0,
    layerName: EMR_LAYERS[0],
    status: 'stable',
    description: 'L0 design tokens, light/dark themes, print context stylesheet, and React Native token/theme provider.',
    dependencies: ['@drguptavivek/emr-controller'],
    registryDependencies: [],
    angular: {
      files: ['foundations/emr.css', 'foundations/emr-print.css'],
      import: "@import '@drguptavivek/emr-ui/styles/emr.css';",
    },
    react: {
      files: ['tokens.ts', 'theme.tsx', 'labels.tsx', 'use-controller.ts'],
      import: "import { EmrThemeProvider, useEmrTheme, emrLightTokens, emrDarkTokens } from '@drguptavivek/emr-react';",
    },
    expo: {
      files: ['tokens.ts', 'theme.tsx', 'labels.tsx', 'use-controller.ts'],
      import: "import { EmrThemeProvider, useEmrTheme, emrLightTokens, emrDarkTokens } from '@drguptavivek/emr-react';",
    },
    lit: {
      files: ['foundations.ts', 'icons.ts'],
      import: "import { EmrLitElement, applyEmrCustomTheme, EMR_PALETTE_PRESETS, EMR_FONT_STACKS } from '@drguptavivek/emr-elements';",
    },
    files: [
      {
        path: 'packages/emr-ui/src/lib/foundations/emr.css',
        framework: 'angular',
        target: 'styles/emr.css',
        content: readFileSync(join(uiLibDir, 'foundations/emr.css'), 'utf8'),
      },
      {
        path: 'packages/emr-ui/src/lib/foundations/emr-print.css',
        framework: 'angular',
        target: 'styles/emr-print.css',
        content: readFileSync(join(uiLibDir, 'foundations/emr-print.css'), 'utf8'),
      },
      {
        path: 'packages/emr-react/src/tokens.ts',
        framework: 'react',
        target: 'components/emr/tokens.ts',
        content: readFileSync(join(reactSrcDir, 'tokens.ts'), 'utf8'),
      },
      {
        path: 'packages/emr-react/src/theme.tsx',
        framework: 'react',
        target: 'components/emr/theme.tsx',
        content: readFileSync(join(reactSrcDir, 'theme.tsx'), 'utf8'),
      },
      {
        path: 'packages/emr-react/src/labels.tsx',
        framework: 'react',
        target: 'components/emr/labels.tsx',
        content: readFileSync(join(reactSrcDir, 'labels.tsx'), 'utf8'),
      },
      {
        path: 'packages/emr-react/src/use-controller.ts',
        framework: 'react',
        target: 'components/emr/use-controller.ts',
        content: readFileSync(join(reactSrcDir, 'use-controller.ts'), 'utf8'),
      },
      {
        path: 'packages/emr-elements/src/foundations.ts',
        framework: 'lit',
        target: 'components/emr/foundations.ts',
        content: readFileSync(join(litSrcDir, 'foundations.ts'), 'utf8'),
      },
      {
        path: 'packages/emr-elements/src/icons.ts',
        framework: 'lit',
        target: 'components/emr/icons.ts',
        content: readFileSync(join(litSrcDir, 'icons.ts'), 'utf8'),
      },
    ],
  };

  const items = [foundationsItem];

  for (const entry of EMR_CATALOG) {
    const slug = slugForEntry(entry);
    const reactName = reactNameForEntry(entry);
    const litName = litNameForEntry(entry);
    const primaryReact = reactFileMap.get(reactName) ?? reactFileMap.get('EmrBadgeView') ?? [];
    const rFiles = relatedReactFiles(primaryReact);
    const ngFiles = relatedAngularFiles(entry.file);
    const lFiles = litFilesForLayer(entry.layer);
    const directDeps = ['foundations', ...entry.dependsOn.map((id) => slugForEntry(byId.get(id))).filter(Boolean)];
    const transitiveDeps = resolveTransitiveSlugs(entry);

    const itemFiles = [
      ...ngFiles.map((f) => ({
        path: `packages/emr-ui/src/lib/${f}`,
        framework: 'angular',
        target: `components/emr/${f}`,
        content: readFileSync(join(uiLibDir, f), 'utf8'),
      })),
      ...rFiles.map((f) => ({
        path: `packages/emr-react/src/${f}`,
        framework: 'react',
        target: `components/emr/${f}`,
        content: readFileSync(join(reactSrcDir, f), 'utf8'),
      })),
      ...lFiles.map((f) => ({
        path: `packages/emr-elements/src/${f}`,
        framework: 'lit',
        target: `components/emr/${f}`,
        content: readFileSync(join(litSrcDir, f), 'utf8'),
      })),
    ];

    items.push({
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: slug,
      id: entry.id,
      reactName,
      litName,
      selector: entry.selector,
      type: 'registry:ui',
      layer: entry.layer,
      layerName: EMR_LAYERS[entry.layer],
      kind: entry.kind,
      status: entry.status,
      description: entry.summary,
      stories: entry.stories,
      dependencies: ['@drguptavivek/emr-controller'],
      registryDependencies: directDeps,
      transitiveRegistryDependencies: transitiveDeps,
      installCommand: {
        cli: `pnpm emr add ${slug}`,
        angular: `pnpm emr add ${slug} --framework angular`,
        react: `pnpm emr add ${slug} --framework react`,
        expo: `pnpm emr add ${slug} --framework expo`,
        lit: `pnpm emr add ${slug} --framework lit`,
      },
      angular: {
        component: entry.id,
        selector: entry.selector,
        files: ngFiles,
        import: `import { ${entry.id} } from '@drguptavivek/emr-ui';`,
      },
      react: {
        component: reactName,
        files: rFiles,
        import: `import { ${reactName} } from '@drguptavivek/emr-react';`,
      },
      expo: {
        component: reactName,
        files: rFiles.filter((f) => !f.endsWith('.web.tsx')),
        import: `import { ${reactName} } from '@drguptavivek/emr-react';`,
      },
      lit: {
        component: litName,
        selector: slug,
        files: lFiles,
        import: `import { ${litName} } from '@drguptavivek/emr-elements';`,
      },
      files: itemFiles,
    });
  }

  const indexManifest = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: '@drguptavivek/emr',
    homepage: 'https://github.com/drguptavivek/emr-ui',
    totalItems: items.length,
    layers: EMR_LAYERS,
    items: items.map(({ files, ...summary }) => ({
      ...summary,
      fileCount: files.length,
    })),
  };

  if (writeFiles) {
    rmSync(registryDir, { recursive: true, force: true });
    mkdirSync(itemsDir, { recursive: true });
    writeFileSync(join(registryDir, 'index.json'), JSON.stringify(indexManifest, null, 2) + '\n');
    for (const item of items) {
      writeFileSync(join(itemsDir, `${item.name}.json`), JSON.stringify(item, null, 2) + '\n');
    }
    const tsPath = join(rootDir, 'packages/emr-react/harness/gallery/registry-manifest.ts');
    const tsContent =
      `// Auto-generated by scripts/build-registry.mjs — do not edit by hand.\n` +
      `export const EMR_REGISTRY_MANIFEST = ${JSON.stringify(indexManifest, null, 2)} as const;\n`;
    writeFileSync(tsPath, tsContent);
  }

  return { indexManifest, items };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { indexManifest } = await generateRegistry({ writeFiles: true });
  console.log(`Generated shadcn registry (${indexManifest.totalItems} items) -> ${relative(rootDir, registryDir)}/`);
}
