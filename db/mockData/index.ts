/**
 * Mock Data Index
 * Central export point for all mock data modules
 *
 * Enable mock data mode by setting NEXT_PUBLIC_USE_MOCK_DATA=true in .env
 */

// ============================================
// Constants and utilities
// ============================================
export { MOCK_USER_ID, delay, simulateApiCall } from './constants';

// ============================================
// Core Entities
// ============================================

// Projects
export { mockProjects } from './projects';

// Factions
export { mockFactions, mockFactionRelationships } from './factions';
export { mockFactionMedia } from './factionMedia';
export { mockFactionEvents, mockFactionAchievements, mockFactionLore } from './factionDetails';

// Characters
export { mockCharacters, mockTraits, mockCharRelationships } from './characters';

// Character Appearances (migration 005)
export { mockCharAppearances } from './charAppearance';
export type { CharAppearance } from './charAppearance';

// Story (Acts and Scenes)
export { mockActs, mockScenes } from './story';

// Scene Graph (branching narrative)
export { mockGraphScenes, mockSceneChoices, mockProjectFirstScenes } from './sceneGraph';

// ============================================
// Beats & Dependencies (schema + migration 006, 007)
// ============================================
export {
  mockBeats,
  mockBeatDependencies,
  mockBeatPacingSuggestions,
  mockBeatSceneMappings,
} from './beats';
export type {
  Beat,
  BeatDependency,
  BeatPacingSuggestion,
  BeatSceneMapping,
} from './beats';

// ============================================
// Voice Management (migration 001)
// ============================================
export {
  mockVoices,
  mockVoiceConfigs,
  mockAudioSamples,
} from './voices';
export type {
  Voice,
  VoiceConfig,
  AudioSample,
} from './voices';

// ============================================
// Dataset Management (migration 002)
// ============================================
export {
  mockDatasets,
  mockDatasetImages,
  mockAudioTranscriptions,
  mockCharacterExtractions,
  mockYouTubeExtractions,
  mockYouTubeSamples,
} from './datasets';
export type {
  Dataset,
  DatasetImage,
  AudioTranscription,
  CharacterExtraction,
  YouTubeExtraction,
  YouTubeSample,
} from './datasets';

// ============================================
// Image Generation (migration 003)
// ============================================
export {
  mockGeneratedImages,
  mockImageEditOperations,
  mockImageCollections,
  mockCameraPresets,
} from './images';
export type {
  GeneratedImage,
  ImageEditOperation,
  ImageCollection,
  CameraPreset,
} from './images';

// ============================================
// Video Generation (migration 004)
// ============================================
export {
  mockGeneratedVideos,
  mockVideoStoryboards,
  mockStoryboardFrames,
  mockVideoEditOperations,
  mockVideoCollections,
} from './videos';
export type {
  GeneratedVideo,
  VideoStoryboard,
  StoryboardFrame,
  VideoEditOperation,
  VideoCollection,
} from './videos';

// ============================================
// Helper Functions
// ============================================

/**
 * Get all mock data for a specific project
 */
