import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type {
  EmrFieldDefinition,
  EmrFieldState,
} from '@drguptavivek/emr-controller';
import {
  AssessmentStatusStrip,
  computePrecisionStep,
  deriveAvatarInitials,
  EmrAddressField,
  EmrAttachmentField,
  EmrAttestation,
  EmrAvatar,
  EmrBadge,
  EmrButton,
  EmrCheckbox,
  EmrCheckboxGroup,
  EmrChip,
  EmrCodedInput,
  EmrDateInput,
  EmrDialog,
  EmrDurationInput,
  EmrFieldFrame,
  EmrFileTrigger,
  EmrIconButton,
  EmrIdentifierEntry,
  EmrLateralityField,
  EmrMacroTextField,
  EmrNumericStepper,
  EmrPagination,
  EmrPairedField,
  EmrPartialDateField,
  EmrPasswordInput,
  EmrPhoneInput,
  EmrPopover,
  EmrProgressBar,
  EmrRangeField,
  EmrRefractionField,
  EmrScaleField,
  EmrSearchInput,
  EmrSegmentedControl,
  EmrSelect,
  EmrSignatureCaptureField,
  EmrSkeleton,
  EmrSpinner,
  EmrTextarea,
  EmrToast,
  EmrToggle,
  EmrTooltip,
  EmrTypedField,
  EmrVisualAcuityField,
  emrDarkTokens,
  emrLightTokens,
  isEmrIconName,
  isIsoDateOutOfBounds,
  localDateTimeToUtcIso,
  normalizeTypedField,
  resolveButtonPalette,
  resolveControlledDateTimeParts,
  resolveControlledNumberDraft,
  resolveControlledTemporalDraft,
  resolveTypedFieldDispatch,
  toLocalDateTimeInputValue,
} from './index';
import { buildCalendarMonthGrid, joinDateTime, splitDateTime } from './l1-inputs.logic';
import {
  adaptPartialDatePrecision,
  buildScaleAnchors,
  computeSignatureSegments,
  extractTrailingMacroToken,
  formatByteSize,
  signaturePolylinePoints,
} from './l2-fields.logic';
import {
  coerceAttachmentRefs,
  coerceCodedValues,
  coercePartialDate,
  coerceSignatureStrokes,
} from './typed-field.logic';

describe('L1 controlled draft reversion & readOnly rollback', () => {
  it('reverts rejected numeric drafts on blur and immediately when locked readOnly', () => {
    // While actively editing, keep in-progress draft (e.g. "12.")
    expect(
      resolveControlledNumberDraft({ draft: '12.', value: 7, focused: true, editable: true })
    ).toBe('12.');
    // On blur, if controller rejected the edit and kept value=7, snap back to "7"
    expect(
      resolveControlledNumberDraft({ draft: '999', value: 7, focused: false, editable: true })
    ).toBe('7');
    // Locking readOnly while focused immediately rolls back to accepted prop value
    expect(
      resolveControlledNumberDraft({ draft: '12.', value: 7, focused: true, editable: false })
    ).toBe('7');
    expect(
      resolveControlledNumberDraft({
        draft: '80',
        value: { value: 72, unit: 'bpm' },
        focused: false,
        editable: true,
      })
    ).toBe('72');
  });

  it('reverts rejected temporal drafts on blur while preserving incomplete drafts until valid/empty or readOnly', () => {
    // Valid typed date rejected by controller -> reverts to formatted prop value on blur
    expect(
      resolveControlledTemporalDraft({
        draft: '12-10-2026',
        value: '2026-03-05',
        mode: 'dd-mm-yyyy',
        focused: false,
        editable: true,
      })
    ).toBe('05-03-2026');

    // Incomplete draft stays visible on blur when editable so invalid highlight shows why nothing emitted
    expect(
      resolveControlledTemporalDraft({
        draft: '31-02-2026',
        value: '2026-03-05',
        mode: 'dd-mm-yyyy',
        focused: false,
        editable: true,
      })
    ).toBe('31-02-2026');

    // ReadOnly immediately discards any incomplete draft
    expect(
      resolveControlledTemporalDraft({
        draft: '31-02-2026',
        value: '2026-03-05',
        mode: 'dd-mm-yyyy',
        focused: false,
        editable: false,
      })
    ).toBe('05-03-2026');

    // Time with seconds
    expect(
      resolveControlledTemporalDraft({
        draft: '14:45:30',
        value: '08:15:00',
        mode: 'time-seconds',
        focused: false,
        editable: true,
      })
    ).toBe('08:15:00');
  });

  it('discards half-typed datetime parts when locked readOnly and snaps complete edits on blur', () => {
    const utc = joinDateTime('2026-03-05', '09:30')!;
    // Half-typed date without time stays while editable and blurred
    expect(
      resolveControlledDateTimeParts({
        parts: { date: '2026-04-01', time: null },
        value: null,
        withSeconds: false,
        focused: false,
        editable: true,
      })
    ).toEqual({ date: '2026-04-01', time: null });

    // ReadOnly immediately discards half-typed draft
    expect(
      resolveControlledDateTimeParts({
        parts: { date: '2026-04-01', time: null },
        value: null,
        withSeconds: false,
        focused: false,
        editable: false,
      })
    ).toEqual({ date: null, time: null });

    // Rejected complete edit reverts to accepted UTC instant on blur
    expect(
      resolveControlledDateTimeParts({
        parts: { date: '2026-12-31', time: '23:59' },
        value: utc,
        withSeconds: false,
        focused: false,
        editable: true,
      })
    ).toEqual({ date: '2026-03-05', time: '09:30' });
  });
});

