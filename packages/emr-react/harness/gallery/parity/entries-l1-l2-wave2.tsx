'use client';

import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  type EmrAccordionItem,
  type EmrBreadcrumbItem,
  type EmrDateRangePreset,
  type EmrDateRangeValue,
  type EmrImageCropTransform,
  type EmrImageViewportState,
  type EmrMenuItem,
  type EmrTreeNode,
  type EmrUploadedImageItem,
  type ImageFieldIntent,
  type ImageFieldViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrAccordion,
  EmrBreadcrumbs,
  EmrColorPicker,
  EmrCombobox,
  EmrCopyButton,
  EmrDateRangeInput,
  EmrImageCropper,
  EmrImageField,
  EmrImageUpload,
  EmrImageViewer,
  EmrMaskedInput,
  EmrMenu,
  EmrOtpInput,
  EmrRangeSlider,
  EmrSlider,
  EmrSplitButton,
  EmrTagInput,
  EmrToggleGroup,
  EmrTreeSelect,
  EmrTreeView,
} from '../../../src';
import { LitElementHost } from './lit-element-host';
import { defineParityEntry, type ParityEntry } from './types';

const SAMPLE_FUNDUS_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260">' +
      '<rect width="360" height="260" fill="#172026"/>' +
      '<circle cx="180" cy="130" r="104" fill="#7c2d12" stroke="#f59e0b" stroke-width="3"/>' +
      '<circle cx="145" cy="126" r="18" fill="#fde68a"/>' +
      '<path d="M145 126 Q200 84 260 72 M145 126 Q205 172 265 184" stroke="#991b1b" stroke-width="4" fill="none"/>' +
      '</svg>',
  );

const OCULAR_TREE_NODES: readonly EmrTreeNode[] = [
  {
    id: 'ant-seg',
    label: 'Anterior segment',
    description: 'Slit-lamp biomicroscopy',
    children: [
      { id: 'cornea', label: 'Cornea' },
      { id: 'ac', label: 'Anterior chamber' },
      { id: 'lens', label: 'Crystalline lens / IOL' },
    ],
  },
  {
    id: 'post-seg',
    label: 'Posterior segment',
    children: [
      { id: 'disc', label: 'Optic nerve head' },
      { id: 'macula', label: 'Macula & fovea' },
    ],
  },
];

const COMM_PREF_OPTIONS = [
  { value: 'sms', label: 'SMS reminder' },
  { value: 'whatsapp', label: 'WhatsApp Rx' },
  { value: 'portal', label: 'Portal release' },
] as const;

const DATE_PRESETS: readonly EmrDateRangePreset[] = [
  { id: '7d', label: 'Last 7 days', range: { start: '2026-03-08', end: '2026-03-15' } },
  { id: '30d', label: 'Last 30 days', range: { start: '2026-02-14', end: '2026-03-15' } },
];

const CHIEF_COMPLAINT_OPTIONS = [
  { value: 'Reduced distance vision', label: 'Reduced distance vision', group: 'Vision' },
  { value: 'Metamorphopsia', label: 'Metamorphopsia', group: 'Vision' },
  { value: 'Foreign body sensation', label: 'Foreign body sensation', group: 'Surface' },
] as const;

const ENCOUNTER_MENU_ITEMS: readonly EmrMenuItem[] = [
  { id: 'print-rx', label: 'Print prescription', shortcut: '⌘P' },
  { id: 'export-fhir', label: 'Export FHIR Bundle' },
  { id: 'strike-out', label: 'Mark entered-in-error', dividerBefore: true, tone: 'danger' },
];

const SIGN_MENU_ITEMS: readonly EmrMenuItem[] = [
  { id: 'sign-lock', label: 'Sign & lock encounter' },
  { id: 'cosign', label: 'Request consultant co-sign' },
  { id: 'draft', label: 'Save unsigned draft' },
];

const POSTOP_ACCORDION_ITEMS: readonly EmrAccordionItem[] = [
  {
    id: 'drops',
    title: 'Post-operative cataract drop taper',
    subtitle: 'Weeks 1–4 topical schedule',
    badge: { label: 'Standard', tone: 'info' },
    content: 'Prednisolone acetate 1% 6x/day week 1, 4x/day week 2, 2x/day week 3, 1x/day week 4.',
  },
  {
    id: 'rsvp',
    title: 'Emergency return precautions (RSVP)',
    subtitle: 'Redness, Sensitivity, Vision drop, Pain',
    content: 'Return immediately to 24h eye casualty if pain worsens or vision drops.',
  },
];

