/**
 * Dev-Mode Panel Registration Completeness Check
 *
 * Runs once on app startup (development only) to verify that:
 * 1. All TOOL_PANEL_HINTS reference valid WorkspacePanelType values
 * 2. Panel count is reported for quick sanity check
 *
 * Note: Registry ↔ manifest consistency is guaranteed by design since both
 * are derived from the same source in panelDefinitions.ts.
 *
 * Tree-shakes completely in production via the NODE_ENV gate in providers.tsx.
 */

import { PANEL_REGISTRY, type WorkspacePanelType } from './panelRegistry';
import { PANEL_MANIFESTS } from '@/manifest/panelManifests';
import { TOOL_PANEL_HINTS } from '../config/workflowHints';

const PREFIX = '[panel-check]';
let hasRun = false;

export function runPanelRegistrationCheck(): void {
  if (hasRun) return;
  hasRun = true;

  const errors: string[] = [];

  const registryTypes = new Set(Object.keys(PANEL_REGISTRY) as WorkspacePanelType[]);

  // ── 1. TOOL_PANEL_HINTS reference valid panel types ───────────────
  for (const [tool, directives] of Object.entries(TOOL_PANEL_HINTS)) {
    for (const directive of directives) {
      if (!registryTypes.has(directive.type)) {
        errors.push(
          `TOOL_PANEL_HINTS["${tool}"] references panel type "${directive.type}" which is not in PANEL_REGISTRY`
        );
      }
    }
  }

  // ── Output ────────────────────────────────────────────────────────
  if (errors.length) {
    console.error(
      `${PREFIX} ${errors.length} registration issue(s) found:\n` +
        errors.map(e => `  \u2717 ${e}`).join('\n')
    );
  } else {
    const manifestCount = PANEL_MANIFESTS.length;
    console.log(
      `${PREFIX} All ${registryTypes.size} panels registered (${manifestCount} with manifests) \u2713`
    );
  }
}
