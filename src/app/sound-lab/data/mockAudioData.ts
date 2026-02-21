import type {
  MockVoice,
  MockCharacter,
  MockScene,
  AudioAsset,
  TimelineClip,
  AIAudioSuggestion,
  StemResult,
  BeatPattern,
  CompositionPlan,
  PromptIdea,
  MidiExtractionResult,
  InstrumentSwap,
  SpectralFeatures,
  DSPEffectChain,
} from '../types';

// ============ Helper: generate random waveform data ============

function wave(length: number, bias = 0.5, variance = 0.4): number[] {
  return Array.from({ length }, (_, i) => {
    const t = i / length;
    const sine = Math.sin(t * Math.PI * 3) * 0.3;
    const noise = (Math.random() - 0.5) * variance;
    return Math.max(0.05, Math.min(1, bias + sine + noise));
  });
}

// ============ Mock Voices ============

export const MOCK_VOICES: MockVoice[] = [
  {
    id: 'v1', name: 'Marcus Deep', provider: 'elevenlabs', gender: 'male', ageRange: 'adult',
    description: 'Rich, authoritative baritone with gravelly undertones.',
    tags: ['baritone', 'authoritative', 'warm'], stability: 0.72, similarity: 0.85, style: 0.45, speed: 1.0,
  },
  {
    id: 'v2', name: 'Elena Bright', provider: 'elevenlabs', gender: 'female', ageRange: 'young',
    description: 'Clear, energetic soprano with emotional range.',
    tags: ['soprano', 'energetic', 'expressive'], stability: 0.65, similarity: 0.78, style: 0.7, speed: 1.05,
  },
  {
    id: 'v3', name: 'Kai Wanderer', provider: 'elevenlabs', gender: 'neutral', ageRange: 'adult',
    description: 'Calm, measured androgynous voice with a reflective quality.',
    tags: ['androgynous', 'calm', 'reflective'], stability: 0.8, similarity: 0.6, style: 0.35, speed: 0.95,
  },
  {
    id: 'v4', name: 'Raven Noir', provider: 'elevenlabs', gender: 'female', ageRange: 'middle-aged',
    description: 'Low, smoky contralto with an air of mystery.',
    tags: ['contralto', 'mysterious', 'smooth'], stability: 0.75, similarity: 0.82, style: 0.6, speed: 0.9,
  },
  {
    id: 'v5', name: 'Old Thom', provider: 'elevenlabs', gender: 'male', ageRange: 'elderly',
    description: 'Weathered, wise elder voice with a gentle rasp.',
    tags: ['elderly', 'wise', 'raspy'], stability: 0.6, similarity: 0.7, style: 0.5, speed: 0.85,
  },
  {
    id: 'v6', name: 'Pixel', provider: 'elevenlabs', gender: 'female', ageRange: 'child',
    description: 'Bright, innocent child voice with wonder and curiosity.',
    tags: ['child', 'bright', 'innocent'], stability: 0.55, similarity: 0.75, style: 0.8, speed: 1.1,
  },
];

// ============ Mock Characters ============

export const MOCK_CHARACTERS: MockCharacter[] = [
  { id: 'c1', name: 'Commander Voss', archetype: 'hero', gender: 'male', ageRange: 'adult', traits: ['authoritative', 'brave', 'deep-voiced'], castVoiceId: 'v1' },
  { id: 'c2', name: 'Lyra Stormwind', archetype: 'hero', gender: 'female', ageRange: 'young', traits: ['energetic', 'determined', 'expressive'] },
  { id: 'c3', name: 'The Whisper', archetype: 'villain', gender: 'female', ageRange: 'middle-aged', traits: ['mysterious', 'cunning', 'smooth'] },
  { id: 'c4', name: 'Sage Aldric', archetype: 'mentor', gender: 'male', ageRange: 'elderly', traits: ['wise', 'gentle', 'patient'] },
];

// ============ Mock Scenes ============

export const MOCK_SCENES: MockScene[] = [
  { id: 's1', name: 'The Throne Room Confrontation', setting: 'A vast stone throne room lit by dying embers', mood: 'tense', characters: ['Commander Voss', 'The Whisper'] },
  { id: 's2', name: 'Dawn at the Cliffs', setting: 'Windswept coastal cliffs at sunrise', mood: 'hopeful', characters: ['Lyra Stormwind', 'Sage Aldric'] },
  { id: 's3', name: 'The Underground Market', setting: 'A bustling underground cavern bazaar with torchlight', mood: 'mysterious', characters: ['Lyra Stormwind', 'The Whisper'] },
];

