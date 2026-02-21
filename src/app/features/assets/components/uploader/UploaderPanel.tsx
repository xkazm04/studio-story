'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wand2, ImageIcon, Upload, FolderUp } from 'lucide-react';
import DropzoneCard from './DropzoneCard';
import ModelConfigPanel from './ModelConfigPanel';
import AnalysisResultsPanel from './AnalysisResultsPanel';
import UploadProgress from './UploadProgress';
import DuplicateWarning, { DuplicateCheckLoading } from './DuplicateWarning';
import { CollapsibleSection } from '@/app/components/UI/CollapsibleSection';
import { Button } from '@/app/components/UI/Button';
import { useBatchUpload } from '@/lib/upload';
import { useAssetAnalysis, type AnalysisOptions } from '@/lib/assets';
import { useDuplicateCheck } from '@/lib/similarity';
import type { AnalysisConfig, AnalysisResult } from '../../types';

interface UploaderPanelProps {
  className?: string;
}

type UploadMode = 'single' | 'batch';

export default function UploaderPanel({ className = '' }: UploaderPanelProps) {
  // Upload mode
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

  // File state (single mode)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Batch upload hook
  const { addFiles, files: batchFiles, stats } = useBatchUpload(
    async (file, onProgress) => {
      // Simulate upload for now - replace with actual API call
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      onProgress(100);
    }
  );

  // Config state
  const [config, setConfig] = useState<AnalysisConfig>({
    gemini: { enabled: false },
    groq: { enabled: true },
    openai: { enabled: false },
  });

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Smart analysis options
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    generateTags: true,
    extractContent: true,
    analyzeColors: true,
    assessQuality: true,
    detectObjects: true,
    extractText: false,
  });

  // Enhanced asset analysis hook
  const {
    analyze: runEnhancedAnalysis,
    isAnalyzing: isEnhancedAnalyzing,
    result: enhancedResult,
    reset: resetEnhancedAnalysis,
  } = useAssetAnalysis();

  // Duplicate detection hook
  const {
    isChecking: isCheckingDuplicate,
    result: duplicateResult,
    reset: resetDuplicateCheck,
  } = useDuplicateCheck();

  // Track if user dismissed duplicate warning
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    setResults([]);
    setError(null);
    setDuplicateDismissed(false);
    resetEnhancedAnalysis();
    resetDuplicateCheck();
  }, [resetEnhancedAnalysis, resetDuplicateCheck]);

  const handleFilesSelect = useCallback((files: File[]) => {
    addFiles(files);
  }, [addFiles]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setResults([]);
    setError(null);
    setDuplicateDismissed(false);
    resetEnhancedAnalysis();
    resetDuplicateCheck();
  }, [resetEnhancedAnalysis, resetDuplicateCheck]);

  const handleDuplicateProceed = useCallback(() => {
    setDuplicateDismissed(true);
  }, []);

  const handleDuplicateCancel = useCallback(() => {
    handleClear();
  }, [handleClear]);

  const handleViewExistingAsset = useCallback((assetId: string) => {
    // Could navigate to asset manager with the asset selected
    console.log('View existing asset:', assetId);
    // TODO: Implement navigation to asset manager
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    const enabledModels = Object.entries(config).filter(([, v]) => v.enabled);
    if (enabledModels.length === 0) {
      setError('Please enable at least one AI model');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // Run both analyses in parallel
    const [apiResult, _enhancedResult] = await Promise.all([
      // AI Model analysis via API
      (async () => {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('config', JSON.stringify(config));

          const response = await fetch('/api/asset-analysis', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
          }

          return await response.json();
        } catch (err) {
          console.error('API analysis error:', err);
          return null;
        }
      })(),
      // Enhanced local analysis
      runEnhancedAnalysis(selectedFile, analysisOptions),
    ]);

    // Process API results
    if (apiResult) {
      const analysisResults: AnalysisResult[] = [];

      if (apiResult.gemini) {
        analysisResults.push({
          model: 'gemini',
          assets: apiResult.gemini.assets || [],
          processingTime: apiResult.gemini.processingTime || 0,
          error: apiResult.gemini.error,
        });
      }

      if (apiResult.groq) {
        analysisResults.push({
          model: 'groq',
          assets: apiResult.groq.assets || [],
          processingTime: apiResult.groq.processingTime || 0,
          error: apiResult.groq.error,
        });
      }

      setResults(analysisResults);
    } else {
      setError('AI model analysis failed. Smart analysis may still be available.');
    }

    setIsAnalyzing(false);
  }, [selectedFile, config, runEnhancedAnalysis, analysisOptions]);

  const canAnalyze =
    selectedFile && Object.values(config).some((m) => m.enabled) && !isAnalyzing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col gap-4 ${className}`}
    >
      {/* Main card with gradient background */}
      <div
        className="relative p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
          border border-slate-800/70 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-medium text-slate-100">Image Analysis</h2>
          </div>

          {/* Upload mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-800/50">
            <button
              onClick={() => setUploadMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                uploadMode === 'single'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Single
            </button>
            <button
              onClick={() => setUploadMode('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                uploadMode === 'batch'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderUp className="w-3.5 h-3.5" />
              Batch
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <DropzoneCard
          selectedFile={uploadMode === 'single' ? selectedFile : null}
          onFileSelect={handleFileSelect}
          onClear={handleClear}
          isDisabled={isAnalyzing}
          multiple={uploadMode === 'batch'}
          onFilesSelect={handleFilesSelect}
          maxFiles={20}
        />

        {/* Duplicate check loading state */}
        {uploadMode === 'single' && selectedFile && isCheckingDuplicate && (
          <div className="mt-4">
            <DuplicateCheckLoading />
          </div>
        )}

        {/* Duplicate warning */}
        {uploadMode === 'single' && selectedFile && !duplicateDismissed && !isCheckingDuplicate && (
          <div className="mt-4">
            <DuplicateWarning
              file={selectedFile}
              onProceed={handleDuplicateProceed}
              onCancel={handleDuplicateCancel}
              onViewExisting={handleViewExistingAsset}
            />
          </div>
        )}

        {/* Batch Upload Progress */}
        {uploadMode === 'batch' && batchFiles.length > 0 && (
          <div className="mt-4">
            <UploadProgress />
          </div>
        )}

        {/* Model configuration - collapsible */}
        <div className="mt-4">
          <CollapsibleSection
            title="Model Configuration"
            defaultOpen={true}
            compact
          >
            <div className="pt-3">
              <ModelConfigPanel
                config={config}
                onConfigChange={setConfig}
                analysisOptions={analysisOptions}
                onAnalysisOptionsChange={setAnalysisOptions}
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Analyze button */}
        <div className="mt-5">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            data-testid="analyze-button"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Analyze Image
              </>
            )}
          </Button>
        </div>

        {/* Results panel */}
        <AnalysisResultsPanel
          results={results}
          isLoading={isAnalyzing || isEnhancedAnalyzing}
          enhancedAnalysis={enhancedResult}
        />
      </div>
    </motion.div>
  );
}
