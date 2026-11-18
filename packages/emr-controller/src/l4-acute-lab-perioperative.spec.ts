import { describe, expect, it } from 'vitest';
import {
  ANAESTHESIA_PHASES,
  ED_DISPOSITION_STATES,
  ED_ESI_LEVELS,
  RESUSCITATION_QUICK_ACTIONS,
  RESUSCITATION_RHYTHMS,
  computeFluidBalanceSummary,
  countLabCriticalCells,
  summarizeEdTrackCensus,
  type EmrAnaesthesiaRecordViewModel,
  type EmrEdTrackBoardViewModel,
  type EmrFluidBalanceChartViewModel,
  type EmrLabCumulativeGridViewModel,
  type EmrMicrobiologyAntibiogramViewModel,
  type EmrResuscitationEventLogViewModel,
  type EmrSpecimenCollectionBarViewModel,
  type EmrSurgicalImplantLogViewModel,
  type EmrTriageAssessmentCardViewModel,
} from './l4-acute-lab-perioperative.models.js';

describe('L4 Acute Care, Lab & Perioperative Suite models & pure helpers', () => {
  describe('summarizeEdTrackCensus', () => {
    it('computes total census, critical ESI 1-2 count, boarding count, and 4-hour (>=240m) breach count', () => {
      const summary = summarizeEdTrackCensus([
        {
          id: 'p1',
          bayLabel: 'Resus-1',
          patientName: 'A. Sharma',
          ageSexLabel: '64M',
          esiLevel: 1,
          chiefComplaint: 'STEMI / Cardiogenic Shock',
          losMinutes: 95,
          pendingLabsCount: 1,
          pendingImagingCount: 0,
          disposition: 'in-assessment',
        },
        {
          id: 'p2',
          bayLabel: 'Acute-4',
          patientName: 'R. Patel',
          ageSexLabel: '52F',
          esiLevel: 2,
          chiefComplaint: 'Septic shock from pyelonephritis',
          losMinutes: 265,
          pendingLabsCount: 0,
          pendingImagingCount: 1,
          disposition: 'boarding-admit',
        },
        {
          id: 'p3',
          bayLabel: 'FastTrack-2',
          patientName: 'K. Verma',
          ageSexLabel: '28M',
          esiLevel: 4,
          chiefComplaint: 'Ankle sprain',
          losMinutes: 240,
          pendingLabsCount: 0,
          pendingImagingCount: 0,
          disposition: 'ready-discharge',
        },
      ]);

      expect(summary).toEqual({
        totalPatients: 3,
        criticalEsi12Count: 2,
        boardingCount: 1,
        fourHourBreachCount: 2,
      });
      expect(ED_ESI_LEVELS).toEqual([1, 2, 3, 4, 5]);
      expect(ED_DISPOSITION_STATES).toContain('boarding-admit');
    });

    it('returns zeros for an empty ED patient list', () => {
      expect(summarizeEdTrackCensus([])).toEqual({
        totalPatients: 0,
        criticalEsi12Count: 0,
        boardingCount: 0,
        fourHourBreachCount: 0,
      });
    });
  });

  describe('countLabCriticalCells', () => {
    it('counts critical-low and critical-high cells across all analyte rows', () => {
      const count = countLabCriticalCells([
        {
          id: 'k',
          analyteName: 'Potassium (Serum)',
          unit: 'mmol/L',
          referenceRange: '3.5 - 5.1',
          values: {
            t1: { value: '6.4', flag: 'critical-high' },
            t2: { value: '5.3', flag: 'high' },
            t3: { value: '4.4', flag: 'normal' },
          },
        },
        {
          id: 'hb',
          analyteName: 'Hemoglobin',
          unit: 'g/dL',
          referenceRange: '13.0 - 17.0',
          values: {
            t1: { value: '6.2', flag: 'critical-low' },
            t2: { value: '8.9', flag: 'low' },
          },
        },
      ]);

      expect(count).toBe(2);
    });
  });

  describe('computeFluidBalanceSummary', () => {
    it('calculates total intake, total output, and net fluid balance in mL', () => {
      const summary = computeFluidBalanceSummary(
        [
          {
            id: 'in-1',
            category: 'IV Crystalloid',
            routeOrSite: 'Plasmalyte Peripheral IV',
            volumeMl: 1250,
          },
          {
            id: 'in-2',
            category: 'Enteral / Oral',
            routeOrSite: 'PO Water',
            volumeMl: 450,
          },
        ],
        [
          {
            id: 'out-1',
            category: 'Urine Output',
            routeOrSite: 'Foley Catheter',
            volumeMl: 1100,
          },
          {
            id: 'out-2',
            category: 'Surgical Drain',
            routeOrSite: 'Jackson-Pratt #1',
            volumeMl: 180,
          },
        ],
      );

      expect(summary).toEqual({
        totalIntakeMl: 1700,
        totalOutputMl: 1280,
        netBalanceMl: 420,
      });
    });
  });

  describe('ViewModel contracts for all 9 Acute Care, Lab & Perioperative components', () => {
    it('constructs valid ViewModels for all 9 components', () => {
      const edVm: EmrEdTrackBoardViewModel = {
        id: 'ed-1',
        title: 'Emergency Department Track Board',
        activeAcuityFilter: 'all',
        patients: [
          {
            id: 'pt-1',
            bayLabel: 'Resus-1',
            patientName: 'Meera Nair',
            ageSexLabel: '61F',
            esiLevel: 1,
            chiefComplaint: 'Acute anterior STEMI',
            losMinutes: 42,
            pendingLabsCount: 2,
            pendingImagingCount: 1,
            disposition: 'in-assessment',
            providerName: 'Dr. R. Menon',
          },
        ],
      };

      const triageVm: EmrTriageAssessmentCardViewModel = {
        id: 'tri-1',
        arrivalMode: 'ALS Ambulance',
        chiefComplaint: 'Crushing substernal chest pain radiating to jaw',
        esiLevel: 2,
        painScore: 8,
        redFlags: ['Diaphoresis', 'ST elevation V1-V4'],
        vitalsSummary: [
          { label: 'HR', value: '114 bpm', abnormal: true },
          { label: 'BP', value: '96/62 mmHg', abnormal: true },
          { label: 'SpO2', value: '94% RA' },
        ],
        isolationRequired: false,
        triageNurse: 'RN P. Desai',
        finalized: true,
      };

      const resusVm: EmrResuscitationEventLogViewModel = {
        id: 'resus-1',
        codeStatus: 'active',
        elapsedSeconds: 360,
        currentRhythm: 'VF/pVT',
        cprCycles: 3,
        shockCount: 2,
        epinephrineDoses: 1,
        events: [
          {
            id: 'ev-1',
            timestampLabel: '00:02:00',
            category: 'shock',
            description: 'Biphasic defibrillation 200 J delivered',
            clinician: 'Dr. Kapoor',
          },
        ],
      };

      const specimenVm: EmrSpecimenCollectionBarViewModel = {
        id: 'spec-1',
        orderAccession: 'ACC-2026-88412',
        patientVerified: true,
        containers: [
          {
            id: 'c-1',
            barcode: 'BC-9901241',
            tubeType: 'EDTA Lavender',
            testsSummary: 'CBC with Differential',
            volumeMl: 4,
            stat: true,
            status: 'scanned-collected',
          },
        ],
      };

      const labVm: EmrLabCumulativeGridViewModel = {
        id: 'lab-1',
        panelName: 'Renal & Electrolyte Flowsheet',
        columns: [
          { id: 'c1', dateLabel: '12 Nov 06:00' },
          { id: 'c2', dateLabel: '12 Nov 14:00' },
        ],
        rows: [
          {
            id: 'k',
            analyteName: 'Potassium',
            unit: 'mmol/L',
            referenceRange: '3.5 - 5.1',
            values: {
              c1: { value: '6.1', flag: 'critical-high' },
              c2: { value: '4.6', flag: 'normal' },
            },
          },
        ],
      };

      const microVm: EmrMicrobiologyAntibiogramViewModel = {
        id: 'micro-1',
        specimenSource: 'Blood Culture (Peripheral Vein)',
        collectionDate: '2026-11-10',
        gramStainSummary: 'Gram-negative bacilli',
        isolates: [
          {
            id: 'iso-1',
            organismName: 'Escherichia coli',
            colonyCount: 'Positive @ 11h',
            resistanceMechanism: 'ESBL Producer',
          },
        ],
        rows: [
          {
            antibioticId: 'mero',
            antibioticName: 'Meropenem',
            classLabel: 'Carbapenem',
            stewardshipPreferred: true,
            resultsByIsolate: {
              'iso-1': { interpretation: 'S', micLabel: '<= 0.25' },
            },
          },
        ],
      };

      const anaesVm: EmrAnaesthesiaRecordViewModel = {
        id: 'anaes-1',
        asaClass: 'II',
        mallampatiClass: 2,
        technique: 'General Endotracheal Balanced Anaesthesia',
        airwayDevice: '7.5 mm Cuffed ETT @ 21 cm',
        activePhase: 'maintenance',
        checkpoints: [
          {
            id: 'cp-1',
            timeLabel: '09:15',
            hrBpm: 72,
            bpLabel: '118/74',
            spo2Pct: 99,
            etco2MmHg: 36,
            macPct: 1.0,
          },
        ],
        medications: [
          {
            id: 'med-1',
            drugName: 'Propofol',
            doseLabel: '150 mg IV Bolus',
            timeLabel: '09:02',
          },
        ],
      };

      const fluidVm: EmrFluidBalanceChartViewModel = {
        id: 'fl-1',
        periodLabel: '24h ICU Shift (07:00 - 07:00)',
        patientWeightKg: 70,
        targetNetBalanceMl: 0,
        intakes: [
          {
            id: 'i-1',
            category: 'IV Crystalloid',
            routeOrSite: 'Ringer Lactate',
            volumeMl: 1000,
          },
        ],
        outputs: [
          {
            id: 'o-1',
            category: 'Urine',
            routeOrSite: 'Foley',
            volumeMl: 950,
          },
        ],
      };

      const implantVm: EmrSurgicalImplantLogViewModel = {
        id: 'imp-1',
        procedureName: 'Right Total Hip Arthroplasty',
        countsReconciled: true,
        implants: [
          {
            id: 'im-1',
            deviceName: 'Uncemented Titanium Acetabular Cup 52mm',
            manufacturer: 'Stryker Orthopaedics',
            lotNumber: 'LOT-88412',
            serialNumber: 'SN-552910',
            udiCode: '(01)00884400123456(17)291231(21)SN552910',
            expiryDate: '2029-12-31',
            anatomicalSite: 'Right Acetabulum',
            sterileVerified: true,
          },
        ],
      };

      expect(edVm.patients[0]?.esiLevel).toBe(1);
      expect(triageVm.finalized).toBe(true);
      expect(resusVm.currentRhythm).toBe('VF/pVT');
      expect(RESUSCITATION_QUICK_ACTIONS).toContain('epinephrine-1mg');
      expect(RESUSCITATION_RHYTHMS).toContain('ROSC');
      expect(specimenVm.patientVerified).toBe(true);
      expect(labVm.rows[0]?.values.c1?.flag).toBe('critical-high');
      expect(microVm.rows[0]?.stewardshipPreferred).toBe(true);
      expect(anaesVm.activePhase).toBe('maintenance');
      expect(ANAESTHESIA_PHASES).toContain('pacu-handover');
      expect(fluidVm.patientWeightKg).toBe(70);
      expect(implantVm.countsReconciled).toBe(true);
    });
  });
});
