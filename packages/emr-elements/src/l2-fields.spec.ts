// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  registerAllEmrElements,
  EmrAddressFieldElement,
  EmrAttachmentFieldElement,
  EmrAttestationElement,
  EmrCodedInputElement,
  EmrDurationInputElement,
  EmrFieldFrameElement,
  EmrIdentifierEntryElement,
  EmrLateralityFieldElement,
  EmrMacroTextFieldElement,
  EmrNumberInputElement,
  EmrPairedFieldElement,
  EmrPartialDateFieldElement,
  EmrPhoneInputElement,
  EmrQuantityInputElement,
  EmrRangeFieldElement,
  EmrRefractionFieldElement,
  EmrScaleFieldElement,
  EmrScheduleSlotPickerElement,
  EmrSelectElement,
  EmrSignatureCaptureFieldElement,
  EmrTextInputElement,
  EmrTypedFieldElement,
  EmrVisualAcuityFieldElement,
} from './index.js';
import type {
  ClinicalFieldDefinition,
  CodedInputViewModel,
  DoseSlot,
  EmrFieldDefinition,
  EmrFieldState,
  IdentifierEntryView,
} from '@drguptavivek/emr-controller';

const field = (
  type: ClinicalFieldDefinition['type'],
  extra: Partial<ClinicalFieldDefinition> = {},
): ClinicalFieldDefinition => ({ id: 'answer', label: 'Answer', type, ...extra });

