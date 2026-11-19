import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { systemApi } from '../services/api';

export default function Navbar() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await systemApi.getHealth();
        setHealth(data);
      } catch (err) {
        setHealth({ status: 'offline', gemini_configured: false });
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-slate-900 text-base tracking-tight">AI Research Paper Assistant</h1>
            <span className="bg-brand-50 text-brand-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-brand-200">
              RAG Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500">Gemini 2.5 Flash &middot; ChromaDB &middot; LangChain</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* System Health Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          {loading ? (
            <span className="flex items-center text-slate-500">
              <Activity className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-400" />
              Checking API...
            </span>
          ) : health?.status === 'healthy' ? (
            <span className="flex items-center text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              ChromaDB Ready
              {health.gemini_configured ? (
                <span className="ml-1 text-slate-400">| Gemini Connected</span>
              ) : (
                <span className="ml-1 text-amber-600">| No API Key</span>
              )}
            </span>
          ) : (
            <span className="flex items-center text-rose-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              Backend Offline
            </span>
          )}
        </div>

        {/* Model Pill */}
        <div className="flex items-center space-x-1.5 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/60 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-800">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>{health?.chat_model || 'gemini-2.5-flash'}</span>
        </div>
      </div>
    </header>
  );
}
