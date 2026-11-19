'use client';

import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  type EmrAccordionItem,
  type EmrBreadcrumbItem,
  type EmrControlVariant,
  type EmrDateRangePreset,
  type EmrDateRangeValue,
  type EmrImageCropResult,
  type EmrImageCropTransform,
  type EmrImageItem,
  type EmrImageViewportState,
  type EmrMenuItem,
  type EmrOption,
  type EmrSliderMark,
  type EmrToggleGroupLabelPlacement,
  type EmrToggleGroupOrientation,
  type EmrToggleGroupSize,
  type EmrToggleGroupVariant,
  type EmrTone,
  type EmrTreeCheckStrategy,
  type EmrTreeNode,
  type EmrUploadedImageItem,
  type FieldFrameLayout,
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
    icon: 'eye',
    children: [
      { id: 'cornea', label: 'Cornea', code: 'H18', badge: { label: 'Primary', tone: 'info' }, tone: 'info', keywords: ['epithelium', 'stroma'] },
      { id: 'ac', label: 'Anterior chamber', code: 'H20', readOnly: true, badge: 'Locked', tone: 'warning' },
      { id: 'lens', label: 'Crystalline lens / IOL', code: 'H25' },
    ],
  },
  {
    id: 'post-seg',
    label: 'Posterior segment',
    icon: 'eye',
    children: [
      { id: 'disc', label: 'Optic nerve head', code: 'H40', badge: { label: 'Glaucoma', tone: 'danger' }, tone: 'danger' },
      { id: 'macula', label: 'Macula & fovea', code: 'H35', keywords: ['oct', 'retina'] },
      { id: 'vitreous', label: 'Vitreous (archived)', code: 'H43', disabled: true },
    ],
  },
];

const COMM_PREF_OPTIONS: readonly EmrOption[] = [
  { value: 'sms', label: 'SMS appointment reminders', group: 'Patient Channels', icon: 'phone', badge: { label: 'Verified', tone: 'success' }, tone: 'success', readOnly: true },
  { value: 'whatsapp', label: 'WhatsApp Rx & instructions', group: 'Patient Channels', description: 'Encrypted clinic dispatch', badge: { label: 'Preferred', tone: 'info' } },
  { value: 'portal', label: 'Portal lab & OCT release', group: 'Clinical Sync', description: 'Auto-publish signed diagnostic reports' },
  { value: 'legacy', label: 'Fax summary', group: 'Clinical Sync', disabled: true, description: 'Legacy gateway offline' },
  { value: 'none', label: 'Opt out of non-urgent alerts', tone: 'warning' },
];

const DATE_PRESETS: readonly EmrDateRangePreset[] = [
  { id: '7d', label: 'Last 7 days', range: { start: '2026-03-08', end: '2026-03-15' } },
  { id: '30d', label: 'Last 30 days', range: { start: '2026-02-14', end: '2026-03-15' } },
];

const CHIEF_COMPLAINT_OPTIONS = [
  {
    value: 'Reduced distance vision',
    label: 'Reduced distance vision',
    code: 'H53.8',
    description: 'Progressive blur at 6 m Snellen chart',
    group: 'Vision',
    badge: { label: 'Common', tone: 'info' as const },
  },
  {
    value: 'Metamorphopsia',
    label: 'Metamorphopsia',
    code: 'H53.15',
    description: 'Wavy or distorted central grid lines (Amsler)',
    group: 'Vision',
    badge: { label: 'Urgent', tone: 'warning' as const },
  },
  {
    value: 'Foreign body sensation',
    label: 'Foreign body sensation',
    code: 'H57.89',
    description: 'Gritty ocular surface discomfort',
    group: 'Surface',
    tone: 'neutral' as const,
  },
  {
    value: 'Sudden vision loss',
    label: 'Sudden painless vision loss',
    code: 'H53.13',
    description: 'Acute monocular visual loss — triage STAT',
    group: 'Vision',
    badge: { label: 'STAT', tone: 'danger' as const },
    readOnly: true,
  },
  {
    value: 'Deprecated symptom',
    label: 'Unspecified visual disturbance (archived)',
    code: 'H53.9',
    group: 'Archive',
    disabled: true,
  },
] as const;

const ENCOUNTER_MENU_ITEMS: readonly EmrMenuItem[] = [
  { id: 'print-rx', label: 'Print prescription', shortcut: '⌘P' },
  { id: 'export-fhir', label: 'Export FHIR Bundle' },
  { id: 'strike-out', label: 'Mark entered-in-error', dividerBefore: true, tone: 'danger' },
];

const SLIDER_MARKS: readonly EmrSliderMark[] = [
  { value: 0, label: '0%' },
  { value: 50, label: '50%' },
  { value: 100, label: '100%' },
];

