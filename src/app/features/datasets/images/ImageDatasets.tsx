'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatasetsByProject, useCreateDataset, useDeleteDataset } from '@/app/hooks/useDatasets';
import { Plus, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import ImageDatasetGallery from './ImageDatasetGallery';
import DatasetSketchWizard from './DatasetSketchWizard';
import { Dataset } from '@/app/types/Dataset';

interface ImageDatasetsProps {
  projectId: string;
}

const ImageDatasets = ({ projectId }: ImageDatasetsProps) => {
  const [newDatasetName, setNewDatasetName] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [sketchDataset, setSketchDataset] = useState<Dataset | null>(null);
  const { data: datasets, isLoading } = useDatasetsByProject(projectId);
  const { mutate: createDataset, isPending: isCreating } = useCreateDataset();
  const { mutate: deleteDataset } = useDeleteDataset();

  const handleCreateDataset = () => {
    if (!newDatasetName.trim()) return;

    createDataset(
      {
        name: newDatasetName,
        project_id: projectId,
        type: 'image',
      },
      {
        onSuccess: (dataset) => {
          setNewDatasetName('');
          setSketchDataset(dataset);
        },
      }
    );
  };

  const handleDeleteDataset = (datasetId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this dataset?')) return;

    deleteDataset({ id: datasetId, projectId });

    if (selectedDatasetId === datasetId) {
      setSelectedDatasetId(null);
    }
  };

  const selectedDataset = datasets?.find((d) => d.id === selectedDatasetId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-blue-400" />
          Image Datasets
        </h2>
        <p className="text-gray-400 mt-1">
          Organize and manage image collections for your project
        </p>
      </div>

      {/* Create New Dataset */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Create New Dataset</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newDatasetName}
            onChange={(e) => setNewDatasetName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateDataset()}
            placeholder="Enter dataset name..."
            className="flex-1 px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleCreateDataset}
            disabled={isCreating || !newDatasetName.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Dataset List */}
      {datasets && datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets
            .filter((d) => d.type === 'image')
            .map((dataset, index) => (
              <motion.div
                key={dataset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDatasetId(dataset.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedDatasetId === dataset.id
                    ? 'bg-blue-900 border-2 border-blue-600 shadow-lg shadow-blue-500/30'
                    : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-100 truncate">
                      {dataset.name}
                    </h4>
                    {dataset.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {dataset.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Created {new Date(dataset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDataset(dataset.id, e)}
                    className="p-1 rounded hover:bg-red-900/30 transition-colors ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No image datasets yet</p>
          <p className="text-sm text-gray-500 mt-1">Create your first dataset above</p>
        </div>
      )}

      {/* Selected Dataset Gallery */}
      <AnimatePresence mode="wait">
        {selectedDataset && (
          <motion.div
            key={selectedDataset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border-t border-gray-800 pt-6"
          >
            <ImageDatasetGallery
              dataset={selectedDataset}
              onOpenSketchWizard={() => setSketchDataset(selectedDataset)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sketch Wizard Modal */}
      <AnimatePresence>
        {sketchDataset && (
          <DatasetSketchWizard
            dataset={sketchDataset}
            onClose={() => setSketchDataset(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageDatasets;
