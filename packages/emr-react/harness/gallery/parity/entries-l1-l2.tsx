'use client';

import { Text, View } from 'react-native';
import type {
  AttestationIntent,
  AttestationViewModel,
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  EmrBadge,
  EmrCodedValue,
  EmrFieldDefinition,
  EmrOption,
  EmrTone,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
} from '@drguptavivek/emr-controller';
import {
  EmrAlert,
  EmrAttestation,
  EmrBadgeView,
  EmrBarcodeScanField,
  EmrButton,
  EmrCard,
  EmrCheckbox,
  EmrChip,
  EmrCodedInput,
  EmrColumns,
  EmrDateInput,
  EmrDateTimeInput,
  EmrFieldFrame,
  EmrFieldValueRow,
  EmrLikert,
  EmrNumberInput,
  EmrPairedInput,
  EmrQuantityInput,
  EmrRadioGroup,
  EmrScheduleSlotPicker,
  EmrSearchSelect,
  EmrSelect,
  EmrSeparator,
  EmrStageStepper,
  EmrStateMessage,
  EmrStatTile,
  EmrStatusCell,
  EmrTabs,
  EmrTextInput,
  EmrTimeInput,
  EmrToggle,
  EmrTypedField,
  EmrVas,
  useEmrTheme,
} from '../../../src';
import { LitElementHost } from './lit-element-host';
import { defineParityEntry, type ParityEntry } from './types';

function ThemedText({ children }: { children: string }) {
  const t = useEmrTheme();
  return <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontFamily }}>{children}</Text>;
}

const EYE_OPTIONS: EmrOption[] = [
  { value: 'OD', label: 'Right eye (OD)' },
  { value: 'OS', label: 'Left eye (OS)' },
  { value: 'OU', label: 'Both eyes (OU)' },
];

const PRIORITY_OPTIONS: EmrOption[] = [
  { value: 'routine', label: 'Routine (4 weeks)' },
  { value: 'soon', label: 'Soon (7 days)' },
  { value: 'urgent', label: 'Urgent (24 hours)' },
];

const IOP_UNITS: EmrOption[] = [
  { value: 'mmHg', label: 'mmHg' },
  { value: 'kPa', label: 'kPa' },
];

const SEARCH_CATALOG: EmrOption[] = [
  { value: 'timolol', label: 'Timolol 0.5% eye drops', description: 'Topical beta-blocker' },
  { value: 'latanoprost', label: 'Latanoprost 0.005% eye drops', description: 'Prostaglandin analogue' },
  { value: 'brimonidine', label: 'Brimonidine 0.2% eye drops', description: 'Alpha-2 agonist' },
  { value: 'dorzolamide', label: 'Dorzolamide 2% eye drops', description: 'Carbonic anhydrase inhibitor' },
];

const TAB_ITEMS: EmrOption[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'vitals', label: 'Vitals & IOP' },
  { value: 'locked', label: 'Locked', disabled: true },
  { value: 'plan', label: 'Plan' },
];

const STEPPER_STAGES = [
  { id: 'referred', label: 'Referred', status: { label: 'Completed', tone: 'success' as const } },
  { id: 'triaged', label: 'Triaged', description: 'Slit-lamp room 2', status: { label: 'In progress', tone: 'info' as const } },
  { id: 'dilated', label: 'Dilated fundus' },
  { id: 'signed', label: 'Signed off' },
];

