/**
 * StyleGrouper - Visual clustering and style-based grouping
 *
 * Groups images by visual style, color palette, and other visual characteristics
 * using k-means clustering on image fingerprints.
 */

import {
  similarityEngine,
  type ImageFingerprint,
} from './SimilarityEngine';

// Types
export interface StyleGroup {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
  centroid: StyleCentroid;
  characteristics: StyleCharacteristics;
  createdAt: number;
  updatedAt: number;
}

export interface StyleCentroid {
  averageColor: string;
  brightness: number;
  aspectRatio: number;
  colorHistogram: number[];
}

export interface StyleCharacteristics {
  dominantColors: string[];
  brightnessLevel: 'dark' | 'medium' | 'bright';
  aspectCategory: 'portrait' | 'landscape' | 'square';
  colorfulness: number; // 0-1
  contrast: number; // 0-1
}

export interface ClusteringOptions {
  numClusters?: number;
  minClusterSize?: number;
  maxIterations?: number;
}

export interface StyleAnalysis {
  primaryStyle: string;
  secondaryStyles: string[];
  colorPalette: string[];
  mood: string;
  technicalNotes: string[];
}

const STORAGE_KEY = 'story-style-groups';
const DEFAULT_NUM_CLUSTERS = 5;
const MIN_CLUSTER_SIZE = 2;
const MAX_ITERATIONS = 100;

// Predefined style names based on characteristics
const STYLE_NAMES: Record<string, string[]> = {
  dark: ['Noir', 'Moody', 'Dramatic', 'Gothic', 'Shadowy'],
  bright: ['Vibrant', 'Cheerful', 'Light', 'Airy', 'Radiant'],
  warm: ['Warm', 'Cozy', 'Golden', 'Sunset', 'Amber'],
  cool: ['Cool', 'Serene', 'Icy', 'Ocean', 'Twilight'],
  neutral: ['Minimal', 'Clean', 'Classic', 'Timeless', 'Balanced'],
};

/**
 * StyleGrouper singleton class
 */
