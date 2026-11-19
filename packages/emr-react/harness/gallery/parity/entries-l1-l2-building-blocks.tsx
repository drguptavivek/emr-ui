'use client';

import { Text, View } from 'react-native';
import type {
  AddressFieldViewModel,
  AttachmentFieldViewModel,
  DurationFieldViewModel,
  EmrFileSelectionItem,
  EmrMacroSuggestion,
  LateralityFieldViewModel,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  EmrRangeValue,
  PairedFieldViewModel,
  PartialDateFieldViewModel,
  PhoneFieldViewModel,
  RangeFieldViewModel,
  RefractionFieldViewModel,
  ScaleFieldViewModel,
  SignatureCaptureViewModel,
  VisualAcuityFieldViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrAddressField,
  EmrAttachmentField,
  EmrAvatar,
  EmrButton,
  EmrCheckboxGroup,
  EmrDialog,
  EmrDurationInput,
  EmrFileTrigger,
  EmrIconButton,
  EmrLateralityField,
  EmrMacroTextField,
  EmrNumericStepper,
  EmrPairedField,
  EmrPagination,
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
  EmrSignatureCaptureField,
  EmrSkeleton,
  EmrSpinner,
  EmrTextarea,
  EmrTooltip,
  EmrVisualAcuityField,
  useEmrTheme,
} from '../../../src';
import { expandMacroTriggerAtCursor, validateRangeField } from '../../../src/l2-fields.logic';
import { LitElementHost } from './lit-element-host';
import { defineParityEntry, type ParityEntry } from './types';

function ParityNote({ children }: { children: string }) {
  const t = useEmrTheme();
  return <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontFamily }}>{children}</Text>;
}

const EYE_SEGMENTS = [
  { value: 'OD', label: 'OD (Right)' },
  { value: 'OS', label: 'OS (Left)' },
  { value: 'OU', label: 'OU (Both)' },
] as const;

const PREOP_CHECKS = [
  { value: 'consent', label: 'Signed surgical consent verified' },
  { value: 'site', label: 'Operative eye marked above brow' },
  { value: 'dilation', label: 'Tropicamide + phenylephrine instilled' },
] as const;

