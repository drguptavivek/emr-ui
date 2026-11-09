import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EMR_CATALOG } from '../../catalog.manifest';
import { slugForEntry } from '../../../../scripts/build-registry.mjs';
import { resolveInstallPlan, runCli } from '../../../../bin/emr.mjs';

const registryRoot = join(process.cwd(), 'registry');
const indexPath = join(registryRoot, 'index.json');

describe('EMR shadcn-compatible component registry & CLI', () => {
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

  it('provides Angular, React Web, and Expo files for every item in registry/items/*.json', () => {
    for (const entry of EMR_CATALOG) {
      const slug = slugForEntry(entry);
      const itemPath = join(registryRoot, 'items', `${slug}.json`);
      expect(existsSync(itemPath), `Missing registry item JSON for ${slug}`).toBe(true);
      const item = JSON.parse(readFileSync(itemPath, 'utf8'));
      expect(item.angular.files.length, `${slug}: angular.files should not be empty`).toBeGreaterThan(0);
      expect(item.react.files.length, `${slug}: react.files should not be empty`).toBeGreaterThan(0);
      expect(item.expo.files.length, `${slug}: expo.files should not be empty`).toBeGreaterThan(0);
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
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
