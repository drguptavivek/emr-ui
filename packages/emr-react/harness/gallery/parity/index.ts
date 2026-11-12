import { PARITY_ENTRIES_L1_L2 } from './entries-l1-l2';
import { PARITY_ENTRIES_L1_L2_BUILDING_BLOCKS } from './entries-l1-l2-building-blocks';
import { PARITY_ENTRIES_L1_L2_WAVE2 } from './entries-l1-l2-wave2';
import { PARITY_ENTRIES_L3_L6 } from './entries-l3-l6';
import { PARITY_ENTRIES_L4_CLINICAL } from './entries-l4-clinical';
import { PARITY_ENTRIES_L4_WORKFLOWS } from './entries-l4-workflows';
import type { ParityEntry } from './types';

export type { ParityEntry, ParityLogEntry, ParityRenderContext } from './types';

export const PARITY_ENTRIES: readonly ParityEntry[] = [
  ...PARITY_ENTRIES_L1_L2,
  ...PARITY_ENTRIES_L1_L2_BUILDING_BLOCKS,
  ...PARITY_ENTRIES_L1_L2_WAVE2,
  ...PARITY_ENTRIES_L3_L6,
  ...PARITY_ENTRIES_L4_CLINICAL,
  ...PARITY_ENTRIES_L4_WORKFLOWS,
];

export const PARITY_BY_SELECTOR: ReadonlyMap<string, ParityEntry> = new Map(
  PARITY_ENTRIES.map((entry) => [entry.selector, entry]),
);
