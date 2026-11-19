import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, BookOpen, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full space-x-3.5 py-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white shadow-xs rounded-tr-xs'
              : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations & Controls for AI Message */}
        {!isUser && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              {message.sources && message.sources.length > 0 ? (
                <button
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="flex items-center space-x-1.5 text-brand-600 hover:text-brand-700 font-medium py-1 px-2 rounded-lg bg-brand-50 border border-brand-200/60 hover:bg-brand-100/50 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {message.sources.length} Grounded Source Citation{message.sources.length > 1 ? 's' : ''}
                  </span>
                  {sourcesOpen ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Direct query response</span>
              )}

              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 text-slate-400 hover:text-slate-600 transition p-1"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Citations List Accordion */}
            {sourcesOpen && message.sources && message.sources.length > 0 && (
              <div className="space-y-2 pt-1 pl-1">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-800 truncate">
                        <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] shrink-0 font-bold">
                          {idx + 1}
                        </span>
                        <span className="truncate">{src.filename}</span>
                      </div>
                      <span className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-medium shrink-0">
                        Page {src.page_number}
                      </span>
                    </div>

                    <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 line-clamp-3 text-[11px]">
                      "{src.snippet}"
                    </p>

                    {src.score && (
                      <div className="flex justify-end text-[10px] text-slate-400">
                        Relevance Confidence: {(src.score * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
