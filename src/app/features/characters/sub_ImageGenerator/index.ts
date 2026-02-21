/**
 * Image Generator Module
 * Character image generation with sketch → final workflow
 */

export { default as ImageGenerator } from './ImageGenerator';
export { default as SelectionPanel } from './components/SelectionPanel';
export { default as PromptPreview } from './components/PromptPreview';
export { default as SketchGrid } from './components/SketchGrid';
export { default as FinalPreview } from './components/FinalPreview';
export { default as ImageGallery } from './components/ImageGallery';
export type { GalleryImage } from './components/ImageGallery';

// Default export for dynamic import
export { default } from './ImageGenerator';
