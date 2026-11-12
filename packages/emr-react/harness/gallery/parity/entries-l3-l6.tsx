'use client';

import { View } from 'react-native';
import {
  filterImageTemplates,
  type AnnotationLayerRecord,
  type AnnotationListIntent,
  type AnnotationListItem,
  type AnnotationToolbarIntent,
  type AnnotationToolbarViewModel,
  type ClinicalCellState,
  type ClinicalFormIntent,
  type ClinicalFormViewModel,
  type ClinicalListIntent,
  type ClinicalListItem,
  type ClinicalMatrixIntent,
  type ClinicalMatrixSchema,
  type ClinicalMatrixValues,
  type EhrTemplateDefinition,
  type EhrTemplateIntent,
  type EhrTemplateViewModel,
  type EmrGeneratedFieldDefinition,
  type FieldGeneratorIntent,
  type FieldGeneratorViewModel,
  type FieldValidationRule,
  type ImageTemplateGroup,
  type ImageTemplateOption,
  type ImageTemplatePickerIntent,
  type RepeatableGroupDefinition,
  type RepeatableItemState,
  type TerminologyConcept,
  type TerminologySource,
  type TimeAxisIntent,
  type TimeAxisViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrAnnotationList,
  EmrAnnotationToolbar,
  EmrButton,
  EmrClinicalForm,
  EmrClinicalList,
  EmrClinicalMatrix,
  EmrDataTable,
  EmrFieldGenerator,
  EmrFieldLibraryPicker,
  EmrFieldValueRow,
  EmrImageTemplatePicker,
  EmrRepeatableGroup,
  EmrSectionCard,
  EmrTemplateComposer,
  EmrTemplatePreview,
  EmrTerminologySearch,
  EmrTimeAxis,
  EmrValidationRuleEditor,
  type EmrDataTableIntent,
  type EmrDataTableRow,
  type EmrMatrixCellRendererProps,
  type TerminologySearchIntent,
  type TerminologySearchViewModel,
  type ValidationRuleEditorIntent,
} from '../../../src';
import { deriveTemplatePreview } from '../../../src/l6-authoring.logic';
import { LitElementHost } from './lit-element-host';
import { defineParityEntry, type ParityEntry } from './types';

// ---- Shared L3 fixtures --------------------------------------------------------------------

const REPEAT_DEF: RepeatableGroupDefinition = {
  kind: 'repeatable',
  id: 'topical-drops',
  label: 'Post-operative topical drops',
  description: 'Add or edit each eye drop regimen.',
  addLabel: 'Add drop',
  fields: [
    { id: 'drug', label: 'Medication', type: 'text', required: true, span: 6, placeholder: 'e.g. Prednisolone 1%' },
    {
      id: 'eye',
      label: 'Eye',
      type: 'select',
      span: 6,
      options: [
        { value: 'OD', label: 'Right (OD)' },
        { value: 'OS', label: 'Left (OS)' },
        { value: 'OU', label: 'Both (OU)' },
      ],
    },
    { id: 'freq', label: 'Frequency', type: 'text', span: 6, placeholder: 'e.g. 4 times daily' },
    { id: 'days', label: 'Duration', type: 'quantity', unit: 'days', span: 6 },
  ],
};

const INITIAL_REPEAT_ITEMS: readonly RepeatableItemState[] = [
  {
    id: 'drop-1',
    label: 'Drop 1',
    fields: {
      drug: { value: 'Moxifloxacin 0.5%' },
      eye: { value: 'OD' },
      freq: { value: '4 times daily' },
      days: { value: { value: 7, unit: 'days' } },
    },
  },
  {
    id: 'drop-2',
    label: 'Drop 2',
    fields: {
      drug: { value: 'Nepafenac 0.1%' },
      eye: { value: 'OD' },
      freq: { value: '3 times daily' },
      days: { value: { value: 28, unit: 'days' } },
    },
  },
];

function reduceRepeatable(items: readonly RepeatableItemState[], intent: ClinicalFormIntent): readonly RepeatableItemState[] {
  switch (intent.type) {
    case 'repeatItemAddRequested':
      return [
        ...items,
        {
          id: `drop-${items.length + 1}`,
          label: `Drop ${items.length + 1}`,
          fields: {
            drug: { value: '' },
            eye: { value: 'OD' },
            freq: { value: '' },
            days: { value: { value: 7, unit: 'days' } },
          },
        },
      ];
    case 'repeatItemRemoveRequested':
      return items.filter((it) => it.id !== intent.itemId);
    case 'repeatItemEditRequested':
      return items.map((it) =>
        it.id === intent.itemId
          ? { ...it, fields: { ...it.fields, [intent.fieldId]: { ...it.fields[intent.fieldId], value: intent.value } } }
          : it,
      );
    case 'repeatItemStatusEditRequested':
      return items.map((it) =>
        it.id === intent.itemId
          ? {
              ...it,
              fields: {
                ...it.fields,
                [intent.fieldId]: {
                  ...it.fields[intent.fieldId],
                  value: it.fields[intent.fieldId]?.value ?? null,
                  assessmentStatus: intent.status,
                },
              },
            }
          : it,
      );
    default:
      return items;
  }
}

const FORM_MODEL_SEED: ClinicalFormViewModel = {
  schema: {
    id: 'opd-triage-form',
    label: 'Ophthalmic Triage Assessment',
    sections: [
      {
        id: 'presenting',
        label: 'Presenting History & Vitals',
        description: '12-column schema-driven clinical form',
        blocks: [
          { id: 'complaint', label: 'Chief complaint', type: 'text', required: true, span: 6 },
          {
            id: 'laterality',
            label: 'Affected eye',
            type: 'select',
            span: 6,
            options: [
              { value: 'OD', label: 'Right (OD)' },
              { value: 'OS', label: 'Left (OS)' },
              { value: 'OU', label: 'Both (OU)' },
            ],
          },
          { id: 'iopOd', label: 'IOP Right (OD)', type: 'quantity', unit: 'mmHg', span: 4 },
          { id: 'iopOs', label: 'IOP Left (OS)', type: 'quantity', unit: 'mmHg', span: 4 },
          { id: 'diabetic', label: 'Known diabetes mellitus', type: 'boolean', span: 4 },
        ],
      },
    ],
  },
  fields: {
    complaint: { value: 'Halos around lights at night' },
    laterality: { value: 'OU' },
    iopOd: { value: { value: 22, unit: 'mmHg' }, warning: 'Borderline IOP' },
    iopOs: { value: { value: 18, unit: 'mmHg' } },
    diabetic: { value: true },
  },
  repeatableGroups: {},
};

