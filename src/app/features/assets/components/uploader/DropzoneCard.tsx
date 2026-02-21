'use client';

import { useState, useRef, DragEvent, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/app/helpers/imageUpload';

interface DropzoneCardProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onClear: () => void;
  isDisabled?: boolean;
  // Multi-file support
  multiple?: boolean;
  onFilesSelect?: (files: File[]) => void;
  maxFiles?: number;
}

type DropzoneState = 'idle' | 'dragOver' | 'uploading' | 'error';

const stateStyles: Record<DropzoneState, string> = {
  idle: 'border-slate-700/70 bg-slate-950/40',
  dragOver: 'border-cyan-500/60 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  uploading: 'border-cyan-500/40 bg-slate-950/60',
  error: 'border-red-500/40 bg-red-500/5',
};

export default function DropzoneCard({
  selectedFile,
  onFileSelect,
  onClear,
  isDisabled = false,
  multiple = false,
  onFilesSelect,
  maxFiles = 20,
}: DropzoneCardProps) {
  const [dropzoneState, setDropzoneState] = useState<DropzoneState>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate image URL when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageUrl(null);
      setCompressionInfo(null);
    }
  }, [selectedFile]);

  const processFile = useCallback(async (file: File) => {
    setDropzoneState('uploading');
    try {
      const processedFile = await compressImage(file, setIsCompressing, setCompressionInfo);
      onFileSelect(processedFile);
      setDropzoneState('idle');
    } catch (error) {
      console.error('Error compressing image:', error);
      onFileSelect(file);
      setDropzoneState('idle');
    }
  }, [onFileSelect]);

  const processMultipleFiles = useCallback(async (files: File[]) => {
    if (!onFilesSelect) return;

    setDropzoneState('uploading');
    const processedFiles: File[] = [];

    // Limit number of files
    const filesToProcess = files.slice(0, maxFiles);

    for (const file of filesToProcess) {
      try {
        const processedFile = await compressImage(file, setIsCompressing, setCompressionInfo);
        processedFiles.push(processedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        processedFiles.push(file);
      }
    }

    onFilesSelect(processedFiles);
    setDropzoneState('idle');
  }, [onFilesSelect, maxFiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (multiple && onFilesSelect) {
      const filesArray = Array.from(e.target.files);
      await processMultipleFiles(filesArray);
    } else if (e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isDisabled) return;
    setDropzoneState('idle');

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    if (multiple && onFilesSelect) {
      const filesArray = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith('image/')
      );
      await processMultipleFiles(filesArray);
    } else if (e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDisabled) {
      setDropzoneState('dragOver');
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropzoneState('idle');
  };

  const handleRemoveFile = () => {
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCompressionInfo(null);
    setDropzoneState('idle');
  };

  const handleClick = () => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`
              relative border-2 border-dashed rounded-xl p-8 cursor-pointer
              flex flex-col items-center justify-center min-h-[240px]
              transition-all duration-200 ease-out
              ${stateStyles[dropzoneState]}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/50 hover:bg-slate-900/40'}
            `}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Animated icon */}
            <motion.div
              animate={dropzoneState === 'dragOver' ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mb-4"
            >
              {isCompressing ? (
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              ) : dropzoneState === 'dragOver' ? (
                <Upload className="w-12 h-12 text-cyan-400" />
              ) : (
                <ImagePlus className="w-12 h-12 text-slate-400" />
              )}
            </motion.div>

            {/* Text */}
            <p className="text-slate-300 text-sm text-center mb-1">
              {isCompressing
                ? 'Processing image...'
                : dropzoneState === 'dragOver'
                ? `Drop to upload${multiple ? ' files' : ''}`
                : multiple
                ? 'Drag & drop images'
                : 'Drag & drop an image'}
            </p>
            <p className="text-slate-500 text-xs text-center">
              {multiple
                ? `or click to browse (up to ${maxFiles} files)`
                : 'or click to browse'}
            </p>

            {/* Hidden input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isDisabled}
              multiple={multiple}
            />

            {/* Glow effect on drag */}
            {dropzoneState === 'dragOver' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5 pointer-events-none"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative min-h-[240px] rounded-xl overflow-hidden border border-slate-800/70 bg-slate-950/60"
          >
            {/* Remove button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleRemoveFile}
              className="absolute top-3 right-3 z-10 p-2 rounded-full
                bg-slate-900/80 hover:bg-red-500/20
                border border-slate-700/50 hover:border-red-500/40
                text-slate-400 hover:text-red-400
                transition-all duration-200"
            >
              <X size={16} />
            </motion.button>

            {/* Image preview */}
            <div
              className="relative w-full h-full min-h-[240px] cursor-pointer group"
              onClick={handleClick}
              title="Click to change image"
            >
              {imageUrl && (
                <>
                  {isCompressing && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                  )}
                  <Image
                    src={imageUrl}
                    alt="Selected image preview"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    fill
                    sizes="(max-width: 640px) 100vw, 400px"
                    unoptimized
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-full">
                      Click to change
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Compression info badge */}
            {compressionInfo && (
              <div className="absolute bottom-3 left-3 px-2 py-1 text-[10px] text-slate-400 bg-slate-900/80 rounded-md border border-slate-800/50">
                {compressionInfo}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
