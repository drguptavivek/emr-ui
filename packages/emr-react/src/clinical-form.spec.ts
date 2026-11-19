// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { ClinicalFormIntent, ClinicalFormViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalForm } from './clinical-form';
import {
  clinicalFormFieldSpanPercent,
  isClinicalFormStacked,
  isClinicalMatrixRowRequired,
  visibleClinicalMatrixRows,
} from './clinical-form.logic';

const BASE_MODEL: ClinicalFormViewModel = {
  schema: {
    id: 'opd-triage',
    label: 'Ophthalmic Triage',
    description: 'Initial outpatient evaluation',
    sections: [
      {
        id: 'presenting',
        label: 'Presenting History',
        collapsible: true,
        blocks: [
          { id: 'complaint', label: 'Chief complaint', type: 'text', required: true, span: 6 },
          { id: 'iop', label: 'IOP', type: 'quantity', unit: 'mmHg', span: 6 },
          {
            kind: 'matrix',
            id: 'eyes',
            label: 'Per eye matrix',
            description: 'Goldmann applanation',
            columns: [
              { id: 'od', label: 'OD' },
              { id: 'os', label: 'OS' },
              { id: 'ou', label: 'OU' },
            ],
            rows: [
              {
                id: 'cdr',
                label: 'CD ratio',
                cells: {
                  od: { id: 'cdr-od', label: 'CD OD', type: 'decimal', required: true },
                  os: { id: 'cdr-os', label: 'CD OS', type: 'decimal' },
                  ou: { id: 'cdr-ou', label: 'CD OU', type: 'decimal' },
                },
              },
            ],
          },
          {
            kind: 'repeatable',
            id: 'drops',
            label: 'Topical drops',
            fields: [{ id: 'drug', label: 'Medication', type: 'text', span: 12 }],
          },
        ],
      },
    ],
  },
  fields: {
    complaint: { value: 'Blurred vision' },
    iop: { value: { value: null, unit: 'mmHg' }, hidden: true },
    'cdr-od': { value: 0.4 },
    'cdr-os': { value: { value: null, unit: 'mmHg' }, hidden: true },
    'cdr-ou': { value: 0.5, readOnly: true },
  },
  repeatableGroups: {
    drops: [{ id: 'd1', label: 'Drop 1', fields: { drug: { value: 'Timolol' } } }],
  },
  sectionStatuses: { presenting: { label: 'In progress', tone: 'info' } },
  correction: { label: 'Request correction', description: 'Record is locked after sign-off.' },
};

describe('EmrClinicalForm (React)', () => {
  it('renders headingId, normalized idPrefix, correction print-hide attribute, matrix, and repeatable group', () => {
    const html = renderToStaticMarkup(
      createElement(EmrClinicalForm, {
        model: BASE_MODEL,
        headingId: 'triage-form-heading',
        idPrefix: 'opd-',
        onIntent: () => {},
      }),
    );

    expect(html).toContain('role="form"');
    expect(html).toContain('aria-labelledby="triage-form-heading"');
    expect(html).not.toContain('aria-label="Ophthalmic Triage"');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('Request correction');
    expect(html).toContain('Record is locked after sign-off.');
    expect(html).toContain('id="opd-opd-triage-complaint"');
    expect(html).not.toContain('id="opd-opd-triage-iop"');
    expect(html).not.toContain('id="opd-opd-triage-cdr-os"');
    expect(html).toContain('id="opd-opd-triage-drops-d1-drug"');
    expect(html).toContain('Goldmann applanation');
    expect(html).toContain('CD ratio');
  });

  it('renders model.emptyMessage with role="status" when all sections are hidden (including null quantity)', () => {
    const emptyModel: ClinicalFormViewModel = {
      schema: {
        id: 'empty',
        label: 'Empty Form',
        sections: [
          {
            id: 's1',
            label: 'Hidden section',
            blocks: [{ id: 'q', label: 'IOP', type: 'quantity', unit: 'mmHg' }],
          },
        ],
      },
      fields: { q: { value: { value: null, unit: 'mmHg' }, hidden: true } },
      repeatableGroups: {},
      emptyMessage: 'No visible sections for this stage.',
    };

    const html = renderToStaticMarkup(
      createElement(EmrClinicalForm, { model: emptyModel, onIntent: () => {} }),
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('No visible sections for this stage.');
    expect(html).not.toContain('Hidden section');
  });

  it('computes 390px stacking fallback and matrix helpers accurately', () => {
    expect(isClinicalFormStacked(0, 0)).toBe(false);
    expect(isClinicalFormStacked(0, 390)).toBe(true);
    expect(isClinicalFormStacked(800, 390)).toBe(false);
    expect(isClinicalFormStacked(480, 1280)).toBe(true);
    expect(clinicalFormFieldSpanPercent(6, true)).toBe('100%');
    expect(clinicalFormFieldSpanPercent(4, false)).toBe('33.33333333333333%');

    const matrixBlock = BASE_MODEL.schema.sections[0].blocks[2] as Extract<
      ClinicalFormViewModel['schema']['sections'][number]['blocks'][number],
      { kind: 'matrix' }
    >;
    expect(visibleClinicalMatrixRows(matrixBlock, BASE_MODEL.fields)).toHaveLength(1);
    expect(isClinicalMatrixRowRequired(matrixBlock.rows[0], BASE_MODEL.fields)).toBe(true);
  });

  it('stacks 3+ matrix columns vertically on 390px viewport and keeps correction clickable in readOnly', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const prevClientWidth = Object.getOwnPropertyDescriptor(document.documentElement, 'clientWidth');
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 390, configurable: true });
    window.dispatchEvent(new Event('resize'));

    const host = document.createElement('div');
    document.body.append(host);
    const intents: ClinicalFormIntent[] = [];
    let focusCount = 0;
    const root = createRoot(host);

    try {
      act(() => {
        root.render(
          createElement(EmrClinicalForm, {
            model: { ...BASE_MODEL, readOnly: true },
            onIntent: (intent) => intents.push(intent),
            onFocus: () => {
              focusCount += 1;
            },
          }),
        );
      });

      // On 390px, stacked mode omits the desktop columnheader row and renders column labels per cell
      expect(host.querySelector('[role="columnheader"]')).toBeNull();
      expect(host.textContent).toContain('OD');
      expect(host.textContent).toContain('OU');

      // Correction button remains active even when readOnly is true
      const corrBtn = [...host.querySelectorAll<HTMLElement>('[role="button"]')].find((el) =>
        el.textContent?.includes('Request correction'),
      );
      expect(corrBtn).toBeTruthy();
      act(() => {
        corrBtn?.click();
      });
      expect(intents).toContainEqual({ type: 'correctionRequested' });

      // ReadOnly blocks field inputs from emitting edits
      const complaintInput = host.querySelector<HTMLInputElement>('#opd-triage-complaint');
      expect(complaintInput?.readOnly).toBe(true);

      act(() => {
        complaintInput?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      });
      expect(focusCount).toBe(1);
    } finally {
      act(() => {
        root.unmount();
      });
      host.remove();
      if (prevClientWidth) {
        Object.defineProperty(document.documentElement, 'clientWidth', prevClientWidth);
      } else {
        delete (document.documentElement as unknown as Record<string, unknown>)['clientWidth'];
      }
      window.dispatchEvent(new Event('resize'));
    }
  });
});
