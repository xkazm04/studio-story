/**
 * Visual Novel Generator
 *
 * Produces a single self-contained HTML file with a classic VN layout:
 * fullscreen background, dialogue box, branching choices, and auto-play audio.
 * All images and audio are inlined as base64 data URLs for offline use.
 */

import type { StoryExportData, StoryExportScene } from './types';
import { slugify } from './types';
import type { ExportResult } from './index';
import { generateVNCss } from './templates/vn-styles';
import {
  generateVNEngine,
  generateVNHTML,
  type VNSceneData,
  type VNLine,
  type VNChoice,
} from './templates/visual-novel';
import { generateGradientBackground } from './vnExportBridge';

// ============================================================================
// VisualNovelGenerator
// ============================================================================

export class VisualNovelGenerator {
  /**
   * Generate a self-contained HTML visual novel from story export data.
   */
  async generate(data: StoryExportData): Promise<ExportResult> {
    // Build a scene-id to index map for resolving choice targets
    const idToIndex = new Map<string, number>();
    data.scenes.forEach((s, i) => idToIndex.set(s.id, i));

    // Capture art style palette for gradient fallback
    const palette = data.artStyle?.palette;

    // Transform scenes into VN scene data
    const vnScenes: VNSceneData[] = await Promise.all(
      data.scenes.map((scene) => this.transformScene(scene, idToIndex, palette))
    );

    // Assemble template parts
    const css = generateVNCss(data.artStyle);
    const bodyHTML = this.buildBodyHTML();
    const engineJS = generateVNEngine(vnScenes);
    const html = generateVNHTML(data.title, css, bodyHTML, engineJS);

    // Build result
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `${slugify(data.title) || 'visual-novel'}.html`;

    const wordCount = data.scenes.reduce(
      (sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length,
      0
    );

    return {
      blob,
      filename,
      format: 'visual-novel',
      metadata: {
        sceneCount: data.scenes.length,
        wordCount,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private async transformScene(
    scene: StoryExportScene,
    idToIndex: Map<string, number>,
    artStylePalette?: string[]
  ): Promise<VNSceneData> {
    // Build dialogue lines
    let lines: VNLine[];
    if (scene.dialogueLines && scene.dialogueLines.length > 0) {
      lines = await Promise.all(
        scene.dialogueLines.map(async (dl) => {
          const line: VNLine = { speaker: dl.speaker, text: dl.text };
          if (dl.audioUrl) {
            line.audioUrl = await this.fetchAndEncode(dl.audioUrl, 'audio');
          }
          return line;
        })
      );
    } else {
      // No dialogue lines -- create a single narration line from content
      lines = [{ speaker: '', text: scene.content }];
    }

    // Build choices
    const choices: VNChoice[] = (scene.choices || [])
      .map((c) => ({
        label: c.label,
        targetIndex: idToIndex.get(c.targetSceneId) ?? 0,
      }));

    // Detect dead-end: no choices and not explicitly an ending
    const isEnding = scene.isEnding === true || (choices.length === 0);

    // Encode background image or generate gradient fallback
    let backgroundDataUrl = '';
    if (scene.imageUrl) {
      backgroundDataUrl = await this.fetchAndEncode(scene.imageUrl, 'image');
    } else {
      backgroundDataUrl = generateGradientBackground(scene.name, artStylePalette);
    }

    // Encode narration audio if present
    let narrationDataUrl = '';
    if (scene.narrationUrl) {
      narrationDataUrl = await this.fetchAndEncode(scene.narrationUrl, 'audio');
    }

    return {
      name: scene.name,
      lines,
      choices,
      backgroundDataUrl,
      isEnding,
      narrationUrl: narrationDataUrl || undefined,
    };
  }

  /**
   * Build the static body HTML (container divs for the VN engine to populate).
   */
  private buildBodyHTML(): string {
    return `
<div id="vn-background" class="scene-transition active"></div>

<div id="vn-dialogue-box">
  <div id="vn-speaker"></div>
  <div id="vn-text"></div>
  <div id="vn-advance-hint">Click or press Space to continue</div>
</div>

<div id="vn-choices"></div>

<div id="vn-ending">
  <h1 id="vn-ending-title">The End</h1>
  <p id="vn-ending-subtitle"></p>
</div>`;
  }

  /**
   * Fetch a URL and convert to a base64 data URL.
   * Passes through existing data: URLs unchanged.
   */
  private async fetchAndEncode(
    url: string,
    kind: 'image' | 'audio'
  ): Promise<string> {
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