describe('Datetime UTC <-> local wall-clock wire-format round-trip', () => {
  it('round-trips local wall-clock datetime through canonical UTC ISO-8601 without stripping Z naively', () => {
    const utc = localDateTimeToUtcIso('2026-10-14T15:45');
    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(toLocalDateTimeInputValue(utc, 'minute')).toBe('2026-10-14T15:45');

    const utcSec = localDateTimeToUtcIso('2026-10-14T15:45:22');
    expect(toLocalDateTimeInputValue(utcSec, 'second')).toBe('2026-10-14T15:45:22');
    expect(splitDateTime(utcSec, true)).toEqual({ date: '2026-10-14', time: '15:45:22' });
  });
});

describe('Precision -> step & ISO date bounds', () => {
  it('computes step from integer/decimal/quantity type, precision, and explicit step', () => {
    expect(computePrecisionStep('integer')).toBe(1);
    expect(computePrecisionStep('integer', 2)).toBe(1);
    expect(computePrecisionStep('decimal', 0)).toBe(1);
    expect(computePrecisionStep('decimal', 1)).toBe(0.1);
    expect(computePrecisionStep('decimal', 2)).toBe(0.01);
    expect(computePrecisionStep('quantity', 3)).toBe(0.001);
    expect(computePrecisionStep('decimal', 2, 0.25)).toBe(0.25);
    expect(computePrecisionStep('decimal')).toBe(0.01);
  });

  it('enforces ISO min/max bounds across day, month, and year precisions and disables calendar cells', () => {
    expect(isIsoDateOutOfBounds('2026-03-04', '2026-03-05', '2026-03-20', 'day')).toBe(true);
    expect(isIsoDateOutOfBounds('2026-03-05', '2026-03-05', '2026-03-20', 'day')).toBe(false);
    expect(isIsoDateOutOfBounds('2026-03-21', '2026-03-05', '2026-03-20', 'day')).toBe(true);
    expect(isIsoDateOutOfBounds('2026-02', '2026-03-05', '2026-11-10', 'month')).toBe(true);
    expect(isIsoDateOutOfBounds('2026-03', '2026-03-05', '2026-11-10', 'month')).toBe(false);
    expect(isIsoDateOutOfBounds('2025', '2026-01-01', '2028-12-31', 'year')).toBe(true);

    const grid = buildCalendarMonthGrid(2026, 3, '2026-03-10', '2026-03-10', '2026-03-05', '2026-03-20');
    expect(grid.find(c => c.iso === '2026-03-04')?.isDisabled).toBe(true);
    expect(grid.find(c => c.iso === '2026-03-10')?.isDisabled).toBe(false);
    expect(grid.find(c => c.iso === '2026-03-25')?.isDisabled).toBe(true);
  });
});

