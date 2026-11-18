import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  InpatientMarIntent,
  InpatientMarViewModel,
  PacsViewerIntent,
  PacsViewerViewModel,
} from '@drguptavivek/emr-controller';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-encounter-surfaces.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadEncounterSurfacesModule() {
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
    EmrPacsViewerComponent: new () => Record<string, any>;
    EmrSpecialtyExamMatrixComponent: new () => Record<string, any>;
    EmrInpatientMarComponent: new () => Record<string, any>;
    EmrEncounterSummaryPrintComponent: new () => Record<string, any>;
    PACS_WINDOW_PRESETS: readonly string[];
  };
}

const mod = loadEncounterSurfacesModule();

function makePacsModel(overrides: Partial<PacsViewerViewModel> = {}): PacsViewerViewModel {
  return {
    title: 'Multi-Viewport PACS Viewer',
    activeStudyId: 'st-1',
    compareStudyId: 'st-2',
    layoutMode: '2-up-od-os',
    syncScroll: true,
    studies: [
      {
        id: 'st-1',
        accessionNumber: 'ACC-01',
        dateLabel: '12 Nov 2026 09:00',
        modality: 'OCT',
        bodyPart: 'Macula OD',
        title: 'Macular Cube OD',
        status: 'Final Report',
        pacsEndpointLabel: 'DICOMweb · ORTHANC-01',
        sliceCount: 128,
        currentSlice: 64,
        windowPreset: 'Retina/OCT',
        zoomPercent: 100,
        inverted: true,
        caliperMeasurementLabel: 'CST 412 µm',
        radiologistImpression: 'Subfoveal fluid noted.',
        keyFindings: ['CST 412 µm'],
      },
      {
        id: 'st-2',
        accessionNumber: 'ACC-02',
        dateLabel: '12 Nov 2026 09:05',
        modality: 'OCT',
        bodyPart: 'Macula OS',
        title: 'Macular Cube OS',
        status: 'Preliminary',
        pacsEndpointLabel: 'DICOMweb · ORTHANC-01',
        sliceCount: 128,
        currentSlice: 64,
        windowPreset: 'Retina/OCT',
        zoomPercent: 200,
        inverted: false,
        radiologistImpression: 'Normal macula OS.',
        keyFindings: [],
      },
    ],
    ...overrides,
  };
}

function makeMarModel(overrides: Partial<InpatientMarViewModel> = {}): InpatientMarViewModel {
  return {
    title: 'Inpatient eMAR',
    wardBedLabel: 'Ward 4 · Bed 18',
    shiftLabel: 'Day Shift',
    nurseLabel: 'RN Kavita',
    timeColumns: [
      { id: '0800', timeLabel: '08:00', slotLabel: 'Morning' },
      { id: '1400', timeLabel: '14:00', slotLabel: 'Afternoon' },
      { id: '1800', timeLabel: '18:00', slotLabel: 'Evening' },
      { id: '2200', timeLabel: '22:00', slotLabel: 'Night' },
    ],
    orders: [
      {
        id: 'ord-1',
        drugName: 'Insulin Regular',
        strength: '100 IU/mL',
        formLabel: 'Injection',
        formularyCode: 'FORM-INS-01',
        doseLabel: '6 units',
        routeLabel: 'Subcutaneous',
        siteLabel: 'Abdomen',
        frequencyCode: 'TDS',
        stepPhase: 'step-down',
        stepLabel: '↘ Step-Down',
        highAlert: true,
        dualSignVerified: false,
        administrations: [
          { slotId: '0800', scheduledTime: '08:00', status: 'given', administeredAtLabel: '08:02', bcmaScanned: true },
          { slotId: '1400', scheduledTime: '14:00', status: 'due', bcmaScanned: true },
          { slotId: '1800', scheduledTime: '18:00', status: 'held', holdReason: 'NPO for procedure' },
          { slotId: '2200', scheduledTime: '22:00', status: 'refused' },
        ],
      },
    ],
    ...overrides,
  };
}

