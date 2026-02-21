'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatasetImages, useAddImageToDataset, useRemoveImageFromDataset } from '@/app/hooks/useDatasets';
import { Upload, Loader2, Trash2, Tag, Sparkles, X, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { Dataset } from '@/app/types/Dataset';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import InlineTerminal from '@/cli/InlineTerminal';

interface ImageDatasetGalleryProps {
  dataset: Dataset;
  onOpenSketchWizard?: () => void;
}

const ImageDatasetGallery = ({ dataset, onOpenSketchWizard }: ImageDatasetGalleryProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const { data: images, isLoading } = useDatasetImages(dataset.id);
  const { mutate: addImage } = useAddImageToDataset();
  const { mutate: removeImage } = useRemoveImageFromDataset();

  // CLI integration for dataset tagging
  const cli = useCLIFeature({
    featureId: 'datasets',
    projectId: dataset.id,
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['dataset-tagging'],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // TODO: Implement actual image upload to Supabase Storage
      // 1. Upload image to Supabase Storage
      // 2. Get public URL
      // 3. Add to dataset

      for (const file of Array.from(files)) {
        // Placeholder implementation
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;

          addImage({
            dataset_id: dataset.id,
            image_url: imageUrl,
            tags: [],
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateTags = async (imageId: string, imageUrl: string) => {
    setIsGeneratingTags(true);

    // Use CLI dataset-tagging skill instead of direct LLM call
    cli.execute('dataset-tagging', {
      imageId,
      imageUrl,
      datasetName: dataset.name,
    });

    // CLI will handle execution asynchronously; isGeneratingTags resets when queue empties
    setTimeout(() => setIsGeneratingTags(false), 1000);
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Remove this image from the dataset?')) return;

    // If image has an internal_id (Leonardo generation ID), clean up from Leonardo
    const image = images?.find((img) => img.id === imageId);
    if (image?.internal_id) {
      try {
        await fetch('/api/ai/generate-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generationIds: [image.internal_id] }),
        });
      } catch {
        // Leonardo cleanup is best-effort
      }
    }

    removeImage({ imageId, datasetId: dataset.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-200">{dataset.name}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {images?.length || 0} image(s) in dataset
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenSketchWizard && (
            <button
              onClick={onOpenSketchWizard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Generate Images
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id={`image-upload-${dataset.id}`}
          />
          <label
            htmlFor={`image-upload-${dataset.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Images
              </>
            )}
          </label>
        </div>
      </div>

      {/* Image Grid */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-700 hover:border-gray-600 transition-colors"
              onClick={() => setSelectedImage(image.id)}
            >
              <Image
                src={image.image_url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover cursor-pointer"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateTags(image.id, image.image_url);
                  }}
                  disabled={isGeneratingTags}
                  className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  title="Generate Tags with AI"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(image.id);
                  }}
                  className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Remove from Dataset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tags */}
              {image.tags && image.tags.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {image.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs text-gray-300 bg-gray-900/60 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {image.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{image.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No images in this dataset</p>
          <p className="text-sm text-gray-500 mt-1">Click "Upload Images" to add some</p>
        </div>
      )}

      {/* CLI Terminal for dataset operations */}
      <InlineTerminal
        {...cli.terminalProps}
        height={150}
        collapsible
        outputFormat="json"
      />

      {/* Image Detail Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {images?.find((img) => img.id === selectedImage) && (
                <div className="relative w-full h-full">
                  <Image
                    src={images.find((img) => img.id === selectedImage)!.image_url}
                    alt="Selected image"
                    width={1200}
                    height={800}
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageDatasetGallery;
