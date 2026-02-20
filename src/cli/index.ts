/**
 * CLI Terminal Module — main exports
 *
 * Usage:
 *   import CompactTerminal from '@/app/components/cli/CompactTerminal';
 *   import InlineTerminal from '@/app/components/cli/InlineTerminal';
 *   import CLITriggerButton from '@/app/components/cli/CLITriggerButton';
 *   import { useCLIFeature } from '@/app/hooks/useCLIFeature';
 *   import { createSkillTask, createPromptTask } from '@/app/components/cli/types';
 *   import { useCLISessionStore } from '@/app/components/cli/store';
 */

// Terminal components
export { default as CompactTerminal } from './CompactTerminal';
export { default as InlineTerminal } from './InlineTerminal';
export { default as CLITriggerButton } from './CLITriggerButton';
export type { CLITriggerButtonProps } from './CLITriggerButton';

// Types, protocol, store, task registry
export * from './types';
export * from './protocol';
export * from './store';
export * from './taskRegistry';

// Query invalidation
export {
  SKILL_INVALIDATION_MAP,
  resolveQueryKeys,
  isWriteThroughSkill,
} from './queryInvalidationMap';

// Skills
export {
  getAllSkills,
  getSkill,
  getSkillsByDomain,
  getSkillIdsForDomain,
  buildSkillsPrompt,
  CLI_SKILLS,
  SKILLS_BY_DOMAIN,
  type SkillId,
  type CLISkill,
  type SkillDomain,
  type SkillOutputFormat,
} from './skills';
