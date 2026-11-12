import type { ReactNode } from 'react';

export type ParitySource = 'react' | 'lit';

export interface ParityLogEntry {
  id: number;
  at: string;
  source: ParitySource;
  selector: string;
  event: string;
  payload: unknown;
}

export interface ParityRenderContext<TState> {
  state: TState;
  readOnly: boolean;
  update: (
    source: ParitySource,
    event: string,
    payload: unknown,
    updater?: (prev: TState) => TState,
  ) => void;
}

export interface ParityEntry<TState = unknown> {
  selector: string;
  shell?: boolean;
  notes?: string;
  createInitialState: () => TState;
  renderReact: (ctx: ParityRenderContext<TState>) => ReactNode;
  renderLit: (ctx: ParityRenderContext<TState>) => ReactNode;
}

export function defineParityEntry<TState>(entry: ParityEntry<TState>): ParityEntry<unknown> {
  return entry as ParityEntry<unknown>;
}
