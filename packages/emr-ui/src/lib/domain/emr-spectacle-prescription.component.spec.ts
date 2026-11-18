import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  SpectaclePrescriptionIntent,
  SpectaclePrescriptionViewModel,
} from '@drguptavivek/emr-controller';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-spectacle-prescription.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadSpectacleModule() {
  const withoutDecorators = componentSource
    .replace(/@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrSpectaclePrescriptionComponent)/, '')
    .replace(/@Input\([^)]*\)\s*/g, '')
    .replace(/@Output\(\)\s*/g, '');

  const transpiled = ts.transpileModule(withoutDecorators, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  class MockEventEmitter<T> {
    private listeners: ((v: T) => void)[] = [];
    emit(v: T) {
      this.listeners.forEach((l) => l(v));
    }
    subscribe(l: (v: T) => void) {
      this.listeners.push(l);
    }
  }

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        EventEmitter: MockEventEmitter,
        Input: () => () => {},
        Output: () => () => {},
      };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrSpectaclePrescriptionComponent: new () => Record<string, any>;
    VA_CHART_OPTIONS: readonly { id: string; label: string; quickLines: readonly string[] }[];
    resolveLogMarBadgeText: (rawVa: string, explicitLogMar?: string) => string | null;
  };
}

const mod = loadSpectacleModule();

function makeModel(overrides: Partial<SpectaclePrescriptionViewModel> = {}): SpectaclePrescriptionViewModel {
  return {
    id: 'spec-1',
    label: 'Subjective Refraction & Spectacle Rx',
    eyes: [
      { id: 'od', label: 'Right eye', shortLabel: 'OD' },
      { id: 'os', label: 'Left eye', shortLabel: 'OS' },
    ],
    fields: [
      { id: 'sphere', label: 'Sphere', type: 'decimal', unit: 'D' },
      { id: 'cylinder', label: 'Cylinder', type: 'decimal', unit: 'D' },
      { id: 'axis', label: 'Axis', type: 'integer', unit: '°' },
      { id: 'visual-acuity', label: 'Visual Acuity', type: 'text' },
    ],
    values: {
      od: { sphere: '-1.50', cylinder: '-0.75', axis: '90', 'visual-acuity': '6/6' },
      os: { sphere: '-1.25', cylinder: '-0.50', axis: '85', 'visual-acuity': '6/9' },
    },
    vaChartType: 'snellen-6m',
    logMarEquivalents: { od: '0.00' },
    iopReadings: {
      od: { valueLabel: '16 mmHg', methodLabel: 'GAT', deltaLabel: '-2 mmHg', pachymetryLabel: 'CCT 542 µm', timeLabel: '09:30' },
      os: { valueLabel: '15 mmHg', methodLabel: 'GAT', pachymetryLabel: 'CCT 545 µm' },
    },
    slitLampRows: [
      {
        id: 'cornea',
        label: 'Cornea',
        normalPreset: 'Clear',
        quickFindings: ['Clear', 'SPK +1', 'Edema'],
        odValue: 'Clear',
        osValue: 'SPK +1',
        modifiedOs: true,
      },
    ],
    ...overrides,
  };
}

