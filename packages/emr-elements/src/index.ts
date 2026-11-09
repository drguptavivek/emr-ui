export * from './foundations.js';
export * from './icons.js';
export * from './l1-primitives.js';
export * from './l2-fields.js';
export * from './l3-structures.js';
export * from './l4-domain.js';
export * from './l6-authoring.js';

import { registerL1Elements } from './l1-primitives.js';
import { registerL2Elements } from './l2-fields.js';
import { registerL3Elements } from './l3-structures.js';
import { registerL4Elements } from './l4-domain.js';
import { registerL6Elements } from './l6-authoring.js';

export function registerAllEmrElements(): void {
  registerL1Elements();
  registerL2Elements();
  registerL3Elements();
  registerL4Elements();
  registerL6Elements();
}

if (typeof customElements !== 'undefined') {
  registerAllEmrElements();
}
