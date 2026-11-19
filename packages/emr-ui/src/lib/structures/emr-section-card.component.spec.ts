import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import * as sectionCardLogic from './emr-section-card.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-section-card.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');
const emrCss = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/foundations/emr.css'),
  'utf8',
);
const emrPrintCss = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/foundations/emr-print.css'),
  'utf8',
);

function loadSectionCardClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrSectionCardComponent)/,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorator, {
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

  let containsResult = false;
  const setHostContains = (value: boolean) => {
    containsResult = value;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        ViewEncapsulation: { None: 2 },
        ElementRef: class {},
        Component: () => (cls: unknown) => cls,
        booleanAttribute: (v: unknown) => v === '' || Boolean(v),
        computed: <T>(fn: () => T) => fn,
        inject: () => ({ nativeElement: { contains: () => containsResult } }),
        input: Object.assign(
          <T>(init?: T, opts?: { transform?: (v: unknown) => T }) => {
            const sig = makeSignal<T | undefined>(init);
            const wrapped = () => sig();
            wrapped.set = (next: unknown) => sig.set(opts?.transform ? opts.transform(next) : (next as T));
            return wrapped;
          },
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
    if (id === '../primitives/emr-feedback.component') {
      return { EmrBadgeComponent: class {} };
    }
    if (id === './emr-section-card.logic') {
      return sectionCardLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrSectionCardComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return { EmrSectionCardComponent: module.exports.EmrSectionCardComponent!, setHostContains };
}

describe('EmrSectionCardComponent (Angular)', () => {
  it('normalizes inputs and resolves deterministic heading, content, icon, and toggle labels', () => {
    const { EmrSectionCardComponent } = loadSectionCardClass();
    const card = new EmrSectionCardComponent() as unknown as {
      sectionId: { set: (v: string) => void };
      label: { set: (v: string) => void };
      headingId: { set: (v: string | undefined) => void };
      headingLevel: { set: (v: number) => void };
      variant: { set: (v: string) => void };
      tone: { set: (v: string) => void };
      padding: { set: (v: string) => void };
      icon: { set: (v: string | undefined) => void };
      collapsed: { set: (v: boolean) => void };
      resolvedVariant: () => string;
      resolvedTone: () => string;
      resolvedPadding: () => string;
      resolvedHeadingLevel: () => number;
      resolvedHeadingId: () => string;
      contentId: () => string;
      iconPaths: () => readonly string[];
      toggleAriaLabel: () => string;
    };

    card.sectionId.set('anterior-segment');
    card.label.set('Anterior Segment');

    expect(card.resolvedVariant()).toBe('outlined');
    expect(card.resolvedTone()).toBe('neutral');
    expect(card.resolvedPadding()).toBe('md');
    expect(card.resolvedHeadingLevel()).toBe(2);
    expect(card.resolvedHeadingId()).toBe('emr-section-anterior-segment-heading');
    expect(card.contentId()).toBe('emr-section-anterior-segment-content');
    expect(card.iconPaths()).toEqual([]);
    expect(card.toggleAriaLabel()).toBe('Hide Anterior Segment');

    card.variant.set('elevated');
    card.tone.set('warning');
    card.padding.set('lg');
    card.headingLevel.set(4);
    card.headingId.set('custom-sec-heading');
    card.icon.set('eye');
    card.collapsed.set(true);

    expect(card.resolvedVariant()).toBe('elevated');
    expect(card.resolvedTone()).toBe('warning');
    expect(card.resolvedPadding()).toBe('lg');
    expect(card.resolvedHeadingLevel()).toBe(4);
    expect(card.resolvedHeadingId()).toBe('custom-sec-heading');
    expect(card.iconPaths().length).toBeGreaterThan(0);
    expect(card.toggleAriaLabel()).toBe('Show Anterior Segment');
  });

  it('emits toggleRequested intent even when readOnly is true', () => {
    const { EmrSectionCardComponent } = loadSectionCardClass();
    const card = new EmrSectionCardComponent() as unknown as {
      sectionId: { set: (v: string) => void };
      label: { set: (v: string) => void };
      readOnly: { set: (v: boolean) => void };
      intent: { subscribe: (fn: (v: unknown) => void) => void };
      onToggleClick: () => void;
    };

    card.sectionId.set('vitals');
    card.label.set('Vitals');
    card.readOnly.set(true);

    const emitted: unknown[] = [];
    card.intent.subscribe((ev) => emitted.push(ev));
    card.onToggleClick();

    expect(emitted).toEqual([{ type: 'toggleRequested', sectionId: 'vitals' }]);
  });

  it('emits focused on entry and blurred only when focus leaves the host', () => {
    const { EmrSectionCardComponent, setHostContains } = loadSectionCardClass();
    const card = new EmrSectionCardComponent() as unknown as {
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      onFocusIn: () => void;
      onFocusOut: (e: { relatedTarget: unknown }) => void;
    };

    let focusCount = 0;
    let blurCount = 0;
    card.focused.subscribe(() => {
      focusCount += 1;
    });
    card.blurred.subscribe(() => {
      blurCount += 1;
    });

    card.onFocusIn();
    card.onFocusIn();
    expect(focusCount).toBe(1);

    setHostContains(true);
    card.onFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(0);

    setHostContains(false);
    card.onFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(1);
  });

  it('maintains semantic template bindings, slots, print preservation, and CSS rules', () => {
    expect(componentSource).not.toContain('heroSquaresPlus');
    expect(componentSource).not.toMatch(/readonly toggleRequested\s*=/);
    expect(componentSource).toContain('readonly intent = output<SectionCardIntent>()');
    expect(componentSource).toContain('<emr-badge [badge]="badge" />');
    expect(componentSource).toContain('<ng-content select="[emrSectionActions]" />');
    expect(componentSource).toContain('<ng-content select="[emrSectionFooter]" />');
    expect(componentSource).toContain('[hidden]="collapsed()"');
    expect(componentSource).toContain('[attr.aria-controls]="contentId()"');
    expect(componentSource).toContain('[attr.aria-expanded]="!collapsed()"');

    for (const cls of [
      '.emr-section-card--elevated',
      '.emr-section-card--filled',
      '.emr-section-card--subtle',
      '.emr-section-card[data-tone="info"]',
      '.emr-section-card--readonly',
      '.emr-section-card--collapsed .emr-section-card__header',
      '.emr-section-card--pad-none',
      '.emr-section-card--pad-sm',
      '.emr-section-card--pad-lg',
      '.emr-section-card__toggle',
      '.emr-section-card__chevron--expanded',
      '.emr-section-card__actions',
      '.emr-section-card__footer',
    ]) {
      expect(emrCss).toContain(cls);
    }

    expect(emrPrintCss).toContain('.emr-section-card__toggle');
    expect(emrPrintCss).toContain('.emr-section-card__content[hidden]');
  });
});
