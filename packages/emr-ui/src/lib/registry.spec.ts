import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { EMR_CATALOG, EMR_CATALOG_CATEGORIES } from '../../catalog.manifest';
import { generateRegistry, slugForEntry } from '../../../../scripts/build-registry.mjs';
import { resolveInstallPlan, runCli } from '../../../../bin/emr.mjs';

const registryRoot = join(process.cwd(), 'registry');
const indexPath = join(registryRoot, 'index.json');

describe('EMR shadcn-compatible component registry & CLI', () => {
  it('ships every local import for every item and framework', async () => {
    const { items } = await generateRegistry({ writeFiles: false });
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
    expect(existsSync(indexPath)).toBe(true);
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
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
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    expect(index.categories).toEqual(EMR_CATALOG_CATEGORIES);
    const categoriesByName = new Map<string, string[]>(index.items.map((item: { name: string; categories: string[] }) =>
      [item.name, item.categories]
    ));
    for (const entry of EMR_CATALOG) {
      const name = slugForEntry(entry);
      if (entry.layer === 4) expect(entry.categories?.length, name).toBeGreaterThan(0);
      const expected = entry.categories ?? [entry.layer === 6 ? 'authoring' : 'shared'];
      expect(categoriesByName.get(name), name).toEqual(expected);
      const item = JSON.parse(readFileSync(join(registryRoot, 'items', name + '.json'), 'utf8'));
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
    for (const entry of EMR_CATALOG) {
      const slug = slugForEntry(entry);
      const itemPath = join(registryRoot, 'items', `${slug}.json`);
      expect(existsSync(itemPath), `Missing registry item JSON for ${slug}`).toBe(true);
      const item = JSON.parse(readFileSync(itemPath, 'utf8'));
      expect(item.angular.files.length, `${slug}: angular.files should not be empty`).toBeGreaterThan(0);
      expect(item.react.files.length, `${slug}: react.files should not be empty`).toBeGreaterThan(0);
      expect(item.expo.files.length, `${slug}: expo.files should not be empty`).toBeGreaterThan(0);
      expect(item.lit.files.length, `${slug}: lit.files should not be empty`).toBeGreaterThan(0);
      expect(item.files.length, `${slug}: bundled files should not be empty`).toBeGreaterThan(0);
    }
  });

  it('resolves transitive dependencies and installs components via emr CLI for angular, react, and expo', () => {
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

      const angularDir = join(tmp, 'angular-app');
      runCli(['init', '--framework', 'angular', '--cwd', angularDir]);
      runCli(['add', 'emr-clinical-form', '--framework', 'angular', '--cwd', angularDir]);
      expect(existsSync(join(angularDir, 'emr.json'))).toBe(true);
      expect(existsSync(join(angularDir, 'styles/emr.css'))).toBe(true);
      expect(existsSync(join(angularDir, 'components/emr/structures/emr-clinical-form.component.ts'))).toBe(true);
      expect(existsSync(join(angularDir, 'components/emr/fields/emr-typed-field.component.ts'))).toBe(true);

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
      expect(existsSync(join(litDir, 'components/emr/foundations.ts'))).toBe(true);
      expect(existsSync(join(litDir, 'components/emr/l4-domain.ts'))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
