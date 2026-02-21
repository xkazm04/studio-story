/**
 * SimilarityEngine - Visual matching and duplicate detection system
 *
 * Provides image similarity search, duplicate detection, and visual matching
 * using perceptual hashing and color histogram analysis.
 */

// Types
export interface ImageFingerprint {
  id: string;
  assetId: string;
  pHash: string; // Perceptual hash
  colorHistogram: number[]; // Color distribution
  averageColor: string; // Dominant color
  dimensions: { width: number; height: number };
  aspectRatio: number;
  brightness: number;
  createdAt: number;
}

export interface SimilarityMatch {
  assetId: string;
  score: number; // 0-1, higher is more similar
  matchType: 'exact' | 'near-duplicate' | 'similar' | 'style-match';
  details: {
    hashDistance: number;
    colorSimilarity: number;
    dimensionSimilarity: number;
  };
}

export interface DuplicateResult {
  isDuplicate: boolean;
  confidence: number;
  matchType: 'exact' | 'near-duplicate' | 'none';
  existingAssetId?: string;
  existingAssetName?: string;
}

export interface SimilaritySearchOptions {
  threshold?: number; // Minimum similarity score (0-1)
  maxResults?: number;
  includeExact?: boolean;
  matchTypes?: Array<'exact' | 'near-duplicate' | 'similar' | 'style-match'>;
}

export interface RecommendationResult {
  assetId: string;
  reason: string;
  score: number;
  category: 'visual' | 'style' | 'color' | 'composition';
}

const STORAGE_KEY = 'story-similarity-index';
const DEFAULT_SIMILARITY_THRESHOLD = 0.7;
const EXACT_MATCH_THRESHOLD = 0.98;
const NEAR_DUPLICATE_THRESHOLD = 0.85;

/**
 * SimilarityEngine singleton class
 */
class SimilarityEngine {
  private static instance: SimilarityEngine;
  private fingerprints: Map<string, ImageFingerprint> = new Map();
  private assetIndex: Map<string, string> = new Map(); // assetId -> fingerprintId
  private initialized = false;

  private constructor() {}

  static getInstance(): SimilarityEngine {
    if (!SimilarityEngine.instance) {
      SimilarityEngine.instance = new SimilarityEngine();
    }
    return SimilarityEngine.instance;
  }

  /**
   * Initialize the engine and load persisted data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.fingerprints = new Map(Object.entries(data.fingerprints || {}));
        this.assetIndex = new Map(Object.entries(data.assetIndex || {}));
      }
    } catch (error) {
      console.error('Failed to load similarity index:', error);
    }

    this.initialized = true;
  }

  /**
   * Persist current state to localStorage
   */
  private persist(): void {
    try {
      const data = {
        fingerprints: Object.fromEntries(this.fingerprints),
        assetIndex: Object.fromEntries(this.assetIndex),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist similarity index:', error);
    }
  }

  /**
   * Generate a perceptual hash from image data
   * Uses a simplified dHash algorithm
   */
  private async generatePHash(imageData: ImageData): Promise<string> {
    const { width, height, data } = imageData;

    // Resize to 9x8 for dHash (difference hash)
    const resizedWidth = 9;
    const resizedHeight = 8;
    const grayscale: number[] = [];

    // Simple downsampling with grayscale conversion
    for (let y = 0; y < resizedHeight; y++) {
      for (let x = 0; x < resizedWidth; x++) {
        const srcX = Math.floor((x / resizedWidth) * width);
        const srcY = Math.floor((y / resizedHeight) * height);
        const idx = (srcY * width + srcX) * 4;

        // Convert to grayscale using luminosity method
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        grayscale.push(gray);
      }
    }

    // Generate difference hash
    let hash = '';
    for (let y = 0; y < resizedHeight; y++) {
      for (let x = 0; x < resizedWidth - 1; x++) {
        const idx = y * resizedWidth + x;
        hash += grayscale[idx] < grayscale[idx + 1] ? '1' : '0';
      }
    }

    // Convert binary to hex
    let hexHash = '';
    for (let i = 0; i < hash.length; i += 4) {
      hexHash += parseInt(hash.substring(i, i + 4), 2).toString(16);
    }

    return hexHash;
  }

  /**
   * Generate color histogram from image data
   */
  private generateColorHistogram(imageData: ImageData): number[] {
    const { data } = imageData;
    const bins = 16; // Number of bins per channel
    const histogram = new Array(bins * 3).fill(0);
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const rBin = Math.floor(data[i] / 256 * bins);
      const gBin = Math.floor(data[i + 1] / 256 * bins);
      const bBin = Math.floor(data[i + 2] / 256 * bins);

      histogram[rBin]++;
      histogram[bins + gBin]++;
      histogram[bins * 2 + bBin]++;
    }

    // Normalize
    return histogram.map(count => count / totalPixels);
  }