describe('Lit L2 field adapters', () => {
  it('renders controlled values and forwards one direct scalar event, preserving false', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    el.definition = field('boolean');
    el.model = { value: false };
    const details: unknown[] = [];
    el.addEventListener('valueChange', e => details.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const checkbox = el.shadowRoot!.querySelector('emr-checkbox')!;
      await checkbox.updateComplete;
      checkbox.shadowRoot!.querySelector('button')!.click();
      expect(details).toEqual([true]);
      expect(el.model?.value).toBe(false);
    } finally {
      el.remove();
    }
  });

  it('renders select and multiselect options and refuses locked edits', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    el.definition = field('multiselect', {
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    });
    el.model = { value: ['a'], readOnly: true };
    const details: unknown[] = [];
    el.addEventListener('valueChange', e => details.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const buttons = el.shadowRoot!.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      buttons[1]!.click();
      expect(details).toEqual([]);
    } finally {
      el.remove();
    }
  });

  it('locks disabled native controls and suppresses synthetic child changes', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    el.definition = field('text');
    el.model = { value: 'accepted', disabled: true };
    const details: unknown[] = [];
    el.addEventListener('valueChange', event => details.push((event as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const child = el.shadowRoot!.querySelector('emr-text-input')!;
      await child.updateComplete;
      const input = child.shadowRoot!.querySelector('input')!;
      expect(input.readOnly).toBe(true);
      input.value = 'rejected';
      child.dispatchEvent(new CustomEvent('valueChange', { detail: 'rejected', bubbles: true, composed: true }));
      expect(details).toEqual([]);
    } finally {
      el.remove();
    }
  });

  it('renders coded loading, messages and selected concepts, with locked controls inert', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-coded-input') as EmrCodedInputElement;
    const model = {
      definition: {
        schemaVersion: '1.0',
        contract: { linkId: 'code', valueType: 'coded', cardinality: { min: 0, max: 1 }, terminology: [], validation: [] },
        presentation: { label: 'Finding' },
      },
      value: { system: 'urn:test', code: 'x', display: 'Finding X' },
      status: 'recorded',
      query: '',
      options: [],
      open: true,
      loading: true,
      messages: [{ severity: 'error', code: 'invalid', message: 'Check selection' }],
      readOnly: true,
      emptyMessage: 'No matches',
    } as CodedInputViewModel;
    el.model = model;
    const intents: unknown[] = [];
    el.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Finding X');
      expect(el.shadowRoot!.textContent).toContain('Searching');
      expect(el.shadowRoot!.textContent).toContain('Check selection');
      const input = el.shadowRoot!.querySelector('input')!;
      input.value = 'ignored';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(intents).toEqual([]);
    } finally {
      el.remove();
    }
  });

  it('keeps identifier type controlled as a radiogroup and renders full attestation signatory metadata', async () => {
    registerAllEmrElements();
    const identifier = document.createElement('emr-identifier-entry') as EmrIdentifierEntryElement;
    const identModel: IdentifierEntryView = {
      label: 'Identifier',
      value: '',
      typeOptions: [
        { id: 'a', label: 'Type A' },
        { id: 'b', label: 'Type B' },
      ],
      selectedType: 'b',
    };
    identifier.model = identModel;
    const identIntents: unknown[] = [];
    identifier.addEventListener('intent', e => identIntents.push((e as CustomEvent).detail));
    document.body.append(identifier);
    try {
      await identifier.updateComplete;
      const radios = identifier.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radiogroup"] [role="radio"]');
      expect(radios).toHaveLength(2);
      expect(radios[0]!.getAttribute('aria-checked')).toBe('false');
      expect(radios[0]!.getAttribute('tabindex')).toBe('-1');
      expect(radios[1]!.getAttribute('aria-checked')).toBe('true');
      expect(radios[1]!.getAttribute('tabindex')).toBe('0');
      radios[0]!.click();
      const input = identifier.shadowRoot!.querySelector('input')!;
      input.value = 'MRN-42';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(identIntents).toEqual([
        { type: 'typeSelected', id: 'a' },
        { type: 'valueChanged', raw: 'MRN-42' },
        { type: 'submitted', raw: '' },
      ]);
      expect(identifier.model?.selectedType).toBe('b');

      // Clearable + required + normalised + readOnly keeps focus without disabled attribute
      identifier.model = {
        ...identModel,
        value: 'UHID-99',
        required: true,
        clearable: true,
        normalisedValue: 'UHID-99',
      };
      await identifier.updateComplete;
      const input2 = identifier.shadowRoot!.querySelector('input')!;
      expect(input2.getAttribute('aria-required')).toBe('true');
      expect(identifier.shadowRoot!.querySelector('.ident-normalised')?.textContent).toContain('Recognised as');
      const clearBtn = identifier.shadowRoot!.querySelector<HTMLButtonElement>('.ident-clear-btn')!;
      clearBtn.click();
      expect(identIntents).toContainEqual({ type: 'cleared' });

      identifier.readOnly = true;
      await identifier.updateComplete;
      expect(identifier.shadowRoot!.querySelector('input')!.hasAttribute('disabled')).toBe(false);
      expect(identifier.shadowRoot!.querySelector('input')!.getAttribute('aria-readonly')).toBe('true');
    } finally {
      identifier.remove();
    }

    const attestation = document.createElement('emr-attestation') as EmrAttestationElement;
    attestation.model = {
      id: 'att-1',
      canSign: true,
      signatories: [
        {
          id: 'signer-1',
          displayName: 'Signer',
          roleLabel: 'Consultant Ophthalmologist',
          status: { label: 'Pending', tone: 'info' },
        },
      ],
    };
    const intents: unknown[] = [];
    attestation.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(attestation);
    try {
      await attestation.updateComplete;
      expect(attestation.shadowRoot!.textContent).toContain('Consultant Ophthalmologist');
      expect(attestation.shadowRoot!.textContent).toContain('Signed: Not supplied');
      attestation.shadowRoot!.querySelector<HTMLButtonElement>('.field-options button')!.click();
      expect(intents).toEqual([{ type: 'signRequested' }]);
    } finally {
      attestation.remove();
    }
  });

  it('keeps schedule values controlled, preserves canonical slot ordering, and edits per-slot dose amounts', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-schedule-slot-picker') as EmrScheduleSlotPickerElement;
    const original: readonly DoseSlot[] = [{ id: 'morning', label: 'Morning', amount: 0.5 }];
    el.slots = [
      { id: 'morning', label: 'Morning' },
      { id: 'noon', label: 'Noon' },
      { id: 'night', label: 'Night' },
    ];
    el.presets = [{ id: 'day', label: 'Daytime', slotIds: ['morning', 'noon'] }];
    el.value = original;
    const changes: unknown[] = [];
    el.addEventListener('valueChange', event => changes.push((event as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      // Preset click
      el.shadowRoot!.querySelector('button')!.click();
      expect(changes[0]).toEqual([original[0], { id: 'noon', label: 'Noon', amount: 1 }]);
      expect(el.value).toBe(original);

      // Edit active morning slot numeric amount
      const amountInput = el.shadowRoot!.querySelector('emr-number-input') as EmrNumberInputElement;
      expect(amountInput).not.toBeNull();
      await amountInput.updateComplete;
      const innerInput = amountInput.shadowRoot!.querySelector('input')!;
      innerInput.value = '2';
      innerInput.dispatchEvent(new Event('input'));
      expect(changes[1]).toEqual([{ id: 'morning', label: 'Morning', amount: 2 }]);

      // Toggling an earlier slot when a later slot is selected preserves canonical slots order
      el.value = [{ id: 'night', label: 'Night', amount: 1 }];
      await el.updateComplete;
      const slotCheckboxes = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]');
      slotCheckboxes[0]!.click(); // toggle Morning ON
      expect(changes[2]).toEqual([
        { id: 'morning', label: 'Morning', amount: 1 },
        { id: 'night', label: 'Night', amount: 1 },
      ]);

      // Label mode renders text input for active slot amount
      el.amountKind = 'label';
      el.value = [{ id: 'morning', label: 'Morning', amount: null, amountLabel: '1 drop' }];
      await el.updateComplete;
      const textAmount = el.shadowRoot!.querySelector('emr-text-input') as EmrTextInputElement;
      expect(textAmount).not.toBeNull();
      await textAmount.updateComplete;
      const rawText = textAmount.shadowRoot!.querySelector('input')!;
      rawText.value = '2 drops';
      rawText.dispatchEvent(new Event('input'));
      expect(changes[3]).toEqual([{ id: 'morning', label: 'Morning', amount: null, amountLabel: '2 drops' }]);

      // ReadOnly shows 'Not selected' for unticked slots, and simultaneous hint + error set aria-invalid/describedby
      el.amountKind = 'number';
      el.hint = 'Pick slots';
      el.error = 'Required';
      el.required = true;
      el.readOnly = true;
      el.controlId = 'ssp-a11y';
      el.value = [{ id: 'morning', label: 'Morning', amount: 1 }];
      await el.updateComplete;
      const group = el.shadowRoot!.querySelector('[role="group"]')!;
      expect(group.getAttribute('aria-invalid')).toBe('true');
      expect(group.getAttribute('aria-required')).toBe('true');
      expect(group.getAttribute('aria-describedby')).toBe('ssp-a11y-hint ssp-a11y-error');
      expect(el.shadowRoot!.textContent).toContain('Not selected');
      expect(el.shadowRoot!.textContent).toContain('Error: Required');
    } finally {
      el.remove();
    }
  });

  it('keeps hint persistently visible alongside error, warning, info, and structured messages in emr-field-frame', async () => {
    registerAllEmrElements();
    const frame = document.createElement('emr-field-frame') as EmrFieldFrameElement;
    frame.controlId = 'iop';
    frame.label = 'IOP';
    frame.hint = 'Applanation tonometry in mmHg';
    frame.info = 'Baseline 16 mmHg';
    frame.warning = 'Borderline elevation';
    frame.error = 'Out of range';
    frame.messages = [{ code: 'v1', severity: 'error', message: 'Verify calibration' }];
    document.body.append(frame);
    try {
      await frame.updateComplete;
      const text = frame.shadowRoot!.textContent ?? '';
      expect(text).toContain('Applanation tonometry in mmHg');
      expect(text).toContain('Baseline 16 mmHg');
      expect(text).toContain('Borderline elevation');
      expect(text).toContain('Out of range');
      expect(text).toContain('Verify calibration');
    } finally {
      frame.remove();
    }
  });

  it('prevents double labels in emr-typed-field and dispatches EmrFieldDefinition + widget hints', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    const def: EmrFieldDefinition = {
      schemaVersion: '1.0',
      contract: {
        linkId: 'corneal-thickness',
        valueType: 'decimal',
        cardinality: { min: 1, max: 1 },
        terminology: [],
        validation: [],
        unit: { system: 'http://unitsofmeasure.org', code: 'um' },
      },
      presentation: {
        label: 'Central corneal thickness',
        hint: 'Pachymetry',
        precision: 3,
      },
    };
    const state: EmrFieldState = {
      value: 540.125,
      enabled: true,
      messages: [{ code: 'warn', severity: 'warning', message: 'Thin cornea' }],
    };
    el.definition = def;
    el.model = state;
    document.body.append(el);
    try {
      await el.updateComplete;
      const frame = el.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      const num = el.shadowRoot!.querySelector('emr-number-input') as EmrNumberInputElement;
      await Promise.all([frame.updateComplete, num.updateComplete]);

      // Frame owns the single label; inner control is chromeless!
      expect(frame.shadowRoot!.querySelectorAll('label.emr-label')).toHaveLength(1);
      expect(num.labelHidden).toBe(true);
      expect(num.shadowRoot!.querySelector('label')).toBeNull();
      expect(num.step).toBe(0.001);

      // Multiline dispatches to emr-textarea
      el.definition = {
        ...def,
        contract: { ...def.contract, valueType: 'multiline' },
      };
      el.model = { value: 'Slit lamp clear', enabled: true, messages: [] };
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('emr-textarea')).not.toBeNull();

      // Boolean + toggle widget dispatches to emr-toggle
      el.definition = {
        ...def,
        contract: { ...def.contract, valueType: 'boolean' },
        presentation: { label: 'RAPD', widget: 'toggle' },
      };
      el.model = { value: true, enabled: true, messages: [] };
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('emr-toggle')).not.toBeNull();

      // Scale + vas widget dispatches to emr-scale-field
      el.definition = {
        ...def,
        contract: { ...def.contract, valueType: 'scale' },
        presentation: { label: 'Pain score', widget: 'vas', min: 0, max: 100 },
      };
      el.model = { value: null, enabled: true, messages: [] };
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('emr-scale-field')).not.toBeNull();
    } finally {
      el.remove();
    }
  });

  it('resolves answer-value-set terminology binding and supports controlled status clearing in emr-coded-input', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-coded-input') as EmrCodedInputElement;
    el.model = {
      definition: {
        schemaVersion: '1.0',
        contract: {
          linkId: 'dx',
          valueType: 'coded',
          cardinality: { min: 0, max: 1 },
          terminology: [
            { role: 'code-system', system: 'http://snomed.info/sct', valueSetCanonical: 'urn:wrong-first-binding' },
            { role: 'answer-value-set', system: 'http://snomed.info/sct', valueSetCanonical: 'http://hl7.org/fhir/ValueSet/ocular-dx' },
          ],
          validation: [],
        },
        presentation: {
          label: 'Diagnosis',
          assessmentStatusOptions: [
            { value: 'not-assessed', label: 'Not assessed' },
            { value: 'absent', label: 'Absent' },
          ],
        },
      },
      value: null,
      status: 'not-assessed',
      query: 'glaucoma',
      options: [],
      open: false,
      loading: false,
      messages: [],
      emptyMessage: 'No matches',
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const search = el.shadowRoot!.querySelector('input[type="search"]')!;
      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(intents[0]).toEqual({
        type: 'searchRequested',
        query: 'glaucoma',
        valueSetCanonical: 'http://hl7.org/fhir/ValueSet/ocular-dx',
      });

      const statusSelect = el.shadowRoot!.querySelector('select')!;
      expect(statusSelect.value).toBe('not-assessed');
      statusSelect.value = '';
      statusSelect.dispatchEvent(new Event('change'));
      expect(intents[1]).toEqual({ type: 'statusChangeRequested', status: undefined });
      // Controlled writeback restores select.value until host updates el.model
      expect(statusSelect.value).toBe('not-assessed');
    } finally {
      el.remove();
    }
  });

  it('renders and emits controlled intents across all 13 new L2 clinical fields', async () => {
    registerAllEmrElements();

    // 1. emr-scale-field
    const scale = document.createElement('emr-scale-field') as EmrScaleFieldElement;
    scale.model = { label: 'Pain', variant: 'likert', min: 0, max: 5, value: 2 };
    const scaleIntents: unknown[] = [];
    scale.addEventListener('intent', e => scaleIntents.push((e as CustomEvent).detail));
    document.body.append(scale);
    await scale.updateComplete;
    const clearScaleBtn = [...scale.shadowRoot!.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Clear')!;
    clearScaleBtn.click();
    expect(scaleIntents).toEqual([{ type: 'valueChangeRequested', value: null }]);
    scale.remove();

    // 2. emr-partial-date-field
    const pd = document.createElement('emr-partial-date-field') as EmrPartialDateFieldElement;
    pd.model = { label: 'Onset date', value: { value: '2024', precision: 'year' } };
    const pdIntents: unknown[] = [];
    pd.addEventListener('intent', e => pdIntents.push((e as CustomEvent).detail));
    document.body.append(pd);
    await pd.updateComplete;
    const segCtrl = pd.shadowRoot!.querySelector('emr-segmented-control')!;
    await (segCtrl as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    segCtrl.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(pdIntents).toEqual([
      { type: 'precisionChangeRequested', precision: 'month' },
      { type: 'valueChangeRequested', value: null },
    ]);
    pd.remove();

    // 3. emr-attachment-field
    const att = document.createElement('emr-attachment-field') as EmrAttachmentFieldElement;
    att.model = {
      label: 'Referral letter',
      items: [{ id: 'a1', title: 'referral.pdf', contentType: 'application/pdf', sizeBytes: 2048 }],
      allowCamera: true,
    };
    const attIntents: unknown[] = [];
    att.addEventListener('intent', e => attIntents.push((e as CustomEvent).detail));
    document.body.append(att);
    await att.updateComplete;
    att.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Remove referral.pdf"]')!.click();
    expect(attIntents).toEqual([{ type: 'itemRemoveRequested', id: 'a1' }]);
    att.remove();

    // 4. emr-paired-field
    const paired = document.createElement('emr-paired-field') as EmrPairedFieldElement;
    paired.model = {
      label: 'Blood pressure',
      firstLabel: 'Systolic',
      secondLabel: 'Diastolic',
      mode: 'integer',
      unit: 'mmHg',
      value: { first: 120, second: 80 },
    };
    const pairedIntents: unknown[] = [];
    paired.addEventListener('intent', e => pairedIntents.push((e as CustomEvent).detail));
    document.body.append(paired);
    await paired.updateComplete;
    const firstInp = paired.shadowRoot!.querySelectorAll('input')[0]!;
    firstInp.value = '128';
    firstInp.dispatchEvent(new Event('input'));
    expect(pairedIntents).toEqual([{ type: 'firstChangeRequested', value: 128 }]);
    paired.remove();

    // 5. emr-duration-input
    const dur = document.createElement('emr-duration-input') as EmrDurationInputElement;
    dur.model = {
      label: 'Symptom duration',
      value: { amount: 3, unit: 'd' },
      unitOptions: [
        { value: 'd', label: 'Days' },
        { value: 'wk', label: 'Weeks' },
      ],
    };
    const durIntents: unknown[] = [];
    dur.addEventListener('intent', e => durIntents.push((e as CustomEvent).detail));
    document.body.append(dur);
    await dur.updateComplete;
    const durQty = dur.shadowRoot!.querySelector('emr-quantity-input') as EmrQuantityInputElement;
    await durQty.updateComplete;
    const durUnitSel = durQty.shadowRoot!.querySelector('emr-select') as EmrSelectElement;
    await durUnitSel.updateComplete;
    durUnitSel.shadowRoot!.querySelector<HTMLButtonElement>('[role="combobox"]')!.click();
    await durUnitSel.updateComplete;
    durUnitSel.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="option"]')[1]!.click();
    expect(durIntents).toEqual([{ type: 'unitChangeRequested', unit: 'wk' }]);
    dur.remove();

    // 6. emr-range-field
    const range = document.createElement('emr-range-field') as EmrRangeFieldElement;
    range.model = { label: 'Target IOP', kind: 'number', unit: 'mmHg', value: { low: 10, high: 18 } };
    const rangeIntents: unknown[] = [];
    range.addEventListener('intent', e => rangeIntents.push((e as CustomEvent).detail));
    document.body.append(range);
    await range.updateComplete;
    const lowInp = range.shadowRoot!.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')[0]!;
    lowInp.value = '12';
    lowInp.dispatchEvent(new Event('input'));
    expect(rangeIntents).toEqual([{ type: 'lowChangeRequested', low: 12 }]);
    range.remove();

    // 7. emr-signature-capture-field
    const sig = document.createElement('emr-signature-capture-field') as EmrSignatureCaptureFieldElement;
    sig.model = {
      label: 'Clinician signature',
      signatoryName: 'Dr Vivek Gupta',
      signatoryRole: 'Consultant',
      signedAt: '2026-10-14 09:30',
      strokes: [
        { points: [{ x: 10, y: 10 }, { x: 60, y: 30 }] },
        { points: [{ x: 80, y: 40 }] },
      ],
      status: 'recorded',
      statusOptions: [{ value: 'recorded', label: 'Recorded', tone: 'success' }],
    };
    const sigIntents: unknown[] = [];
    const sigCleared: number[] = [];
    sig.addEventListener('intent', e => sigIntents.push((e as CustomEvent).detail));
    sig.addEventListener('cleared', () => sigCleared.push(1));
    document.body.append(sig);
    await sig.updateComplete;
    expect(sig.shadowRoot!.querySelectorAll('svg.sig-pad polyline')).toHaveLength(1);
    expect(sig.shadowRoot!.querySelectorAll('svg.sig-pad circle')).toHaveLength(1);
    expect(sig.shadowRoot!.textContent).toContain('Dr Vivek Gupta · Consultant · 2026-10-14 09:30');
    const svgPad = sig.shadowRoot!.querySelector<SVGSVGElement>('svg.sig-pad')!;
    expect(svgPad.getAttribute('role')).toBe('region');
    expect(svgPad.getAttribute('tabindex')).toBe('0');
    // Scaled narrow rect (300x140 for 420x140 viewBox => scale = 300/420, offsetY = 20)
    svgPad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 140, right: 300, bottom: 140, x: 0, y: 0, toJSON: () => ({}) });
    svgPad.dispatchEvent(new MouseEvent('pointerdown', { clientX: 150, clientY: 70, bubbles: true }));
    svgPad.dispatchEvent(new MouseEvent('pointermove', { clientX: 225, clientY: 95, bubbles: true }));
    svgPad.dispatchEvent(new MouseEvent('pointerup', { clientX: 225, clientY: 95, bubbles: true }));
    expect(sigIntents).toHaveLength(1);
    expect(sigIntents[0]).toEqual({
      type: 'strokeAdded',
      stroke: {
        points: [
          { x: 210, y: 70 },
          { x: 315, y: 105 },
        ],
      },
    });
    // Escape cancels active uncommitted stroke
    svgPad.dispatchEvent(new MouseEvent('pointerdown', { clientX: 150, clientY: 70, bubbles: true }));
    svgPad.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    svgPad.dispatchEvent(new MouseEvent('pointerup', { clientX: 150, clientY: 70, bubbles: true }));
    expect(sigIntents).toHaveLength(1);
    // Keyboard Ctrl+Z -> undoRequested, Delete -> clearRequested
    svgPad.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(sigIntents[1]).toEqual({ type: 'undoRequested' });
    const undoBtn = [...sig.shadowRoot!.querySelectorAll('button')].find(b => b.textContent?.includes('Undo'))!;
    undoBtn.click();
    expect(sigIntents[2]).toEqual({ type: 'undoRequested' });
    const clearBtn = [...sig.shadowRoot!.querySelectorAll('button')].find(b => b.textContent?.includes('Clear'))!;
    clearBtn.click();
    expect(sigIntents[3]).toEqual({ type: 'clearRequested' });
    expect(sigCleared).toHaveLength(1);
    // Locked state
    sig.readOnly = true;
    await sig.updateComplete;
    expect(svgPad.getAttribute('role')).toBe('img');
    expect(svgPad.getAttribute('aria-readonly')).toBe('true');
    expect([...sig.shadowRoot!.querySelectorAll('button')].some(b => b.textContent?.includes('Clear'))).toBe(false);
    sig.remove();

    // 7b. emr-typed-field delegating signature without double frame
    const typedSig = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    const typedSigDef: EmrFieldDefinition = {
      schemaVersion: '1.0',
      contract: {
        linkId: 'consent-sig',
        valueType: 'annotation',
        cardinality: { min: 1, max: 1 },
        terminology: [],
        validation: [],
      },
      presentation: {
        label: 'Consent signature',
        widget: 'signature',
        assessmentStatusOptions: [{ value: 'recorded', label: 'Recorded', tone: 'success' }],
      },
    };
    const typedSigState: EmrFieldState = {
      value: [{ points: [{ x: 10, y: 20 }, { x: 40, y: 50 }] }, { points: [{ x: 60, y: 70 }] }],
      status: 'recorded',
      enabled: true,
      visible: true,
      messages: [],
    };
    typedSig.definition = typedSigDef;
    typedSig.model = typedSigState;
    const typedSigChanges: unknown[] = [];
    typedSig.addEventListener('valueChange', e => typedSigChanges.push((e as CustomEvent).detail));
    document.body.append(typedSig);
    await typedSig.updateComplete;
    expect(typedSig.shadowRoot!.querySelector('emr-field-frame')).toBeNull();
    const innerSig = typedSig.shadowRoot!.querySelector('emr-signature-capture-field') as EmrSignatureCaptureFieldElement;
    await innerSig.updateComplete;
    const innerUndo = [...innerSig.shadowRoot!.querySelectorAll('button')].find(b => b.textContent?.includes('Undo'))!;
    innerUndo.click();
    expect(typedSigChanges).toEqual([[{ points: [{ x: 10, y: 20 }, { x: 40, y: 50 }] }]]);
    typedSig.remove();

    // 8. emr-phone-input
    const phone = document.createElement('emr-phone-input') as EmrPhoneInputElement;
    phone.model = {
      label: 'Mobile',
      countryOptions: [{ code: '+91', label: 'India (+91)' }],
      countryCode: '+91',
      nationalNumber: '9876543210',
      availableChannels: [{ id: 'whatsapp', label: 'WhatsApp' }],
      channels: [],
    };
    const phoneIntents: unknown[] = [];
    phone.addEventListener('intent', e => phoneIntents.push((e as CustomEvent).detail));
    document.body.append(phone);
    await phone.updateComplete;
    phone.shadowRoot!.querySelector<HTMLButtonElement>('button[role="checkbox"]')!.click();
    expect(phoneIntents).toEqual([{ type: 'channelToggleRequested', channel: 'whatsapp' }]);
    phone.remove();

    // 9. emr-address-field
    const addr = document.createElement('emr-address-field') as EmrAddressFieldElement;
    addr.controlId = 'addr-smoke';
    addr.model = {
      label: 'Home address',
      value: { line1: '', city: '', district: '', state: '', postalCode: '', country: 'IN' },
    };
    const addrIntents: unknown[] = [];
    addr.addEventListener('intent', e => addrIntents.push((e as CustomEvent).detail));
    document.body.append(addr);
    await addr.updateComplete;
    const line1Inp = addr.shadowRoot!.querySelector<HTMLInputElement>('#addr-smoke')!;
    expect(addr.shadowRoot!.querySelector('label[for="addr-smoke"]')).not.toBeNull();
    line1Inp.value = 'Ansari Nagar';
    line1Inp.dispatchEvent(new Event('input'));
    expect(addrIntents).toEqual([{ type: 'fieldChangeRequested', part: 'line1', value: 'Ansari Nagar' }]);
    addr.remove();

    // 10. emr-macro-text-field
    const macro = document.createElement('emr-macro-text-field') as EmrMacroTextFieldElement;
    macro.model = {
      label: 'Anterior segment',
      value: '.wnl',
      suggestions: [{ trigger: '.wnl', label: 'Within normal limits', expansionPreview: 'Cornea clear, AC deep and quiet.' }],
      suggestionsOpen: true,
    };
    const macroIntents: unknown[] = [];
    macro.addEventListener('intent', e => macroIntents.push((e as CustomEvent).detail));
    document.body.append(macro);
    await macro.updateComplete;
    macro.shadowRoot!.querySelector<HTMLButtonElement>('button[role="option"]')!.click();
    expect(macroIntents).toEqual([{ type: 'macroSelected', trigger: '.wnl' }]);
    macro.remove();

    // 11. emr-laterality-field
    const lat = document.createElement('emr-laterality-field') as EmrLateralityFieldElement;
    lat.model = {
      label: 'Operative eye',
      value: 'OD',
      options: [
        { code: 'OD', label: 'Right eye', shortLabel: 'OD' },
        { code: 'OS', label: 'Left eye', shortLabel: 'OS' },
      ],
    };
    const latIntents: unknown[] = [];
    lat.addEventListener('intent', e => latIntents.push((e as CustomEvent).detail));
    document.body.append(lat);
    await lat.updateComplete;
    const latSeg = lat.shadowRoot!.querySelector('emr-segmented-control')!;
    await (latSeg as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    latSeg.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[1]!.click();
    expect(latIntents).toEqual([{ type: 'lateralitySelected', code: 'OS' }]);
    lat.remove();

    // 12. emr-visual-acuity-field
    const va = document.createElement('emr-visual-acuity-field') as EmrVisualAcuityFieldElement;
    va.controlId = 'va-test';
    va.model = {
      label: 'Distance visual acuity',
      eye: 'OD',
      notation: 'snellen-m',
      notationOptions: [
        { value: 'snellen-m', label: 'Snellen (6m)' },
        { value: 'logmar', label: 'LogMAR' },
      ],
      correction: 'unaided',
      correctionOptions: [
        { value: 'unaided', label: 'Unaided' },
        { value: 'best-corrected', label: 'BCVA' },
      ],
      value: '6/9',
      valueOptions: [{ value: '6/6', label: '6/6' }, { value: '6/9', label: '6/9' }],
      showPinhole: true,
      pinholeValue: '6/6',
      derivedDisplay: 'LogMAR 0.18',
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      ],
      messages: [
        { path: ['pinhole'], severity: 'error', message: 'Re-test pinhole' },
        { path: ['value'], severity: 'warning', message: 'Confirm distance' },
      ],
    };
    const vaIntents: unknown[] = [];
    va.addEventListener('intent', e => vaIntents.push((e as CustomEvent).detail));
    document.body.append(va);
    await va.updateComplete;

    const vaFrame = va.shadowRoot!.querySelector('emr-field-frame') as EmrLitElement;
    await vaFrame.updateComplete;
    const vaSegs = va.shadowRoot!.querySelectorAll('emr-segmented-control');
    const vaSelects = va.shadowRoot!.querySelectorAll('emr-select');
    expect(vaSegs[0]!.getAttribute('id') ?? (vaSegs[0] as { controlId?: string }).controlId).toBe('va-test-notation');
    expect((vaSegs[1] as { controlId?: string }).controlId).toBe('va-test-correction');
    expect((vaSelects[0] as { controlId?: string }).controlId).toBe('va-test-value');
    expect((vaSelects[1] as { controlId?: string }).controlId).toBe('va-test-pinhole');

    await (vaSegs[0] as EmrLitElement).updateComplete;
    await (vaSelects[0] as EmrLitElement).updateComplete;
    await (vaSelects[1] as EmrLitElement).updateComplete;
    const valueTrigger = vaSelects[0]!.shadowRoot!.querySelector('button[role="combobox"]')!;
    const pinholeTrigger = vaSelects[1]!.shadowRoot!.querySelector('button[role="combobox"]')!;
    expect(valueTrigger.getAttribute('aria-invalid')).toBeNull();
    expect(pinholeTrigger.getAttribute('aria-invalid')).toBe('true');

    const eyeBadge = va.shadowRoot!.querySelector('emr-badge[icon="eye"]') as EmrLitElement;
    await eyeBadge.updateComplete;
    expect(eyeBadge.shadowRoot!.textContent).toContain('Right eye (OD)');

    vaSegs[0]!.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[1]!.click();
    const vaClearBtn = vaSelects[0]!.shadowRoot!.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')!;
    vaClearBtn.click();
    const statusChips = vaFrame.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    statusChips[1]!.click();
    expect(vaIntents).toEqual([
      { type: 'notationChangeRequested', notation: 'logmar' },
      { type: 'valueChangeRequested', value: null },
      { type: 'statusChangeRequested', status: 'unable-to-assess' },
    ]);

    va.readOnly = true;
    await va.updateComplete;
    await (vaSegs[0] as EmrLitElement).updateComplete;
    vaSegs[0]!.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[0]!.click();
    expect(vaIntents.length).toBe(3);
    va.remove();

    // 13. emr-refraction-field
    const rx = document.createElement('emr-refraction-field') as EmrRefractionFieldElement;
    rx.controlId = 'rx-test';
    rx.clearable = true;
    rx.model = {
      label: 'Subjective refraction (OD)',
      eye: 'OD',
      value: { sphere: -1.5, cylinder: -0.75, axis: 90, nearAdd: 2.0 },
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      ],
      showNearAdd: true,
      formattedSummary: '-1.50 / -0.75 × 090 (Add +2.00)',
      messages: [
        { path: ['axis'], severity: 'error', message: 'Check axis alignment' },
        { path: ['sphere'], severity: 'warning', message: 'Confirm over-refraction' },
      ],
    };
    const rxIntents: unknown[] = [];
    const rxFocusEvents: string[] = [];
    rx.addEventListener('intent', e => rxIntents.push((e as CustomEvent).detail));
    rx.addEventListener('focused', () => rxFocusEvents.push('focused'));
    rx.addEventListener('blurred', () => rxFocusEvents.push('blurred'));
    document.body.append(rx);
    await rx.updateComplete;

    const rxFrame = rx.shadowRoot!.querySelector('emr-field-frame') as EmrLitElement;
    await rxFrame.updateComplete;
    const rxEyeBadge = rx.shadowRoot!.querySelector('emr-badge[icon="eye"]') as EmrLitElement;
    await rxEyeBadge.updateComplete;
    expect(rxEyeBadge.shadowRoot!.textContent).toContain('Right eye (OD)');

    const sphereNative = rx.shadowRoot!.querySelector<HTMLInputElement>('#rx-test-sphere')!;
    const cylinderNative = rx.shadowRoot!.querySelector<HTMLInputElement>('#rx-test-cylinder')!;
    const axisNative = rx.shadowRoot!.querySelector<HTMLInputElement>('#rx-test-axis')!;
    const nearAddNative = rx.shadowRoot!.querySelector<HTMLInputElement>('#rx-test-nearAdd')!;

    expect(sphereNative.value).toBe('-1.50');
    expect(nearAddNative.value).toBe('2.00');
    expect(axisNative.getAttribute('aria-invalid')).toBe('true');
    expect(axisNative.getAttribute('aria-valuemin')).toBe('1');
    expect(sphereNative.getAttribute('aria-invalid')).toBeNull();
    expect(sphereNative.getAttribute('data-warning')).toBe('true');
    expect(cylinderNative.getAttribute('aria-invalid')).toBeNull();

    // Preserves incomplete draft and emits out-of-range finite values without clamping
    sphereNative.focus();
    sphereNative.value = '-';
    sphereNative.dispatchEvent(new Event('input'));
    expect(rxIntents.length).toBe(0);

    sphereNative.value = '-34';
    sphereNative.dispatchEvent(new Event('input'));
    expect(rxIntents).toEqual([{ type: 'sphereChangeRequested', sphere: -34 }]);
    sphereNative.blur();
    expect(sphereNative.value).toBe('-1.50');

    // Stepper + button increments by 0.25 without binary drift
    const incSphereBtn = rx.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Increase Sphere (SPH)"]')!;
    incSphereBtn.click();
    expect(rxIntents[1]).toEqual({ type: 'sphereChangeRequested', sphere: -1.25 });

    // Clearable button + status delegation
    const rxClearBtn = rx.shadowRoot!.querySelector<HTMLButtonElement>('button.ref-clear')!;
    rxClearBtn.click();
    expect(rxIntents[2]).toEqual({ type: 'clearRequested' });

    const rxStatusChips = rxFrame.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    rxStatusChips[1]!.click();
    expect(rxIntents[3]).toEqual({ type: 'statusChangeRequested', status: 'unable-to-assess' });

    // Read-only rollback and inert buttons
    rx.readOnly = true;
    await rx.updateComplete;
    sphereNative.value = '-9';
    sphereNative.dispatchEvent(new Event('input'));
    expect(sphereNative.value).toBe('-1.50');
    expect(rxIntents.length).toBe(4);
    expect(rxFocusEvents).toContain('focused');
    rx.remove();
  });

  it('renders EmrFieldFrame unit, note, deduplicated messages, and 6-state assessmentStatus intents', async () => {
    registerAllEmrElements();
    const ff = document.createElement('emr-field-frame') as EmrFieldFrameElement;
    ff.label = 'IOP';
    ff.unit = 'mmHg';
    ff.note = 'Calibrated';
    ff.warning = 'Duplicate warning';
    ff.messages = [
      { severity: 'warning', message: 'Duplicate warning' },
      { severity: 'info', message: 'Re-check in 15 min' },
    ];
    ff.assessmentStatus = 'recorded';
    ff.assessmentStatusOptions = [
      { value: 'recorded', label: 'Recorded', tone: 'success' },
      { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
    ];
    const ffIntents: unknown[] = [];
    ff.addEventListener('intent', e => ffIntents.push((e as CustomEvent).detail));
    document.body.append(ff);
    try {
      await ff.updateComplete;
      expect(ff.shadowRoot!.querySelector('.frame-unit')!.textContent).toBe('mmHg');
      expect(ff.shadowRoot!.querySelectorAll('.emr-warning').length).toBe(1);
      expect(ff.shadowRoot!.querySelectorAll('.emr-info').length).toBe(1);
      const chips = ff.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      chips[1]!.click();
      expect(ffIntents).toEqual([{ type: 'statusChangeRequested', status: 'unable-to-assess' }]);
      ff.readOnly = true;
      await ff.updateComplete;
      expect(ff.shadowRoot!.querySelectorAll('[role="radio"]').length).toBe(0);
    } finally {
      ff.remove();
    }
  });

  it('forwards showMetadata, layout, and statusChange through EmrTypedField -> EmrFieldFrame without disabled', async () => {
    registerAllEmrElements();
    const tf = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    tf.definition = field('quantity', {
      unit: 'mmHg',
      assessmentStatusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    });
    tf.model = { value: { value: 19, unit: 'mmHg' }, assessmentStatus: 'recorded' };
    tf.layout = 'horizontal';
    tf.showMetadata = true;
    const statuses: unknown[] = [];
    tf.addEventListener('statusChange', e => statuses.push((e as CustomEvent).detail));
    document.body.append(tf);
    try {
      await tf.updateComplete;
      const frame = tf.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;
      expect(frame.layout).toBe('horizontal');
      expect(frame.shadowRoot!.querySelector('.frame-unit')!.textContent).toBe('mmHg');
      const radios = frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      radios[1]!.click();
      expect(statuses).toEqual(['declined']);
      tf.showMetadata = false;
      await tf.updateComplete;
      await frame.updateComplete;
      expect(frame.shadowRoot!.querySelector('.frame-unit')).toBeNull();
    } finally {
      tf.remove();
    }
  });

  it('supports EmrCodedInput keyboard ArrowDown/Enter selection, SVG close button, aria-invalid, and readOnly Not supplied', async () => {
    registerAllEmrElements();
    const ci = document.createElement('emr-coded-input') as EmrCodedInputElement;
    ci.controlId = 'ci-test';
    ci.model = {
      definition: {
        schemaVersion: '1.0',
        contract: {
          linkId: 'dx',
          valueType: 'coded',
          cardinality: { min: 1, max: null },
          terminology: [{ id: 'b1', role: 'answer-value-set', valueSetCanonical: 'http://snomed.info/sct', strength: 'preferred' }],
          validation: [],
        },
        presentation: { label: 'Diagnosis' },
      },
      value: [{ system: 'http://snomed.info/sct', code: '77075001', display: 'POAG' }],
      query: 'cat',
      options: [{ system: 'http://snomed.info/sct', code: '193570009', display: 'Cataract' }],
      open: true,
      loading: false,
      messages: [{ path: [], severity: 'error', message: 'Invalid code' }],
      emptyMessage: 'None',
      systemLabels: { 'http://snomed.info/sct': 'SNOMED CT' },
    };
    const ciIntents: unknown[] = [];
    ci.addEventListener('intent', e => ciIntents.push((e as CustomEvent).detail));
    document.body.append(ci);
    try {
      await ci.updateComplete;
      expect(ci.shadowRoot!.querySelector('.coded-chip-remove svg')).not.toBeNull();
      const input = ci.shadowRoot!.querySelector('input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await ci.updateComplete;
      expect(input.getAttribute('aria-activedescendant')).toBe('ci-test-option-0');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(ciIntents).toEqual([
        { type: 'conceptSelected', concept: { system: 'http://snomed.info/sct', code: '193570009', display: 'Cataract' } },
      ]);
      ci.model = { ...ci.model, value: [] };
      ci.readOnly = true;
      await ci.updateComplete;
      expect(ci.shadowRoot!.querySelector('.emr-hint')!.textContent).toBe('Not supplied');
      expect(ci.shadowRoot!.querySelector('input')!.readOnly).toBe(true);
    } finally {
      ci.remove();
    }
  });

  it('renders EmrAttestation headingId, clickable signatory, Sign/Amend, assistiveText, and readOnly Not completed.', async () => {
    registerAllEmrElements();
    const att = document.createElement('emr-attestation') as EmrAttestationElement;
    att.controlId = 'att-test';
    att.headingId = 'att-heading';
    att.model = {
      id: 'att-1',
      title: 'Surgical timeout',
      statement: 'Verified patient and site.',
      signatories: [
        {
          id: 's1',
          displayName: 'Dr. Iyer',
          roleLabel: 'Surgeon',
          status: { label: 'Pending', tone: 'warning', assistiveText: 'Awaiting signature' },
        },
      ],
      canSign: true,
      canAmend: true,
    };
    const intents: unknown[] = [];
    att.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    document.body.append(att);
    try {
      await att.updateComplete;
      expect(att.shadowRoot!.querySelector('#att-heading')!.textContent).toBe('Surgical timeout');
      expect(att.shadowRoot!.querySelector('.sr-only')!.textContent).toContain('Awaiting signature');
      att.shadowRoot!.querySelector<HTMLButtonElement>('button.signatory-name')!.click();
      att.shadowRoot!.querySelector<HTMLButtonElement>('.field-options button')!.click();
      expect(intents).toEqual([
        { type: 'signatorySelected', signatoryId: 's1' },
        { type: 'signRequested' },
      ]);
      att.readOnly = true;
      await att.updateComplete;
      expect(att.shadowRoot!.querySelector('button.signatory-name')).toBeNull();
      expect(att.shadowRoot!.querySelector('.emr-hint')!.textContent).toBe('Not completed.');
    } finally {
      att.remove();
    }
  });

  it('renders EmrScaleField Likert/VAS switching, Clear SVG, error/warning propagation, and non-double-framed EmrTypedField', async () => {
    registerAllEmrElements();
    const sf = document.createElement('emr-scale-field') as EmrScaleFieldElement;
    sf.controlId = 'sf-test';
    sf.model = {
      label: 'Ocular pain',
      variant: 'likert',
      value: 3,
      min: 0,
      max: 10,
      hint: 'Before drops',
      messages: [{ severity: 'error', message: 'Required rating' }],
      required: true,
    };
    const intents: unknown[] = [];
    sf.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    document.body.append(sf);
    try {
      await sf.updateComplete;
      const likert = sf.shadowRoot!.querySelector('emr-likert') as HTMLElement & { error?: string; required?: boolean };
      expect(likert).not.toBeNull();
      expect(likert.error).toBe('Required rating');
      expect(likert.required).toBe(true);
      // Clear button still visible when required=true and value !== null
      const clearBtn = sf.shadowRoot!.querySelector<HTMLButtonElement>('.l2-row button')!;
      expect(clearBtn).not.toBeNull();
      clearBtn.click();
      expect(intents).toEqual([{ type: 'valueChangeRequested', value: null }]);

      // ReadOnly hides Clear and blocks mutation
      sf.readOnly = true;
      await sf.updateComplete;
      expect(sf.shadowRoot!.querySelector('.l2-row button')).toBeNull();

      // Switch to VAS
      sf.readOnly = false;
      sf.model = { ...sf.model, variant: 'vas', value: 50, min: 0, max: 100 };
      await sf.updateComplete;
      expect(sf.shadowRoot!.querySelector('emr-vas')).not.toBeNull();
    } finally {
      sf.remove();
    }

    // EmrTypedField scale does not double-wrap <emr-field-frame>
    const tf = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    tf.definition = {
      contract: { linkId: 'pain', valueType: 'scale', cardinality: { min: 0, max: 1 } },
      presentation: { label: 'Pain score', widget: 'likert', min: 0, max: 5 },
    };
    tf.model = { value: 2 };
    document.body.append(tf);
    try {
      await tf.updateComplete;
      expect(tf.shadowRoot!.querySelectorAll('emr-field-frame')).toHaveLength(0);
      expect(tf.shadowRoot!.querySelectorAll('emr-scale-field')).toHaveLength(1);
    } finally {
      tf.remove();
    }
  });

  it('adapts precision cleanly without fabricating -01 in emr-partial-date-field and avoids double framing', async () => {
    registerAllEmrElements();
    const pd = document.createElement('emr-partial-date-field') as EmrPartialDateFieldElement;
    pd.controlId = 'pd-test';
    pd.model = {
      label: 'Symptom onset',
      value: { precision: 'day', value: '2025-11-14' },
      hint: 'Approximate date allowed',
      required: true,
    };
    const intents: unknown[] = [];
    pd.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    document.body.append(pd);
    try {
      await pd.updateComplete;
      const seg = pd.shadowRoot!.querySelector('emr-segmented-control')!;
      // Finer -> coarser truncates to year
      seg.dispatchEvent(new CustomEvent('valueChange', { detail: 'year', bubbles: true, composed: true }));
      expect(intents).toEqual([
        { type: 'precisionChangeRequested', precision: 'year' },
        { type: 'valueChangeRequested', value: { value: '2025', precision: 'year' } },
      ]);
      // Coarser -> finer NEVER fabricates '-01' or '-01-01'
      pd.model = { ...pd.model, value: { precision: 'year', value: '2025' } };
      await pd.updateComplete;
      seg.dispatchEvent(new CustomEvent('valueChange', { detail: 'day', bubbles: true, composed: true }));
      expect(intents.at(-1)).toEqual({ type: 'valueChangeRequested', value: null });
    } finally {
      pd.remove();
    }

    const tf = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    tf.definition = {
      contract: { linkId: 'onset', valueType: 'partial-date', cardinality: { min: 0, max: 1 } },
      presentation: { label: 'Onset' },
    };
    tf.model = { value: { precision: 'year', value: '2024' } };
    document.body.append(tf);
    try {
      await tf.updateComplete;
      expect(tf.shadowRoot!.querySelectorAll('emr-field-frame')).toHaveLength(0);
      expect(tf.shadowRoot!.querySelectorAll('emr-partial-date-field')).toHaveLength(1);
    } finally {
      tf.remove();
    }
  });

  it('supports maxItems capacity, readOnly itemSelected, and non-double-framed EmrTypedField in emr-attachment-field', async () => {
    registerAllEmrElements();
    const af = document.createElement('emr-attachment-field') as EmrAttachmentFieldElement;
    af.controlId = 'af-test';
    af.model = {
      label: 'Clinical reports',
      items: [{ id: 'a1', title: 'scan.pdf', contentType: 'application/pdf', sizeBytes: 1024 }],
      maxItems: 1,
      allowCamera: true,
    };
    const intents: unknown[] = [];
    af.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    document.body.append(af);
    try {
      await af.updateComplete;
      const trigger = af.shadowRoot!.querySelector('emr-file-trigger') as HTMLElement & { disabled?: boolean };
      expect(trigger.disabled).toBe(true);

      // readOnly keeps itemSelected active while hiding Remove/upload controls
      af.readOnly = true;
      await af.updateComplete;
      expect(af.shadowRoot!.querySelector('emr-file-trigger')).toBeNull();
      af.shadowRoot!.querySelector<HTMLButtonElement>('.attachment-select-btn')!.click();
      expect(intents).toEqual([{ type: 'itemSelected', id: 'a1' }]);
    } finally {
      af.remove();
    }

    const tf = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    tf.definition = {
      contract: { linkId: 'docs', valueType: 'attachment', cardinality: { min: 0, max: 3 } },
      presentation: { label: 'Docs' },
    };
    tf.model = { value: [] };
    document.body.append(tf);
    try {
      await tf.updateComplete;
      expect(tf.shadowRoot!.querySelectorAll('emr-field-frame')).toHaveLength(0);
      expect(tf.shadowRoot!.querySelectorAll('emr-attachment-field')).toHaveLength(1);
    } finally {
      tf.remove();
    }
  });

  it('supports definition fallback, independent per-side modes, per-side validation, out-of-range emission, clearable, 6-state status, readOnly, and focus lifecycle on emr-paired-field', async () => {
    registerAllEmrElements();
    const pf = document.createElement('emr-paired-field') as EmrPairedFieldElement;
    pf.controlId = 'pf-test';
    pf.definition = {
      schemaVersion: '1.0',
      contract: {
        linkId: 'bp',
        valueType: 'integer',
        cardinality: { min: 1, max: 1 },
        terminology: [],
        validation: [],
      },
      presentation: {
        label: 'Sitting BP',
        unitDisplay: 'mmHg',
      },
    };
    pf.model = {
      label: '',
      firstLabel: 'Systolic',
      secondLabel: 'Diastolic',
      secondMode: 'text',
      firstMin: 50,
      firstMax: 220,
      value: { first: 120, second: 'N/A' },
      clearable: true,
      hint: 'After 5 min rest',
      messages: [
        { path: ['first'], severity: 'error', message: 'Hypertensive crisis' },
        { path: ['second'], severity: 'warning', message: 'Check diastolic' },
      ],
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };
    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    pf.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    pf.addEventListener('focused', () => { focusCount += 1; });
    pf.addEventListener('blurred', () => { blurCount += 1; });
    document.body.append(pf);
    try {
      await pf.updateComplete;
      const frame = pf.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;
      expect(frame.label).toBe('Sitting BP');
      expect(frame.unit).toBe('');
      expect(pf.shadowRoot!.querySelector('.pf-unit')!.textContent).toBe('mmHg');

      const inputs = pf.shadowRoot!.querySelectorAll<HTMLInputElement>('input');
      expect(inputs).toHaveLength(2);
      // First side falls back to definition.contract.valueType ('integer'), second side uses explicit 'text'
      expect(inputs[0]!.getAttribute('inputmode')).toBe('numeric');
      expect(inputs[1]!.getAttribute('inputmode')).toBeNull();
      // Per-side validation: first has error only, second has warning only
      expect(inputs[0]!.getAttribute('aria-invalid')).toBe('true');
      expect(inputs[0]!.getAttribute('data-warning')).toBeNull();
      expect(inputs[1]!.getAttribute('aria-invalid')).toBeNull();
      expect(inputs[1]!.getAttribute('data-warning')).toBe('true');
      expect(inputs[0]!.getAttribute('aria-required')).toBe('true');
      expect(inputs[0]!.getAttribute('aria-describedby')).toBe('pf-test-message');

      // Focus & incomplete draft preservation + out-of-range critical emission
      inputs[0]!.dispatchEvent(new FocusEvent('focus'));
      expect(focusCount).toBe(1);
      inputs[0]!.value = '-';
      inputs[0]!.dispatchEvent(new Event('input'));
      expect(intents).toEqual([]);
      inputs[0]!.value = '240';
      inputs[0]!.dispatchEvent(new Event('input'));
      expect(intents).toEqual([{ type: 'firstChangeRequested', value: 240 }]);
      inputs[0]!.dispatchEvent(new FocusEvent('blur'));
      expect(blurCount).toBe(1);

      // Clear button emits clearRequested
      const clearBtn = pf.shadowRoot!.querySelector<HTMLButtonElement>('.pf-clear')!;
      expect(clearBtn).not.toBeNull();
      clearBtn.click();
      expect(intents).toContainEqual({ type: 'clearRequested' });

      // 6-state status delegation via EmrFieldFrame
      const radios = frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      radios[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // ReadOnly gating blocks edits and hides Clear
      pf.readOnly = true;
      await pf.updateComplete;
      await frame.updateComplete;
      expect(pf.shadowRoot!.querySelector('.pf-clear')).toBeNull();
      expect(pf.shadowRoot!.querySelectorAll<HTMLInputElement>('input')[0]!.readOnly).toBe(true);
      const countBefore = intents.length;
      pf.shadowRoot!.querySelectorAll<HTMLInputElement>('input')[0]!.value = '110';
      pf.shadowRoot!.querySelectorAll<HTMLInputElement>('input')[0]!.dispatchEvent(new Event('input'));
      expect(intents).toHaveLength(countBefore);
    } finally {
      pf.remove();
    }
  });

  it('supports definition fallback, non-negative amount guard, per-part validation, unitPlaceholder, clearable, 6-state status, readOnly, and lifecycle events on emr-duration-input', async () => {
    registerAllEmrElements();
    const dur = document.createElement('emr-duration-input') as EmrDurationInputElement;
    dur.controlId = 'dur-test';
    dur.definition = {
      schemaVersion: '1.0',
      contract: {
        linkId: 'course-duration',
        valueType: 'integer',
        cardinality: { min: 1, max: 1 },
        terminology: [],
        validation: [],
      },
      presentation: {
        label: 'Course duration',
        hint: 'Enter taper length',
        placeholder: '0',
      },
    };
    dur.model = {
      label: '',
      value: null,
      unitOptions: [
        { value: 'd', label: 'days' },
        { value: 'wk', label: 'weeks' },
      ],
      clearable: true,
      messages: [
        { path: ['amount'], severity: 'error', message: 'Duration required' },
        { path: ['amount'], severity: 'warning', message: 'Suppressed warning' },
        { path: ['unit'], severity: 'warning', message: 'Confirm unit' },
      ],
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };

    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    let clearCount = 0;
    let submitCount = 0;
    dur.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    dur.addEventListener('focused', () => { focusCount += 1; });
    dur.addEventListener('blurred', () => { blurCount += 1; });
    dur.addEventListener('cleared', () => { clearCount += 1; });
    dur.addEventListener('submitted', () => { submitCount += 1; });

    document.body.append(dur);
    try {
      await dur.updateComplete;
      const frame = dur.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;
      expect(frame.label).toBe('Course duration');
      expect(frame.required).toBe(true);

      const qty = dur.shadowRoot!.querySelector('emr-quantity-input') as EmrQuantityInputElement;
      await qty.updateComplete;
      const sel = qty.shadowRoot!.querySelector('emr-select') as EmrSelectElement;
      await sel.updateComplete;

      // unitPlaceholder 'Unit' shown when value === null
      const combo = sel.shadowRoot!.querySelector<HTMLButtonElement>('[role="combobox"]')!;
      expect(combo.textContent).toContain('Unit');

      // Non-negative default (min = 0 -> allowNegative = false): strips '-'
      const inp = qty.shadowRoot!.querySelector<HTMLInputElement>('input[role="spinbutton"]')!;
      expect(inp.getAttribute('inputmode')).toBe('numeric');
      expect(inp.getAttribute('aria-invalid')).toBe('true');
      expect(inp.getAttribute('data-warning')).toBeNull();
      expect(inp.getAttribute('aria-describedby')).toBe('dur-test-message');

      // Unit side has warning only (no error)
      expect(combo.getAttribute('aria-invalid')).toBeNull();
      expect(sel.shadowRoot!.querySelector('.select-bar--warning')).not.toBeNull();

      // Focus, negative stripping, comma-safe valid input, Enter submit, blur
      inp.dispatchEvent(new FocusEvent('focus'));
      expect(focusCount).toBe(1);
      inp.value = '-5';
      inp.dispatchEvent(new Event('input'));
      expect(inp.value).toBe('5');
      expect(intents).toEqual([{ type: 'amountChangeRequested', amount: 5 }]);
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(submitCount).toBe(1);
      inp.dispatchEvent(new FocusEvent('blur'));
      expect(blurCount).toBe(1);

      // Clear button emits clearRequested + cleared without duplicate amountChangeRequested(null)
      dur.model = { ...dur.model, value: { amount: 5, unit: 'wk' } };
      await dur.updateComplete;
      await qty.updateComplete;
      const clearBtn = qty.shadowRoot!.querySelector<HTMLButtonElement>('.clear-inline-btn')!;
      expect(clearBtn).not.toBeNull();
      clearBtn.click();
      expect(clearCount).toBe(1);
      expect(intents).toContainEqual({ type: 'clearRequested' });
      expect(intents.filter(i => (i as { type: string }).type === 'amountChangeRequested')).toHaveLength(1);

      // 6-state status via EmrFieldFrame
      frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // readOnly locks edits & hides Clear
      dur.readOnly = true;
      await dur.updateComplete;
      await frame.updateComplete;
      await qty.updateComplete;
      expect(qty.shadowRoot!.querySelector('.clear-inline-btn')).toBeNull();
      expect(qty.shadowRoot!.querySelector<HTMLInputElement>('input[role="spinbutton"]')!.readOnly).toBe(true);
      const countBefore = intents.length;
      qty.shadowRoot!.querySelector<HTMLInputElement>('input[role="spinbutton"]')!.value = '9';
      qty.shadowRoot!.querySelector<HTMLInputElement>('input[role="spinbutton"]')!.dispatchEvent(new Event('input'));
      expect(intents).toHaveLength(countBefore);
    } finally {
      dur.remove();
    }
  });

  it('supports 4 kinds, non-clamping numeric typing, per-side validation, clearable, 6-state status, readOnly, and lifecycle events on emr-range-field', async () => {
    registerAllEmrElements();
    const rf = document.createElement('emr-range-field') as EmrRangeFieldElement;
    rf.controlId = 'rf-test';
    rf.model = {
      label: 'Target IOP range',
      kind: 'number',
      unit: 'mmHg',
      value: { low: 10, high: 14 },
      lowMin: 5,
      lowMax: 40,
      highMin: 5,
      highMax: 40,
      showSteppers: true,
      clearable: true,
      lowError: 'Low too low',
      highWarning: 'Near ceiling',
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };

    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    let clearCount = 0;
    let submitCount = 0;
    rf.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    rf.addEventListener('focused', () => { focusCount += 1; });
    rf.addEventListener('blurred', () => { blurCount += 1; });
    rf.addEventListener('cleared', () => { clearCount += 1; });
    rf.addEventListener('submitted', () => { submitCount += 1; });

    document.body.append(rf);
    try {
      await rf.updateComplete;
      const frame = rf.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;
      expect(frame.unit).toBe('mmHg');

      const inputs = rf.shadowRoot!.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]');
      expect(inputs).toHaveLength(2);
      expect(inputs[0]!.getAttribute('aria-invalid')).toBe('true');
      expect(inputs[0]!.getAttribute('data-warning')).toBeNull();
      expect(inputs[1]!.getAttribute('aria-invalid')).toBeNull();
      expect(inputs[1]!.getAttribute('data-warning')).toBe('true');

      // Group focus / non-clamping inverted range typing / Enter submit / blur
      const row = rf.shadowRoot!.querySelector<HTMLElement>('.rf-row')!;
      row.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(focusCount).toBe(1);
      inputs[0]!.value = '25';
      inputs[0]!.dispatchEvent(new Event('input'));
      expect(intents).toContainEqual({ type: 'lowChangeRequested', low: 25 });
      inputs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(submitCount).toBe(1);
      row.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      expect(blurCount).toBe(1);

      // Clear button
      const clearBtn = rf.shadowRoot!.querySelector<HTMLButtonElement>('.pf-clear')!;
      expect(clearBtn).not.toBeNull();
      clearBtn.click();
      expect(clearCount).toBe(1);
      expect(intents).toContainEqual({ type: 'clearRequested' });

      // 6-state status via EmrFieldFrame
      frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // Temporal modes: date, time, datetime
      rf.model = { label: 'Window', kind: 'date', value: { low: '2026-10-01', high: '2026-10-14' } };
      await rf.updateComplete;
      expect(rf.shadowRoot!.querySelectorAll('emr-date-input')).toHaveLength(2);
      expect(rf.shadowRoot!.querySelectorAll('.sub-label')[0]!.textContent?.trim()).toBe('From');
      expect(rf.shadowRoot!.querySelectorAll('.sub-label')[1]!.textContent?.trim()).toBe('To');

      rf.model = { label: 'Clinic hours', kind: 'time', value: { low: '08:00', high: '17:30' } };
      await rf.updateComplete;
      expect(rf.shadowRoot!.querySelectorAll('emr-time-input')).toHaveLength(2);

      rf.model = { label: 'Admission window', kind: 'datetime', value: { low: '2026-10-14T08:00:00Z', high: '2026-10-14T17:30:00Z' } };
      await rf.updateComplete;
      expect(rf.shadowRoot!.querySelectorAll('emr-datetime-input')).toHaveLength(2);

      // readOnly blocks edits & hides Clear
      rf.model = { label: 'Target IOP', kind: 'number', value: { low: 10, high: 14 } };
      rf.readOnly = true;
      await rf.updateComplete;
      expect(rf.shadowRoot!.querySelector('.pf-clear')).toBeNull();
      expect(rf.shadowRoot!.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')[0]!.readOnly).toBe(true);
    } finally {
      rf.remove();
    }
  });

  it('supports per-part validation, extension toggle, clearable, badge, preview, channel gating, 6-state status, lifecycle events, and readOnly on emr-phone-input', async () => {
    registerAllEmrElements();
    const ph = document.createElement('emr-phone-input') as EmrPhoneInputElement;
    ph.controlId = 'ph-test';
    ph.model = {
      label: 'Primary contact number',
      countryCode: '+91',
      countryOptions: [
        { code: '+91', label: 'India (+91)' },
        { code: '+1', label: 'United States (+1)' },
      ],
      nationalNumber: '9876543210',
      extension: '204',
      showExtension: true,
      clearable: true,
      required: true,
      maxLength: 15,
      extensionMaxLength: 6,
      formattedPreview: '+91 98765 43210 ext. 204',
      verifiedBadge: { label: 'OTP verified', tone: 'success' },
      availableChannels: [
        { id: 'voice', label: 'Voice' },
        { id: 'sms', label: 'SMS', readOnly: true },
        { id: 'whatsapp', label: 'WhatsApp', disabled: true },
      ],
      channels: ['voice'],
      hint: 'Used for alerts',
      messages: [
        { path: ['nationalNumber'], severity: 'error', message: 'Check digits' },
        { path: ['countryCode'], severity: 'warning', message: 'Verify ISD' },
        { path: ['extension'], severity: 'warning', message: 'Check ext' },
        { path: ['channels'], severity: 'warning', message: 'Pick channel' },
      ],
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };

    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    let submitCount = 0;
    ph.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    ph.addEventListener('focused', () => { focusCount += 1; });
    ph.addEventListener('blurred', () => { blurCount += 1; });
    ph.addEventListener('submitted', () => { submitCount += 1; });

    document.body.append(ph);
    try {
      await ph.updateComplete;
      const frame = ph.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;
      const countrySel = ph.shadowRoot!.querySelector('emr-select') as HTMLElement & { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot | null };
      await countrySel.updateComplete;

      // No duplicate sr-only warning inside emr-select
      expect(countrySel.shadowRoot!.querySelector('.select-bar--warning')).not.toBeNull();
      expect(countrySel.shadowRoot!.querySelector('.emr-sr-only')).toBeNull();
      expect(countrySel.shadowRoot!.querySelector('[role="combobox"]')!.getAttribute('aria-describedby')).toBe('ph-test-message');

      // Leading icon, national number, extension, preview, badge
      expect(ph.shadowRoot!.querySelector('.ph-leading-icon svg')).not.toBeNull();
      const numInp = ph.shadowRoot!.querySelector<HTMLInputElement>('#ph-test')!;
      expect(numInp.getAttribute('aria-invalid')).toBe('true');
      expect(numInp.getAttribute('aria-required')).toBe('true');
      expect(numInp.getAttribute('maxlength')).toBe('15');
      expect(numInp.getAttribute('autocomplete')).toBe('tel-national');

      const extInp = ph.shadowRoot!.querySelector<HTMLInputElement>('#ph-test-ext')!;
      expect(extInp.getAttribute('data-warning')).toBe('true');
      expect(extInp.getAttribute('maxlength')).toBe('6');
      expect(extInp.getAttribute('autocomplete')).toBe('tel-extension');

      expect(ph.shadowRoot!.querySelector('.ph-preview')!.textContent).toBe('+91 98765 43210 ext. 204');
      expect(ph.shadowRoot!.querySelector('emr-badge')).not.toBeNull();

      // Group focus / inner select focus suppression / Enter submit / blur
      const group = ph.shadowRoot!.querySelector<HTMLElement>('[role="group"]')!;
      group.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(focusCount).toBe(1);
      countrySel.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
      countrySel.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      expect(focusCount).toBe(1);
      expect(blurCount).toBe(0);
      numInp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(submitCount).toBe(1);
      group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      expect(blurCount).toBe(1);

      // Clear button
      const clearBtn = ph.shadowRoot!.querySelector<HTMLButtonElement>('.pf-clear')!;
      expect(clearBtn.getAttribute('data-emr-print')).toBe('hide');
      clearBtn.click();
      expect(intents).toContainEqual({ type: 'clearRequested' });

      // Channel gating (active vs readOnly vs disabled)
      const chBtns = ph.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.ph-channel[role="checkbox"]');
      expect(chBtns).toHaveLength(3);
      expect(chBtns[0]!.getAttribute('aria-checked')).toBe('true');
      expect(chBtns[1]!.getAttribute('aria-readonly')).toBe('true');
      expect(chBtns[2]!.disabled).toBe(true);
      chBtns[0]!.click();
      chBtns[1]!.click();
      chBtns[2]!.click();
      expect(intents.filter(i => (i as { type: string }).type === 'channelToggleRequested')).toEqual([
        { type: 'channelToggleRequested', channel: 'voice' },
      ]);

      // 6-state status via EmrFieldFrame
      frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // readOnly locks edits & hides Clear
      ph.readOnly = true;
      await ph.updateComplete;
      expect(ph.shadowRoot!.querySelector('.pf-clear')).toBeNull();
      expect(ph.shadowRoot!.querySelector<HTMLInputElement>('#ph-test')!.readOnly).toBe(true);
    } finally {
      ph.remove();
    }
  });

  it('supports per-part EmrNodePath validation, Shadow DOM labels, emr-select state/country, DEFAULT_ADDRESS_USE_OPTIONS, clearable, 6-state status, focus lifecycle, and readOnly rollback on emr-address-field', async () => {
    registerAllEmrElements();
    const addr = document.createElement('emr-address-field') as EmrAddressFieldElement;
    addr.controlId = 'addr-test';
    addr.model = {
      label: 'Residential address',
      use: 'home',
      value: {
        line1: '14 Ansari Nagar East',
        line2: 'Gate 2',
        city: 'New Delhi',
        district: '',
        state: 'DL',
        postalCode: '110029',
        country: 'IN',
      },
      stateOptions: [
        { value: 'DL', label: 'Delhi (DL)' },
        { value: 'MH', label: 'Maharashtra (MH)' },
      ],
      countryOptions: [
        { value: 'IN', label: 'India (IN)' },
        { value: 'US', label: 'United States (US)' },
      ],
      showDistrict: false,
      clearable: true,
      required: true,
      requiredParts: ['line1', 'postalCode'],
      labels: { postalCode: 'PIN code' },
      placeholders: { postalCode: '6-digit PIN' },
      maxLengths: { postalCode: 6 },
      hint: 'Used for ABHA KYC',
      error: 'Verify core address',
      messages: [
        { path: ['line2'], severity: 'warning', message: 'Check landmark' },
        { path: ['postalCode'], severity: 'warning', message: 'Suppressed warning' },
      ],
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };

    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    addr.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    addr.addEventListener('focused', () => { focusCount += 1; });
    addr.addEventListener('blurred', () => { blurCount += 1; });

    document.body.append(addr);
    try {
      await addr.updateComplete;
      const frame = addr.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;

      // DEFAULT_ADDRESS_USE_OPTIONS fallback when use !== undefined && !useOptions
      const seg = addr.shadowRoot!.querySelector('emr-segmented-control') as HTMLElement & { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot | null };
      await seg.updateComplete;
      expect(seg.shadowRoot!.querySelectorAll('[role="radio"]')).toHaveLength(4);

      // District hidden -> city spans full width; Shadow DOM <label for> matches inputs
      const cityInp = addr.shadowRoot!.querySelector<HTMLInputElement>('#addr-test-city')!;
      expect(cityInp.closest('.addr-cell')!.classList.contains('addr-cell--full')).toBe(true);
      expect(addr.shadowRoot!.querySelector('#addr-test-district')).toBeNull();
      expect(addr.shadowRoot!.querySelector('label[for="addr-test"]')).not.toBeNull();
      expect(addr.shadowRoot!.querySelector('label[for="addr-test-line2"]')).not.toBeNull();
      expect(addr.shadowRoot!.querySelector('label[for="addr-test-city"]')).not.toBeNull();
      expect(addr.shadowRoot!.querySelector('label[for="addr-test-postalCode"]')).not.toBeNull();

      // Per-part validation: root error hits core parts, NOT optional line2; postal warning suppressed by root error
      const line1Inp = addr.shadowRoot!.querySelector<HTMLInputElement>('#addr-test')!;
      const line2Inp = addr.shadowRoot!.querySelector<HTMLInputElement>('#addr-test-line2')!;
      const postalInp = addr.shadowRoot!.querySelector<HTMLInputElement>('#addr-test-postalCode')!;
      expect(line1Inp.getAttribute('aria-invalid')).toBe('true');
      expect(line1Inp.getAttribute('aria-required')).toBe('true');
      expect(line1Inp.getAttribute('autocomplete')).toBe('address-line1');
      expect(line1Inp.getAttribute('aria-describedby')).toBe('addr-test-message');
      expect(line2Inp.getAttribute('aria-invalid')).toBeNull();
      expect(line2Inp.getAttribute('data-warning')).toBe('true');
      expect(postalInp.getAttribute('aria-invalid')).toBe('true');
      expect(postalInp.getAttribute('data-warning')).toBeNull();
      expect(postalInp.getAttribute('aria-required')).toBe('true');
      expect(postalInp.getAttribute('maxlength')).toBe('6');
      expect(postalInp.getAttribute('placeholder')).toBe('6-digit PIN');
      expect(postalInp.getAttribute('autocapitalize')).toBe('characters');
      expect(addr.shadowRoot!.querySelector('label[for="addr-test-postalCode"]')!.textContent).toContain('PIN code');

      // Option-backed state & country use <emr-select> without duplicate labels
      const selects = addr.shadowRoot!.querySelectorAll('emr-select');
      expect(selects).toHaveLength(2);
      const stateSel = selects[0] as HTMLElement & { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot | null };
      await stateSel.updateComplete;
      expect(stateSel.shadowRoot!.querySelector('.emr-sr-only')).toBeNull();
      expect(stateSel.shadowRoot!.querySelector('[role="combobox"]')!.getAttribute('aria-invalid')).toBe('true');
      expect(stateSel.shadowRoot!.querySelector('[role="combobox"]')!.getAttribute('aria-describedby')).toBe('addr-test-message');
      stateSel.dispatchEvent(new CustomEvent('valueChange', { detail: 'MH', bubbles: true, composed: true }));
      expect(intents).toContainEqual({ type: 'fieldChangeRequested', part: 'state', value: 'MH' });

      // Group focus / inner custom event suppression / blur
      const group = addr.shadowRoot!.querySelector<HTMLElement>('[role="group"]')!;
      group.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(focusCount).toBe(1);
      stateSel.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
      stateSel.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      seg.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
      seg.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      expect(focusCount).toBe(1);
      expect(blurCount).toBe(0);
      group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      expect(blurCount).toBe(1);

      // Clear button
      const clearBtn = addr.shadowRoot!.querySelector<HTMLButtonElement>('.pf-clear')!;
      expect(clearBtn.getAttribute('data-emr-print')).toBe('hide');
      clearBtn.click();
      expect(intents).toContainEqual({ type: 'cleared' });

      // 6-state status via EmrFieldFrame
      frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // readOnly locks edits, rolls back blur, & hides Clear
      addr.readOnly = true;
      await addr.updateComplete;
      expect(addr.shadowRoot!.querySelector('.pf-clear')).toBeNull();
      const lockedLine1 = addr.shadowRoot!.querySelector<HTMLInputElement>('#addr-test')!;
      expect(lockedLine1.readOnly).toBe(true);
      const countBefore = intents.length;
      lockedLine1.value = 'Tampered';
      lockedLine1.dispatchEvent(new Event('input', { bubbles: true }));
      expect(intents.length).toBe(countBefore);
      expect(lockedLine1.value).toBe('14 Ansari Nagar East');
      lockedLine1.value = 'Tampered2';
      lockedLine1.dispatchEvent(new Event('blur', { bubbles: true }));
      expect(lockedLine1.value).toBe('14 Ansari Nagar East');
    } finally {
      addr.remove();
    }
  });

  it('supports EmrMacroTextField combobox ARIA, cursor triggers, keyboard nav, clear/dictate/status intents, counter, and readOnly lock', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-macro-text-field') as EmrMacroTextFieldElement;
    el.controlId = 'macro-test';
    el.model = {
      label: 'Anterior segment findings',
      value: 'Lids normal. .clr',
      suggestionsOpen: true,
      suggestions: [
        {
          trigger: '.clearcornea',
          label: 'Clear cornea',
          expansionPreview: 'Cornea clear, AC deep and quiet.',
          category: 'Anterior',
        },
        {
          trigger: '.normfundus',
          label: 'Normal fundus',
          expansionPreview: 'Disc pink, sharp margins.',
          category: 'Posterior',
        },
      ],
      clearable: true,
      maxLength: 280,
      dictating: false,
      required: true,
      hint: 'Type . or /',
      messages: [{ path: [], severity: 'warning', message: 'Confirm laterality' }],
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };

    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    el.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    el.addEventListener('focused', () => { focusCount += 1; });
    el.addEventListener('blurred', () => { blurCount += 1; });

    document.body.append(el);
    try {
      await el.updateComplete;
      const frame = el.shadowRoot!.querySelector('emr-field-frame') as EmrFieldFrameElement;
      await frame.updateComplete;

      const area = el.shadowRoot!.querySelector<HTMLTextAreaElement>('#macro-test')!;
      expect(area.getAttribute('role')).toBe('combobox');
      expect(area.getAttribute('aria-autocomplete')).toBe('list');
      expect(area.getAttribute('aria-haspopup')).toBe('listbox');
      expect(area.getAttribute('aria-expanded')).toBe('true');
      expect(area.getAttribute('aria-controls')).toBe('macro-test-macros');
      expect(area.getAttribute('aria-activedescendant')).toBe('macro-test-macro-0');
      expect(area.getAttribute('aria-required')).toBe('true');
      expect(area.getAttribute('data-warning')).toBe('true');
      expect(area.getAttribute('aria-invalid')).toBeNull();
      expect(area.getAttribute('aria-describedby')).toBe('macro-test-message macro-test-counter');
      expect(el.shadowRoot!.querySelector('#macro-test-counter')!.textContent?.trim()).toBe('17 / 280');

      // Toolbar above textarea
      const toolbar = el.shadowRoot!.querySelector('.macro-toolbar')!;
      expect(toolbar.getAttribute('data-emr-print')).toBe('hide');
      expect(toolbar.compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // ArrowDown + Enter selects second option
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(area.getAttribute('aria-activedescendant')).toBe('macro-test-macro-1');
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(intents).toContainEqual({ type: 'macroSelected', trigger: '.normfundus' });

      // Escape dismisses
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(intents).toContainEqual({ type: 'macroDismissRequested' });

      // Clear & Dictate & Status
      el.shadowRoot!.querySelector<HTMLButtonElement>('.pf-clear')!.click();
      expect(intents).toContainEqual({ type: 'clearRequested' });
      el.shadowRoot!.querySelector<HTMLButtonElement>('.emr-btn')!.click();
      expect(intents).toContainEqual({ type: 'dictationToggleRequested' });
      frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // Empty suggestions renders role="status" with no empty role="listbox" or aria-controls
      el.model = { ...el.model, suggestions: [], suggestionsOpen: true };
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('[role="listbox"]')).toBeNull();
      expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain('No matching SmartPhrases');
      expect(area.getAttribute('aria-controls')).toBeNull();

      // Close button dismisses and restores focus to textarea
      el.shadowRoot!.querySelector<HTMLButtonElement>('.macro-popover-close')!.click();
      expect(intents.filter((x: any) => x.type === 'macroDismissRequested').length).toBeGreaterThanOrEqual(2);
      expect(el.shadowRoot!.activeElement).toBe(area);

      // Focus/blur & cursor-aware input
      const focusBefore = focusCount;
      const blurBefore = blurCount;
      area.dispatchEvent(new FocusEvent('focus'));
      area.dispatchEvent(new FocusEvent('blur'));
      expect(focusCount).toBe(focusBefore + 1);
      expect(blurCount).toBe(blurBefore + 1);

      area.value = '6/6';
      area.setSelectionRange(3, 3);
      area.dispatchEvent(new Event('input'));
      expect(intents).toContainEqual({ type: 'valueChangeRequested', value: '6/6' });
      expect(intents).not.toContainEqual({ type: 'macroQueryRequested', trigger: '/6' });

      // readOnly locks edits & hides toolbar/popover
      el.readOnly = true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.macro-toolbar')).toBeNull();
      expect(el.shadowRoot!.querySelector('.macro-popover')).toBeNull();
      expect(area.readOnly).toBe(true);
      expect(area.getAttribute('aria-readonly')).toBe('true');
      const countBefore = intents.length;
      area.value = 'Tampered';
      area.dispatchEvent(new Event('input'));
      expect(intents.length).toBe(countBefore);
      expect(area.value).toBe('Lids normal. .clr');
    } finally {
      el.remove();
    }
  });

  it('supports emr-laterality-field presets, keyboard navigation, clearable, scoped validation, confirmation, 6-state status, and readOnly', async () => {
    const el = document.createElement('emr-laterality-field') as EmrLateralityFieldElement;
    el.controlId = 'lat-test';
    el.layout = 'horizontal';
    el.size = 'lg';
    el.model = {
      label: 'Operative site',
      domain: 'anatomical',
      value: 'right',
      requiresConfirmation: true,
      confirmed: false,
      hint: 'Verify against consent form',
      messages: [
        { path: ['value'], severity: 'warning', message: 'Double check limb side' },
        { path: ['confirmed'], severity: 'error', message: 'Surgical site verification required' },
      ],
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded' },
        { value: 'declined', label: 'Declined' },
      ],
    };

    const intents: unknown[] = [];
    let clearedCount = 0;
    let focusCount = 0;
    let blurCount = 0;
    el.addEventListener('intent', e => intents.push((e as CustomEvent).detail));
    el.addEventListener('cleared', () => {
      clearedCount += 1;
    });
    el.addEventListener('focused', () => {
      focusCount += 1;
    });
    el.addEventListener('blurred', () => {
      blurCount += 1;
    });

    document.body.append(el);
    try {
      await el.updateComplete;
      const frame = el.shadowRoot!.querySelector('emr-field-frame') as HTMLElement & {
        updateComplete: Promise<boolean>;
        shadowRoot: ShadowRoot | null;
      };
      await frame.updateComplete;
      const seg = el.shadowRoot!.querySelector('emr-segmented-control') as HTMLElement & {
        updateComplete: Promise<boolean>;
        shadowRoot: ShadowRoot | null;
      };
      await seg.updateComplete;
      const cb = el.shadowRoot!.querySelector('emr-checkbox') as HTMLElement & {
        updateComplete: Promise<boolean>;
        shadowRoot: ShadowRoot | null;
      };
      await cb.updateComplete;

      // Single alert in frame only (zero duplicate alerts inside segmented or checkbox)
      expect(frame.shadowRoot!.querySelectorAll('[role="alert"]').length).toBe(1);
      expect(seg.shadowRoot!.querySelectorAll('[role="alert"], [role="status"]').length).toBe(0);
      expect(cb.shadowRoot!.querySelectorAll('[role="alert"], [role="status"]').length).toBe(0);

      // Scoped validation: group warning only, checkbox invalid only
      const track = seg.shadowRoot!.querySelector('[role="radiogroup"]')!;
      expect(track.classList.contains('segmented-track--lg')).toBe(true);
      expect(track.classList.contains('segmented-track--warning')).toBe(true);
      expect(track.classList.contains('segmented-track--invalid')).toBe(false);
      expect(track.getAttribute('aria-labelledby')).toBe('lat-test-label');
      expect(track.getAttribute('aria-describedby')).toBe('lat-test-message');

      const cbBtn = cb.shadowRoot!.querySelector('button[role="checkbox"]')!;
      expect(cbBtn.getAttribute('aria-invalid')).toBe('true');
      expect(cbBtn.getAttribute('aria-describedby')).toBe('lat-test-message');
      expect(cbBtn.textContent).toContain('Surgical site and laterality verified');

      // Anatomic preset rendered 4 options (R, L, BIL, U)
      const radios = seg.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      expect(radios.length).toBe(4);
      expect(radios[0]!.getAttribute('tabindex')).toBe('0');
      expect(radios[1]!.getAttribute('tabindex')).toBe('-1');

      // ArrowRight + End keyboard navigation
      radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(intents).toContainEqual({ type: 'lateralitySelected', code: 'left' });

      // Clear button visible when optional & value !== null, has print-hide, emits both intent and cleared
      const clearBtn = seg.shadowRoot!.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')!;
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.getAttribute('data-emr-print')).toBe('hide');
      clearBtn.click();
      expect(intents).toContainEqual({ type: 'lateralitySelected', code: null });
      expect(clearedCount).toBe(1);

      // Confirmation checkbox toggle
      cbBtn.click();
      expect(intents).toContainEqual({ type: 'confirmationChangeRequested', confirmed: true });

      // Status strip change
      frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]!.click();
      expect(intents).toContainEqual({ type: 'statusChangeRequested', status: 'declined' });

      // Ophthalmic preset + definition fallback + labelHidden + headingId
      el.headingId = 'ext-lat-heading';
      el.labelHidden = true;
      el.definition = {
        schemaVersion: '1.0',
        contract: {
          linkId: 'eye-lat',
          valueType: 'code',
          cardinality: { min: 1, max: 1 },
          terminology: [],
          validation: [],
        },
        presentation: {
          label: 'Eye from def',
          unitDisplay: 'Eye',
        },
      };
      el.model = {
        label: '',
        domain: 'ophthalmic',
        value: 'OD',
      };
      await el.updateComplete;
      await frame.updateComplete;
      await seg.updateComplete;
      expect(seg.shadowRoot!.querySelectorAll('button[role="radio"]').length).toBe(3);
      expect(seg.shadowRoot!.querySelector('[role="radiogroup"]')!.getAttribute('aria-labelledby')).toBe('ext-lat-heading');
      // Required field defaults clearable to false unless overridden
      expect(seg.shadowRoot!.querySelector('[data-clear-btn="true"]')).toBeNull();

      // Focus/blur tracking
      const stack = el.shadowRoot!.querySelector('.l2-stack')!;
      stack.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      stack.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      expect(focusCount).toBe(1);
      expect(blurCount).toBe(1);

      // readOnly blocks all intents
      el.readOnly = true;
      await el.updateComplete;
      await seg.updateComplete;
      const before = intents.length;
      seg.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[1]!.click();
      expect(intents.length).toBe(before);
    } finally {
      el.remove();
    }
  });
});
