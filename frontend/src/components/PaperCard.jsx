import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  ExternalLink, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { documentApi } from '../services/api';

export default function PaperCard({ 
  paper, 
  onDelete, 
  isSelected = false, 
  onSelect, 
  selectable = false 
}) {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${paper.filename}" and its vector embeddings?`)) {
      try {
        await documentApi.delete(paper.id);
        if (onDelete) onDelete(paper.id);
      } catch (err) {
        alert('Failed to delete document: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleOpenPdf = (e) => {
    e.stopPropagation();
    window.open(documentApi.getFileUrl(paper.id), '_blank');
  };

  const formattedDate = paper.upload_date 
    ? new Date(paper.upload_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Unknown date';

  return (
    <div
      onClick={() => selectable && onSelect && onSelect(paper.id)}
      className={`group bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs flex flex-col justify-between ${
        selectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-brand-600 transition" title={paper.title || paper.filename}>
                {paper.title || paper.filename}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-0.5" title={paper.filename}>
                {paper.filename}
              </p>
            </div>
          </div>

          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect && onSelect(paper.id)}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer mt-1"
            />
          )}
        </div>

        {/* Paper Stats */}
        <div className="grid grid-cols-2 gap-2 my-3 py-2 px-3 bg-slate-50/80 rounded-xl border border-slate-100 text-[11px] text-slate-600">
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{paper.total_pages} Pages</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-brand-600 font-semibold">{paper.total_chunks}</span>
            <span>Vector Chunks</span>
          </div>
        </div>

        {/* Status & Date */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
          {paper.status === 'processed' ? (
            <span className="flex items-center text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Indexed
            </span>
          ) : (
            <span className="flex items-center text-rose-500 font-medium">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/chat?paper=${paper.id}`);
          }}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-brand-600 hover:bg-brand-50 font-medium transition"
          title="Chat with this paper"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/summary?paper=${paper.id}`);
          }}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-brand-600 hover:bg-brand-50 font-medium transition"
          title="Generate 10-point summary"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>

        <button
          onClick={handleOpenPdf}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="Open original PDF"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          title="Delete document and embeddings"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
