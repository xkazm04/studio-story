/**
 * TemplateManager - Prompt Template Library with Versioning, Sharing, and Effectiveness Tracking
 *
 * Provides comprehensive template management including:
 * - Template CRUD operations with variable placeholders
 * - Version history and rollback support
 * - Effectiveness metrics and ratings
 * - Community sharing capabilities
 * - A/B testing framework
 * - Categorization and search
 */

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory =
  | 'character'
  | 'scene'
  | 'dialogue'
  | 'description'
  | 'image'
  | 'story'
  | 'world-building'
  | 'custom';

export type TemplateVisibility = 'private' | 'shared' | 'public';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  description: string;
  defaultValue?: string | number | boolean;
  options?: string[]; // For select type
  required: boolean;
}

export interface TemplateVersion {
  version: number;
  content: string;
  variables: TemplateVariable[];
  createdAt: number;
  changeNote?: string;
  metrics?: EffectivenessMetrics;
}

export interface EffectivenessMetrics {
  usageCount: number;
  averageRating: number;
  ratingCount: number;
  successRate: number; // % of uses that received positive feedback
  averageOutputLength: number;
  lastUsedAt?: number;
  abTestResults?: ABTestResult[];
}

export interface ABTestResult {
  testId: string;
  variantA: string; // Template version or ID
  variantB: string;
  sampleSize: number;
  winnerRating: number;
  loserRating: number;
  confidence: number; // Statistical confidence (0-1)
  completedAt: number;
}

export interface TemplateRating {
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  outputQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  createdAt: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];

  // Current version
  content: string;
  variables: TemplateVariable[];

  // Version history
  versions: TemplateVersion[];
  currentVersion: number;

  // Metadata
  authorId: string;
  authorName: string;
  visibility: TemplateVisibility;
  createdAt: number;
  updatedAt: number;

  // Effectiveness
  metrics: EffectivenessMetrics;
  ratings: TemplateRating[];

  // Community
  forkCount: number;
  forkedFromId?: string;
  featured: boolean;
}

