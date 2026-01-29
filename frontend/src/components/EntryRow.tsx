import { useState, useRef, useEffect, useMemo } from 'react';
import { Languages, Check, X, AlertCircle, AlertTriangle, Undo2 } from 'lucide-react';
import { Entry } from '../services/api';
import { validateTranslation } from '../utils/validation';

interface EntryRowProps {
  entry: Entry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (msgstr: string[]) => void;
  onTranslate: () => void;
  onUndo: () => void;
  isTranslating?: boolean;
  isUndoing?: boolean;
}

export default function EntryRow({
  entry,
  isSelected,
  onToggleSelect,
  onUpdate,
  onTranslate,
  onUndo,
  isTranslating,
  isUndoing,
}: EntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.msgstr[0] || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validation issues
  const issues = useMemo(() => {
    if (!entry.isTranslated || !entry.msgstr[0]) return [];
    return validateTranslation(entry.msgid, entry.msgstr[0]);
  }, [entry.msgid, entry.msgstr, entry.isTranslated]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(entry.msgstr[0] || '');
  }, [entry.msgstr]);

  const handleSave = () => {
    if (editValue !== entry.msgstr[0]) {
      onUpdate([editValue]);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(entry.msgstr[0] || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const rowClass = `entry-row border-b border-gray-100 ${isSelected ? 'selected' : ''} ${
    !entry.isTranslated ? 'untranslated' : ''
  } ${entry.isFuzzy ? 'fuzzy' : ''} ${issues.length > 0 ? 'has-issues' : ''}`;

  return (
    <tr className={rowClass}>
      <td className="px-4 py-3 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
      </td>

      <td className="px-4 py-3 w-1/2">
        <div className="space-y-1">
          <div className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-words">
            {entry.msgid}
          </div>
          {entry.msgctxt && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Context:</span> {entry.msgctxt}
            </div>
          )}
          {entry.comments && (
            <div className="text-xs text-gray-400 italic">{entry.comments}</div>
          )}
        </div>
      </td>

      <td className="px-4 py-3 w-1/2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <span className="text-xs text-gray-400">Ctrl+Enter to save, Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              onClick={() => setIsEditing(true)}
              className={`cursor-text min-h-[40px] px-3 py-2 border rounded-md text-sm font-mono whitespace-pre-wrap break-words ${
                issues.length > 0
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              {entry.msgstr[0] || (
                <span className="text-gray-400 italic">Click to translate...</span>
              )}
            </div>

            {/* Validation issues */}
            {issues.length > 0 && (
              <div className="space-y-1">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded"
                  >
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </td>

      <td className="px-4 py-3 w-24">
        <div className="flex flex-wrap items-center gap-1">
          {!entry.isTranslated && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              New
            </span>
          )}
          {entry.isFuzzy && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
              Fuzzy
            </span>
          )}
          {entry.isTranslated && issues.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Issues
            </span>
          )}
          {entry.isTranslated && issues.length === 0 && !entry.isFuzzy && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              OK
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 w-32">
        <div className="flex items-center gap-2">
          <button
            onClick={onTranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 disabled:opacity-50"
            title="Translate with ChatGPT"
          >
            <Languages className="w-3 h-3" />
            {isTranslating ? '...' : 'AI'}
          </button>
          <button
            onClick={onUndo}
            disabled={isUndoing || !entry.isTranslated}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Undo last change"
          >
            <Undo2 className="w-3 h-3" />
            {isUndoing ? '...' : 'Undo'}
          </button>
        </div>
      </td>
    </tr>
  );
}
