import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EmrAnaesthesiaRecordIntent,
  EmrAnaesthesiaRecordViewModel,
  EmrEdTrackBoardIntent,
  EmrEdTrackBoardViewModel,
  EmrFluidBalanceChartIntent,
  EmrFluidBalanceChartViewModel,
  EmrLabCumulativeGridIntent,
  EmrLabCumulativeGridViewModel,
  EmrMicrobiologyAntibiogramIntent,
  EmrMicrobiologyAntibiogramViewModel,
  EmrResuscitationEventLogIntent,
  EmrResuscitationEventLogViewModel,
  EmrSpecimenCollectionBarIntent,
  EmrSpecimenCollectionBarViewModel,
  EmrSurgicalImplantLogIntent,
  EmrSurgicalImplantLogViewModel,
  EmrTriageAssessmentCardIntent,
  EmrTriageAssessmentCardViewModel,
} from './emr-acute-lab-perioperative.component';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-acute-lab-perioperative.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadAcuteLabPerioperativeModule() {
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
    EmrEdTrackBoardComponent: new () => Record<string, any>;
    EmrTriageAssessmentCardComponent: new () => Record<string, any>;
    EmrResuscitationEventLogComponent: new () => Record<string, any>;
    EmrSpecimenCollectionBarComponent: new () => Record<string, any>;
    EmrLabCumulativeGridComponent: new () => Record<string, any>;
    EmrMicrobiologyAntibiogramComponent: new () => Record<string, any>;
    EmrAnaesthesiaRecordComponent: new () => Record<string, any>;
    EmrFluidBalanceChartComponent: new () => Record<string, any>;
    EmrSurgicalImplantLogComponent: new () => Record<string, any>;
    summarizeEdTrackCensus: (patients: any[]) => {
      totalPatients: number;
      criticalEsi12Count: number;
      boardingCount: number;
      fourHourBreachCount: number;
    };
    countLabCriticalCells: (rows: any[]) => number;
    computeFluidBalanceSummary: (intakes: any[], outputs: any[]) => {
      totalIntakeMl: number;
      totalOutputMl: number;
      netBalanceMl: number;
    };
  };
}

const mod = loadAcuteLabPerioperativeModule();

