/**
 * Visual Novel CSS Styles
 *
 * Classic VN layout: fullscreen background, semi-transparent dialogue box
 * at the bottom, speaker name, choice buttons with fade-in animation.
 */

interface ArtStyle {
  palette: string[];
  backgroundColor: string;
  accentColor: string;
  fontFamily?: string;
}

export function generateVNCss(artStyle?: ArtStyle): string {
  const bg = artStyle?.backgroundColor || '#0a0a1a';
  const accent = artStyle?.accentColor || '#06b6d4';
  const font = artStyle?.fontFamily || "'Segoe UI', system-ui, sans-serif";
  const dialogueBg = artStyle?.palette?.[0] || 'rgba(0, 0, 0, 0.75)';

  return `
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%; height: 100vh; overflow: hidden;
  background: ${bg}; color: #e2e8f0;
  font-family: ${font};
}

/* Fullscreen background image */
#vn-background {
  position: fixed; inset: 0;
  background-size: cover; background-position: center;
  transition: opacity 0.3s ease-in-out;
  z-index: 1;
}

/* Scene transition overlay */
.scene-transition {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}
.scene-transition.active { opacity: 1; }

/* Dialogue box at bottom */
#vn-dialogue-box {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 30vh; min-height: 160px;
  background: ${dialogueBg};
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: 20px 40px;
  z-index: 10;
  cursor: pointer;
  display: flex; flex-direction: column; justify-content: flex-start;
}

#vn-speaker {
  font-size: 1.1rem; font-weight: 700;
  color: ${accent};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

#vn-text {
  font-size: 1rem; line-height: 1.6;
  color: #e2e8f0;
  max-width: 800px;
}

/* Advance indicator */
#vn-advance-hint {
  position: absolute; bottom: 12px; right: 24px;
  font-size: 0.75rem; color: rgba(255,255,255,0.4);
  animation: blink 1.2s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Choice buttons container */
#vn-choices {
  position: fixed; bottom: 32vh; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 12px;
  align-items: center;
  z-index: 20;
}

.vn-choice-btn {
  padding: 12px 32px;
  background: rgba(0,0,0,0.7);
  border: 1px solid ${accent};
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 1rem;
  cursor: pointer;
  min-width: 240px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.4s ease-in-out, background 0.2s;
}
.vn-choice-btn.visible { opacity: 1; }
.vn-choice-btn:hover {
  background: ${accent};
  color: #000;
}

/* Ending overlay */
#vn-ending {
  position: fixed; inset: 0;
  display: none; align-items: center; justify-content: center;
  flex-direction: column; gap: 16px;
  background: rgba(0,0,0,0.85);
  z-index: 30;
}
#vn-ending.active { display: flex; }
#vn-ending h1 {
  font-size: 2.5rem; font-weight: 300;
  letter-spacing: 0.15em;
  color: ${accent};
}
#vn-ending p { font-size: 1rem; color: #94a3b8; }
`;
}
