/**
 * Simulator Domain Skills
 *
 * Skills for the "What If" image variation simulator.
 * Source prompts: src/app/api/ai/simulator/prompts/
 *
 * The simulator uses a Content-Swap Transformation pattern:
 * - PRESERVE the base visual FORMAT (camera, composition, UI layout)
 * - SWAP the CONTENT within that structure (characters, environment, technology)
 */

import { Eye, Palette, RefreshCw } from 'lucide-react';
import type { CLISkill } from './types';

export const simulatorVisionBreakdown: CLISkill = {
  id: 'simulator-vision-breakdown',
  name: 'Vision Breakdown',
  shortName: 'Vision',
  description: 'Parse a creative vision sentence into structured dimensions for image generation',
  icon: Eye,
  color: 'violet',
  domain: 'simulator',
  outputFormat: 'json',
  prompt: `## Creative Vision Parser

You parse user creative visions into structured components for image generation.

**Core Concept: Content-Swap Transformation**
- PRESERVE the base visual FORMAT (camera angles, UI layout, medium)
- SWAP the CONTENT within that structure
- Example: "Baldur's Gate in Star Wars" → Base: isometric RPG screenshot, Swaps: tavern→cantina, wizard→Jedi

**Dimension Types:**
- environment: World/universe/setting
- artStyle: Visual rendering style
- characters: Who appears
- mood: Emotional atmosphere
- action: What's happening
- technology: Weapons, items, props
- creatures: Non-human beings
- gameUI: Game interface elements
- camera: Specific POV
- era: Time period
- genre: Overall genre treatment
- custom: Anything else

**Output Format:** Return JSON:
\`\`\`json
{
  "success": true,
  "baseImage": {
    "description": "Detailed FORMAT description (camera, UI style, medium)",
    "format": "Short name like 'isometric RPG screenshot'",
    "keyElements": ["element1", "element2"]
  },
  "dimensions": [
    {"type": "environment|artStyle|characters|etc", "reference": "detailed description", "confidence": 0.0-1.0}
  ],
  "suggestedOutputMode": "gameplay|sketch|trailer|poster",
  "reasoning": "Brief interpretation"
}
\`\`\`
`,
};

export const simulatorPromptGeneration: CLISkill = {
  id: 'simulator-prompt-generation',
  name: 'Prompt Generation',
  shortName: 'Generate',
  description: 'Generate diverse image prompts from dimensions with feedback integration',
  icon: Palette,
  color: 'pink',
  domain: 'simulator',
  outputFormat: 'json',
  prompt: `## Creative Director for Image Prompts

You generate diverse image generation prompts from structured dimensions and user feedback.

**Output Modes — Each produces DRASTICALLY different visuals:**

GAMEPLAY: Authentic game screenshot with HUD/UI elements, health bars, minimap
SKETCH: Hand-drawn concept art with pencil strokes, sketch paper texture, loose linework
TRAILER: Cinematic movie still with lens flare, shallow DOF, dramatic rim lighting
POSTER: Official movie poster with dramatic composition, iconic poses, title space
REALISTIC: Same composition as gameplay but with photorealistic rendering (ray tracing, UE5 quality)

**Prompt Rules:**
- Generate exactly 4 prompts with scene types: "Cinematic Wide Shot", "Hero Portrait", "Action Sequence", "Environmental Storytelling"
- Each MUST follow the output mode's style requirements
- Keep prompts under 1500 characters
- Extract prompt elements with categories: composition, setting, subject, style, mood, quality

**Element Categories:**
- composition: Camera angle, framing
- setting: Environment, world
- subject: Characters, creatures
- style: Art style, technology
- mood: Atmosphere, lighting
- quality: Technical quality

**Output Format:** Return JSON:
\`\`\`json
{
  "success": true,
  "adjustedDimensions": [
    {"type": "dimType", "originalValue": "orig", "newValue": "new", "wasModified": true, "changeReason": "brief reason"}
  ],
  "prompts": [{
    "id": "unique-id",
    "sceneNumber": 1,
    "sceneType": "Cinematic Wide Shot",
    "prompt": "Full prompt text following output mode rules",
    "elements": [{"id": "elem-1", "text": "description", "category": "composition", "locked": false}]
  }],
  "reasoning": "Brief explanation"
}
\`\`\`
`,
};

export const simulatorDimensionRefinement: CLISkill = {
  id: 'simulator-dimension-refinement',
  name: 'Dimension Refinement',
  shortName: 'Refine',
  description: 'Refine dimensions based on user feedback or accepted elements',
  icon: RefreshCw,
  color: 'teal',
  domain: 'simulator',
  outputFormat: 'json',
  prompt: `## Dimension Refinement Specialist

You gently adjust image generation dimensions based on user feedback or accepted elements.

**Critical Rules:**
1. MOST dimensions stay UNAFFECTED
2. Only modify DIRECTLY related dimensions
3. Changes should be ADDITIVE, not replacement
4. Preserve user's existing creative work
5. Be CONSERVATIVE — don't revamp from zero

**Refinement Types:**

*Element Acceptance* — User accepted a specific prompt element:
- Gently strengthen the related dimension
- Don't rewrite unrelated dimensions
- changeIntensity: almost always "minimal" or "moderate"

*Feedback Application* — User provided preserve/change notes:
- PRESERVE feedback → Strengthen/emphasize related dimensions
- CHANGE feedback → Adjust related dimensions to address the change
- Most dimensions should stay UNAFFECTED

**Output Format:** Return JSON:
\`\`\`json
{
  "success": true,
  "affectedDimensions": [
    {"type": "dim type", "currentValue": "current", "newValue": "gently modified", "changeReason": "why", "changeIntensity": "minimal|moderate|significant"}
  ],
  "unaffectedDimensions": ["type1", "type2"],
  "reasoning": "Strategy explanation"
}
\`\`\`
`,
};

export const SIMULATOR_SKILLS: CLISkill[] = [
  simulatorVisionBreakdown,
  simulatorPromptGeneration,
  simulatorDimensionRefinement,
];
