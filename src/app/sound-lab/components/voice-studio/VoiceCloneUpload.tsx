'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileAudio, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface VoiceCloneUploadProps {
  onClose: () => void;
  onCloned?: (voiceId: string, name: string) => void;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/x-wav'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function VoiceCloneUpload({ onClose, onCloned }: VoiceCloneUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid: File[] = [];
    for (const file of Array.from(newFiles)) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|flac)$/i)) {
        setErrorMsg('Only MP3, WAV, and FLAC files are supported');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('File must be under 10 MB');
        return;
      }
      valid.push(file);
    }
    setErrorMsg('');
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleClone = useCallback(async () => {
    if (!voiceName.trim() || files.length === 0) return;

    setStatus('uploading');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('name', voiceName.trim());
      formData.append('project_id', 'default');
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await fetch('/api/ai/audio/clone', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Clone failed');
      }

      setStatus('success');
      onCloned?.(data.voice_id, data.name);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to clone voice');
    }
  }, [voiceName, files, onCloned]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800/40">
        <span className="text-[11px] font-medium text-slate-400">Clone Voice</span>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="p-2.5 space-y-2">
        {status === 'success' ? (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-4 h-4 text-emerald-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-emerald-400">Voice cloned</p>
              <p className="text-[11px] text-slate-500 truncate">{voiceName}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Voice Name */}
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Voice name (required)"
              className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded-md
                text-[11px] text-slate-200 placeholder:text-slate-500
                focus:outline-none focus:border-orange-500/40 transition-colors"
            />

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-3 rounded-md border border-dashed cursor-pointer transition-all duration-200',
                dragOver
                  ? 'border-orange-500/60 bg-orange-500/10'
                  : 'border-slate-700/50 bg-slate-900/30 hover:border-slate-600/50'
              )}
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span className="text-[11px] text-slate-500">Drop audio or click to upload</span>
              <span className="text-[11px] text-slate-600">MP3, WAV, FLAC — 10-30s each</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.flac,audio/*"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/40">
                    <FileAudio className="w-3 h-3 text-orange-400 shrink-0" />
                    <span className="text-[11px] text-slate-300 truncate flex-1">{file.name}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {(file.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/5 border border-red-500/20">
                <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                <span className="text-[11px] text-red-400 truncate">{errorMsg}</span>
              </div>
            )}

            {/* Clone Button */}
            <button
              onClick={handleClone}
              disabled={status === 'uploading' || !voiceName.trim() || files.length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200',
                status === 'uploading'
                  ? 'bg-orange-600/40 text-orange-300 cursor-not-allowed'
                  : !voiceName.trim() || files.length === 0
                    ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-sm shadow-orange-500/20'
              )}
            >
              {status === 'uploading' ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Cloning...</>
              ) : (
                <><Upload className="w-3 h-3" /> Clone Voice</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
