import { create } from 'zustand';
import type { Dream } from '@dream-analyzer/shared-types';

interface DreamStore {
  dreams: Dream[];
  selectedDream: Dream | null;
  isLoading: boolean;
  setDreams: (dreams: Dream[]) => void;
  addDream: (dream: Dream) => void;
  setSelectedDream: (dream: Dream | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useDreamStore = create<DreamStore>((set) => ({
  dreams: [],
  selectedDream: null,
  isLoading: false,
  setDreams: (dreams) => set({ dreams }),
  addDream: (dream) => set((state) => ({ dreams: [dream, ...state.dreams] })),
  setSelectedDream: (dream) => set({ selectedDream: dream }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
