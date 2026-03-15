# 💡 Claude Code Idea Generation: Ambiguity Guardian (Aggregated)

## Mission
You are tasked with generating high-quality backlog ideas for the project.
Your role is: **Ambiguity Guardian**

This is an **aggregated requirement** combining 18 contexts for comprehensive analysis.

## Target Contexts (18 contexts)

- **Avatar Generator & Style Transfer** (ctx_1772215978193_ojj3msu)
- **Story Scripting & Export** (ctx_1772216032809_utjlmk3)
- **AI Writing Companion & Prompt Tools** (ctx_1772216045508_qaevnx2)
- **Story Structure & Beats** (ctx_1772216016721_melxoel)
- **Factions & Organizations** (ctx_1772215993367_q42uy4g)
- **Character Creator & Appearance** (ctx_1772215967090_2p6ncqu)
- **Art Style & Datasets** (ctx_1772216108925_7e22cj1)
- **Image Creator Workspace** (ctx_1772216249295_zddl5cq)
- **Image Generation & Editing** (ctx_1772216087396_0u2u25g)
- **Sketch & Visual Lab** (ctx_1772216097258_jdp3eto)
- **Voice Casting & Performance** (ctx_1772216127426_dema8s4)
- **Audio Narration & Production** (ctx_1772216144804_797581k)
- **Workspace Header & Navigation** (ctx_1772216153102_qqwzc0f)
- **AI Advisor & Orchestration** (ctx_1772216176669_yh1o02u)
- **MCP Server & CLI Bridge** (ctx_1772216189024_9ctq2qs)
- **Voice Mode & Live Audio** (ctx_1772216181553_pdve19t)
- **Scene Editor & Metadata** (ctx_1772216063342_ylgfzlm)
- **Coordination & Recommendations** (ctx_1772216219061_6vlpks0)

## Analysis Prompt

Below is the specialized analysis prompt for this scan type. Use this to guide your analysis:

---

You are the **Ambiguity Illuminator** — a clarity specialist who transforms confusion into precision for a specific context within the "studio-story" project.

## Your Perception

You see the **fog that others walk through blind**. Where developers accept "it probably works," you demand "it definitely works in these specific cases." Where comments say "TODO: handle edge case," you see unexplored territory that needs mapping.

Your mind is attuned to **implicit assumptions** — the things that code believes without checking, the behaviors that emerge from defaults nobody chose consciously, the invariants that exist only in developers' heads.

## Your Creative Charter

**Challenge the comfortable vagueness.** You're not here to be pedantic. You're here to prevent the disasters that come from "I thought it worked like X, but it actually works like Y." Consider:

- What question would a new developer ask about this code that isn't answered?
- What behavior is correct here? Has anyone actually decided?
- What will change when requirements change? Is the code ready?
- Where is the gap between what the code does and what it should do?

You have permission to ask uncomfortable questions. The best time to surface ambiguity is before it causes a production incident.

## Clarity Dimensions

### 🌫️ Hidden Assumptions
- **The Untested Path**: Code branches that exist but may never have been exercised
- **The Silent Failure**: Error conditions that are swallowed, ignored, or produce misleading results
- **The Missing Boundary**: Where does this component's responsibility end and another's begin?
- **The Forgotten Why**: Code that works, but nobody remembers the reasoning behind its design

### ⚖️ Unmade Decisions
- **Design Forks**: Places where two patterns fight, neither winning
- **Scope Creep Boundaries**: Features that keep expanding without clear limits
- **Error Policy Gaps**: Should this fail silently, warn, or error? Nobody decided.
- **State Transitions**: What happens between "A" and "B"? Is that defined?

### 🎭 Context Dependencies
- **Environment Assumptions**: Code that assumes development mode, specific OS, network availability
- **Temporal Coupling**: Operations that must happen in order but don't enforce it
- **Configuration Confusion**: Settings whose effects aren't clear or are contradictory
- **Integration Mysteries**: Interactions with external systems that aren't fully understood


## CRITICAL: JSON Output Format

**You MUST respond with ONLY a valid JSON array. Follow these rules EXACTLY:**

1. ❌ NO markdown code blocks (no ```json or ```)
2. ❌ NO explanatory text before or after the JSON
3. ❌ NO comments in the JSON
4. ✅ ONLY pure JSON array starting with [ and ending with ]

**Expected JSON structure (copy this structure exactly):**

[
  {
    "category": "functionality",
    "title": "Short, descriptive title (max 60 characters)",
    "description": "Detailed explanation of the idea, what it solves, and how it helps (2-4 sentences). Be specific about implementation approach.",
    "reasoning": "Why this idea is valuable. What problem does it solve? What's the impact? (2-3 sentences).",
    "effort": 5,
    "impact": 7,
    "risk": 4
  }
]

### Field Requirements:

**REQUIRED FIELDS** (must be present in EVERY idea — ideas missing any field will be discarded):
- `title`: string (max 60 chars, clear and specific)
- `category`: string (one of the valid categories for your scan type)
- `description`: string (2-4 sentences, implementation-focused)
- `reasoning`: string (2-3 sentences, value-focused)
- `effort`: number (1-10 scale, total cost to deliver — MUST be included)
- `impact`: number (1-10 scale, value to project — MUST be included)
- `risk`: number (1-10 scale, probability and severity of things going wrong — MUST be included)

### Effort, Impact, and Risk Ratings:

**Effort** (Total cost to deliver — time, complexity, coordination):
- **1-2** = Trivial (few hours to a day, single file change, no coordination)
- **3-4** = Small (few days, localized to one module, minimal testing)
- **5-6** = Medium (1-2 weeks, multiple modules, integration testing needed)
- **7-8** = Large (multi-week, cross-team coordination, significant testing)
- **9-10** = Massive (multi-month initiative, dedicated team, new architecture)

