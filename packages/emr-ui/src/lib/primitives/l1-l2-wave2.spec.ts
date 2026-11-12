import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  buildCalendarMonthCells,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  computeSelectAllState,
  computeTreeNodeCheckState,
  filterOptionsLocally,
  flattenVisibleTreeNodes,
  formatImageTransformCss,
  formatTreeSelectionLabel,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  normalizeDateRangeSelection,
  normalizeOtpSlots,
  resolveTreeNodePath,
  rotateImage90,
  splitTagTokens,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
} from './emr-wave2.logic';
import { resolveTypedFieldRenderer } from '../fields/typed-field.logic';
import type { EmrOption, EmrTreeNode } from '@drguptavivek/emr-controller';

const libRoot = join(process.cwd(), 'packages/emr-ui/src/lib');
const readLib = (rel: string): string => readFileSync(join(libRoot, rel), 'utf8');
const publicApi = readFileSync(join(process.cwd(), 'packages/emr-ui/src/public-api.ts'), 'utf8');

describe('Wave 2 L1 & L2 pure logic helpers', () => {
  it('groups options into ungrouped + named groups and filters locally across label, value, description, and group', () => {
    const options: readonly EmrOption[] = [
      { value: 'routine', label: 'Routine', description: 'Standard queue' },
      { value: 'snellen', label: 'Snellen Chart', group: 'Visual Acuity' },
      { value: 'logmar', label: 'LogMAR Chart', group: 'Visual Acuity', description: 'ETDRS' },
      { value: 'oct', label: 'Macular OCT', group: 'Imaging' },
    ];
    const groups = groupOptions(options);
    expect(groups).toHaveLength(3);
    expect(groups[0]).toEqual({ label: null, options: [options[0]] });
    expect(groups[1]?.label).toBe('Visual Acuity');
    expect(groups[1]?.options).toHaveLength(2);
    expect(groups[2]?.label).toBe('Imaging');

    expect(filterOptionsLocally(options, 'etdrs').map((o) => o.value)).toEqual(['logmar']);
    expect(filterOptionsLocally(options, 'imaging').map((o) => o.value)).toEqual(['oct']);
    expect(filterOptionsLocally(options, '')).toEqual(options);
  });

  it('computes select-all state and handles exclusive checkbox group options ("None")', () => {
    const options: readonly EmrOption[] = [
      { value: 'dm', label: 'Diabetes' },
      { value: 'htn', label: 'Hypertension' },
      { value: 'none', label: 'None of the above' },
    ];
    expect(computeSelectAllState([], options, ['none'])).toBe('none');
    expect(computeSelectAllState(['dm'], options, ['none'])).toBe('mixed');
    expect(computeSelectAllState(['dm', 'htn'], options, ['none'])).toBe('all');

    const allSelected = toggleSelectAllValues(['dm'], options, ['none']);
    expect(allSelected).toEqual(['dm', 'htn']);
    expect(toggleSelectAllValues(allSelected, options, ['none'])).toEqual([]);

    // Picking an exclusive value clears non-exclusive ones
    const withExclusive = toggleCheckboxGroupValue(['dm', 'htn'], 'none', options, ['none']);
    expect(withExclusive).toEqual(['none']);

    // Picking a regular value clears the exclusive one
    const backToNormal = toggleCheckboxGroupValue(withExclusive, 'dm', options, ['none']);
    expect(backToNormal).toEqual(['dm']);
  });

  it('flattens tree nodes, auto-expands search matches, and cascades check states', () => {
    const tree: readonly EmrTreeNode[] = [
      {
        id: 'ant',
        label: 'Anterior Segment',
        children: [
          { id: 'cornea', label: 'Cornea', code: 'H18' },
          { id: 'lens', label: 'Crystalline Lens', code: 'H25' },
        ],
      },
      {
        id: 'post',
        label: 'Posterior Segment',
        children: [{ id: 'retina', label: 'Retina', code: 'H35' }],
      },
    ];

    expect(collectAllExpandableTreeIds(tree)).toEqual(['ant', 'post']);

    // Collapsed by default when expandedIds=[]
    const collapsed = flattenVisibleTreeNodes(tree, []);
    expect(collapsed.map((r) => r.node.id)).toEqual(['ant', 'post']);

    // Search query auto-expands matching ancestor branches
    const searched = flattenVisibleTreeNodes(tree, [], { searchQuery: 'H25' });
    expect(searched.map((r) => r.node.id)).toEqual(['ant', 'lens']);

    // Cascade check: checking 'cornea' makes 'ant' mixed; checking 'lens' too makes 'ant' checked
    const afterCornea = toggleTreeNodeCheck(tree, [], 'cornea', 'cascade');
    expect(afterCornea).toEqual(['cornea']);
    expect(computeTreeNodeCheckState(tree[0]!, new Set(afterCornea), 'cascade')).toBe('mixed');

    const afterLens = toggleTreeNodeCheck(tree, afterCornea, 'lens', 'cascade');
    expect(afterLens).toEqual(['ant', 'cornea', 'lens']);
    expect(computeTreeNodeCheckState(tree[0]!, new Set(afterLens), 'cascade')).toBe('checked');

    // Path formatting
    expect(resolveTreeNodePath(tree, 'lens').map((n) => n.id)).toEqual(['ant', 'lens']);
    expect(formatTreeSelectionLabel(tree, 'lens', 'path')).toBe(
      'Anterior Segment / Crystalline Lens',
    );
    expect(formatTreeSelectionLabel(tree, 'lens', 'leaf')).toBe('Crystalline Lens');
  });

  it('computes image viewport transforms and clamps crop rectangles to aspect ratios', () => {
    expect(stepImageZoom(DEFAULT_IMAGE_VIEWPORT.zoom, 0.5)).toBe(1.5);
    expect(rotateImage90(0, true)).toBe(90);
    expect(rotateImage90(-90, false)).toBe(180);
    expect(clampStraightenAngle(25.44)).toBe(25.4);
    expect(
      formatImageTransformCss({
        zoom: 1.25,
        panX: 10,
        panY: -5,
        rotationDeg: 90,
        flipH: true,
        flipV: false,
      }),
    ).toBe('translate(10px, -5px) rotate(90deg) scale(-1.25, 1.25)');

    const square = clampCropRect({ x: 0.2, y: 0.2, width: 0.5, height: 0.8 }, 1);
    expect(square.width).toBe(0.5);
    expect(square.height).toBe(0.5);
    expect(DEFAULT_ASPECT_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_IMAGE_CROP_TRANSFORM.rect.width).toBe(0.8);
  });

  it('normalizes date ranges and builds 42-cell calendar grids', () => {
    const step1 = normalizeDateRangeSelection(null, '2026-11-15');
    expect(step1).toEqual({ start: '2026-11-15', end: null });

    // Clicking an earlier date swaps start and end automatically
    const step2 = normalizeDateRangeSelection(step1, '2026-11-10');
    expect(step2).toEqual({ start: '2026-11-10', end: '2026-11-15' });
    expect(isIsoDateInRange('2026-11-12', step2)).toBe(true);
    expect(isIsoRangeEdge('2026-11-10', step2)).toBe('start');
    expect(isIsoRangeEdge('2026-11-15', step2)).toBe('end');

    const cells = buildCalendarMonthCells(2026, 10);
    expect(cells).toHaveLength(42);
    expect(cells.some((c) => c.iso === '2026-11-01' && c.inCurrentMonth)).toBe(true);
  });

  it('handles tag splitting, slider clamping, input masks, OTP slot edits, accordions, and breadcrumbs', () => {
    expect(splitTagTokens('glaucoma, cataract; uveitis')).toEqual([
      'glaucoma',
      'cataract',
      'uveitis',
    ]);
    expect(addTagValues(['Glaucoma'], ['glaucoma', 'Retina', 'Cornea'], { maxTags: 2 })).toEqual([
      'Glaucoma',
      'Retina',
    ]);

    expect(clampSliderValue(14.6, 0, 20, 0.5)).toBe(14.5);
    expect(clampRangeSliderPair(45, 40, 0, 100, 1, 10, 'low')).toEqual([30, 40]);

    const mrnMask = applyInputMask('ab1234', 'AA-9999');
    expect(mrnMask).toEqual({ masked: 'ab-1234', unmasked: 'ab1234', complete: true });

    expect(normalizeOtpSlots('123', 4)).toEqual(['1', '2', '3', '']);
    const pastedOtp = applyOtpSlotEdit('', 0, '987654', 6, true);
    expect(pastedOtp.value).toBe('987654');
    expect(pastedOtp.completed).toBe(true);

    expect(toggleAccordionId(['a'], 'b', false)).toEqual(['b']);
    expect(toggleAccordionId(['a'], 'b', true)).toEqual(['a', 'b']);

    const crumbs = [
      { id: '1', label: 'Home' },
      { id: '2', label: 'Patients' },
      { id: '3', label: 'Visits' },
      { id: '4', label: 'Exam' },
    ];
    const collapsed = collapseBreadcrumbs(crumbs, 3);
    expect(collapsed.leading.map((c) => c.id)).toEqual(['1']);
    expect(collapsed.hidden.map((c) => c.id)).toEqual(['2']);
    expect(collapsed.trailing.map((c) => c.id)).toEqual(['3', '4']);
    expect(DEFAULT_CLINICAL_COLOR_SWATCHES.length).toBeGreaterThanOrEqual(8);
  });

  it('dispatches all 7 new Wave 2 widget hints in resolveTypedFieldRenderer', () => {
    expect(resolveTypedFieldRenderer('select', 'tree-select')).toBe('tree-select');
    expect(resolveTypedFieldRenderer('text', 'combobox')).toBe('combobox');
    expect(resolveTypedFieldRenderer('multiselect', 'tag-input')).toBe('tag-input');
    expect(resolveTypedFieldRenderer('attachment', 'image-upload')).toBe('image-upload');
    expect(resolveTypedFieldRenderer('decimal', 'slider')).toBe('slider');
    expect(resolveTypedFieldRenderer('text', 'masked')).toBe('masked');
    expect(resolveTypedFieldRenderer('text', 'otp')).toBe('otp');
  });
});

