'use client';

import { Text, View } from 'react-native';
import type {
  AddressFieldViewModel,
  AttachmentFieldViewModel,
  DurationFieldViewModel,
  EmrFileSelectionItem,
  LateralityFieldViewModel,
  MacroTextFieldViewModel,
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

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-segmented-control',
    createInitialState: () => ({ value: 'OD' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSegmentedControl
        controlId="parity-seg-react"
        label="Operative eye"
        options={EYE_SEGMENTS}
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-segmented-control"
        props={{
          controlId: 'parity-seg-lit',
          label: 'Operative eye',
          options: EYE_SEGMENTS,
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

  defineParityEntry<{ value: readonly string[] }>({
    selector: 'emr-checkbox-group',
    createInitialState: () => ({ value: ['consent', 'site'] }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCheckboxGroup
        controlId="parity-cbg-react"
        label="Pre-operative preparation checks"
        options={PREOP_CHECKS}
        readOnly={readOnly}
        value={state.value}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-checkbox-group"
        props={{
          controlId: 'parity-cbg-lit',
          label: 'Pre-operative preparation checks',
          options: PREOP_CHECKS,
          readOnly,
          value: state.value,
        }}
        events={{
          valueChange: (v) => update('lit', 'valueChange', v, () => ({ value: (v as readonly string[]) ?? [] })),
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
  defineParityEntry<ScaleFieldViewModel>({
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
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrScaleField
        model={{ ...state, readOnly }}
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
        props={{ model: { ...state, readOnly } }}
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

  defineParityEntry<PartialDateFieldViewModel>({
    selector: 'emr-partial-date-field',
    createInitialState: () => ({
      label: 'Onset of gradual blurring',
      value: { precision: 'month', value: '2025-11' },
      hint: 'Year or year-month supported when exact day is unknown',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPartialDateField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'valueChangeRequested' ? { ...s, value: i.value } : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-partial-date-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; value?: PartialDateFieldViewModel['value'] };
            update('lit', i.type, i, (s) =>
              i.type === 'valueChangeRequested' ? { ...s, value: i.value ?? null } : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<AttachmentFieldViewModel>({
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
      allowCamera: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAttachmentField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'itemRemoveRequested'
              ? { ...s, items: s.items.filter((x) => x.id !== i.id) }
              : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-attachment-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; id?: string };
            update('lit', i.type, i, (s) =>
              i.type === 'itemRemoveRequested'
                ? { ...s, items: s.items.filter((x) => x.id !== i.id) }
                : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<PairedFieldViewModel>({
    selector: 'emr-paired-field',
    createInitialState: () => ({
      label: 'Sitting blood pressure',
      mode: 'integer',
      firstLabel: 'Systolic',
      secondLabel: 'Diastolic',
      separator: '/',
      unit: 'mmHg',
      value: { first: 128, second: 78 },
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPairedField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const cur = s.value ?? { first: null, second: null };
            if (i.type === 'firstChangeRequested') return { ...s, value: { ...cur, first: i.value } };
            if (i.type === 'secondChangeRequested') return { ...s, value: { ...cur, second: i.value } };
            return { ...s, status: i.status };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-paired-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; value?: string | number | null };
            update('lit', i.type, i, (s) => {
              const cur = s.value ?? { first: null, second: null };
              if (i.type === 'firstChangeRequested') return { ...s, value: { ...cur, first: i.value ?? null } };
              if (i.type === 'secondChangeRequested') return { ...s, value: { ...cur, second: i.value ?? null } };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<DurationFieldViewModel>({
    selector: 'emr-duration-input',
    createInitialState: () => ({
      label: 'Topical steroid course duration',
      value: { amount: 4, unit: 'wk' },
      unitOptions: [
        { value: 'd', label: 'days' },
        { value: 'wk', label: 'weeks' },
        { value: 'mo', label: 'months' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDurationInput
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const cur = s.value ?? { amount: null, unit: 'd' as const };
            if (i.type === 'amountChangeRequested') return { ...s, value: { ...cur, amount: i.amount } };
            if (i.type === 'unitChangeRequested') return { ...s, value: { ...cur, unit: i.unit } };
            return { ...s, status: i.status };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-duration-input"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; amount?: number | null; unit?: 'd' | 'wk' | 'mo' };
            update('lit', i.type, i, (s) => {
              const cur = s.value ?? { amount: null, unit: 'd' as const };
              if (i.type === 'amountChangeRequested') return { ...s, value: { ...cur, amount: i.amount ?? null } };
              if (i.type === 'unitChangeRequested' && i.unit) return { ...s, value: { ...cur, unit: i.unit } };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<RangeFieldViewModel>({
    selector: 'emr-range-field',
    createInitialState: () => ({
      label: 'Target intraocular pressure range (OD)',
      kind: 'number',
      value: { low: 10, high: 14 },
      unit: 'mmHg',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRangeField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            const cur = s.value ?? { low: null, high: null };
            return i.type === 'lowChangeRequested'
              ? { ...s, value: { ...cur, low: i.low } }
              : { ...s, value: { ...cur, high: i.high } };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-range-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; low?: number | string | null; high?: number | string | null };
            update('lit', i.type, i, (s) => {
              const cur = s.value ?? { low: null, high: null };
              return i.type === 'lowChangeRequested'
                ? { ...s, value: { ...cur, low: i.low ?? null } }
                : { ...s, value: { ...cur, high: i.high ?? null } };
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<SignatureCaptureViewModel>({
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
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSignatureCaptureField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'strokeAdded' ? { ...s, strokes: [...s.strokes, i.stroke] } : { ...s, strokes: [] },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-signature-capture-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as SignatureCaptureViewModel['strokes'][number] & { type: string; stroke?: SignatureCaptureViewModel['strokes'][number] };
            update('lit', i.type, i, (s) =>
              i.type === 'strokeAdded' && i.stroke
                ? { ...s, strokes: [...s.strokes, i.stroke] }
                : { ...s, strokes: [] },
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<PhoneFieldViewModel>({
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
      channels: ['voice', 'sms', 'whatsapp'],
      availableChannels: [
        { id: 'voice', label: 'Voice' },
        { id: 'sms', label: 'SMS' },
        { id: 'whatsapp', label: 'WhatsApp' },
      ],
      verifiedBadge: { label: 'OTP verified', tone: 'success' },
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrPhoneInput
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'countryCodeChangeRequested') return { ...s, countryCode: i.countryCode };
            if (i.type === 'numberChangeRequested') return { ...s, nationalNumber: i.nationalNumber };
            if (i.type === 'extensionChangeRequested') return { ...s, extension: i.extension };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-phone-input"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; countryCode?: string; nationalNumber?: string; extension?: string };
            update('lit', i.type, i, (s) => {
              if (i.type === 'countryCodeChangeRequested' && i.countryCode) return { ...s, countryCode: i.countryCode };
              if (i.type === 'numberChangeRequested') return { ...s, nationalNumber: i.nationalNumber ?? '' };
              if (i.type === 'extensionChangeRequested') return { ...s, extension: i.extension ?? '' };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<AddressFieldViewModel>({
    selector: 'emr-address-field',
    createInitialState: () => ({
      label: 'Residential address',
      use: 'home',
      useOptions: [
        { value: 'home', label: 'Home' },
        { value: 'work', label: 'Work' },
      ],
      value: {
        line1: '14 Ansari Nagar East',
        city: 'New Delhi',
        district: 'South Delhi',
        state: 'DL',
        postalCode: '110029',
        country: 'IN',
      },
      showDistrict: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAddressField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'fieldChangeRequested'
              ? { ...s, value: { ...s.value, [i.part]: i.value } }
              : { ...s, use: i.use },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-address-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; part?: keyof AddressFieldViewModel['value']; value?: string; use?: AddressFieldViewModel['use'] };
            update('lit', i.type, i, (s) =>
              i.type === 'fieldChangeRequested' && i.part
                ? { ...s, value: { ...s.value, [i.part]: i.value ?? '' } }
                : i.use
                  ? { ...s, use: i.use }
                  : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<MacroTextFieldViewModel>({
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
        },
      ],
      hint: 'Type . or / to expand clinical macros',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrMacroTextField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'valueChangeRequested' ? { ...s, value: i.value } : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-macro-text-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; value?: string };
            update('lit', i.type, i, (s) =>
              i.type === 'valueChangeRequested' ? { ...s, value: i.value ?? '' } : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<LateralityFieldViewModel>({
    selector: 'emr-laterality-field',
    createInitialState: () => ({
      label: 'Operative eye selection',
      domain: 'ophthalmic',
      value: 'OD',
      options: [
        { code: 'OD', label: 'Right eye (OD)', shortLabel: 'OD' },
        { code: 'OS', label: 'Left eye (OS)', shortLabel: 'OS' },
        { code: 'OU', label: 'Both eyes (OU)', shortLabel: 'OU' },
      ],
      requiresConfirmation: true,
      confirmed: true,
      confirmationLabel: 'Operative eye confirmed against consent and biometry',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrLateralityField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'lateralitySelected'
              ? { ...s, value: i.code, confirmed: false }
              : { ...s, confirmed: i.confirmed },
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-laterality-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; code?: LateralityFieldViewModel['value']; confirmed?: boolean };
            update('lit', i.type, i, (s) =>
              i.type === 'lateralitySelected'
                ? { ...s, value: i.code ?? null, confirmed: false }
                : { ...s, confirmed: Boolean(i.confirmed) },
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<VisualAcuityFieldViewModel>({
    selector: 'emr-visual-acuity-field',
    createInitialState: () => ({
      label: 'Distance visual acuity',
      eye: 'OD',
      notation: 'snellen-m',
      notationOptions: [
        { value: 'snellen-m', label: 'Snellen (6m)' },
        { value: 'logmar', label: 'LogMAR' },
        { value: 'low-vision', label: 'Low vision' },
      ],
      correction: 'unaided',
      correctionOptions: [
        { value: 'unaided', label: 'Unaided' },
        { value: 'habitual', label: 'Habitual' },
        { value: 'best-corrected', label: 'BCVA' },
      ],
      value: '6/18',
      valueOptions: [
        { value: '6/6', label: '6/6' },
        { value: '6/9', label: '6/9' },
        { value: '6/12', label: '6/12' },
        { value: '6/18', label: '6/18' },
        { value: '6/24', label: '6/24' },
        { value: '6/60', label: '6/60' },
      ],
      showPinhole: true,
      pinholeValue: '6/9',
      derivedDisplay: 'LogMAR 0.48 (PH 0.18)',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrVisualAcuityField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'valueChangeRequested') return { ...s, value: i.value };
            if (i.type === 'pinholeChangeRequested') return { ...s, pinholeValue: i.value };
            if (i.type === 'notationChangeRequested') return { ...s, notation: i.notation };
            if (i.type === 'correctionChangeRequested') return { ...s, correction: i.correction };
            return { ...s, status: i.status };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-visual-acuity-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              value?: string | null;
              notation?: VisualAcuityFieldViewModel['notation'];
              correction?: VisualAcuityFieldViewModel['correction'];
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'valueChangeRequested') return { ...s, value: i.value ?? null };
              if (i.type === 'pinholeChangeRequested') return { ...s, pinholeValue: i.value ?? null };
              if (i.type === 'notationChangeRequested' && i.notation) return { ...s, notation: i.notation };
              if (i.type === 'correctionChangeRequested' && i.correction) return { ...s, correction: i.correction };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<RefractionFieldViewModel>({
    selector: 'emr-refraction-field',
    createInitialState: () => ({
      label: 'Subjective refraction (OD)',
      eye: 'OD',
      value: { sphere: -2.25, cylinder: -0.75, axis: 95, nearAdd: 2.0 },
      showNearAdd: true,
      formattedSummary: '-2.25 / -0.75 × 95°  Add +2.00 D (SE -2.63 D)',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRefractionField
        model={{ ...state, readOnly }}
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'sphereChangeRequested') return { ...s, value: { ...s.value, sphere: i.sphere } };
            if (i.type === 'cylinderChangeRequested') return { ...s, value: { ...s.value, cylinder: i.cylinder } };
            if (i.type === 'axisChangeRequested') return { ...s, value: { ...s.value, axis: i.axis } };
            if (i.type === 'nearAddChangeRequested') return { ...s, value: { ...s.value, nearAdd: i.nearAdd } };
            return { ...s, status: i.status };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-refraction-field"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as {
              type: string;
              sphere?: number | null;
              cylinder?: number | null;
              axis?: number | null;
              nearAdd?: number | null;
            };
            update('lit', i.type, i, (s) => {
              if (i.type === 'sphereChangeRequested') return { ...s, value: { ...s.value, sphere: i.sphere ?? null } };
              if (i.type === 'cylinderChangeRequested') return { ...s, value: { ...s.value, cylinder: i.cylinder ?? null } };
              if (i.type === 'axisChangeRequested') return { ...s, value: { ...s.value, axis: i.axis ?? null } };
              if (i.type === 'nearAddChangeRequested') return { ...s, value: { ...s.value, nearAdd: i.nearAdd ?? null } };
              return s;
            });
          },
        }}
      />
    ),
  }),
];
