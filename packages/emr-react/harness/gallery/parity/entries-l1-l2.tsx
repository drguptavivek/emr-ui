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
  EmrTabOption,
  EmrTone,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
} from '@drguptavivek/emr-controller';
import {
  EmrAlert,
  EmrAttestation,
  EmrBadgeView,
  EmrIdentifierEntry,
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
  {
    value: 'timolol',
    label: 'Timolol 0.5% eye drops',
    code: 'S01ED01',
    keywords: ['beta-blocker', 'timoptic', 'iop'],
    description: 'Topical beta-blocker · BID',
    group: 'First-line',
    badge: 'Formulary',
    tone: 'success',
  },
  {
    value: 'latanoprost',
    label: 'Latanoprost 0.005% eye drops',
    code: 'S01EE01',
    keywords: ['prostaglandin', 'xalatan', 'qhs'],
    description: 'Prostaglandin analogue · QHS',
    group: 'First-line',
    badge: 'Preferred',
    tone: 'info',
  },
  {
    value: 'brimonidine',
    label: 'Brimonidine 0.2% eye drops',
    code: 'S01EA05',
    keywords: ['alpha-2', 'alphagan'],
    description: 'Alpha-2 agonist · TID',
    group: 'Adjunctive',
    readOnly: true,
    badge: 'Protocol',
    tone: 'neutral',
  },
  {
    value: 'dorzolamide',
    label: 'Dorzolamide 2% eye drops',
    code: 'S01EC03',
    keywords: ['cai', 'trusopt'],
    description: 'Carbonic anhydrase inhibitor · TID',
    group: 'Adjunctive',
  },
  {
    value: 'pilocarpine',
    label: 'Pilocarpine 2% eye drops',
    code: 'S01EB01',
    keywords: ['miotic', 'cholinergic'],
    description: 'Restricted stock · Angle closure',
    group: 'Restricted',
    disabled: true,
    badge: 'Out of stock',
    tone: 'warning',
  },
];