const RANGE_SLIDER_MARKS: readonly EmrSliderMark[] = [
  { value: 6, label: '6' },
  { value: 16, label: '16' },
  { value: 22, label: '22' },
  { value: 30, label: '30' },
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

const VIEWER_GALLERY_ITEMS: readonly EmrImageItem[] = [
  {
    id: 'fundus-od',
    src: SAMPLE_FUNDUS_SVG,
    alt: 'Simulated OD colour fundus',
    caption: 'OD posterior pole — 45° field',
  },
  {
    id: 'fundus-os',
    src: SAMPLE_FUNDUS_SVG,
    alt: 'Simulated OS colour fundus',
    caption: 'OS optic disc — baseline',
  },
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
  defineParityEntry<{
    values: readonly string[];
    multiple: boolean;
    allowEmpty: boolean;
    variant: EmrToggleGroupVariant;
    size: EmrToggleGroupSize;
    orientation: EmrToggleGroupOrientation;
    labelPlacement: EmrToggleGroupLabelPlacement;
    showStateLabels: boolean;
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
    selector: 'emr-toggle-group',
    createInitialState: () => ({
      values: ['sms', 'portal'],
      multiple: true,
      allowEmpty: true,
      variant: 'tile',
      size: 'md',
      orientation: 'vertical',
      labelPlacement: 'space-between',
      showStateLabels: false,
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
      <EmrToggleGroup
        controlId="parity-toggle-group-react"
        label="Communication preferences"
        options={COMM_PREF_OPTIONS}
        exclusiveValues={['none']}
        values={state.values}
        multiple={state.multiple}
        allowEmpty={state.allowEmpty}
        variant={state.variant}
        size={state.size}
        orientation={state.orientation}
        labelPlacement={state.labelPlacement}
        showStateLabels={state.showStateLabels}
        showSelectAll={state.showSelectAll}
        showSelectionCount={state.showSelectionCount}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValuesChange={(v) => update('react', 'onValuesChange', v, (prev) => ({ ...prev, values: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => prev)}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-toggle-group"
        props={{
          controlId: 'parity-toggle-group-lit',
          label: 'Communication preferences',
          options: COMM_PREF_OPTIONS,
          exclusiveValues: ['none'],
          values: state.values,
          value: state.values,
          multiple: state.multiple,
          allowEmpty: state.allowEmpty,
          variant: state.variant,
          size: state.size,
          orientation: state.orientation,
          labelPlacement: state.labelPlacement,
          showStateLabels: state.showStateLabels,
          showSelectAll: state.showSelectAll,
          showSelectionCount: state.showSelectionCount,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valuesChange: (v) =>
            update('lit', 'valuesChange', v, (prev) => ({
              ...prev,
              values: Array.isArray(v) ? (v as readonly string[]) : [],
            })),
          cleared: () => update('lit', 'cleared', null, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    values: readonly string[];
    expandedIds: readonly string[];
    multiple: boolean;
    checkStrategy: EmrTreeCheckStrategy;
    size: 'md' | 'sm';
    searchable: boolean;
    showExpandControls: boolean;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-tree-view',
    createInitialState: () => ({
      value: 'macula',
      values: ['cornea', 'ac'],
      expandedIds: ['ant-seg', 'post-seg'],
      multiple: true,
      checkStrategy: 'cascade',
      size: 'md',
      searchable: true,
      showExpandControls: true,
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
      <EmrTreeView
        controlId="parity-tree-view-react"
        label="Ocular examination hierarchy"
        nodes={OCULAR_TREE_NODES}
        multiple={state.multiple}
        checkStrategy={state.checkStrategy}
        size={state.size}
        searchable={state.searchable}
        showExpandControls={state.showExpandControls}
        clearable={state.clearable}
        value={state.value}
        values={state.values}
        expandedIds={state.expandedIds}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onValuesChange={(v) => update('react', 'onValuesChange', v, (prev) => ({ ...prev, values: v }))}
        onExpandedChange={(ids) =>
          update('react', 'onExpandedChange', ids, (prev) => ({ ...prev, expandedIds: ids }))
        }
        onCleared={() => update('react', 'onCleared', null, (prev) => prev)}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tree-view"
        props={{
          controlId: 'parity-tree-view-lit',
          label: 'Ocular examination hierarchy',
          nodes: OCULAR_TREE_NODES,
          multiple: state.multiple,
          checkStrategy: state.checkStrategy,
          size: state.size,
          searchable: state.searchable,
          showExpandControls: state.showExpandControls,
          clearable: state.clearable,
          selectedIds: state.multiple ? state.values : state.value ? [state.value] : [],
          values: state.values,
          expandedIds: state.expandedIds,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valuesChange: (v) =>
            update('lit', 'valuesChange', v, (prev) => ({
              ...prev,
              values: Array.isArray(v) ? (v as readonly string[]) : prev.values,
              value: !prev.multiple ? ((v as readonly string[])?.[0] ?? null) : prev.value,
            })),
          expandedIdsChange: (ids) =>
            update('lit', 'expandedIdsChange', ids, (prev) => ({
              ...prev,
              expandedIds: Array.isArray(ids) ? (ids as readonly string[]) : prev.expandedIds,
            })),
          cleared: () => update('lit', 'cleared', null, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    values: readonly string[];
    multiple: boolean;
    checkStrategy: EmrTreeCheckStrategy;
    displayMode: 'path' | 'leaf';
    variant: 'outline' | 'filled' | 'subtle';
    size: 'md' | 'sm';
    searchable: boolean;
    showExpandControls: boolean;
    clearable: boolean;
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
    selector: 'emr-tree-select',
    createInitialState: () => ({
      value: 'macula',
      values: ['cornea', 'ac'],
      multiple: false,
      checkStrategy: 'cascade',
      displayMode: 'path',
      variant: 'outline',
      size: 'md',
      searchable: true,
      showExpandControls: false,
      clearable: true,
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
    renderReact: ({ state, readOnly, update }) => (
      <EmrTreeSelect
        controlId="parity-tree-select-react"
        label="Primary anatomical site"
        nodes={OCULAR_TREE_NODES}
        value={state.value}
        values={state.values}
        multiple={state.multiple}
        checkStrategy={state.checkStrategy}
        displayMode={state.displayMode}
        variant={state.variant}
        size={state.size}
        searchable={state.searchable}
        showExpandControls={state.showExpandControls}
        clearable={state.clearable}
        maxTagCount={state.maxTagCount}
        loading={state.loading}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onValuesChange={(v) => update('react', 'onValuesChange', v, (prev) => ({ ...prev, values: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => prev)}
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
          values: state.values,
          selectedIds: state.values,
          multiple: state.multiple,
          checkStrategy: state.checkStrategy,
          displayMode: state.displayMode,
          variant: state.variant,
          size: state.size,
          searchable: state.searchable,
          showExpandControls: state.showExpandControls,
          clearable: state.clearable,
          maxTagCount: state.maxTagCount,
          loading: state.loading,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) =>
              Array.isArray(v)
                ? { ...prev, values: v as readonly string[] }
                : { ...prev, value: (v as string | null) ?? null },
            ),
          valuesChange: (v) =>
            update('lit', 'valuesChange', v, (prev) => ({
              ...prev,
              values: Array.isArray(v) ? (v as readonly string[]) : prev.values,
            })),
          cleared: () => update('lit', 'cleared', null, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    viewport: EmrImageViewportState;
    activeIndex: number;
    multiImage: boolean;
    showThumbnails: boolean;
    allowFullscreen: boolean;
    height: number;
    labelHidden: boolean;
    readOnly: boolean;
    disabled: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-image-viewer',
    createInitialState: () => ({
      viewport: { ...DEFAULT_IMAGE_VIEWPORT },
      activeIndex: 0,
      multiImage: false,
      showThumbnails: true,
      allowFullscreen: true,
      height: 300,
      labelHidden: false,
      readOnly: false,
      disabled: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageViewer
        controlId="parity-image-viewer-react"
        label="Fundus photograph inspector"
        src={SAMPLE_FUNDUS_SVG}
        alt="Simulated OD colour fundus"
        caption="OD posterior pole — 45° field"
        images={state.multiImage ? VIEWER_GALLERY_ITEMS : undefined}
        activeIndex={state.activeIndex}
        viewport={state.viewport}
        showThumbnails={state.showThumbnails}
        allowFullscreen={state.allowFullscreen}
        height={state.height}
        labelHidden={state.labelHidden}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        warning={state.warning}
        error={state.error}
        onViewportChange={(vp) =>
          update('react', 'onViewportChange', vp, (prev) => ({ ...prev, viewport: vp }))
        }
        onActiveIndexChange={(idx) =>
          update('react', 'onActiveIndexChange', idx, (prev) => ({
            ...prev,
            activeIndex: idx,
            viewport: { ...DEFAULT_IMAGE_VIEWPORT },
          }))
        }
        onFullscreenChange={(fs) =>
          update('react', 'onFullscreenChange', fs, (prev) => prev)
        }
        onCloseRequested={() =>
          update('react', 'onCloseRequested', null, (prev) => prev)
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-viewer"
        props={{
          controlId: 'parity-image-viewer-lit',
          label: 'Fundus photograph inspector',
          src: SAMPLE_FUNDUS_SVG,
          alt: 'Simulated OD colour fundus',
          caption: 'OD posterior pole — 45° field',
          images: state.multiImage ? VIEWER_GALLERY_ITEMS : [],
          activeIndex: state.activeIndex,
          viewport: state.viewport,
          showThumbnails: state.showThumbnails,
          allowFullscreen: state.allowFullscreen,
          height: state.height,
          labelHidden: state.labelHidden,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          viewportChange: (vp) =>
            update('lit', 'viewportChange', vp, (prev) => ({
              ...prev,
              viewport: (vp as EmrImageViewportState) ?? prev.viewport,
            })),
          activeIndexChange: (idx) =>
            update('lit', 'activeIndexChange', idx, (prev) => ({
              ...prev,
              activeIndex: typeof idx === 'number' ? idx : prev.activeIndex,
              viewport: { ...DEFAULT_IMAGE_VIEWPORT },
            })),
          fullscreenChange: (fs) =>
            update('lit', 'fullscreenChange', fs, (prev) => prev),
          closeRequested: () =>
            update('lit', 'closeRequested', null, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    transform: EmrImageCropTransform;
    outputMimeType: string;
    labelHidden: boolean;
    readOnly: boolean;
    disabled: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-image-cropper',
    createInitialState: () => ({
      transform: { ...DEFAULT_IMAGE_CROP_TRANSFORM },
      outputMimeType: 'image/png',
      labelHidden: false,
      readOnly: false,
      disabled: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageCropper
        controlId="parity-image-cropper-react"
        label="Optic disc ROI cropper"
        src={SAMPLE_FUNDUS_SVG}
        alt="Optic disc crop target"
        aspectPresets={DEFAULT_ASPECT_PRESETS}
        transform={state.transform}
        outputMimeType={state.outputMimeType}
        labelHidden={state.labelHidden}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        warning={state.warning}
        error={state.error}
        onCropChange={(tr) =>
          update('react', 'onCropChange', tr, (prev) => ({ ...prev, transform: tr }))
        }
        onCropCommitted={(res) =>
          update('react', 'onCropCommitted', res, (prev) => ({
            ...prev,
            transform: res.transform,
          }))
        }
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
          outputMimeType: state.outputMimeType,
          labelHidden: state.labelHidden,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          cropChange: (tr) =>
            update('lit', 'cropChange', tr, (prev) => ({
              ...prev,
              transform: (tr as EmrImageCropTransform) ?? prev.transform,
            })),
          cropCommitted: (res) =>
            update('lit', 'cropCommitted', res, (prev) => ({
              ...prev,
              transform:
                res && typeof res === 'object' && 'transform' in res
                  ? (res as { transform: EmrImageCropTransform }).transform
                  : prev.transform,
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    items: readonly EmrUploadedImageItem[];
    multiple: boolean;
    allowCamera: boolean;
    maxFiles: number;
    maxSizeBytes: number;
    cropOutputMimeType: string;
    labelHidden: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-image-upload',
    createInitialState: () => ({
      items: INITIAL_UPLOAD_ITEMS,
      multiple: true,
      allowCamera: true,
      maxFiles: 4,
      maxSizeBytes: 5 * 1024 * 1024,
      cropOutputMimeType: 'image/png',
      labelHidden: false,
      required: false,
      readOnly: false,
      disabled: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageUpload
        controlId="parity-image-upload-react"
        label="Anterior segment & fundus upload"
        items={state.items}
        multiple={state.multiple}
        allowCamera={state.allowCamera}
        maxFiles={state.maxFiles}
        maxSizeBytes={state.maxSizeBytes}
        cropOutputMimeType={state.cropOutputMimeType}
        labelHidden={state.labelHidden}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        warning={state.warning}
        error={state.error}
        onItemsChange={(next) =>
          update('react', 'onItemsChange', next, (prev) => ({ ...prev, items: next }))
        }
        onFilesSelected={(files) =>
          update('react', 'onFilesSelected', files, (prev) => prev)
        }
        onImageCropped={(id, result) =>
          update('react', 'onImageCropped', { id, result }, (prev) => prev)
        }
        onCaptionChange={(id, caption) =>
          update('react', 'onCaptionChange', { id, caption }, (prev) => prev)
        }
        onRemoveRequested={(id) =>
          update('react', 'onRemoveRequested', id, (prev) => prev)
        }
        onCameraRequested={() =>
          update('react', 'onCameraRequested', 'camera', (prev) => prev)
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-upload"
        props={{
          controlId: 'parity-image-upload-lit',
          label: 'Anterior segment & fundus upload',
          items: state.items,
          multiple: state.multiple,
          allowCamera: state.allowCamera,
          maxFiles: state.maxFiles,
          maxSizeBytes: state.maxSizeBytes,
          cropOutputMimeType: state.cropOutputMimeType,
          labelHidden: state.labelHidden,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          itemsChange: (next) =>
            update('lit', 'itemsChange', next, (prev) => ({
              ...prev,
              items: Array.isArray(next) ? (next as readonly EmrUploadedImageItem[]) : prev.items,
            })),
          filesSelected: (files) =>
            update('lit', 'filesSelected', files, (prev) => prev),
          imageCropped: (payload) =>
            update('lit', 'imageCropped', payload, (prev) => prev),
          captionChange: (payload) =>
            update('lit', 'captionChange', payload, (prev) => prev),
          removeRequested: (id) =>
            update('lit', 'removeRequested', id, (prev) => prev),
          captureRequested: (mode) =>
            update('lit', 'captureRequested', mode, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: EmrDateRangeValue | null;
    mode: 'date' | 'datetime';
    size: 'sm' | 'md' | 'lg';
    variant: EmrControlVariant;
    weekStartsOn: 0 | 1;
    showCalendar: boolean;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-date-range-input',
    createInitialState: () => ({
      value: { start: '2026-03-08', end: '2026-03-15' },
      mode: 'date',
      size: 'md',
      variant: 'outline',
      weekStartsOn: 0,
      showCalendar: true,
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
      <EmrDateRangeInput
        controlId="parity-date-range-react"
        label="Encounter filter window"
        value={state.value}
        mode={state.mode}
        size={state.size}
        variant={state.variant}
        weekStartsOn={state.weekStartsOn}
        presets={DATE_PRESETS}
        showCalendar={state.showCalendar}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: null }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-date-range-input"
        props={{
          controlId: 'parity-date-range-lit',
          label: 'Encounter filter window',
          value: state.value,
          mode: state.mode,
          size: state.size,
          variant: state.variant,
          weekStartsOn: state.weekStartsOn,
          presets: DATE_PRESETS,
          showCalendar: state.showCalendar,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as EmrDateRangeValue | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    variant: 'outline' | 'filled' | 'subtle';
    size: 'md' | 'sm';
    filterMode: 'local' | 'remote' | 'none';
    allowCustomValue: boolean;
    highlightMatch: boolean;
    clearable: boolean;
    loading: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-combobox',
    createInitialState: () => ({
      value: 'Gradual glare at night',
      variant: 'outline',
      size: 'md',
      filterMode: 'local',
      allowCustomValue: true,
      highlightMatch: true,
      clearable: true,
      loading: false,
      required: false,
      readOnly: false,
      disabled: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCombobox
        controlId="parity-combobox-react"
        label="Chief complaint (free-solo combobox)"
        labelHidden={state.labelHidden}
        options={CHIEF_COMPLAINT_OPTIONS}
        value={state.value}
        variant={state.variant}
        size={state.size}
        filterMode={state.filterMode}
        allowCustomValue={state.allowCustomValue}
        highlightMatch={state.highlightMatch}
        clearable={state.clearable}
        loading={state.loading}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        warning={state.warning || undefined}
        error={state.error || undefined}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-combobox"
        props={{
          controlId: 'parity-combobox-lit',
          label: 'Chief complaint (free-solo combobox)',
          labelHidden: state.labelHidden,
          options: CHIEF_COMPLAINT_OPTIONS,
          value: state.value,
          variant: state.variant,
          size: state.size,
          filterMode: state.filterMode,
          allowCustomValue: state.allowCustomValue,
          highlightMatch: state.highlightMatch,
          clearable: state.clearable,
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
            update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as string | null) ?? null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    values: readonly string[];
    lockedTags: readonly string[];
    maxTags: number;
    maxTagLength: number;
    chipTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    variant: 'outline' | 'filled' | 'subtle';
    size: 'md' | 'sm';
    clearable: boolean;
    allowDuplicates: boolean;
    filterSuggestions: boolean;
    highlightMatch: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-tag-input',
    createInitialState: () => ({
      values: ['Penicillin', 'Latex'],
      lockedTags: ['Penicillin'],
      maxTags: 6,
      maxTagLength: 24,
      chipTone: 'neutral',
      variant: 'outline',
      size: 'md',
      clearable: true,
      allowDuplicates: false,
      filterSuggestions: true,
      highlightMatch: true,
      disabled: false,
      readOnly: false,
      required: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTagInput
        controlId="parity-tag-input-react"
        label="Allergies & Clinical Alerts"
        placeholder="Add allergen or press Enter…"
        tags={state.values}
        lockedTags={state.lockedTags}
        maxTags={state.maxTags}
        maxTagLength={state.maxTagLength}
        chipTone={state.chipTone}
        variant={state.variant}
        size={state.size}
        clearable={state.clearable}
        allowDuplicates={state.allowDuplicates}
        filterSuggestions={state.filterSuggestions}
        highlightMatch={state.highlightMatch}
        disabled={state.disabled}
        required={state.required}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        suggestions={[
          'Sulfa',
          'NSAIDs',
          'Aspirin',
          'Contrast Dye',
          'Atropine',
          'Tropicamide',
          'Fluorescein',
          'Lidocaine',
        ]}
        readOnly={readOnly || state.readOnly}
        onTagsChange={(v) => update('react', 'onTagsChange', v, (prev) => ({ ...prev, values: v }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-tag-input"
        props={{
          controlId: 'parity-tag-input-lit',
          label: 'Allergies & Clinical Alerts',
          placeholder: 'Add allergen or press Enter…',
          tags: state.values,
          lockedTags: state.lockedTags,
          maxTags: state.maxTags,
          maxTagLength: state.maxTagLength,
          chipTone: state.chipTone,
          variant: state.variant,
          size: state.size,
          clearable: state.clearable,
          allowDuplicates: state.allowDuplicates,
          filterSuggestions: state.filterSuggestions,
          highlightMatch: state.highlightMatch,
          disabled: state.disabled,
          required: state.required,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
          suggestions: [
            'Sulfa',
            'NSAIDs',
            'Aspirin',
            'Contrast Dye',
            'Atropine',
            'Tropicamide',
            'Fluorescein',
            'Lidocaine',
          ],
          readOnly: readOnly || state.readOnly,
        }}
        events={{
          tagsChange: (v) =>
            update('lit', 'tagsChange', v, (prev) => ({
              ...prev,
              values: Array.isArray(v) ? (v as readonly string[]) : [],
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: number | null;
    size: 'sm' | 'md' | 'lg';
    tone: EmrTone | 'neutral';
    showValue: boolean;
    showSteppers: boolean;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-slider',
    createInitialState: () => ({
      value: 65,
      size: 'md',
      tone: 'neutral',
      showValue: true,
      showSteppers: false,
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
      <EmrSlider
        controlId="parity-slider-react"
        label="OCT overlay opacity"
        value={state.value}
        min={0}
        max={100}
        step={5}
        unit="%"
        marks={SLIDER_MARKS}
        size={state.size}
        tone={state.tone}
        showValue={state.showValue}
        showSteppers={state.showSteppers}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCommitted={(v) => update('react', 'onCommitted', v, (prev) => ({ ...prev, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: null }))}
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
          marks: SLIDER_MARKS,
          size: state.size,
          tone: state.tone,
          showValue: state.showValue,
          showSteppers: state.showSteppers,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as number | null) ?? null })),
          committed: (v) =>
            update('lit', 'committed', v, (prev) => ({ ...prev, value: (v as number | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: readonly [number, number] | null;
    size: 'sm' | 'md' | 'lg';
    tone: EmrTone | 'neutral';
    showValue: boolean;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-range-slider',
    createInitialState: () => ({
      value: [10, 16],
      size: 'md',
      tone: 'neutral',
      showValue: true,
      clearable: false,
      required: false,
      readOnly: false,
      disabled: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrRangeSlider
        controlId="parity-range-slider-react"
        label="Target IOP therapeutic band"
        value={state.value}
        min={6}
        max={30}
        minDistance={2}
        unit="mmHg"
        marks={RANGE_SLIDER_MARKS}
        size={state.size}
        tone={state.tone}
        showValue={state.showValue}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCommitted={(v) => update('react', 'onCommitted', v, (prev) => ({ ...prev, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: null }))}
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
          marks: RANGE_SLIDER_MARKS,
          size: state.size,
          tone: state.tone,
          showValue: state.showValue,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({
              ...prev,
              value:
                v === null
                  ? null
                  : Array.isArray(v) && v.length === 2
                    ? ([Number(v[0]), Number(v[1])] as const)
                    : prev.value,
            })),
          committed: (v) =>
            update('lit', 'committed', v, (prev) => ({
              ...prev,
              value:
                v === null
                  ? null
                  : Array.isArray(v) && v.length === 2
                    ? ([Number(v[0]), Number(v[1])] as const)
                    : prev.value,
            })),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    size: 'sm' | 'md' | 'lg';
    variant: EmrControlVariant;
    unmask: boolean;
    showMaskHint: boolean;
    uppercase: boolean;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-masked-input',
    createInitialState: () => ({
      value: '91-2847-5510-3921',
      size: 'md',
      variant: 'outline',
      unmask: false,
      showMaskHint: false,
      uppercase: false,
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
      <EmrMaskedInput
        controlId="parity-masked-input-react"
        label="ABHA health identifier"
        mask="99-9999-9999-9999"
        value={state.value}
        size={state.size}
        variant={state.variant}
        unmask={state.unmask}
        showMaskHint={state.showMaskHint}
        uppercase={state.uppercase}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCompleted={(v) => update('react', 'onCompleted', v, (prev) => prev)}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: null }))}
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
          size: state.size,
          variant: state.variant,
          unmask: state.unmask,
          showMaskHint: state.showMaskHint,
          uppercase: state.uppercase,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as string | null) ?? null })),
          completed: (v) => update('lit', 'completed', v, (prev) => prev),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string;
    secret: boolean;
    numericOnly: boolean;
    uppercase: boolean;
    separatorAfter: number;
    size: 'sm' | 'md' | 'lg';
    variant: EmrControlVariant;
    clearable: boolean;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-otp-input',
    createInitialState: () => ({
      value: '482910',
      secret: false,
      numericOnly: true,
      uppercase: false,
      separatorAfter: 3,
      size: 'md',
      variant: 'outline',
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
      <EmrOtpInput
        controlId="parity-otp-input-react"
        label="Patient consent verification OTP"
        length={6}
        value={state.value}
        secret={state.secret}
        numericOnly={state.numericOnly}
        uppercase={state.uppercase}
        separatorAfter={state.separatorAfter > 0 ? state.separatorAfter : undefined}
        size={state.size}
        variant={state.variant}
        clearable={state.clearable}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCompleted={(v) => update('react', 'onCompleted', v, (prev) => prev)}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: '' }))}
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
          secret: state.secret,
          numericOnly: state.numericOnly,
          uppercase: state.uppercase,
          separatorAfter: state.separatorAfter > 0 ? state.separatorAfter : undefined,
          size: state.size,
          variant: state.variant,
          clearable: state.clearable,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({ ...prev, value: typeof v === 'string' ? v : '' })),
          completed: (v) => update('lit', 'completed', v, (prev) => prev),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: '' })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    variant: 'outline' | 'primary' | 'secondary' | 'ghost';
    size: 'md' | 'sm';
    align: 'start' | 'end';
    readOnly: boolean;
    disabled: boolean;
    lastAction: string;
  }>({
    selector: 'emr-menu',
    createInitialState: () => ({
      variant: 'outline',
      size: 'md',
      align: 'start',
      readOnly: false,
      disabled: false,
      lastAction: 'none',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrMenu
        controlId="parity-menu-react"
        label="Encounter actions"
        triggerIcon="more-vertical"
        items={ENCOUNTER_MENU_ITEMS}
        variant={state.variant}
        size={state.size}
        align={state.align}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        onItemSelected={(item) =>
          update('react', 'onItemSelected', item, (prev) => ({ ...prev, lastAction: item.id }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-menu"
        props={{
          controlId: 'parity-menu-lit',
          label: 'Encounter actions',
          triggerIcon: 'more-vertical',
          items: ENCOUNTER_MENU_ITEMS,
          variant: state.variant,
          size: state.size,
          align: state.align,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
        }}
        events={{
          itemSelected: (item) =>
            update('lit', 'itemSelected', item, (prev) => ({
              ...prev,
              lastAction:
                typeof item === 'object' && item && 'id' in item
                  ? String((item as { id: unknown }).id)
                  : String(item ?? ''),
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    variant: 'primary' | 'secondary' | 'outline' | 'danger';
    size: 'md' | 'sm' | 'lg';
    align: 'end' | 'start';
    loading: boolean;
    readOnly: boolean;
    disabled: boolean;
    lastCommit: string;
  }>({
    selector: 'emr-split-button',
    createInitialState: () => ({
      variant: 'primary',
      size: 'md',
      align: 'end',
      loading: false,
      readOnly: false,
      disabled: false,
      lastCommit: 'none',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSplitButton
        controlId="parity-split-button-react"
        label="Sign encounter"
        items={SIGN_MENU_ITEMS}
        variant={state.variant}
        size={state.size}
        align={state.align}
        loading={state.loading}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        onClicked={() =>
          update('react', 'onClicked', 'sign-primary', (prev) => ({ ...prev, lastCommit: 'sign-primary' }))
        }
        onItemSelected={(item) =>
          update('react', 'onItemSelected', item, (prev) => ({ ...prev, lastCommit: item.id }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-split-button"
        props={{
          controlId: 'parity-split-button-lit',
          label: 'Sign encounter',
          items: SIGN_MENU_ITEMS,
          variant: state.variant,
          size: state.size,
          align: state.align,
          loading: state.loading,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
        }}
        events={{
          clicked: () =>
            update('lit', 'clicked', 'sign-primary', (prev) => ({ ...prev, lastCommit: 'sign-primary' })),
          itemSelected: (item) =>
            update('lit', 'itemSelected', item, (prev) => ({
              ...prev,
              lastCommit:
                typeof item === 'object' && item && 'id' in item
                  ? String((item as { id: unknown }).id)
                  : String(item ?? ''),
            })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    expandedIds: readonly string[];
    multiple: boolean;
    variant: 'outlined' | 'flush' | 'card';
    size: 'md' | 'sm';
    readOnly: boolean;
    disabled: boolean;
  }>({
    selector: 'emr-accordion',
    createInitialState: () => ({
      expandedIds: ['drops'],
      multiple: true,
      variant: 'outlined',
      size: 'md',
      readOnly: false,
      disabled: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAccordion
        controlId="parity-accordion-react"
        items={POSTOP_ACCORDION_ITEMS}
        expandedIds={state.expandedIds}
        multiple={state.multiple}
        variant={state.variant}
        size={state.size}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        onExpandedIdsChange={(ids) =>
          update('react', 'onExpandedIdsChange', ids, (prev) => ({ ...prev, expandedIds: ids }))
        }
        onItemToggled={(ev) => update('react', 'onItemToggled', ev, (prev) => prev)}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-accordion"
        props={{
          controlId: 'parity-accordion-lit',
          items: POSTOP_ACCORDION_ITEMS,
          expandedIds: state.expandedIds,
          multiple: state.multiple,
          variant: state.variant,
          size: state.size,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
        }}
        events={{
          expandedIdsChange: (ids) =>
            update('lit', 'expandedIdsChange', ids, (prev) => ({
              ...prev,
              expandedIds: Array.isArray(ids) ? (ids as readonly string[]) : prev.expandedIds,
            })),
          itemToggled: (ev) => update('lit', 'itemToggled', ev, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    maxItems: number;
    separator: string;
    size: 'md' | 'sm';
    activeCrumb: string;
  }>({
    selector: 'emr-breadcrumbs',
    createInitialState: () => ({
      maxItems: 3,
      separator: '/',
      size: 'md',
      activeCrumb: 'oct',
    }),
    renderReact: ({ state, update }) => (
      <EmrBreadcrumbs
        controlId="parity-breadcrumbs-react"
        items={CLINIC_BREADCRUMBS}
        maxItems={state.maxItems > 0 ? state.maxItems : undefined}
        separator={state.separator}
        size={state.size}
        onItemSelected={(item) =>
          update('react', 'onItemSelected', item, (prev) => ({ ...prev, activeCrumb: item.id }))
        }
        onOverflowExpanded={(hidden) => update('react', 'onOverflowExpanded', hidden, (prev) => prev)}
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-breadcrumbs"
        props={{
          controlId: 'parity-breadcrumbs-lit',
          items: CLINIC_BREADCRUMBS,
          maxItems: state.maxItems > 0 ? state.maxItems : undefined,
          separator: state.separator,
          size: state.size,
        }}
        events={{
          itemSelected: (item) =>
            update('lit', 'itemSelected', item, (prev) => ({
              ...prev,
              activeCrumb:
                typeof item === 'object' && item && 'id' in item
                  ? String((item as { id: unknown }).id)
                  : prev.activeCrumb,
            })),
          overflowExpanded: (hidden) => update('lit', 'overflowExpanded', hidden, (prev) => prev),
        }}
      />
    ),
  }),

  defineParityEntry<{
    value: string | null;
    allowCustomHex: boolean;
    clearable: boolean;
    size: 'md' | 'sm';
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    invalid: boolean;
    labelHidden: boolean;
    warning: string;
    error: string;
  }>({
    selector: 'emr-color-picker',
    createInitialState: () => ({
      value: '#dc2626',
      allowCustomHex: true,
      clearable: true,
      size: 'md',
      required: false,
      readOnly: false,
      disabled: false,
      invalid: false,
      labelHidden: false,
      warning: '',
      error: '',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrColorPicker
        controlId="parity-color-picker-react"
        label="Retinal annotation pen colour"
        swatches={DEFAULT_CLINICAL_COLOR_SWATCHES}
        value={state.value}
        allowCustomHex={state.allowCustomHex}
        clearable={state.clearable}
        size={state.size}
        required={state.required}
        readOnly={readOnly || state.readOnly}
        disabled={state.disabled}
        invalid={state.invalid}
        labelHidden={state.labelHidden}
        warning={state.warning}
        error={state.error}
        onValueChange={(v) => update('react', 'onValueChange', v, (prev) => ({ ...prev, value: v }))}
        onCleared={() => update('react', 'onCleared', null, (prev) => ({ ...prev, value: null }))}
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
          allowCustomHex: state.allowCustomHex,
          clearable: state.clearable,
          size: state.size,
          required: state.required,
          readOnly: readOnly || state.readOnly,
          disabled: state.disabled,
          invalid: state.invalid,
          labelHidden: state.labelHidden,
          warning: state.warning,
          error: state.error,
        }}
        events={{
          valueChange: (v) =>
            update('lit', 'valueChange', v, (prev) => ({ ...prev, value: (v as string | null) ?? null })),
          cleared: () => update('lit', 'cleared', null, (prev) => ({ ...prev, value: null })),
        }}
      />
    ),
  }),

  defineParityEntry<{
    variant: 'outline' | 'primary' | 'secondary' | 'ghost';
    size: 'sm' | 'md' | 'lg';
    iconOnly: boolean;
    disabled: boolean;
    copiedCount: number;
  }>({
    selector: 'emr-copy-button',
    createInitialState: () => ({
      variant: 'outline',
      size: 'sm',
      iconOnly: false,
      disabled: false,
      copiedCount: 0,
    }),
    renderReact: ({ state, update }) => (
      <EmrCopyButton
        controlId="parity-copy-button-react"
        value="MRN-2026-0419"
        label="Copy MRN"
        variant={state.variant}
        size={state.size}
        iconOnly={state.iconOnly}
        disabled={state.disabled}
        onCopied={(val) =>
          update('react', 'onCopied', val, (prev) => ({ ...prev, copiedCount: prev.copiedCount + 1 }))
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-copy-button"
        props={{
          controlId: 'parity-copy-button-lit',
          value: 'MRN-2026-0419',
          label: 'Copy MRN',
          variant: state.variant,
          size: state.size,
          iconOnly: state.iconOnly,
          disabled: state.disabled,
        }}
        events={{
          copied: (val) =>
            update('lit', 'copied', val, (prev) => ({ ...prev, copiedCount: prev.copiedCount + 1 })),
        }}
      />
    ),
  }),

  // ── L2 Clinical Image Field ───────────────────────────────────────────────
  defineParityEntry<
    ImageFieldViewModel & {
      readonly layout: FieldFrameLayout;
      readonly showMetadata: boolean;
      readonly labelHidden: boolean;
    }
  >({
    selector: 'emr-image-field',
    createInitialState: () => ({
      label: 'Slit-lamp & fundus photographs',
      hint: 'Upload, inspect fullscreen (pan/zoom/rotate), or crop clinical photos.',
      items: INITIAL_UPLOAD_ITEMS,
      allowCamera: true,
      multiple: true,
      maxFiles: 4,
      required: false,
      readOnly: false,
      layout: 'vertical',
      showMetadata: true,
      labelHidden: false,
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Media haze / unable', tone: 'warning' },
        { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
        { value: 'unknown', label: 'Unknown', tone: 'neutral' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageField
        controlId="parity-image-field-react"
        labelHidden={state.labelHidden}
        layout={state.layout}
        showMetadata={state.showMetadata}
        readOnly={readOnly || state.readOnly}
        model={{ ...state, readOnly: readOnly || state.readOnly }}
        onIntent={(intent: ImageFieldIntent) =>
          update('react', 'onIntent', intent, (prev) => ({
            ...prev,
            ...reduceImageFieldDemo(prev, intent),
          }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-field"
        props={{
          controlId: 'parity-image-field-lit',
          labelHidden: state.labelHidden,
          layout: state.layout,
          showMetadata: state.showMetadata,
          readOnly: readOnly || state.readOnly,
          model: { ...state, readOnly: readOnly || state.readOnly },
        }}
        events={{
          intent: (raw) => {
            const intent = raw as ImageFieldIntent;
            update('lit', 'intent', intent, (prev) => ({
              ...prev,
              ...reduceImageFieldDemo(prev, intent),
            }));
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
    case 'imageCropped':
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === intent.id
            ? {
                ...item,
                cropTransform: intent.result.transform,
                previewSrc: intent.result.croppedDataUrl ?? item.previewSrc ?? item.src,
              }
            : item,
        ),
      };
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
    case 'captureRequested':
    case 'filesSelected':
    default:
      return prev;
  }
}
