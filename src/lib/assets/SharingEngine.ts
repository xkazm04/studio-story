/**
 * SharingEngine - Cross-project asset sharing and linking system
 *
 * Enables soft linking of assets between projects, maintaining
 * reference integrity while allowing flexible sharing.
 */

export interface SharedAssetLink {
  id: string;
  assetId: string;
  sourceProjectId: string;
  targetProjectId: string;
  linkedAt: number;
  linkedBy?: string;
}

export interface ProjectAssetPermission {
  projectId: string;
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
}

export interface SharedCollection {
  collectionId: string;
  sourceProjectId: string;
  sharedWithProjects: string[];
  sharedAt: number;
  permissions: ProjectAssetPermission[];
}

export interface SharingStats {
  totalSharedAssets: number;
  totalSharedCollections: number;
  projectsSharedWith: number;
  projectsSharedFrom: number;
}

const STORAGE_KEY_LINKS = 'story-asset-links';
const STORAGE_KEY_SHARED_COLLECTIONS = 'story-shared-collections';

class SharingEngineImpl {
  private assetLinks: Map<string, SharedAssetLink> = new Map();
  private sharedCollections: Map<string, SharedCollection> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const savedLinks = localStorage.getItem(STORAGE_KEY_LINKS);
      if (savedLinks) {
        const parsed = JSON.parse(savedLinks);
        this.assetLinks = new Map(Object.entries(parsed));
      }

      const savedCollections = localStorage.getItem(STORAGE_KEY_SHARED_COLLECTIONS);
      if (savedCollections) {
        const parsed = JSON.parse(savedCollections);
        this.sharedCollections = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load sharing data:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const linksObj = Object.fromEntries(this.assetLinks);
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(linksObj));