export const PARITY_ENTRIES_L1_L2_BUILDING_BLOCKS: readonly ParityEntry[] = [
  // ── 16 New L1 Primitives ──────────────────────────────────────────────────
  defineParityEntry<{ value: string | null }>({
    selector: 'emr-textarea',
    createInitialState: () => ({
      value: 'Gradual painless blurring of distance vision in OD over 8 months.',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTextarea
        controlId="parity-textarea-react"
        label="History of present illness"
        rows={3}
        maxLength={300}
        hint="Recorded in patient's own words"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-textarea"
        props={{
          controlId: 'parity-textarea-lit',
          label: 'History of present illness',
          rows: 3,
          maxLength: 300,
          hint: "Recorded in patient's own words",
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ pinned: boolean; clicks: number }>({
    selector: 'emr-icon-button',
    createInitialState: () => ({ pinned: true, clicks: 0 }),
    renderReact: ({ state, readOnly, update }) => (
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <EmrIconButton
          ariaLabel="Pin patient banner"
          icon="★"
          variant="secondary"
          pressed={state.pinned}
          disabled={readOnly}
          onPress={() =>
            update('react', 'onPress', !state.pinned, (s) => ({ pinned: !s.pinned, clicks: s.clicks + 1 }))
          }
        />
        <ParityNote>{`Pinned: ${state.pinned ? 'yes' : 'no'} · Clicks: ${state.clicks}`}</ParityNote>
      </View>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-icon-button"
        props={{
          ariaLabel: 'Pin patient banner',
          icon: '★',
          variant: 'secondary',
          pressed: state.pinned,
          disabled: readOnly,
        }}
        events={{
          clicked: () =>
            update('lit', 'clicked', !state.pinned, (s) => ({ pinned: !s.pinned, clicks: s.clicks + 1 })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    size: 'md' | 'sm';
    variant: 'default' | 'outline' | 'soft';
    shape: 'default' | 'pill';
    orientation: 'horizontal' | 'vertical';
    fullWidth: boolean;
    clearable: boolean;
    allowDeselect: boolean;
    required: boolean;
    invalid: boolean;
    readOnly: boolean;
    disabled: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-segmented-control',
    createInitialState: () => ({
      value: 'OD',
      size: 'md',
      variant: 'default',
      shape: 'default',
      orientation: 'horizontal',
      fullWidth: false,
      clearable: false,
      allowDeselect: false,
      required: false,
      invalid: false,
      readOnly: false,
      disabled: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSegmentedControl
        controlId="parity-seg-react"
        label="Operative eye & verification"
        options={[
          { value: 'OD', label: 'OD', description: 'Right eye', icon: 'eye', tone: 'info', badge: { label: 'Primary', tone: 'info' } },
          { value: 'OS', label: 'OS', description: 'Left eye', icon: 'eye', badge: 2 },
          { value: 'OU', label: 'OU', description: 'Both eyes', readOnly: true, badge: { label: 'Locked', tone: 'warning' } },
          { value: 'NA', label: 'Defer', disabled: true },
        ]}
        size={state.size}
        variant={state.variant}
        shape={state.shape}
        orientation={state.orientation}
        fullWidth={state.fullWidth}
        clearable={state.clearable}
        allowDeselect={state.allowDeselect}
        required={state.required}
        invalid={state.invalid}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        labelHidden={state.labelHidden}
        hint="Select operative eye laterality"
        warning={state.warning}
        error={state.error}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-segmented-control"
        props={{
          controlId: 'parity-seg-lit',
          label: 'Operative eye & verification',
          options: [
            { value: 'OD', label: 'OD', description: 'Right eye', icon: 'eye', tone: 'info', badge: { label: 'Primary', tone: 'info' } },
            { value: 'OS', label: 'OS', description: 'Left eye', icon: 'eye', badge: 2 },
            { value: 'OU', label: 'OU', description: 'Both eyes', readOnly: true, badge: { label: 'Locked', tone: 'warning' } },
            { value: 'NA', label: 'Defer', disabled: true },
          ],
          size: state.size,
          variant: state.variant,
          shape: state.shape,
          orientation: state.orientation,
          fullWidth: state.fullWidth,
          clearable: state.clearable,
          allowDeselect: state.allowDeselect,
          required: state.required,
          invalid: state.invalid,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          labelHidden: state.labelHidden,
          hint: 'Select operative eye laterality',
          warning: state.warning,
          error: state.error,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-search-input',
    createInitialState: () => ({ value: 'UHID-2026' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSearchInput
        controlId="parity-sinput-react"
        label="Filter outpatient roster"
        placeholder="Search MRN or patient name"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
        onClear={() => update('react', 'onClear', null, () => ({ value: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-search-input"
        props={{
          controlId: 'parity-sinput-lit',
          label: 'Filter outpatient roster',
          placeholder: 'Search MRN or patient name',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, () => ({ value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-password-input',
    createInitialState: () => ({ value: 'witness-pin-4821' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPasswordInput
        controlId="parity-pw-react"
        label="Controlled-drug witness passphrase"
        hint="Required for Schedule X administration witness"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-password-input"
        props={{
          controlId: 'parity-pw-lit',
          label: 'Controlled-drug witness passphrase',
          hint: 'Required for Schedule X administration witness',
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
    selector: 'emr-numeric-stepper',
    createInitialState: () => ({ value: 2 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrNumericStepper
        controlId="parity-nstep-react"
        label="Authorised refills"
        min={0}
        max={6}
        step={1}
        unit="refills"
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-numeric-stepper"
        props={{
          controlId: 'parity-nstep-lit',
          label: 'Authorised refills',
          min: 0,
          max: 6,
          step: 1,
          unit: 'refills',
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as number | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: readonly string[];
    variant: 'tile' | 'inline' | 'card' | 'chip';
    orientation: 'vertical' | 'horizontal' | 'grid';
    size: 'md' | 'sm';
    labelPlacement: 'end' | 'start' | 'space-between';
    showSelectAll: boolean;
    showSelectionCount: boolean;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-checkbox-group',
    createInitialState: () => ({
      value: ['consent', 'site'],
      variant: 'tile',
      orientation: 'vertical',
      size: 'md',
      labelPlacement: 'end',
      showSelectAll: true,
      showSelectionCount: true,
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
      <EmrCheckboxGroup
        controlId="parity-cbg-react"
        label="Pre-operative preparation checks"
        options={[
          { value: 'consent', label: 'Informed consent signed', group: 'Mandatory Safety', readOnly: true, badge: { label: 'Verified', tone: 'success' }, tone: 'success' },
          { value: 'site', label: 'Operative eye marked (OD)', group: 'Mandatory Safety', description: 'Confirmed with patient & surgical list', badge: { label: 'Critical', tone: 'info' } },
          { value: 'dilation', label: 'Mydriatic drops instilled', group: 'Clinical Prep', description: 'Tropicamide 0.8% + Phenylephrine 5%' },
          { value: 'biometry', label: 'IOL biometry verified', group: 'Clinical Prep', disabled: true, description: 'Awaiting IOLMaster upload' },
          { value: 'none', label: 'No prep required (defer)', tone: 'warning' },
        ]}
        exclusiveValues={['none']}
        variant={state.variant}
        orientation={state.orientation}
        size={state.size}
        labelPlacement={state.labelPlacement}
        showSelectAll={state.showSelectAll}
        showSelectionCount={state.showSelectionCount}
        clearable={state.clearable}
        required={state.required}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        readOnly={readOnly || state.readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => prev)}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-checkbox-group"
        props={{
          controlId: 'parity-cbg-lit',
          label: 'Pre-operative preparation checks',
          options: [
            { value: 'consent', label: 'Informed consent signed', group: 'Mandatory Safety', readOnly: true, badge: { label: 'Verified', tone: 'success' }, tone: 'success' },
            { value: 'site', label: 'Operative eye marked (OD)', group: 'Mandatory Safety', description: 'Confirmed with patient & surgical list', badge: { label: 'Critical', tone: 'info' } },
            { value: 'dilation', label: 'Mydriatic drops instilled', group: 'Clinical Prep', description: 'Tropicamide 0.8% + Phenylephrine 5%' },
            { value: 'biometry', label: 'IOL biometry verified', group: 'Clinical Prep', disabled: true, description: 'Awaiting IOLMaster upload' },
            { value: 'none', label: 'No prep required (defer)', tone: 'warning' },
          ],
          exclusiveValues: ['none'],
          variant: state.variant,
          orientation: state.orientation,
          size: state.size,
          labelPlacement: state.labelPlacement,
          showSelectAll: state.showSelectAll,
          showSelectionCount: state.showSelectionCount,
          clearable: state.clearable,
          required: state.required,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
          readOnly: readOnly || state.readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as readonly string[]) ?? [] })),
          cleared: () => update('lit', 'cleared', null, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{ page: number; pageSize: number }>({
    selector: 'emr-pagination',
    createInitialState: () => ({ page: 2, pageSize: 20 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPagination
        page={state.page}
        pageSize={state.pageSize}
        totalItems={94}
        pageSizeOptions={[10, 20, 50]}
        disabled={readOnly}
        onPageChange={(page) => update('react', 'onPageChange', page, (s) => ({ ...s, page }))}
        onPageSizeChange={(pageSize) =>
          update('react', 'onPageSizeChange', pageSize, () => ({ page: 1, pageSize }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-pagination"
        props={{
          page: state.page,
          pageSize: state.pageSize,
          totalItems: 94,
          pageSizeOptions: [10, 20, 50],
          disabled: readOnly,
        }}
        events={{
          pageChange: (p) => update('lit', 'pageChange', p, (s) => ({ ...s, page: Number(p) || 1 })),
          pageSizeChange: (ps) =>
            update('lit', 'pageSizeChange', ps, () => ({ page: 1, pageSize: Number(ps) || 20 })),
        }}
      />
    ),
  }),

  defineParityEntry<{ open: boolean }>({
    selector: 'emr-dialog',
    createInitialState: () => ({ open: false }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 8 }}>
        <EmrButton
          variant="outline"
          label={state.open ? 'Dialog open' : 'Open override dialog'}
          onPress={() => update('react', 'open', true, () => ({ open: true }))}
        />
        <EmrDialog
          open={state.open}
          title="Confirm allergy override"
          description="Document clinical rationale before signing order."
          onCloseRequested={() => update('react', 'onCloseRequested', false, () => ({ open: false }))}
        >
          <ParityNote>Penicillin cross-reactivity reviewed with inpatient pharmacist.</ParityNote>
        </EmrDialog>
      </View>
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-dialog"
        props={{
          open: state.open,
          title: 'Confirm allergy override',
          description: 'Document clinical rationale before signing order.',
        }}
        slotHtml="<p>Penicillin cross-reactivity reviewed with inpatient pharmacist.</p>"
        events={{
          closeRequested: () => update('lit', 'closeRequested', false, () => ({ open: false })),
        }}
      />
    ),
  }),

  defineParityEntry<{ open: boolean }>({
    selector: 'emr-popover',
    createInitialState: () => ({ open: true }),
    renderReact: ({ state, update }) => (
      <EmrPopover
        open={state.open}
        label="Reference range details"
        onOpenChange={(open) => update('react', 'onOpenChange', open, () => ({ open }))}
        trigger={
          <EmrButton
            variant="secondary"
            label="IOP reference"
            onPress={() => update('react', 'toggle', !state.open, (s) => ({ open: !s.open }))}
          />
        }
      >
        <ParityNote>Adult reference range: 10–21 mmHg (Goldmann applanation)</ParityNote>
      </EmrPopover>
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-popover"
        props={{ open: state.open, label: 'Reference range details' }}
        slotHtml="<button slot='trigger' type='button'>IOP reference</button><div>Adult reference range: 10–21 mmHg</div>"
        events={{
          openChange: (open) => update('lit', 'openChange', open, () => ({ open: Boolean(open) })),
        }}
      />
    ),
  }),

  defineParityEntry<Record<string, never>>({
    selector: 'emr-tooltip',
    createInitialState: () => ({}),
    renderReact: () => (
      <EmrTooltip content="Goldmann applanation tonometry">
        <EmrButton variant="outline" label="GAT abbreviation" onPress={() => {}} />
      </EmrTooltip>
    ),
    renderLit: () => (
      <LitElementHost
        tag="emr-tooltip"
        props={{ content: 'Goldmann applanation tonometry' }}
        slotHtml="<button type='button'>GAT abbreviation</button>"
      />
    ),
  }),

  defineParityEntry<{ value: number }>({
    selector: 'emr-progress-bar',
    createInitialState: () => ({ value: 72 }),
    renderReact: ({ state }) => (
      <EmrProgressBar label="Offline encounter bundle sync" value={state.value} max={100} tone="info" />
    ),
    renderLit: ({ state }) => (
      <LitElementHost
        tag="emr-progress-bar"
        props={{ label: 'Offline encounter bundle sync', value: state.value, max: 100, tone: 'info' }}
      />
    ),
  }),

  defineParityEntry<Record<string, never>>({
    selector: 'emr-spinner',
    createInitialState: () => ({}),
    renderReact: () => <EmrSpinner label="Searching SNOMED CT…" size="md" tone="info" />,
    renderLit: () => (
      <LitElementHost tag="emr-spinner" props={{ label: 'Searching SNOMED CT…', size: 'md', tone: 'info' }} />
    ),
  }),

  defineParityEntry<Record<string, never>>({
    selector: 'emr-skeleton',
    createInitialState: () => ({}),
    renderReact: () => <EmrSkeleton variant="line" lines={3} />,
    renderLit: () => <LitElementHost tag="emr-skeleton" props={{ variant: 'line', lines: 3 }} />,
  }),

  defineParityEntry<Record<string, never>>({
    selector: 'emr-avatar',
    createInitialState: () => ({}),
    renderReact: () => (
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <EmrAvatar name="Dr Meera Nair" tone="info" />
        <EmrAvatar name="Raghav Sharma" initials="RS" tone="success" size="lg" />
      </View>
    ),
    renderLit: () => (
      <LitElementHost tag="emr-avatar" props={{ name: 'Dr Meera Nair', tone: 'info', size: 'md' }} />
    ),
  }),

  defineParityEntry<{ files: readonly EmrFileSelectionItem[] }>({
    selector: 'emr-file-trigger',
    createInitialState: () => ({ files: [] }),
    renderReact: ({ state, readOnly, update }) => (
      <View style={{ gap: 8 }}>
        <EmrFileTrigger
          controlId="parity-file-react"
          label="Attach external OCT PDF"
          accept=".pdf,image/png,image/jpeg"
          multiple
          readOnly={readOnly}
          hint={state.files.length ? `${state.files.length} file(s) selected` : 'Maximum 25 MB per file'}
          onFilesSelected={(files) => update('react', 'onFilesSelected', files, () => ({ files }))}
        />
      </View>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-file-trigger"
        props={{
          controlId: 'parity-file-lit',
          label: 'Attach external OCT PDF',
          accept: '.pdf,image/png,image/jpeg',
          multiple: true,
          readOnly,
          hint: state.files.length ? `${state.files.length} file(s) selected` : 'Maximum 25 MB per file',
        }}
        events={{
          filesSelected: (files) =>
            update('lit', 'filesSelected', files, () => ({
              files: (files as readonly EmrFileSelectionItem[]) ?? [],
            })),
        }}
      />
    ),
  }),

  // ── 13 New L2 Clinical Field Building Blocks ─────────────────────────────
  defineParityEntry<ScaleFieldViewModel & { readOnly: boolean; required: boolean }>({
    selector: 'emr-scale-field',
    createInitialState: () => ({
      label: 'Post-operative ocular pain (NRS 0–10)',
      variant: 'likert',
      value: 3,
      min: 0,
      max: 10,
      anchors: { minLabel: 'No pain', maxLabel: 'Worst imaginable pain' },
      tone: 'warning',
      hint: 'Record prior to topical anaesthetic instillation',
      required: false,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrScaleField
        controlId="parity-scale-react"
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'valueChangeRequested'
              ? { ...s, value: i.value, status: 'recorded' }
              : { ...s, status: i.status },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-scale-field"
        props={{
          controlId: 'parity-scale-lit',
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; value?: number | null; status?: ScaleFieldViewModel['status'] };
            update('lit', i.type, i, (s) =>
              i.type === 'valueChangeRequested'
                ? { ...s, value: i.value ?? null, status: 'recorded' }
                : { ...s, status: i.status },
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<PartialDateFieldViewModel & { readOnly: boolean; required: boolean; clearable: boolean }>({
    selector: 'emr-partial-date-field',
    createInitialState: () => ({
      label: 'Onset of gradual blurring',
      value: { precision: 'month', value: '2025-11' },
      defaultPrecision: 'month',
      hint: 'Year or year-month supported when exact day is unknown',
      required: false,
      readOnly: false,
      clearable: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPartialDateField
        controlId="parity-pd-react"
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'precisionChangeRequested'
              ? { ...s, defaultPrecision: i.precision }
              : i.type === 'valueChangeRequested'
                ? { ...s, value: i.value }
                : i.type === 'statusChangeRequested'
                  ? { ...s, status: i.status }
                  : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-partial-date-field"
        props={{
          controlId: 'parity-pd-lit',
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              precision?: 'year' | 'month' | 'day';
              value?: PartialDateFieldViewModel['value'];
              status?: PartialDateFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) =>
              i.type === 'precisionChangeRequested' && i.precision
                ? { ...s, defaultPrecision: i.precision }
                : i.type === 'valueChangeRequested'
                  ? { ...s, value: i.value ?? null }
                  : i.type === 'statusChangeRequested'
                    ? { ...s, status: i.status }
                    : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<AttachmentFieldViewModel & { readOnly: boolean; required: boolean }>({
    selector: 'emr-attachment-field',
    createInitialState: () => ({
      label: 'Prior B-scan & referral reports',
      items: [
        {
          id: 'att-1',
          title: 'District-hospital-referral.pdf',
          contentType: 'application/pdf',
          sizeBytes: 348_160,
          statusBadge: { label: 'Verified', tone: 'success' },
        },
      ],
      accept: '.pdf,image/png,image/jpeg',
      multiple: true,
      maxItems: 3,
      allowCamera: true,
      required: false,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAttachmentField
        controlId="parity-att-react"
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'itemRemoveRequested') {
              return { ...s, items: s.items.filter((x) => x.id !== i.id) };
            }
            if (i.type === 'filesSelected') {
              const added = i.files.map((f, idx) => ({
                id: `att-${Date.now()}-${idx}`,
                title: f.name,
                contentType: f.mimeType || 'application/octet-stream',
                sizeBytes: f.sizeBytes,
              }));
              return { ...s, items: [...s.items, ...added] };
            }
            if (i.type === 'statusChangeRequested') {
              return { ...s, status: i.status };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-attachment-field"
        props={{
          controlId: 'parity-att-lit',
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              id?: string;
              files?: readonly { name: string; mimeType: string; sizeBytes: number }[];
              status?: AttachmentFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'itemRemoveRequested' && i.id) {
                return { ...s, items: s.items.filter((x) => x.id !== i.id) };
              }
              if (i.type === 'filesSelected' && i.files) {
                const added = i.files.map((f, idx) => ({
                  id: `att-${Date.now()}-${idx}`,
                  title: f.name,
                  contentType: f.mimeType || 'application/octet-stream',
                  sizeBytes: f.sizeBytes,
                }));
                return { ...s, items: [...s.items, ...added] };
              }
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    PairedFieldViewModel & {
      readOnly: boolean;
      required: boolean;
      clearable: boolean;
      mode: 'text' | 'decimal' | 'integer';
      size: 'sm' | 'md' | 'lg';
      layout: 'vertical' | 'horizontal' | 'inline';
      labelHidden: boolean;
      showMetadata: boolean;
    }
  >({
    selector: 'emr-paired-field',
    createInitialState: () => ({
      label: 'Sitting blood pressure',
      mode: 'integer',
      firstLabel: 'Systolic',
      secondLabel: 'Diastolic',
      separator: '/',
      unit: 'mmHg',
      value: { first: 128, second: 78 },
      firstMin: 50,
      firstMax: 260,
      secondMin: 30,
      secondMax: 160,
      hint: 'Seated cuff reading after 5 minutes rest',
      clearable: true,
      required: false,
      readOnly: false,
      size: 'md',
      layout: 'vertical',
      labelHidden: false,
      showMetadata: true,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPairedField
        controlId="parity-paired-react"
        labelHidden={state.labelHidden}
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const cur = s.value ?? { first: null, second: null };
            if (i.type === 'firstChangeRequested') return { ...s, value: { ...cur, first: i.value } };
            if (i.type === 'secondChangeRequested') return { ...s, value: { ...cur, second: i.value } };
            if (i.type === 'clearRequested') return { ...s, value: { first: null, second: null } };
            return { ...s, status: i.status };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-paired-field"
        props={{
          controlId: 'parity-paired-lit',
          labelHidden: state.labelHidden,
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              value?: string | number | null;
              status?: PairedFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              const cur = s.value ?? { first: null, second: null };
              if (i.type === 'firstChangeRequested') return { ...s, value: { ...cur, first: i.value ?? null } };
              if (i.type === 'secondChangeRequested') return { ...s, value: { ...cur, second: i.value ?? null } };
              if (i.type === 'clearRequested') return { ...s, value: { first: null, second: null } };
              if (i.type === 'statusChangeRequested') return { ...s, status: i.status };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    DurationFieldViewModel & {
      readOnly: boolean;
      required: boolean;
      clearable: boolean;
      showSteppers: boolean;
      size: 'sm' | 'md' | 'lg';
      layout: 'vertical' | 'horizontal' | 'inline';
      showMetadata: boolean;
      labelHidden: boolean;
    }
  >({
    selector: 'emr-duration-input',
    createInitialState: () => ({
      label: 'Topical steroid course duration',
      value: { amount: 4, unit: 'wk' },
      unitOptions: [
        { value: 'd', label: 'days' },
        { value: 'wk', label: 'weeks' },
        { value: 'mo', label: 'months' },
      ],
      min: 0,
      hint: 'Tapering schedule starts after review',
      clearable: true,
      showSteppers: true,
      required: false,
      readOnly: false,
      size: 'md',
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDurationInput
        controlId="parity-duration-react"
        labelHidden={state.labelHidden}
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const cur = s.value ?? { amount: null, unit: s.unitOptions[0]?.value ?? 'd' };
            if (i.type === 'amountChangeRequested') return { ...s, value: { ...cur, amount: i.amount } };
            if (i.type === 'unitChangeRequested') return { ...s, value: { ...cur, unit: i.unit } };
            if (i.type === 'clearRequested') return { ...s, value: null };
            return { ...s, status: i.status };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-duration-input"
        props={{
          controlId: 'parity-duration-lit',
          labelHidden: state.labelHidden,
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              amount?: number | null;
              unit?: 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
              status?: DurationFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              const cur = s.value ?? { amount: null, unit: s.unitOptions[0]?.value ?? 'd' };
              if (i.type === 'amountChangeRequested') return { ...s, value: { ...cur, amount: i.amount ?? null } };
              if (i.type === 'unitChangeRequested' && i.unit) return { ...s, value: { ...cur, unit: i.unit } };
              if (i.type === 'clearRequested') return { ...s, value: null };
              if (i.type === 'statusChangeRequested') return { ...s, status: i.status };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    RangeFieldViewModel & {
      readOnly: boolean;
      required: boolean;
      clearable: boolean;
      showSteppers: boolean;
      size: 'sm' | 'md' | 'lg';
      layout: 'vertical' | 'horizontal' | 'inline';
      showMetadata: boolean;
      labelHidden: boolean;
    }
  >({
    selector: 'emr-range-field',
    createInitialState: () => ({
      label: 'Target intraocular pressure range (OD)',
      kind: 'number',
      value: { low: 10, high: 14 },
      unit: 'mmHg',
      hint: 'Target range used for glaucoma therapy alerts',
      clearable: true,
      showSteppers: false,
      required: false,
      readOnly: false,
      size: 'md',
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRangeField
        controlId="parity-range-react"
        labelHidden={state.labelHidden}
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const cur = s.value ?? { low: null, high: null };
            let next = s;
            if (i.type === 'lowChangeRequested') next = { ...s, value: { ...cur, low: i.low } };
            else if (i.type === 'highChangeRequested') next = { ...s, value: { ...cur, high: i.high } };
            else if (i.type === 'rangeChangeRequested') next = { ...s, value: i.value };
            else if (i.type === 'clearRequested') next = { ...s, value: null };
            else if (i.type === 'statusChangeRequested') next = { ...s, status: i.status };
            return { ...next, messages: validateRangeField(next) };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-range-field"
        props={{
          controlId: 'parity-range-lit',
          labelHidden: state.labelHidden,
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              low?: number | string | null;
              high?: number | string | null;
              value?: EmrRangeValue | null;
              status?: RangeFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              const cur = s.value ?? { low: null, high: null };
              let next = s;
              if (i.type === 'lowChangeRequested') next = { ...s, value: { ...cur, low: i.low ?? null } };
              else if (i.type === 'highChangeRequested') next = { ...s, value: { ...cur, high: i.high ?? null } };
              else if (i.type === 'rangeChangeRequested') next = { ...s, value: i.value ?? null };
              else if (i.type === 'clearRequested') next = { ...s, value: null };
              else if (i.type === 'statusChangeRequested') next = { ...s, status: i.status };
              return { ...next, messages: validateRangeField(next) };
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    SignatureCaptureViewModel & {
      readOnly: boolean;
      required: boolean;
      clearable: boolean;
      undoable: boolean;
      layout: 'vertical' | 'horizontal' | 'inline';
      showMetadata: boolean;
      labelHidden: boolean;
    }
  >({
    selector: 'emr-signature-capture-field',
    createInitialState: () => ({
      label: 'Patient / guardian consent signature',
      signatoryName: 'Suresh Menon',
      signatoryRole: 'Patient',
      strokes: [
        {
          points: [
            { x: 24, y: 78 },
            { x: 68, y: 42 },
            { x: 118, y: 68 },
            { x: 176, y: 48 },
          ],
        },
      ],
      hint: 'Sign inside the pad using stylus, mouse, or touch',
      clearable: true,
      undoable: true,
      required: false,
      readOnly: false,
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSignatureCaptureField
        controlId="parity-signature-react"
        labelHidden={state.labelHidden}
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'strokeAdded') return { ...s, strokes: [...s.strokes, i.stroke] };
            if (i.type === 'undoRequested') return { ...s, strokes: s.strokes.slice(0, -1) };
            if (i.type === 'clearRequested') return { ...s, strokes: [] };
            if (i.type === 'statusChangeRequested') return { ...s, status: i.status };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-signature-capture-field"
        props={{
          controlId: 'parity-signature-lit',
          labelHidden: state.labelHidden,
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              stroke?: SignatureCaptureViewModel['strokes'][number];
              status?: SignatureCaptureViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'strokeAdded' && i.stroke) {
                return { ...s, strokes: [...s.strokes, i.stroke] };
              }
              if (i.type === 'undoRequested') {
                return { ...s, strokes: s.strokes.slice(0, -1) };
              }
              if (i.type === 'clearRequested') {
                return { ...s, strokes: [] };
              }
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    PhoneFieldViewModel & {
      readOnly: boolean;
      required: boolean;
      clearable: boolean;
      size: 'sm' | 'md' | 'lg';
      layout: 'vertical' | 'horizontal' | 'inline';
      showMetadata: boolean;
      labelHidden: boolean;
    }
  >({
    selector: 'emr-phone-input',
    createInitialState: () => ({
      label: 'Primary contact number',
      countryCode: '+91',
      countryOptions: [
        { code: '+91', label: 'India (+91)' },
        { code: '+1', label: 'United States (+1)' },
        { code: '+44', label: 'United Kingdom (+44)' },
      ],
      nationalNumber: '9876543210',
      extension: '204',
      showExtension: true,
      clearable: true,
      required: false,
      readOnly: false,
      size: 'md',
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      hint: 'Used for appointment reminders and OTP verification',
      formattedPreview: '+91 9876543210 ext. 204',
      channels: ['voice', 'sms', 'whatsapp'],
      availableChannels: [
        { id: 'voice', label: 'Voice' },
        { id: 'sms', label: 'SMS' },
        { id: 'whatsapp', label: 'WhatsApp' },
      ],
      verifiedBadge: { label: 'OTP verified', tone: 'success' },
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPhoneInput
        controlId="parity-phone-react"
        labelHidden={state.labelHidden}
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const formatPreview = (cc: string, num: string, ext?: string) =>
              num ? `${cc} ${num}${ext ? ` ext. ${ext}` : ''}` : '';
            if (i.type === 'countryCodeChangeRequested') {
              return { ...s, countryCode: i.countryCode, formattedPreview: formatPreview(i.countryCode, s.nationalNumber, s.extension) };
            }
            if (i.type === 'numberChangeRequested') {
              return { ...s, nationalNumber: i.nationalNumber, formattedPreview: formatPreview(s.countryCode, i.nationalNumber, s.extension) };
            }
            if (i.type === 'extensionChangeRequested') {
              return { ...s, extension: i.extension, formattedPreview: formatPreview(s.countryCode, s.nationalNumber, i.extension) };
            }
            if (i.type === 'channelToggleRequested') {
              const cur = s.channels ?? [];
              const nextChannels = cur.includes(i.channel)
                ? cur.filter((c) => c !== i.channel)
                : [...cur, i.channel];
              return { ...s, channels: nextChannels };
            }
            if (i.type === 'clearRequested') {
              return { ...s, nationalNumber: '', extension: '', formattedPreview: '' };
            }
            if (i.type === 'statusChangeRequested') {
              return { ...s, status: i.status };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-phone-input"
        props={{
          controlId: 'parity-phone-lit',
          labelHidden: state.labelHidden,
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              countryCode?: string;
              nationalNumber?: string;
              extension?: string;
              channel?: PhoneFieldViewModel['channels'] extends readonly (infer C)[] | undefined ? C : never;
              status?: PhoneFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              const formatPreview = (cc: string, num: string, ext?: string) =>
                num ? `${cc} ${num}${ext ? ` ext. ${ext}` : ''}` : '';
              if (i.type === 'countryCodeChangeRequested' && i.countryCode) {
                return { ...s, countryCode: i.countryCode, formattedPreview: formatPreview(i.countryCode, s.nationalNumber, s.extension) };
              }
              if (i.type === 'numberChangeRequested') {
                const num = i.nationalNumber ?? '';
                return { ...s, nationalNumber: num, formattedPreview: formatPreview(s.countryCode, num, s.extension) };
              }
              if (i.type === 'extensionChangeRequested') {
                const ext = i.extension ?? '';
                return { ...s, extension: ext, formattedPreview: formatPreview(s.countryCode, s.nationalNumber, ext) };
              }
              if (i.type === 'channelToggleRequested' && i.channel) {
                const cur = s.channels ?? [];
                const nextChannels = cur.includes(i.channel)
                  ? cur.filter((c) => c !== i.channel)
                  : [...cur, i.channel];
                return { ...s, channels: nextChannels };
              }
              if (i.type === 'clearRequested') {
                return { ...s, nationalNumber: '', extension: '', formattedPreview: '' };
              }
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    AddressFieldViewModel & {
      layout: 'vertical' | 'horizontal' | 'inline';
      showMetadata: boolean;
      labelHidden: boolean;
      readOnly: boolean;
      required: boolean;
      showDistrict: boolean;
      clearable: boolean;
    }
  >({
    selector: 'emr-address-field',
    createInitialState: () => ({
      label: 'Residential address',
      use: 'home',
      useOptions: [
        { value: 'home', label: 'Home' },
        { value: 'work', label: 'Work' },
        { value: 'temp', label: 'Temp' },
        { value: 'billing', label: 'Billing' },
      ],
      value: {
        line1: '14 Ansari Nagar East',
        line2: 'Near AIIMS Metro Gate 2',
        city: 'New Delhi',
        district: 'South Delhi',
        state: 'DL',
        postalCode: '110029',
        country: 'IN',
      },
      stateOptions: [
        { value: 'DL', label: 'Delhi (DL)' },
        { value: 'MH', label: 'Maharashtra (MH)' },
        { value: 'KA', label: 'Karnataka (KA)' },
        { value: 'TN', label: 'Tamil Nadu (TN)' },
      ],
      countryOptions: [
        { value: 'IN', label: 'India (IN)' },
        { value: 'US', label: 'United States (US)' },
        { value: 'GB', label: 'United Kingdom (GB)' },
      ],
      showDistrict: true,
      clearable: true,
      required: false,
      readOnly: false,
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      hint: 'Used for patient correspondence, ABHA KYC, and home sample collection',
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAddressField
        controlId="parity-address-react"
        labelHidden={state.labelHidden}
        readOnly={state.readOnly || readOnly}
        model={{ ...state, readOnly: state.readOnly || readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'fieldChangeRequested') {
              return { ...s, value: { ...s.value, [i.part]: i.value } };
            }
            if (i.type === 'useChangeRequested') {
              return { ...s, use: i.use };
            }
            if (i.type === 'cleared') {
              return {
                ...s,
                value: {
                  line1: '',
                  line2: '',
                  city: '',
                  district: '',
                  state: '',
                  postalCode: '',
                  country: '',
                },
              };
            }
            if (i.type === 'statusChangeRequested') {
              return { ...s, status: i.status };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-address-field"
        props={{
          controlId: 'parity-address-lit',
          labelHidden: state.labelHidden,
          readOnly: state.readOnly || readOnly,
          model: { ...state, readOnly: state.readOnly || readOnly },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              part?: keyof AddressFieldViewModel['value'];
              value?: string;
              use?: AddressFieldViewModel['use'];
              status?: AddressFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'fieldChangeRequested' && i.part) {
                return { ...s, value: { ...s.value, [i.part]: i.value ?? '' } };
              }
              if (i.type === 'useChangeRequested' && i.use) {
                return { ...s, use: i.use };
              }
              if (i.type === 'cleared') {
                return {
                  ...s,
                  value: {
                    line1: '',
                    line2: '',
                    city: '',
                    district: '',
                    state: '',
                    postalCode: '',
                    country: '',
                  },
                };
              }
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<
    MacroTextFieldViewModel & {
      layout: 'vertical' | 'horizontal' | 'inline';
      showMetadata: boolean;
      labelHidden: boolean;
      readOnly: boolean;
      required: boolean;
      clearable: boolean;
      rows: number;
      maxLength: number;
    }
  >({
    selector: 'emr-macro-text-field',
    createInitialState: () => ({
      label: 'Anterior segment findings',
      value: 'Lids and lashes normal. .clearcornea',
      suggestionsOpen: true,
      suggestions: [
        {
          trigger: '.clearcornea',
          label: 'Clear cornea, deep quiet AC',
          expansionPreview: 'Cornea clear, anterior chamber deep and quiet, iris normal pattern.',
          category: 'Anterior',
        },
        {
          trigger: '.normfundus',
          label: 'Normal fundus examination',
          expansionPreview: 'Media clear, optic disc pink with sharp margins (CDR 0.3), macula healthy, vessels normal.',
          category: 'Posterior',
        },
        {
          trigger: '/postopd1',
          label: 'Post-op Day 1 cataract note',
          expansionPreview: 'POD1: Wound sealed, cornea clear, AC deep with trace cells, IOL well-centred, IOP 14 mmHg.',
          category: 'Post-op',
        },
      ],
      clearable: true,
      maxLength: 280,
      rows: 4,
      dictating: false,
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      required: false,
      readOnly: false,
      hint: 'Type . or / to expand clinical SmartPhrases',
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => {
      const catalog: readonly EmrMacroSuggestion[] = [
        {
          trigger: '.clearcornea',
          label: 'Clear cornea, deep quiet AC',
          expansionPreview: 'Cornea clear, anterior chamber deep and quiet, iris normal pattern.',
          category: 'Anterior',
        },
        {
          trigger: '.normfundus',
          label: 'Normal fundus examination',
          expansionPreview: 'Media clear, optic disc pink with sharp margins (CDR 0.3), macula healthy, vessels normal.',
          category: 'Posterior',
        },
        {
          trigger: '/postopd1',
          label: 'Post-op Day 1 cataract note',
          expansionPreview: 'POD1: Wound sealed, cornea clear, AC deep with trace cells, IOL well-centred, IOP 14 mmHg.',
          category: 'Post-op',
        },
      ];
      return (
        <EmrMacroTextField
          controlId="parity-macro-react"
          labelHidden={state.labelHidden}
          layout={state.layout}
          showMetadata={state.showMetadata}
          readOnly={state.readOnly || readOnly}
          rows={state.rows}
          maxLength={state.maxLength}
          clearable={state.clearable}
          model={{ ...state, readOnly: state.readOnly || readOnly }}
          onIntent={(i) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'valueChangeRequested') {
                return { ...s, value: i.value };
              }
              if (i.type === 'macroQueryRequested') {
                const q = i.trigger.toLowerCase();
                const suggestions = catalog.filter((m) =>
                  q === '.' || q === '/'
                    ? m.trigger.toLowerCase().startsWith(q)
                    : m.trigger.toLowerCase().includes(q) || m.label.toLowerCase().includes(q),
                );
                return { ...s, suggestions, suggestionsOpen: true };
              }
              if (i.type === 'macroSelected') {
                const chosen = catalog.find((m) => m.trigger === i.trigger);
                const expanded = expandMacroTriggerAtCursor(
                  s.value,
                  s.value.length,
                  chosen ? chosen.expansionPreview : i.trigger,
                );
                return { ...s, value: expanded.value, suggestions: catalog, suggestionsOpen: false };
              }
              if (i.type === 'macroDismissRequested') {
                return { ...s, suggestionsOpen: false };
              }
              if (i.type === 'dictationToggleRequested') {
                return { ...s, dictating: !s.dictating };
              }
              if (i.type === 'clearRequested') {
                return { ...s, value: '', suggestions: catalog, suggestionsOpen: false };
              }
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const catalog: readonly EmrMacroSuggestion[] = [
        {
          trigger: '.clearcornea',
          label: 'Clear cornea, deep quiet AC',
          expansionPreview: 'Cornea clear, anterior chamber deep and quiet, iris normal pattern.',
          category: 'Anterior',
        },
        {
          trigger: '.normfundus',
          label: 'Normal fundus examination',
          expansionPreview: 'Media clear, optic disc pink with sharp margins (CDR 0.3), macula healthy, vessels normal.',
          category: 'Posterior',
        },
        {
          trigger: '/postopd1',
          label: 'Post-op Day 1 cataract note',
          expansionPreview: 'POD1: Wound sealed, cornea clear, AC deep with trace cells, IOL well-centred, IOP 14 mmHg.',
          category: 'Post-op',
        },
      ];
      return (
        <LitElementHost
          tag="emr-macro-text-field"
          props={{
            controlId: 'parity-macro-lit',
            labelHidden: state.labelHidden,
            layout: state.layout,
            showMetadata: state.showMetadata,
            readOnly: state.readOnly || readOnly,
            rows: state.rows,
            maxLength: state.maxLength,
            clearable: state.clearable,
            model: { ...state, readOnly: state.readOnly || readOnly },
          }}
          events={{
            intent: (raw) => {
              const i = raw as MacroTextFieldIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'valueChangeRequested') {
                  return { ...s, value: i.value };
                }
                if (i.type === 'macroQueryRequested') {
                  const q = i.trigger.toLowerCase();
                  const suggestions = catalog.filter((m) =>
                    q === '.' || q === '/'
                      ? m.trigger.toLowerCase().startsWith(q)
                      : m.trigger.toLowerCase().includes(q) || m.label.toLowerCase().includes(q),
                  );
                  return { ...s, suggestions, suggestionsOpen: true };
                }
                if (i.type === 'macroSelected') {
                  const chosen = catalog.find((m) => m.trigger === i.trigger);
                  const expanded = expandMacroTriggerAtCursor(
                    s.value,
                    s.value.length,
                    chosen ? chosen.expansionPreview : i.trigger,
                  );
                  return { ...s, value: expanded.value, suggestions: catalog, suggestionsOpen: false };
                }
                if (i.type === 'macroDismissRequested') {
                  return { ...s, suggestionsOpen: false };
                }
                if (i.type === 'dictationToggleRequested') {
                  return { ...s, dictating: !s.dictating };
                }
                if (i.type === 'clearRequested') {
                  return { ...s, value: '', suggestions: catalog, suggestionsOpen: false };
                }
                if (i.type === 'statusChangeRequested') {
                  return { ...s, status: i.status };
                }
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<LateralityFieldViewModel & { labelHidden: boolean }>({
    selector: 'emr-laterality-field',
    createInitialState: () => ({
      label: 'Operative site & laterality',
      domain: 'ophthalmic',
      value: 'OD',
      requiresConfirmation: true,
      confirmed: false,
      confirmationLabel: 'Operative eye confirmed against consent and biometry',
      hint: 'Verify laterality before surgical site marking',
      readOnly: false,
      required: false,
      clearable: true,
      size: 'md',
      layout: 'vertical',
      orientation: 'horizontal',
      showMetadata: true,
      labelHidden: false,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'danger' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
      messages: [],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrLateralityField
        controlId="parity-laterality-react"
        model={{ ...state, readOnly: Boolean(readOnly || state.readOnly) }}
        labelHidden={state.labelHidden}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'lateralitySelected'
              ? { ...s, value: i.code, confirmed: false }
              : i.type === 'confirmationChangeRequested'
                ? { ...s, confirmed: i.confirmed }
                : { ...s, status: i.status },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-laterality-field"
        props={{
          controlId: 'parity-laterality-lit',
          labelHidden: state.labelHidden,
          model: { ...state, readOnly: Boolean(readOnly || state.readOnly) },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              code?: LateralityFieldViewModel['value'];
              confirmed?: boolean;
              status?: LateralityFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) =>
              i.type === 'lateralitySelected'
                ? { ...s, value: i.code ?? null, confirmed: false }
                : i.type === 'confirmationChangeRequested'
                  ? { ...s, confirmed: Boolean(i.confirmed) }
                  : { ...s, status: i.status },
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<VisualAcuityFieldViewModel & { readonly labelHidden?: boolean }>({
    selector: 'emr-visual-acuity-field',
    createInitialState: () => ({
      label: 'Distance visual acuity',
      eye: 'OD',
      notation: 'snellen-m',
      notationOptions: [
        { value: 'snellen-m', label: 'Snellen (6m)' },
        { value: 'snellen-ft', label: 'Snellen (20ft)' },
        { value: 'logmar', label: 'LogMAR' },
        { value: 'etdrs', label: 'ETDRS' },
        { value: 'low-vision', label: 'Low vision' },
      ],
      correction: 'unaided',
      correctionOptions: [
        { value: 'unaided', label: 'Unaided' },
        { value: 'habitual', label: 'Habitual' },
        { value: 'best-corrected', label: 'BCVA' },
        { value: 'contact-lens', label: 'CL' },
      ],
      value: '6/18',
      valueOptions: [
        { value: '6/6', label: '6/6' },
        { value: '6/9', label: '6/9' },
        { value: '6/12', label: '6/12' },
        { value: '6/18', label: '6/18' },
        { value: '6/24', label: '6/24' },
        { value: '6/36', label: '6/36' },
        { value: '6/60', label: '6/60' },
      ],
      showPinhole: true,
      pinholeValue: '6/9',
      derivedDisplay: 'LogMAR 0.48 (PH 0.18)',
      derivedTone: 'neutral',
      hint: 'Record monocular distance acuity and pinhole when < 6/9',
      clearable: true,
      size: 'md',
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      required: false,
      readOnly: false,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'danger' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
      messages: [],
    }),
    renderReact: ({ state, readOnly, update }) => {
      const applyVaIntent = (
        s: VisualAcuityFieldViewModel & { readonly labelHidden?: boolean },
        i: {
          readonly type: string;
          readonly value?: string | null;
          readonly notation?: VisualAcuityFieldViewModel['notation'];
          readonly correction?: VisualAcuityFieldViewModel['correction'];
          readonly status?: VisualAcuityFieldViewModel['status'];
        },
      ): VisualAcuityFieldViewModel & { readonly labelHidden?: boolean } => {
        const chartMap: Record<
          VisualAcuityFieldViewModel['notation'],
          {
            readonly options: VisualAcuityFieldViewModel['valueOptions'];
            readonly value: string;
            readonly pinhole: string | null;
            readonly derived: string;
          }
        > = {
          'snellen-m': {
            options: [
              { value: '6/6', label: '6/6' },
              { value: '6/9', label: '6/9' },
              { value: '6/12', label: '6/12' },
              { value: '6/18', label: '6/18' },
              { value: '6/24', label: '6/24' },
              { value: '6/36', label: '6/36' },
              { value: '6/60', label: '6/60' },
            ],
            value: '6/18',
            pinhole: '6/9',
            derived: 'LogMAR 0.48 (PH 0.18)',
          },
          'snellen-ft': {
            options: [
              { value: '20/20', label: '20/20' },
              { value: '20/30', label: '20/30' },
              { value: '20/40', label: '20/40' },
              { value: '20/60', label: '20/60' },
              { value: '20/80', label: '20/80' },
              { value: '20/200', label: '20/200' },
            ],
            value: '20/60',
            pinhole: '20/30',
            derived: 'Snellen 6/18 (LogMAR 0.48)',
          },
          logmar: {
            options: [
              { value: '0.00', label: '0.00' },
              { value: '0.18', label: '0.18' },
              { value: '0.30', label: '0.30' },
              { value: '0.48', label: '0.48' },
              { value: '0.60', label: '0.60' },
              { value: '1.00', label: '1.00' },
            ],
            value: '0.48',
            pinhole: '0.18',
            derived: 'Snellen 6/18 (20/60)',
          },
          etdrs: {
            options: [
              { value: '85', label: '85 letters' },
              { value: '75', label: '75 letters' },
              { value: '70', label: '70 letters' },
              { value: '61', label: '61 letters' },
              { value: '55', label: '55 letters' },
              { value: '35', label: '35 letters' },
            ],
            value: '61',
            pinhole: '75',
            derived: 'Snellen 6/18 (LogMAR 0.48)',
          },
          'low-vision': {
            options: [
              { value: 'CF-3m', label: 'CF 3m' },
              { value: 'CF-1m', label: 'CF 1m' },
              { value: 'HM', label: 'HM' },
              { value: 'LP', label: 'LP' },
              { value: 'NLP', label: 'NLP' },
            ],
            value: 'CF-3m',
            pinhole: null,
            derived: 'WHO Low Vision (LogMAR > 1.3)',
          },
        };
        if (i.type === 'notationChangeRequested' && i.notation) {
          const preset = chartMap[i.notation];
          return {
            ...s,
            notation: i.notation,
            valueOptions: preset.options,
            value: preset.value,
            pinholeValue: s.showPinhole ? preset.pinhole : null,
            derivedDisplay: preset.derived,
          };
        }
        if (i.type === 'correctionChangeRequested' && i.correction) {
          return { ...s, correction: i.correction };
        }
        if (i.type === 'valueChangeRequested') {
          const nextVal = i.value ?? null;
          return {
            ...s,
            value: nextVal,
            derivedDisplay: nextVal
              ? `${s.notation.toUpperCase()} ${nextVal}${s.pinholeValue ? ` (PH ${s.pinholeValue})` : ''}`
              : undefined,
          };
        }
        if (i.type === 'pinholeChangeRequested') {
          const nextPh = i.value ?? null;
          return {
            ...s,
            pinholeValue: nextPh,
            derivedDisplay: s.value
              ? `${s.notation.toUpperCase()} ${s.value}${nextPh ? ` (PH ${nextPh})` : ''}`
              : s.derivedDisplay,
          };
        }
        return { ...s, status: i.status };
      };

      return (
        <EmrVisualAcuityField
          controlId="parity-va-react"
          model={{ ...state, readOnly: Boolean(readOnly || state.readOnly) }}
          labelHidden={state.labelHidden}
          layout={state.layout}
          showMetadata={state.showMetadata}
          size={state.size}
          clearable={state.clearable}
          onIntent={(i) => update('react', i.type, i, (s) => applyVaIntent(s, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-visual-acuity-field"
        props={{
          controlId: 'parity-va-lit',
          labelHidden: state.labelHidden,
          layout: state.layout,
          showMetadata: state.showMetadata,
          size: state.size,
          clearable: state.clearable,
          readOnly: Boolean(readOnly || state.readOnly),
          model: { ...state, readOnly: Boolean(readOnly || state.readOnly) },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              value?: string | null;
              notation?: VisualAcuityFieldViewModel['notation'];
              correction?: VisualAcuityFieldViewModel['correction'];
              status?: VisualAcuityFieldViewModel['status'];
            };
            const chartMap: Record<
              VisualAcuityFieldViewModel['notation'],
              {
                readonly options: VisualAcuityFieldViewModel['valueOptions'];
                readonly value: string;
                readonly pinhole: string | null;
                readonly derived: string;
              }
            > = {
              'snellen-m': {
                options: [
                  { value: '6/6', label: '6/6' },
                  { value: '6/9', label: '6/9' },
                  { value: '6/12', label: '6/12' },
                  { value: '6/18', label: '6/18' },
                  { value: '6/24', label: '6/24' },
                  { value: '6/36', label: '6/36' },
                  { value: '6/60', label: '6/60' },
                ],
                value: '6/18',
                pinhole: '6/9',
                derived: 'LogMAR 0.48 (PH 0.18)',
              },
              'snellen-ft': {
                options: [
                  { value: '20/20', label: '20/20' },
                  { value: '20/30', label: '20/30' },
                  { value: '20/40', label: '20/40' },
                  { value: '20/60', label: '20/60' },
                  { value: '20/80', label: '20/80' },
                  { value: '20/200', label: '20/200' },
                ],
                value: '20/60',
                pinhole: '20/30',
                derived: 'Snellen 6/18 (LogMAR 0.48)',
              },
              logmar: {
                options: [
                  { value: '0.00', label: '0.00' },
                  { value: '0.18', label: '0.18' },
                  { value: '0.30', label: '0.30' },
                  { value: '0.48', label: '0.48' },
                  { value: '0.60', label: '0.60' },
                  { value: '1.00', label: '1.00' },
                ],
                value: '0.48',
                pinhole: '0.18',
                derived: 'Snellen 6/18 (20/60)',
              },
              etdrs: {
                options: [
                  { value: '85', label: '85 letters' },
                  { value: '75', label: '75 letters' },
                  { value: '70', label: '70 letters' },
                  { value: '61', label: '61 letters' },
                  { value: '55', label: '55 letters' },
                  { value: '35', label: '35 letters' },
                ],
                value: '61',
                pinhole: '75',
                derived: 'Snellen 6/18 (LogMAR 0.48)',
              },
              'low-vision': {
                options: [
                  { value: 'CF-3m', label: 'CF 3m' },
                  { value: 'CF-1m', label: 'CF 1m' },
                  { value: 'HM', label: 'HM' },
                  { value: 'LP', label: 'LP' },
                  { value: 'NLP', label: 'NLP' },
                ],
                value: 'CF-3m',
                pinhole: null,
                derived: 'WHO Low Vision (LogMAR > 1.3)',
              },
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'notationChangeRequested' && i.notation) {
                const preset = chartMap[i.notation];
                return {
                  ...s,
                  notation: i.notation,
                  valueOptions: preset.options,
                  value: preset.value,
                  pinholeValue: s.showPinhole ? preset.pinhole : null,
                  derivedDisplay: preset.derived,
                };
              }
              if (i.type === 'correctionChangeRequested' && i.correction) {
                return { ...s, correction: i.correction };
              }
              if (i.type === 'valueChangeRequested') {
                const nextVal = i.value ?? null;
                return {
                  ...s,
                  value: nextVal,
                  derivedDisplay: nextVal
                    ? `${s.notation.toUpperCase()} ${nextVal}${s.pinholeValue ? ` (PH ${s.pinholeValue})` : ''}`
                    : undefined,
                };
              }
              if (i.type === 'pinholeChangeRequested') {
                const nextPh = i.value ?? null;
                return {
                  ...s,
                  pinholeValue: nextPh,
                  derivedDisplay: s.value
                    ? `${s.notation.toUpperCase()} ${s.value}${nextPh ? ` (PH ${nextPh})` : ''}`
                    : s.derivedDisplay,
                };
              }
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<RefractionFieldViewModel & { readonly labelHidden?: boolean }>({
    selector: 'emr-refraction-field',
    createInitialState: () => ({
      label: 'Subjective refraction',
      eye: 'OD',
      value: { sphere: -2.25, cylinder: -0.75, axis: 95, nearAdd: 2.0 },
      showNearAdd: true,
      formattedSummary: '-2.25 / -0.75 × 095°  Add +2.00 D (SE -2.63 D)',
      hint: 'Enter manifest refraction in minus-cylinder notation',
      clearable: true,
      size: 'md',
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      required: false,
      readOnly: false,
      status: 'recorded',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'danger' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
      messages: [],
    }),
    renderReact: ({ state, readOnly, update }) => {
      const applyRxIntent = (
        s: RefractionFieldViewModel & { readonly labelHidden?: boolean },
        i: {
          readonly type: string;
          readonly sphere?: number | null;
          readonly cylinder?: number | null;
          readonly axis?: number | null;
          readonly nearAdd?: number | null;
          readonly status?: RefractionFieldViewModel['status'];
        },
      ): RefractionFieldViewModel & { readonly labelHidden?: boolean } => {
        if (i.type === 'statusChangeRequested') {
          return { ...s, status: i.status };
        }
        const nextValue: RefractionFieldViewModel['value'] =
          i.type === 'clearRequested'
            ? { sphere: null, cylinder: null, axis: null, nearAdd: null }
            : i.type === 'sphereChangeRequested'
              ? { ...s.value, sphere: i.sphere ?? null }
              : i.type === 'cylinderChangeRequested'
                ? { ...s.value, cylinder: i.cylinder ?? null }
                : i.type === 'axisChangeRequested'
                  ? { ...s.value, axis: i.axis ?? null }
                  : { ...s.value, nearAdd: i.nearAdd ?? null };

        const fmtSigned = (n: number | null | undefined) => {
          if (n === null || n === undefined) return '—';
          const fixed = Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2);
          return n > 0 ? `+${fixed}` : fixed;
        };
        const hasAny =
          nextValue.sphere !== null ||
          nextValue.cylinder !== null ||
          nextValue.axis !== null ||
          Boolean(s.showNearAdd && nextValue.nearAdd != null);
        const formattedSummary = hasAny
          ? `${fmtSigned(nextValue.sphere)}${nextValue.cylinder !== null ? ` / ${fmtSigned(nextValue.cylinder)}` : ''}${nextValue.axis !== null ? ` × ${String(Math.round(nextValue.axis)).padStart(3, '0')}°` : ''}${s.showNearAdd && nextValue.nearAdd != null ? `  Add ${fmtSigned(nextValue.nearAdd)} D` : ''}${nextValue.sphere !== null ? ` (SE ${fmtSigned(nextValue.sphere + (nextValue.cylinder ?? 0) / 2)} D)` : ''}`
          : undefined;

        const messages: NonNullable<RefractionFieldViewModel['messages']>[number][] = [];
        if (nextValue.sphere !== null && (nextValue.sphere < -30 || nextValue.sphere > 30)) {
          messages.push({ path: ['sphere'], severity: 'error', message: 'Sphere must be between -30.00 and +30.00 D.' });
        } else if (nextValue.sphere !== null && nextValue.sphere <= -6) {
          messages.push({ path: ['sphere'], severity: 'warning', message: 'High myopia (>= 6.00 D) — verify retinal exam.' });
        }
        if (nextValue.cylinder !== null && (nextValue.cylinder < -15 || nextValue.cylinder > 15)) {
          messages.push({ path: ['cylinder'], severity: 'error', message: 'Cylinder must be between -15.00 and +15.00 D.' });
        }
        if (nextValue.cylinder !== null && nextValue.cylinder !== 0 && nextValue.axis === null) {
          messages.push({ path: ['axis'], severity: 'error', message: 'Axis is required when cylinder is non-zero.' });
        } else if (nextValue.axis !== null && (nextValue.axis < 1 || nextValue.axis > 180)) {
          messages.push({ path: ['axis'], severity: 'error', message: 'Axis must be between 1° and 180°.' });
        }

        return { ...s, value: nextValue, formattedSummary, messages };
      };

      return (
        <EmrRefractionField
          controlId="parity-refraction-react"
          model={{ ...state, readOnly: Boolean(readOnly || state.readOnly) }}
          labelHidden={state.labelHidden}
          layout={state.layout}
          showMetadata={state.showMetadata}
          size={state.size}
          clearable={state.clearable}
          onIntent={(i) => update('react', i.type, i, (s) => applyRxIntent(s, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-refraction-field"
        props={{
          controlId: 'parity-refraction-lit',
          labelHidden: state.labelHidden,
          layout: state.layout,
          showMetadata: state.showMetadata,
          size: state.size,
          clearable: state.clearable,
          readOnly: Boolean(readOnly || state.readOnly),
          model: { ...state, readOnly: Boolean(readOnly || state.readOnly) },
        }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              sphere?: number | null;
              cylinder?: number | null;
              axis?: number | null;
              nearAdd?: number | null;
              status?: RefractionFieldViewModel['status'];
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'statusChangeRequested') {
                return { ...s, status: i.status };
              }
              const nextValue: RefractionFieldViewModel['value'] =
                i.type === 'clearRequested'
                  ? { sphere: null, cylinder: null, axis: null, nearAdd: null }
                  : i.type === 'sphereChangeRequested'
                    ? { ...s.value, sphere: i.sphere ?? null }
                    : i.type === 'cylinderChangeRequested'
                      ? { ...s.value, cylinder: i.cylinder ?? null }
                      : i.type === 'axisChangeRequested'
                        ? { ...s.value, axis: i.axis ?? null }
                        : { ...s.value, nearAdd: i.nearAdd ?? null };

              const fmtSigned = (n: number | null | undefined) => {
                if (n === null || n === undefined) return '—';
                const fixed = Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2);
                return n > 0 ? `+${fixed}` : fixed;
              };
              const hasAny =
                nextValue.sphere !== null ||
                nextValue.cylinder !== null ||
                nextValue.axis !== null ||
                Boolean(s.showNearAdd && nextValue.nearAdd != null);
              const formattedSummary = hasAny
                ? `${fmtSigned(nextValue.sphere)}${nextValue.cylinder !== null ? ` / ${fmtSigned(nextValue.cylinder)}` : ''}${nextValue.axis !== null ? ` × ${String(Math.round(nextValue.axis)).padStart(3, '0')}°` : ''}${s.showNearAdd && nextValue.nearAdd != null ? `  Add ${fmtSigned(nextValue.nearAdd)} D` : ''}${nextValue.sphere !== null ? ` (SE ${fmtSigned(nextValue.sphere + (nextValue.cylinder ?? 0) / 2)} D)` : ''}`
                : undefined;

              const messages: NonNullable<RefractionFieldViewModel['messages']>[number][] = [];
              if (nextValue.sphere !== null && (nextValue.sphere < -30 || nextValue.sphere > 30)) {
                messages.push({ path: ['sphere'], severity: 'error', message: 'Sphere must be between -30.00 and +30.00 D.' });
              } else if (nextValue.sphere !== null && nextValue.sphere <= -6) {
                messages.push({ path: ['sphere'], severity: 'warning', message: 'High myopia (>= 6.00 D) — verify retinal exam.' });
              }
              if (nextValue.cylinder !== null && (nextValue.cylinder < -15 || nextValue.cylinder > 15)) {
                messages.push({ path: ['cylinder'], severity: 'error', message: 'Cylinder must be between -15.00 and +15.00 D.' });
              }
              if (nextValue.cylinder !== null && nextValue.cylinder !== 0 && nextValue.axis === null) {
                messages.push({ path: ['axis'], severity: 'error', message: 'Axis is required when cylinder is non-zero.' });
              } else if (nextValue.axis !== null && (nextValue.axis < 1 || nextValue.axis > 180)) {
                messages.push({ path: ['axis'], severity: 'error', message: 'Axis must be between 1° and 180°.' });
              }

              return { ...s, value: nextValue, formattedSummary, messages };
            });
          },
        }}
      />
    ),
  }),
];
