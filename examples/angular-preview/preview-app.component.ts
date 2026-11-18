import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import type {
  AttestationIntent,
  AttestationViewModel,
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  EmrBadge,
  EmrCodedValue,
  EmrOption,
  EmrSegmentedOption,
  EmrSegmentedOrientation,
  EmrSegmentedShape,
  EmrSegmentedSize,
  EmrSegmentedVariant,
  EmrSelectSize,
  EmrSelectValue,
  EmrSelectVariant,
  EmrStatTileModel,
  EmrTone,
  IdentifierEntryIntent,
  IdentifierEntryView,
  PartialDateFieldIntent,
  PartialDateFieldViewModel,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  ScheduleAmountMode,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
} from '@drguptavivek/emr-controller';
import {
  EmrAlertComponent,
  EmrAttachmentFieldComponent,
  EmrAttestationComponent,
  EmrBadgeComponent,
  EmrButtonComponent,
  EmrCardComponent,
  EmrCheckboxComponent,
  EmrChipComponent,
  EmrCodedInputComponent,
  EmrColumnsComponent,
  EmrDateInputComponent,
  EmrDateTimeInputComponent,
  EmrFieldFrameComponent,
  EmrFieldValueRowComponent,
  EmrIdentifierEntryComponent,
  EmrLikertComponent,
  EmrNumberInputComponent,
  EmrPairedInputComponent,
  EmrCheckboxGroupComponent,
  EmrComboboxComponent,
  EmrPartialDateFieldComponent,
  EmrQuantityInputComponent,
  EmrRadioGroupComponent,
  EmrScaleFieldComponent,
  EmrScheduleSlotPickerComponent,
  EmrSearchSelectComponent,
  EmrSegmentedControlComponent,
  EmrSelectComponent,
  EmrSeparatorComponent,
  EmrStageStepperComponent,
  EmrStatTileComponent,
  EmrStateMessageComponent,
  EmrStatusCellComponent,
  EmrTabsComponent,
  EmrTagInputComponent,
  EmrTextInputComponent,
  EmrTimeInputComponent,
  EmrToggleComponent,
  EmrTypedFieldComponent,
  EmrVasComponent,
} from '../../packages/emr-ui/src/public-api';

@Component({
  selector: 'emr-angular-preview',
  standalone: true,
  imports: [
    EmrButtonComponent,
    EmrTextInputComponent,
    EmrNumberInputComponent,
    EmrDateInputComponent,
    EmrDateTimeInputComponent,
    EmrTimeInputComponent,
    EmrSelectComponent,
    EmrQuantityInputComponent,
    EmrPairedInputComponent,
    EmrCheckboxComponent,
    EmrCheckboxGroupComponent,
    EmrToggleComponent,
    EmrRadioGroupComponent,
    EmrSegmentedControlComponent,
    EmrSearchSelectComponent,
    EmrComboboxComponent,
    EmrTagInputComponent,
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
    EmrScaleFieldComponent,
    EmrPartialDateFieldComponent,
    EmrAttachmentFieldComponent,
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
          label="Ocular surface discomfort score (0–10)"
          [min]="0"
          [max]="10"
          [anchors]="likertAnchors"
          [tone]="likertVal() !== null && likertVal()! >= 7 ? 'danger' : 'info'"
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
          label="Post-operative pain VAS (0.0–10.0)"
          [min]="0"
          [max]="10"
          [step]="0.5"
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
          [valueText]="vasVal() === null ? undefined : vasVal() + ' / 10'"
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
  readonly pairedLeft = signal('6/6');
  readonly pairedRight = signal('6/9');
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
  readonly likertClearable = signal(false);
  readonly likertFullWidth = signal(false);
  readonly likertDisabled = signal(false);
  readonly likertRequired = signal(false);
  readonly likertAnchors = [
    { value: 0, label: 'None' },
    { value: 10, label: 'Severe' },
  ];
  readonly vasVal = signal<number | null>(3.5);
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
      if (typeof left === 'string') this.pairedLeft.set(left);
      if (typeof right === 'string') this.pairedRight.set(right);
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
