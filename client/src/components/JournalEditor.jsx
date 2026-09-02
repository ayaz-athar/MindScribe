import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Tag, Smile, Compass, Heart, Zap, Frown } from 'lucide-react';

const MOOD_OPTIONS = [
  { label: 'Reflective', icon: Compass, color: 'text-sunset-400 bg-sunset-500/15 border-sunset-500/40 ring-sunset-500/30' },
  { label: 'Grateful', icon: Heart, color: 'text-crimson-400 bg-crimson-500/15 border-crimson-500/40 ring-crimson-500/30' },
  { label: 'Calm', icon: Smile, color: 'text-forest-400 bg-forest-500/15 border-forest-500/40 ring-forest-500/30' },
  { label: 'Energetic', icon: Zap, color: 'text-cream-300 bg-cream-500/15 border-cream-300/40 ring-cream-300/30' },
  { label: 'Anxious', icon: Frown, color: 'text-crimson-300 bg-crimson-900/30 border-crimson-400/30 ring-crimson-400/30' },
  { label: 'Creative', icon: Sparkles, color: 'text-sunset-300 bg-sunset-500/15 border-sunset-300/40 ring-sunset-300/30' },
];

export default function JournalEditor({ isOpen, onClose, entry, onSave, onSaveAndReflect }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood || 'Reflective');
      setTags(entry.tags || []);
    } else {
      setTitle('');
      setContent('');
      setMood('Reflective');
      setTags([]);
    }
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveOnly = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSave({
        id: entry?.id,
        title,
        content,
        mood,
        tags,
      });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndReflectClick = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSaveAndReflect({
        id: entry?.id,
        title,
        content,
        mood,
        tags,
      });
      onClose();
    } catch (err) {
      console.error('Save & Reflect error:', err);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0d10]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#14161c] border border-cream-300/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-300/10">
          <div>
            <h2 className="text-lg font-bold text-cream-100 tracking-tight">
              {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h2>
            <p className="text-xs text-cream-300/60">
              Encrypted and scoped to your private Cloud Firestore collection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-cream-300/60 hover:text-cream-100 hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="space-y-4 my-4 overflow-y-auto pr-1 flex-1">
          
          {/* Title Input */}
          <div>
            <input
              type="text"
              placeholder="Give your entry a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0c0d10] border border-cream-300/10 rounded-2xl px-4 py-3 text-sm font-bold text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:border-sunset-500 transition-all duration-200"
            />
          </div>

          {/* Mood Picker */}
          <div>
            <label className="block text-xs font-semibold text-cream-300/70 mb-2">Emotional Tone / Mood</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MOOD_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = mood === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMood(item.label)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      isSelected
                        ? `${item.color} ring-2 shadow-sm scale-[1.02]`
                        : 'bg-[#0c0d10] border-cream-300/10 text-cream-300/60 hover:text-cream-200 hover:border-cream-300/25'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="relative">
            <textarea
              rows={9}
              placeholder="What's on your mind today? Reflect on your experiences, feelings, challenges, or breakthroughs..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#0c0d10] border border-cream-300/10 rounded-2xl p-4 text-xs sm:text-sm font-serif text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:border-sunset-500 transition-all duration-200 resize-none leading-relaxed"
            />
            <div className="absolute right-3 bottom-3 text-[11px] text-cream-300/50 bg-[#14161c]/90 px-2.5 py-0.5 rounded-lg border border-cream-300/10 font-mono">
              {wordCount} words
            </div>
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-xs font-semibold text-cream-300/70 mb-1.5">Tags</label>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-[#0c0d10] border border-cream-300/10 rounded-2xl">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-sunset-500/15 text-sunset-300 border border-sunset-500/30 text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 font-medium"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-crimson-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag (press Enter)..."
                className="bg-transparent border-none text-xs text-cream-100 placeholder:text-cream-300/40 focus:outline-none flex-1 min-w-[140px] px-2 py-1"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-cream-300/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-cream-300/60 hover:text-cream-100 hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving || !title.trim() || !content.trim()}
              onClick={handleSaveOnly}
              className="px-4 py-2 bg-surface-card hover:bg-surface-hover text-cream-100 border border-cream-300/15 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Entry
            </button>

            <button
              type="button"
              disabled={saving || !title.trim() || !content.trim()}
              onClick={handleSaveAndReflectClick}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-cream-200" />
              Save & Reflect with AI
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