// ============ Mock Audio Assets (20+ for scale testing) ============

export const MOCK_AUDIO_ASSETS: AudioAsset[] = [
  // Voice
  { id: 'a1', name: 'Voss Opening Monologue', type: 'voice', duration: 45, waveformData: wave(48, 0.5, 0.3) },
  { id: 'a2', name: 'Lyra Battle Cry', type: 'voice', duration: 8, waveformData: wave(32, 0.7, 0.4) },
  { id: 'a3', name: 'Whisper Threat', type: 'voice', duration: 22, waveformData: wave(40, 0.4, 0.3) },
  { id: 'a4', name: 'Aldric Wisdom', type: 'voice', duration: 35, waveformData: wave(44, 0.45, 0.25) },
  { id: 'a5', name: 'Lyra Cliff Speech', type: 'voice', duration: 28, waveformData: wave(40, 0.55, 0.35) },
  // Music
  { id: 'a6', name: 'Battle Theme', type: 'music', duration: 127, waveformData: wave(64, 0.6, 0.5) },
  { id: 'a7', name: 'Mystery Motif', type: 'music', duration: 34, waveformData: wave(48, 0.5, 0.4) },
  { id: 'a8', name: 'Dawn Strings', type: 'music', duration: 90, waveformData: wave(56, 0.45, 0.3) },
  { id: 'a9', name: 'Market Percussion', type: 'music', duration: 60, waveformData: wave(48, 0.55, 0.45) },
  { id: 'a10', name: 'Throne Room Tension', type: 'music', duration: 75, waveformData: wave(52, 0.5, 0.35) },
  { id: 'a11', name: 'Victory Fanfare', type: 'music', duration: 20, waveformData: wave(36, 0.65, 0.4) },
  // SFX
  { id: 'a12', name: 'Sword Clash', type: 'sfx', duration: 2, waveformData: wave(24, 0.7, 0.6) },
  { id: 'a13', name: 'Door Creak', type: 'sfx', duration: 3, waveformData: wave(20, 0.4, 0.5) },
  { id: 'a14', name: 'Footsteps Stone', type: 'sfx', duration: 5, waveformData: wave(28, 0.35, 0.3) },
  { id: 'a15', name: 'Thunder Crack', type: 'sfx', duration: 4, waveformData: wave(24, 0.8, 0.5) },
  { id: 'a16', name: 'Glass Shatter', type: 'sfx', duration: 2, waveformData: wave(20, 0.75, 0.55) },
  { id: 'a17', name: 'Horse Gallop', type: 'sfx', duration: 8, waveformData: wave(32, 0.5, 0.4) },
  { id: 'a18', name: 'Fire Crackle', type: 'sfx', duration: 10, waveformData: wave(36, 0.3, 0.2) },
  // Ambience
  { id: 'a19', name: 'Rain Heavy', type: 'ambience', duration: 300, waveformData: wave(64, 0.3, 0.2) },
  { id: 'a20', name: 'Tavern Murmur', type: 'ambience', duration: 180, waveformData: wave(56, 0.25, 0.15) },
  { id: 'a21', name: 'Ocean Waves', type: 'ambience', duration: 240, waveformData: wave(60, 0.35, 0.2) },
  { id: 'a22', name: 'Forest Birds', type: 'ambience', duration: 200, waveformData: wave(56, 0.28, 0.18) },
  { id: 'a23', name: 'Castle Interior', type: 'ambience', duration: 150, waveformData: wave(52, 0.2, 0.12) },
  { id: 'a24', name: 'Crowd Bazaar', type: 'ambience', duration: 120, waveformData: wave(48, 0.4, 0.25) },
];

// ============ Mock Timeline Clips (15 clips for dense timeline) ============

