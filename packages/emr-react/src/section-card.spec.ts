// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { SectionCardIntent } from '@drguptavivek/emr-controller';
import { EmrSectionCard } from './clinical-form';

describe('EmrSectionCard (React)', () => {
  it('renders canonical headingLevel, headingId, icon, status badge, headerActions, footer, and [hidden] print-safe body', () => {
    const html = renderToStaticMarkup(
      createElement(
        EmrSectionCard,
        {
          sectionId: 'anterior',
          label: 'Anterior Segment',
          description: 'Slit-lamp biomicroscopy',
          headingId: 'custom-anterior-heading',
          headingLevel: 3,
          variant: 'elevated',
          tone: 'info',
          padding: 'lg',
          icon: 'eye',
          readOnly: true,
          collapsible: true,
          collapsed: true,
          status: { label: 'Recorded', tone: 'success', icon: 'check' },
          headerActions: createElement('span', null, 'Compare OD/OS'),
          footer: createElement('span', null, 'Verified by resident'),
        },
        createElement('span', null, 'Cornea clear'),
      ),
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="custom-anterior-heading"');
    expect(html).toContain('id="custom-anterior-heading"');
    expect(html).toContain('role="heading"');
    expect(html).toContain('aria-level="3"');
    expect(html).toContain('Anterior Segment');
    expect(html).toContain('Slit-lamp biomicroscopy');
    expect(html).toContain('Recorded');
    expect(html).toContain('Compare OD/OS');
    expect(html).toContain('Verified by resident');
    expect(html).toContain('Cornea clear');
    expect(html).toContain('emr-section-card__content');
    expect(html).toContain('hidden=""');
    expect(html).toContain('aria-controls="emr-section-anterior-content"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Show Anterior Segment"');
    expect(html).toContain('border-top-style:dashed');
    expect(html).toContain('<svg');
  });

  it('does not use inline display:none on Web when collapsed so .emr-print can expand [hidden]', () => {
    const html = renderToStaticMarkup(
      createElement(
        EmrSectionCard,
        {
          sectionId: 'print-sec',
          label: 'Posterior Segment',
          collapsible: true,
          collapsed: true,
        },
        createElement('span', null, 'Optic disc 0.3'),
      ),
    );

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const contentEl = doc.getElementById('emr-section-print-sec-content');
    expect(contentEl).not.toBeNull();
    expect(contentEl?.hasAttribute('hidden')).toBe(true);
    expect(contentEl?.style.display).not.toBe('none');
  });

  it('emits toggleRequested intent on click even when readOnly is true', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: SectionCardIntent[] = [];
    const root = createRoot(host);

    act(() => {
      root.render(
        createElement(
          EmrSectionCard,
          {
            sectionId: 'exam-ro',
            label: 'Read-only Exam',
            collapsible: true,
            collapsed: false,
            readOnly: true,
            onIntent: (intent) => intents.push(intent),
          },
          createElement('span', null, 'Findings'),
        ),
      );
    });

    const toggleBtn = host.querySelector<HTMLElement>('[data-section-toggle="true"]');
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      toggleBtn?.click();
    });

    expect(intents).toEqual([{ type: 'toggleRequested', sectionId: 'exam-ro' }]);

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('supports outlined, filled, subtle variants and none/sm/md/lg paddings', () => {
    for (const variant of ['outlined', 'elevated', 'filled', 'subtle'] as const) {
      for (const padding of ['none', 'sm', 'md', 'lg'] as const) {
        const html = renderToStaticMarkup(
          createElement(
            EmrSectionCard,
            {
              sectionId: `${variant}-${padding}`,
              label: `${variant} ${padding}`,
              variant,
              padding,
            },
            createElement('span', null, 'Body'),
          ),
        );
        expect(html).toContain(`${variant} ${padding}`);
      }
    }
  });
});
