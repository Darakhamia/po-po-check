import { useState, useEffect } from 'react';
import { Key, Check, AlertCircle, Languages, Plus, X, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiKeyStatus, updateSetting } from '../services/api';
import { useStore } from '../store/useStore';

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

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<{ configured: boolean; source: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');

  const { languages, addLanguage, removeLanguage, setLanguages } = useStore();

  useEffect(() => {
    loadApiKeyStatus();
  }, []);

  const loadApiKeyStatus = async () => {
    try {
      const response = await getApiKeyStatus();
      setApiKeyStatus(response.data);
    } catch (error) {
      console.error('Failed to load API key status');
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setIsSaving(true);
      await updateSetting('openai_api_key', apiKey);
      toast.success('API key saved');
      setApiKey('');
      loadApiKeyStatus();
    } catch (error) {
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLanguage = () => {
    const lang = newLanguage.trim();
    if (!lang) {
      toast.error('Please enter a language name');
      return;
    }
    if (languages.includes(lang)) {
      toast.error('Language already exists');
      return;
    }
    addLanguage(lang);
    setNewLanguage('');
    toast.success(`Added "${lang}"`);
  };

  const handleRemoveLanguage = (lang: string) => {
    if (languages.length <= 1) {
      toast.error('You need at least one language');
      return;
    }
    removeLanguage(lang);
    toast.success(`Removed "${lang}"`);
  };

  const handleResetLanguages = () => {
    setLanguages(DEFAULT_LANGUAGES);
    toast.success('Languages reset to defaults');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-8">Configure your PO Editor preferences</p>

      {/* API Key Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-50 rounded-lg">
            <Key className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900">OpenAI API Key</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Required for ChatGPT translation feature. Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>

            {apiKeyStatus && (
              <div
                className={`flex items-center gap-2 p-3 rounded-md mb-4 ${
                  apiKeyStatus.configured
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {apiKeyStatus.configured ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">
                      API key configured ({apiKeyStatus.source === 'database' ? 'from settings' : 'from environment'})
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">API key not configured</span>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Your API key is stored securely and never exposed in the client.
            </p>
          </div>
        </div>
      </div>

      {/* Languages Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-50 rounded-lg">
            <Languages className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Target Languages</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage the list of languages available for translation
                </p>
              </div>
              <button
                onClick={handleResetLanguages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Add new language */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLanguage()}
                placeholder="Add new language..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={handleAddLanguage}
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Language list */}
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {lang}
                  <button
                    onClick={() => handleRemoveLanguage(lang)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Click the X to remove a language. Changes are saved automatically.
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>PO Editor</strong> is a web-based translation editor for .po files with ChatGPT integration.
          </p>
          <p>
            Built with React, Node.js, Express, and PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
}
