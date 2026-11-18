import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EmrAbdmHealthLockerPanelIntent,
  EmrAbdmHealthLockerPanelViewModel,
  EmrAudiogramIntent,
  EmrAudiogramViewModel,
  EmrChemoRegimenRoadmapIntent,
  EmrChemoRegimenRoadmapViewModel,
  EmrEncounterChargeSheetIntent,
  EmrEncounterChargeSheetViewModel,
  EmrGrowthChartIntent,
  EmrGrowthChartViewModel,
  EmrImmunizationLedgerIntent,
  EmrImmunizationLedgerViewModel,
  EmrOdontogramIntent,
  EmrOdontogramViewModel,
  EmrPartogramIntent,
  EmrPartogramViewModel,
  EmrReferralTrackerIntent,
  EmrReferralTrackerViewModel,
  EmrWaveformStripViewerIntent,
  EmrWaveformStripViewerViewModel,
} from './emr-maternal-peds-specialty-abdm.component';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-maternal-peds-specialty-abdm.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadMaternalPedsSpecialtyAbdmModule() {
  const withoutDecorators = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class Emr)/g,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorators, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const makeSignal = <T>(initial: T) => {
    let val = initial;
    const sig = () => val;
    sig.set = (next: T) => {
      val = next;
    };
    return sig;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        input: Object.assign(
          <T>(init?: T) => makeSignal<T | undefined>(init),
          { required: <T>() => makeSignal<T | undefined>(undefined) },
        ),
        output: <T>() => {
          const listeners: ((v: T) => void)[] = [];
          return {
            emit: (v: T) => listeners.forEach((l) => l(v)),
            subscribe: (l: (v: T) => void) => listeners.push(l),
          };
        },
      };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrPartogramComponent: new () => Record<string, any>;
    EmrGrowthChartComponent: new () => Record<string, any>;
    EmrImmunizationLedgerComponent: new () => Record<string, any>;
    EmrWaveformStripViewerComponent: new () => Record<string, any>;
    EmrOdontogramComponent: new () => Record<string, any>;
    EmrAudiogramComponent: new () => Record<string, any>;
    EmrChemoRegimenRoadmapComponent: new () => Record<string, any>;
    EmrReferralTrackerComponent: new () => Record<string, any>;
    EmrEncounterChargeSheetComponent: new () => Record<string, any>;
    EmrAbdmHealthLockerPanelComponent: new () => Record<string, any>;
    evaluatePartogramProgression: (obs: readonly any[]) => {
      latestDilationCm: number;
      latestFhrBpm: number;
      fhrAbnormal: boolean;
    };
    summarizeImmunizationCoverage: (doses: readonly any[]) => {
      administeredCount: number;
      dueCount: number;
      overdueCount: number;
    };
    computeDmftIndex: (teeth: readonly any[]) => {
      decayed: number;
      missing: number;
      filled: number;
      dmftTotal: number;
    };
    calculateEncounterChargeTotals: (items: readonly any[]) => {
      grossTotal: number;
      payerCoveredTotal: number;
      patientPayableTotal: number;
    };
  };
}

const mod = loadMaternalPedsSpecialtyAbdmModule();

