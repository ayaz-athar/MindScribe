import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw, KeyRound, ShieldCheck, Copy, Check } from 'lucide-react';
import { apiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

export default function ApiMeTester({ isOpen, onClose }) {
  const { idToken, getToken } = useAuth();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unauthTestResponse, setUnauthTestResponse] = useState(null);
  const [unauthLoading, setUnauthLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestAuthorized = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMe();
      setResponse(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestUnauthorized = async () => {
    setUnauthLoading(true);
    setUnauthTestResponse(null);
    try {
      const res = await axios.get('/api/me');
      setUnauthTestResponse({ status: res.status, data: res.data });
    } catch (err) {
      setUnauthTestResponse({
        status: err.response?.status || 401,
        statusText: err.response?.statusText || 'Unauthorized',
        data: err.response?.data || { error: 'Request was blocked' },
      });
    } finally {
      setUnauthLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (idToken) {
      navigator.clipboard.writeText(idToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0d10]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#14161c] border border-cream-300/15 rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-cream-300/60 hover:text-cream-100 hover:bg-surface-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-sunset-500/15 border border-sunset-500/30 flex items-center justify-center text-sunset-400 shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-cream-100 tracking-tight flex items-center gap-2">
              Authentication Pipeline Tester <code className="text-xs text-sunset-400 font-mono">/api/me</code>
            </h2>
            <p className="text-xs text-cream-300/60">
              Verify end-to-end Firebase ID token extraction, signature verification, and <code className="text-cream-200">req.user.uid</code> attachment.
            </p>
          </div>
        </div>

        {/* Current Token Inspector */}
        <div className="mb-6 p-4 rounded-2xl bg-[#0c0d10] border border-cream-300/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cream-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-forest-400" /> Active Client Bearer Token
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => getToken(true)}
                className="text-[11px] text-cream-300/60 hover:text-cream-100 flex items-center gap-1 transition-colors"
                title="Force refresh token"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
              <button
                onClick={handleCopyToken}
                className="text-[11px] text-cream-300/60 hover:text-sunset-400 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-forest-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="font-mono text-[11px] text-cream-300/70 break-all bg-surface-card p-3 rounded-xl border border-cream-300/10 max-h-20 overflow-y-auto">
            {idToken ? idToken : 'No token active. Please sign in.'}
          </div>
        </div>

        {/* Test 1: Authorized Request */}
        <div className="mb-5 p-5 rounded-2xl bg-[#0c0d10]/60 border border-cream-300/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-cream-100">Test 1: Authenticated GET /api/me</h3>
              <p className="text-[11px] text-cream-300/60">Sends Bearer token in Authorization header to Cloud Run backend</p>
            </div>
            <button
              onClick={handleTestAuthorized}
              disabled={loading || !idToken}
              className="btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Run Test'}
            </button>
          </div>

          {response && (
            <div className="mt-3 p-3.5 rounded-xl bg-forest-500/10 border border-forest-500/30">
              <div className="flex items-center gap-2 mb-2 text-forest-400 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                Backend verified token & returned authenticated UID:
              </div>
              <div className="bg-[#14161c] p-3 rounded-lg border border-cream-300/10 font-mono text-[11px] text-cream-200 max-h-48 overflow-y-auto">
                <pre>{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3.5 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-crimson-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-crimson-300">Backend Rejection / Network Error:</p>
                <pre className="mt-1 font-mono text-[11px] text-crimson-200">{JSON.stringify(error, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Test 2: Unauthorized Request Protection Check */}
        <div className="p-5 rounded-2xl bg-[#0c0d10]/60 border border-cream-300/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-cream-100">Test 2: Security Gatekeeper (No Token)</h3>
              <p className="text-[11px] text-cream-300/60">Sends request WITHOUT Authorization header to verify 401 Unauthorized rejection</p>
            </div>
            <button
              onClick={handleTestUnauthorized}
              disabled={unauthLoading}
              className="px-3.5 py-1.5 bg-surface-card hover:bg-surface-hover text-cream-200 border border-cream-300/15 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5"
            >
              {unauthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Test 401 Reject'}
            </button>
          </div>

          {unauthTestResponse && (
            <div className="mt-3 p-3.5 rounded-xl bg-crimson-500/10 border border-crimson-500/30">
              <div className="flex items-center gap-2 mb-2 text-crimson-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-crimson-400" />
                Backend correctly blocked unauthenticated request (HTTP {unauthTestResponse.status}):
              </div>
              <div className="bg-[#14161c] p-3 rounded-lg border border-cream-300/10 font-mono text-[11px] text-cream-200 max-h-36 overflow-y-auto">
                <pre>{JSON.stringify(unauthTestResponse.data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
