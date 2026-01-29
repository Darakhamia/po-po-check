import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// This will be set by the AuthProvider
let getToken: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: () => Promise<string | null>) => {
  getToken = getter;
};

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  if (getToken) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface Project {
  id: string;
  name: string;
  filename: string;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  totalEntries?: number;
  translatedEntries?: number;
}

export interface Entry {
  id: string;
  projectId: string;
  msgid: string;
  msgidPlural: string | null;
  msgstr: string[];
  msgctxt: string | null;
  comments: string | null;
  reference: string | null;
  flags: string[];
  isTranslated: boolean;
  isFuzzy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEntries {
  entries: Entry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Projects
export const getProjects = () => api.get<Project[]>('/projects');
export const getProject = (id: string) => api.get<Project & { entries: Entry[] }>(`/projects/${id}`);
export const uploadProject = (file: File, name?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  return api.post<Project>('/projects/upload', formData);
};
export const deleteProject = (id: string) => api.delete(`/projects/${id}`);
export const updateProject = (id: string, data: Partial<Project>) =>
  api.patch<Project>(`/projects/${id}`, data);
export const exportProject = (id: string) =>
  api.get(`/projects/${id}/export`, { responseType: 'blob' });

// Entries
export const getEntries = (projectId: string, params?: {
  search?: string;
  filter?: string;
  page?: number;
  limit?: number;
}) => api.get<PaginatedEntries>(`/entries/project/${projectId}`, { params });

export const updateEntry = (id: string, data: { msgstr?: string[]; isFuzzy?: boolean }) =>
  api.patch<Entry>(`/entries/${id}`, data);

export const batchUpdateEntries = (updates: { id: string; msgstr: string[] }[]) =>
  api.post<Entry[]>('/entries/batch-update', { updates });

export interface HistoryEntry {
  id: string;
  projectId: string;
  entryId: string;
  msgid: string;
  oldMsgstr: string[];
  newMsgstr: string[];
  changedBy: string | null;
  changedAt: string;
}

export const getEntryHistory = (id: string) =>
  api.get<HistoryEntry[]>(`/entries/${id}/history`);

export const undoEntry = (id: string) =>
  api.post<{ entry: Entry; undone: HistoryEntry }>(`/entries/${id}/undo`);

export const restoreEntry = (entryId: string, historyId: string) =>
  api.post<{ entry: Entry; restoredFrom: HistoryEntry }>(`/entries/${entryId}/restore/${historyId}`);

// Translation
export const translateSingle = (entryId: string, targetLanguage: string) =>
  api.post<{ entry: Entry; translation: string }>('/translate/single', { entryId, targetLanguage });

export const translateBatch = (entryIds: string[], targetLanguage: string) =>
  api.post<{ translated: number; entries: Entry[] }>('/translate/batch', { entryIds, targetLanguage });

export const translateProject = (projectId: string, targetLanguage: string) =>
  api.post<{ translated: number; total: number }>(`/translate/project/${projectId}`, { targetLanguage });

// Settings
export const getSettings = () => api.get<{ openaiApiKey: string | null; openaiApiKeyConfigured: boolean }>('/settings');
export const updateOpenaiApiKey = (value: string) =>
  api.put('/settings/openai-api-key', { value });
export const getApiKeyStatus = () => api.get<{ configured: boolean; source: string }>('/settings/api-key-status');

export default api;
