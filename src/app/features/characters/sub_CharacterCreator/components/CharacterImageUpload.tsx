'use client';

import { compressImage } from "@/app/helpers/imageUpload";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ImagePlus, X, Sparkles } from "lucide-react";
import NextImage from "next/image";
import { useRef, useState, DragEvent, useEffect } from "react";
import { cn } from '@/app/lib/utils';

const dropzoneVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

interface CharacterImageUploadProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onClearExtraction?: () => void;
}

/**
 * Character Image Upload Component
 * Allows uploading a character portrait for AI analysis
 */
export function CharacterImageUpload({
  selectedFile,
  setSelectedFile,
  onClearExtraction,
}: CharacterImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

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

  const processFile = async (file: File) => {
    try {
      const processedFile = await compressImage(file, setIsCompressing, setCompressionInfo);
      setSelectedFile(processedFile);
      onClearExtraction?.();
    } catch (error) {
      console.error('Error compressing image:', error);
      setSelectedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImageUrl(null);
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearExtraction?.();
  };

  return (
    <div className="rounded-lg flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Upload Character Portrait</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Upload an image to automatically extract appearance details using AI
      </p>

      <div className="relative min-h-[250px]">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <DropzoneEmpty
              isDragActive={isDragActive}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            />
          ) : (
            <ImagePreview
              imageUrl={imageUrl}
              isCompressing={isCompressing}
              fileInputRef={fileInputRef}
              onRemove={handleRemoveFile}
            />
          )}
        </AnimatePresence>
      </div>

      {compressionInfo && (
        <p className="text-xs text-gray-500 mt-2">{compressionInfo}</p>
      )}
    </div>
  );
}

interface DropzoneEmptyProps {
  isDragActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
}

function DropzoneEmpty({
  isDragActive,
  fileInputRef,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
}: DropzoneEmptyProps) {
  return (
    <motion.div
      key="dropzone"
      variants={dropzoneVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'absolute min-h-[250px] inset-0 border-2 border-dashed rounded-lg p-6 cursor-pointer flex flex-col items-center justify-center transition-colors',
        isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'
      )}
      onClick={() => fileInputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <ImagePlus className="h-12 w-12 text-purple-400 mb-2" />
      <p className="text-gray-300 text-center text-sm">Drag & drop or click to select</p>
      <p className="text-gray-500 text-center text-xs mt-1">Character portrait or reference image</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />
    </motion.div>
  );
}

interface ImagePreviewProps {
  imageUrl: string | null;
  isCompressing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRemove: () => void;
}

function ImagePreview({ imageUrl, isCompressing, fileInputRef, onRemove }: ImagePreviewProps) {
  return (
    <motion.div
      key="preview"
      variants={dropzoneVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center"
    >
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-red-400 hover:text-red-300 rounded-full p-1.5 z-10 transition-all"
        title="Remove image"
      >
        <X size={16} />
      </button>
      <div
        className="relative w-full h-full min-h-[250px] overflow-hidden rounded-lg cursor-pointer border border-gray-700"
        onClick={() => fileInputRef.current?.click()}
        title="Change image"
      >
        {imageUrl && (
          <div className="w-full h-full min-h-[250px] relative">
            {isCompressing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-white text-sm">Compressing image...</div>
              </div>
            )}
            <NextImage
              src={imageUrl}
              alt="Character portrait preview"
              className="object-contain"
              fill
              sizes="(max-width: 600px) 100vw"
              style={{ transition: 'opacity 0.3s linear' }}
              unoptimized
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