  /**
   * Calculate average/dominant color
   */
  private calculateAverageColor(imageData: ImageData): string {
    const { data } = imageData;
    let r = 0, g = 0, b = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Calculate brightness (0-1)
   */
  private calculateBrightness(imageData: ImageData): number {
    const { data } = imageData;
    let brightness = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    return brightness / pixelCount / 255;
  }

  /**
   * Generate fingerprint from an image file
   */
  async generateFingerprint(
    assetId: string,
    imageFile: File | Blob
  ): Promise<ImageFingerprint> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      img.onload = async () => {
        // Use a smaller size for fingerprinting
        const maxSize = 256;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const pHash = await this.generatePHash(imageData);
        const colorHistogram = this.generateColorHistogram(imageData);
        const averageColor = this.calculateAverageColor(imageData);
        const brightness = this.calculateBrightness(imageData);

        const fingerprint: ImageFingerprint = {
          id: `fp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          assetId,
          pHash,
          colorHistogram,
          averageColor,
          dimensions: { width: img.width, height: img.height },
          aspectRatio: img.width / img.height,
          brightness,
          createdAt: Date.now(),
        };

        // Store fingerprint
        this.fingerprints.set(fingerprint.id, fingerprint);
        this.assetIndex.set(assetId, fingerprint.id);
        this.persist();

        URL.revokeObjectURL(img.src);
        resolve(fingerprint);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Calculate Hamming distance between two hashes
   */
  private hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      // Pad shorter hash
      const maxLen = Math.max(hash1.length, hash2.length);
      hash1 = hash1.padEnd(maxLen, '0');
      hash2 = hash2.padEnd(maxLen, '0');
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      const n1 = parseInt(hash1[i], 16);
      const n2 = parseInt(hash2[i], 16);
      // Count differing bits
      let xor = n1 ^ n2;
      while (xor) {
        distance += xor & 1;
        xor >>= 1;
      }
    }

    return distance;
  }

  /**
   * Calculate cosine similarity between histograms
   */
  private cosineSimilarity(hist1: number[], hist2: number[]): number {
    if (hist1.length !== hist2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < hist1.length; i++) {
      dotProduct += hist1[i] * hist2[i];
      norm1 += hist1[i] * hist1[i];
      norm2 += hist2[i] * hist2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Calculate overall similarity between two fingerprints
   */
  calculateSimilarity(fp1: ImageFingerprint, fp2: ImageFingerprint): SimilarityMatch['details'] {
    // Hash distance (convert to similarity score)
    const maxHammingDistance = fp1.pHash.length * 4; // 4 bits per hex char
    const hammingDist = this.hammingDistance(fp1.pHash, fp2.pHash);
    const hashSimilarity = 1 - (hammingDist / maxHammingDistance);

    // Color histogram similarity
    const colorSimilarity = this.cosineSimilarity(fp1.colorHistogram, fp2.colorHistogram);

    // Dimension similarity (aspect ratio)
    const aspectDiff = Math.abs(fp1.aspectRatio - fp2.aspectRatio);
    const dimensionSimilarity = Math.max(0, 1 - aspectDiff);

    return {
      hashDistance: hammingDist,
      colorSimilarity,
      dimensionSimilarity,
    };
  }

  /**
   * Get overall similarity score
   */
  getSimilarityScore(details: SimilarityMatch['details']): number {
    const maxHammingDistance = 64; // Typical dHash length
    const hashSimilarity = 1 - (details.hashDistance / maxHammingDistance);

    // Weighted combination
    return (
      hashSimilarity * 0.5 +
      details.colorSimilarity * 0.35 +
      details.dimensionSimilarity * 0.15
    );
  }

  /**
   * Determine match type based on similarity score
   */
  private getMatchType(score: number): SimilarityMatch['matchType'] {
    if (score >= EXACT_MATCH_THRESHOLD) return 'exact';
    if (score >= NEAR_DUPLICATE_THRESHOLD) return 'near-duplicate';
    if (score >= DEFAULT_SIMILARITY_THRESHOLD) return 'similar';
    return 'style-match';
  }

  /**
   * Check for duplicates before upload
   */
  async checkForDuplicates(
    imageFile: File | Blob,
    assetName?: string
  ): Promise<DuplicateResult> {
    await this.initialize();

    // Generate temporary fingerprint
    const partialFingerprint = await this.generateFingerprintWithoutStore(imageFile);
    const tempFingerprint: ImageFingerprint = {
      ...partialFingerprint,
      id: 'temp',
      assetId: 'temp',
      createdAt: Date.now(),
    };

    let bestMatch: { assetId: string; score: number } | null = null;

    for (const [, fp] of this.fingerprints) {
      const details = this.calculateSimilarity(tempFingerprint, fp);
      const score = this.getSimilarityScore(details);

      if (score > (bestMatch?.score || NEAR_DUPLICATE_THRESHOLD)) {
        bestMatch = { assetId: fp.assetId, score };
      }
    }

    if (!bestMatch) {
      return { isDuplicate: false, confidence: 0, matchType: 'none' };
    }

    const matchType = bestMatch.score >= EXACT_MATCH_THRESHOLD ? 'exact' : 'near-duplicate';

    return {
      isDuplicate: true,
      confidence: bestMatch.score,
      matchType,
      existingAssetId: bestMatch.assetId,
      existingAssetName: assetName,
    };
  }

  /**
   * Generate fingerprint without storing
   */
  private async generateFingerprintWithoutStore(
    imageFile: File | Blob
  ): Promise<Omit<ImageFingerprint, 'id' | 'assetId' | 'createdAt'>> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      img.onload = async () => {
        const maxSize = 256;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const pHash = await this.generatePHash(imageData);
        const colorHistogram = this.generateColorHistogram(imageData);
        const averageColor = this.calculateAverageColor(imageData);
        const brightness = this.calculateBrightness(imageData);

        URL.revokeObjectURL(img.src);
        resolve({
          pHash,
          colorHistogram,
          averageColor,
          dimensions: { width: img.width, height: img.height },
          aspectRatio: img.width / img.height,
          brightness,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Find similar images in the library
   */
  async findSimilar(
    assetId: string,
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarityMatch[]> {
    await this.initialize();

    const {
      threshold = DEFAULT_SIMILARITY_THRESHOLD,
      maxResults = 10,
      includeExact = false,
      matchTypes,
    } = options;

    const fingerprintId = this.assetIndex.get(assetId);
    if (!fingerprintId) return [];

    const sourceFingerprint = this.fingerprints.get(fingerprintId);
    if (!sourceFingerprint) return [];

    const matches: SimilarityMatch[] = [];

    for (const [, fp] of this.fingerprints) {
      if (fp.assetId === assetId) continue;

      const details = this.calculateSimilarity(sourceFingerprint, fp);
      const score = this.getSimilarityScore(details);

      if (score < threshold) continue;

      const matchType = this.getMatchType(score);

      if (!includeExact && matchType === 'exact') continue;
      if (matchTypes && !matchTypes.includes(matchType)) continue;

      matches.push({
        assetId: fp.assetId,
        score,
        matchType,
        details,
      });
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, maxResults);
  }

  /**
   * Visual search - find similar images to a query image
   */
  async visualSearch(
    imageFile: File | Blob,
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarityMatch[]> {
    await this.initialize();

    const {
      threshold = DEFAULT_SIMILARITY_THRESHOLD,
      maxResults = 20,
      matchTypes,
    } = options;

    const queryFingerprint = await this.generateFingerprintWithoutStore(imageFile);
    const matches: SimilarityMatch[] = [];

    // Create a temporary full fingerprint for comparison
    const tempFingerprint: ImageFingerprint = {
      ...queryFingerprint,
      id: 'temp',
      assetId: 'temp',
      createdAt: Date.now(),
    };

    for (const [, fp] of this.fingerprints) {
      const details = this.calculateSimilarity(tempFingerprint, fp);
      const score = this.getSimilarityScore(details);

      if (score < threshold) continue;

      const matchType = this.getMatchType(score);
      if (matchTypes && !matchTypes.includes(matchType)) continue;

      matches.push({
        assetId: fp.assetId,
        score,
        matchType,
        details,
      });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, maxResults);
  }

  /**
   * Get recommendations for similar assets
   */
  async getRecommendations(
    assetId: string,
    limit = 5
  ): Promise<RecommendationResult[]> {
    await this.initialize();

    const fingerprintId = this.assetIndex.get(assetId);
    if (!fingerprintId) return [];

    const sourceFingerprint = this.fingerprints.get(fingerprintId);
    if (!sourceFingerprint) return [];

    const recommendations: RecommendationResult[] = [];

    for (const [, fp] of this.fingerprints) {
      if (fp.assetId === assetId) continue;

      const details = this.calculateSimilarity(sourceFingerprint, fp);
      const score = this.getSimilarityScore(details);

      if (score < 0.5) continue;

      // Determine recommendation reason
      let reason: string;
      let category: RecommendationResult['category'];

      if (details.hashDistance < 10) {
        reason = 'Very similar composition';
        category = 'composition';
      } else if (details.colorSimilarity > 0.85) {
        reason = 'Similar color palette';
        category = 'color';
      } else if (details.dimensionSimilarity > 0.95) {
        reason = 'Same aspect ratio';
        category = 'composition';
      } else {
        reason = 'Visually related';
        category = 'visual';
      }

      recommendations.push({
        assetId: fp.assetId,
        reason,
        score,
        category,
      });
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Get fingerprint for an asset
   */
  getFingerprint(assetId: string): ImageFingerprint | undefined {
    const fingerprintId = this.assetIndex.get(assetId);
    return fingerprintId ? this.fingerprints.get(fingerprintId) : undefined;
  }

  /**
   * Remove fingerprint for an asset
   */
  removeFingerprint(assetId: string): void {
    const fingerprintId = this.assetIndex.get(assetId);
    if (fingerprintId) {
      this.fingerprints.delete(fingerprintId);
      this.assetIndex.delete(assetId);
      this.persist();
    }
  }

  /**
   * Get all fingerprints
   */
  getAllFingerprints(): ImageFingerprint[] {
    return Array.from(this.fingerprints.values());
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalIndexed: number;
    avgBrightness: number;
    aspectRatioDistribution: Record<string, number>;
  } {
    const fingerprints = Array.from(this.fingerprints.values());
    const total = fingerprints.length;

    if (total === 0) {
      return {
        totalIndexed: 0,
        avgBrightness: 0,
        aspectRatioDistribution: {},
      };
    }

    const avgBrightness = fingerprints.reduce((sum, fp) => sum + fp.brightness, 0) / total;

    // Group by aspect ratio category
    const distribution: Record<string, number> = {
      'portrait': 0,
      'landscape': 0,
      'square': 0,
    };

    for (const fp of fingerprints) {
      if (fp.aspectRatio < 0.9) distribution['portrait']++;
      else if (fp.aspectRatio > 1.1) distribution['landscape']++;
      else distribution['square']++;
    }

    return {
      totalIndexed: total,
      avgBrightness,
      aspectRatioDistribution: distribution,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.fingerprints.clear();
    this.assetIndex.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const similarityEngine = SimilarityEngine.getInstance();

// Export class for testing
export { SimilarityEngine };