describe('L1 visual contrast, avatar initials, and icon registry', () => {
  it('ensures outline and ghost EmrButton variants use legible foreground colors in both light and dark themes', () => {
    for (const theme of [emrLightTokens, emrDarkTokens]) {
      const outline = resolveButtonPalette(theme, 'outline', false);
      expect(outline.textColor).toBe(theme.primary);
      expect(outline.textColor).not.toBe(theme.primaryContrast);

      const ghost = resolveButtonPalette(theme, 'ghost', false);
      expect(ghost.textColor).toBe(theme.text);
      expect(ghost.textColor).not.toBe(theme.primaryContrast);

      const danger = resolveButtonPalette(theme, 'danger', false);
      expect(danger.textColor).toBe(theme.danger);
    }
  });

  it('derives initials deterministically (stripping clinical honorifics) and validates expanded L1 icon names', () => {
    expect(deriveAvatarInitials('Dr. Ananya Sharma')).toBe('AS');
    expect(deriveAvatarInitials('Rohan')).toBe('RO');
    expect(deriveAvatarInitials('   ')).toBe('?');
    expect(deriveAvatarInitials('Ananya Sharma', 'dr')).toBe('DR');

    for (const icon of ['upload', 'camera', 'paperclip', 'phone', 'mic', 'close']) {
      expect(isEmrIconName(icon)).toBe(true);
    }
    expect(isEmrIconName('not-an-icon')).toBe(false);
  });
});

