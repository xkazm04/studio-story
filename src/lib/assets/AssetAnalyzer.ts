/**
 * AssetAnalyzer - AI-powered image analysis for automatic tagging
 *
 * Provides intelligent analysis of images including automatic tagging,
 * content extraction, metadata generation, and quality assessment.
 */

// Types
export interface AnalysisOptions {
  generateTags: boolean;
  extractContent: boolean;
  analyzeColors: boolean;
  assessQuality: boolean;
  detectObjects: boolean;
  extractText: boolean;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  category: 'content' | 'style' | 'color' | 'mood' | 'technical';
}

export interface ColorAnalysis {
  dominant: string[];
  palette: string[];
  brightness: 'dark' | 'medium' | 'bright';
  saturation: 'muted' | 'moderate' | 'vivid';
  temperature: 'cool' | 'neutral' | 'warm';
}

export interface QualityAssessment {
  overall: number; // 0-100
  sharpness: number;
  noise: number;
  exposure: number;
  composition: number;
  issues: string[];
  recommendations: string[];
}

export interface ContentAnalysis {
  objects: DetectedObject[];
  faces: DetectedFace[];
  text: DetectedText[];
  scenes: string[];
  actions: string[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  attributes?: Record<string, string>;
}

export interface DetectedFace {
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  attributes?: {
    age?: string;
    gender?: string;
    expression?: string;
    pose?: string;
  };
}

export interface DetectedText {
  text: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  language?: string;
}

export interface GeneratedMetadata {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  keywords: string[];
  assetType: string;
  suggestedName: string;
}

export interface FullAnalysisResult {
  tags: TagSuggestion[];
  colors: ColorAnalysis;
  quality: QualityAssessment;
  content: ContentAnalysis;
  metadata: GeneratedMetadata;
  styleAnalysis: StyleAnalysis;
  processingTime: number;
}

export interface StyleAnalysis {
  style: string;
  medium: string;
  period?: string;
  influences: string[];
  mood: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  generateTags: true,
  extractContent: true,
  analyzeColors: true,
  assessQuality: true,
  detectObjects: true,
  extractText: true,
};

/**
 * AssetAnalyzer class for image analysis
 */
class AssetAnalyzer {
  private static instance: AssetAnalyzer;
  private analysisCache: Map<string, FullAnalysisResult> = new Map();

  private constructor() {}

  static getInstance(): AssetAnalyzer {
    if (!AssetAnalyzer.instance) {
      AssetAnalyzer.instance = new AssetAnalyzer();
    }
    return AssetAnalyzer.instance;
  }

  /**
   * Generate cache key for an image
   */
  private async generateCacheKey(imageFile: File | Blob): Promise<string> {
    const buffer = await imageFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Perform full analysis on an image
   */
  async analyzeImage(
    imageFile: File | Blob,
    options: Partial<AnalysisOptions> = {}
  ): Promise<FullAnalysisResult> {
    const startTime = Date.now();
    const fullOptions = { ...DEFAULT_OPTIONS, ...options };

    // Check cache
    const cacheKey = await this.generateCacheKey(imageFile);
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Load image for analysis
    const imageData = await this.loadImageData(imageFile);

    // Perform analysis steps in parallel where possible
    const [colors, quality, content, styleAnalysis] = await Promise.all([
      fullOptions.analyzeColors ? this.analyzeColors(imageData) : this.getDefaultColorAnalysis(),
      fullOptions.assessQuality ? this.assessQuality(imageData) : this.getDefaultQualityAssessment(),
      fullOptions.extractContent ? this.extractContent(imageData) : this.getDefaultContentAnalysis(),
      this.analyzeStyle(imageData),
    ]);

    // Generate tags based on all analysis
    const tags = fullOptions.generateTags
      ? this.generateTags(colors, content, styleAnalysis)
      : [];

    // Generate metadata
    const metadata = this.generateMetadata(
      imageFile instanceof File ? imageFile.name : 'image',
      tags,
      colors,
      content,
      styleAnalysis
    );

    const result: FullAnalysisResult = {
      tags,
      colors,
      quality,
      content,
      metadata,
      styleAnalysis,
      processingTime: Date.now() - startTime,
    };

    // Cache result
    this.analysisCache.set(cacheKey, result);

    return result;
  }

  /**
   * Load image data from file
   */
  private loadImageData(imageFile: File | Blob): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(imageData);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Analyze colors in the image
   */
  private async analyzeColors(imageData: ImageData): Promise<ColorAnalysis> {
    const { data, width, height } = imageData;
    const colorCounts = new Map<string, number>();
    let totalBrightness = 0;
    let totalSaturation = 0;
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = width * height;

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Quantize color
      const qR = Math.round(r / 32) * 32;
      const qG = Math.round(g / 32) * 32;
      const qB = Math.round(b / 32) * 32;
      const color = `#${qR.toString(16).padStart(2, '0')}${qG.toString(16).padStart(2, '0')}${qB.toString(16).padStart(2, '0')}`;

      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);

      // Calculate brightness (0-255)
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // Calculate saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;

      totalR += r;
      totalG += g;
      totalB += b;
    }

