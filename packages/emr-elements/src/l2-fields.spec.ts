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
});
