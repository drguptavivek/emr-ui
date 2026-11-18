import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { EMR_CATALOG, EMR_CATALOG_CATEGORIES } from '../../catalog.manifest';
import { generateRegistry, reactNameForEntry, slugForEntry } from '../../../../scripts/build-registry.mjs';
import { resolveInstallPlan, runCli } from '../../../../bin/emr.mjs';

let builtRegistry: Awaited<ReturnType<typeof generateRegistry>>;
let tmpRegistryRoot: string;
const prevRegistryEnv = process.env.EMR_REGISTRY_DIR;

beforeAll(async () => {
  builtRegistry = await generateRegistry({ writeFiles: false });
  tmpRegistryRoot = mkdtempSync(join(tmpdir(), 'emr-registry-spec-'));
  const itemsDir = join(tmpRegistryRoot, 'items');
  mkdirSync(itemsDir, { recursive: true });
  writeFileSync(join(tmpRegistryRoot, 'index.json'), JSON.stringify(builtRegistry.indexManifest, null, 2) + '\n');
  for (const item of builtRegistry.items) {
    writeFileSync(join(itemsDir, `${item.name}.json`), JSON.stringify(item, null, 2) + '\n');
  }
  process.env.EMR_REGISTRY_DIR = tmpRegistryRoot;
});

afterAll(() => {
  if (prevRegistryEnv === undefined) {
    delete process.env.EMR_REGISTRY_DIR;
  } else {
    process.env.EMR_REGISTRY_DIR = prevRegistryEnv;
  }
  if (tmpRegistryRoot) {
    rmSync(tmpRegistryRoot, { recursive: true, force: true });
  }
});

