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
  EmrRangeFieldElement,
  EmrRefractionFieldElement,
  EmrScaleFieldElement,
  EmrScheduleSlotPickerElement,
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
      expect(radios[1]!.getAttribute('aria-checked')).toBe('true');
      radios[0]!.click();
      const input = identifier.shadowRoot!.querySelector('input')!;
      input.value = 'MRN-42';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(identIntents).toEqual([
        { type: 'typeSelected', id: 'a' },
        { type: 'valueChanged', raw: 'MRN-42' },
      ]);
      expect(identifier.model?.selectedType).toBe('b');
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
      attestation.shadowRoot!.querySelector('button')!.click();
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
    expect(pdIntents).toEqual([{ type: 'precisionChangeRequested', precision: 'month' }]);
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
    const firstNum = paired.shadowRoot!.querySelectorAll('emr-number-input')[0] as EmrNumberInputElement;
    await firstNum.updateComplete;
    const firstInp = firstNum.shadowRoot!.querySelector('input')!;
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
    const durSeg = dur.shadowRoot!.querySelector('emr-segmented-control')!;
    await (durSeg as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    durSeg.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(durIntents).toEqual([{ type: 'unitChangeRequested', unit: 'wk' }]);
    dur.remove();

    // 6. emr-range-field
    const range = document.createElement('emr-range-field') as EmrRangeFieldElement;
    range.model = { label: 'Target IOP', kind: 'numeric', unit: 'mmHg', value: { low: 10, high: 18 } };
    const rangeIntents: unknown[] = [];
    range.addEventListener('intent', e => rangeIntents.push((e as CustomEvent).detail));
    document.body.append(range);
    await range.updateComplete;
    const lowNum = range.shadowRoot!.querySelectorAll('emr-number-input')[0] as EmrNumberInputElement;
    await lowNum.updateComplete;
    const lowInp = lowNum.shadowRoot!.querySelector('input')!;
    lowInp.value = '12';
    lowInp.dispatchEvent(new Event('input'));
    expect(rangeIntents).toEqual([{ type: 'lowChangeRequested', low: 12 }]);
    range.remove();

    // 7. emr-signature-capture-field
    const sig = document.createElement('emr-signature-capture-field') as EmrSignatureCaptureFieldElement;
    sig.model = {
      label: 'Clinician signature',
      signerLabel: 'Dr Vivek Gupta',
      strokes: [{ points: [{ x: 10, y: 10 }, { x: 60, y: 30 }] }],
    };
    const sigIntents: unknown[] = [];
    sig.addEventListener('intent', e => sigIntents.push((e as CustomEvent).detail));
    document.body.append(sig);
    await sig.updateComplete;
    expect(sig.shadowRoot!.querySelectorAll('svg polyline')).toHaveLength(1);
    const svgPad = sig.shadowRoot!.querySelector('svg')!;
    svgPad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 140, right: 480, bottom: 140, x: 0, y: 0, toJSON: () => ({}) });
    svgPad.dispatchEvent(new MouseEvent('pointerdown', { clientX: 24, clientY: 35, bubbles: true }));
    svgPad.dispatchEvent(new MouseEvent('pointermove', { clientX: 96, clientY: 70, bubbles: true }));
    svgPad.dispatchEvent(new MouseEvent('pointerup', { clientX: 96, clientY: 70, bubbles: true }));
    expect(sigIntents).toHaveLength(1);
    expect((sigIntents[0] as { type: string }).type).toBe('strokeAdded');
    const clearBtn = [...sig.shadowRoot!.querySelectorAll('button')].find(b => b.textContent?.includes('Clear'))!;
    clearBtn.click();
    expect(sigIntents[1]).toEqual({ type: 'clearRequested' });
    sig.remove();

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
    addr.model = {
      label: 'Home address',
      value: { line1: '', city: '', district: '', state: '', postalCode: '', country: 'IN' },
    };
    const addrIntents: unknown[] = [];
    addr.addEventListener('intent', e => addrIntents.push((e as CustomEvent).detail));
    document.body.append(addr);
    await addr.updateComplete;
    const line1 = addr.shadowRoot!.querySelector('emr-text-input') as EmrTextInputElement;
    await line1.updateComplete;
    const line1Inp = line1.shadowRoot!.querySelector('input')!;
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
    lat.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[1]!.click();
    expect(latIntents).toEqual([{ type: 'lateralitySelected', code: 'OS' }]);
    lat.remove();

    // 12. emr-visual-acuity-field
    const va = document.createElement('emr-visual-acuity-field') as EmrVisualAcuityFieldElement;
    va.model = {
      label: 'Visual acuity (OD)',
      eye: 'OD',
      notation: 'snellen-6m',
      notationOptions: [
        { value: 'snellen-6m', label: 'Snellen 6m' },
        { value: 'logmar', label: 'logMAR' },
      ],
      correction: 'unaided',
      correctionOptions: [{ value: 'unaided', label: 'Unaided' }],
      value: '6/9',
      valueOptions: [{ value: '6/6', label: '6/6' }, { value: '6/9', label: '6/9' }],
      status: 'measured',
    };
    const vaIntents: unknown[] = [];
    va.addEventListener('intent', e => vaIntents.push((e as CustomEvent).detail));
    document.body.append(va);
    await va.updateComplete;
    const vaSeg = va.shadowRoot!.querySelector('emr-segmented-control')!;
    await (vaSeg as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    vaSeg.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(vaIntents).toEqual([{ type: 'notationChangeRequested', notation: 'logmar' }]);
    va.remove();

    // 13. emr-refraction-field
    const rx = document.createElement('emr-refraction-field') as EmrRefractionFieldElement;
    rx.model = {
      label: 'Subjective refraction (OD)',
      eye: 'OD',
      value: { sphere: -1.5, cylinder: -0.75, axis: 90, nearAdd: 2.0 },
      status: 'measured',
      showNearAdd: true,
    };
    const rxIntents: unknown[] = [];
    rx.addEventListener('intent', e => rxIntents.push((e as CustomEvent).detail));
    document.body.append(rx);
    await rx.updateComplete;
    const sphereInput = rx.shadowRoot!.querySelectorAll('emr-number-input')[0] as EmrNumberInputElement;
    await sphereInput.updateComplete;
    const sphereNative = sphereInput.shadowRoot!.querySelector('input')!;
    sphereNative.value = '-2.25';
    sphereNative.dispatchEvent(new Event('input'));
    expect(rxIntents).toEqual([{ type: 'sphereChangeRequested', sphere: -2.25 }]);
    rx.remove();
  });
});
