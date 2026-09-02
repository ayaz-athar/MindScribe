import React from 'react';
import { BookOpen, ShieldCheck, User, LogOut, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onOpenAuth, onOpenTester, onNewEntry, activeTab, setActiveTab }) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="border-b border-cream-300/10 bg-[#0c0d10]/85 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-crimson-500 via-sunset-500 to-forest-500 flex items-center justify-center shadow-lg shadow-sunset-500/20 ring-1 ring-cream-300/20 transition-transform duration-300 hover:scale-105">
            <BookOpen className="w-5 h-5 text-cream-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-cream-100 tracking-tight font-sans">MindScribe</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sunset-500/15 text-sunset-400 border border-sunset-500/30 uppercase tracking-wider">
                Cloud Run
              </span>
            </div>
            <p className="text-[11px] text-cream-300/60 font-medium">Intelligent Private Journal</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1.5 bg-[#14161c]/90 p-1.5 rounded-2xl border border-cream-300/10 shadow-inner">
            <button
              onClick={() => setActiveTab('entries')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'entries'
                  ? 'bg-gradient-to-r from-sunset-500 to-crimson-500 text-white shadow-md shadow-sunset-500/25 scale-[1.02]'
                  : 'text-cream-300/70 hover:text-cream-100 hover:bg-surface-hover'
              }`}
            >
              My Journal
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-sunset-500 to-crimson-500 text-white shadow-md shadow-sunset-500/25 scale-[1.02]'
                  : 'text-cream-300/70 hover:text-cream-100 hover:bg-surface-hover'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cream-300" />
              Gemini Assistant
            </button>
            <button
              onClick={() => setActiveTab('ai-coach')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'ai-coach'
                  ? 'bg-gradient-to-r from-sunset-500 to-crimson-500 text-white shadow-md shadow-sunset-500/25 scale-[1.02]'
                  : 'text-cream-300/70 hover:text-cream-100 hover:bg-surface-hover'
              }`}
            >
              AI Insights
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-sunset-500 to-crimson-500 text-white shadow-md shadow-sunset-500/25 scale-[1.02]'
                  : 'text-cream-300/70 hover:text-cream-100 hover:bg-surface-hover'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
              Security Audit
            </button>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* /api/me Test Trigger */}
              <button
                onClick={onOpenTester}
                title="Test /api/me ID Token verification route"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-hover text-cream-200 border border-cream-300/10 hover:border-sunset-500/40 shadow-sm transition-all duration-200"
              >
                <KeyRound className="w-3.5 h-3.5 text-cream-300" />
                <span className="hidden sm:inline">Verify</span> /api/me
              </button>

              {/* New Entry Button */}
              <button
                onClick={onNewEntry}
                className="btn-primary flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <span>+ New Entry</span>
              </button>

              {/* User Profile & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-cream-300/10">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-sunset-500/30 ring-1 ring-cream-300/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-card border border-cream-300/15 flex items-center justify-center text-cream-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-cream-100 leading-tight truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-forest-400 font-medium">Authenticated</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-cream-300/60 hover:text-crimson-400 hover:bg-crimson-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              <User className="w-4 h-4" />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
