import { create } from 'zustand';
import { Entry, Project } from '../services/api';

interface AppState {
  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Entries
  entries: Entry[];
  setEntries: (entries: Entry[]) => void;
  updateEntryInStore: (id: string, updates: Partial<Entry>) => void;

  // Selection
  selectedEntries: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: 'all' | 'translated' | 'untranslated' | 'fuzzy';
  setFilter: (filter: 'all' | 'translated' | 'untranslated' | 'fuzzy') => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;

  // Translation settings
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  entries: [],
  setEntries: (entries) => set({ entries }),
  updateEntryInStore: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  selectedEntries: new Set(),
  toggleSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedEntries);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedEntries: newSelection };
    }),
  selectAll: () =>
    set((state) => ({
      selectedEntries: new Set(state.entries.map((e) => e.id)),
    })),
  clearSelection: () => set({ selectedEntries: new Set() }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  filter: 'all',
  setFilter: (filter) => set({ filter, currentPage: 1 }),

  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  totalPages: 1,
  setTotalPages: (pages) => set({ totalPages: pages }),

  targetLanguage: 'Russian',
  setTargetLanguage: (lang) => set({ targetLanguage: lang }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isTranslating: false,
  setIsTranslating: (translating) => set({ isTranslating: translating }),
}));
