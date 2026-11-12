import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', async () => import('react-native-web'));
import { resolveLogMarBadgeText } from './l4-ophthalmology';

describe('spectacle LogMAR badge', () => {
  it.each(['', '1.0', '6/6', '20/20', '85L', 'CF', 'HM', 'NPL'])('does not infer an equivalent from %s', value => {
    expect(resolveLogMarBadgeText(value)).toBeNull();
  });

  it('shows only the supplied equivalent and omits an empty value', () => {
    expect(resolveLogMarBadgeText('1.0', '0.00')).toBe('LogMAR 0.00');
    expect(resolveLogMarBadgeText('CF', '+1.90')).toBe('LogMAR +1.90');
    expect(resolveLogMarBadgeText('6/6', '')).toBeNull();
  });
});

it('renders the selected chart and only a supplied eye equivalent', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { EmrSpectaclePrescription } = await import('./l4-ophthalmology');
  const model = { id: 'rx', label: 'Prescription', fields: [{ id: 'visual-acuity', label: 'VA', type: 'text' as const }], eyes: [{ id: 'od', label: 'Right eye' }, { id: 'os', label: 'Left eye' }], values: { od: { 'visual-acuity': '1.0' }, os: { 'visual-acuity': 'CF' } }, vaChartType: 'decimal' as const, logMarEquivalents: { od: '0.00' } };
  const markup = renderToStaticMarkup(createElement(EmrSpectaclePrescription, { model, onIntent: () => {} }));
  expect(markup).toContain('LogMAR 0.00');
  expect(markup).not.toContain('LogMAR +1.90');
  expect(markup).toMatch(/aria-pressed="true"[^>]*>[^]*?Decimal \(1\.0\)/);
});
