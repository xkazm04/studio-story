/**
 * ContentExtractor - Element detection and content extraction
 *
 * Extracts visual elements from images including objects, faces,
 * text, and scene characteristics for comprehensive asset metadata.
 */

import {
  assetAnalyzer,
  type ContentAnalysis,
  type DetectedObject,
  type DetectedFace,
  type DetectedText,
} from './AssetAnalyzer';

// Types
export interface ExtractionOptions {
  detectObjects: boolean;
  detectFaces: boolean;
  extractText: boolean;
  detectScenes: boolean;
  maxObjects: number;
  confidenceThreshold: number;
}

export interface ExtractedElement {
  type: 'object' | 'face' | 'text' | 'scene';
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
  metadata?: Record<string, unknown>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneClassification {
  primary: string;
  secondary: string[];
  attributes: {
    indoor: boolean;
    outdoor: boolean;
    natural: boolean;
    urban: boolean;
    time: 'day' | 'night' | 'unknown';
    weather?: string;
  };
}

export interface ExtractionResult {
  elements: ExtractedElement[];
  objects: DetectedObject[];
  faces: DetectedFace[];
  text: DetectedText[];
  scene: SceneClassification;
  summary: string;
  keywords: string[];
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  detectObjects: true,
  detectFaces: true,
  extractText: true,
  detectScenes: true,
  maxObjects: 20,
  confidenceThreshold: 0.5,
};

// Common object categories for classification
const OBJECT_CATEGORIES = {
  characters: ['person', 'human', 'character', 'figure', 'portrait'],
  animals: ['animal', 'pet', 'creature', 'beast', 'wildlife'],
  nature: ['tree', 'flower', 'plant', 'mountain', 'sky', 'water', 'cloud'],
  buildings: ['building', 'house', 'architecture', 'structure', 'tower'],
  vehicles: ['car', 'vehicle', 'ship', 'aircraft', 'transport'],
  objects: ['object', 'item', 'prop', 'tool', 'furniture'],
  food: ['food', 'drink', 'cuisine', 'meal'],
};

/**
 * ContentExtractor class
 */
class ContentExtractor {
  private static instance: ContentExtractor;
  private extractionCache: Map<string, ExtractionResult> = new Map();

  private constructor() {}

  static getInstance(): ContentExtractor {
    if (!ContentExtractor.instance) {
      ContentExtractor.instance = new ContentExtractor();
    }
    return ContentExtractor.instance;
  }

  /**
   * Extract content from an image file
   */
  async extract(
    imageFile: File | Blob,
    options: Partial<ExtractionOptions> = {}
  ): Promise<ExtractionResult> {
    const fullOptions = { ...DEFAULT_OPTIONS, ...options };

    // Get analysis from AssetAnalyzer
    const analysis = await assetAnalyzer.analyzeImage(imageFile, {
      extractContent: true,
      detectObjects: fullOptions.detectObjects,
      extractText: fullOptions.extractText,
    });

    // Convert to extraction result
    const elements: ExtractedElement[] = [];

    // Add objects
    if (fullOptions.detectObjects) {
      analysis.content.objects.forEach((obj) => {
        if (obj.confidence >= fullOptions.confidenceThreshold) {
          elements.push({
            type: 'object',
            label: obj.label,
            confidence: obj.confidence,
            boundingBox: obj.boundingBox,
            metadata: obj.attributes,
          });
        }
      });
    }

    // Add faces
    if (fullOptions.detectFaces) {
      analysis.content.faces.forEach((face, index) => {
        if (face.confidence >= fullOptions.confidenceThreshold) {
          elements.push({
            type: 'face',
            label: `Face ${index + 1}`,
            confidence: face.confidence,
            boundingBox: face.boundingBox,
            metadata: face.attributes,
          });
        }
      });
    }

    // Add text
    if (fullOptions.extractText) {
      analysis.content.text.forEach((text) => {
        if (text.confidence >= fullOptions.confidenceThreshold) {
          elements.push({
            type: 'text',
            label: text.text,
            confidence: text.confidence,
            boundingBox: text.boundingBox,
            metadata: { language: text.language },
          });
        }
      });
    }

    // Classify scene
    const scene = this.classifyScene(
      analysis.content,
      analysis.colors,
      analysis.styleAnalysis
    );

    // Add scene elements
    if (fullOptions.detectScenes) {
      elements.push({
        type: 'scene',
        label: scene.primary,
        confidence: 0.8,
      });

      scene.secondary.forEach((s) => {
        elements.push({
          type: 'scene',
          label: s,
          confidence: 0.6,
        });
      });
    }

    // Generate summary
    const summary = this.generateSummary(elements, scene);

    // Extract keywords
    const keywords = this.extractKeywords(elements, scene);

    return {
      elements: elements.slice(0, fullOptions.maxObjects),
      objects: analysis.content.objects,
      faces: analysis.content.faces,
      text: analysis.content.text,
      scene,
      summary,
      keywords,
    };
  }

