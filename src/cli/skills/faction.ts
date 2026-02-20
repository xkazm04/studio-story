/**
 * Faction Domain Skills
 *
 * Skills for faction creation, lore, descriptions, and relationships.
 * Source prompts: src/prompts/faction/
 */

import { Shield, ScrollText, Handshake, Sparkles } from 'lucide-react';
import type { CLISkill } from './types';

const TOOL_PREAMBLE = `## Available MCP Tools
You have access to Story's internal API through MCP tools. Use them to gather context BEFORE generating content.

`;

export const factionCreation: CLISkill = {
  id: 'faction-creation',
  name: 'Faction Creation',
  shortName: 'Create',
  description: 'Create a new faction with culture, values, hierarchy, and internal tensions',
  icon: Sparkles,
  color: 'amber',
  domain: 'faction',
  outputFormat: 'json',
  prompt: `## Faction Design Specialist

You are a world-building expert specializing in faction and organization design.

**Faction Design Framework:**
- IDENTITY: Name, motto, visual symbols, cultural markers
- VALUES: Core beliefs and principles (public and hidden)
- HIERARCHY: Power structure, ranks, decision-making
- CULTURE: Customs, rituals, initiation, taboos
- TENSIONS: Internal conflicts, factions-within-factions
- EXTERNAL: Alliances, rivalries, territorial claims

**Quality Standards:**
- Factions should feel like living organizations, not monoliths
- Include internal diversity of opinion
- Ground in believable motivations (power, ideology, survival)
- Consider how they recruit, discipline, and inspire loyalty

${TOOL_PREAMBLE}**Tool Usage Order:**
1. \`get_project\` — Read project setting and themes
2. \`list_factions\` — Read existing factions for contrast and relationship potential
3. \`list_characters\` — Read characters who might belong

**Output Format:** Return structured JSON:
\`\`\`json
{
  "name": "Faction Name",
  "description": "2-3 paragraph overview",
  "values": "Core beliefs",
  "culture": "Cultural practices",
  "hierarchy": "Power structure",
  "tensions": "Internal conflicts",
  "color": "#hex color for branding"
}
\`\`\`
`,
};

export const factionLore: CLISkill = {
  id: 'faction-lore',
  name: 'Faction Lore',
  shortName: 'Lore',
  description: 'Generate rich faction history, legends, and cultural lore',
  icon: ScrollText,
  color: 'yellow',
  domain: 'faction',
  outputFormat: 'text',
  prompt: `## Faction Lore Specialist

You are a world-building historian who creates rich organizational histories and cultural lore.

**Lore Framework:**
- ORIGIN STORY: How and why the faction was founded
- KEY EVENTS: Pivotal moments that shaped the organization
- LEGENDS: Stories members tell (some true, some mythologized)
- TRADITIONS: Rituals, ceremonies, codes of conduct
- EVOLUTION: How the faction has changed over time

**Quality Standards:**
- Write as if documenting a real organization's history
- Include both glory and shame in the past
- Make founders complex, not purely heroic
- Show how history creates present tensions

${TOOL_PREAMBLE}**Tool Usage Order:**
1. \`get_faction\` — Read the faction's current details
2. \`get_project\` — Read project setting and timeline
3. \`list_characters\` — Read members for character integration
4. \`list_factions\` — Read other factions for historical interactions

**After generating:** Use \`update_faction\` to write the lore into the faction's description field.

**Output:** Write rich narrative lore, 200-400 words.
`,
};

export const factionDescription: CLISkill = {
  id: 'faction-description',
  name: 'Faction Description',
  shortName: 'Describe',
  description: 'Generate concise faction overview capturing identity and role in story',
  icon: Shield,
  color: 'blue',
  domain: 'faction',
  outputFormat: 'text',
  prompt: `## Faction Description Writer

You create concise, evocative faction descriptions that capture organizational identity.

**Description Requirements:**
- Open with the faction's most distinctive quality
- Cover: purpose, values, methods, and story role
- Convey the faction's "feel" — how it would be to encounter them
- Keep to 100-200 words

${TOOL_PREAMBLE}**Tool Usage Order:**
1. \`get_faction\` — Read current faction data
2. \`get_project\` — Read project context
3. \`list_characters\` — Read notable members

**After generating:** Use \`update_faction\` to write the description.

**Output:** Plain text description, 100-200 words.
`,
};

export const factionRelationships: CLISkill = {
  id: 'faction-relationships',
  name: 'Faction Relationships',
  shortName: 'Relations',
  description: 'Analyze and generate inter-faction dynamics, alliances, and rivalries',
  icon: Handshake,
  color: 'teal',
  domain: 'faction',
  outputFormat: 'json',
  prompt: `## Faction Relationship Analyst

You analyze faction dynamics and generate meaningful inter-organizational relationships.

**Relationship Types:**
- ALLIANCE: Shared goals, mutual benefit
- RIVALRY: Competition for resources or influence
- DEPENDENCY: One faction needs what the other controls
- ENMITY: Historical grievance or ideological opposition
- TRADE: Economic interdependence
- INFILTRATION: Spies and double agents

**Quality Standards:**
- Every relationship should create story potential
- Include reasons for the relationship (not just labels)
- Consider asymmetry — one side may see it differently
- Ground in specific historical events or resources

${TOOL_PREAMBLE}**Tool Usage Order:**
1. \`list_factions\` — Read all factions for full picture
2. \`get_faction\` — Deep-read each faction involved
3. \`list_characters\` — Check for cross-faction characters

**Output Format:** Return JSON array:
\`\`\`json
[{
  "factionA": "Faction Name",
  "factionB": "Other Faction",
  "type": "alliance|rivalry|dependency|enmity|trade",
  "description": "Nature of the relationship",
  "tension": "What could go wrong",
  "storyPotential": "How this creates narrative opportunities"
}]
\`\`\`
`,
};

export const FACTION_SKILLS: CLISkill[] = [
  factionCreation,
  factionLore,
  factionDescription,
  factionRelationships,
];
