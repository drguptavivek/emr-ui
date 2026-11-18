import { describe, expect, it } from 'vitest';
import {
  addTagValues,
  applyInputMask,
  clearUnlockedTags,
  commitTagInputValues,
  normalizeTagInputDraft,
  popLastUnlockedTag,
  rankTagSuggestions,
  removeTagInputAtIndex,
  resolveEmrTagsValue,
  applyOtpSlotEdit,
  buildEmrSelectTriggerSummary,
  canActivateEmrFieldValueRow,
  canActivateEmrStatTile,
  canClearEmrSegmentedControl,
  canMutateEmrToggle,
  canSelectEmrStage,
  canSelectEmrStatusCell,
  canTriggerEmrStatusCellAction,
  canClearRadioGroupValue,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clearCheckboxGroupValue,
  clearEmrSelectValue,
  collapseBreadcrumbs,
  computeSelectAllState,
  filterOptionsLocally,
  findNextEnabledEmrSelectOptionIndex,
  findTypeaheadEmrSelectOptionIndex,
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
  resolveEmrSegmentedSelectAction,
  resolveEmrSegmentedTabStopValue,
  resolveEmrSegmentedValidationState,
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
  toggleSelectAllValues,
  toggleTreeNodeCheck,
  validateCheckboxGroupSelection,
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
    expect(normalizeEmrSegmentedSize('lg')).toBe('md');
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
});
