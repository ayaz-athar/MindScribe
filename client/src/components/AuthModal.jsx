import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ isOpen, onClose }) {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginAsDemoUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const formatFirebaseError = (err) => {
    const code = err.code || err.message || '';
    if (code.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Click "Sign In" below.';
    }
    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
      return 'Incorrect email or password. If you are new, click "Create one" below.';
    }
    if (code.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before completing. Try again or use email.';
    }
    if (code.includes('auth/unauthorized-domain')) {
      return 'Domain localhost is not added in Firebase Console > Authentication > Settings > Authorized domains.';
    }
    if (code.includes('auth/configuration-not-found')) {
      return 'Authentication is still propagating in Firebase. Click Instant Dev Sign In or wait 10 seconds.';
    }
    return err.message || 'Authentication failed. Please check your credentials.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      console.error('Auth submit error:', err);
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = () => {
    loginAsDemoUser(email || 'ayaz.athar.44@gmail.com', (email || 'ayaz.athar.44@gmail.com').split('@')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0d10]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#14161c] border border-cream-300/15 rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-cream-300/60 hover:text-cream-100 hover:bg-surface-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-cream-100 tracking-tight">
            {isSignUp ? 'Create your Account' : 'Welcome to MindScribe'}
          </h2>
          <p className="text-xs text-cream-300/60 mt-1">
            {isSignUp
              ? 'Enter your email and password to create your private journal'
              : 'Sign in to access your private encrypted journal entries'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-crimson-950/40 border border-crimson-500/30 text-crimson-200 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-crimson-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold leading-relaxed">{error}</span>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleInstantDemo}
                  className="text-[11px] text-sunset-400 hover:underline font-bold"
                >
                  ⚡ Or click here for 1-Click Instant Sign In &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1-Click Quick Demo Button */}
        <button
          onClick={handleInstantDemo}
          type="button"
          className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-forest-600/30 to-sunset-600/20 hover:from-forest-600/40 hover:to-sunset-600/30 text-cream-100 border border-forest-500/40 rounded-2xl text-xs font-bold transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cream-300" />
          <span>⚡ Instant Dev Sign In (1-Click)</span>
        </button>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-surface-card hover:bg-surface-hover border border-cream-300/10 hover:border-sunset-500/40 rounded-2xl text-xs font-semibold text-cream-100 transition-all disabled:opacity-50 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.2.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-cream-300/10 w-full"></div>
          <span className="bg-[#14161c] px-3 text-[10px] text-cream-300/40 uppercase tracking-widest font-bold absolute">
            Or with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-cream-300/70 mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-cream-300/40 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0c0d10] border border-cream-300/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:border-sunset-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300/70 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-cream-300/40 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0c0d10] border border-cream-300/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:border-sunset-500 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 btn-primary flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold shadow-md disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In & Sign Up */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-cream-300/60 hover:text-sunset-400 transition-colors font-medium"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
