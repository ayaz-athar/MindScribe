import axios from 'axios';
import { auth } from '../firebase/config.js';

/**
 * Base Axios Client configured for MindScribe API
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor
 * 
 * CORE REQUIREMENT:
 * Automatically retrieves the current user's Firebase ID Token (or local dev demo token)
 * and injects it as 'Authorization: Bearer <token>' into every outgoing HTTP request.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      let idToken = null;

      // 1. Check live Firebase Auth instance
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }

      // 2. Fallback to active demo session if Firebase client auth is not configured
      if (!idToken) {
        const savedDemoUser = localStorage.getItem('mindscribe_demo_user');
        if (savedDemoUser) {
          try {
            const parsed = JSON.parse(savedDemoUser);
            idToken = `demo-token:${parsed.uid}:${parsed.email}`;
          } catch (e) {
            // ignore
          }
        }
      }

      if (idToken) {
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.warn('Could not attach Firebase ID Token to request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Axios Response Interceptor for centralized error logging
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorPayload = error.response?.data || { message: error.message };
    console.error('API Error Response:', errorPayload);
    return Promise.reject(errorPayload);
  }
);

export const apiService = {
  // Test & Verify Authentication
  async getMe() {
    const response = await api.get('/api/me');
    return response.data;
  },

  // Health checks
  async getHealth() {
    const response = await api.get('/healthz');
    return response.data;
  },

  // Journal Entries CRUD
  async getEntries(params = {}) {
    const response = await api.get('/api/entries', { params });
    return response.data;
  },

  async getEntryById(id) {
    const response = await api.get(`/api/entries/${id}`);
    return response.data;
  },

  async createEntry(entryData) {
    const response = await api.post('/api/entries', entryData);
    return response.data;
  },

  async updateEntry(id, entryData) {
    const response = await api.put(`/api/entries/${id}`, entryData);
    return response.data;
  },

  async deleteEntry(id) {
    const response = await api.delete(`/api/entries/${id}`);
    return response.data;
  },

  // Server-side AI Operations
  async generateReflection(content, mood, entryId) {
    const response = await api.post('/api/ai/reflect', { content, mood, entryId });
    return response.data;
  },

  async generateDailyPrompts(recentMoods = [], topics = []) {
    const response = await api.post('/api/ai/prompts', { recentMoods, topics });
    return response.data;
  },

  // Gemini AI Chat / Journal Assistant (POST /api/gemini)
  async sendGeminiPrompt({ prompt, history = [], systemInstruction = null }) {
    const payload = {
      prompt: prompt.trim(),
      history: Array.isArray(history) ? history : [],
    };
    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }
    const response = await api.post('/api/gemini', payload);
    return response.data;
  },
};

export default api;