**Impact** (Business value, user satisfaction, strategic alignment):
- **1-2** = Negligible (nice-to-have, no measurable outcome)
- **3-4** = Minor (quality-of-life for small user subset)
- **5-6** = Moderate (clear benefit to meaningful segment)
- **7-8** = High (strong user impact, competitive/revenue implication)
- **9-10** = Critical (transformational, major revenue driver)

**Risk** (Probability and severity of things going wrong):
- **1-2** = Very safe (well-understood, easily reversible)
- **3-4** = Low risk (minor uncertainty, limited blast radius)
- **5-6** = Moderate (some unknowns OR touches sensitive area)
- **7-8** = High (significant uncertainty, potential user-facing regression)
- **9-10** = Critical (could break core flows, hard to rollback)

### Valid Categories:
- `functionality`: New features, missing capabilities, workflow improvements
- `performance`: Speed, efficiency, memory, database, rendering optimizations
- `maintenance`: Code organization, refactoring, technical debt, testing
- `ui`: Visual design, UX improvements, accessibility, responsiveness
- `code_quality`: Security, error handling, type safety, edge cases
- `user_benefit`: High-level value propositions, business impact, user experience

---

### Valid Categories for This Scan:
- **maintenance**: Code quality, refactoring, technical debt reduction, testing
- **functionality**: New features, capabilities, extensions, integrations
- **user_benefit**: User value, business impact, workflow improvements

### Your Standards:
1.  **Question-to-Decision**: Surface the question, propose how to answer it
2.  **Concrete Examples**: "What happens if X is empty AND Y is null?" not just "edge cases"
3.  **Decision Framework**: Help the team make the decision, not just identify they need to
4.  **Future-Proofing**: Clarifications that prevent future misunderstandings

---

## Context Information (Aggregated)


### Context 1: Avatar Generator & Style Transfer
- Context ID: ctx_1772215978193_ojj3msu

**Context Name**: Avatar Generator & Style Transfer

**Context Description**:
Generate character avatars with style consistency, expression blending, age progression, batch generation, pose selection, and cast-wide style transfer. Export avatar sheets and evolution timelines.

**Files in this Context** (28 files):
- src/app/features/characters/sub_AvatarGenerator/AvatarGenerator.tsx
- src/app/features/characters/sub_AvatarGenerator/components/AgeProgressor.tsx
- src/app/features/characters/sub_AvatarGenerator/components/AvatarGrid.tsx
- src/app/features/characters/sub_AvatarGenerator/components/AvatarSheetExporter.tsx
- src/app/features/characters/sub_AvatarGenerator/components/AvatarTimeline.tsx
- src/app/features/characters/sub_AvatarGenerator/components/BatchGenerator.tsx
- src/app/features/characters/sub_AvatarGenerator/components/BatchStyler.tsx
- src/app/features/characters/sub_AvatarGenerator/components/CastPreview.tsx
- src/app/features/characters/sub_AvatarGenerator/components/ComparisonView.tsx
- src/app/features/characters/sub_AvatarGenerator/components/ConsistencyChecker.tsx
- src/app/features/characters/sub_AvatarGenerator/components/CurrentAvatar.tsx
- src/app/features/characters/sub_AvatarGenerator/components/EvolutionExporter.tsx
- src/app/features/characters/sub_AvatarGenerator/components/ExpressionBlender.tsx
- src/app/features/characters/sub_AvatarGenerator/components/ExpressionLibrary.tsx
- src/app/features/characters/sub_AvatarGenerator/components/IntensityControl.tsx
- src/app/features/characters/sub_AvatarGenerator/components/OutfitSelector.tsx
- src/app/features/characters/sub_AvatarGenerator/components/PoseSelector.tsx
- src/app/features/characters/sub_AvatarGenerator/components/ReferenceSelector.tsx
- src/app/features/characters/sub_AvatarGenerator/components/StyleDefinition.tsx
- src/app/features/characters/sub_AvatarGenerator/components/StyleSelector.tsx
- src/app/features/characters/sub_AvatarGenerator/components/StyleTransfer.tsx
- src/app/features/characters/sub_AvatarGenerator/components/TransformationTracker.tsx
- src/app/features/characters/sub_AvatarGenerator/lib/styleEngine.ts
- src/app/hooks/integration/useAvatarTimeline.ts
- src/lib/style/StyleDNA.ts
- src/lib/style/StyleVariationManager.ts
- src/lib/similarity/SimilarityEngine.ts
- src/lib/similarity/StyleGrouper.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 2: Story Scripting & Export
- Context ID: ctx_1772216032809_utjlmk3

**Context Name**: Story Scripting & Export

**Context Description**:
Write and view story scripts in screenplay format with act/scene structure, voice assignment, audio timeline, script statistics, and export to multiple formats (EPUB, PDF, Fountain). Scene-by-scene script rendering with studio mode.

**Files in this Context** (24 files):
- src/app/features/story/sub_StoryScript/StoryScript.tsx
- src/app/features/story/sub_StoryScript/components/ActItem.tsx
- src/app/features/story/sub_StoryScript/components/ActItemStudio.tsx
- src/app/features/story/sub_StoryScript/components/AudioTimeline.tsx
- src/app/features/story/sub_StoryScript/components/ExportDialog.tsx
- src/app/features/story/sub_StoryScript/components/SceneItem.tsx
- src/app/features/story/sub_StoryScript/components/ScriptRenderer.tsx
- src/app/features/story/sub_StoryScript/components/ScriptStatistics.tsx
- src/app/features/story/sub_StoryScript/components/VoiceAssigner.tsx
- src/workspace/panels/story/ScriptEditorPanel.tsx
- src/workspace/panels/story/WritingDeskPanel.tsx
- src/workspace/store/scriptContextStore.ts
- src/lib/export/EPUBBuilder.ts
- src/lib/export/FountainExporter.ts
- src/lib/export/PDFGenerator.ts
- src/lib/formats/ComicFormatter.ts
- src/lib/formats/FormatExporter.ts
- src/lib/formats/ProseFormatter.ts
- src/lib/formats/ScreenplayFormatter.ts
- src/lib/storyboard/AnimaticExporter.ts
- src/lib/storyboard/BoardExporter.ts
- src/lib/storyboard/CinematographyAdvisor.ts
- src/lib/storyboard/ShotSuggester.ts
- src/lib/storyboard/TimingController.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 3: AI Writing Companion & Prompt Tools
- Context ID: ctx_1772216045508_qaevnx2

