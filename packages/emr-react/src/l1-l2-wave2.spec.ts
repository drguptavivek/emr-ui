import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { EmrFieldDefinition, EmrOption, EmrTreeNode } from '@drguptavivek/emr-controller';
import {
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  computeSelectAllState,
  computeTreeNodeCheckState,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  EmrAccordion,
  EmrBreadcrumbs,
  EmrCheckbox,
  EmrCheckboxGroup,
  EmrColorPicker,
  EmrCombobox,
  EmrCopyButton,
  EmrDateRangeInput,
  EmrImageCropper,
  EmrImageField,
  EmrImageUpload,
  EmrImageViewer,
  EmrLikert,
  EmrMaskedInput,
  EmrMenu,
  EmrOtpInput,
  EmrRadioGroup,
  EmrRangeSlider,
  EmrSearchSelect,
  EmrSegmentedControl,
  EmrSelect,
  EmrSlider,
  EmrSplitButton,
  EmrTagInput,
  EmrToggle,
  EmrToggleGroup,
  EmrTreeSelect,
  EmrTreeView,
  EmrTypedField,
  EmrVas,
  filterOptionsLocally,
  flattenVisibleTreeNodes,
  formatImageTransformCss,
  formatL1ByteSize,
  formatTreeSelectionLabel,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  normalizeDateRangeSelection,
  normalizeHexColor,
  normalizeOtpSlots,
  normalizeTypedField,
  resolveTreeNodePath,
  resolveTypedFieldDispatch,
  rotateImage90,
  splitTagTokens,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
} from './index';

const GROUPED_OPTIONS: readonly EmrOption[] = [
  { value: 'none', label: 'No known allergies' },
  { value: 'penicillin', label: 'Penicillin', group: 'Antibiotics', description: 'Beta-lactam class' },
  { value: 'cephalexin', label: 'Cephalexin', group: 'Antibiotics' },
  { value: 'ibuprofen', label: 'Ibuprofen', group: 'NSAIDs', description: 'COX inhibitor' },
];

const SAMPLE_TREE: readonly EmrTreeNode[] = [
  {
    id: 'ant',
    label: 'Anterior Segment',
    code: 'ANT',
    children: [
      { id: 'cornea', label: 'Cornea', code: 'COR', description: 'Epithelium & stroma' },
      { id: 'lens', label: 'Crystalline Lens', code: 'LEN' },
    ],
  },
  {
    id: 'post',
    label: 'Posterior Segment',
    code: 'POST',
    children: [
      { id: 'macula', label: 'Macula', code: 'MAC' },
      { id: 'disc', label: 'Optic Disc', code: 'ONH' },
    ],
  },
];

