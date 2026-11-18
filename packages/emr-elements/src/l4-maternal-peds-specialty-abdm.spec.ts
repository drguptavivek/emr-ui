// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  EmrAbdmHealthLockerPanelElement,
  EmrAudiogramElement,
  EmrChemoRegimenRoadmapElement,
  EmrEncounterChargeSheetElement,
  EmrGrowthChartElement,
  EmrImmunizationLedgerElement,
  EmrOdontogramElement,
  EmrPartogramElement,
  EmrReferralTrackerElement,
  EmrWaveformStripViewerElement,
  registerL4MaternalPedsSpecialtyAbdmElements,
} from './l4-maternal-peds-specialty-abdm.js';

describe('Lit L4 Maternal-Child, Specialty Diagnostics & Claims/ABDM Custom Elements', () => {
  it('registers all 10 custom elements via registerL4MaternalPedsSpecialtyAbdmElements()', () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    for (const tag of [
      'emr-partogram',
      'emr-growth-chart',
      'emr-immunization-ledger',
      'emr-waveform-strip-viewer',
      'emr-odontogram',
      'emr-audiogram',
      'emr-chemo-regimen-roadmap',
      'emr-referral-tracker',
      'emr-encounter-charge-sheet',
      'emr-abdm-health-locker-panel',
    ]) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it('renders EmrPartogramElement and emits checkpointSelected, membraneStatusChanged, and alertStatusChanged', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement('emr-partogram') as EmrPartogramElement;
    el.model = {
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
          fhrBpm: 142,
          contractionsPer10Min: 4,
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('G2P1L1 · 39w');

      const memBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Meconium Stained',
      )!;
      memBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'membraneStatusChanged',
        status: 'Meconium Stained',
      });

      const hrBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Select Hr 2'),
      )!;
      hrBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'checkpointSelected', hour: 2 });
    } finally {
      el.remove();
    }
  });

  it('renders EmrGrowthChartElement and emits metricChanged and pointSelected', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement('emr-growth-chart') as EmrGrowthChartElement;
    el.model = {
      id: 'g1',
      standardLabel: 'WHO 0-5y',
      activeMetric: 'weight-for-age',
      midParentalHeightCm: 168,
      points: [
        {
          id: 'p12',
          ageLabel: '12m',
          ageMonths: 12,
          value: 9.5,
          unit: 'kg',
          centile: 50,
          zScore: 0,
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Target MPH: 168 cm');

      const metricBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'height-for-age',
      )!;
      metricBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'metricChanged', metric: 'height-for-age' });

      const ptBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Select 12m'),
      )!;
      ptBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'pointSelected', pointId: 'p12' });
    } finally {
      el.remove();
    }
  });

  it('renders EmrImmunizationLedgerElement and emits filterChanged, doseSelected, and administerDoseRequested', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement('emr-immunization-ledger') as EmrImmunizationLedgerElement;
    el.model = {
      id: 'imm1',
      scheduleStandard: 'India UIP',
      doses: [
        {
          id: 'd-penta',
          vaccineName: 'Pentavalent-1',
          doseNumberLabel: 'Dose 1',
          ageGroupLabel: '6 Weeks',
          status: 'overdue',
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Overdue: 1');

      const admBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Administer Pentavalent-1'),
      )!;
      admBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'administerDoseRequested',
        doseId: 'd-penta',
        vaccineName: 'Pentavalent-1',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrWaveformStripViewerElement and emits leadSelected, paperSpeedChanged, and signInterpretationRequested', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement(
      'emr-waveform-strip-viewer',
    ) as EmrWaveformStripViewerElement;
    el.model = {
      id: 'w1',
      modality: '12-Lead ECG',
      paperSpeed: '25 mm/s',
      gain: '10 mm/mV',
      intervals: { hrBpm: 76, prMs: 160, qrsMs: 88, qtcMs: 410 },
      leads: [
        { id: 'II', label: 'Lead II', samplePoints: [0, 0.2, 1.1] },
        { id: 'V1', label: 'Lead V1', samplePoints: [0, -0.8, 0.1] },
      ],
      activeLeadId: 'II',
      interpretation: 'Normal sinus rhythm',
      signed: false,
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const signBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Sign Interpretation'),
      )!;
      signBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'signInterpretationRequested' });
    } finally {
      el.remove();
    }
  });

  it('renders EmrOdontogramElement and emits toothSelected, toothStatusChanged, and dentitionModeChanged', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement('emr-odontogram') as EmrOdontogramElement;
    el.model = {
      id: 'od1',
      dentitionMode: 'permanent-fdi',
      selectedToothNumber: '16',
      teeth: [{ toothNumber: '16', arch: 'upper', status: 'caries' }],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('DMFT: 1');

      const rctBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'endodontic-rct',
      )!;
      rctBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'toothStatusChanged',
        toothNumber: '16',
        status: 'endodontic-rct',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrAudiogramElement and emits conductionViewChanged and thresholdSelected', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement('emr-audiogram') as EmrAudiogramElement;
    el.model = {
      id: 'aud1',
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
        thresholds: [{ frequencyHz: 2000, airDbHl: 35 }],
      },
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const thBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('2000Hz: 35dB'),
      )!;
      thBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'thresholdSelected',
        ear: 'Left',
        frequencyHz: 2000,
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrChemoRegimenRoadmapElement and emits cycleSelected, cycleDoseAdjusted, and clearanceOverrideRequested', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement(
      'emr-chemo-regimen-roadmap',
    ) as EmrChemoRegimenRoadmapElement;
    el.model = {
      id: 'ch1',
      protocolName: 'mFOLFOX6',
      diagnosisLabel: 'Colon Cancer',
      bsaM2: 1.75,
      ecogStatus: 1,
      labClearancePassed: false,
      ancCountLabel: '1,100 /µL',
      plateletCountLabel: '95,000 /µL',
      cycles: [
        {
          cycleNumber: 2,
          plannedDate: '2026-11-15',
          status: 'held-toxicity',
          dosePct: 100,
          agentsSummary: 'Oxaliplatin + 5-FU',
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const ovrBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Override Gate C2'),
      )!;
      ovrBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'clearanceOverrideRequested',
        cycleNumber: 2,
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrReferralTrackerElement and emits filterChanged, referralSelected, and referralStatusUpdated', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement('emr-referral-tracker') as EmrReferralTrackerElement;
    el.model = {
      id: 'ref1',
      referrals: [
        {
          id: 'r1',
          targetSpecialty: 'Neonatology',
          urgency: 'emergent',
          status: 'sent',
          clinicalQuestion: 'RDS evaluation',
          createdAtLabel: '12 Nov 2026',
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const cmpBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Mark Completed'),
      )!;
      cmpBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'referralStatusUpdated',
        referralId: 'r1',
        status: 'completed-report-filed',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrEncounterChargeSheetElement and emits coverageToggled and submitClaimRequested', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement(
      'emr-encounter-charge-sheet',
    ) as EmrEncounterChargeSheetElement;
    el.model = {
      id: 'chg1',
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
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const subBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Submit Claim'),
      )!;
      subBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'submitClaimRequested' });
    } finally {
      el.remove();
    }
  });

  it('renders EmrAbdmHealthLockerPanelElement and emits consentActionRequested, requestNewConsent, and linkCareContextRequested', async () => {
    registerL4MaternalPedsSpecialtyAbdmElements();
    const el = document.createElement(
      'emr-abdm-health-locker-panel',
    ) as EmrAbdmHealthLockerPanelElement;
    el.model = {
      id: 'abdm1',
      abhaNumber: '91-4821-7734-9902',
      abhaAddress: 'priya.sharma@abdm',
      kycVerified: true,
      linkedCareContextsCount: 4,
      consents: [
        {
          id: 'con-1',
          requesterHiuName: 'AIIMS Perinatal HIU',
          purpose: 'CAREMGT',
          status: 'REQUESTED',
          hiTypes: ['OPConsultation'],
          validUntilLabel: '31 Dec 2026',
        },
      ],
    };
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      const appBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Approve con-1'),
      )!;
      appBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'consentActionRequested',
        consentId: 'con-1',
        action: 'approve',
      });
    } finally {
      el.remove();
    }
  });
});