export const MOCK_TIMELINE_CLIPS: TimelineClip[] = [
  // Voice lane
  { id: 'tc1', assetId: 'a1', lane: 'voice', startTime: 0, duration: 45, name: 'Voss Opening Monologue' },
  { id: 'tc2', assetId: 'a5', lane: 'voice', startTime: 50, duration: 28, name: 'Lyra Cliff Speech' },
  { id: 'tc3', assetId: 'a3', lane: 'voice', startTime: 82, duration: 22, name: 'Whisper Threat' },
  { id: 'tc4', assetId: 'a4', lane: 'voice', startTime: 110, duration: 35, name: 'Aldric Wisdom' },
  // Music lane
  { id: 'tc5', assetId: 'a6', lane: 'music', startTime: 0, duration: 90, name: 'Battle Theme' },
  { id: 'tc6', assetId: 'a7', lane: 'music', startTime: 95, duration: 34, name: 'Mystery Motif' },
  { id: 'tc7', assetId: 'a8', lane: 'music', startTime: 135, duration: 45, name: 'Dawn Strings' },
  // SFX lane
  { id: 'tc8', assetId: 'a12', lane: 'sfx', startTime: 15, duration: 2, name: 'Sword Clash' },
  { id: 'tc9', assetId: 'a13', lane: 'sfx', startTime: 48, duration: 3, name: 'Door Creak' },
  { id: 'tc10', assetId: 'a14', lane: 'sfx', startTime: 70, duration: 5, name: 'Footsteps Stone' },
  { id: 'tc11', assetId: 'a15', lane: 'sfx', startTime: 105, duration: 4, name: 'Thunder Crack' },
  { id: 'tc12', assetId: 'a18', lane: 'sfx', startTime: 130, duration: 10, name: 'Fire Crackle' },
  // Ambience lane
  { id: 'tc13', assetId: 'a19', lane: 'ambience', startTime: 0, duration: 100, name: 'Rain Heavy' },
  { id: 'tc14', assetId: 'a23', lane: 'ambience', startTime: 105, duration: 80, name: 'Castle Interior' },
];

// ============ Mock Stem Results ============

export const MOCK_STEMS: StemResult[] = [
  { type: 'vocals', waveformData: wave(80, 0.55, 0.4), volume: 0.8, muted: false, solo: false },
  { type: 'drums', waveformData: wave(80, 0.65, 0.5), volume: 0.75, muted: false, solo: false },
  { type: 'bass', waveformData: wave(80, 0.4, 0.3), volume: 0.7, muted: false, solo: false },
  { type: 'guitar', waveformData: wave(80, 0.5, 0.35), volume: 0.7, muted: false, solo: false },
  { type: 'piano', waveformData: wave(80, 0.45, 0.3), volume: 0.7, muted: false, solo: false },
  { type: 'other', waveformData: wave(80, 0.45, 0.35), volume: 0.65, muted: false, solo: false },
];

// ============ Mock Beat Patterns ============

function steps(pattern: string): { active: boolean; velocity: number; accent?: boolean }[] {
  return pattern.split('').map((ch) => ({
    active: ch !== '.',
    velocity: ch === 'X' ? 1.0 : ch === 'x' ? 0.7 : ch === 'o' ? 0.4 : 0,
    ...(ch === 'X' ? { accent: true } : {}),
  }));
}

