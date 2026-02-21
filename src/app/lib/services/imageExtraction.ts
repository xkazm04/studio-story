/**
 * Universal Image Extraction Library
 * Reusable service for extracting structured data from images using AI models
 * Supports multiple models (Gemini, Groq) and custom extraction schemas
 */

export interface ModelConfig {
  enabled: boolean;
}

export interface ExtractionConfig {
  gemini?: ModelConfig;
  groq?: ModelConfig;
}

export interface ExtractionSchema {
  name: string;
  description: string;
  fields: ExtractionField[];
}

export interface ExtractionField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  options?: string[]; // For enum-like fields
}

export interface ModelExtractionResult<T = any> {
  data: T;
  model: string;
  processingTime?: number;
  error?: string;
  confidence?: number;
}

export interface MultiModelExtractionResult<T = any> {
  gemini?: ModelExtractionResult<T>;
  groq?: ModelExtractionResult<T>;
}

/**
 * Generate a prompt for image extraction based on schema
 */
function generateExtractionPrompt(schema: ExtractionSchema): string {
  const fieldDescriptions = schema.fields
    .map(field => {
      const required = field.required ? ' (required)' : ' (optional)';
      const options = field.options ? ` Options: ${field.options.join(', ')}` : '';
      return `- ${field.name} (${field.type})${required}: ${field.description}${options}`;
    })
    .join('\n');

  return `Analyze this image and extract the following information:

${schema.description}

Please provide the following fields in JSON format:
${fieldDescriptions}

Return ONLY valid JSON without any markdown formatting or code blocks. The JSON should match this structure exactly.`;
}

/**
 * Extract data from image using Gemini Vision API
 */
async function extractWithGemini<T>(
  imageFile: File,
  schema: ExtractionSchema
): Promise<ModelExtractionResult<T>> {
  const startTime = Date.now();

  try {
    const prompt = generateExtractionPrompt(schema);
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Call Gemini API
    const response = await fetch('/api/image-extraction/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt,
        schema,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      model: 'gemini',
      data: result.data,
      processingTime: Date.now() - startTime,
      confidence: result.confidence,
    };
  } catch (error) {
    return {
      model: 'gemini',
      data: {} as T,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract data from image using Groq Vision API
 */
async function extractWithGroq<T>(
  imageFile: File,
  schema: ExtractionSchema
): Promise<ModelExtractionResult<T>> {
  const startTime = Date.now();

  try {
    const prompt = generateExtractionPrompt(schema);
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Call Groq API
    const response = await fetch('/api/image-extraction/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt,
        schema,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      model: 'groq',
      data: result.data,
      processingTime: Date.now() - startTime,
      confidence: result.confidence,
    };
  } catch (error) {
    return {
      model: 'groq',
      data: {} as T,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Extract structured data from image using multiple AI models
 * @param imageFile - The image file to analyze
 * @param schema - The extraction schema defining what data to extract
 * @param config - Configuration for which models to use
 * @returns Results from all enabled models
 */
export async function extractFromImage<T = any>(
  imageFile: File,
  schema: ExtractionSchema,
  config: ExtractionConfig
): Promise<MultiModelExtractionResult<T>> {
  const promises: Promise<[string, ModelExtractionResult<T>]>[] = [];

  // Queue up extraction tasks for enabled models
  if (config.gemini?.enabled) {
    promises.push(
      extractWithGemini<T>(imageFile, schema).then(
        result => ['gemini', result] as [string, ModelExtractionResult<T>]
      )
    );
  }

  if (config.groq?.enabled) {
    promises.push(
      extractWithGroq<T>(imageFile, schema).then(
        result => ['groq', result] as [string, ModelExtractionResult<T>]
      )
    );
  }

  // Run all extractions in parallel
  const results = await Promise.all(promises);

  // Convert array to result object
  const extractionResult: MultiModelExtractionResult<T> = {};
  for (const [model, result] of results) {
    if (model === 'gemini') {
      extractionResult.gemini = result;
    } else if (model === 'groq') {
      extractionResult.groq = result;
    }
  }

  return extractionResult;
}

/**
 * Merge results from multiple models with conflict resolution
 * Prefers results with higher confidence or from preferred model
 */
export function mergeExtractionResults<T extends Record<string, any>>(
  results: MultiModelExtractionResult<T>,
  preferredModel: 'gemini' | 'groq' = 'gemini'
): T {
  const merged: any = {};

  // Get all available results
  const availableResults = [
    results.gemini,
    results.groq,
  ].filter(r => r && !r.error && r.data);

  if (availableResults.length === 0) {
    return {} as T;
  }

  // If only one result, return it
  if (availableResults.length === 1) {
    return availableResults[0]!.data;
  }

  // Merge results, preferring higher confidence or preferred model
  const allKeys = new Set<string>();
  availableResults.forEach(result => {
    if (result?.data) {
      Object.keys(result.data).forEach(key => allKeys.add(key));
    }
  });

  allKeys.forEach(key => {
    const values = availableResults
      .filter(r => r?.data && key in r.data)
      .map(r => ({
        value: r!.data[key],
        confidence: r!.confidence || 0.5,
        model: r!.model,
      }));

    if (values.length === 0) return;

    // Choose value with highest confidence, or from preferred model if tied
    values.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) < 0.1) {
        // Confidence is similar, prefer the preferred model
        if (a.model === preferredModel) return -1;
        if (b.model === preferredModel) return 1;
      }
      return b.confidence - a.confidence;
    });

    merged[key] = values[0].value;
  });

  return merged as T;
}
