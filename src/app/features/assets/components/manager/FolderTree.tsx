'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  FolderPlus,
  X,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useFolders, useCollections, Folder as FolderType, Collection } from '@/lib/assets';
import { IconButton } from '@/app/components/UI/Button';

interface FolderTreeProps {
  onSelectCollection?: (collection: Collection) => void;
  onSelectFolder?: (folder: FolderType) => void;
  selectedCollectionId?: string | null;
  selectedFolderId?: string | null;
  className?: string;
}

interface TreeNodeProps {
  folder: FolderType & { childFolders: FolderType[]; collections: Collection[] };
  level: number;
  selectedCollectionId?: string | null;
  selectedFolderId?: string | null;
  onSelectCollection?: (collection: Collection) => void;
  onSelectFolder?: (folder: FolderType) => void;
  onToggleExpand: (folderId: string) => void;
  onRename: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
}

const colorMap: Record<string, string> = {
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
  yellow: 'text-yellow-400',
  green: 'text-green-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
};

function TreeNode({
  folder,
  level,
  selectedCollectionId,
  selectedFolderId,
  onSelectCollection,
  onSelectFolder,
  onToggleExpand,
  onRename,
  onDelete,
  onCreateSubfolder,
}: TreeNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const hasChildren = folder.childFolders.length > 0 || folder.collections.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== folder.name) {
      onRename(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(folder.name);
    setIsEditing(false);
  };

  return (
    <div className="select-none">
      {/* Folder row */}
      <div
        className={clsx(
          'group flex items-center gap-1 py-1 px-2 rounded-md transition-colors',
          isSelected
            ? 'bg-cyan-500/10 text-cyan-400'
            : 'hover:bg-slate-800/50 text-slate-300'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={() => onToggleExpand(folder.id)}
          className={clsx(
            'p-0.5 rounded transition-transform',
            !hasChildren && 'invisible'
          )}
        >
          <ChevronRight
            className={clsx(
              'w-3.5 h-3.5 transition-transform',
              folder.isExpanded && 'rotate-90'
            )}
          />
        </button>

        {/* Folder icon */}
        {folder.isExpanded ? (
          <FolderOpen className={clsx('w-4 h-4', colorMap[folder.color || 'cyan'])} />
        ) : (
          <Folder className={clsx('w-4 h-4', colorMap[folder.color || 'cyan'])} />
        )}

        {/* Name */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="flex-1 px-1 py-0.5 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <IconButton
              icon={<Check className="w-3 h-3" />}
              size="xs"
              variant="ghost"
              onClick={handleSaveEdit}
              aria-label="Save"
              className="text-green-400"
            />
            <IconButton
              icon={<X className="w-3 h-3" />}
              size="xs"
              variant="ghost"
              onClick={handleCancelEdit}
              aria-label="Cancel"
            />
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelectFolder?.(folder)}
              className="flex-1 text-left text-sm truncate"
            >
              {folder.name}
            </button>

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
              <IconButton
                icon={<MoreHorizontal className="w-3.5 h-3.5" />}
                size="xs"
                variant="ghost"
                onClick={() => setShowContextMenu(!showContextMenu)}
                aria-label="More options"
              />

              {/* Context menu */}
              <AnimatePresence>
                {showContextMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowContextMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onCreateSubfolder(folder.id);
                        setShowContextMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      New Subfolder
                    </button>
                    <div className="border-t border-slate-700 my-1" />
                    <button
                      onClick={() => {
                        onDelete(folder.id);
                        setShowContextMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {folder.isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Subfolders */}
            {folder.childFolders.map(childFolder => (
              <TreeNode
                key={childFolder.id}
                folder={childFolder as FolderType & { childFolders: FolderType[]; collections: Collection[] }}
                level={level + 1}
                selectedCollectionId={selectedCollectionId}
                selectedFolderId={selectedFolderId}
                onSelectCollection={onSelectCollection}
                onSelectFolder={onSelectFolder}
                onToggleExpand={onToggleExpand}
                onRename={onRename}
                onDelete={onDelete}
                onCreateSubfolder={onCreateSubfolder}
              />
            ))}

            {/* Collections in folder */}
            {folder.collections.map(collection => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection?.(collection)}
                className={clsx(
                  'w-full flex items-center gap-2 py-1 px-2 rounded-md transition-colors text-left',
                  selectedCollectionId === collection.id
                    ? 'bg-green-500/10 text-green-400'
                    : 'hover:bg-slate-800/50 text-slate-400'
                )}
                style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
              >
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    collection.color === 'cyan' && 'bg-cyan-400',
                    collection.color === 'purple' && 'bg-purple-400',
                    collection.color === 'amber' && 'bg-amber-400',
                    collection.color === 'yellow' && 'bg-yellow-400',
                    collection.color === 'green' && 'bg-green-400',
                    collection.color === 'red' && 'bg-red-400',
                    collection.color === 'blue' && 'bg-blue-400',
                    !collection.color && 'bg-cyan-400'
                  )}
                />
                <span className="text-sm truncate">{collection.name}</span>
                <span className="text-xs opacity-50 ml-auto">
                  {collection.assetIds.length}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * FolderTree - Nested folder hierarchy component
 *
 * Displays a hierarchical tree structure for folders and collections
 * with drag-drop support and inline editing.
 */
export function FolderTree({
  onSelectCollection,
  onSelectFolder,
  selectedCollectionId,
  selectedFolderId,
  className,
}: FolderTreeProps) {
  const {
    folderTree,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleExpanded,
  } = useFolders();

  const { collections } = useCollections();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentIdForNew, setParentIdForNew] = useState<string | undefined>();

  // Get root-level collections (not in any folder)
  const rootCollections = collections.filter(c => !c.parentId);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), { parentId: parentIdForNew });
      setNewFolderName('');
      setIsCreating(false);
      setParentIdForNew(undefined);
    }
  };

  const handleRename = useCallback(
    (folderId: string, name: string) => {
      updateFolder(folderId, { name });
    },
    [updateFolder]
  );

  const handleDelete = useCallback(
    (folderId: string) => {
      deleteFolder(folderId);
    },
    [deleteFolder]
  );

  const handleCreateSubfolder = useCallback((parentId: string) => {
    setParentIdForNew(parentId);
    setIsCreating(true);
  }, []);

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Folders
        </span>
        <IconButton
          icon={<Plus className="w-4 h-4" />}
          size="xs"
          variant="ghost"
          onClick={() => {
            setParentIdForNew(undefined);
            setIsCreating(true);
          }}
          aria-label="New folder"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-2">
        {/* New folder input */}
        {isCreating && (
          <div className="flex items-center gap-1 px-3 py-1">
            <Folder className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
              placeholder="New folder..."
              className="flex-1 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <IconButton
              icon={<Check className="w-3 h-3" />}
              size="xs"
              variant="ghost"
              onClick={handleCreateFolder}
              aria-label="Create"
              className="text-green-400"
            />
            <IconButton
              icon={<X className="w-3 h-3" />}
              size="xs"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
              }}
              aria-label="Cancel"
            />
          </div>
        )}

        {/* Folder tree */}
        {folderTree.map(folder => (
          <TreeNode
            key={folder.id}
            folder={folder}
            level={0}
            selectedCollectionId={selectedCollectionId}
            selectedFolderId={selectedFolderId}
            onSelectCollection={onSelectCollection}
            onSelectFolder={onSelectFolder}
            onToggleExpand={toggleExpanded}
            onRename={handleRename}
            onDelete={handleDelete}
            onCreateSubfolder={handleCreateSubfolder}
          />
        ))}

        {/* Root collections */}
        {rootCollections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/50">
            <span className="px-3 text-xs text-slate-500">Uncategorized</span>
            {rootCollections.map(collection => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection?.(collection)}
                className={clsx(
                  'w-full flex items-center gap-2 py-1 px-3 rounded-md transition-colors text-left',
                  selectedCollectionId === collection.id
                    ? 'bg-green-500/10 text-green-400'
                    : 'hover:bg-slate-800/50 text-slate-400'
                )}
              >
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    collection.color === 'cyan' && 'bg-cyan-400',
                    collection.color === 'purple' && 'bg-purple-400',
                    collection.color === 'amber' && 'bg-amber-400',
                    collection.color === 'yellow' && 'bg-yellow-400',
                    collection.color === 'green' && 'bg-green-400',
                    collection.color === 'red' && 'bg-red-400',
                    collection.color === 'blue' && 'bg-blue-400',
                    !collection.color && 'bg-cyan-400'
                  )}
                />
                <span className="text-sm truncate">{collection.name}</span>
                <span className="text-xs opacity-50 ml-auto">
                  {collection.assetIds.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {folderTree.length === 0 && rootCollections.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Folder className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No folders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderTree;
