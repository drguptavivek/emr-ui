import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  PatientBannerIntent,
  PatientBannerViewModel,
} from '@drguptavivek/emr-controller';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-patient-banner.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadPatientBannerModule() {
  const withoutDecorators = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrPatientBannerComponent)/,
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
        computed: <T>(fn: () => T) => fn,
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
    if (id === '@ng-icons/core') {
      return {
        NgIcon: {},
        provideIcons: () => [],
      };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrPatientBannerComponent: new () => Record<string, any>;
    computeSparklineBars: (points: readonly number[]) => readonly { heightPx: number; opacity: number }[];
    resolveBannerInspectedAlert: (model: PatientBannerViewModel) => any;
    resolveBannerInspectedVital: (model: PatientBannerViewModel) => any;
  };
}

const mod = loadPatientBannerModule();

function makeModel(overrides: Partial<PatientBannerViewModel> = {}): PatientBannerViewModel {
  return {
    patientId: 'pat-01',
    displayName: 'Ananya Sharma',
    identifiers: [{ label: 'MRN', value: 'MRN-1001' }],
    ageLabel: '58 years',
    sexLabel: 'Female',
    careSetting: 'opd',
    careSettingLabel: 'OPD · Retina',
    locationLabel: 'Clinic 2',
    allergies: [
      {
        id: 'alg-1',
        label: 'Sulfonamides',
        tone: 'danger',
        reactionLabel: 'Anaphylaxis',
        provenanceLabel: 'Verified by Pharmacist',
        recordedAtLabel: '10 Oct 2026',
      },
    ],
    chronicDiseases: [{ id: 'cd-1', label: 'Type 2 Diabetes', tone: 'info' }],
    alerts: [{ id: 'al-1', label: 'Fall risk', tone: 'warning' }],
    expanded: false,
    vitals: [
      {
        id: 'vit-iop',
        label: 'IOP (OD)',
        valueLabel: '22',
        unit: 'mmHg',
        deltaLabel: '+3',
        tone: 'warning',
        trendPoints: [16, 18, 19, 22],
        provenanceLabel: 'Goldmann Applanation · 09:15',
      },
    ],
    ...overrides,
  };
}

describe('EmrPatientBannerComponent (emr-yr5.2)', () => {
  it('supports compact, storyboard, and horizontal layout modes plus vitals sparklines and provenance drilldown', () => {
    const instance = new mod.EmrPatientBannerComponent();
    const emitted: PatientBannerIntent[] = [];
    instance.intent.subscribe((i: PatientBannerIntent) => emitted.push(i));

    instance.model.set(makeModel({ layoutMode: 'storyboard', activeInspectId: 'alg-1' }));
    expect(instance.isStoryboard()).toBe(true);
    expect(instance.isCompact()).toBe(false);
    expect(instance.inspectedAlert()?.label).toBe('Sulfonamides');

    instance.toggleInspect('alg-1');
    expect(emitted.at(-1)).toEqual({ type: 'alertInspectRequested', alertId: null });

    instance.toggleInspect('vit-iop');
    expect(emitted.at(-1)).toEqual({ type: 'alertInspectRequested', alertId: 'vit-iop' });

    instance.model.set(makeModel({ layoutMode: 'compact', activeInspectId: 'vit-iop' }));
    expect(instance.isCompact()).toBe(true);
    expect(instance.inspectedVital()?.label).toBe('IOP (OD)');

    const bars = mod.computeSparklineBars([10, 15, 20]);
    expect(bars).toHaveLength(3);
    expect(bars[0]!.heightPx).toBe(4);
    expect(bars[2]!.heightPx).toBe(18);
    expect(bars[2]!.opacity).toBe(1);
  });
});
