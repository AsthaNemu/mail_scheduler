"use client";

import React, { useState, useRef } from "react";
import { parseLeadFileContent, ParseResult } from "@/lib/csvParser";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FileUploaderProps {
  onRecipientsChange: (recipients: string[]) => void;
  error?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onRecipientsChange,
  error,
  className,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        const result = parseLeadFileContent(text);
        setParseResult(result);
        onRecipientsChange(result.validEmails);
      }
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFileName(null);
    setParseResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRecipientsChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        Lead File (CSV or TXT) <span className="text-rose-500">*</span>
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        onChange={handleFileChange}
        className="hidden"
        id="lead-file-upload"
      />

      {!fileName ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center",
            isDragging
              ? "border-brand-500 bg-brand-50/50 scale-[1.01]"
              : error
              ? "border-rose-300 bg-rose-50/20 hover:border-rose-400"
              : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-brand-400"
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-slate-500 mb-2 shadow-xs border border-slate-200">
            <Upload className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Drop CSV or TXT file here, or{" "}
            <span className="text-brand-600 underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Extracts all emails across rows and columns automatically
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {fileName}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {parseResult && (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {parseResult.totalDetected} email address
                      {parseResult.totalDetected === 1 ? "" : "es"} detected
                    </span>
                  )}
                  {parseResult && parseResult.skippedCount > 0 && (
                    <span className="text-slate-400">
                      ({parseResult.skippedCount} invalid or duplicate skipped)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {parseResult && parseResult.totalDetected > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                  title={showPreview ? "Hide detected emails" : "Preview detected emails"}
                >
                  {showPreview ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Email Preview Drawer */}
          {showPreview && parseResult && parseResult.validEmails.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Detected Recipients ({parseResult.validEmails.length}):
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
                {parseResult.validEmails.map((email, idx) => (
                  <div key={idx} className="truncate">
                    {idx + 1}. {email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-rose-600 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};
