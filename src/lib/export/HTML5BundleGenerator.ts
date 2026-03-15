/**
 * HTML5 Single-File Bundle Generator
 *
 * Produces a self-contained HTML file with all images and audio
 * inlined as base64 data URLs. The resulting file works offline
 * by simply double-clicking it in any browser.
 */

import type { StoryExportData, StoryExportScene } from './types';
import { slugify } from './types';
import type { ExportResult } from './index';
import { generateReaderCSS } from './templates/reader-styles';
import { generateReaderBody, generateReaderHTML, generateReaderJS } from './templates/html5-reader';
import type { RenderedScene } from './templates/html5-reader';

// ============================================================================
// HTML5BundleGenerator
// ============================================================================

export class HTML5BundleGenerator {
  /**
   * Generate a self-contained HTML5 bundle from story export data.
   */
  async generate(data: StoryExportData): Promise<ExportResult> {
    // Render each scene with inlined assets
    const renderedScenes: RenderedScene[] = await Promise.all(
      data.scenes.map((scene) => this.renderScene(scene))
    );

    // Assemble template parts
    const css = generateReaderCSS(data.artStyle);
    const body = generateReaderBody(renderedScenes);
    const js = generateReaderJS(data.scenes.length);
    const html = generateReaderHTML(data.title, css, body, js);

    // Build result
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `${slugify(data.title) || 'story'}.html`;

    const wordCount = data.scenes.reduce(
      (sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length,
      0
    );

    return {
      blob,
      filename,
      format: 'html5',
      metadata: {
        sceneCount: data.scenes.length,
        wordCount,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private async renderScene(scene: StoryExportScene): Promise<RenderedScene> {
    const rendered: RenderedScene = {
      name: scene.name,
      content: scene.content,
    };

    if (scene.imageUrl) {
      rendered.imageDataUrl = await this.fetchAndEncode(scene.imageUrl, 'image');
    }

    if (scene.narrationUrl) {
      rendered.audioDataUrl = await this.fetchAndEncode(scene.narrationUrl, 'audio');
    }

    return rendered;
  }

  /**
   * Fetch a URL and convert to a base64 data URL.
   * Passes through existing data: URLs unchanged.
   */
  private async fetchAndEncode(
    url: string,
    kind: 'image' | 'audio'
  ): Promise<string> {
    // Already a data URL -- pass through
    if (url.startsWith('data:')) {
      return url;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${kind} from ${url}: ${response.status}`);
        return '';
      }

      const buffer = await response.arrayBuffer();
      const contentType =
        response.headers.get('content-type') ||
        (kind === 'image' ? 'image/png' : 'audio/mpeg');

      const base64 = this.arrayBufferToBase64(buffer);
      return `data:${contentType};base64,${base64}`;
    } catch (err) {
      console.warn(`Error fetching ${kind} from ${url}:`, err);
      return '';
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
