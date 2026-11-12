import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  type EmrAccordionItem,
  type EmrBreadcrumbItem,
  type EmrDateRangePreset,
  type EmrMenuItem,
  type EmrTreeNode,
  type EmrUploadedImageItem,
} from '@drguptavivek/emr-controller';
import { EmrImageFieldComponent } from '../fields/emr-contract-fields.component';
import {
  EmrCheckboxGroupComponent,
  EmrSegmentedControlComponent,
  EmrToggleGroupComponent,
} from '../primitives/emr-action-controls.component';
import {
  EmrCheckboxComponent,
  EmrRadioGroupComponent,
  EmrToggleComponent,
} from '../primitives/emr-choice.component';
import {
  EmrImageCropperComponent,
  EmrImageUploadComponent,
  EmrImageViewerComponent,
} from '../primitives/emr-image.component';
import { EmrSelectComponent } from '../primitives/emr-inputs.component';
import { EmrSearchSelectComponent } from '../primitives/emr-search-select.component';
import {
  EmrTreeSelectComponent,
  EmrTreeViewComponent,
} from '../primitives/emr-tree.component';
import {
  EmrMaskedInputComponent,
  EmrOtpInputComponent,
  EmrRangeSliderComponent,
  EmrSliderComponent,
} from '../primitives/emr-wave2-formatted.component';
import {
  EmrComboboxComponent,
  EmrDateRangeInputComponent,
  EmrTagInputComponent,
} from '../primitives/emr-wave2-inputs.component';
import {
  EmrAccordionComponent,
  EmrBreadcrumbsComponent,
  EmrColorPickerComponent,
  EmrCopyButtonComponent,
  EmrMenuComponent,
  EmrSplitButtonComponent,
} from '../primitives/emr-wave2-navigation.component';

const SAMPLE_SVG_FUNDUS =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">' +
      '<rect width="480" height="360" fill="#172026"/>' +
      '<circle cx="240" cy="180" r="145" fill="#7c2d12" stroke="#f59e0b" stroke-width="4"/>' +
      '<circle cx="195" cy="175" r="24" fill="#fde68a"/>' +
      '<path d="M195 175 Q260 120 340 105 M195 175 Q265 235 345 250" stroke="#991b1b" stroke-width="5" fill="none"/>' +
      '</svg>',
  );

const ANATOMY_TREE: readonly EmrTreeNode[] = [
  {
    id: 'ant-seg',
    label: 'Anterior segment',
    description: 'OD / OS',
    children: [
      { id: 'cornea', label: 'Cornea', description: 'Epithelium, stroma, endothelium' },
      { id: 'ac', label: 'Anterior chamber', description: 'Depth, cells & flare' },
      { id: 'lens', label: 'Crystalline lens / IOL', description: 'LOCS III grading' },
    ],
  },
  {
    id: 'post-seg',
    label: 'Posterior segment',
    children: [
      { id: 'disc', label: 'Optic nerve head', description: 'CDR & neuroretinal rim' },
      { id: 'macula', label: 'Macula & fovea' },
      { id: 'periphery', label: 'Peripheral retina' },
    ],
  },
];