describe('L2 pure helpers & EmrTypedField unified contract dispatch', () => {
  it('handles macro trigger extraction, partial date adaptation, scale anchors, byte formatting, and signature geometry', () => {
    expect(extractTrailingMacroToken('Fundus: .mac')).toBe('.mac');
    expect(extractTrailingMacroToken('/norm')).toBe('/norm');
    expect(extractTrailingMacroToken('IOP 14.5')).toBeNull();
    expect(extractTrailingMacroToken('VA 6/12')).toBeNull();

    expect(adaptPartialDatePrecision({ value: '2026-08-19', precision: 'day' }, 'month')).toEqual({
      value: '2026-08',
      precision: 'month',
    });
    expect(adaptPartialDatePrecision({ value: '2026', precision: 'year' }, 'day')).toEqual({
      value: '2026-01-01',
      precision: 'day',
    });

    expect(
      buildScaleAnchors(0, 10, { minLabel: 'No pain', midLabel: 'Moderate', maxLabel: 'Worst' })
    ).toEqual([
      { value: 0, label: 'No pain' },
      { value: 5, label: 'Moderate' },
      { value: 10, label: 'Worst' },
    ]);

    expect(formatByteSize(512)).toBe('512 B');
    expect(formatByteSize(2048)).toBe('2.0 KB');
    expect(formatByteSize(3 * 1024 * 1024)).toBe('3.0 MB');

    const stroke = { points: [{ x: 10, y: 20 }, { x: 40, y: 60 }] };
    expect(signaturePolylinePoints(stroke)).toBe('10,20 40,60');
    const segs = computeSignatureSegments(stroke, 0);
    expect(segs).toHaveLength(1);
    expect(segs[0]?.length).toBeCloseTo(50, 5);
    expect(segs[0]?.cx).toBe(25);
    expect(segs[0]?.cy).toBe(40);
  });

  it('dispatches every EmrValueType + EmrWidgetHint combination and normalizes unified EmrFieldDefinition + EmrFieldState', () => {
    expect(resolveTypedFieldDispatch('multiline', undefined, 0)).toBe('textarea');
    expect(resolveTypedFieldDispatch('text', 'textarea', 0)).toBe('textarea');
    expect(resolveTypedFieldDispatch('text', 'search', 0)).toBe('search-input');
    expect(resolveTypedFieldDispatch('integer', 'stepper', 0)).toBe('numeric-stepper');
    expect(resolveTypedFieldDispatch('decimal', 'likert', 0)).toBe('likert');
    expect(resolveTypedFieldDispatch('decimal', 'vas', 0)).toBe('vas');
    expect(resolveTypedFieldDispatch('boolean', 'checkbox', 0)).toBe('checkbox');
    expect(resolveTypedFieldDispatch('boolean', 'toggle', 0)).toBe('toggle');
    expect(resolveTypedFieldDispatch('boolean', 'segmented', 0)).toBe('boolean-segmented');
    expect(resolveTypedFieldDispatch('partial-date', undefined, 0)).toBe('partial-date');
    expect(resolveTypedFieldDispatch('select', 'radio', 3)).toBe('radio-group');
    expect(resolveTypedFieldDispatch('select', 'segmented', 3)).toBe('segmented-control');
    expect(resolveTypedFieldDispatch('select', 'search-select', 10)).toBe('search-select');
    expect(resolveTypedFieldDispatch('multiselect', 'checkbox', 4)).toBe('checkbox-group');
    expect(resolveTypedFieldDispatch('coded', undefined, 0)).toBe('coded-input');
    expect(resolveTypedFieldDispatch('coded', 'chips', 3)).toBe('coded-choice');
    expect(resolveTypedFieldDispatch('scale', 'likert', 0)).toBe('scale-field');
    expect(resolveTypedFieldDispatch('attachment', undefined, 0)).toBe('attachment-field');
    expect(resolveTypedFieldDispatch('annotation', 'signature', 0)).toBe('signature-capture');

    const unifiedDef: EmrFieldDefinition = {
      contract: {
        linkId: 'corneal-pachymetry',
        valueType: 'decimal',
        cardinality: { min: 1, max: 1 },
      },
      presentation: {
        label: 'Central corneal thickness',
        hint: 'Measured in micrometres',
        precision: 1,
        unitDisplay: 'µm',
        widget: 'stepper',
      },
    };
    const unifiedState: EmrFieldState = {
      value: 540.5,
      touched: true,
      dirty: true,
      visible: true,
      enabled: true,
      messages: [
        { code: 'THIN', severity: 'warning', message: 'Borderline thin cornea' },
        { code: 'REF', severity: 'info', message: 'Compare with fellow eye' },
      ],
    };

    const norm = normalizeTypedField(unifiedDef, unifiedState);
    expect(norm.id).toBe('corneal-pachymetry');
    expect(norm.dispatchKind).toBe('numeric-stepper');
    expect(norm.step).toBe(0.1);
    expect(norm.required).toBe(true);
    expect(norm.hint).toBe('Measured in micrometres');
    expect(norm.warning).toBe('Borderline thin cornea');
    expect(norm.info).toBe('Compare with fellow eye');
    expect(norm.messages).toHaveLength(2);

    expect(coercePartialDate('2026-07')).toEqual({ value: '2026-07', precision: 'month' });
    expect(coerceCodedValues({ system: 's', code: 'c', display: 'd' })).toHaveLength(1);
    expect(coerceAttachmentRefs([{ id: '1', title: 'OCT.pdf', contentType: 'application/pdf' }])).toHaveLength(1);
    expect(coerceSignatureStrokes([{ points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }])).toHaveLength(1);
  });
});

