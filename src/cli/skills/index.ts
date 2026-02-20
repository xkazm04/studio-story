/**
 * CLI Skills Registry
 *
 * Central registry for all CLI skills organized by domain.
 * Skills are specialized instruction sets that guide Claude Code CLI
 * for specific storytelling tasks.
 *
 * 31 skills across 8 domains:
 * - Character (6): backstory, traits, dialogue, names, personality, appearance
 * - Faction (4): creation, lore, description, relationships
 * - Story (7): next-steps, write-content, architect, brainstorm, beat-suggestions, beat-description, project-inspiration
 * - Scene (5): generation, dialogue, description, beat-scene-mapping, compose
 * - Image (5): compose, enhance, variations, cover, avatar
 * - Simulator (3): vision-breakdown, prompt-generation, dimension-refinement
 * - Sound (7): audio-direction, beat-composer, beat-modifier, audio-composer, audio-prompt-ideas, instrument-transform, dsp-controller
 * - Utility (4): dataset-tagging, voice-description, deep-analysis, storytelling
 */

// Types
export type { CLISkill, SkillDomain, SkillOutputFormat, SkillId } from './types';

// Domain skill arrays
import { CHARACTER_SKILLS } from './character';
import { FACTION_SKILLS } from './faction';
import { STORY_SKILLS } from './story';
import { SCENE_SKILLS } from './scene';
import { IMAGE_SKILLS } from './image';
import { SIMULATOR_SKILLS } from './simulator';
import { SOUND_SKILLS } from './sound';
import { UTILITY_SKILLS } from './utility';

import type { CLISkill, SkillDomain, SkillId } from './types';

// Re-export domain arrays for targeted access
export { CHARACTER_SKILLS } from './character';
export { FACTION_SKILLS } from './faction';
export { STORY_SKILLS } from './story';
export { SCENE_SKILLS } from './scene';
export { IMAGE_SKILLS } from './image';
export { SIMULATOR_SKILLS } from './simulator';
export { SOUND_SKILLS } from './sound';
export { UTILITY_SKILLS } from './utility';

/**
 * All skills as flat array
 */
const ALL_SKILLS: CLISkill[] = [
  ...CHARACTER_SKILLS,
  ...FACTION_SKILLS,
  ...STORY_SKILLS,
  ...SCENE_SKILLS,
  ...IMAGE_SKILLS,
  ...SIMULATOR_SKILLS,
  ...SOUND_SKILLS,
  ...UTILITY_SKILLS,
];

/**
 * Skills indexed by ID for O(1) lookup
 */
export const CLI_SKILLS: Record<string, CLISkill> = Object.fromEntries(
  ALL_SKILLS.map((skill) => [skill.id, skill])
);

/**
 * Skills grouped by domain
 */
export const SKILLS_BY_DOMAIN: Record<SkillDomain, CLISkill[]> = {
  character: CHARACTER_SKILLS,
  faction: FACTION_SKILLS,
  story: STORY_SKILLS,
  scene: SCENE_SKILLS,
  image: IMAGE_SKILLS,
  simulator: SIMULATOR_SKILLS,
  sound: SOUND_SKILLS,
  utility: UTILITY_SKILLS,
};

/**
 * Get skill by ID
 */
export function getSkill(id: SkillId): CLISkill | undefined {
  return CLI_SKILLS[id];
}

/**
 * Get all skills as array
 */
export function getAllSkills(): CLISkill[] {
  return ALL_SKILLS;
}

/**
 * Get skills for a specific domain
 */
export function getSkillsByDomain(domain: SkillDomain): CLISkill[] {
  return SKILLS_BY_DOMAIN[domain] ?? [];
}

/**
 * Build the base system prompt for all CLI executions.
 * Tells Claude to use MCP tools instead of editing source files.
 * Must be detailed enough that the CLI can act immediately without investigating.
 */
