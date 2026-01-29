import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entry, Project } from '../services/api';

export type FilterType = 'all' | 'translated' | 'untranslated' | 'fuzzy' | 'issues';
export type SortType = 'default' | 'untranslated-first' | 'issues-first';

const DEFAULT_LANGUAGES = [
  'Russian',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Dutch',
  'Polish',
  'Turkish',
  'Ukrainian',
];

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
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  sortBy: SortType;
  setSortBy: (sort: SortType) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;

  // Translation settings
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  languages: string[];
  setLanguages: (languages: string[]) => void;
  addLanguage: (language: string) => void;
  removeLanguage: (language: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentProject: null,
      setCurrentProject: (project: Project | null) => set({ currentProject: project }),

      entries: [],
      setEntries: (entries: Entry[]) => set({ entries }),
      updateEntryInStore: (id: string, updates: Partial<Entry>) =>
        set((state: AppState) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      selectedEntries: new Set<string>(),
      toggleSelection: (id: string) =>
        set((state: AppState) => {
          const newSelection = new Set(state.selectedEntries);
          if (newSelection.has(id)) {
            newSelection.delete(id);
          } else {
            newSelection.add(id);
          }
          return { selectedEntries: newSelection };
        }),
      selectAll: () =>
        set((state: AppState) => ({
          selectedEntries: new Set(state.entries.map((e) => e.id)),
        })),
      clearSelection: () => set({ selectedEntries: new Set<string>() }),

      searchQuery: '',
      setSearchQuery: (query: string) => set({ searchQuery: query, currentPage: 1 }),
      filter: 'all' as FilterType,
      setFilter: (filter: FilterType) => set({ filter, currentPage: 1 }),
      sortBy: 'default' as SortType,
      setSortBy: (sortBy: SortType) => set({ sortBy }),

      currentPage: 1,
      setCurrentPage: (page: number) => set({ currentPage: page }),
      totalPages: 1,
      setTotalPages: (pages: number) => set({ totalPages: pages }),

      targetLanguage: 'Russian',
      setTargetLanguage: (lang: string) => set({ targetLanguage: lang }),
      languages: DEFAULT_LANGUAGES,
      setLanguages: (languages: string[]) => set({ languages }),
      addLanguage: (language: string) =>
        set((state: AppState) => ({
          languages: state.languages.includes(language)
            ? state.languages
            : [...state.languages, language].sort(),
        })),
      removeLanguage: (language: string) =>
        set((state: AppState) => ({
          languages: state.languages.filter((l: string) => l !== language),
          targetLanguage: state.targetLanguage === language ? state.languages[0] || 'English' : state.targetLanguage,
        })),

      isLoading: false,
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      isTranslating: false,
      setIsTranslating: (translating: boolean) => set({ isTranslating: translating }),
    }),
    {
      name: 'polyglot-storage',
      partialize: (state: AppState) => ({
        targetLanguage: state.targetLanguage,
        languages: state.languages,
        sortBy: state.sortBy,
      }),
    }
  )
);
