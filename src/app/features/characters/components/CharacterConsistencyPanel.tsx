'use client';

import React, { useState } from 'react';
import {
  Shield,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useAnalyzeConsistency, useResolveConsistencyIssue } from '@/app/hooks/useCharacterConsistency';
import {
  CharacterConsistencyReport,
} from '@/app/types/CharacterConsistency';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import ConsistencyIssueCard from './ConsistencyIssueCard';

interface CharacterConsistencyPanelProps {
  characterId: string;
  characterName: string;
}

const CharacterConsistencyPanel: React.FC<CharacterConsistencyPanelProps> = ({
  characterId,
  characterName,
}) => {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const [report, setReport] = useState<CharacterConsistencyReport | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<string | null>(null);

  const analyzeConsistency = useAnalyzeConsistency();
  const resolveIssue = useResolveConsistencyIssue();

  const handleAnalyze = async () => {
    if (!selectedProject) return;

    const result = await analyzeConsistency.mutateAsync({
      character_id: characterId,
      project_id: selectedProject.id,
      include_beats: true,
      include_scenes: true,
      include_traits: true,
    });

    setReport(result);
  };

  const handleResolveIssue = async (
    issueId: string,
    resolutionType: 'accept_suggestion' | 'custom_edit' | 'ignore',
    customResolution?: string
  ) => {
    setResolvingIssue(issueId);
    try {
      await resolveIssue.mutateAsync({
        issue_id: issueId,
        resolution_type: resolutionType,
        custom_resolution: customResolution,
      });

      // Remove issue from report
      if (report) {
        const updatedIssues = report.issues.filter(i => i.id !== issueId);
        setReport({
          ...report,
          issues: updatedIssues,
          total_issues: updatedIssues.length,
        });
      }
    } finally {
      setResolvingIssue(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBorderColor = (score: number): 'blue' | 'green' | 'purple' | 'yellow' | 'pink' | 'orange' | 'gray' => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'blue';
    if (score >= 50) return 'yellow';
    if (score >= 30) return 'orange';
    return 'gray';
  };

  return (
    <div className="space-y-4">
      {/* Header and Analyze Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Character Consistency</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzeConsistency.isPending || !selectedProject}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
          data-testid="analyze-consistency-btn"
        >
          {analyzeConsistency.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze Consistency
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {report && (
        <div className="space-y-4">
          {/* Consistency Score */}
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ColoredBorder color={getScoreBorderColor(report.consistency_score)} />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400">Overall Consistency Score</h4>
                <p className={cn('text-4xl font-bold', getScoreColor(report.consistency_score))}>
                  {report.consistency_score}
                  <span className="text-xl text-gray-500">/100</span>
                </p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>Analyzed: {report.analyzed_sources.beats_count} beats</div>
                <div>{report.analyzed_sources.scenes_count} scenes</div>
                <div>{report.analyzed_sources.traits_count} traits</div>
              </div>
            </div>

            {/* Issue Summary */}
            <div className="grid grid-cols-4 gap-3">
              {report.critical_issues > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="text-xs text-red-400 mb-1">Critical</div>
                  <div className="text-2xl font-bold text-red-400">{report.critical_issues}</div>
                </div>
              )}
              {report.high_issues > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="text-xs text-orange-400 mb-1">High</div>
                  <div className="text-2xl font-bold text-orange-400">{report.high_issues}</div>
                </div>
              )}
              {report.medium_issues > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="text-xs text-yellow-400 mb-1">Medium</div>
                  <div className="text-2xl font-bold text-yellow-400">{report.medium_issues}</div>
                </div>
              )}
              {report.low_issues > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-blue-400 mb-1">Low</div>
                  <div className="text-2xl font-bold text-blue-400">{report.low_issues}</div>
                </div>
              )}
            </div>
          </div>

          {/* Issues List */}
          {report.issues.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">
                Detected Issues ({report.total_issues})
              </h4>
              {report.issues.map((issue) => (
                <ConsistencyIssueCard
                  key={issue.id}
                  issue={issue}
                  isExpanded={expandedIssue === issue.id}
                  onToggleExpand={(issueId) => setExpandedIssue(expandedIssue === issueId ? null : issueId)}
                  onResolve={handleResolveIssue}
                  isResolving={resolvingIssue === issue.id}
                />
              ))}
            </div>
          ) : (
            <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
              <ColoredBorder color="green" />
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">
                No Consistency Issues Found
              </h4>
              <p className="text-sm text-gray-400">
                {characterName} appears to be consistently portrayed across all analyzed content.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!report && !analyzeConsistency.isPending && (
        <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
          <ColoredBorder color="blue" />
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-white mb-2">
            Character Consistency Checker
          </h4>
          <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
            Analyze {characterName}'s portrayal across beats, scenes, and traits to detect inconsistencies in personality, motivations, speech patterns, and behavior.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={!selectedProject}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            data-testid="start-analysis-btn"
          >
            <Sparkles className="w-4 h-4" />
            Start Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterConsistencyPanel;