describe('EmrSpectaclePrescriptionComponent (emr-yr5.2)', () => {
  it('renders VA chart notation switcher, IOP tonometry bar, and paired Slit-Lamp grid in template', () => {
    expect(componentSource).toContain('VA Chart Type:');
    expect(componentSource).toContain('Copy OD → OS');
    expect(componentSource).toContain('Copy OS → OD');
    expect(componentSource).toContain('✓ OU Normal (WNL)');
    expect(componentSource).toContain('IOP Tonometry');
    expect(componentSource).toContain('Kaleidoscope Slit-Lamp &amp; Anterior/Posterior Segment Exam (OD | Structure | OS)');
  });

  it('never computes Snellen-to-LogMAR math in UI and only renders explicit model.logMarEquivalents', () => {
    expect(mod.resolveLogMarBadgeText('6/6', undefined)).toBeNull();
    expect(mod.resolveLogMarBadgeText('6/6', '')).toBeNull();
    expect(mod.resolveLogMarBadgeText('6/6', '0.00')).toBe('LogMAR 0.00');

    const instance = new mod.EmrSpectaclePrescriptionComponent();
    instance.model = makeModel({ logMarEquivalents: { od: '+0.18' } });
    expect(instance.logMarBadge('od')).toBe('LogMAR +0.18');
    expect(instance.logMarBadge('os')).toBeNull();
  });

  it('emits vaChartTypeChanged and provides top 6 quickLines for the active VA chart', () => {
    const instance = new mod.EmrSpectaclePrescriptionComponent();
    const emitted: SpectaclePrescriptionIntent[] = [];
    instance.intent.subscribe((i: SpectaclePrescriptionIntent) => emitted.push(i));
    instance.model = makeModel({ vaChartType: 'etdrs' });

    expect(instance.activeQuickLines()).toEqual(['90L', '85L', '76L', '70L', '61L', '55L']);
    instance.changeVaChartType('logmar');
    expect(emitted.at(-1)).toEqual({ type: 'vaChartTypeChanged', chartType: 'logmar' });

    instance.setVaQuickLine('od', 'visual-acuity', '0.00');
    expect(emitted.at(-1)).toEqual({ type: 'cellEditRequested', eyeId: 'od', fieldId: 'visual-acuity', value: '0.00' });
  });

  it('steps ±0.25D for decimal fields and ±5° for axis fields', () => {
    const instance = new mod.EmrSpectaclePrescriptionComponent();
    const emitted: SpectaclePrescriptionIntent[] = [];
    instance.intent.subscribe((i: SpectaclePrescriptionIntent) => emitted.push(i));
    instance.model = makeModel();

    const sphereField = instance.model.fields[0]!;
    const axisField = instance.model.fields[2]!;

    expect(instance.canStepDiopter(sphereField)).toBe(true);
    expect(instance.canStepAxis(axisField)).toBe(true);

    instance.stepCell('od', sphereField, -1);
    expect(emitted.at(-1)).toEqual({ type: 'cellStepped', eyeId: 'od', fieldId: 'sphere', delta: -0.25 });

    instance.stepCell('od', sphereField, 1);
    expect(emitted.at(-1)).toEqual({ type: 'cellStepped', eyeId: 'od', fieldId: 'sphere', delta: 0.25 });

    instance.stepCell('os', axisField, -1);
    expect(emitted.at(-1)).toEqual({ type: 'cellStepped', eyeId: 'os', fieldId: 'axis', delta: -5 });

    instance.stepCell('os', axisField, 1);
    expect(emitted.at(-1)).toEqual({ type: 'cellStepped', eyeId: 'os', fieldId: 'axis', delta: 5 });
  });

  it('emits copyEyeRequested and slit-lamp intents when editable, and blocks them when readOnly', () => {
    const instance = new mod.EmrSpectaclePrescriptionComponent();
    const emitted: SpectaclePrescriptionIntent[] = [];
    instance.intent.subscribe((i: SpectaclePrescriptionIntent) => emitted.push(i));
    instance.model = makeModel();

    instance.copyEye('od', 'os');
    expect(emitted.at(-1)).toEqual({ type: 'copyEyeRequested', fromEyeId: 'od', toEyeId: 'os' });

    instance.macroNormal('ou');
    expect(emitted.at(-1)).toEqual({ type: 'slitLampMacroNormalRequested', scope: 'ou' });

    instance.macroNormal('ou', 'cornea');
    expect(emitted.at(-1)).toEqual({ type: 'slitLampMacroNormalRequested', scope: 'ou', rowId: 'cornea' });

    instance.copySlitLampEye('od', 'os', 'cornea');
    expect(emitted.at(-1)).toEqual({ type: 'slitLampCopyEyeRequested', fromEyeId: 'od', toEyeId: 'os', rowId: 'cornea' });

    instance.setSlitLampQuick('cornea', 'od', 'SPK +1');
    expect(emitted.at(-1)).toEqual({ type: 'slitLampChanged', rowId: 'cornea', eyeId: 'od', value: 'SPK +1' });

    const countBeforeReadOnly = emitted.length;
    instance.model = makeModel({ readOnly: true });
    instance.copyEye('od', 'os');
    instance.macroNormal('ou');
    instance.setSlitLampQuick('cornea', 'od', 'Clear');
    expect(emitted).toHaveLength(countBeforeReadOnly);
  });
});
