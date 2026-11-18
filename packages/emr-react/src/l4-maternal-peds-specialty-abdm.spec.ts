import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import {
  EmrAbdmHealthLockerPanel,
  EmrAudiogram,
  EmrChemoRegimenRoadmap,
  EmrEncounterChargeSheet,
  EmrGrowthChart,
  EmrImmunizationLedger,
  EmrOdontogram,
  EmrPartogram,
  EmrReferralTracker,
  EmrWaveformStripViewer,
  type EmrAbdmHealthLockerPanelViewModel,
  type EmrAudiogramViewModel,
  type EmrChemoRegimenRoadmapViewModel,
  type EmrEncounterChargeSheetViewModel,
  type EmrGrowthChartViewModel,
  type EmrImmunizationLedgerViewModel,
  type EmrOdontogramViewModel,
  type EmrPartogramViewModel,
  type EmrReferralTrackerViewModel,
  type EmrWaveformStripViewerViewModel,
} from './l4-maternal-peds-specialty-abdm';
import {
  calculateEncounterChargeTotals,
  classifyGrowthZScore,
  computeDmftIndex,
  evaluatePartogramProgression,
  summarizeImmunizationCoverage,
} from './l4-maternal-peds-specialty-abdm.logic';

describe('React / React Native L4 Maternal-Child, Specialty Diagnostics & Claims/ABDM Suite', () => {
  it('enforces use client, type-only @drguptavivek/emr-controller imports, and zero relative cross-package imports', () => {
    const tsxPath = join(
      process.cwd(),
      'packages/emr-react/src/l4-maternal-peds-specialty-abdm.tsx',
    );
    const logicPath = join(
      process.cwd(),
      'packages/emr-react/src/l4-maternal-peds-specialty-abdm.logic.ts',
    );
    const tsxText = readFileSync(tsxPath, 'utf8');
    const logicText = readFileSync(logicPath, 'utf8');
    expect(tsxText.trimStart().startsWith("'use client';")).toBe(true);
    expect(tsxText).not.toMatch(
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller['"]/,
    );
    expect(tsxText).not.toContain('role="listbox"');
    expect(tsxText).not.toContain('emr-controller/src');
    expect(logicText).not.toContain('emr-controller/src');
  });

  it('evaluates pure logic helpers accurately', () => {
    expect(
      evaluatePartogramProgression([
        {
          hour: 1,
          timeLabel: '08:00',
          cervicalDilationCm: 7,
          descentStation: 0,
          fhrBpm: 105,
          contractionsPer10Min: 4,
        },
      ]),
    ).toEqual({
      latestDilationCm: 7,
      latestFhrBpm: 105,
      fhrAbnormal: true,
    });
    expect(classifyGrowthZScore(-2.5)).toBe('moderate-wasting');
    expect(
      summarizeImmunizationCoverage([
        {
          id: '1',
          vaccineName: 'BCG',
          doseNumberLabel: '1',
          ageGroupLabel: 'Birth',
          status: 'administered',
        },
        {
          id: '2',
          vaccineName: 'MR',
          doseNumberLabel: '1',
          ageGroupLabel: '9 Months',
          status: 'overdue',
        },
      ]),
    ).toEqual({ administeredCount: 1, dueCount: 0, overdueCount: 1 });
    expect(
      computeDmftIndex([
        { toothNumber: '16', arch: 'upper', status: 'caries' },
        { toothNumber: '36', arch: 'lower', status: 'missing' },
        { toothNumber: '46', arch: 'lower', status: 'restored-filling' },
      ]),
    ).toEqual({ decayed: 1, missing: 1, filled: 1, dmftTotal: 3 });
    expect(
      calculateEncounterChargeTotals([
        {
          id: '1',
          code: '99214',
          description: 'Consult',
          category: 'consultation',
          quantity: 1,
          unitPrice: 1000,
          coveredByPayer: true,
        },
        {
          id: '2',
          code: 'CONS',
          description: 'Kit',
          category: 'consumables',
          quantity: 2,
          unitPrice: 150,
          coveredByPayer: false,
        },
      ]),
    ).toEqual({ grossTotal: 1300, payerCoveredTotal: 1000, patientPayableTotal: 300 });
  });

  it('renders all 10 Maternal-Child, Specialty Diagnostics & Claims/ABDM components to static markup', () => {
    const partogramModel: EmrPartogramViewModel = {
      id: 'p1',
      title: 'WHO Labour Care Guide Partogram',
      gravidaParaLabel: 'G2P1L1 · 39w',
      membraneStatus: 'Clear Liquor',
      alertStatus: 'alert-line',
      observations: [
        {
          hour: 1,
          timeLabel: '09:00',
          cervicalDilationCm: 6,
          descentStation: -1,
          fhrBpm: 142,
          contractionsPer10Min: 4,
        },
      ],
    };
    const partogramHtml = renderToStaticMarkup(
      createElement(EmrPartogram, { model: partogramModel }),
    );
    expect(partogramHtml).toContain('WHO Labour Care Guide Partogram');
    expect(partogramHtml).toContain('G2P1L1');

    const growthModel: EmrGrowthChartViewModel = {
      id: 'g1',
      standardLabel: 'WHO 0-5y',
      activeMetric: 'weight-for-age',
      midParentalHeightCm: 168,
      points: [
        {
          id: 'pt1',
          ageLabel: '12m',
          ageMonths: 12,
          value: 9.4,
          unit: 'kg',
          centile: 45,
          zScore: -0.1,
        },
      ],
    };
    const growthHtml = renderToStaticMarkup(createElement(EmrGrowthChart, { model: growthModel }));
    expect(growthHtml).toContain('WHO 0-5y');
    expect(growthHtml).toContain('Target MPH: 168 cm');

    const immModel: EmrImmunizationLedgerViewModel = {
      id: 'i1',
      scheduleStandard: 'India UIP',
      doses: [
        {
          id: 'd1',
          vaccineName: 'Pentavalent-1',
          doseNumberLabel: 'Dose 1',
          ageGroupLabel: '6 Weeks',
          status: 'overdue',
        },
      ],
    };
    const immHtml = renderToStaticMarkup(createElement(EmrImmunizationLedger, { model: immModel }));
    expect(immHtml).toContain('Pentavalent-1');
    expect(immHtml).toContain('Overdue: 1');

    const waveModel: EmrWaveformStripViewerViewModel = {
      id: 'w1',
      modality: '12-Lead ECG',
      paperSpeed: '25 mm/s',
      gain: '10 mm/mV',
      intervals: { hrBpm: 76, prMs: 160, qrsMs: 88, qtcMs: 410 },
      leads: [{ id: 'II', label: 'Lead II', samplePoints: [0, 0.2, 1.1, -0.2] }],
      activeLeadId: 'II',
      interpretation: 'Normal sinus rhythm',
      signed: false,
    };
    const waveHtml = renderToStaticMarkup(
      createElement(EmrWaveformStripViewer, { model: waveModel }),
    );
    expect(waveHtml).toContain('12-Lead ECG');
    expect(waveHtml).toContain('Sign Interpretation');

    const odontoModel: EmrOdontogramViewModel = {
      id: 'o1',
      dentitionMode: 'permanent-fdi',
      teeth: [{ toothNumber: '16', arch: 'upper', status: 'caries' }],
    };
    const odontoHtml = renderToStaticMarkup(createElement(EmrOdontogram, { model: odontoModel }));
    expect(odontoHtml).toContain('DMFT: 1');
    expect(odontoHtml).toContain('#16');

    const audioModel: EmrAudiogramViewModel = {
      id: 'a1',
      rightEar: {
        ear: 'Right',
        ptaDbHl: 15,
        tympanogramType: 'Type A',
        degreeClassification: 'Normal',
        thresholds: [{ frequencyHz: 1000, airDbHl: 15 }],
      },
      leftEar: {
        ear: 'Left',
        ptaDbHl: 35,
        tympanogramType: 'Type B',
        degreeClassification: 'Mild Conductive Loss',
        thresholds: [{ frequencyHz: 1000, airDbHl: 35, boneDbHl: 10 }],
      },
    };
    const audioHtml = renderToStaticMarkup(createElement(EmrAudiogram, { model: audioModel }));
    expect(audioHtml).toContain('Tymp Type A');
    expect(audioHtml).toContain('Mild Conductive Loss');

    const chemoModel: EmrChemoRegimenRoadmapViewModel = {
      id: 'c1',
      protocolName: 'mFOLFOX6',
      diagnosisLabel: 'Stage IIIB Colon Cancer',
      bsaM2: 1.75,
      ecogStatus: 1,
      labClearancePassed: true,
      ancCountLabel: '2,200 /µL',
      plateletCountLabel: '180,000 /µL',
      cycles: [
        {
          cycleNumber: 1,
          plannedDate: '2026-11-01',
          status: 'active-cycle',
          dosePct: 100,
          agentsSummary: 'Oxaliplatin + 5-FU',
        },
      ],
    };
    const chemoHtml = renderToStaticMarkup(
      createElement(EmrChemoRegimenRoadmap, { model: chemoModel }),
    );
    expect(chemoHtml).toContain('mFOLFOX6');
    expect(chemoHtml).toContain('BSA 1.75 m²');

    const refModel: EmrReferralTrackerViewModel = {
      id: 'r1',
      referrals: [
        {
          id: 'ref-1',
          targetSpecialty: 'Pediatric Cardiology',
          urgency: 'urgent',
          status: 'scheduled',
          clinicalQuestion: 'Systolic murmur evaluation',
          createdAtLabel: '12 Nov 2026',
        },
      ],
    };
    const refHtml = renderToStaticMarkup(createElement(EmrReferralTracker, { model: refModel }));
    expect(refHtml).toContain('Pediatric Cardiology');
    expect(refHtml).toContain('Systolic murmur evaluation');

    const chgModel: EmrEncounterChargeSheetViewModel = {
      id: 'cs1',
      payerScheme: 'PM-JAY',
      preAuthStatus: 'preauth-approved',
      primaryDiagnosisCode: 'ICD-10 O80',
      lineItems: [
        {
          id: 'l1',
          code: 'OB-01',
          description: 'Delivery Package',
          category: 'procedure',
          quantity: 1,
          unitPrice: 12000,
          coveredByPayer: true,
        },
      ],
    };
    const chgHtml = renderToStaticMarkup(
      createElement(EmrEncounterChargeSheet, { model: chgModel }),
    );
    expect(chgHtml).toContain('PM-JAY');
    expect(chgHtml).toContain('₹12000.00');

    const abdmModel: EmrAbdmHealthLockerPanelViewModel = {
      id: 'ab1',
      abhaNumber: '91-4821-7734-9902',
      abhaAddress: 'priya.sharma@abdm',
      kycVerified: true,
      scanAndShareToken: 'TOKEN-42',
      linkedCareContextsCount: 5,
      consents: [
        {
          id: 'con-1',
          requesterHiuName: 'AIIMS Perinatal HIU',
          purpose: 'CAREMGT',
          status: 'GRANTED',
          hiTypes: ['OPConsultation', 'ImmunizationRecord'],
          validUntilLabel: '31 Dec 2026',
        },
      ],
    };
    const abdmHtml = renderToStaticMarkup(
      createElement(EmrAbdmHealthLockerPanel, { model: abdmModel }),
    );
    expect(abdmHtml).toContain('91-4821-7734-9902');
    expect(abdmHtml).toContain('AIIMS Perinatal HIU');
  });
});