const meta: Meta = {
  title: 'Foundations / Wave2 Primitives',
  decorators: [
    moduleMetadata({
      imports: [
        EmrSelectComponent,
        EmrSearchSelectComponent,
        EmrRadioGroupComponent,
        EmrCheckboxComponent,
        EmrToggleComponent,
        EmrSegmentedControlComponent,
        EmrCheckboxGroupComponent,
        EmrToggleGroupComponent,
        EmrTreeViewComponent,
        EmrTreeSelectComponent,
        EmrImageViewerComponent,
        EmrImageCropperComponent,
        EmrImageUploadComponent,
        EmrImageFieldComponent,
        EmrDateRangeInputComponent,
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
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const ChoiceAndTree: Story = {
  render: () => ({
    props: {
      groupedRoutes: [
        { value: 'topical-od', label: 'Topical eye drops (OD)', group: 'Ophthalmic' },
        { value: 'intravitreal', label: 'Intravitreal injection', group: 'Ophthalmic' },
        { value: 'po', label: 'Oral (PO)', group: 'Systemic' },
        { value: 'iv', label: 'Intravenous (IV)', group: 'Systemic' },
      ],
      radioOptions: [
        { value: 'routine', label: 'Routine', description: 'Next available OPD slot' },
        { value: 'urgent', label: 'Urgent (24h)', description: 'Same/next-day review' },
        { value: 'stat', label: 'STAT / Emergency', description: 'Immediate triage' },
      ],
      symptomOptions: [
        { value: 'blur', label: 'Blurred vision' },
        { value: 'pain', label: 'Ocular pain' },
        { value: 'photophobia', label: 'Photophobia' },
        { value: 'none', label: 'No ocular symptoms' },
      ],
      toggleGroupOptions: [
        { value: 'sms', label: 'SMS appointment reminders', description: '24h prior to visit' },
        { value: 'whatsapp', label: 'WhatsApp prescription PDF', description: 'Verified mobile number' },
        { value: 'portal', label: 'Patient portal release', description: 'Signed diagnostic reports' },
      ],
      anatomyTree: ANATOMY_TREE,
    },
    template: `
      <div class="emr-stack">
        <div class="emr-story-grid emr-story-grid--two">
          <emr-select
            controlId="w2-grouped-select"
            label="Administration route (grouped & clearable)"
            [options]="groupedRoutes"
            value="topical-od"
            [clearable]="true"
          />
          <emr-search-select
            controlId="w2-local-search-select"
            label="Local searchable select"
            filterMode="local"
            [options]="groupedRoutes"
            value="intravitreal"
            [clearable]="true"
          />
        </div>
        <emr-radio-group
          name="w2-triage-radio"
          label="Horizontal card radios with clear button"
          orientation="horizontal"
          variant="card"
          [clearable]="true"
          value="urgent"
          [options]="radioOptions"
        />
        <emr-checkbox-group
          controlId="w2-symptom-checks"
          label="Presenting symptoms (grid + select-all + exclusive)"
          orientation="grid"
          [columns]="2"
          variant="card"
          [showSelectAll]="true"
          [exclusiveValues]="['none']"
          [options]="symptomOptions"
          [value]="['blur', 'photophobia']"
        />
        <emr-toggle-group
          controlId="w2-comm-toggles"
          label="Communication preferences"
          orientation="grid"
          [columns]="2"
          variant="card"
          [options]="toggleGroupOptions"
          [value]="['sms', 'portal']"
        />
        <div class="emr-story-grid emr-story-grid--two">
          <emr-tree-view
            controlId="w2-anatomy-tree"
            label="Ocular examination hierarchy"
            [nodes]="anatomyTree"
            [multiple]="true"
            [searchable]="true"
            [showExpandControls]="true"
            [values]="['cornea', 'macula']"
            [expandedIds]="['ant-seg', 'post-seg']"
          />
          <emr-tree-select
            controlId="w2-anatomy-tree-select"
            label="Primary anatomical site (tree select)"
            [nodes]="anatomyTree"
            value="macula"
            displayMode="path"
            [clearable]="true"
          />
        </div>
      </div>
    `,
  }),
};

export const ImageSuite: Story = {
  render: () => {
    const sampleItems: readonly EmrUploadedImageItem[] = [
      {
        id: 'img-fundus-od',
        name: 'fundus-od-baseline.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 18420,
        src: SAMPLE_SVG_FUNDUS,
        caption: 'OD baseline colour fundus',
      },
    ];
    return {
      props: {
        fundusSrc: SAMPLE_SVG_FUNDUS,
        presets: DEFAULT_ASPECT_PRESETS,
        sampleItems,
        imageFieldModel: {
          fieldId: 'slit-lamp-photos',
          label: 'Slit-lamp & fundus photographs',
          hint: 'Upload, inspect fullscreen (pan/zoom/rotate), or crop clinical photos.',
          items: sampleItems,
          allowCamera: true,
          multiple: true,
          statusOptions: [
            { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' as const },
            { value: 'unable-to-assess', label: 'Media haze / unable', tone: 'warning' as const },
          ],
        },
      },
      template: `
        <div class="emr-stack">
          <div class="emr-story-grid emr-story-grid--two">
            <emr-image-viewer
              controlId="w2-image-viewer"
              label="Fundus photograph viewer (pan / zoom / rotate / fullscreen)"
              [src]="fundusSrc"
              alt="Simulated OD fundus diagram"
              caption="OD posterior pole — 45° field"
            />
            <emr-image-cropper
              controlId="w2-image-cropper"
              label="Optic disc ROI cropper"
              [src]="fundusSrc"
              alt="Optic disc region crop"
              [aspectPresets]="presets"
            />
          </div>
          <emr-image-upload
            controlId="w2-image-upload"
            label="Anterior segment photo upload"
            [items]="sampleItems"
            [allowCamera]="true"
            hint="Supports preview, fullscreen inspection, rotate, pan, zoom, and crop"
          />
          <emr-image-field
            controlId="w2-image-field"
            [model]="imageFieldModel"
          />
        </div>
      `,
    };
  },
};

export const TemporalAndText: Story = {
  render: () => {
    const presets: readonly EmrDateRangePreset[] = [
      { id: '7d', label: 'Last 7 days', range: { start: '2026-03-08', end: '2026-03-15' } },
      { id: '30d', label: 'Last 30 days', range: { start: '2026-02-14', end: '2026-03-15' } },
    ];
    return {
      props: {
        rangeValue: { start: '2026-03-08', end: '2026-03-15' },
        presets,
        chiefComplaints: [
          { value: 'Reduced distance vision', label: 'Reduced distance vision', group: 'Vision' },
          { value: 'Metamorphopsia', label: 'Metamorphopsia', group: 'Vision' },
          { value: 'Foreign body sensation', label: 'Foreign body sensation', group: 'Surface' },
        ],
      },
      template: `
        <div class="emr-stack">
          <emr-date-range-input
            controlId="w2-date-range"
            label="Audit & encounter window"
            [value]="rangeValue"
            [presets]="presets"
            [clearable]="true"
          />
          <div class="emr-story-grid emr-story-grid--two">
            <emr-combobox
              controlId="w2-combobox"
              label="Chief complaint (free-solo combobox)"
              [options]="chiefComplaints"
              value="Gradual glare at night"
              [clearable]="true"
              hint="Choose a standard complaint or enter free text"
            />
            <emr-tag-input
              controlId="w2-tag-input"
              label="Specimen & batch labels"
              [value]="['IOL-SN-88412', 'OVD-LOT-2209']"
              [suggestions]="['BSS-LOT-901', 'TRYPAN-04']"
              [clearable]="true"
            />
          </div>
        </div>
      `,
    };
  },
};

export const FormattedAndSliders: Story = {
  render: () => ({
    props: {
      zoomMarks: [
        { value: 50, label: '50%' },
        { value: 100, label: '100%' },
        { value: 200, label: '200%' },
      ],
    },
    template: `
      <div class="emr-story-grid emr-story-grid--two">
        <emr-slider
          controlId="w2-slider"
          label="OCT overlay opacity"
          [value]="65"
          [min]="0"
          [max]="100"
          [step]="5"
          unit="%"
          [clearable]="true"
        />
        <emr-range-slider
          controlId="w2-range-slider"
          label="Target IOP therapeutic band"
          [value]="[10, 16]"
          [min]="6"
          [max]="30"
          [minDistance]="2"
          unit="mmHg"
        />
        <emr-masked-input
          controlId="w2-masked-abha"
          label="ABHA health identifier"
          mask="99-9999-9999-9999"
          value="91-2847-5510-3921"
          [clearable]="true"
          hint="14-digit formatted national health ID"
        />
        <emr-otp-input
          controlId="w2-otp-consent"
          label="Patient consent verification OTP"
          value="482910"
          [length]="6"
          hint="6-digit SMS verification code"
        />
      </div>
    `,
  }),
};

export const NavigationAndActions: Story = {
  render: () => {
    const menuItems: readonly EmrMenuItem[] = [
      { id: 'print-rx', label: 'Print prescription', shortcut: '⌘P' },
      { id: 'export-fhir', label: 'Export FHIR Bundle' },
      { id: 'div-1', label: '', dividerBefore: true, disabled: true },
      { id: 'strike-out', label: 'Mark entered-in-error', tone: 'danger' },
    ];
    const signItems: readonly EmrMenuItem[] = [
      { id: 'sign-lock', label: 'Sign & lock encounter' },
      { id: 'cosign', label: 'Sign & request consultant co-sign' },
      { id: 'draft', label: 'Save unsigned draft' },
    ];
    const accordionItems: readonly EmrAccordionItem[] = [
      {
        id: 'postop-drops',
        title: 'Post-operative cataract drop regimen',
        subtitle: 'Weeks 1–4 taper instructions',
        badge: { label: 'Standard', tone: 'info' },
        content: 'Prednisolone acetate 1% 6x/day week 1, 4x/day week 2, 2x/day week 3, 1x/day week 4; Moxifloxacin 0.5% QID for 2 weeks.',
      },
      {
        id: 'red-flags',
        title: 'Emergency return precautions (RSVP)',
        subtitle: 'Redness, Sensitivity, Vision drop, Pain',
        content: 'Return immediately to the 24h eye casualty if increasing pain, sudden vision loss, or lid swelling develops.',
      },
    ];
    const breadcrumbs: readonly EmrBreadcrumbItem[] = [
      { id: 'home', label: 'Outpatient Clinic' },
      { id: 'retina', label: 'Retina Service' },
      { id: 'patient', label: 'MRN-2026-0419' },
      { id: 'oct', label: 'Macular OCT Comparison' },
    ];
    return {
      props: {
        menuItems,
        signItems,
        accordionItems,
        breadcrumbs,
        swatches: DEFAULT_CLINICAL_COLOR_SWATCHES,
      },
      template: `
        <div class="emr-stack">
          <emr-breadcrumbs
            controlId="w2-breadcrumbs"
            [items]="breadcrumbs"
          />
          <div class="emr-button-row">
            <emr-menu
              controlId="w2-overflow-menu"
              label="Encounter actions"
              [items]="menuItems"
            />
            <emr-split-button
              controlId="w2-split-sign"
              label="Sign encounter"
              [items]="signItems"
            />
            <emr-copy-button
              controlId="w2-copy-mrn"
              value="MRN-2026-0419"
              label="Copy MRN"
            />
          </div>
          <emr-accordion
            controlId="w2-accordion"
            [items]="accordionItems"
            [expandedIds]="['postop-drops']"
            [multiple]="true"
          />
          <emr-color-picker
            controlId="w2-color-picker"
            label="Retinal annotation pen colour"
            [swatches]="swatches"
            value="#dc2626"
            [allowCustomHex]="true"
            [clearable]="true"
          />
        </div>
      `,
    };
  },
};
