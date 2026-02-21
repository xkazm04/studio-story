'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Search,
  Star,
  Trash2,
  Edit2,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Copy,
  X,
  Check,
  Image,
  Users,
  Box,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  useCollections,
  useCollectionTemplates,
  useCreateFromTemplate,
  useSmartGroups,
  Collection,
  CollectionTemplate,
  GroupingStrategy,
} from '@/lib/assets';
import { Button, IconButton } from '@/app/components/UI/Button';
import { EmptyState } from '@/app/components/UI';
import type { Asset } from '@/app/types/Asset';

interface CollectionPanelProps {
  assets: Asset[];
  onSelectCollection?: (collection: Collection) => void;
  onSelectAssets?: (assetIds: string[]) => void;
  selectedCollectionId?: string | null;
  className?: string;
}

const templateIcons: Record<string, typeof Star> = {
  star: Star,
  users: Users,
  image: Image,
  box: Box,
};

const colorMap: Record<string, string> = {
  cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
  yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  green: 'bg-green-500/20 border-green-500/30 text-green-400',
  red: 'bg-red-500/20 border-red-500/30 text-red-400',
  blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
};

/**
 * CollectionPanel - Manual curation and collection management
 *
 * Displays user-created collections, allows creating from templates,
 * and provides management operations.
 */