      const collectionsObj = Object.fromEntries(this.sharedCollections);
      localStorage.setItem(STORAGE_KEY_SHARED_COLLECTIONS, JSON.stringify(collectionsObj));
    } catch (error) {
      console.warn('Failed to save sharing data:', error);
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLinkId(assetId: string, sourceProjectId: string, targetProjectId: string): string {
    return `${assetId}:${sourceProjectId}:${targetProjectId}`;
  }

  // ============ Asset Sharing ============

  /**
   * Share an asset with another project (soft link)
   */
  shareAsset(
    assetId: string,
    sourceProjectId: string,
    targetProjectId: string,
    linkedBy?: string
  ): SharedAssetLink {
    const id = this.generateLinkId(assetId, sourceProjectId, targetProjectId);

    // Check if already shared
    if (this.assetLinks.has(id)) {
      return this.assetLinks.get(id)!;
    }

    const link: SharedAssetLink = {
      id,
      assetId,
      sourceProjectId,
      targetProjectId,
      linkedAt: Date.now(),
      linkedBy,
    };

    this.assetLinks.set(id, link);
    this.saveToStorage();
    this.notify();

    return link;
  }

  /**
   * Batch share multiple assets
   */
  shareAssets(
    assetIds: string[],
    sourceProjectId: string,
    targetProjectId: string,
    linkedBy?: string
  ): SharedAssetLink[] {
    const links: SharedAssetLink[] = [];

    assetIds.forEach(assetId => {
      const link = this.shareAsset(assetId, sourceProjectId, targetProjectId, linkedBy);
      links.push(link);
    });

    return links;
  }

  /**
   * Unshare an asset from a project
   */
  unshareAsset(assetId: string, sourceProjectId: string, targetProjectId: string): boolean {
    const id = this.generateLinkId(assetId, sourceProjectId, targetProjectId);

    if (!this.assetLinks.has(id)) return false;

    this.assetLinks.delete(id);
    this.saveToStorage();
    this.notify();

    return true;
  }

  /**
   * Unshare all assets from a specific target project
   */
  unshareAllFromProject(sourceProjectId: string, targetProjectId: string): number {
    let count = 0;

    for (const [id, link] of this.assetLinks.entries()) {
      if (link.sourceProjectId === sourceProjectId && link.targetProjectId === targetProjectId) {
        this.assetLinks.delete(id);
        count++;
      }
    }

    if (count > 0) {
      this.saveToStorage();
      this.notify();
    }

    return count;
  }

  /**
   * Get all shared assets for a project (both owned and shared with)
   */
  getProjectSharedAssets(projectId: string): {
    sharedByMe: SharedAssetLink[];
    sharedWithMe: SharedAssetLink[];
  } {
    const sharedByMe: SharedAssetLink[] = [];
    const sharedWithMe: SharedAssetLink[] = [];

    this.assetLinks.forEach(link => {
      if (link.sourceProjectId === projectId) {
        sharedByMe.push(link);
      }
      if (link.targetProjectId === projectId) {
        sharedWithMe.push(link);
      }
    });

    return { sharedByMe, sharedWithMe };
  }

  /**
   * Get all projects an asset is shared with
   */
  getAssetSharingInfo(assetId: string): SharedAssetLink[] {
    const links: SharedAssetLink[] = [];

    this.assetLinks.forEach(link => {
      if (link.assetId === assetId) {
        links.push(link);
      }
    });

    return links;
  }

  /**
   * Check if asset is shared with a project
   */
  isAssetSharedWith(assetId: string, targetProjectId: string): boolean {
    for (const link of this.assetLinks.values()) {
      if (link.assetId === assetId && link.targetProjectId === targetProjectId) {
        return true;
      }
    }
    return false;
  }

  // ============ Collection Sharing ============

  /**
   * Share a collection with projects
   */
  shareCollection(
    collectionId: string,
    sourceProjectId: string,
    targetProjectIds: string[],
    permissions?: Partial<ProjectAssetPermission>
  ): SharedCollection {
    const existing = this.sharedCollections.get(collectionId);

    const defaultPermission: ProjectAssetPermission = {
      projectId: '',
      canView: true,
      canEdit: permissions?.canEdit ?? false,
      canShare: permissions?.canShare ?? false,
    };

    const shared: SharedCollection = existing
      ? {
          ...existing,
          sharedWithProjects: [...new Set([...existing.sharedWithProjects, ...targetProjectIds])],
          permissions: [
            ...existing.permissions,
            ...targetProjectIds.map(projectId => ({
              ...defaultPermission,
              projectId,
            })),
          ],
        }
      : {
          collectionId,
          sourceProjectId,
          sharedWithProjects: targetProjectIds,
          sharedAt: Date.now(),
          permissions: targetProjectIds.map(projectId => ({
            ...defaultPermission,
            projectId,
          })),
        };

    this.sharedCollections.set(collectionId, shared);
    this.saveToStorage();
    this.notify();

    return shared;
  }

  /**
   * Unshare collection from projects
   */
  unshareCollection(collectionId: string, targetProjectIds: string[]): boolean {
    const shared = this.sharedCollections.get(collectionId);
    if (!shared) return false;

    shared.sharedWithProjects = shared.sharedWithProjects.filter(
      id => !targetProjectIds.includes(id)
    );
    shared.permissions = shared.permissions.filter(
      p => !targetProjectIds.includes(p.projectId)
    );

    if (shared.sharedWithProjects.length === 0) {
      this.sharedCollections.delete(collectionId);
    }

    this.saveToStorage();
    this.notify();

    return true;
  }

  /**
   * Get shared collection info
   */
  getSharedCollection(collectionId: string): SharedCollection | undefined {
    return this.sharedCollections.get(collectionId);
  }

  /**
   * Get all collections shared with a project
   */
  getCollectionsSharedWithProject(projectId: string): SharedCollection[] {
    return Array.from(this.sharedCollections.values()).filter(sc =>
      sc.sharedWithProjects.includes(projectId)
    );
  }

  /**
   * Get permission for a project on a collection
   */
  getCollectionPermission(
    collectionId: string,
    projectId: string
  ): ProjectAssetPermission | null {
    const shared = this.sharedCollections.get(collectionId);
    if (!shared) return null;

    return shared.permissions.find(p => p.projectId === projectId) || null;
  }

  /**
   * Update collection permission
   */
  updateCollectionPermission(
    collectionId: string,
    projectId: string,
    updates: Partial<Omit<ProjectAssetPermission, 'projectId'>>
  ): boolean {
    const shared = this.sharedCollections.get(collectionId);
    if (!shared) return false;

    const permIndex = shared.permissions.findIndex(p => p.projectId === projectId);
    if (permIndex === -1) return false;

    shared.permissions[permIndex] = {
      ...shared.permissions[permIndex],
      ...updates,
    };

    this.saveToStorage();
    this.notify();

    return true;
  }

  // ============ Statistics ============

  /**
   * Get sharing statistics for a project
   */
  getProjectStats(projectId: string): SharingStats {
    const { sharedByMe, sharedWithMe } = this.getProjectSharedAssets(projectId);

    const projectsSharedWith = new Set(sharedByMe.map(l => l.targetProjectId));
    const projectsSharedFrom = new Set(sharedWithMe.map(l => l.sourceProjectId));

    const sharedCollectionsByMe = Array.from(this.sharedCollections.values()).filter(
      sc => sc.sourceProjectId === projectId
    );

    const sharedCollectionsWithMe = this.getCollectionsSharedWithProject(projectId);

    return {
      totalSharedAssets: sharedByMe.length + sharedWithMe.length,
      totalSharedCollections: sharedCollectionsByMe.length + sharedCollectionsWithMe.length,
      projectsSharedWith: projectsSharedWith.size,
      projectsSharedFrom: projectsSharedFrom.size,
    };
  }

  /**
   * Get all linked project IDs
   */
  getAllLinkedProjects(): string[] {
    const projectIds = new Set<string>();

    this.assetLinks.forEach(link => {
      projectIds.add(link.sourceProjectId);
      projectIds.add(link.targetProjectId);
    });

    this.sharedCollections.forEach(sc => {
      projectIds.add(sc.sourceProjectId);
      sc.sharedWithProjects.forEach(id => projectIds.add(id));
    });

    return Array.from(projectIds);
  }

  // ============ Utilities ============

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all sharing data
   */
  clearAll(): void {
    this.assetLinks.clear();
    this.sharedCollections.clear();
    this.saveToStorage();
    this.notify();
  }

  /**
   * Clear sharing data for a specific project
   */
  clearProjectData(projectId: string): void {
    // Remove asset links
    for (const [id, link] of this.assetLinks.entries()) {
      if (link.sourceProjectId === projectId || link.targetProjectId === projectId) {
        this.assetLinks.delete(id);
      }
    }

    // Remove collection shares
    for (const [collectionId, shared] of this.sharedCollections.entries()) {
      if (shared.sourceProjectId === projectId) {
        this.sharedCollections.delete(collectionId);
      } else if (shared.sharedWithProjects.includes(projectId)) {
        shared.sharedWithProjects = shared.sharedWithProjects.filter(id => id !== projectId);
        shared.permissions = shared.permissions.filter(p => p.projectId !== projectId);

        if (shared.sharedWithProjects.length === 0) {
          this.sharedCollections.delete(collectionId);
        }
      }
    }

    this.saveToStorage();
    this.notify();
  }
}

// Singleton instance
export const SharingEngine = new SharingEngineImpl();

export type { SharingEngineImpl };