describe('EmrPacsViewerComponent & EmrInpatientMarComponent (emr-yr5.2)', () => {
  describe('EmrPacsViewerComponent', () => {
    it('renders DICOMweb PACS badge, Sync Scroll toggle, W/L presets, data-inverted, Pin Key Image, and uppercase status', () => {
      expect(componentSource).toContain('DICOMweb PACS');
      expect(componentSource).toContain("type: 'syncScrollToggled'");
      expect(componentSource).toContain('Comparison study unavailable');
      expect(componentSource).toContain('[attr.data-inverted]="st.inverted ? \'true\' : null"');
      expect(componentSource).toContain('☆ Pin Key Image');
      expect(componentSource).toContain('st.status.toUpperCase()');
      expect(mod.PACS_WINDOW_PRESETS).toEqual(['Retina/OCT', 'High-Contrast', 'Brain/Orbit', 'Bone']);
    });

    it('cycles zoom, pins key images, pulls formatted impression, and resolves compare study', () => {
      const instance = new mod.EmrPacsViewerComponent();
      const emitted: PacsViewerIntent[] = [];
      instance.intent.subscribe((i: PacsViewerIntent) => emitted.push(i));
      instance.model.set(makePacsModel());

      const st1 = instance.activeStudy()!;
      expect(st1.id).toBe('st-1');
      expect(instance.compareStudy()?.id).toBe('st-2');
      expect(instance.studyShortDate(st1)).toBe('12');

      instance.cycleZoom(st1);
      expect(emitted.at(-1)).toEqual({ type: 'zoomChanged', studyId: 'st-1', zoomPercent: 150 });

      const st2 = instance.compareStudy()!;
      instance.cycleZoom(st2);
      expect(emitted.at(-1)).toEqual({ type: 'zoomChanged', studyId: 'st-2', zoomPercent: 100 });

      instance.pinKeyImage(st1);
      expect(emitted.at(-1)).toEqual({
        type: 'keyImagePinned',
        studyId: 'st-1',
        slice: 64,
        label: 'OCT Slice 64 (CST 412 µm)',
      });

      instance.pullImpression(st1);
      expect(emitted.at(-1)).toEqual({
        type: 'impressionPulledToNote',
        studyId: 'st-1',
        text: '[PACS OCT ACC-01]: Subfoveal fluid noted.',
      });

      instance.model.set(makePacsModel({ compareStudyId: undefined }));
      expect(instance.compareStudy()).toBeUndefined();
    });
  });

  describe('EmrInpatientMarComponent', () => {
    it('renders INPATIENT eMAR header badge, stepLabel, highAlert dual-sign button, status glyphs, and BCMA gating', () => {
      expect(componentSource).toContain('INPATIENT eMAR');
      expect(componentSource).toContain('HIGH-ALERT · DUAL SIGN');
      expect(componentSource).toContain('✓ 2-RN Co-Signed');
      expect(componentSource).toContain('! Require 2nd RN Co-Sign');

      const instance = new mod.EmrInpatientMarComponent();
      const emitted: InpatientMarIntent[] = [];
      instance.intent.subscribe((i: InpatientMarIntent) => emitted.push(i));
      instance.model.set(makeMarModel());

      expect(instance.slotStatusLabel('ord-1', '0800')).toBe('✓ GIVEN');
      expect(instance.slotStatusLabel('ord-1', '1400')).toBe('◷ DUE NOW');
      expect(instance.slotStatusLabel('ord-1', '1800')).toBe('⏸ HELD');
      expect(instance.slotStatusLabel('ord-1', '2200')).toBe('✕ REFUSED');
      expect(instance.slotStatusLabel('ord-1', 'missing')).toBe('—');

      // BCMA badge strictly gated on status === 'given' && adm.bcmaScanned
      expect(instance.slotBcmaScanned('ord-1', '0800')).toBe(true);
      expect(instance.slotBcmaScanned('ord-1', '1400')).toBe(false);

      instance.verifyDualSign('ord-1');
      expect(emitted.at(-1)).toEqual({ type: 'dualSignVerified', orderId: 'ord-1' });

      instance.cycleSlotStatus('ord-1', '1400');
      expect(emitted.at(-1)).toEqual({ type: 'slotStatusCycled', orderId: 'ord-1', slotId: '1400' });
    });
  });
});
