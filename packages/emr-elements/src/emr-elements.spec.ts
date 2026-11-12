// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { EmrPacsStudyEntry, InpatientMarViewModel, SpecialtyExamMatrixViewModel } from '@drguptavivek/emr-controller';
import { EMR_CATALOG } from '../../emr-ui/catalog.manifest';
import { slugForEntry } from '../../../scripts/build-registry.mjs';
import {
  EMR_DENSITY_MAP,
  EMR_FONT_STACKS,
  EMR_PALETTE_PRESETS,
  EMR_RADIUS_MAP,
  EmrLitElement,
  EmrInpatientMarElement,
  EmrPacsViewerElement,
  EmrPrescribingTableElement,
  EmrSpecialtyExamMatrixElement,
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
