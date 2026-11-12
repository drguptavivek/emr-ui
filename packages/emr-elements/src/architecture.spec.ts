// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as ElementsIndex from './index.js';
import { EmrLitElement } from './foundations.js';
import { registerL1Elements } from './l1-primitives.js';
import { registerL2Elements } from './l2-fields.js';

const srcDir = dirname(fileURLToPath(import.meta.url));

const L1_FILES = ['l1-primitives.ts', 'l1-primitives-extra.ts', 'l1-primitives-wave2.ts'] as const;
const L2_FILES = ['l2-fields.ts', 'l2-fields-extra.ts'] as const;
const ALL_L1_L2_FILES = [...L1_FILES, ...L2_FILES] as const;

const ALLOWED_L1_IMPORTS = new Set([
  'lit',
  'lit/decorators.js',
  'lit/directives/live.js',
  'lit/directives/repeat.js',
  '@drguptavivek/emr-controller',
  './foundations.js',
  './icons.js',
  './calendar.logic.js',
  './l1-primitives-extra.js',
  './l1-primitives-wave2.js',
]);

const ALLOWED_L2_IMPORTS = new Set([
  ...ALLOWED_L1_IMPORTS,
  './l1-primitives.js',
  './l2-fields-extra.js',
]);

const EXPECTED_L1_TAGS = [
  // Core 24 L1 primitives + relocated emr-toast
  'emr-button',
  'emr-text-input',
  'emr-number-input',
  'emr-date-input',
  'emr-time-input',
  'emr-datetime-input',
  'emr-select',
  'emr-quantity-input',
  'emr-paired-input',
  'emr-checkbox',
  'emr-toggle',
  'emr-radio-group',
  'emr-badge',
  'emr-chip',
  'emr-alert',
  'emr-state-message',
  'emr-search-select',
  'emr-tabs',
  'emr-separator',
  'emr-likert',
  'emr-vas',
  'emr-card',
  'emr-columns',
  'emr-field-value-row',
  'emr-status-cell',
  'emr-stat-tile',
  'emr-stage-stepper',
  'emr-toast',
  // 16 basic L1 primitives
  'emr-textarea',
  'emr-icon-button',
  'emr-segmented-control',
  'emr-search-input',
  'emr-password-input',
  'emr-numeric-stepper',
  'emr-checkbox-group',
  'emr-pagination',
  'emr-dialog',
  'emr-popover',
  'emr-tooltip',
  'emr-progress-bar',
  'emr-spinner',
  'emr-skeleton',
  'emr-avatar',
  'emr-file-trigger',
  // 19 Wave 2 L1 primitives
  'emr-toggle-group',
  'emr-tree-view',
  'emr-tree-select',
  'emr-image-viewer',
  'emr-image-cropper',
  'emr-image-upload',
  'emr-date-range-input',
  'emr-combobox',
  'emr-tag-input',
  'emr-slider',
  'emr-range-slider',
  'emr-masked-input',
  'emr-otp-input',
  'emr-menu',
  'emr-split-button',
  'emr-accordion',
  'emr-breadcrumbs',
  'emr-color-picker',
  'emr-copy-button',
] as const;

const EXPECTED_L2_TAGS = [
  // Core 6 L2 fields
  'emr-field-frame',
  'emr-typed-field',
  'emr-coded-input',
  'emr-attestation',
  'emr-schedule-slot-picker',
  'emr-identifier-entry',
  // 14 L2 clinical fields
  'emr-scale-field',
  'emr-partial-date-field',
  'emr-attachment-field',
  'emr-paired-field',
  'emr-duration-input',
  'emr-range-field',
  'emr-signature-capture-field',
  'emr-phone-input',
  'emr-address-field',
  'emr-macro-text-field',
  'emr-laterality-field',
  'emr-visual-acuity-field',
  'emr-refraction-field',
  'emr-image-field',
] as const;