describe('Wave 2 L1 & L2 component contracts & upgrades', () => {
  it('completes all 4 upgrades on existing L1 primitives', () => {
    // 1. EmrSelectComponent
    const inputsSrc = readLib('primitives/emr-inputs.component.ts');
    expect(inputsSrc).toMatch(/<optgroup\s+\[label\]="grp\.label">/);
    expect(inputsSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(inputsSrc).toMatch(/readonly\s+cleared\s*=\s*output<void>\(\)/);

    // 2. EmrSearchSelectComponent
    const searchSelectSrc = readLib('primitives/emr-search-select.component.ts');
    expect(searchSelectSrc).toMatch(/readonly\s+filterMode\s*=\s*input<'remote'\s*\|\s*'local'>\('remote'\)/);
    expect(searchSelectSrc).toMatch(/readonly\s+value\s*=\s*input<string\s*\|\s*null\s*\|\s*undefined>/);
    expect(searchSelectSrc).toMatch(/readonly\s+valueChange\s*=\s*output<string\s*\|\s*null>\(\)/);
    expect(searchSelectSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(searchSelectSrc).toMatch(/readonly\s+cleared\s*=\s*output<void>\(\)/);
    expect(searchSelectSrc).toMatch(/readonly\s+allowCustomValue\s*=\s*input\(false/);
    expect(searchSelectSrc).toMatch(/readonly\s+customValueCommitted\s*=\s*output<string>\(\)/);

    // 3. EmrRadioGroupComponent, EmrLikertComponent, EmrVasComponent, EmrSegmentedControlComponent
    const choiceSrc = readLib('primitives/emr-choice.component.ts');
    expect(choiceSrc).toMatch(/readonly\s+valueChange\s*=\s*output<string\s*\|\s*null>\(\)/);
    expect(choiceSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(choiceSrc).toMatch(/readonly\s+allowDeselect\s*=\s*input\(false/);
    expect(choiceSrc).toMatch(/readonly\s+orientation\s*=\s*input<'vertical'\s*\|\s*'horizontal'\s*\|\s*'grid'>\('vertical'\)/);
    expect(choiceSrc).toMatch(/readonly\s+variant\s*=\s*input<'standard'\s*\|\s*'card'\s*\|\s*'pill'>\('standard'\)/);
    expect(choiceSrc).toMatch(/readonly\s+labelPlacement\s*=\s*input<'end'\s*\|\s*'start'\s*\|\s*'space-between'>\('end'\)/);
    expect(choiceSrc).toMatch(/readonly\s+onLabel\s*=\s*input\(''\)/);
    expect(choiceSrc).toMatch(/readonly\s+offLabel\s*=\s*input\(''\)/);

    const likertSrc = readLib('primitives/emr-likert.component.ts');
    expect(likertSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(likertSrc).toMatch(/readonly\s+valueChange\s*=\s*output<number\s*\|\s*null>\(\)/);

    const vasSrc = readLib('primitives/emr-vas.component.ts');
    expect(vasSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(vasSrc).toMatch(/readonly\s+cleared\s*=\s*output<void>\(\)/);

    // 4. EmrSegmentedControlComponent & EmrCheckboxGroupComponent
    const actionControlsSrc = readLib('primitives/emr-action-controls.component.ts');
    expect(actionControlsSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(actionControlsSrc).toMatch(/readonly\s+showSelectAll\s*=\s*input\(false/);
    expect(actionControlsSrc).toMatch(/readonly\s+exclusiveValues\s*=\s*input<readonly\s+string\[\]>\(\[\]\)/);
    expect(actionControlsSrc).toMatch(/readonly\s+variant\s*=\s*input<'standard'\s*\|\s*'card'\s*\|\s*'chip'>\('standard'\)/);
  });

  it('implements all 20 new Wave 2 components (19 L1 + 1 L2 EmrImageFieldComponent) with zero sibling L1 imports in L1 and exports from public-api.ts', () => {
    const wave2Components: readonly [string, string, string][] = [
      ['primitives/emr-action-controls.component.ts', 'emr-toggle-group', 'EmrToggleGroupComponent'],
      ['primitives/emr-tree.component.ts', 'emr-tree-view', 'EmrTreeViewComponent'],
      ['primitives/emr-tree.component.ts', 'emr-tree-select', 'EmrTreeSelectComponent'],
      ['primitives/emr-image.component.ts', 'emr-image-viewer', 'EmrImageViewerComponent'],
      ['primitives/emr-image.component.ts', 'emr-image-cropper', 'EmrImageCropperComponent'],
      ['primitives/emr-image.component.ts', 'emr-image-upload', 'EmrImageUploadComponent'],
      ['primitives/emr-wave2-inputs.component.ts', 'emr-date-range-input', 'EmrDateRangeInputComponent'],
      ['primitives/emr-wave2-inputs.component.ts', 'emr-combobox', 'EmrComboboxComponent'],
      ['primitives/emr-wave2-inputs.component.ts', 'emr-tag-input', 'EmrTagInputComponent'],
      ['primitives/emr-wave2-formatted.component.ts', 'emr-slider', 'EmrSliderComponent'],
      ['primitives/emr-wave2-formatted.component.ts', 'emr-range-slider', 'EmrRangeSliderComponent'],
      ['primitives/emr-wave2-formatted.component.ts', 'emr-masked-input', 'EmrMaskedInputComponent'],
      ['primitives/emr-wave2-formatted.component.ts', 'emr-otp-input', 'EmrOtpInputComponent'],
      ['primitives/emr-wave2-navigation.component.ts', 'emr-menu', 'EmrMenuComponent'],
      ['primitives/emr-wave2-navigation.component.ts', 'emr-split-button', 'EmrSplitButtonComponent'],
      ['primitives/emr-wave2-navigation.component.ts', 'emr-accordion', 'EmrAccordionComponent'],
      ['primitives/emr-wave2-navigation.component.ts', 'emr-breadcrumbs', 'EmrBreadcrumbsComponent'],
      ['primitives/emr-wave2-navigation.component.ts', 'emr-color-picker', 'EmrColorPickerComponent'],
      ['primitives/emr-wave2-navigation.component.ts', 'emr-copy-button', 'EmrCopyButtonComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-image-field', 'EmrImageFieldComponent'],
    ];

    expect(wave2Components).toHaveLength(20);

    for (const [relFile, selector, className] of wave2Components) {
      const fullPath = join(libRoot, relFile);
      expect(existsSync(fullPath), `${relFile} must exist`).toBe(true);
      const src = readLib(relFile);
      expect(src, `${className} selector`).toMatch(new RegExp(`selector:\\s*'${selector}'`));
      expect(src, `${className} export`).toMatch(new RegExp(`export class ${className}\\b`));
      expect(src, `${relFile} must use OnPush`).toMatch(/ChangeDetectionStrategy\.OnPush/);
      expect(src, `${relFile} must not use legacy @Input/@Output`).not.toMatch(
        /@Input\(|@Output\(|EventEmitter/,
      );

      if (relFile.startsWith('primitives/')) {
        expect(
          src,
          `${relFile} (L1) must not import sibling Emr* components in @Component({ imports })`,
        ).not.toMatch(/imports:\s*\[[^\]]*Emr\w+/);
      }

      const exportPath = `./lib/${relFile.replace(/\.ts$/, '')}`;
      expect(publicApi, `public-api.ts must export ${exportPath}`).toContain(
        `export * from '${exportPath}';`,
      );
    }

    const typedFieldSrc = readLib('fields/emr-typed-field.component.ts');
    for (const hint of [
      'tree-select',
      'combobox',
      'tag-input',
      'image-upload',
      'slider',
      'masked',
      'otp',
    ]) {
      expect(typedFieldSrc).toContain(`@case ('${hint}')`);
    }
  });
});
