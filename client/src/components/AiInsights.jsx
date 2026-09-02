import React, { useState } from 'react';
import { Sparkles, Brain, Lightbulb, HelpCircle, Compass, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { apiService } from '../services/api.js';

export default function AiInsights({ activeReflection, onUsePrompt }) {
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const handleGeneratePrompts = async () => {
    setLoadingPrompts(true);
    try {
      const res = await apiService.generateDailyPrompts(
        ['Reflective', 'Creative', 'Growth'],
        ['Mindfulness', 'Personal Breakthroughs', 'Gratitude']
      );
      setPrompts(res.prompts || []);
    } catch (err) {
      console.error('Failed to generate prompts:', err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-crimson-950/40 via-surface-card to-forest-950/40 border border-sunset-500/25 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-sunset-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> Server-Side Gemini AI Cognitive Coach
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-cream-100 tracking-tight">
            Psychological & Emotional Insights
          </h2>
          <p className="text-xs sm:text-sm text-cream-300/70 mt-1 leading-relaxed">
            All AI processing runs strictly inside Google Cloud Run. Your private thoughts and API credentials never leave the secure server perimeter.
          </p>
        </div>
      </div>

      {/* Active Reflection Display */}
      {activeReflection ? (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl transition-all">
          
          <div className="flex items-center justify-between border-b border-cream-300/10 pb-4">
            <h3 className="text-base font-bold text-cream-100 flex items-center gap-2">
              <Brain className="w-5 h-5 text-sunset-400" />
              AI Reflection Breakdown
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-forest-500/15 text-forest-400 border border-forest-500/30 font-semibold">
              Gemini 1.5 Architecture
            </span>
          </div>

          {/* 1. Summary */}
          {activeReflection.summary && (
            <div className="bg-[#0c0d10] p-4 sm:p-5 rounded-2xl border border-cream-300/10">
              <span className="text-[11px] font-bold text-sunset-400 uppercase tracking-wider block mb-1.5">
                Empathetic Summary
              </span>
              <p className="text-xs sm:text-sm text-cream-100 leading-relaxed font-serif">
                {activeReflection.summary}
              </p>
            </div>
          )}

          {/* 2. Sentiment & Key Themes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeReflection.sentimentAnalysis && (
              <div className="bg-[#0c0d10] p-4 sm:p-5 rounded-2xl border border-cream-300/10">
                <span className="text-[11px] font-bold text-crimson-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Emotional Currents
                </span>
                <p className="text-xs sm:text-sm text-cream-200">
                  {activeReflection.sentimentAnalysis}
                </p>
              </div>
            )}

            {activeReflection.keyThemes?.length > 0 && (
              <div className="bg-[#0c0d10] p-4 sm:p-5 rounded-2xl border border-cream-300/10">
                <span className="text-[11px] font-bold text-forest-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Recurring Themes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeReflection.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="text-xs bg-surface-card border border-cream-300/15 text-cream-200 px-2.5 py-1 rounded-xl font-medium"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Growth Insight */}
          {activeReflection.growthInsight && (
            <div className="bg-gradient-to-r from-forest-950/30 to-surface-card border border-forest-500/30 p-5 rounded-2xl flex items-start gap-3.5">
              <Lightbulb className="w-5 h-5 text-forest-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-forest-400 uppercase tracking-wider block mb-1">
                  Constructive Growth Insight
                </span>
                <p className="text-xs sm:text-sm text-cream-100 leading-relaxed font-sans font-medium">
                  {activeReflection.growthInsight}
                </p>
              </div>
            </div>
          )}

          {/* 4. Deep Questions for Tomorrow */}
          {activeReflection.deepQuestions?.length > 0 && (
            <div className="bg-[#0c0d10] p-5 rounded-2xl border border-cream-300/10">
              <span className="text-[11px] font-bold text-cream-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sunset-400" /> Inquiring Questions for Further Reflection
              </span>
              <ul className="space-y-2.5">
                {activeReflection.deepQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-cream-200 font-serif">
                    <span className="text-sunset-400 font-bold font-sans">0{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      ) : (
        <div className="p-10 glass-panel rounded-3xl text-center">
          <Brain className="w-12 h-12 text-cream-300/30 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-cream-100">No Reflection Selected</h4>
          <p className="text-xs text-cream-300/60 max-w-md mx-auto mt-1">
            Write or open a journal entry from the My Journal tab and click the ✨ AI Reflect button to analyze emotional patterns and growth opportunities.
          </p>
        </div>
      )}

      {/* Daily Prompt Generator */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-cream-100 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-cream-300" />
              Personalized Journal Prompts
            </h3>
            <p className="text-xs text-cream-300/60">
              Spark creative and introspective thought with AI-crafted prompts.
            </p>
          </div>
          <button
            onClick={handleGeneratePrompts}
            disabled={loadingPrompts}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-hover text-cream-200 border border-cream-300/15 hover:border-sunset-500/40 text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sunset-400 ${loadingPrompts ? 'animate-spin' : ''}`} />
            Generate Prompts
          </button>
        </div>

        {prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
            {prompts.map((p, idx) => (
              <div
                key={idx}
                onClick={() => onUsePrompt(p)}
                className="group p-5 bg-[#0c0d10] border border-cream-300/10 hover:border-sunset-500/50 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-glow-sunset"
              >
                <div>
                  <span className="text-[10px] font-bold text-sunset-400 bg-sunset-500/15 px-2.5 py-0.5 rounded-md border border-sunset-500/30">
                    {p.category || 'Mindfulness'}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-cream-100 mt-2.5 group-hover:text-sunset-400 transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-xs text-cream-300/70 font-serif mt-1.5 line-clamp-2 leading-relaxed">
                    {p.prompt}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-sunset-400 font-semibold mt-3.5">
                  <span>Write on this</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-cream-300/15 rounded-2xl">
            <p className="text-xs text-cream-300/60">
              Click &quot;Generate Prompts&quot; to fetch AI-crafted journaling ideas tailored to your mindset.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