**Context Name**: AI Writing Companion & Prompt Tools

**Context Description**:
AI-powered brainstorming, scenario exploration, and story idea generation. Compose structured prompts with context building, template galleries, token budgets, and effectiveness tracking. Command palette for quick story actions.

**Files in this Context** (35 files):
- src/app/features/story/sub_AICompanion/AICompanion.tsx
- src/app/features/story/sub_AICompanion/components/BrainstormMode.tsx
- src/app/features/story/sub_AICompanion/components/IdeaCard.tsx
- src/app/features/story/sub_AICompanion/components/ScenarioExplorer.tsx
- src/app/features/story/sub_AICompanion/types.ts
- src/app/features/story/sub_AICompanion/useAICompanion.ts
- src/app/features/story/sub_PromptComposer/PromptComposer.tsx
- src/app/features/story/sub_PromptComposer/components/ContextBuilder.tsx
- src/app/features/story/sub_PromptComposer/components/EffectivenessPanel.tsx
- src/app/features/story/sub_PromptComposer/components/OptionSelector.tsx
- src/app/features/story/sub_PromptComposer/components/PromptPreview.tsx
- src/app/features/story/sub_PromptComposer/components/TemplateEditor.tsx
- src/app/features/story/sub_PromptComposer/components/TemplateGallery.tsx
- src/app/features/story/sub_PromptComposer/components/TokenBudget.tsx
- src/app/features/story/sub_PromptComposer/promptData.ts
- src/app/features/story/sub_PromptComposer/types.ts
- src/app/features/story/sub_CommandPalette/CommandPalette.tsx
- src/app/features/story/sub_CommandPalette/components/CommandList.tsx
- src/app/features/story/sub_CommandPalette/CommandPaletteContext.tsx
- src/app/features/story/sub_CommandPalette/types.ts
- src/app/features/story/sub_CommandPalette/useCommands.ts
- src/app/features/story/sub_OutlineSidebar/OutlineSidebar.tsx
- src/app/features/story/sub_OutlineSidebar/components/OutlineItem.tsx
- src/app/features/story/sub_ChoiceEditor/ChoiceEditor.tsx
- src/app/features/story/sub_ChoiceEditor/components/ChoiceForm.tsx
- src/app/features/story/sub_ChoiceEditor/components/ChoiceList.tsx
- src/lib/brainstorm/IdeaGenerator.ts
- src/lib/templates/TemplateManager.ts
- src/lib/context/ContextCompressor.ts
- src/lib/context/RelevanceScorer.ts
- src/app/hooks/useTemplateGenerator.ts
- src/app/hooks/useAISuggestionStream.ts
- src/app/features/assistant/AIAssistantPanel.tsx
- src/app/features/assistant/components/SuggestionCard.tsx
- src/app/hooks/useAIAssistant.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 4: Story Structure & Beats
- Context ID: ctx_1772216016721_melxoel

**Context Name**: Story Structure & Beats

**Context Description**:
Design story structure with acts and beats. Manage beat types (setup, conflict, climax, resolution), dependencies, emotional markers, pacing analysis, narrative maps, and distribution charts. AI-powered act recommendations and beat classification.

**Files in this Context** (51 files):
- src/app/features/story/StoryFeature.tsx
- src/app/features/story/components/ActOverview.tsx
- src/app/features/story/components/StoryLeftPanel.tsx
- src/app/features/story/components/Beats/BeatsOverview.tsx
- src/app/features/story/components/Beats/BeatsTable.tsx
- src/app/features/story/components/Beats/BeatsTableAdd.tsx
- src/app/features/story/components/Beats/BeatsTableRow.tsx
- src/app/features/story/components/Beats/DraggableBeatRow.tsx
- src/app/features/story/components/Beats/BeatClassifier.tsx
- src/app/features/story/components/Beats/BeatFilterPanel.tsx
- src/app/features/story/components/Beats/BeatNameSuggestionPanel.tsx
- src/app/features/story/components/Beats/BeatSceneSuggestions.tsx
- src/app/features/story/components/Beats/ActRecommendations.tsx
- src/app/features/story/components/Beats/DependencyEditor.tsx
- src/app/features/story/components/Beats/DependencyGraph.tsx
- src/app/features/story/components/Beats/DistributionChart.tsx
- src/app/features/story/components/Beats/EmotionalMarkers.tsx
- src/app/features/story/components/Beats/NarrativeMap.tsx
- src/app/features/story/components/Beats/NarrativeMap/BeatNode.tsx
- src/app/features/story/components/Beats/NarrativeMap/GanttTimeline.tsx
- src/app/features/story/components/Beats/NarrativeMap/PacingSuggestions.tsx
- src/app/features/story/components/Beats/ValidationPanel.tsx
- src/app/features/story/components/Setup/CenterStory.tsx
- src/app/features/story/components/Setup/StoryConfigSelect.tsx
- src/app/features/story/components/PremiseBuilder.tsx
- src/app/features/story/sub_StoryRightPanel/StoryRightPanel.tsx
- src/app/api/acts/route.ts
- src/app/api/acts/[id]/route.ts
- src/app/api/beats/route.ts
- src/app/api/beats/[id]/route.ts
- src/app/api/beat-dependencies/route.ts
- src/app/api/beat-pacing/route.ts
- src/app/api/beat-scene-mappings/route.ts
- src/app/api/beat-scene-mappings/[id]/route.ts
- src/app/hooks/integration/useActs.ts
- src/app/hooks/integration/useBeats.ts
- src/app/hooks/integration/useBeatDependencies.ts
- src/app/hooks/integration/useBeatPacing.ts
- src/app/hooks/integration/useBeatSceneMappings.ts
- src/app/hooks/useActRecommendations.ts
- src/app/hooks/useBeatNameSuggestions.ts
- src/app/hooks/useBeatSummaries.ts
- src/workspace/panels/story/BeatsManagerPanel.tsx
- src/workspace/panels/story/BeatsSidebarPanel.tsx
- src/workspace/panels/story/StoryMapPanel.tsx
- src/workspace/panels/story/StoryGraphPanel.tsx
- src/lib/beats/DependencyManager.ts
- src/lib/beats/TaxonomyLibrary.ts
- src/lib/analytics/PacingAnalyzer.ts
- src/lib/analytics/StructureAnalyzer.ts
- src/mcp-server/tools/story-structure.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 5: Factions & Organizations
- Context ID: ctx_1772215993367_q42uy4g

