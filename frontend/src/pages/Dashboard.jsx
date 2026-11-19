import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  Sparkles, 
  GitCompare, 
  UploadCloud, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { documentApi } from '../services/api';
import PaperCard from '../components/PaperCard';
import FileUpload from '../components/FileUpload';

export default function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await documentApi.getAll();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const totalPages = documents.reduce((acc, d) => acc + (d.total_pages || 0), 0);
  const totalChunks = documents.reduce((acc, d) => acc + (d.total_chunks || 0), 0);
  const processedDocs = documents.filter((d) => d.status === 'processed').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-brand-500/20 border border-brand-400/30 px-3 py-1 rounded-full text-xs text-brand-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>AI-Powered Academic Research Assistant</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Accelerate Your Scientific Literature Review
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Upload complex research papers, extract insights, run multi-document Q&A with strict RAG grounding, generate 10-point structured summaries, and compare methodologies side-by-side.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{showUpload ? 'Close Upload' : 'Upload Research Paper'}</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition backdrop-blur-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Launch RAG Chat</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Upload Drawer / Section */}
      {showUpload && (
        <div className="transition-all">
          <FileUpload
            onUploadSuccess={(newDocs) => {
              fetchDocs();
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Papers
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{documents.length}</p>
          <p className="text-xs text-slate-400 mt-1">Uploaded to workspace</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Indexed Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{processedDocs}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Ready for RAG Q&A</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pages Parsed
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalPages}</p>
          <p className="text-xs text-slate-400 mt-1">PyMuPDF page-by-page</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vector Chunks
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalChunks}</p>
          <p className="text-xs text-slate-400 mt-1">In ChromaDB collection</p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/chat')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex items-start space-x-4"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition">
                RAG Chat Assistant
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Query papers with conversational context and exact page citations.
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/summary')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex items-start space-x-4"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-purple-600 transition">
                10-Point Summarizer
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Extract objectives, algorithms, dataset details, findings, and limits.
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/compare')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex items-start space-x-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition">
                Paper Comparator
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Compare 2 research papers across methodologies, metrics, and trade-offs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Uploaded Research Papers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Recently Uploaded Papers</h3>
          {documents.length > 0 && (
            <button
              onClick={() => navigate('/library')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
            >
              <span>View all ({documents.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No Research Papers Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by uploading your first PDF document to build your vector library.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.slice(0, 6).map((doc) => (
              <PaperCard
                key={doc.id}
                paper={doc}
                onDelete={(deletedId) => {
                  setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
