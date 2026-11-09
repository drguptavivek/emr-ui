import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  IdentifierCheckViewModel, IdentifierEntryView, LinkCardsViewModel, PatientIdentityViewModel
} from '@drguptavivek/emr-controller';
import { EmrIdentifierCheckPromptComponent } from '../domain/emr-identifier-check-prompt.component';
import { EmrLinkCardsComponent } from '../domain/emr-link-cards.component';
import { EmrPatientIdentityCardComponent } from '../domain/emr-patient-identity-card.component';
import { EmrIdentifierEntryComponent } from '../fields/emr-identifier-entry.component';

const meta: Meta = {
  title: 'EMR / Identity',
  decorators: [moduleMetadata({ imports: [EmrIdentifierEntryComponent, EmrPatientIdentityCardComponent, EmrIdentifierCheckPromptComponent, EmrLinkCardsComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Patient identity by identifier: a scan-or-type entry field, an identity card (full and compact), a duplicate-check prompt and a link-several-cards flow. The app supplies every string and every rule (normalising, duplicate detection, what may be confirmed); components render and emit one intent stream. All data is synthetic.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

const wrap = (inner: string, width = 560) => `<div class="emr-story-surface"><div style="max-width: ${width}px">${inner}</div></div>`;

// ---- Entry ----
const entry = (extra: Partial<IdentifierEntryView> = {}): IdentifierEntryView => ({ label: 'Patient ID or card', value: '', ...extra });
const renderEntry = (model: IdentifierEntryView) => ({ props: { model }, template: wrap('<emr-identifier-entry [model]="model" />', 420) });

export const EntryPlain: Story = { render: () => renderEntry(entry({ hint: 'Type or scan the number on the card' })) };
export const EntryNormalised: Story = { render: () => renderEntry(entry({ value: '172600123', normalisedValue: '17-26-000123' })) };
export const EntryError: Story = { render: () => renderEntry(entry({ value: '17-26-12', error: 'This number is too short' })) };
export const EntryWarning: Story = { render: () => renderEntry(entry({ value: '900000001', warning: 'This looks like a UHID, not a card number' })) };
export const EntryTypePicker: Story = {
  render: () => renderEntry(entry({
    value: '900000001', typeOptions: [{ id: 'pec', label: 'PEC card' }, { id: 'uhid', label: 'UHID' }], selectedType: 'uhid'
  }))
};
export const EntryReadOnly: Story = { render: () => renderEntry(entry({ value: '17-26-000123', readOnly: true })) };

// ---- Identity card ----
const patient = (extra: Partial<PatientIdentityViewModel> = {}): PatientIdentityViewModel => ({
  name: 'Test Patient A', ageLabel: '34 y', sexLabel: 'Female',
  identifiers: [
    { system: 'pec', label: 'PEC card', display: '17-26-000123', statusBadge: { label: 'Verified', tone: 'success' } },
    { system: 'uhid', label: 'UHID', display: '900000001' },
    { system: 'abha', label: 'ABHA', display: '00-0000-0000-0000', statusBadge: { label: 'Under review', tone: 'warning' } }
  ],
  phone: '+00 00000 00000', centreName: 'Test Centre', lastVisitDate: 'Last visit 10 Oct 2026', aliases: ['Patient A Test'],
  addableSystems: [{ system: 'aadhaar_ref', label: 'Other card' }],
  ...extra
});
const alerts: PatientIdentityViewModel['alerts'] = [
  { id: 'phone', text: 'Phone number needs correcting', tone: 'warning', actionLabel: 'Correct phone' },
  { id: 'merge', text: 'Merge pending with another record', tone: 'danger' }
];
const renderCard = (model: PatientIdentityViewModel, mode: 'full' | 'compact', width = 560) => ({
  props: { model, mode }, template: wrap('<emr-patient-identity-card [model]="model" [mode]="mode" />', width)
});

export const CardFull: Story = { render: () => renderCard(patient(), 'full') };
export const CardFullWithAlerts: Story = { render: () => renderCard(patient({ alerts }), 'full') };
export const CardCompact: Story = { render: () => renderCard(patient(), 'compact') };
export const CardCompactWithAlerts: Story = { render: () => renderCard(patient({ alerts }), 'compact', 360) };

// ---- Check prompt ----
const candidate = { ...patient({ name: 'Test Patient B', alerts: undefined }), id: 'cand-1' };
const check = (extra: Partial<IdentifierCheckViewModel>): IdentifierCheckViewModel => ({
  identifier: { label: 'PEC card', display: '17-26-000123' }, outcome: 'ok', findings: [], canConfirm: true, ...extra
});
const renderCheck = (model: IdentifierCheckViewModel) => ({ props: { model }, template: wrap('<emr-identifier-check-prompt [model]="model" />') });

export const CheckBlocked: Story = {
  render: () => renderCheck(check({
    outcome: 'blocked', canConfirm: false,
    findings: [{ id: 'f1', kind: 'on_other_patient', message: 'This card is already linked to another patient',
      evidence: [{ label: 'Linked on', value: '03 Mar 2026' }, { label: 'Centre', value: 'Test Centre' }], candidate }]
  }))
};
export const CheckWarningsNotAcknowledged: Story = {
  render: () => renderCheck(check({
    outcome: 'warnings', canConfirm: false, canAddAsAdditional: true, canReplaceExisting: true,
    findings: [
      { id: 'f1', kind: 'demographic_mismatch', message: 'Age on the card differs from the record', evidence: [{ label: 'Record', value: '34 y' }, { label: 'Card', value: '43 y' }] },
      { id: 'f2', kind: 'same_type_exists', message: 'This patient already has a PEC card', evidence: [{ label: 'Existing', value: '17-26-000099' }] }
    ]
  }))
};
export const CheckWarningsAcknowledged: Story = {
  render: () => renderCheck(check({
    outcome: 'warnings', canConfirm: true,
    findings: [{ id: 'f1', kind: 'possible_duplicate', message: 'A similar record exists', evidence: [{ label: 'Name', value: 'Test Patient B' }], candidate, acknowledged: true }]
  }))
};
export const CheckOk: Story = { render: () => renderCheck(check({})) };

// ---- Link cards ----
const links: LinkCardsViewModel = {
  patient: patient({ alerts: undefined }),
  entry: entry({ label: 'Next card', value: '17-26-000125' }),
  cards: [
    { id: 'c1', display: '17-26-000123', state: 'unused', statusBadge: { label: 'Ready', tone: 'success' } },
    { id: 'c2', display: '17-26-000124', state: 'on_other_patient', statusBadge: { label: 'On another patient', tone: 'warning' },
      message: 'This card belongs to a different record', candidate, warnings: ['Age differs by 9 years'] },
    { id: 'c3', display: '17-26-00012', state: 'invalid', statusBadge: { label: 'Invalid', tone: 'danger' }, message: 'This number is too short' },
    { id: 'c4', display: '17-26-000126', state: 'checking', statusBadge: { label: 'Checking', tone: 'info' } }
  ],
  primaryCardId: 'c1', canSubmit: false, submitError: 'Resolve every card before linking'
};
const renderLinks = (model: LinkCardsViewModel) => ({ props: { model }, template: wrap('<emr-link-cards [model]="model" />') });

export const LinkCardsMixed: Story = { render: () => renderLinks(links) };
export const LinkCardsReady: Story = {
  render: () => renderLinks({ ...links, cards: links.cards.slice(0, 1), canSubmit: true, submitError: undefined })
};
