import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import type {
  AddressFieldIntent,
  AddressFieldViewModel,
  AnnotationLayerRecord,
  AnnotationListIntent,
  AnnotationListItem,
  AnnotationListViewModel,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  AttestationIntent,
  AttestationViewModel,
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFormIntent,
  ClinicalFormViewModel,
  ClinicalListIntent,
  ClinicalListItem,
  ClinicalListViewModel,
  ClinicalCellState,
  ClinicalFieldType,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  DurationFieldIntent,
  DurationFieldViewModel,
  EhrTemplateDefinition,
  EhrTemplateIntent,
  EhrTemplateViewModel,
  EmrAccordionItem,
  EmrBadge,
  EmrBreadcrumbItem,
  EmrCodedValue,
  EmrColorSwatch,
  EmrCommandCategory,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPalettePresentation,
  EmrCommandPaletteViewModel,
  EmrDataTableColumn,
  EmrDataTableDensity,
  EmrDataTableIntent,
  EmrDataTableModel,
  EmrDataTableRow,
  EmrDataTableSortDirection,
  EmrDateRangePreset,
  EmrDateRangeValue,
  EmrFileSelectionItem,
  EmrGeneratedFieldDefinition,
  EmrImageCropTransform,
  EmrImageItem,
  EmrImageViewportState,
  EmrLikertOption,
  EmrMacroSuggestion,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailViewModel,
  EmrMenuItem,
  EmrOption,
  EmrPhoneChannel,
  EmrToastIntent,
  EmrToastModel,
  EmrVasPrecision,
  EmrSectionCardHeadingLevel,
  EmrSectionCardPadding,
  EmrSectionCardVariant,
  EmrSegmentedOption,
  EmrSegmentedOrientation,
  EmrSegmentedShape,
  EmrSegmentedSize,
  EmrSegmentedVariant,
  EmrSelectSize,
  EmrSelectValue,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridColumn,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
  EmrSelectVariant,
  EmrStatTileModel,
  EmrToggleGroupLabelPlacement,
  EmrToggleGroupOrientation,
  EmrToggleGroupSize,
  EmrToggleGroupVariant,
  EmrTone,
  EmrTreeCheckStrategy,
  EmrTreeNode,
  EmrUploadedImageItem,
  FieldFrameLayout,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  FieldLibraryPickerIntent,
  FieldLibraryPickerViewModel,
  FieldValidationRule,
  IdentifierEntryIntent,
  IdentifierEntryView,
  ImageFieldIntent,
  ImageFieldViewModel,
  ImageTemplateGroup,
  ImageTemplateOption,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PairedFieldIntent,
  PairedFieldViewModel,
  PartialDateFieldIntent,
  PartialDateFieldViewModel,
  PhoneFieldIntent,
  PhoneFieldViewModel,
  RangeFieldIntent,
  RangeFieldViewModel,
  RefractionFieldIntent,
  RefractionFieldViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  ScheduleAmountMode,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
  SignatureCaptureIntent,
  SignatureCaptureViewModel,
  TemplateArtifactIssue,
  TemplatePreviewIntent,
  TemplatePreviewViewModel,
  TerminologyBinding,
  TerminologyConcept,
  TerminologySearchIntent,
  TerminologySearchState,
  TerminologySearchViewModel,
  TerminologySource,
  TimeAxisIntent,
  TimeAxisViewModel,
  ValidationRuleEditorIntent,
  ValidationRuleEditorViewModel,
  VisualAcuityFieldIntent,
  VisualAcuityFieldViewModel,
} from '@drguptavivek/emr-controller';
import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  FAVOURITES_GROUP_ID,
  clampTimeGridScrollOffset,
  derivePreview,
  expandMacroTriggerAtCursor,
  filterImageTemplates,
  resolveSplitWorkspacePresetSizes,
} from '@drguptavivek/emr-controller';
import {
  EmrAccordionComponent,
  EmrAddressFieldComponent,
  EmrAlertComponent,
  EmrAllergyListComponent,
  EmrAnnotationListComponent,
  EmrAnnotationToolbarComponent,
  EmrAttachmentFieldComponent,
  EmrAttestationComponent,
  EmrAvatarComponent,
  EmrBadgeComponent,
  EmrBreadcrumbsComponent,
  EmrButtonComponent,
  EmrCardComponent,
  EmrCheckboxComponent,
  EmrChipComponent,
  EmrChronicDiseaseListComponent,
  EmrClinicalCellRendererDirective,
  EmrClinicalFormComponent,
  EmrClinicalListComponent,
  EmrClinicalMatrixComponent,
  EmrCodedInputComponent,
  EmrColorPickerComponent,
  EmrColumnsComponent,
  EmrCopyButtonComponent,
  EmrDataTableComponent,
  EmrDateInputComponent,
  EmrDateRangeInputComponent,
  EmrDateTimeInputComponent,
  EmrDialogComponent,
  EmrDurationInputComponent,
  EmrFieldFrameComponent,
  EmrFieldGeneratorComponent,
  EmrFieldLibraryPickerComponent,
  EmrFieldValueRowComponent,
  EmrFileTriggerComponent,
  EmrIconButtonComponent,
  EmrIdentifierEntryComponent,
  EmrImageCropperComponent,
  EmrImageFieldComponent,
  EmrImageTemplatePickerComponent,
  EmrImageUploadComponent,
  EmrImageViewerComponent,
  EmrLateralityFieldComponent,
  EmrLikertComponent,
  EmrMacroTextFieldComponent,
  EmrMaskedInputComponent,
  EmrMedicationListComponent,
  EmrMenuComponent,
  EmrNumberInputComponent,
  EmrNumericStepperComponent,
  EmrOtpInputComponent,
  EmrPaginationComponent,
  EmrPairedFieldComponent,
  EmrPairedInputComponent,
  EmrPasswordInputComponent,
  EmrCheckboxGroupComponent,
  EmrComboboxComponent,
  EmrPartialDateFieldComponent,
  EmrPersonalHistoryListComponent,
  EmrPhoneInputComponent,
  EmrPopoverComponent,
  EmrProgressBarComponent,
  EmrQuantityInputComponent,
  EmrRadioGroupComponent,
  EmrRangeFieldComponent,
  EmrRangeSliderComponent,
  EmrRefractionFieldComponent,
  EmrRepeatableGroupComponent,
  EmrScaleFieldComponent,
  EmrScheduleSlotPickerComponent,
  EmrSearchInputComponent,
  EmrSearchSelectComponent,
  EmrSectionCardComponent,
  EmrSegmentedControlComponent,
  EmrSelectComponent,
  EmrSeparatorComponent,
  EmrSignatureCaptureFieldComponent,
  EmrSkeletonComponent,
  EmrSliderComponent,
  EmrSpinnerComponent,
  EmrSplitButtonComponent,
  EmrCommandPaletteComponent,
  EmrMasterDetailComponent,
  EmrSplitWorkspaceComponent,
  EmrStageStepperComponent,
  EmrStatTileComponent,
  EmrStateMessageComponent,
  EmrStatusCellComponent,
  EmrSynchronizedTimeGridComponent,
  EmrTabsComponent,
  EmrTagInputComponent,
  EmrTemplateComposerComponent,
  EmrTemplatePreviewComponent,
  EmrTerminologySearchComponent,
  EmrTextInputComponent,
  EmrTextareaComponent,
  EmrTimeAxisComponent,
  EmrTimeInputComponent,
  EmrToastComponent,
  EmrToggleComponent,
  EmrToggleGroupComponent,
  EmrTooltipComponent,
  EmrTreeSelectComponent,
  EmrTreeViewComponent,
  EmrTypedFieldComponent,
  EmrValidationRuleEditorComponent,
  EmrVasComponent,
  EmrVisualAcuityFieldComponent,
} from '../../packages/emr-ui/src/public-api';