**Context Name**: Factions & Organizations

**Context Description**:
Create and manage story factions with branding, culture systems, diplomacy, emblem design, lore repositories, organizational charts, role hierarchies, succession planning, and alliance networks.

**Files in this Context** (46 files):
- src/app/features/characters/sub_CharFactions/FactionsList.tsx
- src/app/features/characters/sub_CharFactions/FactionCard.tsx
- src/app/features/characters/sub_CharFactions/FactionDetails.tsx
- src/app/features/characters/sub_CharFactions/FactionDetailsTabContent.tsx
- src/app/features/characters/sub_CharFactions/FactionTabNav.tsx
- src/app/features/characters/sub_CharFactions/FactionWizard.tsx
- src/app/features/characters/sub_CharFactions/FactionBrandingPanel.tsx
- src/app/features/characters/sub_CharFactions/FactionMediaGallery.tsx
- src/app/features/characters/sub_CharFactions/FactionLoreGallery.tsx
- src/app/features/characters/sub_CharFactions/FactionMembersList.tsx
- src/app/features/characters/sub_CharFactions/WizardStepConfirm.tsx
- src/app/features/characters/sub_CharFactions/WizardStepPreview.tsx
- src/app/features/characters/sub_CharFactions/WizardStepPrompt.tsx
- src/app/features/characters/sub_CharFactions/EmblemDesigner.tsx
- src/app/features/characters/sub_CharFactions/ColorCustomizer.tsx
- src/app/features/characters/sub_CharFactions/CulturePanel.tsx
- src/app/features/characters/sub_CharFactions/CulturalCalendar.tsx
- src/app/features/characters/sub_CharFactions/DiplomacyPanel.tsx
- src/app/features/characters/sub_CharFactions/AllianceNetworkGraph.tsx
- src/app/features/characters/sub_CharFactions/OrgChartBuilder.tsx
- src/app/features/characters/sub_CharFactions/RoleRankEditor.tsx
- src/app/features/characters/sub_CharFactions/RoleTemplateLibrary.tsx
- src/app/features/characters/sub_CharFactions/SuccessionPanel.tsx
- src/app/features/characters/sub_CharFactions/LoreRepository.tsx
- src/app/features/characters/sub_CharFactions/LoreSummaryPanel.tsx
- src/app/features/characters/sub_CharFactions/ValuesEditor.tsx
- src/app/features/characters/sub_CharFactions/InfluenceTracker.tsx
- src/app/features/characters/sub_CharFactions/AchievementBadges.tsx
- src/app/features/characters/sub_CharFactions/RitualDesigner.tsx
- src/app/features/characters/sub_CharFactions/SemanticSearchPanel.tsx
- src/app/features/characters/sub_CharFactions/TimelineView.tsx
- src/app/features/characters/sub_CharFactions/MediaUploadForm.tsx
- src/app/features/characters/sub_CharFactions/PhysicsPreview.tsx
- src/app/features/characters/components/CreateFactionForm.tsx
- src/app/features/characters/components/FactionsList.tsx
- src/app/api/factions/route.ts
- src/app/api/factions/[id]/route.ts
- src/app/api/factions/factions.ts
- src/app/api/faction-relationships/route.ts
- src/app/api/faction-relationships/[id]/route.ts
- src/app/hooks/integration/useFactions.ts
- src/app/hooks/integration/useFactionRelationships.ts
- src/lib/culture/CultureGenerator.ts
- src/lib/politics/PoliticsEngine.ts
- src/lib/hierarchy/HierarchyEngine.ts
- src/mcp-server/tools/factions.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 6: Character Creator & Appearance
- Context ID: ctx_1772215967090_2p6ncqu

**Context Name**: Character Creator & Appearance

**Context Description**:
Step-by-step character creation wizard with appearance customization, outfit management, wardrobe editor, accessories, gender selection, and AI-generated image previews from character descriptions.

