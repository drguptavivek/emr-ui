export * from './foundations.js';
export * from './icons.js';
export * from './l1-primitives.js';
export * from './l1-primitives-extra.js';
export * from './l1-primitives-wave2.js';
export * from './l2-fields.js';
export * from './l2-fields-extra.js';
export * from './l3-structures.js';
export * from './l4-domain.js';
export * from './l6-authoring.js';

import type {
  EmrAccordionElement,
  EmrBreadcrumbsElement,
  EmrColorPickerElement,
  EmrComboboxElement,
  EmrCopyButtonElement,
  EmrDateRangeInputElement,
  EmrImageCropperElement,
  EmrImageUploadElement,
  EmrImageViewerElement,
  EmrMaskedInputElement,
  EmrMenuElement,
  EmrOtpInputElement,
  EmrRangeSliderElement,
  EmrSliderElement,
  EmrSplitButtonElement,
  EmrTagInputElement,
  EmrToggleGroupElement,
  EmrTreeSelectElement,
  EmrTreeViewElement,
} from './l1-primitives-wave2.js';
import type { EmrImageFieldElement } from './l2-fields-extra.js';
import { registerL6Elements } from './l6-authoring.js';

declare global {
  interface HTMLElementTagNameMap {
    'emr-toggle-group': EmrToggleGroupElement;
    'emr-tree-view': EmrTreeViewElement;
    'emr-tree-select': EmrTreeSelectElement;
    'emr-image-viewer': EmrImageViewerElement;
    'emr-image-cropper': EmrImageCropperElement;
    'emr-image-upload': EmrImageUploadElement;
    'emr-date-range-input': EmrDateRangeInputElement;
    'emr-combobox': EmrComboboxElement;
    'emr-tag-input': EmrTagInputElement;
    'emr-slider': EmrSliderElement;
    'emr-range-slider': EmrRangeSliderElement;
    'emr-masked-input': EmrMaskedInputElement;
    'emr-otp-input': EmrOtpInputElement;
    'emr-menu': EmrMenuElement;
    'emr-split-button': EmrSplitButtonElement;
    'emr-accordion': EmrAccordionElement;
    'emr-breadcrumbs': EmrBreadcrumbsElement;
    'emr-color-picker': EmrColorPickerElement;
    'emr-copy-button': EmrCopyButtonElement;
    'emr-image-field': EmrImageFieldElement;
  }
}

export function registerAllEmrElements(): void {
  registerL6Elements();
}

if (typeof customElements !== 'undefined') {
  registerAllEmrElements();
}
