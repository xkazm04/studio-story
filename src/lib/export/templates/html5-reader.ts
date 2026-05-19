/**
 * HTML template assembly functions for the HTML5 reader layout.
 */

import { escapeHtml } from '../utils';

// ============================================================================
// Types
// ============================================================================

export interface RenderedScene {
  name: string;
  content: string;
  imageDataUrl?: string;
  audioDataUrl?: string;
}

// ============================================================================
// Body Generation
// ============================================================================

/**
 * Generate the HTML body with one scene-page section per scene.
 */
export function generateReaderBody(scenes: RenderedScene[]): string {
  const pages = scenes.map((scene, i) => {
    const parts: string[] = [];
    parts.push(`<section class="scene-page" data-index="${i}">`);

    if (scene.imageDataUrl) {
      parts.push(`  <img class="scene-illustration" src="${scene.imageDataUrl}" alt="${escapeHtml(scene.name)}" />`);
    }

    parts.push(`  <h2>${escapeHtml(scene.name)}</h2>`);
    parts.push(`  <div class="scene-content">${scene.content}</div>`);

    if (scene.audioDataUrl) {
      parts.push(`  <audio id="audio-${i}" src="${scene.audioDataUrl}" preload="none"></audio>`);
      parts.push(`  <button class="play-btn" onclick="togglePlay(${i})">&#9654; Play Narration</button>`);
    }

    parts.push(`</section>`);
    return parts.join('\n');
  });

  // Navigation dots
  const dots = scenes.map((_, i) =>
    `<button class="nav-dot${i === 0 ? ' active' : ''}" data-target="${i}" onclick="goToScene(${i})"></button>`
  ).join('\n  ');

  return `${pages.join('\n\n')}\n\n<nav class="nav-dots">\n  ${dots}\n</nav>`;
}

// ============================================================================
// JS Generation
// ============================================================================

/**
 * Generate vanilla JS for scene navigation and audio control.
 */
export function generateReaderJS(sceneCount: number): string {
  return `
(function() {
  var current = 0;
  var total = ${sceneCount};
  var pages = document.querySelectorAll('.scene-page');
  var dots = document.querySelectorAll('.nav-dot');

  function updateDots() {
    dots.forEach(function(d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  window.goToScene = function(idx) {
    if (idx < 0 || idx >= total) return;
    current = idx;
    pages[current].scrollIntoView({ behavior: 'smooth' });
    updateDots();
  };

  window.togglePlay = function(idx) {
    var audio = document.getElementById('audio-' + idx);
    if (!audio) return;
    if (audio.paused) { audio.play(); } else { audio.pause(); }
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goToScene(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goToScene(current - 1);
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target.closest('.play-btn') || e.target.closest('.nav-dot')) return;
    goToScene(current + 1);
  });

  // Sync scroll position with dots
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        current = parseInt(entry.target.getAttribute('data-index'), 10);
        updateDots();
      }
    });
  }, { threshold: 0.5 });

  pages.forEach(function(p) { observer.observe(p); });
})();
`;
}

// ============================================================================
// Full HTML Assembly
// ============================================================================

/**
 * Assemble the complete HTML document with everything inlined.
 */
export function generateReaderHTML(title: string, css: string, body: string, js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
${body}
<script>${js}</script>
</body>
</html>`;
}

