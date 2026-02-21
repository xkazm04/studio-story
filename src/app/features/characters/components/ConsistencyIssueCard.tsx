'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  MessageSquare,
  Users,
  Target,
  Edit3,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  ConsistencyIssue,
  ConsistencyIssueType,
} from '@/app/types/CharacterConsistency';
import ColoredBorder from '@/app/components/UI/ColoredBorder';

// --- Constants ---

export const severityColors = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export const severityIcons = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Shield,
};

export const issueTypeLabels: Record<ConsistencyIssueType, string> = {
  personality_conflict: 'Personality Conflict',
  motivation_conflict: 'Motivation Conflict',
  speech_pattern_conflict: 'Speech Pattern Conflict',
  behavior_conflict: 'Behavior Conflict',
  trait_conflict: 'Trait Conflict',
};

export const issueTypeIcons: Record<ConsistencyIssueType, React.ComponentType<any>> = {
  personality_conflict: Users,
  motivation_conflict: Target,
  speech_pattern_conflict: MessageSquare,
  behavior_conflict: Users,
  trait_conflict: Sparkles,
};

export const sourceTypeIcons = {
  beat: FileText,
  scene: FileText,
  trait: Sparkles,
  backstory: MessageSquare,
};

// --- Component ---

interface ConsistencyIssueCardProps {
  issue: ConsistencyIssue;
  isExpanded: boolean;
  onToggleExpand: (issueId: string) => void;
  onResolve: (issueId: string, resolutionType: 'accept_suggestion' | 'custom_edit' | 'ignore') => void;
  isResolving: boolean;
}

const ConsistencyIssueCard: React.FC<ConsistencyIssueCardProps> = ({
  issue,
  isExpanded,
  onToggleExpand,
  onResolve,
  isResolving,
}) => {
  const SeverityIcon = severityIcons[issue.severity];
  const IssueTypeIcon = issueTypeIcons[issue.issue_type];
  const Source1Icon = sourceTypeIcons[issue.source_1.type];
  const Source2Icon = sourceTypeIcons[issue.source_2.type];

  return (
    <div
      className={cn('relative bg-gray-900 rounded-lg border overflow-hidden', severityColors[issue.severity])}
      data-testid={`consistency-issue-${issue.id}`}
    >
      <ColoredBorder color={issue.severity === 'critical' ? 'gray' : issue.severity === 'high' ? 'orange' : issue.severity === 'medium' ? 'yellow' : 'blue'} />

      {/* Issue Header */}
      <button
        onClick={() => onToggleExpand(issue.id)}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
        data-testid={`expand-issue-${issue.id}-btn`}
      >
        <SeverityIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <IssueTypeIcon className="w-4 h-4" />
            <span className="text-sm font-semibold text-white">
              {issueTypeLabels[issue.issue_type]}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded', severityColors[issue.severity])}>
              {issue.severity}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(issue.confidence_score * 100)}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-300">{issue.description}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
        )}
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-800">
              {/* Conflicting Sources */}
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Source1Icon className="w-4 h-4" />
                    {issue.source_1.type}: {issue.source_1.name}
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300">
                    &quot;{issue.conflicting_text_1}&quot;
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Source2Icon className="w-4 h-4" />
                    {issue.source_2.type}: {issue.source_2.name}
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300">
                    &quot;{issue.conflicting_text_2}&quot;
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-400 mb-2">
                  AI Analysis
                </div>
                <p className="text-sm text-gray-300">{issue.ai_reasoning}</p>
              </div>

              {/* Suggested Resolution */}
              {issue.suggested_resolution && (
                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                  <div className="text-xs font-semibold text-green-400 mb-2">
                    Suggested Resolution
                  </div>
                  <p className="text-sm text-gray-300">{issue.suggested_resolution}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onResolve(issue.id, 'accept_suggestion')}
                  disabled={isResolving}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                  data-testid={`accept-suggestion-${issue.id}-btn`}
                >
                  {isResolving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Accept Suggestion
                </button>
                <button
                  onClick={() => onResolve(issue.id, 'custom_edit')}
                  disabled={isResolving}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                  data-testid={`custom-edit-${issue.id}-btn`}
                >
                  <Edit3 className="w-4 h-4" />
                  Custom Edit
                </button>
                <button
                  onClick={() => onResolve(issue.id, 'ignore')}
                  disabled={isResolving}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-300 text-sm rounded-lg transition-colors"
                  data-testid={`ignore-issue-${issue.id}-btn`}
                >
                  <XCircle className="w-4 h-4" />
                  Ignore
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsistencyIssueCard;