describe('L4 Acute Care, Lab & Perioperative Suite (Angular)', () => {
  it('enforces design-token-only styling, zero browser globals, and zero relative controller imports', () => {
    expect(componentSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(componentSource).not.toMatch(/\b(?:window|document|navigator|localStorage|sessionStorage|fetch)\b/);
    expect(componentSource).not.toContain('emr-controller/src');
    expect(componentSource).toContain("from '@drguptavivek/emr-controller';");
  });

  it('verifies EmrEdTrackBoardComponent census summary, acuity filter, and disposition intents', () => {
    const edModel: EmrEdTrackBoardViewModel = {
      id: 'ed-1',
      activeAcuityFilter: 'all',
      patients: [
        {
          id: 'p1',
          bayLabel: 'Resus-1',
          patientName: 'A. Sharma',
          ageSexLabel: '64M',
          esiLevel: 1,
          chiefComplaint: 'STEMI',
          losMinutes: 85,
          pendingLabsCount: 1,
          pendingImagingCount: 0,
          disposition: 'in-assessment',
        },
        {
          id: 'p2',
          bayLabel: 'Bay-4',
          patientName: 'S. Iyer',
          ageSexLabel: '48F',
          esiLevel: 3,
          chiefComplaint: 'Abdominal pain',
          losMinutes: 250,
          pendingLabsCount: 0,
          pendingImagingCount: 1,
          disposition: 'boarding-admit',
        },
      ],
    };

    const instance = new mod.EmrEdTrackBoardComponent();
    const emitted: EmrEdTrackBoardIntent[] = [];
    instance.intent.subscribe((i: EmrEdTrackBoardIntent) => emitted.push(i));
    instance.model.set(edModel);

    expect(instance.censusSummary()).toEqual({
      totalPatients: 2,
      criticalEsi12Count: 1,
      boardingCount: 1,
      fourHourBreachCount: 1,
    });
    expect(instance.visiblePatients()).toHaveLength(2);

    instance.selectAcuityFilter(1);
    expect(emitted.at(-1)).toEqual({ type: 'acuityFilterChanged', filter: 1 });

    instance.selectPatient('p1');
    expect(emitted.at(-1)).toEqual({ type: 'patientSelected', patientId: 'p1' });

    instance.setDisposition('p2', 'ready-discharge');
    expect(emitted.at(-1)).toEqual({
      type: 'dispositionChanged',
      patientId: 'p2',
      disposition: 'ready-discharge',
    });
  });

  it('verifies EmrTriageAssessmentCardComponent ESI selection, pain score, isolation, and finalization intents', () => {
    const triModel: EmrTriageAssessmentCardViewModel = {
      id: 'tri-1',
      arrivalMode: 'ALS Ambulance',
      chiefComplaint: 'Acute dyspnea',
      esiLevel: 2,
      painScore: 6,
      redFlags: ['Hypoxia SpO2 88%'],
      vitalsSummary: [{ label: 'SpO2', value: '88%', abnormal: true }],
      isolationRequired: false,
      finalized: false,
    };

    const instance = new mod.EmrTriageAssessmentCardComponent();
    const emitted: EmrTriageAssessmentCardIntent[] = [];
    instance.intent.subscribe((i: EmrTriageAssessmentCardIntent) => emitted.push(i));
    instance.model.set(triModel);

    instance.selectEsiLevel(1);
    expect(emitted.at(-1)).toEqual({ type: 'esiLevelSelected', esiLevel: 1 });

    instance.setPainScore(8);
    expect(emitted.at(-1)).toEqual({ type: 'painScoreChanged', painScore: 8 });

    instance.toggleIsolation();
    expect(emitted.at(-1)).toEqual({ type: 'isolationToggled', isolationRequired: true });

    instance.finalizeTriage();
    expect(emitted.at(-1)).toEqual({ type: 'triageFinalized' });
  });

  it('verifies EmrResuscitationEventLogComponent elapsed formatting, rhythm, status, and quick actions', () => {
    const resusModel: EmrResuscitationEventLogViewModel = {
      id: 'resus-1',
      codeStatus: 'active',
      elapsedSeconds: 125,
      currentRhythm: 'VF/pVT',
      cprCycles: 2,
      shockCount: 1,
      epinephrineDoses: 1,
      events: [],
    };

    const instance = new mod.EmrResuscitationEventLogComponent();
    const emitted: EmrResuscitationEventLogIntent[] = [];
    instance.intent.subscribe((i: EmrResuscitationEventLogIntent) => emitted.push(i));
    instance.model.set(resusModel);

    expect(instance.formatElapsed(125)).toBe('02:05');

    instance.logQuickAction('shock-delivered');
    expect(emitted.at(-1)).toEqual({ type: 'quickActionLogged', action: 'shock-delivered' });

    instance.selectRhythm('ROSC');
    expect(emitted.at(-1)).toEqual({ type: 'rhythmChanged', rhythm: 'ROSC' });

    instance.setCodeStatus('rosc');
    expect(emitted.at(-1)).toEqual({ type: 'codeStatusChanged', status: 'rosc' });
  });

  it('verifies EmrSpecimenCollectionBarComponent wristband verification, scan, and rejection intents', () => {
    const specModel: EmrSpecimenCollectionBarViewModel = {
      id: 'spec-1',
      orderAccession: 'ACC-101',
      patientVerified: false,
      containers: [
        {
          id: 'c1',
          barcode: 'BC-001',
          tubeType: 'EDTA Lavender',
          testsSummary: 'CBC',
          volumeMl: 4,
          status: 'pending',
        },
      ],
    };

    const instance = new mod.EmrSpecimenCollectionBarComponent();
    const emitted: EmrSpecimenCollectionBarIntent[] = [];
    instance.intent.subscribe((i: EmrSpecimenCollectionBarIntent) => emitted.push(i));
    instance.model.set(specModel);

    instance.togglePatientVerification();
    expect(emitted.at(-1)).toEqual({ type: 'patientVerificationToggled', verified: true });

    instance.scanContainer('c1', 'BC-001');
    expect(emitted.at(-1)).toEqual({
      type: 'containerScanned',
      containerId: 'c1',
      barcode: 'BC-001',
    });

    instance.rejectContainer('c1', 'Hemolyzed');
    expect(emitted.at(-1)).toEqual({
      type: 'containerRejected',
      containerId: 'c1',
      reason: 'Hemolyzed',
    });
  });

  it('verifies EmrLabCumulativeGridComponent critical cell counting, abnormal filtering, and intents', () => {
    const labModel: EmrLabCumulativeGridViewModel = {
      id: 'lab-1',
      panelName: 'Electrolytes',
      columns: [{ id: 't1', dateLabel: '08:00' }],
      rows: [
        {
          id: 'k',
          analyteName: 'Potassium',
          unit: 'mmol/L',
          referenceRange: '3.5-5.1',
          values: { t1: { value: '6.3', flag: 'critical-high' } },
        },
        {
          id: 'na',
          analyteName: 'Sodium',
          unit: 'mmol/L',
          referenceRange: '135-145',
          values: { t1: { value: '140', flag: 'normal' } },
        },
      ],
      showAbnormalOnly: true,
    };

    const instance = new mod.EmrLabCumulativeGridComponent();
    const emitted: EmrLabCumulativeGridIntent[] = [];
    instance.intent.subscribe((i: EmrLabCumulativeGridIntent) => emitted.push(i));
    instance.model.set(labModel);

    expect(instance.criticalCellCount()).toBe(1);
    expect(instance.visibleRows()).toHaveLength(1);

    instance.toggleAbnormalFilter();
    expect(emitted.at(-1)).toEqual({ type: 'abnormalFilterToggled', showAbnormalOnly: false });

    instance.selectCell('k', 't1');
    expect(emitted.at(-1)).toEqual({ type: 'cellSelected', analyteId: 'k', columnId: 't1' });

    instance.acknowledgeCritical('k', 't1');
    expect(emitted.at(-1)).toEqual({
      type: 'criticalAcknowledgeRequested',
      analyteId: 'k',
      columnId: 't1',
    });
  });

  it('verifies EmrMicrobiologyAntibiogramComponent, EmrAnaesthesiaRecordComponent, EmrFluidBalanceChartComponent, and EmrSurgicalImplantLogComponent', () => {
    // 6. Microbiology Antibiogram
    const microModel: EmrMicrobiologyAntibiogramViewModel = {
      id: 'm1',
      specimenSource: 'Urine',
      collectionDate: '2026-11-12',
      isolates: [{ id: 'iso1', organismName: 'E. coli' }],
      rows: [
        {
          antibioticId: 'mero',
          antibioticName: 'Meropenem',
          resultsByIsolate: { iso1: { interpretation: 'S', micLabel: '<=0.25' } },
        },
      ],
    };
    const microInst = new mod.EmrMicrobiologyAntibiogramComponent();
    const microEvents: EmrMicrobiologyAntibiogramIntent[] = [];
    microInst.intent.subscribe((i: EmrMicrobiologyAntibiogramIntent) => microEvents.push(i));
    microInst.model.set(microModel);
    microInst.selectAntibiotic('mero');
    microInst.requestStewardshipOrder('mero', 'iso1');
    expect(microEvents).toEqual([
      { type: 'antibioticSelected', antibioticId: 'mero' },
      { type: 'stewardshipOrderRequested', antibioticId: 'mero', isolateId: 'iso1' },
    ]);

    // 7. Anaesthesia Record
    const anaesModel: EmrAnaesthesiaRecordViewModel = {
      id: 'a1',
      asaClass: 'II',
      mallampatiClass: 2,
      technique: 'General',
      airwayDevice: 'ETT 7.5',
      activePhase: 'induction',
      checkpoints: [],
      medications: [],
    };
    const anaesInst = new mod.EmrAnaesthesiaRecordComponent();
    const anaesEvents: EmrAnaesthesiaRecordIntent[] = [];
    anaesInst.intent.subscribe((i: EmrAnaesthesiaRecordIntent) => anaesEvents.push(i));
    anaesInst.model.set(anaesModel);
    anaesInst.selectPhase('maintenance');
    anaesInst.addCheckpoint('10:00');
    anaesInst.logMedication('Propofol', '150 mg');
    expect(anaesEvents).toEqual([
      { type: 'phaseChanged', phase: 'maintenance' },
      { type: 'checkpointAdded', timeLabel: '10:00' },
      { type: 'medicationLogged', drugName: 'Propofol', doseLabel: '150 mg' },
    ]);

    // 8. Fluid Balance Chart
    const fluidModel: EmrFluidBalanceChartViewModel = {
      id: 'f1',
      periodLabel: '24h',
      intakes: [{ id: 'i1', category: 'IV', routeOrSite: 'RL', volumeMl: 1000 }],
      outputs: [{ id: 'o1', category: 'Urine', routeOrSite: 'Foley', volumeMl: 750 }],
    };
    const fluidInst = new mod.EmrFluidBalanceChartComponent();
    const fluidEvents: EmrFluidBalanceChartIntent[] = [];
    fluidInst.intent.subscribe((i: EmrFluidBalanceChartIntent) => fluidEvents.push(i));
    fluidInst.model.set(fluidModel);
    expect(fluidInst.balanceSummary()).toEqual({
      totalIntakeMl: 1000,
      totalOutputMl: 750,
      netBalanceMl: 250,
    });
    fluidInst.addEntry('intake', 'IV Crystalloid', 250);
    fluidInst.removeEntry('i1');
    expect(fluidEvents).toEqual([
      { type: 'entryAdded', direction: 'intake', category: 'IV Crystalloid', volumeMl: 250 },
      { type: 'entryRemoved', entryId: 'i1' },
    ]);

    // 9. Surgical Implant Log
    const implantModel: EmrSurgicalImplantLogViewModel = {
      id: 'imp1',
      procedureName: 'Total Knee Arthroplasty',
      countsReconciled: false,
      implants: [
        {
          id: 'im1',
          deviceName: 'Tibial Baseplate',
          manufacturer: 'Zimmer',
          lotNumber: 'L1',
          serialNumber: 'S1',
          udiCode: 'UDI-1',
          expiryDate: '2029-01-01',
          anatomicalSite: 'Right Knee',
          sterileVerified: false,
        },
      ],
    };
    const impInst = new mod.EmrSurgicalImplantLogComponent();
    const impEvents: EmrSurgicalImplantLogIntent[] = [];
    impInst.intent.subscribe((i: EmrSurgicalImplantLogIntent) => impEvents.push(i));
    impInst.model.set(implantModel);
    impInst.selectImplant('im1');
    impInst.toggleSterileVerified('im1', true);
    impInst.toggleCountsReconciled();
    expect(impEvents).toEqual([
      { type: 'implantSelected', implantId: 'im1' },
      { type: 'sterileVerifiedToggled', implantId: 'im1', sterileVerified: true },
      { type: 'countsReconciledToggled', countsReconciled: true },
    ]);
  });
});
