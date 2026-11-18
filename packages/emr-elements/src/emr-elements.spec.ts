// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { EmrPacsStudyEntry, InpatientMarViewModel, SpecialtyExamMatrixViewModel } from '@drguptavivek/emr-controller';
import { EMR_CATALOG } from '../../emr-ui/catalog.manifest';
import { slugForEntry } from '../../../scripts/build-registry.mjs';
import {
  ANATOMY_RECIPES,
  ANNOTATION_SYMBOL_SETS,
  EMR_DENSITY_MAP,
  EMR_FONT_STACKS,
  EMR_PALETTE_PRESETS,
  EMR_RADIUS_MAP,
  EmrDoseScheduleElement,
  EmrLitElement,
  EmrInpatientMarElement,
  EmrPacsViewerElement,
  EmrPatientBannerElement,
  EmrPrescribingTableElement,
  EmrScoreResultCardElement,
  EmrSpecialtyExamMatrixElement,
  EmrThemeCustomizerElement,
  registerAllEmrElements,
  resolveEmrThemeVariables,
} from './index.js';

describe('@drguptavivek/emr-elements (Lit v3 Web Components)', () => {
  it('registers a custom element in customElements for every L1–L6 catalog component plus emr-theme-customizer', () => {
    registerAllEmrElements();
    for (const entry of EMR_CATALOG) {
      const tag = slugForEntry(entry);
      const ctor = customElements.get(tag);
      expect(ctor, `Expected <${tag}> (${entry.id}) to be registered in customElements`).toBeDefined();
      expect(ctor?.prototype.render, `Expected <${tag}> to implement rendering`).not.toBe(EmrLitElement.prototype.render);
    }
    expect(customElements.get('emr-theme-customizer')).toBeDefined();
  });

  it('re-exports L5 anatomy recipes and annotation symbol sets from emr-controller', () => {
    expect(ANATOMY_RECIPES).toHaveLength(226);
    expect(ANNOTATION_SYMBOL_SETS).toHaveLength(3);
  });

  it('resolves end-user theme & typography customization variables across palettes, radii, densities, and font stacks', () => {
    const vars = resolveEmrThemeVariables({
      preset: 'surgical-teal',
      scheme: 'light',
      radius: 'soft',
      density: 'compact',
      fontStack: 'atkinson',
      fontScale: '1.1',
    });
    expect(vars['--emr-primary']).toBe(EMR_PALETTE_PRESETS['surgical-teal'].light.primary);
    expect(vars['--emr-radius']).toBe(`${EMR_RADIUS_MAP.soft.px}px`);
    expect(vars['--emr-control-height']).toBe(`${EMR_DENSITY_MAP.compact.heightPx}px`);
    expect(vars['--emr-font-family']).toBe(EMR_FONT_STACKS.atkinson.sans);
    expect(vars['--emr-text-md']).toBe('0.9625rem');
  });

  it('instantiates <emr-prescribing-table> and emits typed intents via emitIntent', () => {
    const el = document.createElement('emr-prescribing-table') as EmrPrescribingTableElement;
    expect(el).toBeInstanceOf(EmrPrescribingTableElement);
    const received: unknown[] = [];
    el.addEventListener('intent', (e: Event) => {
      received.push((e as CustomEvent).detail);
    });
    el.emitIntent({ type: 'rowMoveRequested', rowId: 'rx-1', direction: 'up' });
    el.emitIntent({ type: 'rowInsertBelowRequested', afterRowId: 'rx-1' });
    el.emitIntent({ type: 'rowRemoveRequested', rowId: 'rx-1' });
    expect(received).toEqual([
      { type: 'rowMoveRequested', rowId: 'rx-1', direction: 'up' },
      { type: 'rowInsertBelowRequested', afterRowId: 'rx-1' },
      { type: 'rowRemoveRequested', rowId: 'rx-1' },
    ]);
  });

  it('renders patient banner vitals strip + sparkline, layoutMode/compact, allergy/vital click -> alertInspectRequested, and provenance inspector', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-patient-banner') as EmrPatientBannerElement;
    el.model = {
      patientId: 'P-1',
      displayName: 'Aarav Sharma',
      ageLabel: '58 y',
      sexLabel: 'Male',
      careSetting: 'ipd',
      careSettingLabel: 'Inpatient',
      locationLabel: 'Ward 4',
      expanded: false,
      activeInspectId: 'a1',
      identifiers: [{ label: 'MRN', value: 'MRN-101' }],
      allergies: [
        {
          id: 'a1',
          label: 'Penicillin',
          tone: 'danger',
          reactionLabel: 'Anaphylaxis',
          provenanceLabel: 'Allergy Registry',
          recordedAtLabel: '2025-04-10',
        },
      ],
      chronicDiseases: [],
      alerts: [],
      vitals: [
        {
          id: 'v1',
          label: 'IOP OD',
          valueLabel: '22',
          unit: 'mmHg',
          deltaLabel: '+4',
          tone: 'warning',
          trendPoints: [16, 18, 22],
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (ev) => intents.push((ev as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      expect(shadow.querySelector('svg.emr-vital-sparkline')).not.toBeNull();
      const inspector = shadow.querySelector('[part="provenance-inspector"]');
      expect(inspector?.textContent).toContain('Allergy Registry');
      expect(inspector?.textContent).toContain('Anaphylaxis');

      const vitalBtn = [...shadow.querySelectorAll('button')].find((b) => b.textContent?.includes('IOP OD'))!;
      vitalBtn.click();
      expect(intents).toContainEqual({ type: 'alertInspectRequested', alertId: 'v1' });

      el.compact = true;
      await el.updateComplete;
      expect(shadow.querySelector('[part="banner"]')?.getAttribute('data-layout-mode')).toBe('compact');
      expect(shadow.querySelector('[part="vitals-strip"]')).toBeNull();
    } finally {
      el.remove();
    }
  });

  it('renders dose schedule code, route, site, instructions, maxDailyDose, taper, prn, clinicianNote, patientNote, and slot timeHints', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-dose-schedule') as EmrDoseScheduleElement;
    el.model = {
      medication: { label: 'Prednisolone', strength: '1%', formLabel: 'Eye Drops', form: 'drop', code: 'RXN-860975' },
      unit: { one: 'drop', other: 'drops' },
      frequency: { label: 'Four times daily', code: 'QID' },
      route: 'Ophthalmic',
      site: { label: 'Right eye', code: 'OD' },
      foodRelation: 'Shake well',
      duration: '4 weeks',
      maxDailyDose: '4 drops/day',
      prn: { label: 'For flare', maxLabel: 'Max 6 drops/24h' },
      clinicianNote: 'Monitor IOP weekly',
      patientNote: 'Wait 5 minutes between drops',
      instructions: ['Instill 1 drop into right eye', 'Close tear duct for 1 minute'],
      taper: [{ id: 't1', periodLabel: 'Week 1', frequencyLabel: 'QID' }],
      slots: [{ id: 'm', label: 'Morning', timeHint: '08:00 AM', amount: 1, householdLabel: '1 gtt' }],
      canShowInstructions: true,
      canEdit: true,
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (ev) => intents.push((ev as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const text = el.shadowRoot!.textContent ?? '';
      expect(text).toContain('RXN-860975');
      expect(text).toContain('Route: Ophthalmic');
      expect(text).toContain('Site: Right eye (OD)');
      expect(text).toContain('Max daily: 4 drops/day');
      expect(text).toContain('Week 1:');
      expect(text).toContain('For flare');
      expect(text).toContain('Monitor IOP weekly');
      expect(text).toContain('Wait 5 minutes between drops');
      expect(text).toContain('08:00 AM');
      expect(text).toContain('Instill 1 drop into right eye');
    } finally {
      el.remove();
    }
  });

  it('renders score result card subscales, missingItems/completeness, computedAtLabel, and provenance', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-score-result-card') as EmrScoreResultCardElement;
    el.model = {
      id: 'phq9',
      instrumentLabel: 'PHQ-9 Depression Scale',
      result: {
        total: 14,
        bandLabel: 'Moderate',
        bandTone: 'warning',
        subscales: [{ id: 's1', label: 'Somatic', value: 6, max: 12, bandLabel: 'Elevated' }],
        missingItems: ['Item 8 (Psychomotor)'],
        completenessLabel: '8 of 9 items answered',
        computedAtLabel: '12 Nov 2026 14:20',
        provenance: 'Controller v2.1',
      },
      canRecompute: true,
      canViewDetail: true,
    };
    document.body.append(el);
    try {
      await el.updateComplete;
      const text = el.shadowRoot!.textContent ?? '';
      expect(text).toContain('Somatic: 6/12 (Elevated)');
      expect(text).toContain('8 of 9 items answered');
      expect(text).toContain('Missing items: Item 8 (Psychomotor)');
      expect(text).toContain('12 Nov 2026 14:20');
      expect(text).toContain('Controller v2.1');
    } finally {
      el.remove();
    }
  });

  it('renders prescribing table SmartSig bar, safetyAlerts, viewModes, static formulary, pills, dispenseQuantity, and taper sub-rows', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-prescribing-table') as EmrPrescribingTableElement;
    el.model = {
      slotDefinitions: [{ id: 'm', label: 'Morning', shortLabel: 'M', timeHint: '8am' }],
      safetyAlerts: [{ id: 'sa1', tone: 'danger', badgeLabel: 'DDI', message: 'Avoid concurrent NSAID' }],
      quickSigExamples: [{ command: 'pcm 500 tds 5d', label: 'PCM 500 TDS' }],
      doseUnits: ['tab', 'cap'],
      routeOptions: [{ value: 'Oral', label: 'Oral' }],
      siteOptions: [{ value: 'OD', label: 'OD' }],
      durationUnits: ['days', 'weeks'],
      foodOptions: ['After food'],
      rows: [
        {
          id: 'r1',
          drugName: 'Prednisolone',
          strength: '5 mg',
          form: 'tablet',
          formLabel: 'Tablet',
          route: 'Oral',
          doseAmount: 1,
          unitLabel: 'tab',
          slots: [{ id: 'm', label: 'Morning', amount: 1 }],
          durationCount: 14,
          durationUnit: 'days',
          dispenseQuantity: { count: 14, unit: 'tab' },
          foodRelation: 'After food',
          instructions: 'Take with water',
          taperExpanded: true,
          taperSteps: [{ id: 'ts1', periodLabel: 'Days 1-7', frequencyLabel: '1 tab OD' }],
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (ev) => intents.push((ev as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      expect(shadow.textContent).toContain('Avoid concurrent NSAID');
      expect(shadow.textContent).toContain('= 14 tabs');
      expect(shadow.querySelector('[part="taper-row"]')).not.toBeNull();

      const quickBtn = [...shadow.querySelectorAll('button')].find((b) => b.textContent?.includes('PCM 500 TDS'))!;
      quickBtn.click();
      expect(intents).toContainEqual({ type: 'quickSigSubmitted', command: 'pcm 500 tds 5d' });

      const taperToggle = [...shadow.querySelectorAll('button')].find((b) => b.textContent?.includes('Hide Taper Steps'))!;
      taperToggle.click();
      expect(intents).toContainEqual({ type: 'taperToggleRequested', rowId: 'r1' });
    } finally {
      el.remove();
    }
  });

  it('supports Light/Dark scheme toggle and customBrandHex in <emr-theme-customizer>', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-theme-customizer') as EmrThemeCustomizerElement;
    const intents: unknown[] = [];
    el.addEventListener('intent', (ev) => intents.push((ev as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const darkBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) => b.textContent?.includes('Dark'))!;
      darkBtn.click();
      expect(intents[0]).toMatchObject({ type: 'themeConfigChanged', config: { scheme: 'dark' } });

      const hexInput = el.shadowRoot!.querySelector<HTMLInputElement>('input[aria-label="Custom brand hex"]')!;
      hexInput.value = '#123456';
      hexInput.dispatchEvent(new Event('input', { bubbles: true }));
      expect(intents[1]).toMatchObject({ type: 'themeConfigChanged', config: { customBrandHex: '#123456' } });
    } finally {
      el.remove();
    }
  });

  it('uses supplied PACS images and blocks note updates after the model locks', async () => {
    registerAllEmrElements();
    const active: EmrPacsStudyEntry = {
      id: 'a', accessionNumber: 'A', dateLabel: 'Today', modality: 'OCT', bodyPart: 'Retina',
      title: 'Active scan', status: 'Final Report', pacsEndpointLabel: 'Archive', sliceCount: 4,
      currentSlice: 2, windowPreset: 'Retina/OCT', zoomPercent: 100, radiologistImpression: 'Supplied impression',
      keyFindings: [], renderedFrameUrl: '/active-slice.png',
    };
    const prior: EmrPacsStudyEntry = {
      ...active, id: 'b', accessionNumber: 'B', title: 'Prior scan', renderedFrameUrl: '/prior-slice.png',
    };
    const el = document.createElement('emr-pacs-viewer') as EmrPacsViewerElement;
    el.model = { studies: [active, prior], activeStudyId: 'a', compareStudyId: 'b',
      layoutMode: '2-up-compare', syncScroll: false };
    const received: unknown[] = [];
    el.addEventListener('intent', (event) => received.push((event as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      expect([...shadow.querySelectorAll('img')].map((image) => image.getAttribute('src')))
        .toEqual(['/active-slice.png', '/prior-slice.png']);
      const pull = [...shadow.querySelectorAll('button')].find((button) => button.textContent?.includes('Pull Impression'))!;
      pull.click();
      expect(received).toEqual([{ type: 'impressionPulledToNote', studyId: 'a', text: 'Supplied impression' }]);

      el.model = { ...el.model, readOnly: true, compareStudyId: 'a' };
      pull.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(received).toHaveLength(1);
      expect([...shadow.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
      expect(shadow.textContent).toContain('Comparison study unavailable');
      expect(shadow.querySelectorAll('img')).toHaveLength(1);
    } finally {
      el.remove();
    }
  });

  it('renders blank fundus fields for both eyes and emits only the edited eye', async () => {
    registerAllEmrElements();
    const element = document.createElement('emr-specialty-exam-matrix') as EmrSpecialtyExamMatrixElement;
    const model: SpecialtyExamMatrixViewModel = {
      activeSpecialty: 'ophthalmology',
      ophthalmicRows: [{
        id: 'disc', segment: 'Posterior Segment', structureLabel: 'Optic disc',
        odValue: '', osValue: 'Distinct margins', normalDefault: '', quickChips: [],
      }],
      pediatrics: {
        weightKg: 0, heightCm: 0, bsaM2: '', weightCentileLabel: '', heightCentileLabel: '',
        targetDrugLabel: '', mgPerKgPerDose: 0, concentrationMgPer5Ml: 0,
        calculatedMgPerDose: 0, calculatedMlPerDose: 0, maxDailyMgLabel: '',
      },
      dermatology: { morphologyLabel: '', regions: [], totalBsaPercent: 0, totalFtuPerApp: 0, totalGramsFor14DaysBd: 0 },
      oncology: {
        regimenName: '', cycleNumber: 0, cycleDayLabel: '', ecogScore: 0, bsaM2: 0,
        ancCountLabel: '', plateletCountLabel: '', safetyGatePassed: false, doseReductionPercent: 100, agents: [],
      },
    };
    element.model = model;
    const events: unknown[] = [];
    element.addEventListener('intent', (event) => events.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      const right = element.shadowRoot!.querySelector<HTMLInputElement>('input[aria-label="Optic disc, Right eye (OD)"]')!;
      const left = element.shadowRoot!.querySelector<HTMLInputElement>('input[aria-label="Optic disc, Left eye (OS)"]')!;
      expect(right.value).toBe('');
      expect(left.value).toBe('Distinct margins');
      right.value = '  Cupping noted  ';
      right.dispatchEvent(new Event('input', { bubbles: true }));
      expect(events).toEqual([{ type: 'ophthalmicCellChanged', rowId: 'disc', eye: 'od', value: '  Cupping noted  ' }]);
      expect(model.ophthalmicRows[0]?.odValue).toBe('');

      element.model = { ...model, readOnly: true };
      left.value = 'Blocked edit';
      left.dispatchEvent(new Event('input', { bubbles: true }));
      await element.updateComplete;
      expect(events).toHaveLength(1);
      expect(right.readOnly && left.readOnly).toBe(true);
      expect(right.value).toBe('');
      expect(left.value).toBe('Distinct margins');
    } finally {
      element.remove();
    }
  });

  it('shows BCMA verification only on a scanned administration that was given', async () => {
    registerAllEmrElements();
    const el = document.createElement('emr-inpatient-mar') as EmrInpatientMarElement;
    const model: InpatientMarViewModel = {
      wardBedLabel: 'Ward A',
      shiftLabel: 'Morning',
      nurseLabel: 'Fixture nurse',
      timeColumns: [
        { id: 'm', timeLabel: '08:00', slotLabel: 'Morning' },
        { id: 'n', timeLabel: '22:00', slotLabel: 'Night' },
      ],
      orders: [{
        id: 'rx-1',
        drugName: 'Fixture medication',
        strength: '100 mg',
        formLabel: 'Tablet',
        doseLabel: '1 tab',
        routeLabel: 'Oral',
        frequencyCode: 'BD',
        administrations: [
          { slotId: 'm', scheduledTime: '08:00', status: 'given' },
          { slotId: 'n', scheduledTime: '22:00', status: 'due', bcmaScanned: true },
        ],
      }],
    };
    el.model = model;
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).not.toContain('BCMA Barcode Verified');

      const order = model.orders[0]!;
      el.model = {
        ...model,
        orders: [{
          ...order,
          administrations: [{ ...order.administrations[0]!, bcmaScanned: true }, order.administrations[1]!],
        }],
      };
      await el.updateComplete;
      const buttons = el.shadowRoot!.querySelectorAll('button');
      expect(buttons[0]!.parentElement!.textContent).toContain('BCMA Barcode Verified');
      expect(buttons[1]!.parentElement!.textContent).not.toContain('BCMA Barcode Verified');

      const received: unknown[] = [];
      el.addEventListener('intent', (event) => received.push((event as CustomEvent).detail));
      el.model = { ...el.model, readOnly: true };
      await el.updateComplete;
      expect(buttons[1]!.disabled).toBe(true);
      buttons[1]!.click();
      buttons[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(received).toEqual([]);

      el.model = { ...el.model, readOnly: false };
      await el.updateComplete;
      buttons[1]!.click();
      expect(received).toEqual([{ type: 'slotStatusCycled', orderId: 'rx-1', slotId: 'n' }]);
    } finally {
      el.remove();
    }
  });
});
