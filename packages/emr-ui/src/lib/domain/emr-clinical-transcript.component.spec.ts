import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  NoteCaptureIntent,
  NoteCaptureViewModel,
} from '@drguptavivek/emr-controller';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-clinical-transcript.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadTranscriptModule() {
  const withoutDecorators = componentSource
    .replace(/@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrClinicalTranscriptComponent)/, '')
    .replace(/@Input\([^)]*\)\s*/g, '')
    .replace(/@Output\(\)\s*/g, '')
    .replace(/@ViewChild\([^)]*\)\s*/g, '');

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
        ViewChild: () => () => {},
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
    EmrClinicalTranscriptComponent: new () => Record<string, any>;
  };
}

const mod = loadTranscriptModule();

function makeModel(overrides: Partial<NoteCaptureViewModel> = {}): NoteCaptureViewModel {
  return {
    id: 'nc-1',
    title: 'Ambient & Manual Clinical Transcript',
    dictation: {
      status: 'idle',
      label: 'Ready',
      canStart: true,
      canStop: false,
    },
    segments: [
      {
        id: 'seg-1',
        text: 'Patient reports blurred vision in right eye.',
        startMs: 0,
        endMs: 2500,
        source: 'spoken',
        timeLabel: '00:02',
        editable: true,
      },
    ],
    spans: [],
    suggestions: [],
    highlightedSpanIds: [],
    highlightedSuggestionIds: [],
    canSummarise: true,
    chartReviewPanes: [
      {
        id: 'iop-va',
        label: 'Prior IOP & VA',
        items: [
          { title: 'Last BCVA', value: 'OD 6/9 · OS 6/6', meta: '14 Oct 2026' },
          { title: 'Last IOP', value: 'OD 18 / OS 16 mmHg' },
        ],
      },
      {
        id: 'labs',
        label: 'Recent Labs',
        items: [{ title: 'HbA1c', value: '7.4%', meta: 'High' }],
      },
    ],
    smartPhrases: [
      {
        trigger: '.wnl',
        label: 'Normal Anterior Segment',
        expansion: 'Anterior segment quiet and normal OU; cornea clear, AC deep and quiet.',
      },
    ],
    smartLinks: [
      {
        token: '@IOP@',
        label: 'Today IOP',
        resolvedValue: 'IOP: OD 16 mmHg, OS 15 mmHg (GAT)',
      },
    ],
    smartLists: [
      {
        id: 'laterality',
        label: 'Laterality',
        choices: ['Right eye (OD)', 'Left eye (OS)', 'Both eyes (OU)'],
        selected: 'Right eye (OD)',
      },
    ],
    ...overrides,
  };
}

describe('EmrClinicalTranscriptComponent (emr-yr5.2)', () => {
  it('renders Split-Pane Chart Review and SmartTools Bar while preserving keyboard submission', () => {
    expect(componentSource).toContain('SPLIT-PANE CHART REVIEW');
    expect(componentSource).toContain('SMARTPHRASES (.dotphrase):');
    expect(componentSource).toContain('SMARTLINKS (@token@):');
    expect(componentSource).toContain('SMARTLISTS');
    expect(componentSource).toContain('(keydown.control.enter)="append()"');
    expect(componentSource).toContain('(keydown.meta.enter)="append()"');
  });

  it('switches chart review panes and toggles visibility', () => {
    const instance = new mod.EmrClinicalTranscriptComponent();
    instance.model = makeModel();

    expect(instance.showChartReview).toBe(true);
    expect(instance.isChartPaneActive('iop-va')).toBe(true);
    expect(instance.activeChartPane()?.id).toBe('iop-va');

    instance.toggleChartReview();
    expect(instance.showChartReview).toBe(false);

    instance.selectChartPane('labs');
    expect(instance.showChartReview).toBe(true);
    expect(instance.activeChartPane()?.id).toBe('labs');
  });

  it('auto-expands .dotphrase + Space while typing in draft and emits smartPhraseTriggered', () => {
    const instance = new mod.EmrClinicalTranscriptComponent();
    const emitted: NoteCaptureIntent[] = [];
    instance.intent.subscribe((i: NoteCaptureIntent) => emitted.push(i));
    instance.model = makeModel();

    instance.handleDraftChange('Slit lamp: .wnl ');
    expect(instance.draft).toBe(
      'Slit lamp: Anterior segment quiet and normal OU; cornea clear, AC deep and quiet. ',
    );
    expect(emitted.at(-1)).toEqual({
      type: 'smartPhraseTriggered',
      trigger: '.wnl',
      expansion: 'Anterior segment quiet and normal OU; cornea clear, AC deep and quiet.',
    });
  });

  it('supports 1-click SmartPhrases, SmartLinks (@token@), and SmartLists ({label:})', () => {
    const instance = new mod.EmrClinicalTranscriptComponent();
    const emitted: NoteCaptureIntent[] = [];
    instance.intent.subscribe((i: NoteCaptureIntent) => emitted.push(i));
    instance.model = makeModel();

    instance.insertSmartPhrase(instance.model.smartPhrases![0]!);
    expect(instance.draft).toBe('Anterior segment quiet and normal OU; cornea clear, AC deep and quiet.');
    expect(emitted.at(-1)).toEqual({
      type: 'smartPhraseTriggered',
      trigger: '.wnl',
      expansion: 'Anterior segment quiet and normal OU; cornea clear, AC deep and quiet.',
    });

    instance.insertSmartLink(instance.model.smartLinks![0]!);
    expect(instance.draft).toContain('IOP: OD 16 mmHg, OS 15 mmHg (GAT)');
    expect(emitted.at(-1)).toEqual({
      type: 'smartLinkInserted',
      token: '@IOP@',
      resolvedValue: 'IOP: OD 16 mmHg, OS 15 mmHg (GAT)',
    });

    instance.selectSmartListChoice('laterality', 'Both eyes (OU)');
    expect(instance.draft).toContain('Both eyes (OU)');
    expect(emitted.at(-1)).toEqual({
      type: 'smartListChoiceSelected',
      listId: 'laterality',
      choice: 'Both eyes (OU)',
    });
  });
});
