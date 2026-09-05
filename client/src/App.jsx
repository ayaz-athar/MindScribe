import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { apiService } from './services/api.js';

import Navbar from './components/Navbar.jsx';
import AuthModal from './components/AuthModal.jsx';
import ApiMeTester from './components/ApiMeTester.jsx';
import JournalList from './components/JournalList.jsx';
import JournalEditor from './components/JournalEditor.jsx';
import AiInsights from './components/AiInsights.jsx';
import GeminiChat from './components/GeminiChat.jsx';
import SecurityBadge from './components/SecurityBadge.jsx';

import { Sparkles, ShieldCheck, Lock, Database, ArrowRight, KeyRound } from 'lucide-react';

export default function App() {
  const { currentUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('entries');
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [testerOpen, setTesterOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // Selected state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activeReflection, setActiveReflection] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const getStorageKey = () => (currentUser?.uid ? `mindscribe_entries_${currentUser.uid}` : null);

  const saveLocalEntries = (newEntries) => {
    const key = getStorageKey();
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(newEntries));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }
  };

  // Load entries when authenticated
  useEffect(() => {
    if (currentUser) {
      const key = getStorageKey();
      if (key) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            setEntries(JSON.parse(cached));
          }
        } catch (e) {
          // ignore
        }
      }
      loadEntries();
    } else {
      setEntries([]);
      setActiveReflection(null);
    }
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const data = await apiService.getEntries();
      const serverEntries = data.entries || [];
      const key = getStorageKey();
      let cached = [];
      if (key) {
        try {
          cached = JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
          cached = [];
        }
      }

      // Merge cached and server entries, deduplicating by ID
      const mergedMap = new Map();
      cached.forEach((e) => mergedMap.set(e.id, e));
      serverEntries.forEach((e) => mergedMap.set(e.id, e));
      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setEntries(mergedList);
      saveLocalEntries(mergedList);
    } catch (err) {
      console.error('Failed to load entries from server, using local cache:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleCreateOrUpdateEntry = async (entryData) => {
    try {
      if (entryData.id) {
        const updated = await apiService.updateEntry(entryData.id, entryData);
        const resolvedEntry = updated.entry || { ...entryData, updatedAt: new Date().toISOString() };
        setEntries((prev) => {
          const next = prev.map((e) => (e.id === entryData.id ? resolvedEntry : e));
          saveLocalEntries(next);
          return next;
        });
        showToast('Journal entry updated successfully!');
        return resolvedEntry;
      } else {
        const created = await apiService.createEntry(entryData);
        const resolvedEntry = created.entry || {
          ...entryData,
          id: 'entry-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEntries((prev) => {
          const next = [resolvedEntry, ...prev];
          saveLocalEntries(next);
          return next;
        });
        showToast('Journal entry created successfully!');
        return resolvedEntry;
      }
    } catch (err) {
      console.error('Save sync failed, keeping local copy:', err);
      const fallbackEntry = entryData.id
        ? { ...entryData, updatedAt: new Date().toISOString() }
        : {
            ...entryData,
            id: 'entry-' + Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      setEntries((prev) => {
        const next = entryData.id
          ? prev.map((e) => (e.id === entryData.id ? fallbackEntry : e))
          : [fallbackEntry, ...prev];
        saveLocalEntries(next);
        return next;
      });
      showToast('Journal entry saved!');
      return fallbackEntry;
    }
  };

  const handleSaveAndReflect = async (entryData) => {
    const saved = await handleCreateOrUpdateEntry(entryData);
    handleReflect(saved);
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    
    // Immediately remove from UI and persistent storage
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocalEntries(next);
      return next;
    });
    showToast('Entry deleted');

    try {
      await apiService.deleteEntry(id);
    } catch (err) {
      console.warn('Server delete sync notice:', err);
    }
  };

  const handleReflect = async (entry) => {
    setActiveTab('ai-coach');
    showToast('Analyzing thoughts with Gemini AI on Cloud Run...');
    try {
      const res = await apiService.generateReflection(entry.content, entry.mood, entry.id);
      setActiveReflection(res.reflection);
    } catch (err) {
      console.error('AI Reflection failed:', err);
      showToast(err.message || 'AI Reflection failed');
    }
  };

  const handleUsePrompt = (promptObj) => {
    setSelectedEntry({
      title: promptObj.title,
      content: `Reflecting on prompt: "${promptObj.prompt}"\n\n`,
      mood: 'Creative',
      tags: [promptObj.category?.toLowerCase() || 'prompt'],
    });
    setEditorOpen(true);
  };

  const handleInsertFromChat = (text) => {
    setSelectedEntry({
      title: 'Insights from Gemini Chat',
      content: text,
      mood: 'Reflective',
      tags: ['ai-assistant', 'gemini'],
    });
    setEditorOpen(true);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setEditorOpen(true);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setEditorOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0c0d10] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-sunset-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-cream-300/70 font-medium">Initializing MindScribe Security Context...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#fbf8eb] flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenTester={() => setTesterOpen(true)}
        onNewEntry={handleNewEntry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 btn-primary text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cream-200" />
            {toastMessage}
          </div>
        )}

        {currentUser ? (
          <div>
            {activeTab === 'entries' && (
              <JournalList
                entries={entries}
                loading={loadingEntries}
                onSelectEntry={handleEditEntry}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
                onReflectEntry={handleReflect}
                onNewEntry={handleNewEntry}
              />
            )}

            {activeTab === 'chat' && (
              <GeminiChat onInsertIntoJournal={handleInsertFromChat} />
            )}

            {activeTab === 'ai-coach' && (
              <AiInsights
                activeReflection={activeReflection}
                onUsePrompt={handleUsePrompt}
              />
            )}

            {activeTab === 'security' && <SecurityBadge />}
          </div>
        ) : (
          /* Landing Hero for Unauthenticated Visitors */
          <div className="max-w-4xl mx-auto text-center py-14 space-y-10 animate-fade-in">
            
            {/* Tagline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sunset-500/10 text-sunset-400 border border-sunset-500/25 text-xs font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-400" /> Built for Google Cloud Run Hackathon
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-cream-100 tracking-tight leading-tight">
                Intelligent, Private Journaling <br />
                <span className="bg-gradient-to-r from-sunset-400 via-cream-300 to-forest-400 bg-clip-text text-transparent">
                  Powered by Gemini AI on Cloud Run
                </span>
              </h1>
              <p className="text-sm sm:text-base text-cream-300/70 max-w-2xl mx-auto leading-relaxed font-serif">
                A production-grade, zero-trust journal web application. Authenticate via Firebase, query user-isolated Cloud Firestore collections, and analyze thoughts with server-side Google Gemini models.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTesterOpen(true)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-surface-card hover:bg-surface-hover text-cream-200 border border-cream-300/15 text-sm font-semibold transition-all duration-200 shadow-sm"
              >
                <KeyRound className="w-4 h-4 text-cream-300" />
                <span>Test /api/me Auth Route</span>
              </button>
            </div>

            {/* Architecture Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-6">
              <div className="glass-panel rounded-3xl p-6 transition-all duration-300 hover:border-crimson-500/40">
                <div className="w-11 h-11 rounded-2xl bg-crimson-500/15 border border-crimson-500/30 flex items-center justify-center text-crimson-400 mb-3.5">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-cream-100 mb-1.5">Secret Manager Protected</h3>
                <p className="text-xs text-cream-300/60 leading-relaxed">
                  Zero secrets baked into client bundles or git repos. All AI keys injected at runtime on Cloud Run.
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-6 transition-all duration-300 hover:border-forest-500/40">
                <div className="w-11 h-11 rounded-2xl bg-forest-500/15 border border-forest-500/30 flex items-center justify-center text-forest-400 mb-3.5">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-cream-100 mb-1.5">Per-User Scoped Firestore</h3>
                <p className="text-xs text-cream-300/60 leading-relaxed">
                  Strict tenant isolation. Every entry lives under <code className="text-forest-400">/users/&#123;uid&#125;/entries</code> verified by Firestore rules.
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-6 transition-all duration-300 hover:border-sunset-500/40">
                <div className="w-11 h-11 rounded-2xl bg-sunset-500/15 border border-sunset-500/30 flex items-center justify-center text-sunset-400 mb-3.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-cream-100 mb-1.5">Server-Side Gemini AI</h3>
                <p className="text-xs text-cream-300/60 leading-relaxed">
                  Generates psychological sentiment breakdowns and personalized daily writing prompts safely on the backend.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-cream-300/10 bg-[#0c0d10]/90 py-6 text-center text-xs text-cream-300/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MindScribe AI &bull; Google Cloud Run Hackathon App</span>
          <span className="text-[11px] text-cream-300/40 font-mono">
            Node.js 20 &bull; Express &bull; React &bull; Vite &bull; Firebase Auth &bull; Cloud Firestore &bull; Gemini 1.5
          </span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ApiMeTester
        isOpen={testerOpen}
        onClose={() => setTesterOpen(false)}
      />

      <JournalEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        entry={selectedEntry}
        onSave={handleCreateOrUpdateEntry}
        onSaveAndReflect={handleSaveAndReflect}
      />
    </div>
  );
}
