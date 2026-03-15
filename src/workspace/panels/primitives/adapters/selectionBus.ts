'use client';

import { create } from 'zustand';

export type SelectionEntity = 'character' | 'scene';

export interface SelectionEvent {
  entity: SelectionEntity;
  id: string;
  source: string;
  timestamp: number;
}

interface SelectionBusState {
  lastEvent: SelectionEvent | null;
  publish: (event: Omit<SelectionEvent, 'timestamp'>) => void;
}

export const useSelectionContext = create<SelectionBusState>((set) => ({
  lastEvent: null,
  publish: (event) => set({ lastEvent: { ...event, timestamp: Date.now() } }),
}));