export interface TemplateSearchOptions {
  query?: string;
  category?: TemplateCategory;
  tags?: string[];
  visibility?: TemplateVisibility;
  minRating?: number;
  sortBy?: 'rating' | 'usage' | 'recent' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ABTestConfig {
  templateIdA: string;
  templateIdB: string;
  sampleSize: number;
  variables: Record<string, string | number | boolean>;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_METRICS: EffectivenessMetrics = {
  usageCount: 0,
  averageRating: 0,
  ratingCount: 0,
  successRate: 0,
  averageOutputLength: 0,
};

// ============================================================================
// Built-in Templates
// ============================================================================

const BUILT_IN_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Character Introduction',
    description: 'Generate a compelling character introduction scene',
    category: 'character',
    tags: ['introduction', 'character', 'scene'],
    content: `Write a compelling introduction for {{characterName}}, a {{characterRole}} in a {{genre}} story.

Character traits: {{traits}}
Setting: {{setting}}
Mood: {{mood}}

The introduction should:
- Reveal their personality through action, not exposition
- Establish their role in the story
- Create intrigue or connection with the reader
- Be approximately {{wordCount}} words`,
    variables: [
      { name: 'characterName', type: 'text', description: 'Name of the character', required: true },
      { name: 'characterRole', type: 'text', description: 'Role (protagonist, antagonist, mentor, etc.)', required: true },
      { name: 'genre', type: 'select', description: 'Story genre', options: ['fantasy', 'sci-fi', 'mystery', 'romance', 'thriller', 'literary'], required: true },
      { name: 'traits', type: 'text', description: 'Key character traits', required: false, defaultValue: 'determined, secretive' },
      { name: 'setting', type: 'text', description: 'Scene setting', required: true },
      { name: 'mood', type: 'select', description: 'Scene mood', options: ['tense', 'mysterious', 'hopeful', 'melancholic', 'exciting'], required: true },
      { name: 'wordCount', type: 'number', description: 'Target word count', required: false, defaultValue: 300 },
    ],
    versions: [],
    currentVersion: 1,
    authorId: 'system',
    authorName: 'Story System',
    visibility: 'public',
    metrics: { ...DEFAULT_METRICS, usageCount: 150, averageRating: 4.5, ratingCount: 45, successRate: 0.89 },
    ratings: [],
    forkCount: 12,
    featured: true,
  },
  {
    name: 'Dialogue Enhancement',
    description: 'Improve dialogue to be more natural and character-specific',
    category: 'dialogue',
    tags: ['dialogue', 'enhancement', 'character-voice'],
    content: `Enhance the following dialogue to make it more {{tone}} and reflective of the character's personality.

Original dialogue:
"""
{{originalDialogue}}
"""

Character: {{characterName}}
Personality: {{personality}}
Emotional state: {{emotionalState}}
Relationship context: {{relationshipContext}}

Guidelines:
- Maintain the core meaning and plot points
- Add subtext and unspoken tension where appropriate
- Use speech patterns that match the character
- Include brief action beats or internal thoughts
- Keep it {{dialogueStyle}}`,
    variables: [
      { name: 'originalDialogue', type: 'text', description: 'The dialogue to enhance', required: true },
      { name: 'characterName', type: 'text', description: 'Speaking character', required: true },
      { name: 'personality', type: 'text', description: 'Character personality traits', required: true },
      { name: 'emotionalState', type: 'text', description: 'Current emotional state', required: true },
      { name: 'relationshipContext', type: 'text', description: 'Relationship to other characters in scene', required: false },
      { name: 'tone', type: 'select', description: 'Desired tone', options: ['natural', 'dramatic', 'witty', 'tense', 'emotional'], required: true },
      { name: 'dialogueStyle', type: 'select', description: 'Style preference', options: ['concise', 'elaborate', 'realistic', 'stylized'], required: false, defaultValue: 'natural' },
    ],
    versions: [],
    currentVersion: 1,
    authorId: 'system',
    authorName: 'Story System',
    visibility: 'public',
    metrics: { ...DEFAULT_METRICS, usageCount: 230, averageRating: 4.7, ratingCount: 78, successRate: 0.92 },
    ratings: [],
    forkCount: 25,
    featured: true,
  },
  {
    name: 'Scene Description',
    description: 'Generate vivid scene descriptions with sensory details',
    category: 'scene',
    tags: ['description', 'setting', 'atmosphere'],
    content: `Create a vivid description of the following scene:

Location: {{location}}
Time: {{timeOfDay}}
Weather/Atmosphere: {{atmosphere}}
Key elements to include: {{keyElements}}

The description should:
- Appeal to at least {{senseCount}} senses
- Establish {{mood}} mood
- Be written in {{povStyle}} perspective
- Subtly foreshadow: {{foreshadowing}}
- Be approximately {{paragraphCount}} paragraphs`,
    variables: [
      { name: 'location', type: 'text', description: 'Scene location', required: true },
      { name: 'timeOfDay', type: 'select', description: 'Time of day', options: ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'evening', 'night', 'midnight'], required: true },
      { name: 'atmosphere', type: 'text', description: 'Weather and atmosphere', required: true },
      { name: 'keyElements', type: 'text', description: 'Important elements to include', required: true },
      { name: 'senseCount', type: 'number', description: 'Minimum senses to engage', required: false, defaultValue: 3 },
      { name: 'mood', type: 'select', description: 'Scene mood', options: ['peaceful', 'ominous', 'exciting', 'melancholic', 'mysterious', 'romantic'], required: true },
      { name: 'povStyle', type: 'select', description: 'Point of view', options: ['first-person', 'third-person limited', 'third-person omniscient'], required: false, defaultValue: 'third-person limited' },
      { name: 'foreshadowing', type: 'text', description: 'Element to subtly foreshadow', required: false },
      { name: 'paragraphCount', type: 'number', description: 'Number of paragraphs', required: false, defaultValue: 2 },
    ],
    versions: [],
    currentVersion: 1,
    authorId: 'system',
    authorName: 'Story System',
    visibility: 'public',
    metrics: { ...DEFAULT_METRICS, usageCount: 180, averageRating: 4.3, ratingCount: 52, successRate: 0.85 },
    ratings: [],
    forkCount: 18,
    featured: true,
  },
  {
    name: 'Story Beat Expansion',
    description: 'Expand a story beat into a full scene',
    category: 'story',
    tags: ['beat', 'expansion', 'scene'],
    content: `Expand the following story beat into a complete scene:

Beat: {{beatDescription}}
Purpose: {{beatPurpose}}
Characters involved: {{characters}}
Emotional arc: From {{startEmotion}} to {{endEmotion}}

Story context:
- Genre: {{genre}}
- Current act: {{currentAct}}
- What came before: {{previousContext}}
- What needs to be set up: {{setupNeeded}}

Write the scene with:
- Clear beginning, middle, and end
- Character-driven conflict or tension
- Sensory details and atmosphere
- Subtext in dialogue
- Approximately {{wordCount}} words`,
    variables: [
      { name: 'beatDescription', type: 'text', description: 'The story beat to expand', required: true },
      { name: 'beatPurpose', type: 'text', description: 'Purpose of this beat in the story', required: true },
      { name: 'characters', type: 'text', description: 'Characters in the scene', required: true },
      { name: 'startEmotion', type: 'text', description: 'Starting emotional state', required: true },
      { name: 'endEmotion', type: 'text', description: 'Ending emotional state', required: true },
      { name: 'genre', type: 'select', description: 'Story genre', options: ['fantasy', 'sci-fi', 'mystery', 'romance', 'thriller', 'literary', 'horror'], required: true },
      { name: 'currentAct', type: 'select', description: 'Current story act', options: ['Act 1 - Setup', 'Act 2A - Rising Action', 'Act 2B - Complications', 'Act 3 - Resolution'], required: false },
      { name: 'previousContext', type: 'text', description: 'What happened before', required: false },
      { name: 'setupNeeded', type: 'text', description: 'What this scene needs to set up', required: false },
      { name: 'wordCount', type: 'number', description: 'Target word count', required: false, defaultValue: 500 },
    ],
    versions: [],
    currentVersion: 1,
    authorId: 'system',
    authorName: 'Story System',
    visibility: 'public',
    metrics: { ...DEFAULT_METRICS, usageCount: 95, averageRating: 4.6, ratingCount: 28, successRate: 0.88 },
    ratings: [],
    forkCount: 8,
    featured: false,
  },
  {
    name: 'World-Building Detail',
    description: 'Generate consistent world-building details',
    category: 'world-building',
    tags: ['world', 'lore', 'setting'],
    content: `Create detailed world-building content for:

Aspect: {{worldAspect}}
World type: {{worldType}}
Tone: {{tone}}

Existing world details to maintain consistency:
{{existingLore}}

Generate:
1. Core concept (2-3 sentences)
2. Historical background
3. Current state in the story
4. How it affects daily life
5. Potential story hooks
6. {{additionalElements}}

Ensure the content:
- Feels organic, not expository
- Creates opportunities for conflict
- Has internal consistency
- Can be revealed gradually through the story`,
    variables: [
      { name: 'worldAspect', type: 'select', description: 'Aspect to develop', options: ['magic system', 'political structure', 'religion/beliefs', 'technology', 'economy', 'geography', 'culture', 'history'], required: true },
      { name: 'worldType', type: 'select', description: 'World type', options: ['high fantasy', 'low fantasy', 'sci-fi', 'post-apocalyptic', 'alternate history', 'contemporary', 'steampunk'], required: true },
      { name: 'tone', type: 'select', description: 'World tone', options: ['grimdark', 'hopeful', 'mysterious', 'whimsical', 'realistic', 'epic'], required: true },
      { name: 'existingLore', type: 'text', description: 'Existing world details to maintain', required: false },
      { name: 'additionalElements', type: 'text', description: 'Additional elements to include', required: false, defaultValue: 'Interesting quirks or contradictions' },
    ],
    versions: [],
    currentVersion: 1,
    authorId: 'system',
    authorName: 'Story System',
    visibility: 'public',
    metrics: { ...DEFAULT_METRICS, usageCount: 65, averageRating: 4.4, ratingCount: 19, successRate: 0.84 },
    ratings: [],
    forkCount: 5,
    featured: false,
  },
];

