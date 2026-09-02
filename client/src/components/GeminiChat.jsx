import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Copy, Check, PlusCircle, Trash2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const PROMPT_STARTERS = [
  { label: 'Structure Thoughts', prompt: 'I have a lot of racing thoughts today. Can you help me organize them into a structured journal entry with themes?' },
  { label: 'Gratitude Reflection', prompt: 'Guide me through a 3-question deep gratitude reflection to shift my perspective.' },
  { label: 'Unpack Anxiety', prompt: 'I am feeling overwhelmed by work and deadlines. Ask me 2 insightful questions to help me break this down.' },
  { label: 'Breakthrough & Growth', prompt: 'Help me reflect on a recent mistake and turn it into an actionable personal growth lesson.' },
];

export default function GeminiChat({ onInsertIntoJournal }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'there'}! I'm your private MindScribe AI assistant running securely on Google Cloud Run.\n\nHow can I help you explore your thoughts or craft a journal entry today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend || textToSend.trim() === '' || loading) return;

    setError(null);
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      // Build history for multi-turn context
      const historyForApi = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
        }));

      // Call POST /api/gemini
      const response = await apiService.sendGeminiPrompt({
        prompt: userMessage.text,
        history: historyForApi,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to communicate with Gemini assistant on Cloud Run.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Chat history cleared. What would you like to explore next?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[78vh] glass-panel rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300/10 bg-[#14161c]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sunset-500 to-crimson-500 flex items-center justify-center text-white shadow-lg shadow-sunset-500/25 ring-1 ring-cream-300/20">
            <Sparkles className="w-5 h-5 text-cream-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-cream-100 tracking-tight">Gemini Journal Assistant</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sunset-500/15 text-sunset-400 border border-sunset-500/30">
                POST /api/gemini
              </span>
            </div>
            <p className="text-[11px] text-cream-300/60 flex items-center gap-1 mt-0.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
              Secured with Firebase ID Token & Secret Manager
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear chat history"
          className="p-2 rounded-xl text-cream-300/60 hover:text-cream-100 hover:bg-surface-hover transition-colors text-xs flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'} animate-fade-in`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                  isUser
                    ? 'bg-surface-card border border-cream-300/15 text-cream-200'
                    : 'bg-sunset-500/15 border border-sunset-500/30 text-sunset-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5 max-w-[85%] sm:max-w-[78%]">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-gradient-to-r from-sunset-500 to-crimson-500 text-white rounded-tr-none shadow-lg shadow-sunset-500/20 font-sans font-medium'
                      : 'bg-[#0c0d10] border border-cream-300/10 text-cream-100 rounded-tl-none font-serif shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Bubble Footer Actions */}
                <div className={`flex items-center gap-2 px-1 text-[10px] text-cream-300/50 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <>
                      <span>&bull;</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:text-sunset-400 flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-forest-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onInsertIntoJournal && (
                        <>
                          <span>&bull;</span>
                          <button
                            onClick={() => onInsertIntoJournal(msg.text)}
                            className="hover:text-cream-200 flex items-center gap-1 text-sunset-400 font-semibold transition-colors"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Insert to Journal</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-sunset-500/15 border border-sunset-500/30 text-sunset-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0c0d10] border border-cream-300/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-cream-300/70 font-sans">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sunset-400" />
              <span>Gemini is reflecting...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-crimson-950/40 border border-crimson-500/30 text-crimson-200 text-xs flex items-start gap-2.5 max-w-xl mx-auto shadow-lg animate-fade-in">
            <AlertCircle className="w-4 h-4 text-crimson-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-crimson-300">AI Assistant Notice</p>
              <p className="text-[11px] text-cream-300/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Starters */}
      {messages.length <= 2 && (
        <div className="px-6 py-2.5 bg-[#0c0d10]/60 border-t border-cream-300/10 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cream-300/50 font-bold uppercase tracking-wider whitespace-nowrap">
              Suggestions:
            </span>
            {PROMPT_STARTERS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.prompt)}
                disabled={loading}
                className="text-[11px] bg-surface-card hover:bg-surface-hover text-cream-200 hover:text-sunset-400 border border-cream-300/10 hover:border-sunset-500/40 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-[#14161c]/90 border-t border-cream-300/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            maxLength={4000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your journaling assistant anything, reflect on today, or brainstorm thoughts..."
            className="flex-1 bg-[#0c0d10] border border-cream-300/10 rounded-2xl pl-4 pr-20 py-3 text-xs sm:text-sm text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:border-sunset-500 transition-all duration-200"
          />

          <div className="absolute right-3 flex items-center gap-2">
            <span className="text-[10px] text-cream-300/40 font-mono hidden sm:inline">
              {input.length}/4000
            </span>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary p-2.5 rounded-xl shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
