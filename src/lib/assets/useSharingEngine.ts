/**
 * React hooks for the SharingEngine cross-project sharing system
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SharingEngine,
  SharedAssetLink,
  SharedCollection,
  SharingStats,
  ProjectAssetPermission,
} from './SharingEngine';

/**
 * Hook to share assets with projects
 */
export function useAssetSharing() {
  const shareAsset = useCallback(
    (
      assetId: string,
      sourceProjectId: string,
      targetProjectId: string,
      linkedBy?: string
    ) => {
      return SharingEngine.shareAsset(assetId, sourceProjectId, targetProjectId, linkedBy);
    },
    []
  );

  const shareAssets = useCallback(
    (
      assetIds: string[],
      sourceProjectId: string,
      targetProjectId: string,
      linkedBy?: string
    ) => {
      return SharingEngine.shareAssets(assetIds, sourceProjectId, targetProjectId, linkedBy);
    },
    []
  );

  const unshareAsset = useCallback(
    (assetId: string, sourceProjectId: string, targetProjectId: string) => {
      return SharingEngine.unshareAsset(assetId, sourceProjectId, targetProjectId);
    },
    []
  );

  const unshareAllFromProject = useCallback(
    (sourceProjectId: string, targetProjectId: string) => {
      return SharingEngine.unshareAllFromProject(sourceProjectId, targetProjectId);
    },
    []
  );

  return { shareAsset, shareAssets, unshareAsset, unshareAllFromProject };
}

/**
 * Hook to get shared assets for a project
 */
export function useProjectSharedAssets(projectId: string | null): {
  sharedByMe: SharedAssetLink[];
  sharedWithMe: SharedAssetLink[];
  isLoading: boolean;
} {
  const [sharedByMe, setSharedByMe] = useState<SharedAssetLink[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedAssetLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setSharedByMe([]);
      setSharedWithMe([]);
      setIsLoading(false);
      return;
    }

    const updateData = () => {
      setIsLoading(true);
      const data = SharingEngine.getProjectSharedAssets(projectId);
      setSharedByMe(data.sharedByMe);
      setSharedWithMe(data.sharedWithMe);
      setIsLoading(false);
    };

    updateData();
    const unsubscribe = SharingEngine.subscribe(updateData);
    return unsubscribe;
  }, [projectId]);

  return { sharedByMe, sharedWithMe, isLoading };
}

/**
 * Hook to get sharing info for a specific asset
 */
export function useAssetSharingInfo(assetId: string | null): SharedAssetLink[] {
  const [links, setLinks] = useState<SharedAssetLink[]>([]);

  useEffect(() => {
    if (!assetId) {
      setLinks([]);
      return;
    }

    const updateLinks = () => {
      setLinks(SharingEngine.getAssetSharingInfo(assetId));
    };

    updateLinks();
    const unsubscribe = SharingEngine.subscribe(updateLinks);
    return unsubscribe;
  }, [assetId]);

  return links;
}

/**
 * Hook to check if asset is shared with a project
 */
export function useIsAssetShared(assetId: string | null, targetProjectId: string | null): boolean {
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (!assetId || !targetProjectId) {
      setIsShared(false);
      return;
    }

    const checkShared = () => {
      setIsShared(SharingEngine.isAssetSharedWith(assetId, targetProjectId));
    };

    checkShared();
    const unsubscribe = SharingEngine.subscribe(checkShared);
    return unsubscribe;
  }, [assetId, targetProjectId]);

  return isShared;
}

/**
 * Hook to share collections
 */
export function useCollectionSharing() {
  const shareCollection = useCallback(
    (
      collectionId: string,
      sourceProjectId: string,
      targetProjectIds: string[],
      permissions?: Partial<ProjectAssetPermission>
    ) => {
      return SharingEngine.shareCollection(
        collectionId,
        sourceProjectId,
        targetProjectIds,
        permissions
      );
    },
    []
  );

  const unshareCollection = useCallback(
    (collectionId: string, targetProjectIds: string[]) => {
      return SharingEngine.unshareCollection(collectionId, targetProjectIds);
    },
    []
  );

  return { shareCollection, unshareCollection };
}

/**
 * Hook to get shared collection info
 */
export function useSharedCollectionInfo(collectionId: string | null): SharedCollection | null {
  const [shared, setShared] = useState<SharedCollection | null>(null);

  useEffect(() => {
    if (!collectionId) {
      setShared(null);
      return;
    }

    const updateShared = () => {
      setShared(SharingEngine.getSharedCollection(collectionId) || null);
    };

    updateShared();
    const unsubscribe = SharingEngine.subscribe(updateShared);
    return unsubscribe;
  }, [collectionId]);

  return shared;
}

/**
 * Hook to get collections shared with a project
 */
export function useCollectionsSharedWithProject(projectId: string | null): SharedCollection[] {
  const [collections, setCollections] = useState<SharedCollection[]>([]);

  useEffect(() => {
    if (!projectId) {
      setCollections([]);
      return;
    }

    const updateCollections = () => {
      setCollections(SharingEngine.getCollectionsSharedWithProject(projectId));
    };

    updateCollections();
    const unsubscribe = SharingEngine.subscribe(updateCollections);
    return unsubscribe;
  }, [projectId]);

  return collections;
}

/**
 * Hook to get sharing stats for a project
 */
export function useSharingStats(projectId: string | null): SharingStats | null {
  const [stats, setStats] = useState<SharingStats | null>(null);

  useEffect(() => {
    if (!projectId) {
      setStats(null);
      return;
    }

    const updateStats = () => {
      setStats(SharingEngine.getProjectStats(projectId));
    };

    updateStats();
    const unsubscribe = SharingEngine.subscribe(updateStats);
    return unsubscribe;
  }, [projectId]);

  return stats;
}

/**
 * Hook to get all linked projects
 */
export function useLinkedProjects(): string[] {
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    const updateProjects = () => {
      setProjects(SharingEngine.getAllLinkedProjects());
    };

    updateProjects();
    const unsubscribe = SharingEngine.subscribe(updateProjects);
    return unsubscribe;
  }, []);

  return projects;
}

/**
 * Hook to manage collection permissions
 */
export function useCollectionPermission(
  collectionId: string | null,
  projectId: string | null
): {
  permission: ProjectAssetPermission | null;
  updatePermission: (updates: Partial<Omit<ProjectAssetPermission, 'projectId'>>) => boolean;
} {
  const [permission, setPermission] = useState<ProjectAssetPermission | null>(null);

  useEffect(() => {
    if (!collectionId || !projectId) {
      setPermission(null);
      return;
    }

    const updatePermission = () => {
      setPermission(SharingEngine.getCollectionPermission(collectionId, projectId));
    };

    updatePermission();
    const unsubscribe = SharingEngine.subscribe(updatePermission);
    return unsubscribe;
  }, [collectionId, projectId]);

  const update = useCallback(
    (updates: Partial<Omit<ProjectAssetPermission, 'projectId'>>) => {
      if (!collectionId || !projectId) return false;
      return SharingEngine.updateCollectionPermission(collectionId, projectId, updates);
    },
    [collectionId, projectId]
  );

  return { permission, updatePermission: update };
}