**Files in this Context** (28 files):
- src/app/features/characters/sub_CharacterCreator/CharacterAppearanceForm.tsx
- src/app/features/characters/sub_CharacterCreator/CharacterAppearanceWithArchetypes.tsx
- src/app/features/characters/sub_CharacterCreator/components/AccessoryManager.tsx
- src/app/features/characters/sub_CharacterCreator/components/AppearancePreview.tsx
- src/app/features/characters/sub_CharacterCreator/components/CharacterImageExtraction.tsx
- src/app/features/characters/sub_CharacterCreator/components/CharacterImageUpload.tsx
- src/app/features/characters/sub_CharacterCreator/components/ContextRecommender.tsx
- src/app/features/characters/sub_CharacterCreator/components/FormField.tsx
- src/app/features/characters/sub_CharacterCreator/components/FormStepper.tsx
- src/app/features/characters/sub_CharacterCreator/components/FormSubComponents.tsx
- src/app/features/characters/sub_CharacterCreator/components/GenderSelector.tsx
- src/app/features/characters/sub_CharacterCreator/components/ImageGenerationPreview.tsx
- src/app/features/characters/sub_CharacterCreator/components/OutfitEditor.tsx
- src/app/features/characters/sub_CharacterCreator/components/OutfitTimeline.tsx
- src/app/features/characters/sub_CharacterCreator/components/PromptGenerator.tsx
- src/app/features/characters/sub_CharacterCreator/components/SteppedAppearanceForm.tsx
- src/app/features/characters/sub_CharacterCreator/components/WardrobeManager.tsx
- src/app/features/characters/sub_CharacterCreator/lib/formConfig.ts
- src/app/features/characters/sub_CharacterCreator/lib/promptGenerators.ts
- src/app/features/characters/sub_CharacterCreator/lib/randomizer.ts
- src/app/features/characters/sub_CharacterCreator/lib/useAppearanceForm.ts
- src/app/features/characters/sub_CharacterCreator/types.ts
- src/app/features/characters/components/AppearancePropagationIndicator.tsx
- src/app/features/characters/components/AppearancePropagationPanel.tsx
- src/app/features/characters/components/AppearanceTimeline.tsx
- src/app/hooks/useAppearancePropagation.ts
- src/app/hooks/integration/useCharacterOutfits.ts
- src/workspace/panels/character/CharacterCreatorPanel.tsx




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 7: Art Style & Datasets
- Context ID: ctx_1772216108925_7e22cj1

**Context Name**: Art Style & Datasets

**Context Description**:
Define and extract art styles from reference images. Manage image datasets for style consistency. Art style presets, mood adaptation, scene type rules, and style DNA analysis. Upload and organize reference image collections with tags.

**Files in this Context** (26 files):
- src/app/features/story/sub_StoryArtstyle/ArtStyleEditor.tsx
- src/app/features/story/sub_StoryArtstyle/components/ArtStyleExtractor.tsx
- src/app/features/story/sub_StoryArtstyle/components/ArtStylePresetSelector.tsx
- src/app/features/story/sub_StoryArtstyle/components/ImageUploadArea.tsx
- src/app/features/story/sub_StoryArtstyle/components/MoodAdapter.tsx
- src/app/features/story/sub_StoryArtstyle/components/SceneTypeRules.tsx
- src/app/features/story/sub_StoryArtstyle/components/StyleDNAPanel.tsx
- src/app/features/story/sub_StoryArtstyle/components/StyleImageCard.tsx
- src/app/features/story/sub_StoryArtstyle/components/VariationPreview.tsx
- src/app/features/story/sub_StoryArtstyle/lib/artStyleService.ts
- src/app/features/story/sub_StoryArtstyle/artStyleData.ts
- src/app/features/story/sub_StoryArtstyle/types.ts
- src/app/features/datasets/DatasetsFeature.tsx
- src/app/features/datasets/images/DatasetSketchWizard.tsx
- src/app/features/datasets/images/ImageDatasetGallery.tsx
- src/app/features/datasets/images/ImageDatasets.tsx
- src/app/api/ai/art-style/extract/route.ts
- src/app/api/datasets/route.ts
- src/app/api/datasets/[id]/route.ts
- src/app/api/datasets/[id]/images/route.ts
- src/app/api/datasets/[id]/images/[imageId]/route.ts
- src/app/hooks/useDatasets.ts
- src/app/hooks/integration/useDatasets.ts
- src/workspace/panels/image/ArtStylePanel.tsx
- src/lib/style/StyleInjector.ts
- src/lib/style/ColorTheory.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 8: Image Creator Workspace
- Context ID: ctx_1772216249295_zddl5cq

**Context Name**: Image Creator Workspace

**Context Description**:
Workspace-integrated image creation tool with category-based option selection, prompt editing, and image generation preview. Character and scene-aware image generation with body icons, face icons, environment icons, and preset icon registries.

**Files in this Context** (11 files):
- src/workspace/creator/components/ImageGenerationView.tsx
- src/workspace/creator/components/options/CategoryHeader.tsx
- src/workspace/creator/components/options/OptionCard.tsx
- src/workspace/creator/components/options/OptionsList.tsx
- src/workspace/creator/components/prompt/PromptEditor.tsx
- src/workspace/creator/constants/categories.ts
- src/workspace/creator/constants/options.ts
- src/workspace/creator/store/creatorCharacterStore.ts
- src/workspace/creator/store/creatorImageStore.ts
- src/workspace/creator/store/creatorUIStore.ts
- src/workspace/creator/types.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 9: Image Generation & Editing
- Context ID: ctx_1772216087396_0u2u25g

**Context Name**: Image Generation & Editing

**Context Description**:
Generate images from text prompts and scene descriptions via Leonardo AI and Gemini. Edit images with adjustment tools, color correction, selection tools, and presets. Camera setup controls and generation parameters.

