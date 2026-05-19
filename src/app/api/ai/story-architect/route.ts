/**
 * POST /api/ai/story-architect
 * LLM-powered beat intelligence: classify beats, recommend act changes, analyze pacing
 *
 * Actions:
 *   - classify: Deep LLM classification of a beat (category, subtype, emotions, functions)
 *   - recommend: Analyze act descriptions and suggest changes when a beat is added
 *   - pacing: Analyze beat sequence and suggest pacing improvements
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

let cachedClient: InstanceType<typeof GoogleGenAI> | null = null;

function getClient(): InstanceType<typeof GoogleGenAI> | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

// ── Classify ──────────────────────────────────────────────────────────────────

interface ClassifyRequest {
  action: 'classify';
  beat: { name: string; description?: string };
  context?: {
    precedingBeats?: Array<{ name: string; description?: string }>;
    actName?: string;
    actDescription?: string;
    projectDescription?: string;
  };
  position?: number;
}

async function handleClassify(client: InstanceType<typeof GoogleGenAI>, body: ClassifyRequest) {
  const { beat, context, position } = body;

  const contextBlock = context
    ? `
NARRATIVE CONTEXT:
${context.projectDescription ? `Project: ${context.projectDescription}` : ''}
${context.actName ? `Current Act: "${context.actName}"${context.actDescription ? ` - ${context.actDescription}` : ''}` : ''}
${context.precedingBeats?.length ? `Preceding beats:\n${context.precedingBeats.map((b, i) => `  ${i + 1}. ${b.name}${b.description ? `: ${b.description}` : ''}`).join('\n')}` : ''}
${position !== undefined ? `Position in story: ${Math.round(position * 100)}%` : ''}
`
    : '';

  const prompt = `You are a narrative craft expert. Classify this story beat using deep understanding of storytelling.

BEAT TO CLASSIFY:
Name: "${beat.name}"
${beat.description ? `Description: "${beat.description}"` : ''}
${contextBlock}

AVAILABLE CATEGORIES: action, revelation, decision, emotional, dialogue, transition, setup, payoff

AVAILABLE SUBTYPES:
- action: chase, fight, escape, confrontation, rescue, discovery
- revelation: plot_twist, character_secret, world_building, backstory, clue, realization
- decision: moral_choice, strategic_choice, sacrifice, commitment, refusal
- emotional: bonding, conflict, reconciliation, loss, triumph, despair
- dialogue: negotiation, interrogation, confession, debate, seduction
- transition: time_skip, location_change, montage, flashback, flash_forward
- setup: foreshadowing, introduction, world_establishment, stakes_raising, goal_setting
- payoff: callback, resolution, consequence, revelation_payoff, character_arc_completion

AVAILABLE EMOTIONS: joy, sadness, fear, anger, surprise, disgust, anticipation, trust, tension, relief, love, hate, hope, despair, curiosity, confusion, pride, shame, nostalgia, awe

AVAILABLE FUNCTION TAGS: inciting_incident, first_plot_point, midpoint, all_is_lost, climax, resolution, setup, payoff, foreshadowing, callback, plant, consequence, introduction, character_moment, arc_turning_point, transformation, tension_builder, tension_release, breather, accelerator, world_establishment, theme_statement, theme_exploration, theme_reinforcement

Return ONLY valid JSON:
{
  "category": "string",
  "subtype": "string",
  "confidence": 0.0-1.0,
  "emotions": [
    { "primary": "emotion_type", "secondary": "emotion_type_or_null", "intensity": 0-100 }
  ],
  "functions": ["function_tag_1", "function_tag_2"],
  "alternatives": [
    { "category": "string", "subtype": "string", "confidence": 0.0-1.0 }
  ],
  "reasoning": "Brief explanation of why this classification was chosen"
}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return parseJsonResponse(response.text ?? '');
}

// ── Recommend ─────────────────────────────────────────────────────────────────

interface RecommendRequest {
  action: 'recommend';
  newBeat: { name: string; description?: string; act_id: string };
  targetAct: { id: string; name: string; description?: string };
  allActs: Array<{ id: string; name: string; description?: string; order?: number }>;
  existingActBeats?: Record<string, Array<{ name: string; description?: string }>>;
  projectTitle?: string;
  projectDescription?: string;
  storyBeats?: Array<{ name: string; description?: string }>;
}

async function handleRecommend(client: InstanceType<typeof GoogleGenAI>, body: RecommendRequest) {
  const { newBeat, targetAct, allActs, existingActBeats, projectTitle, projectDescription, storyBeats } = body;

  let actsBlock = '';
  allActs.forEach((act, idx) => {
    actsBlock += `\nAct ${idx + 1}: "${act.name}"\n`;
    if (act.description) actsBlock += `Description: ${act.description}\n`;
    const beats = existingActBeats?.[act.id] || [];
    if (beats.length > 0) {
      actsBlock += `Beats: ${beats.map((b) => b.name).join(', ')}\n`;
    }
  });

  let storyBeatsBlock = '';
  if (storyBeats?.length) {
    storyBeatsBlock = '\nSTORY-LEVEL BEATS:\n' + storyBeats.map((b, i) => `${i + 1}. ${b.name}${b.description ? `: ${b.description}` : ''}`).join('\n');
  }

  const prompt = `You are a story structure consultant. Analyze whether adding a new beat requires updating act descriptions.

PRINCIPLES:
- BE SURGICAL: Only recommend changes to specific sentences/paragraphs
- BE CONSERVATIVE: Don't recommend changes unless truly necessary
- RESPECT EXISTING CONTENT: Preserve the writer's voice and style

NEW BEAT ADDED:
Name: "${newBeat.name}"
${newBeat.description ? `Description: ${newBeat.description}` : ''}
Target Act: "${targetAct.name}"
${targetAct.description ? `Current Act Description: ${targetAct.description}` : 'Current Act Description: (None)'}

PROJECT: "${projectTitle || 'Untitled'}"
${projectDescription ? `Synopsis: ${projectDescription}` : ''}

ALL ACTS:${actsBlock}${storyBeatsBlock}

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "act_id": "string",
      "act_name": "string",
      "change_type": "add" | "replace" | "none",
      "before": "exact text to replace (empty if adding)",
      "after": "new text",
      "reason": "brief explanation"
    }
  ],
  "overall_assessment": "brief summary"
}

If no changes needed:
{ "recommendations": [], "overall_assessment": "The existing descriptions are adequate." }`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return parseJsonResponse(response.text ?? '');
}

// ── Pacing ────────────────────────────────────────────────────────────────────

interface PacingRequest {
  action: 'pacing';
  projectId: string;
  beats: Array<{
    id: string;
    name: string;
    description?: string;
    order?: number;
    estimated_duration?: number;
    act_id?: string;
    act_name?: string;
  }>;
  actDescription?: string;
  projectDescription?: string;
}

async function handlePacing(client: InstanceType<typeof GoogleGenAI>, body: PacingRequest) {
  const { beats, actDescription, projectDescription } = body;

  const beatsBlock = beats
    .map((b, i) => `${i + 1}. "${b.name}" (order: ${b.order ?? i}, duration: ${b.estimated_duration ?? 10}min)${b.description ? ` - ${b.description}` : ''}${b.act_name ? ` [${b.act_name}]` : ''}`)
    .join('\n');

  const prompt = `You are a narrative pacing expert. Analyze this beat sequence and suggest improvements.

${projectDescription ? `PROJECT: ${projectDescription}\n` : ''}${actDescription ? `ACT CONTEXT: ${actDescription}\n` : ''}

BEAT SEQUENCE:
${beatsBlock}

Analyze for:
1. Pacing issues (too many action beats in a row, missing breathers, etc.)
2. Duration imbalances
3. Reordering opportunities for better dramatic flow
4. Beats that could be merged or split

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "beat_id": "string",
      "suggestion_type": "reorder" | "adjust_duration" | "merge" | "split",
      "suggested_order": null_or_number,
      "suggested_duration": null_or_number,
      "reasoning": "explanation of why this change improves pacing",
      "confidence": 0.0-1.0
    }
  ],
  "overall_analysis": "brief summary of pacing health"
}

If no changes needed:
{ "suggestions": [], "overall_analysis": "The pacing is well-balanced." }`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return parseJsonResponse(response.text ?? '');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error('No valid JSON found in LLM response');
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export const POST = withApiHandler('POST /api/ai/story-architect', async (request: NextRequest) => {
    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured. Set GEMINI_API_KEY in .env.local.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action } = body;

    let result: Record<string, unknown>;

    switch (action) {
      case 'classify':
        result = await handleClassify(client, body);
        break;
      case 'recommend':
        result = await handleRecommend(client, body);
        break;
      case 'pacing':
        result = await handlePacing(client, body);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}. Valid actions: classify, recommend, pacing` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, ...result });
});
