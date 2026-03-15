/**
 * Visual Novel HTML Template and JS State Machine Engine
 *
 * Produces the interactive VN experience: dialogue lines with click-to-advance,
 * branching choices, auto-play audio, and scene transitions with fade effects.
 */

// ============================================================================
// Types
// ============================================================================

export interface VNSceneData {
  name: string;
  lines: VNLine[];
  choices: VNChoice[];
  backgroundDataUrl: string;
  isEnding: boolean;
}

export interface VNLine {
  speaker: string;
  text: string;
  audioUrl?: string;
}

export interface VNChoice {
  label: string;
  targetIndex: number;
}

// ============================================================================
// Engine JS generator
// ============================================================================

/**
 * Generate the JS state machine that drives the VN experience.
 * Embeds scene data as JSON and provides showLine/advance/showChoices/goToScene.
 */
export function generateVNEngine(scenes: VNSceneData[]): string {
  const scenesJSON = JSON.stringify(scenes);

  return `
(function() {
  'use strict';

  var scenes = ${scenesJSON};
  var currentSceneIndex = 0;
  var currentLineIndex = 0;
  var currentAudio = null;
  var waitingForChoice = false;

  var bgEl = document.getElementById('vn-background');
  var speakerEl = document.getElementById('vn-speaker');
  var textEl = document.getElementById('vn-text');
  var hintEl = document.getElementById('vn-advance-hint');
  var choicesEl = document.getElementById('vn-choices');
  var endingEl = document.getElementById('vn-ending');
  var endingTitle = document.getElementById('vn-ending-title');
  var dialogueBox = document.getElementById('vn-dialogue-box');

  function showLine() {
    var scene = scenes[currentSceneIndex];
    if (!scene) return;

    // Update background if scene has one
    if (scene.backgroundDataUrl) {
      bgEl.style.backgroundImage = 'url(' + scene.backgroundDataUrl + ')';
    }

    var line = scene.lines[currentLineIndex];
    if (!line) {
      // No more lines -- show choices or ending
      showChoices();
      return;
    }

    speakerEl.textContent = line.speaker;
    textEl.textContent = line.text;
    hintEl.style.display = 'block';
    choicesEl.innerHTML = '';

    // Auto-play audio if line has audioUrl
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (line.audioUrl) {
      currentAudio = new Audio(line.audioUrl);
      currentAudio.play().catch(function() {});
    }
  }

  function advance() {
    if (waitingForChoice) return;

    var scene = scenes[currentSceneIndex];
    if (!scene) return;

    currentLineIndex++;
    if (currentLineIndex >= scene.lines.length) {
      showChoices();
    } else {
      showLine();
    }
  }

  function showChoices() {
    var scene = scenes[currentSceneIndex];
    hintEl.style.display = 'none';

    if (scene.choices && scene.choices.length > 0) {
      waitingForChoice = true;
      choicesEl.innerHTML = '';

      scene.choices.forEach(function(choice, i) {
        var btn = document.createElement('button');
        btn.className = 'vn-choice-btn';
        btn.textContent = choice.label;
        btn.onclick = function() { goToScene(choice.targetIndex); };
        choicesEl.appendChild(btn);

        // Staggered fade-in
        setTimeout(function() {
          btn.classList.add('visible');
        }, 100 * (i + 1));
      });

      speakerEl.textContent = '';
      textEl.textContent = '';
    } else {
      // Dead-end or explicit ending
      showEnding();
    }
  }

  function goToScene(index) {
    waitingForChoice = false;
    choicesEl.innerHTML = '';

    // Fade out
    bgEl.style.opacity = '0';

    setTimeout(function() {
      currentSceneIndex = index;
      currentLineIndex = 0;
      bgEl.style.opacity = '1';
      showLine();
    }, 300);
  }

  function showEnding() {
    var title = document.title || 'Story';
    endingEl.classList.add('active');
    endingTitle.textContent = 'The End';

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  // Click/tap to advance
  dialogueBox.addEventListener('click', function() { advance(); });

  // Keyboard controls
  document.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      advance();
    }

    // Number keys 1-9 for choice selection
    var num = parseInt(e.key, 10);
    if (num >= 1 && num <= 9 && waitingForChoice) {
      var btns = choicesEl.querySelectorAll('.vn-choice-btn');
      if (btns[num - 1]) btns[num - 1].click();
    }
  });

  // Start
  showLine();
})();
`;
}

// ============================================================================
// HTML document generator
// ============================================================================

/**
 * Generate the complete HTML document for the visual novel.
 */
export function generateVNHTML(
  title: string,
  css: string,
  bodyHTML: string,
  engineJS: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)}</title>
<style>${css}</style>
</head>
<body>
${bodyHTML}
<script>${engineJS}</script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