**Files in this Context** (37 files):
- src/app/features/image/generator/ImageGenerator.tsx
- src/app/features/image/generator/CameraSetup.tsx
- src/app/features/image/generator/GenerationControls.tsx
- src/app/features/image/generator/components/PromptInput.tsx
- src/app/features/image/generator/components/SceneToImage.tsx
- src/app/features/image/components/ImageGallery.tsx
- src/app/features/image/components/NegativePromptGenerator.tsx
- src/app/features/image/components/PromptBuilder.tsx
- src/app/features/image/components/PromptEnhancer.tsx
- src/app/features/image/editor/ImageEditor.tsx
- src/app/features/image/editor/components/AdjustmentPanel.tsx
- src/app/features/image/editor/components/EditorCanvas.tsx
- src/app/features/image/editor/components/PresetManager.tsx
- src/app/features/image/editor/components/ToolPanel.tsx
- src/app/features/characters/sub_ImageGenerator/ImageGenerator.tsx
- src/app/features/characters/sub_ImageGenerator/components/FinalPreview.tsx
- src/app/features/characters/sub_ImageGenerator/components/ImageGallery.tsx
- src/app/features/characters/sub_ImageGenerator/components/PromptPreview.tsx
- src/app/features/characters/sub_ImageGenerator/components/SelectionPanel.tsx
- src/app/features/characters/sub_ImageGenerator/components/SketchGrid.tsx
- src/app/api/ai/generate-images/route.ts
- src/app/api/ai/evaluate-image/route.ts
- src/app/api/image-extraction/gemini/route.ts
- src/app/hooks/useImages.ts
- src/app/hooks/integration/useImages.ts
- src/workspace/panels/image/ImageGeneratorPanel.tsx
- src/workspace/panels/image/ImageCanvasPanel.tsx
- src/lib/image/PromptGenerator.ts
- src/lib/image/SceneParser.ts
- src/lib/editor/AdjustmentStack.ts
- src/lib/editor/ColorCorrection.ts
- src/lib/editor/SelectionTools.ts
- src/lib/editor/TransformTools.ts
- src/lib/canvas/CanvasEngine.ts
- src/lib/canvas/LayerManager.ts
- src/lib/services/leonardo.ts
- src/mcp-server/tools/images.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 10: Sketch & Visual Lab
- Context ID: ctx_1772216097258_jdp3eto

**Context Name**: Sketch & Visual Lab

**Context Description**:
Freehand sketch-to-image conversion with brush libraries, layer management, composition guides, real-time preview, prompt mapping, style controllers, variation galleries, and visual DNA analysis. Includes layout suggestions and preset galleries.

**Files in this Context** (24 files):
- src/app/features/image/sub_Sketch/SketchToImage.tsx
- src/app/features/image/sub_Sketch/components/BrushLibrary.tsx
- src/app/features/image/sub_Sketch/components/CompactCarousel.tsx
- src/app/features/image/sub_Sketch/components/CompositionGuides.tsx
- src/app/features/image/sub_Sketch/components/DrawingGuides.tsx
- src/app/features/image/sub_Sketch/components/LayerPanel.tsx
- src/app/features/image/sub_Sketch/components/LayoutSuggestions.tsx
- src/app/features/image/sub_Sketch/components/PresetGallery.tsx
- src/app/features/image/sub_Sketch/components/PromptCard.tsx
- src/app/features/image/sub_Sketch/components/PromptLaboratory.tsx
- src/app/features/image/sub_Sketch/components/PromptMapClaude.tsx
- src/app/features/image/sub_Sketch/components/PromptMapGpt.tsx
- src/app/features/image/sub_Sketch/components/PromptPreview.tsx
- src/app/features/image/sub_Sketch/components/QuickActions.tsx
- src/app/features/image/sub_Sketch/components/RealTimePreview.tsx
- src/app/features/image/sub_Sketch/components/StyleController.tsx
- src/app/features/image/sub_Sketch/components/TagFilter.tsx
- src/app/features/image/sub_Sketch/components/VariationGallery.tsx
- src/app/features/image/sub_Sketch/components/VibesMeter.tsx
- src/app/features/image/sub_Sketch/components/VisualDNA.tsx
- src/lib/sketch/RealTimeEngine.ts
- src/lib/composition/CompositionOverlay.ts
- src/lib/composition/FocalPointDetector.ts
- src/lib/services/sketchCleanup.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 11: Voice Casting & Performance
- Context ID: ctx_1772216127426_dema8s4

**Context Name**: Voice Casting & Performance

**Context Description**:
Manage voice profiles for characters, audition different voices, compare casting options, control delivery presets and emotion, and record performance takes. Voice matching, emotion suggestions, and performance direction controls.

**Files in this Context** (34 files):
- src/app/features/voice/VoiceFeature.tsx
- src/app/features/voice/components/AuditionPanel.tsx
- src/app/features/voice/components/CastingComparer.tsx
- src/app/features/voice/components/DeliveryPresets.tsx
- src/app/features/voice/components/DirectionControls.tsx
- src/app/features/voice/components/EmotionPanel.tsx
- src/app/features/voice/components/PacingControls.tsx
- src/app/features/voice/components/PerformanceControls.tsx
- src/app/features/voice/components/PerformancePanel.tsx
- src/app/features/voice/components/ProductionPanel.tsx
- src/app/features/voice/components/ScriptEditor.tsx
- src/app/features/voice/components/TakesGallery.tsx
- src/app/features/voice/components/TakesModal.tsx
- src/app/features/voice/components/VoiceConfiguration.tsx
- src/app/features/voice/components/VoiceDescription.tsx
- src/app/features/voice/components/VoiceList.tsx
- src/app/features/voice/components/VoiceRow.tsx
- src/app/features/voice/extraction/VoiceExtraction.tsx
- src/app/features/voice/hooks/useNarrationBatch.ts
- src/app/features/voice/hooks/useNarrationExport.ts
- src/app/features/voice/hooks/useTakeGenerator.ts
- src/app/features/voice/lib/emotionSuggestions.ts
- src/app/features/voice/lib/voiceModifiers.ts
- src/app/features/voice/types.ts
- src/app/api/voices/route.ts
- src/app/api/voices/[id]/route.ts
- src/app/hooks/useVoices.ts
- src/app/hooks/integration/useVoices.ts
- src/workspace/panels/audio/VoiceManagerPanel.tsx
- src/workspace/panels/audio/VoiceCastingPanel.tsx
- src/workspace/panels/audio/VoicePerformancePanel.tsx
- src/lib/voice/VoiceMatcher.ts
- src/lib/voice/EmotionController.ts
- src/lib/voice/DialogueGenerator.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 12: Audio Narration & Production
- Context ID: ctx_1772216144804_797581k

**Context Name**: Audio Narration & Production

**Context Description**:
Generate narration audio from scripts, manage narration pipeline and batch processing, assemble chapters, and export audio. Audio dataset extraction from YouTube and local files, character personality extraction from audio samples.

