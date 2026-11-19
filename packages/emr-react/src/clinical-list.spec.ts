// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { ClinicalListIntent, ClinicalListViewModel } from '@drguptavivek/emr-controller';
import {
  EmrAllergyList,
  EmrChronicDiseaseList,
  EmrClinicalList,
  EmrMedicationList,
  EmrPersonalHistoryList,
} from './l3-structures';

describe('EmrClinicalList & L4 wrappers (React)', () => {
  it('renders full ClinicalListViewModel with headingId, headingLevel, status badge, selected item, tones, meta, monochrome SVGs, and print attributes', () => {
    const model: ClinicalListViewModel = {
      title: 'Active ocular medications',
      description: 'Controller-supplied regimen list',
      selectedId: 'm1',
      status: { label: 'Verified', tone: 'success' },
      addLabel: 'Add drop',
      variant: 'elevated',
      items: [
        {
          id: 'm1',
          title: 'Latanoprost 0.005%',
          subtitle: '1 drop OU HS',
          detail: 'Glaucoma clinic',
          meta: 'Updated today',
          tone: 'info',
          badges: [
            { label: 'Active', tone: 'success' },
            { label: 'Active', tone: 'info' },
          ],
        },
        {
          id: 'm2',
          title: 'Aspirin 75 mg',
          readOnly: true,
          selectable: false,
        },
      ],
    };

    const html = renderToStaticMarkup(
      createElement(EmrClinicalList, {
        model,
        headingId: 'ocular-meds-heading',
        headingLevel: 3,
        onIntent: () => {},
      }),
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="ocular-meds-heading"');
    expect(html).toContain('id="ocular-meds-heading"');
    expect(html).toContain('role="heading"');
    expect(html).toContain('aria-level="3"');
    expect(html).toContain('Active ocular medications');
    expect(html).toContain('Controller-supplied regimen list');
    expect(html).toContain('Verified');
    expect(html).toContain('Add drop');
    expect(html).toContain('Latanoprost 0.005%');
    expect(html).toContain('1 drop OU HS');
    expect(html).toContain('Glaucoma clinic');
    expect(html).toContain('Updated today');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('border-top-style:dashed');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('break-inside:avoid');
    expect(html).toContain('<svg');
  });

  it('renders loading, error with Retry intent, and empty states cleanly', () => {
    const loadingHtml = renderToStaticMarkup(
      createElement(EmrClinicalList, {
        model: { items: [], loading: true, loadingLabel: 'Fetching medications…' },
        onIntent: () => {},
      }),
    );
    expect(loadingHtml).toContain('Fetching medications…');
    expect(loadingHtml).toContain('role="status"');

    const emptyHtml = renderToStaticMarkup(
      createElement(EmrClinicalList, {
        model: {
          items: [],
          emptyTitle: 'No allergies documented',
          emptyMessage: 'Allergy assessment not yet completed.',
        },
        onIntent: () => {},
      }),
    );
    expect(emptyHtml).toContain('No allergies documented');
    expect(emptyHtml).toContain('Allergy assessment not yet completed.');

    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: ClinicalListIntent[] = [];
    const root = createRoot(host);

    act(() => {
      root.render(
        createElement(EmrClinicalList, {
          model: { items: [], error: 'Service unreachable' },
          labels: { errorTitle: 'Sync failed', retry: 'Try again' },
          onIntent: (intent) => intents.push(intent),
        }),
      );
    });

    expect(host.textContent).toContain('Sync failed');
    expect(host.textContent).toContain('Service unreachable');
    const retryBtn = host.querySelector<HTMLElement>('[aria-label="Try again"]');
    expect(retryBtn).not.toBeNull();

    act(() => {
      retryBtn?.click();
    });

    expect(intents).toEqual([{ type: 'retryRequested' }]);

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('emits add, select, edit, remove intents and respects readOnly and capability flags plus focus/blur', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: ClinicalListIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    const root = createRoot(host);

    const model: ClinicalListViewModel = {
      title: 'Problems',
      items: [
        { id: 'p1', title: 'POAG' },
        { id: 'p2', title: 'Cataract', canEdit: false },
        { id: 'p3', title: 'External record', readOnly: true, selectable: false },
      ],
    };

    act(() => {
      root.render(
        createElement(EmrClinicalList, {
          model,
          onIntent: (intent) => intents.push(intent),
          onFocus: () => {
            focusCount += 1;
          },
          onBlur: () => {
            blurCount += 1;
          },
        }),
      );
    });

    const addBtn = [...host.querySelectorAll<HTMLElement>('[role="button"]')].find((el) =>
      el.textContent?.includes('Add'),
    );
    const selectBtn = [...host.querySelectorAll<HTMLElement>('[role="button"]')].find((el) =>
      el.textContent?.includes('POAG'),
    );
    const editBtn = host.querySelector<HTMLElement>('[aria-label="Edit POAG"]');
    const removeBtn = host.querySelector<HTMLElement>('[aria-label="Remove POAG"]');

    expect(host.querySelector('[aria-label="Edit Cataract"]')).toBeNull();
    expect(host.querySelector('[aria-label="Remove Cataract"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Edit External record"]')).toBeNull();
    expect(host.querySelector('[aria-label="Remove External record"]')).toBeNull();
    expect(
      [...host.querySelectorAll<HTMLElement>('[role="button"]')].find((el) =>
        el.textContent?.includes('External record'),
      ),
    ).toBeUndefined();

    act(() => {
      addBtn?.click();
      selectBtn?.click();
      editBtn?.click();
      removeBtn?.click();
    });

    expect(intents).toEqual([
      { type: 'addRequested' },
      { type: 'selected', id: 'p1' },
      { type: 'editRequested', id: 'p1' },
      { type: 'removeRequested', id: 'p1' },
    ]);

    const region = host.querySelector<HTMLElement>('[role="region"]')!;
    act(() => {
      region.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      region.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(focusCount).toBe(1);

    act(() => {
      region.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: editBtn }));
    });
    expect(blurCount).toBe(0);

    act(() => {
      region.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    act(() => {
      root.render(
        createElement(EmrClinicalList, {
          model: { ...model, readOnly: true },
          onIntent: (intent) => intents.push(intent),
        }),
      );
    });
    expect(host.querySelector('[aria-label="Edit POAG"]')).toBeNull();
    expect(host.querySelector('[aria-label="Remove POAG"]')).toBeNull();

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('forwards canonical props and default titles/headingIds in all four L4 wrappers', () => {
    const cases = [
      { Component: EmrMedicationList, headingId: 'emr-medication-list-title', title: 'Medications' },
      { Component: EmrAllergyList, headingId: 'emr-allergy-list-title', title: 'Allergies' },
      { Component: EmrChronicDiseaseList, headingId: 'emr-chronic-list-title', title: 'Chronic diseases' },
      {
        Component: EmrPersonalHistoryList,
        headingId: 'emr-history-list-title',
        title: 'Significant personal history',
      },
    ] as const;

    for (const entry of cases) {
      const html = renderToStaticMarkup(
        createElement(entry.Component, {
          model: { items: [{ id: 'x1', title: 'Sample entry' }] },
          headingLevel: 4,
          labels: { add: 'Add item' },
          onIntent: () => {},
        }),
      );
      expect(html).toContain(`id="${entry.headingId}"`);
      expect(html).toContain(`aria-labelledby="${entry.headingId}"`);
      expect(html).toContain('aria-level="4"');
      expect(html).toContain(entry.title);
      expect(html).toContain('Add item');
    }
  });
});