describe('L4 Maternal-Child, Specialty Diagnostics & Claims/ABDM Suite (Angular)', () => {
  it('enforces design-token-only styling, zero browser globals, and zero relative cross-package imports', () => {
    expect(componentSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(componentSource).not.toMatch(
      /\b(?:window|document|navigator|localStorage|sessionStorage|fetch)\b/,
    );
    expect(componentSource).toContain("from '@drguptavivek/emr-controller';");
    expect(componentSource).not.toContain('emr-controller/src');
  });

  it('evaluates EmrPartogramComponent progression and emits checkpointSelected, membraneStatusChanged, and alertStatusChanged', () => {
    const model: EmrPartogramViewModel = {
      id: 'p1',
      gravidaParaLabel: 'G2P1L1 · 39w',
      membraneStatus: 'Intact',
      alertStatus: 'normal',
      observations: [
        {
          hour: 2,
          timeLabel: '10:00',
          cervicalDilationCm: 6,
          descentStation: -1,
          fhrBpm: 168,
          contractionsPer10Min: 4,
        },
      ],
    };
    const instance = new mod.EmrPartogramComponent();
    const emitted: EmrPartogramIntent[] = [];
    instance.intent.subscribe((i: EmrPartogramIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.progression()).toEqual({
      latestDilationCm: 6,
      latestFhrBpm: 168,
      fhrAbnormal: true,
    });

    instance.selectCheckpoint(2);
    expect(emitted.at(-1)).toEqual({ type: 'checkpointSelected', hour: 2 });

    instance.setMembraneStatus('Meconium Stained');
    expect(emitted.at(-1)).toEqual({
      type: 'membraneStatusChanged',
      status: 'Meconium Stained',
    });

    instance.setAlertStatus('alert-line');
    expect(emitted.at(-1)).toEqual({
      type: 'alertStatusChanged',
      alertStatus: 'alert-line',
    });
  });

  it('evaluates EmrGrowthChartComponent centile points and emits metricChanged and pointSelected', () => {
    const model: EmrGrowthChartViewModel = {
      id: 'g1',
      standardLabel: 'WHO 0-5y',
      activeMetric: 'weight-for-age',
      midParentalHeightCm: 170,
      points: [
        {
          id: 'pt-6m',
          ageLabel: '6m',
          ageMonths: 6,
          value: 6.2,
          unit: 'kg',
          centile: 3,
          zScore: -2.4,
        },
      ],
    };
    const instance = new mod.EmrGrowthChartComponent();
    const emitted: EmrGrowthChartIntent[] = [];
    instance.intent.subscribe((i: EmrGrowthChartIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.latestPoint()?.id).toBe('pt-6m');
    expect(instance.zScoreClassFor(model.points[0]!)).toBe('moderate-wasting');

    instance.selectMetric('height-for-age');
    expect(emitted.at(-1)).toEqual({ type: 'metricChanged', metric: 'height-for-age' });

    instance.selectPoint('pt-6m');
    expect(emitted.at(-1)).toEqual({ type: 'pointSelected', pointId: 'pt-6m' });
  });

  it('evaluates EmrImmunizationLedgerComponent coverage and emits filterChanged, doseSelected, and administerDoseRequested', () => {
    const model: EmrImmunizationLedgerViewModel = {
      id: 'imm-1',
      scheduleStandard: 'National UIP',
      activeFilter: 'due-overdue',
      doses: [
        {
          id: 'd1',
          vaccineName: 'BCG',
          doseNumberLabel: 'Single',
          ageGroupLabel: 'Birth',
          status: 'administered',
        },
        {
          id: 'd2',
          vaccineName: 'Pentavalent',
          doseNumberLabel: 'Dose 1',
          ageGroupLabel: '6 Weeks',
          status: 'overdue',
        },
      ],
    };
    const instance = new mod.EmrImmunizationLedgerComponent();
    const emitted: EmrImmunizationLedgerIntent[] = [];
    instance.intent.subscribe((i: EmrImmunizationLedgerIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.coverage()).toEqual({
      administeredCount: 1,
      dueCount: 0,
      overdueCount: 1,
    });
    expect(instance.filteredDoses()).toHaveLength(1);

    instance.setFilter('all');
    expect(emitted.at(-1)).toEqual({ type: 'filterChanged', filter: 'all' });

    instance.selectDose('d2');
    expect(emitted.at(-1)).toEqual({ type: 'doseSelected', doseId: 'd2' });

    instance.requestAdminister(model.doses[1]!);
    expect(emitted.at(-1)).toEqual({
      type: 'administerDoseRequested',
      doseId: 'd2',
      vaccineName: 'Pentavalent',
    });
  });

  it('evaluates EmrWaveformStripViewerComponent lead samples and emits leadSelected, paperSpeedChanged, and signInterpretationRequested', () => {
    const model: EmrWaveformStripViewerViewModel = {
      id: 'w1',
      modality: '12-Lead ECG',
      paperSpeed: '25 mm/s',
      gain: '10 mm/mV',
      intervals: { hrBpm: 88, prMs: 156, qrsMs: 92, qtcMs: 428 },
      leads: [
        { id: 'II', label: 'Lead II', samplePoints: [0, 0.25, 1.1, -0.2] },
        { id: 'V1', label: 'Lead V1', samplePoints: [0.1, -0.8, 0.2] },
      ],
      activeLeadId: 'II',
      interpretation: 'Normal sinus rhythm',
      signed: false,
    };
    const instance = new mod.EmrWaveformStripViewerComponent();
    const emitted: EmrWaveformStripViewerIntent[] = [];
    instance.intent.subscribe((i: EmrWaveformStripViewerIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.activeLead()?.id).toBe('II');
    expect(instance.formatSamples([0, 0.25])).toBe('0.00 · 0.25');

    instance.selectLead('V1');
    expect(emitted.at(-1)).toEqual({ type: 'leadSelected', leadId: 'V1' });

    instance.setPaperSpeed('50 mm/s');
    expect(emitted.at(-1)).toEqual({ type: 'paperSpeedChanged', paperSpeed: '50 mm/s' });

    instance.signInterpretation();
    expect(emitted.at(-1)).toEqual({ type: 'signInterpretationRequested' });
  });

  it('evaluates EmrOdontogramComponent DMFT index and emits toothSelected, toothStatusChanged, and dentitionModeChanged', () => {
    const model: EmrOdontogramViewModel = {
      id: 'od-1',
      dentitionMode: 'permanent-fdi',
      selectedToothNumber: '16',
      teeth: [
        { toothNumber: '16', arch: 'upper', status: 'caries', pocketDepthMm: 5 },
        { toothNumber: '36', arch: 'lower', status: 'missing' },
        { toothNumber: '46', arch: 'lower', status: 'restored-filling' },
      ],
    };
    const instance = new mod.EmrOdontogramComponent();
    const emitted: EmrOdontogramIntent[] = [];
    instance.intent.subscribe((i: EmrOdontogramIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.dmftIndex()).toEqual({
      decayed: 1,
      missing: 1,
      filled: 1,
      dmftTotal: 3,
    });

    instance.selectTooth('36');
    expect(emitted.at(-1)).toEqual({ type: 'toothSelected', toothNumber: '36' });

    instance.setToothStatus('16', 'endodontic-rct');
    expect(emitted.at(-1)).toEqual({
      type: 'toothStatusChanged',
      toothNumber: '16',
      status: 'endodontic-rct',
    });

    instance.setDentitionMode('deciduous-fdi');
    expect(emitted.at(-1)).toEqual({
      type: 'dentitionModeChanged',
      dentitionMode: 'deciduous-fdi',
    });
  });

  it('evaluates EmrAudiogramComponent bilateral ears and emits conductionViewChanged and thresholdSelected', () => {
    const model: EmrAudiogramViewModel = {
      id: 'aud-1',
      activeConductionView: 'both',
      rightEar: {
        ear: 'Right',
        ptaDbHl: 15,
        tympanogramType: 'Type A',
        degreeClassification: 'Normal',
        thresholds: [{ frequencyHz: 1000, airDbHl: 15, boneDbHl: 10 }],
      },
      leftEar: {
        ear: 'Left',
        ptaDbHl: 42,
        tympanogramType: 'Type B',
        degreeClassification: 'Moderate Conductive Loss',
        thresholds: [{ frequencyHz: 2000, airDbHl: 45, boneDbHl: 15, masked: true }],
      },
    };
    const instance = new mod.EmrAudiogramComponent();
    const emitted: EmrAudiogramIntent[] = [];
    instance.intent.subscribe((i: EmrAudiogramIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.ears()).toHaveLength(2);

    instance.setConductionView('air');
    expect(emitted.at(-1)).toEqual({ type: 'conductionViewChanged', view: 'air' });

    instance.selectThreshold('Left', 2000);
    expect(emitted.at(-1)).toEqual({
      type: 'thresholdSelected',
      ear: 'Left',
      frequencyHz: 2000,
    });
  });

  it('evaluates EmrChemoRegimenRoadmapComponent and emits cycleSelected, cycleDoseAdjusted, and clearanceOverrideRequested', () => {
    const model: EmrChemoRegimenRoadmapViewModel = {
      id: 'ch-1',
      protocolName: 'AC-T',
      diagnosisLabel: 'Stage IIA Breast Carcinoma',
      bsaM2: 1.65,
      ecogStatus: 0,
      labClearancePassed: false,
      ancCountLabel: '1,150 /µL',
      plateletCountLabel: '92,000 /µL',
      cycles: [
        {
          cycleNumber: 2,
          plannedDate: '2026-11-15',
          status: 'held-toxicity',
          dosePct: 100,
          agentsSummary: 'Doxorubicin + Cyclophosphamide',
        },
      ],
    };
    const instance = new mod.EmrChemoRegimenRoadmapComponent();
    const emitted: EmrChemoRegimenRoadmapIntent[] = [];
    instance.intent.subscribe((i: EmrChemoRegimenRoadmapIntent) => emitted.push(i));
    instance.model.set(model);

    instance.selectCycle(2);
    expect(emitted.at(-1)).toEqual({ type: 'cycleSelected', cycleNumber: 2 });

    instance.adjustDose(2, 80);
    expect(emitted.at(-1)).toEqual({
      type: 'cycleDoseAdjusted',
      cycleNumber: 2,
      dosePct: 80,
    });

    instance.requestClearanceOverride(2);
    expect(emitted.at(-1)).toEqual({
      type: 'clearanceOverrideRequested',
      cycleNumber: 2,
    });
  });

  it('evaluates EmrReferralTrackerComponent filtering and emits filterChanged, referralSelected, and referralStatusUpdated', () => {
    const model: EmrReferralTrackerViewModel = {
      id: 'ref-1',
      activeFilter: 'open',
      referrals: [
        {
          id: 'r1',
          targetSpecialty: 'Neonatology',
          urgency: 'emergent',
          status: 'sent',
          clinicalQuestion: 'Preterm respiratory distress',
          createdAtLabel: '12 Nov 2026',
        },
        {
          id: 'r2',
          targetSpecialty: 'Audiology',
          urgency: 'routine',
          status: 'completed-report-filed',
          clinicalQuestion: 'OAE newborn hearing screen',
          createdAtLabel: '10 Nov 2026',
        },
      ],
    };
    const instance = new mod.EmrReferralTrackerComponent();
    const emitted: EmrReferralTrackerIntent[] = [];
    instance.intent.subscribe((i: EmrReferralTrackerIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.filteredReferrals()).toHaveLength(1);

    instance.setFilter('completed-report-filed');
    expect(emitted.at(-1)).toEqual({
      type: 'filterChanged',
      filter: 'completed-report-filed',
    });

    instance.selectReferral('r1');
    expect(emitted.at(-1)).toEqual({ type: 'referralSelected', referralId: 'r1' });

    instance.updateReferralStatus('r1', 'accepted');
    expect(emitted.at(-1)).toEqual({
      type: 'referralStatusUpdated',
      referralId: 'r1',
      status: 'accepted',
    });
  });

  it('evaluates EmrEncounterChargeSheetComponent totals and emits lineQuantityChanged, coverageToggled, and submitClaimRequested', () => {
    const model: EmrEncounterChargeSheetViewModel = {
      id: 'cs-1',
      payerScheme: 'PM-JAY',
      preAuthStatus: 'preauth-approved',
      primaryDiagnosisCode: 'ICD-10 Z38.0',
      lineItems: [
        {
          id: 'li-1',
          code: '99213',
          description: 'Pediatric Consult',
          category: 'consultation',
          quantity: 1,
          unitPrice: 600,
          coveredByPayer: true,
        },
        {
          id: 'li-2',
          code: 'VAC-01',
          description: 'Disposable Syringe Kit',
          category: 'consumables',
          quantity: 2,
          unitPrice: 50,
          coveredByPayer: false,
        },
      ],
    };
    const instance = new mod.EmrEncounterChargeSheetComponent();
    const emitted: EmrEncounterChargeSheetIntent[] = [];
    instance.intent.subscribe((i: EmrEncounterChargeSheetIntent) => emitted.push(i));
    instance.model.set(model);

    expect(instance.totals()).toEqual({
      grossTotal: 700,
      payerCoveredTotal: 600,
      patientPayableTotal: 100,
    });

    instance.setLineQuantity('li-2', '3');
    expect(emitted.at(-1)).toEqual({
      type: 'lineQuantityChanged',
      itemId: 'li-2',
      quantity: 3,
    });

    instance.toggleCoverage('li-2', true);
    expect(emitted.at(-1)).toEqual({
      type: 'coverageToggled',
      itemId: 'li-2',
      coveredByPayer: true,
    });

    instance.submitClaim();
    expect(emitted.at(-1)).toEqual({ type: 'submitClaimRequested' });
  });

  it('evaluates EmrAbdmHealthLockerPanelComponent and emits consentSelected, consentActionRequested, requestNewConsent, and linkCareContextRequested', () => {
    const model: EmrAbdmHealthLockerPanelViewModel = {
      id: 'abdm-1',
      abhaNumber: '91-2233-4455-6677',
      abhaAddress: 'ananya.rao@abdm',
      kycVerified: true,
      linkedCareContextsCount: 4,
      consents: [
        {
          id: 'c-1',
          requesterHiuName: 'District General Hospital',
          purpose: 'CAREMGT',
          status: 'REQUESTED',
          hiTypes: ['Prescription', 'DiagnosticReport'],
          validUntilLabel: '31 Dec 2026',
        },
      ],
    };
    const instance = new mod.EmrAbdmHealthLockerPanelComponent();
    const emitted: EmrAbdmHealthLockerPanelIntent[] = [];
    instance.intent.subscribe((i: EmrAbdmHealthLockerPanelIntent) => emitted.push(i));
    instance.model.set(model);

    instance.selectConsent('c-1');
    expect(emitted.at(-1)).toEqual({ type: 'consentSelected', consentId: 'c-1' });

    instance.triggerConsentAction('c-1', 'approve');
    expect(emitted.at(-1)).toEqual({
      type: 'consentActionRequested',
      consentId: 'c-1',
      action: 'approve',
    });

    instance.requestNewConsent();
    expect(emitted.at(-1)).toEqual({ type: 'requestNewConsent' });

    instance.linkCareContext();
    expect(emitted.at(-1)).toEqual({ type: 'linkCareContextRequested' });
  });
});
