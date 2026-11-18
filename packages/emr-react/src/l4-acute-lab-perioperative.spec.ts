import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import {
  EmrAnaesthesiaRecord,
  EmrEdTrackBoard,
  EmrFluidBalanceChart,
  EmrLabCumulativeGrid,
  EmrMicrobiologyAntibiogram,
  EmrResuscitationEventLog,
  EmrSpecimenCollectionBar,
  EmrSurgicalImplantLog,
  EmrTriageAssessmentCard,
  type EmrAnaesthesiaRecordViewModel,
  type EmrEdTrackBoardViewModel,
  type EmrFluidBalanceChartViewModel,
  type EmrLabCumulativeGridViewModel,
  type EmrMicrobiologyAntibiogramViewModel,
  type EmrResuscitationEventLogViewModel,
  type EmrSpecimenCollectionBarViewModel,
  type EmrSurgicalImplantLogViewModel,
  type EmrTriageAssessmentCardViewModel,
} from './l4-acute-lab-perioperative';
import {
  computeFluidBalanceSummary,
  countLabCriticalCells,
  filterEdTrackPatients,
  filterLabCumulativeRows,
  formatResuscitationElapsed,
  summarizeEdTrackCensus,
} from './l4-acute-lab-perioperative.logic';

const edModel: EmrEdTrackBoardViewModel = {
  id: 'ed-1',
  title: 'Emergency Department Track Board',
  activeAcuityFilter: 'all',
  selectedPatientId: 'p1',
  patients: [
    {
      id: 'p1',
      bayLabel: 'Resus-1',
      patientName: 'Arjun Singhania',
      ageSexLabel: '64M',
      esiLevel: 1,
      chiefComplaint: 'Anterior STEMI',
      losMinutes: 42,
      pendingLabsCount: 1,
      pendingImagingCount: 0,
      disposition: 'in-assessment',
    },
    {
      id: 'p2',
      bayLabel: 'Acute-4',
      patientName: 'Kavita Deshmukh',
      ageSexLabel: '52F',
      esiLevel: 2,
      chiefComplaint: 'Septic Shock',
      losMinutes: 260,
      pendingLabsCount: 2,
      pendingImagingCount: 1,
      disposition: 'boarding-admit',
    },
  ],
};

const triageModel: EmrTriageAssessmentCardViewModel = {
  id: 'tri-1',
  title: 'Emergency Triage & Primary Survey',
  arrivalMode: 'ALS Ambulance',
  chiefComplaint: 'Acute substernal chest pain',
  esiLevel: 2,
  painScore: 8,
  redFlags: ['Diaphoresis', 'Hypotension'],
  vitalsSummary: [
    { label: 'HR', value: '116 bpm', abnormal: true },
    { label: 'BP', value: '92/58 mmHg', abnormal: true },
  ],
  isolationRequired: true,
  finalized: true,
};

const resusModel: EmrResuscitationEventLogViewModel = {
  id: 'resus-1',
  title: 'ACLS Code Blue Event Recorder',
  codeStatus: 'active',
  elapsedSeconds: 375,
  currentRhythm: 'VF/pVT',
  cprCycles: 3,
  shockCount: 2,
  epinephrineDoses: 2,
  events: [
    {
      id: 'ev-1',
      timestampLabel: '00:02:00',
      category: 'shock',
      description: 'Biphasic shock 200 J delivered',
      clinician: 'Dr. R. Menon',
    },
  ],
};

const specimenModel: EmrSpecimenCollectionBarViewModel = {
  id: 'spec-1',
  title: 'Phlebotomy & Specimen Barcode Verification',
  orderAccession: 'ACC-2026-88412',
  patientVerified: true,
  containers: [
    {
      id: 'c1',
      barcode: 'BC-90418-01',
      tubeType: 'EDTA Lavender',
      testsSummary: 'CBC with Differential',
      volumeMl: 4,
      stat: true,
      status: 'scanned-collected',
    },
  ],
};