const STATUS_OPTIONS: ClinicalAssessmentStatusOption[] = [
  { value: 'recorded', label: 'Recorded', tone: 'success' },
  { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
  { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
  { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
  { value: 'declined', label: 'Declined', tone: 'info' },
  { value: 'unknown', label: 'Unknown', tone: 'neutral' },
];

const TYPED_FIELD_DEF: ClinicalFieldDefinition = {
  id: 'iop-od',
  label: 'Intraocular pressure (OD)',
  type: 'quantity',
  unit: 'mmHg',
  required: true,
  hint: 'Goldmann applanation tonometry',
  assessmentStatusOptions: STATUS_OPTIONS,
};

const SNOMED = 'http://snomed.info/sct';
const ICD10 = 'http://hl7.org/fhir/sid/icd-10';
const CODED_CATALOG: readonly EmrCodedValue[] = [
  { system: SNOMED, code: '77075001', display: 'Primary open-angle glaucoma' },
  { system: SNOMED, code: '193570009', display: 'Cataract' },
  { system: SNOMED, code: '4855003', display: 'Diabetic retinopathy' },
  { system: ICD10, code: 'H40.11', display: 'Primary open-angle glaucoma, bilateral' },
  { system: ICD10, code: 'E11.319', display: 'Type 2 diabetes with unspecified diabetic retinopathy' },
];

const CODED_DEF: EmrFieldDefinition = {
  schemaVersion: '1.0',
  contract: {
    linkId: 'diagnosis',
    valueType: 'coded',
    cardinality: { min: 1, max: null },
    terminology: [{ id: 'b1', role: 'answer-value-set', valueSetCanonical: 'http://snomed.info/sct?fhir_vs=isa/404684003', strength: 'preferred' }],
    validation: [],
  },
  presentation: {
    label: 'Encounter diagnoses',
    hint: 'Search SNOMED CT or ICD-10 concepts (synced across React & Lit)',
    assessmentStatusOptions: STATUS_OPTIONS,
  },
};

function reduceCoded(model: CodedInputViewModel, intent: CodedInputIntent): CodedInputViewModel {
  switch (intent.type) {
    case 'queryChangeRequested': {
      const q = intent.query.trim().toLowerCase();
      const options = q
        ? CODED_CATALOG.filter((c) => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        : CODED_CATALOG;
      return { ...model, query: intent.query, options, open: true };
    }
    case 'searchRequested':
    case 'openRequested':
      return { ...model, open: true, options: model.options.length ? model.options : CODED_CATALOG };
    case 'closeRequested':
      return { ...model, open: false };
    case 'conceptSelected': {
      const list = Array.isArray(model.value) ? [...model.value] : model.value ? [model.value as EmrCodedValue] : [];
      const exists = list.some((c) => c.system === intent.concept.system && c.code === intent.concept.code);
      return {
        ...model,
        value: exists
          ? list.filter((c) => !(c.system === intent.concept.system && c.code === intent.concept.code))
          : [...list, intent.concept],
      };
    }
    case 'conceptRemoveRequested': {
      const list = Array.isArray(model.value) ? [...model.value] : model.value ? [model.value as EmrCodedValue] : [];
      return { ...model, value: list.filter((c) => !(c.system === intent.system && c.code === intent.code)) };
    }
    case 'statusChangeRequested':
      return { ...model, status: intent.status };
  }
}

const FOUR_SLOTS: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '08:00' },
  { id: 'a', label: 'Afternoon', timeHint: '14:00' },
  { id: 'e', label: 'Evening', timeHint: '18:00' },
  { id: 'n', label: 'Night', timeHint: '22:00' },
];

const SLOT_PRESETS: ScheduleSlotPreset[] = [
  { id: 'od', label: 'Once daily (OD)', slotIds: ['m'] },
  { id: 'bd', label: 'Twice daily (BD)', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'Three times daily (TDS)', slotIds: ['m', 'a', 'n'] },
  { id: 'qid', label: 'Four times daily (QID)', slotIds: ['m', 'a', 'e', 'n'] },
];

export const PARITY_ENTRIES_L1_L2: readonly ParityEntry[] = [
  // ---- L1 (27) ---------------------------------------------------------------------------
  defineParityEntry<{ count: number; variant: 'primary' | 'outline' | 'ghost' }>({
    selector: 'emr-button',
    createInitialState: () => ({ count: 0, variant: 'primary' }),
    renderReact: ({ state, readOnly, update }) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <EmrButton
          variant={state.variant}
          disabled={readOnly}
          label={`Confirm action (${state.count})`}
          onPress={() => update('react', 'onPress', { count: state.count + 1 }, (s) => ({ ...s, count: s.count + 1 }))}
        />
        <EmrButton
          variant="outline"
          disabled={readOnly}
          label="Cycle variant"
          onPress={() =>
            update('react', 'cycleVariant', {}, (s) => ({
              ...s,
              variant: s.variant === 'primary' ? 'outline' : s.variant === 'outline' ? 'ghost' : 'primary',
            }))
          }
        />
      </View>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <View style={{ minWidth: 180 }}>
          <LitElementHost
            tag="emr-button"
            props={{ label: `Confirm action (${state.count})`, variant: state.variant, disabled: readOnly }}
            events={{
              clicked: () => update('lit', 'clicked', { count: state.count + 1 }, (s) => ({ ...s, count: s.count + 1 })),
            }}
          />
        </View>
        <View style={{ minWidth: 140 }}>
          <LitElementHost
            tag="emr-button"
            props={{ label: 'Cycle variant', variant: 'outline', disabled: readOnly }}
            events={{
              clicked: () =>
                update('lit', 'cycleVariant', {}, (s) => ({
                  ...s,
                  variant: s.variant === 'primary' ? 'outline' : s.variant === 'outline' ? 'ghost' : 'primary',
                })),
            }}
          />
        </View>
      </View>
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-text-input',
    createInitialState: () => ({ value: 'Gradual painless blurring in right eye for 3 months' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTextInput
        controlId="parity-text-react"
        label="Chief complaint"
        hint="Free-text presenting symptom"
        required
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-text-input"
        props={{
          controlId: 'parity-text-lit',
          label: 'Chief complaint',
          hint: 'Free-text presenting symptom',
          required: true,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: number | null }>({
    selector: 'emr-number-input',
    createInitialState: () => ({ value: -1.75 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrNumberInput
        controlId="parity-num-react"
        label="Spherical equivalent"
        min={-20}
        max={20}
        step={0.25}
        unit="D"
        hint="Step 0.25 D"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-number-input"
        props={{
          controlId: 'parity-num-lit',
          label: 'Spherical equivalent',
          min: -20,
          max: 20,
          step: 0.25,
          unit: 'D',
          hint: 'Step 0.25 D',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as number | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-date-input',
    createInitialState: () => ({ value: '2026-10-14' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDateInput
        controlId="parity-date-react"
        label="Next glaucoma review date"
        hint="Type or click 📅 to open the EMR Calendar component (ISO synced)"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-date-input"
        props={{
          controlId: 'parity-date-lit',
          label: 'Next glaucoma review date',
          displayFormat: 'dd-mm-yyyy',
          hint: 'Type or click 📅 to open the EMR Calendar component (ISO synced)',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-time-input',
    createInitialState: () => ({ value: '09:30' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTimeInput
        controlId="parity-time-react"
        label="Dilation instillation time"
        hint="24-hour hh:mm"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-time-input"
        props={{
          controlId: 'parity-time-lit',
          label: 'Dilation instillation time',
          hint: '24-hour hh:mm',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-datetime-input',
    createInitialState: () => ({ value: '2026-10-14T09:30:00Z' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDateTimeInput
        controlId="parity-dt-react"
        label="Tonometry timestamp"
        hint={`ISO UTC: ${state.value ?? 'null'}`}
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-datetime-input"
        props={{
          controlId: 'parity-dt-lit',
          label: 'Tonometry timestamp',
          hint: `ISO UTC: ${state.value ?? 'null'}`,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-select',
    createInitialState: () => ({ value: 'OD' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrFieldFrame controlId="parity-select-react" label="Operative laterality">
        <EmrSelect
          label="Operative laterality"
          options={EYE_OPTIONS}
          readOnly={readOnly}
          value={state.value}
          onChange={(v) => update('react', 'onChange', v, () => ({ value: v }))}
        />
      </EmrFieldFrame>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-select"
        props={{
          controlId: 'parity-select-lit',
          label: 'Operative laterality',
          options: EYE_OPTIONS,
          allowClear: true,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: number | null; unit: string | null }>({
    selector: 'emr-quantity-input',
    createInitialState: () => ({ value: 18, unit: 'mmHg' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrQuantityInput
        controlId="parity-qty-react"
        label="Applanation IOP"
        units={IOP_UNITS}
        readOnly={readOnly}
        value={state.value}
        unit={state.unit}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onUnitChange={(u) => update('react', 'onUnitChange', u, (s) => ({ ...s, unit: u }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-quantity-input"
        props={{
          controlId: 'parity-qty-lit',
          label: 'Applanation IOP',
          units: IOP_UNITS,
          readOnly,
          value: state.value,
          unit: state.unit,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as number | null) ?? null })),
          unitChange: (u) => update('lit', 'unitChange', u, (s) => ({ ...s, unit: (u as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ od: string | null; os: string | null }>({
    selector: 'emr-paired-input',
    createInitialState: () => ({ od: '6/6', os: '6/9' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPairedInput
        controlId="parity-pair-react"
        label="Presenting visual acuity (OD / OS)"
        firstLabel="OD"
        secondLabel="OS"
        separator="/"
        readOnly={readOnly}
        firstValue={state.od}
        secondValue={state.os}
        onFirstValueChange={(v) => update('react', 'onFirstValueChange', v, (s) => ({ ...s, od: v }))}
        onSecondValueChange={(v) => update('react', 'onSecondValueChange', v, (s) => ({ ...s, os: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-paired-input"
        props={{
          controlId: 'parity-pair-lit',
          label: 'Presenting visual acuity (OD / OS)',
          firstLabel: 'OD',
          secondLabel: 'OS',
          separator: '/',
          readOnly,
          firstValue: state.od,
          secondValue: state.os,
        }}
        events={{
          firstValueChange: (v) => update('lit', 'firstValueChange', v, (s) => ({ ...s, od: (v as string | null) ?? null })),
          secondValueChange: (v) => update('lit', 'secondValueChange', v, (s) => ({ ...s, os: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ checked: boolean }>({
    selector: 'emr-checkbox',
    createInitialState: () => ({ checked: true }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCheckbox
        controlId="parity-cb-react"
        label="Pupils dilated with Tropicamide 0.8% + Phenylephrine 5%"
        readOnly={readOnly}
        value={state.checked}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ checked: Boolean(v) }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-checkbox"
        props={{
          controlId: 'parity-cb-lit',
          label: 'Pupils dilated with Tropicamide 0.8% + Phenylephrine 5%',
          readOnly,
          checked: state.checked,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ checked: Boolean(v) })),
        }}
      />
    ),
  }),

  defineParityEntry<{ checked: boolean }>({
    selector: 'emr-toggle',
    createInitialState: () => ({ checked: true }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrToggle
        controlId="parity-toggle-react"
        label="One-eyed / monocular precaution active"
        hint="Highlights contralateral eye protection across clinical checklists"
        readOnly={readOnly}
        value={state.checked}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ checked: Boolean(v) }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-toggle"
        props={{
          controlId: 'parity-toggle-lit',
          label: 'One-eyed / monocular precaution active',
          hint: 'Highlights contralateral eye protection across clinical checklists',
          readOnly,
          checked: state.checked,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ checked: Boolean(v) })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-radio-group',
    createInitialState: () => ({ value: 'soon' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRadioGroup
        controlId="parity-rg-react"
        label="Referral triage priority"
        orientation="horizontal"
        options={PRIORITY_OPTIONS}
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-radio-group"
        props={{
          controlId: 'parity-rg-lit',
          label: 'Referral triage priority',
          orientation: 'horizontal',
          options: PRIORITY_OPTIONS,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ tone: EmrTone }>({
    selector: 'emr-badge',
    createInitialState: () => ({ tone: 'warning' }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        <EmrBadgeView badge={{ label: `Status · ${state.tone}`, tone: state.tone }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['neutral', 'info', 'success', 'warning', 'danger'] as EmrTone[]).map((tone) => (
            <EmrButton
              key={tone}
              small
              variant={state.tone === tone ? 'primary' : 'outline'}
              label={tone}
              onPress={() => update('react', 'toneSelected', tone, () => ({ tone }))}
            />
          ))}
        </View>
      </View>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-badge"
        props={{ badge: { label: `Status · ${state.tone}`, tone: state.tone } satisfies EmrBadge }}
      />
    ),
  }),

  defineParityEntry<{ tone: EmrTone }>({
    selector: 'emr-chip',
    createInitialState: () => ({ tone: 'info' }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        <EmrChip tone={state.tone}>{`Topical Rx · ${state.tone}`}</EmrChip>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['neutral', 'info', 'success', 'warning', 'danger'] as EmrTone[]).map((tone) => (
            <EmrButton
              key={tone}
              small
              variant={state.tone === tone ? 'primary' : 'outline'}
              label={tone}
              onPress={() => update('react', 'toneSelected', tone, () => ({ tone }))}
            />
          ))}
        </View>
      </View>
    ),
    renderLit: ({ state }) => (
      <LitElementHost tag="emr-chip" props={{ tone: state.tone, label: `Topical Rx · ${state.tone}` }} />
    ),
  }),

  defineParityEntry<{ tone: EmrTone }>({
    selector: 'emr-alert',
    createInitialState: () => ({ tone: 'warning' }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        <EmrAlert tone={state.tone} title="Intraocular pressure asymmetry">
          Left eye IOP exceeds controller threshold (28 mmHg vs 15 mmHg OD). Verify pachymetry and angle grade.
        </EmrAlert>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['info', 'success', 'warning', 'danger', 'neutral'] as EmrTone[]).map((tone) => (
            <EmrButton
              key={tone}
              small
              variant={state.tone === tone ? 'primary' : 'outline'}
              label={tone}
              onPress={() => update('react', 'toneSelected', tone, () => ({ tone }))}
            />
          ))}
        </View>
      </View>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-alert"
        props={{ tone: state.tone, title: 'Intraocular pressure asymmetry' }}
        slotHtml="Left eye IOP exceeds controller threshold (28 mmHg vs 15 mmHg OD). Verify pachymetry and angle grade."
      />
    ),
  }),

  defineParityEntry<{ kind: 'empty' | 'loading' | 'error' }>({
    selector: 'emr-state-message',
    createInitialState: () => ({ kind: 'empty' }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        <EmrStateMessage
          kind={state.kind}
          title={state.kind === 'error' ? 'Imaging service unreachable' : state.kind === 'loading' ? 'Loading studies' : 'No prior OCT scans'}
          message="Synthetic status message rendered identically in React and Lit."
        />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['empty', 'loading', 'error'] as const).map((k) => (
            <EmrButton
              key={k}
              small
              variant={state.kind === k ? 'primary' : 'outline'}
              label={k}
              onPress={() => update('react', 'kindSelected', k, () => ({ kind: k }))}
            />
          ))}
        </View>
      </View>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-state-message"
        props={{
          state: state.kind,
          title: state.kind === 'error' ? 'Imaging service unreachable' : state.kind === 'loading' ? 'Loading studies' : 'No prior OCT scans',
          description: 'Synthetic status message rendered identically in React and Lit.',
        }}
      />
    ),
  }),

  defineParityEntry<{ query: string; open: boolean; picked: string[] }>({
    selector: 'emr-search-select',
    createInitialState: () => ({ query: '', open: false, picked: ['timolol'] }),
    renderReact: ({ state, readOnly, update }) => {
      const options = SEARCH_CATALOG.filter((o) => o.label.toLowerCase().includes(state.query.toLowerCase()));
      const selected = SEARCH_CATALOG.filter((o) => state.picked.includes(o.value));
      const toggle = (val: string) =>
        update('react', 'onOptionSelect', val, (s) => ({
          ...s,
          picked: s.picked.includes(val) ? s.picked.filter((x) => x !== val) : [...s.picked, val],
        }));
      return (
        <EmrSearchSelect
          label="Glaucoma formulary search"
          multiple
          disabled={readOnly}
          query={state.query}
          open={state.open}
          options={options}
          selected={selected}
          onQueryChange={(q) => update('react', 'onQueryChange', q, (s) => ({ ...s, query: q, open: true }))}
          onSearchRequested={() => update('react', 'onSearchRequested', {}, (s) => ({ ...s, open: true }))}
          onOpenRequested={() => update('react', 'onOpenRequested', {}, (s) => ({ ...s, open: true }))}
          onCloseRequested={() => update('react', 'onCloseRequested', {}, (s) => ({ ...s, open: false }))}
          onOptionSelect={toggle}
          onRemoveRequested={toggle}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const options = SEARCH_CATALOG.filter((o) => o.label.toLowerCase().includes(state.query.toLowerCase()));
      const selected = SEARCH_CATALOG.filter((o) => state.picked.includes(o.value));
      const toggle = (val: string, evName: string) =>
        update('lit', evName, val, (s) => ({
          ...s,
          picked: s.picked.includes(val) ? s.picked.filter((x) => x !== val) : [...s.picked, val],
        }));
      return (
        <LitElementHost
          tag="emr-search-select"
          props={{
            controlId: 'parity-ss-lit',
            label: 'Glaucoma formulary search',
            multiple: true,
            readOnly,
            query: state.query,
            open: state.open,
            options,
            selected,
          }}
          events={{
            queryChange: (q) => update('lit', 'queryChange', q, (s) => ({ ...s, query: String(q ?? ''), open: true })),
            searchRequested: () => update('lit', 'searchRequested', {}, (s) => ({ ...s, open: true })),
            openRequested: () => update('lit', 'openRequested', {}, (s) => ({ ...s, open: true })),
            closeRequested: () => update('lit', 'closeRequested', {}, (s) => ({ ...s, open: false })),
            valueChange: (v) => toggle(String(v), 'valueChange'),
            removeRequested: (v) => toggle(String(v), 'removeRequested'),
          }}
        />
      );
    },
  }),

  defineParityEntry<{ active: string }>({
    selector: 'emr-tabs',
    createInitialState: () => ({ active: 'summary' }),
    renderReact: ({ state, update }) => (
      <EmrTabs
        tabs={TAB_ITEMS}
        active={state.active}
        ariaLabel="Encounter sections"
        onTabChange={(v) => update('react', 'onTabChange', v, () => ({ active: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tabs"
        props={{ tabs: TAB_ITEMS, activeTab: state.active, readOnly, ariaLabel: 'Encounter sections' }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ active: String(v) })),
        }}
      />
    ),
  }),

  defineParityEntry<{ label: string }>({
    selector: 'emr-separator',
    createInitialState: () => ({ label: 'Posterior segment findings' }),
    renderReact: ({ state }) => (
      <View style={{ gap: 8 }}>
        <ThemedText>Anterior segment normal</ThemedText>
        <EmrSeparator label={state.label} />
        <ThemedText>Cup-to-disc ratio 0.65 OD, 0.55 OS</ThemedText>
      </View>
    ),
    renderLit: ({ state }) => (
      <View style={{ gap: 8 }}>
        <ThemedText>Anterior segment normal</ThemedText>
        <LitElementHost tag="emr-separator" props={{ label: state.label }} />
        <ThemedText>Cup-to-disc ratio 0.65 OD, 0.55 OS</ThemedText>
      </View>
    ),
  }),

  defineParityEntry<{ value: number | null }>({
    selector: 'emr-likert',
    createInitialState: () => ({ value: 4 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrLikert
        label="Ocular surface discomfort score (0–10)"
        min={0}
        max={10}
        readOnly={readOnly}
        value={state.value}
        tone={state.value !== null && state.value >= 7 ? 'danger' : 'info'}
        anchors={[{ value: 0, label: 'None' }, { value: 10, label: 'Severe' }]}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-likert"
        props={{
          controlId: 'parity-likert-lit',
          label: 'Ocular surface discomfort score (0–10)',
          min: 0,
          max: 10,
          readOnly,
          value: state.value,
          anchors: [{ value: 0, label: 'None' }, { value: 10, label: 'Severe' }],
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as number | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: number | null }>({
    selector: 'emr-vas',
    createInitialState: () => ({ value: 3.5 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrVas
        label="Post-operative pain VAS (0.0–10.0)"
        min={0}
        max={10}
        step={0.5}
        readOnly={readOnly}
        value={state.value}
        valueText={state.value === null ? undefined : `${state.value} / 10`}
        anchors={[{ value: 0, label: 'No pain' }, { value: 10, label: 'Worst imaginable' }]}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-vas"
        props={{
          controlId: 'parity-vas-lit',
          label: 'Post-operative pain VAS (0.0–10.0)',
          min: 0,
          max: 10,
          step: 0.5,
          readOnly,
          value: state.value,
          anchors: [{ value: 0, label: 'No pain' }, { value: 10, label: 'Worst imaginable' }],
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as number | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ title: string }>({
    selector: 'emr-card',
    createInitialState: () => ({ title: 'Baseline refraction summary' }),
    renderReact: ({ state }) => (
      <EmrCard label={state.title}>
        <EmrFieldValueRow field="OD" value="-1.50 DS / -0.50 DC × 90°" remarks="BCVA 6/6" />
        <EmrFieldValueRow field="OS" value="-1.25 DS / -0.75 DC × 85°" remarks="BCVA 6/6" />
      </EmrCard>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-card"
        props={{ title: state.title }}
        slotHtml="<div><strong>OD:</strong> -1.50 DS / -0.50 DC × 90° (BCVA 6/6)<br/><strong>OS:</strong> -1.25 DS / -0.75 DC × 85° (BCVA 6/6)</div>"
      />
    ),
  }),

  defineParityEntry<{ count: 2 | 3 }>({
    selector: 'emr-columns',
    createInitialState: () => ({ count: 3 }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        <EmrColumns count={state.count} gap={12}>
          <EmrCard label="OD IOP"><ThemedText>15 mmHg (GAT)</ThemedText></EmrCard>
          <EmrCard label="OS IOP"><ThemedText>17 mmHg (GAT)</ThemedText></EmrCard>
          <EmrCard label="Pachymetry"><ThemedText>542 µm / 538 µm</ThemedText></EmrCard>
        </EmrColumns>
        <EmrButton
          small
          variant="outline"
          label={`Switch to ${state.count === 3 ? 2 : 3} columns`}
          onPress={() => update('react', 'toggleColumns', {}, (s) => ({ count: s.count === 3 ? 2 : 3 }))}
        />
      </View>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-columns"
        props={{ columns: state.count }}
        slotHtml="<div style='padding:12px;border:1px solid var(--emr-border);border-radius:var(--emr-radius)'><strong>OD IOP</strong><div>15 mmHg (GAT)</div></div><div style='padding:12px;border:1px solid var(--emr-border);border-radius:var(--emr-radius)'><strong>OS IOP</strong><div>17 mmHg (GAT)</div></div><div style='padding:12px;border:1px solid var(--emr-border);border-radius:var(--emr-radius)'><strong>Pachymetry</strong><div>542 µm / 538 µm</div></div>"
      />
    ),
  }),

  defineParityEntry<null>({
    selector: 'emr-field-value-row',
    createInitialState: () => null,
    renderReact: () => (
      <View>
        <EmrFieldValueRow heading field="Parameter" value="Measurement" remarks="Method" notes="Notes" />
        <EmrFieldValueRow field="IOP (OD)" value="15 mmHg" remarks="GAT" notes="09:40" />
        <EmrFieldValueRow field="IOP (OS)" value="18 mmHg" remarks="GAT" notes="09:41" />
      </View>
    ),
    renderLit: () => (
      <View style={{ gap: 4 }}>
        <LitElementHost tag="emr-field-value-row" props={{ heading: true, field: 'Parameter', value: 'Measurement', remarks: 'Method', notes: 'Notes' }} />
        <LitElementHost tag="emr-field-value-row" props={{ field: 'IOP (OD)', value: '15 mmHg', remarks: 'GAT', notes: '09:40' }} />
        <LitElementHost tag="emr-field-value-row" props={{ field: 'IOP (OS)', value: '18 mmHg', remarks: 'GAT', notes: '09:41' }} />
      </View>
    ),
  }),

  defineParityEntry<{ edits: number }>({
    selector: 'emr-status-cell',
    createInitialState: () => ({ edits: 0 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrStatusCell
        status={{ label: 'Recorded', tone: 'success' }}
        valueLabel={`124/78 mmHg (${state.edits} actions)`}
        attribution={{ nameLabel: 'Nurse K. Nair', roleLabel: 'OPD Nurse', timeLabel: '09:15' }}
        action={{ label: 'Edit', icon: '✎' }}
        secondaryNote="Seated, right arm"
        readOnly={readOnly}
        onIntent={(i) => update('react', String(i), i, (s) => ({ edits: s.edits + 1 }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-status-cell"
        props={{
          badge: { label: 'Recorded', tone: 'success' },
          value: `124/78 mmHg (${state.edits} actions)`,
          attribution: 'Nurse K. Nair · OPD Nurse · 09:15',
          actionLabel: 'Edit',
          secondaryNote: 'Seated, right arm',
          readOnly,
        }}
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ edits: s.edits + 1 })),
        }}
      />
    ),
  }),

  defineParityEntry<{ activeId: string }>({
    selector: 'emr-stage-stepper',
    createInitialState: () => ({ activeId: 'triaged' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrStageStepper
        stages={STEPPER_STAGES}
        activeId={state.activeId}
        readOnly={readOnly}
        onStageSelect={(id) => update('react', 'onStageSelect', id, () => ({ activeId: id }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-stage-stepper"
        props={{
          steps: STEPPER_STAGES,
          activeStepId: state.activeId,
          readOnly,
        }}
        events={{
          stepSelected: (id) => update('lit', 'stepSelected', id, () => ({ activeId: String(id) })),
        }}
      />
    ),
  }),

  defineParityEntry<{ clicks: number }>({
    selector: 'emr-stat-tile',
    createInitialState: () => ({ clicks: 0 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrStatTile
        model={{
          key: 'referred',
          label: 'Patients referred today',
          value: String(14 + state.clicks),
          sub: 'Click tile in either pane to increment',
          status: { label: '2 awaiting sync', tone: 'warning' },
        }}
        onIntent={
          readOnly
            ? undefined
            : (i) => update('react', i.type, i, (s) => ({ clicks: s.clicks + 1 }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-stat-tile"
        props={{
          model: {
            key: 'referred',
            label: 'Patients referred today',
            value: String(14 + state.clicks),
            sub: 'Click tile in either pane to increment',
            status: { label: '2 awaiting sync', tone: 'warning' },
          },
          interactive: !readOnly,
          readOnly,
        }}
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ clicks: s.clicks + 1 })),
        }}
      />
    ),
  }),

  // ---- L2 (6) ----------------------------------------------------------------------------
  defineParityEntry<{ value: string | null }>({
    selector: 'emr-field-frame',
    createInitialState: () => ({ value: '540 µm' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrFieldFrame
        controlId="parity-ff-react"
        label="Central corneal thickness (OD)"
        required
        hint="Ultrasonic pachymetry mean of 3 readings"
        warning={state.value === '' ? 'Missing pachymetry reading' : undefined}
      >
        <EmrTextInput
          controlId="parity-ff-input-react"
          label="Central corneal thickness (OD) input"
          readOnly={readOnly}
          value={state.value}
          onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
        />
      </EmrFieldFrame>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-field-frame"
        props={{
          controlId: 'parity-ff-lit',
          label: 'Central corneal thickness (OD)',
          required: true,
          hint: 'Ultrasonic pachymetry mean of 3 readings',
          warning: state.value === '' ? 'Missing pachymetry reading' : undefined,
        }}
        slotHtml={`<input id="parity-ff-lit" value="${(state.value ?? '').replace(/"/g, '&quot;')}" readonly style="min-height:var(--emr-control-height,44px);padding:0 10px;border:1px solid var(--emr-border);border-radius:var(--emr-radius,8px);background:var(--emr-surface);color:var(--emr-text);width:100%;box-sizing:border-box;" />`}
      />
    ),
  }),

  defineParityEntry<ClinicalFieldState>({
    selector: 'emr-typed-field',
    createInitialState: () => ({
      value: { value: 19, unit: 'mmHg' },
      assessmentStatus: 'recorded',
      warning: 'Compare with baseline target (≤ 16 mmHg)',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTypedField
        definition={TYPED_FIELD_DEF}
        model={state}
        controlId="parity-tf-react"
        readOnly={readOnly}
        onValueChange={(value: ClinicalFieldValue) =>
          update('react', 'onValueChange', value, (s) => ({ ...s, value }))
        }
        onStatusChange={(assessmentStatus: ClinicalAssessmentStatus | undefined) =>
          update('react', 'onStatusChange', assessmentStatus, (s) => ({ ...s, assessmentStatus }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-typed-field"
        props={{
          definition: TYPED_FIELD_DEF,
          model: state,
          controlId: 'parity-tf-lit',
          readOnly,
        }}
        events={{
          valueChange: (value) =>
            update('lit', 'valueChange', value, (s) => ({ ...s, value: value as ClinicalFieldValue })),
          statusChange: (status) =>
            update('lit', 'statusChange', status, (s) => ({
              ...s,
              assessmentStatus: (status as ClinicalAssessmentStatus | undefined) ?? undefined,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<CodedInputViewModel>({
    selector: 'emr-coded-input',
    createInitialState: () => ({
      definition: CODED_DEF,
      value: [CODED_CATALOG[0]!, CODED_CATALOG[3]!],
      query: '',
      options: [],
      open: false,
      loading: false,
      messages: [],
      emptyMessage: 'No matching terminology concepts',
      systemLabels: { [SNOMED]: 'SNOMED CT', [ICD10]: 'ICD-10' },
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCodedInput
        model={{ ...state, readOnly }}
        onIntent={(i) => update('react', i.type, i, (s) => reduceCoded(s, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-coded-input"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (i) => update('lit', (i as CodedInputIntent).type, i, (s) => reduceCoded(s, i as CodedInputIntent)),
        }}
      />
    ),
  }),

  defineParityEntry<AttestationViewModel>({
    selector: 'emr-attestation',
    createInitialState: () => ({
      id: 'att-surgical-timeout',
      title: 'Pre-operative consultant attestation',
      statement: 'I have verified patient identity, operative eye (OD), IOL power (+21.0 D), and informed consent.',
      signatories: [
        {
          id: 'sig-1',
          displayName: 'Dr. S. Iyer',
          roleLabel: 'Consultant Ophthalmologist',
          status: { label: 'Pending signature', tone: 'warning' },
        },
      ],
      canSign: true,
      signLabel: 'Sign attestation',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAttestation
        model={{ ...state, readOnly, canSign: state.canSign && !readOnly }}
        onIntent={(i: AttestationIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'signRequested'
              ? {
                  ...s,
                  canSign: false,
                  signatories: s.signatories.map((sig) => ({
                    ...sig,
                    status: { label: 'Signed', tone: 'success' },
                    signedAtLabel: '10:42 IST',
                  })),
                }
              : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-attestation"
        props={{ model: { ...state, readOnly, canSign: state.canSign && !readOnly } }}
        events={{
          intent: (i) => {
            const intent = i as AttestationIntent;
            update('lit', intent.type, intent, (s) =>
              intent.type === 'signRequested'
                ? {
                    ...s,
                    canSign: false,
                    signatories: s.signatories.map((sig) => ({
                      ...sig,
                      status: { label: 'Signed', tone: 'success' },
                      signedAtLabel: '10:42 IST',
                    })),
                  }
                : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ value: readonly DoseSlot[] | null }>({
    selector: 'emr-schedule-slot-picker',
    createInitialState: () => ({
      value: [
        { id: 'm', label: 'Morning', timeHint: '08:00', amount: 1 },
        { id: 'n', label: 'Night', timeHint: '22:00', amount: 1 },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrScheduleSlotPicker
        controlId="parity-ssp-react"
        label="Dosing schedule (Brinzolamide 1%)"
        hint="Select time-of-day slots or apply a frequency preset"
        slots={FOUR_SLOTS}
        presets={SLOT_PRESETS}
        unitLabel="drops"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-schedule-slot-picker"
        props={{
          controlId: 'parity-ssp-lit',
          label: 'Dosing schedule (Brinzolamide 1%)',
          hint: 'Select time-of-day slots or apply a frequency preset',
          slots: FOUR_SLOTS,
          presets: SLOT_PRESETS,
          unitLabel: 'drops',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as readonly DoseSlot[] | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string; selectedType: string; scans: number }>({
    selector: 'emr-identifier-entry',
    createInitialState: () => ({ value: '17-26-000842', selectedType: 'project', scans: 0 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrBarcodeScanField
        label="Patient identifier"
        hint={`Scanner triggers: ${state.scans}`}
        normalisedValue={state.value.trim() || undefined}
        readOnly={readOnly}
        value={state.value}
        selectedType={state.selectedType}
        typeOptions={[
          { id: 'project', label: 'Project ID' },
          { id: 'uhid', label: 'UHID' },
          { id: 'abha', label: 'National Health ID' },
        ]}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'typeSelected' ? { ...s, selectedType: i.id } : { ...s, scans: s.scans + 1 },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-identifier-entry"
        props={{
          model: {
            label: 'Patient identifier',
            hint: `Scanner triggers: ${state.scans}`,
            normalisedValue: state.value.trim() || undefined,
            readOnly,
            value: state.value,
            selectedType: state.selectedType,
            typeOptions: [
              { id: 'project', label: 'Project ID' },
              { id: 'uhid', label: 'UHID' },
              { id: 'abha', label: 'National Health ID' },
            ],
          },
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: String(v ?? '') })),
          intent: (i) => {
            const intent = i as { type: string; id?: string };
            update('lit', intent.type, intent, (s) =>
              intent.type === 'typeSelected' && intent.id ? { ...s, selectedType: intent.id } : { ...s, scans: s.scans + 1 },
            );
          },
        }}
      />
    ),
  }),
];