export const MOCK_BEAT_PATTERNS: BeatPattern[] = [
  {
    name: 'Basic Rock',
    bpm: 120,
    swing: 0,
    stepsPerBeat: 4,
    beats: 4,
    bars: 1,
    genre: 'rock',
    mood: 'driving',
    reasoning: 'Classic 4/4 rock pattern: kick on 1 and 3, snare on 2 and 4, 8th note hi-hats.',
    tracks: [
      { instrument: 'kick',  steps: steps('X...X...X...X...'), volume: 0.9, muted: false },
      { instrument: 'snare', steps: steps('....X.......X...'), volume: 0.85, muted: false },
      { instrument: 'hihat', steps: steps('x.x.x.x.x.x.x.x.'), volume: 0.6, muted: false },
    ],
  },
  {
    name: 'Lo-fi Hip Hop',
    bpm: 85,
    swing: 0.35,
    stepsPerBeat: 4,
    beats: 4,
    bars: 2,
    genre: 'lo-fi hip-hop',
    mood: 'chill',
    reasoning: 'Swung feel with ghost notes on hi-hat, syncopated kick, rim-click snare on 2 and 4. Bass follows root-fifth pattern.',
    tracks: [
      { instrument: 'kick',  steps: steps('X.....x.....X.......x.X...x.......'), volume: 0.85, muted: false },
      { instrument: 'snare', steps: steps('....x.......x.......x.......x...'), volume: 0.7, muted: false },
      { instrument: 'hihat', steps: steps('x.oxo.oxo.oxo.oxo.oxo.oxo.oxo.ox'), volume: 0.5, muted: false },
      { instrument: 'bass',  steps: steps('X.......x.......X.......x.......'), volume: 0.75, muted: false },
    ],
  },
  {
    name: 'Four on the Floor',
    bpm: 128,
    swing: 0,
    stepsPerBeat: 4,
    beats: 4,
    bars: 1,
    genre: 'electronic',
    mood: 'energetic',
    reasoning: 'Classic house/techno pattern: kick every beat, open hi-hat on offbeats, clap on 2 and 4, driving bass on 1.',
    tracks: [
      { instrument: 'kick',  steps: steps('X...X...X...X...'), volume: 0.95, muted: false },
      { instrument: 'clap',  steps: steps('....X.......X...'), volume: 0.8, muted: false },
      { instrument: 'hihat', steps: steps('.x.x.x.x.x.x.x.x'), volume: 0.55, muted: false },
      { instrument: 'bass',  steps: steps('X.....x...x.....'), volume: 0.8, muted: false },
    ],
  },
];

// ============ Mock Beat Modification ============

export function getMockBeatModification(): { action: string; reasoning: string; changes: Record<string, unknown> } {
  return {
    action: 'modify_tracks',
    reasoning: 'Adding ghost notes to hi-hat creates a more organic feel. Syncopating the kick with an offbeat hit on the "and" of beat 3 adds groove and forward momentum.',
    changes: {
      tracks: [
        { instrument: 'kick', steps: 'X...X.....x.X...' },
        { instrument: 'hihat', steps: 'xoxoxoxoxoxoxoxo' },
      ],
      swing: 0.15,
    },
  };
}

// ============ AI Director Suggestions ============

export function getSceneSuggestions(sceneId: string): AIAudioSuggestion[] {
  const suggestions: Record<string, AIAudioSuggestion[]> = {
    s1: [
      { id: 'sug1', type: 'music', description: 'Tense orchestral strings with low brass', confidence: 0.92, waveformData: wave(32, 0.5, 0.4) },
      { id: 'sug2', type: 'sfx', description: 'Echoing footsteps on stone floor', confidence: 0.88, waveformData: wave(24, 0.35, 0.3) },
      { id: 'sug3', type: 'ambience', description: 'Crackling fire embers with distant wind', confidence: 0.85, waveformData: wave(32, 0.25, 0.15) },
    ],
    s2: [
      { id: 'sug4', type: 'music', description: 'Gentle piano with rising strings', confidence: 0.9, waveformData: wave(32, 0.4, 0.3) },
      { id: 'sug5', type: 'ambience', description: 'Ocean waves crashing against cliffs', confidence: 0.94, waveformData: wave(32, 0.3, 0.2) },
      { id: 'sug6', type: 'sfx', description: 'Seagulls crying in the distance', confidence: 0.78, waveformData: wave(24, 0.2, 0.25) },
    ],
    s3: [
      { id: 'sug7', type: 'music', description: 'Exotic percussion with mysterious flute', confidence: 0.87, waveformData: wave(32, 0.45, 0.35) },
      { id: 'sug8', type: 'ambience', description: 'Crowd murmur with clinking coins', confidence: 0.91, waveformData: wave(32, 0.35, 0.2) },
      { id: 'sug9', type: 'sfx', description: 'Metalwork hammering in adjacent stall', confidence: 0.72, waveformData: wave(24, 0.5, 0.45) },
    ],
  };
  return suggestions[sceneId] ?? suggestions.s1!;
}

// ============ Mock Composition Plans ============