const labModel: EmrLabCumulativeGridViewModel = {
  id: 'lab-1',
  title: 'Renal & Electrolyte Flowsheet',
  panelName: 'Electrolytes',
  columns: [
    { id: 'c1', dateLabel: '06:00' },
    { id: 'c2', dateLabel: '14:00' },
  ],
  rows: [
    {
      id: 'k',
      analyteName: 'Potassium',
      unit: 'mmol/L',
      referenceRange: '3.5 - 5.1',
      values: {
        c1: { value: '6.4', flag: 'critical-high' },
        c2: { value: '4.7', flag: 'normal' },
      },
    },
  ],
};

const microModel: EmrMicrobiologyAntibiogramViewModel = {
  id: 'micro-1',
  title: 'Culture & Sensitivity Antibiogram',
  specimenSource: 'Blood Culture',
  collectionDate: '2026-11-10',
  gramStainSummary: 'Gram-negative bacilli',
  isolates: [
    {
      id: 'iso-1',
      organismName: 'Escherichia coli',
      resistanceMechanism: 'ESBL Producer',
    },
  ],
  rows: [
    {
      antibioticId: 'meropenem',
      antibioticName: 'Meropenem',
      classLabel: 'Carbapenem',
      stewardshipPreferred: true,
      resultsByIsolate: {
        'iso-1': { interpretation: 'S', micLabel: '<= 0.25' },
      },
    },
  ],
};

const anaesModel: EmrAnaesthesiaRecordViewModel = {
  id: 'anaes-1',
  title: 'Intra-Operative Anaesthesia Record',
  asaClass: 'II',
  mallampatiClass: 2,
  technique: 'General Endotracheal Balanced Anaesthesia',
  airwayDevice: '7.5 mm Cuffed ETT',
  activePhase: 'maintenance',
  checkpoints: [
    {
      id: 'cp-1',
      timeLabel: '09:00',
      hrBpm: 72,
      bpLabel: '118/74',
      spo2Pct: 99,
      etco2MmHg: 36,
      macPct: 1.0,
    },
  ],
  medications: [
    {
      id: 'm1',
      drugName: 'Propofol',
      doseLabel: '160 mg IV',
      timeLabel: '08:45',
    },
  ],
};

const fluidModel: EmrFluidBalanceChartViewModel = {
  id: 'fl-1',
  title: '24-Hour Fluid Intake & Output Chart',
  periodLabel: '24h ICU Shift',
  intakes: [
    {
      id: 'in-1',
      category: 'IV Crystalloid',
      routeOrSite: 'Plasmalyte-A',
      volumeMl: 1500,
    },
  ],
  outputs: [
    {
      id: 'out-1',
      category: 'Urine Output',
      routeOrSite: 'Foley Catheter',
      volumeMl: 1200,
    },
  ],
};

const implantModel: EmrSurgicalImplantLogViewModel = {
  id: 'imp-1',
  title: 'Perioperative Implant UDI Traceability Log',
  procedureName: 'Right Total Hip Arthroplasty',
  countsReconciled: true,
  implants: [
    {
      id: 'im-1',
      deviceName: 'Tritanium Acetabular Shell 52mm',
      manufacturer: 'Stryker Orthopaedics',
      lotNumber: 'LOT-88412',
      serialNumber: 'SN-99104',
      udiCode: '(01)00884400123456',
      expiryDate: '2030-12-31',
      anatomicalSite: 'Right Acetabulum',
      sterileVerified: true,
    },
  ],
};