describe('EMR shadcn-compatible component registry & CLI', () => {
  it('ships every local import for every item and framework', () => {
    const { items } = builtRegistry;
    const byName = new Map(items.map((item: any) => [item.name, item]));
    const importsCache = new Map<string, string[]>();
    for (const item of items) {
      expect(item.lit.rendererStatus, `${item.name}: Lit placeholder`).not.toBe('shell');
      for (const framework of ['angular', 'react', 'expo', 'lit']) {
        const fileFramework = framework === 'expo' ? 'react' : framework;
        const files = new Map<string, string>();
        const visited = new Set<string>();
        function collect(name: string) {
          if (visited.has(name)) return;
          visited.add(name);
          const dependency: any = byName.get(name);
          expect(dependency, `Unknown dependency ${name}`).toBeDefined();
          for (const dep of dependency.registryDependencies) collect(dep);
          for (const file of dependency.files) {
            if (file.framework !== fileFramework) continue;
            if (framework === 'expo' && file.target.endsWith('.web.tsx')) continue;
            files.set(file.target, file.content);
          }
        }
        collect(item.name);
        for (const [target, content] of files) {
          if (!/\.tsx?$/.test(target)) continue;
          const cacheKey = `${fileFramework}:${target}`;
          let imported = importsCache.get(cacheKey);
          if (!imported) {
            imported = ts.preProcessFile(content).importedFiles.map(({ fileName }) => fileName);
            importsCache.set(cacheKey, imported);
          }
          for (const fileName of imported) {
            if (!fileName.startsWith('.')) continue;
            const base = join(dirname(target), fileName.replace(/\.js$/, ''));
            const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.web.tsx`, join(base, 'index.ts')];
            expect(candidates.some((candidate) => files.has(candidate)),
              `${item.name} (${framework}): ${target} imports ${fileName}`).toBe(true);
          }
        }
      }
    }
  });

  it('contains foundations + every EMR_CATALOG entry in registry/index.json', () => {
    const index = builtRegistry.indexManifest;
    expect(index.totalItems).toBe(EMR_CATALOG.length + 1);
    expect(index.items).toHaveLength(EMR_CATALOG.length + 1);

    const itemSlugs = new Set(index.items.map((item: { name: string }) => item.name));
    expect(itemSlugs.has('foundations')).toBe(true);
    for (const entry of EMR_CATALOG) {
      const slug = slugForEntry(entry);
      expect(itemSlugs.has(slug), `Missing registry index entry for ${entry.id} (${slug})`).toBe(true);
    }
  });

  it('exports the same specialty and workflow categories for the catalog and registry items', () => {
    const index = builtRegistry.indexManifest;
    const byName = new Map(builtRegistry.items.map((item: any) => [item.name, item]));
    expect(index.categories).toEqual(EMR_CATALOG_CATEGORIES);
    const categoriesByName = new Map<string, string[]>(index.items.map((item: { name: string; categories: string[] }) =>
      [item.name, item.categories]
    ));
    for (const entry of EMR_CATALOG) {
      const name = slugForEntry(entry);
      if (entry.layer === 4) expect(entry.categories?.length, name).toBeGreaterThan(0);
      const expected = entry.categories ?? [entry.layer === 6 ? 'authoring' : 'shared'];
      expect(categoriesByName.get(name), name).toEqual(expected);
      const item = byName.get(name);
      expect(item.categories, name).toEqual(expected);
      expect(new Set(expected).size, name).toBe(expected.length);
      if (expected.some((category) => ['cataract', 'glaucoma', 'retina', 'motility', 'refraction'].includes(category))) {
        expect(expected, name).toContain('ophthalmology');
      }
    }
    expect(categoriesByName.get('foundations')).toEqual(['shared']);
    expect(new Set([...categoriesByName.values()].flat())).toEqual(new Set(Object.keys(EMR_CATALOG_CATEGORIES)));
    expect(categoriesByName.get('emr-oct-finding-record')).toEqual(['ophthalmology', 'retina', 'diagnostics']);
    expect(categoriesByName.get('emr-specialty-exam-matrix')).toEqual(expect.arrayContaining(['ophthalmology', 'pediatrics', 'dermatology', 'oncology']));
  });

  it('provides Angular, React Web, Expo, and Lit Web Component files for every item in registry/items/*.json', () => {
    const byName = new Map(builtRegistry.items.map((item: any) => [item.name, item]));
    for (const entry of EMR_CATALOG) {
      const slug = slugForEntry(entry);
      const item = byName.get(slug);
      expect(item, `Missing registry item for ${slug}`).toBeDefined();
      expect(item.angular.files.length, `${slug}: angular.files should not be empty`).toBeGreaterThan(0);
      expect(item.react.files.length, `${slug}: react.files should not be empty`).toBeGreaterThan(0);
      expect(item.expo.files.length, `${slug}: expo.files should not be empty`).toBeGreaterThan(0);
      expect(item.lit.files.length, `${slug}: lit.files should not be empty`).toBeGreaterThan(0);
      expect(item.files.length, `${slug}: bundled files should not be empty`).toBeGreaterThan(0);
    }
  });

  it('declares react-native-web dependency for React items and install plans', () => {
    const byName = new Map(builtRegistry.items.map((item: any) => [item.name, item]));
    const dataTable = byName.get('emr-data-table');
    expect(dataTable.dependencies).toContain('@drguptavivek/emr-controller');
    expect(dataTable.dependencies).toContain('react-native-web');
    expect(dataTable.react.dependencies).toEqual(['@drguptavivek/emr-controller', 'react-native-web']);
    expect(dataTable.expo.dependencies).toEqual(['@drguptavivek/emr-controller', 'react-native']);

    const reactPlan = resolveInstallPlan(['emr-data-table'], 'react');
    expect(reactPlan.dependencies).toContain('react-native-web');

    const expoPlan = resolveInstallPlan(['emr-data-table'], 'expo');
    expect(expoPlan.dependencies).not.toContain('react-native-web');
    expect(expoPlan.dependencies).toContain('react-native');
  });

  it('includes emr.css and emr-print.css in foundations for both angular and lit', () => {
    const foundations = builtRegistry.items.find((item: any) => item.name === 'foundations');
    expect(foundations).toBeDefined();
    expect(foundations.lit.files).toContain('foundations/emr.css');
    expect(foundations.lit.files).toContain('foundations/emr-print.css');

    const litCssTargets = foundations.files
      .filter((f: any) => f.framework === 'lit' && f.target.endsWith('.css'))
      .map((f: any) => f.target);
    expect(litCssTargets).toEqual(['styles/emr.css', 'styles/emr-print.css']);

    const litPlan = resolveInstallPlan(['foundations'], 'lit');
    const planTargets = litPlan.files.map((f: { target: string }) => f.target);
    expect(planTargets).toContain('styles/emr.css');
    expect(planTargets).toContain('styles/emr-print.css');
    expect(planTargets).toContain('components/emr/foundations.ts');
  });

  it('maps EmrClinicalCellRendererDirective to EmrMatrixCellRenderers in l3-structures.tsx', () => {
    expect(reactNameForEntry({ id: 'EmrClinicalCellRendererDirective' })).toBe('EmrMatrixCellRenderers');
    const cellItem = builtRegistry.items.find((item: any) => item.id === 'EmrClinicalCellRendererDirective');
    expect(cellItem).toBeDefined();
    expect(cellItem.reactName).toBe('EmrMatrixCellRenderers');
    expect(cellItem.react.component).toBe('EmrMatrixCellRenderers');
    expect(cellItem.react.import).toBe("import { EmrMatrixCellRenderers } from '@drguptavivek/emr-react';");
    expect(cellItem.react.files).toContain('l3-structures.tsx');
  });

  it('throws an explicit error when a catalog entry is missing its React or Lit source instead of falling back to EmrBadgeView', async () => {
    await expect(
      generateRegistry({
        writeFiles: false,
        catalog: [
          {
            id: 'EmrMissingReactWidgetComponent',
            selector: 'emr-missing-react-widget',
            layer: 1,
            kind: 'component',
            status: 'stable',
            summary: 'Missing React counterpart test entry',
            file: 'primitives/emr-badge.component.ts',
            stories: [],
            dependsOn: [],
          },
        ],
      })
    ).rejects.toThrow(/Missing React registry source for EmrMissingReactWidgetComponent \(EmrMissingReactWidget\)/);
  });

  it('scopes Lit registry items to their defining module and transitive imports instead of pulling in the l4-domain.ts barrel', () => {
    const byName = new Map(builtRegistry.items.map((item: any) => [item.name, item]));

    const clinicalNote = byName.get('emr-clinical-note-workspace');
    expect(clinicalNote.lit.files).toEqual([
      'controlled-rendering.ts',
      'foundations.ts',
      'l4-clinical-note.ts',
    ]);
    expect(clinicalNote.lit.files).not.toContain('l4-domain.ts');
    expect(clinicalNote.lit.vendorInit).toContain(
      "import { registerL4ClinicalNoteElements } from './components/emr/l4-clinical-note.js';"
    );

    const octFinding = byName.get('emr-oct-finding-record');
    expect(octFinding.lit.files).toEqual([
      'controlled-rendering.ts',
      'foundations.ts',
      'l4-clinical.ts',
    ]);
    expect(octFinding.lit.files).not.toContain('l4-domain.ts');
    expect(octFinding.lit.vendorInit).toContain(
      "import { registerL4ClinicalElements } from './components/emr/l4-clinical.js';"
    );

    const fieldGenerator = byName.get('emr-field-generator');
    expect(fieldGenerator.lit.files).toEqual([
      'controlled-rendering.ts',
      'foundations.ts',
      'l6-authoring-surfaces.ts',
    ]);
    expect(fieldGenerator.lit.files).not.toContain('l6-authoring.ts');
    expect(fieldGenerator.lit.vendorInit).toContain(
      "import { registerL6AuthoringSurfaces } from './components/emr/l6-authoring-surfaces.js';"
    );
  });

  it('resolves transitive dependencies, respects emr.json during emr add, and installs components via emr CLI', () => {
    const plan = resolveInstallPlan(['emr-clinical-form'], 'angular');
    expect(plan.components).toContain('foundations');
    expect(plan.components).toContain('emr-badge');
    expect(plan.components).toContain('emr-field-frame');
    expect(plan.components).toContain('emr-typed-field');
    expect(plan.components).toContain('emr-section-card');
    expect(plan.components).toContain('emr-clinical-form');

    const tmp = mkdtempSync(join(tmpdir(), 'emr-cli-test-'));
    try {
      const listed = runCli(['list', '--layer', '1']);
      expect(Array.isArray(listed)).toBe(true);
      expect(listed.length).toBeGreaterThan(0);

      const info = runCli(['info', 'emr-stat-tile']);
      expect(info.name).toBe('emr-stat-tile');
      expect(info.reactName).toBe('EmrStatTile');

      // 1. Initialize Angular workspace with emr.json, then run `emr add` WITHOUT `--framework`
      const angularDir = join(tmp, 'angular-app');
      runCli(['init', '--framework', 'angular', '--cwd', angularDir]);
      const angularAddPlan = runCli(['add', 'emr-clinical-form', '--cwd', angularDir]);
      expect(angularAddPlan.framework).toBe('angular');
      expect(existsSync(join(angularDir, 'emr.json'))).toBe(true);
      expect(existsSync(join(angularDir, 'styles/emr.css'))).toBe(true);
      expect(existsSync(join(angularDir, 'components/emr/structures/emr-clinical-form.component.ts'))).toBe(true);
      expect(existsSync(join(angularDir, 'components/emr/fields/emr-typed-field.component.ts'))).toBe(true);

      // 2. Respect custom aliases in emr.json during `emr add`
      const customConfigDir = join(tmp, 'custom-config-app');
      mkdirSync(customConfigDir, { recursive: true });
      writeFileSync(
        join(customConfigDir, 'emr.json'),
        JSON.stringify(
          {
            framework: 'lit',
            aliases: {
              components: '@/src/vendor/emr',
              styles: '@/src/styles',
              controller: '@acme/emr-controller',
            },
          },
          null,
          2
        )
      );
      const customPlan = runCli(['add', 'emr-clinical-note-workspace', '--cwd', customConfigDir]);
      expect(customPlan.framework).toBe('lit');
      expect(existsSync(join(customConfigDir, 'src/styles/emr.css'))).toBe(true);
      expect(existsSync(join(customConfigDir, 'src/styles/emr-print.css'))).toBe(true);
      expect(existsSync(join(customConfigDir, 'src/vendor/emr/l4-clinical-note.ts'))).toBe(true);
      expect(existsSync(join(customConfigDir, 'src/vendor/emr/l4-domain.ts'))).toBe(false);
      const customNoteSource = readFileSync(join(customConfigDir, 'src/vendor/emr/l4-clinical-note.ts'), 'utf8');
      expect(customNoteSource).toContain('@acme/emr-controller');

      const reactDir = join(tmp, 'react-app');
      runCli(['add', 'emr-data-table', '--framework', 'react', '--cwd', reactDir]);
      expect(existsSync(join(reactDir, 'components/emr/tokens.ts'))).toBe(true);
      expect(existsSync(join(reactDir, 'components/emr/data-table.tsx'))).toBe(true);
      expect(existsSync(join(reactDir, 'components/emr/data-table.web.tsx'))).toBe(true);

      const expoDir = join(tmp, 'expo-app');
      runCli(['add', 'emr-data-table', '--framework', 'expo', '--cwd', expoDir]);
      expect(existsSync(join(expoDir, 'components/emr/tokens.ts'))).toBe(true);
      expect(existsSync(join(expoDir, 'components/emr/data-table.tsx'))).toBe(true);
      expect(existsSync(join(expoDir, 'components/emr/data-table.web.tsx'))).toBe(false);

      const litDir = join(tmp, 'lit-app');
      runCli(['add', 'emr-prescribing-table', '--framework', 'lit', '--cwd', litDir]);
      expect(existsSync(join(litDir, 'styles/emr.css'))).toBe(true);
      expect(existsSync(join(litDir, 'styles/emr-print.css'))).toBe(true);
      expect(existsSync(join(litDir, 'components/emr/foundations.ts'))).toBe(true);
      expect(existsSync(join(litDir, 'components/emr/l4-domain.ts'))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