describe('L1 & L2 Lit architecture guardrails', () => {
  it.each(ALL_L1_L2_FILES)(
    '%s contains zero hex/rgb/hsl colour literals and zero pixel font-sizes',
    file => {
      const source = readFileSync(join(srcDir, file), 'utf8');
      const hexMatches = source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const fnColorMatches = source.match(/\b(?:rgba?|hsla?)\s*\(/g) ?? [];
      const pxFontMatches = source.match(/font-size\s*:\s*[^;}\n]*\d+px/g) ?? [];

      expect(hexMatches, `Disallowed hex colour literal in ${file}`).toEqual([]);
      expect(fnColorMatches, `Disallowed rgb/hsl colour literal in ${file}`).toEqual([]);
      expect(pxFontMatches, `Disallowed pixel font-size in ${file}`).toEqual([]);
    },
  );

  it('enforces strict layer boundaries and .js relative specifiers in L1 and L2', () => {
    for (const file of L1_FILES) {
      const source = readFileSync(join(srcDir, file), 'utf8');
      const imports = ts.preProcessFile(source).importedFiles.map(entry => entry.fileName);
      for (const spec of imports) {
        if (spec.startsWith('.')) {
          expect(spec.endsWith('.js'), `${file} relative import ${spec} must end in .js`).toBe(true);
        }
        expect(ALLOWED_L1_IMPORTS.has(spec), `${file} has upward or disallowed import: ${spec}`).toBe(true);
      }
    }

    for (const file of L2_FILES) {
      const source = readFileSync(join(srcDir, file), 'utf8');
      const imports = ts.preProcessFile(source).importedFiles.map(entry => entry.fileName);
      for (const spec of imports) {
        if (spec.startsWith('.')) {
          expect(spec.endsWith('.js'), `${file} relative import ${spec} must end in .js`).toBe(true);
        }
        expect(ALLOWED_L2_IMPORTS.has(spec), `${file} has upward or disallowed import: ${spec}`).toBe(true);
      }
    }
  });

  it('ensures every concrete L1 and L2 element class inherits EmrLitElement (never shell base classes)', () => {
    const disallowedBases = new Set(['EmrModelElement', 'EmrControlledDomainElement']);
    for (const file of ALL_L1_L2_FILES) {
      const source = readFileSync(join(srcDir, file), 'utf8');
      const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      for (const stmt of sf.statements) {
        if (!ts.isClassDeclaration(stmt) || !stmt.name) continue;
        const className = stmt.name.text;
        const baseNames =
          stmt.heritageClauses
            ?.filter(c => c.token === ts.SyntaxKind.ExtendsKeyword)
            .flatMap(c => c.types.map(t => t.expression.getText())) ?? [];
        expect(baseNames.length, `${className} in ${file} must extend EmrLitElement`).toBeGreaterThan(0);
        for (const base of baseNames) {
          expect(
            disallowedBases.has(base),
            `${className} in ${file} must NOT extend ${base} (would be classified as shell)`,
          ).toBe(false);
        }
        const exportedCtor = (ElementsIndex as Record<string, unknown>)[className];
        expect(exportedCtor, `${className} from ${file} must be re-exported from index.ts`).toBeDefined();
        expect(
          (exportedCtor as { prototype?: unknown })?.prototype instanceof EmrLitElement,
          `${className} must be an instance of EmrLitElement`,
        ).toBe(true);
      }
    }
  });

  it('registers all 63 L1 and 20 L2 custom elements with full renderers', () => {
    registerL1Elements();
    for (const tag of EXPECTED_L1_TAGS) {
      const ctor = customElements.get(tag);
      expect(ctor, `Missing L1 custom element <${tag}>`).toBeDefined();
      expect(ctor?.prototype instanceof EmrLitElement).toBe(true);
      expect(ctor?.prototype.render).not.toBe(EmrLitElement.prototype.render);
    }

    registerL2Elements();
    for (const tag of EXPECTED_L2_TAGS) {
      const ctor = customElements.get(tag);
      expect(ctor, `Missing L2 custom element <${tag}>`).toBeDefined();
      expect(ctor?.prototype instanceof EmrLitElement).toBe(true);
      expect(ctor?.prototype.render).not.toBe(EmrLitElement.prototype.render);
    }
  });
});
