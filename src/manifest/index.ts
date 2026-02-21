/**
 * Manifest System — Public API
 *
 * Provides access to panel manifests for both runtime UI rendering
 * and LLM system prompt injection.
 */

export { PANEL_MANIFESTS } from './panelManifests';
export type { PanelManifest, PanelInputSchema, PanelProp, PanelOutput } from './types';

import { PANEL_MANIFESTS } from './panelManifests';
import type { PanelManifest } from './types';

/** Get manifest for a specific panel type */
export function getManifest(type: string): PanelManifest | undefined {
  return PANEL_MANIFESTS.find(m => m.type === type);
}

/** Get manifests for panels that operate on the given domains */
export function getManifestsByDomain(domains: string[]): PanelManifest[] {
  return PANEL_MANIFESTS.filter(m =>
    m.domains.some(d => domains.includes(d))
  );
}

/** Get manifests grouped by domain */
export function getManifestsByDomainGrouped(): Record<string, PanelManifest[]> {
  const grouped: Record<string, PanelManifest[]> = {};
  for (const manifest of PANEL_MANIFESTS) {
    for (const domain of manifest.domains) {
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(manifest);
    }
  }
  return grouped;
}

/**
 * Serialize all panel manifests into a compact text format for LLM system prompt injection.
 *
 * Format is optimized to be <4000 tokens while giving the LLM enough context
 * to reason about which panels to compose for any user request.
 */
export function serializeManifestsForLLM(): string {
  const lines: string[] = [
    'WORKSPACE PANELS (use compose_workspace to arrange these):',
    '',
  ];

  // Group by primary domain
  const byDomain = getManifestsByDomainGrouped();
  const domainOrder = ['scene', 'character', 'story', 'image', 'voice', 'sound'];

  const seen = new Set<string>();

  for (const domain of domainOrder) {
    const manifests = byDomain[domain];
    if (!manifests) continue;

    lines.push(`## ${domain.toUpperCase()}`);

    for (const m of manifests) {
      if (seen.has(m.type)) continue;
      seen.add(m.type);

      const role = m.layout.defaultRole;
      const size = m.layout.sizeClass;
      const props = [
        ...m.inputSchema.required.map(p => `${p.name}* (${p.type})`),
        ...m.inputSchema.optional.map(p => `${p.name}? (${p.type})`),
      ].join(', ');

      lines.push(`- **${m.type}** [${role}/${size}]: ${m.description}`);
      if (props) lines.push(`  Props: ${props}`);
      lines.push(`  Use when: ${m.useCases.slice(0, 2).join('; ')}`);
      if (m.suggestedCompanions?.length) {
        lines.push(`  Pairs with: ${m.suggestedCompanions.join(', ')}`);
      }
    }
    lines.push('');
  }

  lines.push('## LAYOUTS');
  lines.push('Available layouts: single, split-2, split-3, grid-4, primary-sidebar, triptych, studio');
  lines.push('- single: One full-width panel');
  lines.push('- split-2: Two columns (wide primary + narrower companion)');
  lines.push('- split-3: Tall left primary + two stacked companions on the right');
  lines.push('- grid-4: 2x2 grid of four panels');
  lines.push('- primary-sidebar: Wide primary + narrow sidebar');
  lines.push('- triptych: Three panels — narrow/wide/narrow');
  lines.push('- studio: Production layout with top toolbar, sidebars, center workspace, and bottom strip');
  lines.push('');
  lines.push('## COMPOSITION RULES');
  lines.push('- Default to 1-3 panels. Use 4+ only when user asks for multi-view comparison/workflow.');
  lines.push('- Prefer one primary panel for the core task; companions should be secondary/sidebar.');
  lines.push('- Use sidebar role only for compact/navigation panels (scene-list, scene-metadata, beats-sidebar, cast-sidebar, advisor, voice-performance).');
  lines.push('- Omit layout unless a specific arrangement is clearly required; let runtime auto-resolve.');
  lines.push('- Avoid replacing workspace if user is iterating in current panel context; prefer show/hide updates.');
  lines.push('');
  lines.push('## ROLES');
  lines.push('Assign roles to panels: primary (main focus), secondary (supporting), tertiary (minor), sidebar (narrow navigation)');

  return lines.join('\n');
}