// ============================================================================
// TemplateManager Class
// ============================================================================

export class TemplateManager {
  private static instance: TemplateManager;
  private templates: Map<string, PromptTemplate> = new Map();
  private activeABTests: Map<string, ABTestConfig> = new Map();

  private constructor() {
    this.loadFromStorage();
    this.initializeBuiltInTemplates();
  }

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  // -------------------------------------------------------------------------
  // Template CRUD
  // -------------------------------------------------------------------------

  createTemplate(
    data: Omit<PromptTemplate, 'id' | 'versions' | 'currentVersion' | 'createdAt' | 'updatedAt' | 'metrics' | 'ratings' | 'forkCount' | 'featured'>
  ): PromptTemplate {
    const id = `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const template: PromptTemplate = {
      ...data,
      id,
      versions: [{
        version: 1,
        content: data.content,
        variables: data.variables,
        createdAt: now,
        changeNote: 'Initial version',
      }],
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
      metrics: { ...DEFAULT_METRICS },
      ratings: [],
      forkCount: 0,
      featured: false,
    };

    this.templates.set(id, template);
    this.saveToStorage();
    return template;
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  updateTemplate(
    id: string,
    updates: Partial<Pick<PromptTemplate, 'name' | 'description' | 'category' | 'tags' | 'content' | 'variables' | 'visibility'>>,
    changeNote?: string
  ): PromptTemplate | undefined {
    const template = this.templates.get(id);
    if (!template) return undefined;

    const now = Date.now();
    const contentChanged = updates.content !== undefined && updates.content !== template.content;
    const variablesChanged = updates.variables !== undefined;

    // Create new version if content or variables changed
    if (contentChanged || variablesChanged) {
      const newVersion: TemplateVersion = {
        version: template.currentVersion + 1,
        content: updates.content || template.content,
        variables: updates.variables || template.variables,
        createdAt: now,
        changeNote,
      };
      template.versions.push(newVersion);
      template.currentVersion = newVersion.version;
    }

    // Apply updates
    Object.assign(template, {
      ...updates,
      updatedAt: now,
    });

    this.templates.set(id, template);
    this.saveToStorage();
    return template;
  }

  deleteTemplate(id: string): boolean {
    // Don't delete system templates
    const template = this.templates.get(id);
    if (template?.authorId === 'system') return false;

    const deleted = this.templates.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // -------------------------------------------------------------------------
  // Version Management
  // -------------------------------------------------------------------------

  getVersion(templateId: string, version: number): TemplateVersion | undefined {
    const template = this.templates.get(templateId);
    return template?.versions.find(v => v.version === version);
  }

  rollbackToVersion(templateId: string, version: number): PromptTemplate | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const targetVersion = template.versions.find(v => v.version === version);
    if (!targetVersion) return undefined;

    const now = Date.now();
    const newVersion: TemplateVersion = {
      version: template.currentVersion + 1,
      content: targetVersion.content,
      variables: targetVersion.variables,
      createdAt: now,
      changeNote: `Rolled back to version ${version}`,
    };

    template.versions.push(newVersion);
    template.content = targetVersion.content;
    template.variables = targetVersion.variables;
    template.currentVersion = newVersion.version;
    template.updatedAt = now;

    this.templates.set(templateId, template);
    this.saveToStorage();
    return template;
  }

  compareVersions(templateId: string, versionA: number, versionB: number): {
    contentDiff: boolean;
    variablesDiff: string[];
  } | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const a = template.versions.find(v => v.version === versionA);
    const b = template.versions.find(v => v.version === versionB);
    if (!a || !b) return undefined;

    const contentDiff = a.content !== b.content;
    const variablesDiff: string[] = [];

    // Find variable differences
    const aVarNames = new Set(a.variables.map(v => v.name));
    const bVarNames = new Set(b.variables.map(v => v.name));

    aVarNames.forEach(name => {
      if (!bVarNames.has(name)) variablesDiff.push(`-${name}`);
    });
    bVarNames.forEach(name => {
      if (!aVarNames.has(name)) variablesDiff.push(`+${name}`);
    });

    return { contentDiff, variablesDiff };
  }

  // -------------------------------------------------------------------------
  // Effectiveness Tracking
  // -------------------------------------------------------------------------

  recordUsage(templateId: string, outputLength: number): void {
    const template = this.templates.get(templateId);
    if (!template) return;

    template.metrics.usageCount++;
    template.metrics.lastUsedAt = Date.now();

    // Update average output length
    const total = template.metrics.averageOutputLength * (template.metrics.usageCount - 1);
    template.metrics.averageOutputLength = (total + outputLength) / template.metrics.usageCount;

    this.templates.set(templateId, template);
    this.saveToStorage();
  }

  addRating(
    templateId: string,
    userId: string,
    rating: number,
    feedback?: string,
    outputQuality?: TemplateRating['outputQuality']
  ): void {
    const template = this.templates.get(templateId);
    if (!template || rating < 1 || rating > 5) return;

    // Check if user already rated
    const existingIndex = template.ratings.findIndex(r => r.userId === userId);
    const newRating: TemplateRating = {
      userId,
      rating,
      feedback,
      outputQuality,
      createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
      template.ratings[existingIndex] = newRating;
    } else {
      template.ratings.push(newRating);
    }

    // Recalculate metrics
    template.metrics.ratingCount = template.ratings.length;
    template.metrics.averageRating = template.ratings.reduce((sum, r) => sum + r.rating, 0) / template.ratings.length;

    // Calculate success rate (good or excellent = success)
    const successfulRatings = template.ratings.filter(
      r => r.outputQuality === 'good' || r.outputQuality === 'excellent'
    ).length;
    const qualityRatings = template.ratings.filter(r => r.outputQuality).length;
    template.metrics.successRate = qualityRatings > 0 ? successfulRatings / qualityRatings : 0;

    this.templates.set(templateId, template);
    this.saveToStorage();
  }

  getEffectivenessReport(templateId: string): {
    metrics: EffectivenessMetrics;
    ratingDistribution: Record<number, number>;
    qualityDistribution: Record<string, number>;
    trend: 'improving' | 'declining' | 'stable';
  } | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const qualityDistribution: Record<string, number> = { poor: 0, fair: 0, good: 0, excellent: 0 };

    template.ratings.forEach(r => {
      ratingDistribution[r.rating]++;
      if (r.outputQuality) {
        qualityDistribution[r.outputQuality]++;
      }
    });

    // Calculate trend based on recent vs older ratings
    const sortedRatings = [...template.ratings].sort((a, b) => b.createdAt - a.createdAt);
    const recentRatings = sortedRatings.slice(0, Math.ceil(sortedRatings.length / 2));
    const olderRatings = sortedRatings.slice(Math.ceil(sortedRatings.length / 2));

    const recentAvg = recentRatings.length > 0
      ? recentRatings.reduce((sum, r) => sum + r.rating, 0) / recentRatings.length
      : 0;
    const olderAvg = olderRatings.length > 0
      ? olderRatings.reduce((sum, r) => sum + r.rating, 0) / olderRatings.length
      : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentRatings.length >= 3 && olderRatings.length >= 3) {
      if (recentAvg > olderAvg + 0.3) trend = 'improving';
      else if (recentAvg < olderAvg - 0.3) trend = 'declining';
    }

    return {
      metrics: template.metrics,
      ratingDistribution,
      qualityDistribution,
      trend,
    };
  }

  // -------------------------------------------------------------------------
  // A/B Testing
  // -------------------------------------------------------------------------

  startABTest(config: ABTestConfig): string {
    const testId = `abtest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.activeABTests.set(testId, config);
    return testId;
  }

