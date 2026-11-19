import { describe, expect, it } from 'vitest';
import {
  addTagValues,
  applyInputMask,
  buildDateRangeCalendarGrid,
  clearUnlockedTags,
  commitDateRangeEndpoint,
  commitTagInputValues,
  editMaskedInputWithCaret,
  extractOtpTypedInput,
  formatDateRangeMonthTitle,
  formatSliderValue,
  getDateRangeWeekdays,
  inferMaskInputMode,
  isIsoRangeEdge,
  isValidDateRangeEndpoint,
  normalizeOtpSlots,
  normalizeTagInputDraft,
  popLastUnlockedTag,
  rankTagSuggestions,
  removeTagInputAtIndex,
  resolveClosestRangeThumb,
  resolveEmrTagsValue,
  resolveInitialCalendarMonth,
  resolveMaskedCaretPosition,
  resolveOtpClearSlot,
  resolveRangeThumbKeyValue,
  resolveSliderKeyStepValue,
  selectDateRangeCalendarDay,
  sliderValuePercent,
  stepCalendarMonth,
  applyOtpSlotEdit,
  buildEmrSelectTriggerSummary,
  buildEmrTreeSelectSummary,
  canActivateEmrFieldValueRow,
  canActivateEmrStatTile,
  canClearEmrColorPicker,
  canClearEmrSegmentedControl,
  canCopyEmrValue,
  canMutateEmrToggle,
  canOpenEmrMenu,
  canOpenEmrSplitMenu,
  canSelectEmrBreadcrumb,
  canSelectEmrMenuItem,
  canSelectEmrStage,
  canSelectEmrStatusCell,
  canToggleAccordionItem,
  canTriggerCopy,
  canTriggerEmrSplitPrimary,
  canTriggerEmrStatusCellAction,
  canClearRadioGroupValue,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  findEmrMenuTypeaheadIndex,
  formatCopyButtonLabel,
  getContrastCheckTone,
  getEnabledMenuIndices,
  isHexColorValid,
  moveAccordionFocusIndex,
  moveColorSwatchFocusIndex,
  moveEmrMenuFocusIndex,
  normalizeHexColor,
  resolveAccordionExpandedIds,
  resolveColorSwatchTabStopIndex,
  resolveCopyFeedbackDurationMs,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  computeAspectLockedCropRect,
  computeCroppedCanvasPlan,
  splitRotationDegrees,
  validateUploadedImageFile,
  clearCheckboxGroupValue,
  clearEmrSelectValue,
  clearEmrToggleGroupValues,
  clearTreeSelection,
  collapseBreadcrumbs,
  computeSelectAllState,
  computeTreeNodeCheckState,
  filterOptionsLocally,
  findNextEnabledEmrSelectOptionIndex,
  findNextTreeRowIndex,
  findTypeaheadEmrSelectOptionIndex,
  findTypeaheadTreeRowIndex,
  flattenVisibleTreeNodes,
  formatCheckboxSelectionCount,
  formatEmrSegmentedBadge,
  formatEmrStatusCellAttribution,
  formatTreeSelectionLabel,
  getNextStageStepperIndex,
  groupOptions,
  isCheckboxOptionBlockedByMax,
  isCheckboxOptionLocked,
  isEmrSegmentedOptionDisabled,
  isEmrSegmentedOptionLocked,
  isEmrSelectClearable,
  isEmrSelectOptionBlockedByMax,
  isEmrTreeClearable,
  isIsoDateInRange,
  isRadioOptionLocked,
  moveEmrSegmentedFocusIndex,
  moveRadioGroupFocusIndex,
  normalizeCheckboxGroupVariant,
  normalizeEmrFieldValueRowSize,
  normalizeEmrFieldValueRowTone,
  normalizeEmrSegmentedOrientation,
  normalizeEmrSegmentedShape,
  normalizeEmrSegmentedSize,
  normalizeEmrSegmentedVariant,
  normalizeEmrSelectMultiValue,
  normalizeEmrSelectSingleValue,
  normalizeEmrStageStepperOrientation,
  normalizeEmrStageStepperSize,
  normalizeEmrStatTileSize,
  normalizeEmrStatTileTone,
  normalizeEmrToggleGroupLabelPlacement,
  normalizeEmrToggleGroupOrientation,
  normalizeEmrToggleGroupSize,
  normalizeEmrToggleGroupVariant,
  resolveEmrSegmentedSelectAction,
  resolveEmrSegmentedTabStopValue,
  resolveEmrSegmentedValidationState,
  resolveEmrToggleGroupValues,
  resolveEmrTreeSelectDefaultExpanded,
  resolveDefaultExpandedTreeIds,
  removeTreeSelectionChip,
  normalizeEmrStatusCellSize,
  normalizeEmrToggleLabelPlacement,
  normalizeEmrToggleSize,
  normalizeEmrToggleVariant,
  normalizeRadioGroupVariant,
  findNextEnabledSearchOptionIndex,
  formatCreatableLabel,
  rankAndFilterOptions,
  resolveComboboxDisplayValue,
  removeEmrSelectChip,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveEmrFieldValueRowValue,
  resolveEmrSelectCloseOnSelect,
  resolveEmrStatTileAriaLabel,
  resolveEmrStatusCellHiddenText,
  resolveEmrToggleAriaChecked,
  resolveEmrToggleChecked,
  resolveEmrToggleNext,
  resolveEmrToggleStateLabel,
  resolveEmrToggleValidationState,
  resolveRadioGroupTabStopValue,
  resolveSearchSelectValues,
  resolveStageStepperTabStopId,
  normalizeDateRangeSelection,
  rotateImage90,
  splitMatchHighlightSegments,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleEmrSelectOption,
  toggleEmrToggleGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
  validateCheckboxGroupSelection,
  validateEmrToggleGroupSelection,
  type EmrOption,
  type EmrTreeNode,
} from './l1-primitives.models';

const SAMPLE_TREE: readonly EmrTreeNode[] = [
  {
    id: 'ant',
    label: 'Anterior Segment',
    children: [
      {
        id: 'cornea',
        label: 'Cornea',
        children: [
          { id: 'epi', label: 'Epithelium', code: 'C-EPI' },
          { id: 'stroma', label: 'Stroma', code: 'C-STR' },
        ],
      },
      { id: 'iris', label: 'Iris' },
    ],
  },
  {
    id: 'post',
    label: 'Posterior Segment',
    children: [{ id: 'macula', label: 'Macula' }],
  },
];