const MATRIX_SCHEMA: ClinicalMatrixSchema = {
  id: 'anterior-matrix',
  label: 'Bilateral Anterior Segment Matrix',
  columnGroups: [{ id: 'eyes', label: 'Laterality', columnIds: ['od', 'os'] }],
  columns: [
    { id: 'od', label: 'Right Eye (OD)' },
    { id: 'os', label: 'Left Eye (OS)' },
  ],
  rows: [
    {
      id: 'va',
      label: 'Best-corrected VA',
      type: 'select',
      options: [
        { value: '6/6', label: '6/6' },
        { value: '6/9', label: '6/9' },
        { value: '6/18', label: '6/18' },
        { value: '6/60', label: '6/60' },
      ],
    },
    { id: 'iop', label: 'Applanation IOP', type: 'quantity', unit: 'mmHg' },
    { id: 'cdr', label: 'Vertical cup-disc ratio', type: 'decimal' },
    { id: 'cornea', label: 'Cornea & tear film', type: 'text' },
  ],
};

const mCell = (value: ClinicalCellState['value'], extra: Partial<ClinicalCellState> = {}): ClinicalCellState => ({ value, ...extra });

const MATRIX_SEED_VALUES: ClinicalMatrixValues = {
  va: { remark: 'Snellen 6m', cells: { od: mCell('6/9'), os: mCell('6/6') } },
  iop: { remark: 'GAT 09:45', cells: { od: mCell({ value: 24, unit: 'mmHg' }, { warning: 'Above 21 mmHg' }), os: mCell({ value: 16, unit: 'mmHg' }) } },
  cdr: { remark: '90D lens', cells: { od: mCell(0.65), os: mCell(0.45) } },
  cornea: { remark: '', cells: { od: mCell('Clear, deep AC'), os: mCell('Clear, deep AC') } },
};

function reduceMatrix(values: ClinicalMatrixValues, intent: ClinicalMatrixIntent): ClinicalMatrixValues {
  if (intent.type === 'cellEditRequested') {
    const row = values[intent.rowId] ?? { remark: '', cells: {} };
    return {
      ...values,
      [intent.rowId]: {
        ...row,
        cells: { ...row.cells, [intent.columnId]: { ...(row.cells[intent.columnId] ?? { value: null }), value: intent.value } },
      },
    };
  }
  if (intent.type === 'cellAssessmentStatusEditRequested') {
    const row = values[intent.rowId] ?? { remark: '', cells: {} };
    const statusObj = intent.status ? { value: intent.status, label: intent.status, tone: 'info' as const } : undefined;
    return {
      ...values,
      [intent.rowId]: {
        ...row,
        cells: { ...row.cells, [intent.columnId]: { ...(row.cells[intent.columnId] ?? { value: null }), assessmentStatus: statusObj } },
      },
    };
  }
  if (intent.type === 'remarkEditRequested') {
    const row = values[intent.rowId] ?? { remark: '', cells: {} };
    return { ...values, [intent.rowId]: { ...row, remark: intent.remark } };
  }
  return values;
}

const CUSTOM_CELL_SCHEMA: ClinicalMatrixSchema = {
  id: 'custom-cell-matrix',
  label: 'Custom Cell Renderer Matrix (OD / OS Stamp)',
  columns: [
    { id: 'od', label: 'Right Eye (OD)' },
    { id: 'os', label: 'Left Eye (OS)' },
  ],
  rows: [
    { id: 'gonioscopy', label: 'Gonioscopy stamp', type: 'custom', customRendererKey: 'angleStamp' },
  ],
};

function ReactAngleStamp({ row, column, cell, readOnly, emit }: EmrMatrixCellRendererProps) {
  const count = typeof cell?.value === 'number' ? cell.value : 0;
  return (
    <EmrButton
      small
      variant="outline"
      disabled={readOnly}
      label={`Stamp Shaffer IV · ${column.id.toUpperCase()} (${count})`}
      accessibilityLabel={`Stamp ${row.label} ${column.label}`}
      onPress={() => emit('stamp', { columnId: column.id, next: count + 1 })}
    />
  );
}