@Component({
  selector: 'emr-angular-preview',
  standalone: true,
  imports: [
    EmrAddressFieldComponent,
    EmrButtonComponent,
    EmrTextInputComponent,
    EmrNumberInputComponent,
    EmrDateInputComponent,
    EmrDateRangeInputComponent,
    EmrDateTimeInputComponent,
    EmrTimeInputComponent,
    EmrSelectComponent,
    EmrQuantityInputComponent,
    EmrPairedFieldComponent,
    EmrPairedInputComponent,
    EmrCheckboxComponent,
    EmrCheckboxGroupComponent,
    EmrToggleComponent,
    EmrToggleGroupComponent,
    EmrTreeViewComponent,
    EmrTreeSelectComponent,
    EmrRadioGroupComponent,
    EmrSegmentedControlComponent,
    EmrSearchSelectComponent,
    EmrComboboxComponent,
    EmrTagInputComponent,
    EmrSliderComponent,
    EmrRangeSliderComponent,
    EmrMaskedInputComponent,
    EmrOtpInputComponent,
    EmrMenuComponent,
    EmrSplitButtonComponent,
    EmrAccordionComponent,
    EmrBreadcrumbsComponent,
    EmrColorPickerComponent,
    EmrCopyButtonComponent,
    EmrBadgeComponent,
    EmrChipComponent,
    EmrAlertComponent,
    EmrStateMessageComponent,
    EmrSeparatorComponent,
    EmrCardComponent,
    EmrColumnsComponent,
    EmrFieldValueRowComponent,
    EmrStatusCellComponent,
    EmrStageStepperComponent,
    EmrStatTileComponent,
    EmrTabsComponent,
    EmrLikertComponent,
    EmrVasComponent,
    EmrFieldFrameComponent,
    EmrTypedFieldComponent,
    EmrCodedInputComponent,
    EmrAttestationComponent,
    EmrScheduleSlotPickerComponent,
    EmrIdentifierEntryComponent,
    EmrSectionCardComponent,
    EmrRepeatableGroupComponent,
    EmrClinicalFormComponent,
    EmrClinicalListComponent,
    EmrClinicalMatrixComponent,
    EmrClinicalCellRendererDirective,
    EmrAnnotationToolbarComponent,
    EmrAnnotationListComponent,
    EmrMedicationListComponent,
    EmrAllergyListComponent,
    EmrChronicDiseaseListComponent,
    EmrPersonalHistoryListComponent,
    EmrLateralityFieldComponent,
    EmrMacroTextFieldComponent,
    EmrScaleFieldComponent,
    EmrPartialDateFieldComponent,
    EmrAttachmentFieldComponent,
    EmrDurationInputComponent,
    EmrRangeFieldComponent,
    EmrSignatureCaptureFieldComponent,
    EmrPhoneInputComponent,
    EmrVisualAcuityFieldComponent,
    EmrRefractionFieldComponent,
    EmrImageViewerComponent,
    EmrImageCropperComponent,
    EmrImageUploadComponent,
    EmrImageFieldComponent,
    EmrImageTemplatePickerComponent,
    EmrTimeAxisComponent,
    EmrDataTableComponent,
    EmrSplitWorkspaceComponent,
    EmrCommandPaletteComponent,
    EmrMasterDetailComponent,
    EmrSynchronizedTimeGridComponent,
    EmrFieldGeneratorComponent,
    EmrTerminologySearchComponent,
    EmrValidationRuleEditorComponent,
    EmrFieldLibraryPickerComponent,
    EmrTemplateComposerComponent,
    EmrTemplatePreviewComponent,
    EmrTextareaComponent,
    EmrIconButtonComponent,
    EmrSearchInputComponent,
    EmrPasswordInputComponent,
    EmrNumericStepperComponent,
    EmrPaginationComponent,
    EmrDialogComponent,
    EmrPopoverComponent,
    EmrTooltipComponent,
    EmrProgressBarComponent,
    EmrSpinnerComponent,
    EmrSkeletonComponent,
    EmrAvatarComponent,
    EmrFileTriggerComponent,
    EmrToastComponent,
  ],
  template: `
    @switch (selector()) {
      @case ('emr-button') {
        <emr-button
          [variant]="buttonVariant()"
          [size]="buttonSize()"
          [disabled]="buttonDisabled()"
          [loading]="buttonLoading()"
          [block]="buttonBlock()"
          (clicked)="onButtonClick()"
        >
          Confirm action ({{ buttonClicks() }})
        </emr-button>
      }
      @case ('emr-text-input') {
        <emr-text-input
          label="Chief complaint"
          hint="Free-text presenting symptom"
          placeholder="Gradual painless blurring in right eye for 3 months"
          [required]="true"
          [value]="textVal()"
          (valueChange)="textVal.set($event ?? ''); emitState({ value: $event ?? '' })"
        />
      }
      @case ('emr-number-input') {
        <emr-number-input
          label="Spherical equivalent"
          hint="Step 0.25 D"
          unit="D"
          [showSteppers]="true"
          [step]="0.25"
          [min]="-20"
          [max]="20"
          [value]="numVal()"
          (valueChange)="numVal.set($event); emitState({ value: $event })"
        />
      }
      @case ('emr-date-input') {
        <emr-date-input
          label="Next glaucoma review date"
          hint="Type a date or open the calendar picker"
          [value]="dateVal()"
          (valueChange)="dateVal.set($event ?? ''); emitState({ value: $event ?? '' })"
        />
      }
      @case ('emr-time-input') {
        <emr-time-input
          label="Dilation instillation time"
          [hint]="timeHourCycle() === '12' ? '12-hour hh:mm AM/PM' : '24-hour hh:mm'"
          [precision]="timePrecision()"
          [hourCycle]="timeHourCycle()"
          [size]="timeSize()"
          [clearable]="timeClearable()"
          [disabled]="timeDisabled()"
          [required]="timeRequired()"
          [value]="timeVal()"
          (valueChange)="timeVal.set($event); emitState({ value: $event })"
          (cleared)="timeVal.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-datetime-input') {
        <emr-datetime-input
          label="Tonometry timestamp"
          [hint]="dtWireFormat().toUpperCase() + ': ' + (dtVal() ?? 'null')"
          [displayFormat]="dtDisplayFormat()"
          [timePrecision]="dtTimePrecision()"
          [hourCycle]="dtHourCycle()"
          [wireFormat]="dtWireFormat()"
          [size]="dtSize()"
          [clearable]="dtClearable()"
          [disabled]="dtDisabled()"
          [required]="dtRequired()"
          [value]="dtVal()"
          (valueChange)="dtVal.set($event); emitState({ value: $event })"
          (cleared)="dtVal.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-select') {
        <emr-select
          label="Operative laterality & priority"
          [options]="selectClinicalOptions"
          [multiple]="selectMultiple()"
          [value]="selectVal()"
          [variant]="selectVariant()"
          [size]="selectSize()"
          [clearable]="selectClearable()"
          [closeOnSelect]="selectCloseOnSelect()"
          [maxSelections]="selectMaxSelections()"
          [maxTagCount]="selectMaxTagCount()"
          [loading]="selectLoading()"
          [required]="selectRequired()"
          [readOnly]="selectReadOnly()"
          [disabled]="selectDisabled()"
          [invalid]="selectInvalid()"
          [labelHidden]="selectLabelHidden()"
          [warning]="selectWarning()"
          [error]="selectError()"
          (valueChange)="selectVal.set($event); emitState({ value: $event })"
          (cleared)="emitState({ value: selectVal() })"
        />
      }
      @case ('emr-quantity-input') {
        <emr-quantity-input
          label="Applanation IOP"
          [units]="unitOptions"
          [min]="0"
          [max]="80"
          [step]="0.5"
          [mode]="qtyMode()"
          [size]="qtySize()"
          [showSteppers]="qtySteppers()"
          [clearable]="qtyClearable()"
          [disabled]="qtyDisabled()"
          [value]="qtyVal()"
          [unit]="qtyUnit()"
          (valueChange)="qtyVal.set($event); emitState({ value: $event })"
          (unitChange)="qtyUnit.set($event); emitState({ unit: $event })"
          (cleared)="qtyVal.set(null); qtyUnit.set(null); emitState({ value: null, unit: null })"
        />
      }
      @case ('emr-paired-input') {
        <emr-paired-input
          label="Presenting visual acuity (OD / OS)"
          firstLabel="OD"
          secondLabel="OS"
          [inputType]="pairedInputType()"
          [options]="pairedInputType() === 'select' ? pairedVaOptions : []"
          [firstValue]="pairedLeft()"
          [secondValue]="pairedRight()"
          (firstValueChange)="pairedLeft.set($event ?? ''); emitState({ od: $event ?? '' })"
          (secondValueChange)="pairedRight.set($event ?? ''); emitState({ os: $event ?? '' })"
        />
      }
      @case ('emr-checkbox') {
        <emr-checkbox
          label="Pupils dilated with Tropicamide 0.8% + Phenylephrine 5%"
          [description]="cbDescription()"
          [hint]="cbHint()"
          [warning]="cbWarning()"
          [error]="cbError()"
          [checked]="checkedVal()"
          [mixed]="cbMixed()"
          [variant]="cbVariant()"
          [size]="cbSize()"
          [labelPlacement]="cbPlacement()"
          [disabled]="cbDisabled()"
          [required]="cbRequired()"
          [readOnly]="cbReadOnly() || readOnly()"
          (checkedChange)="checkedVal.set($event); cbMixed.set(false); emitState({ checked: $event, mixed: false })"
        />
      }
      @case ('emr-toggle') {
        <emr-toggle
          [controlId]="toggleControlId()"
          [label]="toggleLabel()"
          [description]="toggleDescription()"
          [labelHidden]="toggleLabelHidden()"
          [labelPlacement]="togglePlacement()"
          [variant]="toggleVariant()"
          [size]="toggleSize()"
          [onLabel]="toggleOnLabel()"
          [offLabel]="toggleOffLabel()"
          [ariaLabel]="toggleAriaLabel()"
          [checked]="toggleVal()"
          [value]="toggleValue()"
          [required]="toggleRequired()"
          [readOnly]="toggleReadOnly() || readOnly()"
          [disabled]="toggleDisabled()"
          [loading]="toggleLoading()"
          [invalid]="toggleInvalid()"
          [hint]="toggleHint()"
          [warning]="toggleWarning()"
          [error]="toggleError()"
          (checkedChange)="toggleVal.set($event); toggleValue.set($event); emitState({ checked: $event, value: $event })"
          (valueChange)="toggleValue.set($event); toggleVal.set($event)"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ blurred: true })"
        />
      }
      @case ('emr-radio-group') {
        <emr-radio-group
          label="Referral triage priority"
          [options]="radioGroupOptions"
          [orientation]="radioOrientation()"
          [columns]="radioColumns()"
          [variant]="radioVariant()"
          [size]="radioSize()"
          [labelPlacement]="radioLabelPlacement()"
          [clearable]="radioClearable()"
          [allowDeselect]="radioAllowDeselect()"
          [readOnly]="radioReadOnly()"
          [disabled]="radioDisabled()"
          [required]="radioRequired()"
          [invalid]="radioInvalid()"
          [labelHidden]="radioLabelHidden()"
          [hint]="radioHint()"
          [warning]="radioWarning()"
          [error]="radioError()"
          [value]="radioVal()"
          (valueChange)="radioVal.set($event); emitState({ value: $event })"
          (cleared)="radioVal.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-checkbox-group') {
        <emr-checkbox-group
          label="Pre-operative preparation checks"
          [options]="checkboxGroupOptions"
          [exclusiveValues]="['none']"
          [orientation]="cbgOrientation()"
          [columns]="cbgColumns()"
          [variant]="cbgVariant()"
          [size]="cbgSize()"
          [labelPlacement]="cbgLabelPlacement()"
          [showSelectAll]="cbgShowSelectAll()"
          [showSelectionCount]="cbgShowSelectionCount()"
          [clearable]="cbgClearable()"
          [minSelections]="cbgMinSelections()"
          [maxSelections]="cbgMaxSelections()"
          [disabled]="cbgDisabled()"
          [required]="cbgRequired()"
          [readOnly]="cbgReadOnly()"
          [invalid]="cbgInvalid()"
          [labelHidden]="cbgLabelHidden()"
          [warning]="cbgWarning()"
          [error]="cbgError()"
          [value]="cbgVal()"
          (valueChange)="cbgVal.set($event); emitState({ value: $event })"
          (cleared)="emitState({ value: cbgVal() })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-toggle-group') {
        <emr-toggle-group
          label="Communication preferences"
          [options]="toggleGroupOptions"
          [exclusiveValues]="['none']"
          [values]="tgValues()"
          [multiple]="tgMultiple()"
          [allowEmpty]="tgAllowEmpty()"
          [variant]="tgVariant()"
          [size]="tgSize()"
          [orientation]="tgOrientation()"
          [columns]="tgColumns()"
          [labelPlacement]="tgLabelPlacement()"
          [showStateLabels]="tgShowStateLabels()"
          [showSelectAll]="tgShowSelectAll()"
          [showSelectionCount]="tgShowSelectionCount()"
          [clearable]="tgClearable()"
          [maxSelections]="tgMaxSelections()"
          [required]="tgRequired()"
          [readOnly]="tgReadOnly()"
          [disabled]="tgDisabled()"
          [invalid]="tgInvalid()"
          [labelHidden]="tgLabelHidden()"
          [warning]="tgWarning()"
          [error]="tgError()"
          (valuesChange)="tgValues.set($event); emitState({ values: $event })"
          (cleared)="emitState({ values: tgValues(), cleared: true })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-tree-view') {
        <emr-tree-view
          label="Ocular examination hierarchy"
          [nodes]="ocularTreeNodes"
          [multiple]="tvMultiple()"
          [checkStrategy]="tvCheckStrategy()"
          [size]="tvSize()"
          [searchable]="tvSearchable()"
          [showExpandControls]="tvShowExpandControls()"
          [clearable]="tvClearable()"
          [maxSelections]="tvMaxSelections()"
          [value]="tvValue()"
          [values]="tvValues()"
          [expandedIds]="tvExpandedIds()"
          [required]="tvRequired()"
          [readOnly]="tvReadOnly()"
          [disabled]="tvDisabled()"
          [invalid]="tvInvalid()"
          [labelHidden]="tvLabelHidden()"
          [warning]="tvWarning()"
          [error]="tvError()"
          (valueChange)="tvValue.set($event); emitState({ value: $event })"
          (valuesChange)="tvValues.set($event); emitState({ values: $event })"
          (expandedIdsChange)="tvExpandedIds.set($event); emitState({ expandedIds: $event })"
          (cleared)="emitState({ value: tvValue(), values: tvValues(), cleared: true })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-tree-select') {
        <emr-tree-select
          label="Primary anatomical site"
          [nodes]="ocularTreeNodes"
          [multiple]="tsMultiple()"
          [checkStrategy]="tsCheckStrategy()"
          [displayMode]="tsDisplayMode()"
          [variant]="tsVariant()"
          [size]="tsSize()"
          [searchable]="tsSearchable()"
          [showExpandControls]="tsShowExpandControls()"
          [clearable]="tsClearable()"
          [maxTagCount]="tsMaxTagCount()"
          [maxSelections]="tsMaxSelections()"
          [loading]="tsLoading()"
          [value]="tsValue()"
          [values]="tsValues()"
          [required]="tsRequired()"
          [readOnly]="tsReadOnly()"
          [disabled]="tsDisabled()"
          [invalid]="tsInvalid()"
          [labelHidden]="tsLabelHidden()"
          [warning]="tsWarning()"
          [error]="tsError()"
          (valueChange)="tsValue.set($event); emitState({ value: $event })"
          (valuesChange)="tsValues.set($event); emitState({ values: $event })"
          (cleared)="emitState({ value: tsValue(), values: tsValues(), cleared: true })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-segmented-control') {
        <emr-segmented-control
          label="Operative eye & verification"
          [options]="segOptions()"
          [value]="segVal()"
          [size]="segSize()"
          [variant]="segVariant()"
          [shape]="segShape()"
          [orientation]="segOrientation()"
          [fullWidth]="segFullWidth()"
          [clearable]="segClearable()"
          [allowDeselect]="segAllowDeselect()"
          [required]="segRequired()"
          [invalid]="segInvalid()"
          [readOnly]="segReadOnly()"
          [disabled]="segDisabled()"
          [labelHidden]="segLabelHidden()"
          [hint]="segHint()"
          [warning]="segWarning()"
          [error]="segError()"
          (valueChange)="segVal.set($event); emitState({ value: $event })"
          (cleared)="emitState({ value: null, cleared: true })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-badge') {
        <emr-badge
          [tone]="badgeTone()"
          [label]="'Status · ' + badgeTone()"
          [variant]="badgeVariant()"
          [size]="badgeSize()"
          [shape]="badgeShape()"
          [dot]="badgeDot()"
        />
      }
      @case ('emr-chip') {
        <emr-chip
          [label]="'Topical Rx · ' + chipTone()"
          [tone]="chipTone()"
          [variant]="chipVariant()"
          [size]="chipSize()"
          [selectable]="chipSelectable()"
          [selected]="chipSelected()"
          [removable]="chipRemovable()"
          [disabled]="chipDisabled()"
          (selectedChange)="chipSelected.set($event); emitState({ selected: $event })"
          (removeRequested)="chipSelected.set(false); emitState({ selected: false })"
        />
      }
      @case ('emr-alert') {
        <emr-alert [tone]="alertTone()" title="Intraocular pressure asymmetry">
          Left eye IOP exceeds controller threshold (28 mmHg vs 15 mmHg OD). Verify pachymetry and angle grade.
        </emr-alert>
      }
      @case ('emr-state-message') {
        <emr-state-message
          [kind]="stateMsgKind()"
          [compact]="stateMsgCompact()"
          [title]="stateMsgKind() === 'error' ? 'Imaging service unreachable' : stateMsgKind() === 'loading' ? 'Loading studies' : 'No prior OCT scans'"
          message="Synthetic status message rendered identically in React, Lit, and Angular."
          [actionLabel]="stateMsgKind() === 'loading' ? '' : stateMsgActionLabel()"
          [actionDisabled]="stateMsgActionDisabled()"
          (actionTriggered)="emitState({ kind: stateMsgKind() })"
        />
      }
      @case ('emr-separator') {
        <div [style]="sepOrientation() === 'vertical' ? 'display:flex;align-items:center;min-height:32px;' : 'display:flex;flex-direction:column;gap:8px;'">
          <span style="font-size:var(--emr-text-md);color:var(--emr-text);">Anterior segment normal</span>
          <emr-separator
            [label]="sepLabel()"
            [orientation]="sepOrientation()"
            [labelAlign]="sepLabelAlign()"
            [variant]="sepVariant()"
            [decorative]="sepDecorative()"
          />
          <span style="font-size:var(--emr-text-md);color:var(--emr-text);">Cup-to-disc ratio 0.65 OD, 0.55 OS</span>
        </div>
      }
      @case ('emr-card') {
        <emr-card
          [label]="cardTitle()"
          [subtitle]="cardSubtitle()"
          [variant]="cardVariant()"
          [padding]="cardPadding()"
          [tone]="cardTone()"
          [interactive]="cardInteractive()"
          [selected]="cardSelected()"
          [disabled]="cardDisabled()"
          (activated)="cardSelected.set(!cardSelected()); emitState({ selected: cardSelected() })"
        >
          <div style="display:grid;gap:4px;font-size:var(--emr-text-md);color:var(--emr-text);">
            <div>OD: -1.50 DS / -0.50 DC × 90° (BCVA 6/6)</div>
            <div>OS: -1.25 DS / -0.75 DC × 85° (BCVA 6/6)</div>
          </div>
        </emr-card>
      }
      @case ('emr-section-card') {
        <emr-section-card
          sectionId="parity-sec-angular"
          label="Anterior Segment Slit-Lamp"
          [description]="sectionCardShowDescription() ? 'Collapsible L3 section container (expands automatically in .emr-print)' : undefined"
          [status]="sectionCardShowStatus() ? { label: 'Recorded', tone: 'success' } : undefined"
          [collapsible]="sectionCardCollapsible()"
          [collapsed]="sectionCardCollapsed()"
          [headingLevel]="sectionCardHeadingLevel()"
          [variant]="sectionCardVariant()"
          [tone]="sectionCardTone()"
          [padding]="sectionCardPadding()"
          [readOnly]="sectionCardReadOnly()"
          (intent)="sectionCardCollapsed.set(!sectionCardCollapsed()); emitState({ collapsed: sectionCardCollapsed() })"
        >
          <div style="display:grid;gap:6px">
            <emr-field-value-row field="Cornea (OD / OS)" value="Clear / Clear" remarks="Fluorescein negative" />
            <emr-field-value-row field="Lens (OD / OS)" value="NS Grade II / Pseudophakic PCIOL" remarks="Dilated" />
          </div>
        </emr-section-card>
      }
      @case ('emr-repeatable-group') {
        <emr-repeatable-group
          [definition]="repeatGroupDef"
          [model]="repeatEmpty() ? [] : repeatItems()"
          [readOnly]="repeatReadOnly() || readOnly()"
          idPrefix="parity-rg-a"
          [error]="repeatError() ? 'At least one post-operative topical drop regimen is required' : undefined"
          [warning]="repeatWarning() ? 'Verify preservative-free drops for corneal graft patients' : undefined"
          (intent)="onRepeatIntent($event)"
        />
      }
      @case ('emr-clinical-form') {
        <emr-clinical-form
          [model]="clinicalFormModel()"
          idPrefix="parity-cf-a"
          (intent)="onClinicalFormIntent($event)"
        />
      }
      @case ('emr-clinical-list') {
        <emr-clinical-list
          [model]="clinicalListModelFor('emr-clinical-list')"
          (intent)="onClinicalListIntent('emr-clinical-list', $event)"
        />
      }
      @case ('emr-medication-list') {
        <emr-medication-list
          [model]="clinicalListModelFor('emr-medication-list')"
          (intent)="onClinicalListIntent('emr-medication-list', $event)"
        />
      }
      @case ('emr-allergy-list') {
        <emr-allergy-list
          [model]="clinicalListModelFor('emr-allergy-list')"
          (intent)="onClinicalListIntent('emr-allergy-list', $event)"
        />
      }
      @case ('emr-chronic-disease-list') {
        <emr-chronic-disease-list
          [model]="clinicalListModelFor('emr-chronic-disease-list')"
          (intent)="onClinicalListIntent('emr-chronic-disease-list', $event)"
        />
      }
      @case ('emr-personal-history-list') {
        <emr-personal-history-list
          [model]="clinicalListModelFor('emr-personal-history-list')"
          (intent)="onClinicalListIntent('emr-personal-history-list', $event)"
        />
      }
      @case ('emr-clinical-matrix') {
        <emr-clinical-matrix
          [definition]="clinicalMatrixDefinition()"
          [model]="clinicalMatrixValues()"
          [readOnly]="clinicalMatrixReadOnly() || readOnly()"
          idPrefix="parity-cm-a"
          (intent)="onClinicalMatrixIntent($event)"
        />
      }
      @case ('emr-clinical-cell-renderer') {
        <emr-clinical-matrix
          [definition]="customCellSchema"
          [model]="customCellMatrixModel()"
          [readOnly]="customCellReadOnly() || readOnly()"
          idPrefix="parity-ccr-a"
          (intent)="onCustomCellMatrixIntent($event)"
        >
          <ng-template emrClinicalCellRenderer="angleStamp" let-ctx>
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small"
              [attr.aria-readonly]="ctx.readOnly ? 'true' : null"
              [attr.aria-label]="'Stamp ' + ctx.row.label + ' ' + ctx.column.label"
              (click)="ctx.emit('stamp', { columnId: ctx.column.id, next: (typeof ctx.cell?.value === 'number' ? ctx.cell.value : 0) + 1 })"
            >
              Stamp Shaffer IV · {{ ctx.column.id.toUpperCase() }} ({{ typeof ctx.cell?.value === 'number' ? ctx.cell.value : 0 }})
            </button>
          </ng-template>
        </emr-clinical-matrix>
      }
      @case ('emr-annotation-toolbar') {
        <emr-annotation-toolbar
          [model]="annotationToolbarModel()"
          idPrefix="parity-at-a"
          (intent)="onAnnotationToolbarIntent($event)"
        />
      }
      @case ('emr-annotation-list') {
        <emr-annotation-list
          [model]="annotationListModel()"
          idPrefix="parity-al-a"
          (intent)="onAnnotationListIntent($event)"
        />
      }
      @case ('emr-image-template-picker') {
        <emr-image-template-picker
          [model]="imageTemplatePickerModel()"
          idPrefix="parity-tp-a"
          (intent)="onImageTemplatePickerIntent($event)"
        />
      }
      @case ('emr-time-axis') {
        <emr-time-axis
          [model]="timeAxisModel()"
          idPrefix="parity-ta-a"
          (intent)="onTimeAxisIntent($event)"
        />
      }
      @case ('emr-data-table') {
        <emr-data-table
          [model]="dataTableModel()"
          idPrefix="parity-dt-a"
          (intent)="onDataTableIntent($event)"
        />
      }
      @case ('emr-split-workspace') {
        <emr-split-workspace
          [model]="splitWorkspaceModel()"
          idPrefix="parity-sw-a"
          (intent)="onSplitWorkspaceIntent($event)"
        />
      }
      @case ('emr-command-palette') {
        <emr-command-palette
          [model]="commandPaletteModel()"
          idPrefix="parity-cp-a"
          (intent)="onCommandPaletteIntent($event)"
        />
      }
      @case ('emr-master-detail') {
        <emr-master-detail
          [model]="masterDetailModel()"
          idPrefix="parity-md-a"
          (intent)="onMasterDetailIntent($event)"
        />
      }
      @case ('emr-synchronized-time-grid') {
        <emr-synchronized-time-grid
          [model]="synchronizedTimeGridModel()"
          idPrefix="parity-stg-a"
          (intent)="onSynchronizedTimeGridIntent($event)"
        />
      }
      @case ('emr-field-generator') {
        <emr-field-generator
          [model]="fgEffectiveModel()"
          idPrefix="parity-fg-a"
          (intent)="onFieldGeneratorIntent($event)"
        />
      }
      @case ('emr-terminology-search') {
        <emr-terminology-search
          [model]="tsEffectiveModel()"
          idPrefix="parity-ts-a"
          (intent)="onTerminologySearchIntent($event)"
        />
      }
      @case ('emr-validation-rule-editor') {
        <emr-validation-rule-editor
          [model]="vreEffectiveModel()"
          idPrefix="parity-vre-a"
          (intent)="onValidationRuleEditorIntent($event)"
        />
      }
      @case ('emr-field-library-picker') {
        <emr-field-library-picker
          [model]="flpEffectiveModel()"
          idPrefix="parity-flp-a"
          (intent)="onFieldLibraryPickerIntent($event)"
        />
      }
      @case ('emr-template-composer') {
        <emr-template-composer
          [model]="tcEffectiveModel()"
          idPrefix="parity-tc-a"
          (intent)="onTemplateComposerIntent($event)"
        />
      }
      @case ('emr-template-preview') {
        <emr-template-preview
          [model]="tpEffectiveModel()"
          idPrefix="parity-tpv-a"
          (intent)="onTemplatePreviewIntent($event)"
        />
      }
      @case ('emr-search-select') {
        <emr-search-select
          label="Glaucoma formulary search"
          [labelHidden]="searchLabelHidden()"
          [variant]="searchVariant()"
          [multiple]="searchMultiple()"
          [filterMode]="searchFilterMode()"
          [size]="searchSize()"
          [highlightMatch]="searchHighlightMatch()"
          [clearable]="searchClearable()"
          [creatable]="searchAllowCustom()"
          [maxTagCount]="searchMaxTagCount()"
          [maxSelections]="searchMaxSelections()"
          [loading]="searchLoading()"
          [disabled]="searchDisabled()"
          [readOnly]="searchReadOnly() || readOnly()"
          [required]="searchRequired()"
          [invalid]="searchInvalid()"
          [warning]="searchWarning()"
          [error]="searchError()"
          [query]="searchQuery()"
          [open]="searchOpen()"
          [value]="searchMultiple() ? searchPicked() : (searchPicked().length ? searchPicked()[0] : null)"
          [options]="searchFilteredOptions()"
          [selected]="searchSelectedOptions()"
          (queryChange)="searchQuery.set($event); searchOpen.set(true); emitState({ query: $event, open: true })"
          (searchRequested)="searchOpen.set(true); emitState({ open: true })"
          (openChange)="searchOpen.set($event); emitState({ open: $event })"
          (openRequested)="searchOpen.set(true); emitState({ open: true })"
          (closeRequested)="searchOpen.set(false); emitState({ open: false })"
          (optionSelected)="onSearchPick($event)"
          (removeRequested)="onSearchPick($event)"
          (cleared)="searchQuery.set(''); searchPicked.set([]); emitState({ query: '', picked: [] })"
        />
      }
      @case ('emr-combobox') {
        <emr-combobox
          label="Chief complaint (free-solo combobox)"
          [labelHidden]="comboLabelHidden()"
          [variant]="comboVariant()"
          [size]="comboSize()"
          [filterMode]="comboFilterMode()"
          [allowCustomValue]="comboAllowCustom()"
          [highlightMatch]="comboHighlightMatch()"
          [clearable]="comboClearable()"
          [loading]="comboLoading()"
          [required]="comboRequired()"
          [readOnly]="comboReadOnly()"
          [disabled]="comboDisabled()"
          [invalid]="comboInvalid()"
          [warning]="comboWarning()"
          [error]="comboError()"
          [open]="comboOpen()"
          [value]="comboValue()"
          [options]="comboOptions"
          (valueChange)="comboValue.set($event); emitState({ value: $event })"
          (openChange)="comboOpen.set($event); emitState({ open: $event })"
          (cleared)="comboValue.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-tag-input') {
        <emr-tag-input
          label="Allergies & Clinical Alerts"
          placeholder="Add allergen or press Enter…"
          [labelHidden]="tagLabelHidden()"
          [variant]="tagVariant()"
          [size]="tagSize()"
          [chipTone]="tagChipTone()"
          [clearable]="tagClearable()"
          [allowDuplicates]="tagAllowDuplicates()"
          [filterSuggestions]="tagFilterSuggestions()"
          [highlightMatch]="tagHighlightMatch()"
          [maxTags]="tagMaxTags()"
          [maxTagLength]="tagMaxTagLength()"
          [lockedTags]="tagLockedTags()"
          [required]="tagRequired()"
          [readOnly]="tagReadOnly()"
          [disabled]="tagDisabled()"
          [invalid]="tagInvalid()"
          [warning]="tagWarning()"
          [error]="tagError()"
          [tags]="tagValues()"
          [suggestions]="tagSuggestions"
          (tagsChange)="tagValues.set($event); emitState({ tags: $event, value: $event })"
          (cleared)="emitState({ tags: tagValues(), value: tagValues() })"
        />
      }
      @case ('emr-date-range-input') {
        <emr-date-range-input
          label="Encounter filter window"
          [value]="drValue()"
          [mode]="drMode()"
          [size]="drSize()"
          [variant]="drVariant()"
          [weekStartsOn]="drWeekStartsOn()"
          [presets]="drPresets"
          [showCalendar]="drShowCalendar()"
          [clearable]="drClearable()"
          [required]="drRequired()"
          [readOnly]="drReadOnly() || readOnly()"
          [disabled]="drDisabled()"
          [invalid]="drInvalid()"
          [labelHidden]="drLabelHidden()"
          [warning]="drWarning()"
          [error]="drError()"
          (valueChange)="drValue.set($event); emitState({ value: $event })"
          (cleared)="drValue.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-slider') {
        <emr-slider
          label="OCT overlay opacity"
          [value]="sliderValue()"
          [min]="0"
          [max]="100"
          [step]="5"
          unit="%"
          [marks]="sliderMarks"
          [size]="sliderSize()"
          [tone]="sliderTone()"
          [showValue]="sliderShowValue()"
          [showSteppers]="sliderShowSteppers()"
          [clearable]="sliderClearable()"
          [required]="sliderRequired()"
          [readOnly]="sliderReadOnly() || readOnly()"
          [disabled]="sliderDisabled()"
          [invalid]="sliderInvalid()"
          [labelHidden]="sliderLabelHidden()"
          [warning]="sliderWarning()"
          [error]="sliderError()"
          (valueChange)="sliderValue.set($event); emitState({ value: $event })"
          (cleared)="sliderValue.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-range-slider') {
        <emr-range-slider
          label="Target IOP therapeutic band"
          [value]="rangeSliderValue()"
          [min]="6"
          [max]="30"
          [minDistance]="2"
          unit="mmHg"
          [marks]="rangeSliderMarks"
          [size]="rangeSliderSize()"
          [tone]="rangeSliderTone()"
          [showValue]="rangeSliderShowValue()"
          [clearable]="rangeSliderClearable()"
          [required]="rangeSliderRequired()"
          [readOnly]="rangeSliderReadOnly() || readOnly()"
          [disabled]="rangeSliderDisabled()"
          [invalid]="rangeSliderInvalid()"
          [labelHidden]="rangeSliderLabelHidden()"
          [warning]="rangeSliderWarning()"
          [error]="rangeSliderError()"
          (valueChange)="rangeSliderValue.set($event); emitState({ value: $event })"
          (cleared)="rangeSliderValue.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-masked-input') {
        <emr-masked-input
          label="ABHA health identifier"
          mask="99-9999-9999-9999"
          [value]="maskedValue()"
          [size]="maskedSize()"
          [variant]="maskedVariant()"
          [unmask]="maskedUnmask()"
          [showMaskHint]="maskedShowHint()"
          [uppercase]="maskedUppercase()"
          [clearable]="maskedClearable()"
          [required]="maskedRequired()"
          [readOnly]="maskedReadOnly() || readOnly()"
          [disabled]="maskedDisabled()"
          [invalid]="maskedInvalid()"
          [labelHidden]="maskedLabelHidden()"
          [warning]="maskedWarning()"
          [error]="maskedError()"
          (valueChange)="maskedValue.set($event); emitState({ value: $event })"
          (cleared)="maskedValue.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-otp-input') {
        <emr-otp-input
          label="Patient consent verification OTP"
          [length]="6"
          [value]="otpValue()"
          [secret]="otpSecret()"
          [numericOnly]="otpNumericOnly()"
          [uppercase]="otpUppercase()"
          [separatorAfter]="otpSeparatorAfter() > 0 ? otpSeparatorAfter() : undefined"
          [size]="otpSize()"
          [variant]="otpVariant()"
          [clearable]="otpClearable()"
          [required]="otpRequired()"
          [readOnly]="otpReadOnly() || readOnly()"
          [disabled]="otpDisabled()"
          [invalid]="otpInvalid()"
          [labelHidden]="otpLabelHidden()"
          [warning]="otpWarning()"
          [error]="otpError()"
          (valueChange)="otpValue.set($event); emitState({ value: $event })"
          (cleared)="otpValue.set(''); emitState({ value: '' })"
        />
      }
      @case ('emr-menu') {
        <emr-menu
          controlId="parity-menu-angular"
          label="Encounter actions"
          triggerIcon="more-vertical"
          [items]="encounterMenuItems"
          [variant]="menuVariant()"
          [size]="menuSize()"
          [align]="menuAlign()"
          [readOnly]="menuReadOnly() || readOnly()"
          [disabled]="menuDisabled()"
          (itemSelected)="emitState({ lastAction: $event.id })"
        />
      }
      @case ('emr-split-button') {
        <emr-split-button
          controlId="parity-split-button-angular"
          label="Sign encounter"
          [items]="signMenuItems"
          [variant]="splitVariant()"
          [size]="splitSize()"
          [align]="splitAlign()"
          [loading]="splitLoading()"
          [readOnly]="splitReadOnly() || readOnly()"
          [disabled]="splitDisabled()"
          (clicked)="emitState({ lastCommit: 'sign-primary' })"
          (itemSelected)="emitState({ lastCommit: $event.id })"
        />
      }
      @case ('emr-accordion') {
        <emr-accordion
          controlId="parity-accordion-angular"
          [items]="postopAccordionItems"
          [expandedIds]="accordionExpandedIds()"
          [multiple]="accordionMultiple()"
          [variant]="accordionVariant()"
          [size]="accordionSize()"
          [readOnly]="accordionReadOnly() || readOnly()"
          [disabled]="accordionDisabled()"
          (expandedIdsChange)="accordionExpandedIds.set($event); emitState({ expandedIds: $event })"
        />
      }
      @case ('emr-breadcrumbs') {
        <emr-breadcrumbs
          controlId="parity-breadcrumbs-angular"
          [items]="clinicBreadcrumbs"
          [maxItems]="breadcrumbsMaxItems() > 0 ? breadcrumbsMaxItems() : undefined"
          [separator]="breadcrumbsSeparator()"
          [size]="breadcrumbsSize()"
          (itemSelected)="emitState({ activeCrumb: $event.id })"
        />
      }
      @case ('emr-color-picker') {
        <emr-color-picker
          controlId="parity-color-picker-angular"
          label="Retinal annotation pen colour"
          [swatches]="clinicalColorSwatches"
          [value]="colorPickerValue()"
          [allowCustomHex]="colorPickerAllowCustomHex()"
          [clearable]="colorPickerClearable()"
          [size]="colorPickerSize()"
          [required]="colorPickerRequired()"
          [readOnly]="colorPickerReadOnly() || readOnly()"
          [disabled]="colorPickerDisabled()"
          [invalid]="colorPickerInvalid()"
          [labelHidden]="colorPickerLabelHidden()"
          [warning]="colorPickerWarning()"
          [error]="colorPickerError()"
          (valueChange)="colorPickerValue.set($event); emitState({ value: $event })"
          (cleared)="colorPickerValue.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-copy-button') {
        <emr-copy-button
          controlId="parity-copy-button-angular"
          value="MRN-2026-0419"
          label="Copy MRN"
          [variant]="copyButtonVariant()"
          [size]="copyButtonSize()"
          [iconOnly]="copyButtonIconOnly()"
          [disabled]="copyButtonDisabled()"
          (copied)="copyButtonCount.set(copyButtonCount() + 1); emitState({ copiedCount: copyButtonCount() })"
        />
      }
      @case ('emr-columns') {
        <emr-columns
          [count]="colsCount()"
          [gap]="colsGap()"
          [align]="colsAlign()"
          [collapseBelow]="colsCollapseBelow()"
        >
          <emr-card label="OD IOP">
            <div style="font-size:var(--emr-text-md);color:var(--emr-text);">15 mmHg (GAT)</div>
          </emr-card>
          <emr-card label="OS IOP">
            <div style="font-size:var(--emr-text-md);color:var(--emr-text);">17 mmHg (GAT)</div>
          </emr-card>
          <emr-card label="Pachymetry">
            <div style="font-size:var(--emr-text-md);color:var(--emr-text);">542 µm / 538 µm</div>
          </emr-card>
        </emr-columns>
      }
      @case ('emr-field-value-row') {
        <div role="table" aria-label="Clinical findings" style="width:100%;">
          <emr-field-value-row
            heading
            [size]="fvrSize()"
            field="Parameter"
            value="Measurement"
            remarks="Method"
            notes="Notes"
          />
          <emr-field-value-row
            [size]="fvrSize()"
            [tone]="fvrTone()"
            [truncate]="fvrTruncate()"
            [interactive]="fvrInteractive()"
            [readOnly]="readOnly()"
            field="IOP (OD)"
            [value]="fvrActivations() > 0 ? '15 mmHg (' + fvrActivations() + ')' : '15 mmHg'"
            remarks="GAT (Goldmann applanation)"
            notes="09:40"
            (activated)="fvrActivations.set(fvrActivations() + 1); emitState({ activations: fvrActivations() })"
          />
          <emr-field-value-row
            [size]="fvrSize()"
            [truncate]="fvrTruncate()"
            field="IOP (OS)"
            value=""
            remarks="Pending"
            notes="Scheduled"
          />
        </div>
      }
      @case ('emr-status-cell') {
        <emr-status-cell
          [status]="{ label: 'Recorded', tone: 'success' }"
          [valueLabel]="'124/78 mmHg (' + statusEdits() + ' actions)'"
          [attribution]="{ nameLabel: 'Nurse K. Nair', roleLabel: 'OPD Nurse', timeLabel: '09:15' }"
          [action]="{ label: 'Edit', icon: 'pen' }"
          secondaryNote="Seated, right arm"
          [compact]="statusCompact()"
          [selectable]="statusSelectable()"
          [isSelected]="statusSelected()"
          [disabled]="statusDisabled()"
          [size]="statusSize()"
          [readOnly]="readOnly()"
          (intent)="
            $event === 'selected'
              ? statusSelected.set(!statusSelected())
              : statusEdits.set(statusEdits() + 1);
            emitState({ selected: statusSelected(), edits: statusEdits() })
          "
        />
      }
      @case ('emr-stage-stepper') {
        <emr-stage-stepper
          [stages]="stepperStages"
          [activeId]="stepperActiveId()"
          [completedIds]="['referred']"
          [orientation]="stepperOrientation()"
          [size]="stepperSize()"
          [clickable]="stepperClickable()"
          [linear]="stepperLinear()"
          [disabled]="stepperDisabled()"
          [readOnly]="readOnly()"
          (stageSelected)="stepperActiveId.set($event); emitState({ activeId: $event })"
        />
      }
      @case ('emr-stat-tile') {
        <emr-stat-tile
          [model]="statTileModel()"
          [tone]="statTone()"
          [size]="statSize()"
          [interactive]="statInteractive()"
          [selected]="statSelected()"
          [loading]="statLoading()"
          [disabled]="statDisabled()"
          [readOnly]="readOnly()"
          (intent)="statClicks.set(statClicks() + 1); emitState({ clicks: statClicks() })"
        />
      }
      @case ('emr-field-frame') {
        <emr-field-frame
          controlId="parity-ff-ng"
          label="Central corneal thickness (OD)"
          [unit]="ffUnit()"
          [layout]="ffLayout()"
          [showMetadata]="ffShowMetadata()"
          [readOnly]="readOnly()"
          [required]="true"
          hint="Ultrasonic pachymetry mean of 3 readings"
          note="Calibrated 08:30"
          [warning]="!ffValue() ? 'Missing pachymetry reading' : undefined"
          [assessmentStatus]="ffStatus()"
          [assessmentStatusOptions]="ffStatusOptions"
          (intent)="onFieldFrameIntent($event)"
        >
          <emr-text-input
            controlId="parity-ff-ng"
            ariaLabel="Central corneal thickness (OD)"
            [readOnly]="readOnly()"
            [value]="ffValue()"
            (valueChange)="ffValue.set($event ?? ''); emitState({ value: $event ?? '' })"
          />
        </emr-field-frame>
      }
      @case ('emr-tabs') {
        <emr-tabs
          ariaLabel="Encounter sections"
          [tabs]="tabOptions"
          [value]="activeTab()"
          [variant]="tabsVariant()"
          [size]="tabsSize()"
          [orientation]="tabsOrientation()"
          [fitted]="tabsFitted()"
          [disabled]="tabsDisabled()"
          (valueChange)="activeTab.set($event); emitState({ active: $event })"
        />
      }
      @case ('emr-likert') {
        <emr-likert
          [label]="likertScaleMode() === 'text' ? 'Post-op discomfort level (text scale)' : 'Ocular surface discomfort score (0–10)'"
          [min]="likertScaleMode() === 'text' ? 1 : 0"
          [max]="likertScaleMode() === 'text' ? 5 : 10"
          [anchors]="likertScaleMode() === 'text' ? [] : likertAnchors"
          [options]="likertScaleMode() === 'text' ? likertTextOptions : []"
          [showOptionLabels]="false"
          [tone]="likertVal() !== null && (likertScaleMode() === 'text' ? likertVal()! >= 4 : likertVal()! >= 7) ? 'danger' : 'info'"
          [clearable]="likertClearable()"
          [fullWidth]="likertFullWidth()"
          [disabled]="likertDisabled()"
          [required]="likertRequired()"
          [value]="likertVal()"
          (valueChange)="likertVal.set($event); emitState({ value: $event })"
          (cleared)="likertVal.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-vas') {
        <emr-vas
          [label]="vasPrecision() === 'integer' ? 'Post-operative pain VAS (0–10)' : 'Post-operative pain VAS (0.0–10.0)'"
          [min]="0"
          [max]="10"
          [precision]="vasPrecision()"
          [majorInterval]="5"
          [minorInterval]="1"
          [orientation]="vasOrientation()"
          [size]="vasSize()"
          [tone]="vasTone()"
          [clearable]="vasClearable()"
          [disabled]="vasDisabled()"
          [required]="vasRequired()"
          [anchors]="vasAnchors"
          [value]="vasVal()"
          (valueChange)="vasVal.set($event); emitState({ value: $event })"
          (cleared)="vasVal.set(null); emitState({ value: null })"
        />
      }
      @case ('emr-typed-field') {
        <emr-typed-field
          [definition]="typedDef"
          [model]="typedState()"
          [readOnly]="readOnly()"
          (valueChange)="typedState.set({ ...typedState(), value: $event }); emitState({ model: typedState() })"
          (statusChange)="typedState.set({ ...typedState(), assessmentStatus: $event }); emitState({ model: typedState() })"
        />
      }
      @case ('emr-coded-input') {
        <emr-coded-input
          controlId="parity-coded-ng"
          [model]="codedModel()"
          [readOnly]="readOnly()"
          (intent)="onCodedIntent($event)"
        />
      }
      @case ('emr-attestation') {
        <emr-attestation
          controlId="parity-attest-ng"
          [model]="attestationModel()"
          [readOnly]="readOnly()"
          (intent)="onAttestationIntent($event)"
        />
      }
      @case ('emr-schedule-slot-picker') {
        <emr-schedule-slot-picker
          controlId="parity-ssp-ng"
          label="Dosing schedule (Brinzolamide 1%)"
          hint="Select time-of-day slots or apply a frequency preset"
          [slots]="sspSlots"
          [presets]="sspPresets"
          unitLabel="drops"
          [amountMode]="sspAmountMode()"
          [readOnly]="readOnly()"
          [value]="sspValue()"
          (valueChange)="onSspValueChange($event)"
        />
      }
      @case ('emr-identifier-entry') {
        <emr-identifier-entry
          controlId="parity-ident-ng"
          [model]="identModel()"
          [readOnly]="readOnly()"
          (intent)="onIdentIntent($event)"
        />
      }
      @case ('emr-scale-field') {
        <emr-scale-field
          controlId="parity-scale-ng"
          [model]="scaleModel()"
          [readOnly]="readOnly()"
          (intent)="onScaleIntent($event)"
        />
      }
      @case ('emr-partial-date-field') {
        <emr-partial-date-field
          controlId="parity-pd-ng"
          [model]="partialDateModel()"
          [readOnly]="readOnly()"
          (intent)="onPartialDateIntent($event)"
        />
      }
      @case ('emr-attachment-field') {
        <emr-attachment-field
          controlId="parity-att-ng"
          [model]="attachmentModel()"
          [readOnly]="readOnly()"
          (intent)="onAttachmentIntent($event)"
        />
      }
      @case ('emr-paired-field') {
        <emr-paired-field
          controlId="parity-paired-ng"
          [model]="pairedModel()"
          [labelHidden]="pairedLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onPairedIntent($event)"
        />
      }
      @case ('emr-duration-input') {
        <emr-duration-input
          controlId="parity-duration-ng"
          [model]="durationModel()"
          [labelHidden]="durationLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onDurationIntent($event)"
        />
      }
      @case ('emr-range-field') {
        <emr-range-field
          controlId="parity-range-ng"
          [model]="rangeModel()"
          [labelHidden]="rangeLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onRangeIntent($event)"
        />
      }
      @case ('emr-phone-input') {
        <emr-phone-input
          controlId="parity-phone-ng"
          [model]="phoneModel()"
          [labelHidden]="phoneLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onPhoneIntent($event)"
        />
      }
      @case ('emr-address-field') {
        <emr-address-field
          controlId="parity-address-ng"
          [model]="addressModel()"
          [labelHidden]="addressLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onAddressIntent($event)"
        />
      }
      @case ('emr-macro-text-field') {
        <emr-macro-text-field
          controlId="parity-macro-ng"
          [model]="macroTextModel()"
          [labelHidden]="macroTextLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onMacroTextIntent($event)"
        />
      }
      @case ('emr-laterality-field') {
        <emr-laterality-field
          controlId="parity-laterality-ng"
          [model]="lateralityModel()"
          [labelHidden]="lateralityLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onLateralityIntent($event)"
        />
      }
      @case ('emr-visual-acuity-field') {
        <emr-visual-acuity-field
          controlId="parity-va-ng"
          [model]="visualAcuityModel()"
          [labelHidden]="visualAcuityLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onVisualAcuityIntent($event)"
        />
      }
      @case ('emr-refraction-field') {
        <emr-refraction-field
          controlId="parity-refraction-ng"
          [model]="refractionModel()"
          [labelHidden]="refractionLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onRefractionIntent($event)"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-signature-capture-field') {
        <emr-signature-capture-field
          controlId="parity-signature-ng"
          [model]="signatureModel()"
          [labelHidden]="signatureLabelHidden()"
          [readOnly]="readOnly()"
          (intent)="onSignatureIntent($event)"
        />
      }
      @case ('emr-image-viewer') {
        <emr-image-viewer
          controlId="parity-image-viewer-ng"
          label="Fundus photograph inspector"
          [src]="sampleFundusSrc"
          alt="Simulated OD colour fundus"
          caption="OD posterior pole — 45° field"
          [images]="ivMultiImage() ? ivGallery : []"
          [activeIndex]="ivActiveIndex()"
          [viewport]="ivViewport()"
          [allowFullscreen]="ivAllowFullscreen()"
          [showThumbnails]="ivShowThumbnails()"
          [height]="ivHeight()"
          [labelHidden]="ivLabelHidden()"
          [readOnly]="ivReadOnly()"
          [disabled]="ivDisabled()"
          [warning]="ivWarning()"
          [error]="ivError()"
          (viewportChange)="ivViewport.set($event); emitState({ viewport: $event })"
          (activeIndexChange)="ivActiveIndex.set($event); emitState({ activeIndex: $event })"
          (fullscreenChange)="emitState({ fullscreen: $event })"
          (closeRequested)="emitState({ fullscreen: false })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-image-cropper') {
        <emr-image-cropper
          controlId="parity-image-cropper-ng"
          label="Optic disc ROI cropper"
          [src]="sampleFundusSrc"
          alt="Optic disc crop target"
          [aspectPresets]="defaultAspectPresets"
          [transform]="icTransform()"
          [labelHidden]="icLabelHidden()"
          [readOnly]="icReadOnly()"
          [disabled]="icDisabled()"
          [warning]="icWarning()"
          [error]="icError()"
          (cropChange)="icTransform.set($event); emitState({ transform: $event })"
          (cropCommitted)="icTransform.set($event.transform); emitState({ transform: $event.transform, croppedDataUrl: $event.croppedDataUrl })"
          (cancelRequested)="emitState({ canceled: true })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-image-upload') {
        <emr-image-upload
          controlId="parity-image-upload-ng"
          label="Anterior segment & fundus upload"
          [items]="iuItems()"
          [multiple]="iuMultiple()"
          [maxFiles]="iuMaxFiles()"
          [allowCamera]="iuAllowCamera()"
          [aspectPresets]="defaultAspectPresets"
          [labelHidden]="iuLabelHidden()"
          [required]="iuRequired()"
          [readOnly]="iuReadOnly()"
          [disabled]="iuDisabled()"
          [warning]="iuWarning()"
          [error]="iuError()"
          (itemsChange)="iuItems.set($event); emitState({ items: $event })"
          (filesSelected)="emitState({ filesSelected: $event })"
          (imageCropped)="emitState({ imageCropped: $event })"
          (captionChange)="emitState({ captionChange: $event })"
          (removeRequested)="emitState({ removeRequested: $event })"
          (captureRequested)="emitState({ captureRequested: $event })"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-image-field') {
        <emr-image-field
          controlId="parity-image-field-ng"
          [model]="imageFieldModel()"
          [labelHidden]="ifLabelHidden()"
          [layout]="ifLayout()"
          [showMetadata]="ifShowMetadata()"
          [readOnly]="ifReadOnly()"
          (intent)="onImageFieldIntent($event)"
          (focused)="emitState({ focused: true })"
          (blurred)="emitState({ focused: false })"
        />
      }
      @case ('emr-textarea') {
        <emr-textarea
          controlId="parity-textarea-ng"
          label="History of present illness"
          hint="Recorded in patient's own words"
          [rows]="3"
          [maxLength]="300"
          [value]="textareaVal()"
          (valueChange)="textareaVal.set($event); emitState({ value: $event ?? '' })"
        />
      }
      @case ('emr-icon-button') {
        <emr-icon-button
          controlId="parity-iconbtn-ng"
          ariaLabel="Favourite template"
          [icon]="iconButtonPressed() ? '★' : '☆'"
          [variant]="iconButtonPressed() ? 'secondary' : 'outline'"
          [pressed]="iconButtonPressed()"
          (clicked)="onToggleIconButton()"
        />
      }
      @case ('emr-search-input') {
        <emr-search-input
          controlId="parity-search-ng"
          label="Filter outpatient roster"
          placeholder="Search MRN or patient name"
          [value]="searchVal()"
          (valueChange)="searchVal.set($event); emitState({ value: $event })"
          (cleared)="searchVal.set(null); emitState({ value: null })"
          (submitted)="emitState({ submitted: $event })"
        />
      }
      @case ('emr-password-input') {
        <emr-password-input
          controlId="parity-pwd-ng"
          label="Controlled-drug witness passphrase"
          hint="Required for Schedule X administration witness"
          [value]="passwordVal()"
          (valueChange)="passwordVal.set($event); emitState({ value: $event })"
        />
      }
      @case ('emr-numeric-stepper') {
        <emr-numeric-stepper
          controlId="parity-stepper-ng"
          label="Authorised refills"
          unit="refills"
          [min]="0"
          [max]="12"
          [step]="1"
          [value]="stepperVal()"
          (valueChange)="stepperVal.set($event); emitState({ value: $event })"
        />
      }
      @case ('emr-pagination') {
        <emr-pagination
          controlId="parity-pagination-ng"
          [page]="paginationPage()"
          [pageSize]="paginationSize()"
          [totalItems]="94"
          [pageSizeOptions]="[10, 20, 50]"
          (pageChange)="paginationPage.set($event); emitState({ page: $event })"
          (pageSizeChange)="paginationSize.set($event); paginationPage.set(1); emitState({ pageSize: $event, page: 1 })"
        />
      }
      @case ('emr-dialog') {
        <div>
          <emr-button variant="outline" (clicked)="setDialogOpen(true)">Open override dialog</emr-button>
          <emr-dialog
            controlId="parity-dialog-ng"
            title="Confirm medication override"
            description="Patient has documented penicillin mild rash (2019). Document rationale."
            [open]="dialogOpen()"
            (closeRequested)="setDialogOpen(false)"
          >
            <div style="font-size:14px;color:var(--emr-text);">Clinical justification will be audited on sign-off.</div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
              <emr-button variant="outline" (clicked)="setDialogOpen(false)">Cancel</emr-button>
              <emr-button variant="danger" (clicked)="setDialogOpen(false)">Confirm override</emr-button>
            </div>
          </emr-dialog>
        </div>
      }
      @case ('emr-popover') {
        <emr-popover
          controlId="parity-popover-ng"
          [open]="popoverOpen()"
          (openChange)="setPopoverOpen($event)"
        >
          <emr-button popoverTrigger variant="secondary" (clicked)="setPopoverOpen(!popoverOpen())">IOP reference</emr-button>
          <div style="font-size:13px;color:var(--emr-text);white-space:normal;">
            Adult reference range: 10–21 mmHg (Goldmann applanation)
          </div>
        </emr-popover>
      }
      @case ('emr-tooltip') {
        <emr-tooltip
          controlId="parity-tooltip-ng"
          content="Goldmann applanation tonometry"
        >
          <emr-button variant="outline">GAT abbreviation</emr-button>
        </emr-tooltip>
      }
      @case ('emr-progress-bar') {
        <emr-progress-bar label="Offline encounter bundle sync" [value]="72" tone="info" />
      }
      @case ('emr-spinner') {
        <emr-spinner label="Searching SNOMED CT…" tone="info" />
      }
      @case ('emr-skeleton') {
        <emr-skeleton variant="line" [lines]="3" />
      }
      @case ('emr-avatar') {
        <div style="display:flex;align-items:center;gap:12px;">
          <emr-avatar name="Mahesh Nair" size="sm" tone="info" />
          <emr-avatar name="Dr. Rekha Singh" size="md" tone="success" />
        </div>
      }
      @case ('emr-file-trigger') {
        <emr-file-trigger
          controlId="parity-file-ng"
          label="Attach external OCT PDF"
          accept=".pdf,image/png,image/jpeg"
          [multiple]="true"
          [hint]="fileTriggerNames().length ? fileTriggerNames().length + ' file(s) selected' : 'Maximum 25 MB per file'"
          (filesSelected)="onFileTriggerSelected($event)"
        />
      }
      @case ('emr-toast') {
        @if (toastVisible()) {
          <emr-toast [model]="toastModel()" (intent)="onToastIntent($event)" />
        }
      }
      @default {
        <div style="font-size:var(--emr-text-sm);color:var(--emr-text-muted);padding:8px 0;">
          Standalone Angular preview fixture not yet wired for <code>&lt;{{ selector() }}&gt;</code>.
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewAppComponent implements OnInit, OnDestroy {
  readonly selector = signal('emr-alert');

  readonly buttonClicks = signal(0);
  readonly buttonVariant = signal<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'>('primary');
  readonly buttonSize = signal<'small' | 'medium' | 'large'>('medium');
  readonly buttonDisabled = signal(false);
  readonly buttonLoading = signal(false);
  readonly buttonBlock = signal(false);
  readonly textVal = signal('Gradual painless blurring in right eye for 3 months');
  readonly numVal = signal<number | null>(-1.75);
  readonly dateVal = signal('2026-10-14');
  readonly selectVal = signal<EmrSelectValue>('OD');
  readonly selectMultiple = signal(false);
  readonly selectVariant = signal<EmrSelectVariant>('outline');
  readonly selectSize = signal<EmrSelectSize>('md');
  readonly selectClearable = signal(true);
  readonly selectCloseOnSelect = signal(true);
  readonly selectMaxSelections = signal<number | undefined>(undefined);
  readonly selectMaxTagCount = signal<number | undefined>(2);
  readonly selectLoading = signal(false);
  readonly selectRequired = signal(false);
  readonly selectReadOnly = signal(false);
  readonly selectDisabled = signal(false);
  readonly selectInvalid = signal(false);
  readonly selectLabelHidden = signal(false);
  readonly selectWarning = signal('');
  readonly selectError = signal('');
  readonly selectClinicalOptions: readonly EmrOption[] = [
    { value: 'OD', label: 'Right eye (OD)', group: 'Laterality', badge: 'Primary', tone: 'info' },
    { value: 'OS', label: 'Left eye (OS)', group: 'Laterality', description: 'Contralateral eye' },
    { value: 'OU', label: 'Both eyes (OU)', group: 'Laterality', badge: 'Bilateral', tone: 'warning' },
    { value: 'NA', label: 'Not applicable', group: 'Laterality', readOnly: true },
    { value: 'ARCH', label: 'Archived protocol', group: 'Laterality', disabled: true },
    { value: 'STAT', label: 'STAT', group: 'Priority', badge: 'Urgent', tone: 'danger' },
    { value: 'ROUTINE', label: 'Routine', group: 'Priority', tone: 'success' },
  ];
  readonly qtyVal = signal<number | null>(18);
  readonly qtyUnit = signal<string | null>('mmHg');
  readonly qtyMode = signal<'decimal' | 'integer'>('decimal');
  readonly qtySize = signal<'sm' | 'md' | 'lg'>('md');
  readonly qtySteppers = signal(true);
  readonly qtyClearable = signal(false);
  readonly qtyDisabled = signal(false);
  readonly pairedLeft = signal<string | null>('6/6');
  readonly pairedRight = signal<string | null>('6/9');
  readonly pairedInputType = signal<'text' | 'integer' | 'decimal' | 'select'>('text');
  readonly pairedVaOptions: readonly EmrOption[] = ['6/5', '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM', 'PL+', 'NPL'].map((v) => ({
    value: v,
    label: v,
  }));
  readonly pairedFieldLensOptions: readonly EmrOption[] = [
    { value: 'Clear', label: 'Clear' },
    { value: 'NS I', label: 'NS I' },
    { value: 'NS II', label: 'NS II' },
    { value: 'NS III', label: 'NS III' },
    { value: 'PSC', label: 'PSC' },
    { value: 'PCIOL', label: 'PCIOL' },
  ];
  readonly textareaVal = signal<string | null>('Gradual painless blurring of distance vision in OD over 8 months.');
  readonly iconButtonPressed = signal(true);
  readonly iconButtonClicks = signal(0);
  readonly searchVal = signal<string | null>(null);
  readonly passwordVal = signal<string | null>(null);
  readonly stepperVal = signal<number | null>(2);
  readonly paginationPage = signal(2);
  readonly paginationSize = signal(20);
  readonly dialogOpen = signal(false);
  readonly popoverOpen = signal(false);
  readonly fileTriggerNames = signal<readonly string[]>([]);
  readonly toastVisible = signal(true);
  readonly toastModel = signal<EmrToastModel>({
    id: 'parity-toast-ng',
    tone: 'warning',
    message: '3 offline camp records queued for sync.',
    actionLabel: 'Sync now',
  });

  protected onToggleIconButton(): void {
    const next = !this.iconButtonPressed();
    this.iconButtonPressed.set(next);
    this.emitState({ pressed: next });
  }

  protected setDialogOpen(open: boolean): void {
    this.dialogOpen.set(open);
    this.emitState({ open });
  }

  protected setPopoverOpen(open: boolean): void {
    this.popoverOpen.set(open);
    this.emitState({ open });
  }

  protected onFileTriggerSelected(files: readonly EmrFileSelectionItem[]): void {
    const names = files.map((f) => f.name);
    this.fileTriggerNames.set(names);
    this.emitState({ files: names });
  }

  protected onToastIntent(i: EmrToastIntent): void {
    if (i.type === 'dismissed') {
      this.toastVisible.set(false);
      this.emitState({ visible: false });
    } else if (i.type === 'actionPressed') {
      this.emitState({ action: i.type });
    }
  }
  readonly checkedVal = signal(true);
  readonly cbMixed = signal(false);
  readonly cbVariant = signal<'tile' | 'inline'>('tile');
  readonly cbSize = signal<'md' | 'sm'>('md');
  readonly cbPlacement = signal<'end' | 'start' | 'space-between'>('end');
  readonly cbDisabled = signal(false);
  readonly cbRequired = signal(false);
  readonly cbReadOnly = signal(false);
  readonly cbDescription = signal('');
  readonly cbHint = signal('');
  readonly cbWarning = signal('');
  readonly cbError = signal('');
  readonly toggleControlId = signal<string | undefined>(undefined);
  readonly toggleLabel = signal('One-eyed / monocular precaution active');
  readonly toggleDescription = signal('');
  readonly toggleLabelHidden = signal(false);
  readonly togglePlacement = signal<'end' | 'start' | 'space-between'>('end');
  readonly toggleVariant = signal<'tile' | 'inline'>('tile');
  readonly toggleSize = signal<'md' | 'sm'>('md');
  readonly toggleOnLabel = signal('');
  readonly toggleOffLabel = signal('');
  readonly toggleAriaLabel = signal<string | undefined>(undefined);
  readonly toggleVal = signal(true);
  readonly toggleValue = signal<boolean | null | undefined>(undefined);
  readonly toggleRequired = signal(false);
  readonly toggleReadOnly = signal(false);
  readonly toggleDisabled = signal(false);
  readonly toggleLoading = signal(false);
  readonly toggleInvalid = signal(false);
  readonly toggleHint = signal('Highlights contralateral eye protection across clinical checklists');
  readonly toggleWarning = signal('');
  readonly toggleError = signal('');
  readonly radioGroupOptions: readonly EmrOption[] = [
    { value: 'stat', label: 'STAT — Immediate', group: 'Acuity', description: 'Sight-threatening emergency', badge: { label: 'Urgent', tone: 'danger' }, tone: 'danger' },
    { value: 'soon', label: 'Urgent — Within 24h', group: 'Acuity', description: 'Same-day specialist review', badge: { label: 'Priority', tone: 'warning' }, tone: 'warning' },
    { value: 'routine', label: 'Routine — Next clinic', group: 'Standard', description: 'Standard outpatient queue', badge: { label: '2–4w', tone: 'info' } },
    { value: 'locked', label: 'Protocol locked', group: 'Standard', readOnly: true, description: 'Assigned by triage protocol' },
    { value: 'deferred', label: 'Tele-ophthalmology', group: 'Standard', disabled: true, description: 'Service unavailable at this site' },
  ];
  readonly radioVal = signal<string | null>('soon');
  readonly radioOrientation = signal<'vertical' | 'horizontal' | 'grid'>('vertical');
  readonly radioColumns = signal<number>(2);
  readonly radioVariant = signal<'tile' | 'inline' | 'card' | 'pill' | 'segmented'>('tile');
  readonly radioSize = signal<'md' | 'sm'>('md');
  readonly radioLabelPlacement = signal<'end' | 'start' | 'space-between'>('end');
  readonly radioClearable = signal(true);
  readonly radioAllowDeselect = signal(false);
  readonly radioReadOnly = signal(false);
  readonly radioDisabled = signal(false);
  readonly radioRequired = signal(false);
  readonly radioInvalid = signal(false);
  readonly radioLabelHidden = signal(false);
  readonly radioHint = signal('');
  readonly radioWarning = signal('');
  readonly radioError = signal('');
  readonly checkboxGroupOptions: readonly EmrOption[] = [
    { value: 'consent', label: 'Informed consent signed', group: 'Mandatory Safety', readOnly: true, badge: { label: 'Verified', tone: 'success' }, tone: 'success' },
    { value: 'site', label: 'Operative eye marked (OD)', group: 'Mandatory Safety', description: 'Confirmed with patient & surgical list', badge: { label: 'Critical', tone: 'info' } },
    { value: 'dilation', label: 'Mydriatic drops instilled', group: 'Clinical Prep', description: 'Tropicamide 0.8% + Phenylephrine 5%' },
    { value: 'biometry', label: 'IOL biometry verified', group: 'Clinical Prep', disabled: true, description: 'Awaiting IOLMaster upload' },
    { value: 'none', label: 'No prep required (defer)', tone: 'warning' },
  ];
  readonly cbgVal = signal<readonly string[]>(['consent', 'site']);
  readonly cbgOrientation = signal<'vertical' | 'horizontal' | 'grid'>('vertical');
  readonly cbgColumns = signal<number>(2);
  readonly cbgVariant = signal<'tile' | 'inline' | 'card' | 'chip'>('tile');
  readonly cbgSize = signal<'md' | 'sm'>('md');
  readonly cbgLabelPlacement = signal<'end' | 'start' | 'space-between'>('end');
  readonly cbgShowSelectAll = signal(true);
  readonly cbgShowSelectionCount = signal(true);
  readonly cbgClearable = signal(true);
  readonly cbgMinSelections = signal<number | undefined>(undefined);
  readonly segOptions = signal<readonly EmrSegmentedOption[]>([
    { value: 'OD', label: 'OD', description: 'Right eye', icon: 'eye', tone: 'info', badge: { label: 'Primary', tone: 'info' } },
    { value: 'OS', label: 'OS', description: 'Left eye', icon: 'eye', badge: 2 },
    { value: 'OU', label: 'OU', description: 'Both eyes', readOnly: true, badge: { label: 'Locked', tone: 'warning' } },
    { value: 'NA', label: 'Defer', disabled: true },
  ]);
  readonly segVal = signal<string | null>('OD');
  readonly segSize = signal<EmrSegmentedSize>('md');
  readonly segVariant = signal<EmrSegmentedVariant>('default');
  readonly segShape = signal<EmrSegmentedShape>('default');
  readonly segOrientation = signal<EmrSegmentedOrientation>('horizontal');
  readonly segFullWidth = signal(false);
  readonly segClearable = signal(false);
  readonly segAllowDeselect = signal(false);
  readonly segRequired = signal(false);
  readonly segInvalid = signal(false);
  readonly segReadOnly = signal(false);
  readonly segDisabled = signal(false);
  readonly segLabelHidden = signal(false);
  readonly segHint = signal('Select operative eye laterality');
  readonly segWarning = signal('');
  readonly segError = signal('');
  readonly cbgMaxSelections = signal<number | undefined>(undefined);
  readonly cbgDisabled = signal(false);
  readonly cbgRequired = signal(false);
  readonly cbgReadOnly = signal(false);
  readonly cbgInvalid = signal(false);
  readonly cbgLabelHidden = signal(false);
  readonly cbgWarning = signal('');
  readonly cbgError = signal('');

  readonly toggleGroupOptions: readonly EmrOption[] = [
    { value: 'sms', label: 'SMS appointment reminders', group: 'Patient Channels', icon: 'phone', badge: { label: 'Verified', tone: 'success' }, tone: 'success', readOnly: true },
    { value: 'whatsapp', label: 'WhatsApp Rx & instructions', group: 'Patient Channels', description: 'Encrypted clinic dispatch', badge: { label: 'Preferred', tone: 'info' } },
    { value: 'portal', label: 'Portal lab & OCT release', group: 'Clinical Sync', description: 'Auto-publish signed diagnostic reports' },
    { value: 'legacy', label: 'Fax summary', group: 'Clinical Sync', disabled: true, description: 'Legacy gateway offline' },
    { value: 'none', label: 'Opt out of non-urgent alerts', tone: 'warning' },
  ];
  readonly tgValues = signal<readonly string[]>(['sms', 'portal']);
  readonly tgMultiple = signal(true);
  readonly tgAllowEmpty = signal(true);
  readonly tgVariant = signal<EmrToggleGroupVariant>('tile');
  readonly tgSize = signal<EmrToggleGroupSize>('md');
  readonly tgOrientation = signal<EmrToggleGroupOrientation>('vertical');
  readonly tgColumns = signal(2);
  readonly tgLabelPlacement = signal<EmrToggleGroupLabelPlacement>('space-between');
  readonly tgShowStateLabels = signal(false);
  readonly tgShowSelectAll = signal(true);
  readonly tgShowSelectionCount = signal(true);
  readonly tgClearable = signal(true);
  readonly tgMaxSelections = signal<number | undefined>(undefined);
  readonly tgRequired = signal(false);
  readonly tgReadOnly = signal(false);
  readonly tgDisabled = signal(false);
  readonly tgInvalid = signal(false);
  readonly tgLabelHidden = signal(false);
  readonly tgWarning = signal('');
  readonly tgError = signal('');

  readonly ocularTreeNodes: readonly EmrTreeNode[] = [
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
  readonly tvValue = signal<string | null>('macula');
  readonly tvValues = signal<readonly string[]>(['cornea', 'ac']);
  readonly tvExpandedIds = signal<readonly string[]>(['ant-seg', 'post-seg']);
  readonly tvMultiple = signal(true);
  readonly tvCheckStrategy = signal<EmrTreeCheckStrategy>('cascade');
  readonly tvSize = signal<'md' | 'sm'>('md');
  readonly tvSearchable = signal(true);
  readonly tvShowExpandControls = signal(true);
  readonly tvClearable = signal(true);
  readonly tvMaxSelections = signal<number | undefined>(undefined);
  readonly tvRequired = signal(false);
  readonly tvReadOnly = signal(false);
  readonly tvDisabled = signal(false);
  readonly tvInvalid = signal(false);
  readonly tvLabelHidden = signal(false);
  readonly tvWarning = signal('');
  readonly tvError = signal('');

  readonly tsValue = signal<string | null>('macula');
  readonly tsValues = signal<readonly string[]>(['cornea', 'ac']);
  readonly tsMultiple = signal(false);
  readonly tsCheckStrategy = signal<EmrTreeCheckStrategy>('cascade');
  readonly tsDisplayMode = signal<'path' | 'leaf'>('path');
  readonly tsVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly tsSize = signal<'md' | 'sm'>('md');
  readonly tsSearchable = signal(true);
  readonly tsShowExpandControls = signal(false);
  readonly tsClearable = signal(true);
  readonly tsMaxTagCount = signal<number | undefined>(2);
  readonly tsMaxSelections = signal<number | undefined>(undefined);
  readonly tsLoading = signal(false);
  readonly tsRequired = signal(false);
  readonly tsReadOnly = signal(false);
  readonly tsDisabled = signal(false);
  readonly tsInvalid = signal(false);
  readonly tsLabelHidden = signal(false);
  readonly tsWarning = signal('');
  readonly tsError = signal('');
  readonly badgeTone = signal<EmrTone>('warning');
  readonly badgeVariant = signal<'soft' | 'solid' | 'outline'>('soft');
  readonly badgeSize = signal<'md' | 'sm'>('md');
  readonly badgeShape = signal<'pill' | 'rounded'>('pill');
  readonly badgeDot = signal(false);
  readonly alertTone = signal<EmrTone>('warning');
  readonly activeTab = signal('summary');
  readonly tabsVariant = signal<'underline' | 'pill' | 'soft'>('underline');
  readonly tabsSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly tabsOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly tabsFitted = signal(false);
  readonly tabsDisabled = signal(false);
  readonly likertVal = signal<number | null>(4);
  readonly likertScaleMode = signal<'numeric' | 'text'>('numeric');
  readonly likertClearable = signal(false);
  readonly likertFullWidth = signal(false);
  readonly likertDisabled = signal(false);
  readonly likertRequired = signal(false);
  readonly likertAnchors = [
    { value: 0, label: 'None' },
    { value: 10, label: 'Severe' },
  ];
  readonly likertTextOptions: readonly EmrLikertOption[] = [
    { value: 1, label: 'None', description: 'No pain', tone: 'success' },
    { value: 2, label: 'Mild', description: 'Aware, no distress', tone: 'info' },
    { value: 3, label: 'Moderate', description: 'Interferes with task', tone: 'warning' },
    { value: 4, label: 'Severe', description: 'Prevents task', tone: 'danger' },
    { value: 5, label: 'Extreme', description: 'Unable to continue', tone: 'danger' },
  ];
  readonly vasVal = signal<number | null>(4);
  readonly vasPrecision = signal<EmrVasPrecision>('integer');
  readonly timeVal = signal<string | null>('09:30');
  readonly timePrecision = signal<'minute' | 'second'>('minute');
  readonly timeHourCycle = signal<'24' | '12'>('24');
  readonly timeSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly timeClearable = signal(true);
  readonly timeDisabled = signal(false);
  readonly timeRequired = signal(false);
  readonly dtVal = signal<string | null>('2026-10-14T09:30:00Z');
  readonly dtDisplayFormat = signal<'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy'>('dd-mm-yyyy');
  readonly dtTimePrecision = signal<'minute' | 'second'>('minute');
  readonly dtHourCycle = signal<'24' | '12'>('24');
  readonly dtWireFormat = signal<'utc' | 'local'>('utc');
  readonly dtSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly dtClearable = signal(true);
  readonly dtDisabled = signal(false);
  readonly dtRequired = signal(false);
  readonly chipTone = signal<EmrTone>('info');
  readonly chipVariant = signal<'soft' | 'solid' | 'outline'>('soft');
  readonly chipSize = signal<'md' | 'sm'>('md');
  readonly chipSelectable = signal(true);
  readonly chipSelected = signal(false);
  readonly chipRemovable = signal(true);
  readonly chipDisabled = signal(false);
  readonly stateMsgKind = signal<'empty' | 'loading' | 'error'>('empty');
  readonly stateMsgCompact = signal(false);
  readonly stateMsgActionLabel = signal('Refresh scans');
  readonly stateMsgActionDisabled = signal(false);
  readonly sepLabel = signal('Posterior segment findings');
  readonly sepOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly sepLabelAlign = signal<'start' | 'center' | 'end'>('center');
  readonly sepVariant = signal<'solid' | 'dashed' | 'subtle'>('solid');
  readonly sepDecorative = signal(false);
  readonly cardTitle = signal('Baseline refraction summary');
  readonly cardSubtitle = signal('Recorded at 09:30 IST');
  readonly cardVariant = signal<'outlined' | 'elevated' | 'filled' | 'subtle'>('outlined');
  readonly cardPadding = signal<'none' | 'sm' | 'md' | 'lg'>('md');
  readonly cardTone = signal<EmrTone>('neutral');
  readonly cardInteractive = signal(true);
  readonly cardSelected = signal(false);
  readonly cardDisabled = signal(false);
  readonly sspSlots: readonly ScheduleSlotDefinition[] = [
    { id: 'm', label: 'Morning', timeHint: '08:00' },
    { id: 'a', label: 'Afternoon', timeHint: '14:00' },
    { id: 'e', label: 'Evening', timeHint: '18:00' },
    { id: 'n', label: 'Night', timeHint: '22:00' },
  ];
  readonly sspPresets: readonly ScheduleSlotPreset[] = [
    { id: 'od', label: 'Once daily (OD)', slotIds: ['m'] },
    { id: 'bd', label: 'Twice daily (BD)', slotIds: ['m', 'n'] },
    { id: 'tds', label: 'Three times daily (TDS)', slotIds: ['m', 'a', 'n'] },
    { id: 'qid', label: 'Four times daily (QID)', slotIds: ['m', 'a', 'e', 'n'] },
  ];
  readonly sspAmountMode = signal<ScheduleAmountMode>('numeric');
  readonly sspValue = signal<readonly DoseSlot[] | null>([
    { id: 'm', label: 'Morning', timeHint: '08:00', amount: 1 },
    { id: 'n', label: 'Night', timeHint: '22:00', amount: 1 },
  ]);
  readonly identScans = signal(0);
  readonly identModel = signal<IdentifierEntryView>({
    label: 'Patient identifier',
    hint: 'Scanner triggers: 0',
    normalisedValue: '17-26-000842',
    value: '17-26-000842',
    selectedType: 'project',
    required: false,
    clearable: true,
    placeholder: 'Enter or scan patient ID',
    typeOptions: [
      { id: 'project', label: 'Project ID' },
      { id: 'uhid', label: 'UHID' },
      { id: 'abha', label: 'National Health ID' },
    ],
  });
  readonly scaleModel = signal<ScaleFieldViewModel>({
    label: 'Post-operative ocular pain (NRS 0–10)',
    variant: 'likert',
    value: 3,
    min: 0,
    max: 10,
    anchors: { minLabel: 'No pain', maxLabel: 'Worst imaginable pain' },
    tone: 'warning',
    hint: 'Record prior to topical anaesthetic instillation',
  });
  readonly partialDateModel = signal<PartialDateFieldViewModel>({
    label: 'Onset of gradual blurring',
    value: { precision: 'month', value: '2025-11' },
    hint: 'Year or year-month supported when exact day is unknown',
  });
  readonly attachmentModel = signal<AttachmentFieldViewModel>({
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
  });
  readonly pairedLabelHidden = signal(false);
  readonly pairedModel = signal<PairedFieldViewModel>({
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
  });
  readonly durationLabelHidden = signal(false);
  readonly durationModel = signal<DurationFieldViewModel>({
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
  });
  readonly rangeLabelHidden = signal(false);
  readonly rangeModel = signal<RangeFieldViewModel>({
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
    status: 'recorded',
    statusOptions: [
      { value: 'recorded', label: 'Recorded', tone: 'success' },
      { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
      { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
      { value: 'declined', label: 'Declined', tone: 'warning' },
      { value: 'unknown', label: 'Unknown', tone: 'neutral' },
    ],
  });
  readonly phoneLabelHidden = signal(false);
  readonly phoneModel = signal<PhoneFieldViewModel>({
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
    hint: 'Used for appointment reminders and OTP verification',
    formattedPreview: '+91 98765 43210 ext. 204',
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
  });
  readonly addressLabelHidden = signal(false);
  readonly addressModel = signal<AddressFieldViewModel>({
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
  });
  readonly signatureLabelHidden = signal(false);

  readonly defaultAspectPresets = DEFAULT_ASPECT_PRESETS;
  readonly sampleFundusSrc =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260">' +
        '<rect width="360" height="260" fill="#172026"/>' +
        '<circle cx="180" cy="130" r="104" fill="#7c2d12" stroke="#f59e0b" stroke-width="3"/>' +
        '<circle cx="145" cy="126" r="18" fill="#fde68a"/>' +
        '<path d="M145 126 Q200 84 260 72 M145 126 Q205 172 265 184" stroke="#991b1b" stroke-width="4" fill="none"/>' +
        '</svg>',
    );
  readonly ivGallery: readonly EmrImageItem[] = [
    {
      id: 'fundus-od',
      src: this.sampleFundusSrc,
      alt: 'Simulated OD colour fundus',
      caption: 'OD posterior pole — 45° field',
    },
    {
      id: 'fundus-os',
      src: this.sampleFundusSrc,
      alt: 'Simulated OS colour fundus',
      caption: 'OS optic disc — baseline',
    },
  ];
  readonly ivViewport = signal<EmrImageViewportState>({ ...DEFAULT_IMAGE_VIEWPORT });
  readonly ivActiveIndex = signal(0);
  readonly ivMultiImage = signal(false);
  readonly ivAllowFullscreen = signal(true);
  readonly ivShowThumbnails = signal(true);
  readonly ivHeight = signal(300);
  readonly ivLabelHidden = signal(false);
  readonly ivReadOnly = signal(false);
  readonly ivDisabled = signal(false);
  readonly ivWarning = signal('');
  readonly ivError = signal('');

  readonly icTransform = signal<EmrImageCropTransform>({ ...DEFAULT_IMAGE_CROP_TRANSFORM });
  readonly icLabelHidden = signal(false);
  readonly icReadOnly = signal(false);
  readonly icDisabled = signal(false);
  readonly icWarning = signal('');
  readonly icError = signal('');

  readonly iuItems = signal<readonly EmrUploadedImageItem[]>([
    {
      id: 'img-fundus-od',
      name: 'fundus-od-baseline.svg',
      mimeType: 'image/svg+xml',
      sizeBytes: 18420,
      src: this.sampleFundusSrc,
      caption: 'OD baseline colour fundus',
    },
  ]);
  readonly iuMultiple = signal(true);
  readonly iuMaxFiles = signal<number | undefined>(undefined);
  readonly iuAllowCamera = signal(true);
  readonly iuLabelHidden = signal(false);
  readonly iuRequired = signal(false);
  readonly iuReadOnly = signal(false);
  readonly iuDisabled = signal(false);
  readonly iuWarning = signal('');
  readonly iuError = signal('');

  readonly ifLabelHidden = signal(false);
  readonly ifLayout = signal<FieldFrameLayout>('vertical');
  readonly ifShowMetadata = signal(true);
  readonly ifReadOnly = signal(false);
  readonly imageFieldModel = signal<ImageFieldViewModel>({
    label: 'Slit-lamp & fundus photographs',
    hint: 'Upload, inspect fullscreen (pan/zoom/rotate), or crop clinical photos.',
    items: [
      {
        id: 'img-fundus-od',
        name: 'fundus-od-baseline.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 18420,
        src: this.sampleFundusSrc,
        caption: 'OD baseline colour fundus',
      },
    ],
    allowCamera: true,
    multiple: true,
    aspectPresets: DEFAULT_ASPECT_PRESETS,
    statusOptions: [
      { value: 'recorded', label: 'Recorded', tone: 'success' },
      { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
      { value: 'unable-to-assess', label: 'Media haze / unable', tone: 'warning' },
      { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
      { value: 'declined', label: 'Declined', tone: 'warning' },
      { value: 'unknown', label: 'Unknown', tone: 'neutral' },
    ],
  });

  onImageFieldIntent(ev: ImageFieldIntent): void {
    const cur = this.imageFieldModel();
    let next: ImageFieldViewModel = cur;
    switch (ev.type) {
      case 'itemsChangeRequested':
        next = { ...cur, items: ev.items };
        break;
      case 'imageCropped':
        next = {
          ...cur,
          items: cur.items.map((item) =>
            item.id === ev.id
              ? {
                  ...item,
                  cropTransform: ev.result.transform,
                  previewSrc: ev.result.croppedDataUrl ?? item.previewSrc ?? item.src,
                }
              : item,
          ),
        };
        break;
      case 'captionChangeRequested':
        next = {
          ...cur,
          items: cur.items.map((item) =>
            item.id === ev.id ? { ...item, caption: ev.caption } : item,
          ),
        };
        break;
      case 'itemRemoveRequested':
        next = { ...cur, items: cur.items.filter((item) => item.id !== ev.id) };
        break;
      case 'statusChangeRequested':
        next = { ...cur, status: ev.status };
        break;
      default:
        break;
    }
    this.imageFieldModel.set(next);
    this.emitState({ ...next, lastIntent: ev });
  }
  private readonly macroTextCatalog: readonly EmrMacroSuggestion[] = [
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
  readonly macroTextLabelHidden = signal(false);
  readonly macroTextModel = signal<MacroTextFieldViewModel>({
    label: 'Anterior segment findings',
    value: 'Lids and lashes normal. .clearcornea',
    suggestionsOpen: true,
    suggestions: this.macroTextCatalog,
    clearable: true,
    maxLength: 280,
    rows: 4,
    dictating: false,
    layout: 'vertical',
    showMetadata: true,
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
  });
  readonly lateralityLabelHidden = signal(false);
  readonly lateralityModel = signal<LateralityFieldViewModel>({
    label: 'Operative site & laterality',
    domain: 'ophthalmic',
    value: 'OD',
    requiresConfirmation: true,
    confirmed: false,
    confirmationLabel: 'Operative eye confirmed against consent and biometry',
    hint: 'Verify laterality before surgical site marking',
    clearable: true,
    size: 'md',
    layout: 'vertical',
    orientation: 'horizontal',
    showMetadata: true,
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
  });
  readonly visualAcuityLabelHidden = signal(false);
  readonly visualAcuityModel = signal<VisualAcuityFieldViewModel>({
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
  });
  readonly refractionLabelHidden = signal(false);
  readonly refractionModel = signal<RefractionFieldViewModel>({
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
  });
  readonly signatureModel = signal<SignatureCaptureViewModel>({
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
    status: 'recorded',
    statusOptions: [
      { value: 'recorded', label: 'Recorded', tone: 'success' },
      { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
      { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
      { value: 'declined', label: 'Declined', tone: 'warning' },
      { value: 'unknown', label: 'Unknown', tone: 'neutral' },
    ],
  });
  readonly colsCount = signal(3);
  readonly colsGap = signal<number | string>(12);
  readonly colsAlign = signal<'stretch' | 'start' | 'center' | 'end'>('stretch');
  readonly colsCollapseBelow = signal(640);
  readonly fvrSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly fvrTone = signal<EmrTone>('info');
  readonly fvrTruncate = signal(false);
  readonly fvrInteractive = signal(false);
  readonly fvrActivations = signal(0);
  readonly statusEdits = signal(0);
  readonly statusCompact = signal(false);
  readonly statusSelectable = signal(true);
  readonly statusSelected = signal(false);
  readonly statusDisabled = signal(false);
  readonly statusSize = signal<'sm' | 'md'>('md');
  readonly stepperStages = [
    { id: 'referred', label: 'Referred', status: { label: 'Completed', tone: 'success' as const } },
    { id: 'triaged', label: 'Triaged', description: 'Slit-lamp room 2', status: { label: 'In progress', tone: 'info' as const } },
    { id: 'dilated', label: 'Dilated fundus' },
    { id: 'signed', label: 'Signed off' },
  ];
  readonly stepperActiveId = signal('triaged');
  readonly stepperOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly stepperSize = signal<'sm' | 'md'>('md');
  readonly stepperClickable = signal(true);
  readonly stepperLinear = signal(false);
  readonly stepperDisabled = signal(false);
  readonly statClicks = signal(0);
  readonly statTone = signal<EmrTone>('neutral');
  readonly statSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly statInteractive = signal(true);
  readonly statSelected = signal(false);
  readonly statLoading = signal(false);
  readonly statDisabled = signal(false);
  readonly ffValue = signal('540');
  readonly ffUnit = signal('µm');
  readonly ffLayout = signal<'vertical' | 'horizontal' | 'inline'>('vertical');
  readonly ffShowMetadata = signal(true);
  readonly ffStatus = signal<'recorded' | 'not-assessed' | 'unable-to-assess' | 'not-applicable' | 'declined' | 'unknown' | undefined>('recorded');
  readonly ffStatusOptions = [
    { value: 'recorded' as const, label: 'Recorded', tone: 'success' as const },
    { value: 'not-assessed' as const, label: 'Not assessed', tone: 'neutral' as const },
    { value: 'unable-to-assess' as const, label: 'Unable to assess', tone: 'warning' as const },
    { value: 'not-applicable' as const, label: 'Not applicable', tone: 'neutral' as const },
    { value: 'declined' as const, label: 'Declined', tone: 'warning' as const },
    { value: 'unknown' as const, label: 'Unknown', tone: 'neutral' as const },
  ];
  readonly readOnly = signal(false);

  onFieldFrameIntent(ev: { type: string; status?: string }): void {
    if (ev.type === 'statusChangeRequested') {
      const next = ev.status as 'recorded' | 'not-assessed' | 'unable-to-assess' | 'not-applicable' | 'declined' | 'unknown' | undefined;
      this.ffStatus.set(next);
      this.emitState({ assessmentStatus: next });
    }
  }

  statTileModel(): EmrStatTileModel {
    return {
      key: 'referred',
      label: 'Patients referred today',
      value: String(14 + this.statClicks()),
      trend: { label: '+12% vs yesterday', direction: 'up', tone: 'success' },
      sub: 'Click tile in either pane to increment',
      status: { label: '2 awaiting sync', tone: 'warning' },
    };
  }
  readonly vasOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly vasSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly vasTone = signal<EmrTone>('info');
  readonly vasClearable = signal(true);
  readonly vasDisabled = signal(false);
  readonly vasRequired = signal(false);
  readonly vasAnchors = [
    { value: 0, label: 'No pain' },
    { value: 10, label: 'Worst imaginable' },
  ];
  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly searchPicked = signal<string[]>(['timolol']);
  readonly searchFilterMode = signal<'remote' | 'local' | 'none'>('local');
  readonly searchVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly searchSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly searchMultiple = signal(true);
  readonly searchHighlightMatch = signal(true);
  readonly searchClearable = signal(true);
  readonly searchAllowCustom = signal(true);
  readonly searchMaxTagCount = signal<number | undefined>(2);
  readonly searchMaxSelections = signal<number | undefined>(4);
  readonly searchLoading = signal(false);
  readonly searchDisabled = signal(false);
  readonly searchReadOnly = signal(false);
  readonly searchRequired = signal(false);
  readonly searchInvalid = signal(false);
  readonly searchLabelHidden = signal(false);
  readonly searchWarning = signal('');
  readonly searchError = signal('');

  readonly comboValue = signal<string | null>('Gradual glare at night');
  readonly comboOpen = signal<boolean | undefined>(undefined);
  readonly comboVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly comboSize = signal<'sm' | 'md'>('md');
  readonly comboFilterMode = signal<'remote' | 'local' | 'none'>('local');
  readonly comboAllowCustom = signal(true);
  readonly comboHighlightMatch = signal(true);
  readonly comboClearable = signal(true);
  readonly comboLoading = signal(false);
  readonly comboRequired = signal(false);
  readonly comboReadOnly = signal(false);
  readonly comboDisabled = signal(false);
  readonly comboInvalid = signal(false);
  readonly comboLabelHidden = signal(false);
  readonly comboWarning = signal('');
  readonly comboError = signal('');

  readonly tagValues = signal<readonly string[]>(['Penicillin', 'Latex']);
  readonly tagLockedTags = signal<readonly string[]>(['Penicillin']);
  readonly tagSuggestions: readonly string[] = [
    'Sulfa',
    'NSAIDs',
    'Aspirin',
    'Contrast Dye',
    'Atropine',
    'Tropicamide',
    'Fluorescein',
    'Lidocaine',
  ];
  readonly tagVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly tagSize = signal<'sm' | 'md'>('md');
  readonly tagChipTone = signal<'neutral' | 'info' | 'success' | 'warning' | 'danger'>('neutral');
  readonly tagClearable = signal(true);
  readonly tagAllowDuplicates = signal(false);
  readonly tagFilterSuggestions = signal(true);
  readonly tagHighlightMatch = signal(true);
  readonly tagMaxTags = signal<number | undefined>(6);
  readonly tagMaxTagLength = signal<number | undefined>(undefined);
  readonly tagRequired = signal(false);
  readonly tagReadOnly = signal(false);
  readonly tagDisabled = signal(false);
  readonly tagInvalid = signal(false);
  readonly tagLabelHidden = signal(false);
  readonly tagWarning = signal('');
  readonly tagError = signal('');
  readonly drPresets: readonly EmrDateRangePreset[] = [
    { id: '7d', label: 'Last 7 days', range: { start: '2026-03-08', end: '2026-03-15' } },
    { id: '30d', label: 'Last 30 days', range: { start: '2026-02-14', end: '2026-03-15' } },
  ];
  readonly drValue = signal<EmrDateRangeValue | null>({ start: '2026-03-08', end: '2026-03-15' });
  readonly drMode = signal<'date' | 'datetime'>('date');
  readonly drSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly drVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly drWeekStartsOn = signal<0 | 1>(0);
  readonly drShowCalendar = signal(true);
  readonly drClearable = signal(true);
  readonly drRequired = signal(false);
  readonly drReadOnly = signal(false);
  readonly drDisabled = signal(false);
  readonly drInvalid = signal(false);
  readonly drLabelHidden = signal(false);
  readonly drWarning = signal('');
  readonly drError = signal('');
  readonly sliderMarks = [
    { value: 0, label: '0%' },
    { value: 50, label: '50%' },
    { value: 100, label: '100%' },
  ];
  readonly sliderValue = signal<number | null>(65);
  readonly sliderSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly sliderTone = signal<'neutral' | 'info' | 'success' | 'warning' | 'danger'>('neutral');
  readonly sliderShowValue = signal(true);
  readonly sliderShowSteppers = signal(false);
  readonly sliderClearable = signal(true);
  readonly sliderRequired = signal(false);
  readonly sliderReadOnly = signal(false);
  readonly sliderDisabled = signal(false);
  readonly sliderInvalid = signal(false);
  readonly sliderLabelHidden = signal(false);
  readonly sliderWarning = signal('');
  readonly sliderError = signal('');
  readonly rangeSliderMarks = [
    { value: 6, label: '6' },
    { value: 16, label: '16' },
    { value: 22, label: '22' },
    { value: 30, label: '30' },
  ];
  readonly rangeSliderValue = signal<readonly [number, number] | null>([10, 16]);
  readonly rangeSliderSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly rangeSliderTone = signal<'neutral' | 'info' | 'success' | 'warning' | 'danger'>('neutral');
  readonly rangeSliderShowValue = signal(true);
  readonly rangeSliderClearable = signal(false);
  readonly rangeSliderRequired = signal(false);
  readonly rangeSliderReadOnly = signal(false);
  readonly rangeSliderDisabled = signal(false);
  readonly rangeSliderInvalid = signal(false);
  readonly rangeSliderLabelHidden = signal(false);
  readonly rangeSliderWarning = signal('');
  readonly rangeSliderError = signal('');
  readonly maskedValue = signal<string | null>('91-2847-5510-3921');
  readonly maskedSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly maskedVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly maskedUnmask = signal(false);
  readonly maskedShowHint = signal(false);
  readonly maskedUppercase = signal(false);
  readonly maskedClearable = signal(true);
  readonly maskedRequired = signal(false);
  readonly maskedReadOnly = signal(false);
  readonly maskedDisabled = signal(false);
  readonly maskedInvalid = signal(false);
  readonly maskedLabelHidden = signal(false);
  readonly maskedWarning = signal('');
  readonly maskedError = signal('');
  readonly otpValue = signal('482910');
  readonly otpSecret = signal(false);
  readonly otpNumericOnly = signal(true);
  readonly otpUppercase = signal(false);
  readonly otpSeparatorAfter = signal(3);
  readonly otpSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly otpVariant = signal<'outline' | 'filled' | 'subtle'>('outline');
  readonly otpClearable = signal(true);
  readonly otpRequired = signal(false);
  readonly otpReadOnly = signal(false);
  readonly otpDisabled = signal(false);
  readonly otpInvalid = signal(false);
  readonly otpLabelHidden = signal(false);
  readonly otpWarning = signal('');
  readonly otpError = signal('');
  readonly encounterMenuItems: readonly EmrMenuItem[] = [
    { id: 'print-rx', label: 'Print prescription', shortcut: '⌘P' },
    { id: 'export-fhir', label: 'Export FHIR Bundle' },
    { id: 'strike-out', label: 'Mark entered-in-error', dividerBefore: true, tone: 'danger' },
  ];
  readonly menuVariant = signal<'outline' | 'primary' | 'secondary' | 'ghost'>('outline');
  readonly menuSize = signal<'md' | 'sm'>('md');
  readonly menuAlign = signal<'start' | 'end'>('start');
  readonly menuReadOnly = signal(false);
  readonly menuDisabled = signal(false);
  readonly signMenuItems: readonly EmrMenuItem[] = [
    { id: 'sign-lock', label: 'Sign & lock encounter' },
    { id: 'cosign', label: 'Request consultant co-sign' },
    { id: 'draft', label: 'Save unsigned draft' },
  ];
  readonly splitVariant = signal<'primary' | 'secondary' | 'outline' | 'danger'>('primary');
  readonly splitSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly splitAlign = signal<'start' | 'end'>('end');
  readonly splitLoading = signal(false);
  readonly splitReadOnly = signal(false);
  readonly splitDisabled = signal(false);
  readonly postopAccordionItems: readonly EmrAccordionItem[] = [
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
  readonly accordionExpandedIds = signal<readonly string[]>(['drops']);
  readonly accordionMultiple = signal(true);
  readonly accordionVariant = signal<'outlined' | 'flush' | 'card'>('outlined');
  readonly accordionSize = signal<'sm' | 'md'>('md');
  readonly accordionReadOnly = signal(false);
  readonly accordionDisabled = signal(false);
  readonly sectionCardCollapsed = signal(false);
  readonly sectionCardCollapsible = signal(true);
  readonly sectionCardVariant = signal<EmrSectionCardVariant>('outlined');
  readonly sectionCardTone = signal<EmrTone>('neutral');
  readonly sectionCardPadding = signal<EmrSectionCardPadding>('md');
  readonly sectionCardHeadingLevel = signal<EmrSectionCardHeadingLevel>(2);
  readonly sectionCardReadOnly = signal(false);
  readonly sectionCardShowStatus = signal(true);
  readonly sectionCardShowDescription = signal(true);
  readonly repeatGroupDef: RepeatableGroupDefinition = {
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
  readonly repeatItems = signal<readonly RepeatableItemState[]>([
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
  ]);
  readonly repeatReadOnly = signal(false);
  readonly repeatEmpty = signal(false);
  readonly repeatError = signal(false);
  readonly repeatWarning = signal(false);
  readonly clinicalFormSchema: ClinicalFormViewModel['schema'] = {
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
  };
  readonly clinicalFormSectionStatuses: Readonly<Record<string, EmrBadge>> = {
    presenting: { label: 'In progress', tone: 'info' },
    medications: { label: '1 active', tone: 'success' },
  };
  readonly clinicalFormFields = signal<Readonly<Record<string, ClinicalFieldState>>>({
    complaint: { value: 'Halos around lights at night' },
    laterality: { value: 'OU' },
    iopOd: { value: { value: 22, unit: 'mmHg' }, warning: 'Borderline IOP' },
    iopOs: { value: { value: 18, unit: 'mmHg' } },
    diabetic: { value: true },
    acOd: { value: 'Deep, quiet' },
    acOs: { value: 'Deep, quiet' },
  });
  readonly clinicalFormRepeatableGroups = signal<Readonly<Record<string, readonly RepeatableItemState[]>>>({
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
  });
  readonly clinicalFormCollapsedSectionIds = signal<readonly string[]>([]);
  readonly clinicalFormReadOnly = signal(false);
  readonly clinicBreadcrumbs: readonly EmrBreadcrumbItem[] = [
    { id: 'clinic', label: 'Outpatient Clinic' },
    { id: 'retina', label: 'Retina Service' },
    { id: 'patient', label: 'MRN-2026-0419' },
    { id: 'oct', label: 'Macular OCT' },
  ];
  readonly breadcrumbsMaxItems = signal(3);
  readonly breadcrumbsSeparator = signal('/');
  readonly breadcrumbsSize = signal<'sm' | 'md'>('md');
  readonly clinicalColorSwatches: readonly EmrColorSwatch[] = DEFAULT_CLINICAL_COLOR_SWATCHES;
  readonly colorPickerValue = signal<string | null>('#dc2626');
  readonly colorPickerAllowCustomHex = signal(true);
  readonly colorPickerClearable = signal(true);
  readonly colorPickerSize = signal<'sm' | 'md'>('md');
  readonly colorPickerRequired = signal(false);
  readonly colorPickerReadOnly = signal(false);
  readonly colorPickerDisabled = signal(false);
  readonly colorPickerInvalid = signal(false);
  readonly colorPickerLabelHidden = signal(false);
  readonly colorPickerWarning = signal('');
  readonly colorPickerError = signal('');
  readonly copyButtonVariant = signal<'outline' | 'primary' | 'secondary' | 'ghost'>('outline');
  readonly copyButtonSize = signal<'sm' | 'md' | 'lg'>('sm');
  readonly copyButtonIconOnly = signal(false);
  readonly copyButtonDisabled = signal(false);
  readonly copyButtonCount = signal(0);
  readonly comboOptions: readonly EmrOption[] = [
    {
      value: 'Reduced distance vision',
      label: 'Reduced distance vision',
      code: 'H53.8',
      description: 'Progressive blur at 6 m Snellen chart',
      group: 'Vision',
      badge: { label: 'Common', tone: 'info' },
    },
    {
      value: 'Metamorphopsia',
      label: 'Metamorphopsia',
      code: 'H53.15',
      description: 'Wavy or distorted central grid lines (Amsler)',
      group: 'Vision',
      badge: { label: 'Urgent', tone: 'warning' },
    },
    {
      value: 'Foreign body sensation',
      label: 'Foreign body sensation',
      code: 'H57.89',
      description: 'Gritty ocular surface discomfort',
      group: 'Surface',
      tone: 'neutral',
    },
    {
      value: 'Sudden vision loss',
      label: 'Sudden painless vision loss',
      code: 'H53.13',
      description: 'Acute monocular visual loss — triage STAT',
      group: 'Vision',
      badge: { label: 'STAT', tone: 'danger' },
      readOnly: true,
    },
    {
      value: 'Deprecated symptom',
      label: 'Unspecified visual disturbance (archived)',
      code: 'H53.9',
      group: 'Archive',
      disabled: true,
    },
  ];
  readonly searchCatalog: readonly EmrOption[] = [
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

  searchFilteredOptions(): readonly EmrOption[] {
    if (this.searchFilterMode() !== 'remote') return this.searchCatalog;
    const q = this.searchQuery().toLowerCase();
    return this.searchCatalog.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.code ? o.code.toLowerCase().includes(q) : false) ||
        (o.keywords ? o.keywords.some((k) => k.toLowerCase().includes(q)) : false),
    );
  }

  searchSelectedOptions(): readonly EmrOption[] {
    return this.searchPicked().map(
      (val) => this.searchCatalog.find((o) => o.value === val) ?? { value: val, label: val },
    );
  }

  onSearchPick(val: string): void {
    const picked = this.searchPicked();
    const next = this.searchMultiple()
      ? (picked.includes(val) ? picked.filter((x) => x !== val) : [...picked, val])
      : [val];
    const nextOpen = this.searchMultiple() ? this.searchOpen() : false;
    this.searchPicked.set(next);
    this.searchOpen.set(nextOpen);
    this.emitState({ picked: next, open: nextOpen });
  }

  readonly tones: readonly EmrTone[] = ['info', 'success', 'warning', 'danger', 'neutral'];

  readonly unitOptions: readonly EmrOption[] = [
    { value: 'mmHg', label: 'mmHg' },
    { value: 'kPa', label: 'kPa' },
  ];

  readonly lateralityOptions: readonly EmrOption[] = [
    { value: 'OD', label: 'Right eye (OD)' },
    { value: 'OS', label: 'Left eye (OS)' },
    { value: 'OU', label: 'Both eyes (OU)' },
  ];

  readonly urgencyOptions: readonly EmrOption[] = [
    { value: 'routine', label: 'Routine (4 weeks)' },
    { value: 'soon', label: 'Soon (7 days)' },
    { value: 'urgent', label: 'Urgent (24 hours)' },
  ];

  readonly badges: readonly EmrBadge[] = [
    { label: 'Info', tone: 'info' },
    { label: 'Verified', tone: 'success' },
    { label: 'Review due', tone: 'warning' },
    { label: 'Critical', tone: 'danger' },
    { label: 'Draft', tone: 'neutral' },
  ];

  readonly tabOptions = [
    { value: 'summary', label: 'Summary' },
    { value: 'vitals', label: 'Vitals & IOP', badge: 2 },
    { value: 'locked', label: 'Locked', disabled: true },
    { value: 'plan', label: 'Plan' },
  ];

  readonly typedDef: ClinicalFieldDefinition = {
    id: 'iop-od',
    label: 'Intraocular pressure (OD)',
    type: 'quantity',
    unit: 'mmHg',
    required: true,
    hint: 'Goldmann applanation tonometry',
    assessmentStatusOptions: [
      { value: 'recorded', label: 'Recorded', tone: 'success' },
      { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
      { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
      { value: 'declined', label: 'Declined', tone: 'warning' },
      { value: 'unknown', label: 'Unknown', tone: 'neutral' },
    ],
  };

  readonly typedState = signal<ClinicalFieldState>({
    value: { value: 19, unit: 'mmHg' },
    assessmentStatus: 'recorded',
    warning: 'Compare with baseline target (≤ 16 mmHg)',
  });
  readonly tfShowMetadata = signal(true);
  readonly tfLayout = signal<'vertical' | 'horizontal' | 'inline'>('vertical');

  private readonly snomedUri = 'http://snomed.info/sct';
  private readonly icd10Uri = 'http://hl7.org/fhir/sid/icd-10';
  private readonly codedCatalog: readonly EmrCodedValue[] = [
    { system: 'http://snomed.info/sct', code: '77075001', display: 'Primary open-angle glaucoma' },
    { system: 'http://snomed.info/sct', code: '193570009', display: 'Cataract' },
    { system: 'http://snomed.info/sct', code: '4855003', display: 'Diabetic retinopathy' },
    { system: 'http://hl7.org/fhir/sid/icd-10', code: 'H40.11', display: 'Primary open-angle glaucoma, bilateral' },
    { system: 'http://hl7.org/fhir/sid/icd-10', code: 'E11.319', display: 'Type 2 diabetes with unspecified diabetic retinopathy' },
  ];

  readonly codedModel = signal<CodedInputViewModel>({
    definition: {
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
        assessmentStatusOptions: [
          { value: 'recorded', label: 'Recorded', tone: 'success' },
          { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
          { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
          { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
          { value: 'declined', label: 'Declined', tone: 'warning' },
          { value: 'unknown', label: 'Unknown', tone: 'neutral' },
        ],
      },
    },
    value: [
      { system: 'http://snomed.info/sct', code: '77075001', display: 'Primary open-angle glaucoma' },
      { system: 'http://hl7.org/fhir/sid/icd-10', code: 'H40.11', display: 'Primary open-angle glaucoma, bilateral' },
    ],
    query: '',
    options: [],
    open: false,
    loading: false,
    messages: [],
    emptyMessage: 'No matching terminology concepts',
    systemLabels: { 'http://snomed.info/sct': 'SNOMED CT', 'http://hl7.org/fhir/sid/icd-10': 'ICD-10' },
  });

  onCodedIntent(ev: CodedInputIntent): void {
    const m = this.codedModel();
    let next: CodedInputViewModel = m;
    switch (ev.type) {
      case 'queryChangeRequested': {
        const q = ev.query.trim().toLowerCase();
        const options = q
          ? this.codedCatalog.filter((c) => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
          : this.codedCatalog;
        next = { ...m, query: ev.query, options, open: true };
        break;
      }
      case 'openRequested':
      case 'searchRequested': {
        const q = (ev.type === 'searchRequested' ? ev.query : m.query).trim().toLowerCase();
        const options = q
          ? this.codedCatalog.filter((c) => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
          : this.codedCatalog;
        next = { ...m, options, open: true };
        break;
      }
      case 'closeRequested':
        next = { ...m, open: false };
        break;
      case 'conceptSelected': {
        const list = Array.isArray(m.value) ? m.value : m.value ? [m.value] : [];
        const exists = list.some((c) => c.code === ev.concept.code && c.system === ev.concept.system);
        next = {
          ...m,
          value: exists ? list : [...list, ev.concept],
          query: '',
          open: false,
        };
        break;
      }
      case 'conceptRemoveRequested': {
        const list = Array.isArray(m.value) ? m.value : m.value ? [m.value] : [];
        next = {
          ...m,
          value: list.filter((c) => !(c.code === ev.code && c.system === ev.system)),
        };
        break;
      }
      case 'statusChangeRequested':
        next = { ...m, status: ev.status };
        break;
    }
    this.codedModel.set(next);
    this.emitState(next as unknown as Record<string, unknown>);
  }

  readonly attestationModel = signal<AttestationViewModel>({
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
  });

  onAttestationIntent(ev: AttestationIntent): void {
    const s = this.attestationModel();
    let next = s;
    if (ev.type === 'signRequested') {
      next = {
        ...s,
        canSign: false,
        canAmend: true,
        signatories: s.signatories.map((sig) => ({
          ...sig,
          status: { label: 'Signed', tone: 'success' },
          signedAtLabel: '10:42 IST',
        })),
      };
    } else if (ev.type === 'amendRequested') {
      next = {
        ...s,
        canSign: true,
        canAmend: false,
        signatories: s.signatories.map((sig) => ({
          ...sig,
          status: { label: 'Pending signature', tone: 'warning' },
          signedAtLabel: undefined,
        })),
      };
    }
    this.attestationModel.set(next);
    this.emitState(next as unknown as Record<string, unknown>);
  }

  onSspValueChange(next: readonly DoseSlot[]): void {
    this.sspValue.set(next);
    this.emitState({ value: next });
  }

  onIdentIntent(ev: IdentifierEntryIntent): void {
    const cur = this.identModel();
    if (ev.type === 'valueChanged') {
      const next: IdentifierEntryView = { ...cur, value: ev.raw, normalisedValue: ev.raw.trim() || undefined };
      this.identModel.set(next);
      this.emitState({ value: ev.raw });
    } else if (ev.type === 'typeSelected') {
      this.identModel.set({ ...cur, selectedType: ev.id });
      this.emitState({ selectedType: ev.id });
    } else if (ev.type === 'scanRequested') {
      const scans = this.identScans() + 1;
      this.identScans.set(scans);
      this.identModel.set({ ...cur, hint: `Scanner triggers: ${scans}` });
      this.emitState({ scans });
    } else if (ev.type === 'cleared') {
      this.identModel.set({ ...cur, value: '', normalisedValue: undefined });
      this.emitState({ value: '' });
    }
  }

  onScaleIntent(ev: ScaleFieldIntent): void {
    const cur = this.scaleModel();
    if (ev.type === 'valueChangeRequested') {
      this.scaleModel.set({ ...cur, value: ev.value, status: 'recorded' });
      this.emitState({ value: ev.value, status: 'recorded' });
    } else if (ev.type === 'statusChangeRequested') {
      this.scaleModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onPartialDateIntent(ev: PartialDateFieldIntent): void {
    const cur = this.partialDateModel();
    if (ev.type === 'precisionChangeRequested') {
      this.partialDateModel.set({ ...cur, defaultPrecision: ev.precision });
      this.emitState({ defaultPrecision: ev.precision });
    } else if (ev.type === 'valueChangeRequested') {
      this.partialDateModel.set({ ...cur, value: ev.value });
      this.emitState({ value: ev.value });
    } else if (ev.type === 'statusChangeRequested') {
      this.partialDateModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onAttachmentIntent(ev: AttachmentFieldIntent): void {
    const cur = this.attachmentModel();
    if (ev.type === 'itemRemoveRequested') {
      const next = cur.items.filter((x) => x.id !== ev.id);
      this.attachmentModel.set({ ...cur, items: next });
      this.emitState({ items: next });
    } else if (ev.type === 'filesSelected') {
      const added = ev.files.map((f, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        title: f.name,
        contentType: f.mimeType || 'application/octet-stream',
        sizeBytes: f.sizeBytes,
      }));
      const next = [...cur.items, ...added];
      this.attachmentModel.set({ ...cur, items: next });
      this.emitState({ items: next });
    } else if (ev.type === 'statusChangeRequested') {
      this.attachmentModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onPairedIntent(ev: PairedFieldIntent): void {
    const cur = this.pairedModel();
    const curVal = cur.value ?? { first: null, second: null };
    if (ev.type === 'firstChangeRequested') {
      const nextVal = { ...curVal, first: ev.value };
      this.pairedModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'secondChangeRequested') {
      const nextVal = { ...curVal, second: ev.value };
      this.pairedModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'clearRequested') {
      const nextVal = { first: null, second: null };
      this.pairedModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'statusChangeRequested') {
      this.pairedModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onDurationIntent(ev: DurationFieldIntent): void {
    const cur = this.durationModel();
    const curVal = cur.value ?? { amount: null, unit: cur.unitOptions[0]?.value ?? 'd' };
    if (ev.type === 'amountChangeRequested') {
      const nextVal = { ...curVal, amount: ev.amount };
      this.durationModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'unitChangeRequested') {
      const nextVal = { ...curVal, unit: ev.unit };
      this.durationModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'clearRequested') {
      this.durationModel.set({ ...cur, value: null });
      this.emitState({ value: null });
    } else if (ev.type === 'statusChangeRequested') {
      this.durationModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onRangeIntent(ev: RangeFieldIntent): void {
    const cur = this.rangeModel();
    const curVal = cur.value ?? { low: null, high: null };
    if (ev.type === 'lowChangeRequested') {
      const nextVal = { ...curVal, low: ev.low };
      this.rangeModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'highChangeRequested') {
      const nextVal = { ...curVal, high: ev.high };
      this.rangeModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'rangeChangeRequested') {
      this.rangeModel.set({ ...cur, value: ev.value });
      this.emitState({ value: ev.value });
    } else if (ev.type === 'clearRequested') {
      this.rangeModel.set({ ...cur, value: null });
      this.emitState({ value: null });
    } else if (ev.type === 'statusChangeRequested') {
      this.rangeModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onPhoneIntent(ev: PhoneFieldIntent): void {
    const cur = this.phoneModel();
    const formatPreview = (cc: string, num: string, ext?: string) =>
      num ? `${cc} ${num}${ext ? ` ext. ${ext}` : ''}` : '';
    if (ev.type === 'countryCodeChangeRequested') {
      const formattedPreview = formatPreview(ev.countryCode, cur.nationalNumber, cur.extension);
      this.phoneModel.set({ ...cur, countryCode: ev.countryCode, formattedPreview });
      this.emitState({ countryCode: ev.countryCode, formattedPreview });
    } else if (ev.type === 'numberChangeRequested') {
      const formattedPreview = formatPreview(cur.countryCode, ev.nationalNumber, cur.extension);
      this.phoneModel.set({ ...cur, nationalNumber: ev.nationalNumber, formattedPreview });
      this.emitState({ nationalNumber: ev.nationalNumber, formattedPreview });
    } else if (ev.type === 'extensionChangeRequested') {
      const formattedPreview = formatPreview(cur.countryCode, cur.nationalNumber, ev.extension);
      this.phoneModel.set({ ...cur, extension: ev.extension, formattedPreview });
      this.emitState({ extension: ev.extension, formattedPreview });
    } else if (ev.type === 'channelToggleRequested') {
      const list = cur.channels ?? [];
      const nextChannels: readonly EmrPhoneChannel[] = list.includes(ev.channel)
        ? list.filter((c) => c !== ev.channel)
        : [...list, ev.channel];
      this.phoneModel.set({ ...cur, channels: nextChannels });
      this.emitState({ channels: nextChannels });
    } else if (ev.type === 'clearRequested') {
      this.phoneModel.set({ ...cur, nationalNumber: '', extension: '', formattedPreview: '' });
      this.emitState({ nationalNumber: '', extension: '', formattedPreview: '' });
    } else if (ev.type === 'statusChangeRequested') {
      this.phoneModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onAddressIntent(ev: AddressFieldIntent): void {
    const cur = this.addressModel();
    if (ev.type === 'fieldChangeRequested') {
      const nextVal = { ...cur.value, [ev.part]: ev.value };
      this.addressModel.set({ ...cur, value: nextVal });
      this.emitState({ value: nextVal });
    } else if (ev.type === 'useChangeRequested') {
      this.addressModel.set({ ...cur, use: ev.use });
      this.emitState({ use: ev.use });
    } else if (ev.type === 'cleared') {
      const clearedVal = {
        line1: '',
        line2: '',
        city: '',
        district: '',
        state: '',
        postalCode: '',
        country: '',
      };
      this.addressModel.set({ ...cur, value: clearedVal });
      this.emitState({ value: clearedVal });
    } else if (ev.type === 'statusChangeRequested') {
      this.addressModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onMacroTextIntent(ev: MacroTextFieldIntent): void {
    const cur = this.macroTextModel();
    if (ev.type === 'valueChangeRequested') {
      this.macroTextModel.set({ ...cur, value: ev.value });
      this.emitState({ value: ev.value });
    } else if (ev.type === 'macroQueryRequested') {
      const q = ev.trigger.toLowerCase();
      const suggestions = this.macroTextCatalog.filter((m) =>
        q === '.' || q === '/'
          ? m.trigger.toLowerCase().startsWith(q)
          : m.trigger.toLowerCase().includes(q) || m.label.toLowerCase().includes(q),
      );
      this.macroTextModel.set({ ...cur, suggestions, suggestionsOpen: true });
      this.emitState({ suggestions, suggestionsOpen: true });
    } else if (ev.type === 'macroSelected') {
      const chosen = this.macroTextCatalog.find((m) => m.trigger === ev.trigger);
      const expansion = chosen ? chosen.expansionPreview : ev.trigger;
      const next = expandMacroTriggerAtCursor(cur.value, cur.value.length, expansion);
      this.macroTextModel.set({
        ...cur,
        value: next.value,
        suggestions: this.macroTextCatalog,
        suggestionsOpen: false,
      });
      this.emitState({ value: next.value, suggestions: this.macroTextCatalog, suggestionsOpen: false });
    } else if (ev.type === 'macroDismissRequested') {
      this.macroTextModel.set({ ...cur, suggestionsOpen: false });
      this.emitState({ suggestionsOpen: false });
    } else if (ev.type === 'dictationToggleRequested') {
      const dictating = !cur.dictating;
      this.macroTextModel.set({ ...cur, dictating });
      this.emitState({ dictating });
    } else if (ev.type === 'clearRequested') {
      this.macroTextModel.set({
        ...cur,
        value: '',
        suggestions: this.macroTextCatalog,
        suggestionsOpen: false,
      });
      this.emitState({ value: '', suggestions: this.macroTextCatalog, suggestionsOpen: false });
    } else if (ev.type === 'statusChangeRequested') {
      this.macroTextModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onLateralityIntent(ev: LateralityFieldIntent): void {
    const cur = this.lateralityModel();
    if (ev.type === 'lateralitySelected') {
      this.lateralityModel.set({ ...cur, value: ev.code, confirmed: false });
      this.emitState({ value: ev.code, confirmed: false });
    } else if (ev.type === 'confirmationChangeRequested') {
      this.lateralityModel.set({ ...cur, confirmed: ev.confirmed });
      this.emitState({ confirmed: ev.confirmed });
    } else if (ev.type === 'statusChangeRequested') {
      this.lateralityModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onVisualAcuityIntent(ev: VisualAcuityFieldIntent): void {
    const cur = this.visualAcuityModel();
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
    if (ev.type === 'notationChangeRequested') {
      const preset = chartMap[ev.notation];
      const next: VisualAcuityFieldViewModel = {
        ...cur,
        notation: ev.notation,
        valueOptions: preset.options,
        value: preset.value,
        pinholeValue: cur.showPinhole ? preset.pinhole : null,
        derivedDisplay: preset.derived,
      };
      this.visualAcuityModel.set(next);
      this.emitState({
        notation: next.notation,
        valueOptions: next.valueOptions,
        value: next.value,
        pinholeValue: next.pinholeValue,
        derivedDisplay: next.derivedDisplay,
      });
    } else if (ev.type === 'correctionChangeRequested') {
      this.visualAcuityModel.set({ ...cur, correction: ev.correction });
      this.emitState({ correction: ev.correction });
    } else if (ev.type === 'valueChangeRequested') {
      const derivedDisplay = ev.value
        ? `${cur.notation.toUpperCase()} ${ev.value}${cur.pinholeValue ? ` (PH ${cur.pinholeValue})` : ''}`
        : undefined;
      this.visualAcuityModel.set({ ...cur, value: ev.value, derivedDisplay });
      this.emitState({ value: ev.value, derivedDisplay });
    } else if (ev.type === 'pinholeChangeRequested') {
      const derivedDisplay = cur.value
        ? `${cur.notation.toUpperCase()} ${cur.value}${ev.value ? ` (PH ${ev.value})` : ''}`
        : cur.derivedDisplay;
      this.visualAcuityModel.set({ ...cur, pinholeValue: ev.value, derivedDisplay });
      this.emitState({ pinholeValue: ev.value, derivedDisplay });
    } else if (ev.type === 'statusChangeRequested') {
      this.visualAcuityModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onRefractionIntent(ev: RefractionFieldIntent): void {
    const cur = this.refractionModel();
    if (ev.type === 'statusChangeRequested') {
      this.refractionModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
      return;
    }

    const nextValue: RefractionFieldViewModel['value'] =
      ev.type === 'clearRequested'
        ? { sphere: null, cylinder: null, axis: null, nearAdd: null }
        : ev.type === 'sphereChangeRequested'
          ? { ...cur.value, sphere: ev.sphere }
          : ev.type === 'cylinderChangeRequested'
            ? { ...cur.value, cylinder: ev.cylinder }
            : ev.type === 'axisChangeRequested'
              ? { ...cur.value, axis: ev.axis }
              : { ...cur.value, nearAdd: ev.nearAdd };

    const fmtSigned = (n: number | null | undefined) => {
      if (n === null || n === undefined) return '—';
      const fixed = Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2);
      return n > 0 ? `+${fixed}` : fixed;
    };
    const hasAny =
      nextValue.sphere !== null ||
      nextValue.cylinder !== null ||
      nextValue.axis !== null ||
      (cur.showNearAdd && nextValue.nearAdd != null);
    const formattedSummary = hasAny
      ? `${fmtSigned(nextValue.sphere)}${nextValue.cylinder !== null ? ` / ${fmtSigned(nextValue.cylinder)}` : ''}${nextValue.axis !== null ? ` × ${String(Math.round(nextValue.axis)).padStart(3, '0')}°` : ''}${cur.showNearAdd && nextValue.nearAdd != null ? `  Add ${fmtSigned(nextValue.nearAdd)} D` : ''}${nextValue.sphere !== null ? ` (SE ${fmtSigned(nextValue.sphere + (nextValue.cylinder ?? 0) / 2)} D)` : ''}`
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

    this.refractionModel.set({ ...cur, value: nextValue, formattedSummary, messages });
    this.emitState({ value: nextValue, formattedSummary, messages });
  }

  onSignatureIntent(ev: SignatureCaptureIntent): void {
    const cur = this.signatureModel();
    if (ev.type === 'strokeAdded') {
      const nextStrokes = [...cur.strokes, ev.stroke];
      this.signatureModel.set({ ...cur, strokes: nextStrokes });
      this.emitState({ strokes: nextStrokes });
    } else if (ev.type === 'undoRequested') {
      const nextStrokes = cur.strokes.slice(0, -1);
      this.signatureModel.set({ ...cur, strokes: nextStrokes });
      this.emitState({ strokes: nextStrokes });
    } else if (ev.type === 'clearRequested') {
      this.signatureModel.set({ ...cur, strokes: [] });
      this.emitState({ strokes: [] });
    } else if (ev.type === 'statusChangeRequested') {
      this.signatureModel.set({ ...cur, status: ev.status });
      this.emitState({ status: ev.status });
    }
  }

  onRepeatIntent(ev: ClinicalFormIntent): void {
    const baseItems = this.repeatEmpty() ? [] : this.repeatItems();
    if (ev.type === 'repeatItemAddRequested') {
      const maxIndex = baseItems.reduce((acc, item) => {
        const match = /^drop-(\d+)$/.exec(item.id);
        const n = match ? Number(match[1]) : 0;
        return Number.isFinite(n) && n > acc ? n : acc;
      }, 0);
      const nextNum = maxIndex + 1;
      const next: readonly RepeatableItemState[] = [
        ...baseItems,
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
      this.repeatItems.set(next);
      this.repeatEmpty.set(false);
      this.emitState({ items: next, empty: false });
    } else if (ev.type === 'repeatItemRemoveRequested') {
      const next = baseItems.filter((it) => it.id !== ev.itemId);
      this.repeatItems.set(next);
      this.emitState({ items: next });
    } else if (ev.type === 'repeatItemEditRequested') {
      const next = baseItems.map((it) =>
        it.id === ev.itemId
          ? { ...it, fields: { ...it.fields, [ev.fieldId]: { ...it.fields[ev.fieldId], value: ev.value } } }
          : it,
      );
      this.repeatItems.set(next);
      this.emitState({ items: next });
    } else if (ev.type === 'repeatItemStatusEditRequested') {
      const next = baseItems.map((it) =>
        it.id === ev.itemId
          ? {
              ...it,
              fields: {
                ...it.fields,
                [ev.fieldId]: {
                  ...it.fields[ev.fieldId],
                  value: it.fields[ev.fieldId]?.value ?? null,
                  assessmentStatus: ev.status,
                },
              },
            }
          : it,
      );
      this.repeatItems.set(next);
      this.emitState({ items: next });
    }
  }

  clinicalFormModel(): ClinicalFormViewModel {
    return {
      schema: this.clinicalFormSchema,
      fields: this.clinicalFormFields(),
      repeatableGroups: this.clinicalFormRepeatableGroups(),
      collapsedSectionIds: this.clinicalFormCollapsedSectionIds(),
      sectionStatuses: this.clinicalFormSectionStatuses,
      readOnly: this.clinicalFormReadOnly() || this.readOnly(),
    };
  }

  onClinicalFormIntent(ev: ClinicalFormIntent): void {
    if (ev.type === 'fieldEditRequested') {
      const next: Record<string, ClinicalFieldState> = {
        ...this.clinicalFormFields(),
        [ev.fieldId]: { ...this.clinicalFormFields()[ev.fieldId], value: ev.value },
      };
      this.clinicalFormFields.set(next);
      this.emitState({ fields: next });
    } else if (ev.type === 'fieldStatusEditRequested') {
      const prev = this.clinicalFormFields()[ev.fieldId];
      const next: Record<string, ClinicalFieldState> = {
        ...this.clinicalFormFields(),
        [ev.fieldId]: { ...prev, value: prev?.value ?? null, assessmentStatus: ev.status },
      };
      this.clinicalFormFields.set(next);
      this.emitState({ fields: next });
    } else if (ev.type === 'sectionToggleRequested') {
      const collapsed = new Set(this.clinicalFormCollapsedSectionIds());
      if (collapsed.has(ev.sectionId)) collapsed.delete(ev.sectionId);
      else collapsed.add(ev.sectionId);
      const next = [...collapsed];
      this.clinicalFormCollapsedSectionIds.set(next);
      this.emitState({ collapsedSectionIds: next });
    } else if (ev.type === 'repeatItemAddRequested') {
      const groups = this.clinicalFormRepeatableGroups();
      const existing = groups[ev.groupId] ?? [];
      const taken = new Set(existing.map((it) => it.id));
      let seq = existing.length + 1;
      while (taken.has(`drop-${seq}`)) seq += 1;
      const nextGroups = {
        ...groups,
        [ev.groupId]: [
          ...existing,
          { id: `drop-${seq}`, label: `Medication ${seq}`, fields: { drug: { value: '' }, freq: { value: '' } } },
        ],
      };
      this.clinicalFormRepeatableGroups.set(nextGroups);
      this.emitState({ repeatableGroups: nextGroups });
    } else if (ev.type === 'repeatItemRemoveRequested') {
      const groups = this.clinicalFormRepeatableGroups();
      const nextGroups = {
        ...groups,
        [ev.groupId]: (groups[ev.groupId] ?? []).filter((it) => it.id !== ev.itemId),
      };
      this.clinicalFormRepeatableGroups.set(nextGroups);
      this.emitState({ repeatableGroups: nextGroups });
    } else if (ev.type === 'repeatItemEditRequested') {
      const groups = this.clinicalFormRepeatableGroups();
      const nextGroups = {
        ...groups,
        [ev.groupId]: (groups[ev.groupId] ?? []).map((it) =>
          it.id === ev.itemId
            ? { ...it, fields: { ...it.fields, [ev.fieldId]: { ...it.fields[ev.fieldId], value: ev.value } } }
            : it,
        ),
      };
      this.clinicalFormRepeatableGroups.set(nextGroups);
      this.emitState({ repeatableGroups: nextGroups });
    } else if (ev.type === 'repeatItemStatusEditRequested') {
      const groups = this.clinicalFormRepeatableGroups();
      const nextGroups = {
        ...groups,
        [ev.groupId]: (groups[ev.groupId] ?? []).map((it) =>
          it.id === ev.itemId
            ? {
                ...it,
                fields: {
                  ...it.fields,
                  [ev.fieldId]: {
                    ...it.fields[ev.fieldId],
                    value: it.fields[ev.fieldId]?.value ?? null,
                    assessmentStatus: ev.status,
                  },
                },
              }
            : it,
        ),
      };
      this.clinicalFormRepeatableGroups.set(nextGroups);
      this.emitState({ repeatableGroups: nextGroups });
    } else if (ev.type === 'correctionRequested') {
      this.clinicalFormReadOnly.set(false);
      this.emitState({ readOnly: false });
    }
  }

  private readonly clinicalListModels = signal<
    Record<
      | 'emr-clinical-list'
      | 'emr-medication-list'
      | 'emr-allergy-list'
      | 'emr-chronic-disease-list'
      | 'emr-personal-history-list',
      ClinicalListViewModel
    >
  >({
    'emr-clinical-list': {
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
    },
    'emr-medication-list': {
      title: 'Medications',
      items: [
        {
          id: 'm1',
          title: 'Latanoprost 0.005% eye drops',
          subtitle: '1 drop OU at bedtime',
          badges: [{ label: 'Active', tone: 'success' }],
        },
        {
          id: 'm2',
          title: 'Metformin 500 mg tablet',
          subtitle: 'Twice daily after food',
          badges: [{ label: 'Systemic', tone: 'info' }],
        },
      ],
      selectedId: 'm1',
      allowAdd: true,
      readOnly: false,
      loading: false,
      error: '',
      variant: 'outlined',
      emptyMessage: 'No active medications.',
    },
    'emr-allergy-list': {
      title: 'Allergies',
      items: [
        {
          id: 'a1',
          title: 'Penicillin',
          subtitle: 'Anaphylaxis (verified 2025)',
          badges: [{ label: 'Severe', tone: 'danger' }],
        },
        {
          id: 'a2',
          title: 'Sulfonamides',
          subtitle: 'Maculopapular rash',
          badges: [{ label: 'Moderate', tone: 'warning' }],
        },
      ],
      selectedId: 'a1',
      allowAdd: true,
      readOnly: false,
      loading: false,
      error: '',
      variant: 'outlined',
      emptyMessage: 'No known drug allergies recorded.',
    },
    'emr-chronic-disease-list': {
      title: 'Chronic diseases',
      items: [
        {
          id: 'd1',
          title: 'Primary Open-Angle Glaucoma (OU)',
          subtitle: 'Since 2022',
          badges: [{ label: 'On therapy', tone: 'info' }],
        },
        {
          id: 'd2',
          title: 'Type 2 Diabetes Mellitus',
          subtitle: 'HbA1c 7.6%',
          badges: [{ label: 'Active', tone: 'warning' }],
        },
      ],
      selectedId: 'd1',
      allowAdd: true,
      readOnly: false,
      loading: false,
      error: '',
      variant: 'outlined',
      emptyMessage: 'No chronic conditions recorded.',
    },
    'emr-personal-history-list': {
      title: 'Significant personal history',
      items: [
        {
          id: 'p1',
          title: 'Non-smoker, non-alcoholic',
          subtitle: 'Recorded at intake',
          badges: [{ label: 'Verified', tone: 'success' }],
        },
        {
          id: 'p2',
          title: 'High near-screen visual demand',
          subtitle: 'Accountant (8 hrs/day)',
          badges: [{ label: 'Occupational', tone: 'neutral' }],
        },
      ],
      selectedId: 'p1',
      allowAdd: true,
      readOnly: false,
      loading: false,
      error: '',
      variant: 'outlined',
      emptyMessage: 'No personal/social history recorded.',
    },
  });

  clinicalListModelFor(
    sel:
      | 'emr-clinical-list'
      | 'emr-medication-list'
      | 'emr-allergy-list'
      | 'emr-chronic-disease-list'
      | 'emr-personal-history-list',
  ): ClinicalListViewModel {
    const cur = this.clinicalListModels()[sel];
    return {
      ...cur,
      readOnly: Boolean(cur.readOnly) || this.readOnly(),
      error: cur.error || undefined,
    };
  }

  onClinicalListIntent(
    sel:
      | 'emr-clinical-list'
      | 'emr-medication-list'
      | 'emr-allergy-list'
      | 'emr-chronic-disease-list'
      | 'emr-personal-history-list',
    ev: ClinicalListIntent,
  ): void {
    const cur = this.clinicalListModels()[sel];
    let next: ClinicalListViewModel = cur;
    if (ev.type === 'selected') {
      next = { ...cur, selectedId: ev.id };
    } else if (ev.type === 'editRequested') {
      next = {
        ...cur,
        selectedId: ev.id,
        items: cur.items.map((item) =>
          item.id === ev.id ? { ...item, meta: 'Edited' } : item,
        ),
      };
    } else if (ev.type === 'removeRequested') {
      next = {
        ...cur,
        items: cur.items.filter((item) => item.id !== ev.id),
        selectedId: cur.selectedId === ev.id ? undefined : cur.selectedId,
      };
    } else if (ev.type === 'addRequested') {
      const max = cur.items.reduce((acc, item) => {
        const match = /(\d+)$/.exec(item.id);
        const n = match ? Number(match[1]) : 0;
        return Number.isFinite(n) && n > acc ? n : acc;
      }, 0);
      const nextNum = max + 1;
      next = {
        ...cur,
        items: [
          ...cur.items,
          {
            id: `c-${nextNum}`,
            title: `Added clinical entry ${nextNum}`,
            badges: [{ label: 'New', tone: 'info' }],
          },
        ],
      };
    } else if (ev.type === 'retryRequested') {
      next = { ...cur, error: '', loading: false };
    }
    this.clinicalListModels.update((prev) => ({ ...prev, [sel]: next }));
    this.emitState({
      items: next.items,
      selectedId: next.selectedId,
      error: next.error ?? '',
      loading: Boolean(next.loading),
    });
  }

  private readonly clinicalMatrixBaseSchema: ClinicalMatrixSchema = {
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

  readonly clinicalMatrixValues = signal<ClinicalMatrixValues>({
    va: {
      remark: 'Snellen 6m',
      cells: {
        od: { value: '6/9', assessmentStatus: { value: 'recorded', label: 'Recorded', tone: 'success' } },
        os: { value: '6/6' },
      },
    },
    iop: {
      remark: 'GAT 09:45',
      cells: {
        od: {
          value: { value: 24, unit: 'mmHg' },
          warning: 'Above 21 mmHg',
          previousValueLabel: 'Prev: 18 mmHg',
          deltaLabel: '+6',
          flagBadge: { label: 'Elevated', tone: 'warning' },
          modified: true,
        },
        os: { value: { value: 16, unit: 'mmHg' } },
      },
    },
    cdr: {
      remark: '90D lens',
      cells: {
        od: { value: 0.95, error: 'Confirm optic disc excavation' },
        os: { value: 0.45 },
      },
    },
    schirmer: { remark: '', cells: { od: { value: 14 } } },
    cornea: {
      remark: '',
      remarkError: 'Enter cornea remark before sign-off',
      cells: { od: { value: 'Clear, deep AC' }, os: { value: 'Clear, deep AC' } },
    },
  });
  readonly clinicalMatrixReadOnly = signal(false);
  readonly clinicalMatrixShowRemarks = signal(true);

  clinicalMatrixDefinition(): ClinicalMatrixSchema {
    return {
      ...this.clinicalMatrixBaseSchema,
      showRemarks: this.clinicalMatrixShowRemarks(),
    };
  }

  onClinicalMatrixIntent(ev: ClinicalMatrixIntent): void {
    const cur = this.clinicalMatrixValues();
    let next = cur;
    if (ev.type === 'cellEditRequested') {
      const row = cur[ev.rowId] ?? { remark: '', cells: {} };
      const prevCell: ClinicalCellState = row.cells[ev.columnId] ?? { value: null };
      next = {
        ...cur,
        [ev.rowId]: {
          ...row,
          cells: {
            ...row.cells,
            [ev.columnId]: { ...prevCell, value: ev.value, modified: true },
          },
        },
      };
    } else if (ev.type === 'cellAssessmentStatusEditRequested') {
      const row = cur[ev.rowId] ?? { remark: '', cells: {} };
      const prevCell: ClinicalCellState = row.cells[ev.columnId] ?? { value: null };
      const statusObj = ev.status
        ? {
            value: ev.status,
            label: ev.status === 'recorded' ? 'Recorded' : 'Unable to assess',
            tone: (ev.status === 'recorded' ? 'success' : 'warning') as 'success' | 'warning',
          }
        : undefined;
      next = {
        ...cur,
        [ev.rowId]: {
          ...row,
          cells: { ...row.cells, [ev.columnId]: { ...prevCell, assessmentStatus: statusObj } },
        },
      };
    } else if (ev.type === 'remarkEditRequested') {
      const row = cur[ev.rowId] ?? { remark: '', cells: {} };
      next = {
        ...cur,
        [ev.rowId]: {
          ...row,
          remark: ev.remark,
          remarkError: ev.rowId === 'cornea' && !ev.remark.trim() ? 'Enter cornea remark before sign-off' : undefined,
        },
      };
    }
    if (next !== cur) {
      this.clinicalMatrixValues.set(next);
      this.emitState({
        values: next,
        readOnly: this.clinicalMatrixReadOnly(),
        showRemarks: this.clinicalMatrixShowRemarks(),
      });
    }
  }

  readonly customCellSchema: ClinicalMatrixSchema = {
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
  readonly customCellOd = signal(1);

  private readonly annotationToolbarSeed: AnnotationToolbarViewModel = {
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

  readonly tbSelectedToolId = signal('ellipse');
  readonly tbSelectedColourId = signal('red');
  readonly tbSelectedWidthId = signal('w2');
  readonly tbZoomPct = signal(100);
  readonly tbCanUndo = signal(true);
  readonly tbCanRedo = signal(true);
  readonly tbCanSave = signal(true);
  readonly tbZoomLocked = signal(false);
  readonly tbReadOnly = signal(false);
  readonly tbUndoCount = signal(0);
  readonly tbRedoCount = signal(0);
  readonly tbSaveCount = signal(0);

  annotationToolbarModel(): AnnotationToolbarViewModel {
    return {
      ...this.annotationToolbarSeed,
      selectedToolId: this.tbSelectedToolId(),
      selectedColourId: this.tbSelectedColourId(),
      selectedWidthId: this.tbSelectedWidthId(),
      zoomLabel: `${this.tbZoomPct()}%`,
      canUndo: this.tbCanUndo(),
      canRedo: this.tbCanRedo(),
      canSave: this.tbCanSave(),
      zoomLocked: this.tbZoomLocked(),
      readOnly: this.readOnly() || this.tbReadOnly(),
    };
  }

  onAnnotationToolbarIntent(ev: AnnotationToolbarIntent): void {
    const locked = this.readOnly() || this.tbReadOnly();
    switch (ev.type) {
      case 'toolSelected':
        if (locked) return;
        this.tbSelectedToolId.set(ev.toolId);
        this.emitState({ selectedToolId: ev.toolId });
        break;
      case 'colourSelected':
        if (locked) return;
        this.tbSelectedColourId.set(ev.colourId);
        this.emitState({ selectedColourId: ev.colourId });
        break;
      case 'widthSelected':
        if (locked) return;
        this.tbSelectedWidthId.set(ev.widthId);
        this.emitState({ selectedWidthId: ev.widthId });
        break;
      case 'undoRequested':
        if (locked || !this.tbCanUndo()) return;
        this.tbUndoCount.update((c) => c + 1);
        this.emitState({ undoCount: this.tbUndoCount() });
        break;
      case 'redoRequested':
        if (locked || !this.tbCanRedo()) return;
        this.tbRedoCount.update((c) => c + 1);
        this.emitState({ redoCount: this.tbRedoCount() });
        break;
      case 'saveRequested':
        if (locked || !this.tbCanSave()) return;
        this.tbSaveCount.update((c) => c + 1);
        this.emitState({ saveCount: this.tbSaveCount() });
        break;
      case 'zoomInRequested':
        if (this.tbZoomLocked()) return;
        this.tbZoomPct.update((z) => Math.min(400, z + 25));
        this.emitState({ zoomPct: this.tbZoomPct() });
        break;
      case 'zoomOutRequested':
        if (this.tbZoomLocked()) return;
        this.tbZoomPct.update((z) => Math.max(25, z - 25));
        this.emitState({ zoomPct: this.tbZoomPct() });
        break;
      case 'zoomResetRequested':
      case 'zoomFitRequested':
        if (this.tbZoomLocked()) return;
        this.tbZoomPct.set(100);
        this.emitState({ zoomPct: 100 });
        break;
    }
  }

  readonly alItems = signal<readonly AnnotationListItem[]>([
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
  ]);
  readonly alSelectedLayerId = signal<string | undefined>('l2');
  readonly alCanLock = signal(true);
  readonly alReadOnly = signal(false);

  annotationListModel(): AnnotationListViewModel {
    return {
      items: this.alItems(),
      selectedLayerId: this.alSelectedLayerId(),
      canLock: this.alCanLock(),
      readOnly: this.readOnly() || this.alReadOnly(),
      emptyMessage: 'No layers.',
    };
  }

  onAnnotationListIntent(ev: AnnotationListIntent): void {
    const locked = this.readOnly() || this.alReadOnly();
    const cur = this.alItems();
    if (ev.type === 'layerSelected') {
      if (cur.some((it) => it.layer.id === ev.layerId)) {
        this.alSelectedLayerId.set(ev.layerId);
        this.emitState({ selectedLayerId: ev.layerId });
      }
      return;
    }
    if (locked) return;
    if (ev.type === 'layerVisibilityToggleRequested') {
      const next = cur.map((it) =>
        it.layer.id === ev.layerId ? { ...it, layer: { ...it.layer, visible: !it.layer.visible } } : it,
      );
      this.alItems.set(next);
      this.emitState({ items: next });
    } else if (ev.type === 'layerLockToggleRequested' && this.alCanLock()) {
      const next = cur.map((it) => (it.layer.id === ev.layerId ? { ...it, locked: !it.locked } : it));
      this.alItems.set(next);
      this.emitState({ items: next });
    } else if (ev.type === 'layerMoveRequested') {
      const idx = cur.findIndex((it) => it.layer.id === ev.layerId);
      if (idx < 0 || cur[idx].locked) return;
      const target = idx + (ev.direction === 'up' ? -1 : 1);
      if (target < 0 || target >= cur.length) return;
      const copy = [...cur];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      const next = copy.map((it, n) => ({ ...it, number: n + 1 }));
      this.alItems.set(next);
      this.emitState({ items: next });
    } else if (ev.type === 'layerRemoveRequested') {
      const item = cur.find((it) => it.layer.id === ev.layerId);
      if (!item || item.locked) return;
      const next = cur
        .filter((it) => it.layer.id !== ev.layerId)
        .map((it, n) => ({ ...it, number: n + 1 }));
      const nextSelected = this.alSelectedLayerId() === ev.layerId ? next[0]?.layer.id : this.alSelectedLayerId();
      this.alItems.set(next);
      this.alSelectedLayerId.set(nextSelected);
      this.emitState({ items: next, selectedLayerId: nextSelected });
    }
  }

  private readonly tpGroups: readonly ImageTemplateGroup[] = [
    { id: 'retina', label: 'Retina', count: 2 },
    { id: 'cornea', label: 'Cornea', count: 1 },
  ];

  private readonly tpSvgUri = (stroke: string, text: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><circle cx="60" cy="54" r="40" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="60" cy="54" r="12" fill="none" stroke="${stroke}" stroke-width="2"/><text x="60" y="112" text-anchor="middle" font-size="11" fill="${stroke}" font-family="sans-serif">${text}</text></svg>`,
    )}`;

  private readonly tpAllTemplates: readonly ImageTemplateOption[] = [
    { id: 'retina-od', label: 'Posterior pole (OD)', imageUrl: this.tpSvgUri('#263847', 'Retina OD'), width: 120, height: 120, groupId: 'retina', badges: ['Right'] },
    { id: 'retina-os', label: 'Posterior pole (OS)', imageUrl: this.tpSvgUri('#263847', 'Retina OS'), width: 120, height: 120, groupId: 'retina', badges: ['Left'] },
    { id: 'cornea-od', label: 'Cornea frontal (OD)', imageUrl: this.tpSvgUri('#0f766e', 'Cornea OD'), width: 120, height: 120, groupId: 'cornea', badges: ['Right'] },
  ];

  readonly tpSelectedTemplateId = signal('retina-od');
  readonly tpSearch = signal('');
  readonly tpCategory = signal('all');
  readonly tpFavouritesOnly = signal(false);
  readonly tpFavouriteIds = signal<readonly string[]>(['retina-od']);
  readonly tpReadOnly = signal(false);
  readonly tpCanEditFavourites = signal(true);

  imageTemplatePickerModel(): ImageTemplatePickerViewModel {
    const effectiveGroupId = this.tpFavouritesOnly()
      ? FAVOURITES_GROUP_ID
      : this.tpCategory() && this.tpCategory() !== 'all'
        ? this.tpCategory()
        : undefined;
    const options = filterImageTemplates(
      this.tpAllTemplates,
      this.tpSearch(),
      effectiveGroupId,
      this.tpGroups,
      this.tpFavouriteIds(),
    );
    return {
      title: 'Select anatomical drawing outline',
      options,
      groups: this.tpGroups,
      selectedGroupId: effectiveGroupId,
      query: this.tpSearch(),
      selectedId: this.tpSelectedTemplateId(),
      totalLabel: `${options.length} of ${this.tpAllTemplates.length} outlines`,
      emptyMessage: 'No matching outlines',
      readOnly: this.readOnly() || this.tpReadOnly(),
      favouriteIds: this.tpFavouriteIds(),
      canEditFavourites: this.tpCanEditFavourites(),
    };
  }

  onImageTemplatePickerIntent(ev: ImageTemplatePickerIntent): void {
    const locked = this.readOnly() || this.tpReadOnly();
    switch (ev.type) {
      case 'queryChangeRequested':
        this.tpSearch.set(ev.query);
        this.emitState({ search: ev.query });
        break;
      case 'groupSelected':
        if (ev.groupId === FAVOURITES_GROUP_ID) {
          this.tpFavouritesOnly.set(true);
          this.emitState({ favouritesOnly: true });
        } else if (ev.groupId === null) {
          this.tpFavouritesOnly.set(false);
          this.tpCategory.set('all');
          this.emitState({ favouritesOnly: false, category: 'all' });
        } else {
          this.tpFavouritesOnly.set(false);
          this.tpCategory.set(ev.groupId);
          this.emitState({ favouritesOnly: false, category: ev.groupId });
        }
        break;
      case 'templateSelected':
        if (locked) return;
        this.tpSelectedTemplateId.set(ev.templateId);
        this.emitState({ selectedTemplateId: ev.templateId });
        break;
      case 'favouriteToggleRequested': {
        if (locked || !this.tpCanEditFavourites()) return;
        const cur = this.tpFavouriteIds();
        const next = ev.favourite
          ? [...cur.filter((id) => id !== ev.templateId), ev.templateId]
          : cur.filter((id) => id !== ev.templateId);
        this.tpFavouriteIds.set(next);
        this.emitState({ favouriteIds: next });
        break;
      }
      case 'closeRequested':
        break;
    }
  }

  private readonly taHourly = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'] as const;
  private readonly taHalfHourly = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] as const;
  private readonly taSteps = [
    { id: '60', label: 'Hourly' },
    { id: '30', label: '30 min' },
  ] as const;

  readonly taOffset = signal(0);
  readonly taSelectedTickId = signal('t1');
  readonly taStepId = signal('60');
  readonly taReadOnly = signal(false);

  private timeAxisTicksSource(stepId = this.taStepId()): readonly string[] {
    return stepId === '30' ? this.taHalfHourly : this.taHourly;
  }

  timeAxisModel(): TimeAxisViewModel {
    const source = this.timeAxisTicksSource();
    const offset = Math.max(0, Math.min(source.length - 5, this.taOffset()));
    const step = this.taSteps.find((s) => s.id === this.taStepId());
    return {
      id: 'parity-axis',
      title: 'IOP diurnal curve window',
      ticks: source.slice(offset, offset + 5).map((label, idx) => ({
        id: `t${offset + idx}`,
        label,
        sublabel: 'Day 1',
        current: offset + idx === 2,
      })),
      selectedTickId: this.taSelectedTickId(),
      stepLabel: step?.label,
      steps: this.taSteps,
      selectedStepId: this.taStepId(),
      canShiftEarlier: offset > 0,
      canShiftLater: offset + 5 < source.length,
      readOnly: this.readOnly() || this.taReadOnly(),
    };
  }

  onTimeAxisIntent(ev: TimeAxisIntent): void {
    if (this.readOnly() || this.taReadOnly()) return;
    const source = this.timeAxisTicksSource();
    const maxOffset = Math.max(0, source.length - 5);
    switch (ev.type) {
      case 'tickSelected':
        this.taSelectedTickId.set(ev.tickId);
        this.emitState({ selectedTickId: ev.tickId });
        break;
      case 'shiftEarlierRequested': {
        const nextOffset = Math.max(0, this.taOffset() - 1);
        this.taOffset.set(nextOffset);
        this.emitState({ offset: nextOffset, windowStartLabel: source[nextOffset] ?? '08:00' });
        break;
      }
      case 'shiftLaterRequested': {
        const nextOffset = Math.min(maxOffset, this.taOffset() + 1);
        this.taOffset.set(nextOffset);
        this.emitState({ offset: nextOffset, windowStartLabel: source[nextOffset] ?? '08:00' });
        break;
      }
      case 'stepChangeRequested': {
        const nextSource = this.timeAxisTicksSource(ev.stepId);
        const offset = Math.max(0, Math.min(nextSource.length - 5, this.taOffset()));
        this.taStepId.set(ev.stepId);
        this.emitState({ stepId: ev.stepId, windowStartLabel: nextSource[offset] ?? '08:00' });
        break;
      }
    }
  }

  private readonly dtColumns: EmrDataTableColumn[] = [
    { id: 'patient', label: 'Patient', sortable: true, width: 150 },
    { id: 'centre', label: 'Vision Centre', sortable: true },
    { id: 'date', label: 'Referred', sortable: true, align: 'end', width: 120 },
    { id: 'status', label: 'Status' },
  ];
  private readonly dtSource: ReadonlyArray<{
    id: string;
    patient: string;
    centre: string;
    date: string;
    status: EmrBadge;
  }> = [
    { id: 'r1', patient: 'Ananya Rao', centre: 'Vision Centre North', date: '11 Oct 2026', status: { label: 'Pending', tone: 'warning' } },
    { id: 'r2', patient: 'Aarav Sharma', centre: 'District Eye Unit', date: '12 Oct 2026', status: { label: 'Accepted', tone: 'success' } },
    { id: 'r3', patient: 'Meera Iyer', centre: 'Community Screening', date: '13 Oct 2026', status: { label: 'Pending', tone: 'warning' } },
    { id: 'r4', patient: 'Rohan Nair', centre: 'Vision Centre North', date: '14 Oct 2026', status: { label: 'Declined', tone: 'danger' } },
    { id: 'r5', patient: 'Kavita Verma', centre: 'District Eye Unit', date: '15 Oct 2026', status: { label: 'Pending', tone: 'warning' } },
    { id: 'r6', patient: 'Vikram Patel', centre: 'Rampur Vision Centre', date: '16 Oct 2026', status: { label: 'Accepted', tone: 'success' } },
    { id: 'r7', patient: 'Priya Menon', centre: 'Community Screening', date: '17 Oct 2026', status: { label: 'Booked', tone: 'info' } },
    { id: 'r8', patient: 'Suresh Das', centre: 'Rampur Vision Centre', date: '18 Oct 2026', status: { label: 'Pending', tone: 'warning' } },
  ];
  readonly dtSortColumnId = signal<string | undefined>(undefined);
  readonly dtSortDirection = signal<EmrDataTableSortDirection | undefined>(undefined);
  readonly dtSelectedIds = signal<string[]>(['r1']);
  readonly dtDensity = signal<EmrDataTableDensity>('comfortable');
  readonly dtPendingOnly = signal(false);
  readonly dtCustomSavedFilter = signal(false);
  readonly dtPage = signal(1);
  readonly dtPageSize = signal(5);
  readonly dtLoading = signal(false);
  readonly dtError = signal('');
  readonly dtReadOnly = signal(false);

  dataTableModel(): EmrDataTableModel {
    const pendingOnly = this.dtPendingOnly();
    const filtered = this.dtSource.filter((r) => !pendingOnly || r.status.label === 'Pending');
    const sortCol = this.dtSortColumnId();
    const sortDir = this.dtSortDirection();
    const sorted = sortCol && sortDir
      ? [...filtered].sort((a, b) => {
          const av = sortCol === 'centre' ? a.centre : sortCol === 'date' ? a.date : a.patient;
          const bv = sortCol === 'centre' ? b.centre : sortCol === 'date' ? b.date : b.patient;
          return av.localeCompare(bv) * (sortDir === 'asc' ? 1 : -1);
        })
      : filtered;
    const pageSize = this.dtPageSize();
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(Math.max(1, this.dtPage()), pageCount);
    const start = (currentPage - 1) * pageSize;
    const slice = sorted.slice(start, start + pageSize);
    const rows: EmrDataTableRow[] = slice.map((r) => ({
      id: r.id,
      cells: { patient: r.patient, centre: r.centre, date: r.date, status: { text: '', badge: r.status } },
    }));
    const first = slice.length > 0 ? start + 1 : 0;
    const last = slice.length > 0 ? start + slice.length : 0;
    const err = this.dtError();
    return {
      caption: 'Vision centre surgical referrals',
      columns: this.dtColumns,
      rows,
      selectedIds: [...this.dtSelectedIds()],
      sort: sortCol && sortDir ? { columnId: sortCol, direction: sortDir } : undefined,
      filters: pendingOnly ? [{ id: 'pending', label: 'Status', valueLabel: 'Pending' }] : [],
      savedFilters: this.dtCustomSavedFilter()
        ? [
            { id: 'pending', label: 'Pending only' },
            { id: 'custom', label: 'Current view (saved)' },
          ]
        : [{ id: 'pending', label: 'Pending only' }],
      bulkActions: [{ id: 'accept', label: 'Accept selected' }],
      density: this.dtDensity(),
      page: currentPage,
      pageCount,
      pageSize,
      pageSizeOptions: [3, 5, 10],
      summaryLabel: slice.length > 0 ? `Showing ${first}–${last} of ${sorted.length} referrals` : 'Showing 0 of 0 referrals',
      status: this.dtLoading() ? 'loading' : err ? 'error' : 'ready',
      error: err || undefined,
      readOnly: this.readOnly() || this.dtReadOnly(),
    };
  }

  onDataTableIntent(ev: EmrDataTableIntent): void {
    const ro = this.readOnly() || this.dtReadOnly();
    switch (ev.type) {
      case 'sortChanged':
        this.dtSortColumnId.set(ev.columnId);
        this.dtSortDirection.set(ev.direction);
        this.dtPage.set(1);
        this.emitState({ sortColumnId: ev.columnId, sortDirection: ev.direction, page: 1 });
        break;
      case 'selectionChanged':
        if (ro) return;
        this.dtSelectedIds.set(ev.selectedIds);
        this.emitState({ selectedIds: ev.selectedIds, selectedRowCount: ev.selectedIds.length });
        break;
      case 'densityChanged':
        this.dtDensity.set(ev.density);
        this.emitState({ density: ev.density });
        break;
      case 'savedFilterSelected':
        this.dtPendingOnly.set(true);
        this.dtPage.set(1);
        this.emitState({ pendingOnly: true, page: 1 });
        break;
      case 'filterAddRequested':
        if (ro) return;
        this.dtPendingOnly.set(true);
        this.dtPage.set(1);
        this.emitState({ pendingOnly: true, page: 1 });
        break;
      case 'filterRemoved':
        if (ro) return;
        this.dtPendingOnly.set(false);
        this.dtPage.set(1);
        this.emitState({ pendingOnly: false, page: 1 });
        break;
      case 'saveFilterRequested':
        if (ro) return;
        this.dtCustomSavedFilter.set(true);
        this.emitState({ customSavedFilter: true });
        break;
      case 'bulkActionRequested':
        if (ro) return;
        this.dtSelectedIds.set([]);
        this.emitState({ selectedIds: [], selectedRowCount: 0 });
        break;
      case 'pageChanged':
        this.dtPage.set(ev.page);
        this.emitState({ page: ev.page });
        break;
      case 'pageSizeChanged':
        this.dtPageSize.set(ev.pageSize);
        this.dtPage.set(1);
        this.emitState({ pageSize: ev.pageSize, page: 1 });
        break;
      case 'retryRequested':
        this.dtLoading.set(false);
        this.dtError.set('');
        this.emitState({ loading: false, error: '' });
        break;
      case 'exportRequested':
      case 'rowActivated':
        break;
    }
  }

  // ---- L3 Workstation Containers ----
  readonly swPreset = signal<EmrSplitWorkspacePreset>('3-pane');
  readonly swPane1Pct = signal(25);
  readonly swPane2Pct = signal(50);
  readonly swPane3Pct = signal(25);
  readonly swPane1Collapsed = signal(false);
  readonly swPane2Collapsed = signal(false);
  readonly swPane3Collapsed = signal(false);
  readonly swMobileActivePaneId = signal('pane-note');
  readonly swReadOnly = signal(false);

  private readonly swPanes: readonly EmrSplitWorkspacePane[] = [
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

  splitWorkspaceModel(): EmrSplitWorkspaceViewModel {
    const preset = this.swPreset();
    const visibleCount = preset === '3-pane' ? 3 : 2;
    const fallback = resolveSplitWorkspacePresetSizes(preset, visibleCount);
    const raw =
      visibleCount === 3
        ? [this.swPane1Pct(), this.swPane2Pct(), this.swPane3Pct()]
        : [this.swPane1Pct(), this.swPane2Pct()];
    const sum = raw.reduce((acc, v) => acc + v, 0);
    const collapsedById: Readonly<Record<string, boolean>> = {
      'pane-chart': this.swPane1Collapsed(),
      'pane-note': this.swPane2Collapsed(),
      'pane-cds': this.swPane3Collapsed(),
    };
    return {
      id: 'ws-encounter-retina',
      title: 'Vitreoretinal Encounter Split Workstation',
      preset,
      paneSizes: sum === 100 ? raw : fallback,
      mobileActivePaneId: this.swMobileActivePaneId(),
      panes: this.swPanes.map((pane) => ({
        ...pane,
        collapsed: Boolean(collapsedById[pane.id]),
      })),
      readOnly: this.readOnly() || this.swReadOnly(),
    };
  }

  onSplitWorkspaceIntent(ev: EmrSplitWorkspaceIntent): void {
    const ro = this.readOnly() || this.swReadOnly();
    switch (ev.type) {
      case 'presetChanged':
        if (ro) return;
        this.swPreset.set(ev.preset);
        this.swPane1Pct.set(ev.paneSizes[0] ?? 50);
        this.swPane2Pct.set(ev.paneSizes[1] ?? 50);
        if (ev.paneSizes[2] !== undefined) this.swPane3Pct.set(ev.paneSizes[2]);
        this.emitState({
          preset: ev.preset,
          pane1Pct: this.swPane1Pct(),
          pane2Pct: this.swPane2Pct(),
          pane3Pct: this.swPane3Pct(),
        });
        break;
      case 'paneResized':
        if (ro) return;
        this.swPane1Pct.set(ev.paneSizes[0] ?? this.swPane1Pct());
        this.swPane2Pct.set(ev.paneSizes[1] ?? this.swPane2Pct());
        if (ev.paneSizes[2] !== undefined) this.swPane3Pct.set(ev.paneSizes[2]);
        this.emitState({
          pane1Pct: this.swPane1Pct(),
          pane2Pct: this.swPane2Pct(),
          pane3Pct: this.swPane3Pct(),
        });
        break;
      case 'paneCollapsedToggled':
        if (ro) return;
        if (ev.paneId === 'pane-chart') this.swPane1Collapsed.set(ev.collapsed);
        else if (ev.paneId === 'pane-note') this.swPane2Collapsed.set(ev.collapsed);
        else if (ev.paneId === 'pane-cds') this.swPane3Collapsed.set(ev.collapsed);
        this.emitState({
          pane1Collapsed: this.swPane1Collapsed(),
          pane2Collapsed: this.swPane2Collapsed(),
          pane3Collapsed: this.swPane3Collapsed(),
        });
        break;
      case 'mobilePaneSelected':
        this.swMobileActivePaneId.set(ev.paneId);
        this.emitState({ mobileActivePaneId: ev.paneId });
        break;
    }
  }

  readonly cpPresentation = signal<EmrCommandPalettePresentation>('inline');
  readonly cpOpen = signal(true);
  readonly cpQuery = signal('');
  readonly cpActiveCategory = signal<EmrCommandCategory>('all');
  readonly cpActiveIndex = signal(0);
  readonly cpLastCommandId = signal('');
  readonly cpReadOnly = signal(false);

  private readonly cpItems: readonly EmrCommandItem[] = [
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

  commandPaletteModel(): EmrCommandPaletteViewModel {
    return {
      id: 'cmd-launcher',
      title: 'Clinical Workstation Command Palette (Cmd+K)',
      presentation: this.cpPresentation(),
      open: this.cpOpen(),
      query: this.cpQuery(),
      activeCategory: this.cpActiveCategory(),
      activeIndex: this.cpActiveIndex(),
      items: this.cpItems,
      readOnly: this.readOnly() || this.cpReadOnly(),
    };
  }

  onCommandPaletteIntent(ev: EmrCommandPaletteIntent): void {
    const ro = this.readOnly() || this.cpReadOnly();
    switch (ev.type) {
      case 'queryChanged':
        if (ro) return;
        this.cpQuery.set(ev.query);
        this.cpActiveIndex.set(0);
        this.emitState({ query: ev.query, activeIndex: 0 });
        break;
      case 'categoryChanged':
        if (ro) return;
        this.cpActiveCategory.set(ev.category);
        this.cpActiveIndex.set(0);
        this.emitState({ activeCategory: ev.category, activeIndex: 0 });
        break;
      case 'itemHighlighted':
        this.cpActiveIndex.set(ev.index);
        this.emitState({ activeIndex: ev.index });
        break;
      case 'commandExecuted':
        if (ro) return;
        this.cpLastCommandId.set(ev.itemId);
        this.emitState({ lastCommandId: ev.itemId });
        break;
      case 'dismissed':
        this.cpOpen.set(false);
        this.emitState({ open: false });
        break;
    }
  }

  readonly mdSearchQuery = signal('');
  readonly mdActiveFilterId = signal('all');
  readonly mdSelectedId = signal('inb-1');
  readonly mdCheckedIds = signal<string[]>(['inb-1']);
  readonly mdMobileDetailOpen = signal(false);
  readonly mdLastAction = signal('');
  readonly mdReadOnly = signal(false);

  private readonly mdItems: readonly EmrMasterDetailItem[] = [
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

  masterDetailModel(): EmrMasterDetailViewModel {
    return {
      id: 'md-inbox',
      title: 'Physician Results, Critical Alerts & Co-Sign Work Queue',
      subtitle: 'Vitreoretinal & Glaucoma Unit II · 3 items',
      searchQuery: this.mdSearchQuery(),
      activeFilterId: this.mdActiveFilterId(),
      selectedId: this.mdSelectedId(),
      checkedIds: [...this.mdCheckedIds()],
      mobileDetailOpen: this.mdMobileDetailOpen(),
      filters: [
        { id: 'all', label: 'All Items', count: 3 },
        { id: 'critical', label: 'Critical Alerts', count: 1 },
        { id: 'cosign', label: 'Co-Sign', count: 1 },
      ],
      batchActions: [{ id: 'batch-ack', label: 'Acknowledge Selected', primary: true }],
      items: this.mdItems,
      readOnly: this.readOnly() || this.mdReadOnly(),
    };
  }

  onMasterDetailIntent(ev: EmrMasterDetailIntent): void {
    const ro = this.readOnly() || this.mdReadOnly();
    switch (ev.type) {
      case 'searchChanged':
        if (ro) return;
        this.mdSearchQuery.set(ev.query);
        this.emitState({ searchQuery: ev.query });
        break;
      case 'filterChanged':
        if (ro) return;
        this.mdActiveFilterId.set(ev.filterId);
        this.emitState({ activeFilterId: ev.filterId });
        break;
      case 'itemSelected':
        this.mdSelectedId.set(ev.itemId);
        this.mdMobileDetailOpen.set(true);
        this.emitState({ selectedId: ev.itemId, mobileDetailOpen: true });
        break;
      case 'detailClosed':
        this.mdMobileDetailOpen.set(false);
        this.emitState({ mobileDetailOpen: false });
        break;
      case 'batchSelectionToggled':
        if (ro) return;
        this.mdCheckedIds.set([...ev.checkedIds]);
        this.emitState({ checkedIds: [...ev.checkedIds], checkedCount: ev.checkedIds.length });
        break;
      case 'actionTriggered':
        if (ro) return;
        this.mdLastAction.set(`${ev.actionId}:${ev.itemIds.length}`);
        this.emitState({ lastAction: this.mdLastAction() });
        break;
    }
  }

  readonly stgResolution = signal<EmrTimeGridResolution>('1h');
  readonly stgScrollOffset = signal(0);
  readonly stgVisibleColumnCount = signal(4);
  readonly stgSelectedColumnId = signal('c10');
  readonly stgSelectedCellKey = signal('');
  readonly stgVitalsCollapsed = signal(false);
  readonly stgTrendCollapsed = signal(false);
  readonly stgMedsCollapsed = signal(false);
  readonly stgReadOnly = signal(false);

  private readonly stgColumns: readonly EmrTimeGridColumn[] = [
    { id: 'c08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'AM' },
    { id: 'c09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', shiftBadge: 'AM' },
    { id: 'c10', timestamp: '2026-11-12T10:00:00Z', label: '10:00', shiftBadge: 'AM', isCurrentTime: true },
    { id: 'c11', timestamp: '2026-11-12T11:00:00Z', label: '11:00', shiftBadge: 'AM' },
    { id: 'c12', timestamp: '2026-11-12T12:00:00Z', label: '12:00', shiftBadge: 'PM' },
    { id: 'c13', timestamp: '2026-11-12T13:00:00Z', label: '13:00', shiftBadge: 'PM' },
  ];

  private readonly stgTracks: readonly EmrTimeGridTrack[] = [
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

  synchronizedTimeGridModel(): EmrSynchronizedTimeGridViewModel {
    const key = this.stgSelectedCellKey();
    const parts = key ? key.split(':') : [];
    const selectedCell =
      parts.length === 3
        ? { trackId: parts[0]!, rowId: parts[1]!, columnId: parts[2]! }
        : undefined;
    const scrollOffset = clampTimeGridScrollOffset(
      this.stgScrollOffset(),
      this.stgColumns.length,
      this.stgVisibleColumnCount(),
    );
    return {
      id: 'stg-icu-ophth',
      title: 'Synchronized Longitudinal Time Grid (Vitals, IOP Trend & eMAR)',
      subtitle: 'Ophthalmic High-Dependency Ward',
      resolution: this.stgResolution(),
      availableResolutions: ['15m', '1h', '4h', '24h'],
      scrollOffset,
      visibleColumnCount: this.stgVisibleColumnCount(),
      selectedColumnId: this.stgSelectedColumnId(),
      selectedCell,
      columns: this.stgColumns,
      tracks: this.stgTracks.map((trk) => ({
        ...trk,
        collapsed:
          trk.id === 'trk-vitals'
            ? this.stgVitalsCollapsed()
            : trk.id === 'trk-trend'
              ? this.stgTrendCollapsed()
              : this.stgMedsCollapsed(),
      })),
      readOnly: this.readOnly() || this.stgReadOnly(),
    };
  }

  onSynchronizedTimeGridIntent(ev: EmrSynchronizedTimeGridIntent): void {
    const ro = this.readOnly() || this.stgReadOnly();
    switch (ev.type) {
      case 'resolutionChanged':
        if (ro) return;
        this.stgResolution.set(ev.resolution);
        this.emitState({ resolution: ev.resolution });
        break;
      case 'scrollOffsetChanged':
        if (ro) return;
        this.stgScrollOffset.set(
          clampTimeGridScrollOffset(ev.offset, this.stgColumns.length, this.stgVisibleColumnCount()),
        );
        this.emitState({ scrollOffset: this.stgScrollOffset() });
        break;
      case 'columnSelected':
        this.stgSelectedColumnId.set(ev.columnId);
        this.emitState({ selectedColumnId: ev.columnId });
        break;
      case 'trackToggled':
        if (ev.trackId === 'trk-vitals') this.stgVitalsCollapsed.set(ev.collapsed);
        else if (ev.trackId === 'trk-trend') this.stgTrendCollapsed.set(ev.collapsed);
        else if (ev.trackId === 'trk-meds') this.stgMedsCollapsed.set(ev.collapsed);
        this.emitState({
          vitalsCollapsed: this.stgVitalsCollapsed(),
          trendCollapsed: this.stgTrendCollapsed(),
          medsCollapsed: this.stgMedsCollapsed(),
        });
        break;
      case 'cellSelected':
        this.stgSelectedColumnId.set(ev.columnId);
        this.stgSelectedCellKey.set(`${ev.trackId}:${ev.rowId}:${ev.columnId}`);
        this.emitState({
          selectedColumnId: ev.columnId,
          selectedCellKey: this.stgSelectedCellKey(),
        });
        break;
    }
  }
  readonly customCellOs = signal(0);
  readonly customCellRemark = signal('4-mirror Posner goniolens');
  readonly customCellReadOnly = signal(false);

  customCellMatrixModel(): ClinicalMatrixValues {
    return {
      gonioscopy: {
        remark: this.customCellRemark(),
        cells: {
          od: { value: this.customCellOd() },
          os: { value: this.customCellOs() },
        },
      },
    };
  }

  onCustomCellMatrixIntent(ev: ClinicalMatrixIntent): void {
    if (ev.type === 'customCellIntent') {
      if (ev.columnId === 'od') this.customCellOd.update((n) => n + 1);
      else this.customCellOs.update((n) => n + 1);
      this.emitState({
        od: this.customCellOd(),
        os: this.customCellOs(),
        remark: this.customCellRemark(),
        readOnly: this.customCellReadOnly(),
      });
    } else if (ev.type === 'remarkEditRequested') {
      this.customCellRemark.set(ev.remark);
      this.emitState({
        od: this.customCellOd(),
        os: this.customCellOs(),
        remark: ev.remark,
        readOnly: this.customCellReadOnly(),
      });
    }
  }

  // ---- L6 Authoring Batch 1 ----------------------------------------------------

  private readonly l6Sources: readonly TerminologySource[] = [
    { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true, supportsPagination: true, versionLabel: '2.78' },
    { id: 'snomed', kind: 'snomed-ct', label: 'SNOMED CT', available: true, supportsPagination: true, versionLabel: '2025-01' },
    { id: 'icd10', kind: 'icd-10', label: 'ICD-10-CM', available: true, supportsPagination: true, versionLabel: '2025' },
    { id: 'ucum', kind: 'ucum', label: 'UCUM', available: true, versionLabel: '2.2' },
  ];

  private readonly l6LoincIop: TerminologyConcept = {
    sourceId: 'loinc',
    system: 'http://loinc.org',
    code: '56844-4',
    display: 'Intraocular pressure of Eye',
    version: '2.78',
    active: true,
  };

  private readonly l6LoincWeight: TerminologyConcept = {
    sourceId: 'loinc',
    system: 'http://loinc.org',
    code: '29463-7',
    display: 'Body weight',
    version: '2.78',
    active: true,
  };

  private readonly l6IcdGlaucoma: TerminologyConcept = {
    sourceId: 'icd10',
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    code: 'H40.1112',
    display: 'Primary open-angle glaucoma, right eye, moderate stage',
    version: '2025',
    active: true,
  };

  private readonly l6UcumMmhg: TerminologyConcept = {
    sourceId: 'ucum',
    system: 'http://unitsofmeasure.org',
    code: 'mm[Hg]',
    display: 'millimeter of mercury',
    version: '2.2',
    active: true,
  };

  private readonly l6Concepts: readonly TerminologyConcept[] = [
    this.l6LoincIop,
    this.l6LoincWeight,
    this.l6IcdGlaucoma,
    this.l6UcumMmhg,
  ];

  private readonly l6LibFields: readonly EmrGeneratedFieldDefinition[] = [
    {
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
    },
    {
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
      terminologyBindings: [
        { id: 'b-iop', role: 'question-meaning', concept: this.l6LoincIop, strength: 'preferred' },
      ],
    },
    {
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
    },
  ];

  private readonly l6InitialTemplate: EhrTemplateDefinition = {
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
        fields: [
          {
            id: 'chief-complaints',
            sourceFieldId: 'chief-complaints',
            sourceFieldRevision: 1,
            field: this.l6LibFields[0],
          },
        ],
      },
      {
        id: 'tonometry',
        label: 'Tonometry & Optic Disc',
        description: 'Core glaucoma screening parameters.',
        fields: [
          {
            id: 'iop-gat',
            sourceFieldId: 'iop-gat',
            sourceFieldRevision: 1,
            field: this.l6LibFields[1],
          },
          {
            id: 'cup-disc-ratio',
            sourceFieldId: 'cup-disc-ratio',
            sourceFieldRevision: 1,
            field: this.l6LibFields[2],
          },
        ],
      },
    ],
  };

  private createInitialFgModel(): FieldGeneratorViewModel {
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
          { id: 'b-loinc', role: 'question-meaning', concept: this.l6LoincIop, strength: 'preferred' },
          { id: 'b-ucum', role: 'unit', concept: this.l6UcumMmhg, strength: 'required' },
        ],
      },
      sources: this.l6Sources,
      terminologySearches: {},
      validationErrors: {},
      saving: false,
      dirty: false,
    };
  }

  readonly fgModel = signal<FieldGeneratorViewModel>(this.createInitialFgModel());
  readonly fgReadOnly = signal(false);

  fgEffectiveModel(): FieldGeneratorViewModel {
    const m = this.fgModel();
    return { ...m, readOnly: Boolean(m.readOnly) || this.fgReadOnly() || this.readOnly() };
  }

  onFieldGeneratorIntent(ev: FieldGeneratorIntent): void {
    const prev = this.fgModel();
    let next = prev;
    if (ev.type === 'draftPatched') {
      next = { ...prev, draft: { ...prev.draft, ...ev.changes }, dirty: true };
    } else if (ev.type === 'validationRuleAdded') {
      next = {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          validationRules: [
            ...prev.draft.validationRules,
            { ...ev.rule, id: `r-${prev.draft.validationRules.length + 1}` },
          ],
        },
      };
    } else if (ev.type === 'validationRuleRemoved') {
      next = {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          validationRules: prev.draft.validationRules.filter((r) => r.id !== ev.ruleId),
        },
      };
    } else if (ev.type === 'terminologySearchOpened' || ev.type === 'terminologyRetryRequested') {
      const role = ev.role;
      const existing = prev.terminologySearches[role];
      const sourceId = ('sourceId' in ev && ev.sourceId) || existing?.sourceId || 'loinc';
      const opts = this.l6Concepts.filter((c) => c.sourceId === sourceId || sourceId === 'snomed');
      next = {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [role]: {
            sourceId,
            role,
            query: existing?.query ?? '',
            options: opts,
            page: 1,
            pageSize: 10,
            total: opts.length,
            loading: false,
          },
        },
      };
    } else if (ev.type === 'terminologyQueryChanged') {
      const existing = prev.terminologySearches[ev.role] ?? {
        sourceId: 'loinc',
        role: ev.role,
        query: '',
        options: [],
        page: 1,
        pageSize: 10,
        total: 0,
        loading: false,
      };
      next = {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [ev.role]: {
            ...existing,
            query: ev.query,
          },
        },
      };
    } else if (ev.type === 'terminologySearchRequested') {
      const existing = prev.terminologySearches[ev.role];
      const q = (existing?.query ?? '').trim().toLowerCase();
      const opts = this.l6Concepts.filter(
        (c) => !q || c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      );
      next = {
        ...prev,
        terminologySearches: {
          ...prev.terminologySearches,
          [ev.role]: {
            sourceId: existing?.sourceId ?? 'loinc',
            role: ev.role,
            query: existing?.query ?? '',
            options: opts,
            page: 1,
            pageSize: 10,
            total: opts.length,
            loading: false,
          },
        },
      };
    } else if (ev.type === 'terminologyPageChanged') {
      const existing = prev.terminologySearches[ev.role];
      if (existing) {
        next = {
          ...prev,
          terminologySearches: {
            ...prev.terminologySearches,
            [ev.role]: { ...existing, page: ev.page },
          },
        };
      }
    } else if (ev.type === 'terminologyConceptSelected') {
      const id = `b-${ev.concept.sourceId}-${ev.concept.code}`;
      const filtered = prev.draft.terminologyBindings.filter((b) => b.id !== id);
      next = {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          terminologyBindings: [
            ...filtered,
            { id, role: ev.role, concept: ev.concept, strength: ev.strength ?? 'preferred' },
          ],
        },
      };
    } else if (ev.type === 'terminologyBindingRemoved') {
      next = {
        ...prev,
        dirty: true,
        draft: {
          ...prev.draft,
          terminologyBindings: prev.draft.terminologyBindings.filter((b) => b.id !== ev.bindingId),
        },
      };
    } else if (ev.type === 'saveRequested') {
      next = { ...prev, dirty: false, savedFieldId: prev.draft.id };
    } else if (ev.type === 'resetRequested') {
      next = this.createInitialFgModel();
    }
    this.fgModel.set(next);
    this.emitState({
      draft: next.draft,
      type: next.draft.type,
      terminologySearches: next.terminologySearches,
      dirty: next.dirty,
      savedFieldId: next.savedFieldId,
    });
  }

  readonly tsModel = signal<TerminologySearchViewModel>({
    role: 'question-meaning',
    sources: this.l6Sources,
    search: {
      sourceId: 'loinc',
      role: 'question-meaning',
      query: 'pressure',
      options: [this.l6LoincIop, this.l6LoincWeight],
      page: 1,
      pageSize: 10,
      total: 2,
      loading: false,
    },
    bindings: [
      { id: 'b-loinc-iop', role: 'question-meaning', concept: this.l6LoincIop, strength: 'preferred' },
    ],
  });
  readonly l6TsReadOnly = signal(false);

  tsEffectiveModel(): TerminologySearchViewModel {
    const m = this.tsModel();
    return { ...m, readOnly: Boolean(m.readOnly) || this.l6TsReadOnly() || this.readOnly() };
  }

  onTerminologySearchIntent(ev: TerminologySearchIntent): void {
    const prev = this.tsModel();
    let next = prev;
    if (ev.type === 'terminologySearchOpened' || ev.type === 'terminologyRetryRequested') {
      const sourceId = ('sourceId' in ev && ev.sourceId) || prev.search?.sourceId || 'loinc';
      const opts = this.l6Concepts.filter((c) => c.sourceId === sourceId || sourceId === 'snomed');
      next = {
        ...prev,
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
    } else if (ev.type === 'terminologyQueryChanged' && prev.search) {
      next = {
        ...prev,
        search: {
          ...prev.search,
          query: ev.query,
        },
      };
    } else if (ev.type === 'terminologySearchRequested' && prev.search) {
      const q = prev.search.query.trim().toLowerCase();
      const opts = this.l6Concepts.filter(
        (c) => !q || c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      );
      next = {
        ...prev,
        search: { ...prev.search, options: opts, page: 1, total: opts.length, loading: false },
      };
    } else if (ev.type === 'terminologyPageChanged' && prev.search) {
      next = { ...prev, search: { ...prev.search, page: ev.page } };
    } else if (ev.type === 'terminologyConceptSelected') {
      const id = `b-${ev.concept.sourceId}-${ev.concept.code}`;
      next = {
        ...prev,
        bindings: [
          ...prev.bindings.filter((b) => b.id !== id),
          { id, role: ev.role, concept: ev.concept, strength: ev.strength ?? 'preferred' },
        ],
      };
    } else if (ev.type === 'terminologyBindingRemoved') {
      next = { ...prev, bindings: prev.bindings.filter((b) => b.id !== ev.bindingId) };
    }
    this.tsModel.set(next);
    this.emitState({
      role: next.role,
      search: next.search,
      bindings: next.bindings,
      sourceId: next.search?.sourceId ?? 'loinc',
      loading: next.search?.loading ?? false,
      error: next.search?.error ?? '',
    });
  }

  readonly vreRules = signal<readonly FieldValidationRule[]>([
    { id: 'r-min', kind: 'minimum', value: 5, message: 'Hypotony alert below 5 mmHg.' },
    { id: 'r-max', kind: 'maximum', value: 21, message: 'Elevated IOP above 21 mmHg.' },
  ]);
  readonly vreReadOnly = signal(false);

  vreEffectiveModel(): ValidationRuleEditorViewModel {
    return { rules: this.vreRules(), readOnly: this.vreReadOnly() || this.readOnly() };
  }

  onValidationRuleEditorIntent(ev: ValidationRuleEditorIntent): void {
    const prev = this.vreRules();
    const next =
      ev.type === 'validationRuleAdded'
        ? [...prev, { ...ev.rule, id: `r-${prev.length + 1}` }]
        : prev.filter((r) => r.id !== ev.ruleId);
    this.vreRules.set(next);
    this.emitState({ rules: next });
  }

  readonly flpQuery = signal('');
  readonly flpSelectedSectionId = signal('tonometry');
  readonly flpReadOnly = signal(false);

  flpEffectiveModel(): FieldLibraryPickerViewModel {
    const q = this.flpQuery().trim().toLowerCase();
    const fields = this.l6LibFields.filter(
      (f) => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q),
    );
    return {
      fields,
      query: this.flpQuery(),
      selectedSectionId: this.flpSelectedSectionId(),
      readOnly: this.flpReadOnly() || this.readOnly(),
    };
  }

  onFieldLibraryPickerIntent(ev: FieldLibraryPickerIntent): void {
    if (ev.type === 'fieldLibraryQueryChanged') {
      this.flpQuery.set(ev.query);
      this.emitState({ query: ev.query });
    } else if (ev.type === 'fieldAdded') {
      this.emitState({ selectedSectionId: ev.sectionId, lastAddedFieldId: ev.field.id });
    }
  }

  private createInitialEhrTemplateModel(): EhrTemplateViewModel {
    return {
      template: this.l6InitialTemplate,
      fieldLibrary: this.l6LibFields,
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      preview: derivePreview(this.l6InitialTemplate),
      loading: false,
      saving: false,
      dirty: false,
    };
  }

  private readonly l6StagedImports = new Map<string, EhrTemplateDefinition>();

  private reduceEhrTemplateModel(
    model: EhrTemplateViewModel,
    intent: EhrTemplateIntent,
  ): EhrTemplateViewModel {
    const withTemplate = (template: EhrTemplateDefinition): EhrTemplateViewModel => ({
      ...model,
      template,
      preview: derivePreview(template),
      dirty: true,
    });
    switch (intent.type) {
      case 'templatePatched':
        return withTemplate({
          ...model.template,
          ...intent.changes,
          revision: model.template.revision + 1,
        });
      case 'fieldLibraryQueryChanged': {
        const q = intent.query.trim().toLowerCase();
        return {
          ...model,
          fieldLibraryQuery: intent.query,
          fieldLibrary: this.l6LibFields.filter(
            (f) => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q),
          ),
        };
      }
      case 'sectionSelected':
        return {
          ...model,
          selectedSectionId: intent.sectionId,
          selectedPlacementId: undefined,
        };
      case 'placementSelected':
        return {
          ...model,
          selectedSectionId: intent.sectionId,
          selectedPlacementId: intent.placementId,
        };
      case 'sectionAdded': {
        const id = `sec-${model.template.sections.length + 1}`;
        return {
          ...withTemplate({
            ...model.template,
            revision: model.template.revision + 1,
            sections: [...model.template.sections, { ...intent.section, id }],
          }),
          selectedSectionId: id,
          selectedPlacementId: undefined,
        };
      }
      case 'sectionPatched':
        return withTemplate({
          ...model.template,
          revision: model.template.revision + 1,
          sections: model.template.sections.map((s) =>
            s.id === intent.sectionId ? { ...s, ...intent.changes } : s,
          ),
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
          ...withTemplate({ ...model.template, revision: model.template.revision + 1, sections }),
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
                    {
                      id: `${intent.field.id}-${s.fields.length + 1}`,
                      sourceFieldId: intent.field.id,
                      sourceFieldRevision: intent.field.revision,
                      field: intent.field,
                    },
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
              s.id === intent.sectionId
                ? { ...s, fields: s.fields.filter((f) => f.id !== intent.placementId) }
                : s,
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
            this.l6StagedImports.set(model.template.id, {
              ...model.template,
              ...parsed,
              schemaVersion: '1.0',
              id: parsed.id ?? model.template.id,
              revision: model.template.revision + 1,
              sections: parsed.sections,
            });
            return {
              ...model,
              canAcceptImport: true,
              importIssues: [],
            };
          }
          this.l6StagedImports.delete(model.template.id);
          return {
            ...model,
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
          this.l6StagedImports.delete(model.template.id);
          return {
            ...model,
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
      case 'importAccepted': {
        const staged = this.l6StagedImports.get(model.template.id);
        if (!staged) return model;
        this.l6StagedImports.delete(model.template.id);
        return {
          ...withTemplate(staged),
          canAcceptImport: false,
          importIssues: [],
          selectedSectionId: staged.sections[0]?.id,
          selectedPlacementId: undefined,
        };
      }
      case 'saveRequested':
        return { ...model, dirty: false };
      default:
        return model;
    }
  }

  readonly tcModel = signal<EhrTemplateViewModel>(this.createInitialEhrTemplateModel());
  readonly tcReadOnly = signal(false);

  tcEffectiveModel(): EhrTemplateViewModel {
    const m = this.tcModel();
    return { ...m, readOnly: Boolean(m.readOnly) || this.tcReadOnly() || this.readOnly() };
  }

  onTemplateComposerIntent(ev: EhrTemplateIntent): void {
    const next = this.reduceEhrTemplateModel(this.tcModel(), ev);
    this.tcModel.set(next);
    this.emitState({
      template: next.template,
      fieldLibrary: next.fieldLibrary,
      fieldLibraryQuery: next.fieldLibraryQuery,
      selectedSectionId: next.selectedSectionId,
      selectedPlacementId: next.selectedPlacementId,
      preview: next.preview,
      dirty: next.dirty,
      status: next.template.status,
      artifact: next.artifact,
      canAcceptImport: next.canAcceptImport,
      importIssues: next.importIssues,
    });
  }

  readonly tpModel = signal<EhrTemplateViewModel>(this.createInitialEhrTemplateModel());
  readonly l6TpReadOnly = signal(false);

  tpEffectiveModel(): TemplatePreviewViewModel {
    const m = this.tpModel();
    return { ...m, readOnly: Boolean(m.readOnly) || this.l6TpReadOnly() || this.readOnly() };
  }

  onTemplatePreviewIntent(ev: TemplatePreviewIntent): void {
    const next = this.reduceEhrTemplateModel(this.tpModel(), ev);
    this.tpModel.set(next);
    this.emitState({
      template: next.template,
      preview: next.preview,
      artifact: next.artifact,
      canAcceptImport: next.canAcceptImport,
      importIssues: next.importIssues,
      status: next.template.status,
      dirty: next.dirty,
    });
  }

  private readonly onMessage = (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      selector?: string;
      theme?: string;
      readOnly?: boolean;
      state?: Record<string, unknown>;
    } | null;
    if (!data || data.type !== 'emr-preview') return;
    if (typeof data.selector === 'string' && data.selector) {
      this.selector.set(data.selector);
    }
    if (data.theme === 'dark' || data.theme === 'light') {
      this.applyTheme(data.theme);
    }
    if (typeof data.readOnly === 'boolean') {
      this.readOnly.set(data.readOnly);
    }
    if (data.state && typeof data.state === 'object') {
      this.applyIncomingState(data.selector ?? this.selector(), data.state);
    }
  };

  onButtonClick(): void {
    const next = this.buttonClicks() + 1;
    this.buttonClicks.set(next);
    this.emitState({ count: next });
  }

  cycleButtonVariant(): void {
    const order: readonly ('primary' | 'secondary' | 'outline' | 'ghost' | 'danger')[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
    ];
    const idx = order.indexOf(this.buttonVariant());
    const next = order[(idx + 1) % order.length];
    this.buttonVariant.set(next);
    this.emitState({ variant: next });
  }

  emitState(patch: Record<string, unknown>): void {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'emr-preview-state', selector: this.selector(), state: patch }, '*');
    }
  }

  private applyIncomingState(sel: string, s: Record<string, unknown>): void {
    if (sel === 'emr-button') {
      if (typeof s['count'] === 'number') this.buttonClicks.set(s['count']);
      if (typeof s['variant'] === 'string') {
        this.buttonVariant.set(s['variant'] as 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger');
      }
      if (typeof s['size'] === 'string') {
        const map: Record<string, 'small' | 'medium' | 'large'> = { sm: 'small', md: 'medium', lg: 'large' };
        this.buttonSize.set(map[s['size']] ?? 'medium');
      }
      if (typeof s['disabled'] === 'boolean') this.buttonDisabled.set(s['disabled']);
      if (typeof s['loading'] === 'boolean') this.buttonLoading.set(s['loading']);
      if (typeof s['block'] === 'boolean') this.buttonBlock.set(s['block']);
    } else if (sel === 'emr-radio-group') {
      if ('value' in s) this.radioVal.set((s['value'] as string | null) ?? null);
      if (s['orientation'] === 'vertical' || s['orientation'] === 'horizontal' || s['orientation'] === 'grid') {
        this.radioOrientation.set(s['orientation']);
      }
      if (typeof s['columns'] === 'number') this.radioColumns.set(s['columns']);
      if (
        s['variant'] === 'tile' ||
        s['variant'] === 'inline' ||
        s['variant'] === 'card' ||
        s['variant'] === 'pill' ||
        s['variant'] === 'segmented'
      ) {
        this.radioVariant.set(s['variant']);
      } else if (s['variant'] === 'standard') {
        this.radioVariant.set('tile');
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.radioSize.set(s['size']);
      if (s['labelPlacement'] === 'end' || s['labelPlacement'] === 'start' || s['labelPlacement'] === 'space-between') {
        this.radioLabelPlacement.set(s['labelPlacement']);
      }
      if (typeof s['clearable'] === 'boolean') this.radioClearable.set(s['clearable']);
      if (typeof s['allowDeselect'] === 'boolean') this.radioAllowDeselect.set(s['allowDeselect']);
      if (typeof s['readOnly'] === 'boolean') this.radioReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.radioDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.radioRequired.set(s['required']);
      if (typeof s['invalid'] === 'boolean') this.radioInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.radioLabelHidden.set(s['labelHidden']);
      if (typeof s['hint'] === 'string') this.radioHint.set(s['hint']);
      if (typeof s['warning'] === 'string') this.radioWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.radioError.set(s['error']);
    } else if (sel === 'emr-checkbox-group') {
      if (Array.isArray(s['value'])) this.cbgVal.set(s['value'] as readonly string[]);
      if (s['orientation'] === 'vertical' || s['orientation'] === 'horizontal' || s['orientation'] === 'grid') {
        this.cbgOrientation.set(s['orientation']);
      }
      if (s['variant'] === 'tile' || s['variant'] === 'inline' || s['variant'] === 'card' || s['variant'] === 'chip') {
        this.cbgVariant.set(s['variant']);
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.cbgSize.set(s['size']);
      if (s['labelPlacement'] === 'end' || s['labelPlacement'] === 'start' || s['labelPlacement'] === 'space-between') {
        this.cbgLabelPlacement.set(s['labelPlacement']);
      }
      if (typeof s['showSelectAll'] === 'boolean') this.cbgShowSelectAll.set(s['showSelectAll']);
      if (typeof s['showSelectionCount'] === 'boolean') this.cbgShowSelectionCount.set(s['showSelectionCount']);
      if (typeof s['clearable'] === 'boolean') this.cbgClearable.set(s['clearable']);
      if (typeof s['columns'] === 'number') this.cbgColumns.set(s['columns']);
      if (typeof s['minSelections'] === 'number' || s['minSelections'] === undefined) {
        this.cbgMinSelections.set(s['minSelections'] as number | undefined);
      }
      if (typeof s['maxSelections'] === 'number' || s['maxSelections'] === undefined) {
        this.cbgMaxSelections.set(s['maxSelections'] as number | undefined);
      }
      if (typeof s['disabled'] === 'boolean') this.cbgDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.cbgRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.cbgReadOnly.set(s['readOnly']);
      if (typeof s['invalid'] === 'boolean') this.cbgInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.cbgLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.cbgWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.cbgError.set(s['error']);
    } else if (sel === 'emr-toggle-group') {
      if (Array.isArray(s['values'])) this.tgValues.set(s['values'] as readonly string[]);
      else if (Array.isArray(s['value'])) this.tgValues.set(s['value'] as readonly string[]);
      if (typeof s['multiple'] === 'boolean') this.tgMultiple.set(s['multiple']);
      if (typeof s['allowEmpty'] === 'boolean') this.tgAllowEmpty.set(s['allowEmpty']);
      if (s['variant'] === 'tile' || s['variant'] === 'inline' || s['variant'] === 'card') {
        this.tgVariant.set(s['variant']);
      } else if (s['variant'] === 'standard') {
        this.tgVariant.set('tile');
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.tgSize.set(s['size']);
      if (s['orientation'] === 'vertical' || s['orientation'] === 'horizontal' || s['orientation'] === 'grid') {
        this.tgOrientation.set(s['orientation']);
      }
      if (typeof s['columns'] === 'number') this.tgColumns.set(s['columns']);
      if (s['labelPlacement'] === 'end' || s['labelPlacement'] === 'start' || s['labelPlacement'] === 'space-between') {
        this.tgLabelPlacement.set(s['labelPlacement']);
      }
      if (typeof s['showStateLabels'] === 'boolean') this.tgShowStateLabels.set(s['showStateLabels']);
      if (typeof s['showSelectAll'] === 'boolean') this.tgShowSelectAll.set(s['showSelectAll']);
      if (typeof s['showSelectionCount'] === 'boolean') this.tgShowSelectionCount.set(s['showSelectionCount']);
      if (typeof s['clearable'] === 'boolean') this.tgClearable.set(s['clearable']);
      if (typeof s['maxSelections'] === 'number' || s['maxSelections'] === undefined) {
        this.tgMaxSelections.set(s['maxSelections'] as number | undefined);
      }
      if (typeof s['required'] === 'boolean') this.tgRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.tgReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.tgDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.tgInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.tgLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.tgWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.tgError.set(s['error']);
    } else if (sel === 'emr-tree-view') {
      if ('value' in s) this.tvValue.set((s['value'] as string | null) ?? null);
      if (Array.isArray(s['values'])) this.tvValues.set(s['values'] as readonly string[]);
      if (Array.isArray(s['expandedIds'])) this.tvExpandedIds.set(s['expandedIds'] as readonly string[]);
      if (typeof s['multiple'] === 'boolean') this.tvMultiple.set(s['multiple']);
      if (s['checkStrategy'] === 'cascade' || s['checkStrategy'] === 'all' || s['checkStrategy'] === 'leaf') {
        this.tvCheckStrategy.set(s['checkStrategy']);
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.tvSize.set(s['size']);
      if (typeof s['searchable'] === 'boolean') this.tvSearchable.set(s['searchable']);
      if (typeof s['showExpandControls'] === 'boolean') this.tvShowExpandControls.set(s['showExpandControls']);
      if (typeof s['clearable'] === 'boolean') this.tvClearable.set(s['clearable']);
      if (typeof s['maxSelections'] === 'number' || s['maxSelections'] === undefined) {
        this.tvMaxSelections.set(s['maxSelections'] as number | undefined);
      }
      if (typeof s['required'] === 'boolean') this.tvRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.tvReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.tvDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.tvInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.tvLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.tvWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.tvError.set(s['error']);
    } else if (sel === 'emr-tree-select') {
      if ('value' in s) this.tsValue.set((s['value'] as string | null) ?? null);
      if (Array.isArray(s['values'])) this.tsValues.set(s['values'] as readonly string[]);
      if (typeof s['multiple'] === 'boolean') this.tsMultiple.set(s['multiple']);
      if (s['checkStrategy'] === 'cascade' || s['checkStrategy'] === 'all' || s['checkStrategy'] === 'leaf') {
        this.tsCheckStrategy.set(s['checkStrategy']);
      }
      if (s['displayMode'] === 'path' || s['displayMode'] === 'leaf') {
        this.tsDisplayMode.set(s['displayMode']);
      }
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.tsVariant.set(s['variant']);
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.tsSize.set(s['size']);
      if (typeof s['searchable'] === 'boolean') this.tsSearchable.set(s['searchable']);
      if (typeof s['showExpandControls'] === 'boolean') this.tsShowExpandControls.set(s['showExpandControls']);
      if (typeof s['clearable'] === 'boolean') this.tsClearable.set(s['clearable']);
      if (typeof s['maxTagCount'] === 'number' || s['maxTagCount'] === undefined) {
        this.tsMaxTagCount.set(s['maxTagCount'] as number | undefined);
      }
      if (typeof s['maxSelections'] === 'number' || s['maxSelections'] === undefined) {
        this.tsMaxSelections.set(s['maxSelections'] as number | undefined);
      }
      if (typeof s['loading'] === 'boolean') this.tsLoading.set(s['loading']);
      if (typeof s['required'] === 'boolean') this.tsRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.tsReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.tsDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.tsInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.tsLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.tsWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.tsError.set(s['error']);
    } else if (sel === 'emr-segmented-control') {
      if ('value' in s) this.segVal.set((s['value'] as string | null) ?? null);
      if (Array.isArray(s['options'])) this.segOptions.set(s['options'] as readonly EmrSegmentedOption[]);
      if (s['size'] === 'md' || s['size'] === 'sm') this.segSize.set(s['size']);
      if (s['variant'] === 'default' || s['variant'] === 'outline' || s['variant'] === 'soft') {
        this.segVariant.set(s['variant']);
      }
      if (s['shape'] === 'default' || s['shape'] === 'pill') this.segShape.set(s['shape']);
      if (s['orientation'] === 'horizontal' || s['orientation'] === 'vertical') {
        this.segOrientation.set(s['orientation']);
      }
      if (typeof s['fullWidth'] === 'boolean') this.segFullWidth.set(s['fullWidth']);
      if (typeof s['clearable'] === 'boolean') this.segClearable.set(s['clearable']);
      if (typeof s['allowDeselect'] === 'boolean') this.segAllowDeselect.set(s['allowDeselect']);
      if (typeof s['required'] === 'boolean') this.segRequired.set(s['required']);
      if (typeof s['invalid'] === 'boolean') this.segInvalid.set(s['invalid']);
      if (typeof s['readOnly'] === 'boolean') this.segReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.segDisabled.set(s['disabled']);
      if (typeof s['labelHidden'] === 'boolean') this.segLabelHidden.set(s['labelHidden']);
      if (typeof s['hint'] === 'string') this.segHint.set(s['hint']);
      if (typeof s['warning'] === 'string') this.segWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.segError.set(s['error']);
    } else if (sel === 'emr-select') {
      if ('value' in s) {
        const raw = s['value'];
        this.selectVal.set(Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' ? raw : null);
      }
      if (typeof s['multiple'] === 'boolean') this.selectMultiple.set(s['multiple']);
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.selectVariant.set(s['variant']);
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.selectSize.set(s['size']);
      if (typeof s['clearable'] === 'boolean') this.selectClearable.set(s['clearable']);
      if (typeof s['closeOnSelect'] === 'boolean') this.selectCloseOnSelect.set(s['closeOnSelect']);
      if (typeof s['maxSelections'] === 'number' || s['maxSelections'] === undefined) {
        this.selectMaxSelections.set(s['maxSelections'] as number | undefined);
      }
      if (typeof s['maxTagCount'] === 'number' || s['maxTagCount'] === undefined) {
        this.selectMaxTagCount.set(s['maxTagCount'] as number | undefined);
      }
      if (typeof s['loading'] === 'boolean') this.selectLoading.set(s['loading']);
      if (typeof s['required'] === 'boolean') this.selectRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.selectReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.selectDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.selectInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.selectLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.selectWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.selectError.set(s['error']);
    } else if (sel === 'emr-text-input' || sel === 'emr-date-input') {
      const val = typeof s['value'] === 'string' ? s['value'] : '';
      if (sel === 'emr-text-input') this.textVal.set(val);
      if (sel === 'emr-date-input') this.dateVal.set(val);
    } else if (sel === 'emr-likert') {
      if ('value' in s) this.likertVal.set((s['value'] as number | null) ?? null);
      if (s['scaleMode'] === 'numeric' || s['scaleMode'] === 'text') this.likertScaleMode.set(s['scaleMode']);
      if (typeof s['clearable'] === 'boolean') this.likertClearable.set(s['clearable']);
      if (typeof s['fullWidth'] === 'boolean') this.likertFullWidth.set(s['fullWidth']);
      if (typeof s['disabled'] === 'boolean') this.likertDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.likertRequired.set(s['required']);
    } else if (sel === 'emr-datetime-input') {
      if ('value' in s) this.dtVal.set((s['value'] as string | null) ?? null);
      if (s['displayFormat'] === 'dd-mm-yyyy' || s['displayFormat'] === 'dd/mm/yyyy' || s['displayFormat'] === 'yyyy-mm-dd' || s['displayFormat'] === 'mm/dd/yyyy') {
        this.dtDisplayFormat.set(s['displayFormat']);
      }
      if (s['timePrecision'] === 'minute' || s['timePrecision'] === 'second') this.dtTimePrecision.set(s['timePrecision']);
      if (s['hourCycle'] === '24' || s['hourCycle'] === '12') this.dtHourCycle.set(s['hourCycle']);
      if (s['wireFormat'] === 'utc' || s['wireFormat'] === 'local') this.dtWireFormat.set(s['wireFormat']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.dtSize.set(s['size']);
      if (typeof s['clearable'] === 'boolean') this.dtClearable.set(s['clearable']);
      if (typeof s['disabled'] === 'boolean') this.dtDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.dtRequired.set(s['required']);
    } else if (sel === 'emr-time-input') {
      if ('value' in s) this.timeVal.set((s['value'] as string | null) ?? null);
      if (s['precision'] === 'minute' || s['precision'] === 'second') this.timePrecision.set(s['precision']);
      if (s['hourCycle'] === '24' || s['hourCycle'] === '12') this.timeHourCycle.set(s['hourCycle']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.timeSize.set(s['size']);
      if (typeof s['clearable'] === 'boolean') this.timeClearable.set(s['clearable']);
      if (typeof s['disabled'] === 'boolean') this.timeDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.timeRequired.set(s['required']);
    } else if (sel === 'emr-vas') {
      if ('value' in s) this.vasVal.set((s['value'] as number | null) ?? null);
      if (s['precision'] === 'integer' || s['precision'] === 'decimal') this.vasPrecision.set(s['precision']);
      if (s['orientation'] === 'horizontal' || s['orientation'] === 'vertical') {
        this.vasOrientation.set(s['orientation']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.vasSize.set(s['size']);
      if (typeof s['tone'] === 'string') this.vasTone.set(s['tone'] as EmrTone);
      if (typeof s['clearable'] === 'boolean') this.vasClearable.set(s['clearable']);
      if (typeof s['disabled'] === 'boolean') this.vasDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.vasRequired.set(s['required']);
    } else if (sel === 'emr-number-input') {
      const val = typeof s['value'] === 'number' || s['value'] === null ? (s['value'] as number | null) : null;
      this.numVal.set(val);
    } else if (sel === 'emr-quantity-input') {
      if ('value' in s) this.qtyVal.set((s['value'] as number | null) ?? null);
      if ('unit' in s) this.qtyUnit.set((s['unit'] as string | null) ?? null);
      if (s['mode'] === 'decimal' || s['mode'] === 'integer') this.qtyMode.set(s['mode']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.qtySize.set(s['size']);
      if (typeof s['showSteppers'] === 'boolean') this.qtySteppers.set(s['showSteppers']);
      if (typeof s['clearable'] === 'boolean') this.qtyClearable.set(s['clearable']);
      if (typeof s['disabled'] === 'boolean') this.qtyDisabled.set(s['disabled']);
    } else if (sel === 'emr-paired-input') {
      const left = s['od'] ?? s['first'];
      const right = s['os'] ?? s['second'];
      if (left !== undefined) this.pairedLeft.set(typeof left === 'string' ? left : null);
      if (right !== undefined) this.pairedRight.set(typeof right === 'string' ? right : null);
      if (s['inputType'] === 'text' || s['inputType'] === 'integer' || s['inputType'] === 'decimal' || s['inputType'] === 'select') {
        this.pairedInputType.set(s['inputType']);
      }
    } else if (sel === 'emr-paired-field') {
      const cur = this.pairedModel();
      const nextMode =
        s['mode'] === 'text' || s['mode'] === 'decimal' || s['mode'] === 'integer' || s['mode'] === 'select'
          ? s['mode']
          : cur.mode;
      this.pairedModel.set({
        ...cur,
        value: 'value' in s ? ((s['value'] as PairedFieldViewModel['value']) ?? null) : cur.value,
        mode: nextMode,
        options: nextMode === 'select' ? this.pairedFieldLensOptions : cur.options,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        layout: s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline' ? s['layout'] : cur.layout,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        status: typeof s['status'] === 'string' ? (s['status'] as PairedFieldViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.pairedLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-textarea') {
      if ('value' in s) this.textareaVal.set(typeof s['value'] === 'string' ? s['value'] : null);
    } else if (sel === 'emr-icon-button') {
      if (typeof s['pressed'] === 'boolean') this.iconButtonPressed.set(s['pressed']);
      else if (typeof s['pinned'] === 'boolean') this.iconButtonPressed.set(s['pinned']);
    } else if (sel === 'emr-search-input') {
      if ('value' in s) this.searchVal.set(typeof s['value'] === 'string' ? s['value'] : null);
    } else if (sel === 'emr-password-input') {
      if ('value' in s) this.passwordVal.set(typeof s['value'] === 'string' ? s['value'] : null);
    } else if (sel === 'emr-numeric-stepper') {
      if ('value' in s) this.stepperVal.set(typeof s['value'] === 'number' ? s['value'] : null);
    } else if (sel === 'emr-pagination') {
      if (typeof s['page'] === 'number') this.paginationPage.set(s['page']);
      if (typeof s['pageSize'] === 'number') this.paginationSize.set(s['pageSize']);
    } else if (sel === 'emr-dialog') {
      if (typeof s['open'] === 'boolean') this.dialogOpen.set(s['open']);
    } else if (sel === 'emr-popover') {
      if (typeof s['open'] === 'boolean') this.popoverOpen.set(s['open']);
    } else if (sel === 'emr-toast') {
      if (typeof s['visible'] === 'boolean') this.toastVisible.set(s['visible']);
      if (typeof s['tone'] === 'string') {
        this.toastModel.update((cur) => ({
          ...cur,
          tone: s['tone'] as EmrTone,
        }));
      }
    } else if (sel === 'emr-checkbox') {
      if (typeof s['checked'] === 'boolean') this.checkedVal.set(s['checked']);
      if (typeof s['mixed'] === 'boolean') this.cbMixed.set(s['mixed']);
      if (s['variant'] === 'tile' || s['variant'] === 'inline') this.cbVariant.set(s['variant']);
      if (s['size'] === 'md' || s['size'] === 'sm') this.cbSize.set(s['size']);
      if (s['labelPlacement'] === 'end' || s['labelPlacement'] === 'start' || s['labelPlacement'] === 'space-between') {
        this.cbPlacement.set(s['labelPlacement']);
      }
      if (typeof s['disabled'] === 'boolean') this.cbDisabled.set(s['disabled']);
      if (typeof s['required'] === 'boolean') this.cbRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.cbReadOnly.set(s['readOnly']);
      if (typeof s['description'] === 'string') this.cbDescription.set(s['description']);
      if (typeof s['hint'] === 'string') this.cbHint.set(s['hint']);
      if (typeof s['warning'] === 'string') this.cbWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.cbError.set(s['error']);
    } else if (sel === 'emr-toggle') {
      if (typeof s['controlId'] === 'string') this.toggleControlId.set(s['controlId'] || undefined);
      if (typeof s['label'] === 'string') this.toggleLabel.set(s['label']);
      if (typeof s['description'] === 'string') this.toggleDescription.set(s['description']);
      if (typeof s['labelHidden'] === 'boolean') this.toggleLabelHidden.set(s['labelHidden']);
      if (s['labelPlacement'] === 'end' || s['labelPlacement'] === 'start' || s['labelPlacement'] === 'space-between') {
        this.togglePlacement.set(s['labelPlacement']);
      }
      if (s['variant'] === 'tile' || s['variant'] === 'inline') this.toggleVariant.set(s['variant']);
      if (s['size'] === 'md' || s['size'] === 'sm') this.toggleSize.set(s['size']);
      if (typeof s['onLabel'] === 'string') this.toggleOnLabel.set(s['onLabel']);
      if (typeof s['offLabel'] === 'string') this.toggleOffLabel.set(s['offLabel']);
      if (typeof s['ariaLabel'] === 'string') this.toggleAriaLabel.set(s['ariaLabel'] || undefined);
      if (typeof s['checked'] === 'boolean') {
        this.toggleVal.set(s['checked']);
        if (!('value' in s)) this.toggleValue.set(undefined);
      }
      if ('value' in s) this.toggleValue.set(s['value'] as boolean | null | undefined);
      if (typeof s['required'] === 'boolean') this.toggleRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.toggleReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.toggleDisabled.set(s['disabled']);
      if (typeof s['loading'] === 'boolean') this.toggleLoading.set(s['loading']);
      if (typeof s['invalid'] === 'boolean') this.toggleInvalid.set(s['invalid']);
      if (typeof s['hint'] === 'string') this.toggleHint.set(s['hint']);
      if (typeof s['warning'] === 'string') this.toggleWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.toggleError.set(s['error']);
    } else if (sel === 'emr-columns') {
      if (typeof s['count'] === 'number') this.colsCount.set(s['count']);
      if (typeof s['gap'] === 'number' || typeof s['gap'] === 'string') this.colsGap.set(s['gap']);
      if (s['align'] === 'stretch' || s['align'] === 'start' || s['align'] === 'center' || s['align'] === 'end') {
        this.colsAlign.set(s['align']);
      }
      if (typeof s['collapseBelow'] === 'number') this.colsCollapseBelow.set(s['collapseBelow']);
    } else if (sel === 'emr-field-value-row') {
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.fvrSize.set(s['size']);
      if (typeof s['tone'] === 'string') this.fvrTone.set(s['tone'] as EmrTone);
      if (typeof s['truncate'] === 'boolean') this.fvrTruncate.set(s['truncate']);
      if (typeof s['interactive'] === 'boolean') this.fvrInteractive.set(s['interactive']);
      if (typeof s['activations'] === 'number') this.fvrActivations.set(s['activations']);
    } else if (sel === 'emr-status-cell') {
      if (typeof s['edits'] === 'number') this.statusEdits.set(s['edits']);
      if (typeof s['compact'] === 'boolean') this.statusCompact.set(s['compact']);
      if (typeof s['selectable'] === 'boolean') this.statusSelectable.set(s['selectable']);
      if (typeof s['selected'] === 'boolean') this.statusSelected.set(s['selected']);
      if (typeof s['disabled'] === 'boolean') this.statusDisabled.set(s['disabled']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
      if (s['size'] === 'sm' || s['size'] === 'md') this.statusSize.set(s['size']);
    } else if (sel === 'emr-stage-stepper') {
      if (typeof s['activeId'] === 'string') this.stepperActiveId.set(s['activeId']);
      if (s['orientation'] === 'horizontal' || s['orientation'] === 'vertical') this.stepperOrientation.set(s['orientation']);
      if (s['size'] === 'sm' || s['size'] === 'md') this.stepperSize.set(s['size']);
      if (typeof s['clickable'] === 'boolean') this.stepperClickable.set(s['clickable']);
      if (typeof s['linear'] === 'boolean') this.stepperLinear.set(s['linear']);
      if (typeof s['disabled'] === 'boolean') this.stepperDisabled.set(s['disabled']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-stat-tile') {
      if (typeof s['clicks'] === 'number') this.statClicks.set(s['clicks']);
      if (typeof s['tone'] === 'string') this.statTone.set(s['tone'] as EmrTone);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.statSize.set(s['size']);
      if (typeof s['interactive'] === 'boolean') this.statInteractive.set(s['interactive']);
      if (typeof s['selected'] === 'boolean') this.statSelected.set(s['selected']);
      if (typeof s['loading'] === 'boolean') this.statLoading.set(s['loading']);
      if (typeof s['disabled'] === 'boolean') this.statDisabled.set(s['disabled']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-field-frame') {
      if (typeof s['value'] === 'string') this.ffValue.set(s['value']);
      if (typeof s['unit'] === 'string') this.ffUnit.set(s['unit']);
      if (s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline') this.ffLayout.set(s['layout']);
      if (typeof s['showMetadata'] === 'boolean') this.ffShowMetadata.set(s['showMetadata']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
      if ('assessmentStatus' in s) {
        this.ffStatus.set(s['assessmentStatus'] as 'recorded' | 'not-assessed' | 'unable-to-assess' | 'not-applicable' | 'declined' | 'unknown' | undefined);
      }
    } else if (sel === 'emr-typed-field') {
      if (s['model'] && typeof s['model'] === 'object') this.typedState.set(s['model'] as ClinicalFieldState);
      if (typeof s['showMetadata'] === 'boolean') this.tfShowMetadata.set(s['showMetadata']);
      if (s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline') this.tfLayout.set(s['layout']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-coded-input') {
      if (s['definition']) this.codedModel.set(s as unknown as CodedInputViewModel);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-attestation') {
      if (s['id'] && Array.isArray(s['signatories'])) this.attestationModel.set(s as unknown as AttestationViewModel);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-schedule-slot-picker') {
      if ('value' in s) this.sspValue.set((s['value'] as readonly DoseSlot[] | null) ?? null);
      if (s['amountMode'] === 'numeric' || s['amountMode'] === 'label') this.sspAmountMode.set(s['amountMode']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-identifier-entry') {
      const cur = this.identModel();
      const val = typeof s['value'] === 'string' ? s['value'] : cur.value;
      const scans = typeof s['scans'] === 'number' ? s['scans'] : this.identScans();
      this.identScans.set(scans);
      this.identModel.set({
        ...cur,
        value: val,
        normalisedValue: val.trim() || undefined,
        hint: `Scanner triggers: ${scans}`,
        selectedType: typeof s['selectedType'] === 'string' ? s['selectedType'] : cur.selectedType,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
      });
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-scale-field') {
      const cur = this.scaleModel();
      this.scaleModel.set({
        ...cur,
        variant: s['variant'] === 'vas' ? 'vas' : s['variant'] === 'likert' ? 'likert' : cur.variant,
        value: typeof s['value'] === 'number' || s['value'] === null ? (s['value'] as number | null) : cur.value,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        tone: typeof s['tone'] === 'string' ? (s['tone'] as EmrTone) : cur.tone,
        status: typeof s['status'] === 'string' ? (s['status'] as ScaleFieldViewModel['status']) : undefined,
      });
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-partial-date-field') {
      const cur = this.partialDateModel();
      this.partialDateModel.set({
        ...cur,
        value: 'value' in s ? ((s['value'] as PartialDateFieldViewModel['value']) ?? null) : cur.value,
        defaultPrecision:
          s['defaultPrecision'] === 'year' || s['defaultPrecision'] === 'month' || s['defaultPrecision'] === 'day'
            ? s['defaultPrecision']
            : cur.defaultPrecision,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        status: typeof s['status'] === 'string' ? (s['status'] as PartialDateFieldViewModel['status']) : undefined,
      });
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-attachment-field') {
      const cur = this.attachmentModel();
      this.attachmentModel.set({
        ...cur,
        items: Array.isArray(s['items']) ? (s['items'] as AttachmentFieldViewModel['items']) : cur.items,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        allowCamera: typeof s['allowCamera'] === 'boolean' ? s['allowCamera'] : cur.allowCamera,
        maxItems: typeof s['maxItems'] === 'number' ? s['maxItems'] : cur.maxItems,
        status: typeof s['status'] === 'string' ? (s['status'] as AttachmentFieldViewModel['status']) : undefined,
      });
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-duration-input') {
      const cur = this.durationModel();
      this.durationModel.set({
        ...cur,
        value: 'value' in s ? ((s['value'] as DurationFieldViewModel['value']) ?? null) : cur.value,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        layout: s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline' ? s['layout'] : cur.layout,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        showSteppers: typeof s['showSteppers'] === 'boolean' ? s['showSteppers'] : cur.showSteppers,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        labelHidden: typeof s['labelHidden'] === 'boolean' ? s['labelHidden'] : cur.labelHidden,
        status: typeof s['status'] === 'string' ? (s['status'] as DurationFieldViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.durationLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-range-field') {
      const cur = this.rangeModel();
      this.rangeModel.set({
        ...cur,
        kind:
          s['kind'] === 'number' || s['kind'] === 'date' || s['kind'] === 'time' || s['kind'] === 'datetime'
            ? s['kind']
            : cur.kind,
        value: 'value' in s ? ((s['value'] as RangeFieldViewModel['value']) ?? null) : cur.value,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        showSteppers: typeof s['showSteppers'] === 'boolean' ? s['showSteppers'] : cur.showSteppers,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages']) ? (s['messages'] as RangeFieldViewModel['messages']) : cur.messages,
        status: typeof s['status'] === 'string' ? (s['status'] as RangeFieldViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.rangeLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-phone-input') {
      const cur = this.phoneModel();
      this.phoneModel.set({
        ...cur,
        countryCode: typeof s['countryCode'] === 'string' ? s['countryCode'] : cur.countryCode,
        nationalNumber: typeof s['nationalNumber'] === 'string' ? s['nationalNumber'] : cur.nationalNumber,
        extension: 'extension' in s ? (typeof s['extension'] === 'string' ? s['extension'] : undefined) : cur.extension,
        showExtension: typeof s['showExtension'] === 'boolean' ? s['showExtension'] : cur.showExtension,
        channels: Array.isArray(s['channels']) ? (s['channels'] as EmrPhoneChannel[]) : cur.channels,
        formattedPreview: typeof s['formattedPreview'] === 'string' ? s['formattedPreview'] : cur.formattedPreview,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages']) ? (s['messages'] as PhoneFieldViewModel['messages']) : cur.messages,
        status: typeof s['status'] === 'string' ? (s['status'] as PhoneFieldViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.phoneLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-address-field') {
      const cur = this.addressModel();
      this.addressModel.set({
        ...cur,
        use:
          s['use'] === 'home' || s['use'] === 'work' || s['use'] === 'temp' || s['use'] === 'billing'
            ? s['use']
            : cur.use,
        value:
          s['value'] && typeof s['value'] === 'object'
            ? (s['value'] as AddressFieldViewModel['value'])
            : cur.value,
        showDistrict: typeof s['showDistrict'] === 'boolean' ? s['showDistrict'] : cur.showDistrict,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages']) ? (s['messages'] as AddressFieldViewModel['messages']) : cur.messages,
        status: typeof s['status'] === 'string' ? (s['status'] as AddressFieldViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.addressLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-macro-text-field') {
      const cur = this.macroTextModel();
      this.macroTextModel.set({
        ...cur,
        value: typeof s['value'] === 'string' ? s['value'] : cur.value,
        suggestionsOpen: typeof s['suggestionsOpen'] === 'boolean' ? s['suggestionsOpen'] : cur.suggestionsOpen,
        suggestions: Array.isArray(s['suggestions']) ? (s['suggestions'] as EmrMacroSuggestion[]) : cur.suggestions,
        dictating: typeof s['dictating'] === 'boolean' ? s['dictating'] : cur.dictating,
        dictationEnabled:
          typeof s['dictationEnabled'] === 'boolean' ? s['dictationEnabled'] : cur.dictationEnabled,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        rows: typeof s['rows'] === 'number' ? s['rows'] : cur.rows,
        maxLength: typeof s['maxLength'] === 'number' ? s['maxLength'] : cur.maxLength,
        showCounter: typeof s['showCounter'] === 'boolean' ? s['showCounter'] : cur.showCounter,
        autoResize: typeof s['autoResize'] === 'boolean' ? s['autoResize'] : cur.autoResize,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages']) ? (s['messages'] as MacroTextFieldViewModel['messages']) : cur.messages,
        status: typeof s['status'] === 'string' ? (s['status'] as MacroTextFieldViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.macroTextLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-laterality-field') {
      const cur = this.lateralityModel();
      this.lateralityModel.set({
        ...cur,
        domain:
          s['domain'] === 'ophthalmic' || s['domain'] === 'anatomic' || s['domain'] === 'anatomical'
            ? s['domain']
            : cur.domain,
        value:
          'value' in s
            ? (s['value'] as LateralityFieldViewModel['value'])
            : cur.value,
        options: Array.isArray(s['options'])
          ? (s['options'] as LateralityFieldViewModel['options'])
          : undefined,
        requiresConfirmation:
          typeof s['requiresConfirmation'] === 'boolean'
            ? s['requiresConfirmation']
            : cur.requiresConfirmation,
        confirmed: typeof s['confirmed'] === 'boolean' ? s['confirmed'] : cur.confirmed,
        confirmationLabel:
          typeof s['confirmationLabel'] === 'string'
            ? s['confirmationLabel']
            : cur.confirmationLabel,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        orientation:
          s['orientation'] === 'horizontal' || s['orientation'] === 'vertical'
            ? s['orientation']
            : cur.orientation,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages'])
          ? (s['messages'] as LateralityFieldViewModel['messages'])
          : cur.messages,
        status:
          typeof s['status'] === 'string'
            ? (s['status'] as LateralityFieldViewModel['status'])
            : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.lateralityLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-visual-acuity-field') {
      const cur = this.visualAcuityModel();
      this.visualAcuityModel.set({
        ...cur,
        eye:
          s['eye'] === 'OD' || s['eye'] === 'OS' || s['eye'] === 'OU'
            ? s['eye']
            : cur.eye,
        notation:
          s['notation'] === 'snellen-m' ||
          s['notation'] === 'snellen-ft' ||
          s['notation'] === 'logmar' ||
          s['notation'] === 'etdrs' ||
          s['notation'] === 'low-vision'
            ? s['notation']
            : cur.notation,
        correction:
          s['correction'] === 'unaided' ||
          s['correction'] === 'habitual' ||
          s['correction'] === 'best-corrected' ||
          s['correction'] === 'contact-lens'
            ? s['correction']
            : cur.correction,
        value: 'value' in s ? (s['value'] as VisualAcuityFieldViewModel['value']) : cur.value,
        valueOptions: Array.isArray(s['valueOptions'])
          ? (s['valueOptions'] as VisualAcuityFieldViewModel['valueOptions'])
          : cur.valueOptions,
        showPinhole: typeof s['showPinhole'] === 'boolean' ? s['showPinhole'] : cur.showPinhole,
        pinholeValue:
          'pinholeValue' in s
            ? (s['pinholeValue'] as VisualAcuityFieldViewModel['pinholeValue'])
            : cur.pinholeValue,
        pinholeRequired:
          typeof s['pinholeRequired'] === 'boolean'
            ? s['pinholeRequired']
            : cur.pinholeRequired,
        derivedDisplay:
          'derivedDisplay' in s
            ? (s['derivedDisplay'] as VisualAcuityFieldViewModel['derivedDisplay'])
            : cur.derivedDisplay,
        derivedTone:
          typeof s['derivedTone'] === 'string'
            ? (s['derivedTone'] as VisualAcuityFieldViewModel['derivedTone'])
            : cur.derivedTone,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages'])
          ? (s['messages'] as VisualAcuityFieldViewModel['messages'])
          : cur.messages,
        status:
          typeof s['status'] === 'string'
            ? (s['status'] as VisualAcuityFieldViewModel['status'])
            : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.visualAcuityLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-refraction-field') {
      const cur = this.refractionModel();
      this.refractionModel.set({
        ...cur,
        eye: s['eye'] === 'OD' || s['eye'] === 'OS' ? s['eye'] : cur.eye,
        value:
          s['value'] && typeof s['value'] === 'object'
            ? (s['value'] as RefractionFieldViewModel['value'])
            : cur.value,
        showNearAdd: typeof s['showNearAdd'] === 'boolean' ? s['showNearAdd'] : cur.showNearAdd,
        formattedSummary:
          'formattedSummary' in s
            ? (s['formattedSummary'] as RefractionFieldViewModel['formattedSummary'])
            : cur.formattedSummary,
        size: s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg' ? s['size'] : cur.size,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages'])
          ? (s['messages'] as RefractionFieldViewModel['messages'])
          : cur.messages,
        status:
          typeof s['status'] === 'string'
            ? (s['status'] as RefractionFieldViewModel['status'])
            : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.refractionLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-signature-capture-field') {
      const cur = this.signatureModel();
      this.signatureModel.set({
        ...cur,
        strokes: Array.isArray(s['strokes']) ? (s['strokes'] as SignatureCaptureViewModel['strokes']) : cur.strokes,
        layout:
          s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline'
            ? s['layout']
            : cur.layout,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        clearable: typeof s['clearable'] === 'boolean' ? s['clearable'] : cur.clearable,
        undoable: typeof s['undoable'] === 'boolean' ? s['undoable'] : cur.undoable,
        showMetadata: typeof s['showMetadata'] === 'boolean' ? s['showMetadata'] : cur.showMetadata,
        messages: Array.isArray(s['messages']) ? (s['messages'] as SignatureCaptureViewModel['messages']) : cur.messages,
        status: typeof s['status'] === 'string' ? (s['status'] as SignatureCaptureViewModel['status']) : undefined,
      });
      if (typeof s['labelHidden'] === 'boolean') this.signatureLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.readOnly.set(s['readOnly']);
    } else if (sel === 'emr-image-viewer') {
      if (s['viewport'] && typeof s['viewport'] === 'object') {
        this.ivViewport.set(s['viewport'] as EmrImageViewportState);
      }
      if (typeof s['activeIndex'] === 'number') this.ivActiveIndex.set(s['activeIndex']);
      if (typeof s['multiImage'] === 'boolean') this.ivMultiImage.set(s['multiImage']);
      if (typeof s['allowFullscreen'] === 'boolean') this.ivAllowFullscreen.set(s['allowFullscreen']);
      if (typeof s['showThumbnails'] === 'boolean') this.ivShowThumbnails.set(s['showThumbnails']);
      if (typeof s['height'] === 'number') this.ivHeight.set(s['height']);
      if (typeof s['labelHidden'] === 'boolean') this.ivLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.ivReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.ivDisabled.set(s['disabled']);
      if (typeof s['warning'] === 'string') this.ivWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.ivError.set(s['error']);
    } else if (sel === 'emr-image-cropper') {
      if (s['transform'] && typeof s['transform'] === 'object') {
        this.icTransform.set(s['transform'] as EmrImageCropTransform);
      }
      if (typeof s['labelHidden'] === 'boolean') this.icLabelHidden.set(s['labelHidden']);
      if (typeof s['readOnly'] === 'boolean') this.icReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.icDisabled.set(s['disabled']);
      if (typeof s['warning'] === 'string') this.icWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.icError.set(s['error']);
    } else if (sel === 'emr-image-upload') {
      if (Array.isArray(s['items'])) this.iuItems.set(s['items'] as readonly EmrUploadedImageItem[]);
      if (typeof s['multiple'] === 'boolean') this.iuMultiple.set(s['multiple']);
      if (typeof s['maxFiles'] === 'number' || s['maxFiles'] === undefined) {
        this.iuMaxFiles.set(s['maxFiles'] as number | undefined);
      }
      if (typeof s['allowCamera'] === 'boolean') this.iuAllowCamera.set(s['allowCamera']);
      if (typeof s['labelHidden'] === 'boolean') this.iuLabelHidden.set(s['labelHidden']);
      if (typeof s['required'] === 'boolean') this.iuRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.iuReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.iuDisabled.set(s['disabled']);
      if (typeof s['warning'] === 'string') this.iuWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.iuError.set(s['error']);
    } else if (sel === 'emr-image-field') {
      const cur = this.imageFieldModel();
      this.imageFieldModel.set({
        ...cur,
        items: Array.isArray(s['items']) ? (s['items'] as readonly EmrUploadedImageItem[]) : cur.items,
        multiple: typeof s['multiple'] === 'boolean' ? s['multiple'] : cur.multiple,
        maxFiles: typeof s['maxFiles'] === 'number' ? s['maxFiles'] : undefined,
        allowCamera: typeof s['allowCamera'] === 'boolean' ? s['allowCamera'] : cur.allowCamera,
        required: typeof s['required'] === 'boolean' ? s['required'] : cur.required,
        readOnly: typeof s['readOnly'] === 'boolean' ? s['readOnly'] : cur.readOnly,
        status: typeof s['status'] === 'string' ? (s['status'] as ImageFieldViewModel['status']) : undefined,
        messages: Array.isArray(s['messages']) ? (s['messages'] as ImageFieldViewModel['messages']) : cur.messages,
      });
      if (typeof s['labelHidden'] === 'boolean') this.ifLabelHidden.set(s['labelHidden']);
      if (s['layout'] === 'vertical' || s['layout'] === 'horizontal' || s['layout'] === 'inline') {
        this.ifLayout.set(s['layout']);
      }
      if (typeof s['showMetadata'] === 'boolean') this.ifShowMetadata.set(s['showMetadata']);
      if (typeof s['readOnly'] === 'boolean') this.ifReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-card') {
      if (typeof s['title'] === 'string') this.cardTitle.set(s['title']);
      if (typeof s['subtitle'] === 'string') this.cardSubtitle.set(s['subtitle']);
      if (s['variant'] === 'outlined' || s['variant'] === 'elevated' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.cardVariant.set(s['variant']);
      }
      if (s['padding'] === 'none' || s['padding'] === 'sm' || s['padding'] === 'md' || s['padding'] === 'lg') {
        this.cardPadding.set(s['padding']);
      }
      if (typeof s['tone'] === 'string') this.cardTone.set(s['tone'] as EmrTone);
      if (typeof s['interactive'] === 'boolean') this.cardInteractive.set(s['interactive']);
      if (typeof s['selected'] === 'boolean') this.cardSelected.set(s['selected']);
      if (typeof s['disabled'] === 'boolean') this.cardDisabled.set(s['disabled']);
    } else if (sel === 'emr-section-card') {
      if (typeof s['collapsed'] === 'boolean') this.sectionCardCollapsed.set(s['collapsed']);
      if (typeof s['collapsible'] === 'boolean') this.sectionCardCollapsible.set(s['collapsible']);
      if (s['variant'] === 'outlined' || s['variant'] === 'elevated' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.sectionCardVariant.set(s['variant']);
      }
      if (s['tone'] === 'neutral' || s['tone'] === 'info' || s['tone'] === 'success' || s['tone'] === 'warning' || s['tone'] === 'danger') {
        this.sectionCardTone.set(s['tone']);
      }
      if (s['padding'] === 'none' || s['padding'] === 'sm' || s['padding'] === 'md' || s['padding'] === 'lg') {
        this.sectionCardPadding.set(s['padding']);
      }
      if (s['headingLevel'] === 2 || s['headingLevel'] === 3 || s['headingLevel'] === 4 || s['headingLevel'] === 5 || s['headingLevel'] === 6) {
        this.sectionCardHeadingLevel.set(s['headingLevel']);
      }
      if (typeof s['readOnly'] === 'boolean') this.sectionCardReadOnly.set(s['readOnly']);
      if (typeof s['showStatus'] === 'boolean') this.sectionCardShowStatus.set(s['showStatus']);
      if (typeof s['showDescription'] === 'boolean') this.sectionCardShowDescription.set(s['showDescription']);
    } else if (sel === 'emr-repeatable-group') {
      if (Array.isArray(s['items'])) this.repeatItems.set(s['items'] as readonly RepeatableItemState[]);
      if (typeof s['readOnly'] === 'boolean') this.repeatReadOnly.set(s['readOnly']);
      if (typeof s['empty'] === 'boolean') this.repeatEmpty.set(s['empty']);
      if (typeof s['error'] === 'boolean') this.repeatError.set(s['error']);
      if (typeof s['warning'] === 'boolean') this.repeatWarning.set(s['warning']);
    } else if (sel === 'emr-clinical-form') {
      if (typeof s['readOnly'] === 'boolean') this.clinicalFormReadOnly.set(s['readOnly']);
      if (Array.isArray(s['collapsedSectionIds'])) {
        this.clinicalFormCollapsedSectionIds.set(s['collapsedSectionIds'].map(String));
      }
      if (s['fields'] && typeof s['fields'] === 'object') {
        this.clinicalFormFields.set(s['fields'] as Readonly<Record<string, ClinicalFieldState>>);
      }
      if (s['repeatableGroups'] && typeof s['repeatableGroups'] === 'object') {
        this.clinicalFormRepeatableGroups.set(
          s['repeatableGroups'] as Readonly<Record<string, readonly RepeatableItemState[]>>,
        );
      }
    } else if (
      sel === 'emr-clinical-list' ||
      sel === 'emr-medication-list' ||
      sel === 'emr-allergy-list' ||
      sel === 'emr-chronic-disease-list' ||
      sel === 'emr-personal-history-list'
    ) {
      const cur = this.clinicalListModels()[sel];
      const next: ClinicalListViewModel = {
        ...cur,
        ...(typeof s['title'] === 'string' ? { title: s['title'] } : {}),
        ...(Array.isArray(s['items']) ? { items: s['items'] as readonly ClinicalListItem[] } : {}),
        ...(typeof s['selectedId'] === 'string' || s['selectedId'] === undefined
          ? { selectedId: s['selectedId'] as string | undefined }
          : {}),
        ...(typeof s['allowAdd'] === 'boolean' ? { allowAdd: s['allowAdd'] } : {}),
        ...(typeof s['readOnly'] === 'boolean' ? { readOnly: s['readOnly'] } : {}),
        ...(typeof s['loading'] === 'boolean' ? { loading: s['loading'] } : {}),
        ...(typeof s['error'] === 'string' ? { error: s['error'] } : {}),
        ...(typeof s['emptyMessage'] === 'string' ? { emptyMessage: s['emptyMessage'] } : {}),
        ...(s['variant'] === 'outlined' ||
        s['variant'] === 'elevated' ||
        s['variant'] === 'filled' ||
        s['variant'] === 'subtle'
          ? { variant: s['variant'] }
          : {}),
      };
      this.clinicalListModels.update((prev) => ({ ...prev, [sel]: next }));
    } else if (sel === 'emr-clinical-matrix') {
      if (s['values'] && typeof s['values'] === 'object') {
        this.clinicalMatrixValues.set(s['values'] as ClinicalMatrixValues);
      }
      if (typeof s['readOnly'] === 'boolean') {
        this.clinicalMatrixReadOnly.set(s['readOnly']);
      }
      if (typeof s['showRemarks'] === 'boolean') {
        this.clinicalMatrixShowRemarks.set(s['showRemarks']);
      }
    } else if (sel === 'emr-clinical-cell-renderer') {
      if (typeof s['od'] === 'number') this.customCellOd.set(s['od']);
      if (typeof s['os'] === 'number') this.customCellOs.set(s['os']);
      if (typeof s['remark'] === 'string') this.customCellRemark.set(s['remark']);
      if (typeof s['readOnly'] === 'boolean') this.customCellReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-annotation-toolbar') {
      if (typeof s['selectedToolId'] === 'string') this.tbSelectedToolId.set(s['selectedToolId']);
      if (typeof s['selectedColourId'] === 'string') this.tbSelectedColourId.set(s['selectedColourId']);
      if (typeof s['selectedWidthId'] === 'string') this.tbSelectedWidthId.set(s['selectedWidthId']);
      if (typeof s['zoomPct'] === 'number') this.tbZoomPct.set(s['zoomPct']);
      if (typeof s['canUndo'] === 'boolean') this.tbCanUndo.set(s['canUndo']);
      if (typeof s['canRedo'] === 'boolean') this.tbCanRedo.set(s['canRedo']);
      if (typeof s['canSave'] === 'boolean') this.tbCanSave.set(s['canSave']);
      if (typeof s['zoomLocked'] === 'boolean') this.tbZoomLocked.set(s['zoomLocked']);
      if (typeof s['readOnly'] === 'boolean') this.tbReadOnly.set(s['readOnly']);
      if (typeof s['undoCount'] === 'number') this.tbUndoCount.set(s['undoCount']);
      if (typeof s['redoCount'] === 'number') this.tbRedoCount.set(s['redoCount']);
      if (typeof s['saveCount'] === 'number') this.tbSaveCount.set(s['saveCount']);
    } else if (sel === 'emr-annotation-list') {
      if (Array.isArray(s['items'])) this.alItems.set(s['items'] as readonly AnnotationListItem[]);
      if (typeof s['selectedLayerId'] === 'string' || s['selectedLayerId'] === undefined) {
        if ('selectedLayerId' in s) this.alSelectedLayerId.set(s['selectedLayerId'] as string | undefined);
      }
      if (typeof s['canLock'] === 'boolean') this.alCanLock.set(s['canLock']);
      if (typeof s['readOnly'] === 'boolean') this.alReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-image-template-picker') {
      if (typeof s['selectedTemplateId'] === 'string') this.tpSelectedTemplateId.set(s['selectedTemplateId']);
      if (typeof s['search'] === 'string') this.tpSearch.set(s['search']);
      if (typeof s['category'] === 'string') this.tpCategory.set(s['category']);
      if (typeof s['favouritesOnly'] === 'boolean') this.tpFavouritesOnly.set(s['favouritesOnly']);
      if (Array.isArray(s['favouriteIds'])) this.tpFavouriteIds.set(s['favouriteIds'].map(String));
      if (typeof s['readOnly'] === 'boolean') this.tpReadOnly.set(s['readOnly']);
      if (typeof s['canEditFavourites'] === 'boolean') this.tpCanEditFavourites.set(s['canEditFavourites']);
    } else if (sel === 'emr-time-axis') {
      if (typeof s['stepId'] === 'string' && (s['stepId'] === '60' || s['stepId'] === '30')) {
        this.taStepId.set(s['stepId']);
      }
      const source = this.timeAxisTicksSource();
      if (typeof s['offset'] === 'number') {
        this.taOffset.set(Math.max(0, Math.min(source.length - 5, s['offset'])));
      } else if (typeof s['windowStartLabel'] === 'string') {
        const idx = source.indexOf(s['windowStartLabel']);
        if (idx >= 0) this.taOffset.set(Math.max(0, Math.min(source.length - 5, idx)));
      }
      if (typeof s['selectedTickId'] === 'string') this.taSelectedTickId.set(s['selectedTickId']);
      else if (typeof s['selectedSlotId'] === 'string') this.taSelectedTickId.set(s['selectedSlotId']);
      if (typeof s['readOnly'] === 'boolean') this.taReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-data-table') {
      if (typeof s['sortColumnId'] === 'string' || s['sortColumnId'] === undefined) {
        if ('sortColumnId' in s) this.dtSortColumnId.set(s['sortColumnId'] as string | undefined);
      }
      if (s['sortDirection'] === 'asc' || s['sortDirection'] === 'desc' || s['sortDirection'] === undefined) {
        if ('sortDirection' in s) this.dtSortDirection.set(s['sortDirection'] as EmrDataTableSortDirection | undefined);
      }
      if (Array.isArray(s['selectedIds'])) this.dtSelectedIds.set(s['selectedIds'].map(String));
      if (s['density'] === 'comfortable' || s['density'] === 'compact') this.dtDensity.set(s['density']);
      if (typeof s['pendingOnly'] === 'boolean') this.dtPendingOnly.set(s['pendingOnly']);
      if (typeof s['customSavedFilter'] === 'boolean') this.dtCustomSavedFilter.set(s['customSavedFilter']);
      if (typeof s['page'] === 'number') this.dtPage.set(s['page']);
      if (typeof s['pageSize'] === 'number') this.dtPageSize.set(s['pageSize']);
      if (typeof s['loading'] === 'boolean') this.dtLoading.set(s['loading']);
      if (typeof s['error'] === 'string') this.dtError.set(s['error']);
      if (typeof s['readOnly'] === 'boolean') this.dtReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-split-workspace') {
      if (
        s['preset'] === '2-pane-50-50' ||
        s['preset'] === '2-pane-40-60' ||
        s['preset'] === '3-pane' ||
        s['preset'] === 'focus-primary'
      ) {
        this.swPreset.set(s['preset']);
      }
      if (typeof s['pane1Pct'] === 'number') this.swPane1Pct.set(s['pane1Pct']);
      if (typeof s['pane2Pct'] === 'number') this.swPane2Pct.set(s['pane2Pct']);
      if (typeof s['pane3Pct'] === 'number') this.swPane3Pct.set(s['pane3Pct']);
      if (typeof s['pane1Collapsed'] === 'boolean') this.swPane1Collapsed.set(s['pane1Collapsed']);
      if (typeof s['pane2Collapsed'] === 'boolean') this.swPane2Collapsed.set(s['pane2Collapsed']);
      if (typeof s['pane3Collapsed'] === 'boolean') this.swPane3Collapsed.set(s['pane3Collapsed']);
      if (typeof s['mobileActivePaneId'] === 'string') this.swMobileActivePaneId.set(s['mobileActivePaneId']);
      if (typeof s['readOnly'] === 'boolean') this.swReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-command-palette') {
      if (s['presentation'] === 'inline' || s['presentation'] === 'modal') {
        this.cpPresentation.set(s['presentation']);
      }
      if (typeof s['open'] === 'boolean') this.cpOpen.set(s['open']);
      if (typeof s['query'] === 'string') this.cpQuery.set(s['query']);
      if (
        s['activeCategory'] === 'all' ||
        s['activeCategory'] === 'orders' ||
        s['activeCategory'] === 'navigation' ||
        s['activeCategory'] === 'smartphrases' ||
        s['activeCategory'] === 'calculators' ||
        s['activeCategory'] === 'actions'
      ) {
        this.cpActiveCategory.set(s['activeCategory']);
      }
      if (typeof s['activeIndex'] === 'number') this.cpActiveIndex.set(s['activeIndex']);
      if (typeof s['lastCommandId'] === 'string') this.cpLastCommandId.set(s['lastCommandId']);
      if (typeof s['readOnly'] === 'boolean') this.cpReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-master-detail') {
      if (typeof s['searchQuery'] === 'string') this.mdSearchQuery.set(s['searchQuery']);
      if (typeof s['activeFilterId'] === 'string') this.mdActiveFilterId.set(s['activeFilterId']);
      if (typeof s['selectedId'] === 'string') this.mdSelectedId.set(s['selectedId']);
      if (Array.isArray(s['checkedIds'])) this.mdCheckedIds.set(s['checkedIds'].map(String));
      if (typeof s['mobileDetailOpen'] === 'boolean') this.mdMobileDetailOpen.set(s['mobileDetailOpen']);
      if (typeof s['lastAction'] === 'string') this.mdLastAction.set(s['lastAction']);
      if (typeof s['readOnly'] === 'boolean') this.mdReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-synchronized-time-grid') {
      if (
        s['resolution'] === '15m' ||
        s['resolution'] === '1h' ||
        s['resolution'] === '4h' ||
        s['resolution'] === '24h'
      ) {
        this.stgResolution.set(s['resolution']);
      }
      if (typeof s['scrollOffset'] === 'number') this.stgScrollOffset.set(s['scrollOffset']);
      if (typeof s['visibleColumnCount'] === 'number') this.stgVisibleColumnCount.set(s['visibleColumnCount']);
      if (typeof s['selectedColumnId'] === 'string') this.stgSelectedColumnId.set(s['selectedColumnId']);
      if (typeof s['selectedCellKey'] === 'string') this.stgSelectedCellKey.set(s['selectedCellKey']);
      if (typeof s['vitalsCollapsed'] === 'boolean') this.stgVitalsCollapsed.set(s['vitalsCollapsed']);
      if (typeof s['trendCollapsed'] === 'boolean') this.stgTrendCollapsed.set(s['trendCollapsed']);
      if (typeof s['medsCollapsed'] === 'boolean') this.stgMedsCollapsed.set(s['medsCollapsed']);
      if (typeof s['readOnly'] === 'boolean') this.stgReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-field-generator') {
      this.fgModel.update((prev) => {
        const nextDraft =
          s['draft'] && typeof s['draft'] === 'object'
            ? (s['draft'] as EmrGeneratedFieldDefinition)
            : prev.draft;
        const typeOverride =
          typeof s['type'] === 'string' ? (s['type'] as ClinicalFieldType) : nextDraft.type;
        return {
          ...prev,
          draft: { ...nextDraft, type: typeOverride },
          sources: Array.isArray(s['sources']) ? (s['sources'] as readonly TerminologySource[]) : prev.sources,
          terminologySearches:
            s['terminologySearches'] && typeof s['terminologySearches'] === 'object'
              ? (s['terminologySearches'] as FieldGeneratorViewModel['terminologySearches'])
              : prev.terminologySearches,
          validationErrors:
            s['validationErrors'] && typeof s['validationErrors'] === 'object'
              ? (s['validationErrors'] as Readonly<Record<string, string>>)
              : prev.validationErrors,
          saving: typeof s['saving'] === 'boolean' ? s['saving'] : prev.saving,
          dirty: typeof s['dirty'] === 'boolean' ? s['dirty'] : prev.dirty,
          error: typeof s['error'] === 'string' ? (s['error'] || undefined) : prev.error,
          savedFieldId:
            typeof s['savedFieldId'] === 'string' ? (s['savedFieldId'] || undefined) : prev.savedFieldId,
        };
      });
      if (typeof s['readOnly'] === 'boolean') this.fgReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-terminology-search') {
      this.tsModel.update((prev) => {
        const baseSearch =
          s['search'] && typeof s['search'] === 'object'
            ? (s['search'] as TerminologySearchState)
            : prev.search;
        const nextSearch = baseSearch
          ? {
              ...baseSearch,
              sourceId: typeof s['sourceId'] === 'string' ? s['sourceId'] : baseSearch.sourceId,
              loading: typeof s['loading'] === 'boolean' ? s['loading'] : baseSearch.loading,
              error: typeof s['error'] === 'string' ? (s['error'] || undefined) : baseSearch.error,
            }
          : baseSearch;
        return {
          ...prev,
          role:
            s['role'] === 'question-meaning' ||
            s['role'] === 'unit' ||
            s['role'] === 'answer-value-set' ||
            s['role'] === 'classification-mapping'
              ? s['role']
              : prev.role,
          sources: Array.isArray(s['sources']) ? (s['sources'] as readonly TerminologySource[]) : prev.sources,
          search: nextSearch,
          bindings: Array.isArray(s['bindings'])
            ? (s['bindings'] as readonly TerminologyBinding[])
            : prev.bindings,
        };
      });
      if (typeof s['readOnly'] === 'boolean') this.l6TsReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-validation-rule-editor') {
      if (Array.isArray(s['rules'])) {
        this.vreRules.set(s['rules'] as readonly FieldValidationRule[]);
      }
      if (typeof s['readOnly'] === 'boolean') this.vreReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-field-library-picker') {
      if (typeof s['query'] === 'string') this.flpQuery.set(s['query']);
      if (typeof s['selectedSectionId'] === 'string') {
        this.flpSelectedSectionId.set(s['selectedSectionId']);
      }
      if (typeof s['readOnly'] === 'boolean') this.flpReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-template-composer' || sel === 'emr-template-preview') {
      const targetSignal = sel === 'emr-template-composer' ? this.tcModel : this.tpModel;
      const targetReadOnly = sel === 'emr-template-composer' ? this.tcReadOnly : this.l6TpReadOnly;
      targetSignal.update((prev) => {
        const baseTemplate =
          s['template'] && typeof s['template'] === 'object'
            ? (s['template'] as EhrTemplateDefinition)
            : prev.template;
        const nextStatus =
          s['status'] === 'draft' || s['status'] === 'active' || s['status'] === 'retired'
            ? s['status']
            : baseTemplate.status;
        const nextTemplate: EhrTemplateDefinition = { ...baseTemplate, status: nextStatus };
        return {
          ...prev,
          template: nextTemplate,
          fieldLibrary: Array.isArray(s['fieldLibrary'])
            ? (s['fieldLibrary'] as readonly EmrGeneratedFieldDefinition[])
            : prev.fieldLibrary,
          fieldLibraryQuery:
            typeof s['fieldLibraryQuery'] === 'string'
              ? s['fieldLibraryQuery']
              : prev.fieldLibraryQuery,
          selectedSectionId:
            typeof s['selectedSectionId'] === 'string'
              ? s['selectedSectionId']
              : prev.selectedSectionId,
          selectedPlacementId:
            typeof s['selectedPlacementId'] === 'string'
              ? s['selectedPlacementId']
              : undefined,
          preview: derivePreview(nextTemplate),
          loading: typeof s['loading'] === 'boolean' ? s['loading'] : prev.loading,
          saving: typeof s['saving'] === 'boolean' ? s['saving'] : prev.saving,
          dirty: typeof s['dirty'] === 'boolean' ? s['dirty'] : prev.dirty,
          error: typeof s['error'] === 'string' ? (s['error'] || undefined) : prev.error,
          artifact:
            s['artifact'] && typeof s['artifact'] === 'object'
              ? (s['artifact'] as EhrTemplateViewModel['artifact'])
              : prev.artifact,
          canAcceptImport:
            typeof s['canAcceptImport'] === 'boolean'
              ? s['canAcceptImport']
              : prev.canAcceptImport,
          importIssues: Array.isArray(s['importIssues'])
            ? (s['importIssues'] as readonly TemplateArtifactIssue[])
            : prev.importIssues,
        };
      });
      if (typeof s['readOnly'] === 'boolean') targetReadOnly.set(s['readOnly']);
    } else if (sel === 'emr-separator') {
      if (typeof s['label'] === 'string') this.sepLabel.set(s['label']);
      if (s['orientation'] === 'horizontal' || s['orientation'] === 'vertical') {
        this.sepOrientation.set(s['orientation']);
      }
      if (s['labelAlign'] === 'start' || s['labelAlign'] === 'center' || s['labelAlign'] === 'end') {
        this.sepLabelAlign.set(s['labelAlign']);
      }
      if (s['variant'] === 'solid' || s['variant'] === 'dashed' || s['variant'] === 'subtle') {
        this.sepVariant.set(s['variant']);
      }
      if (typeof s['decorative'] === 'boolean') this.sepDecorative.set(s['decorative']);
    } else if (sel === 'emr-state-message') {
      if (s['kind'] === 'empty' || s['kind'] === 'loading' || s['kind'] === 'error') {
        this.stateMsgKind.set(s['kind']);
      }
      if (typeof s['compact'] === 'boolean') this.stateMsgCompact.set(s['compact']);
      if (typeof s['actionLabel'] === 'string') this.stateMsgActionLabel.set(s['actionLabel']);
      if (typeof s['actionDisabled'] === 'boolean') this.stateMsgActionDisabled.set(s['actionDisabled']);
    } else if (sel === 'emr-chip') {
      if (typeof s['tone'] === 'string') this.chipTone.set(s['tone'] as EmrTone);
      if (s['variant'] === 'soft' || s['variant'] === 'solid' || s['variant'] === 'outline') {
        this.chipVariant.set(s['variant']);
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.chipSize.set(s['size']);
      if (typeof s['selectable'] === 'boolean') this.chipSelectable.set(s['selectable']);
      if (typeof s['selected'] === 'boolean') this.chipSelected.set(s['selected']);
      if (typeof s['removable'] === 'boolean') this.chipRemovable.set(s['removable']);
      if (typeof s['disabled'] === 'boolean') this.chipDisabled.set(s['disabled']);
    } else if (sel === 'emr-badge') {
      if (typeof s['tone'] === 'string') this.badgeTone.set(s['tone'] as EmrTone);
      if (s['variant'] === 'soft' || s['variant'] === 'solid' || s['variant'] === 'outline') {
        this.badgeVariant.set(s['variant']);
      }
      if (s['size'] === 'md' || s['size'] === 'sm') this.badgeSize.set(s['size']);
      if (s['shape'] === 'pill' || s['shape'] === 'rounded') this.badgeShape.set(s['shape']);
      if (typeof s['dot'] === 'boolean') this.badgeDot.set(s['dot']);
    } else if (sel === 'emr-alert') {
      if (typeof s['tone'] === 'string') this.alertTone.set(s['tone'] as EmrTone);
    } else if (sel === 'emr-search-select') {
      if (typeof s['query'] === 'string') this.searchQuery.set(s['query']);
      if (typeof s['open'] === 'boolean') this.searchOpen.set(s['open']);
      if (Array.isArray(s['picked'])) this.searchPicked.set(s['picked'].map(String));
      if (s['filterMode'] === 'remote' || s['filterMode'] === 'local' || s['filterMode'] === 'none') {
        this.searchFilterMode.set(s['filterMode']);
      }
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.searchVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.searchSize.set(s['size']);
      if (typeof s['multiple'] === 'boolean') this.searchMultiple.set(s['multiple']);
      if (typeof s['highlightMatch'] === 'boolean') this.searchHighlightMatch.set(s['highlightMatch']);
      if (typeof s['clearable'] === 'boolean') this.searchClearable.set(s['clearable']);
      if (typeof s['creatable'] === 'boolean') this.searchAllowCustom.set(s['creatable']);
      else if (typeof s['allowCustomValue'] === 'boolean') this.searchAllowCustom.set(s['allowCustomValue']);
      if (typeof s['maxTagCount'] === 'number') this.searchMaxTagCount.set(s['maxTagCount']);
      if (typeof s['maxSelections'] === 'number') this.searchMaxSelections.set(s['maxSelections']);
      if (typeof s['loading'] === 'boolean') this.searchLoading.set(s['loading']);
      if (typeof s['disabled'] === 'boolean') this.searchDisabled.set(s['disabled']);
      if (typeof s['readOnly'] === 'boolean') this.searchReadOnly.set(s['readOnly']);
      if (typeof s['required'] === 'boolean') this.searchRequired.set(s['required']);
      if (typeof s['invalid'] === 'boolean') this.searchInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.searchLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.searchWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.searchError.set(s['error']);
    } else if (sel === 'emr-combobox') {
      if (s['value'] === null || typeof s['value'] === 'string') this.comboValue.set(s['value']);
      if (typeof s['open'] === 'boolean') this.comboOpen.set(s['open']);
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.comboVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md') this.comboSize.set(s['size']);
      if (s['filterMode'] === 'remote' || s['filterMode'] === 'local' || s['filterMode'] === 'none') {
        this.comboFilterMode.set(s['filterMode']);
      }
      if (typeof s['allowCustomValue'] === 'boolean') this.comboAllowCustom.set(s['allowCustomValue']);
      else if (typeof s['creatable'] === 'boolean') this.comboAllowCustom.set(s['creatable']);
      if (typeof s['highlightMatch'] === 'boolean') this.comboHighlightMatch.set(s['highlightMatch']);
      if (typeof s['clearable'] === 'boolean') this.comboClearable.set(s['clearable']);
      if (typeof s['loading'] === 'boolean') this.comboLoading.set(s['loading']);
      if (typeof s['required'] === 'boolean') this.comboRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.comboReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.comboDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.comboInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.comboLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.comboWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.comboError.set(s['error']);
    } else if (sel === 'emr-tag-input') {
      if (Array.isArray(s['tags'])) this.tagValues.set(s['tags'].filter((v): v is string => typeof v === 'string'));
      else if (Array.isArray(s['value'])) this.tagValues.set(s['value'].filter((v): v is string => typeof v === 'string'));
      if (Array.isArray(s['lockedTags'])) this.tagLockedTags.set(s['lockedTags'].filter((v): v is string => typeof v === 'string'));
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.tagVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md') this.tagSize.set(s['size']);
      if (
        s['chipTone'] === 'neutral' ||
        s['chipTone'] === 'info' ||
        s['chipTone'] === 'success' ||
        s['chipTone'] === 'warning' ||
        s['chipTone'] === 'danger'
      ) {
        this.tagChipTone.set(s['chipTone']);
      }
      if (typeof s['clearable'] === 'boolean') this.tagClearable.set(s['clearable']);
      if (typeof s['allowDuplicates'] === 'boolean') this.tagAllowDuplicates.set(s['allowDuplicates']);
      if (typeof s['filterSuggestions'] === 'boolean') this.tagFilterSuggestions.set(s['filterSuggestions']);
      if (typeof s['highlightMatch'] === 'boolean') this.tagHighlightMatch.set(s['highlightMatch']);
      if (typeof s['maxTags'] === 'number') this.tagMaxTags.set(s['maxTags']);
      if (typeof s['maxTagLength'] === 'number') this.tagMaxTagLength.set(s['maxTagLength']);
      if (typeof s['required'] === 'boolean') this.tagRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.tagReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.tagDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.tagInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.tagLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.tagWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.tagError.set(s['error']);
    } else if (sel === 'emr-date-range-input') {
      if (s['value'] === null) {
        this.drValue.set(null);
      } else if (s['value'] && typeof s['value'] === 'object') {
        const v = s['value'] as { start?: unknown; end?: unknown };
        this.drValue.set({
          start: typeof v.start === 'string' ? v.start : null,
          end: typeof v.end === 'string' ? v.end : null,
        });
      }
      if (s['mode'] === 'date' || s['mode'] === 'datetime') this.drMode.set(s['mode']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.drSize.set(s['size']);
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.drVariant.set(s['variant']);
      }
      if (s['weekStartsOn'] === 0 || s['weekStartsOn'] === 1) this.drWeekStartsOn.set(s['weekStartsOn']);
      if (typeof s['showCalendar'] === 'boolean') this.drShowCalendar.set(s['showCalendar']);
      if (typeof s['clearable'] === 'boolean') this.drClearable.set(s['clearable']);
      if (typeof s['required'] === 'boolean') this.drRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.drReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.drDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.drInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.drLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.drWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.drError.set(s['error']);
    } else if (sel === 'emr-slider') {
      if (s['value'] === null || typeof s['value'] === 'number') this.sliderValue.set(s['value']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.sliderSize.set(s['size']);
      if (
        s['tone'] === 'neutral' ||
        s['tone'] === 'info' ||
        s['tone'] === 'success' ||
        s['tone'] === 'warning' ||
        s['tone'] === 'danger'
      ) {
        this.sliderTone.set(s['tone']);
      }
      if (typeof s['showValue'] === 'boolean') this.sliderShowValue.set(s['showValue']);
      if (typeof s['showSteppers'] === 'boolean') this.sliderShowSteppers.set(s['showSteppers']);
      if (typeof s['clearable'] === 'boolean') this.sliderClearable.set(s['clearable']);
      if (typeof s['required'] === 'boolean') this.sliderRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.sliderReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.sliderDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.sliderInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.sliderLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.sliderWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.sliderError.set(s['error']);
    } else if (sel === 'emr-range-slider') {
      if (s['value'] === null) {
        this.rangeSliderValue.set(null);
      } else if (Array.isArray(s['value']) && s['value'].length === 2) {
        this.rangeSliderValue.set([Number(s['value'][0]), Number(s['value'][1])]);
      }
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.rangeSliderSize.set(s['size']);
      if (
        s['tone'] === 'neutral' ||
        s['tone'] === 'info' ||
        s['tone'] === 'success' ||
        s['tone'] === 'warning' ||
        s['tone'] === 'danger'
      ) {
        this.rangeSliderTone.set(s['tone']);
      }
      if (typeof s['showValue'] === 'boolean') this.rangeSliderShowValue.set(s['showValue']);
      if (typeof s['clearable'] === 'boolean') this.rangeSliderClearable.set(s['clearable']);
      if (typeof s['required'] === 'boolean') this.rangeSliderRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.rangeSliderReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.rangeSliderDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.rangeSliderInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.rangeSliderLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.rangeSliderWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.rangeSliderError.set(s['error']);
    } else if (sel === 'emr-masked-input') {
      if (s['value'] === null || typeof s['value'] === 'string') this.maskedValue.set(s['value']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.maskedSize.set(s['size']);
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.maskedVariant.set(s['variant']);
      }
      if (typeof s['unmask'] === 'boolean') this.maskedUnmask.set(s['unmask']);
      if (typeof s['showMaskHint'] === 'boolean') this.maskedShowHint.set(s['showMaskHint']);
      if (typeof s['uppercase'] === 'boolean') this.maskedUppercase.set(s['uppercase']);
      if (typeof s['clearable'] === 'boolean') this.maskedClearable.set(s['clearable']);
      if (typeof s['required'] === 'boolean') this.maskedRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.maskedReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.maskedDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.maskedInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.maskedLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.maskedWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.maskedError.set(s['error']);
    } else if (sel === 'emr-otp-input') {
      if (typeof s['value'] === 'string') this.otpValue.set(s['value']);
      if (typeof s['secret'] === 'boolean') this.otpSecret.set(s['secret']);
      if (typeof s['numericOnly'] === 'boolean') this.otpNumericOnly.set(s['numericOnly']);
      if (typeof s['uppercase'] === 'boolean') this.otpUppercase.set(s['uppercase']);
      if (typeof s['separatorAfter'] === 'number') this.otpSeparatorAfter.set(s['separatorAfter']);
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.otpSize.set(s['size']);
      if (s['variant'] === 'outline' || s['variant'] === 'filled' || s['variant'] === 'subtle') {
        this.otpVariant.set(s['variant']);
      }
      if (typeof s['clearable'] === 'boolean') this.otpClearable.set(s['clearable']);
      if (typeof s['required'] === 'boolean') this.otpRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.otpReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.otpDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.otpInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.otpLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.otpWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.otpError.set(s['error']);
    } else if (sel === 'emr-menu') {
      if (s['variant'] === 'outline' || s['variant'] === 'primary' || s['variant'] === 'secondary' || s['variant'] === 'ghost') {
        this.menuVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md') this.menuSize.set(s['size']);
      if (s['align'] === 'start' || s['align'] === 'end') this.menuAlign.set(s['align']);
      if (typeof s['readOnly'] === 'boolean') this.menuReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.menuDisabled.set(s['disabled']);
    } else if (sel === 'emr-split-button') {
      if (s['variant'] === 'primary' || s['variant'] === 'secondary' || s['variant'] === 'outline' || s['variant'] === 'danger') {
        this.splitVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.splitSize.set(s['size']);
      if (s['align'] === 'start' || s['align'] === 'end') this.splitAlign.set(s['align']);
      if (typeof s['loading'] === 'boolean') this.splitLoading.set(s['loading']);
      if (typeof s['readOnly'] === 'boolean') this.splitReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.splitDisabled.set(s['disabled']);
    } else if (sel === 'emr-accordion') {
      if (Array.isArray(s['expandedIds'])) this.accordionExpandedIds.set(s['expandedIds'].map(String));
      if (typeof s['multiple'] === 'boolean') this.accordionMultiple.set(s['multiple']);
      if (s['variant'] === 'outlined' || s['variant'] === 'flush' || s['variant'] === 'card') {
        this.accordionVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md') this.accordionSize.set(s['size']);
      if (typeof s['readOnly'] === 'boolean') this.accordionReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.accordionDisabled.set(s['disabled']);
    } else if (sel === 'emr-breadcrumbs') {
      if (typeof s['maxItems'] === 'number') this.breadcrumbsMaxItems.set(s['maxItems']);
      if (typeof s['separator'] === 'string') this.breadcrumbsSeparator.set(s['separator']);
      if (s['size'] === 'sm' || s['size'] === 'md') this.breadcrumbsSize.set(s['size']);
    } else if (sel === 'emr-color-picker') {
      if (s['value'] === null || typeof s['value'] === 'string') this.colorPickerValue.set(s['value']);
      if (typeof s['allowCustomHex'] === 'boolean') this.colorPickerAllowCustomHex.set(s['allowCustomHex']);
      if (typeof s['clearable'] === 'boolean') this.colorPickerClearable.set(s['clearable']);
      if (s['size'] === 'sm' || s['size'] === 'md') this.colorPickerSize.set(s['size']);
      if (typeof s['required'] === 'boolean') this.colorPickerRequired.set(s['required']);
      if (typeof s['readOnly'] === 'boolean') this.colorPickerReadOnly.set(s['readOnly']);
      if (typeof s['disabled'] === 'boolean') this.colorPickerDisabled.set(s['disabled']);
      if (typeof s['invalid'] === 'boolean') this.colorPickerInvalid.set(s['invalid']);
      if (typeof s['labelHidden'] === 'boolean') this.colorPickerLabelHidden.set(s['labelHidden']);
      if (typeof s['warning'] === 'string') this.colorPickerWarning.set(s['warning']);
      if (typeof s['error'] === 'string') this.colorPickerError.set(s['error']);
    } else if (sel === 'emr-copy-button') {
      if (s['variant'] === 'outline' || s['variant'] === 'primary' || s['variant'] === 'secondary' || s['variant'] === 'ghost') {
        this.copyButtonVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.copyButtonSize.set(s['size']);
      if (typeof s['iconOnly'] === 'boolean') this.copyButtonIconOnly.set(s['iconOnly']);
      if (typeof s['disabled'] === 'boolean') this.copyButtonDisabled.set(s['disabled']);
      if (typeof s['copiedCount'] === 'number') this.copyButtonCount.set(s['copiedCount']);
    } else if (sel === 'emr-tabs') {
      if (typeof s['active'] === 'string') this.activeTab.set(s['active']);
      if (s['variant'] === 'underline' || s['variant'] === 'pill' || s['variant'] === 'soft') {
        this.tabsVariant.set(s['variant']);
      }
      if (s['size'] === 'sm' || s['size'] === 'md' || s['size'] === 'lg') this.tabsSize.set(s['size']);
      if (s['orientation'] === 'horizontal' || s['orientation'] === 'vertical') {
        this.tabsOrientation.set(s['orientation']);
      }
      if (typeof s['fitted'] === 'boolean') this.tabsFitted.set(s['fitted']);
      if (typeof s['disabled'] === 'boolean') this.tabsDisabled.set(s['disabled']);
    }
  }

  private resizeObserver?: ResizeObserver;
  private heightRafId = 0;

  private postPreviewHeight(): void {
    if (window.parent && window.parent !== window) {
      const root = document.querySelector('.preview-stage') ?? document.body;
      const height = Math.max(160, Math.ceil(root.scrollHeight + 16));
      window.parent.postMessage({ type: 'emr-preview-height', height }, '*');
    }
  }

  private schedulePreviewHeight(): void {
    if (this.heightRafId) cancelAnimationFrame(this.heightRafId);
    this.heightRafId = requestAnimationFrame(() => {
      this.heightRafId = 0;
      this.postPreviewHeight();
    });
  }

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const sel = params.get('selector');
    const theme = params.get('theme');
    if (sel) this.selector.set(sel);
    if (theme === 'dark' || theme === 'light') this.applyTheme(theme);
    const urlState: Record<string, unknown> = {};
    for (const [k, raw] of params.entries()) {
      if (k === 'selector' || k === 'theme') continue;
      if (raw === 'true') urlState[k] = true;
      else if (raw === 'false') urlState[k] = false;
      else urlState[k] = raw;
    }
    if (Object.keys(urlState).length > 0) {
      this.applyIncomingState(sel || this.selector(), urlState);
    }
    window.addEventListener('message', this.onMessage);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.schedulePreviewHeight());
      const stage = document.querySelector('.preview-stage');
      if (stage) this.resizeObserver.observe(stage);
      this.resizeObserver.observe(document.body);
    }
    requestAnimationFrame(() => this.postPreviewHeight());
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage);
    this.resizeObserver?.disconnect();
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.classList.remove('emr-theme-light', 'emr-theme-dark');
    root.classList.add(theme === 'dark' ? 'emr-theme-dark' : 'emr-theme-light');
  }
}