export function getMockDataForProject(projectId: string) {
  const { mockProjects } = require('./projects');
  const { mockFactions, mockFactionRelationships } = require('./factions');
  const { mockFactionMedia } = require('./factionMedia');
  const { mockFactionEvents, mockFactionAchievements, mockFactionLore } = require('./factionDetails');
  const { mockCharacters, mockTraits, mockCharRelationships } = require('./characters');
  const { mockCharAppearances } = require('./charAppearance');
  const { mockActs, mockScenes } = require('./story');
  const { mockBeats, mockBeatDependencies, mockBeatPacingSuggestions, mockBeatSceneMappings } = require('./beats');
  const { mockVoices, mockVoiceConfigs, mockAudioSamples } = require('./voices');
  const { mockDatasets, mockDatasetImages } = require('./datasets');
  const { mockGeneratedImages, mockImageEditOperations, mockImageCollections } = require('./images');
  const { mockGeneratedVideos, mockVideoStoryboards, mockStoryboardFrames, mockVideoEditOperations, mockVideoCollections } = require('./videos');

  const project = mockProjects.find((p: { id: string }) => p.id === projectId);
  if (!project) return null;

  const factions = mockFactions.filter((f: { project_id: string }) => f.project_id === projectId);
  const factionIds = factions.map((f: { id: string }) => f.id);

  const characters = mockCharacters.filter((c: { project_id: string }) => c.project_id === projectId);
  const characterIds = characters.map((c: { id: string }) => c.id);

  const acts = mockActs.filter((a: { project_id: string }) => a.project_id === projectId);
  const actIds = acts.map((a: { id: string }) => a.id);

  const scenes = mockScenes.filter((s: { project_id: string }) => s.project_id === projectId);
  const sceneIds = scenes.map((s: { id: string }) => s.id);

  return {
    project,
    factions,
    factionRelationships: mockFactionRelationships.filter(
      (fr: { faction_a_id: string; faction_b_id: string }) =>
        factionIds.includes(fr.faction_a_id) || factionIds.includes(fr.faction_b_id)
    ),
    factionMedia: mockFactionMedia.filter((fm: { faction_id: string }) => factionIds.includes(fm.faction_id)),
    factionEvents: mockFactionEvents.filter((fe: { faction_id: string }) => factionIds.includes(fe.faction_id)),
    factionAchievements: mockFactionAchievements.filter((fa: { faction_id: string }) => factionIds.includes(fa.faction_id)),
    factionLore: mockFactionLore.filter((fl: { faction_id: string }) => factionIds.includes(fl.faction_id)),
    characters,
    characterAppearances: mockCharAppearances.filter((ca: { character_id: string }) => characterIds.includes(ca.character_id)),
    traits: mockTraits.filter((t: { character_id: string }) => characterIds.includes(t.character_id)),
    characterRelationships: mockCharRelationships.filter(
      (cr: { character_a_id: string; character_b_id: string }) =>
        characterIds.includes(cr.character_a_id) || characterIds.includes(cr.character_b_id)
    ),
    acts,
    scenes,
    beats: mockBeats.filter((b: { project_id: string }) => b.project_id === projectId),
    beatDependencies: mockBeatDependencies,
    beatPacingSuggestions: mockBeatPacingSuggestions.filter((bp: { project_id: string }) => bp.project_id === projectId),
    beatSceneMappings: mockBeatSceneMappings.filter((bsm: { project_id: string }) => bsm.project_id === projectId),
    voices: mockVoices.filter((v: { project_id: string }) => v.project_id === projectId),
    voiceConfigs: mockVoiceConfigs,
    audioSamples: mockAudioSamples,
    datasets: mockDatasets.filter((d: { project_id: string }) => d.project_id === projectId),
    datasetImages: mockDatasetImages,
    generatedImages: mockGeneratedImages.filter((gi: { project_id: string }) => gi.project_id === projectId),
    imageEditOperations: mockImageEditOperations,
    imageCollections: mockImageCollections.filter((ic: { project_id: string }) => ic.project_id === projectId),
    generatedVideos: mockGeneratedVideos.filter((gv: { project_id: string }) => gv.project_id === projectId),
    videoStoryboards: mockVideoStoryboards.filter((vs: { project_id: string }) => vs.project_id === projectId),
    storyboardFrames: mockStoryboardFrames,
    videoEditOperations: mockVideoEditOperations,
    videoCollections: mockVideoCollections.filter((vc: { project_id: string }) => vc.project_id === projectId),
  };
}

/**
 * Get summary statistics for mock data
 */
export function getMockDataStats() {
  const { mockProjects } = require('./projects');
  const { mockFactions, mockFactionRelationships } = require('./factions');
  const { mockCharacters, mockTraits, mockCharRelationships } = require('./characters');
  const { mockActs, mockScenes } = require('./story');
  const { mockBeats, mockBeatDependencies, mockBeatSceneMappings } = require('./beats');
  const { mockVoices, mockAudioSamples } = require('./voices');
  const { mockDatasets, mockDatasetImages, mockAudioTranscriptions } = require('./datasets');
  const { mockGeneratedImages, mockImageCollections, mockCameraPresets } = require('./images');
  const { mockGeneratedVideos, mockVideoStoryboards, mockStoryboardFrames } = require('./videos');
  const { mockCharAppearances } = require('./charAppearance');

  return {
    projects: mockProjects.length,
    factions: mockFactions.length,
    factionRelationships: mockFactionRelationships.length,
    characters: mockCharacters.length,
    characterAppearances: mockCharAppearances.length,
    traits: mockTraits.length,
    characterRelationships: mockCharRelationships.length,
    acts: mockActs.length,
    scenes: mockScenes.length,
    beats: mockBeats.length,
    beatDependencies: mockBeatDependencies.length,
    beatSceneMappings: mockBeatSceneMappings.length,
    voices: mockVoices.length,
    audioSamples: mockAudioSamples.length,
    datasets: mockDatasets.length,
    datasetImages: mockDatasetImages.length,
    audioTranscriptions: mockAudioTranscriptions.length,
    generatedImages: mockGeneratedImages.length,
    imageCollections: mockImageCollections.length,
    cameraPresets: mockCameraPresets.length,
    generatedVideos: mockGeneratedVideos.length,
    videoStoryboards: mockVideoStoryboards.length,
    storyboardFrames: mockStoryboardFrames.length,
  };
}