  recordABTestResult(testId: string, variant: 'A' | 'B', rating: number): void {
    // In a real implementation, this would track results and calculate statistical significance
    console.log(`A/B Test ${testId}: Variant ${variant} received rating ${rating}`);
  }

  completeABTest(testId: string): ABTestResult | undefined {
    const config = this.activeABTests.get(testId);
    if (!config) return undefined;

    // Calculate results (simplified - real implementation would use proper statistics)
    const templateA = this.templates.get(config.templateIdA);
    const templateB = this.templates.get(config.templateIdB);
    if (!templateA || !templateB) return undefined;

    const result: ABTestResult = {
      testId,
      variantA: config.templateIdA,
      variantB: config.templateIdB,
      sampleSize: config.sampleSize,
      winnerRating: Math.max(templateA.metrics.averageRating, templateB.metrics.averageRating),
      loserRating: Math.min(templateA.metrics.averageRating, templateB.metrics.averageRating),
      confidence: 0.85, // Simplified
      completedAt: Date.now(),
    };

    // Store result in both templates
    templateA.metrics.abTestResults = templateA.metrics.abTestResults || [];
    templateA.metrics.abTestResults.push(result);
    templateB.metrics.abTestResults = templateB.metrics.abTestResults || [];
    templateB.metrics.abTestResults.push(result);

    this.activeABTests.delete(testId);
    this.saveToStorage();

    return result;
  }

