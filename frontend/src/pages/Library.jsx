import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  UploadCloud, 
  Plus, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Filter
} from 'lucide-react';
import { documentApi } from '../services/api';
import PaperCard from '../components/PaperCard';
import FileUpload from '../components/FileUpload';

export default function Library() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await documentApi.getAll();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.filename && doc.filename.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Research Paper Library</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your research papers, review vector chunking stats, and inspect indexed documents.
          </p>
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showUpload ? 'Hide Upload' : 'Upload Research Paper'}</span>
        </button>
      </div>

      {/* Upload Component */}
      {showUpload && (
        <FileUpload
          onUploadSuccess={(newDocs) => {
            fetchDocs();
            setShowUpload(false);
          }}
        />
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by title or filename..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          {['all', 'processed', 'error'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                statusFilter === status
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading library papers...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No Research Papers Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No papers match the search term "${searchQuery}".`
              : 'Upload academic PDFs to start querying and summarizing them.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
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
  );
}