describe('l1-primitives.models pure logic', () => {
  it('groups and filters options locally by label, description, value, and group', () => {
    const opts = [
      { value: 'timolol', label: 'Timolol 0.5%', group: 'Beta blockers', description: 'BID' },
      { value: 'latanoprost', label: 'Latanoprost', group: 'Prostaglandins', description: 'QHS' },
      { value: 'other', label: 'Other' },
    ];
    const grouped = groupOptions(opts);
    expect(grouped.map((g) => g.label)).toEqual([null, 'Beta blockers', 'Prostaglandins']);
    expect(filterOptionsLocally(opts, 'prosta').map((o) => o.value)).toEqual(['latanoprost']);
    expect(filterOptionsLocally(opts, 'bid').map((o) => o.value)).toEqual(['timolol']);
  });

  it('computes checkbox group select-all mixed state and handles exclusive None option', () => {
    const opts = [
      { value: 'pain', label: 'Pain' },
      { value: 'redness', label: 'Redness' },
      { value: 'none', label: 'None of the above' },
    ];
    expect(computeSelectAllState([], opts, ['none'])).toBe('none');
    expect(computeSelectAllState(['pain'], opts, ['none'])).toBe('mixed');
    expect(computeSelectAllState(['pain', 'redness'], opts, ['none'])).toBe('all');

    const all = toggleSelectAllValues(['none'], opts, ['none']);
    expect(all).toEqual(['pain', 'redness']);

    const exclusive = toggleCheckboxGroupValue(all, 'none', opts, ['none']);
    expect(exclusive).toEqual(['none']);

    const reselect = toggleCheckboxGroupValue(exclusive, 'redness', opts, ['none']);
    expect(reselect).toEqual(['redness']);
  });

  it('flattens tree nodes, auto-expands search matches, and cascades parent-child checks', () => {
    const collapsed = flattenVisibleTreeNodes(SAMPLE_TREE, []);
    expect(collapsed.map((r) => r.node.id)).toEqual(['ant', 'post']);

    const searched = flattenVisibleTreeNodes(SAMPLE_TREE, [], { searchQuery: 'stroma' });
    expect(searched.map((r) => r.node.id)).toEqual(['ant', 'cornea', 'stroma']);

    const afterEpi = toggleTreeNodeCheck(SAMPLE_TREE, [], 'epi', 'cascade');
    expect(afterEpi).toEqual(['epi']);
    const rowsPartial = flattenVisibleTreeNodes(SAMPLE_TREE, ['ant', 'cornea'], {
      selectedIds: afterEpi,
      checkStrategy: 'cascade',
    });
    expect(rowsPartial.find((r) => r.node.id === 'cornea')?.checkState).toBe('mixed');
    expect(rowsPartial.find((r) => r.node.id === 'ant')?.checkState).toBe('mixed');

    const afterCornea = toggleTreeNodeCheck(SAMPLE_TREE, afterEpi, 'cornea', 'cascade');
    expect(afterCornea).toEqual(['cornea', 'epi', 'stroma']);

    expect(formatTreeSelectionLabel(SAMPLE_TREE, 'stroma', 'path')).toBe(
      'Anterior Segment / Cornea / Stroma'
    );
    expect(formatTreeSelectionLabel(SAMPLE_TREE, 'stroma', 'leaf')).toBe('Stroma');
  });

  it('clamps image zoom, 90-degree rotation, and aspect-locked crop rects', () => {
    expect(stepImageZoom(1, 0.25)).toBe(1.25);
    expect(stepImageZoom(4.9, 0.5)).toBe(5);
    expect(rotateImage90(90, true)).toBe(180);
    expect(rotateImage90(180, true)).toBe(-90);
    const crop = clampCropRect({ x: 0.8, y: 0.8, width: 0.5, height: 0.5 }, 1);
    expect(crop.x + crop.width).toBeLessThanOrEqual(1);
    expect(crop.y + crop.height).toBeLessThanOrEqual(1);
    expect(crop.width).toBeCloseTo(crop.height, 3);

    expect(splitRotationDegrees(0)).toEqual({ base90: 0, straighten: 0 });
    expect(splitRotationDegrees(95)).toEqual({ base90: 90, straighten: 5 });
    expect(splitRotationDegrees(-175)).toEqual({ base90: -180, straighten: 5 });
    expect(splitRotationDegrees(175)).toEqual({ base90: 180, straighten: -5 });

    const lockedY = computeAspectLockedCropRect(
      { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
      { x: 0.1, y: 0.1, width: 0.5, height: 0.7 },
      1,
    );
    expect(lockedY).toEqual({ x: 0.1, y: 0.1, width: 0.7, height: 0.7 });

    const lockedNW = computeAspectLockedCropRect(
      { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
      { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
      1,
    );
    expect(lockedNW).toEqual({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 });

    const plan = computeCroppedCanvasPlan(
      1000,
      800,
      {
        rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        rotationDeg: 90,
        zoom: 1.5,
        panX: 10,
        panY: -10,
        flipH: true,
        flipV: false,
        aspectRatio: null,
      },
      2048,
    );
    expect(plan.outputWidth).toBe(500);
    expect(plan.outputHeight).toBe(400);
    expect(plan.scaleX).toBe(-1.5);
    expect(plan.scaleY).toBe(1.5);

    const cappedPlan = computeCroppedCanvasPlan(
      8000,
      4000,
      {
        rect: { x: 0, y: 0, width: 1, height: 1 },
        rotationDeg: 0,
        zoom: 1,
        panX: 0,
        panY: 0,
        flipH: false,
        flipV: false,
        aspectRatio: null,
      },
      2048,
    );
    expect(cappedPlan.outputWidth).toBe(2048);
    expect(cappedPlan.outputHeight).toBe(1024);

    expect(
      validateUploadedImageFile(
        { name: 'fundus.png', sizeBytes: 1024, mimeType: 'image/png' },
        { accept: 'image/*', maxSizeBytes: 5000 },
      ),
    ).toBeNull();
    expect(
      validateUploadedImageFile(
        { name: 'huge.png', sizeBytes: 5 * 1024 * 1024, mimeType: 'image/png' },
        { accept: 'image/*', maxSizeBytes: 2 * 1024 * 1024 },
      ),
    ).toContain('exceeds the maximum file size');
    expect(
      validateUploadedImageFile(
        { name: 'notes.pdf', sizeBytes: 1024, mimeType: 'application/pdf' },
        { accept: 'image/*' },
      ),
    ).toContain('not an accepted file type');
  });

  it('normalizes chronological date ranges and checks inclusion', () => {
    const step1 = normalizeDateRangeSelection(null, '2026-10-15');
    expect(step1).toEqual({ start: '2026-10-15', end: null });
    const step2 = normalizeDateRangeSelection(step1, '2026-10-10');
    expect(step2).toEqual({ start: '2026-10-10', end: '2026-10-15' });
    expect(isIsoDateInRange('2026-10-12', step2)).toBe(true);
    expect(isIsoDateInRange('2026-10-16', step2)).toBe(false);
  });

  it('handles tag deduplication, slider/range-slider clamping, input masking, and OTP paste', () => {
    expect(addTagValues(['OD'], ['od', 'OS', 'OU'], { maxTags: 2 })).toEqual(['OD', 'OS']);
    expect(clampSliderValue(13, 0, 100, 5)).toBe(15);
    expect(clampRangeSliderPair(60, 40, 0, 100, 5, 10, 'low')).toEqual([30, 40]);

    const abha = applyInputMask('91234567890123', '99-9999-9999-9999');
    expect(abha).toEqual({
      masked: '91-2345-6789-0123',
      unmasked: '91234567890123',
      complete: true,
    });

    const otp = applyOtpSlotEdit('', 0, '482910', 6, true);
    expect(otp.value).toBe('482910');
    expect(otp.completed).toBe(true);
  });

  it('covers Wave 2 Batch C date-range calendar, slider/range-slider bounds, masked escaping/caret, and sparse OTP', () => {
    // 1. Date range calendar & datetime preservation
    expect(getDateRangeWeekdays(0)[0]).toBe('Su');
    expect(getDateRangeWeekdays(1)[0]).toBe('Mo');
    const sunGrid = buildDateRangeCalendarGrid(2026, 2, 0); // March 2026 (starts Sunday)
    expect(sunGrid).toHaveLength(42);
    expect(sunGrid[0]).toEqual({ iso: '2026-03-01', day: 1, inCurrentMonth: true });
    const monGrid = buildDateRangeCalendarGrid(2026, 2, 1); // March 2026 Monday-first -> starts Feb 23
    expect(monGrid[0]).toEqual({ iso: '2026-02-23', day: 23, inCurrentMonth: false });

    expect(stepCalendarMonth(2026, 0, -1)).toEqual({ year: 2025, month0: 11 });
    expect(stepCalendarMonth(2026, 11, 1)).toEqual({ year: 2027, month0: 0 });
    expect(formatDateRangeMonthTitle(2026, 2)).toBe('March 2026');
    expect(resolveInitialCalendarMonth({ start: '2026-08-10', end: null })).toEqual({ year: 2026, month0: 7 });
    expect(resolveInitialCalendarMonth(null, '2025-12-01')).toEqual({ year: 2025, month0: 11 });

    expect(isValidDateRangeEndpoint('2026-03-08', 'date')).toBe(true);
    expect(isValidDateRangeEndpoint('2026-03', 'date')).toBe(false);
    expect(isValidDateRangeEndpoint('2026-03-08 09:30', 'datetime')).toBe(true);

    const committed = commitDateRangeEndpoint(
      { start: '2026-03-10', end: '2026-03-15' },
      'start',
      '2026-03-20',
      'date',
      '2026-03-01',
      '2026-03-18',
    );
    expect(committed.swapped).toBe(true);
    expect(committed.value).toEqual({ start: '2026-03-15', end: '2026-03-20' });
    expect(committed.startOutOfBounds).toBe(false);
    expect(committed.endOutOfBounds).toBe(true);

    const dtSelected = selectDateRangeCalendarDay(
      { start: '2026-03-08T09:15', end: '2026-03-10T17:45' },
      '2026-03-12',
      'datetime',
    );
    expect(dtSelected).toEqual({ start: '2026-03-12T09:15', end: null });
    expect(isIsoRangeEdge('2026-03-08', { start: '2026-03-08T09:15', end: '2026-03-10T17:45' })).toBe('start');
    expect(isIsoDateInRange('2026-03-09', { start: '2026-03-08T09:15', end: '2026-03-10T17:45' })).toBe(true);

    // 2. Slider & Range Slider
    expect(clampSliderValue(Number.NaN, 0, 100, 1)).toBe(0);
    expect(clampSliderValue(15, 20, 0, 5)).toBe(15); // min > max safe swap
    expect(clampSliderValue(0.12346, 0, 1, 1e-4)).toBe(0.1235);
    expect(sliderValuePercent(25, 0, 100)).toBe(25);
    expect(formatSliderValue(null, '%')).toBe('—');
    expect(formatSliderValue(12.5, 'mmHg', 1)).toBe('12.5 mmHg');
    expect(resolveSliderKeyStepValue('PageUp', 10, 0, 100, 1)).toBe(20);
    expect(resolveSliderKeyStepValue('Home', 50, 10, 90, 5)).toBe(10);

    // Boundary minDistance bug fixes: high near max, low near min
    expect(clampRangeSliderPair(95, 90, 0, 100, 1, 10, 'high')).toEqual([90, 100]);
    expect(clampRangeSliderPair(5, 8, 0, 100, 1, 10, 'low')).toEqual([0, 10]);
    expect(resolveClosestRangeThumb(0.1, 20, 80)).toBe('low');
    expect(resolveClosestRangeThumb(0.9, 20, 80)).toBe('high');
    expect(resolveClosestRangeThumb(0.65, 20, 80)).toBe('high');
    expect(resolveRangeThumbKeyValue('low', 'End', [10, 40], 0, 100, 5, 10)).toEqual([30, 40]);

    // 3. Masked input escaping, custom definitions, uppercase, inputMode & caret
    const escaped = applyInputMask('1234', '\\9\\A-99-99');
    expect(escaped).toEqual({ masked: '9A-12-34', unmasked: '1234', complete: true });
    const customHex = applyInputMask('ab1f', '##-##', {
      uppercase: true,
      definitions: { '#': '[0-9A-Fa-f]' },
    });
    expect(customHex).toEqual({ masked: 'AB-1F', unmasked: 'AB1F', complete: true });
    expect(inferMaskInputMode('99-9999-9999-9999')).toBe('numeric');
    expect(inferMaskInputMode('AA-9999')).toBe('text');
    expect(resolveMaskedCaretPosition('91-23', '91-23', 2, '99-9999')).toBe(3);
    const backspacedLiteral = editMaskedInputWithCaret('91-', '91', 2, '99-9999');
    expect(backspacedLiteral.result.masked).toBe('9');
    expect(backspacedLiteral.caret).toBe(1);

    // 4. Sparse OTP preservation, overwrite & clear resolution
    const clearedMid = applyOtpSlotEdit('482910', 1, '', 6, true);
    expect(clearedMid.value).toBe('4 2910');
    expect(clearedMid.slots).toEqual(['4', '', '2', '9', '1', '0']);
    expect(clearedMid.completed).toBe(false);
    const refilled = applyOtpSlotEdit(clearedMid.value, 1, '5', 6, true);
    expect(refilled.value).toBe('452910');
    expect(refilled.completed).toBe(true);
    expect(extractOtpTypedInput('4', '49')).toBe('9');
    expect(extractOtpTypedInput('4', '94')).toBe('9');
    expect(extractOtpTypedInput('4', '482910')).toBe('482910');
    expect(resolveOtpClearSlot(['4', '', '2'], 1, 'Backspace')).toEqual({ targetIndex: 0, nextFocusIndex: 0 });
    expect(resolveOtpClearSlot(['4', '', '2'], 1, 'Delete')).toEqual({ targetIndex: 2, nextFocusIndex: 1 });
    const alphaOtp = applyOtpSlotEdit('', 0, 'ab12', 4, false, { uppercase: true });
    expect(alphaOtp.value).toBe('AB12');
    expect(alphaOtp.completed).toBe(true);
  });

  it('toggles single/multi accordions and collapses long breadcrumb trails', () => {
    expect(toggleAccordionId(['a'], 'b', false)).toEqual(['b']);
    expect(toggleAccordionId(['a'], 'b', true)).toEqual(['a', 'b']);

    const crumbs = [
      { id: '1', label: 'Home' },
      { id: '2', label: 'Patients' },
      { id: '3', label: 'Documents' },
      { id: '4', label: 'Imaging' },
      { id: '5', label: 'OCT' },
    ];
    const collapsed = collapseBreadcrumbs(crumbs, 3);
    expect(collapsed.leading.map((c) => c.id)).toEqual(['1']);
    expect(collapsed.hidden.map((c) => c.id)).toEqual(['2', '3']);
    expect(collapsed.trailing.map((c) => c.id)).toEqual(['4', '5']);
  });

  it('normalizes EmrFieldValueRow values, tones, sizes, and activation gating', () => {
    expect(resolveEmrFieldValueRowValue(0, false, '—')).toEqual({ text: '0', isPlaceholder: false });
    expect(resolveEmrFieldValueRowValue('   ', false, '—')).toEqual({ text: '—', isPlaceholder: true });
    expect(resolveEmrFieldValueRowValue(null, false, 'N/A')).toEqual({ text: 'N/A', isPlaceholder: true });
    expect(resolveEmrFieldValueRowValue('', true, '—')).toEqual({ text: '', isPlaceholder: false });
    expect(normalizeEmrFieldValueRowSize('sm')).toBe('sm');
    expect(normalizeEmrFieldValueRowSize('invalid')).toBe('md');
    expect(normalizeEmrFieldValueRowTone('danger')).toBe('danger');
    expect(normalizeEmrFieldValueRowTone('unknown')).toBe('neutral');
    expect(canActivateEmrFieldValueRow(true, false)).toBe(true);
    expect(canActivateEmrFieldValueRow(true, true)).toBe(false);
    expect(canActivateEmrFieldValueRow(false, false)).toBe(false);
  });

  it('formats EmrStatusCell attribution, compact hidden text, and readOnly/disabled gates', () => {
    expect(formatEmrStatusCellAttribution({ nameLabel: 'Nurse K. Nair', roleLabel: 'OPD Nurse', timeLabel: '09:15' })).toBe(
      'Nurse K. Nair · OPD Nurse · 09:15',
    );
    expect(formatEmrStatusCellAttribution({ author: 'Dr Rao', timestamp: '10:00' })).toBe('Dr Rao · 10:00');
    expect(formatEmrStatusCellAttribution('  Sister M.  ')).toBe('Sister M.');
    expect(resolveEmrStatusCellHiddenText(false, '120/80', 'Dr Rao', 'Note')).toBe('');
    expect(resolveEmrStatusCellHiddenText(true, '120/80', 'Dr Rao', 'Note')).toBe('120/80. Dr Rao. Note');
    expect(normalizeEmrStatusCellSize('sm')).toBe('sm');
    expect(normalizeEmrStatusCellSize('invalid')).toBe('md');
    expect(canSelectEmrStatusCell(true, false, false)).toBe(true);
    expect(canSelectEmrStatusCell(true, true, false)).toBe(false);
    expect(canSelectEmrStatusCell(true, false, true)).toBe(false);
    expect(canTriggerEmrStatusCellAction(true, false, false, false)).toBe(true);
    expect(canTriggerEmrStatusCellAction(true, true, false, false)).toBe(false);
    expect(canTriggerEmrStatusCellAction(true, false, true, false)).toBe(false);
    expect(canTriggerEmrStatusCellAction(true, false, false, true)).toBe(false);
  });

  it('handles EmrStageStepper linear gating, disabled stages, and roving focus', () => {
    const stages = [
      { id: 's1', disabled: false },
      { id: 's2', disabled: true },
      { id: 's3', disabled: false },
    ];
    expect(normalizeEmrStageStepperOrientation('vertical')).toBe('vertical');
    expect(normalizeEmrStageStepperOrientation('other')).toBe('horizontal');
    expect(normalizeEmrStageStepperSize('sm')).toBe('sm');
    expect(resolveStageStepperTabStopId(stages, null, 's2', false)).toBe('s1');
    expect(resolveStageStepperTabStopId(stages, 's3', 's1', false)).toBe('s3');
    expect(resolveStageStepperTabStopId(stages, 's3', 's1', true)).toBeUndefined();
    expect(getNextStageStepperIndex(stages, 0, 'ArrowRight', false)).toBe(2); // skips disabled s2
    expect(getNextStageStepperIndex(stages, 2, 'Home', false)).toBe(0);
    expect(canSelectEmrStage(stages[2]!, { linear: true, activeId: 's1', stages, completedIds: [] })).toBe(false);
    expect(canSelectEmrStage(stages[2]!, { linear: true, activeId: 's1', stages, completedIds: ['s3'] })).toBe(true);
    expect(canSelectEmrStage(stages[0]!, { readOnly: true, stages })).toBe(false);
  });

  it('normalizes EmrStatTile size, tone, loading/readOnly/disabled gating, and ariaLabel', () => {
    expect(normalizeEmrStatTileSize('lg')).toBe('lg');
    expect(normalizeEmrStatTileSize('invalid')).toBe('md');
    expect(normalizeEmrStatTileTone('warning', 'info')).toBe('warning');
    expect(normalizeEmrStatTileTone(null, 'info')).toBe('info');
    expect(canActivateEmrStatTile(true, false, false, false)).toBe(true);
    expect(canActivateEmrStatTile(true, false, true, false)).toBe(false);
    expect(canActivateEmrStatTile(true, false, false, true)).toBe(false);
    expect(canActivateEmrStatTile(true, true, false, false)).toBe(false);
    expect(
      resolveEmrStatTileAriaLabel({
        label: 'IOP',
        value: '18',
        trend: { label: '+2', direction: 'up' },
        sub: 'Today',
        status: { label: 'Normal', tone: 'success' },
      }),
    ).toBe('IOP, 18, +2, Today, Normal');
  });

  it('handles checkbox-group variant normalization, locked options, maxSelections clamping, clear, count, and validation', () => {
    expect(normalizeCheckboxGroupVariant('inline')).toBe('inline');
    expect(normalizeCheckboxGroupVariant('card')).toBe('card');
    expect(normalizeCheckboxGroupVariant('chip')).toBe('chip');
    expect(normalizeCheckboxGroupVariant('standard')).toBe('tile');
    expect(normalizeCheckboxGroupVariant(undefined)).toBe('tile');

    const opts = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', readOnly: true },
      { value: 'c', label: 'C', disabled: true },
      { value: 'd', label: 'D' },
      { value: 'none', label: 'None' },
    ];
    expect(isCheckboxOptionLocked(opts[0]!)).toBe(false);
    expect(isCheckboxOptionLocked(opts[1]!)).toBe(true);
    expect(isCheckboxOptionLocked(opts[2]!)).toBe(true);

    // Locked options are ignored by toggle & select-all and preserved on clear/exclusive
    expect(toggleCheckboxGroupValue(['b'], 'b', opts)).toEqual(['b']);
    expect(toggleCheckboxGroupValue(['c'], 'c', opts)).toEqual(['c']);
    expect(computeSelectAllState(['b'], opts, ['none'])).toBe('none');
    expect(computeSelectAllState(['a', 'b'], opts, ['none'])).toBe('mixed');
    expect(computeSelectAllState(['a', 'b', 'd'], opts, ['none'])).toBe('all');

    const allWithLocked = toggleSelectAllValues(['b'], opts, ['none']);
    expect(allWithLocked).toEqual(['a', 'b', 'd']);
    const deselectedWithLocked = toggleSelectAllValues(allWithLocked, opts, ['none']);
    expect(deselectedWithLocked).toEqual(['b']);

    const cleared = clearCheckboxGroupValue(['a', 'b', 'c', 'd'], opts);
    expect(cleared).toEqual(['b', 'c']);

    // Exclusive preserves locked selected items
    const excl = toggleCheckboxGroupValue(['a', 'b'], 'none', opts, ['none']);
    expect(excl).toEqual(['b', 'none']);

    // maxSelections clamping without blocking unchecks
    expect(isCheckboxOptionBlockedByMax('d', ['a', 'b'], 2)).toBe(true);
    expect(isCheckboxOptionBlockedByMax('a', ['a', 'b'], 2)).toBe(false);
    expect(toggleCheckboxGroupValue(['a', 'b'], 'd', opts, { maxSelections: 2 })).toEqual(['a', 'b']);
    expect(toggleCheckboxGroupValue(['a', 'b'], 'a', opts, { maxSelections: 2 })).toEqual(['b']);
    expect(toggleSelectAllValues(['b'], opts, { exclusiveValues: ['none'], maxSelections: 2 })).toEqual(['a', 'b']);

    // Count & validation
    expect(formatCheckboxSelectionCount(['a', 'b'])).toBe('2 selected');
    expect(formatCheckboxSelectionCount(['a', 'b'], 3)).toBe('2 of 3 selected');
    expect(validateCheckboxGroupSelection(['a'], 2, 3)).toEqual({
      valid: false,
      count: 1,
      minViolated: true,
      maxViolated: false,
      message: 'Select at least 2 options.',
    });
    expect(validateCheckboxGroupSelection(['a', 'b', 'c', 'd'], 1, 3)).toEqual({
      valid: false,
      count: 4,
      minViolated: false,
      maxViolated: true,
      message: 'Select at most 3 options.',
    });
    expect(validateCheckboxGroupSelection(['a', 'b'], 1, 3)).toEqual({
      valid: true,
      count: 2,
      minViolated: false,
      maxViolated: false,
      message: null,
    });
  });

  it('handles radio-group variant normalization, locked options, roving focus, tab-stop, and clearability', () => {
    expect(normalizeRadioGroupVariant('tile')).toBe('tile');
    expect(normalizeRadioGroupVariant('inline')).toBe('inline');
    expect(normalizeRadioGroupVariant('card')).toBe('card');
    expect(normalizeRadioGroupVariant('pill')).toBe('pill');
    expect(normalizeRadioGroupVariant('segmented')).toBe('segmented');
    expect(normalizeRadioGroupVariant('standard')).toBe('tile');
    expect(normalizeRadioGroupVariant(undefined)).toBe('tile');

    const opts = [
      { value: 'od', label: 'OD' },
      { value: 'os', label: 'OS', readOnly: true },
      { value: 'ou', label: 'OU', disabled: true },
      { value: 'none', label: 'None' },
    ];
    expect(isRadioOptionLocked(opts[0]!)).toBe(false);
    expect(isRadioOptionLocked(opts[1]!)).toBe(true);
    expect(isRadioOptionLocked(opts[2]!)).toBe(true);

    // Tab stop: readOnly options remain focusable; disabled options are skipped
    expect(resolveRadioGroupTabStopValue(opts, 'os')).toBe('os');
    expect(resolveRadioGroupTabStopValue(opts, 'ou')).toBe('od');
    expect(resolveRadioGroupTabStopValue(opts, null)).toBe('od');
    expect(resolveRadioGroupTabStopValue(opts, 'od', true)).toBeNull();
    expect(resolveRadioGroupTabStopValue([{ value: 'x', label: 'X', disabled: true }], null)).toBeNull();

    // Roving focus skips disabled but visits readOnly
    expect(moveRadioGroupFocusIndex(opts, 0, 1)).toBe(1); // od -> os (readOnly)
    expect(moveRadioGroupFocusIndex(opts, 1, 1)).toBe(3); // os -> none (skips ou disabled)
    expect(moveRadioGroupFocusIndex(opts, 3, 1)).toBe(0); // wraps to od
    expect(moveRadioGroupFocusIndex(opts, 0, -1)).toBe(3); // wraps backwards to none
    expect(moveRadioGroupFocusIndex(opts, 3, -1)).toBe(1); // none -> os (skips ou disabled)
    expect(moveRadioGroupFocusIndex(opts, 0, 1, true)).toBe(-1); // group disabled

    // Clearability respects clearable, groupReadOnly, groupDisabled, and locked selected option
    expect(canClearRadioGroupValue('od', opts, true, false, false)).toBe(true);
    expect(canClearRadioGroupValue('od', opts, false, false, false)).toBe(false);
    expect(canClearRadioGroupValue(null, opts, true, false, false)).toBe(false);
    expect(canClearRadioGroupValue('od', opts, true, true, false)).toBe(false);
    expect(canClearRadioGroupValue('od', opts, true, false, true)).toBe(false);
    expect(canClearRadioGroupValue('os', opts, true, false, false)).toBe(false);
    expect(canClearRadioGroupValue('ou', opts, true, false, false)).toBe(false);
  });

  it('normalizes, toggles, clears, summarizes, and navigates EmrSelect single & multi-select values', () => {
    const opts: readonly EmrOption[] = [
      { value: 'stat', label: 'STAT' },
      { value: 'urgent', label: 'Urgent' },
      { value: 'routine', label: 'Routine', readOnly: true },
      { value: 'archived', label: 'Archived', disabled: true },
      { value: 'follow-up', label: 'Follow-up' },
    ];

    expect(normalizeEmrSelectSingleValue('')).toBeNull();
    expect(normalizeEmrSelectSingleValue(null)).toBeNull();
    expect(normalizeEmrSelectSingleValue('stat')).toBe('stat');
    expect(normalizeEmrSelectSingleValue(['', 'urgent', 'stat'])).toBe('urgent');

    expect(normalizeEmrSelectMultiValue(null)).toEqual([]);
    expect(normalizeEmrSelectMultiValue('')).toEqual([]);
    expect(normalizeEmrSelectMultiValue('stat')).toEqual(['stat']);
    expect(normalizeEmrSelectMultiValue(['stat', '', 'urgent', 'stat'])).toEqual(['stat', 'urgent']);

    expect(resolveEmrSelectCloseOnSelect(false)).toBe(true);
    expect(resolveEmrSelectCloseOnSelect(true)).toBe(false);
    expect(resolveEmrSelectCloseOnSelect(true, true)).toBe(true);
    expect(resolveEmrSelectCloseOnSelect(false, false)).toBe(false);

    expect(isEmrSelectOptionBlockedByMax('follow-up', ['stat', 'urgent'], 2)).toBe(true);
    expect(isEmrSelectOptionBlockedByMax('stat', ['stat', 'urgent'], 2)).toBe(false);
    expect(isEmrSelectOptionBlockedByMax('follow-up', ['stat'], 2)).toBe(false);

    // Toggle respects readOnly, disabled, and maxSelections
    expect(toggleEmrSelectOption({ optionValue: 'urgent', current: ['stat'], options: opts, maxSelections: 2 })).toEqual(['stat', 'urgent']);
    expect(toggleEmrSelectOption({ optionValue: 'follow-up', current: ['stat', 'urgent'], options: opts, maxSelections: 2 })).toEqual(['stat', 'urgent']);
    expect(toggleEmrSelectOption({ optionValue: 'stat', current: ['stat', 'urgent'], options: opts, maxSelections: 2 })).toEqual(['urgent']);
    expect(toggleEmrSelectOption({ optionValue: 'routine', current: ['stat'], options: opts })).toEqual(['stat']);
    expect(toggleEmrSelectOption({ optionValue: 'archived', current: ['stat'], options: opts })).toEqual(['stat']);

    // Clearability and clearing preserve readOnly/disabled selections
    expect(isEmrSelectClearable({ clearable: true, disabled: false, readOnly: false, multiple: false, value: 'stat', options: opts })).toBe(true);
    expect(isEmrSelectClearable({ clearable: true, disabled: false, readOnly: false, multiple: false, value: 'routine', options: opts })).toBe(false);
    expect(isEmrSelectClearable({ clearable: true, disabled: false, readOnly: false, multiple: true, value: ['routine'], options: opts })).toBe(false);
    expect(isEmrSelectClearable({ clearable: true, disabled: false, readOnly: false, multiple: true, value: ['routine', 'stat'], options: opts })).toBe(true);

    expect(clearEmrSelectValue({ multiple: false, value: 'stat', options: opts })).toBeNull();
    expect(clearEmrSelectValue({ multiple: false, value: 'routine', options: opts })).toBe('routine');
    expect(clearEmrSelectValue({ multiple: true, value: ['routine', 'stat'], options: opts })).toEqual(['routine']);

    // Chip removal blocks readOnly/disabled
    expect(removeEmrSelectChip({ optionValue: 'stat', current: ['routine', 'stat'], options: opts })).toEqual(['routine']);
    expect(removeEmrSelectChip({ optionValue: 'routine', current: ['routine', 'stat'], options: opts })).toEqual(['routine', 'stat']);

    // Trigger summary
    expect(buildEmrSelectTriggerSummary({ multiple: false, value: null, options: opts, placeholder: 'Select…' })).toEqual({
      hasSelection: false,
      text: 'Select…',
      visibleChips: [],
      overflowCount: 0,
    });
    expect(buildEmrSelectTriggerSummary({ multiple: true, value: ['stat', 'urgent', 'follow-up'], options: opts, placeholder: 'Select…', maxTagCount: 2 })).toEqual({
      hasSelection: true,
      text: 'STAT, Urgent, Follow-up',
      visibleChips: [opts[0], opts[1]],
      overflowCount: 1,
    });

    // Keyboard navigation skips disabled but visits readOnly
    expect(findNextEnabledEmrSelectOptionIndex(opts, 1, 'ArrowDown')).toBe(2); // urgent -> routine (readOnly)
    expect(findNextEnabledEmrSelectOptionIndex(opts, 2, 'ArrowDown')).toBe(4); // routine -> follow-up (skips archived)
    expect(findNextEnabledEmrSelectOptionIndex(opts, 4, 'ArrowDown')).toBe(0); // wraps to stat
    expect(findNextEnabledEmrSelectOptionIndex(opts, 0, 'ArrowUp')).toBe(4); // wraps to follow-up
    expect(findNextEnabledEmrSelectOptionIndex(opts, 2, 'Home')).toBe(0);
    expect(findNextEnabledEmrSelectOptionIndex(opts, 2, 'End')).toBe(4);

    // Buffered typeahead skips disabled and wraps
    expect(findTypeaheadEmrSelectOptionIndex(opts, 'u')).toBe(1);
    expect(findTypeaheadEmrSelectOptionIndex(opts, 'f', 0)).toBe(4);
    expect(findTypeaheadEmrSelectOptionIndex(opts, 'a')).toBe(-1); // archived is disabled
    expect(findTypeaheadEmrSelectOptionIndex(opts, 'r', 4)).toBe(2); // wraps to routine
  });

  it('ranks and filters search-select options deterministically with best-match flag, highlight segments, and keyboard helpers', () => {
    const searchOpts: readonly EmrOption[] = [
      {
        value: 'glimepiride-metformin',
        label: 'Glimepiride + Metformin',
        code: 'RX-204',
        description: 'Combination oral hypoglycemic',
        group: 'Endocrinology',
      },
      {
        value: 'metformin-500',
        label: 'Metformin',
        code: 'RX-101',
        keywords: ['biguanide', 'glucophage'],
        description: 'First-line T2DM therapy',
        group: 'Endocrinology',
      },
      {
        value: 'metformin-xr',
        label: 'Metformin XR 500 mg',
        code: 'RX-102',
        description: 'Extended release tablet',
        group: 'Endocrinology',
        disabled: true,
      },
      {
        value: 'insulin-glargine',
        label: 'Insulin Glargine',
        code: 'E11.9',
        keywords: ['basal', 'lantus'],
        description: 'Long-acting insulin analog for diabetes',
        group: 'Biologics',
      },
    ];

    // Empty query returns all options unranked
    const empty = rankAndFilterOptions(searchOpts, '', 'local');
    expect(empty.length).toBe(4);
    expect(empty.every((e) => e.score === 0 && !e.isBestMatch)).toBe(true);

    // Remote and none modes do not filter locally
    expect(rankAndFilterOptions(searchOpts, 'metformin', 'remote').length).toBe(4);
    expect(rankAndFilterOptions(searchOpts, 'metformin', 'none').length).toBe(4);

    // Exact label beats startsWith beats word-boundary
    const rankedMetformin = rankAndFilterOptions(searchOpts, 'metformin', 'local');
    expect(rankedMetformin.map((e) => e.option.value)).toEqual([
      'metformin-500',
      'metformin-xr',
      'glimepiride-metformin',
    ]);
    expect(rankedMetformin[0].score).toBe(1000);
    expect(rankedMetformin[0].isBestMatch).toBe(true);
    expect(rankedMetformin[1].isBestMatch).toBe(false);

    // Disabled top score does not steal isBestMatch
    const rankedXr = rankAndFilterOptions(searchOpts, 'Metformin XR 500 mg', 'local');
    expect(rankedXr.length).toBe(1);
    expect(rankedXr[0].isBestMatch).toBe(false);

    // Code exact match (+950)
    const rankedCode = rankAndFilterOptions(searchOpts, 'e11.9', 'local');
    expect(rankedCode.map((e) => e.option.value)).toEqual(['insulin-glargine']);
    expect(rankedCode[0].score).toBe(950);
    expect(rankedCode[0].isBestMatch).toBe(true);

    // Keyword match (+500)
    const rankedKw = rankAndFilterOptions(searchOpts, 'lantus', 'local');
    expect(rankedKw.map((e) => e.option.value)).toEqual(['insulin-glargine']);
    expect(rankedKw[0].score).toBe(500);

    // Highlight segments (XSS-safe plain text segments)
    expect(splitMatchHighlightSegments('Glimepiride + Metformin', 'metformin')).toEqual([
      { text: 'Glimepiride + ', matched: false },
      { text: 'Metformin', matched: true },
    ]);
    expect(splitMatchHighlightSegments('Type 2 <script>diabetes</script>', 'diabetes')).toEqual([
      { text: 'Type 2 <script>', matched: false },
      { text: 'diabetes', matched: true },
      { text: '</script>', matched: false },
    ]);
    expect(splitMatchHighlightSegments('Metformin 500 mg', '')).toEqual([
      { text: 'Metformin 500 mg', matched: false },
    ]);

    // Active index & keyboard navigation
    expect(resolveDefaultActiveOptionIndex(searchOpts, [], 'met', true)).toBe(0);
    expect(resolveDefaultActiveOptionIndex(searchOpts, ['insulin-glargine'], '', true)).toBe(3);
    expect(resolveDefaultActiveOptionIndex(searchOpts, [], '', true)).toBe(-1);

    // Skips disabled index 2 ('metformin-xr')
    expect(findNextEnabledSearchOptionIndex(searchOpts, 1, 'ArrowDown')).toBe(3);
    expect(findNextEnabledSearchOptionIndex(searchOpts, 3, 'ArrowDown')).toBe(0);
    expect(findNextEnabledSearchOptionIndex(searchOpts, 0, 'ArrowUp')).toBe(3);
    expect(findNextEnabledSearchOptionIndex(searchOpts, 3, 'ArrowUp')).toBe(1);
    expect(findNextEnabledSearchOptionIndex(searchOpts, 2, 'Home')).toBe(0);
    expect(findNextEnabledSearchOptionIndex(searchOpts, 0, 'End')).toBe(3);

    // Value resolution, creatable label, and minQueryLength
    expect(resolveSearchSelectValues(false, 'metformin-500')).toEqual(['metformin-500']);
    expect(resolveSearchSelectValues(true, ['metformin-500', 'insulin-glargine'])).toEqual([
      'metformin-500',
      'insulin-glargine',
    ]);
    expect(resolveSearchSelectValues(true, null, [searchOpts[0]])).toEqual(['glimepiride-metformin']);
    expect(formatCreatableLabel('Add "{query}"', '  Sitagliptin  ')).toBe('Add "Sitagliptin"');
    expect(resolveCustomSearchCandidate('Ab', searchOpts, true, 3)).toBeNull();
    expect(resolveCustomSearchCandidate('Sitagliptin', searchOpts, true, 3)).toBe('Sitagliptin');
    expect(resolveCustomSearchCandidate('RX-101', searchOpts, true, 2)).toBeNull();
  });

  it('resolves combobox display value across active typing, matched option, custom value, and cleared state', () => {
    const opts = [
      { value: 'reduced-vision', label: 'Reduced distance vision' },
      { value: 'glare', label: 'Gradual glare at night' },
    ];
    expect(
      resolveComboboxDisplayValue({
        isActivelyTyping: true,
        query: 'red',
        value: 'glare',
        options: opts,
      }),
    ).toBe('red');
    expect(
      resolveComboboxDisplayValue({
        isActivelyTyping: true,
        query: '',
        value: 'glare',
        options: opts,
      }),
    ).toBe('');
    expect(
      resolveComboboxDisplayValue({
        isActivelyTyping: false,
        query: 'stale',
        value: 'reduced-vision',
        options: opts,
      }),
    ).toBe('Reduced distance vision');
    expect(
      resolveComboboxDisplayValue({
        isActivelyTyping: false,
        query: '',
        value: 'Custom free-solo symptom',
        options: opts,
      }),
    ).toBe('Custom free-solo symptom');
    expect(
      resolveComboboxDisplayValue({
        isActivelyTyping: false,
        query: 'leftover',
        value: null,
        options: opts,
      }),
    ).toBe('');
  });

  it('resolves, normalizes, and guards EmrToggle state, labels, and validation', () => {
    expect(resolveEmrToggleChecked(undefined, true)).toBe(true);
    expect(resolveEmrToggleChecked(false, true)).toBe(false);
    expect(resolveEmrToggleChecked(null, true)).toBe(false);
    expect(resolveEmrToggleNext(true)).toBe(false);
    expect(resolveEmrToggleNext(false)).toBe(true);

    expect(normalizeEmrToggleVariant('inline')).toBe('inline');
    expect(normalizeEmrToggleVariant('unknown')).toBe('tile');
    expect(normalizeEmrToggleSize('sm')).toBe('sm');
    expect(normalizeEmrToggleSize('lg')).toBe('md');
    expect(normalizeEmrToggleLabelPlacement('start')).toBe('start');
    expect(normalizeEmrToggleLabelPlacement('space-between')).toBe('space-between');
    expect(normalizeEmrToggleLabelPlacement('top')).toBe('end');

    expect(canMutateEmrToggle(false, false, false)).toBe(true);
    expect(canMutateEmrToggle(true, false, false)).toBe(false);
    expect(canMutateEmrToggle(false, true, false)).toBe(false);
    expect(canMutateEmrToggle(false, false, true)).toBe(false);

    expect(resolveEmrToggleAriaChecked(true)).toBe('true');
    expect(resolveEmrToggleAriaChecked(false)).toBe('false');

    expect(resolveEmrToggleStateLabel(true)).toBe('On');
    expect(resolveEmrToggleStateLabel(false)).toBe('Off');
    expect(resolveEmrToggleStateLabel(true, 'Active', 'Inactive')).toBe('Active');
    expect(resolveEmrToggleStateLabel(false, 'Active', 'Inactive')).toBe('Inactive');
    expect(resolveEmrToggleStateLabel(true, '', '')).toBe('On');

    expect(resolveEmrToggleValidationState({})).toEqual({ isInvalid: false, hasWarning: false });
    expect(resolveEmrToggleValidationState({ invalid: true })).toEqual({ isInvalid: true, hasWarning: false });
    expect(resolveEmrToggleValidationState({ error: 'Required' })).toEqual({ isInvalid: true, hasWarning: false });
    expect(resolveEmrToggleValidationState({ warning: 'Check consent', error: 'Required' })).toEqual({
      isInvalid: true,
      hasWarning: false,
    });
    expect(resolveEmrToggleValidationState({ warning: 'Check consent' })).toEqual({
      isInvalid: false,
      hasWarning: true,
    });
  });

  it('normalizes segmented control props, validation, focus navigation, selection, and badges', () => {
    expect(normalizeEmrSegmentedSize('sm')).toBe('sm');
    expect(normalizeEmrSegmentedSize('lg')).toBe('lg');
    expect(normalizeEmrSegmentedSize('xl')).toBe('md');
    expect(normalizeEmrSegmentedVariant('outline')).toBe('outline');
    expect(normalizeEmrSegmentedVariant('soft')).toBe('soft');
    expect(normalizeEmrSegmentedVariant('other')).toBe('default');
    expect(normalizeEmrSegmentedShape('pill')).toBe('pill');
    expect(normalizeEmrSegmentedShape('square')).toBe('default');
    expect(normalizeEmrSegmentedOrientation('vertical')).toBe('vertical');
    expect(normalizeEmrSegmentedOrientation('grid')).toBe('horizontal');

    expect(resolveEmrSegmentedValidationState({})).toEqual({ isInvalid: false, hasWarning: false });
    expect(resolveEmrSegmentedValidationState({ invalid: true })).toEqual({ isInvalid: true, hasWarning: false });
    expect(resolveEmrSegmentedValidationState({ error: 'Required', warning: 'Warn' })).toEqual({
      isInvalid: true,
      hasWarning: false,
    });
    expect(resolveEmrSegmentedValidationState({ warning: 'Check laterality' })).toEqual({
      isInvalid: false,
      hasWarning: true,
    });

    const opts = [
      { value: 'od', label: 'OD' },
      { value: 'os', label: 'OS', disabled: true },
      { value: 'ou', label: 'OU', readOnly: true },
    ] as const;

    expect(isEmrSegmentedOptionDisabled(opts[1])).toBe(true);
    expect(isEmrSegmentedOptionDisabled(opts[0], true)).toBe(true);
    expect(isEmrSegmentedOptionLocked(opts[2])).toBe(true);
    expect(isEmrSegmentedOptionLocked(opts[0], false, true)).toBe(true);

    expect(resolveEmrSegmentedTabStopValue(opts, null)).toBe('od');
    expect(resolveEmrSegmentedTabStopValue(opts, 'os')).toBe('od');
    expect(resolveEmrSegmentedTabStopValue(opts, 'ou')).toBe('ou');
    expect(resolveEmrSegmentedTabStopValue(opts, 'od', true)).toBeNull();

    // readOnly option (index 2) remains arrow-navigable while disabled (index 1) is skipped
    expect(moveEmrSegmentedFocusIndex(opts, 0, 'ArrowRight')).toBe(2);
    expect(moveEmrSegmentedFocusIndex(opts, 2, 'ArrowRight')).toBe(0);
    expect(moveEmrSegmentedFocusIndex(opts, 0, 'ArrowLeft')).toBe(2);
    expect(moveEmrSegmentedFocusIndex(opts, 0, 'End')).toBe(2);
    expect(moveEmrSegmentedFocusIndex(opts, 2, 'Home')).toBe(0);
    expect(moveEmrSegmentedFocusIndex(opts, 0, 'ArrowRight', true)).toBe(-1);

    expect(canClearEmrSegmentedControl({ clearable: true, value: 'od' })).toBe(true);
    expect(canClearEmrSegmentedControl({ clearable: true, value: null })).toBe(false);
    expect(canClearEmrSegmentedControl({ clearable: true, value: 'od', readOnly: true })).toBe(false);
    expect(canClearEmrSegmentedControl({ clearable: true, value: 'od', disabled: true })).toBe(false);

    expect(resolveEmrSegmentedSelectAction({ option: opts[0], currentValue: null })).toEqual({
      kind: 'select',
      value: 'od',
    });
    expect(resolveEmrSegmentedSelectAction({ option: opts[0], currentValue: 'od', allowDeselect: false })).toEqual({
      kind: 'noop',
    });
    expect(resolveEmrSegmentedSelectAction({ option: opts[0], currentValue: 'od', allowDeselect: true })).toEqual({
      kind: 'clear',
    });
    expect(resolveEmrSegmentedSelectAction({ option: opts[2], currentValue: null })).toEqual({ kind: 'noop' });
    expect(resolveEmrSegmentedSelectAction({ option: opts[0], currentValue: null, groupReadOnly: true })).toEqual({
      kind: 'noop',
    });

    expect(formatEmrSegmentedBadge(null)).toBeNull();
    expect(formatEmrSegmentedBadge('  ')).toBeNull();
    expect(formatEmrSegmentedBadge(3, 'info')).toEqual({ text: '3', tone: 'info', variant: 'soft' });
    expect(formatEmrSegmentedBadge('Urgent', 'danger')).toEqual({ text: 'Urgent', tone: 'danger', variant: 'soft' });
    expect(formatEmrSegmentedBadge({ label: 'Due', tone: 'warning', variant: 'outline' })).toEqual({
      text: 'Due',
      tone: 'warning',
      variant: 'outline',
    });
    expect(formatEmrSegmentedBadge({ label: '', count: 120, maxCount: 99, tone: 'danger' })).toEqual({
      text: '99+',
      tone: 'danger',
      variant: 'soft',
    });
  });

  it('resolves, commits, locks, pops, clears, and ranks EmrTagInput values and suggestions', () => {
    expect(resolveEmrTagsValue(undefined, ['OD'])).toEqual(['OD']);
    expect(resolveEmrTagsValue(['OS'], ['OD'])).toEqual(['OS']);
    expect(resolveEmrTagsValue([], ['OD'])).toEqual(['OD']);
    expect(resolveEmrTagsValue(undefined, undefined, ['OU'])).toEqual(['OU']);
    expect(resolveEmrTagsValue(null, null, null)).toEqual([]);

    expect(normalizeTagInputDraft('  Penicillin  ', 6)).toBe('Penici');
    expect(normalizeTagInputDraft('   ')).toBe('');

    const committed = commitTagInputValues(['Penicillin'], 'Sulfa, Latex; penicillin, Aspirin', {
      separators: [',', ';'],
      allowDuplicates: false,
      maxTags: 3,
      maxTagLength: 8,
    });
    expect(committed).toEqual({
      next: ['Penicillin', 'Sulfa', 'Latex'],
      added: ['Sulfa', 'Latex'],
    });

    const locked = ['Penicillin'];
    expect(removeTagInputAtIndex(['Penicillin', 'Sulfa'], 0, locked)).toEqual({
      next: ['Penicillin', 'Sulfa'],
      removed: null,
    });
    expect(removeTagInputAtIndex(['Penicillin', 'Sulfa'], 1, locked)).toEqual({
      next: ['Penicillin'],
      removed: 'Sulfa',
    });

    expect(popLastUnlockedTag(['Sulfa', 'Penicillin'], locked)).toEqual({
      next: ['Penicillin'],
      removed: 'Sulfa',
      index: 0,
    });
    expect(popLastUnlockedTag(['Penicillin'], locked)).toEqual({
      next: ['Penicillin'],
      removed: null,
      index: -1,
    });

    expect(clearUnlockedTags(['Penicillin', 'Sulfa', 'Latex'], locked)).toEqual({
      next: ['Penicillin'],
      removed: ['Sulfa', 'Latex'],
    });
    expect(clearUnlockedTags(['Penicillin'], locked)).toEqual({
      next: ['Penicillin'],
      removed: [],
    });

    const ranked = rankTagSuggestions(['Penicillin', 'Sulfa', 'Latex', 'NSAIDs'], ['Penicillin'], 'la');
    expect(ranked[0]).toEqual({ value: 'Latex', isBestMatch: true });
    expect(ranked.some((r) => r.value === 'Penicillin')).toBe(false);

    const unfiltered = rankTagSuggestions(['Penicillin', 'Sulfa'], ['Penicillin'], 'la', {
      filterSuggestions: false,
    });
    expect(unfiltered).toEqual([{ value: 'Sulfa', isBestMatch: false }]);
  });

  it('normalizes, resolves, toggles, clears, and validates EmrToggleGroup state', () => {
    expect(normalizeEmrToggleGroupVariant('standard')).toBe('tile');
    expect(normalizeEmrToggleGroupVariant('card')).toBe('card');
    expect(normalizeEmrToggleGroupVariant('inline')).toBe('inline');
    expect(normalizeEmrToggleGroupSize('sm')).toBe('sm');
    expect(normalizeEmrToggleGroupSize('unknown')).toBe('md');
    expect(normalizeEmrToggleGroupOrientation('grid')).toBe('grid');
    expect(normalizeEmrToggleGroupOrientation('bad')).toBe('vertical');
    expect(normalizeEmrToggleGroupLabelPlacement(undefined)).toBe('space-between');
    expect(normalizeEmrToggleGroupLabelPlacement('start')).toBe('start');

    expect(resolveEmrToggleGroupValues({ value: ['a'], values: ['b', 'b'], multiple: true })).toEqual(['b']);
    expect(resolveEmrToggleGroupValues({ value: 'sc', multiple: false })).toEqual(['sc']);
    expect(resolveEmrToggleGroupValues({ value: null, values: ['sc'], multiple: false })).toEqual([]);

    const opts: readonly EmrOption[] = [
      { value: 'a', label: 'A', readOnly: true },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
      { value: 'none', label: 'None' },
    ];
    expect(
      toggleEmrToggleGroupValue({
        current: ['a', 'b'],
        toggledValue: 'a',
        options: opts,
        multiple: true,
      }),
    ).toEqual(['a', 'b']);

    expect(
      toggleEmrToggleGroupValue({
        current: ['a', 'b'],
        toggledValue: 'c',
        options: opts,
        multiple: true,
        maxSelections: 2,
      }),
    ).toEqual(['a', 'b']);

    expect(
      toggleEmrToggleGroupValue({
        current: ['a', 'b'],
        toggledValue: 'none',
        options: opts,
        multiple: true,
        exclusiveValues: ['none'],
      }),
    ).toEqual(['a', 'none']);

    expect(
      toggleEmrToggleGroupValue({
        current: ['b'],
        toggledValue: 'b',
        options: opts,
        multiple: false,
        allowEmpty: false,
      }),
    ).toEqual(['b']);

    expect(clearEmrToggleGroupValues(['a', 'b', 'c'], opts)).toEqual(['a']);
    expect(validateEmrToggleGroupSelection(['a'], 2, 3)).toEqual({
      valid: false,
      count: 1,
      minViolated: true,
      maxViolated: false,
      message: 'Select at least 2 options.',
    });
  });

  it('handles EmrTreeView readOnly locking, maxSelections, keywords, keyboard traversal, and EmrTreeSelect chip/summary helpers', () => {
    const richTree: readonly EmrTreeNode[] = [
      {
        id: 'ant',
        label: 'Anterior Segment',
        children: [
          { id: 'epi', label: 'Epithelium', readOnly: true, keywords: ['superficial'] },
          { id: 'stroma', label: 'Stroma', keywords: ['deep'] },
          { id: 'endo', label: 'Endothelium', disabled: true },
        ],
      },
      {
        id: 'post',
        label: 'Posterior Segment',
        children: [{ id: 'macula', label: 'Macula' }],
      },
    ];

    // Keyword search matches 'superficial' -> auto-expands 'ant'
    const kwRows = flattenVisibleTreeNodes(richTree, [], { searchQuery: 'superficial' });
    expect(kwRows.map((r) => r.node.id)).toEqual(['ant', 'epi']);

    // Locked readOnly node cannot be directly toggled
    expect(toggleTreeNodeCheck(richTree, ['epi'], 'epi', 'cascade')).toEqual(['epi']);

    // Cascade unchecking 'ant' preserves locked 'epi' while unchecking 'stroma'
    const allChecked = toggleTreeNodeCheck(richTree, ['epi'], 'ant', 'cascade');
    expect(allChecked).toEqual(['ant', 'epi', 'stroma']);
    const afterUncheck = toggleTreeNodeCheck(richTree, allChecked, 'ant', 'cascade');
    expect(afterUncheck).toEqual(['epi']);
    expect(computeTreeNodeCheckState(richTree[0]!, new Set(afterUncheck), 'cascade')).toBe('mixed');

    // maxSelections caps 'all' / 'leaf' / 'cascade'
    expect(toggleTreeNodeCheck(richTree, ['epi'], 'stroma', 'all', 1)).toEqual(['epi']);
    expect(toggleTreeNodeCheck(richTree, ['epi'], 'stroma', 'all', 2)).toEqual(['epi', 'stroma']);

    // clearTreeSelection preserves readOnly nodes
    expect(clearTreeSelection(richTree, ['ant', 'epi', 'stroma', 'macula'])).toEqual(['epi']);

    // Default expanded & keyboard traversal skip disabled rows
    expect(resolveDefaultExpandedTreeIds(richTree)).toEqual(['ant', 'post']);
    const flat = flattenVisibleTreeNodes(richTree, ['ant', 'post']);
    // flat order: 0=ant, 1=epi, 2=stroma, 3=endo (disabled), 4=post, 5=macula
    expect(findNextTreeRowIndex(flat, 2, 'ArrowDown')).toBe(4);
    expect(findNextTreeRowIndex(flat, 4, 'ArrowUp')).toBe(2);
    expect(findNextTreeRowIndex(flat, 0, 'End')).toBe(5);
    expect(findTypeaheadTreeRowIndex(flat, 'm', 0)).toBe(5);

    // removeTreeSelectionChip reconciles cascade parent and respects readOnly
    expect(removeTreeSelectionChip(richTree, ['ant', 'epi', 'stroma'], 'epi', 'cascade')).toEqual([
      'ant',
      'epi',
      'stroma',
    ]);
    expect(removeTreeSelectionChip(richTree, ['ant', 'epi', 'stroma'], 'stroma', 'cascade')).toEqual([
      'epi',
    ]);

    // buildEmrTreeSelectSummary & resolveEmrTreeSelectDefaultExpanded & isEmrTreeClearable
    const summary = buildEmrTreeSelectSummary({
      nodes: richTree,
      multiple: true,
      values: ['epi', 'macula'],
      displayMode: 'path',
      placeholder: 'Select…',
      maxTagCount: 1,
    });
    expect(summary.visibleChips.map((c) => c.id)).toEqual(['epi']);
    expect(summary.visibleChips[0]?.readOnly).toBe(true);
    expect(summary.overflowCount).toBe(1);
    expect(resolveEmrTreeSelectDefaultExpanded(richTree, 'macula')).toEqual(['post']);
    expect(
      isEmrTreeClearable({
        clearable: true,
        disabled: false,
        readOnly: false,
        multiple: true,
        values: ['epi'],
        nodes: richTree,
      }),
    ).toBe(false);
    expect(
      isEmrTreeClearable({
        clearable: true,
        disabled: false,
        readOnly: false,
        multiple: true,
        values: ['epi', 'macula'],
        nodes: richTree,
      }),
    ).toBe(true);
  });

  it('handles Menu & SplitButton gating, enabled focus traversal, and typeahead', () => {
    const items = [
      { id: 'view', label: 'View Chart' },
      { id: 'locked', label: 'Locked Action', disabled: true },
      { id: 'print', label: 'Print Summary' },
      { id: 'void', label: 'Void Order', tone: 'danger' as const, dividerBefore: true },
    ];
    expect(canOpenEmrMenu({ itemsCount: items.length })).toBe(true);
    expect(canOpenEmrMenu({ itemsCount: 0 })).toBe(false);
    expect(canOpenEmrMenu({ itemsCount: 2, readOnly: true })).toBe(false);
    expect(canOpenEmrMenu({ itemsCount: 2, disabled: true })).toBe(false);

    expect(canSelectEmrMenuItem(items[0]!)).toBe(true);
    expect(canSelectEmrMenuItem(items[1]!)).toBe(false);
    expect(canSelectEmrMenuItem(items[0]!, false, true)).toBe(false);

    expect(getEnabledMenuIndices(items)).toEqual([0, 2, 3]);
    expect(moveEmrMenuFocusIndex(items, 0, 'ArrowDown')).toBe(2);
    expect(moveEmrMenuFocusIndex(items, 2, 'ArrowUp')).toBe(0);
    expect(moveEmrMenuFocusIndex(items, 3, 'ArrowDown')).toBe(0);
    expect(moveEmrMenuFocusIndex(items, 0, 'ArrowUp')).toBe(3);
    expect(moveEmrMenuFocusIndex(items, 2, 'Home')).toBe(0);
    expect(moveEmrMenuFocusIndex(items, 0, 'End')).toBe(3);
    expect(moveEmrMenuFocusIndex([{ id: 'x', label: 'X', disabled: true }], 0, 'ArrowDown')).toBe(-1);

    expect(findEmrMenuTypeaheadIndex(items, 'p', 0)).toBe(2);
    expect(findEmrMenuTypeaheadIndex(items, 'l', 0)).toBe(-1);
    expect(findEmrMenuTypeaheadIndex(items, 'v', 0)).toBe(3);

    expect(canTriggerEmrSplitPrimary({})).toBe(true);
    expect(canTriggerEmrSplitPrimary({ loading: true })).toBe(false);
    expect(canTriggerEmrSplitPrimary({ readOnly: true })).toBe(false);
    expect(canOpenEmrSplitMenu({ itemsCount: 2 })).toBe(true);
    expect(canOpenEmrSplitMenu({ itemsCount: 2, loading: true })).toBe(false);
    expect(canOpenEmrSplitMenu({ itemsCount: 0 })).toBe(false);
  });

  it('handles Accordion expansion resolution, locking, header focus nav, and Breadcrumb selection', () => {
    const accItems = [
      { id: 'hx', title: 'History', icon: 'file' },
      { id: 'rx', title: 'Rx', disabled: true },
      { id: 'plan', title: 'Plan' },
    ];
    expect(resolveAccordionExpandedIds(accItems, ['hx', 'unknown', 'hx', 'plan'], true)).toEqual(['hx', 'plan']);
    expect(resolveAccordionExpandedIds(accItems, ['hx', 'plan'], false)).toEqual(['hx']);
    expect(canToggleAccordionItem(accItems[0]!)).toBe(true);
    expect(canToggleAccordionItem(accItems[1]!)).toBe(false);
    expect(canToggleAccordionItem(accItems[0]!, false, true)).toBe(false);
    expect(moveAccordionFocusIndex(accItems, 0, 'ArrowDown')).toBe(2);
    expect(moveAccordionFocusIndex(accItems, 2, 'ArrowUp')).toBe(0);
    expect(moveAccordionFocusIndex(accItems, 0, 'End')).toBe(2);
    expect(moveAccordionFocusIndex(accItems, 2, 'Home')).toBe(0);

    expect(canSelectEmrBreadcrumb({ disabled: false }, false)).toBe(true);
    expect(canSelectEmrBreadcrumb({ disabled: true }, false)).toBe(false);
    expect(canSelectEmrBreadcrumb({ disabled: false }, true)).toBe(false);
  });

  it('handles ColorPicker hex normalization, contrast tone, roving swatch index, and CopyButton helpers', () => {
    expect(normalizeHexColor(' #F0A ')).toBe('#ff00aa');
    expect(normalizeHexColor('2563EB')).toBe('#2563eb');
    expect(normalizeHexColor('#12')).toBeNull();
    expect(isHexColorValid('#2563eb')).toBe(true);
    expect(isHexColorValid('#ggg')).toBe(false);

    expect(getContrastCheckTone('#fde68a')).toBe('dark');
    expect(getContrastCheckTone('#dc2626')).toBe('light');
    expect(getContrastCheckTone('#0f172a')).toBe('light');
    expect(getContrastCheckTone('#ffffff')).toBe('dark');

    expect(resolveColorSwatchTabStopIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, '#2563EB')).toBe(1);
    expect(resolveColorSwatchTabStopIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, null)).toBe(0);
    expect(resolveColorSwatchTabStopIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, '#2563eb', true)).toBe(-1);

    expect(moveColorSwatchFocusIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, 0, 'ArrowRight')).toBe(1);
    expect(moveColorSwatchFocusIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, 0, 'ArrowLeft')).toBe(
      DEFAULT_CLINICAL_COLOR_SWATCHES.length - 1,
    );
    expect(moveColorSwatchFocusIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, 3, 'Home')).toBe(0);
    expect(moveColorSwatchFocusIndex(DEFAULT_CLINICAL_COLOR_SWATCHES, 3, 'End')).toBe(
      DEFAULT_CLINICAL_COLOR_SWATCHES.length - 1,
    );

    expect(canClearEmrColorPicker({ clearable: true, value: '#dc2626' })).toBe(true);
    expect(canClearEmrColorPicker({ clearable: true, value: '#dc2626', readOnly: true })).toBe(false);
    expect(canClearEmrColorPicker({ clearable: false, value: '#dc2626' })).toBe(false);
    expect(canClearEmrColorPicker({ clearable: true, value: null })).toBe(false);

    expect(canCopyEmrValue('MRN-1')).toBe(true);
    expect(canTriggerCopy('MRN-1', true)).toBe(false);
    expect(canCopyEmrValue('')).toBe(false);
    expect(resolveCopyFeedbackDurationMs(undefined)).toBe(2000);
    expect(resolveCopyFeedbackDurationMs(0)).toBe(0);
    expect(resolveCopyFeedbackDurationMs(-10)).toBe(2000);
    expect(formatCopyButtonLabel(false, 'Copy MRN', 'Copied!')).toBe('Copy MRN');
    expect(formatCopyButtonLabel(true, 'Copy MRN', 'Copied!')).toBe('Copied!');
  });
});