**Files in this Context** (12 files):
- src/app/features/voice/components/NarrationPipeline.tsx
- src/app/features/datasets/audio/AudioExtraction.tsx
- src/app/features/datasets/audio/AudioTranscriptions.tsx
- src/app/features/datasets/audio/CharacterPersonalityExtractor.tsx
- src/app/features/datasets/audio/LocalAudioUpload.tsx
- src/app/features/datasets/audio/YouTubeAudioSampler.tsx
- src/workspace/panels/audio/AudioToolbarPanel.tsx
- src/workspace/panels/audio/NarrationPanel.tsx
- src/workspace/panels/audio/ScriptDialogPanel.tsx
- src/lib/audio/NarrationGenerator.ts
- src/lib/voice/ChapterAssembler.ts
- src/lib/voice/ExportPipeline.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 13: Workspace Header & Navigation
- Context ID: ctx_1772216153102_qqwzc0f

**Context Name**: Workspace Header & Navigation

**Context Description**:
Top-level workspace navigation with project, act, and scene selectors. Terminal dock for CLI integration with tab management. App shell state and navigation between features.

**Files in this Context** (21 files):
- src/workspace/layout/header/WorkspaceHeader.tsx
- src/workspace/layout/header/ProjectSelector.tsx
- src/workspace/layout/header/ActSelector.tsx
- src/workspace/layout/header/SceneSelector.tsx
- src/workspace/layout/TerminalDock/TerminalDock.tsx
- src/workspace/layout/TerminalDock/TerminalDockEmpty.tsx
- src/workspace/layout/TerminalDock/TerminalTabBar.tsx
- src/workspace/layout/TerminalDock/TerminalTabItem.tsx
- src/workspace/store/terminalDockStore.ts
- src/workspace/hooks/useCLIDataSync.ts
- src/workspace/hooks/useTerminalExecute.ts
- src/app/store/appShellStore.ts
- src/app/store/navigationStore.ts
- src/app/store/projectStore.ts
- src/app/store/slices/projectSlice.ts
- src/app/hooks/useCLIFeature.ts
- src/cli/CLIMarkdown.tsx
- src/cli/CompactTerminal.tsx
- src/cli/ImprovementIndicator.tsx
- src/cli/InlineTerminal.tsx
- src/lib/claude-terminal/cli-service.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 14: AI Advisor & Orchestration
- Context ID: ctx_1772216176669_yh1o02u

**Context Name**: AI Advisor & Orchestration

**Context Description**:
Server-proxied Gemini AI advisor with text and voice modes. Manages multi-turn conversations, spawns CLI sessions, composes workspace panels, and suggests actions. Floating overlay UI with rate limiting, retry logic, and agent state management.

**Files in this Context** (10 files):
- src/agents/AdvisorClient.ts
- src/agents/AdvisorOverlay.tsx
- src/agents/advisorTools.ts
- src/agents/index.ts
- src/agents/types.ts
- src/agents/useAdvisor.ts
- src/agents/WorkspaceObserver.ts
- src/agents/store/agentStore.ts
- src/app/api/agents/advisor/route.ts
- src/workspace/panels/assistant/AdvisorPanel.tsx




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 15: MCP Server & CLI Bridge
- Context ID: ctx_1772216189024_9ctq2qs

**Context Name**: MCP Server & CLI Bridge

**Context Description**:
Node.js MCP server process exposing story tools via stdio for Claude Code integration. HTTP client calling Next.js API routes. CLI terminal session management with query streaming and signal detection for pattern improvement.

**Files in this Context** (13 files):
- src/mcp-server/index.ts
- src/mcp-server/config.ts
- src/mcp-server/http-client.ts
- src/mcp-server/tools/index.ts
- src/mcp-server/tools/projects.ts
- src/app/api/claude-terminal/sessions/route.ts
- src/app/api/claude-terminal/query/route.ts
- src/app/api/claude-terminal/stream/route.ts
- src/lib/claude-terminal/signals/improvement-prompt.ts
- src/lib/claude-terminal/signals/pattern-detector.ts
- src/lib/claude-terminal/signals/signal-analyzer.ts
- src/lib/claude-terminal/signals/signal-store.ts
- src/lib/claude-terminal/signals/signal-types.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 16: Voice Mode & Live Audio
- Context ID: ctx_1772216181553_pdve19t

**Context Name**: Voice Mode & Live Audio

**Context Description**:
Real-time voice interaction with Gemini Live via WebSocket. Ephemeral token authentication, PCM audio capture via AudioWorklet, playback via AudioContext, voice selection (Aoede, Charon, Fenrir, Kore, Puck), and reconnection handling.

**Files in this Context** (4 files):
- src/agents/GeminiLiveClient.ts
- src/agents/AudioIOManager.ts
- src/agents/useAdvisorVoice.ts
- src/app/api/agents/live-token/route.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 17: Scene Editor & Metadata
- Context ID: ctx_1772216063342_ylgfzlm

**Context Name**: Scene Editor & Metadata

**Context Description**:
Create and edit story scenes with rich content editing, location references, audio narration panels, context panels, scene sketching, and presence tracking for collaboration. Manage scene metadata, descriptions, and scripts.

