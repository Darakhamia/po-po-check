import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import {
  getProject,
  getEntries,
  updateEntry,
  translateSingle,
  translateBatch,
  translateProject,
  exportProject,
} from '../services/api';
import Toolbar from '../components/Toolbar';
import EntryRow from '../components/EntryRow';
import Pagination from '../components/Pagination';
import ProgressBar from '../components/ProgressBar';
import { hasValidationIssues } from '../utils/validation';

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [translatingEntries, setTranslatingEntries] = useState<Set<string>>(new Set());

  const {
    currentProject,
    setCurrentProject,
    entries,
    setEntries,
    updateEntryInStore,
    selectedEntries,
    toggleSelection,
    clearSelection,
    searchQuery,
    filter,
    sortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    targetLanguage,
    isLoading,
    setIsLoading,
    setIsTranslating,
  } = useStore();

  const loadProject = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await getProject(id);
      setCurrentProject(response.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, setCurrentProject, setIsLoading]);

  const loadEntries = useCallback(async () => {
    if (!id) return;

    try {
      // For 'issues' filter, we need to load all and filter client-side
      const filterParam = filter === 'issues' || filter === 'all' ? undefined : filter;

      const response = await getEntries(id, {
        search: searchQuery || undefined,
        filter: filterParam,
        page: currentPage,
        limit: 100, // Load more for client-side filtering
      });
      setEntries(response.data.entries);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load entries');
    }
  }, [id, searchQuery, filter, currentPage, setEntries, setTotalPages]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (currentProject) {
      loadEntries();
    }
  }, [currentProject, loadEntries]);

  // Filter and sort entries client-side
  const processedEntries = useMemo(() => {
    let filtered = [...entries];

    // Filter by issues
    if (filter === 'issues') {
      filtered = filtered.filter((entry) => {
        if (!entry.isTranslated || !entry.msgstr[0]) return false;
        return hasValidationIssues(entry.msgid, entry.msgstr[0]);
      });
    }

    // Sort entries
    if (sortBy === 'untranslated-first') {
      filtered.sort((a, b) => {
        if (a.isTranslated === b.isTranslated) return 0;
        return a.isTranslated ? 1 : -1;
      });
    } else if (sortBy === 'issues-first') {
      filtered.sort((a, b) => {
        const aHasIssues = a.isTranslated && a.msgstr[0] && hasValidationIssues(a.msgid, a.msgstr[0]);
        const bHasIssues = b.isTranslated && b.msgstr[0] && hasValidationIssues(b.msgid, b.msgstr[0]);
        if (aHasIssues === bHasIssues) return 0;
        return aHasIssues ? -1 : 1;
      });
    }

    return filtered;
  }, [entries, filter, sortBy]);

  const handleUpdateEntry = async (entryId: string, msgstr: string[]) => {
    try {
      const response = await updateEntry(entryId, { msgstr });
      updateEntryInStore(entryId, response.data);
      toast.success('Entry updated');
    } catch (error) {
      toast.error('Failed to update entry');
    }
  };

  const handleTranslateSingle = async (entryId: string) => {
    try {
      setTranslatingEntries((prev) => new Set(prev).add(entryId));
      const response = await translateSingle(entryId, targetLanguage);
      updateEntryInStore(entryId, response.data.entry);
      toast.success('Translation complete');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Translation failed');
    } finally {
      setTranslatingEntries((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  const handleTranslateSelected = async () => {
    if (selectedEntries.size === 0) return;

    try {
      setIsTranslating(true);
      const entryIds = Array.from(selectedEntries);
      const response = await translateBatch(entryIds, targetLanguage);

      for (const entry of response.data.entries) {
        updateEntryInStore(entry.id, entry);
      }

      toast.success(`Translated ${response.data.translated} entries`);
      clearSelection();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Batch translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateAll = async () => {
    if (!id) return;

    try {
      setIsTranslating(true);
      const response = await translateProject(id, targetLanguage);

      toast.success(`Translated ${response.data.translated} of ${response.data.total} entries`);

      // Reload entries to get updated translations
      await loadEntries();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExport = async () => {
    if (!id || !currentProject) return;

    try {
      const response = await exportProject(id);
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentProject.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('File exported');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const translatedCount = entries.filter((e) => e.isTranslated).length;
  const untranslatedCount = entries.filter((e) => !e.isTranslated).length;

  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{currentProject.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{currentProject.filename}</span>
                {currentProject.language && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {currentProject.language}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-64">
            <ProgressBar translated={translatedCount} total={entries.length} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        onTranslateSelected={handleTranslateSelected}
        onTranslateAll={handleTranslateAll}
        onExport={handleExport}
        untranslatedCount={untranslatedCount}
      />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                Original (msgid)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                Translation (msgstr)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {processedEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isSelected={selectedEntries.has(entry.id)}
                onToggleSelect={() => toggleSelection(entry.id)}
                onUpdate={(msgstr) => handleUpdateEntry(entry.id, msgstr)}
                onTranslate={() => handleTranslateSingle(entry.id)}
                isTranslating={translatingEntries.has(entry.id)}
              />
            ))}
          </tbody>
        </table>

        {processedEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No entries found matching your criteria
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