export function CollectionPanel({
  assets,
  onSelectCollection,
  onSelectAssets,
  selectedCollectionId,
  className,
}: CollectionPanelProps) {
  const {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
  } = useCollections();

  const templates = useCollectionTemplates();
  const createFromTemplate = useCreateFromTemplate();
  const smartGroups = useSmartGroups(assets, 'smart');

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'collections' | 'smart'>('collections');

  // New collection form
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('cyan');

  // Filter collections
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const query = searchQuery.toLowerCase();
    return collections.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [collections, searchQuery]);

  // Filter smart groups
  const filteredSmartGroups = useMemo(() => {
    if (!searchQuery.trim()) return smartGroups;
    const query = searchQuery.toLowerCase();
    return smartGroups.filter(g => g.name.toLowerCase().includes(query));
  }, [smartGroups, searchQuery]);

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    createCollection(newCollectionName.trim(), {
      color: newCollectionColor,
    });

    setNewCollectionName('');
    setNewCollectionColor('cyan');
    setShowCreateModal(false);
  };

  const handleCreateFromTemplate = (template: CollectionTemplate) => {
    const collection = createFromTemplate(template.id, assets);
    if (collection) {
      setShowTemplates(false);
      onSelectCollection?.(collection);
    }
  };

  const handleStartEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setEditName(collection.name);
    setContextMenuId(null);
  };

  const handleSaveEdit = (collectionId: string) => {
    if (editName.trim()) {
      updateCollection(collectionId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (collectionId: string) => {
    deleteCollection(collectionId);
    setContextMenuId(null);
    if (selectedCollectionId === collectionId) {
      onSelectCollection?.(undefined as unknown as Collection);
    }
  };

  const handleSelectCollection = (collection: Collection) => {
    onSelectCollection?.(collection);
    if (onSelectAssets) {
      onSelectAssets(collection.assetIds);
    }
  };

  const handleSelectSmartGroup = (assetIds: string[]) => {
    onSelectAssets?.(assetIds);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx('flex flex-col h-full', className)}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/30">
              <FolderOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-100">Collections</h2>
              <p className="text-xs text-slate-400">
                {collections.length} collection{collections.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <IconButton
              icon={<Sparkles className="w-4 h-4" />}
              size="sm"
              variant="ghost"
              onClick={() => setShowTemplates(true)}
              aria-label="Create from template"
              title="Create from template"
            />
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              New
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-slate-800/50 border border-slate-700/50',
              'text-sm text-slate-100 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
            )}
          />
        </div>

        {/* View toggle */}
        <div className="flex gap-1 mt-3 p-1 bg-slate-900/40 rounded-lg border border-slate-800/50">
          <button
            onClick={() => setActiveView('collections')}
            className={clsx(
              'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeView === 'collections'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            My Collections
          </button>
          <button
            onClick={() => setActiveView('smart')}
            className={clsx(
              'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeView === 'smart'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Smart Groups
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeView === 'collections' && (
          <>
            {filteredCollections.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                title={collections.length === 0 ? 'No collections yet' : 'No matches found'}
                subtitle={collections.length === 0 ? 'Create a collection to organize your assets' : 'Try a different search term'}
                action={collections.length === 0 ? { label: "Create Collection", onClick: () => setShowCreateModal(true), icon: <Plus /> } : undefined}
                variant="compact"
              />
            ) : (
              <div className="space-y-2">
                {filteredCollections.map(collection => (
                  <div
                    key={collection.id}
                    className={clsx(
                      'relative group rounded-lg border transition-colors',
                      selectedCollectionId === collection.id
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                    )}
                  >
                    {editingId === collection.id ? (
                      <div className="flex items-center gap-2 p-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(collection.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          autoFocus
                        />
                        <IconButton
                          icon={<Check className="w-4 h-4" />}
                          size="xs"
                          variant="ghost"
                          onClick={() => handleSaveEdit(collection.id)}
                          aria-label="Save"
                          className="text-green-400"
                        />
                        <IconButton
                          icon={<X className="w-4 h-4" />}
                          size="xs"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          aria-label="Cancel"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectCollection(collection)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div
                          className={clsx(
                            'p-2 rounded-lg border',
                            colorMap[collection.color || 'cyan']
                          )}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {collection.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {collection.assetIds.length} asset
                            {collection.assetIds.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}

                    {/* Context menu trigger */}
                    {editingId !== collection.id && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton
                          icon={<MoreHorizontal className="w-4 h-4" />}
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuId(
                              contextMenuId === collection.id ? null : collection.id
                            );
                          }}
                          aria-label="More options"
                        />

                        {/* Context menu */}
                        <AnimatePresence>
                          {contextMenuId === collection.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleStartEdit(collection)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
                              >
                                <Edit2 className="w-4 h-4" />
                                Rename
                              </button>
                              <button
                                onClick={() => setContextMenuId(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => setContextMenuId(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
                              >
                                <Share2 className="w-4 h-4" />
                                Share
                              </button>
                              <div className="border-t border-slate-700 my-1" />
                              <button
                                onClick={() => handleDelete(collection.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700/50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeView === 'smart' && (
          <>
            {filteredSmartGroups.length === 0 ? (
              <EmptyState
                icon={<Sparkles />}
                title="No smart groups"
                subtitle="Smart groups are auto-generated from your assets"
                variant="compact"
              />
            ) : (
              <div className="space-y-2">
                {filteredSmartGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectSmartGroup(group.assetIds)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-purple-500/30 transition-colors text-left"
                  >
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.assetCount} asset{group.assetCount !== 1 ? 's' : ''} •
                        Auto-grouped
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 mx-4 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Create New Collection
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="My Collection"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Color</label>
                  <div className="flex gap-2">
                    {Object.keys(colorMap).map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCollectionColor(color)}
                        className={clsx(
                          'w-8 h-8 rounded-full border-2 transition-transform',
                          color === 'cyan' && 'bg-cyan-500',
                          color === 'purple' && 'bg-purple-500',
                          color === 'amber' && 'bg-amber-500',
                          color === 'yellow' && 'bg-yellow-500',
                          color === 'green' && 'bg-green-500',
                          color === 'red' && 'bg-red-500',
                          color === 'blue' && 'bg-blue-500',
                          newCollectionColor === color
                            ? 'border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                >
                  Create Collection
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg p-6 mx-4 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  Create from Template
                </h3>
                <IconButton
                  icon={<X className="w-5 h-5" />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowTemplates(false)}
                  aria-label="Close"
                />
              </div>

              <p className="text-sm text-slate-400 mb-4">
                Choose a template to quickly create a collection with matching assets.
              </p>

              <div className="space-y-2">
                {templates.map(template => {
                  const Icon = templateIcons[template.icon] || FolderOpen;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleCreateFromTemplate(template)}
                      className={clsx(
                        'w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left',
                        colorMap[template.color] || colorMap.cyan,
                        'hover:bg-opacity-30'
                      )}
                    >
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs opacity-70">{template.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CollectionPanel;
