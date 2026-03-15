/**
 * CSS string generation with art-style adaptive theming for the HTML5 reader.
 */

import type { StoryExportData } from '../types';

const DEFAULT_BG = '#0f172a';
const DEFAULT_TEXT = '#e2e8f0';
const DEFAULT_ACCENT = '#06b6d4';
const DEFAULT_FONT = 'system-ui, -apple-system, sans-serif';

/**
 * Generate CSS for the HTML5 reader.
 * Adapts to the project art style palette when provided.
 */
export function generateReaderCSS(artStyle?: StoryExportData['artStyle']): string {
  const bg = artStyle?.backgroundColor || DEFAULT_BG;
  const accent = artStyle?.accentColor || DEFAULT_ACCENT;
  const text = artStyle?.palette?.[0] || DEFAULT_TEXT;
  const font = artStyle?.fontFamily || DEFAULT_FONT;

  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  height: 100%;
}

body {
  background-color: ${bg};
  color: ${text};
  font-family: ${font};
  line-height: 1.7;
  height: 100%;
  overflow-y: auto;
}

.scene-page {
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.scene-page h2 {
  color: ${accent};
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
}

.scene-illustration {
  max-width: 80%;
  max-height: 50vh;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  object-fit: contain;
}

.scene-content {
  max-width: 65ch;
  font-size: 1.125rem;
  text-align: justify;
}

.scene-content p {
  margin-bottom: 1em;
}

.play-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  background: ${accent};
  color: ${bg};
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.play-btn:hover { opacity: 0.85; }

.nav-dots {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.nav-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${text};
  opacity: 0.3;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.nav-dot.active {
  opacity: 1;
  background: ${accent};
}

.title-page {
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title-page h1 {
  font-size: 3rem;
  color: ${accent};
  margin-bottom: 0.5rem;
}

.title-page .author {
  font-size: 1.25rem;
  opacity: 0.7;
}

audio { display: none; }
`;
}
