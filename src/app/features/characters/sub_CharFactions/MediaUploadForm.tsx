'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, FileText, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import ColoredBorder from '@/app/components/UI/ColoredBorder';

interface MediaUploadFormProps {
  factionId: string;
  onClose: () => void;
  onUpload: (file: File, type: string, description: string) => Promise<void>;
}

const MEDIA_TYPES = [
  { value: 'logo', label: 'Logo' },
  { value: 'banner', label: 'Banner' },
  { value: 'emblem', label: 'Emblem' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'lore', label: 'Lore Document' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const MediaUploadForm: React.FC<MediaUploadFormProps> = ({
  factionId,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState('logo');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or document (PDF, TXT, MD).';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(Math.floor(progress));
    }, 200);
    return interval;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const progressInterval = simulateProgress();

    try {
      await onUpload(selectedFile, mediaType, description);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);

      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Failed to upload media');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-lg border border-gray-800 max-w-2xl w-full"
      >
        <div className="relative p-6">
          <ColoredBorder color="purple" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Upload size={24} />
              Upload Media
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isUploading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3"
              >
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg flex items-center gap-3"
              >
                <Check size={20} className="text-green-400" />
                <p className="text-green-300 text-sm">Media uploaded successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className={cn('relative border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all',
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10'
                    : selectedFile
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  accept={ALLOWED_TYPES.join(',')}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="text-center">
                  {selectedFile ? (
                    <>
                      <FileImage size={48} className="mx-auto mb-4 text-green-400" />
                      <p className="text-white font-medium mb-1">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                    </>
                  ) : (
                    <>
                      <Upload size={48} className="mx-auto mb-4 text-gray-500" />
                      <p className="text-white font-medium mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-gray-400 text-sm">
                        Images (JPEG, PNG, GIF, WebP) or Documents (PDF, TXT, MD)
                      </p>
                      <p className="text-gray-500 text-xs mt-1">Maximum file size: 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Media Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Media Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MEDIA_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMediaType(type.value)}
                    disabled={isUploading}
                    className={cn('px-4 py-3 rounded-lg transition-all',
                      mediaType === type.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                placeholder="Add a description for this media..."
                className="w-full min-h-[100px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                <Upload size={18} />
                {isUploading ? 'Uploading...' : 'Upload Media'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MediaUploadForm;