describe('SSR HTML & ARIA smoke suite across all L1 primitives and L2 fields', () => {
  it('renders static EmrBadge without role="status" while EmrToast and EmrSpinner announce status/alert', () => {
    const badgeHtml = renderToStaticMarkup(
      createElement(EmrBadge, { badge: { label: 'MRSA', tone: 'danger', assistiveText: 'Alert: MRSA' } })
    );
    expect(badgeHtml).toContain('MRSA');
    expect(badgeHtml).not.toContain('role="status"');

    const toastHtml = renderToStaticMarkup(
      createElement(EmrToast, {
        model: { id: 't1', message: 'Saved', tone: 'success' },
        onIntent: () => {},
      })
    );
    expect(toastHtml).toContain('role="status"');

    const spinnerHtml = renderToStaticMarkup(createElement(EmrSpinner, { label: 'Syncing chart' }));
    expect(spinnerHtml).toContain('role="status"');
    expect(spinnerHtml).toContain('Syncing chart');
  });

  it('keeps hint visible alongside error, warning, info, and validation messages in EmrFieldFrame', () => {
    const html = renderToStaticMarkup(
      createElement(
        EmrFieldFrame,
        {
          controlId: 'iop-od',
          label: 'IOP OD',
          hint: 'Applanation tonometry in mmHg',
          warning: 'Above 21 mmHg',
          error: 'Confirm repeat reading',
          messages: [{ code: 'I1', severity: 'info', message: 'Baseline 16 mmHg' }],
        },
        createElement('span', null, 'control')
      )
    );
    expect(html).toContain('Applanation tonometry in mmHg');
    expect(html).toContain('Above 21 mmHg');
    expect(html).toContain('Confirm repeat reading');
    expect(html).toContain('Baseline 16 mmHg');
  });

  it('renders all 16 new L1 primitives and upgraded existing L1 primitives cleanly', () => {
    const noop = () => {};
    const fragments = [
      renderToStaticMarkup(createElement(EmrButton, { variant: 'outline', size: 'md', label: 'Outline' })),
      renderToStaticMarkup(createElement(EmrButton, { variant: 'danger', loading: true, label: 'Delete' })),
      renderToStaticMarkup(
        createElement(EmrSelect, {
          label: 'Route',
          value: 'po',
          options: [{ value: 'po', label: 'Oral' }],
          hint: 'Administration route',
          onValueChange: noop,
        })
      ),
      renderToStaticMarkup(createElement(EmrCheckbox, { label: 'Fasting', checked: true, onCheckedChange: noop })),
      renderToStaticMarkup(createElement(EmrToggle, { label: 'Bedside', checked: false, onCheckedChange: noop })),
      renderToStaticMarkup(createElement(EmrChip, { label: 'Latex', removable: true, onRemove: noop })),
      renderToStaticMarkup(
        createElement(EmrDateInput, { label: 'DOB', value: '2000-01-15', min: '1900-01-01', max: '2026-12-31', onValueChange: noop })
      ),
      renderToStaticMarkup(createElement(EmrTextarea, { label: 'History', value: 'Gradual blur', maxLength: 500, onValueChange: noop })),
      renderToStaticMarkup(createElement(EmrIconButton, { icon: 'camera', label: 'Capture fundus', onPress: noop })),
      renderToStaticMarkup(
        createElement(EmrSegmentedControl, {
          label: 'Eye',
          value: 'OD',
          options: [
            { value: 'OD', label: 'OD' },
            { value: 'OS', label: 'OS' },
          ],
          onValueChange: noop,
        })
      ),
      renderToStaticMarkup(createElement(EmrSearchInput, { label: 'Search ICD', value: 'glaucoma', loading: true, onValueChange: noop })),
      renderToStaticMarkup(createElement(EmrPasswordInput, { label: 'PIN', value: 'secret', onValueChange: noop })),
      renderToStaticMarkup(createElement(EmrNumericStepper, { label: 'Drops', value: 2, min: 0, max: 10, step: 1, unit: 'gtt', onValueChange: noop })),
      renderToStaticMarkup(
        createElement(EmrCheckboxGroup, {
          label: 'Symptoms',
          value: ['glare'],
          options: [
            { value: 'glare', label: 'Glare' },
            { value: 'halos', label: 'Halos' },
          ],
          onValueChange: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrPagination, {
          page: 2,
          pageSize: 25,
          totalItems: 120,
          pageSizeOptions: [25, 50],
          onPageChange: noop,
          onPageSizeChange: noop,
        })
      ),
      renderToStaticMarkup(createElement(EmrFileTrigger, { label: 'Attach OCT', onFilesSelected: noop })),
      renderToStaticMarkup(
        createElement(
          EmrPopover,
          { open: false, onCloseRequested: noop, trigger: createElement('button', { type: 'button' }, 'Open') },
          createElement('span', null, 'Popover content')
        )
      ),
      renderToStaticMarkup(createElement(EmrTooltip, { content: 'Intraocular pressure' }, createElement('span', null, 'IOP'))),
      renderToStaticMarkup(createElement(EmrProgressBar, { label: 'Upload progress', value: 65 })),
      renderToStaticMarkup(createElement(EmrSkeleton, { variant: 'line', lines: 3 })),
      renderToStaticMarkup(createElement(EmrAvatar, { name: 'Dr. Vivek Gupta' })),
    ];

    // RNW Modal portals to document.body on client and safely returns '' in DOM-less Node SSR
    const dialogSsr = renderToStaticMarkup(
      createElement(EmrDialog, { open: true, title: 'Confirm sign-off', onCloseRequested: noop }, createElement('span', null, 'Body'))
    );
    expect(typeof dialogSsr).toBe('string');

    for (const html of fragments) {
      expect(html.length).toBeGreaterThan(0);
    }
    expect(fragments[20]).toContain('VG');
  });

  it('renders all 13 new L2 fields, relocated L2 fields, status clearing, and EmrTypedField unified dispatch', () => {
    const noop = () => {};
    const statusStripHtml = renderToStaticMarkup(
      createElement(AssessmentStatusStrip, {
        fieldLabel: 'Fundus',
        status: 'not_assessed',
        options: [{ value: 'not_assessed', label: 'Not assessed' }],
        onStatusChange: noop,
      })
    );
    expect(statusStripHtml).toContain('Clear');

    const sigHtml = renderToStaticMarkup(
      createElement(EmrSignatureCaptureField, {
        model: {
          label: 'Surgeon signature',
          signatoryName: 'Dr. Gupta',
          strokes: [{ points: [{ x: 10, y: 15 }, { x: 80, y: 45 }] }],
        },
        onIntent: noop,
      })
    );
    expect(sigHtml).toContain('<svg');
    expect(sigHtml).toContain('<polyline');

    const l2Htmls = [
      renderToStaticMarkup(
        createElement(EmrScaleField, {
          model: { label: 'Pain score', variant: 'likert', value: 3, min: 0, max: 10, anchors: { minLabel: 'None', maxLabel: 'Severe' } },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrPartialDateField, {
          model: { label: 'Onset date', value: { value: '2025-06', precision: 'month' } },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrAttachmentField, {
          model: {
            label: 'Reports',
            items: [{ id: 'a1', title: 'B-Scan.png', contentType: 'image/png', sizeBytes: 12800 }],
            allowCamera: true,
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrPairedField, {
          model: {
            label: 'Blood pressure',
            mode: 'integer',
            firstLabel: 'Systolic',
            secondLabel: 'Diastolic',
            separator: '/',
            unit: 'mmHg',
            value: { first: 120, second: 80 },
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrDurationInput, {
          model: {
            label: 'Follow-up in',
            value: { amount: 2, unit: 'wk' },
            unitOptions: [
              { value: 'd', label: 'Days' },
              { value: 'wk', label: 'Weeks' },
            ],
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrRangeField, {
          model: { label: 'Target IOP', kind: 'number', value: { low: 10, high: 16 }, unit: 'mmHg' },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrPhoneInput, {
          model: {
            label: 'Mobile',
            countryCode: '+91',
            countryOptions: [{ code: '+91', label: '+91 (IN)' }],
            nationalNumber: '9876543210',
            availableChannels: [{ id: 'whatsapp', label: 'WhatsApp' }],
            channels: ['whatsapp'],
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrAddressField, {
          model: {
            label: 'Home address',
            value: { line1: 'Ansari Nagar', city: 'New Delhi', postalCode: '110029' },
            showDistrict: true,
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrMacroTextField, {
          model: {
            label: 'Slit lamp findings',
            value: 'Cornea clear .ac',
            suggestionsOpen: true,
            suggestions: [{ trigger: '.ac', label: 'Deep & quiet AC', expansion: 'AC deep and quiet' }],
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrLateralityField, {
          model: {
            label: 'Surgical eye',
            value: 'OD',
            options: [
              { code: 'OD', label: 'Right eye (OD)' },
              { code: 'OS', label: 'Left eye (OS)' },
            ],
            requiresConfirmation: true,
            confirmed: false,
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrVisualAcuityField, {
          model: {
            label: 'Distance VA',
            eye: 'OD',
            notation: 'snellen-metric',
            notationOptions: [{ value: 'snellen-metric', label: '6m Snellen' }],
            correction: 'unaided',
            correctionOptions: [{ value: 'unaided', label: 'Unaided' }],
            value: '6/12',
            valueOptions: [{ value: '6/12', label: '6/12' }],
            showPinhole: true,
            pinholeValue: '6/6',
            derivedDisplay: '0.30 logMAR',
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrRefractionField, {
          model: {
            label: 'Manifest refraction',
            eye: 'OS',
            value: { sphere: -2.25, cylinder: -0.75, axis: 90, nearAdd: 1.5 },
            showNearAdd: true,
            formattedSummary: '-2.25 / -0.75 × 90° (Add +1.50)',
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrCodedInput, {
          model: {
            definition: {
              contract: {
                linkId: 'primary-dx',
                valueType: 'coded',
                cardinality: { min: 1, max: 1 },
                terminology: [],
              },
              presentation: {
                label: 'Primary diagnosis',
                assessmentStatusOptions: [{ value: 'unable_to_assess', label: 'Unable to assess' }],
              },
            },
            value: { system: 'http://hl7.org/fhir/sid/icd-10', code: 'H25.9', display: 'Cataract' },
            status: 'unable_to_assess',
            query: '',
            options: [],
            loading: false,
            open: false,
            emptyMessage: 'No matches',
            messages: [],
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrAttestation, {
          model: {
            title: 'Surgical timeout attestation',
            statement: 'I verify the surgical eye',
            signatories: [
              {
                id: 'sig-1',
                displayName: 'Dr. Vivek Gupta',
                roleLabel: 'Consultant Surgeon',
                status: { label: 'Signed', tone: 'success' },
                signedAtLabel: '12 Nov 2026, 10:30',
              },
            ],
            canSign: true,
          },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrIdentifierEntry, {
          model: { label: 'ABHA ID', value: '12-3456-7890-1234', normalisedValue: '12-3456-7890-1234' },
          onIntent: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrTypedField, {
          controlId: 'tf-partial-date',
          definition: {
            contract: { linkId: 'symptom-onset', valueType: 'partial-date', cardinality: { min: 0, max: 1 } },
            presentation: { label: 'Symptom onset', hint: 'Approximate month or year allowed' },
          },
          model: {
            value: { value: '2024', precision: 'year' },
            touched: false,
            dirty: false,
            visible: true,
            enabled: true,
            messages: [],
          },
          onValueChange: noop,
        })
      ),
      renderToStaticMarkup(
        createElement(EmrTypedField, {
          controlId: 'tf-coded',
          definition: {
            contract: { linkId: 'dx', valueType: 'coded', cardinality: { min: 0, max: 1 }, terminology: [] },
            presentation: { label: 'Coded Dx' },
          },
          model: {
            value: { system: 'http://snomed.info/sct', code: '77075001', display: 'POAG' },
            touched: false,
            dirty: false,
            visible: true,
            enabled: true,
            messages: [],
          },
          onValueChange: noop,
        })
      ),
    ];

    for (const html of l2Htmls) {
      expect(html.length).toBeGreaterThan(0);
    }
    expect(l2Htmls[12]).toContain('Clear status');
  });
});