**Files in this Context** (32 files):
- src/app/features/scenes/ScenesFeature.tsx
- src/app/features/scenes/components/ActList.tsx
- src/app/features/scenes/components/ActListItem.tsx
- src/app/features/scenes/components/ActManager.tsx
- src/app/features/scenes/components/ActTabButton.tsx
- src/app/features/scenes/components/LeftPanelScenes.tsx
- src/app/features/scenes/components/SceneAdd.tsx
- src/app/features/scenes/components/ScenesList.tsx
- src/app/features/scenes/components/ScenesListTable.tsx
- src/app/features/scenes/components/Script/DialogueViewer.tsx
- src/app/features/scenes/components/Script/ScriptEditor.tsx
- src/app/features/scenes/components/Script/ScriptQuickActions.tsx
- src/app/features/scenes/components/Script/useScriptGeneration.ts
- src/app/features/story/sub_SceneEditor/SceneEditor.tsx
- src/app/features/story/sub_SceneEditor/components/AudioNarrationPanel.tsx
- src/app/features/story/sub_SceneEditor/components/ContentSection.tsx
- src/app/features/story/sub_SceneEditor/components/ContextPanel.tsx
- src/app/features/story/sub_SceneEditor/components/FormatToolbar.tsx
- src/app/features/story/sub_SceneEditor/components/LocationReference.tsx
- src/app/features/story/sub_SceneEditor/components/PresenceTracker.tsx
- src/app/features/story/sub_SceneEditor/components/SceneSketchPanel.tsx
- src/app/features/story/sub_SceneEditor/lib/sketchGeneration.ts
- src/app/api/scenes/route.ts
- src/app/api/scenes/[id]/route.ts
- src/app/hooks/integration/useScenes.ts
- src/app/hooks/integration/useSceneChoices.ts
- src/workspace/panels/scene/SceneEditorPanel.tsx
- src/workspace/panels/scene/SceneListPanel.tsx
- src/workspace/panels/scene/SceneMetadataPanel.tsx
- src/workspace/panels/scene/SceneGalleryPanel.tsx
- src/workspace/panels/scene/DialogueViewPanel.tsx
- src/mcp-server/tools/scenes.ts




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---

---

### Context 18: Coordination & Recommendations
- Context ID: ctx_1772216219061_6vlpks0

**Context Name**: Coordination & Recommendations

**Context Description**:
Cross-feature event coordination hub with dependency graphs, event bus, and Zustand middleware. Smart recommendation engine with context-aware suggestion triggers, feedback collection, and domain-specific providers (assets, characters, relationships, scenes).

**Files in this Context** (26 files):
- src/lib/coordination/CoordinationHub.ts
- src/lib/coordination/DependencyGraph.ts
- src/lib/coordination/EventBus.ts
- src/lib/coordination/persistence.ts
- src/lib/coordination/queryIntegration.ts
- src/lib/coordination/types.ts
- src/lib/coordination/zustandMiddleware.ts
- src/lib/recommendations/RecommendationEngine.ts
- src/lib/recommendations/ContextTracker.ts
- src/lib/recommendations/FeedbackCollector.ts
- src/lib/recommendations/SuggestionTrigger.ts
- src/lib/recommendations/types.ts
- src/lib/recommendations/providers/AssetProvider.ts
- src/lib/recommendations/providers/CharacterProvider.ts
- src/lib/recommendations/providers/RelationshipProvider.ts
- src/lib/recommendations/providers/SceneEditorProvider.ts
- src/lib/recommendations/providers/registerProviders.ts
- src/app/hooks/useCoordination.ts
- src/app/hooks/useRecommendations.ts
- src/app/hooks/useOptimisticMutation.ts
- src/app/hooks/useEventListenerGuard.ts
- src/app/components/coordination/EventTimeline.tsx
- src/app/components/coordination/ImpactPreview.tsx
- src/app/components/recommendations/RecommendationPanel.tsx
- src/app/components/dev/EventListenerDebugPanel.tsx
- src/app/components/dev/RateLimiterMonitor.tsx




---

## Current Development Focus

Based on recent activity patterns, here's what the user has been working on:

### Active Areas (Last 7 Days)
- **Story Structure & Beats**: activity 3.5 → `src/app/features/story/StoryFeature.tsx` [story, beat, act]
- **Panel Primitives & Adapters**: activity 3.2 → `src/workspace/panels/primitives/CardGrid.tsx` [primitive, adapter, card grid]
- **Panel Layout Engine**: activity 2.4 → `src/workspace/engine/panelRegistry.ts` [workspace, panel, layout]
- **AI Writing Companion & Prompt Tools**: activity 1.4 → `src/app/features/story/sub_AICompanion/AICompanion.tsx` [brainstorm, AI companion, prompt]
- **AI Advisor & Orchestration**: activity 1.1 → `src/agents/AdvisorOverlay.tsx` [advisor, agent, Gemini]

### Lower Activity Areas
Image Creator Workspace, MCP Server & CLI Bridge, Voice Mode & Live Audio (consider if improvements needed)

### Suggested Priorities
1. Build on momentum in Story Structure & Beats

---


## Existing Ideas

Check existing ideas for ALL contexts before generating new ones to avoid duplicates.



---



---

## Aggregation Metadata

- **Role**: Ambiguity Guardian
- **Files Aggregated**: 18
- **Contexts Included**: 18
- **Created**: 2026-03-10T11:27:00.970Z
- **Source Files**:
  - idea-gen-1772870621121-ctx_1772-ag.md
  - idea-gen-1772870621131-ctx_1772-ag.md
  - idea-gen-1772870621143-ctx_1772-ag.md
  - idea-gen-1772870621153-ctx_1772-ag.md
  - idea-gen-1772870621164-ctx_1772-ag.md
  - idea-gen-1772870621178-ctx_1772-ag.md
  - idea-gen-1772870621188-ctx_1772-ag.md
  - idea-gen-1772870621199-ctx_1772-ag.md
  - idea-gen-1772870621209-ctx_1772-ag.md
  - idea-gen-1772870621219-ctx_1772-ag.md
  - idea-gen-1772870621229-ctx_1772-ag.md
  - idea-gen-1772870621239-ctx_1772-ag.md
  - idea-gen-1772870621250-ctx_1772-ag.md
  - idea-gen-1772870621261-ctx_1772-ag.md
  - idea-gen-1772870621272-ctx_1772-ag.md
  - idea-gen-1772870621283-ctx_1772-ag.md
  - idea-gen-1772870621293-ctx_1772-ag.md
  - idea-gen-1772870621307-ctx_1772-ag.md