const TAB_ITEMS: EmrTabOption[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'vitals', label: 'Vitals & IOP', badge: 2 },
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
  defineParityEntry<{
    count: number;
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
    loading: boolean;
    block: boolean;
  }>({
    selector: 'emr-button',
    createInitialState: () => ({
      count: 0,
      variant: 'primary',
      size: 'md',
      disabled: false,
      loading: false,
      block: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', width: '100%' }}>
        <EmrButton
          variant={state.variant}
          size={state.size ?? 'md'}
          disabled={readOnly || state.disabled}
          loading={state.loading}
          block={state.block}
          label={`Confirm action (${state.count})`}
          onPress={() => update('react', 'onPress', { count: state.count + 1 }, (s) => ({ ...s, count: s.count + 1 }))}
        />
        <EmrButton
          variant="outline"
          disabled={readOnly}
          label="Cycle variant"
          onPress={() =>
            update('react', 'cycleVariant', {}, (s) => {
              const order = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
              return { ...s, variant: order[(order.indexOf(s.variant) + 1) % order.length] };
            })
          }
        />
      </View>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', width: '100%' }}>
        <View style={state.block ? { width: '100%' } : { minWidth: 180 }}>
          <LitElementHost
            tag="emr-button"
            props={{
              label: `Confirm action (${state.count})`,
              variant: state.variant,
              size: state.size,
              disabled: readOnly || state.disabled,
              loading: state.loading,
              block: state.block,
            }}
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
                update('lit', 'cycleVariant', {}, (s) => {
                  const order = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
                  return { ...s, variant: order[(order.indexOf(s.variant) + 1) % order.length] };
                }),
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
        hint="Type a date or open the calendar picker"
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
          hint: 'Type a date or open the calendar picker',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    precision: 'minute' | 'second';
    hourCycle: '24' | '12';
    size: 'sm' | 'md' | 'lg';
    clearable: boolean;
    disabled: boolean;
    required: boolean;
  }>({
    selector: 'emr-time-input',
    createInitialState: () => ({
      value: '09:30',
      precision: 'minute',
      hourCycle: '24',
      size: 'md',
      clearable: true,
      disabled: false,
      required: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTimeInput
        controlId="parity-time-react"
        label="Dilation instillation time"
        hint={state.hourCycle === '12' ? '12-hour hh:mm AM/PM' : '24-hour hh:mm'}
        precision={state.precision}
        hourCycle={state.hourCycle}
        size={state.size}
        clearable={state.clearable}
        disabled={state.disabled}
        required={state.required}
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, value: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-time-input"
        props={{
          controlId: 'parity-time-lit',
          label: 'Dilation instillation time',
          hint: state.hourCycle === '12' ? '12-hour hh:mm AM/PM' : '24-hour hh:mm',
          precision: state.precision,
          hourCycle: state.hourCycle,
          size: state.size,
          clearable: state.clearable,
          disabled: state.disabled,
          required: state.required,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    displayFormat: 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy';
    timePrecision: 'minute' | 'second';
    hourCycle: '24' | '12';
    wireFormat: 'utc' | 'local';
    size: 'sm' | 'md' | 'lg';
    clearable: boolean;
    disabled: boolean;
    required: boolean;
  }>({
    selector: 'emr-datetime-input',
    createInitialState: () => ({
      value: '2026-10-14T09:30:00Z',
      displayFormat: 'dd-mm-yyyy',
      timePrecision: 'minute',
      hourCycle: '24',
      wireFormat: 'utc',
      size: 'md',
      clearable: true,
      disabled: false,
      required: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDateTimeInput
        controlId="parity-dt-react"
        label="Tonometry timestamp"
        hint={`${state.wireFormat.toUpperCase()}: ${state.value ?? 'null'}`}
        displayFormat={state.displayFormat}
        timePrecision={state.timePrecision}
        hourCycle={state.hourCycle}
        wireFormat={state.wireFormat}
        size={state.size}
        clearable={state.clearable}
        disabled={state.disabled}
        required={state.required}
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, value: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-datetime-input"
        props={{
          controlId: 'parity-dt-lit',
          label: 'Tonometry timestamp',
          hint: `${state.wireFormat.toUpperCase()}: ${state.value ?? 'null'}`,
          displayFormat: state.displayFormat,
          timePrecision: state.timePrecision,
          hourCycle: state.hourCycle,
          wireFormat: state.wireFormat,
          size: state.size,
          clearable: state.clearable,
          disabled: state.disabled,
          required: state.required,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | readonly string[] | null;
    multiple: boolean;
    variant: 'outline' | 'filled' | 'subtle';
    size: 'md' | 'sm';
    clearable: boolean;
    closeOnSelect: boolean;
    maxSelections: number;
    maxTagCount: number;
    loading: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-select',
    createInitialState: () => ({
      value: 'OD',
      multiple: false,
      variant: 'outline',
      size: 'md',
      clearable: true,
      closeOnSelect: true,
      maxSelections: 3,
      maxTagCount: 2,
      loading: false,
      required: false,
      readOnly: false,
      disabled: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => {
      const selectOptions: readonly EmrOption[] = [
        { value: 'OD', label: 'Right eye (OD)', group: 'Laterality', badge: 'Primary', tone: 'info' },
        { value: 'OS', label: 'Left eye (OS)', group: 'Laterality', description: 'Contralateral eye' },
        { value: 'OU', label: 'Both eyes (OU)', group: 'Laterality', badge: 'Bilateral', tone: 'warning' },
        { value: 'NA', label: 'Not applicable', group: 'Laterality', readOnly: true },
        { value: 'ARCH', label: 'Archived protocol', group: 'Laterality', disabled: true },
        { value: 'STAT', label: 'STAT', group: 'Priority', badge: 'Urgent', tone: 'danger' },
        { value: 'ROUTINE', label: 'Routine', group: 'Priority', tone: 'success' },
      ];
      return (
        <EmrSelect
          controlId="parity-select-react"
          label="Operative laterality & priority"
          labelHidden={state.labelHidden}
          options={selectOptions}
          multiple={state.multiple}
          value={state.value}
          variant={state.variant}
          size={state.size}
          clearable={state.clearable}
          closeOnSelect={state.closeOnSelect}
          maxSelections={state.multiple ? state.maxSelections : undefined}
          maxTagCount={state.maxTagCount}
          loading={state.loading}
          required={state.required}
          readOnly={readOnly || state.readOnly}
          disabled={state.disabled}
          invalid={state.invalid}
          warning={state.warning}
          error={state.error}
          onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
          onCleared={() => update('react', 'onCleared', null)}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const selectOptions: readonly EmrOption[] = [
        { value: 'OD', label: 'Right eye (OD)', group: 'Laterality', badge: 'Primary', tone: 'info' },
        { value: 'OS', label: 'Left eye (OS)', group: 'Laterality', description: 'Contralateral eye' },
        { value: 'OU', label: 'Both eyes (OU)', group: 'Laterality', badge: 'Bilateral', tone: 'warning' },
        { value: 'NA', label: 'Not applicable', group: 'Laterality', readOnly: true },
        { value: 'ARCH', label: 'Archived protocol', group: 'Laterality', disabled: true },
        { value: 'STAT', label: 'STAT', group: 'Priority', badge: 'Urgent', tone: 'danger' },
        { value: 'ROUTINE', label: 'Routine', group: 'Priority', tone: 'success' },
      ];
      return (
        <LitElementHost
          tag="emr-select"
          props={{
            controlId: 'parity-select-lit',
            label: 'Operative laterality & priority',
            labelHidden: state.labelHidden,
            options: selectOptions,
            multiple: state.multiple,
            value: state.value,
            variant: state.variant,
            size: state.size,
            clearable: state.clearable,
            closeOnSelect: state.closeOnSelect,
            maxSelections: state.multiple ? state.maxSelections : undefined,
            maxTagCount: state.maxTagCount,
            loading: state.loading,
            required: state.required,
            readOnly: readOnly || state.readOnly,
            disabled: state.disabled,
            invalid: state.invalid,
            warning: state.warning,
            error: state.error,
          }}
          events={{
            valueChange: (v) =>
              update('lit', 'valueChange', v, (prev) => ({
                ...prev,
                value: (v as string | readonly string[] | null) ?? null,
              })),
            cleared: () => update('lit', 'cleared', null),
          }}
        />
      );
    },
  }),

  defineParityEntry<{
    value: number | null;
    unit: string | null;
    showSteppers: boolean;
    clearable: boolean;
    mode: 'decimal' | 'integer';
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
  }>({
    selector: 'emr-quantity-input',
    createInitialState: () => ({
      value: 18,
      unit: 'mmHg',
      showSteppers: true,
      clearable: false,
      mode: 'decimal',
      size: 'md',
      disabled: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrQuantityInput
        controlId="parity-qty-react"
        label="Applanation IOP"
        units={IOP_UNITS}
        min={0}
        max={80}
        step={0.5}
        mode={state.mode}
        size={state.size}
        showSteppers={state.showSteppers}
        clearable={state.clearable}
        disabled={state.disabled}
        readOnly={readOnly}
        value={state.value}
        unit={state.unit}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onUnitChange={(u) => update('react', 'onUnitChange', u, (s) => ({ ...s, unit: u }))}
        onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, value: null, unit: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-quantity-input"
        props={{
          controlId: 'parity-qty-lit',
          label: 'Applanation IOP',
          units: IOP_UNITS,
          min: 0,
          max: 80,
          step: 0.5,
          mode: state.mode,
          size: state.size,
          showSteppers: state.showSteppers,
          clearable: state.clearable,
          disabled: state.disabled,
          readOnly,
          value: state.value,
          unit: state.unit,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as number | null) ?? null })),
          unitChange: (u) => update('lit', 'unitChange', u, (s) => ({ ...s, unit: (u as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, value: null, unit: null })),
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

  defineParityEntry<{
    checked: boolean;
    mixed: boolean;
    variant: 'tile' | 'inline';
    size: 'md' | 'sm';
    labelPlacement: 'end' | 'start' | 'space-between';
    description: string;
    hint: string;
    warning: string;
    error: string;
    disabled: boolean;
    required: boolean;
    readOnly: boolean;
  }>({
    selector: 'emr-checkbox',
    createInitialState: () => ({
      checked: true,
      mixed: false,
      variant: 'tile',
      size: 'md',
      labelPlacement: 'end',
      description: '',
      hint: '',
      warning: '',
      error: '',
      disabled: false,
      required: false,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCheckbox
        controlId="parity-cb-react"
        label="Pupils dilated with Tropicamide 0.8% + Phenylephrine 5%"
        description={state.description}
        hint={state.hint}
        warning={state.warning}
        error={state.error}
        readOnly={state.readOnly || readOnly}
        value={state.checked}
        mixed={state.mixed}
        variant={state.variant}
        size={state.size}
        labelPlacement={state.labelPlacement}
        disabled={state.disabled}
        required={state.required}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, checked: Boolean(v), mixed: false }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-checkbox"
        props={{
          controlId: 'parity-cb-lit',
          label: 'Pupils dilated with Tropicamide 0.8% + Phenylephrine 5%',
          description: state.description,
          hint: state.hint,
          warning: state.warning,
          error: state.error,
          readOnly: state.readOnly || readOnly,
          checked: state.checked,
          mixed: state.mixed,
          variant: state.variant,
          size: state.size,
          labelPlacement: state.labelPlacement,
          disabled: state.disabled,
          required: state.required,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, checked: Boolean(v), mixed: false })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    checked: boolean;
    variant: 'tile' | 'inline';
    size: 'md' | 'sm';
    labelPlacement: 'end' | 'start' | 'space-between';
    onLabel: string;
    offLabel: string;
    description: string;
    hint: string;
    warning: string;
    error: string;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
    loading: boolean;
    invalid: boolean;
    labelHidden: boolean;
  }>({
    selector: 'emr-toggle',
    createInitialState: () => ({
      checked: true,
      variant: 'tile',
      size: 'md',
      labelPlacement: 'end',
      onLabel: '',
      offLabel: '',
      description: '',
      hint: 'Highlights contralateral eye protection across clinical checklists',
      warning: '',
      error: '',
      disabled: false,
      readOnly: false,
      required: false,
      loading: false,
      invalid: false,
      labelHidden: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrToggle
        controlId="parity-toggle-react"
        label="One-eyed / monocular precaution active"
        description={state.description || undefined}
        hint={state.hint || undefined}
        warning={state.warning || undefined}
        error={state.error || undefined}
        readOnly={readOnly || state.readOnly}
        value={state.checked}
        variant={state.variant}
        size={state.size}
        labelPlacement={state.labelPlacement}
        onLabel={state.onLabel || undefined}
        offLabel={state.offLabel || undefined}
        disabled={state.disabled}
        required={state.required}
        loading={state.loading}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, checked: Boolean(v) }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-toggle"
        props={{
          controlId: 'parity-toggle-lit',
          label: 'One-eyed / monocular precaution active',
          description: state.description,
          hint: state.hint,
          warning: state.warning,
          error: state.error,
          readOnly: readOnly || state.readOnly,
          checked: state.checked,
          variant: state.variant,
          size: state.size,
          labelPlacement: state.labelPlacement,
          onLabel: state.onLabel,
          offLabel: state.offLabel,
          disabled: state.disabled,
          required: state.required,
          loading: state.loading,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, checked: Boolean(v) })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    variant: 'tile' | 'inline' | 'card' | 'pill' | 'segmented';
    size: 'md' | 'sm';
    orientation: 'vertical' | 'horizontal' | 'grid';
    labelPlacement: 'end' | 'start' | 'space-between';
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-radio-group',
    createInitialState: () => ({
      value: 'soon',
      variant: 'tile',
      size: 'md',
      orientation: 'vertical',
      labelPlacement: 'end',
      clearable: true,
      required: false,
      readOnly: false,
      disabled: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRadioGroup
        controlId="parity-rg-react"
        label="Referral triage priority"
        variant={state.variant}
        size={state.size}
        orientation={state.orientation}
        columns={2}
        labelPlacement={state.labelPlacement}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        options={[
          { value: 'stat', label: 'STAT — Immediate', group: 'Acuity', description: 'Sight-threatening emergency', badge: { label: 'Urgent', tone: 'danger' }, tone: 'danger' },
          { value: 'soon', label: 'Urgent — Within 24h', group: 'Acuity', description: 'Same-day specialist review', badge: { label: 'Priority', tone: 'warning' }, tone: 'warning' },
          { value: 'routine', label: 'Routine — Next clinic', group: 'Standard', description: 'Standard outpatient queue', badge: { label: '2–4w', tone: 'info' } },
          { value: 'locked', label: 'Protocol locked', group: 'Standard', readOnly: true, description: 'Assigned by triage protocol' },
          { value: 'deferred', label: 'Tele-ophthalmology', group: 'Standard', disabled: true, description: 'Service unavailable at this site' },
        ]}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, value: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-radio-group"
        props={{
          controlId: 'parity-rg-lit',
          label: 'Referral triage priority',
          variant: state.variant,
          size: state.size,
          orientation: state.orientation,
          columns: 2,
          labelPlacement: state.labelPlacement,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
          options: [
            { value: 'stat', label: 'STAT — Immediate', group: 'Acuity', description: 'Sight-threatening emergency', badge: { label: 'Urgent', tone: 'danger' }, tone: 'danger' },
            { value: 'soon', label: 'Urgent — Within 24h', group: 'Acuity', description: 'Same-day specialist review', badge: { label: 'Priority', tone: 'warning' }, tone: 'warning' },
            { value: 'routine', label: 'Routine — Next clinic', group: 'Standard', description: 'Standard outpatient queue', badge: { label: '2–4w', tone: 'info' } },
            { value: 'locked', label: 'Protocol locked', group: 'Standard', readOnly: true, description: 'Assigned by triage protocol' },
            { value: 'deferred', label: 'Tele-ophthalmology', group: 'Standard', disabled: true, description: 'Service unavailable at this site' },
          ],
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    tone: EmrTone;
    variant: 'soft' | 'solid' | 'outline';
    size: 'md' | 'sm';
    shape: 'pill' | 'rounded';
    dot: boolean;
  }>({
    selector: 'emr-badge',
    createInitialState: () => ({
      tone: 'warning',
      variant: 'soft',
      size: 'md',
      shape: 'pill',
      dot: false,
    }),
    renderReact: ({ state }) => (
      <EmrBadgeView
        badge={{
          label: `Status · ${state.tone}`,
          tone: state.tone,
          variant: state.variant,
          size: state.size,
          shape: state.shape,
          dot: state.dot,
        }}
      />
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-badge"
        props={{
          badge: {
            label: `Status · ${state.tone}`,
            tone: state.tone,
            variant: state.variant,
            size: state.size,
            shape: state.shape,
            dot: state.dot,
          } satisfies EmrBadge,
        }}
      />
    ),
  }),

  defineParityEntry<{
    tone: EmrTone;
    variant: 'soft' | 'solid' | 'outline';
    size: 'md' | 'sm';
    selectable: boolean;
    selected: boolean;
    removable: boolean;
    disabled: boolean;
  }>({
    selector: 'emr-chip',
    createInitialState: () => ({
      tone: 'info',
      variant: 'soft',
      size: 'md',
      selectable: true,
      selected: false,
      removable: true,
      disabled: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrChip
        tone={state.tone}
        variant={state.variant}
        size={state.size}
        selectable={state.selectable}
        selected={state.selected}
        removable={state.removable}
        disabled={state.disabled}
        readOnly={readOnly}
        label={`Topical Rx · ${state.tone}`}
        onSelectedChange={(next) => update('react', 'onSelectedChange', next, (s) => ({ ...s, selected: next }))}
        onRemove={() => update('react', 'onRemove', null, (s) => ({ ...s, selected: false }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-chip"
        props={{
          tone: state.tone,
          variant: state.variant,
          size: state.size,
          selectable: state.selectable,
          selected: state.selected,
          removable: state.removable,
          disabled: state.disabled,
          readOnly,
          label: `Topical Rx · ${state.tone}`,
        }}
        events={{
          selectedChange: (v) => update('lit', 'selectedChange', v, (s) => ({ ...s, selected: Boolean(v) })),
          removeRequested: () => update('lit', 'removeRequested', null, (s) => ({ ...s, selected: false })),
        }}
      />
    ),
  }),

  defineParityEntry<{ tone: EmrTone }>({
    selector: 'emr-alert',
    createInitialState: () => ({ tone: 'warning' }),
    renderReact: ({ state }) => (
      <EmrAlert tone={state.tone} title="Intraocular pressure asymmetry">
        Left eye IOP exceeds controller threshold (28 mmHg vs 15 mmHg OD). Verify pachymetry and angle grade.
      </EmrAlert>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-alert"
        props={{ tone: state.tone, title: 'Intraocular pressure asymmetry' }}
        slotHtml="Left eye IOP exceeds controller threshold (28 mmHg vs 15 mmHg OD). Verify pachymetry and angle grade."
      />
    ),
  }),

  defineParityEntry<{
    kind: 'empty' | 'loading' | 'error';
    compact: boolean;
    actionLabel: string;
    actionDisabled: boolean;
  }>({
    selector: 'emr-state-message',
    createInitialState: () => ({
      kind: 'empty',
      compact: false,
      actionLabel: 'Refresh scans',
      actionDisabled: false,
    }),
    renderReact: ({ state, update }) => (
      <EmrStateMessage
        kind={state.kind}
        compact={state.compact}
        title={state.kind === 'error' ? 'Imaging service unreachable' : state.kind === 'loading' ? 'Loading studies' : 'No prior OCT scans'}
        message="Synthetic status message rendered identically in React, Lit, and Angular."
        actionLabel={state.kind === 'loading' ? undefined : state.actionLabel}
        actionDisabled={state.actionDisabled}
        onAction={() => update('react', 'onAction', state.kind, (s) => s)}
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-state-message"
        props={{
          kind: state.kind,
          compact: state.compact,
          title: state.kind === 'error' ? 'Imaging service unreachable' : state.kind === 'loading' ? 'Loading studies' : 'No prior OCT scans',
          message: 'Synthetic status message rendered identically in React, Lit, and Angular.',
          actionLabel: state.kind === 'loading' ? '' : state.actionLabel,
          actionDisabled: state.actionDisabled,
        }}
        events={{
          actionTriggered: () => update('lit', 'actionTriggered', state.kind, (s) => s),
        }}
      />
    ),
  }),

  defineParityEntry<{
    query: string;
    open: boolean;
    picked: string[];
    filterMode: 'remote' | 'local' | 'none';
    variant: 'outline' | 'filled' | 'subtle';
    size: 'sm' | 'md';
    multiple: boolean;
    highlightMatch: boolean;
    clearable: boolean;
    creatable: boolean;
    maxTagCount: number;
    maxSelections: number;
    loading: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-search-select',
    createInitialState: () => ({
      query: '',
      open: false,
      picked: ['timolol'],
      filterMode: 'local',
      variant: 'outline',
      size: 'md',
      multiple: true,
      highlightMatch: true,
      clearable: true,
      creatable: true,
      maxTagCount: 2,
      maxSelections: 4,
      loading: false,
      disabled: false,
      readOnly: false,
      required: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => {
      const options = state.filterMode !== 'remote'
        ? SEARCH_CATALOG
        : SEARCH_CATALOG.filter((o) =>
            o.label.toLowerCase().includes(state.query.toLowerCase()) ||
            (o.code ? o.code.toLowerCase().includes(state.query.toLowerCase()) : false),
          );
      const selected = state.picked.map((val) => SEARCH_CATALOG.find((o) => o.value === val) ?? { value: val, label: val });
      const toggle = (val: string) =>
        update('react', 'onOptionSelect', val, (s) => ({
          ...s,
          picked: s.multiple
            ? (s.picked.includes(val) ? s.picked.filter((x) => x !== val) : [...s.picked, val])
            : [val],
          open: s.multiple ? s.open : false,
        }));
      return (
        <EmrSearchSelect
          controlId="parity-ss-react"
          label="Glaucoma formulary search"
          labelHidden={state.labelHidden}
          variant={state.variant}
          multiple={state.multiple}
          filterMode={state.filterMode}
          size={state.size}
          highlightMatch={state.highlightMatch}
          clearable={state.clearable}
          creatable={state.creatable}
          maxTagCount={state.maxTagCount}
          maxSelections={state.maxSelections}
          loading={state.loading}
          disabled={state.disabled}
          required={state.required}
          invalid={state.invalid}
          warning={state.warning}
          error={state.error}
          readOnly={readOnly || state.readOnly}
          query={state.query}
          open={state.open}
          value={state.multiple ? state.picked : (state.picked[0] ?? null)}
          options={options}
          selected={selected}
          onQueryChange={(q) => update('react', 'onQueryChange', q, (s) => ({ ...s, query: q, open: true }))}
          onSearchRequested={() => update('react', 'onSearchRequested', {}, (s) => ({ ...s, open: true }))}
          onOpenChange={(nextOpen) => update('react', 'onOpenChange', nextOpen, (s) => ({ ...s, open: nextOpen }))}
          onOpenRequested={() => update('react', 'onOpenRequested', {}, (s) => ({ ...s, open: true }))}
          onCloseRequested={() => update('react', 'onCloseRequested', {}, (s) => ({ ...s, open: false }))}
          onOptionSelect={toggle}
          onRemoveRequested={toggle}
          onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, query: '', picked: [] }))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const options = state.filterMode !== 'remote'
        ? SEARCH_CATALOG
        : SEARCH_CATALOG.filter((o) =>
            o.label.toLowerCase().includes(state.query.toLowerCase()) ||
            (o.code ? o.code.toLowerCase().includes(state.query.toLowerCase()) : false),
          );
      const selected = state.picked.map((val) => SEARCH_CATALOG.find((o) => o.value === val) ?? { value: val, label: val });
      const toggle = (val: string, evName: string) =>
        update('lit', evName, val, (s) => ({
          ...s,
          picked: s.multiple
            ? (s.picked.includes(val) ? s.picked.filter((x) => x !== val) : [...s.picked, val])
            : [val],
          open: s.multiple ? s.open : false,
        }));
      return (
        <LitElementHost
          tag="emr-search-select"
          props={{
            controlId: 'parity-ss-lit',
            label: 'Glaucoma formulary search',
            labelHidden: state.labelHidden,
            variant: state.variant,
            multiple: state.multiple,
            filterMode: state.filterMode,
            size: state.size,
            highlightMatch: state.highlightMatch,
            clearable: state.clearable,
            creatable: state.creatable,
            maxTagCount: state.maxTagCount,
            maxSelections: state.maxSelections,
            loading: state.loading,
            disabled: state.disabled,
            required: state.required,
            invalid: state.invalid,
            warning: state.warning,
            error: state.error,
            readOnly: readOnly || state.readOnly,
            query: state.query,
            open: state.open,
            value: state.multiple ? state.picked : (state.picked[0] ?? null),
            options,
            selected,
          }}
          events={{
            queryChange: (q) => update('lit', 'queryChange', q, (s) => ({ ...s, query: String(q ?? ''), open: true })),
            searchRequested: () => update('lit', 'searchRequested', {}, (s) => ({ ...s, open: true })),
            openChange: (nextOpen) => update('lit', 'openChange', nextOpen, (s) => ({ ...s, open: Boolean(nextOpen) })),
            openRequested: () => update('lit', 'openRequested', {}, (s) => ({ ...s, open: true })),
            closeRequested: () => update('lit', 'closeRequested', {}, (s) => ({ ...s, open: false })),
            valueChange: (v) => {
              if (Array.isArray(v)) {
                update('lit', 'valueChange', v, (s) => ({ ...s, picked: v.map(String) }));
              } else if (v !== null && v !== undefined) {
                toggle(String(v), 'valueChange');
              }
            },
            removeRequested: (v) => toggle(String(v), 'removeRequested'),
            cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, query: '', picked: [] })),
          }}
        />
      );
    },
  }),

  defineParityEntry<{
    active: string;
    variant: 'underline' | 'pill' | 'soft';
    size: 'sm' | 'md' | 'lg';
    orientation: 'horizontal' | 'vertical';
    fitted: boolean;
    disabled: boolean;
  }>({
    selector: 'emr-tabs',
    createInitialState: () => ({
      active: 'summary',
      variant: 'underline',
      size: 'md',
      orientation: 'horizontal',
      fitted: false,
      disabled: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTabs
        tabs={TAB_ITEMS}
        value={state.active}
        variant={state.variant}
        size={state.size}
        orientation={state.orientation}
        fitted={state.fitted}
        disabled={state.disabled}
        readOnly={readOnly}
        ariaLabel="Encounter sections"
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, active: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tabs"
        props={{
          tabs: TAB_ITEMS,
          value: state.active,
          variant: state.variant,
          size: state.size,
          orientation: state.orientation,
          fitted: state.fitted,
          disabled: state.disabled,
          readOnly,
          ariaLabel: 'Encounter sections',
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, active: String(v) })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    label: string;
    orientation: 'horizontal' | 'vertical';
    labelAlign: 'start' | 'center' | 'end';
    variant: 'solid' | 'dashed' | 'subtle';
    decorative: boolean;
  }>({
    selector: 'emr-separator',
    createInitialState: () => ({
      label: 'Posterior segment findings',
      orientation: 'horizontal',
      labelAlign: 'center',
      variant: 'solid',
      decorative: false,
    }),
    renderReact: ({ state }) => (
      <View style={state.orientation === 'vertical' ? { flexDirection: 'row', alignItems: 'center', minHeight: 32 } : { gap: 8 }}>
        <ThemedText>Anterior segment normal</ThemedText>
        <EmrSeparator
          label={state.label}
          orientation={state.orientation}
          labelAlign={state.labelAlign}
          variant={state.variant}
          decorative={state.decorative}
        />
        <ThemedText>Cup-to-disc ratio 0.65 OD, 0.55 OS</ThemedText>
      </View>
    ),
    renderLit: ({ state }) => (
      <View style={state.orientation === 'vertical' ? { flexDirection: 'row', alignItems: 'center', minHeight: 32 } : { gap: 8 }}>
        <ThemedText>Anterior segment normal</ThemedText>
        <LitElementHost
          tag="emr-separator"
          inline={state.orientation === 'vertical'}
          props={{
            label: state.label,
            orientation: state.orientation,
            labelAlign: state.labelAlign,
            variant: state.variant,
            decorative: state.decorative,
          }}
        />
        <ThemedText>Cup-to-disc ratio 0.65 OD, 0.55 OS</ThemedText>
      </View>
    ),
  }),

  defineParityEntry<{
    value: number | null;
    clearable: boolean;
    fullWidth: boolean;
    disabled: boolean;
    required: boolean;
  }>({
    selector: 'emr-likert',
    createInitialState: () => ({
      value: 4,
      clearable: false,
      fullWidth: false,
      disabled: false,
      required: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrLikert
        controlId="parity-likert-react"
        label="Ocular surface discomfort score (0–10)"
        min={0}
        max={10}
        clearable={state.clearable}
        fullWidth={state.fullWidth}
        disabled={state.disabled}
        required={state.required}
        readOnly={readOnly}
        value={state.value}
        tone={state.value !== null && state.value >= 7 ? 'danger' : 'info'}
        anchors={[{ value: 0, label: 'None' }, { value: 10, label: 'Severe' }]}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, value: null }))}
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
          clearable: state.clearable,
          fullWidth: state.fullWidth,
          disabled: state.disabled,
          required: state.required,
          readOnly,
          value: state.value,
          tone: state.value !== null && state.value >= 7 ? 'danger' : 'info',
          anchors: [{ value: 0, label: 'None' }, { value: 10, label: 'Severe' }],
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as number | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: number | null;
    orientation: 'horizontal' | 'vertical';
    size: 'sm' | 'md' | 'lg';
    tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
    clearable: boolean;
    disabled: boolean;
    required: boolean;
  }>({
    selector: 'emr-vas',
    createInitialState: () => ({
      value: 3.5,
      orientation: 'horizontal',
      size: 'md',
      tone: 'info',
      clearable: true,
      disabled: false,
      required: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrVas
        label="Post-operative pain VAS (0.0–10.0)"
        min={0}
        max={10}
        step={0.5}
        majorInterval={5}
        minorInterval={1}
        orientation={state.orientation}
        size={state.size}
        tone={state.tone}
        clearable={state.clearable}
        disabled={state.disabled}
        required={state.required}
        readOnly={readOnly}
        value={state.value}
        valueText={state.value === null ? undefined : `${state.value} / 10`}
        anchors={[{ value: 0, label: 'No pain' }, { value: 10, label: 'Worst imaginable' }]}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (s) => ({ ...s, value: null }))}
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
          majorInterval: 5,
          minorInterval: 1,
          orientation: state.orientation,
          size: state.size,
          tone: state.tone,
          clearable: state.clearable,
          disabled: state.disabled,
          required: state.required,
          readOnly,
          value: state.value,
          anchors: [{ value: 0, label: 'No pain' }, { value: 10, label: 'Worst imaginable' }],
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as number | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (s) => ({ ...s, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    title: string;
    subtitle: string;
    variant: 'outlined' | 'elevated' | 'filled' | 'subtle';
    padding: 'none' | 'sm' | 'md' | 'lg';
    tone: EmrTone;
    interactive: boolean;
    selected: boolean;
    disabled: boolean;
  }>({
    selector: 'emr-card',
    createInitialState: () => ({
      title: 'Baseline refraction summary',
      subtitle: 'Recorded at 09:30 IST',
      variant: 'outlined',
      padding: 'md',
      tone: 'neutral',
      interactive: true,
      selected: false,
      disabled: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCard
        label={state.title}
        subtitle={state.subtitle}
        variant={state.variant}
        padding={state.padding}
        tone={state.tone}
        interactive={state.interactive}
        selected={state.selected}
        disabled={state.disabled}
        readOnly={readOnly}
        onPress={() => update('react', 'onPress', !state.selected, (s) => ({ ...s, selected: !s.selected }))}
      >
        <View style={{ gap: 4 }}>
          <ThemedText>OD: -1.50 DS / -0.50 DC × 90° (BCVA 6/6)</ThemedText>
          <ThemedText>OS: -1.25 DS / -0.75 DC × 85° (BCVA 6/6)</ThemedText>
        </View>
      </EmrCard>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-card"
        props={{
          label: state.title,
          subtitle: state.subtitle,
          variant: state.variant,
          padding: state.padding,
          tone: state.tone,
          interactive: state.interactive,
          selected: state.selected,
          disabled: state.disabled,
          readOnly,
        }}
        events={{
          activated: () => update('lit', 'activated', !state.selected, (s) => ({ ...s, selected: !s.selected })),
        }}
        slotHtml="<div style='display:grid;gap:4px;font-size:var(--emr-text-md);color:var(--emr-text);'><div>OD: -1.50 DS / -0.50 DC × 90° (BCVA 6/6)</div><div>OS: -1.25 DS / -0.75 DC × 85° (BCVA 6/6)</div></div>"
      />
    ),
  }),

  defineParityEntry<{
    count: number;
    align: 'stretch' | 'start' | 'center' | 'end';
    gap: number;
    collapseBelow: number;
  }>({
    selector: 'emr-columns',
    createInitialState: () => ({
      count: 3,
      align: 'stretch',
      gap: 12,
      collapseBelow: 380,
    }),
    renderReact: ({ state }) => (
      <EmrColumns count={state.count} gap={state.gap} align={state.align} collapseBelow={state.collapseBelow}>
        <EmrCard label="OD IOP"><ThemedText>15 mmHg (GAT)</ThemedText></EmrCard>
        <EmrCard label="OS IOP"><ThemedText>17 mmHg (GAT)</ThemedText></EmrCard>
        <EmrCard label="Pachymetry"><ThemedText>542 µm / 538 µm</ThemedText></EmrCard>
      </EmrColumns>
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-columns"
        props={{
          count: state.count,
          gap: state.gap,
          align: state.align,
          collapseBelow: state.collapseBelow,
        }}
        slotHtml="<emr-card label='OD IOP'><div style='font-size:var(--emr-text-md);color:var(--emr-text);'>15 mmHg (GAT)</div></emr-card><emr-card label='OS IOP'><div style='font-size:var(--emr-text-md);color:var(--emr-text);'>17 mmHg (GAT)</div></emr-card><emr-card label='Pachymetry'><div style='font-size:var(--emr-text-md);color:var(--emr-text);'>542 µm / 538 µm</div></emr-card>"
      />
    ),
  }),

  defineParityEntry<{
    size: 'sm' | 'md' | 'lg';
    tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    truncate: boolean;
    interactive: boolean;
    activations: number;
  }>({
    selector: 'emr-field-value-row',
    createInitialState: () => ({
      size: 'md',
      tone: 'info',
      truncate: false,
      interactive: false,
      activations: 0,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <View role="table" aria-label="Clinical findings">
        <EmrFieldValueRow heading size={state.size} field="Parameter" value="Measurement" remarks="Method" notes="Notes" />
        <EmrFieldValueRow
          size={state.size}
          tone={state.tone}
          truncate={state.truncate}
          interactive={state.interactive}
          readOnly={readOnly}
          field="IOP (OD)"
          value={state.activations > 0 ? `15 mmHg (${state.activations})` : '15 mmHg'}
          remarks="GAT (Goldmann applanation)"
          notes="09:40"
          onPress={() => update('react', 'rowActivated', state.activations + 1, (s) => ({ ...s, activations: s.activations + 1 }))}
        />
        <EmrFieldValueRow
          size={state.size}
          truncate={state.truncate}
          field="IOP (OS)"
          value=""
          remarks="Pending"
          notes="Scheduled"
        />
      </View>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <View style={{ gap: 4 }}>
        <LitElementHost tag="emr-field-value-row" props={{ heading: true, size: state.size, field: 'Parameter', value: 'Measurement', remarks: 'Method', notes: 'Notes' }} />
        <LitElementHost
          tag="emr-field-value-row"
          props={{
            size: state.size,
            tone: state.tone,
            truncate: state.truncate,
            interactive: state.interactive,
            readOnly,
            field: 'IOP (OD)',
            value: state.activations > 0 ? `15 mmHg (${state.activations})` : '15 mmHg',
            remarks: 'GAT (Goldmann applanation)',
            notes: '09:40',
          }}
          events={{
            activated: () => update('lit', 'rowActivated', state.activations + 1, (s) => ({ ...s, activations: s.activations + 1 })),
          }}
        />
        <LitElementHost
          tag="emr-field-value-row"
          props={{
            size: state.size,
            truncate: state.truncate,
            field: 'IOP (OS)',
            value: '',
            remarks: 'Pending',
            notes: 'Scheduled',
          }}
        />
      </View>
    ),
  }),

  defineParityEntry<{
    edits: number;
    compact: boolean;
    selectable: boolean;
    selected: boolean;
    disabled: boolean;
    readOnly: boolean;
    size: 'sm' | 'md';
  }>({
    selector: 'emr-status-cell',
    createInitialState: () => ({
      edits: 0,
      compact: false,
      selectable: true,
      selected: false,
      disabled: false,
      readOnly: false,
      size: 'md',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrStatusCell
        status={{ label: 'Recorded', tone: 'success' }}
        valueLabel={`124/78 mmHg (${state.edits} actions)`}
        attribution={{ nameLabel: 'Nurse K. Nair', roleLabel: 'OPD Nurse', timeLabel: '09:15' }}
        action={{ label: 'Edit', icon: 'pen' }}
        secondaryNote="Seated, right arm"
        compact={state.compact}
        selectable={state.selectable}
        selected={state.selected}
        disabled={state.disabled}
        size={state.size}
        readOnly={state.readOnly || readOnly}
        onIntent={(i) =>
          update('react', String(i), i, (s) =>
            i === 'selected' ? { ...s, selected: !s.selected } : { ...s, edits: s.edits + 1 },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-status-cell"
        props={{
          status: { label: 'Recorded', tone: 'success' },
          valueLabel: `124/78 mmHg (${state.edits} actions)`,
          attribution: { nameLabel: 'Nurse K. Nair', roleLabel: 'OPD Nurse', timeLabel: '09:15' },
          action: { label: 'Edit', icon: 'pen' },
          secondaryNote: 'Seated, right arm',
          compact: state.compact,
          selectable: state.selectable,
          selected: state.selected,
          disabled: state.disabled,
          size: state.size,
          readOnly: state.readOnly || readOnly,
        }}
        events={{
          intent: (i) =>
            update('lit', String(i), i, (s) =>
              i === 'selected' ? { ...s, selected: !s.selected } : { ...s, edits: s.edits + 1 },
            ),
        }}
      />
    ),
  }),

  defineParityEntry<{
    activeId: string;
    orientation: 'horizontal' | 'vertical';
    size: 'sm' | 'md';
    clickable: boolean;
    linear: boolean;
    disabled: boolean;
    readOnly: boolean;
  }>({
    selector: 'emr-stage-stepper',
    createInitialState: () => ({
      activeId: 'triaged',
      orientation: 'horizontal',
      size: 'md',
      clickable: true,
      linear: false,
      disabled: false,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrStageStepper
        stages={STEPPER_STAGES}
        activeId={state.activeId}
        completedIds={['referred']}
        orientation={state.orientation}
        size={state.size}
        clickable={state.clickable}
        linear={state.linear}
        disabled={state.disabled}
        readOnly={state.readOnly || readOnly}
        onStageSelect={(id) => update('react', 'onStageSelect', id, (s) => ({ ...s, activeId: id }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-stage-stepper"
        props={{
          stages: STEPPER_STAGES,
          activeId: state.activeId,
          completedIds: ['referred'],
          orientation: state.orientation,
          size: state.size,
          clickable: state.clickable,
          linear: state.linear,
          disabled: state.disabled,
          readOnly: state.readOnly || readOnly,
        }}
        events={{
          stageSelected: (id) => update('lit', 'stageSelected', id, (s) => ({ ...s, activeId: String(id) })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    clicks: number;
    tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    size: 'sm' | 'md' | 'lg';
    interactive: boolean;
    selected: boolean;
    loading: boolean;
    disabled: boolean;
    readOnly: boolean;
  }>({
    selector: 'emr-stat-tile',
    createInitialState: () => ({
      clicks: 0,
      tone: 'neutral',
      size: 'md',
      interactive: true,
      selected: false,
      loading: false,
      disabled: false,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrStatTile
        model={{
          key: 'referred',
          label: 'Patients referred today',
          value: String(14 + state.clicks),
          trend: { label: '+12% vs yesterday', direction: 'up', tone: 'success' },
          sub: 'Click tile in either pane to increment',
          status: { label: '2 awaiting sync', tone: 'warning' },
        }}
        tone={state.tone}
        size={state.size}
        interactive={state.interactive}
        selected={state.selected}
        loading={state.loading}
        disabled={state.disabled}
        readOnly={state.readOnly || readOnly}
        onIntent={(i) => update('react', i.type, i, (s) => ({ ...s, clicks: s.clicks + 1 }))}
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
            trend: { label: '+12% vs yesterday', direction: 'up', tone: 'success' },
            sub: 'Click tile in either pane to increment',
            status: { label: '2 awaiting sync', tone: 'warning' },
          },
          tone: state.tone,
          size: state.size,
          interactive: state.interactive,
          selected: state.selected,
          loading: state.loading,
          disabled: state.disabled,
          readOnly: state.readOnly || readOnly,
        }}
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ ...s, clicks: s.clicks + 1 })),
        }}
      />
    ),
  }),

  // ---- L2 (6) ----------------------------------------------------------------------------
  defineParityEntry<{
    value: string | null;
    unit: string;
    layout: 'vertical' | 'horizontal' | 'inline';
    showMetadata: boolean;
    readOnly: boolean;
    assessmentStatus: 'recorded' | 'not-assessed' | 'unable-to-assess' | undefined;
  }>({
    selector: 'emr-field-frame',
    createInitialState: () => ({
      value: '540',
      unit: 'µm',
      layout: 'vertical',
      showMetadata: true,
      readOnly: false,
      assessmentStatus: 'recorded',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrFieldFrame
        controlId="parity-ff-react"
        label="Central corneal thickness (OD)"
        unit={state.unit}
        layout={state.layout}
        showMetadata={state.showMetadata}
        readOnly={state.readOnly || readOnly}
        required
        hint="Ultrasonic pachymetry mean of 3 readings"
        note="Calibrated 08:30"
        warning={!state.value ? 'Missing pachymetry reading' : undefined}
        assessmentStatus={state.assessmentStatus}
        assessmentStatusOptions={STATUS_OPTIONS}
        onIntent={(i) => {
          if (i.type === 'statusChangeRequested') {
            update('react', i.type, i, (s) => ({ ...s, assessmentStatus: i.status as typeof s.assessmentStatus }));
          }
        }}
      >
        <EmrTextInput
          controlId="parity-ff-input-react"
          label="Central corneal thickness (OD)"
          labelHidden
          readOnly={state.readOnly || readOnly}
          value={state.value}
          onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
        />
      </EmrFieldFrame>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-field-frame"
        props={{
          controlId: 'parity-ff-lit',
          label: 'Central corneal thickness (OD)',
          unit: state.unit,
          layout: state.layout,
          showMetadata: state.showMetadata,
          readOnly: state.readOnly || readOnly,
          required: true,
          hint: 'Ultrasonic pachymetry mean of 3 readings',
          note: 'Calibrated 08:30',
          warning: !state.value ? 'Missing pachymetry reading' : undefined,
          assessmentStatus: state.assessmentStatus,
          assessmentStatusOptions: STATUS_OPTIONS,
        }}
        events={{
          intent: (i) => {
            const payload = i as { type?: string; status?: string };
            if (payload?.type === 'statusChangeRequested') {
              update('lit', 'intent', i, (s) => ({
                ...s,
                assessmentStatus: payload.status as typeof s.assessmentStatus,
              }));
            }
          },
        }}
        slotHtml={`<input id="parity-ff-lit" value="${(state.value ?? '').replace(/"/g, '&quot;')}" ${state.readOnly || readOnly ? 'readonly' : ''} style="min-height:var(--emr-control-height,44px);padding:0 10px;border:1px solid var(--emr-border);border-radius:var(--emr-radius,8px);background:var(--emr-surface);color:var(--emr-text);width:100%;box-sizing:border-box;" />`}
      />
    ),
  }),

  defineParityEntry<{
    model: ClinicalFieldState;
    showMetadata: boolean;
    layout: 'vertical' | 'horizontal' | 'inline';
    readOnly: boolean;
  }>({
    selector: 'emr-typed-field',
    createInitialState: () => ({
      model: {
        value: { value: 19, unit: 'mmHg' },
        assessmentStatus: 'recorded',
        warning: 'Compare with baseline target (≤ 16 mmHg)',
      },
      showMetadata: true,
      layout: 'vertical',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTypedField
        definition={TYPED_FIELD_DEF}
        model={state.model}
        controlId="parity-tf-react"
        showMetadata={state.showMetadata}
        layout={state.layout}
        readOnly={state.readOnly || readOnly}
        onValueChange={(value: ClinicalFieldValue) =>
          update('react', 'onValueChange', value, (s) => ({ ...s, model: { ...s.model, value } }))
        }
        onStatusChange={(assessmentStatus: ClinicalAssessmentStatus | undefined) =>
          update('react', 'onStatusChange', assessmentStatus, (s) => ({
            ...s,
            model: { ...s.model, assessmentStatus },
          }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-typed-field"
        props={{
          definition: TYPED_FIELD_DEF,
          model: state.model,
          controlId: 'parity-tf-lit',
          showMetadata: state.showMetadata,
          layout: state.layout,
          readOnly: state.readOnly || readOnly,
        }}
        events={{
          valueChange: (value) =>
            update('lit', 'valueChange', value, (s) => ({
              ...s,
              model: { ...s.model, value: value as ClinicalFieldValue },
            })),
          statusChange: (status) =>
            update('lit', 'statusChange', status, (s) => ({
              ...s,
              model: { ...s.model, assessmentStatus: (status as ClinicalAssessmentStatus | undefined) ?? undefined },
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
        controlId="parity-coded-react"
        model={{ ...state, readOnly }}
        onIntent={(i) => update('react', i.type, i, (s) => reduceCoded(s, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-coded-input"
        props={{ controlId: 'parity-coded-lit', model: { ...state, readOnly } }}
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
        controlId="parity-attest-react"
        model={state}
        readOnly={readOnly}
        onIntent={(i: AttestationIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'signRequested'
              ? {
                  ...s,
                  canSign: false,
                  canAmend: true,
                  signatories: s.signatories.map((sig) => ({
                    ...sig,
                    status: { label: 'Signed', tone: 'success' },
                    signedAtLabel: '10:42 IST',
                  })),
                }
              : i.type === 'amendRequested'
                ? {
                    ...s,
                    canSign: true,
                    canAmend: false,
                    signatories: s.signatories.map((sig) => ({
                      ...sig,
                      status: { label: 'Pending signature', tone: 'warning' },
                      signedAtLabel: undefined,
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
        props={{ controlId: 'parity-attest-lit', model: state, readOnly }}
        events={{
          intent: (i) => {
            const intent = i as AttestationIntent;
            update('lit', intent.type, intent, (s) =>
              intent.type === 'signRequested'
                ? {
                    ...s,
                    canSign: false,
                    canAmend: true,
                    signatories: s.signatories.map((sig) => ({
                      ...sig,
                      status: { label: 'Signed', tone: 'success' },
                      signedAtLabel: '10:42 IST',
                    })),
                  }
                : intent.type === 'amendRequested'
                  ? {
                      ...s,
                      canSign: true,
                      canAmend: false,
                      signatories: s.signatories.map((sig) => ({
                        ...sig,
                        status: { label: 'Pending signature', tone: 'warning' },
                        signedAtLabel: undefined,
                      })),
                    }
                  : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ value: readonly DoseSlot[] | null; readOnly: boolean }>({
    selector: 'emr-schedule-slot-picker',
    createInitialState: () => ({
      value: [
        { id: 'm', label: 'Morning', timeHint: '08:00', amount: 1 },
        { id: 'n', label: 'Night', timeHint: '22:00', amount: 1 },
      ],
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrScheduleSlotPicker
        controlId="parity-ssp-react"
        label="Dosing schedule (Brinzolamide 1%)"
        hint="Select time-of-day slots or apply a frequency preset"
        slots={FOUR_SLOTS}
        presets={SLOT_PRESETS}
        unitLabel="drops"
        readOnly={state.readOnly || readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, (s) => ({ ...s, value: v }))}
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
          readOnly: state.readOnly || readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (s) => ({ ...s, value: (v as readonly DoseSlot[] | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string;
    selectedType: string;
    scans: number;
    readOnly: boolean;
    required: boolean;
    clearable: boolean;
  }>({
    selector: 'emr-identifier-entry',
    createInitialState: () => ({
      value: '17-26-000842',
      selectedType: 'project',
      scans: 0,
      readOnly: false,
      required: false,
      clearable: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrIdentifierEntry
        controlId="parity-ident-react"
        readOnly={state.readOnly || readOnly}
        model={{
          label: 'Patient identifier',
          hint: `Scanner triggers: ${state.scans}`,
          normalisedValue: state.value.trim() || undefined,
          readOnly: state.readOnly || readOnly,
          required: state.required,
          clearable: state.clearable,
          placeholder: 'Enter or scan patient ID',
          value: state.value,
          selectedType: state.selectedType,
          typeOptions: [
            { id: 'project', label: 'Project ID' },
            { id: 'uhid', label: 'UHID' },
            { id: 'abha', label: 'National Health ID' },
          ],
        }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'valueChanged') return { ...s, value: i.raw };
            if (i.type === 'typeSelected') return { ...s, selectedType: i.id };
            if (i.type === 'scanRequested') return { ...s, scans: s.scans + 1 };
            if (i.type === 'cleared') return { ...s, value: '' };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-identifier-entry"
        props={{
          controlId: 'parity-ident-lit',
          readOnly: state.readOnly || readOnly,
          model: {
            label: 'Patient identifier',
            hint: `Scanner triggers: ${state.scans}`,
            normalisedValue: state.value.trim() || undefined,
            readOnly: state.readOnly || readOnly,
            required: state.required,
            clearable: state.clearable,
            placeholder: 'Enter or scan patient ID',
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
          intent: (i) => {
            const intent = i as { type: string; id?: string; raw?: string };
            update('lit', intent.type, intent, (s) => {
              if (intent.type === 'valueChanged') return { ...s, value: intent.raw ?? '' };
              if (intent.type === 'typeSelected' && intent.id) return { ...s, selectedType: intent.id };
              if (intent.type === 'scanRequested') return { ...s, scans: s.scans + 1 };
              if (intent.type === 'cleared') return { ...s, value: '' };
              return s;
            });
          },
        }}
      />
    ),
  }),
];
