import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import type {
  AddressFieldViewModel,
  AttachmentFieldViewModel,
  DurationFieldViewModel,
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
  EmrAddressFieldComponent,
  EmrMacroTextFieldComponent,
  EmrPhoneInputComponent,
} from '../fields/emr-clinical-fields.component';
import {
  EmrAttachmentFieldComponent,
  EmrDurationInputComponent,
  EmrPairedFieldComponent,
  EmrPartialDateFieldComponent,
  EmrRangeFieldComponent,
  EmrScaleFieldComponent,
  EmrSignatureCaptureFieldComponent,
} from '../fields/emr-contract-fields.component';
import {
  EmrLateralityFieldComponent,
  EmrRefractionFieldComponent,
  EmrVisualAcuityFieldComponent,
} from '../fields/emr-specialty-fields.component';

const meta: Meta = {
  title: 'EMR / Fields / Clinical Building Blocks',
  decorators: [
    moduleMetadata({
      imports: [
        EmrScaleFieldComponent,
        EmrPartialDateFieldComponent,
        EmrAttachmentFieldComponent,
        EmrPairedFieldComponent,
        EmrDurationInputComponent,
        EmrRangeFieldComponent,
        EmrSignatureCaptureFieldComponent,
        EmrPhoneInputComponent,
        EmrAddressFieldComponent,
        EmrMacroTextFieldComponent,
        EmrLateralityFieldComponent,
        EmrVisualAcuityFieldComponent,
        EmrRefractionFieldComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj;

const SCALE_MODEL: ScaleFieldViewModel = {
  label: 'Post-operative ocular pain (NRS 0–10)',
  variant: 'likert',
  value: 3,
  min: 0,
  max: 10,
  anchors: { minLabel: 'No pain', maxLabel: 'Worst imaginable pain' },
  tone: 'warning',
  hint: 'Ask patient at rest before topical anaesthetic drops',
};

const PARTIAL_DATE_MODEL: PartialDateFieldViewModel = {
  label: 'Onset of gradual blurring',
  value: { precision: 'month', value: '2025-11' },
  hint: 'Record year or year-month when exact day is unknown',
};

export const ScalesAndDates: Story = {
  render: () => ({
    props: { scaleModel: SCALE_MODEL, partialDateModel: PARTIAL_DATE_MODEL },
    template: `
      <div class="emr-stack">
        <emr-scale-field [model]="scaleModel" />
        <emr-partial-date-field [model]="partialDateModel" />
      </div>
    `,
  }),
};

const ATTACHMENT_MODEL: AttachmentFieldViewModel = {
  label: 'Prior B-scan & referral reports',
  items: [
    {
      id: 'att-1',
      title: 'Referral-letter-district-hospital.pdf',
      contentType: 'application/pdf',
      sizeBytes: 348_160,
      statusBadge: { label: 'Verified', tone: 'success' },
    },
  ],
  accept: '.pdf,image/png,image/jpeg',
  multiple: true,
  allowCamera: true,
};

const SIGNATURE_MODEL: SignatureCaptureViewModel = {
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
  hint: 'Sign inside the box with stylus or finger',
};

export const AttachmentsAndSignatures: Story = {
  render: () => ({
    props: { attachmentModel: ATTACHMENT_MODEL, signatureModel: SIGNATURE_MODEL },
    template: `
      <div class="emr-story-grid emr-story-grid--two">
        <emr-attachment-field [model]="attachmentModel" />
        <emr-signature-capture-field [model]="signatureModel" />
      </div>
    `,
  }),
};

const PAIRED_BP_MODEL: PairedFieldViewModel = {
  label: 'Sitting blood pressure',
  mode: 'integer',
  firstLabel: 'Systolic',
  secondLabel: 'Diastolic',
  separator: '/',
  unit: 'mmHg',
  value: { first: 128, second: 78 },
};

const DURATION_MODEL: DurationFieldViewModel = {
  label: 'Topical steroid course duration',
  value: { amount: 4, unit: 'wk' },
  unitOptions: [
    { value: 'd', label: 'days' },
    { value: 'wk', label: 'weeks' },
    { value: 'mo', label: 'months' },
  ],
};

const RANGE_MODEL: RangeFieldViewModel = {
  label: 'Target intraocular pressure range (OD)',
  kind: 'number',
  value: { low: 10, high: 14 },
  unit: 'mmHg',
};

export const PairedAndMeasurements: Story = {
  render: () => ({
    props: { pairedModel: PAIRED_BP_MODEL, durationModel: DURATION_MODEL, rangeModel: RANGE_MODEL },
    template: `
      <div class="emr-story-grid emr-story-grid--two">
        <emr-paired-field [model]="pairedModel" />
        <emr-duration-input [model]="durationModel" />
        <emr-range-field [model]="rangeModel" />
      </div>
    `,
  }),
};

const PHONE_MODEL: PhoneFieldViewModel = {
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
};

const ADDRESS_MODEL: AddressFieldViewModel = {
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
};

const MACRO_MODEL: MacroTextFieldViewModel = {
  label: 'Anterior segment findings',
  value: 'Lids and lashes normal. Conjunctiva quiet. .clearcornea',
  suggestionsOpen: true,
  suggestions: [
    {
      trigger: '.clearcornea',
      label: 'Clear cornea, deep quiet AC',
      expansionPreview: 'Cornea clear, anterior chamber deep and quiet, iris normal pattern.',
    },
  ],
  hint: 'Type . or / to expand clinical macros',
};

export const DemographicsAndMacros: Story = {
  render: () => ({
    props: { phoneModel: PHONE_MODEL, addressModel: ADDRESS_MODEL, macroModel: MACRO_MODEL },
    template: `
      <div class="emr-stack">
        <emr-phone-input [model]="phoneModel" />
        <emr-address-field [model]="addressModel" />
        <emr-macro-text-field [model]="macroModel" />
      </div>
    `,
  }),
};

const LATERALITY_MODEL: LateralityFieldViewModel = {
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
};

const VA_MODEL: VisualAcuityFieldViewModel = {
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
};

const REFRACTION_MODEL: RefractionFieldViewModel = {
  label: 'Subjective refraction (OD)',
  eye: 'OD',
  value: { sphere: -2.25, cylinder: -0.75, axis: 95, nearAdd: 2.0 },
  showNearAdd: true,
  formattedSummary: '-2.25 / -0.75 × 95°  Add +2.00 D (SE -2.63 D)',
};

export const OphthalmologyFields: Story = {
  render: () => ({
    props: {
      lateralityModel: LATERALITY_MODEL,
      vaModel: VA_MODEL,
      refractionModel: REFRACTION_MODEL,
    },
    template: `
      <div class="emr-stack">
        <emr-laterality-field [model]="lateralityModel" />
        <emr-visual-acuity-field [model]="vaModel" />
        <emr-refraction-field [model]="refractionModel" />
      </div>
    `,
  }),
};
