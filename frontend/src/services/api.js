import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const documentApi = {
  getAll: async () => {
    const res = await api.get('/documents');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },

  getFileUrl: (id) => {
    return `/api/documents/${id}/file`;
  },

  upload: async (files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};

export const chatApi = {
  ask: async ({ question, paper_ids, session_id = 'default' }) => {
    const res = await api.post('/chat', {
      question,
      paper_ids: paper_ids && paper_ids.length > 0 ? paper_ids : null,
      session_id,
    });
    return res.data;
  },

  getHistory: async (sessionId = 'default') => {
    const res = await api.get(`/chat/history?session_id=${encodeURIComponent(sessionId)}`);
    return res.data;
  },

  clearHistory: async (sessionId = 'default') => {
    const res = await api.delete(`/chat/history?session_id=${encodeURIComponent(sessionId)}`);
    return res.data;
  },
};

export const summaryApi = {
  getOrGenerate: async (id, force = false) => {
    const res = await api.post(`/summary/${id}?force_regenerate=${force}`);
    return res.data;
  },

  get: async (id) => {
    const res = await api.get(`/summary/${id}`);
    return res.data;
  },
};

export const comparisonApi = {
  compare: async (documentId1, documentId2) => {
    const res = await api.post('/compare', {
      document_id_1: documentId1,
      document_id_2: documentId2,
    });
    return res.data;
  },
};

export const systemApi = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

export default api;
