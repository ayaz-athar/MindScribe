import React, { useState } from 'react';
import { Search, Calendar, Tag, Trash2, Edit3, Sparkles, Smile, Frown, Compass, Heart, Zap, Clock } from 'lucide-react';

const MOOD_ICONS = {
  Reflective: { icon: Compass, color: 'text-sunset-400 bg-sunset-500/10 border-sunset-500/25' },
  Grateful: { icon: Heart, color: 'text-crimson-400 bg-crimson-500/10 border-crimson-500/25' },
  Calm: { icon: Smile, color: 'text-forest-400 bg-forest-500/10 border-forest-500/25' },
  Energetic: { icon: Zap, color: 'text-cream-300 bg-cream-500/10 border-cream-300/25' },
  Anxious: { icon: Frown, color: 'text-crimson-300 bg-crimson-900/30 border-crimson-400/20' },
  Creative: { icon: Sparkles, color: 'text-sunset-300 bg-sunset-500/10 border-sunset-300/30' },
};

export default function JournalList({
  entries,
  loading,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  onReflectEntry,
  onNewEntry,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('All');

  const moods = ['All', 'Reflective', 'Grateful', 'Calm', 'Energetic', 'Anxious', 'Creative'];

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMood = selectedMood === 'All' || entry.mood === selectedMood;

    return matchesSearch && matchesMood;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cream-300/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search entries, keywords, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0d10] border border-cream-300/10 rounded-xl pl-9 pr-3 py-2 text-xs text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:border-sunset-500 transition-all duration-200"
          />
        </div>

        {/* Mood Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMood(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedMood === m
                  ? 'bg-sunset-500 text-white shadow-md shadow-sunset-500/30 scale-105'
                  : 'bg-[#0c0d10] text-cream-300/70 hover:text-cream-100 border border-cream-300/10 hover:border-cream-300/25'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Entries Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-cream-300/60 font-medium">
            <span className="w-3.5 h-3.5 border-2 border-sunset-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading your private journal entries...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-surface-card/60 border border-cream-300/10 p-5 flex flex-col justify-between animate-pulse">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 w-20 bg-cream-300/10 rounded-full" />
                    <div className="h-3 w-16 bg-cream-300/10 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-cream-300/15 rounded mb-2.5" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-cream-300/10 rounded" />
                    <div className="h-3 w-5/6 bg-cream-300/10 rounded" />
                  </div>
                </div>
                <div className="pt-3 border-t border-cream-300/10 flex items-center justify-between">
                  <div className="h-4 w-16 bg-cream-300/10 rounded-lg" />
                  <div className="h-5 w-16 bg-cream-300/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 glass-panel border-dashed border-cream-300/15 rounded-2xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-sunset-500/20 to-crimson-500/20 border border-sunset-500/30 flex items-center justify-center text-sunset-400 mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-cream-100">No journal entries found</h3>
          <p className="text-xs text-cream-300/60 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || selectedMood !== 'All'
              ? 'Try changing your search query or mood filter.'
              : 'Write your first thoughts today. All entries are encrypted and scoped to your user ID.'}
          </p>
          <button
            onClick={onNewEntry}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold"
          >
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const moodConfig = MOOD_ICONS[entry.mood] || MOOD_ICONS.Reflective;
            const MoodIcon = moodConfig.icon;

            return (
              <div
                key={entry.id}
                className="group relative glass-card rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Mood & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${moodConfig.color}`}
                    >
                      <MoodIcon className="w-3.5 h-3.5" />
                      {entry.mood}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-cream-300/50">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  {/* Title & Preview */}
                  <h3
                    onClick={() => onSelectEntry(entry)}
                    className="text-base font-bold text-cream-100 group-hover:text-sunset-400 cursor-pointer transition-colors duration-200 mb-2 line-clamp-1"
                  >
                    {entry.title}
                  </h3>

                  <p
                    onClick={() => onSelectEntry(entry)}
                    className="text-xs text-cream-300/80 font-serif leading-relaxed line-clamp-3 cursor-pointer mb-4"
                  >
                    {entry.content}
                  </p>
                </div>

                {/* Card Footer: Tags & Actions */}
                <div className="pt-3 border-t border-cream-300/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.tags?.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] text-cream-300/80 bg-[#0c0d10] px-2.5 py-0.5 rounded-lg border border-cream-300/10 flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-sunset-400" />
                        {tag}
                      </span>
                    ))}
                    {entry.tags?.length > 3 && (
                      <span className="text-[10px] text-cream-300/50">+{entry.tags.length - 3}</span>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onReflectEntry(entry)}
                      title="Generate Server-Side Gemini AI Reflection"
                      className="p-1.5 rounded-lg text-sunset-400 hover:bg-sunset-500/15 transition-all duration-200 hover:scale-110"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditEntry(entry)}
                      title="Edit Entry"
                      className="p-1.5 rounded-lg text-cream-300/60 hover:text-cream-100 hover:bg-surface-hover transition-all duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      title="Delete Entry"
                      className="p-1.5 rounded-lg text-cream-300/60 hover:text-crimson-400 hover:bg-crimson-950/30 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
