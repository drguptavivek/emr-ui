// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  EmrAnaesthesiaRecordElement,
  EmrEdTrackBoardElement,
  EmrFluidBalanceChartElement,
  EmrLabCumulativeGridElement,
  EmrMicrobiologyAntibiogramElement,
  EmrResuscitationEventLogElement,
  EmrSpecimenCollectionBarElement,
  EmrSurgicalImplantLogElement,
  EmrTriageAssessmentCardElement,
  computeFluidBalanceSummary,
  countLabCriticalCells,
  registerL4AcuteLabPerioperativeElements,
  summarizeEdTrackCensus,
} from './l4-acute-lab-perioperative.js';

describe('L4 Acute Care, Lab & Perioperative Custom Elements (Lit)', () => {
  registerL4AcuteLabPerioperativeElements();

  it('registers all 9 custom element tag names in customElements registry', () => {
    expect(customElements.get('emr-ed-track-board')).toBe(EmrEdTrackBoardElement);
    expect(customElements.get('emr-triage-assessment-card')).toBe(EmrTriageAssessmentCardElement);
    expect(customElements.get('emr-resuscitation-event-log')).toBe(EmrResuscitationEventLogElement);
    expect(customElements.get('emr-specimen-collection-bar')).toBe(EmrSpecimenCollectionBarElement);
    expect(customElements.get('emr-lab-cumulative-grid')).toBe(EmrLabCumulativeGridElement);
    expect(customElements.get('emr-microbiology-antibiogram')).toBe(
      EmrMicrobiologyAntibiogramElement,
    );
    expect(customElements.get('emr-anaesthesia-record')).toBe(EmrAnaesthesiaRecordElement);
    expect(customElements.get('emr-fluid-balance-chart')).toBe(EmrFluidBalanceChartElement);
    expect(customElements.get('emr-surgical-implant-log')).toBe(EmrSurgicalImplantLogElement);
  });

  it('renders emr-ed-track-board and dispatches acuityFilterChanged', async () => {
    const el = document.createElement('emr-ed-track-board') as EmrEdTrackBoardElement;
    el.model = {
      id: 'ed-1',
      title: 'ED Track Board',
      activeAcuityFilter: 'all',
      patients: [
        {
          id: 'p1',
          bayLabel: 'Resus-1',
          patientName: 'Arjun Singhania',
          ageSexLabel: '64M',
          esiLevel: 1,
          chiefComplaint: 'STEMI',
          losMinutes: 45,
          pendingLabsCount: 1,
          pendingImagingCount: 0,
          disposition: 'in-assessment',
        },
      ],
    };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain('Arjun Singhania');
    expect(summarizeEdTrackCensus(el.model.patients).criticalEsi12Count).toBe(1);

    let captured: unknown;
    el.addEventListener('intent', (e) => {
      captured = (e as CustomEvent).detail;
    });
    const buttons = Array.from(el.shadowRoot?.querySelectorAll('button') ?? []);
    const esi1Btn = buttons.find((b) => b.textContent?.trim() === 'ESI 1');
    esi1Btn?.click();
    expect(captured).toEqual({ type: 'acuityFilterChanged', filter: 1 });
    el.remove();
  });

  it('renders emr-triage-assessment-card and emr-resuscitation-event-log', async () => {
    const tri = document.createElement(
      'emr-triage-assessment-card',
    ) as EmrTriageAssessmentCardElement;
    tri.model = {
      id: 'tri-1',
      arrivalMode: 'ALS Ambulance',
      chiefComplaint: 'Acute chest pain',
      esiLevel: 2,
      painScore: 8,
      redFlags: ['Diaphoresis'],
      vitalsSummary: [{ label: 'HR', value: '112 bpm', abnormal: true }],
      isolationRequired: false,
      finalized: false,
    };
    document.body.appendChild(tri);
    await tri.updateComplete;
    expect(tri.shadowRoot?.textContent).toContain('Acute chest pain');
    tri.remove();

    const resus = document.createElement(
      'emr-resuscitation-event-log',
    ) as EmrResuscitationEventLogElement;
    resus.model = {
      id: 'resus-1',
      codeStatus: 'active',
      elapsedSeconds: 180,
      currentRhythm: 'VF/pVT',
      cprCycles: 2,
      shockCount: 1,
      epinephrineDoses: 1,
      events: [
        {
          id: 'ev-1',
          timestampLabel: '00:02:00',
          category: 'shock',
          description: '200 J shock',
        },
      ],
    };
    document.body.appendChild(resus);
    await resus.updateComplete;
    expect(resus.shadowRoot?.textContent).toContain('03:00');
    resus.remove();
  });

  it('renders emr-specimen-collection-bar, emr-lab-cumulative-grid, and emr-microbiology-antibiogram', async () => {
    const spec = document.createElement(
      'emr-specimen-collection-bar',
    ) as EmrSpecimenCollectionBarElement;
    spec.model = {
      id: 'spec-1',
      orderAccession: 'ACC-101',
      patientVerified: true,
      containers: [
        {
          id: 'c1',
          barcode: 'BC-101',
          tubeType: 'EDTA Lavender',
          testsSummary: 'CBC',
          volumeMl: 4,
          status: 'scanned-collected',
        },
      ],
    };
    document.body.appendChild(spec);
    await spec.updateComplete;
    expect(spec.shadowRoot?.textContent).toContain('ACC-101');
    spec.remove();

    const lab = document.createElement('emr-lab-cumulative-grid') as EmrLabCumulativeGridElement;
    lab.model = {
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
      ],
    };
    document.body.appendChild(lab);
    await lab.updateComplete;
    expect(countLabCriticalCells(lab.model.rows)).toBe(1);
    expect(lab.shadowRoot?.textContent).toContain('Critical Values: 1');
    lab.remove();

    const micro = document.createElement(
      'emr-microbiology-antibiogram',
    ) as EmrMicrobiologyAntibiogramElement;
    micro.model = {
      id: 'm1',
      specimenSource: 'Blood Culture',
      collectionDate: '2026-11-12',
      isolates: [{ id: 'iso1', organismName: 'Escherichia coli' }],
      rows: [
        {
          antibioticId: 'mero',
          antibioticName: 'Meropenem',
          stewardshipPreferred: true,
          resultsByIsolate: { iso1: { interpretation: 'S', micLabel: '<=0.25' } },
        },
      ],
    };
    document.body.appendChild(micro);
    await micro.updateComplete;
    expect(micro.shadowRoot?.textContent).toContain('Meropenem');
    micro.remove();
  });

  it('renders emr-anaesthesia-record, emr-fluid-balance-chart, and emr-surgical-implant-log', async () => {
    const anaes = document.createElement('emr-anaesthesia-record') as EmrAnaesthesiaRecordElement;
    anaes.model = {
      id: 'a1',
      asaClass: 'II',
      mallampatiClass: 2,
      technique: 'General',
      airwayDevice: 'ETT 7.5',
      activePhase: 'maintenance',
      checkpoints: [],
      medications: [],
    };
    document.body.appendChild(anaes);
    await anaes.updateComplete;
    expect(anaes.shadowRoot?.textContent).toContain('ASA II');
    anaes.remove();

    const fluid = document.createElement('emr-fluid-balance-chart') as EmrFluidBalanceChartElement;
    fluid.model = {
      id: 'f1',
      periodLabel: '24h',
      intakes: [{ id: 'i1', category: 'IV', routeOrSite: 'RL', volumeMl: 1200 }],
      outputs: [{ id: 'o1', category: 'Urine', routeOrSite: 'Foley', volumeMl: 900 }],
    };
    document.body.appendChild(fluid);
    await fluid.updateComplete;
    expect(computeFluidBalanceSummary(fluid.model.intakes, fluid.model.outputs).netBalanceMl).toBe(
      300,
    );
    expect(fluid.shadowRoot?.textContent).toContain('Net: 300 mL');
    fluid.remove();

    const imp = document.createElement('emr-surgical-implant-log') as EmrSurgicalImplantLogElement;
    imp.model = {
      id: 'imp1',
      procedureName: 'Total Hip Arthroplasty',
      countsReconciled: true,
      implants: [
        {
          id: 'im1',
          deviceName: 'Acetabular Shell',
          manufacturer: 'Stryker',
          lotNumber: 'L1',
          serialNumber: 'S1',
          udiCode: 'UDI-1',
          expiryDate: '2030-01-01',
          anatomicalSite: 'Right Hip',
          sterileVerified: true,
        },
      ],
    };
    document.body.appendChild(imp);
    await imp.updateComplete;
    expect(imp.shadowRoot?.textContent).toContain('Acetabular Shell');
    imp.remove();
  });
});