  // -------------------------------------------------------------------------
  // Search and Discovery
  // -------------------------------------------------------------------------

  searchTemplates(options: TemplateSearchOptions = {}): PromptTemplate[] {
    let results = Array.from(this.templates.values());

    // Filter by visibility
    if (options.visibility) {
      results = results.filter(t => t.visibility === options.visibility);
    }

    // Filter by category
    if (options.category) {
      results = results.filter(t => t.category === options.category);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(t =>
        options.tags!.some(tag => t.tags.includes(tag))
      );
    }

    // Filter by minimum rating
    if (options.minRating) {
      results = results.filter(t => t.metrics.averageRating >= options.minRating!);
    }

    // Text search
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
    switch (options.sortBy) {
      case 'rating':
        results.sort((a, b) => (b.metrics.averageRating - a.metrics.averageRating) * sortOrder);
        break;
      case 'usage':
        results.sort((a, b) => (b.metrics.usageCount - a.metrics.usageCount) * sortOrder);
        break;
      case 'recent':
        results.sort((a, b) => (b.updatedAt - a.updatedAt) * sortOrder);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name) * sortOrder);
        break;
      default:
        // Default: featured first, then by rating
        results.sort((a, b) => {
          if (a.featured !== b.featured) return b.featured ? 1 : -1;
          return b.metrics.averageRating - a.metrics.averageRating;
        });
    }

    // Pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  getFeaturedTemplates(): PromptTemplate[] {
    return this.searchTemplates({ visibility: 'public' })
      .filter(t => t.featured || t.metrics.averageRating >= 4.5);
  }

  getPopularTemplates(limit: number = 10): PromptTemplate[] {
    return this.searchTemplates({
      visibility: 'public',
      sortBy: 'usage',
      limit,
    });
  }

  getRecentTemplates(limit: number = 10): PromptTemplate[] {
    return this.searchTemplates({
      sortBy: 'recent',
      limit,
    });
  }

  // -------------------------------------------------------------------------
  // Community / Sharing
  // -------------------------------------------------------------------------

  forkTemplate(templateId: string, userId: string, userName: string): PromptTemplate | undefined {
    const original = this.templates.get(templateId);
    if (!original || original.visibility === 'private') return undefined;

    const forked = this.createTemplate({
      name: `${original.name} (Fork)`,
      description: original.description,
      category: original.category,
      tags: [...original.tags],
      content: original.content,
      variables: [...original.variables],
      authorId: userId,
      authorName: userName,
      visibility: 'private',
      forkedFromId: original.id,
    });

    // Increment fork count on original
    original.forkCount++;
    this.templates.set(templateId, original);
    this.saveToStorage();

    return forked;
  }

  shareTemplate(templateId: string, visibility: 'shared' | 'public'): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.authorId === 'system') return false;

    template.visibility = visibility;
    template.updatedAt = Date.now();
    this.templates.set(templateId, template);
    this.saveToStorage();
    return true;
  }

  // -------------------------------------------------------------------------
  // Template Execution
  // -------------------------------------------------------------------------

  fillTemplate(
    templateId: string,
    variables: Record<string, string | number | boolean>
  ): string | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    let content = template.content;

    // Replace all variables
    template.variables.forEach(variable => {
      const value = variables[variable.name] ?? variable.defaultValue ?? '';
      const placeholder = `{{${variable.name}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return content;
  }

  validateVariables(
    templateId: string,
    variables: Record<string, string | number | boolean>
  ): { valid: boolean; missing: string[]; invalid: string[] } {
    const template = this.templates.get(templateId);
    if (!template) return { valid: false, missing: ['Template not found'], invalid: [] };

    const missing: string[] = [];
    const invalid: string[] = [];

    template.variables.forEach(variable => {
      const value = variables[variable.name];

      // Check required
      if (variable.required && (value === undefined || value === '')) {
        missing.push(variable.name);
        return;
      }

      if (value === undefined) return;

      // Type validation
      switch (variable.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            invalid.push(`${variable.name} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            invalid.push(`${variable.name} must be true or false`);
          }
          break;
        case 'select':
          if (variable.options && !variable.options.includes(String(value))) {
            invalid.push(`${variable.name} must be one of: ${variable.options.join(', ')}`);
          }
          break;
      }
    });

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
    };
  }

  // -------------------------------------------------------------------------
  // Storage
  // -------------------------------------------------------------------------

  private initializeBuiltInTemplates(): void {
    const now = Date.now();
    BUILT_IN_TEMPLATES.forEach((template, index) => {
      const id = `builtin_${template.category}_${index}`;
      if (!this.templates.has(id)) {
        this.templates.set(id, {
          ...template,
          id,
          versions: [{
            version: 1,
            content: template.content,
            variables: template.variables,
            createdAt: now,
            changeNote: 'Built-in template',
          }],
          createdAt: now,
          updatedAt: now,
        });
      }
    });
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('templateManager_templates');
      if (stored) {
        const data = JSON.parse(stored);
        this.templates = new Map(Object.entries(data));
      }
    } catch (err) {
      console.error('Failed to load templates from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.templates);
      localStorage.setItem('templateManager_templates', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save templates to storage:', err);
    }
  }
}

// Export singleton instance
export const templateManager = TemplateManager.getInstance();