    // Get dominant colors
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([color]) => color);

    const avgBrightness = totalBrightness / (pixelCount / 4);
    const avgSaturation = totalSaturation / (pixelCount / 4);
    const avgR = totalR / (pixelCount / 4);
    const avgB = totalB / (pixelCount / 4);

    // Determine brightness level
    const brightnessLevel: ColorAnalysis['brightness'] =
      avgBrightness < 85 ? 'dark' : avgBrightness > 170 ? 'bright' : 'medium';

    // Determine saturation level
    const saturationLevel: ColorAnalysis['saturation'] =
      avgSaturation < 0.3 ? 'muted' : avgSaturation > 0.6 ? 'vivid' : 'moderate';

    // Determine temperature
    const temperature: ColorAnalysis['temperature'] =
      avgR > avgB + 20 ? 'warm' : avgB > avgR + 20 ? 'cool' : 'neutral';

    return {
      dominant: sortedColors.slice(0, 3),
      palette: sortedColors,
      brightness: brightnessLevel,
      saturation: saturationLevel,
      temperature,
    };
  }

  /**
   * Assess image quality
   */
  private async assessQuality(imageData: ImageData): Promise<QualityAssessment> {
    const { data, width, height } = imageData;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Calculate sharpness using Laplacian variance
    let laplacianVariance = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        // Laplacian kernel
        const topIdx = ((y - 1) * width + x) * 4;
        const bottomIdx = ((y + 1) * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;

        const topGray = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
        const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
        const leftGray = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
        const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;

        const laplacian = 4 * gray - topGray - bottomGray - leftGray - rightGray;
        laplacianVariance += laplacian * laplacian;
      }
    }
    laplacianVariance /= (width - 2) * (height - 2);
    const sharpness = Math.min(100, laplacianVariance / 10);

    if (sharpness < 30) {
      issues.push('Image appears blurry');
      recommendations.push('Consider using a sharper source image');
    }

    // Calculate exposure
    let histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const brightness = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[brightness]++;
    }

    const totalPixels = width * height;
    const darkPixels = histogram.slice(0, 50).reduce((a, b) => a + b, 0);
    const brightPixels = histogram.slice(205, 256).reduce((a, b) => a + b, 0);

    let exposure = 50; // Neutral
    if (darkPixels > totalPixels * 0.3) {
      exposure = 30;
      issues.push('Image appears underexposed');
      recommendations.push('Try brightening the image');
    } else if (brightPixels > totalPixels * 0.3) {
      exposure = 70;
      issues.push('Image appears overexposed');
      recommendations.push('Try reducing brightness');
    } else {
      exposure = 80;
    }

    // Estimate noise (variance in smooth areas)
    let noiseEstimate = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const nextR = data[i + 4] || r;
      const nextG = data[i + 5] || g;
      const nextB = data[i + 6] || b;

      noiseEstimate += Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
    }
    noiseEstimate /= (data.length / 16) * 3;
    const noise = Math.max(0, 100 - noiseEstimate * 2);

    if (noise < 50) {
      issues.push('High noise detected');
      recommendations.push('Consider applying noise reduction');
    }

    // Composition score (simple - check for central focus)
    const centerWeight = this.calculateCenterWeight(imageData);
    const composition = centerWeight;

    // Overall score
    const overall = Math.round(
      sharpness * 0.3 + noise * 0.2 + exposure * 0.25 + composition * 0.25
    );

    return {
      overall,
      sharpness: Math.round(sharpness),
      noise: Math.round(noise),
      exposure: Math.round(exposure),
      composition: Math.round(composition),
      issues,
      recommendations,
    };
  }

  /**
   * Calculate center weight for composition scoring
   */
  private calculateCenterWeight(imageData: ImageData): number {
    const { data, width, height } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    let centerIntensity = 0;
    let edgeIntensity = 0;
    let centerCount = 0;
    let edgeCount = 0;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        const intensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        const dist = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        if (dist < maxDist * 0.4) {
          centerIntensity += intensity;
          centerCount++;
        } else {
          edgeIntensity += intensity;
          edgeCount++;
        }
      }
    }

    const avgCenter = centerIntensity / centerCount;
    const avgEdge = edgeIntensity / edgeCount;

    // Higher score if there's contrast between center and edges
    const contrast = Math.abs(avgCenter - avgEdge) / 255;
    return 50 + contrast * 50;
  }

  /**
   * Extract content from image (simplified - would use AI in production)
   */
  private async extractContent(imageData: ImageData): Promise<ContentAnalysis> {
    // In production, this would call vision AI APIs
    // For now, return placeholder based on image characteristics
    const colors = await this.analyzeColors(imageData);

    // Determine likely content based on colors and dimensions
    const scenes: string[] = [];
    const actions: string[] = [];

    if (colors.brightness === 'dark') {
      scenes.push('night', 'indoor');
    } else if (colors.brightness === 'bright') {
      scenes.push('daylight', 'outdoor');
    }

    if (colors.temperature === 'warm') {
      scenes.push('sunset', 'warm lighting');
    } else if (colors.temperature === 'cool') {
      scenes.push('blue hour', 'cool lighting');
    }

    return {
      objects: [],
      faces: [],
      text: [],
      scenes,
      actions,
    };
  }

  /**
   * Analyze style of the image
   */
  private async analyzeStyle(imageData: ImageData): Promise<StyleAnalysis> {
    const colors = await this.analyzeColors(imageData);

    // Determine style based on characteristics
    let style = 'realistic';
    let mood = 'neutral';
    let complexity: StyleAnalysis['complexity'] = 'moderate';

    if (colors.saturation === 'vivid') {
      style = 'vibrant';
      mood = 'energetic';
    } else if (colors.saturation === 'muted') {
      style = 'muted';
      mood = 'calm';
    }

    if (colors.brightness === 'dark') {
      mood = 'dramatic';
    } else if (colors.brightness === 'bright') {
      mood = 'cheerful';
    }

    return {
      style,
      medium: 'digital',
      influences: [],
      mood,
      complexity,
    };
  }

  /**
   * Generate tags based on analysis
   */
  private generateTags(
    colors: ColorAnalysis,
    content: ContentAnalysis,
    style: StyleAnalysis
  ): TagSuggestion[] {
    const tags: TagSuggestion[] = [];

    // Color-based tags
    tags.push({
      tag: colors.brightness,
      confidence: 0.9,
      category: 'color',
    });

    tags.push({
      tag: colors.temperature,
      confidence: 0.85,
      category: 'color',
    });

    if (colors.saturation === 'vivid') {
      tags.push({ tag: 'colorful', confidence: 0.8, category: 'color' });
    } else if (colors.saturation === 'muted') {
      tags.push({ tag: 'muted', confidence: 0.8, category: 'color' });
    }

    // Add dominant color tags
    colors.dominant.forEach((color, i) => {
      const colorName = this.getColorName(color);
      if (colorName) {
        tags.push({
          tag: colorName,
          confidence: 0.7 - i * 0.1,
          category: 'color',
        });
      }
    });

    // Style-based tags
    tags.push({
      tag: style.style,
      confidence: 0.75,
      category: 'style',
    });

    tags.push({
      tag: style.mood,
      confidence: 0.8,
      category: 'mood',
    });

    // Content-based tags
    content.scenes.forEach((scene) => {
      tags.push({
        tag: scene,
        confidence: 0.7,
        category: 'content',
      });
    });

    // Sort by confidence
    return tags.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get color name from hex
   */
  private getColorName(hex: string): string | null {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Simple color naming
    if (r > 200 && g < 100 && b < 100) return 'red';
    if (r < 100 && g > 200 && b < 100) return 'green';
    if (r < 100 && g < 100 && b > 200) return 'blue';
    if (r > 200 && g > 200 && b < 100) return 'yellow';
    if (r > 200 && g < 100 && b > 200) return 'magenta';
    if (r < 100 && g > 200 && b > 200) return 'cyan';
    if (r > 200 && g > 150 && b < 100) return 'orange';
    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'gray';

    return null;
  }

  /**
   * Generate metadata from analysis
   */
  private generateMetadata(
    fileName: string,
    tags: TagSuggestion[],
    colors: ColorAnalysis,
    content: ContentAnalysis,
    style: StyleAnalysis
  ): GeneratedMetadata {
    // Extract name without extension
    const baseName = fileName.replace(/\.[^.]+$/, '');

    // Generate title
    const primaryTags = tags.filter(t => t.confidence > 0.7).slice(0, 3);
    const title = primaryTags.length > 0
      ? primaryTags.map(t => t.tag).join(' ')
      : baseName;

    // Generate description
    const description = `A ${style.mood} ${colors.brightness} image with ${colors.temperature} tones. ${
      content.scenes.length > 0 ? `Features: ${content.scenes.join(', ')}.` : ''
    }`;

    // Determine category
    let category = 'Image';
    let assetType = 'Background';

    if (content.faces.length > 0) {
      category = 'Character';
      assetType = 'Body';
    } else if (content.scenes.includes('indoor') || content.scenes.includes('outdoor')) {
      category = 'Scene';
      assetType = 'Scene';
    }

    // Extract keywords
    const keywords = tags
      .filter(t => t.confidence > 0.5)
      .map(t => t.tag);

    return {
      title: this.toTitleCase(title),
      description,
      category,
      tags: keywords.slice(0, 10),
      keywords,
      assetType,
      suggestedName: this.generateSuggestedName(tags, style),
    };
  }

  /**
   * Generate suggested name from tags
   */
  private generateSuggestedName(tags: TagSuggestion[], style: StyleAnalysis): string {
    const contentTag = tags.find(t => t.category === 'content')?.tag || '';
    const moodTag = style.mood;

    if (contentTag) {
      return this.toTitleCase(`${moodTag} ${contentTag}`);
    }

    return this.toTitleCase(moodTag);
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get default color analysis
   */
  private getDefaultColorAnalysis(): ColorAnalysis {
    return {
      dominant: ['#808080'],
      palette: ['#808080'],
      brightness: 'medium',
      saturation: 'moderate',
      temperature: 'neutral',
    };
  }

  /**
   * Get default quality assessment
   */
  private getDefaultQualityAssessment(): QualityAssessment {
    return {
      overall: 70,
      sharpness: 70,
      noise: 70,
      exposure: 70,
      composition: 70,
      issues: [],
      recommendations: [],
    };
  }

  /**
   * Get default content analysis
   */
  private getDefaultContentAnalysis(): ContentAnalysis {
    return {
      objects: [],
      faces: [],
      text: [],
      scenes: [],
      actions: [],
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

// Export singleton instance
export const assetAnalyzer = AssetAnalyzer.getInstance();

// Export class for testing
export { AssetAnalyzer };
