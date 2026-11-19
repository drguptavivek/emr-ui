'use client';

import { View } from 'react-native';
import {
  FAVOURITES_GROUP_ID,
  clampTimeGridScrollOffset,
  filterImageTemplates,
  resolveSplitWorkspacePresetSizes,
  type AnnotationLayerRecord,
  type AnnotationListIntent,
  type AnnotationListItem,
  type AnnotationToolbarIntent,
  type AnnotationToolbarViewModel,
  type ClinicalCellState,
  type ClinicalFieldType,
  type ClinicalFormIntent,
  type ClinicalFormViewModel,
  type ClinicalListIntent,
  type ClinicalListViewModel,
  type ClinicalMatrixIntent,
  type ClinicalMatrixSchema,
  type ClinicalMatrixValues,
  type EhrTemplateDefinition,
  type EhrTemplateIntent,
  type EhrTemplateViewModel,
  type EmrCommandCategory,
  type EmrCommandItem,
  type EmrCommandPaletteIntent,
  type EmrCommandPalettePresentation,
  type EmrCommandPaletteViewModel,
  type EmrGeneratedFieldDefinition,
  type EmrMasterDetailIntent,
  type EmrMasterDetailItem,
  type EmrMasterDetailViewModel,
  type EmrSectionCardHeadingLevel,
  type EmrSectionCardPadding,
  type EmrSectionCardVariant,
  type EmrSplitWorkspaceIntent,
  type EmrSplitWorkspacePane,
  type EmrSplitWorkspacePreset,
  type EmrSplitWorkspaceViewModel,
  type EmrSynchronizedTimeGridIntent,
  type EmrSynchronizedTimeGridViewModel,
  type EmrTimeGridColumn,
  type EmrTimeGridResolution,
  type EmrTimeGridTrack,
  type EmrTone,
  type FhirQuestionnaireMapperIntent,
  type FhirQuestionnaireMapperViewModel,
  type FieldGeneratorIntent,
  type FieldGeneratorViewModel,
  type FieldValidationRule,
  type ImageTemplateGroup,
  type ImageTemplateOption,
  type ImageTemplatePickerIntent,
  type ImageTemplatePickerViewModel,
  type LogicRuleBuilderIntent,
  type LogicRuleBuilderViewModel,
  type RepeatableGroupDefinition,
  type RepeatableItemState,
  type ScoreBuilderIntent,
  type ScoreBuilderViewModel,
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
  EmrCommandPalette,
  EmrDataTable,
  EmrFhirQuestionnaireMapper,
  EmrFieldGenerator,
  EmrFieldLibraryPicker,
  EmrFieldValueRow,
  EmrImageTemplatePicker,
  EmrLogicRuleBuilder,
  EmrMasterDetail,
  EmrRepeatableGroup,
  EmrScoreBuilder,
  EmrSectionCard,
  EmrSplitWorkspace,
  EmrSynchronizedTimeGrid,
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

function nextMonotonicDropIndex(items: readonly RepeatableItemState[]): number {
  let maxIndex = 0;
  for (const item of items) {
    const match = /^drop-(\d+)$/.exec(item.id);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > maxIndex) maxIndex = n;
    }
  }
  return maxIndex + 1;
}

function reduceRepeatable(items: readonly RepeatableItemState[], intent: ClinicalFormIntent): readonly RepeatableItemState[] {
  switch (intent.type) {
    case 'repeatItemAddRequested': {
      const nextNum = nextMonotonicDropIndex(items);
      return [
        ...items,
        {
          id: `drop-${nextNum}`,
          label: `Drop ${nextNum}`,
          fields: {
            drug: { value: '' },
            eye: { value: 'OD' },
            freq: { value: '' },
            days: { value: { value: 7, unit: 'days' } },
          },
        },
      ];
    }
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

interface RepeatableGroupParityState {
  readonly items: readonly RepeatableItemState[];
  readonly readOnly: boolean;
  readonly empty: boolean;
  readonly error: boolean;
  readonly warning: boolean;
}

function reduceRepeatableParity(
  state: RepeatableGroupParityState,
  intent: ClinicalFormIntent,
): RepeatableGroupParityState {
  if (intent.type === 'repeatItemAddRequested') {
    const base = state.empty ? [] : state.items;
    return { ...state, empty: false, items: reduceRepeatable(base, intent) };
  }
  return { ...state, items: reduceRepeatable(state.items, intent) };
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
        collapsible: true,
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
      {
        id: 'medications',
        label: 'Current Eye Drops',
        collapsible: true,
        blocks: [
          {
            kind: 'repeatable',
            id: 'drops',
            label: 'Topical medications',
            addLabel: 'Add medication',
            fields: [
              { id: 'drug', label: 'Medication', type: 'text', span: 6, required: true, placeholder: 'e.g. Timolol 0.5%' },
              { id: 'freq', label: 'Frequency', type: 'text', span: 6, placeholder: 'e.g. Twice daily' },
            ],
          },
          {
            kind: 'matrix',
            id: 'anterior-chamber',
            label: 'Anterior Chamber Comparison',
            columns: [
              { id: 'od', label: 'Right (OD)' },
              { id: 'os', label: 'Left (OS)' },
            ],
            rows: [
              {
                id: 'ac-depth',
                label: 'AC depth',
                cells: {
                  od: { id: 'acOd', label: 'AC depth Right (OD)', type: 'text', required: true },
                  os: { id: 'acOs', label: 'AC depth Left (OS)', type: 'text' },
                },
              },
            ],
          },
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
    acOd: { value: 'Deep, quiet' },
    acOs: { value: 'Deep, quiet' },
  },
  repeatableGroups: {
    drops: [
      {
        id: 'drop-1',
        label: 'Medication 1',
        fields: {
          drug: { value: 'Timolol 0.5%' },
          freq: { value: 'Twice daily' },
        },
      },
    ],
  },
  collapsedSectionIds: [],
  sectionStatuses: {
    presenting: { label: 'In progress', tone: 'info' },
    medications: { label: '1 active', tone: 'success' },
  },
  readOnly: false,
};

export function reduceClinicalListParity(
  state: ClinicalListViewModel,
  intent: ClinicalListIntent,
): ClinicalListViewModel {
  switch (intent.type) {
    case 'selected':
      return { ...state, selectedId: intent.id };
    case 'editRequested':
      return {
        ...state,
        selectedId: intent.id,
        items: state.items.map((item) =>
          item.id === intent.id ? { ...item, meta: 'Edited' } : item,
        ),
      };
    case 'removeRequested':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== intent.id),
        selectedId: state.selectedId === intent.id ? undefined : state.selectedId,
      };
    case 'addRequested': {
      const max = state.items.reduce((acc, item) => {
        const match = /(\d+)$/.exec(item.id);
        const n = match ? Number(match[1]) : 0;
        return Number.isFinite(n) && n > acc ? n : acc;
      }, 0);
      const nextNum = max + 1;
      return {
        ...state,
        items: [
          ...state.items,
          {
            id: `c-${nextNum}`,
            title: `Added clinical entry ${nextNum}`,
            badges: [{ label: 'New', tone: 'info' }],
          },
        ],
      };
    }
    case 'retryRequested':
      return { ...state, error: '', loading: false };
    default:
      return state;
  }
}

function reduceClinicalFormParity(state: ClinicalFormViewModel, intent: ClinicalFormIntent): ClinicalFormViewModel {
  switch (intent.type) {
    case 'fieldEditRequested':
      return {
        ...state,
        fields: {
          ...state.fields,
          [intent.fieldId]: { ...state.fields[intent.fieldId], value: intent.value },
        },
      };
    case 'fieldStatusEditRequested':
      return {
        ...state,
        fields: {
          ...state.fields,
          [intent.fieldId]: {
            ...state.fields[intent.fieldId],
            value: state.fields[intent.fieldId]?.value ?? null,
            assessmentStatus: intent.status,
          },
        },
      };
    case 'sectionToggleRequested': {
      const collapsed = new Set(state.collapsedSectionIds ?? []);
      if (collapsed.has(intent.sectionId)) collapsed.delete(intent.sectionId);
      else collapsed.add(intent.sectionId);
      return { ...state, collapsedSectionIds: [...collapsed] };
    }
    case 'repeatItemAddRequested': {
      const existing = state.repeatableGroups[intent.groupId] ?? [];
      const taken = new Set(existing.map((it) => it.id));
      let seq = existing.length + 1;
      while (taken.has(`drop-${seq}`)) seq += 1;
      const nextItem: RepeatableItemState = {
        id: `drop-${seq}`,
        label: `Medication ${seq}`,
        fields: { drug: { value: '' }, freq: { value: '' } },
      };
      return {
        ...state,
        repeatableGroups: {
          ...state.repeatableGroups,
          [intent.groupId]: [...existing, nextItem],
        },
      };
    }
    case 'repeatItemRemoveRequested':
      return {
        ...state,
        repeatableGroups: {
          ...state.repeatableGroups,
          [intent.groupId]: (state.repeatableGroups[intent.groupId] ?? []).filter((it) => it.id !== intent.itemId),
        },
      };
    case 'repeatItemEditRequested':
      return {
        ...state,
        repeatableGroups: {
          ...state.repeatableGroups,
          [intent.groupId]: (state.repeatableGroups[intent.groupId] ?? []).map((it) =>
            it.id === intent.itemId
              ? { ...it, fields: { ...it.fields, [intent.fieldId]: { ...it.fields[intent.fieldId], value: intent.value } } }
              : it,
          ),
        },
      };
    case 'repeatItemStatusEditRequested':
      return {
        ...state,
        repeatableGroups: {
          ...state.repeatableGroups,
          [intent.groupId]: (state.repeatableGroups[intent.groupId] ?? []).map((it) =>
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
          ),
        },
      };
    case 'correctionRequested':
    case 'fieldFocused':
      return state;
  }
}

const MATRIX_SCHEMA: ClinicalMatrixSchema = {
  id: 'anterior-matrix',
  label: 'Bilateral Anterior Segment Matrix',
  description: 'Controller-driven bilateral ocular assessment',
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
      assessmentStatusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      ],
    },
    { id: 'iop', label: 'Applanation IOP', type: 'quantity', unit: 'mmHg', min: 0, max: 80, step: 1 },
    { id: 'cdr', label: 'Vertical cup-disc ratio', type: 'decimal', step: 0.05 },
    {
      id: 'schirmer',
      label: 'Schirmer baseline',
      type: 'integer',
      unit: 'mm',
      applicableColumnIds: ['od'],
      helpText: 'OD-only baseline check (OS is N/A)',
    },
    { id: 'cornea', label: 'Cornea & tear film', type: 'text', placeholder: 'Slit-lamp findings' },
  ],
};

const mCell = (value: ClinicalCellState['value'], extra: Partial<ClinicalCellState> = {}): ClinicalCellState => ({ value, ...extra });

