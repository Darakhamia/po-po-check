import { Search, Filter, Languages, Download, CheckSquare, Square, ArrowUpDown, Wand2 } from 'lucide-react';
import { useStore, FilterType, SortType } from '../store/useStore';

interface ToolbarProps {
  onTranslateSelected: () => void;
  onTranslateAll: () => void;
  onExport: () => void;
  untranslatedCount: number;
}

export default function Toolbar({ onTranslateSelected, onTranslateAll, onExport, untranslatedCount }: ToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    selectedEntries,
    selectAll,
    clearSelection,
    targetLanguage,
    setTargetLanguage,
    languages,
    isTranslating,
  } = useStore();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All entries</option>
            <option value="untranslated">Untranslated</option>
            <option value="translated">Translated</option>
            <option value="fuzzy">Fuzzy</option>
            <option value="issues">With issues</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="default">Default order</option>
            <option value="untranslated-first">Untranslated first</option>
            <option value="issues-first">Issues first</option>
          </select>
        </div>

        {/* Target Language */}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-gray-400" />
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Selection controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectedEntries.size > 0 ? clearSelection : selectAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            {selectedEntries.size > 0 ? (
              <>
                <Square className="w-4 h-4" />
                Clear ({selectedEntries.size})
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                Select all
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Translate All button */}
          {untranslatedCount > 0 && (
            <button
              onClick={onTranslateAll}
              disabled={isTranslating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {isTranslating ? 'Translating...' : `Translate all (${untranslatedCount})`}
            </button>
          )}

          {selectedEntries.size > 0 && (
            <button
              onClick={onTranslateSelected}
              disabled={isTranslating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
            >
              <Languages className="w-4 h-4" />
              {isTranslating ? 'Translating...' : `Translate ${selectedEntries.size} selected`}
            </button>
          )}

          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Export .po
          </button>
        </div>
      </div>
    </div>
  );
}
