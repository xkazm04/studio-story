/**
 * ExportDialog Component
 *
 * Professional script export dialog with multiple format options,
 * customizable settings, and preview capabilities.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  FileType,
  Book,
  Film,
  Settings2,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Info,
  Eye,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  type ExportFormat,
  type ExportOptions,
  type ScriptData,
  exportScript,
  downloadExport,
} from '@/lib/export';

// ============================================================================
// Types
// ============================================================================

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scriptData: ScriptData;
  projectName?: string;
}

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: typeof FileText;
  extension: string;
  color: string;
  features: string[];
}

// ============================================================================
// Constants
// ============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF Screenplay',
    description: 'Industry-standard screenplay format',
    icon: Film,
    extension: '.pdf',
    color: 'text-red-400',
    features: [
      'Standard Courier 12pt format',
      'Professional margins and spacing',
      'Title page with contact info',
      'Scene numbering (optional)',
    ],
  },
  {
    id: 'fountain',
    name: 'Fountain',
    description: 'Plain text screenplay markup',
    icon: FileType,
    extension: '.fountain',
    color: 'text-cyan-400',
    features: [
      'Compatible with Final Draft, Highland',
      'Plain text, version control friendly',
      'Portable across all platforms',
      'Easy editing in any text editor',
    ],
  },
  {
    id: 'epub',
    name: 'E-Book (EPUB)',
    description: 'Readable novel/script format',
    icon: Book,
    extension: '.epub',
    color: 'text-purple-400',
    features: [
      'Chapter-based organization',
      'Table of contents',
      'Customizable typography',
      'Compatible with all e-readers',
    ],
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple text export',
    icon: FileText,
    extension: '.txt',
    color: 'text-slate-400',
    features: [
      'Universal compatibility',
      'No formatting dependencies',
      'Easy to share and edit',
      'Minimal file size',
    ],
  },
];

// ============================================================================
// Sub-Components
// ============================================================================

interface FormatCardProps {
  format: FormatOption;
  isSelected: boolean;
  onSelect: () => void;
}

function FormatCard({ format, isSelected, onSelect }: FormatCardProps) {
  const Icon = format.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full p-4 rounded-lg border text-left transition-all',
        isSelected
          ? 'bg-slate-800 border-cyan-500/50 ring-1 ring-cyan-500/30'
          : 'bg-slate-900/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          isSelected ? 'bg-cyan-600/20' : 'bg-slate-800'
        )}>
          <Icon className={cn('w-5 h-5', format.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium',
              isSelected ? 'text-cyan-300' : 'text-slate-200'
            )}>
              {format.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
              {format.extension}
            </span>
            {isSelected && <Check className="w-4 h-4 text-cyan-400 ml-auto" />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{format.description}</p>
        </div>
      </div>
    </button>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SettingsSection({ title, children, defaultOpen = true }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-xs font-medium text-slate-300">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 bg-slate-950/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ToggleOptionProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={cn(
          'w-8 h-5 rounded-full transition-colors',
          checked ? 'bg-cyan-600' : 'bg-slate-700'
        )}>
          <div className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          )} />
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-300">{label}</div>
        {description && (
          <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

interface SelectOptionProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function SelectOption({ label, value, options, onChange }: SelectOptionProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExportDialog({
  isOpen,
  onClose,
  scriptData,
  projectName,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Export options
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeSceneNumbers, setIncludeSceneNumbers] = useState(false);

  // PDF-specific options
  const [pdfDraftMode, setPdfDraftMode] = useState<'spec' | 'shooting'>('spec');
  const [pdfPageSize, setPdfPageSize] = useState<'letter' | 'a4'>('letter');

  // EPUB-specific options
  const [epubTheme, setEpubTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [epubIncludeChapterNumbers, setEpubIncludeChapterNumbers] = useState(true);

  // Fountain-specific options
  const [fountainUppercase, setFountainUppercase] = useState(true);

  // Get selected format info
  const selectedFormatInfo = useMemo(
    () => FORMAT_OPTIONS.find(f => f.id === selectedFormat)!,
    [selectedFormat]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const sceneCount = scriptData.blocks.filter(b => b.type === 'scene-header').length;
    const dialogueCount = scriptData.blocks.filter(b => b.type === 'dialogue').length;
    const wordCount = scriptData.blocks.reduce(
      (sum, b) => sum + (b.content?.split(/\s+/).length || 0),
      0
    );
    const pageEstimate = Math.ceil(wordCount / 250); // ~250 words per page

    return { sceneCount, dialogueCount, wordCount, pageEstimate };
  }, [scriptData]);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        includeTitlePage,
        includeSceneNumbers,
        filename: `${projectName || scriptData.title || 'screenplay'}.${selectedFormatInfo.extension.slice(1)}`,
        pdf: selectedFormat === 'pdf' ? {
          draftMode: pdfDraftMode,
          pageSize: pdfPageSize,
        } : undefined,
        epub: selectedFormat === 'epub' ? {
          theme: epubTheme,
          includeChapterNumbers: epubIncludeChapterNumbers,
        } : undefined,
        fountain: selectedFormat === 'fountain' ? {
          uppercaseSceneHeadings: fountainUppercase,
          uppercaseCharacterNames: fountainUppercase,
        } : undefined,
      };

      const result = await exportScript(scriptData, options);
      downloadExport(result);

      // Close dialog after successful export
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [
    selectedFormat,
    includeTitlePage,
    includeSceneNumbers,
    pdfDraftMode,
    pdfPageSize,
    epubTheme,
    epubIncludeChapterNumbers,
    fountainUppercase,
    projectName,
    scriptData,
    selectedFormatInfo,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-600/20">
                <Download className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Export Script</h2>
                <p className="text-xs text-slate-500">{scriptData.title || 'Untitled Script'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-5 space-y-5">
              {/* Script Stats */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{stats.sceneCount} scenes</span>
                  <span>•</span>
                  <span>{stats.dialogueCount} dialogue blocks</span>
                  <span>•</span>
                  <span>{stats.wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>~{stats.pageEstimate} pages</span>
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-200">Export Format</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map(format => (
                    <FormatCard
                      key={format.id}
                      format={format}
                      isSelected={selectedFormat === format.id}
                      onSelect={() => setSelectedFormat(format.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Format Features */}
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <selectedFormatInfo.icon className={cn('w-4 h-4', selectedFormatInfo.color)} />
                  <span className="text-xs font-medium text-slate-300">
                    {selectedFormatInfo.name} Features
                  </span>
                </div>
                <ul className="space-y-1">
                  {selectedFormatInfo.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Check className="w-3 h-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Settings */}
              <SettingsSection title="General Options">
                <ToggleOption
                  label="Include Title Page"
                  description="Add a professional title page with author and contact info"
                  checked={includeTitlePage}
                  onChange={setIncludeTitlePage}
                />
                <ToggleOption
                  label="Include Scene Numbers"
                  description="Number each scene for production scripts"
                  checked={includeSceneNumbers}
                  onChange={setIncludeSceneNumbers}
                />
              </SettingsSection>

              {/* Format-Specific Settings */}
              {selectedFormat === 'pdf' && (
                <SettingsSection title="PDF Options">
                  <SelectOption
                    label="Draft Mode"
                    value={pdfDraftMode}
                    options={[
                      { value: 'spec', label: 'Spec Script' },
                      { value: 'shooting', label: 'Shooting Script' },
                    ]}
                    onChange={(v) => setPdfDraftMode(v as 'spec' | 'shooting')}
                  />
                  <SelectOption
                    label="Page Size"
                    value={pdfPageSize}
                    options={[
                      { value: 'letter', label: 'US Letter (8.5 x 11)' },
                      { value: 'a4', label: 'A4' },
                    ]}
                    onChange={(v) => setPdfPageSize(v as 'letter' | 'a4')}
                  />
                </SettingsSection>
              )}

              {selectedFormat === 'epub' && (
                <SettingsSection title="E-Book Options">
                  <SelectOption
                    label="Color Theme"
                    value={epubTheme}
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'sepia', label: 'Sepia' },
                    ]}
                    onChange={(v) => setEpubTheme(v as 'light' | 'dark' | 'sepia')}
                  />
                  <ToggleOption
                    label="Chapter Numbers"
                    description="Prefix chapter titles with numbers"
                    checked={epubIncludeChapterNumbers}
                    onChange={setEpubIncludeChapterNumbers}
                  />
                </SettingsSection>
              )}

              {selectedFormat === 'fountain' && (
                <SettingsSection title="Fountain Options">
                  <ToggleOption
                    label="Uppercase Formatting"
                    description="Scene headings and character names in uppercase"
                    checked={fountainUppercase}
                    onChange={setFountainUppercase}
                  />
                </SettingsSection>
              )}

              {/* Error Display */}
              {exportError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs text-red-400">{exportError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-900/50">
            <div className="text-xs text-slate-500">
              Exporting as <span className="text-slate-300">{selectedFormatInfo.extension}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 bg-cyan-600 hover:bg-cyan-500"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ExportDialog;
