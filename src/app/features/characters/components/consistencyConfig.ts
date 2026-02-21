/**
 * Character Consistency Panel Configuration
 * Extracted configuration for severity styling and issue type labels
 */

import {
  XCircle,
  AlertTriangle,
  Shield,
  Users,
  Target,
  MessageSquare,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ConsistencyIssueType, ConsistencySeverity } from '@/app/types/CharacterConsistency';

export const SEVERITY_COLORS: Record<ConsistencySeverity, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export const SEVERITY_ICONS: Record<ConsistencySeverity, React.ComponentType<{ className?: string }>> = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Shield,
};

export const ISSUE_TYPE_LABELS: Record<ConsistencyIssueType, string> = {
  personality_conflict: 'Personality Conflict',
  motivation_conflict: 'Motivation Conflict',
  speech_pattern_conflict: 'Speech Pattern Conflict',
  behavior_conflict: 'Behavior Conflict',
  trait_conflict: 'Trait Conflict',
};

export const ISSUE_TYPE_ICONS: Record<ConsistencyIssueType, React.ComponentType<{ className?: string }>> = {
  personality_conflict: Users,
  motivation_conflict: Target,
  speech_pattern_conflict: MessageSquare,
  behavior_conflict: Users,
  trait_conflict: Sparkles,
};

export const SOURCE_TYPE_ICONS = {
  beat: FileText,
  scene: FileText,
  trait: Sparkles,
  backstory: MessageSquare,
};

export type BorderColor = 'blue' | 'green' | 'purple' | 'yellow' | 'pink' | 'orange' | 'gray';

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBorderColor(score: number): BorderColor {
  if (score >= 90) return 'green';
  if (score >= 70) return 'blue';
  if (score >= 50) return 'yellow';
  if (score >= 30) return 'orange';
  return 'gray';
}
