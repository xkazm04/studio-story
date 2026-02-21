'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  GitFork,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Tag,
  BarChart2,
  Plus,
  X,
  Bookmark,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  templateManager,
  type PromptTemplate,
  type TemplateCategory,
  type TemplateSearchOptions,
} from '@/lib/templates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  onForkTemplate?: (template: PromptTemplate) => void;
  currentUserId?: string;
  currentUserName?: string;
  className?: string;
}

const CATEGORY_LABELS: Record<TemplateCategory, { label: string; icon: string }> = {
  character: { label: 'Character', icon: '👤' },
  scene: { label: 'Scene', icon: '🎬' },
  dialogue: { label: 'Dialogue', icon: '💬' },
  description: { label: 'Description', icon: '📝' },
  image: { label: 'Image', icon: '🖼️' },
  story: { label: 'Story', icon: '📖' },
  'world-building': { label: 'World Building', icon: '🌍' },
  custom: { label: 'Custom', icon: '✨' },
};

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name A-Z' },
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  onForkTemplate,
  currentUserId = 'anonymous',
  currentUserName = 'Anonymous User',
  className,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<TemplateSearchOptions['sortBy']>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search templates
  const templates = useMemo(() => {
    const options: TemplateSearchOptions = {
      query: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      visibility: 'public',
      sortBy,
    };
    return templateManager.searchTemplates(options);
  }, [searchQuery, selectedCategory, sortBy]);

  // Featured templates
  const featuredTemplates = useMemo(() => {
    return templateManager.getFeaturedTemplates().slice(0, 3);
  }, []);

  // Handle copy template content
  const handleCopyContent = useCallback(async (template: PromptTemplate) => {
    await navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handle fork
  const handleFork = useCallback((template: PromptTemplate) => {
    const forked = templateManager.forkTemplate(template.id, currentUserId, currentUserName);
    if (forked && onForkTemplate) {
      onForkTemplate(forked);
    }
  }, [currentUserId, currentUserName, onForkTemplate]);

  // Render star rating
  const renderRating = (rating: number, count: number) => (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-3 h-3',
              star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">({count})</span>
    </div>
  );

  // Render template card
  const renderTemplateCard = (template: PromptTemplate, isFeatured = false) => {
    const isExpanded = expandedTemplateId === template.id;
    const categoryInfo = CATEGORY_LABELS[template.category];

    return (
      <motion.div
        key={template.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-slate-900/50 border rounded-lg overflow-hidden transition-colors',
          isFeatured ? 'border-amber-500/30' : 'border-slate-800',
          isExpanded && 'ring-1 ring-cyan-500/50'
        )}
      >
        {/* Card Header */}
        <div
          className="p-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
          onClick={() => setExpandedTemplateId(isExpanded ? null : template.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isFeatured && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded">
                    Featured
                  </span>
                )}
                <span className="text-xs">{categoryInfo.icon}</span>
                <h4 className="text-sm font-medium text-slate-200 truncate">
                  {template.name}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {template.description}
              </p>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2">
            {renderRating(template.metrics.averageRating, template.metrics.ratingCount)}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <TrendingUp className="w-3 h-3" />
              {template.metrics.usageCount}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <GitFork className="w-3 h-3" />
              {template.forkCount}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-slate-800 pt-3">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-medium text-slate-400 mb-1">
                      Variables ({template.variables.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 5).map((v) => (
                        <span
                          key={v.name}
                          className={cn(
                            'px-1.5 py-0.5 text-[10px] rounded',
                            v.required
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-slate-800 text-slate-500'
                          )}
                        >
                          {`{{${v.name}}}`}
                        </span>
                      ))}
                      {template.variables.length > 5 && (
                        <span className="text-[10px] text-slate-500">
                          +{template.variables.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="mb-3">
                  <div className="text-[10px] font-medium text-slate-400 mb-1">Preview</div>
                  <pre className="text-[10px] text-slate-500 bg-slate-950/50 rounded p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {template.content.slice(0, 300)}
                    {template.content.length > 300 && '...'}
                  </pre>
                </div>

                {/* Author & Meta */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {template.authorName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    v{template.currentVersion}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 h-7 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyContent(template)}
                    className="h-7 text-xs px-2"
                  >
                    {copiedId === template.id ? (
                      <span className="text-green-400">Copied!</span>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  {template.authorId !== currentUserId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleFork(template)}
                      className="h-7 text-xs px-2"
                    >
                      <GitFork className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Template Gallery</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-slate-300"
        >
          <Filter className="w-3 h-3" />
          Filters
          <ChevronDown
            className={cn('w-3 h-3 transition-transform', showFilters && 'rotate-180')}
          />
        </button>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Category Filter */}
                <div>
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5">Category</div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={cn(
                        'px-2 py-1 text-[10px] rounded transition-colors',
                        selectedCategory === 'all'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-transparent hover:text-slate-300'
                      )}
                    >
                      All
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key as TemplateCategory)}
                        className={cn(
                          'px-2 py-1 text-[10px] rounded transition-colors',
                          selectedCategory === key
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border border-transparent hover:text-slate-300'
                        )}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5">Sort By</div>
                  <div className="flex gap-1">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as TemplateSearchOptions['sortBy'])}
                        className={cn(
                          'px-2 py-1 text-[10px] rounded transition-colors',
                          sortBy === option.value
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border border-transparent hover:text-slate-300'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Featured Section */}
        {featuredTemplates.length > 0 && !searchQuery && selectedCategory === 'all' && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Featured Templates</span>
            </div>
            <div className="space-y-2">
              {featuredTemplates.map((template) => renderTemplateCard(template, true))}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">
              {templates.length} template{templates.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className="space-y-2">
            {templates.map((template) => renderTemplateCard(template))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-8">
              <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No templates found</p>
              <p className="text-xs text-slate-600 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
