import { describe, expect, it } from 'vitest';
import {
  deriveAvatarInitials,
  emptyToNull,
  formatDateTimeEmission,
  localDateTimeToUtcIso,
  parseDateInputDomValue,
  stepNumberValue,
  toDateBoundDomValue,
  toDateInputDomValue,
  toLocalDateTimeInputValue,
} from './emr-inputs.logic';

describe('emr-inputs.logic', () => {
  describe('emptyToNull', () => {
    it('normalizes empty string, null, and undefined to null while preserving non-empty strings', () => {
      expect(emptyToNull('')).toBeNull();
      expect(emptyToNull(null)).toBeNull();
      expect(emptyToNull(undefined)).toBeNull();
      expect(emptyToNull('0')).toBe('0');
      expect(emptyToNull('Gradual blur')).toBe('Gradual blur');
    });
  });

  describe('datetime conversion helpers', () => {
    it('keeps zone-less local wall-clock strings intact without shifting hours', () => {
      expect(toLocalDateTimeInputValue('2026-03-14T10:25')).toBe('2026-03-14T10:25');
      expect(toLocalDateTimeInputValue('2026-03-14T10:25', 'second')).toBe('2026-03-14T10:25:00');
      expect(toLocalDateTimeInputValue('2026-03-14T10:25:42', 'second')).toBe('2026-03-14T10:25:42');
    });

    it('round-trips UTC ISO-8601 instants through local datetime-local representation losslessly', () => {
      const utc = '2026-10-14T09:30:00Z';
      const localWall = toLocalDateTimeInputValue(utc, 'minute');
      expect(localWall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(localDateTimeToUtcIso(localWall)).toBe(utc);
    });

    it('handles explicit timezone offsets and rejects malformed strings', () => {
      const localFromOffset = toLocalDateTimeInputValue('2026-10-14T15:00:00+05:30', 'minute');
      expect(localDateTimeToUtcIso(localFromOffset)).toBe('2026-10-14T09:30:00Z');
      expect(toLocalDateTimeInputValue('')).toBe('');
      expect(toLocalDateTimeInputValue('not-a-date')).toBe('');
      expect(localDateTimeToUtcIso('')).toBeNull();
      expect(localDateTimeToUtcIso('invalid')).toBeNull();
    });

    it('formats emitted datetime values for both utc and local wireFormats', () => {
      const utc = formatDateTimeEmission('2026-10-14T09:30', 'utc', 'minute');
      expect(utc).toMatch(/Z$/);
      expect(formatDateTimeEmission('2026-10-14T09:30', 'local', 'minute')).toBe(
        '2026-10-14T09:30',
      );
      expect(formatDateTimeEmission('2026-10-14T09:30', 'local', 'second')).toBe(
        '2026-10-14T09:30:00',
      );
      expect(formatDateTimeEmission('', 'utc')).toBeNull();
    });
  });

  describe('partial and full date helpers', () => {
    it('projects ISO values to DOM values for year, month, and day precision', () => {
      expect(toDateInputDomValue('2026-07-19', 'year')).toBe('2026');
      expect(toDateInputDomValue('2026-07-19', 'month')).toBe('2026-07');
      expect(toDateInputDomValue('2026-07-19', 'day')).toBe('2026-07-19');
      expect(toDateBoundDomValue('2026-12-31', 'month')).toBe('2026-12');
      expect(toDateBoundDomValue(null, 'day')).toBeNull();
    });

    it('parses DOM values cleanly, returning null on empty and undefined on incomplete drafts', () => {
      expect(parseDateInputDomValue('', 'day')).toBeNull();
      expect(parseDateInputDomValue('202', 'year')).toBeUndefined();
      expect(parseDateInputDomValue('1998', 'year')).toBe('1998');
      expect(parseDateInputDomValue('2026-04', 'month')).toBe('2026-04');
      expect(parseDateInputDomValue('2026-04-09', 'day')).toBe('2026-04-09');
    });
  });

  describe('stepNumberValue', () => {
    it('steps decimal values without IEEE-754 drift and clamps to min/max', () => {
      expect(stepNumberValue(0.1, 1, { step: 0.2 })).toBe(0.3);
      expect(stepNumberValue(-1.25, -1, { step: 0.25, precision: 2 })).toBe(-1.5);
      expect(stepNumberValue(0.25, -1, { step: 0.25, precision: 2 })).toBe(0);
      expect(stepNumberValue(180, 1, { step: 1, min: 1, max: 180, mode: 'integer' })).toBe(180);
      expect(stepNumberValue(1, -1, { step: 1, min: 1, max: 180, mode: 'integer' })).toBe(1);
      expect(stepNumberValue(null, 1, { step: 1, min: 1, max: 10, mode: 'integer' })).toBe(1);
    });
  });

  describe('deriveAvatarInitials', () => {
    it('derives initials mechanically from display names or uses explicit initials', () => {
      expect(deriveAvatarInitials('Rukmini Devi')).toBe('RD');
      expect(deriveAvatarInitials('Dr. Vivek Kumar Gupta')).toBe('DG');
      expect(deriveAvatarInitials('Ananya')).toBe('AN');
      expect(deriveAvatarInitials('   ')).toBe('?');
      expect(deriveAvatarInitials('Rukmini Devi', 'rkd')).toBe('RKD');
    });
  });
});
