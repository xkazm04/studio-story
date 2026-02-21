/**
 * Art Style Types
 * Type definitions for the story art style system
 */

export interface ArtStyle {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  /** Image URL for the art style preview */
  imageUrl: string;
  /** Full art style prompt for image generation */
  stylePrompt: string;
  /** Color palette description */
  colorPalette: string;
  /** Rendering technique description */
  renderingTechnique: string;
  /** Key visual features */
  visualFeatures: string;
  /** Example shows/franchises using this style */
  examples?: string[];
}

export type ArtStyleSource = 'preset' | 'custom' | 'extracted';

export interface ArtStyleConfig {
  styleId: string | null;
  customPrompt: string | null;
  source: ArtStyleSource;
  extractedImageUrl: string | null;
}

export interface ArtStyleDetails {
  icon: string;
  label: string;
  description?: string;
}

export interface ArtStyleEditorProps {
  projectId: string;
  onSave?: () => void;
}

export interface ArtStylePresetSelectorProps {
  selectedStyleId: string | null;
  onSelect: (styleId: string) => void;
  disabled?: boolean;
}

export interface ArtStyleExtractorProps {
  customPrompt: string;
  extractedImageUrl: string | null;
  onExtract: (prompt: string, imageUrl: string) => void;
  onCustomPromptChange: (prompt: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export interface StyleImageCardProps {
  imageUrl: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export interface ImageUploadAreaProps {
  onUpload: (file: File, dataUrl: string) => void;
  disabled?: boolean;
  className?: string;
}
