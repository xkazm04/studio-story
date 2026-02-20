/**
 * Component Manifest System — Machine-readable panel descriptions for LLM composition.
 *
 * Each panel declares what it does, what data it needs, what context it operates in,
 * and how it should be laid out. The LLM reads these manifests to dynamically decide
 * workspace composition instead of relying on hardcoded intent detection or static configs.
 */

export interface PanelManifest {
  /** Panel type identifier — matches WorkspacePanelType */
  type: string;

  /** Human-readable display name */
  label: string;

  /** One-line description for LLM context */
  description: string;

  /** Detailed capabilities — what this panel can do */
  capabilities: string[];

  /** Data domains this panel operates on */
  domains: string[];

  /** Props this panel accepts */
  inputSchema: PanelInputSchema;

  /** What data/events this panel can produce for other panels */
  outputs: PanelOutput[];

  /** When this panel is most useful — natural language hints for LLM reasoning */
  useCases: string[];

  /** Layout preferences */
  layout: {
    defaultRole: 'primary' | 'secondary' | 'tertiary' | 'sidebar';
    sizeClass: 'compact' | 'standard' | 'wide';
    minWidth: number;
  };

  /** Lucide icon name for UI rendering */
  icon: string;

  /** Panels that pair well with this one */
  suggestedCompanions?: string[];
}

export interface PanelInputSchema {
  required: PanelProp[];
  optional: PanelProp[];
}

export interface PanelProp {
  /** Prop name passed to the component */
  name: string;
  /** TypeScript type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]';
  /** What this prop controls */
  description: string;
  /** Where this value can be resolved from (e.g., "store:projectSlice.selectedScene") */
  source?: string;
}

export interface PanelOutput {
  /** Output name */
  name: string;
  /** TypeScript type */
  type: string;
  /** What this output represents */
  description: string;
}