export function getMockCompositionPlan(sceneId?: string | null): CompositionPlan {
  const plans: Record<string, CompositionPlan> = {
    s1: {
      positive_global_styles: 'dramatic orchestral, tense strings, low brass, timpani rolls, cinematic suspense',
      negative_global_styles: 'cheerful, upbeat, electronic',
      sections: [
        { text: 'Low cello drone with distant timpani, building unease', duration_ms: 12000 },
        { text: 'Strings enter with a dissonant climbing motif, tension rising', duration_ms: 15000 },
        { text: 'Full brass and percussion confrontation, dramatic and powerful', duration_ms: 20000 },
        { text: 'Sudden silence, then a single violin note fading into darkness', duration_ms: 8000 },
      ],
      summary: 'Tense throne room confrontation building from unease to dramatic climax',
    },
    s2: {
      positive_global_styles: 'gentle piano, rising strings, hopeful, warm, dawn ambience, cinematic',
      negative_global_styles: 'harsh, distorted, aggressive',
      sections: [
        { text: 'Solo piano with soft arpeggios, gentle and contemplative', duration_ms: 15000 },
        { text: 'Strings join gradually, building warmth and hope', duration_ms: 18000 },
        { text: 'Full orchestral swell with triumphant brass, sunrise crescendo', duration_ms: 20000 },
        { text: 'Gentle resolution with piano and flute, peaceful and resolved', duration_ms: 12000 },
      ],
      summary: 'Hopeful dawn at the cliffs, gentle piano building to triumphant sunrise',
    },
    s3: {
      positive_global_styles: 'exotic percussion, mysterious flute, Middle Eastern scales, layered rhythms, bazaar atmosphere',
      negative_global_styles: 'orchestral, classical, heavy metal',
      sections: [
        { text: 'Soft hand drums with a single ney flute melody, mysterious and inviting', duration_ms: 12000 },
        { text: 'Layered percussion enters with oud and sitar, bustling energy', duration_ms: 18000 },
        { text: 'Full ensemble with complex rhythms and winding melodies, vibrant market', duration_ms: 15000 },
      ],
      summary: 'Mysterious underground market with exotic percussion and winding melodies',
    },
  };

  if (sceneId && plans[sceneId]) return plans[sceneId];

  return {
    positive_global_styles: 'cinematic orchestral, sweeping strings, emotional, dynamic',
    negative_global_styles: 'harsh electronic, distorted',
    sections: [
      { text: 'Quiet atmospheric opening with ambient textures', duration_ms: 10000 },
      { text: 'Melodic theme introduced with strings and woodwinds', duration_ms: 15000 },
      { text: 'Building intensity with full orchestra and percussion', duration_ms: 20000 },
      { text: 'Gentle resolution returning to the opening theme', duration_ms: 10000 },
    ],
    summary: 'Cinematic orchestral piece with dynamic arc from quiet to powerful',
  };
}

// ============ Mock Prompt Ideas ============

