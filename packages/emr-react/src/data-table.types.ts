import type {
  EmrDataTableAlign,
  EmrDataTableCell,
  EmrDataTableColumn,
  EmrDataTableDensity,
  EmrDataTableIntent,
  EmrDataTableLabels,
  EmrDataTableModel,
  EmrDataTablePagination,
  EmrDataTableRow,
  EmrDataTableSelectAllState,
  EmrDataTableSort,
  EmrDataTableSortDirection,
} from '@drguptavivek/emr-controller';

export type {
  EmrDataTableAlign,
  EmrDataTableCell,
  EmrDataTableColumn,
  EmrDataTableDensity,
  EmrDataTableIntent,
  EmrDataTableLabels,
  EmrDataTableModel,
  EmrDataTablePagination,
  EmrDataTableRow,
  EmrDataTableSelectAllState,
  EmrDataTableSort,
  EmrDataTableSortDirection,
};

export interface EmrDataTableProps {
  model: EmrDataTableModel;
  onIntent: (intent: EmrDataTableIntent) => void;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<EmrDataTableLabels>;
  onFocus?: () => void;
  onBlur?: () => void;
}
