import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  EmrCheckboxGroupComponent,
  EmrIconButtonComponent,
  EmrSegmentedControlComponent,
} from '../primitives/emr-action-controls.component';
import { EmrToastComponent } from '../primitives/emr-feedback.component';
import {
  EmrDialogComponent,
  EmrPopoverComponent,
  EmrTooltipComponent,
} from '../primitives/emr-overlays.component';
import { EmrPaginationComponent } from '../primitives/emr-pagination.component';
import {
  EmrFileTriggerComponent,
  EmrNumericStepperComponent,
  EmrPasswordInputComponent,
  EmrSearchInputComponent,
} from '../primitives/emr-specialized-inputs.component';
import {
  EmrAvatarComponent,
  EmrProgressBarComponent,
  EmrSkeletonComponent,
  EmrSpinnerComponent,
} from '../primitives/emr-status-indicators.component';
import { EmrTextareaComponent } from '../primitives/emr-textarea.component';

const meta: Meta = {
  title: 'Foundations / Building Blocks',
  decorators: [
    moduleMetadata({
      imports: [
        EmrTextareaComponent,
        EmrIconButtonComponent,
        EmrSegmentedControlComponent,
        EmrCheckboxGroupComponent,
        EmrSearchInputComponent,
        EmrPasswordInputComponent,
        EmrNumericStepperComponent,
        EmrFileTriggerComponent,
        EmrPaginationComponent,
        EmrDialogComponent,
        EmrPopoverComponent,
        EmrTooltipComponent,
        EmrProgressBarComponent,
        EmrSpinnerComponent,
        EmrSkeletonComponent,
        EmrAvatarComponent,
        EmrToastComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const TextAndInputs: Story = {
  render: () => ({
    template: `
      <div class="emr-story-grid emr-story-grid--two">
        <emr-textarea
          controlId="demo-history-notes"
          label="History of present illness"
          value="Gradual painless reduction of distance vision in the right eye over 8 months."
          [rows]="3"
          [maxLength]="500"
          hint="Recorded in patient's own words"
        />
        <emr-search-input
          controlId="demo-roster-filter"
          label="Filter outpatient queue"
          value="UHID-2026"
          placeholder="Search MRN or patient name"
        />
        <emr-password-input
          controlId="demo-witness-pin"
          label="Controlled-drug witness passphrase"
          value="correct-horse-battery"
          hint="Required for Schedule X administration witness"
        />
        <emr-numeric-stepper
          controlId="demo-refills"
          label="Authorised refills"
          [value]="2"
          [min]="0"
          [max]="6"
          [step]="1"
          unit="refills"
        />
      </div>
    `,
  }),
};

export const ChoiceAndSelection: Story = {
  render: () => ({
    props: {
      eyeOptions: [
        { value: 'OD', label: 'OD (Right)' },
        { value: 'OS', label: 'OS (Left)' },
        { value: 'OU', label: 'OU (Both)' },
      ],
      prepOptions: [
        { value: 'consent', label: 'Signed surgical consent verified' },
        { value: 'site', label: 'Operative eye marked above brow' },
        { value: 'dilation', label: 'Tropicamide 0.8% + phenylephrine 5% instilled' },
      ],
      selectedPrep: ['consent', 'site'],
    },
    template: `
      <div class="emr-stack">
        <emr-segmented-control
          controlId="demo-eye-segment"
          label="Operative eye"
          [options]="eyeOptions"
          value="OD"
        />
        <emr-checkbox-group
          controlId="demo-preop-prep"
          label="Pre-operative preparation checks"
          [options]="prepOptions"
          [value]="selectedPrep"
        />
      </div>
    `,
  }),
};

export const ActionsAndNavigation: Story = {
  render: () => ({
    template: `
      <div class="emr-stack">
        <div class="emr-button-row">
          <emr-icon-button ariaLabel="Print prescription" icon="⎙" variant="outline" />
          <emr-icon-button ariaLabel="Pin patient banner" icon="📌" variant="secondary" [pressed]="true" />
          <emr-icon-button ariaLabel="Remove draft" icon="✕" variant="danger" />
        </div>
        <emr-pagination
          controlId="demo-queue-pager"
          [page]="2"
          [pageSize]="20"
          [totalItems]="94"
          [pageSizeOptions]="[10, 20, 50]"
        />
      </div>
    `,
  }),
};

export const FeedbackAndOverlays: Story = {
  render: () => ({
    props: {
      toastModel: {
        tone: 'warning' as const,
        message: 'High IOP recorded (28 mmHg OD) — confirm applanation time.',
        actionLabel: 'Review',
        dismissLabel: 'Dismiss',
      },
    },
    template: `
      <div class="emr-stack">
        <emr-toast [model]="toastModel" />
        <div class="emr-button-row">
          <emr-tooltip content="Intraocular pressure measured by Goldmann applanation">
            <button type="button" class="emr-button emr-button--outline">GAT abbreviation</button>
          </emr-tooltip>
          <emr-popover label="Reference range details" [open]="true">
            <button popoverTrigger type="button" class="emr-button emr-button--secondary">IOP reference</button>
            <div class="emr-stack emr-stack--compact">
              <strong>Reference range</strong>
              <span>10–21 mmHg</span>
            </div>
          </emr-popover>
        </div>
        <emr-dialog
          [open]="false"
          title="Confirm allergy override"
          description="Document clinical rationale before signing order."
        >
          <p>Override confirmation preview.</p>
        </emr-dialog>
      </div>
    `,
  }),
};

export const StatusAndMedia: Story = {
  render: () => ({
    template: `
      <div class="emr-stack">
        <emr-progress-bar
          controlId="demo-sync-progress"
          label="Offline encounter bundle sync"
          [value]="72"
          [max]="100"
          tone="info"
        />
        <div class="emr-button-row">
          <emr-spinner label="Searching SNOMED CT…" size="sm" />
          <emr-avatar name="Dr Meera Nair" tone="info" />
          <emr-avatar name="Raghav Sharma" initials="RS" tone="success" size="lg" />
        </div>
        <emr-skeleton variant="line" [lines]="3" />
        <emr-file-trigger
          controlId="demo-oct-upload"
          label="Attach external OCT PDF or DICOM summary"
          accept=".pdf,image/png,image/jpeg"
          [multiple]="true"
          hint="Maximum 25 MB per file"
        />
      </div>
    `,
  }),
};
