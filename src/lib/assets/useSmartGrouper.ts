/**
 * React hooks for the SmartGrouper collection system
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SmartGrouper,
  SmartGroup,
  Collection,
  Folder,
  CollectionTemplate,
  GroupingStrategy,
} from './SmartGrouper';
import type { Asset } from '@/app/types/Asset';

/**
 * Hook to get smart groups for assets
 */
export function useSmartGroups(
  assets: Asset[] | undefined,
  strategy: GroupingStrategy = 'smart'
): SmartGroup[] {
  const [groups, setGroups] = useState<SmartGroup[]>([]);

  useEffect(() => {
    if (!assets || assets.length === 0) {
      setGroups([]);
      return;
    }

    const generated = SmartGrouper.generateSmartGroups(assets, strategy);
    setGroups(generated);
  }, [assets, strategy]);

  return groups;
}

/**
 * Hook to manage collections
 */
export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const updateCollections = () => {
      setCollections(SmartGrouper.getAllCollections());
    };

    updateCollections();
    const unsubscribe = SmartGrouper.subscribe(updateCollections);
    return unsubscribe;
  }, []);

  const createCollection = useCallback(
    (
      name: string,
      options?: {
        description?: string;
        icon?: string;
        color?: string;
        parentId?: string;
        assetIds?: string[];
      }
    ) => {
      return SmartGrouper.createCollection(name, options);
    },
    []
  );

  const updateCollection = useCallback(
    (collectionId: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>) => {
      return SmartGrouper.updateCollection(collectionId, updates);
    },
    []
  );

  const deleteCollection = useCallback((collectionId: string) => {
    return SmartGrouper.deleteCollection(collectionId);
  }, []);

  const addToCollection = useCallback((collectionId: string, assetIds: string[]) => {
    return SmartGrouper.addToCollection(collectionId, assetIds);
  }, []);

  const removeFromCollection = useCallback((collectionId: string, assetIds: string[]) => {
    return SmartGrouper.removeFromCollection(collectionId, assetIds);
  }, []);

  return {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollection: SmartGrouper.getCollection.bind(SmartGrouper),
  };
}

/**
 * Hook to get collection templates
 */
export function useCollectionTemplates(): CollectionTemplate[] {
  return useMemo(() => SmartGrouper.getTemplates(), []);
}

/**
 * Hook to create collection from template
 */
export function useCreateFromTemplate() {
  return useCallback((templateId: string, assets: Asset[], customName?: string) => {
    return SmartGrouper.createFromTemplate(templateId, assets, customName);
  }, []);
}

/**
 * Hook to manage folders
 */
export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<
    Array<Folder & { childFolders: Folder[]; collections: Collection[] }>
  >([]);

  useEffect(() => {
    const updateFolders = () => {
      setFolders(SmartGrouper.getRootFolders());
      setFolderTree(SmartGrouper.getFolderTree());
    };

    updateFolders();
    const unsubscribe = SmartGrouper.subscribe(updateFolders);
    return unsubscribe;
  }, []);

  const createFolder = useCallback(
    (name: string, options?: { parentId?: string; color?: string }) => {
      return SmartGrouper.createFolder(name, options);
    },
    []
  );

  const updateFolder = useCallback(
    (folderId: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => {
      return SmartGrouper.updateFolder(folderId, updates);
    },
    []
  );

  const deleteFolder = useCallback((folderId: string, deleteContents = false) => {
    return SmartGrouper.deleteFolder(folderId, deleteContents);
  }, []);

  const addCollectionToFolder = useCallback((folderId: string, collectionId: string) => {
    return SmartGrouper.addCollectionToFolder(folderId, collectionId);
  }, []);

  const toggleExpanded = useCallback((folderId: string) => {
    SmartGrouper.toggleFolderExpanded(folderId);
  }, []);

  return {
    folders,
    folderTree,
    createFolder,
    updateFolder,
    deleteFolder,
    addCollectionToFolder,
    toggleExpanded,
    getFolder: SmartGrouper.getFolder.bind(SmartGrouper),
  };
}

/**
 * Hook to share collections with projects
 */
export function useCollectionSharing(collectionId: string | null) {
  const shareWithProjects = useCallback(
    (projectIds: string[]) => {
      if (!collectionId) return false;
      return SmartGrouper.shareWithProjects(collectionId, projectIds);
    },
    [collectionId]
  );

  const unshareFromProjects = useCallback(
    (projectIds: string[]) => {
      if (!collectionId) return false;
      return SmartGrouper.unshareFromProjects(collectionId, projectIds);
    },
    [collectionId]
  );

  return { shareWithProjects, unshareFromProjects };
}

/**
 * Hook to get shared collections for a project
 */
export function useSharedCollections(projectId: string | null): Collection[] {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!projectId) {
      setCollections([]);
      return;
    }

    const updateCollections = () => {
      setCollections(SmartGrouper.getSharedCollections(projectId));
    };

    updateCollections();
    const unsubscribe = SmartGrouper.subscribe(updateCollections);
    return unsubscribe;
  }, [projectId]);

  return collections;
}

/**
 * Hook for collection counts
 */
export function useCollectionCounts(): { collections: number; folders: number } {
  const [counts, setCounts] = useState({ collections: 0, folders: 0 });

  useEffect(() => {
    const updateCounts = () => {
      setCounts({
        collections: SmartGrouper.getCollectionCount(),
        folders: SmartGrouper.getFolderCount(),
      });
    };

    updateCounts();
    const unsubscribe = SmartGrouper.subscribe(updateCounts);
    return unsubscribe;
  }, []);

  return counts;
}
