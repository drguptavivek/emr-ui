import { describe, expect, it } from 'vitest';
import {
  calculateEncounterChargeTotals,
  classifyGrowthZScore,
  computeDmftIndex,
  evaluatePartogramProgression,
  summarizeImmunizationCoverage,
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
} from './l4-maternal-peds-specialty-abdm.models.js';

describe('L4 Maternal-Child, Specialty Diagnostics & Claims/ABDM models & pure helpers', () => {
  describe('evaluatePartogramProgression', () => {
    it('returns zeroes and fhrAbnormal=false for empty observations', () => {
      expect(evaluatePartogramProgression([])).toEqual({
        latestDilationCm: 0,
        latestFhrBpm: 0,
        fhrAbnormal: false,
      });
    });

    it('evaluates latest cervical dilation and flags FHR < 110 or > 160 bpm as abnormal', () => {
      const normalObs = [
        {
          hour: 1,
          timeLabel: '08:00',
          cervicalDilationCm: 4,
          descentStation: -2,
          fhrBpm: 140,
          contractionsPer10Min: 3,
        },
        {
          hour: 3,
          timeLabel: '10:00',
          cervicalDilationCm: 6,
          descentStation: -1,
          fhrBpm: 146,
          contractionsPer10Min: 4,
          oxytocinUnitsPerL: 5,
        },
      ];
      expect(evaluatePartogramProgression(normalObs)).toEqual({
        latestDilationCm: 6,
        latestFhrBpm: 146,
        fhrAbnormal: false,
      });

      const bradyObs = [
        ...normalObs,
        {
          hour: 4,
          timeLabel: '11:00',
          cervicalDilationCm: 7,
          descentStation: 0,
          fhrBpm: 102,
          contractionsPer10Min: 5,
        },
      ];
      expect(evaluatePartogramProgression(bradyObs)).toEqual({
        latestDilationCm: 7,
        latestFhrBpm: 102,
        fhrAbnormal: true,
      });

      const tachyObs = [
        ...normalObs,
        {
          hour: 4,
          timeLabel: '11:00',
          cervicalDilationCm: 8,
          descentStation: 1,
          fhrBpm: 168,
          contractionsPer10Min: 4,
        },
      ];
      expect(evaluatePartogramProgression(tachyObs)).toEqual({
        latestDilationCm: 8,
        latestFhrBpm: 168,
        fhrAbnormal: true,
      });
    });
  });

  describe('classifyGrowthZScore', () => {
    it('classifies WHO/IAP anthropometric Z-scores accurately', () => {
      expect(classifyGrowthZScore(-3.4)).toBe('severe-stunting-or-wasting');
      expect(classifyGrowthZScore(-2.3)).toBe('moderate-wasting');
      expect(classifyGrowthZScore(-0.4)).toBe('normal');
      expect(classifyGrowthZScore(2.5)).toBe('overweight');
    });
  });

  describe('summarizeImmunizationCoverage', () => {
    it('tallies administered, due, and overdue doses while ignoring contraindicated', () => {
      const summary = summarizeImmunizationCoverage([
        {
          id: 'd1',
          vaccineName: 'BCG',
          doseNumberLabel: 'Single Dose',
          ageGroupLabel: 'Birth',
          status: 'administered',
          dateLabel: '2026-01-10',
        },
        {
          id: 'd2',
          vaccineName: 'Pentavalent',
          doseNumberLabel: 'Dose 1',
          ageGroupLabel: '6 Weeks',
          status: 'administered',
        },
        {
          id: 'd3',
          vaccineName: 'Pentavalent',
          doseNumberLabel: 'Dose 2',
          ageGroupLabel: '10 Weeks',
          status: 'overdue',
        },
        {
          id: 'd4',
          vaccineName: 'MR',
          doseNumberLabel: 'Dose 1',
          ageGroupLabel: '9 Months',
          status: 'due',
        },
        {
          id: 'd5',
          vaccineName: 'Rotavirus',
          doseNumberLabel: 'Dose 2',
          ageGroupLabel: '10 Weeks',
          status: 'contraindicated',
        },
      ]);
      expect(summary).toEqual({
        administeredCount: 2,
        dueCount: 1,
        overdueCount: 1,
      });
    });
  });

  describe('computeDmftIndex', () => {
    it('calculates Decayed, Missing, Filled, and total DMFT score across arches', () => {
      const res = computeDmftIndex([
        { toothNumber: '16', arch: 'upper', status: 'caries', pocketDepthMm: 4 },
        { toothNumber: '26', arch: 'upper', status: 'restored-filling' },
        { toothNumber: '36', arch: 'lower', status: 'missing' },
        { toothNumber: '46', arch: 'lower', status: 'crown' },
        { toothNumber: '11', arch: 'upper', status: 'sound' },
        { toothNumber: '21', arch: 'upper', status: 'implant' },
      ]);
      expect(res).toEqual({
        decayed: 1,
        missing: 1,
        filled: 2,
        dmftTotal: 4,
      });
    });
  });

  describe('calculateEncounterChargeTotals', () => {
    it('computes grossTotal, payerCoveredTotal, and patientPayableTotal', () => {
      const totals = calculateEncounterChargeTotals([
        {
          id: 'c1',
          code: '99214',
          description: 'Specialty OPD Consultation',
          category: 'consultation',
          quantity: 1,
          unitPrice: 800,
          coveredByPayer: true,
        },
        {
          id: 'c2',
          code: '93000',
          description: '12-Lead ECG with Interpretation',
          category: 'diagnostics',
          quantity: 1,
          unitPrice: 450,
          coveredByPayer: true,
        },
        {
          id: 'c3',
          code: 'CONS-01',
          description: 'Disposable Electrode & Consumables Kit',
          category: 'consumables',
          quantity: 2,
          unitPrice: 175.5,
          coveredByPayer: false,
        },
      ]);
      expect(totals).toEqual({
        grossTotal: 1601,
        payerCoveredTotal: 1250,
        patientPayableTotal: 351,
      });
    });
  });

  describe('ViewModel contracts for all 10 components', () => {
    it('validates type structures for all 10 Maternal-Child, Specialty Diagnostics & Claims/ABDM ViewModels', () => {
      const partogramVm: EmrPartogramViewModel = {
        id: 'parto-1',
        title: 'WHO Labour Care Guide Partogram',
        gravidaParaLabel: 'G2P1L1 · 39w 2d',
        membraneStatus: 'Clear Liquor',
        alertStatus: 'normal',
        observations: [
          {
            hour: 1,
            timeLabel: '09:00',
            cervicalDilationCm: 5,
            descentStation: -1,
            fhrBpm: 142,
            contractionsPer10Min: 4,
          },
        ],
      };

      const growthVm: EmrGrowthChartViewModel = {
        id: 'growth-1',
        standardLabel: 'WHO 0-5y',
        activeMetric: 'weight-for-age',
        midParentalHeightCm: 168.5,
        points: [
          {
            id: 'p1',
            ageLabel: '12m',
            ageMonths: 12,
            value: 9.6,
            unit: 'kg',
            centile: 50,
            zScore: 0.0,
            flag: 'normal',
          },
        ],
      };

      const immVm: EmrImmunizationLedgerViewModel = {
        id: 'imm-1',
        scheduleStandard: 'National UIP + IAP 2026',
        activeFilter: 'all',
        doses: [
          {
            id: 'dose-1',
            vaccineName: 'BCG',
            doseNumberLabel: 'Dose 1',
            ageGroupLabel: 'Birth',
            status: 'administered',
            batchLotNumber: 'BCG-2026-09',
          },
        ],
      };

      const waveformVm: EmrWaveformStripViewerViewModel = {
        id: 'ecg-1',
        modality: '12-Lead ECG',
        paperSpeed: '25 mm/s',
        gain: '10 mm/mV',
        intervals: { hrBpm: 74, prMs: 162, qrsMs: 88, qtcMs: 412 },
        leads: [{ id: 'II', label: 'Lead II', samplePoints: [0, 0.2, 1.1, -0.3, 0.3, 0] }],
        activeLeadId: 'II',
        interpretation: 'Normal sinus rhythm, normal QTc interval.',
        signed: true,
      };

      const odontoVm: EmrOdontogramViewModel = {
        id: 'odonto-1',
        dentitionMode: 'permanent-fdi',
        teeth: [{ toothNumber: '16', arch: 'upper', status: 'caries', pocketDepthMm: 4 }],
      };

      const audioVm: EmrAudiogramViewModel = {
        id: 'audio-1',
        activeConductionView: 'both',
        rightEar: {
          ear: 'Right',
          ptaDbHl: 18,
          sdsPct: 96,
          tympanogramType: 'Type A',
          degreeClassification: 'Normal Hearing',
          thresholds: [{ frequencyHz: 1000, airDbHl: 15, boneDbHl: 10 }],
        },
        leftEar: {
          ear: 'Left',
          ptaDbHl: 38,
          sdsPct: 88,
          tympanogramType: 'Type B',
          degreeClassification: 'Mild Conductive Loss',
          thresholds: [{ frequencyHz: 1000, airDbHl: 40, boneDbHl: 15, masked: true }],
        },
      };

      const chemoVm: EmrChemoRegimenRoadmapViewModel = {
        id: 'chemo-1',
        protocolName: 'mFOLFOX6',
        diagnosisLabel: 'Stage IIIB Colon Adenocarcinoma',
        bsaM2: 1.78,
        ecogStatus: 1,
        labClearancePassed: true,
        ancCountLabel: '2,450 /µL',
        plateletCountLabel: '185,000 /µL',
        cycles: [
          {
            cycleNumber: 1,
            plannedDate: '2026-10-15',
            status: 'completed',
            dosePct: 100,
            agentsSummary: 'Oxaliplatin 85 mg/m² + Leucovorin + 5-FU',
          },
        ],
      };

      const referralVm: EmrReferralTrackerViewModel = {
        id: 'ref-1',
        activeFilter: 'all',
        referrals: [
          {
            id: 'r1',
            targetSpecialty: 'Pediatric Cardiology',
            urgency: 'urgent',
            status: 'scheduled',
            clinicalQuestion: 'Evaluate grade 3/6 systolic murmur for VSD',
            createdAtLabel: '12 Nov 2026',
          },
        ],
      };

      const chargeVm: EmrEncounterChargeSheetViewModel = {
        id: 'chg-1',
        payerScheme: 'PM-JAY Ayushman Bharat',
        preAuthStatus: 'preauth-approved',
        preAuthNumber: 'PMJAY-2026-88412',
        currencySymbol: '₹',
        primaryDiagnosisCode: 'ICD-10 O80 (Full-term uncomplicated delivery)',
        lineItems: [
          {
            id: 'li-1',
            code: 'PKG-OB-01',
            description: 'Normal Vaginal Delivery Package',
            category: 'procedure',
            quantity: 1,
            unitPrice: 12000,
            coveredByPayer: true,
          },
        ],
      };

      const abdmVm: EmrAbdmHealthLockerPanelViewModel = {
        id: 'abdm-1',
        abhaNumber: '91-4821-7734-9902',
        abhaAddress: 'priya.sharma@abdm',
        kycVerified: true,
        scanAndShareToken: 'OPD-TOKEN-42',
        linkedCareContextsCount: 6,
        consents: [
          {
            id: 'con-1',
            requesterHiuName: 'AIIMS Maternal-Child Care Unit',
            purpose: 'Care Management (CAREMGT)',
            status: 'GRANTED',
            hiTypes: ['OPConsultation', 'Prescription', 'ImmunizationRecord'],
            validUntilLabel: '31 Dec 2026',
          },
        ],
      };

      expect(partogramVm.membraneStatus).toBe('Clear Liquor');
      expect(growthVm.standardLabel).toBe('WHO 0-5y');
      expect(immVm.doses).toHaveLength(1);
      expect(waveformVm.signed).toBe(true);
      expect(odontoVm.dentitionMode).toBe('permanent-fdi');
      expect(audioVm.rightEar.tympanogramType).toBe('Type A');
      expect(chemoVm.protocolName).toBe('mFOLFOX6');
      expect(referralVm.referrals[0]?.urgency).toBe('urgent');
      expect(chargeVm.preAuthStatus).toBe('preauth-approved');
      expect(abdmVm.kycVerified).toBe(true);
    });
  });
});