describe('Part 1: Upgraded L1 Primitives (EmrSelect, EmrSearchSelect, EmrRadioGroup/Scales, EmrCheckbox/Toggle/CheckboxGroup)', () => {
  it('groups options and filters locally for EmrSelect and EmrSearchSelect', () => {
    const groups = groupOptions(GROUPED_OPTIONS);
    expect(groups).toHaveLength(3);
    expect(groups[0]?.label).toBeNull();
    expect(groups[1]?.label).toBe('Antibiotics');
    expect(groups[2]?.label).toBe('NSAIDs');

    const filtered = filterOptionsLocally(GROUPED_OPTIONS, 'beta-lactam');
    expect(filtered.map(o => o.value)).toEqual(['penicillin']);

    const selectHtml = renderToStaticMarkup(
      createElement(EmrSelect, {
        label: 'Allergen',
        options: GROUPED_OPTIONS,
        value: 'penicillin',
        clearable: true,
        onValueChange: () => {},
      }),
    );
    expect(selectHtml).toContain('Penicillin');
    expect(selectHtml).toContain('Clear');

    const searchSelectHtml = renderToStaticMarkup(
      createElement(EmrSearchSelect, {
        label: 'Medication Lookup',
        options: GROUPED_OPTIONS,
        filterMode: 'local',
        query: 'pen',
        value: 'penicillin',
        clearable: true,
        allowCustomValue: true,
        open: true,
      }),
    );
    expect(searchSelectHtml).toContain('Penicillin');
    expect(searchSelectHtml).toContain('Antibiotics');
  });

  it('renders EmrRadioGroup variants, descriptions, and clearable buttons across scales', () => {
    const radioHtml = renderToStaticMarkup(
      createElement(EmrRadioGroup, {
        label: 'Severity',
        options: GROUPED_OPTIONS,
        value: 'penicillin',
        variant: 'card',
        orientation: 'grid',
        columns: 2,
        clearable: true,
        allowDeselect: true,
        onValueChange: () => {},
      }),
    );
    expect(radioHtml).toContain('Beta-lactam class');
    expect(radioHtml).toContain('Clear');

    const likertHtml = renderToStaticMarkup(
      createElement(EmrLikert, {
        label: 'Pain Likert',
        min: 0,
        max: 5,
        value: 3,
        clearable: true,
        onValueChange: () => {},
      }),
    );
    expect(likertHtml).toContain('Clear');

    const vasHtml = renderToStaticMarkup(
      createElement(EmrVas, {
        label: 'Pain VAS',
        value: 45,
        clearable: true,
        onValueChange: () => {},
      }),
    );
    expect(vasHtml).toContain('Clear');

    const segHtml = renderToStaticMarkup(
      createElement(EmrSegmentedControl, {
        ariaLabel: 'Eye Side',
        options: [
          { value: 'OD', label: 'OD' },
          { value: 'OS', label: 'OS' },
        ],
        value: 'OD',
        clearable: true,
        onValueChange: () => {},
      }),
    );
    expect(segHtml).toContain('Clear');
  });

  it('supports labelPlacement on EmrCheckbox/EmrToggle and Select All + exclusive values on EmrCheckboxGroup', () => {
    expect(computeSelectAllState(['penicillin'], GROUPED_OPTIONS, ['none'])).toBe('mixed');
    const allSelected = toggleSelectAllValues(['penicillin'], GROUPED_OPTIONS, ['none']);
    expect(allSelected).toEqual(['penicillin', 'cephalexin', 'ibuprofen']);
    expect(computeSelectAllState(allSelected, GROUPED_OPTIONS, ['none'])).toBe('all');

    const afterExclusive = toggleCheckboxGroupValue(allSelected, 'none', GROUPED_OPTIONS, ['none']);
    expect(afterExclusive).toEqual(['none']);

    const afterRegular = toggleCheckboxGroupValue(['none'], 'ibuprofen', GROUPED_OPTIONS, ['none']);
    expect(afterRegular).toEqual(['ibuprofen']);

    const cbHtml = renderToStaticMarkup(
      createElement(EmrCheckbox, {
        label: 'Confirm fasting',
        checked: true,
        labelPlacement: 'space-between',
        onCheckedChange: () => {},
      }),
    );
    expect(cbHtml).toContain('Confirm fasting');

    const toggleHtml = renderToStaticMarkup(
      createElement(EmrToggle, {
        label: 'Dilated exam',
        checked: true,
        labelPlacement: 'start',
        onLabel: 'Dilated',
        offLabel: 'Undilated',
        onCheckedChange: () => {},
      }),
    );
    expect(toggleHtml).toContain('Dilated');

    const groupHtml = renderToStaticMarkup(
      createElement(EmrCheckboxGroup, {
        label: 'Allergies',
        options: GROUPED_OPTIONS,
        value: ['penicillin'],
        showSelectAll: true,
        selectAllLabel: 'Select all drugs',
        exclusiveValues: ['none'],
        variant: 'card',
        orientation: 'grid',
        columns: 2,
        onValueChange: () => {},
      }),
    );
    expect(groupHtml).toContain('Select all drugs');
    expect(groupHtml).toContain('Beta-lactam class');
  });
});