class StyleGrouper {
  private static instance: StyleGrouper;
  private styleGroups: Map<string, StyleGroup> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): StyleGrouper {
    if (!StyleGrouper.instance) {
      StyleGrouper.instance = new StyleGrouper();
    }
    return StyleGrouper.instance;
  }

  /**
   * Initialize and load persisted data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.styleGroups = new Map(Object.entries(data.styleGroups || {}));
      }
    } catch (error) {
      console.error('Failed to load style groups:', error);
    }

    this.initialized = true;
  }

  /**
   * Persist current state
   */
  private persist(): void {
    try {
      const data = {
        styleGroups: Object.fromEntries(this.styleGroups),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist style groups:', error);
    }
  }

  /**
   * Calculate centroid from fingerprints
   */
  private calculateCentroid(fingerprints: ImageFingerprint[]): StyleCentroid {
    if (fingerprints.length === 0) {
      return {
        averageColor: '#808080',
        brightness: 0.5,
        aspectRatio: 1,
        colorHistogram: [],
      };
    }

    // Average brightness and aspect ratio
    const avgBrightness = fingerprints.reduce((sum, fp) => sum + fp.brightness, 0) / fingerprints.length;
    const avgAspectRatio = fingerprints.reduce((sum, fp) => sum + fp.aspectRatio, 0) / fingerprints.length;

    // Average color histogram
    const histogramLength = fingerprints[0].colorHistogram.length;
    const avgHistogram = new Array(histogramLength).fill(0);
    for (const fp of fingerprints) {
      for (let i = 0; i < histogramLength; i++) {
        avgHistogram[i] += fp.colorHistogram[i] / fingerprints.length;
      }
    }

    // Average color (simple RGB average)
    let r = 0, g = 0, b = 0;
    for (const fp of fingerprints) {
      const color = fp.averageColor;
      r += parseInt(color.slice(1, 3), 16);
      g += parseInt(color.slice(3, 5), 16);
      b += parseInt(color.slice(5, 7), 16);
    }
    r = Math.round(r / fingerprints.length);
    g = Math.round(g / fingerprints.length);
    b = Math.round(b / fingerprints.length);
    const avgColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return {
      averageColor: avgColor,
      brightness: avgBrightness,
      aspectRatio: avgAspectRatio,
      colorHistogram: avgHistogram,
    };
  }

  /**
   * Calculate distance between fingerprint and centroid
   */
  private distanceToCentroid(fp: ImageFingerprint, centroid: StyleCentroid): number {
    // Brightness difference
    const brightnessDiff = Math.abs(fp.brightness - centroid.brightness);

    // Aspect ratio difference
    const aspectDiff = Math.abs(fp.aspectRatio - centroid.aspectRatio) / 2;

    // Color histogram difference (euclidean)
    let histogramDiff = 0;
    if (centroid.colorHistogram.length === fp.colorHistogram.length) {
      for (let i = 0; i < fp.colorHistogram.length; i++) {
        histogramDiff += Math.pow(fp.colorHistogram[i] - centroid.colorHistogram[i], 2);
      }
      histogramDiff = Math.sqrt(histogramDiff);
    }

    // Color difference
    const fpColor = fp.averageColor;
    const r1 = parseInt(fpColor.slice(1, 3), 16);
    const g1 = parseInt(fpColor.slice(3, 5), 16);
    const b1 = parseInt(fpColor.slice(5, 7), 16);
    const r2 = parseInt(centroid.averageColor.slice(1, 3), 16);
    const g2 = parseInt(centroid.averageColor.slice(3, 5), 16);
    const b2 = parseInt(centroid.averageColor.slice(5, 7), 16);
    const colorDiff = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    ) / 441.67; // Max distance in RGB space

    // Weighted combination
    return brightnessDiff * 0.2 + aspectDiff * 0.1 + histogramDiff * 0.4 + colorDiff * 0.3;
  }

  /**
   * Determine style characteristics from centroid
   */
  private analyzeCharacteristics(
    centroid: StyleCentroid,
    fingerprints: ImageFingerprint[]
  ): StyleCharacteristics {
    // Brightness level
    let brightnessLevel: 'dark' | 'medium' | 'bright';
    if (centroid.brightness < 0.35) brightnessLevel = 'dark';
    else if (centroid.brightness > 0.65) brightnessLevel = 'bright';
    else brightnessLevel = 'medium';

    // Aspect category
    let aspectCategory: 'portrait' | 'landscape' | 'square';
    if (centroid.aspectRatio < 0.9) aspectCategory = 'portrait';
    else if (centroid.aspectRatio > 1.1) aspectCategory = 'landscape';
    else aspectCategory = 'square';

    // Extract dominant colors
    const colorCounts = new Map<string, number>();
    for (const fp of fingerprints) {
      // Quantize color to reduce variations
      const color = this.quantizeColor(fp.averageColor);
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }
    const dominantColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    // Colorfulness (variance in color histogram)
    let colorfulness = 0;
    if (centroid.colorHistogram.length > 0) {
      const mean = centroid.colorHistogram.reduce((a, b) => a + b, 0) / centroid.colorHistogram.length;
      const variance = centroid.colorHistogram.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / centroid.colorHistogram.length;
      colorfulness = Math.min(1, variance * 100);
    }

    // Contrast (brightness variance)
    let contrast = 0;
    if (fingerprints.length > 1) {
      const meanBrightness = fingerprints.reduce((sum, fp) => sum + fp.brightness, 0) / fingerprints.length;
      const brightnessVariance = fingerprints.reduce(
        (sum, fp) => sum + Math.pow(fp.brightness - meanBrightness, 2),
        0
      ) / fingerprints.length;
      contrast = Math.min(1, brightnessVariance * 10);
    }

    return {
      dominantColors,
      brightnessLevel,
      aspectCategory,
      colorfulness,
      contrast,
    };
  }

  /**
   * Quantize color to reduce variations
   */
  private quantizeColor(hex: string): string {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) / 32) * 32;
    const g = Math.round(parseInt(hex.slice(3, 5), 16) / 32) * 32;
    const b = Math.round(parseInt(hex.slice(5, 7), 16) / 32) * 32;
    return `#${Math.min(255, r).toString(16).padStart(2, '0')}${Math.min(255, g).toString(16).padStart(2, '0')}${Math.min(255, b).toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate descriptive name for a style group
   */
  private generateStyleName(characteristics: StyleCharacteristics): string {
    // Determine color temperature
    const avgColor = characteristics.dominantColors[0] || '#808080';
    const r = parseInt(avgColor.slice(1, 3), 16);
    const g = parseInt(avgColor.slice(3, 5), 16);
    const b = parseInt(avgColor.slice(5, 7), 16);

    let temperature: 'warm' | 'cool' | 'neutral';
    if (r > b + 30) temperature = 'warm';
    else if (b > r + 30) temperature = 'cool';
    else temperature = 'neutral';

    // Select appropriate name based on characteristics
    const brightness = characteristics.brightnessLevel;
    const names = brightness === 'dark' ? STYLE_NAMES.dark :
                  brightness === 'bright' ? STYLE_NAMES.bright :
                  STYLE_NAMES[temperature];

    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Generate description for a style group
   */
  private generateDescription(characteristics: StyleCharacteristics): string {
    const parts: string[] = [];

    parts.push(`${characteristics.brightnessLevel.charAt(0).toUpperCase() + characteristics.brightnessLevel.slice(1)} imagery`);

    if (characteristics.colorfulness > 0.5) {
      parts.push('colorful palette');
    } else if (characteristics.colorfulness < 0.2) {
      parts.push('muted tones');
    }

    parts.push(`predominantly ${characteristics.aspectCategory} format`);

    if (characteristics.contrast > 0.5) {
      parts.push('high contrast');
    }

    return parts.join(', ');
  }

  /**
   * Perform k-means clustering on fingerprints
   */
  async clusterByStyle(options: ClusteringOptions = {}): Promise<StyleGroup[]> {
    await this.initialize();

    const {
      numClusters = DEFAULT_NUM_CLUSTERS,
      minClusterSize = MIN_CLUSTER_SIZE,
      maxIterations = MAX_ITERATIONS,
    } = options;

    const fingerprints = similarityEngine.getAllFingerprints();
    if (fingerprints.length < numClusters) {
      // Not enough images for clustering
      return [];
    }

    // Initialize centroids randomly
    const shuffled = [...fingerprints].sort(() => Math.random() - 0.5);
    let centroids: StyleCentroid[] = shuffled.slice(0, numClusters).map(fp =>
      this.calculateCentroid([fp])
    );

    let assignments: number[] = new Array(fingerprints.length).fill(-1);
    let changed = true;
    let iterations = 0;

    // K-means iteration
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Assign each fingerprint to nearest centroid
      for (let i = 0; i < fingerprints.length; i++) {
        let minDist = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < centroids.length; j++) {
          const dist = this.distanceToCentroid(fingerprints[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = j;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Update centroids
      const clusters: ImageFingerprint[][] = Array.from({ length: numClusters }, () => []);
      for (let i = 0; i < fingerprints.length; i++) {
        clusters[assignments[i]].push(fingerprints[i]);
      }

      centroids = clusters.map(cluster =>
        cluster.length > 0 ? this.calculateCentroid(cluster) : centroids[0]
      );
    }

    // Create style groups from clusters
    const clusters: ImageFingerprint[][] = Array.from({ length: numClusters }, () => []);
    for (let i = 0; i < fingerprints.length; i++) {
      clusters[assignments[i]].push(fingerprints[i]);
    }

    // Clear existing groups
    this.styleGroups.clear();

    const styleGroups: StyleGroup[] = [];
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].length < minClusterSize) continue;

      const centroid = centroids[i];
      const characteristics = this.analyzeCharacteristics(centroid, clusters[i]);

      const group: StyleGroup = {
        id: `style_${Date.now()}_${i}`,
        name: this.generateStyleName(characteristics),
        description: this.generateDescription(characteristics),
        assetIds: clusters[i].map(fp => fp.assetId),
        centroid,
        characteristics,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.styleGroups.set(group.id, group);
      styleGroups.push(group);
    }

    this.persist();
    return styleGroups;
  }

  /**
   * Get style group for an asset
   */
  getStyleGroupForAsset(assetId: string): StyleGroup | undefined {
    for (const [, group] of this.styleGroups) {
      if (group.assetIds.includes(assetId)) {
        return group;
      }
    }
    return undefined;
  }

  /**
   * Get all style groups
   */
  getAllStyleGroups(): StyleGroup[] {
    return Array.from(this.styleGroups.values());
  }

  /**
   * Get style group by ID
   */
  getStyleGroup(id: string): StyleGroup | undefined {
    return this.styleGroups.get(id);
  }

  /**
   * Analyze style of a single image
   */
  async analyzeStyle(assetId: string): Promise<StyleAnalysis | null> {
    await this.initialize();

    const fingerprint = similarityEngine.getFingerprint(assetId);
    if (!fingerprint) return null;

    // Determine characteristics
    const characteristics: StyleCharacteristics = {
      dominantColors: [fingerprint.averageColor],
      brightnessLevel: fingerprint.brightness < 0.35 ? 'dark' :
                       fingerprint.brightness > 0.65 ? 'bright' : 'medium',
      aspectCategory: fingerprint.aspectRatio < 0.9 ? 'portrait' :
                      fingerprint.aspectRatio > 1.1 ? 'landscape' : 'square',
      colorfulness: 0.5,
      contrast: 0.5,
    };

    // Extract color palette from histogram
    const colorPalette: string[] = [fingerprint.averageColor];

    // Determine mood based on brightness and color
    const r = parseInt(fingerprint.averageColor.slice(1, 3), 16);
    const g = parseInt(fingerprint.averageColor.slice(3, 5), 16);
    const b = parseInt(fingerprint.averageColor.slice(5, 7), 16);

    let mood: string;
    if (fingerprint.brightness < 0.35) {
      mood = 'Mysterious and dramatic';
    } else if (fingerprint.brightness > 0.65) {
      mood = 'Uplifting and energetic';
    } else if (r > b + 30) {
      mood = 'Warm and inviting';
    } else if (b > r + 30) {
      mood = 'Cool and calming';
    } else {
      mood = 'Balanced and neutral';
    }

    // Technical notes
    const technicalNotes: string[] = [
      `Aspect ratio: ${fingerprint.aspectRatio.toFixed(2)}`,
      `Dimensions: ${fingerprint.dimensions.width}x${fingerprint.dimensions.height}`,
      `Brightness: ${Math.round(fingerprint.brightness * 100)}%`,
    ];

    // Find primary style from existing groups
    const styleGroup = this.getStyleGroupForAsset(assetId);
    const primaryStyle = styleGroup?.name || this.generateStyleName(characteristics);

    // Find secondary styles from similar images
    const similarImages = await similarityEngine.findSimilar(assetId, { maxResults: 5 });
    const secondaryStyles: string[] = [];
    for (const match of similarImages) {
      const group = this.getStyleGroupForAsset(match.assetId);
      if (group && !secondaryStyles.includes(group.name) && group.name !== primaryStyle) {
        secondaryStyles.push(group.name);
      }
    }

    return {
      primaryStyle,
      secondaryStyles: secondaryStyles.slice(0, 3),
      colorPalette,
      mood,
      technicalNotes,
    };
  }

  /**
   * Find assets with similar style
   */
  async findSimilarStyle(assetId: string, limit = 10): Promise<string[]> {
    await this.initialize();

    const styleGroup = this.getStyleGroupForAsset(assetId);
    if (styleGroup) {
      // Return other assets from same style group
      return styleGroup.assetIds
        .filter(id => id !== assetId)
        .slice(0, limit);
    }

    // Fall back to similarity search
    const matches = await similarityEngine.findSimilar(assetId, {
      maxResults: limit,
      matchTypes: ['similar', 'style-match'],
    });

    return matches.map(m => m.assetId);
  }

  /**
   * Refresh clustering
   */
  async refresh(options?: ClusteringOptions): Promise<StyleGroup[]> {
    return this.clusterByStyle(options);
  }

  /**
   * Clear all style groups
   */
  clear(): void {
    this.styleGroups.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const styleGrouper = StyleGrouper.getInstance();

// Export class for testing
export { StyleGrouper };
