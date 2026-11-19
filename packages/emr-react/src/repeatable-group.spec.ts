import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { RepeatableGroupDefinition, RepeatableItemState } from '@drguptavivek/emr-controller';
import { EmrRepeatableGroup } from './l3-annotation';

const DEF: RepeatableGroupDefinition = {
  kind: 'repeatable',
  id: 'drops',
  label: 'Post-operative drops',
  description: 'Eye drop regimen',
  addLabel: 'Add drop',
  emptyMessage: 'No drops configured.',
  minItems: 1,
  maxItems: 2,
  fields: [
    { id: 'drug', label: 'Medication', type: 'text', span: 6 },
    { id: 'dose', label: 'Dose', type: 'quantity', unit: 'drops', span: 6 },
  ],
};

describe('EmrRepeatableGroup (React Web SSR)', () => {
  it('renders headingId, custom emptyMessage, group error and warning, and Add button without disabled attribute', () => {
    const html = renderToStaticMarkup(
      createElement(EmrRepeatableGroup, {
        definition: DEF,
        model: [],
        idPrefix: 'opd-',
        headingId: 'custom-drops-h',
        emptyMessage: 'Custom empty state.',
        error: 'At least one drop is required',
        warning: 'Check preservative-free option',
        onIntent: () => {},
      }),
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="custom-drops-h"');
    expect(html).toContain('id="custom-drops-h"');
    expect(html).toContain('Custom empty state.');
    expect(html).toContain('role="alert"');
    expect(html).toContain('At least one drop is required');
    expect(html).toContain('role="status"');
    expect(html).toContain('Check preservative-free option');
    expect(html).toContain('Add drop');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('<svg');
    expect(html).not.toContain('disabled=""');
  });

  it('omits Add at maxItems with hint, omits Remove for locked/minItems, and renders badges & item messages', () => {
    const items: readonly RepeatableItemState[] = [
      {
        id: 'd1',
        label: 'Drop 1',
        readOnly: true,
        badges: [{ label: 'Active', tone: 'success' }],
        warning: 'Monitor IOP',
        fields: {
          drug: { value: 'Timolol' },
          dose: { value: { value: null, unit: 'drops' }, hidden: true },
        },
      },
      {
        id: 'd2',
        label: 'Drop 2',
        error: 'Missing medication name',
        fields: {
          drug: { value: '' },
          dose: { value: { value: 2, unit: 'drops' }, hidden: true },
        },
      },
    ];

    const html = renderToStaticMarkup(
      createElement(EmrRepeatableGroup, {
        definition: DEF,
        model: items,
        idPrefix: 'opd',
        onIntent: () => {},
      }),
    );

    expect(html).not.toContain('Add drop');
    expect(html).toContain('Maximum 2 entries');
    expect(html).toContain('Read-only');
    expect(html).toContain('Active');
    expect(html).toContain('Monitor IOP');
    expect(html).toContain('Missing medication name');
    expect(html).not.toContain('aria-label="Remove Drop 1"');
    expect(html).toContain('aria-label="Remove Drop 2"');
    // Hidden null quantity on d1 is omitted; hidden non-null quantity on d2 is rendered
    expect(html).not.toContain('id="opd-drops-d1-dose"');
    expect(html).toContain('id="opd-drops-d2-dose"');
  });

  it('omits Add and Remove buttons completely when readOnly is true', () => {
    const items: readonly RepeatableItemState[] = [
      {
        id: 'd1',
        label: 'Drop 1',
        fields: { drug: { value: 'Moxifloxacin' }, dose: { value: { value: 1, unit: 'drops' } } },
      },
    ];

    const html = renderToStaticMarkup(
      createElement(EmrRepeatableGroup, {
        definition: { ...DEF, minItems: 0 },
        model: items,
        readOnly: true,
        onIntent: () => {},
      }),
    );

    expect(html).not.toContain('Add drop');
    expect(html).not.toContain('Remove Drop 1');
    expect(html).not.toContain('Maximum 2 entries');
    expect(html).toContain('border-top-style:dashed');
  });
});
