import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { documentApi } from '../services/api';

export default function FileUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    setErrorMessage(null);
    setStatusMessage(null);
    const validPdfs = [];
    const invalid = [];

    Array.from(files).forEach((f) => {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        if (f.size > 30 * 1024 * 1024) {
          invalid.push(`${f.name} exceeds 30MB limit.`);
        } else {
          validPdfs.push(f);
        }
      } else {
        invalid.push(`${f.name} is not a PDF.`);
      }
    });

    if (invalid.length > 0) {
      setErrorMessage(invalid.join(' '));
    }

    if (validPdfs.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validPdfs]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(10);
    setStatusMessage('Uploading and extracting text using PyMuPDF...');
    setErrorMessage(null);

    try {
      const res = await documentApi.upload(selectedFiles, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 80) / progressEvent.total);
        setUploadProgress(percent);
      });

      setUploadProgress(100);
      setStatusMessage(res.message || 'Indexed successfully into ChromaDB!');
      setSelectedFiles([]);

      if (onUploadSuccess) {
        onUploadSuccess(res.documents);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Upload and indexing failed.';
      setErrorMessage(detail);
      setStatusMessage(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">Upload Research Papers</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload academic PDFs for text chunking, Gemini vector embeddings, and persistent ChromaDB storage.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-brand-500 bg-brand-50/50'
            : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Click to select or drag and drop PDFs here
            </p>
            <p className="text-xs text-slate-400 mt-1">Accepts PDF files up to 30MB each</p>
          </div>
        </div>
      </div>

      {/* Selected File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Selected Papers ({selectedFiles.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <File className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{file.name}</span>
                  <span className="text-slate-400 shrink-0">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & Embedding...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Process & Index {selectedFiles.length} Paper(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>{statusMessage}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success banner */}
      {statusMessage && !uploading && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
