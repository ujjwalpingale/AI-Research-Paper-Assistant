import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  BookOpen, 
  FileCheck2, 
  GitCompare, 
  UploadCloud,
  FileCode,
  Layers
} from 'lucide-react';
import { documentApi } from '../services/api';

export default function Sidebar() {
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const docs = await documentApi.getAll();
        setDocCount(docs.length);
      } catch (e) {
        // silent
      }
    };
    fetchCount();
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'RAG Chatbot', icon: MessageSquareText },
    { to: '/library', label: 'Paper Library', icon: BookOpen, badge: docCount },
    { to: '/summary', label: 'Summarizer', icon: FileCheck2 },
    { to: '/compare', label: 'Compare Papers', icon: GitCompare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs border border-brand-200/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Help Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-200/80">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 mb-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Strict Grounded RAG</span>
          </div>
          <p className="text-[12px] text-slate-500 leading-normal">
            Responses cite exact PDF filenames & page numbers from verified ChromaDB vectors.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center space-x-2 text-xs text-slate-500 hover:text-brand-600 font-medium py-2 rounded-lg hover:bg-slate-50 transition"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>FastAPI Swagger UI</span>
        </a>
      </div>
    </aside>
  );
}