const TOOLBAR_SEED: AnnotationToolbarViewModel = {
  tools: [
    { id: 'select', label: 'Select', icon: 'heroCursorArrowRays', shortcutLabel: 'V' },
    { id: 'line', label: 'Line', icon: 'shape-line', shortcutLabel: 'L' },
    { id: 'arrow', label: 'Arrow', icon: 'shape-arrow', shortcutLabel: 'A' },
    { id: 'ellipse', label: 'Ellipse', icon: 'shape-ellipse', shortcutLabel: 'O' },
    { id: 'freehand', label: 'Freehand', icon: 'shape-freehand', shortcutLabel: 'F' },
  ],
  selectedToolId: 'ellipse',
  colours: [
    { id: 'red', label: 'Red', hex: '#d92d20' },
    { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
    { id: 'green', label: 'Green', hex: '#15803d' },
  ],
  selectedColourId: 'red',
  widths: [
    { id: 'w1', label: 'Thin 1px', px: 1 },
    { id: 'w2', label: 'Medium 3px', px: 3 },
    { id: 'w3', label: 'Thick 6px', px: 6 },
  ],
  selectedWidthId: 'w2',
  canUndo: true,
  canRedo: true,
  zoomLabel: '100%',
  canSave: true,
  saveLabel: 'Save sketch',
};

const ANNOTATION_LAYERS_SEED: readonly AnnotationListItem[] = [
  {
    layer: {
      id: 'l1',
      label: 'Inferotemporal RNFL wedge defect',
      color: '#d92d20',
      strokeWidth: 3,
      visible: true,
      tool: 'circle',
      center: { x: 0.44, y: 0.62 },
      radiusX: 0.09,
      radiusY: 0.07,
    } as AnnotationLayerRecord,
    number: 1,
    classLabel: 'RNFL defect',
  },
  {
    layer: {
      id: 'l2',
      label: 'Disc haemorrhage at 7 o’clock',
      color: '#1d4ed8',
      strokeWidth: 3,
      visible: true,
      tool: 'line',
      points: [{ x: 0.3, y: 0.55 }, { x: 0.38, y: 0.6 }],
    } as AnnotationLayerRecord,
    number: 2,
    classLabel: 'Haemorrhage',
  },
];

const svgUri = (stroke: string, text: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><circle cx="60" cy="54" r="40" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="60" cy="54" r="12" fill="none" stroke="${stroke}" stroke-width="2"/><text x="60" y="112" text-anchor="middle" font-size="11" fill="${stroke}" font-family="sans-serif">${text}</text></svg>`,
  )}`;

const TEMPLATE_GROUPS: readonly ImageTemplateGroup[] = [
  { id: 'retina', label: 'Retina', count: 2 },
  { id: 'cornea', label: 'Cornea', count: 1 },
];

const ALL_TEMPLATES: readonly ImageTemplateOption[] = [
  { id: 'retina-od', label: 'Posterior pole (OD)', imageUrl: svgUri('#263847', 'Retina OD'), width: 120, height: 120, groupId: 'retina', badges: ['Right'] },
  { id: 'retina-os', label: 'Posterior pole (OS)', imageUrl: svgUri('#263847', 'Retina OS'), width: 120, height: 120, groupId: 'retina', badges: ['Left'] },
  { id: 'cornea-od', label: 'Cornea frontal (OD)', imageUrl: svgUri('#0f766e', 'Cornea OD'), width: 120, height: 120, groupId: 'cornea', badges: ['Right'] },
];

const TIME_TICKS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

const TABLE_COLUMNS = [
  { id: 'patient', label: 'Patient', sortable: true },
  { id: 'centre', label: 'Vision Centre', sortable: true },
  { id: 'date', label: 'Referred', sortable: true, align: 'end' as const },
  { id: 'status', label: 'Status' },
];

const TABLE_SOURCE = [
  { id: 'r1', patient: 'Ananya Rao', centre: 'Vision Centre North', date: '11 Oct 2026', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'r2', patient: 'Aarav Sharma', centre: 'District Eye Unit', date: '12 Oct 2026', status: { label: 'Accepted', tone: 'success' as const } },
  { id: 'r3', patient: 'Meera Iyer', centre: 'Community Screening', date: '13 Oct 2026', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'r4', patient: 'Rohan Nair', centre: 'Vision Centre North', date: '14 Oct 2026', status: { label: 'Declined', tone: 'danger' as const } },
];

// ---- Shared L6 fixtures --------------------------------------------------------------------

const L6_SOURCES: readonly TerminologySource[] = [
  { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true, supportsPagination: true, versionLabel: '2.78' },
  { id: 'snomed', kind: 'snomed-ct', label: 'SNOMED CT', available: true, supportsPagination: true, versionLabel: '2025-01' },
  { id: 'ucum', kind: 'ucum', label: 'UCUM', available: true, versionLabel: '2.2' },
];

const LOINC_IOP: TerminologyConcept = {
  sourceId: 'loinc',
  system: 'http://loinc.org',
  code: '56844-4',
  display: 'Intraocular pressure of Eye',
  version: '2.78',
  active: true,
};

const LOINC_WEIGHT: TerminologyConcept = {
  sourceId: 'loinc',
  system: 'http://loinc.org',
  code: '29463-7',
  display: 'Body weight',
  version: '2.78',
  active: true,
};

const UCUM_MMHG: TerminologyConcept = {
  sourceId: 'ucum',
  system: 'http://unitsofmeasure.org',
  code: 'mm[Hg]',
  display: 'millimeter of mercury',
  version: '2.2',
  active: true,
};

const L6_CONCEPTS: readonly TerminologyConcept[] = [LOINC_IOP, LOINC_WEIGHT, UCUM_MMHG];

const LIB_CHIEF: EmrGeneratedFieldDefinition = {
  schemaVersion: '1.0',
  id: 'chief-complaints',
  revision: 1,
  label: 'Chief complaints',
  type: 'multiline',
  required: true,
  repeats: false,
  rows: 3,
  span: 12,
  validationRules: [],
  terminologyBindings: [],
};

const LIB_IOP: EmrGeneratedFieldDefinition = {
  schemaVersion: '1.0',
  id: 'iop-gat',
  revision: 1,
  label: 'Intraocular pressure (GAT)',
  type: 'quantity',
  unit: 'mmHg',
  unitSystem: 'UCUM',
  unitCode: 'mm[Hg]',
  required: true,
  repeats: false,
  span: 6,
  validationRules: [],
  terminologyBindings: [{ id: 'b-iop', role: 'question-meaning', concept: LOINC_IOP, strength: 'preferred' }],
};

const LIB_CDR: EmrGeneratedFieldDefinition = {
  schemaVersion: '1.0',
  id: 'cup-disc-ratio',
  revision: 1,
  label: 'Vertical cup-to-disc ratio',
  type: 'decimal',
  precision: 2,
  required: false,
  repeats: false,
  span: 6,
  validationRules: [],
  terminologyBindings: [],
};

const ALL_LIB_FIELDS: readonly EmrGeneratedFieldDefinition[] = [LIB_CHIEF, LIB_IOP, LIB_CDR];

const INITIAL_EHR_TEMPLATE: EhrTemplateDefinition = {
  schemaVersion: '1.0',
  id: 'glaucoma-screening-template',
  revision: 2,
  title: 'Glaucoma Screening Encounter',
  description: 'Reusable L6-authored ophthalmic screening template.',
  locale: 'en-IN',
  status: 'draft',
  sections: [
    {
      id: 'history',
      label: 'Presenting History',
      description: 'Symptoms and ocular history.',
      fields: [{ id: 'chief-complaints', sourceFieldId: 'chief-complaints', sourceFieldRevision: 1, field: LIB_CHIEF }],
    },
    {
      id: 'tonometry',
      label: 'Tonometry & Optic Disc',
      description: 'Core glaucoma screening parameters.',
      fields: [
        { id: 'iop-gat', sourceFieldId: 'iop-gat', sourceFieldRevision: 1, field: LIB_IOP },
        { id: 'cup-disc-ratio', sourceFieldId: 'cup-disc-ratio', sourceFieldRevision: 1, field: LIB_CDR },
      ],
    },
  ],
};

function reduceEhrTemplate(model: EhrTemplateViewModel, intent: EhrTemplateIntent): EhrTemplateViewModel {
  const withTemplate = (template: EhrTemplateDefinition): EhrTemplateViewModel => ({
    ...model,
    template,
    preview: deriveTemplatePreview(template),
    dirty: true,
  });
  switch (intent.type) {
    case 'templatePatched':
      return withTemplate({ ...model.template, ...intent.changes, revision: model.template.revision + 1 });
    case 'fieldLibraryQueryChanged': {
      const q = intent.query.trim().toLowerCase();
      return {
        ...model,
        fieldLibraryQuery: intent.query,
        fieldLibrary: ALL_LIB_FIELDS.filter((f) => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)),
      };
    }
    case 'sectionSelected':
      return { ...model, selectedSectionId: intent.sectionId };
    case 'sectionAdded': {
      const id = `sec-${model.template.sections.length + 1}`;
      return {
        ...withTemplate({ ...model.template, revision: model.template.revision + 1, sections: [...model.template.sections, { ...intent.section, id }] }),
        selectedSectionId: id,
      };
    }
    case 'sectionPatched':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map((s) => (s.id === intent.sectionId ? { ...s, ...intent.changes } : s)),
      });
    case 'sectionRemoved':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.filter((s) => s.id !== intent.sectionId),
      });
    case 'fieldAdded':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map((s) =>
          s.id === intent.sectionId
            ? {
                ...s,
                fields: [
                  ...s.fields,
                  { id: `${intent.field.id}-${s.fields.length + 1}`, sourceFieldId: intent.field.id, sourceFieldRevision: intent.field.revision, field: intent.field },
                ],
              }
            : s,
        ),
      });
    case 'fieldRemoved':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map((s) =>
          s.id === intent.sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== intent.placementId) } : s,
        ),
      });
    case 'artifactExportRequested':
      return {
        ...model,
        artifact: {
          format: intent.format,
          fhirVersion: intent.format === 'internal-json' ? undefined : '4.0.1',
          serialized: JSON.stringify(model.template, null, 2),
          issues: [],
        },
      };
    case 'saveRequested':
      return { ...model, dirty: false };
    default:
      return model;
  }
}

