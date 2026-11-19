import { describe, expect, it } from 'vitest';
import {
  canSelectImageTemplate,
  canToggleTemplateFavourite,
  filterImageTemplates,
  resolveImageTemplatePickerHeadingId,
  resolveImageTemplatePickerId,
  resolveImageTemplateSearchId,
  resolveImageTemplateSectionId,
} from './image-template-picker.models';
import type { ImageTemplateGroup, ImageTemplateOption } from './image-template-picker.models';

const o = (id: string, label: string, groupId: string, badges: string[] = []): ImageTemplateOption =>
  ({ id, label, imageUrl: `/${id}.svg`, width: 100, height: 100, groupId, badges });

const groups: ImageTemplateGroup[] = [{ id: 'retina', label: 'Eye — retina' }, { id: 'hands', label: 'Hands' }];
const options = [
  o('r-od', 'Posterior pole', 'retina', ['OD']),
  o('r-os', 'Posterior pole', 'retina', ['OS']),
  o('h-l', 'Palm', 'hands', ['Left']),
  o('h-r', 'Dorsum', 'hands', ['Right']),
];
const ids = (list: readonly ImageTemplateOption[]) => list.map((x) => x.id);

describe('filterImageTemplates', () => {
  it('returns everything for an empty or blank query and no group', () => {
    expect(ids(filterImageTemplates(options, ''))).toEqual(['r-od', 'r-os', 'h-l', 'h-r']);
    expect(ids(filterImageTemplates(options, '   '))).toEqual(['r-od', 'r-os', 'h-l', 'h-r']);
  });
  it('matches label, badges and group label, ignoring case', () => {
    expect(ids(filterImageTemplates(options, 'PALM'))).toEqual(['h-l']);
    expect(ids(filterImageTemplates(options, 'od'))).toEqual(['r-od']);
    expect(ids(filterImageTemplates(options, 'retina', undefined, groups))).toEqual(['r-od', 'r-os']);
  });
  it('does not match group labels without the groups list', () => {
    expect(filterImageTemplates(options, 'retina')).toEqual([]);
  });
  it('filters by group, and null means all', () => {
    expect(ids(filterImageTemplates(options, '', 'hands'))).toEqual(['h-l', 'h-r']);
    expect(ids(filterImageTemplates(options, '', null))).toHaveLength(4);
  });
  it('combines query and group', () => {
    expect(ids(filterImageTemplates(options, 'right', 'hands'))).toEqual(['h-r']);
    expect(filterImageTemplates(options, 'right', 'retina')).toEqual([]);
  });
  it('returns an empty list when nothing matches', () => {
    expect(filterImageTemplates(options, 'zzz')).toEqual([]);
  });
  it('treats the reserved favourites group as favourites only, in favourite order', () => {
    expect(ids(filterImageTemplates(options, '', 'favourites', groups, ['h-r', 'r-od']))).toEqual(['h-r', 'r-od']);
    expect(ids(filterImageTemplates(options, 'od', 'favourites', groups, ['h-r', 'r-od']))).toEqual(['r-od']);
  });
  it('ignores unknown favourite ids and yields none without favourites', () => {
    expect(ids(filterImageTemplates(options, '', 'favourites', groups, ['nope', 'h-l']))).toEqual(['h-l']);
    expect(filterImageTemplates(options, '', 'favourites', groups)).toEqual([]);
  });
});

describe('image-template-picker guards and id helpers', () => {
  it('enforces readOnly and canEditFavourites guards for selection and starring', () => {
    const opt = options[0];
    expect(canSelectImageTemplate(false, opt)).toBe(true);
    expect(canSelectImageTemplate(undefined, opt)).toBe(true);
    expect(canSelectImageTemplate(true, opt)).toBe(false);
    expect(canSelectImageTemplate(false, null)).toBe(false);

    expect(canToggleTemplateFavourite({ canEditFavourites: true, readOnly: false }, opt)).toBe(true);
    expect(canToggleTemplateFavourite({ canEditFavourites: false, readOnly: false }, opt)).toBe(false);
    expect(canToggleTemplateFavourite({ canEditFavourites: true, readOnly: true }, opt)).toBe(false);
    expect(canToggleTemplateFavourite({ canEditFavourites: true, readOnly: false }, opt, true)).toBe(false);
    expect(canToggleTemplateFavourite({ canEditFavourites: true, readOnly: false }, undefined)).toBe(false);
  });

  it('resolves deterministic picker, heading, search, and section ids', () => {
    expect(resolveImageTemplatePickerId()).toBe('emr-image-template-picker');
    expect(resolveImageTemplatePickerId('opd-')).toBe('opd-emr-image-template-picker');
    expect(resolveImageTemplatePickerId('', 'tpl-h')).toBe('tpl-h-picker');

    expect(resolveImageTemplatePickerHeadingId()).toBe('emr-image-template-picker-heading');
    expect(resolveImageTemplatePickerHeadingId('opd-')).toBe('opd-emr-image-template-picker-heading');
    expect(resolveImageTemplatePickerHeadingId('opd', 'custom-h')).toBe('custom-h');

    expect(resolveImageTemplateSearchId('opd')).toBe('opd-emr-image-template-picker-q');
    expect(resolveImageTemplateSectionId('fav', 'opd')).toBe('opd-emr-image-template-picker-fav');
    expect(resolveImageTemplateSectionId('all', 'opd')).toBe('opd-emr-image-template-picker-all');
  });
});
