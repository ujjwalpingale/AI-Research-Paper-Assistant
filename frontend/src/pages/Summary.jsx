import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  FileText, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Loader2, 
  Target, 
  AlertTriangle, 
  Cpu, 
  Database, 
  BarChart3, 
  Layers, 
  Compass, 
  Flag 
} from 'lucide-react';
import { documentApi, summaryApi } from '../services/api';

export default function Summary() {
  const [searchParams] = useSearchParams();
  const preselectedPaperId = searchParams.get('paper');

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await documentApi.getAll();
        setDocuments(docs);
        if (preselectedPaperId && docs.some((d) => d.id === preselectedPaperId)) {
          setSelectedDocId(preselectedPaperId);
        } else if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, [preselectedPaperId]);

  // When selectedDocId changes, check if summary already exists
  useEffect(() => {
    if (!selectedDocId) return;
    const doc = documents.find((d) => d.id === selectedDocId);
    if (doc?.summary) {
      setSummaryData(doc.summary);
      setError(null);
    } else {
      setSummaryData(null);
    }
  }, [selectedDocId, documents]);

  const handleGenerateSummary = async (force = false) => {
    if (!selectedDocId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await summaryApi.getOrGenerate(selectedDocId, force);
      setSummaryData(res.summary);
      // Update local document state with new summary
      setDocuments((prev) =>
        prev.map((d) => (d.id === selectedDocId ? { ...d, summary: res.summary } : d))
      );
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to generate summary.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const copyMarkdown = () => {
    if (!summaryData) return;
    const md = summaryData.raw_markdown || JSON.stringify(summaryData, null, 2);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!summaryData) return;
    const doc = documents.find((d) => d.id === selectedDocId);
    const filename = `${doc?.filename || 'paper'}_summary.md`;
    const md = summaryData.raw_markdown || JSON.stringify(summaryData, null, 2);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const sections = summaryData ? [
    { title: '1. Research Objectives', icon: Target, content: summaryData.objectives, color: 'text-blue-600 bg-blue-50' },
    { title: '2. Problem Statement', icon: AlertTriangle, content: summaryData.problem_statement, color: 'text-amber-600 bg-amber-50' },
    { title: '3. Methodology & Architecture', icon: Layers, content: summaryData.methodology, color: 'text-indigo-600 bg-indigo-50' },
    { title: '4. Algorithms & Technologies', icon: Cpu, content: summaryData.algorithms_and_technologies, color: 'text-purple-600 bg-purple-50' },
    { title: '5. Dataset Information', icon: Database, content: summaryData.dataset_information, color: 'text-emerald-600 bg-emerald-50' },
    { title: '6. Key Findings', icon: Sparkles, content: summaryData.key_findings, color: 'text-sky-600 bg-sky-50' },
    { title: '7. Results & Benchmarks', icon: BarChart3, content: summaryData.results, color: 'text-violet-600 bg-violet-50' },
    { title: '8. Limitations', icon: Flag, content: summaryData.limitations, color: 'text-rose-600 bg-rose-50' },
    { title: '9. Future Scope', icon: Compass, content: summaryData.future_scope, color: 'text-teal-600 bg-teal-50' },
  ] : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Research Paper Summarizer</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate an exhaustive 10-point structured analysis formatted for academic review.
          </p>
        </div>

        {summaryData && (
          <div className="flex items-center space-x-2">
            <button
              onClick={copyMarkdown}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>
            <button
              onClick={downloadMarkdown}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Paper Selector Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3 flex items-center space-x-3">
          <FileText className="w-5 h-5 text-brand-600 shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Select Research Paper
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={docsLoading || loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              {documents.length === 0 ? (
                <option value="">No papers available</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title || doc.filename} ({doc.total_pages} pages)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="w-full md:w-auto flex items-center justify-end space-x-2">
          {summaryData && (
            <button
              onClick={() => handleGenerateSummary(true)}
              disabled={loading || !selectedDocId}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}

          <button
            onClick={() => handleGenerateSummary(false)}
            disabled={loading || !selectedDocId}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Paper with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{summaryData ? 'View Summary' : 'Generate Summary'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Generating Structured 10-Point Summary...
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Extracting core objectives, algorithms, dataset metrics, findings, and future scope.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!summaryData && !loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">Ready to Analyze</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose a research paper above and click "Generate Summary" to extract structured academic insights.
          </p>
        </div>
      )}

      {/* Structured Summary Output */}
      {summaryData && !loading && (
        <div className="space-y-4">
          {/* Paper Title Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
            <span className="text-[10px] font-bold tracking-wider uppercase text-brand-300 bg-brand-500/20 px-2.5 py-1 rounded-full border border-brand-400/20">
              Academic Paper Analysis
            </span>
            <h3 className="text-xl font-bold mt-2 leading-snug">
              {summaryData.title || selectedDoc?.title || selectedDoc?.filename}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Source: {selectedDoc?.filename} &middot; {selectedDoc?.total_pages} Pages
            </p>
          </div>

          {/* 9 Structured Section Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 ${
                    idx === 2 || idx === 6 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sec.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs tracking-tight">
                      {sec.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-9">
                    {sec.content || 'Not explicitly mentioned in the paper.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