  /**
   * Classify scene from content analysis
   */
  private classifyScene(
    content: ContentAnalysis,
    colors: { brightness: string; temperature: string },
    style: { mood: string }
  ): SceneClassification {
    const scenes = content.scenes;

    // Determine primary scene
    let primary = 'general';
    const secondary: string[] = [];

    if (scenes.includes('indoor')) {
      primary = 'interior';
    } else if (scenes.includes('outdoor')) {
      primary = 'exterior';
    }

    // Add secondary scenes
    scenes.forEach((s) => {
      if (s !== primary && !secondary.includes(s)) {
        secondary.push(s);
      }
    });

    // Determine attributes
    const isIndoor = scenes.includes('indoor') || scenes.includes('interior');
    const isOutdoor = scenes.includes('outdoor') || scenes.includes('exterior');
    const isNatural = scenes.some((s) =>
      ['nature', 'forest', 'mountain', 'ocean', 'sky'].includes(s)
    );
    const isUrban = scenes.some((s) =>
      ['city', 'urban', 'street', 'building'].includes(s)
    );

    // Determine time of day
    let time: 'day' | 'night' | 'unknown' = 'unknown';
    if (colors.brightness === 'dark' || scenes.includes('night')) {
      time = 'night';
    } else if (
      colors.brightness === 'bright' ||
      scenes.includes('daylight') ||
      scenes.includes('day')
    ) {
      time = 'day';
    }

    // Determine weather if applicable
    let weather: string | undefined;
    if (scenes.includes('rain') || scenes.includes('rainy')) {
      weather = 'rainy';
    } else if (scenes.includes('snow') || scenes.includes('snowy')) {
      weather = 'snowy';
    } else if (scenes.includes('sunny')) {
      weather = 'sunny';
    } else if (scenes.includes('cloudy')) {
      weather = 'cloudy';
    }

    return {
      primary,
      secondary,
      attributes: {
        indoor: isIndoor,
        outdoor: isOutdoor,
        natural: isNatural,
        urban: isUrban,
        time,
        weather,
      },
    };
  }