describe('Part 2: All 20 New Wave 2 Components & Logic', () => {
  it('1. EmrToggleGroup renders single and multi-select toggle buttons', () => {
    const html = renderToStaticMarkup(
      createElement(EmrToggleGroup, {
        label: 'Visual Acuity Conditions',
        multiple: true,
        options: [
          { value: 'sc', label: 'Without correction' },
          { value: 'cc', label: 'With correction' },
          { value: 'ph', label: 'Pinhole' },
        ],
        values: ['cc', 'ph'],
        clearable: true,
      }),
    );
    expect(html).toContain('With correction');
    expect(html).toContain('Pinhole');
  });

  it('2 & 3. EmrTreeView and EmrTreeSelect flatten, cascade check states, and render paths', () => {
    expect(collectAllExpandableTreeIds(SAMPLE_TREE)).toEqual(['ant', 'post']);
    const flat = flattenVisibleTreeNodes(SAMPLE_TREE, ['ant'], {
      selectedIds: ['cornea'],
      checkStrategy: 'cascade',
    });
    expect(flat.map(r => r.node.id)).toEqual(['ant', 'cornea', 'lens', 'post']);
    expect(flat[0]?.checkState).toBe('mixed');

    const cascaded = toggleTreeNodeCheck(SAMPLE_TREE, [], 'ant', 'cascade');
    expect(cascaded).toEqual(['ant', 'cornea', 'lens']);
    expect(computeTreeNodeCheckState(SAMPLE_TREE[0]!, new Set(cascaded), 'cascade')).toBe('checked');

    expect(resolveTreeNodePath(SAMPLE_TREE, 'macula').map(n => n.id)).toEqual(['post', 'macula']);
    expect(formatTreeSelectionLabel(SAMPLE_TREE, 'macula', 'path')).toBe('Posterior Segment / Macula');
    expect(formatTreeSelectionLabel(SAMPLE_TREE, 'macula', 'leaf')).toBe('Macula');

    const treeViewHtml = renderToStaticMarkup(
      createElement(EmrTreeView, {
        label: 'Ocular Anatomy',
        nodes: SAMPLE_TREE,
        multiple: true,
        values: ['cornea'],
        expandedIds: ['ant', 'post'],
        searchable: true,
        showExpandControls: true,
        clearable: true,
      }),
    );
    expect(treeViewHtml).toContain('Anterior Segment');
    expect(treeViewHtml).toContain('Cornea');

    const treeSelectHtml = renderToStaticMarkup(
      createElement(EmrTreeSelect, {
        label: 'Target Structure',
        nodes: SAMPLE_TREE,
        value: 'macula',
        displayMode: 'path',
      }),
    );
    expect(treeSelectHtml).toContain('Posterior Segment / Macula');
  });

  it('4, 5, 6 & 20. EmrImageViewer, EmrImageCropper, EmrImageUpload, and L2 EmrImageField', () => {
    expect(stepImageZoom(1, 0.25)).toBe(1.25);
    expect(rotateImage90(0, true)).toBe(90);
    expect(rotateImage90(-90, false)).toBe(180);
    expect(clampStraightenAngle(48.24)).toBe(48.2);
    expect(formatImageTransformCss(DEFAULT_IMAGE_VIEWPORT)).toContain('rotate(0deg)');
    expect(DEFAULT_ASPECT_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(clampCropRect(DEFAULT_IMAGE_CROP_TRANSFORM.rect, 1)).toEqual({
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
    });
    expect(formatL1ByteSize(2048)).toBe('2.0 KB');

    const viewerHtml = renderToStaticMarkup(
      createElement(EmrImageViewer, {
        label: 'Fundus Photo',
        src: 'data:image/png;base64,iVBORw0KGgo=',
        alt: 'OD Fundus',
        caption: 'Baseline macula',
      }),
    );
    expect(viewerHtml).toContain('Baseline macula');
    expect(viewerHtml).toContain('100%');

    const cropperHtml = renderToStaticMarkup(
      createElement(EmrImageCropper, {
        label: 'Crop Disc Photo',
        src: 'data:image/png;base64,iVBORw0KGgo=',
      }),
    );
    expect(cropperHtml).toContain('Apply crop');
    expect(cropperHtml).toContain('1:1 Square');

    const sampleItems = [
      {
        id: 'img-1',
        name: 'fundus-od.png',
        src: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        sizeBytes: 15360,
        caption: 'OD baseline',
      },
    ];

    const uploadHtml = renderToStaticMarkup(
      createElement(EmrImageUpload, {
        label: 'Slit Lamp Captures',
        items: sampleItems,
      }),
    );
    expect(uploadHtml).toContain('fundus-od.png');
    expect(uploadHtml).toContain('Crop / Rotate');

    const l2FieldHtml = renderToStaticMarkup(
      createElement(EmrImageField, {
        model: {
          label: 'Anterior Segment Photos',
          items: sampleItems,
          status: 'verified',
        },
      }),
    );
    expect(l2FieldHtml).toContain('Anterior Segment Photos');
    expect(l2FieldHtml).toContain('fundus-od.png');
  });

  it('7, 8 & 9. EmrDateRangeInput, EmrCombobox, and EmrTagInput', () => {
    const r1 = normalizeDateRangeSelection(null, '2026-04-10');
    expect(r1).toEqual({ start: '2026-04-10', end: null });
    const r2 = normalizeDateRangeSelection(r1, '2026-04-02');
    expect(r2).toEqual({ start: '2026-04-02', end: '2026-04-10' });
    expect(isIsoDateInRange('2026-04-05', r2)).toBe(true);
    expect(isIsoRangeEdge('2026-04-02', r2)).toBe('start');

    const dateRangeHtml = renderToStaticMarkup(
      createElement(EmrDateRangeInput, {
        label: 'Admission Window',
        value: r2,
        presets: [{ id: '7d', label: 'Last 7 days', range: r2 }],
      }),
    );
    expect(dateRangeHtml).toContain('Last 7 days');

    const comboHtml = renderToStaticMarkup(
      createElement(EmrCombobox, {
        label: 'Chief Complaint',
        options: GROUPED_OPTIONS,
        value: 'Blurred vision',
      }),
    );
    expect(comboHtml).toContain('Chief Complaint');

    expect(splitTagTokens('glaucoma, cataract; uveitis')).toEqual([
      'glaucoma',
      'cataract',
      'uveitis',
    ]);
    expect(
      addTagValues(['glaucoma'], ['Glaucoma', 'cataract', 'myopia'], {
        allowDuplicates: false,
        maxTags: 2,
      }),
    ).toEqual(['glaucoma', 'cataract']);

    const tagHtml = renderToStaticMarkup(
      createElement(EmrTagInput, {
        label: 'Clinical Tags',
        values: ['Glaucoma', 'Pseudophakia'],
        suggestions: ['Dry Eye', 'AMD'],
      }),
    );
    expect(tagHtml).toContain('Glaucoma');
    expect(tagHtml).toContain('Pseudophakia');
  });

  it('10, 11, 12 & 13. EmrSlider, EmrRangeSlider, EmrMaskedInput, and EmrOtpInput', () => {
    expect(clampSliderValue(23, 0, 100, 5)).toBe(25);
    expect(clampRangeSliderPair(60, 40, 0, 100, 5, 10, 'low')).toEqual([30, 40]);

    const maskRes = applyInputMask('123456789', '999-99-9999');
    expect(maskRes).toEqual({
      masked: '123-45-6789',
      unmasked: '123456789',
      complete: true,
    });

    expect(normalizeOtpSlots('42', 4)).toEqual(['4', '2', '', '']);
    const otpEdit = applyOtpSlotEdit('12', 2, '3456', 6, true);
    expect(otpEdit.value).toBe('123456');
    expect(otpEdit.completed).toBe(true);

    const sliderHtml = renderToStaticMarkup(
      createElement(EmrSlider, {
        label: 'IOP Target',
        value: 16,
        min: 8,
        max: 30,
        unit: 'mmHg',
        marks: [{ value: 12, label: '12 mmHg' }, { value: 21, label: '21 mmHg' }],
      }),
    );
    expect(sliderHtml).toContain('16 mmHg');

    const rangeSliderHtml = renderToStaticMarkup(
      createElement(EmrRangeSlider, {
        label: 'Target Range',
        value: [12, 18],
        min: 8,
        max: 30,
        unit: 'mmHg',
      }),
    );
    expect(rangeSliderHtml).toContain('12 mmHg');
    expect(rangeSliderHtml).toContain('18 mmHg');

    const maskedHtml = renderToStaticMarkup(
      createElement(EmrMaskedInput, {
        label: 'MRN Code',
        mask: 'AA-9999',
        value: 'EM4821',
      }),
    );
    expect(maskedHtml).toContain('AA-9999');

    const otpHtml = renderToStaticMarkup(
      createElement(EmrOtpInput, {
        label: 'e-Sign PIN',
        length: 6,
        value: '904218',
      }),
    );
    expect(otpHtml).toContain('e-Sign PIN');
  });

  it('14, 15, 16, 17, 18 & 19. EmrMenu, EmrSplitButton, EmrAccordion, EmrBreadcrumbs, EmrColorPicker, and EmrCopyButton', () => {
    expect(toggleAccordionId(['a'], 'b', false)).toEqual(['b']);
    expect(toggleAccordionId(['a'], 'b', true)).toEqual(['a', 'b']);

    const crumbs = [
      { id: 'c1', label: 'Department' },
      { id: 'c2', label: 'Retina Clinic' },
      { id: 'c3', label: 'Patient #402' },
      { id: 'c4', label: 'OCT Scan' },
    ];
    const collapsed = collapseBreadcrumbs(crumbs, 3);
    expect(collapsed.leading.map(c => c.id)).toEqual(['c1']);
    expect(collapsed.hidden.map(c => c.id)).toEqual(['c2']);
    expect(collapsed.trailing.map(c => c.id)).toEqual(['c3', 'c4']);

    expect(normalizeHexColor('#f0a')).toBe('#ff00aa');
    expect(DEFAULT_CLINICAL_COLOR_SWATCHES.length).toBeGreaterThanOrEqual(6);

    const menuItems = [
      { id: 'sign', label: 'Sign encounter', shortcut: '⌘Enter' },
      { id: 'void', label: 'Void draft', tone: 'danger' as const, dividerBefore: true },
    ];

    const menuHtml = renderToStaticMarkup(
      createElement(EmrMenu, {
        triggerLabel: 'Encounter Actions',
        items: menuItems,
        open: true,
      }),
    );
    expect(menuHtml).toContain('Sign encounter');
    expect(menuHtml).toContain('Void draft');

    const splitHtml = renderToStaticMarkup(
      createElement(EmrSplitButton, {
        label: 'Finalize Order',
        items: menuItems,
        defaultOpen: true,
      }),
    );
    expect(splitHtml).toContain('Finalize Order');
    expect(splitHtml).toContain('Sign encounter');

    const accHtml = renderToStaticMarkup(
      createElement(EmrAccordion, {
        items: [
          {
            id: 'hpi',
            title: 'History of Present Illness',
            subtitle: 'Recorded by resident',
            content: 'Gradual painless vision loss OU',
          },
        ],
        defaultExpandedIds: ['hpi'],
      }),
    );
    expect(accHtml).toContain('History of Present Illness');
    expect(accHtml).toContain('Gradual painless vision loss OU');

    const breadHtml = renderToStaticMarkup(
      createElement(EmrBreadcrumbs, {
        items: crumbs,
        maxItems: 3,
      }),
    );
    expect(breadHtml).toContain('Department');
    expect(breadHtml).toContain('OCT Scan');

    const colorHtml = renderToStaticMarkup(
      createElement(EmrColorPicker, {
        label: 'Annotation Ink',
        value: '#dc2626',
      }),
    );
    expect(colorHtml).toContain('Arterial Red');

    const copyHtml = renderToStaticMarkup(
      createElement(EmrCopyButton, {
        value: 'MRN-2026-8841',
        label: 'Copy MRN',
      }),
    );
    expect(copyHtml).toContain('Copy MRN');
  });

  it('dispatches all 7 Wave 2 widget hints in EmrTypedField', () => {
    expect(resolveTypedFieldDispatch('select', 'tree-select', 0)).toBe('tree-select');
    expect(resolveTypedFieldDispatch('text', 'combobox', 4)).toBe('combobox');
    expect(resolveTypedFieldDispatch('multiselect', 'tag-input', 0)).toBe('tag-input');
    expect(resolveTypedFieldDispatch('attachment', 'image-upload', 0)).toBe('image-upload');
    expect(resolveTypedFieldDispatch('decimal', 'slider', 0)).toBe('slider');
    expect(resolveTypedFieldDispatch('text', 'masked', 0)).toBe('masked');
    expect(resolveTypedFieldDispatch('text', 'otp', 0)).toBe('otp');

    const treeDef: EmrFieldDefinition = {
      schemaVersion: '1.0',
      contract: {
        linkId: 'anat-site',
        valueType: 'select',
        cardinality: { min: 0, max: 1 },
        terminology: [],
        validation: [],
      },
      presentation: {
        label: 'Anatomical Site',
        widget: 'tree-select',
        treeNodes: SAMPLE_TREE,
      },
    };
    const norm = normalizeTypedField(treeDef, {
      value: 'cornea',
      touched: false,
      dirty: false,
      enabled: true,
      visible: true,
      messages: [],
    });
    expect(norm.dispatchKind).toBe('tree-select');
    expect(norm.treeNodes).toHaveLength(2);

    const html = renderToStaticMarkup(
      createElement(EmrTypedField, {
        controlId: 'tf-tree',
        definition: treeDef,
        model: {
          value: 'cornea',
          touched: false,
          dirty: false,
          enabled: true,
          visible: true,
          messages: [],
        },
        onValueChange: () => {},
      }),
    );
    expect(html).toContain('Anterior Segment / Cornea');
  });
});