export const PARITY_ENTRIES_L3_L6: readonly ParityEntry[] = [
  // ---- L3 (11) ---------------------------------------------------------------------------
  defineParityEntry<{ collapsed: boolean }>({
    selector: 'emr-section-card',
    createInitialState: () => ({ collapsed: false }),
    renderReact: ({ state, update }) => (
      <EmrSectionCard
        sectionId="parity-sec-react"
        label="Anterior Segment Slit-Lamp"
        description="Collapsible L3 section container (expands automatically in .emr-print)"
        status={{ label: 'Recorded', tone: 'success' }}
        collapsible
        collapsed={state.collapsed}
        onToggle={() => update('react', 'onToggle', { collapsed: !state.collapsed }, (s) => ({ collapsed: !s.collapsed }))}
      >
        <EmrFieldValueRow field="Cornea (OD / OS)" value="Clear / Clear" remarks="Fluorescein negative" />
        <EmrFieldValueRow field="Lens (OD / OS)" value="NS Grade II / Pseudophakic PCIOL" remarks="Dilated" />
      </EmrSectionCard>
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-section-card"
        props={{
          sectionId: 'parity-sec-lit',
          title: 'Anterior Segment Slit-Lamp',
          description: 'Collapsible L3 section container (expands automatically in .emr-print)',
          status: { label: 'Recorded', tone: 'success' },
          collapsible: true,
          collapsed: state.collapsed,
        }}
        slotHtml="<div style='display:grid;gap:6px'><div><strong>Cornea (OD / OS):</strong> Clear / Clear (Fluorescein negative)</div><div><strong>Lens (OD / OS):</strong> NS Grade II / Pseudophakic PCIOL</div></div>"
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ collapsed: !s.collapsed })),
        }}
      />
    ),
  }),

  defineParityEntry<readonly RepeatableItemState[]>({
    selector: 'emr-repeatable-group',
    createInitialState: () => INITIAL_REPEAT_ITEMS,
    renderReact: ({ state, readOnly, update }) => (
      <EmrRepeatableGroup
        definition={REPEAT_DEF}
        model={state}
        readOnly={readOnly}
        idPrefix="parity-rg-r"
        onIntent={(i) => update('react', i.type, i, (s) => reduceRepeatable(s, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-repeatable-group"
        props={{ definition: REPEAT_DEF, items: state, readOnly, idPrefix: 'parity-rg-l' }}
        events={{
          intent: (i) => {
            const intent = i as ClinicalFormIntent;
            update('lit', intent.type, intent, (s) => reduceRepeatable(s, intent));
          },
        }}
      />
    ),
  }),

  defineParityEntry<ClinicalFormViewModel>({
    selector: 'emr-clinical-form',
    createInitialState: () => FORM_MODEL_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalForm
        model={{ ...state, readOnly }}
        idPrefix="parity-cf-r"
        onIntent={(i) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'fieldEditRequested') {
              return { ...s, fields: { ...s.fields, [i.fieldId]: { ...s.fields[i.fieldId], value: i.value } } };
            }
            if (i.type === 'fieldStatusEditRequested') {
              return {
                ...s,
                fields: { ...s.fields, [i.fieldId]: { value: s.fields[i.fieldId]?.value ?? null, assessmentStatus: i.status } },
              };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-form"
        props={{ model: { ...state, readOnly }, idPrefix: 'parity-cf-l' }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalFormIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'fieldEditRequested') {
                return { ...s, fields: { ...s.fields, [i.fieldId]: { ...s.fields[i.fieldId], value: i.value } } };
              }
              if (i.type === 'fieldStatusEditRequested') {
                return {
                  ...s,
                  fields: { ...s.fields, [i.fieldId]: { value: s.fields[i.fieldId]?.value ?? null, assessmentStatus: i.status } },
                };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<readonly ClinicalListItem[]>({
    selector: 'emr-clinical-list',
    createInitialState: () => [
      { id: 'c1', title: 'Primary open-angle glaucoma (OU)', subtitle: 'Diagnosed 2023', badges: [{ label: 'Active', tone: 'success' }] },
      { id: 'c2', title: 'Pseudophakia (OS)', subtitle: 'PCIOL implanted 2024', badges: [{ label: 'Stable', tone: 'info' }] },
    ],
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalList
        model={{ items: state, allowAdd: !readOnly, emptyMessage: 'No active problems recorded.' }}
        onIntent={(i: ClinicalListIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'removeRequested'
              ? s.filter((x) => x.id !== i.id)
              : i.type === 'addRequested'
                ? [...s, { id: `c-${s.length + 1}`, title: `Added clinical entry ${s.length + 1}`, badges: [{ label: 'New', tone: 'info' }] }]
                : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-list"
        props={{ items: state, readOnly, allowAdd: !readOnly, emptyMessage: 'No active problems recorded.' }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalListIntent;
            update('lit', i.type, i, (s) =>
              i.type === 'removeRequested'
                ? s.filter((x) => x.id !== i.id)
                : i.type === 'addRequested'
                  ? [...s, { id: `c-${s.length + 1}`, title: `Added clinical entry ${s.length + 1}`, badges: [{ label: 'New', tone: 'info' }] }]
                  : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<ClinicalMatrixValues>({
    selector: 'emr-clinical-matrix',
    createInitialState: () => MATRIX_SEED_VALUES,
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalMatrix
        definition={MATRIX_SCHEMA}
        model={state}
        readOnly={readOnly}
        idPrefix="parity-cm-r"
        onIntent={(i) => update('react', i.type, i, (s) => reduceMatrix(s, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-matrix"
        props={{ definition: MATRIX_SCHEMA, model: state, readOnly, idPrefix: 'parity-cm-l' }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalMatrixIntent;
            update('lit', i.type, i, (s) => reduceMatrix(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ od: number; os: number; remark: string }>({
    selector: 'emr-clinical-cell-renderer',
    notes: 'Demonstrates custom matrix cell rendering in React (`customRenderers`) vs Lit (`<emr-clinical-cell-renderer>`).',
    createInitialState: () => ({ od: 1, os: 0, remark: '4-mirror Posner goniolens' }),
    renderReact: ({ state, readOnly, update }) => {
      const values: ClinicalMatrixValues = {
        gonioscopy: {
          remark: state.remark,
          cells: { od: { value: state.od }, os: { value: state.os } },
        },
      };
      return (
        <EmrClinicalMatrix
          definition={CUSTOM_CELL_SCHEMA}
          model={values}
          readOnly={readOnly}
          idPrefix="parity-ccr-r"
          customRenderers={{ angleStamp: ReactAngleStamp }}
          onIntent={(i) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'customCellIntent') {
                return i.columnId === 'od' ? { ...s, od: s.od + 1 } : { ...s, os: s.os + 1 };
              }
              if (i.type === 'remarkEditRequested') return { ...s, remark: i.remark };
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const values: ClinicalMatrixValues = {
        gonioscopy: {
          remark: state.remark,
          cells: { od: { value: state.od }, os: { value: state.os } },
        },
      };
      const litCustomRenderers = {
        angleStamp: ({ column, cell, readOnly: cellRo, emit }: {
          column: { id: string; label: string };
          cell?: { value?: unknown };
          readOnly: boolean;
          emit: (action: string, payload?: unknown) => void;
        }) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          const count = typeof cell?.value === 'number' ? cell.value : 0;
          btn.textContent = `Stamp Shaffer IV · ${column.id.toUpperCase()} (${count})`;
          btn.disabled = cellRo;
          btn.style.cssText =
            'min-height:36px;padding:0 12px;border-radius:var(--emr-radius,8px);border:1px solid var(--emr-border);background:var(--emr-surface);color:var(--emr-text);cursor:pointer;font:inherit;';
          btn.onclick = () => emit('stamp', { columnId: column.id, next: count + 1 });
          return btn;
        },
      };
      return (
        <LitElementHost
          tag="emr-clinical-matrix"
          props={{
            definition: CUSTOM_CELL_SCHEMA,
            model: values,
            readOnly,
            idPrefix: 'parity-ccr-l',
            customRenderers: litCustomRenderers,
          }}
          events={{
            intent: (raw) => {
              const i = raw as ClinicalMatrixIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'customCellIntent') {
                  return i.columnId === 'od' ? { ...s, od: s.od + 1 } : { ...s, os: s.os + 1 };
                }
                if (i.type === 'remarkEditRequested') return { ...s, remark: i.remark };
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<{ model: AnnotationToolbarViewModel; zoomPct: number }>({
    selector: 'emr-annotation-toolbar',
    createInitialState: () => ({ model: TOOLBAR_SEED, zoomPct: 100 }),
    renderReact: ({ state, readOnly, update }) => {
      const reduce = (s: { model: AnnotationToolbarViewModel; zoomPct: number }, i: AnnotationToolbarIntent) => {
        switch (i.type) {
          case 'toolSelected':
            return { ...s, model: { ...s.model, selectedToolId: i.toolId } };
          case 'colourSelected':
            return { ...s, model: { ...s.model, selectedColourId: i.colourId } };
          case 'widthSelected':
            return { ...s, model: { ...s.model, selectedWidthId: i.widthId } };
          case 'zoomInRequested': {
            const z = Math.min(400, s.zoomPct + 25);
            return { zoomPct: z, model: { ...s.model, zoomLabel: `${z}%` } };
          }
          case 'zoomOutRequested': {
            const z = Math.max(25, s.zoomPct - 25);
            return { zoomPct: z, model: { ...s.model, zoomLabel: `${z}%` } };
          }
          case 'zoomResetRequested':
          case 'zoomFitRequested':
            return { zoomPct: 100, model: { ...s.model, zoomLabel: '100%' } };
          default:
            return s;
        }
      };
      return (
        <EmrAnnotationToolbar
          model={{ ...state.model, readOnly, canSave: !readOnly }}
          onIntent={(i) => update('react', i.type, i, (s) => reduce(s, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-annotation-toolbar"
        props={{ model: { ...state.model, readOnly, canSave: !readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as AnnotationToolbarIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'toolSelected') return { ...s, model: { ...s.model, selectedToolId: i.toolId } };
              if (i.type === 'colourSelected') return { ...s, model: { ...s.model, selectedColourId: i.colourId } };
              if (i.type === 'widthSelected') return { ...s, model: { ...s.model, selectedWidthId: i.widthId } };
              if (i.type === 'zoomInRequested') {
                const z = Math.min(400, s.zoomPct + 25);
                return { zoomPct: z, model: { ...s.model, zoomLabel: `${z}%` } };
              }
              if (i.type === 'zoomOutRequested') {
                const z = Math.max(25, s.zoomPct - 25);
                return { zoomPct: z, model: { ...s.model, zoomLabel: `${z}%` } };
              }
              if (i.type === 'zoomResetRequested' || i.type === 'zoomFitRequested') {
                return { zoomPct: 100, model: { ...s.model, zoomLabel: '100%' } };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ items: readonly AnnotationListItem[]; selectedLayerId?: string }>({
    selector: 'emr-annotation-list',
    createInitialState: () => ({ items: ANNOTATION_LAYERS_SEED, selectedLayerId: 'l1' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAnnotationList
        model={{ items: state.items, selectedLayerId: state.selectedLayerId, readOnly, canLock: true, emptyMessage: 'No layers.' }}
        onIntent={(i: AnnotationListIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'layerSelected') return { ...s, selectedLayerId: i.layerId };
            if (i.type === 'layerVisibilityToggleRequested') {
              return { ...s, items: s.items.map((it) => (it.layer.id === i.layerId ? { ...it, layer: { ...it.layer, visible: !it.layer.visible } } : it)) };
            }
            if (i.type === 'layerLockToggleRequested') {
              return { ...s, items: s.items.map((it) => (it.layer.id === i.layerId ? { ...it, locked: !it.locked } : it)) };
            }
            if (i.type === 'layerRemoveRequested') {
              return { ...s, items: s.items.filter((it) => it.layer.id !== i.layerId).map((it, idx) => ({ ...it, number: idx + 1 })) };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-annotation-list"
        props={{ model: { items: state.items, selectedLayerId: state.selectedLayerId, readOnly, canLock: true, emptyMessage: 'No layers.' } }}
        events={{
          intent: (raw) => {
            const i = raw as AnnotationListIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'layerSelected') return { ...s, selectedLayerId: i.layerId };
              if (i.type === 'layerVisibilityToggleRequested') {
                return { ...s, items: s.items.map((it) => (it.layer.id === i.layerId ? { ...it, layer: { ...it.layer, visible: !it.layer.visible } } : it)) };
              }
              if (i.type === 'layerLockToggleRequested') {
                return { ...s, items: s.items.map((it) => (it.layer.id === i.layerId ? { ...it, locked: !it.locked } : it)) };
              }
              if (i.type === 'layerRemoveRequested') {
                return { ...s, items: s.items.filter((it) => it.layer.id !== i.layerId).map((it, idx) => ({ ...it, number: idx + 1 })) };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ query: string; groupId?: string; selectedId: string; favs: readonly string[] }>({
    selector: 'emr-image-template-picker',
    createInitialState: () => ({ query: '', groupId: undefined, selectedId: 'retina-od', favs: ['retina-od'] }),
    renderReact: ({ state, readOnly, update }) => {
      const options = filterImageTemplates(ALL_TEMPLATES, state.query, state.groupId, TEMPLATE_GROUPS, state.favs);
      return (
        <EmrImageTemplatePicker
          model={{
            title: 'Select anatomical drawing outline',
            options,
            groups: TEMPLATE_GROUPS,
            selectedGroupId: state.groupId,
            query: state.query,
            selectedId: state.selectedId,
            totalLabel: `${options.length} of ${ALL_TEMPLATES.length} outlines`,
            emptyMessage: 'No matching outlines',
            readOnly,
            favouriteIds: state.favs,
            canEditFavourites: true,
          }}
          onIntent={(i: ImageTemplatePickerIntent) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'queryChangeRequested') return { ...s, query: i.query };
              if (i.type === 'groupSelected') return { ...s, groupId: i.groupId ?? undefined };
              if (i.type === 'templateSelected') return { ...s, selectedId: i.templateId };
              if (i.type === 'favouriteToggleRequested') {
                return { ...s, favs: i.favourite ? [...s.favs, i.templateId] : s.favs.filter((x) => x !== i.templateId) };
              }
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const options = filterImageTemplates(ALL_TEMPLATES, state.query, state.groupId, TEMPLATE_GROUPS, state.favs);
      return (
        <LitElementHost
          tag="emr-image-template-picker"
          props={{
            model: {
              title: 'Select anatomical drawing outline',
              options,
              groups: TEMPLATE_GROUPS,
              selectedGroupId: state.groupId,
              query: state.query,
              selectedId: state.selectedId,
              totalLabel: `${options.length} of ${ALL_TEMPLATES.length} outlines`,
              emptyMessage: 'No matching outlines',
              readOnly,
              favouriteIds: state.favs,
              canEditFavourites: true,
            },
          }}
          events={{
            intent: (raw) => {
              const i = raw as ImageTemplatePickerIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'queryChangeRequested') return { ...s, query: i.query };
                if (i.type === 'groupSelected') return { ...s, groupId: i.groupId ?? undefined };
                if (i.type === 'templateSelected') return { ...s, selectedId: i.templateId };
                if (i.type === 'favouriteToggleRequested') {
                  return { ...s, favs: i.favourite ? [...s.favs, i.templateId] : s.favs.filter((x) => x !== i.templateId) };
                }
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<{ offset: number; selectedTickId: string; stepId: string }>({
    selector: 'emr-time-axis',
    createInitialState: () => ({ offset: 0, selectedTickId: 't1', stepId: '60' }),
    renderReact: ({ state, readOnly, update }) => {
      const model: TimeAxisViewModel = {
        id: 'parity-axis',
        title: 'IOP diurnal curve window',
        ticks: TIME_TICKS.slice(state.offset, state.offset + 5).map((label, idx) => ({
          id: `t${state.offset + idx}`,
          label,
          sublabel: 'Day 1',
          current: state.offset + idx === 2,
        })),
        selectedTickId: state.selectedTickId,
        selectedStepId: state.stepId,
        steps: [{ id: '60', label: 'Hourly' }, { id: '30', label: '30 min' }],
        canShiftEarlier: state.offset > 0,
        canShiftLater: state.offset + 5 < TIME_TICKS.length,
        readOnly,
      };
      return (
        <EmrTimeAxis
          model={model}
          onIntent={(i: TimeAxisIntent) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'tickSelected') return { ...s, selectedTickId: i.tickId };
              if (i.type === 'shiftEarlierRequested') return { ...s, offset: Math.max(0, s.offset - 1) };
              if (i.type === 'shiftLaterRequested') return { ...s, offset: s.offset + 1 };
              return { ...s, stepId: i.stepId };
            })
          }
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const model: TimeAxisViewModel = {
        id: 'parity-axis',
        title: 'IOP diurnal curve window',
        ticks: TIME_TICKS.slice(state.offset, state.offset + 5).map((label, idx) => ({
          id: `t${state.offset + idx}`,
          label,
          sublabel: 'Day 1',
          current: state.offset + idx === 2,
        })),
        selectedTickId: state.selectedTickId,
        selectedStepId: state.stepId,
        steps: [{ id: '60', label: 'Hourly' }, { id: '30', label: '30 min' }],
        canShiftEarlier: state.offset > 0,
        canShiftLater: state.offset + 5 < TIME_TICKS.length,
        readOnly,
      };
      return (
        <LitElementHost
          tag="emr-time-axis"
          props={{ model }}
          events={{
            intent: (raw) => {
              const i = raw as TimeAxisIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'tickSelected') return { ...s, selectedTickId: i.tickId };
                if (i.type === 'shiftEarlierRequested') return { ...s, offset: Math.max(0, s.offset - 1) };
                if (i.type === 'shiftLaterRequested') return { ...s, offset: s.offset + 1 };
                return { ...s, stepId: i.stepId };
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<{
    sort?: { columnId: string; direction: 'asc' | 'desc' };
    selectedIds: string[];
    density: 'comfortable' | 'compact';
    pendingOnly: boolean;
  }>({
    selector: 'emr-data-table',
    createInitialState: () => ({ selectedIds: ['r1'], density: 'comfortable', pendingOnly: false }),
    renderReact: ({ state, update }) => {
      const filtered = TABLE_SOURCE.filter((r) => !state.pendingOnly || r.status.label === 'Pending');
      const sorted = state.sort
        ? [...filtered].sort((a, b) => {
            const av = state.sort!.columnId === 'centre' ? a.centre : state.sort!.columnId === 'date' ? a.date : a.patient;
            const bv = state.sort!.columnId === 'centre' ? b.centre : state.sort!.columnId === 'date' ? b.date : b.patient;
            return av.localeCompare(bv) * (state.sort!.direction === 'asc' ? 1 : -1);
          })
        : filtered;
      const rows: EmrDataTableRow[] = sorted.map((r) => ({
        id: r.id,
        cells: { patient: r.patient, centre: r.centre, date: r.date, status: { text: '', badge: r.status } },
      }));
      const model = {
        caption: 'Vision centre surgical referrals',
        columns: TABLE_COLUMNS,
        rows,
        selectedIds: state.selectedIds,
        sort: state.sort,
        filters: state.pendingOnly ? [{ id: 'pending', label: 'Status', valueLabel: 'Pending' }] : [],
        savedFilters: [{ id: 'pending', label: 'Pending only' }],
        bulkActions: [{ id: 'accept', label: 'Accept selected' }],
        density: state.density,
        page: 1,
        pageCount: 1,
        pageSize: 10,
        pageSizeOptions: [5, 10],
        summaryLabel: `Showing ${rows.length} of ${TABLE_SOURCE.length} referrals`,
        status: 'ready' as const,
      };
      return (
        <EmrDataTable
          model={model}
          onIntent={(i: EmrDataTableIntent) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'sortChanged') return { ...s, sort: { columnId: i.columnId, direction: i.direction } };
              if (i.type === 'selectionChanged') return { ...s, selectedIds: i.selectedIds };
              if (i.type === 'densityChanged') return { ...s, density: i.density };
              if (i.type === 'savedFilterSelected' || i.type === 'filterAddRequested') return { ...s, pendingOnly: true };
              if (i.type === 'filterRemoved') return { ...s, pendingOnly: false };
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const filtered = TABLE_SOURCE.filter((r) => !state.pendingOnly || r.status.label === 'Pending');
      const sorted = state.sort
        ? [...filtered].sort((a, b) => {
            const av = state.sort!.columnId === 'centre' ? a.centre : state.sort!.columnId === 'date' ? a.date : a.patient;
            const bv = state.sort!.columnId === 'centre' ? b.centre : state.sort!.columnId === 'date' ? b.date : b.patient;
            return av.localeCompare(bv) * (state.sort!.direction === 'asc' ? 1 : -1);
          })
        : filtered;
      const rows: EmrDataTableRow[] = sorted.map((r) => ({
        id: r.id,
        cells: { patient: r.patient, centre: r.centre, date: r.date, status: { text: '', badge: r.status } },
      }));
      const model = {
        caption: 'Vision centre surgical referrals',
        columns: TABLE_COLUMNS,
        rows,
        selectedIds: state.selectedIds,
        sort: state.sort,
        filters: state.pendingOnly ? [{ id: 'pending', label: 'Status', valueLabel: 'Pending' }] : [],
        savedFilters: [{ id: 'pending', label: 'Pending only' }],
        bulkActions: [{ id: 'accept', label: 'Accept selected' }],
        density: state.density,
        page: 1,
        pageCount: 1,
        pageSize: 10,
        pageSizeOptions: [5, 10],
        summaryLabel: `Showing ${rows.length} of ${TABLE_SOURCE.length} referrals`,
        status: 'ready' as const,
      };
      return (
        <LitElementHost
          tag="emr-data-table"
          props={{ model }}
          events={{
            intent: (raw) => {
              const i = raw as EmrDataTableIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'sortChanged') return { ...s, sort: { columnId: i.columnId, direction: i.direction } };
                if (i.type === 'selectionChanged') return { ...s, selectedIds: i.selectedIds };
                if (i.type === 'densityChanged') return { ...s, density: i.density };
                if (i.type === 'savedFilterSelected' || i.type === 'filterAddRequested') return { ...s, pendingOnly: true };
                if (i.type === 'filterRemoved') return { ...s, pendingOnly: false };
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  // ---- L6 (6) ----------------------------------------------------------------------------
  defineParityEntry<FieldGeneratorViewModel>({
    selector: 'emr-field-generator',
    createInitialState: () => ({
      draft: {
        schemaVersion: '1.0',
        id: 'iop-applanation',
        revision: 1,
        label: 'Applanation IOP',
        description: 'Measured Goldmann applanation intraocular pressure.',
        type: 'quantity',
        required: true,
        repeats: false,
        unit: 'mmHg',
        unitSystem: 'UCUM',
        unitCode: 'mm[Hg]',
        precision: 0,
        defaultValue: { value: 16, unit: 'mmHg' },
        validationRules: [{ id: 'r1', kind: 'minimum', value: 0, message: 'IOP cannot be negative.' }],
        terminologyBindings: [
          { id: 'b-loinc', role: 'question-meaning', concept: LOINC_IOP, strength: 'preferred' },
          { id: 'b-ucum', role: 'unit', concept: UCUM_MMHG, strength: 'required' },
        ],
      },
      sources: L6_SOURCES,
      terminologySearches: {},
      validationErrors: {},
      saving: false,
      dirty: false,
    }),
    renderReact: ({ state, update }) => (
      <EmrFieldGenerator
        model={state}
        onIntent={(i: FieldGeneratorIntent) =>
          update('react', i.type, i, (prev) => {
            if (i.type === 'draftPatched') return { ...prev, draft: { ...prev.draft, ...i.changes }, dirty: true };
            if (i.type === 'validationRuleAdded') {
              return { ...prev, dirty: true, draft: { ...prev.draft, validationRules: [...prev.draft.validationRules, { ...i.rule, id: `r-${prev.draft.validationRules.length + 1}` }] } };
            }
            if (i.type === 'validationRuleRemoved') {
              return { ...prev, dirty: true, draft: { ...prev.draft, validationRules: prev.draft.validationRules.filter((r) => r.id !== i.ruleId) } };
            }
            if (i.type === 'saveRequested') return { ...prev, dirty: false, savedFieldId: prev.draft.id };
            return prev;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-field-generator"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as FieldGeneratorIntent;
            update('lit', i.type, i, (prev) => {
              if (i.type === 'draftPatched') return { ...prev, draft: { ...prev.draft, ...i.changes }, dirty: true };
              if (i.type === 'validationRuleAdded') {
                return { ...prev, dirty: true, draft: { ...prev.draft, validationRules: [...prev.draft.validationRules, { ...i.rule, id: `r-${prev.draft.validationRules.length + 1}` }] } };
              }
              if (i.type === 'validationRuleRemoved') {
                return { ...prev, dirty: true, draft: { ...prev.draft, validationRules: prev.draft.validationRules.filter((r) => r.id !== i.ruleId) } };
              }
              if (i.type === 'saveRequested') return { ...prev, dirty: false, savedFieldId: prev.draft.id };
              return prev;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<TerminologySearchViewModel>({
    selector: 'emr-terminology-search',
    createInitialState: () => ({
      role: 'question-meaning',
      sources: L6_SOURCES,
      search: {
        sourceId: 'loinc',
        role: 'question-meaning',
        query: 'pressure',
        options: [LOINC_IOP, LOINC_WEIGHT],
        page: 1,
        pageSize: 10,
        total: 2,
        loading: false,
      },
      bindings: [{ id: 'b-loinc-iop', role: 'question-meaning', concept: LOINC_IOP, strength: 'preferred' }],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTerminologySearch
        model={{ ...state, readOnly }}
        onIntent={(i: TerminologySearchIntent) =>
          update('react', i.type, i, (prev) => {
            if (i.type === 'terminologyQueryChanged' && prev.search) return { ...prev, search: { ...prev.search, query: i.query } };
            if (i.type === 'terminologySearchRequested' && prev.search) {
              const q = prev.search.query.toLowerCase();
              const opts = L6_CONCEPTS.filter((c) => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
              return { ...prev, search: { ...prev.search, options: opts, total: opts.length } };
            }
            if (i.type === 'terminologyConceptSelected') {
              const id = `b-${i.concept.sourceId}-${i.concept.code}`;
              return { ...prev, bindings: [...prev.bindings.filter((b) => b.id !== id), { id, role: i.role, concept: i.concept, strength: i.strength ?? 'preferred' }] };
            }
            if (i.type === 'terminologyBindingRemoved') return { ...prev, bindings: prev.bindings.filter((b) => b.id !== i.bindingId) };
            return prev;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-terminology-search"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as TerminologySearchIntent;
            update('lit', i.type, i, (prev) => {
              if (i.type === 'terminologyQueryChanged' && prev.search) return { ...prev, search: { ...prev.search, query: i.query } };
              if (i.type === 'terminologySearchRequested' && prev.search) {
                const q = prev.search.query.toLowerCase();
                const opts = L6_CONCEPTS.filter((c) => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
                return { ...prev, search: { ...prev.search, options: opts, total: opts.length } };
              }
              if (i.type === 'terminologyConceptSelected') {
                const id = `b-${i.concept.sourceId}-${i.concept.code}`;
                return { ...prev, bindings: [...prev.bindings.filter((b) => b.id !== id), { id, role: i.role, concept: i.concept, strength: i.strength ?? 'preferred' }] };
              }
              if (i.type === 'terminologyBindingRemoved') return { ...prev, bindings: prev.bindings.filter((b) => b.id !== i.bindingId) };
              return prev;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<readonly FieldValidationRule[]>({
    selector: 'emr-validation-rule-editor',
    createInitialState: () => [
      { id: 'r-min', kind: 'minimum', value: 5, message: 'Hypotony alert below 5 mmHg.' },
      { id: 'r-max', kind: 'maximum', value: 21, message: 'Elevated IOP above 21 mmHg.' },
    ],
    renderReact: ({ state, readOnly, update }) => (
      <EmrValidationRuleEditor
        model={{ rules: state, readOnly }}
        onIntent={(i: ValidationRuleEditorIntent) =>
          update('react', i.type, i, (prev) =>
            i.type === 'validationRuleAdded'
              ? [...prev, { ...i.rule, id: `r-${prev.length + 1}` }]
              : prev.filter((r) => r.id !== i.ruleId),
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-validation-rule-editor"
        props={{ model: { rules: state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as ValidationRuleEditorIntent;
            update('lit', i.type, i, (prev) =>
              i.type === 'validationRuleAdded'
                ? [...prev, { ...i.rule, id: `r-${prev.length + 1}` }]
                : prev.filter((r) => r.id !== i.ruleId),
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ query: string }>({
    selector: 'emr-field-library-picker',
    createInitialState: () => ({ query: '' }),
    renderReact: ({ state, readOnly, update }) => {
      const q = state.query.trim().toLowerCase();
      const fields = ALL_LIB_FIELDS.filter((f) => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
      return (
        <EmrFieldLibraryPicker
          model={{ fields, query: state.query, selectedSectionId: 'tonometry', readOnly }}
          onIntent={(i) =>
            update('react', i.type, i, (s) => (i.type === 'fieldLibraryQueryChanged' ? { query: i.query } : s))
          }
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const q = state.query.trim().toLowerCase();
      const fields = ALL_LIB_FIELDS.filter((f) => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
      return (
        <LitElementHost
          tag="emr-field-library-picker"
          props={{ model: { fields, query: state.query, selectedSectionId: 'tonometry', readOnly } }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; query?: string };
              update('lit', i.type, i, (s) => (i.type === 'fieldLibraryQueryChanged' ? { query: i.query ?? '' } : s));
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<EhrTemplateViewModel>({
    selector: 'emr-template-composer',
    createInitialState: () => ({
      template: INITIAL_EHR_TEMPLATE,
      fieldLibrary: ALL_LIB_FIELDS,
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      preview: deriveTemplatePreview(INITIAL_EHR_TEMPLATE),
      loading: false,
      saving: false,
      dirty: false,
    }),
    renderReact: ({ state, update }) => (
      <View style={{ minWidth: 0 }}>
        <EmrTemplateComposer
          model={state}
          onIntent={(i) => update('react', i.type, i, (s) => reduceEhrTemplate(s, i))}
        />
      </View>
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-template-composer"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as EhrTemplateIntent;
            update('lit', i.type, i, (s) => reduceEhrTemplate(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<EhrTemplateViewModel>({
    selector: 'emr-template-preview',
    createInitialState: () => ({
      template: INITIAL_EHR_TEMPLATE,
      fieldLibrary: ALL_LIB_FIELDS,
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      preview: deriveTemplatePreview(INITIAL_EHR_TEMPLATE),
      loading: false,
      saving: false,
      dirty: false,
    }),
    renderReact: ({ state, update }) => (
      <EmrTemplatePreview
        model={state}
        onIntent={(i) => update('react', i.type, i, (s) => reduceEhrTemplate(s, i))}
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-template-preview"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as EhrTemplateIntent;
            update('lit', i.type, i, (s) => reduceEhrTemplate(s, i));
          },
        }}
      />
    ),
  }),
];
