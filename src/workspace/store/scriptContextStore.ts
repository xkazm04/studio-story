/**
 * Script Context Store — Cross-panel communication for the Studio layout.
 *
 * The scene editor publishes referenced characters and beats.
 * Sidebar panels subscribe to highlight referenced items.
 */

import { create } from 'zustand';

interface InsertRequest {
  type: string;
  speaker?: string;
  beatRef?: string;
}

interface ScriptContextState {
  referencedSpeakers: string[];
  referencedBeats: string[];
  setReferences: (speakers: string[], beats: string[]) => void;

  pendingInsert: InsertRequest | null;
  requestInsert: (block: InsertRequest) => void;
  consumeInsert: () => InsertRequest | null;
}

export const useScriptContextStore = create<ScriptContextState>((set, get) => ({
  referencedSpeakers: [],
  referencedBeats: [],

  setReferences: (speakers, beats) => {
    set({ referencedSpeakers: speakers, referencedBeats: beats });
  },

  pendingInsert: null,

  requestInsert: (block) => {
    set({ pendingInsert: block });
  },

  consumeInsert: () => {
    const pending = get().pendingInsert;
    if (pending) {
      set({ pendingInsert: null });
    }
    return pending;
  },
}));