export function getMockPromptIdeas(mode: 'sfx' | 'ambience', sceneId?: string | null): PromptIdea[] {
  const ts = Date.now();

  const sfxIdeas: Record<string, PromptIdea[]> = {
    s1: [
      { id: `idea-${ts}-0`, text: 'Heavy metal sword clashing against a shield in a stone hall, sharp and resonant with reverb', label: 'Sword Impact', duration_seconds: 3, prompt_influence: 0.6, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Slow deliberate footsteps on cold stone floor, leather boots with slight echo', label: 'Stone Footsteps', duration_seconds: 5, prompt_influence: 0.5, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Crackling fire embers shifting in a large stone fireplace, close perspective', label: 'Fire Crackle', duration_seconds: 8, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-3`, text: 'Heavy wooden throne room door slamming shut, deep boom with stone reverb', label: 'Door Slam', duration_seconds: 3, prompt_influence: 0.7, status: 'idle' },
    ],
    s2: [
      { id: `idea-${ts}-0`, text: 'Large ocean wave crashing against coastal rocks, powerful impact with white noise spray', label: 'Wave Crash', duration_seconds: 6, prompt_influence: 0.5, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Strong coastal wind gusting across open cliff top, whistling through grass', label: 'Cliff Wind', duration_seconds: 8, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Seagulls calling in the distance over the ocean, 2-3 birds with varied cries', label: 'Distant Gulls', duration_seconds: 5, prompt_influence: 0.5, status: 'idle' },
    ],
    s3: [
      { id: `idea-${ts}-0`, text: 'Hammering on metal anvil in a busy market stall, rhythmic and distant', label: 'Metalwork', duration_seconds: 5, prompt_influence: 0.5, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Coins clinking and jingling together on a wooden counter, close perspective', label: 'Coin Clink', duration_seconds: 3, prompt_influence: 0.6, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Torch flame flickering in a cavern, crackling fire with slight echo', label: 'Torch Flame', duration_seconds: 6, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-3`, text: 'Ceramic pottery being set down on a stone shelf, gentle clatter', label: 'Pottery Set', duration_seconds: 2, prompt_influence: 0.5, status: 'idle' },
    ],
  };

  const ambienceIdeas: Record<string, PromptIdea[]> = {
    s1: [
      { id: `idea-${ts}-0`, text: 'Large stone throne room interior ambience, distant echoes, crackling fire, cold air', label: 'Throne Room', duration_seconds: 20, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Dying embers in a massive fireplace, low crackling with occasional pops, warm close perspective', label: 'Dying Embers', duration_seconds: 15, prompt_influence: 0.5, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Wind howling through castle corridors, distant and eerie with stone reverb', label: 'Castle Wind', duration_seconds: 20, prompt_influence: 0.4, status: 'idle' },
    ],
    s2: [
      { id: `idea-${ts}-0`, text: 'Coastal cliff ambience at dawn, rhythmic ocean waves below, gentle breeze, distant seabirds', label: 'Cliff Dawn', duration_seconds: 25, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Morning ocean soundscape, gentle waves lapping on rocks, calm and peaceful atmosphere', label: 'Morning Ocean', duration_seconds: 20, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Open hilltop wind with grass rustling, birds singing, early morning freshness', label: 'Hilltop Breeze', duration_seconds: 20, prompt_influence: 0.3, status: 'idle' },
    ],
    s3: [
      { id: `idea-${ts}-0`, text: 'Underground cavern bazaar, crowd murmur, distant merchants calling, echoing stone walls', label: 'Bazaar Crowd', duration_seconds: 25, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Torch-lit cave interior, dripping water, distant footsteps, mysterious atmosphere', label: 'Cave Interior', duration_seconds: 20, prompt_influence: 0.4, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Busy market atmosphere with overlapping conversations, clinking metal, shuffling feet', label: 'Market Bustle', duration_seconds: 20, prompt_influence: 0.5, status: 'idle' },
    ],
  };

  const ideas = mode === 'sfx' ? sfxIdeas : ambienceIdeas;

  if (sceneId && ideas[sceneId]) return ideas[sceneId];

  // Default ideas when no scene selected
  if (mode === 'sfx') {
    return [
      { id: `idea-${ts}-0`, text: 'Sharp metallic impact with reverb tail, close perspective', label: 'Metal Impact', duration_seconds: 3, prompt_influence: 0.5, status: 'idle' },
      { id: `idea-${ts}-1`, text: 'Wooden door creaking open slowly, old hinges, medium distance', label: 'Door Creak', duration_seconds: 4, prompt_influence: 0.5, status: 'idle' },
      { id: `idea-${ts}-2`, text: 'Heavy footsteps on gravel path, slow deliberate walking pace', label: 'Gravel Steps', duration_seconds: 5, prompt_influence: 0.4, status: 'idle' },
    ];
  }

  return [
    { id: `idea-${ts}-0`, text: 'Quiet interior room ambience, soft air conditioning hum, distant muffled sounds', label: 'Room Tone', duration_seconds: 20, prompt_influence: 0.3, status: 'idle' },
    { id: `idea-${ts}-1`, text: 'Nighttime forest ambience, crickets, gentle breeze through leaves, occasional owl', label: 'Night Forest', duration_seconds: 25, prompt_influence: 0.4, status: 'idle' },
    { id: `idea-${ts}-2`, text: 'Rain on window glass, steady medium rain, indoor perspective, calming', label: 'Rain Inside', duration_seconds: 20, prompt_influence: 0.4, status: 'idle' },
  ];
}

// ============ Lab Tab Mock Data ============