const MATRIX_SEED_VALUES: ClinicalMatrixValues = {
  va: {
    remark: 'Snellen 6m',
    cells: {
      od: mCell('6/9', { assessmentStatus: { value: 'recorded', label: 'Recorded', tone: 'success' } }),
      os: mCell('6/6'),
    },
  },
  iop: {
    remark: 'GAT 09:45',
    cells: {
      od: mCell(
        { value: 24, unit: 'mmHg' },
        {
          warning: 'Above 21 mmHg',
          previousValueLabel: 'Prev: 18 mmHg',
          deltaLabel: '+6',
          flagBadge: { label: 'Elevated', tone: 'warning' },
          modified: true,
        },
      ),
      os: mCell({ value: 16, unit: 'mmHg' }),
    },
  },
  cdr: {
    remark: '90D lens',
    cells: {
      od: mCell(0.95, { error: 'Confirm optic disc excavation' }),
      os: mCell(0.45),
    },
  },
  schirmer: { remark: '', cells: { od: mCell(14) } },
  cornea: {
    remark: '',
    remarkError: 'Enter cornea remark before sign-off',
    cells: { od: mCell('Clear, deep AC'), os: mCell('Clear, deep AC') },
  },
};

interface ClinicalMatrixParityState {
  readonly values: ClinicalMatrixValues;
  readonly readOnly: boolean;
  readonly showRemarks: boolean;
}

function reduceMatrix(values: ClinicalMatrixValues, intent: ClinicalMatrixIntent): ClinicalMatrixValues {
  if (intent.type === 'cellEditRequested') {
    const row = values[intent.rowId] ?? { remark: '', cells: {} };
    return {
      ...values,
      [intent.rowId]: {
        ...row,
        cells: {
          ...row.cells,
          [intent.columnId]: {
            ...(row.cells[intent.columnId] ?? { value: null }),
            value: intent.value,
            modified: true,
          },
        },
      },
    };
  }
  if (intent.type === 'cellAssessmentStatusEditRequested') {
    const row = values[intent.rowId] ?? { remark: '', cells: {} };
    const statusObj = intent.status
      ? {
          value: intent.status,
          label: intent.status === 'recorded' ? 'Recorded' : 'Unable to assess',
          tone: (intent.status === 'recorded' ? 'success' : 'warning') as 'success' | 'warning',
        }
      : undefined;
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
    return {
      ...values,
      [intent.rowId]: {
        ...row,
        remark: intent.remark,
        remarkError: intent.rowId === 'cornea' && !intent.remark.trim() ? 'Enter cornea remark before sign-off' : undefined,
      },
    };
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
    <View aria-readonly={readOnly || undefined} style={readOnly ? { opacity: 0.65 } : undefined}>
      <EmrButton
        small
        variant="outline"
        label={`Stamp Shaffer IV · ${column.id.toUpperCase()} (${count})`}
        accessibilityLabel={`Stamp ${row.label} ${column.label}`}
        onPress={() => {
          if (!readOnly) emit('stamp', { columnId: column.id, next: count + 1 });
        }}
      />
    </View>
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
    description: 'Inferotemporal rim margin',
  },
  {
    layer: {
      id: 'l3',
      label: 'Macular exudate border',
      color: '#15803d',
      strokeWidth: 3,
      visible: false,
      tool: 'freeform',
      points: [{ x: 0.52, y: 0.48 }, { x: 0.58, y: 0.5 }],
    } as AnnotationLayerRecord,
    number: 3,
    classLabel: 'Exudate',
  },
];

interface AnnotationToolbarParityState {
  selectedToolId: string;
  selectedColourId: string;
  selectedWidthId: string;
  zoomPct: number;
  canUndo: boolean;
  canRedo: boolean;
  canSave: boolean;
  zoomLocked: boolean;
  readOnly: boolean;
  undoCount: number;
  redoCount: number;
  saveCount: number;
}

function buildToolbarParityModel(
  s: AnnotationToolbarParityState,
  globalReadOnly: boolean,
): AnnotationToolbarViewModel {
  return {
    ...TOOLBAR_SEED,
    selectedToolId: s.selectedToolId,
    selectedColourId: s.selectedColourId,
    selectedWidthId: s.selectedWidthId,
    zoomLabel: `${s.zoomPct}%`,
    canUndo: s.canUndo,
    canRedo: s.canRedo,
    canSave: s.canSave,
    zoomLocked: s.zoomLocked,
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceToolbarParity(
  s: AnnotationToolbarParityState,
  i: AnnotationToolbarIntent,
  globalReadOnly: boolean,
): AnnotationToolbarParityState {
  const locked = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'toolSelected':
      return locked ? s : { ...s, selectedToolId: i.toolId };
    case 'colourSelected':
      return locked ? s : { ...s, selectedColourId: i.colourId };
    case 'widthSelected':
      return locked ? s : { ...s, selectedWidthId: i.widthId };
    case 'undoRequested':
      return locked || !s.canUndo ? s : { ...s, undoCount: s.undoCount + 1 };
    case 'redoRequested':
      return locked || !s.canRedo ? s : { ...s, redoCount: s.redoCount + 1 };
    case 'saveRequested':
      return locked || !s.canSave ? s : { ...s, saveCount: s.saveCount + 1 };
    case 'zoomInRequested':
      return s.zoomLocked ? s : { ...s, zoomPct: Math.min(400, s.zoomPct + 25) };
    case 'zoomOutRequested':
      return s.zoomLocked ? s : { ...s, zoomPct: Math.max(25, s.zoomPct - 25) };
    case 'zoomResetRequested':
    case 'zoomFitRequested':
      return s.zoomLocked ? s : { ...s, zoomPct: 100 };
    default:
      return s;
  }
}

interface AnnotationListParityState {
  items: readonly AnnotationListItem[];
  selectedLayerId?: string;
  canLock: boolean;
  readOnly: boolean;
}

function reduceAnnotationListParity(
  s: AnnotationListParityState,
  i: AnnotationListIntent,
  globalReadOnly: boolean,
): AnnotationListParityState {
  const locked = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'layerSelected':
      return s.items.some((it) => it.layer.id === i.layerId)
        ? { ...s, selectedLayerId: i.layerId }
        : s;
    case 'layerVisibilityToggleRequested':
      if (locked) return s;
      return {
        ...s,
        items: s.items.map((it) =>
          it.layer.id === i.layerId ? { ...it, layer: { ...it.layer, visible: !it.layer.visible } } : it,
        ),
      };
    case 'layerLockToggleRequested':
      if (locked || !s.canLock) return s;
      return {
        ...s,
        items: s.items.map((it) => (it.layer.id === i.layerId ? { ...it, locked: !it.locked } : it)),
      };
    case 'layerMoveRequested': {
      if (locked) return s;
      const idx = s.items.findIndex((it) => it.layer.id === i.layerId);
      if (idx < 0 || s.items[idx].locked) return s;
      const target = idx + (i.direction === 'up' ? -1 : 1);
      if (target < 0 || target >= s.items.length) return s;
      const next = [...s.items];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...s, items: next.map((it, n) => ({ ...it, number: n + 1 })) };
    }
    case 'layerRemoveRequested': {
      if (locked) return s;
      const item = s.items.find((it) => it.layer.id === i.layerId);
      if (!item || item.locked) return s;
      const next = s.items
        .filter((it) => it.layer.id !== i.layerId)
        .map((it, idx) => ({ ...it, number: idx + 1 }));
      const selectedLayerId =
        s.selectedLayerId === i.layerId ? next[0]?.layer.id : s.selectedLayerId;
      return { ...s, items: next, selectedLayerId };
    }
    default:
      return s;
  }
}

interface ImageTemplatePickerParityState {
  readonly selectedTemplateId: string;
  readonly search: string;
  readonly category: string;
  readonly favouritesOnly: boolean;
  readonly favouriteIds: readonly string[];
  readonly readOnly: boolean;
  readonly canEditFavourites: boolean;
}

function buildImageTemplatePickerParityModel(
  state: ImageTemplatePickerParityState,
  globalReadOnly: boolean,
): ImageTemplatePickerViewModel {
  const effectiveGroupId = state.favouritesOnly
    ? FAVOURITES_GROUP_ID
    : state.category && state.category !== 'all'
      ? state.category
      : undefined;
  const options = filterImageTemplates(
    ALL_TEMPLATES,
    state.search,
    effectiveGroupId,
    TEMPLATE_GROUPS,
    state.favouriteIds,
  );
  return {
    title: 'Select anatomical drawing outline',
    options,
    groups: TEMPLATE_GROUPS,
    selectedGroupId: effectiveGroupId,
    query: state.search,
    selectedId: state.selectedTemplateId,
    totalLabel: `${options.length} of ${ALL_TEMPLATES.length} outlines`,
    emptyMessage: 'No matching outlines',
    readOnly: globalReadOnly || state.readOnly,
    favouriteIds: state.favouriteIds,
    canEditFavourites: state.canEditFavourites,
  };
}

function reduceImageTemplatePickerParity(
  s: ImageTemplatePickerParityState,
  i: ImageTemplatePickerIntent,
  globalReadOnly: boolean,
): ImageTemplatePickerParityState {
  const locked = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'queryChangeRequested':
      return { ...s, search: i.query };
    case 'groupSelected':
      if (i.groupId === FAVOURITES_GROUP_ID) {
        return { ...s, favouritesOnly: true };
      }
      if (i.groupId === null) {
        return { ...s, favouritesOnly: false, category: 'all' };
      }
      return { ...s, favouritesOnly: false, category: i.groupId };
    case 'templateSelected':
      if (locked) return s;
      return { ...s, selectedTemplateId: i.templateId };
    case 'favouriteToggleRequested':
      if (locked || !s.canEditFavourites) return s;
      return {
        ...s,
        favouriteIds: i.favourite
          ? [...s.favouriteIds.filter((x) => x !== i.templateId), i.templateId]
          : s.favouriteIds.filter((x) => x !== i.templateId),
      };
    case 'closeRequested':
      return s;
  }
}

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

const TIME_AXIS_HOURLY = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'] as const;
const TIME_AXIS_HALF_HOURLY = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] as const;
const TIME_AXIS_STEPS = [
  { id: '60', label: 'Hourly' },
  { id: '30', label: '30 min' },
] as const;

interface TimeAxisParityState {
  offset: number;
  selectedTickId: string;
  stepId: string;
  windowStartLabel: string;
  readOnly: boolean;
}

function resolveTimeAxisSource(stepId: string): readonly string[] {
  return stepId === '30' ? TIME_AXIS_HALF_HOURLY : TIME_AXIS_HOURLY;
}