export function buildBaseSystemPrompt(projectId?: string): string {
  return `# Story App — Creative Assistant

You are a creative writing assistant. You interact with the app's database ONLY through MCP tools.

## CRITICAL: Do NOT investigate infrastructure
- NEVER use Read, Edit, Write, Bash, or Glob tools
- NEVER read source code, mock data, API routes, or config files
- NEVER investigate "how things work" — everything you need is in the MCP tools below
- If a tool call fails, report the error to the user — do NOT debug the system
- The project_id is pre-configured in the MCP server — you do NOT need to pass it to most tools (it auto-fills)
${projectId ? `- Active project: \`${projectId}\`\n` : ''}
## Quick Reference: MCP Tools

### Characters (DB table: characters)
- **list_characters** → returns all characters (id, name, type, voice, faction_id)
- **create_character**(name, type?, voice?, factionId?) → creates character. Only \`name\` is required.
- **get_character**(characterId) → full details
- **update_character**(characterId, updates: JSON string) → updatable: name, type, voice, faction_id, avatar_url
- **list_traits**(characterId) → personality traits (background, personality, motivations, strengths, weaknesses, relationships)
- **create_trait**(characterId, type, description) → create trait. Types: background, personality, motivations, strengths, weaknesses, relationships
- **update_trait**(traitId, description) → update trait description

### Story Structure (DB tables: acts, beats)
- **list_acts** → all acts (id, name, description, order)
- **create_act**(name, description?, order?) → creates act. Only \`name\` is required.
- **list_beats**(actId?) → beats in an act or project
- **create_beat**(actId, name, type, description?, order?) → creates beat. Type: setup/conflict/resolution/climax/transition.
- **get_beat**(beatId) / **update_beat**(beatId, updates: JSON string)

### Scenes (DB table: scenes)
- **list_scenes**(actId?) → scenes in act or project
- **create_scene**(actId, name, description?, order?) → creates scene. Requires actId and name.
- **get_scene**(sceneId) → full details
- **update_scene**(sceneId, updates: JSON string) → updatable: name, description, order, script, location, image_url, image_prompt

### Other
- **list_factions** / **get_faction** / **update_faction** — faction CRUD
- **get_project** / **list_projects** — project metadata
- **list_relationships**(characterId) — character relationships

## Workflow for common tasks
1. **"Create characters"** → call create_character for each, one at a time
2. **"Build story structure"** → create_act first, then create_scene for each scene, then create_beat for beats
3. **"Write dialogue"** → create scene, then update_scene with script field
4. **"What exists?"** → list_characters + list_acts + list_scenes
5. **"Compose a scene"** → list_characters + list_beats first → generate using @type[PARAM] block format → update_scene with description field
6. **"Flesh out a character"** → get_character first, then create_trait for each type (background, personality, motivations, strengths, weaknesses, relationships)
7. **"Create characters with detail"** → create_character, then immediately create_trait for each of the 6 types

---

`;
}

/**
 * Build combined prompt from enabled skills.
 * Prepends skill instructions to the CLI prompt.
 */
export function buildSkillsPrompt(enabledSkills: SkillId[]): string {
  if (enabledSkills.length === 0) return '';

  const prompts = enabledSkills
    .map((id) => CLI_SKILLS[id]?.prompt)
    .filter(Boolean);

  if (prompts.length === 0) return '';

  return `# Active Skills

${prompts.join('\n\n---\n\n')}

---

Now proceed with the task:

`;
}

/**
 * Get skill IDs for a domain — useful for UI skill pickers
 */
export function getSkillIdsForDomain(domain: SkillDomain): SkillId[] {
  return (SKILLS_BY_DOMAIN[domain] ?? []).map((s) => s.id);
}

// Log skill count on module load (development aid)
if (typeof window !== 'undefined') {
  console.debug(`[cli-skills] Registered ${ALL_SKILLS.length} skills across ${Object.keys(SKILLS_BY_DOMAIN).length} domains`);
}