describe('React / React Native L4 Acute Care, Lab & Perioperative Suite', () => {
  it('enforces use client, type-only @drguptavivek/emr-controller imports, and zero role="listbox" in .tsx', () => {
    const tsxPath = join(process.cwd(), 'packages/emr-react/src/l4-acute-lab-perioperative.tsx');
    const tsxText = readFileSync(tsxPath, 'utf8');
    expect(tsxText.trimStart().startsWith("'use client';")).toBe(true);
    expect(tsxText).not.toMatch(
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller['"]/,
    );
    expect(tsxText).not.toContain('role="listbox"');
    expect(tsxText).not.toContain('emr-controller/src');
  });

  it('evaluates pure logic helpers accurately', () => {
    expect(summarizeEdTrackCensus(edModel.patients)).toEqual({
      totalPatients: 2,
      criticalEsi12Count: 2,
      boardingCount: 1,
      fourHourBreachCount: 1,
    });
    expect(filterEdTrackPatients({ ...edModel, activeAcuityFilter: 1 })).toHaveLength(1);
    expect(formatResuscitationElapsed(375)).toBe('06:15');
    expect(countLabCriticalCells(labModel.rows)).toBe(1);
    expect(filterLabCumulativeRows({ ...labModel, showAbnormalOnly: true })).toHaveLength(1);
    expect(computeFluidBalanceSummary(fluidModel.intakes, fluidModel.outputs)).toEqual({
      totalIntakeMl: 1500,
      totalOutputMl: 1200,
      netBalanceMl: 300,
    });
  });

  it('renders EmrEdTrackBoard, EmrTriageAssessmentCard, and EmrResuscitationEventLog', () => {
    const edHtml = renderToStaticMarkup(createElement(EmrEdTrackBoard, { model: edModel }));
    expect(edHtml).toContain('Emergency Department Track Board');
    expect(edHtml).toContain('Arjun Singhania');
    expect(edHtml).toContain('ESI 1-2: 2');

    const triHtml = renderToStaticMarkup(
      createElement(EmrTriageAssessmentCard, { model: triageModel }),
    );
    expect(triHtml).toContain('Emergency Triage &amp; Primary Survey');
    expect(triHtml).toContain('ALS Ambulance');
    expect(triHtml).toContain('✓ Triage Finalized');

    const resusHtml = renderToStaticMarkup(
      createElement(EmrResuscitationEventLog, { model: resusModel }),
    );
    expect(resusHtml).toContain('ACLS Code Blue Event Recorder');
    expect(resusHtml).toContain('Elapsed: 06:15');
    expect(resusHtml).toContain('Biphasic shock 200 J delivered');
  });

  it('renders EmrSpecimenCollectionBar, EmrLabCumulativeGrid, and EmrMicrobiologyAntibiogram', () => {
    const specHtml = renderToStaticMarkup(
      createElement(EmrSpecimenCollectionBar, { model: specimenModel }),
    );
    expect(specHtml).toContain('ACC-2026-88412');
    expect(specHtml).toContain('EDTA Lavender');
    expect(specHtml).toContain('✓ 2-ID Wristband Verified');

    const labHtml = renderToStaticMarkup(createElement(EmrLabCumulativeGrid, { model: labModel }));
    expect(labHtml).toContain('Renal &amp; Electrolyte Flowsheet');
    expect(labHtml).toContain('Critical Values: 1');
    expect(labHtml).toContain('6.4 (critical-high)');

    const microHtml = renderToStaticMarkup(
      createElement(EmrMicrobiologyAntibiogram, { model: microModel }),
    );
    expect(microHtml).toContain('Culture &amp; Sensitivity Antibiogram');
    expect(microHtml).toContain('Escherichia coli (ESBL Producer)');
    expect(microHtml).toContain('Stewardship Preferred');
  });

  it('renders EmrAnaesthesiaRecord, EmrFluidBalanceChart, and EmrSurgicalImplantLog', () => {
    const anaesHtml = renderToStaticMarkup(
      createElement(EmrAnaesthesiaRecord, { model: anaesModel }),
    );
    expect(anaesHtml).toContain('Intra-Operative Anaesthesia Record');
    expect(anaesHtml).toContain('ASA II');
    expect(anaesHtml).toContain('7.5 mm Cuffed ETT');

    const fluidHtml = renderToStaticMarkup(
      createElement(EmrFluidBalanceChart, { model: fluidModel }),
    );
    expect(fluidHtml).toContain('24-Hour Fluid Intake &amp; Output Chart');
    expect(fluidHtml).toContain('Intake: 1500 mL');
    expect(fluidHtml).toContain('Net: +300 mL');

    const impHtml = renderToStaticMarkup(
      createElement(EmrSurgicalImplantLog, { model: implantModel }),
    );
    expect(impHtml).toContain('Perioperative Implant UDI Traceability Log');
    expect(impHtml).toContain('Tritanium Acetabular Shell 52mm');
    expect(impHtml).toContain('✓ Surgical Counts Reconciled');
  });
});