function buildTimeAxisParityModel(s: TimeAxisParityState, globalReadOnly: boolean): TimeAxisViewModel {
  const source = resolveTimeAxisSource(s.stepId);
  const offset = Math.max(0, Math.min(source.length - 5, s.offset));
  const step = TIME_AXIS_STEPS.find((opt) => opt.id === s.stepId);
  return {
    id: 'parity-axis',
    title: 'IOP diurnal curve window',
    ticks: source.slice(offset, offset + 5).map((label, idx) => ({
      id: `t${offset + idx}`,
      label,
      sublabel: 'Day 1',
      current: offset + idx === 2,
    })),
    selectedTickId: s.selectedTickId,
    stepLabel: step?.label,
    steps: TIME_AXIS_STEPS,
    selectedStepId: s.stepId,
    canShiftEarlier: offset > 0,
    canShiftLater: offset + 5 < source.length,
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceTimeAxisParity(
  s: TimeAxisParityState,
  i: TimeAxisIntent,
  globalReadOnly: boolean,
): TimeAxisParityState {
  if (globalReadOnly || s.readOnly) return s;
  const source = resolveTimeAxisSource(s.stepId);
  const maxOffset = Math.max(0, source.length - 5);
  switch (i.type) {
    case 'tickSelected':
      return { ...s, selectedTickId: i.tickId };
    case 'shiftEarlierRequested': {
      const nextOffset = Math.max(0, s.offset - 1);
      return { ...s, offset: nextOffset, windowStartLabel: source[nextOffset] ?? '08:00' };
    }
    case 'shiftLaterRequested': {
      const nextOffset = Math.min(maxOffset, s.offset + 1);
      return { ...s, offset: nextOffset, windowStartLabel: source[nextOffset] ?? '08:00' };
    }
    case 'stepChangeRequested': {
      const nextSource = resolveTimeAxisSource(i.stepId);
      const offset = Math.max(0, Math.min(nextSource.length - 5, s.offset));
      return { ...s, stepId: i.stepId, windowStartLabel: nextSource[offset] ?? '08:00' };
    }
  }
}

const TABLE_COLUMNS = [
  { id: 'patient', label: 'Patient', sortable: true, width: 150 },
  { id: 'centre', label: 'Vision Centre', sortable: true },
  { id: 'date', label: 'Referred', sortable: true, align: 'end' as const, width: 120 },
  { id: 'status', label: 'Status' },
];

const TABLE_SOURCE = [
  { id: 'r1', patient: 'Ananya Rao', centre: 'Vision Centre North', date: '11 Oct 2026', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'r2', patient: 'Aarav Sharma', centre: 'District Eye Unit', date: '12 Oct 2026', status: { label: 'Accepted', tone: 'success' as const } },
  { id: 'r3', patient: 'Meera Iyer', centre: 'Community Screening', date: '13 Oct 2026', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'r4', patient: 'Rohan Nair', centre: 'Vision Centre North', date: '14 Oct 2026', status: { label: 'Declined', tone: 'danger' as const } },
  { id: 'r5', patient: 'Kavita Verma', centre: 'District Eye Unit', date: '15 Oct 2026', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'r6', patient: 'Vikram Patel', centre: 'Rampur Vision Centre', date: '16 Oct 2026', status: { label: 'Accepted', tone: 'success' as const } },
  { id: 'r7', patient: 'Priya Menon', centre: 'Community Screening', date: '17 Oct 2026', status: { label: 'Booked', tone: 'info' as const } },
  { id: 'r8', patient: 'Suresh Das', centre: 'Rampur Vision Centre', date: '18 Oct 2026', status: { label: 'Pending', tone: 'warning' as const } },
];

interface DataTableParityState {
  readonly sortColumnId?: string;
  readonly sortDirection?: 'asc' | 'desc';
  readonly selectedIds: readonly string[];
  readonly selectedRowCount: number;
  readonly density: 'comfortable' | 'compact';
  readonly pendingOnly: boolean;
  readonly customSavedFilter: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly loading: boolean;
  readonly error: string;
  readonly readOnly: boolean;
}

function buildDataTableParityModel(s: DataTableParityState, globalReadOnly: boolean) {
  const filtered = TABLE_SOURCE.filter((r) => !s.pendingOnly || r.status.label === 'Pending');
  const sorted = s.sortColumnId && s.sortDirection
    ? [...filtered].sort((a, b) => {
        const av = s.sortColumnId === 'centre' ? a.centre : s.sortColumnId === 'date' ? a.date : a.patient;
        const bv = s.sortColumnId === 'centre' ? b.centre : s.sortColumnId === 'date' ? b.date : b.patient;
        return av.localeCompare(bv) * (s.sortDirection === 'asc' ? 1 : -1);
      })
    : filtered;
  const pageCount = Math.max(1, Math.ceil(sorted.length / s.pageSize));
  const currentPage = Math.min(Math.max(1, s.page), pageCount);
  const start = (currentPage - 1) * s.pageSize;
  const slice = sorted.slice(start, start + s.pageSize);
  const rows: EmrDataTableRow[] = slice.map((r) => ({
    id: r.id,
    cells: { patient: r.patient, centre: r.centre, date: r.date, status: { text: '', badge: r.status } },
  }));
  const first = slice.length > 0 ? start + 1 : 0;
  const last = slice.length > 0 ? start + slice.length : 0;
  return {
    caption: 'Vision centre surgical referrals',
    columns: TABLE_COLUMNS,
    rows,
    selectedIds: [...s.selectedIds],
    sort: s.sortColumnId && s.sortDirection ? { columnId: s.sortColumnId, direction: s.sortDirection } : undefined,
    filters: s.pendingOnly ? [{ id: 'pending', label: 'Status', valueLabel: 'Pending' }] : [],
    savedFilters: s.customSavedFilter
      ? [
          { id: 'pending', label: 'Pending only' },
          { id: 'custom', label: 'Current view (saved)' },
        ]
      : [{ id: 'pending', label: 'Pending only' }],
    bulkActions: [{ id: 'accept', label: 'Accept selected' }],
    density: s.density,
    page: currentPage,
    pageCount,
    pageSize: s.pageSize,
    pageSizeOptions: [3, 5, 10],
    summaryLabel: slice.length > 0 ? `Showing ${first}–${last} of ${sorted.length} referrals` : 'Showing 0 of 0 referrals',
    status: s.loading ? ('loading' as const) : s.error ? ('error' as const) : ('ready' as const),
    error: s.error || undefined,
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceDataTableParity(
  s: DataTableParityState,
  i: EmrDataTableIntent,
  globalReadOnly: boolean,
): DataTableParityState {
  const ro = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'sortChanged':
      return { ...s, sortColumnId: i.columnId, sortDirection: i.direction, page: 1 };
    case 'selectionChanged':
      return ro ? s : { ...s, selectedIds: i.selectedIds, selectedRowCount: i.selectedIds.length };
    case 'densityChanged':
      return { ...s, density: i.density };
    case 'savedFilterSelected':
      return { ...s, pendingOnly: true, page: 1 };
    case 'filterAddRequested':
      return ro ? s : { ...s, pendingOnly: true, page: 1 };
    case 'filterRemoved':
      return ro ? s : { ...s, pendingOnly: false, page: 1 };
    case 'saveFilterRequested':
      return ro ? s : { ...s, customSavedFilter: true };
    case 'bulkActionRequested':
      return ro ? s : { ...s, selectedIds: [], selectedRowCount: 0 };
    case 'pageChanged':
      return { ...s, page: i.page };
    case 'pageSizeChanged':
      return { ...s, pageSize: i.pageSize, page: 1 };
    case 'retryRequested':
      return { ...s, loading: false, error: '' };
    case 'exportRequested':
    case 'rowActivated':
      return s;
  }
}

interface SplitWorkspaceParityState {
  readonly preset: EmrSplitWorkspacePreset;
  readonly pane1Pct: number;
  readonly pane2Pct: number;
  readonly pane3Pct: number;
  readonly pane1Collapsed: boolean;
  readonly pane2Collapsed: boolean;
  readonly pane3Collapsed: boolean;
  readonly mobileActivePaneId: string;
  readonly readOnly: boolean;
}

const SPLIT_WORKSPACE_PARITY_PANES: readonly EmrSplitWorkspacePane[] = [
  {
    id: 'pane-chart',
    slot: 'pane-primary',
    title: 'Chart Review & Prior Visits',
    subtitle: 'Last seen 4 weeks ago',
    badge: { label: '3 Prior OCTs', tone: 'info' },
    collapsible: true,
    minWidthPct: 20,
    summaryItems: ['BCVA OD 6/18 · OS 6/6', 'Baseline CST OD 510 µm -> 412 µm'],
  },
  {
    id: 'pane-note',
    slot: 'pane-secondary',
    title: 'Active Encounter Note & Orders',
    subtitle: 'SOAP + Intravitreal Procedure Order',
    badge: { label: 'Draft in Progress', tone: 'warning' },
    collapsible: true,
    minWidthPct: 25,
    summaryItems: ['Assessment: Centre-involving DME OD responding to anti-VEGF therapy.'],
  },
  {
    id: 'pane-cds',
    slot: 'pane-tertiary',
    title: 'PACS Key Images & CDS',
    subtitle: 'DICOMweb + Care Gaps',
    badge: { label: '1 Care Alert', tone: 'success' },
    collapsible: true,
    minWidthPct: 15,
    summaryItems: ['Pre-procedure povidone-iodine 5% checklist verified.'],
  },
];

function buildSplitWorkspaceParityModel(
  s: SplitWorkspaceParityState,
  globalReadOnly: boolean,
): EmrSplitWorkspaceViewModel {
  const collapsedById: Readonly<Record<string, boolean>> = {
    'pane-chart': s.pane1Collapsed,
    'pane-note': s.pane2Collapsed,
    'pane-cds': s.pane3Collapsed,
  };
  const visibleCount = s.preset === '3-pane' ? 3 : 2;
  const fallbackSizes = resolveSplitWorkspacePresetSizes(s.preset, visibleCount);
  const rawSizes =
    visibleCount === 3
      ? [s.pane1Pct, s.pane2Pct, s.pane3Pct]
      : [s.pane1Pct, s.pane2Pct];
  const sum = rawSizes.reduce((acc, v) => acc + v, 0);
  const paneSizes = sum === 100 ? rawSizes : fallbackSizes;

  return {
    id: 'ws-encounter-retina',
    title: 'Vitreoretinal Encounter Split Workstation',
    preset: s.preset,
    paneSizes,
    mobileActivePaneId: s.mobileActivePaneId,
    panes: SPLIT_WORKSPACE_PARITY_PANES.map((pane) => ({
      ...pane,
      collapsed: Boolean(collapsedById[pane.id]),
    })),
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceSplitWorkspaceParity(
  s: SplitWorkspaceParityState,
  i: EmrSplitWorkspaceIntent,
  globalReadOnly: boolean,
): SplitWorkspaceParityState {
  const ro = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'presetChanged':
      return ro
        ? s
        : {
            ...s,
            preset: i.preset,
            pane1Pct: i.paneSizes[0] ?? 50,
            pane2Pct: i.paneSizes[1] ?? 50,
            pane3Pct: i.paneSizes[2] ?? s.pane3Pct,
          };
    case 'paneResized':
      return ro
        ? s
        : {
            ...s,
            pane1Pct: i.paneSizes[0] ?? s.pane1Pct,
            pane2Pct: i.paneSizes[1] ?? s.pane2Pct,
            pane3Pct: i.paneSizes[2] ?? s.pane3Pct,
          };
    case 'paneCollapsedToggled':
      return ro
        ? s
        : {
            ...s,
            pane1Collapsed: i.paneId === 'pane-chart' ? i.collapsed : s.pane1Collapsed,
            pane2Collapsed: i.paneId === 'pane-note' ? i.collapsed : s.pane2Collapsed,
            pane3Collapsed: i.paneId === 'pane-cds' ? i.collapsed : s.pane3Collapsed,
          };
    case 'mobilePaneSelected':
      return { ...s, mobileActivePaneId: i.paneId };
  }
}

interface CommandPaletteParityState {
  readonly presentation: EmrCommandPalettePresentation;
  readonly open: boolean;
  readonly query: string;
  readonly activeCategory: EmrCommandCategory;
  readonly activeIndex: number;
  readonly lastCommandId: string;
  readonly readOnly: boolean;
}

const COMMAND_PALETTE_PARITY_ITEMS: readonly EmrCommandItem[] = [
  {
    id: 'cmd-oct',
    label: 'Order Spectral-Domain OCT Macula (OU)',
    subtitle: 'Diagnostics · Ophthalmic Imaging',
    category: 'orders',
    groupLabel: 'Pinned Quick Orders',
    shortcut: 'Ctrl+O',
    pinned: true,
    badge: { label: 'STAT Eligible', tone: 'info' },
  },
  {
    id: 'cmd-sle',
    label: '.sle-pseudophakia — Insert normal pseudophakic anterior segment exam',
    subtitle: 'SmartPhrase · Ophthalmology',
    category: 'smartphrases',
    shortcut: '.sle',
    recent: true,
  },
  {
    id: 'cmd-iop-calc',
    label: 'Corrected IOP Calculator (Pachymetry CCT adjustment)',
    subtitle: 'Clinical Calculator · Glaucoma',
    category: 'calculators',
    shortcut: 'Alt+I',
  },
  {
    id: 'cmd-mar',
    label: 'Jump to eMAR Medication Administration Grid',
    subtitle: 'Navigation · Inpatient Flowsheet',
    category: 'navigation',
    shortcut: 'G M',
  },
  {
    id: 'cmd-sign',
    label: 'Co-Sign Selected Encounter Orders (Locked)',
    subtitle: 'Requires attending credentials',
    category: 'actions',
    disabled: true,
    badge: { label: 'Locked', tone: 'neutral' },
  },
];

function buildCommandPaletteParityModel(
  s: CommandPaletteParityState,
  globalReadOnly: boolean,
): EmrCommandPaletteViewModel {
  return {
    id: 'cmd-launcher',
    title: 'Clinical Workstation Command Palette (Cmd+K)',
    presentation: s.presentation,
    open: s.open,
    query: s.query,
    activeCategory: s.activeCategory,
    activeIndex: s.activeIndex,
    items: COMMAND_PALETTE_PARITY_ITEMS,
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceCommandPaletteParity(
  s: CommandPaletteParityState,
  i: EmrCommandPaletteIntent,
  globalReadOnly: boolean,
): CommandPaletteParityState {
  const ro = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'queryChanged':
      return ro ? s : { ...s, query: i.query, activeIndex: 0 };
    case 'categoryChanged':
      return ro ? s : { ...s, activeCategory: i.category, activeIndex: 0 };
    case 'itemHighlighted':
      return { ...s, activeIndex: i.index };
    case 'commandExecuted':
      return ro ? s : { ...s, lastCommandId: i.itemId };
    case 'dismissed':
      return { ...s, open: false };
  }
}

interface MasterDetailParityState {
  readonly searchQuery: string;
  readonly activeFilterId: string;
  readonly selectedId: string;
  readonly checkedIds: readonly string[];
  readonly checkedCount: number;
  readonly mobileDetailOpen: boolean;
  readonly lastAction: string;
  readonly readOnly: boolean;
}

const MASTER_DETAIL_PARITY_ITEMS: readonly EmrMasterDetailItem[] = [
  {
    id: 'inb-1',
    title: 'Critical Post-Op IOP Spike: 38 mmHg OD',
    subtitle: 'Ramesh Nair (64M · UHID-2026-8812)',
    timestampLabel: '6m ago',
    unread: true,
    filterId: 'critical',
    priorityBadge: { label: 'CRITICAL', tone: 'danger' },
    statusBadge: { label: 'Action Required', tone: 'warning' },
    summaryFields: [
      { label: 'Eye', value: 'Right Eye (OD)' },
      { label: 'IOP', value: '38 mmHg' },
      { label: 'Procedure', value: 'PPV + Silicone Oil POD 1' },
    ],
    detailBody: 'Recommend stat oral Acetazolamide 250 mg + topical Timolol/Dorzolamide OD.',
    actions: [{ id: 'order-lowering', label: 'Order IOP-Lowering Protocol', primary: true }],
  },
  {
    id: 'inb-2',
    title: 'Co-Sign Resident Operative Note: Phaco + Toric PCIOL OS',
    subtitle: 'Ananya Sharma (58F · UHID-2026-44109)',
    timestampLabel: '35m ago',
    unread: true,
    filterId: 'cosign',
    statusBadge: { label: 'Awaiting Co-Sign', tone: 'info' },
    summaryFields: [
      { label: 'Eye', value: 'Left Eye (OS)' },
      { label: 'IOL', value: '+21.5 D Toric T3' },
    ],
    detailBody: 'Uneventful sutureless temporal clear corneal phacoemulsification.',
    actions: [{ id: 'cosign-note', label: 'Co-Sign Operative Note', primary: true }],
  },
  {
    id: 'inb-3',
    title: 'OCT Macula Quality Review Complete (OU)',
    subtitle: 'Karthik Rao (71M · UHID-2026-10932)',
    timestampLabel: '2h ago',
    unread: false,
    filterId: 'all',
    statusBadge: { label: 'Verified', tone: 'success' },
    summaryFields: [
      { label: 'Signal Strength', value: '9/10 OU' },
      { label: 'CST OD', value: '312 um' },
    ],
    detailBody: 'Reduced intraretinal fluid compared to baseline scan from 4 weeks ago.',
  },
];

function buildMasterDetailParityModel(
  s: MasterDetailParityState,
  globalReadOnly: boolean,
): EmrMasterDetailViewModel {
  return {
    id: 'md-inbox',
    title: 'Physician Results, Critical Alerts & Co-Sign Work Queue',
    subtitle: 'Vitreoretinal & Glaucoma Unit II · 3 items',
    searchQuery: s.searchQuery,
    activeFilterId: s.activeFilterId,
    selectedId: s.selectedId,
    checkedIds: [...s.checkedIds],
    mobileDetailOpen: s.mobileDetailOpen,
    filters: [
      { id: 'all', label: 'All Items', count: 3 },
      { id: 'critical', label: 'Critical Alerts', count: 1 },
      { id: 'cosign', label: 'Co-Sign', count: 1 },
    ],
    batchActions: [{ id: 'batch-ack', label: 'Acknowledge Selected', primary: true }],
    items: MASTER_DETAIL_PARITY_ITEMS,
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceMasterDetailParity(
  s: MasterDetailParityState,
  i: EmrMasterDetailIntent,
  globalReadOnly: boolean,
): MasterDetailParityState {
  const ro = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'searchChanged':
      return ro ? s : { ...s, searchQuery: i.query };
    case 'filterChanged':
      return ro ? s : { ...s, activeFilterId: i.filterId };
    case 'itemSelected':
      return { ...s, selectedId: i.itemId, mobileDetailOpen: true };
    case 'detailClosed':
      return { ...s, mobileDetailOpen: false };
    case 'batchSelectionToggled':
      return ro
        ? s
        : { ...s, checkedIds: [...i.checkedIds], checkedCount: i.checkedIds.length };
    case 'actionTriggered':
      return ro ? s : { ...s, lastAction: `${i.actionId}:${i.itemIds.length}` };
  }
}

interface SynchronizedTimeGridParityState {
  readonly resolution: EmrTimeGridResolution;
  readonly scrollOffset: number;
  readonly visibleColumnCount: number;
  readonly selectedColumnId: string;
  readonly selectedCellKey: string;
  readonly vitalsCollapsed: boolean;
  readonly trendCollapsed: boolean;
  readonly medsCollapsed: boolean;
  readonly readOnly: boolean;
}

const TIME_GRID_PARITY_COLUMNS: readonly EmrTimeGridColumn[] = [
  { id: 'c08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'AM' },
  { id: 'c09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', shiftBadge: 'AM' },
  { id: 'c10', timestamp: '2026-11-12T10:00:00Z', label: '10:00', shiftBadge: 'AM', isCurrentTime: true },
  { id: 'c11', timestamp: '2026-11-12T11:00:00Z', label: '11:00', shiftBadge: 'AM' },
  { id: 'c12', timestamp: '2026-11-12T12:00:00Z', label: '12:00', shiftBadge: 'PM' },
  { id: 'c13', timestamp: '2026-11-12T13:00:00Z', label: '13:00', shiftBadge: 'PM' },
];

const TIME_GRID_PARITY_TRACKS: readonly EmrTimeGridTrack[] = [
  {
    id: 'trk-vitals',
    title: 'Observation Flowsheet (IOP & Vitals)',
    kind: 'vitals',
    badge: { label: 'Ward Live', tone: 'info' },
    rows: [
      {
        id: 'r-iop-od',
        label: 'IOP Right Eye (OD)',
        unitLabel: 'mmHg',
        referenceRangeLabel: '10–21 mmHg',
        cells: {
          c08: { columnId: 'c08', valueLabel: '34', abnormalTone: 'danger', badge: { label: 'STAT', tone: 'danger' }, note: 'Post-op spike' },
          c09: { columnId: 'c09', valueLabel: '26', abnormalTone: 'warning', note: 'Post Acetazolamide' },
          c10: { columnId: 'c10', valueLabel: '18', abnormalTone: 'success', badge: { label: 'Target', tone: 'success' } },
          c11: { columnId: 'c11', valueLabel: '17', abnormalTone: 'neutral' },
          c12: { columnId: 'c12', valueLabel: '16', abnormalTone: 'info' },
          c13: { columnId: 'c13', valueLabel: '16', abnormalTone: 'success' },
        },
      },
    ],
  },
  {
    id: 'trk-trend',
    title: 'Macular CST Trend (Sparkline)',
    kind: 'trend',
    badge: { label: 'OCT', tone: 'neutral' },
    rows: [
      {
        id: 'r-cst-od',
        label: 'Central Subfield Thickness',
        unitLabel: 'um',
        cells: {
          c08: { columnId: 'c08', valueLabel: '440', sparklineNorm: 0.92, abnormalTone: 'warning' },
          c09: { columnId: 'c09', valueLabel: '412', sparklineNorm: 0.76 },
          c10: { columnId: 'c10', valueLabel: '380', sparklineNorm: 0.58, abnormalTone: 'info' },
          c11: { columnId: 'c11', valueLabel: '348', sparklineNorm: 0.42 },
          c12: { columnId: 'c12', valueLabel: '332', sparklineNorm: 0.34, abnormalTone: 'success' },
          c13: { columnId: 'c13', valueLabel: '320', sparklineNorm: 0.28, abnormalTone: 'success' },
        },
      },
    ],
  },
  {
    id: 'trk-meds',
    title: 'eMAR Administrations',
    kind: 'medications',
    badge: { label: 'Active', tone: 'success' },
    rows: [
      {
        id: 'r-acetazolamide',
        label: 'Acetazolamide 250 mg PO',
        unitLabel: 'STAT',
        cells: {
          c08: { columnId: 'c08', valueLabel: 'Given', secondaryLabel: 'BCMA 08:12', badge: { label: 'Verified', tone: 'success' } },
          c12: { columnId: 'c12', valueLabel: 'Due', secondaryLabel: '250 mg PO', badge: { label: 'Due', tone: 'warning' } },
        },
      },
    ],
  },
];

function buildSynchronizedTimeGridParityModel(
  s: SynchronizedTimeGridParityState,
  globalReadOnly: boolean,
): EmrSynchronizedTimeGridViewModel {
  const parts = s.selectedCellKey ? s.selectedCellKey.split(':') : [];
  const selectedCell =
    parts.length === 3
      ? { trackId: parts[0]!, rowId: parts[1]!, columnId: parts[2]! }
      : undefined;
  const scrollOffset = clampTimeGridScrollOffset(
    s.scrollOffset,
    TIME_GRID_PARITY_COLUMNS.length,
    s.visibleColumnCount,
  );
  return {
    id: 'stg-icu-ophth',
    title: 'Synchronized Longitudinal Time Grid (Vitals, IOP Trend & eMAR)',
    subtitle: 'Ophthalmic High-Dependency Ward',
    resolution: s.resolution,
    availableResolutions: ['15m', '1h', '4h', '24h'],
    scrollOffset,
    visibleColumnCount: s.visibleColumnCount,
    selectedColumnId: s.selectedColumnId,
    selectedCell,
    columns: TIME_GRID_PARITY_COLUMNS,
    tracks: TIME_GRID_PARITY_TRACKS.map((trk) => ({
      ...trk,
      collapsed:
        trk.id === 'trk-vitals'
          ? s.vitalsCollapsed
          : trk.id === 'trk-trend'
            ? s.trendCollapsed
            : s.medsCollapsed,
    })),
    readOnly: globalReadOnly || s.readOnly,
  };
}

function reduceSynchronizedTimeGridParity(
  s: SynchronizedTimeGridParityState,
  i: EmrSynchronizedTimeGridIntent,
  globalReadOnly: boolean,
): SynchronizedTimeGridParityState {
  const ro = globalReadOnly || s.readOnly;
  switch (i.type) {
    case 'resolutionChanged':
      return ro ? s : { ...s, resolution: i.resolution };
    case 'scrollOffsetChanged':
      return ro
        ? s
        : {
            ...s,
            scrollOffset: clampTimeGridScrollOffset(
              i.offset,
              TIME_GRID_PARITY_COLUMNS.length,
              s.visibleColumnCount,
            ),
          };
    case 'columnSelected':
      return { ...s, selectedColumnId: i.columnId };
    case 'trackToggled':
      return {
        ...s,
        vitalsCollapsed: i.trackId === 'trk-vitals' ? i.collapsed : s.vitalsCollapsed,
        trendCollapsed: i.trackId === 'trk-trend' ? i.collapsed : s.trendCollapsed,
        medsCollapsed: i.trackId === 'trk-meds' ? i.collapsed : s.medsCollapsed,
      };
    case 'cellSelected':
      return {
        ...s,
        selectedColumnId: i.columnId,
        selectedCellKey: `${i.trackId}:${i.rowId}:${i.columnId}`,
      };
  }
}

// ---- Shared L6 fixtures --------------------------------------------------------------------

const L6_SOURCES: readonly TerminologySource[] = [
  { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true, supportsPagination: true, versionLabel: '2.78' },
  { id: 'snomed', kind: 'snomed-ct', label: 'SNOMED CT', available: true, supportsPagination: true, versionLabel: '2025-01' },
  { id: 'icd10', kind: 'icd-10', label: 'ICD-10-CM', available: true, supportsPagination: true, versionLabel: '2025' },
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

const ICD_GLAUCOMA: TerminologyConcept = {
  sourceId: 'icd10',
  system: 'http://hl7.org/fhir/sid/icd-10-cm',
  code: 'H40.1112',
  display: 'Primary open-angle glaucoma, right eye, moderate stage',
  version: '2025',
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

const L6_CONCEPTS: readonly TerminologyConcept[] = [LOINC_IOP, LOINC_WEIGHT, ICD_GLAUCOMA, UCUM_MMHG];

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

type FieldGeneratorParityState = FieldGeneratorViewModel & {
  readonly type: ClinicalFieldType;
  readonly readOnly: boolean;
  readonly error: string;
};

function createInitialFieldGeneratorState(): FieldGeneratorParityState {
  return {
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
    type: 'quantity',
    sources: L6_SOURCES,
    terminologySearches: {},
    validationErrors: {},
    saving: false,
    dirty: false,
    error: '',
    readOnly: false,
  };
}

function reduceFieldGenerator(
  prev: FieldGeneratorParityState,
  i: FieldGeneratorIntent,
): FieldGeneratorParityState {
  switch (i.type) {
    case 'draftPatched': {
      const nextDraft = { ...prev.draft, ...i.changes };
      return { ...prev, draft: nextDraft, type: nextDraft.type, dirty: true };
    }
    case 'validationRuleAdded':
      return {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          validationRules: [
            ...prev.draft.validationRules,
            { ...i.rule, id: `r-${prev.draft.validationRules.length + 1}` },
          ],
        },
      };
    case 'validationRuleRemoved':
      return {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          validationRules: prev.draft.validationRules.filter((r) => r.id !== i.ruleId),
        },
      };
    case 'terminologySearchOpened':
    case 'terminologyRetryRequested': {
      const existing = prev.terminologySearches[i.role];
      const sourceId = ('sourceId' in i && i.sourceId) || existing?.sourceId || 'loinc';
      const opts = L6_CONCEPTS.filter((c) => c.sourceId === sourceId || sourceId === 'snomed');
      return {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [i.role]: {
            sourceId,
            role: i.role,
            query: existing?.query ?? '',
            options: opts,
            page: 1,
            pageSize: 10,
            total: opts.length,
            loading: false,
          },
        },
      };
    }
    case 'terminologyQueryChanged': {
      const existing = prev.terminologySearches[i.role] ?? {
        sourceId: 'loinc',
        role: i.role,
        query: '',
        options: [],
        page: 1,
        pageSize: 10,
        total: 0,
        loading: false,
      };
      return {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [i.role]: {
            ...existing,
            query: i.query,
          },
        },
      };
    }
    case 'terminologySearchRequested': {
      const existing = prev.terminologySearches[i.role];
      const q = (existing?.query ?? '').trim().toLowerCase();
      const opts = L6_CONCEPTS.filter(
        (c) => !q || c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      );
      return {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [i.role]: {
            sourceId: existing?.sourceId ?? 'loinc',
            role: i.role,
            query: existing?.query ?? '',
            options: opts,
            page: 1,
            pageSize: 10,
            total: opts.length,
            loading: false,
          },
        },
      };
    }
    case 'terminologyPageChanged': {
      const existing = prev.terminologySearches[i.role];
      if (!existing) return prev;
      return {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [i.role]: { ...existing, page: i.page },
        },
      };
    }
    case 'terminologyConceptSelected': {
      const id = `b-${i.concept.sourceId}-${i.concept.code}`;
      return {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          terminologyBindings: [
            ...prev.draft.terminologyBindings.filter((b) => b.id !== id),
            { id, role: i.role, concept: i.concept, strength: i.strength ?? 'preferred' },
          ],
        },
      };
    }
    case 'terminologyBindingRemoved':
      return {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          terminologyBindings: prev.draft.terminologyBindings.filter((b) => b.id !== i.bindingId),
        },
      };
    case 'saveRequested':
      return { ...prev, dirty: false, savedFieldId: prev.draft.id };
    case 'resetRequested':
      return createInitialFieldGeneratorState();
  }
}

type TerminologySearchParityState = TerminologySearchViewModel & {
  readonly sourceId: string;
  readonly loading: boolean;
  readonly error: string;
  readonly readOnly: boolean;
};

function reduceTerminologySearch(
  prev: TerminologySearchParityState,
  i: TerminologySearchIntent,
): TerminologySearchParityState {
  switch (i.type) {
    case 'terminologySearchOpened':
    case 'terminologyRetryRequested': {
      const sourceId = ('sourceId' in i && i.sourceId) || prev.search?.sourceId || prev.sourceId;
      const opts = L6_CONCEPTS.filter((c) => c.sourceId === sourceId || sourceId === 'snomed');
      return {
        ...prev,
        sourceId,
        loading: false,
        error: '',
        search: {
          sourceId,
          role: prev.role,
          query: prev.search?.query ?? '',
          options: opts,
          page: 1,
          pageSize: 10,
          total: opts.length,
          loading: false,
        },
      };
    }
    case 'terminologyQueryChanged': {
      const sourceId = prev.search?.sourceId ?? prev.sourceId;
      return {
        ...prev,
        sourceId,
        search: {
          sourceId,
          role: prev.role,
          query: i.query,
          options: prev.search?.options ?? [],
          page: prev.search?.page ?? 1,
          pageSize: prev.search?.pageSize ?? 10,
          total: prev.search?.total ?? 0,
          loading: prev.search?.loading ?? false,
          error: prev.search?.error,
        },
      };
    }
    case 'terminologySearchRequested': {
      const q = (prev.search?.query ?? '').trim().toLowerCase();
      const opts = L6_CONCEPTS.filter(
        (c) => !q || c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      );
      return {
        ...prev,
        loading: false,
        search: {
          sourceId: prev.search?.sourceId ?? prev.sourceId,
          role: prev.role,
          query: prev.search?.query ?? '',
          options: opts,
          page: 1,
          pageSize: 10,
          total: opts.length,
          loading: false,
        },
      };
    }
    case 'terminologyPageChanged':
      return prev.search
        ? { ...prev, search: { ...prev.search, page: i.page } }
        : prev;
    case 'terminologyConceptSelected': {
      const id = `b-${i.concept.sourceId}-${i.concept.code}`;
      return {
        ...prev,
        bindings: [
          ...prev.bindings.filter((b) => b.id !== id),
          { id, role: i.role, concept: i.concept, strength: i.strength ?? 'preferred' },
        ],
      };
    }
    case 'terminologyBindingRemoved':
      return {
        ...prev,
        bindings: prev.bindings.filter((b) => b.id !== i.bindingId),
      };
  }
}

type EhrTemplateParityState = EhrTemplateViewModel & {
  readonly status: EhrTemplateDefinition['status'];
  readonly readOnly: boolean;
  readonly error: string;
  readonly stagedImport?: EhrTemplateDefinition;
};

function reduceEhrTemplate(
  model: EhrTemplateParityState,
  intent: EhrTemplateIntent,
): EhrTemplateParityState {
  const withTemplate = (template: EhrTemplateDefinition): EhrTemplateParityState => ({
    ...model,
    template,
    status: template.status,
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
      return { ...model, selectedSectionId: intent.sectionId, selectedPlacementId: undefined };
    case 'placementSelected':
      return { ...model, selectedSectionId: intent.sectionId, selectedPlacementId: intent.placementId };
    case 'sectionAdded': {
      const id = `sec-${model.template.sections.length + 1}`;
      return {
        ...withTemplate({ ...model.template, revision: model.template.revision + 1, sections: [...model.template.sections, { ...intent.section, id }] }),
        selectedSectionId: id,
        selectedPlacementId: undefined,
      };
    }
    case 'sectionPatched':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map((s) => (s.id === intent.sectionId ? { ...s, ...intent.changes } : s)),
      });
    case 'sectionMoved': {
      const sections = [...model.template.sections];
      const fromIdx = sections.findIndex((s) => s.id === intent.sectionId);
      if (fromIdx < 0) return model;
      const toIdx = fromIdx + (intent.direction === 'up' ? -1 : 1);
      if (toIdx < 0 || toIdx >= sections.length) return model;
      const [item] = sections.splice(fromIdx, 1);
      if (!item) return model;
      sections.splice(toIdx, 0, item);
      return withTemplate({ ...model.template, revision: model.template.revision + 1, sections });
    }
    case 'sectionRemoved': {
      const sections = model.template.sections.filter((s) => s.id !== intent.sectionId);
      const nextSectionId =
        model.selectedSectionId === intent.sectionId ? sections[0]?.id : model.selectedSectionId;
      return {
        ...withTemplate({
          ...model.template,
          revision: model.template.revision + 1,
          sections,
        }),
        selectedSectionId: nextSectionId,
        selectedPlacementId:
          model.selectedSectionId === intent.sectionId ? undefined : model.selectedPlacementId,
      };
    }
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
    case 'fieldMoved':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map((s) => {
          if (s.id !== intent.sectionId) return s;
          const fields = [...s.fields];
          const fromIdx = fields.findIndex((f) => f.id === intent.placementId);
          if (fromIdx < 0) return s;
          const toIdx = fromIdx + (intent.direction === 'up' ? -1 : 1);
          if (toIdx < 0 || toIdx >= fields.length) return s;
          const [item] = fields.splice(fromIdx, 1);
          if (!item) return s;
          fields.splice(toIdx, 0, item);
          return { ...s, fields };
        }),
      });
    case 'fieldRemoved':
      return {
        ...withTemplate({
          ...model.template,
          revision: model.template.revision + 1,
          sections: model.template.sections.map((s) =>
            s.id === intent.sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== intent.placementId) } : s,
          ),
        }),
        selectedPlacementId:
          model.selectedPlacementId === intent.placementId ? undefined : model.selectedPlacementId,
      };
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
    case 'artifactImportRequested': {
      try {
        const parsed = JSON.parse(intent.serialized) as Partial<EhrTemplateDefinition>;
        if (parsed && typeof parsed.title === 'string' && Array.isArray(parsed.sections)) {
          return {
            ...model,
            stagedImport: {
              ...model.template,
              ...parsed,
              schemaVersion: '1.0',
              id: parsed.id ?? model.template.id,
              revision: model.template.revision + 1,
              sections: parsed.sections,
            },
            canAcceptImport: true,
            importIssues: [],
          };
        }
        return {
          ...model,
          stagedImport: undefined,
          canAcceptImport: false,
          importIssues: [
            {
              severity: 'error',
              code: 'INVALID_TEMPLATE_PAYLOAD',
              message: 'Imported payload must include template title and sections array.',
            },
          ],
        };
      } catch {
        return {
          ...model,
          stagedImport: undefined,
          canAcceptImport: false,
          importIssues: [
            {
              severity: 'error',
              code: 'INVALID_JSON',
              message: 'Invalid JSON payload; unable to parse template artifact.',
            },
          ],
        };
      }
    }
    case 'importAccepted':
      if (!model.stagedImport) return model;
      return {
        ...withTemplate(model.stagedImport),
        stagedImport: undefined,
        canAcceptImport: false,
        importIssues: [],
        selectedSectionId: model.stagedImport.sections[0]?.id,
        selectedPlacementId: undefined,
      };
    case 'saveRequested':
      return { ...model, dirty: false };
    default:
      return model;
  }
}

