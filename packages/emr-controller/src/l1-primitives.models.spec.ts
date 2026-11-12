import { describe, expect, it } from 'vitest';
import {
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  collapseBreadcrumbs,
  computeSelectAllState,
  filterOptionsLocally,
  flattenVisibleTreeNodes,
  formatTreeSelectionLabel,
  groupOptions,
  isIsoDateInRange,
  normalizeDateRangeSelection,
  rotateImage90,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
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
});
