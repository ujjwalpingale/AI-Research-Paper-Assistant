import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  GitCompare, 
  FileText, 
  ArrowRightLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  AlertTriangle,
  Layers,
  BookOpen
} from 'lucide-react';
import { documentApi, comparisonApi } from '../services/api';

export default function Compare() {
  const [documents, setDocuments] = useState([]);
  const [paper1Id, setPaper1Id] = useState('');
  const [paper2Id, setPaper2Id] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await documentApi.getAll();
        setDocuments(docs);
        if (docs.length >= 2) {
          setPaper1Id(docs[0].id);
          setPaper2Id(docs[1].id);
        } else if (docs.length === 1) {
          setPaper1Id(docs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleCompare = async () => {
    if (!paper1Id || !paper2Id) {
      setError('Please select two research papers to compare.');
      return;
    }
    if (paper1Id === paper2Id) {
      setError('Please select two distinct research papers.');
      return;
    }

    setLoading(true);
    setError(null);
    setComparisonResult(null);

    try {
      const data = await comparisonApi.compare(paper1Id, paper2Id);
      setComparisonResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Comparison failed.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const p1 = documents.find((d) => d.id === paper1Id);
  const p2 = documents.find((d) => d.id === paper2Id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Compare Research Papers</h2>
        <p className="text-xs text-slate-500 mt-1">
          Perform a side-by-side comparative analysis of methodologies, algorithms, benchmark results, and trade-offs.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Paper 1 Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-700">
              <FileText className="w-4 h-4" />
              <span>Paper 1 (Baseline / Approach A)</span>
            </div>
            <select
              value={paper1Id}
              onChange={(e) => setPaper1Id(e.target.value)}
              disabled={docsLoading || loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              <option value="">Select Paper 1</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.filename}
                </option>
              ))}
            </select>
          </div>

          {/* Paper 2 Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-700">
              <FileText className="w-4 h-4" />
              <span>Paper 2 (Proposed / Approach B)</span>
            </div>
            <select
              value={paper2Id}
              onChange={(e) => setPaper2Id(e.target.value)}
              disabled={docsLoading || loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              <option value="">Select Paper 2</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.filename}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCompare}
            disabled={loading || !paper1Id || !paper2Id || paper1Id === paper2Id}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comparing Papers with Gemini...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                <span>Run Comparative Analysis</span>
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

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-800">
            Evaluating Technical Differences & Trade-offs...
          </h4>
          <p className="text-xs text-slate-500">
            Synthesizing objectives, methodologies, algorithms, datasets, and comparative conclusions.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!comparisonResult && !loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <GitCompare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">Select Two Papers to Compare</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose any two uploaded research papers to contrast their methodologies and results.
          </p>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && !loading && (
        <div className="space-y-6">
          {/* Title Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-900 to-indigo-950 text-white shadow-md">
              <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">
                Paper 1
              </span>
              <h3 className="text-base font-bold mt-1 line-clamp-2">
                {comparisonResult.paper_1_title}
              </h3>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white shadow-md">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Paper 2
              </span>
              <h3 className="text-base font-bold mt-1 line-clamp-2">
                {comparisonResult.paper_2_title}
              </h3>
            </div>
          </div>

          {/* Structured Category Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm">
                Category-by-Category Technical Comparison
              </h4>
            </div>

            <div className="divide-y divide-slate-100">
              {comparisonResult.categories.map((cat, idx) => (
                <div key={idx} className="p-6 space-y-3">
                  <h5 className="font-bold text-brand-700 text-xs uppercase tracking-wider">
                    {cat.category}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Paper 1 Details
                      </span>
                      <p className="text-slate-700 leading-relaxed">{cat.paper_1_detail}</p>
                    </div>
                    <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Paper 2 Details
                      </span>
                      <p className="text-slate-700 leading-relaxed">{cat.paper_2_detail}</p>
                    </div>
                  </div>
                  {cat.comparison_analysis && (
                    <div className="bg-brand-50/50 p-3 rounded-xl border border-brand-100/60 text-xs text-brand-900">
                      <span className="font-semibold">Analysis: </span>
                      {cat.comparison_analysis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Similarities & Differences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Similarities */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Key Similarities</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {comparisonResult.similarities.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Differences */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-brand-700 font-bold text-xs uppercase tracking-wider">
                <ArrowRightLeft className="w-4 h-4 text-brand-600" />
                <span>Key Differences</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {comparisonResult.differences.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Advantages & Limitations Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Advantages */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Strengths & Advantages</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Paper 1 Advantages:</p>
                  <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                    {comparisonResult.advantages_paper_1.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-800 mb-1">Paper 2 Advantages:</p>
                  <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                    {comparisonResult.advantages_paper_2.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Limitations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Shortcomings & Limitations</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Paper 1 Limitations:</p>
                  <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                    {comparisonResult.limitations_paper_1.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-800 mb-1">Paper 2 Limitations:</p>
                  <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                    {comparisonResult.limitations_paper_2.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Full Narrative Markdown Report */}
          {comparisonResult.comprehensive_report && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Comprehensive Comparative Synthesis
              </h4>
              <div className="markdown-body pt-2 border-t border-slate-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {comparisonResult.comprehensive_report}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