export const PARITY_ENTRIES_L3_L6: readonly ParityEntry[] = [
  // ---- L3 (11) ---------------------------------------------------------------------------
  defineParityEntry<{
    collapsed: boolean;
    collapsible: boolean;
    variant: EmrSectionCardVariant;
    tone: EmrTone;
    padding: EmrSectionCardPadding;
    headingLevel: EmrSectionCardHeadingLevel;
    readOnly: boolean;
    showStatus: boolean;
    showDescription: boolean;
  }>({
    selector: 'emr-section-card',
    createInitialState: () => ({
      collapsed: false,
      collapsible: true,
      variant: 'outlined',
      tone: 'neutral',
      padding: 'md',
      headingLevel: 2,
      readOnly: false,
      showStatus: true,
      showDescription: true,
    }),
    renderReact: ({ state, readOnly, update }) => {
      const effectiveReadOnly = readOnly || state.readOnly;
      return (
        <EmrSectionCard
          sectionId="parity-sec-react"
          label="Anterior Segment Slit-Lamp"
          description={
            state.showDescription
              ? 'Collapsible L3 section container (expands automatically in .emr-print)'
              : undefined
          }
          status={state.showStatus ? { label: 'Recorded', tone: 'success' } : undefined}
          collapsible={state.collapsible}
          collapsed={state.collapsed}
          headingLevel={state.headingLevel}
          variant={state.variant}
          tone={state.tone}
          padding={state.padding}
          readOnly={effectiveReadOnly}
          onIntent={(intent) =>
            update('react', intent.type, intent, (s) => ({ ...s, collapsed: !s.collapsed }))
          }
        >
          <EmrFieldValueRow field="Cornea (OD / OS)" value="Clear / Clear" remarks="Fluorescein negative" />
          <EmrFieldValueRow field="Lens (OD / OS)" value="NS Grade II / Pseudophakic PCIOL" remarks="Dilated" />
        </EmrSectionCard>
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const effectiveReadOnly = readOnly || state.readOnly;
      return (
        <LitElementHost
          tag="emr-section-card"
          props={{
            sectionId: 'parity-sec-lit',
            label: 'Anterior Segment Slit-Lamp',
            description: state.showDescription
              ? 'Collapsible L3 section container (expands automatically in .emr-print)'
              : '',
            status: state.showStatus ? { label: 'Recorded', tone: 'success' } : undefined,
            collapsible: state.collapsible,
            collapsed: state.collapsed,
            headingLevel: state.headingLevel,
            variant: state.variant,
            tone: state.tone,
            padding: state.padding,
            readOnly: effectiveReadOnly,
          }}
          slotHtml="<div style='display:grid;gap:6px'><emr-field-value-row field='Cornea (OD / OS)' value='Clear / Clear' remarks='Fluorescein negative'></emr-field-value-row><emr-field-value-row field='Lens (OD / OS)' value='NS Grade II / Pseudophakic PCIOL' remarks='Dilated'></emr-field-value-row></div>"
          events={{
            intent: (i) => update('lit', 'intent', i, (s) => ({ ...s, collapsed: !s.collapsed })),
          }}
        />
      );
    },
  }),

  defineParityEntry<RepeatableGroupParityState>({
    selector: 'emr-repeatable-group',
    createInitialState: () => ({
      items: INITIAL_REPEAT_ITEMS,
      readOnly: false,
      empty: false,
      error: false,
      warning: false,
    }),
    renderReact: ({ state, readOnly, update }) => {
      const effectiveReadOnly = readOnly || state.readOnly;
      return (
        <EmrRepeatableGroup
          definition={REPEAT_DEF}
          model={state.empty ? [] : state.items}
          readOnly={effectiveReadOnly}
          idPrefix="parity-rg-r"
          error={state.error ? 'At least one post-operative topical drop regimen is required' : undefined}
          warning={state.warning ? 'Verify preservative-free drops for corneal graft patients' : undefined}
          onIntent={(i) => update('react', i.type, i, (s) => reduceRepeatableParity(s, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const effectiveReadOnly = readOnly || state.readOnly;
      return (
        <LitElementHost
          tag="emr-repeatable-group"
          props={{
            definition: REPEAT_DEF,
            model: state.empty ? [] : state.items,
            readOnly: effectiveReadOnly,
            idPrefix: 'parity-rg-l',
            error: state.error ? 'At least one post-operative topical drop regimen is required' : '',
            warning: state.warning ? 'Verify preservative-free drops for corneal graft patients' : '',
          }}
          events={{
            intent: (i) => {
              const intent = i as ClinicalFormIntent;
              update('lit', intent.type, intent, (s) => reduceRepeatableParity(s, intent));
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<ClinicalFormViewModel>({
    selector: 'emr-clinical-form',
    createInitialState: () => FORM_MODEL_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalForm
        model={{ ...state, readOnly: readOnly || Boolean(state.readOnly) }}
        idPrefix="parity-cf-r"
        onIntent={(i) => update('react', i.type, i, (s) => reduceClinicalFormParity(s, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-form"
        props={{ model: { ...state, readOnly: readOnly || Boolean(state.readOnly) }, idPrefix: 'parity-cf-l' }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalFormIntent;
            update('lit', i.type, i, (s) => reduceClinicalFormParity(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<ClinicalListViewModel>({
    selector: 'emr-clinical-list',
    createInitialState: () => ({
      title: 'Active clinical problems',
      items: [
        {
          id: 'c1',
          title: 'Primary open-angle glaucoma (OU)',
          subtitle: 'Diagnosed 2023',
          badges: [{ label: 'Active', tone: 'success' }],
        },
        {
          id: 'c2',
          title: 'Pseudophakia (OS)',
          subtitle: 'PCIOL implanted 2024',
          badges: [{ label: 'Stable', tone: 'info' }],
        },
      ],
      selectedId: 'c1',
      allowAdd: true,
      readOnly: false,
      loading: false,
      error: '',
      variant: 'outlined',
      emptyMessage: 'No active problems recorded.',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalList
        model={{
          ...state,
          readOnly: readOnly || Boolean(state.readOnly),
          error: state.error || undefined,
        }}
        onIntent={(i: ClinicalListIntent) =>
          update('react', i.type, i, (s) => reduceClinicalListParity(s, i))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-list"
        props={{
          model: {
            ...state,
            readOnly: readOnly || Boolean(state.readOnly),
            error: state.error || undefined,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalListIntent;
            update('lit', i.type, i, (s) => reduceClinicalListParity(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<ClinicalMatrixParityState>({
    selector: 'emr-clinical-matrix',
    createInitialState: () => ({
      values: MATRIX_SEED_VALUES,
      readOnly: false,
      showRemarks: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalMatrix
        definition={{ ...MATRIX_SCHEMA, showRemarks: state.showRemarks }}
        model={state.values}
        readOnly={readOnly || state.readOnly}
        idPrefix="parity-cm-r"
        onIntent={(i) =>
          update('react', i.type, i, (s) => ({ ...s, values: reduceMatrix(s.values, i) }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-matrix"
        props={{
          definition: { ...MATRIX_SCHEMA, showRemarks: state.showRemarks },
          model: state.values,
          readOnly: readOnly || state.readOnly,
          idPrefix: 'parity-cm-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalMatrixIntent;
            update('lit', i.type, i, (s) => ({ ...s, values: reduceMatrix(s.values, i) }));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ od: number; os: number; remark: string; readOnly: boolean }>({
    selector: 'emr-clinical-cell-renderer',
    notes: 'Demonstrates custom matrix cell rendering in React (`customRenderers` / `EmrClinicalCellRenderer`) vs Lit (`<emr-clinical-cell-renderer>`) vs Angular (`ng-template[emrClinicalCellRenderer]`).',
    createInitialState: () => ({ od: 1, os: 0, remark: '4-mirror Posner goniolens', readOnly: false }),
    renderReact: ({ state, readOnly, update }) => {
      const effectiveReadOnly = readOnly || state.readOnly;
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
          readOnly={effectiveReadOnly}
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
      const effectiveReadOnly = readOnly || state.readOnly;
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
          btn.className = 'emr-btn emr-btn--secondary';
          const count = typeof cell?.value === 'number' ? cell.value : 0;
          btn.textContent = `Stamp Shaffer IV · ${column.id.toUpperCase()} (${count})`;
          btn.setAttribute('aria-readonly', cellRo ? 'true' : 'false');
          btn.style.cssText = [
            'min-height:44px',
            'min-width:44px',
            'padding:0 12px',
            'border-radius:var(--emr-radius,8px)',
            'border:1px solid var(--emr-border)',
            'background:var(--emr-surface)',
            'color:var(--emr-text)',
            'cursor:' + (cellRo ? 'default' : 'pointer'),
            'font:inherit',
            'font-variant-numeric:tabular-nums',
            cellRo ? 'opacity:0.65;border-style:dashed' : '',
          ]
            .filter(Boolean)
            .join(';');
          btn.onclick = () => {
            if (!cellRo) emit('stamp', { columnId: column.id, next: count + 1 });
          };
          return btn;
        },
      };
      return (
        <LitElementHost
          tag="emr-clinical-matrix"
          props={{
            definition: CUSTOM_CELL_SCHEMA,
            model: values,
            readOnly: effectiveReadOnly,
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

  defineParityEntry<AnnotationToolbarParityState>({
    selector: 'emr-annotation-toolbar',
    createInitialState: () => ({
      selectedToolId: 'ellipse',
      selectedColourId: 'red',
      selectedWidthId: 'w2',
      zoomPct: 100,
      canUndo: true,
      canRedo: true,
      canSave: true,
      zoomLocked: false,
      readOnly: false,
      undoCount: 0,
      redoCount: 0,
      saveCount: 0,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAnnotationToolbar
        model={buildToolbarParityModel(state, readOnly)}
        idPrefix="parity-at-r"
        onIntent={(i) => update('react', i.type, i, (s) => reduceToolbarParity(s, i, readOnly))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-annotation-toolbar"
        props={{
          model: buildToolbarParityModel(state, readOnly),
          idPrefix: 'parity-at-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as AnnotationToolbarIntent;
            update('lit', i.type, i, (s) => reduceToolbarParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<AnnotationListParityState>({
    selector: 'emr-annotation-list',
    createInitialState: () => ({
      items: ANNOTATION_LAYERS_SEED,
      selectedLayerId: 'l2',
      canLock: true,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrAnnotationList
        model={{
          items: state.items,
          selectedLayerId: state.selectedLayerId,
          readOnly: readOnly || state.readOnly,
          canLock: state.canLock,
          emptyMessage: 'No layers.',
        }}
        idPrefix="parity-al-r"
        onIntent={(i: AnnotationListIntent) =>
          update('react', i.type, i, (s) => reduceAnnotationListParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-annotation-list"
        props={{
          model: {
            items: state.items,
            selectedLayerId: state.selectedLayerId,
            readOnly: readOnly || state.readOnly,
            canLock: state.canLock,
            emptyMessage: 'No layers.',
          },
          idPrefix: 'parity-al-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as AnnotationListIntent;
            update('lit', i.type, i, (s) => reduceAnnotationListParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<ImageTemplatePickerParityState>({
    selector: 'emr-image-template-picker',
    createInitialState: () => ({
      selectedTemplateId: 'retina-od',
      search: '',
      category: 'all',
      favouritesOnly: false,
      favouriteIds: ['retina-od'],
      readOnly: false,
      canEditFavourites: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrImageTemplatePicker
        model={buildImageTemplatePickerParityModel(state, readOnly)}
        idPrefix="parity-tp-r"
        onIntent={(i: ImageTemplatePickerIntent) =>
          update('react', i.type, i, (s) => reduceImageTemplatePickerParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-image-template-picker"
        props={{
          model: buildImageTemplatePickerParityModel(state, readOnly),
          idPrefix: 'parity-tp-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as ImageTemplatePickerIntent;
            update('lit', i.type, i, (s) => reduceImageTemplatePickerParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<TimeAxisParityState>({
    selector: 'emr-time-axis',
    createInitialState: () => ({
      offset: 0,
      selectedTickId: 't1',
      stepId: '60',
      windowStartLabel: '08:00',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTimeAxis
        model={buildTimeAxisParityModel(state, readOnly)}
        idPrefix="parity-ta-r"
        onIntent={(i: TimeAxisIntent) =>
          update('react', i.type, i, (s) => reduceTimeAxisParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-time-axis"
        props={{
          model: buildTimeAxisParityModel(state, readOnly),
          idPrefix: 'parity-ta-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as TimeAxisIntent;
            update('lit', i.type, i, (s) => reduceTimeAxisParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<DataTableParityState>({
    selector: 'emr-data-table',
    createInitialState: () => ({
      selectedIds: ['r1'],
      selectedRowCount: 1,
      density: 'comfortable',
      pendingOnly: false,
      customSavedFilter: false,
      page: 1,
      pageSize: 5,
      loading: false,
      error: '',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDataTable
        model={buildDataTableParityModel(state, readOnly)}
        idPrefix="parity-dt-r"
        onIntent={(i: EmrDataTableIntent) =>
          update('react', i.type, i, (s) => reduceDataTableParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-data-table"
        props={{
          model: buildDataTableParityModel(state, readOnly),
          idPrefix: 'parity-dt-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrDataTableIntent;
            update('lit', i.type, i, (s) => reduceDataTableParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  // ---- L6 (6) ----------------------------------------------------------------------------
  defineParityEntry<FieldGeneratorParityState>({
    selector: 'emr-field-generator',
    createInitialState: () => createInitialFieldGeneratorState(),
    renderReact: ({ state, readOnly, update }) => (
      <EmrFieldGenerator
        model={{
          draft: state.draft,
          sources: state.sources,
          terminologySearches: state.terminologySearches,
          validationErrors: state.validationErrors,
          saving: state.saving,
          dirty: state.dirty,
          error: state.error || undefined,
          savedFieldId: state.savedFieldId,
          readOnly: state.readOnly || readOnly,
        }}
        onIntent={(i: FieldGeneratorIntent) =>
          update('react', i.type, i, (prev) => reduceFieldGenerator(prev, i))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-field-generator"
        props={{
          model: {
            draft: state.draft,
            sources: state.sources,
            terminologySearches: state.terminologySearches,
            validationErrors: state.validationErrors,
            saving: state.saving,
            dirty: state.dirty,
            error: state.error || undefined,
            savedFieldId: state.savedFieldId,
            readOnly: state.readOnly || readOnly,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as FieldGeneratorIntent;
            update('lit', i.type, i, (prev) => reduceFieldGenerator(prev, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<TerminologySearchParityState>({
    selector: 'emr-terminology-search',
    createInitialState: () => ({
      role: 'question-meaning',
      sources: L6_SOURCES,
      sourceId: 'loinc',
      loading: false,
      error: '',
      readOnly: false,
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
        model={{
          role: state.role,
          sources: state.sources,
          search: state.search,
          bindings: state.bindings,
          readOnly: state.readOnly || readOnly,
        }}
        onIntent={(i: TerminologySearchIntent) =>
          update('react', i.type, i, (prev) => reduceTerminologySearch(prev, i))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-terminology-search"
        props={{
          model: {
            role: state.role,
            sources: state.sources,
            search: state.search,
            bindings: state.bindings,
            readOnly: state.readOnly || readOnly,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as TerminologySearchIntent;
            update('lit', i.type, i, (prev) => reduceTerminologySearch(prev, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ readonly rules: readonly FieldValidationRule[]; readonly readOnly: boolean }>({
    selector: 'emr-validation-rule-editor',
    createInitialState: () => ({
      rules: [
        { id: 'r-min', kind: 'minimum', value: 5, message: 'Hypotony alert below 5 mmHg.' },
        { id: 'r-max', kind: 'maximum', value: 21, message: 'Elevated IOP above 21 mmHg.' },
      ],
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrValidationRuleEditor
        model={{ rules: state.rules, readOnly: state.readOnly || readOnly }}
        onIntent={(i: ValidationRuleEditorIntent) =>
          update('react', i.type, i, (prev) => ({
            ...prev,
            rules:
              i.type === 'validationRuleAdded'
                ? [...prev.rules, { ...i.rule, id: `r-${prev.rules.length + 1}` }]
                : prev.rules.filter((r) => r.id !== i.ruleId),
          }))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-validation-rule-editor"
        props={{ model: { rules: state.rules, readOnly: state.readOnly || readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as ValidationRuleEditorIntent;
            update('lit', i.type, i, (prev) => ({
              ...prev,
              rules:
                i.type === 'validationRuleAdded'
                  ? [...prev.rules, { ...i.rule, id: `r-${prev.rules.length + 1}` }]
                  : prev.rules.filter((r) => r.id !== i.ruleId),
            }));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ readonly query: string; readonly selectedSectionId: string; readonly readOnly: boolean }>({
    selector: 'emr-field-library-picker',
    createInitialState: () => ({ query: '', selectedSectionId: 'tonometry', readOnly: false }),
    renderReact: ({ state, readOnly, update }) => {
      const q = state.query.trim().toLowerCase();
      const fields = ALL_LIB_FIELDS.filter((f) => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
      return (
        <EmrFieldLibraryPicker
          model={{
            fields,
            query: state.query,
            selectedSectionId: state.selectedSectionId,
            readOnly: state.readOnly || readOnly,
          }}
          onIntent={(i) =>
            update('react', i.type, i, (s) =>
              i.type === 'fieldLibraryQueryChanged' ? { ...s, query: i.query } : s,
            )
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
          props={{
            model: {
              fields,
              query: state.query,
              selectedSectionId: state.selectedSectionId,
              readOnly: state.readOnly || readOnly,
            },
          }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; query?: string };
              update('lit', i.type, i, (s) =>
                i.type === 'fieldLibraryQueryChanged' ? { ...s, query: i.query ?? '' } : s,
              );
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<EhrTemplateParityState>({
    selector: 'emr-template-composer',
    createInitialState: () => ({
      template: INITIAL_EHR_TEMPLATE,
      status: INITIAL_EHR_TEMPLATE.status,
      fieldLibrary: ALL_LIB_FIELDS,
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      preview: deriveTemplatePreview(INITIAL_EHR_TEMPLATE),
      loading: false,
      saving: false,
      dirty: false,
      error: '',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <View style={{ minWidth: 0 }}>
        <EmrTemplateComposer
          model={{
            template: state.template,
            fieldLibrary: state.fieldLibrary,
            fieldLibraryQuery: state.fieldLibraryQuery,
            selectedSectionId: state.selectedSectionId,
            selectedPlacementId: state.selectedPlacementId,
            preview: state.preview,
            loading: state.loading,
            saving: state.saving,
            dirty: state.dirty,
            error: state.error || undefined,
            artifact: state.artifact,
            canAcceptImport: state.canAcceptImport,
            importIssues: state.importIssues,
            readOnly: state.readOnly || readOnly,
          }}
          onIntent={(i) => update('react', i.type, i, (s) => reduceEhrTemplate(s, i))}
        />
      </View>
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-template-composer"
        props={{
          model: {
            template: state.template,
            fieldLibrary: state.fieldLibrary,
            fieldLibraryQuery: state.fieldLibraryQuery,
            selectedSectionId: state.selectedSectionId,
            selectedPlacementId: state.selectedPlacementId,
            preview: state.preview,
            loading: state.loading,
            saving: state.saving,
            dirty: state.dirty,
            error: state.error || undefined,
            artifact: state.artifact,
            canAcceptImport: state.canAcceptImport,
            importIssues: state.importIssues,
            readOnly: state.readOnly || readOnly,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as EhrTemplateIntent;
            update('lit', i.type, i, (s) => reduceEhrTemplate(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<EhrTemplateParityState>({
    selector: 'emr-template-preview',
    createInitialState: () => ({
      template: INITIAL_EHR_TEMPLATE,
      status: INITIAL_EHR_TEMPLATE.status,
      fieldLibrary: ALL_LIB_FIELDS,
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      preview: deriveTemplatePreview(INITIAL_EHR_TEMPLATE),
      loading: false,
      saving: false,
      dirty: false,
      error: '',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrTemplatePreview
        model={{
          template: state.template,
          fieldLibrary: state.fieldLibrary,
          fieldLibraryQuery: state.fieldLibraryQuery,
          selectedSectionId: state.selectedSectionId,
          selectedPlacementId: state.selectedPlacementId,
          preview: state.preview,
          loading: state.loading,
          saving: state.saving,
          dirty: state.dirty,
          error: state.error || undefined,
          artifact: state.artifact,
          canAcceptImport: state.canAcceptImport,
          importIssues: state.importIssues,
          readOnly: state.readOnly || readOnly,
        }}
        onIntent={(i) => update('react', i.type, i, (s) => reduceEhrTemplate(s, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-template-preview"
        props={{
          model: {
            template: state.template,
            fieldLibrary: state.fieldLibrary,
            fieldLibraryQuery: state.fieldLibraryQuery,
            selectedSectionId: state.selectedSectionId,
            selectedPlacementId: state.selectedPlacementId,
            preview: state.preview,
            loading: state.loading,
            saving: state.saving,
            dirty: state.dirty,
            error: state.error || undefined,
            artifact: state.artifact,
            canAcceptImport: state.canAcceptImport,
            importIssues: state.importIssues,
            readOnly: state.readOnly || readOnly,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as EhrTemplateIntent;
            update('lit', i.type, i, (s) => reduceEhrTemplate(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<SplitWorkspaceParityState>({
    selector: 'emr-split-workspace',
    shell: true,
    createInitialState: () => ({
      preset: '3-pane',
      pane1Pct: 25,
      pane2Pct: 50,
      pane3Pct: 25,
      pane1Collapsed: false,
      pane2Collapsed: false,
      pane3Collapsed: false,
      mobileActivePaneId: 'pane-note',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSplitWorkspace
        model={buildSplitWorkspaceParityModel(state, readOnly)}
        idPrefix="parity-sw-r"
        onIntent={(i: EmrSplitWorkspaceIntent) =>
          update('react', i.type, i, (s) => reduceSplitWorkspaceParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-split-workspace"
        props={{
          model: buildSplitWorkspaceParityModel(state, readOnly),
          idPrefix: 'parity-sw-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrSplitWorkspaceIntent;
            update('lit', i.type, i, (s) => reduceSplitWorkspaceParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<CommandPaletteParityState>({
    selector: 'emr-command-palette',
    createInitialState: () => ({
      presentation: 'inline',
      open: true,
      query: '',
      activeCategory: 'all',
      activeIndex: 0,
      lastCommandId: '',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrCommandPalette
        model={buildCommandPaletteParityModel(state, readOnly)}
        idPrefix="parity-cp-r"
        onIntent={(i: EmrCommandPaletteIntent) =>
          update('react', i.type, i, (s) => reduceCommandPaletteParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-command-palette"
        props={{
          model: buildCommandPaletteParityModel(state, readOnly),
          idPrefix: 'parity-cp-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrCommandPaletteIntent;
            update('lit', i.type, i, (s) => reduceCommandPaletteParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<MasterDetailParityState>({
    selector: 'emr-master-detail',
    createInitialState: () => ({
      searchQuery: '',
      activeFilterId: 'all',
      selectedId: 'inb-1',
      checkedIds: ['inb-1'],
      checkedCount: 1,
      mobileDetailOpen: false,
      lastAction: '',
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrMasterDetail
        model={buildMasterDetailParityModel(state, readOnly)}
        idPrefix="parity-md-r"
        onIntent={(i: EmrMasterDetailIntent) =>
          update('react', i.type, i, (s) => reduceMasterDetailParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-master-detail"
        props={{
          model: buildMasterDetailParityModel(state, readOnly),
          idPrefix: 'parity-md-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrMasterDetailIntent;
            update('lit', i.type, i, (s) => reduceMasterDetailParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<SynchronizedTimeGridParityState>({
    selector: 'emr-synchronized-time-grid',
    createInitialState: () => ({
      resolution: '1h',
      scrollOffset: 0,
      visibleColumnCount: 4,
      selectedColumnId: 'c10',
      selectedCellKey: '',
      vitalsCollapsed: false,
      trendCollapsed: false,
      medsCollapsed: false,
      readOnly: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSynchronizedTimeGrid
        model={buildSynchronizedTimeGridParityModel(state, readOnly)}
        idPrefix="parity-stg-r"
        onIntent={(i: EmrSynchronizedTimeGridIntent) =>
          update('react', i.type, i, (s) => reduceSynchronizedTimeGridParity(s, i, readOnly))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-synchronized-time-grid"
        props={{
          model: buildSynchronizedTimeGridParityModel(state, readOnly),
          idPrefix: 'parity-stg-l',
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrSynchronizedTimeGridIntent;
            update('lit', i.type, i, (s) => reduceSynchronizedTimeGridParity(s, i, readOnly));
          },
        }}
      />
    ),
  }),

  defineParityEntry<LogicRuleBuilderViewModel>({
    selector: 'emr-logic-rule-builder',
    createInitialState: () => ({
      ruleId: 'glaucoma-iop-alert',
      label: 'Glaucoma Elevated IOP & Risk Rule',
      engineVersion: 3,
      root: {
        kind: 'group',
        id: 'g-root',
        combinator: 'all',
        children: [
          { kind: 'predicate', id: 'p-iop', fieldId: 'iop_od', operator: 'gte', value: 22 },
        ],
      },
      target: {
        effect: 'alert',
        targetFieldId: 'iop_od',
        alertMessage: 'Elevated IOP >= 22 mmHg — order OCT RNFL & Humphrey VF 24-2.',
        alertTone: 'warning',
      },
      availableFields: [
        { id: 'iop_od', label: 'Intraocular Pressure OD (mmHg)', valueType: 'quantity' },
      ],
      testValues: { iop_od: 25 },
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrLogicRuleBuilder
        model={{ ...state, readOnly }}
        onIntent={(i: LogicRuleBuilderIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'testValueChanged' ? { ...s, testValues: { ...s.testValues, [i.fieldId]: i.value } } : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-logic-rule-builder"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as LogicRuleBuilderIntent;
            update('lit', i.type, i, (s) =>
              i.type === 'testValueChanged' ? { ...s, testValues: { ...s.testValues, [i.fieldId]: i.value } } : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<ScoreBuilderViewModel>({
    selector: 'emr-score-builder',
    createInitialState: () => ({
      definition: {
        schemaVersion: '1.0',
        engineVersion: 3,
        instrumentId: 'osdi-6-short',
        title: 'Ocular Surface Disease Index (OSDI-6 Short Form)',
        versionStamp: '2026.2',
        missingItemPolicy: 'prorate',
        items: [
          {
            id: 'item-photophobia',
            fieldId: 'osdi_light',
            label: 'Eyes that are sensitive to light',
            weight: 1,
            required: true,
            optionPoints: { none: 0, some: 1, half: 2, most: 3, all: 4 },
          },
        ],
        bands: [
          { id: 'band-normal', minScore: 0, maxScore: 4, label: 'Normal ocular surface', tone: 'success' },
        ],
      },
      sampleAnswers: { osdi_light: 'most' },
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrScoreBuilder
        model={{ ...state, readOnly }}
        onIntent={(i: ScoreBuilderIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'sampleAnswerChanged'
              ? { ...s, sampleAnswers: { ...s.sampleAnswers, [i.fieldId]: i.value } }
              : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-score-builder"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as ScoreBuilderIntent;
            update('lit', i.type, i, (s) =>
              i.type === 'sampleAnswerChanged'
                ? { ...s, sampleAnswers: { ...s.sampleAnswers, [i.fieldId]: i.value } }
                : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<FhirQuestionnaireMapperViewModel>({
    selector: 'emr-fhir-questionnaire-mapper',
    createInitialState: () => ({
      fhirVersion: 'R4',
      schema: {
        id: 'glaucoma-intake-form',
        label: 'Glaucoma Baseline Intake Questionnaire',
        sections: [
          {
            id: 'sec-tonometry',
            label: 'Tonometry & Pachymetry',
            blocks: [{ kind: 'field', id: 'iop-od', label: 'Goldmann Applanation IOP (OD)', type: 'quantity', required: true }],
          },
        ],
      },
      questionnaire: {
        resourceType: 'Questionnaire',
        id: 'glaucoma-intake-form',
        url: 'urn:emr:questionnaire:glaucoma-intake-form',
        version: '1.0.0',
        title: 'Glaucoma Baseline Intake Questionnaire',
        status: 'active',
        fhirVersion: '4.0.1',
        item: [
          {
            linkId: 'sec-tonometry',
            type: 'group',
            text: 'Tonometry & Pachymetry',
            item: [{ linkId: 'iop-od', type: 'quantity', text: 'Goldmann Applanation IOP (OD)', required: true }],
          },
        ],
      },
      rows: [
        {
          linkId: 'iop-od',
          sectionId: 'sec-tonometry',
          label: 'Goldmann Applanation IOP (OD)',
          emrValueType: 'quantity',
          fhirItemType: 'quantity',
          required: true,
          repeats: false,
          terminologyCodes: [{ system: 'http://loinc.org', code: '79893-4', display: 'Intraocular pressure of Right eye' }],
          enableWhenCount: 0,
          hasInitialValue: true,
          warnings: [],
        },
      ],
      diagnostics: [],
      selectedLinkId: 'iop-od',
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrFhirQuestionnaireMapper
        model={{ ...state, readOnly }}
        onIntent={(i: FhirQuestionnaireMapperIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'fhirVersionToggled' ? { ...s, fhirVersion: i.fhirVersion } : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-fhir-questionnaire-mapper"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as FhirQuestionnaireMapperIntent;
            update('lit', i.type, i, (s) =>
              i.type === 'fhirVersionToggled' ? { ...s, fhirVersion: i.fhirVersion } : s,
            );
          },
        }}
      />
    ),
  }),
];

