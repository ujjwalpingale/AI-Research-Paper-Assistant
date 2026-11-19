import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  Square, 
  Info,
  Loader2,
  Filter
} from 'lucide-react';
import { documentApi, chatApi } from '../services/api';
import ChatMessage from '../components/ChatMessage';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const preselectedPaperId = searchParams.get('paper');

  const [documents, setDocuments] = useState([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Load documents and chat history
  useEffect(() => {
    const init = async () => {
      try {
        const docs = await documentApi.getAll();
        setDocuments(docs);

        // Preselect paper from query params if specified
        if (preselectedPaperId && docs.some((d) => d.id === preselectedPaperId)) {
          setSelectedPaperIds([preselectedPaperId]);
        }

        // Fetch chat history
        const hist = await chatApi.getHistory('default');
        if (hist.messages && hist.messages.length > 0) {
          setMessages(hist.messages);
        } else {
          // Welcome greeting
          setMessages([
            {
              role: 'assistant',
              content: `Hello! I am your **AI Research Paper Assistant**.\n\nYou can ask me detailed questions about any indexed papers, methodologies, empirical results, or comparative findings. Select specific papers in the sidebar to scope retrieval, or leave unselected to query across all uploaded papers.\n\n*All responses are strictly grounded on retrieved document context with verified page citations.*`,
              sources: [],
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, [preselectedPaperId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleSelectPaper = (id) => {
    setSelectedPaperIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPaperIds.length === documents.length) {
      setSelectedPaperIds([]);
    } else {
      setSelectedPaperIds(documents.map((d) => d.id));
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const q = inputQuestion.trim();
    if (!q || loading) return;

    // Append user message immediately
    const userMsg = {
      role: 'user',
      content: q,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const response = await chatApi.ask({
        question: q,
        paper_ids: selectedPaperIds.length > 0 ? selectedPaperIds : null,
        session_id: 'default'
      });

      const aiMsg = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Error communicating with assistant.';
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Error**: ${detail}`,
        sources: [],
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all conversation history?')) {
      try {
        await chatApi.clearHistory('default');
        setMessages([
          {
            role: 'assistant',
            content: 'Conversation history cleared. How can I help you with your research papers today?',
            sources: [],
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Left Drawer / Papers Selector */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-800 text-sm">Target Papers</h3>
            </div>
            {documents.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {selectedPaperIds.length === documents.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {selectedPaperIds.length === 0
              ? 'Searching across all uploaded papers'
              : `Scoped to ${selectedPaperIds.length} selected paper(s)`}
          </p>
        </div>

        {/* Paper Checklist */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1.5">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No papers uploaded yet. Upload a PDF from Dashboard or Library.
            </div>
          ) : (
            documents.map((doc) => {
              const selected = selectedPaperIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelectPaper(doc.id)}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                    selected
                      ? 'border-brand-500 bg-brand-50/50 text-slate-900'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-brand-600">
                    {selected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold truncate">{doc.title || doc.filename}</p>
                    <p className="text-[10px] text-slate-400 truncate">{doc.filename}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear History Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Session: default</span>
          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-rose-600 font-medium py-1 px-2 rounded-lg hover:bg-rose-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
        {/* Chat Header info banner on mobile / tablet */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">RAG Chat Session</span>
            <span>&middot;</span>
            <span className="text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full text-[11px]">
              {selectedPaperIds.length === 0
                ? 'All Documents'
                : `${selectedPaperIds.length} Selected Paper(s)`}
            </span>
          </div>

          <button
            onClick={handleClearHistory}
            className="lg:hidden text-xs text-slate-400 hover:text-rose-600"
          >
            Clear
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {initialLoading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-brand-600" />
              Loading conversation...
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}

              {loading && (
                <div className="flex items-start space-x-3.5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs px-5 py-4 text-xs text-slate-600 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    <span>Searching ChromaDB and synthesizing response with Gemini...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={
                selectedPaperIds.length === 1
                  ? "Ask anything about this paper (e.g. 'What is the core methodology?')..."
                  : "Ask questions across your research library..."
              }
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loading}
              className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Answers are grounded in extracted PDF text chunks and include verified page citations.
          </p>
        </div>
      </div>
    </div>
  );
}