  /**
   * Generate summary from extracted elements
   */
  private generateSummary(
    elements: ExtractedElement[],
    scene: SceneClassification
  ): string {
    const parts: string[] = [];

    // Scene description
    if (scene.primary !== 'general') {
      parts.push(`${scene.attributes.indoor ? 'Indoor' : 'Outdoor'} ${scene.primary} scene`);
    }

    // Object counts
    const objectCount = elements.filter((e) => e.type === 'object').length;
    const faceCount = elements.filter((e) => e.type === 'face').length;
    const textCount = elements.filter((e) => e.type === 'text').length;

    if (faceCount > 0) {
      parts.push(`${faceCount} ${faceCount === 1 ? 'face' : 'faces'} detected`);
    }

    if (objectCount > 0) {
      parts.push(`${objectCount} ${objectCount === 1 ? 'object' : 'objects'} identified`);
    }

    if (textCount > 0) {
      parts.push(`contains text`);
    }

    // Time of day
    if (scene.attributes.time !== 'unknown') {
      parts.push(`${scene.attributes.time}time setting`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Extract keywords from elements
   */
  private extractKeywords(
    elements: ExtractedElement[],
    scene: SceneClassification
  ): string[] {
    const keywords = new Set<string>();

    // Add scene keywords
    keywords.add(scene.primary);
    scene.secondary.forEach((s) => keywords.add(s));

    if (scene.attributes.indoor) keywords.add('indoor');
    if (scene.attributes.outdoor) keywords.add('outdoor');
    if (scene.attributes.natural) keywords.add('nature');
    if (scene.attributes.urban) keywords.add('urban');
    if (scene.attributes.time !== 'unknown') keywords.add(scene.attributes.time);
    if (scene.attributes.weather) keywords.add(scene.attributes.weather);

    // Add element labels
    elements.forEach((element) => {
      if (element.confidence > 0.6) {
        keywords.add(element.label.toLowerCase());
      }
    });

    // Categorize objects
    elements
      .filter((e) => e.type === 'object')
      .forEach((obj) => {
        const category = this.categorizeObject(obj.label);
        if (category) {
          keywords.add(category);
        }
      });

    return Array.from(keywords).slice(0, 20);
  }

  /**
   * Categorize an object by its label
   */
  private categorizeObject(label: string): string | null {
    const lowerLabel = label.toLowerCase();

    for (const [category, keywords] of Object.entries(OBJECT_CATEGORIES)) {
      if (keywords.some((k) => lowerLabel.includes(k))) {
        return category;
      }
    }

    return null;
  }

  /**
   * Detect specific elements in an image
   */
  async detectSpecific(
    imageFile: File | Blob,
    elementTypes: Array<'objects' | 'faces' | 'text' | 'scenes'>
  ): Promise<Partial<ExtractionResult>> {
    const options: Partial<ExtractionOptions> = {
      detectObjects: elementTypes.includes('objects'),
      detectFaces: elementTypes.includes('faces'),
      extractText: elementTypes.includes('text'),
      detectScenes: elementTypes.includes('scenes'),
    };

    return this.extract(imageFile, options);
  }

  /**
   * Get element statistics from extraction result
   */
  getStatistics(result: ExtractionResult): {
    totalElements: number;
    byType: Record<string, number>;
    avgConfidence: number;
    hasText: boolean;
    hasFaces: boolean;
  } {
    const byType: Record<string, number> = {
      object: 0,
      face: 0,
      text: 0,
      scene: 0,
    };

    let totalConfidence = 0;

    result.elements.forEach((element) => {
      byType[element.type]++;
      totalConfidence += element.confidence;
    });

    return {
      totalElements: result.elements.length,
      byType,
      avgConfidence: result.elements.length > 0
        ? totalConfidence / result.elements.length
        : 0,
      hasText: result.text.length > 0,
      hasFaces: result.faces.length > 0,
    };
  }

  /**
   * Filter elements by type
   */
  filterByType(
    result: ExtractionResult,
    type: ExtractedElement['type']
  ): ExtractedElement[] {
    return result.elements.filter((e) => e.type === type);
  }

  /**
   * Filter elements by confidence threshold
   */
  filterByConfidence(
    result: ExtractionResult,
    threshold: number
  ): ExtractedElement[] {
    return result.elements.filter((e) => e.confidence >= threshold);
  }

  /**
   * Clear extraction cache
   */
  clearCache(): void {
    this.extractionCache.clear();
  }
}

// Export singleton instance
export const contentExtractor = ContentExtractor.getInstance();

// Export class for testing
export { ContentExtractor };
