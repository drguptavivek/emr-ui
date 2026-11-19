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
  buildDateRangeCalendarGrid,
  buildEmrTreeSelectSummary,
  canClearEmrColorPicker,
  canCopyEmrValue,
  canOpenEmrMenu,
  canOpenEmrSplitMenu,
  canSelectEmrBreadcrumb,
  canSelectEmrMenuItem,
  canToggleAccordionItem,
  canTriggerEmrSplitPrimary,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  clearEmrToggleGroupValues,
  clearTreeSelection,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  commitDateRangeEndpoint,
  computeAspectLockedCropRect,
  computeCroppedCanvasPlan,
  computeSelectAllState,
  computeTreeNodeCheckState,
  editMaskedInputWithCaret,
  extractOtpTypedInput,
  filterOptionsLocally,
  findEmrMenuTypeaheadIndex,
  findNextTreeRowIndex,
  findTypeaheadTreeRowIndex,
  flattenVisibleTreeNodes,
  formatCopyButtonLabel,
  formatDateRangeMonthTitle,
  formatImageByteSize,
  formatImageTransformCss,
  formatSliderValue,
  formatTreeSelectionLabel,
  getContrastCheckTone,
  getDateRangeWeekdays,
  getEnabledMenuIndices,
  groupOptions,
  inferMaskInputMode,
  isEmrTreeClearable,
  isHexColorValid,
  isIsoDateInRange,
  isIsoRangeEdge,
  moveAccordionFocusIndex,
  moveColorSwatchFocusIndex,
  moveEmrMenuFocusIndex,
  normalizeDateRangeSelection,
  normalizeEmrToggleGroupLabelPlacement,
  normalizeEmrToggleGroupVariant,
  normalizeHexColor,
  normalizeOtpSlots,
  removeTreeSelectionChip,
  resolveAccordionExpandedIds,
  resolveClosestRangeThumb,
  resolveColorSwatchTabStopIndex,
  resolveCopyFeedbackDurationMs,
  resolveDefaultExpandedTreeIds,
  resolveEmrToggleGroupValues,
  resolveInitialCalendarMonth,
  resolveOtpClearSlot,
  resolveRangeThumbKeyValue,
  resolveSliderKeyStepValue,
  resolveTreeNodePath,
  resolveWave2NavIconPaths,
  rotateImage90,
  selectDateRangeCalendarDay,
  sliderValuePercent,
  splitRotationDegrees,
  splitTagTokens,
  stepCalendarMonth,
  stepImageZoom,
  toggleAccordionId,
  validateUploadedImageFile,
  toggleCheckboxGroupValue,
  toggleEmrToggleGroupValue,
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
    expect(inputsSrc).toMatch(/role="group"/);
    expect(inputsSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(inputsSrc).toMatch(/readonly\s+cleared\s*=\s*output<void>\(\)/);
    expect(inputsSrc).toMatch(/readonly\s+multiple\s*=\s*input\(false/);

    // 2. EmrSearchSelectComponent
    const searchSelectSrc = readLib('primitives/emr-search-select.component.ts');
    expect(searchSelectSrc).toMatch(/readonly\s+filterMode\s*=\s*input<EmrSearchSelectFilterMode>\('remote'\)/);
    expect(searchSelectSrc).toMatch(/readonly\s+value\s*=\s*input<string\s*\|\s*readonly\s+string\[\]\s*\|\s*null\s*\|\s*undefined>/);
    expect(searchSelectSrc).toMatch(/readonly\s+valueChange\s*=\s*output<string\s*\|\s*readonly\s+string\[\]\s*\|\s*null>\(\)/);
    expect(searchSelectSrc).toMatch(/readonly\s+clearable\s*=\s*input<boolean,\s*unknown>\(false/);
    expect(searchSelectSrc).toMatch(/readonly\s+cleared\s*=\s*output<void>\(\)/);
    expect(searchSelectSrc).toMatch(/readonly\s+creatable\s*=\s*input<boolean,\s*unknown>\(false/);
    expect(searchSelectSrc).toMatch(/readonly\s+allowCustomValue\s*=\s*input<boolean,\s*unknown>\(false/);
    expect(searchSelectSrc).toMatch(/readonly\s+customValueCommitted\s*=\s*output<string>\(\)/);

    // 3. EmrRadioGroupComponent, EmrLikertComponent, EmrVasComponent, EmrSegmentedControlComponent
    const choiceSrc = readLib('primitives/emr-choice.component.ts');
    expect(choiceSrc).toMatch(/readonly\s+valueChange\s*=\s*output<string\s*\|\s*null>\(\)/);
    expect(choiceSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(choiceSrc).toMatch(/readonly\s+allowDeselect\s*=\s*input\(false/);
    expect(choiceSrc).toMatch(/readonly\s+orientation\s*=\s*input<(?:EmrRadioGroupOrientation|'vertical'\s*\|\s*'horizontal'\s*\|\s*'grid')>\('vertical'\)/);
    expect(choiceSrc).toMatch(/readonly\s+variant\s*=\s*input<EmrRadioGroupVariant\s*\|\s*'standard'>\('tile'\)/);
    expect(choiceSrc).toMatch(/readonly\s+labelPlacement\s*=\s*input<(?:EmrRadioGroupLabelPlacement|'end'\s*\|\s*'start'\s*\|\s*'space-between')>\('end'\)/);
    expect(choiceSrc).toMatch(/readonly\s+onLabel\s*=\s*input\(''\)/);
    expect(choiceSrc).toMatch(/readonly\s+offLabel\s*=\s*input\(''\)/);

    const likertSrc = readLib('primitives/emr-likert.component.ts');
    expect(likertSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(likertSrc).toMatch(/readonly\s+valueChange\s*=\s*output<number\s*\|\s*null>\(\)/);

    const vasSrc = readLib('primitives/emr-vas.component.ts');
    expect(vasSrc).toMatch(/readonly\s+clearable\s*=\s*input(?:<boolean,\s*unknown>)?\(false/);
    expect(vasSrc).toMatch(/readonly\s+cleared\s*=\s*output<void>\(\)/);

    // 4. EmrSegmentedControlComponent & EmrCheckboxGroupComponent
    const actionControlsSrc = readLib('primitives/emr-action-controls.component.ts');
    expect(actionControlsSrc).toMatch(/readonly\s+clearable\s*=\s*input\(false/);
    expect(actionControlsSrc).toMatch(/readonly\s+showSelectAll\s*=\s*input\(false/);
    expect(actionControlsSrc).toMatch(/readonly\s+exclusiveValues\s*=\s*input<readonly\s+string\[\]>\(\[\]\)/);
    expect(actionControlsSrc).toMatch(/readonly\s+variant\s*=\s*input<(?:EmrCheckboxGroupVariant\s*\|\s*'standard'|'standard'\s*\|\s*'card'\s*\|\s*'chip')>/);
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
      expect(
        typedFieldSrc.includes(`@case ('${hint}')`) ||
          typedFieldSrc.includes(`renderer() === '${hint}'`),
        `EmrTypedFieldComponent must handle '${hint}'`,
      ).toBe(true);
    }
    expect(typedFieldSrc).toContain('<emr-image-field');
  });

  it('provides Wave 2 Batch A parity contracts and logic helpers for EmrToggleGroup, EmrTreeView, and EmrTreeSelect', () => {
    expect(normalizeEmrToggleGroupVariant('standard')).toBe('tile');
    expect(normalizeEmrToggleGroupLabelPlacement(undefined)).toBe('space-between');
    expect(resolveEmrToggleGroupValues({ value: ['sms'], values: ['portal'], multiple: true })).toEqual(['portal']);

    const tgOpts: readonly EmrOption[] = [
      { value: 'sms', label: 'SMS', readOnly: true },
      { value: 'portal', label: 'Portal' },
      { value: 'none', label: 'None' },
    ];
    expect(clearEmrToggleGroupValues(['sms', 'portal'], tgOpts)).toEqual(['sms']);
    expect(
      toggleEmrToggleGroupValue({
        current: ['sms', 'portal'],
        toggledValue: 'none',
        options: tgOpts,
        multiple: true,
        exclusiveValues: ['none'],
      }),
    ).toEqual(['sms', 'none']);

    const tree: readonly EmrTreeNode[] = [
      {
        id: 'ant',
        label: 'Anterior',
        children: [
          { id: 'epi', label: 'Epithelium', readOnly: true, keywords: ['surface'] },
          { id: 'stroma', label: 'Stroma' },
          { id: 'endo', label: 'Endothelium', disabled: true },
        ],
      },
    ];
    expect(resolveDefaultExpandedTreeIds(tree)).toEqual(['ant']);
    expect(flattenVisibleTreeNodes(tree, [], { searchQuery: 'surface' }).map((r) => r.node.id)).toEqual([
      'ant',
      'epi',
    ]);
    expect(toggleTreeNodeCheck(tree, ['epi', 'stroma', 'ant'], 'ant', 'cascade')).toEqual(['epi']);
    expect(clearTreeSelection(tree, ['ant', 'epi', 'stroma'])).toEqual(['epi']);
    expect(removeTreeSelectionChip(tree, ['ant', 'epi', 'stroma'], 'stroma', 'cascade')).toEqual(['epi']);
    const flat = flattenVisibleTreeNodes(tree, ['ant']);
    expect(findNextTreeRowIndex(flat, 2, 'ArrowDown')).toBe(2);
    expect(findTypeaheadTreeRowIndex(flat, 's', 0)).toBe(2);
    expect(
      buildEmrTreeSelectSummary({
        nodes: tree,
        multiple: true,
        values: ['epi', 'stroma'],
        placeholder: 'Select…',
        maxTagCount: 1,
      }).overflowCount,
    ).toBe(1);
    expect(
      isEmrTreeClearable({
        clearable: true,
        disabled: false,
        readOnly: false,
        multiple: true,
        values: ['epi'],
        nodes: tree,
      }),
    ).toBe(false);

    const actionSrc = readLib('primitives/emr-action-controls.component.ts');
    const toggleGroupSection = actionSrc.slice(actionSrc.indexOf("selector: 'emr-toggle-group'"));
    expect(toggleGroupSection).toContain('role="group"');
    expect(toggleGroupSection).toContain('emr-checkbox__box');
    expect(toggleGroupSection).toContain('role="alert"');
    expect(toggleGroupSection).toContain('role="status"');

    const treeSrc = readLib('primitives/emr-tree.component.ts');
    expect(treeSrc).toContain('data-emr-print="expand"');
    expect(treeSrc).toContain('data-emr-print="hide"');
    expect(treeSrc).toContain('role="combobox"');
    expect(treeSrc).toContain('emr-select-chips');
    expect(treeSrc).not.toContain('▾');
    expect(treeSrc).not.toContain('▸');
  });

  it('provides Wave 2 Batch B Image Suite parity helpers and Angular L1/L2 contracts', () => {
    expect(splitRotationDegrees(95)).toEqual({ base90: 90, straighten: 5 });
    expect(
      computeAspectLockedCropRect(
        { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
        { x: 0.1, y: 0.1, width: 0.5, height: 0.7 },
        1,
      ),
    ).toEqual({ x: 0.1, y: 0.1, width: 0.7, height: 0.7 });
    const plan = computeCroppedCanvasPlan(800, 600, DEFAULT_IMAGE_CROP_TRANSFORM);
    expect(plan.outputWidth).toBe(640);
    expect(plan.outputHeight).toBe(480);
    expect(formatImageByteSize(2048)).toBe('2.0 KB');
    expect(
      validateUploadedImageFile(
        { name: 'huge.png', sizeBytes: 5 * 1024 * 1024, mimeType: 'image/png' },
        { accept: 'image/*', maxSizeBytes: 2 * 1024 * 1024 },
      ),
    ).toContain('exceeds the maximum file size');

    const imgSrc = readLib('primitives/emr-image.component.ts');
    expect(imgSrc).toContain('role="radiogroup"');
    expect(imgSrc).toContain('aria-modal');
    expect(imgSrc).toContain('closeRequested');
    expect(imgSrc).toContain('captionChange');
    expect(imgSrc).toContain('outputMimeType');
    expect(imgSrc).toContain('cropOutputMimeType');
    expect(imgSrc).toContain('data-emr-print="hide"');
    expect(imgSrc).not.toMatch(/[−↺↻⇄⇅]/);

    const fieldsSrc = readLib('fields/emr-contract-fields.component.ts');
    const imageFieldSection = fieldsSrc.slice(fieldsSrc.indexOf("selector: 'emr-image-field'"));
    expect(imageFieldSection).toContain('[labelNamesControl]="false"');
    expect(imageFieldSection).toContain('[assessmentStatus]="m.status"');
    expect(imageFieldSection).toContain('(captionChange)="onCaptionChange($event)"');
    expect(imageFieldSection).not.toContain('cf-status__select');
    expect(imageFieldSection).not.toMatch(/readonly\s+disabled\s*=/);
  });

  it('provides Wave 2 Batch C parity helpers and Angular contracts for date-range, sliders, masked, and OTP', () => {
    expect(getDateRangeWeekdays(0)[0]).toBe('Su');
    expect(getDateRangeWeekdays(1)[0]).toBe('Mo');
    expect(buildDateRangeCalendarGrid(2026, 2, 1)[0]?.iso).toBe('2026-02-23');
    expect(stepCalendarMonth(2026, 0, -1)).toEqual({ year: 2025, month0: 11 });
    expect(formatDateRangeMonthTitle(2026, 2)).toBe('March 2026');
    expect(resolveInitialCalendarMonth({ start: '2026-08-01', end: null })).toEqual({ year: 2026, month0: 7 });
    const dtSel = selectDateRangeCalendarDay(
      { start: '2026-03-08T09:15', end: '2026-03-10T17:45' },
      '2026-03-12',
      'datetime',
    );
    expect(dtSel).toEqual({ start: '2026-03-12T09:15', end: null });
    const drCommit = commitDateRangeEndpoint(null, 'start', '2026-03-10', 'date', '2026-03-12', '2026-03-20');
    expect(drCommit.startOutOfBounds).toBe(true);

    expect(clampSliderValue(Number.NaN, 0, 100, 1)).toBe(0);
    expect(clampSliderValue(0.12346, 0, 1, 1e-4)).toBe(0.1235);
    expect(sliderValuePercent(25, 0, 100)).toBe(25);
    expect(formatSliderValue(null, '%')).toBe('—');
    expect(resolveSliderKeyStepValue('PageUp', 10, 0, 100, 1)).toBe(20);
    expect(clampRangeSliderPair(95, 90, 0, 100, 1, 10, 'high')).toEqual([90, 100]);
    expect(clampRangeSliderPair(5, 8, 0, 100, 1, 10, 'low')).toEqual([0, 10]);
    expect(resolveClosestRangeThumb(0.85, 20, 80)).toBe('high');
    expect(resolveRangeThumbKeyValue('low', 'End', [10, 40], 0, 100, 5, 10)).toEqual([30, 40]);

    expect(applyInputMask('12ab', '\\999-AA', { uppercase: true })).toEqual({
      masked: '912-AB',
      unmasked: '12AB',
      complete: true,
    });
    expect(inferMaskInputMode('99-9999')).toBe('numeric');
    expect(editMaskedInputWithCaret('91-', '91', 2, '99-9999').result.masked).toBe('9');

    const sparse = applyOtpSlotEdit('482910', 1, '', 6, true);
    expect(sparse.value).toBe('4 2910');
    expect(normalizeOtpSlots(sparse.value, 6)).toEqual(['4', '', '2', '9', '1', '0']);
    expect(extractOtpTypedInput('4', '49')).toBe('9');
    expect(resolveOtpClearSlot(['4', '', '2'], 1, 'Delete')).toEqual({ targetIndex: 2, nextFocusIndex: 1 });

    const drSrc = readLib('primitives/emr-wave2-inputs.component.ts');
    const drSection = drSrc.slice(drSrc.indexOf("selector: 'emr-date-range-input'"), drSrc.indexOf("selector: 'emr-combobox'"));
    expect(drSection).toContain('emr-date-range__bar');
    expect(drSection).not.toContain('emr-quantity');
    expect(drSection).toContain('role="alert"');
    expect(drSection).toContain('role="status"');
    expect(drSection).toContain('data-emr-print="hide"');

    const formattedSrc = readLib('primitives/emr-wave2-formatted.component.ts');
    expect(formattedSrc).toContain('role="slider"');
    expect(formattedSrc).toContain('emr-slider__thumb');
    expect(formattedSrc).toContain('emr-slider__marks');
    expect(formattedSrc).toContain('emr-input-affix');
    expect(formattedSrc).toContain('role="alert"');
    expect(formattedSrc).toContain('role="status"');
    expect(formattedSrc).toContain('autocomplete="one-time-code"');
    expect(formattedSrc).not.toContain('maxlength="1"');
  });

  it('provides Wave 2 Batch D parity helpers and Angular contracts for menu, split-button, accordion, breadcrumbs, color-picker, and copy-button', () => {
    const items = [
      { id: 'view', label: 'View Chart' },
      { id: 'locked', label: 'Locked', disabled: true },
      { id: 'print', label: 'Print Summary' },
    ];
    expect(canOpenEmrMenu({ itemsCount: items.length })).toBe(true);
    expect(canSelectEmrMenuItem(items[1]!)).toBe(false);
    expect(getEnabledMenuIndices(items)).toEqual([0, 2]);
    expect(moveEmrMenuFocusIndex(items, 0, 'ArrowDown')).toBe(2);
    expect(findEmrMenuTypeaheadIndex(items, 'p', 0)).toBe(2);
    expect(canTriggerEmrSplitPrimary({ loading: true })).toBe(false);
    expect(canOpenEmrSplitMenu({ itemsCount: 2, readOnly: true })).toBe(false);

    const acc = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B', disabled: true },
      { id: 'c', title: 'C' },
    ];
    expect(resolveAccordionExpandedIds(acc, ['a', 'c', 'missing'], false)).toEqual(['a']);
    expect(canToggleAccordionItem(acc[1]!)).toBe(false);
    expect(moveAccordionFocusIndex(acc, 0, 'ArrowDown')).toBe(2);
    expect(canSelectEmrBreadcrumb({ disabled: false }, true)).toBe(false);

    expect(normalizeHexColor('#f0a')).toBe('#ff00aa');
    expect(isHexColorValid('#2563eb')).toBe(true);
    expect(getContrastCheckTone('#fde68a')).toBe('dark');
    expect(getContrastCheckTone('#dc2626')).toBe('light');
    expect(resolveColorSwatchTabStopIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, '#2563eb')).toBe(1);
    expect(moveColorSwatchFocusIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, 0, 'ArrowLeft')).toBe(7);
    expect(canClearEmrColorPicker({ clearable: true, value: '#dc2626', readOnly: true })).toBe(false);

    expect(canCopyEmrValue('MRN-1')).toBe(true);
    expect(canCopyEmrValue('')).toBe(false);
    expect(resolveCopyFeedbackDurationMs(undefined)).toBe(2000);
    expect(formatCopyButtonLabel(true, 'Copy', 'Copied!')).toBe('Copied!');
    expect(resolveWave2NavIconPaths('copy').length).toBeGreaterThan(0);
    expect(resolveWave2NavIconPaths('more-horizontal').length).toBe(3);

    const navSrc = readLib('primitives/emr-wave2-navigation.component.ts');
    expect(navSrc).not.toMatch(/[▾▸…✕]/);
    expect(navSrc).not.toContain('{{ item.icon }}');
    expect(navSrc).toContain("input<string>('Actions')");
    expect(navSrc).toContain("input<string>('Breadcrumb')");
    expect(navSrc).toContain("input<string>('/')");
    expect(navSrc).toContain("input<string>('Color')");
    expect(navSrc).toContain("input<string>('Copy')");
    expect(navSrc).toContain("input<string>('Copied')");
    expect(navSrc).toContain('role="heading"');
    expect(navSrc).toContain('role="alert"');
    expect(navSrc).toContain('role="status"');
    expect(navSrc).toContain('DestroyRef');
  });
});