export function getMockMidiExtraction(): MidiExtractionResult {
  return {
    tempo: 120,
    duration: 8.0,
    tracks: [
      {
        name: 'Melody',
        channel: 0,
        instrument: 0, // Acoustic Grand Piano
        notes: [
          { pitch: 60, startTime: 0.0, duration: 0.5, velocity: 80 },
          { pitch: 64, startTime: 0.5, duration: 0.5, velocity: 75 },
          { pitch: 67, startTime: 1.0, duration: 0.5, velocity: 85 },
          { pitch: 72, startTime: 1.5, duration: 1.0, velocity: 90 },
          { pitch: 71, startTime: 2.5, duration: 0.5, velocity: 70 },
          { pitch: 67, startTime: 3.0, duration: 0.5, velocity: 75 },
          { pitch: 64, startTime: 3.5, duration: 0.5, velocity: 80 },
          { pitch: 60, startTime: 4.0, duration: 1.0, velocity: 85 },
          { pitch: 62, startTime: 5.0, duration: 0.5, velocity: 70 },
          { pitch: 65, startTime: 5.5, duration: 0.5, velocity: 75 },
          { pitch: 69, startTime: 6.0, duration: 0.5, velocity: 80 },
          { pitch: 72, startTime: 6.5, duration: 1.5, velocity: 95 },
        ],
      },
      {
        name: 'Bass',
        channel: 1,
        instrument: 33, // Electric Bass (finger)
        notes: [
          { pitch: 36, startTime: 0.0, duration: 1.0, velocity: 90 },
          { pitch: 43, startTime: 1.0, duration: 1.0, velocity: 85 },
          { pitch: 40, startTime: 2.0, duration: 1.0, velocity: 88 },
          { pitch: 36, startTime: 3.0, duration: 1.0, velocity: 92 },
          { pitch: 41, startTime: 4.0, duration: 1.0, velocity: 87 },
          { pitch: 43, startTime: 5.0, duration: 1.0, velocity: 85 },
          { pitch: 40, startTime: 6.0, duration: 2.0, velocity: 90 },
        ],
      },
    ],
  };
}

export function getMockInstrumentSuggestions(): {
  analysis: string;
  suggestions: InstrumentSwap[];
  globalTransposition: number;
  globalVelocityCurve: string;
  overallReasoning: string;
} {
  return {
    analysis: 'Two-part arrangement: a lyrical melody in the mid-upper register and a supportive bass foundation. The melody has a singing quality that would translate well to bowed strings.',
    suggestions: [
      {
        trackIndex: 0,
        originalInstrument: 0,
        newInstrument: 42,
        newInstrumentName: 'Cello',
        transposition: -12,
        velocityCurve: 'soft',
      },
      {
        trackIndex: 1,
        originalInstrument: 33,
        newInstrument: 58,
        newInstrumentName: 'Tuba',
        transposition: 0,
        velocityCurve: 'compressed',
      },
    ],
    globalTransposition: 0,
    globalVelocityCurve: 'linear',
    overallReasoning: 'Transforming the piano piece into a brass/strings duet creates warmth and gravitas. The cello\'s singing tone suits the melody while the tuba provides robust low-end support.',
  };
}

export function getMockSpectralFeatures(): SpectralFeatures {
  return {
    rms: 0.42,
    spectralCentroid: 2340,
    spectralFlatness: 0.15,
    spectralRolloff: 6800,
    mfcc: [-22.5, 45.2, -12.8, 8.1, -3.4, 1.2, -0.8, 0.5, -0.3, 0.2, -0.1, 0.05, -0.02],
    zcr: 0.08,
    energy: 0.55,
    description: 'Warm tonal source, moderate brightness, 120 BPM, C minor',
    bpm: 120,
    key: 'C',
    scale: 'minor',
    keyStrength: 0.82,
    beats: Array.from({ length: 48 }, (_, i) => i * 0.5),
  };
}

export function getMockDSPResult(): { reasoning: string; effectChain: DSPEffectChain } {
  return {
    reasoning: 'To achieve a darker, more atmospheric character: lowpass filter reduces brightness, granular pitch shift adds depth, reverb creates space. The source is already warm (centroid 2340Hz) so a gentle lowpass at 3kHz preserves body while cutting shimmer.',
    effectChain: {
      granular: {
        grainSize: 0.15,
        overlap: 0.8,
        pitchShift: -5,
        playbackRate: 0.85,
        randomness: 0.1,
        reverse: false,
      },
      filters: [
        { type: 'lowpass' as BiquadFilterType, frequency: 3000, Q: 0.7, gain: 0 },
        { type: 'peaking' as BiquadFilterType, frequency: 250, Q: 1.2, gain: 3 },
      ],
      distortion: 0.05,
      reverbMix: 0.35,
      delayTime: 0.3,
      delayFeedback: 0.2,
    },
  };
}
