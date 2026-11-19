import { describe, expect, it } from 'vitest';
import {
  normalizeSectionCardHeadingLevel,
  normalizeSectionCardPadding,
  normalizeSectionCardTone,
  normalizeSectionCardVariant,
  resolveSectionCardContentId,
  resolveSectionCardHeadingId,
  resolveSectionCardToggleLabel,
  type SectionCardIntent,
} from './section-card.models.js';

describe('section-card models and helpers', () => {
  it('normalizes variants, padding, tones, and heading levels with safe defaults', () => {
    expect(normalizeSectionCardVariant(undefined)).toBe('outlined');
    expect(normalizeSectionCardVariant('elevated')).toBe('elevated');
    expect(normalizeSectionCardVariant('filled')).toBe('filled');
    expect(normalizeSectionCardVariant('subtle')).toBe('subtle');
    expect(normalizeSectionCardVariant('unknown')).toBe('outlined');

    expect(normalizeSectionCardPadding(undefined)).toBe('md');
    expect(normalizeSectionCardPadding('none')).toBe('none');
    expect(normalizeSectionCardPadding('sm')).toBe('sm');
    expect(normalizeSectionCardPadding('lg')).toBe('lg');
    expect(normalizeSectionCardPadding('xl')).toBe('md');

    expect(normalizeSectionCardTone(undefined)).toBe('neutral');
    expect(normalizeSectionCardTone('info')).toBe('info');
    expect(normalizeSectionCardTone('success')).toBe('success');
    expect(normalizeSectionCardTone('warning')).toBe('warning');
    expect(normalizeSectionCardTone('danger')).toBe('danger');
    expect(normalizeSectionCardTone('invalid')).toBe('neutral');

    expect(normalizeSectionCardHeadingLevel(undefined)).toBe(2);
    expect(normalizeSectionCardHeadingLevel(3)).toBe(3);
    expect(normalizeSectionCardHeadingLevel(6)).toBe(6);
    expect(normalizeSectionCardHeadingLevel(1)).toBe(2);
    expect(normalizeSectionCardHeadingLevel(7)).toBe(2);
  });

  it('resolves deterministic heading, content, and toggle aria labels', () => {
    expect(resolveSectionCardHeadingId('hpi')).toBe('emr-section-hpi-heading');
    expect(resolveSectionCardHeadingId('hpi', '')).toBe('emr-section-hpi-heading');
    expect(resolveSectionCardHeadingId('hpi', 'custom-hpi-heading')).toBe('custom-hpi-heading');

    expect(resolveSectionCardContentId('hpi')).toBe('emr-section-hpi-content');

    expect(resolveSectionCardToggleLabel(true, 'Anterior Segment')).toBe('Show Anterior Segment');
    expect(resolveSectionCardToggleLabel(false, 'Anterior Segment')).toBe('Hide Anterior Segment');
    expect(
      resolveSectionCardToggleLabel(true, 'Anterior Segment', { show: 'Expand', hide: 'Collapse' }),
    ).toBe('Expand Anterior Segment');
    expect(
      resolveSectionCardToggleLabel(false, 'Anterior Segment', { show: 'Expand', hide: 'Collapse' }),
    ).toBe('Collapse Anterior Segment');
  });

  it('supports typed readonly toggleRequested intents', () => {
    const intent: SectionCardIntent = { type: 'toggleRequested', sectionId: 'anterior-segment' };
    expect(intent).toEqual({ type: 'toggleRequested', sectionId: 'anterior-segment' });
  });
});