const CLINIC_BREADCRUMBS: readonly EmrBreadcrumbItem[] = [
  { id: 'clinic', label: 'Outpatient Clinic' },
  { id: 'retina', label: 'Retina Service' },
  { id: 'patient', label: 'MRN-2026-0419' },
  { id: 'oct', label: 'Macular OCT' },
];

const INITIAL_UPLOAD_ITEMS: readonly EmrUploadedImageItem[] = [
  {
    id: 'img-fundus-od',
    name: 'fundus-od-baseline.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 18420,
    src: SAMPLE_FUNDUS_SVG,
    caption: 'OD baseline colour fundus',
  },
];

export const PARITY_ENTRIES_L1_L2_WAVE2: readonly ParityEntry[] = [
  defineParityEntry<{ values: readonly string[] }>({
    selector: 'emr-toggle-group',
    createInitialState: () => ({ values: ['sms', 'portal'] }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrToggleGroup
        controlId="parity-toggle-group-react"
        label="Communication preferences"
        multiple
        clearable
        options={COMM_PREF_OPTIONS}
        values={state.values}
        readOnly={readOnly}
        onValuesChange={(v) => update('react', 'onValuesChange', v, () => ({ values: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-toggle-group"
        props={{
          controlId: 'parity-toggle-group-lit',
          label: 'Communication preferences',
          orientation: 'horizontal',
          options: COMM_PREF_OPTIONS,
          value: state.values,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({
              values: Array.isArray(v) ? (v as readonly string[]) : [],
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ values: readonly string[]; expandedIds: readonly string[] }>({
    selector: 'emr-tree-view',
    createInitialState: () => ({
      values: ['cornea', 'macula'],
      expandedIds: ['ant-seg', 'post-seg'],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTreeView
        controlId="parity-tree-view-react"
        label="Ocular examination hierarchy"
        nodes={OCULAR_TREE_NODES}
        multiple
        searchable
        showExpandControls
        values={state.values}
        expandedIds={state.expandedIds}
        readOnly={readOnly}
        onValuesChange={(v) => update('react', 'onValuesChange', v, (prev) => ({ ...prev, values: v }))}
        onExpandedChange={(ids) =>
          update('react', 'onExpandedChange', ids, (prev) => ({ ...prev, expandedIds: ids }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tree-view"
        props={{
          controlId: 'parity-tree-view-lit',
          label: 'Ocular examination hierarchy',
          nodes: OCULAR_TREE_NODES,
          multiple: true,
          searchable: true,
          showExpandControls: true,
          selectedIds: state.values,
          expandedIds: state.expandedIds,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({
              ...prev,
              values: Array.isArray(v) ? (v as readonly string[]) : prev.values,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-tree-select',
    createInitialState: () => ({ value: 'macula' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTreeSelect
        controlId="parity-tree-select-react"
        label="Primary anatomical site"
        nodes={OCULAR_TREE_NODES}
        value={state.value}
        displayMode="path"
        clearable
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tree-select"
        props={{
          controlId: 'parity-tree-select-lit',
          label: 'Primary anatomical site',
          nodes: OCULAR_TREE_NODES,
          value: state.value,
          displayMode: 'path',
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ viewport: EmrImageViewportState }>({
    selector: 'emr-image-viewer',
    createInitialState: () => ({ viewport: { ...DEFAULT_IMAGE_VIEWPORT } }),
    renderReact: ({ state, update }) => (
      <EmrImageViewer
        controlId="parity-image-viewer-react"
        label="Fundus photograph inspector"
        src={SAMPLE_FUNDUS_SVG}
        alt="Simulated OD colour fundus"
        caption="OD posterior pole — 45° field"
        viewport={state.viewport}
        onViewportChange={(vp) => update('react', 'onViewportChange', vp, () => ({ viewport: vp }))}
      />
    ),
    renderLit: ({ state, readOnly }) => (
      <LitElementHost
        tag="emr-image-viewer"
        props={{
          controlId: 'parity-image-viewer-lit',
          label: 'Fundus photograph inspector',
          src: SAMPLE_FUNDUS_SVG,
          alt: 'Simulated OD colour fundus',
          caption: 'OD posterior pole — 45° field',
          viewport: state.viewport,
          readOnly,
        }}
      />
    ),
  }),

  defineParityEntry<{ transform: EmrImageCropTransform }>({
    selector: 'emr-image-cropper',
    createInitialState: () => ({ transform: { ...DEFAULT_IMAGE_CROP_TRANSFORM } }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageCropper
        controlId="parity-image-cropper-react"
        label="Optic disc ROI cropper"
        src={SAMPLE_FUNDUS_SVG}
        alt="Optic disc crop target"
        aspectPresets={DEFAULT_ASPECT_PRESETS}
        transform={state.transform}
        readOnly={readOnly}
        onCropChange={(tr) => update('react', 'onCropChange', tr, () => ({ transform: tr }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-cropper"
        props={{
          controlId: 'parity-image-cropper-lit',
          label: 'Optic disc ROI cropper',
          src: SAMPLE_FUNDUS_SVG,
          alt: 'Optic disc crop target',
          aspectPresets: DEFAULT_ASPECT_PRESETS,
          transform: state.transform,
          readOnly,
        }}
        events={{
          valueChange: (res) =>
            update('lit', 'valueChange', res, (prev) => ({
              transform:
                res && typeof res === 'object' && 'transform' in res
                  ? (res as { transform: EmrImageCropTransform }).transform
                  : prev.transform,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ items: readonly EmrUploadedImageItem[] }>({
    selector: 'emr-image-upload',
    createInitialState: () => ({ items: INITIAL_UPLOAD_ITEMS }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageUpload
        controlId="parity-image-upload-react"
        label="Anterior segment & fundus upload"
        items={state.items}
        allowCamera
        readOnly={readOnly}
        onItemsChange={(next) => update('react', 'onItemsChange', next, () => ({ items: next }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-upload"
        props={{
          controlId: 'parity-image-upload-lit',
          label: 'Anterior segment & fundus upload',
          items: state.items,
          allowCamera: true,
          readOnly,
        }}
        events={{
          valueChange: (next) =>
            update('lit', 'valueChange', next, (prev) => ({
              items: Array.isArray(next) ? (next as readonly EmrUploadedImageItem[]) : prev.items,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: EmrDateRangeValue | null }>({
    selector: 'emr-date-range-input',
    createInitialState: () => ({ value: { start: '2026-03-08', end: '2026-03-15' } }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDateRangeInput
        controlId="parity-date-range-react"
        label="Encounter filter window"
        value={state.value}
        presets={DATE_PRESETS}
        clearable
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-date-range-input"
        props={{
          controlId: 'parity-date-range-lit',
          label: 'Encounter filter window',
          value: state.value,
          presets: DATE_PRESETS,
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: (v as EmrDateRangeValue | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-combobox',
    createInitialState: () => ({ value: 'Gradual glare at night' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCombobox
        controlId="parity-combobox-react"
        label="Chief complaint (free-solo combobox)"
        options={CHIEF_COMPLAINT_OPTIONS}
        value={state.value}
        clearable
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-combobox"
        props={{
          controlId: 'parity-combobox-lit',
          label: 'Chief complaint (free-solo combobox)',
          options: CHIEF_COMPLAINT_OPTIONS,
          value: state.value,
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ values: readonly string[] }>({
    selector: 'emr-tag-input',
    createInitialState: () => ({ values: ['IOL-SN-88412', 'OVD-LOT-2209'] }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTagInput
        controlId="parity-tag-input-react"
        label="Specimen & implant batch labels"
        values={state.values}
        suggestions={['BSS-LOT-901', 'TRYPAN-04']}
        clearable
        readOnly={readOnly}
        onValuesChange={(v) => update('react', 'onValuesChange', v, () => ({ values: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tag-input"
        props={{
          controlId: 'parity-tag-input-lit',
          label: 'Specimen & implant batch labels',
          value: state.values,
          suggestions: ['BSS-LOT-901', 'TRYPAN-04'],
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({
              values: Array.isArray(v) ? (v as readonly string[]) : [],
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: number | null }>({
    selector: 'emr-slider',
    createInitialState: () => ({ value: 65 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSlider
        controlId="parity-slider-react"
        label="OCT overlay opacity"
        value={state.value}
        min={0}
        max={100}
        step={5}
        unit="%"
        clearable
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-slider"
        props={{
          controlId: 'parity-slider-lit',
          label: 'OCT overlay opacity',
          value: state.value,
          min: 0,
          max: 100,
          step: 5,
          unit: '%',
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: (v as number | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: readonly [number, number] }>({
    selector: 'emr-range-slider',
    createInitialState: () => ({ value: [10, 16] }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRangeSlider
        controlId="parity-range-slider-react"
        label="Target IOP therapeutic band"
        value={state.value}
        min={6}
        max={30}
        minDistance={2}
        unit="mmHg"
        readOnly={readOnly}
        onValueChange={(v) =>
          update('react', 'onValueChange', v, (prev) => ({ value: v ?? prev.value }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-range-slider"
        props={{
          controlId: 'parity-range-slider-lit',
          label: 'Target IOP therapeutic band',
          value: state.value,
          min: 6,
          max: 30,
          minDistance: 2,
          unit: 'mmHg',
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({
              value:
                Array.isArray(v) && v.length === 2
                  ? ([Number(v[0]), Number(v[1])] as const)
                  : prev.value,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-masked-input',
    createInitialState: () => ({ value: '91-2847-5510-3921' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrMaskedInput
        controlId="parity-masked-input-react"
        label="ABHA health identifier"
        mask="99-9999-9999-9999"
        value={state.value}
        clearable
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-masked-input"
        props={{
          controlId: 'parity-masked-input-lit',
          label: 'ABHA health identifier',
          mask: '99-9999-9999-9999',
          value: state.value,
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string }>({
    selector: 'emr-otp-input',
    createInitialState: () => ({ value: '482910' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrOtpInput
        controlId="parity-otp-input-react"
        label="Patient consent verification OTP"
        length={6}
        value={state.value}
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-otp-input"
        props={{
          controlId: 'parity-otp-input-lit',
          label: 'Patient consent verification OTP',
          length: 6,
          value: state.value,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: typeof v === 'string' ? v : '' })),
        }}
      />
    ),
  }),

  defineParityEntry<{ lastAction: string }>({
    selector: 'emr-menu',
    createInitialState: () => ({ lastAction: 'none' }),
    renderReact: ({ readOnly, update }) => (
      <EmrMenu
        controlId="parity-menu-react"
        triggerLabel="Encounter actions"
        items={ENCOUNTER_MENU_ITEMS}
        disabled={readOnly}
        onSelect={(id) => update('react', 'onSelect', id, () => ({ lastAction: id }))}
      />
    ),
    renderLit: ({ readOnly, update }) => (
      <LitElementHost
        tag="emr-menu"
        props={{
          controlId: 'parity-menu-lit',
          triggerLabel: 'Encounter actions',
          items: ENCOUNTER_MENU_ITEMS,
          disabled: readOnly,
        }}
        events={{
          valueChange: (id) =>
            update('lit', 'valueChange', id, () => ({ lastAction: String(id ?? '') })),
        }}
      />
    ),
  }),

  defineParityEntry<{ lastCommit: string }>({
    selector: 'emr-split-button',
    createInitialState: () => ({ lastCommit: 'none' }),
    renderReact: ({ readOnly, update }) => (
      <EmrSplitButton
        controlId="parity-split-button-react"
        label="Sign encounter"
        items={SIGN_MENU_ITEMS}
        disabled={readOnly}
        onPress={() => update('react', 'onPress', 'sign-primary', () => ({ lastCommit: 'sign-primary' }))}
        onSelect={(id) => update('react', 'onSelect', id, () => ({ lastCommit: id }))}
      />
    ),
    renderLit: ({ readOnly, update }) => (
      <LitElementHost
        tag="emr-split-button"
        props={{
          controlId: 'parity-split-button-lit',
          label: 'Sign encounter',
          items: SIGN_MENU_ITEMS,
          disabled: readOnly,
        }}
        events={{
          valueChange: (id) =>
            update('lit', 'valueChange', id, () => ({ lastCommit: String(id ?? '') })),
        }}
      />
    ),
  }),

  defineParityEntry<{ expandedIds: readonly string[] }>({
    selector: 'emr-accordion',
    createInitialState: () => ({ expandedIds: ['drops'] }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAccordion
        controlId="parity-accordion-react"
        items={POSTOP_ACCORDION_ITEMS}
        expandedIds={state.expandedIds}
        multiple
        disabled={readOnly}
        onExpandedChange={(ids) => update('react', 'onExpandedChange', ids, () => ({ expandedIds: ids }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-accordion"
        props={{
          controlId: 'parity-accordion-lit',
          items: POSTOP_ACCORDION_ITEMS,
          expandedIds: state.expandedIds,
          multiple: true,
          readOnly,
        }}
        events={{
          valueChange: (ids) =>
            update('lit', 'valueChange', ids, (prev) => ({
              expandedIds: Array.isArray(ids) ? (ids as readonly string[]) : prev.expandedIds,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{ activeCrumb: string }>({
    selector: 'emr-breadcrumbs',
    createInitialState: () => ({ activeCrumb: 'oct' }),
    renderReact: ({ update }) => (
      <EmrBreadcrumbs
        controlId="parity-breadcrumbs-react"
        items={CLINIC_BREADCRUMBS}
        onNavigate={(id) => update('react', 'onNavigate', id, () => ({ activeCrumb: id }))}
      />
    ),
    renderLit: () => (
      <LitElementHost
        tag="emr-breadcrumbs"
        props={{
          controlId: 'parity-breadcrumbs-lit',
          items: CLINIC_BREADCRUMBS,
        }}
      />
    ),
  }),

  defineParityEntry<{ value: string | null }>({
    selector: 'emr-color-picker',
    createInitialState: () => ({ value: '#dc2626' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrColorPicker
        controlId="parity-color-picker-react"
        label="Retinal annotation pen colour"
        swatches={DEFAULT_CLINICAL_COLOR_SWATCHES}
        value={state.value}
        allowCustomHex
        clearable
        readOnly={readOnly}
        onValueChange={(v) => update('react', 'onValueChange', v, () => ({ value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-color-picker"
        props={{
          controlId: 'parity-color-picker-lit',
          label: 'Retinal annotation pen colour',
          swatches: DEFAULT_CLINICAL_COLOR_SWATCHES,
          value: state.value,
          allowCustomHex: true,
          clearable: true,
          readOnly,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, () => ({ value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{ copiedCount: number }>({
    selector: 'emr-copy-button',
    createInitialState: () => ({ copiedCount: 0 }),
    renderReact: ({ readOnly, update }) => (
      <EmrCopyButton
        controlId="parity-copy-button-react"
        value="MRN-2026-0419"
        label="Copy MRN"
        disabled={readOnly}
        onCopied={(val) => update('react', 'onCopied', val, (prev) => ({ copiedCount: prev.copiedCount + 1 }))}
      />
    ),
    renderLit: ({ readOnly }) => (
      <LitElementHost
        tag="emr-copy-button"
        props={{
          controlId: 'parity-copy-button-lit',
          value: 'MRN-2026-0419',
          label: 'Copy MRN',
          disabled: readOnly,
        }}
      />
    ),
  }),

  // ── L2 Clinical Image Field ───────────────────────────────────────────────
  defineParityEntry<ImageFieldViewModel>({
    selector: 'emr-image-field',
    createInitialState: () => ({
      fieldId: 'parity-slit-lamp-photos',
      label: 'Slit-lamp & fundus photographs',
      hint: 'Upload, inspect fullscreen (pan/zoom/rotate), or crop clinical photos.',
      items: INITIAL_UPLOAD_ITEMS,
      allowCamera: true,
      multiple: true,
      statusOptions: [
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Media haze / unable', tone: 'warning' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageField
        controlId="parity-image-field-react"
        model={{ ...state, readOnly }}
        onIntent={(intent: ImageFieldIntent) =>
          update('react', 'onIntent', intent, (prev) => reduceImageFieldDemo(prev, intent))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-field"
        props={{
          controlId: 'parity-image-field-lit',
          model: { ...state, readOnly },
        }}
        events={{
          intent: (raw) => {
            const intent = raw as ImageFieldIntent;
            update('lit', 'intent', intent, (prev) => reduceImageFieldDemo(prev, intent));
          },
        }}
      />
    ),
  }),
];

function reduceImageFieldDemo(
  prev: ImageFieldViewModel,
  intent: ImageFieldIntent,
): ImageFieldViewModel {
  switch (intent.type) {
    case 'itemsChangeRequested':
      return { ...prev, items: intent.items };
    case 'itemRemoveRequested':
      return { ...prev, items: prev.items.filter((item) => item.id !== intent.id) };
    case 'captionChangeRequested':
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === intent.id ? { ...item, caption: intent.caption } : item,
        ),
      };
    case 'statusChangeRequested':
      return { ...prev, status: intent.status };
    default:
      return prev;
  }
}
