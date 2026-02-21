import { useState } from 'react';
import { RecommendationResponse, RecommendationContext } from '../types/Recommendation';
import { useCLIFeature } from './useCLIFeature';

/**
 * Hook for generating Act description recommendations via CLI
 */
export const useActRecommendations = (projectId: string) => {
  const [lastContext, setLastContext] = useState<RecommendationContext | null>(null);

  const cli = useCLIFeature({
    featureId: 'act-recommendations',
    projectId,
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
  });

  const generateRecommendations = (context: RecommendationContext) => {
    setLastContext(context);

    const { newBeat, targetAct, allActs, projectDescription, storyBeats, allScenes } = context;

    let prompt = `You are a story structure consultant who helps writers keep their Act descriptions aligned with story beats.

When a new Act beat is added, analyze whether the Act description needs updating.

PRINCIPLES:
- BE SURGICAL: Only recommend changes to specific sentences/paragraphs that need updating
- BE CONSERVATIVE: Don't recommend changes unless truly necessary
- RESPECT EXISTING CONTENT: Preserve the writer's voice and style
- BE SPECIFIC: Identify exact text to replace, not vague suggestions

=== NEW BEAT ADDED ===
Beat Name: "${newBeat.name}"
${newBeat.description ? `Beat Description: ${newBeat.description}` : ''}
Target Act: "${targetAct.name}"
${targetAct.description ? `Current Act Description: ${targetAct.description}` : 'Current Act Description: (None - this Act has no description yet)'}

=== PROJECT CONTEXT ===
Project: "${context.projectTitle || 'Untitled'}"
${projectDescription ? `Synopsis: ${projectDescription}` : ''}

=== ALL ACTS (Story Structure) ===
`;

    allActs.forEach((act, idx) => {
      prompt += `\nAct ${idx + 1}: "${act.name}"\n`;
      if (act.description) prompt += `Description: ${act.description}\n`;
      const actBeats = context.existingActBeats?.[act.id] || [];
      if (actBeats.length > 0) {
        prompt += `Existing Beats: ${actBeats.map((b) => b.name).join(', ')}\n`;
      }
    });

    if (storyBeats && storyBeats.length > 0) {
      prompt += `\n=== STORY-LEVEL BEATS ===\n`;
      storyBeats.forEach((beat, idx) => {
        prompt += `${idx + 1}. ${beat.name}`;
        if (beat.description) prompt += `: ${beat.description}`;
        prompt += `\n`;
      });
    }

    if (allScenes && allScenes.length > 0) {
      prompt += `\n=== SCENES IN TARGET ACT ===\n`;
      const targetActScenes = allScenes.filter((s) => s.act_id === targetAct.id);
      if (targetActScenes.length > 0) {
        targetActScenes.forEach((scene) => {
          prompt += `- ${scene.name}`;
          if (scene.description) prompt += `: ${scene.description.substring(0, 100)}${scene.description.length > 100 ? '...' : ''}`;
          prompt += `\n`;
        });
      } else {
        prompt += `(No scenes yet)\n`;
      }
    }

    prompt += `\n=== YOUR TASK ===
Analyze whether adding the beat "${newBeat.name}" to Act "${targetAct.name}" requires updating any Act descriptions.

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "act_id": "string",
      "act_name": "string",
      "change_type": "add" | "replace" | "none",
      "before": "exact text to replace (or empty string if adding)",
      "after": "new text to add/replace with",
      "reason": "brief explanation why this change is needed"
    }
  ],
  "overall_assessment": "brief explanation of whether changes are needed"
}

If NO changes are needed, return:
{
  "recommendations": [],
  "overall_assessment": "The existing Act descriptions adequately cover this beat."
}`;

    cli.executePrompt(prompt, 'Act Recommendations');
  };

  const handleInsertResult = (text: string): RecommendationResponse | null => {
    try {
      let cleanedContent = text.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '');
      }

      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (err) {
      console.error('Error parsing recommendations:', err);
      return null;
    }
  };

  return {
    generateRecommendations,
    isGenerating: cli.isRunning,
    handleInsertResult,
    terminalProps: cli.terminalProps,
  };
};
