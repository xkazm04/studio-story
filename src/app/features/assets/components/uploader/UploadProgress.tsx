'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  X,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useBatchUpload, type UploadFile, type UploadStatus } from '@/lib/upload';
import { Button, IconButton } from '@/app/components/UI/Button';

interface UploadProgressProps {
  onUploadComplete?: () => void;
  className?: string;
}

// Status configuration
const statusConfig: Record<
  UploadStatus,
  { color: string; icon: typeof Upload; label: string }
> = {
  pending: { color: 'slate', icon: Upload, label: 'Pending' },
  validating: { color: 'cyan', icon: Loader2, label: 'Validating' },
  uploading: { color: 'cyan', icon: Upload, label: 'Uploading' },
  paused: { color: 'amber', icon: Pause, label: 'Paused' },
  completed: { color: 'green', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'red', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'slate', icon: X, label: 'Cancelled' },
};

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadProgress({
  onUploadComplete,
  className = '',
}: UploadProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    files,
    status,
    overallProgress,
    stats,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    cancelAll,
    retryFailed,
    clearCompleted,
    removeFile,
  } = useBatchUpload();

  // Don't render if no files
  if (files.length === 0) return null;

  const hasFailedFiles = stats.failed > 0;
  const hasCompletedFiles = stats.completed > 0;
  const isUploading = status === 'uploading';
  const isPaused = status === 'paused';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={clsx(
        'rounded-xl border bg-slate-900/80 backdrop-blur-sm overflow-hidden',
        isUploading ? 'border-cyan-500/30' : 'border-slate-800',
        className
      )}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
      >
        {/* Overall progress circle */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-700"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - overallProgress / 100)}`}
              className={clsx(
                'transition-all duration-300',
                hasFailedFiles ? 'text-red-500' : 'text-cyan-500'
              )}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-200">
            {overallProgress}%
          </span>
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-200">
            {isUploading
              ? 'Uploading...'
              : isPaused
              ? 'Paused'
              : status === 'completed'
              ? 'Upload Complete'
              : 'Ready to Upload'}
          </h4>
          <p className="text-xs text-slate-400">
            {stats.completed} of {stats.total} files completed
            {hasFailedFiles && (
              <span className="text-red-400 ml-1">({stats.failed} failed)</span>
            )}
          </p>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isUploading && (
            <IconButton
              icon={<Pause className="w-4 h-4" />}
              aria-label="Pause upload"
              variant="ghost"
              size="sm"
              onClick={pauseUpload}
              className="text-slate-400 hover:text-amber-400"
            />
          )}
          {isPaused && (
            <IconButton
              icon={<Play className="w-4 h-4" />}
              aria-label="Resume upload"
              variant="ghost"
              size="sm"
              onClick={resumeUpload}
              className="text-slate-400 hover:text-green-400"
            />
          )}
          {hasFailedFiles && !isUploading && (
            <IconButton
              icon={<RefreshCw className="w-4 h-4" />}
              aria-label="Retry failed"
              variant="ghost"
              size="sm"
              onClick={retryFailed}
              className="text-slate-400 hover:text-cyan-400"
            />
          )}
          {hasCompletedFiles && !isUploading && (
            <IconButton
              icon={<Trash2 className="w-4 h-4" />}
              aria-label="Clear completed"
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="text-slate-400 hover:text-red-400"
            />
          )}
          {isUploading && (
            <IconButton
              icon={<X className="w-4 h-4" />}
              aria-label="Cancel all"
              variant="ghost"
              size="sm"
              onClick={cancelAll}
              className="text-slate-400 hover:text-red-400"
            />
          )}
        </div>

        {/* Expand/collapse */}
        <IconButton
          icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-500"
        />
      </div>

      {/* File list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-800/50 max-h-[300px] overflow-auto">
              {files.map((file) => (
                <FileProgressItem
                  key={file.id}
                  file={file}
                  onCancel={() => cancelUpload(file.id)}
                  onRemove={() => removeFile(file.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start upload button */}
      {status === 'idle' && stats.pending > 0 && (
        <div className="p-4 border-t border-slate-800/50">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={startUpload}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload {stats.pending} File{stats.pending > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Individual file progress item
interface FileProgressItemProps {
  file: UploadFile;
  onCancel: () => void;
  onRemove: () => void;
}

function FileProgressItem({ file, onCancel, onRemove }: FileProgressItemProps) {
  const config = statusConfig[file.status];
  const StatusIcon = config.icon;
  const isUploading = file.status === 'uploading';
  const canCancel = file.status === 'uploading' || file.status === 'pending';
  const canRemove = file.status !== 'uploading';

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/20 transition-colors">
      {/* Thumbnail or icon */}
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {file.file && file.type.startsWith('image/') ? (
          <img
            src={URL.createObjectURL(file.file)}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-5 h-5 text-slate-500" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-200 truncate">{file.name}</p>
          <span
            className={clsx(
              'px-1.5 py-0.5 rounded text-[10px] font-medium',
              `bg-${config.color}-500/20 text-${config.color}-400`
            )}
            style={{
              backgroundColor:
                config.color === 'slate'
                  ? 'rgba(100,116,139,0.2)'
                  : config.color === 'cyan'
                  ? 'rgba(6,182,212,0.2)'
                  : config.color === 'amber'
                  ? 'rgba(245,158,11,0.2)'
                  : config.color === 'green'
                  ? 'rgba(34,197,94,0.2)'
                  : 'rgba(239,68,68,0.2)',
              color:
                config.color === 'slate'
                  ? 'rgb(148,163,184)'
                  : config.color === 'cyan'
                  ? 'rgb(34,211,238)'
                  : config.color === 'amber'
                  ? 'rgb(251,191,36)'
                  : config.color === 'green'
                  ? 'rgb(74,222,128)'
                  : 'rgb(248,113,113)',
            }}
          >
            {config.label}
          </span>
        </div>

        {/* Progress bar */}
        {(isUploading || file.status === 'paused') && (
          <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              className={clsx(
                'h-full rounded-full',
                file.status === 'paused' ? 'bg-amber-500' : 'bg-cyan-500'
              )}
            />
          </div>
        )}

        {/* Error message */}
        {file.error && (
          <p className="mt-1 text-xs text-red-400 truncate">{file.error}</p>
        )}

        {/* File size and progress */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">
            {formatFileSize(file.size)}
          </span>
          {isUploading && (
            <span className="text-xs text-cyan-400">{file.progress}%</span>
          )}
        </div>
      </div>

      {/* Status icon */}
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center',
          `bg-${config.color}-500/10`
        )}
        style={{
          backgroundColor:
            config.color === 'slate'
              ? 'rgba(100,116,139,0.1)'
              : config.color === 'cyan'
              ? 'rgba(6,182,212,0.1)'
              : config.color === 'amber'
              ? 'rgba(245,158,11,0.1)'
              : config.color === 'green'
              ? 'rgba(34,197,94,0.1)'
              : 'rgba(239,68,68,0.1)',
        }}
      >
        <StatusIcon
          className={clsx(
            'w-4 h-4',
            isUploading && 'animate-pulse',
            file.status === 'validating' && 'animate-spin'
          )}
          style={{
            color:
              config.color === 'slate'
                ? 'rgb(148,163,184)'
                : config.color === 'cyan'
                ? 'rgb(34,211,238)'
                : config.color === 'amber'
                ? 'rgb(251,191,36)'
                : config.color === 'green'
                ? 'rgb(74,222,128)'
                : 'rgb(248,113,113)',
          }}
        />
      </div>

      {/* Action button */}
      {canCancel && (
        <IconButton
          icon={<X className="w-4 h-4" />}
          aria-label="Cancel upload"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-slate-500 hover:text-red-400"
        />
      )}
      {canRemove && !canCancel && (
        <IconButton
          icon={<Trash2 className="w-4 h-4" />}
          aria-label="Remove file"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-slate-500 hover:text-red-400"
        />
      )}
    </div>
  );
}

// Mini progress indicator for compact views
interface MiniProgressProps {
  progress: number;
  status: UploadStatus;
  className?: string;
}

export function MiniProgress({ progress, status, className = '' }: MiniProgressProps) {
  const config = statusConfig[status];

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="relative w-6 h-6">
        <svg className="w-6 h-6 -rotate-90">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-700"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
            style={{
              color:
                config.color === 'slate'
                  ? 'rgb(148,163,184)'
                  : config.color === 'cyan'
                  ? 'rgb(34,211,238)'
                  : config.color === 'amber'
                  ? 'rgb(251,191,36)'
                  : config.color === 'green'
                  ? 'rgb(74,222,128)'
                  : 'rgb(248,113,113)',
            }}
          />
        </svg>
      </div>
      <span className="text-xs text-slate-400">{progress}%</span>
    </div>
  );
}
