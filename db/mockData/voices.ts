/**
 * Mock Voice Data
 * Voices, voice configurations, and audio samples for TTS
 */

export interface Voice {
  id: string;
  voice_id: string;
  name: string;
  description?: string;
  project_id: string;
  character_id?: string;
  provider: 'elevenlabs' | 'openai' | 'custom';
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  age_range?: string;
  audio_sample_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceConfig {
  voice_id: string;
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
  updated_at: string;
}

export interface AudioSample {
  id: string;
  voice_id: string;
  file_path: string;
  file_name: string;
  duration?: number;
  size?: number;
  transcription?: string;
  created_at: string;
}

export const mockVoices: Voice[] = [
  {
    id: 'voice-1',
    voice_id: 'el_aldric_noble',
    name: 'Aldric Noble Voice',
    description: 'Deep, commanding voice with noble undertones. Perfect for knights and warriors.',
    project_id: 'proj-1',
    character_id: 'char-1',
    provider: 'elevenlabs',
    language: 'en',
    gender: 'male',
    age_range: '30-40',
    audio_sample_url: '/samples/aldric_sample.mp3',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'voice-2',
    voice_id: 'el_lyra_shadow',
    name: 'Lyra Shadow Whisper',
    description: 'Mysterious, silky voice with subtle menace. Ideal for rogues and assassins.',
    project_id: 'proj-1',
    character_id: 'char-2',
    provider: 'elevenlabs',
    language: 'en',
    gender: 'female',
    age_range: '25-35',
    audio_sample_url: '/samples/lyra_sample.mp3',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'voice-3',
    voice_id: 'el_theron_dragon',
    name: 'Theron Dragonborn',
    description: 'Gravelly voice with ancient wisdom. Suitable for dragon-touched characters.',
    project_id: 'proj-1',
    character_id: 'char-3',
    provider: 'elevenlabs',
    language: 'en',
    gender: 'male',
    age_range: '40-60',
    audio_sample_url: '/samples/theron_sample.mp3',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'voice-4',
    voice_id: 'el_elara_bright',
    name: 'Elara Brightshield',
    description: 'Clear, inspiring voice with warmth. Perfect for paladins and healers.',
    project_id: 'proj-1',
    character_id: 'char-4',
    provider: 'elevenlabs',
    language: 'en',
    gender: 'female',
    age_range: '25-30',
    audio_sample_url: '/samples/elara_sample.mp3',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'voice-5',
    voice_id: 'openai_narrator',
    name: 'Epic Narrator',
    description: 'Rich, theatrical narrator voice for story exposition.',
    project_id: 'proj-1',
    character_id: undefined,
    provider: 'openai',
    language: 'en',
    gender: 'male',
    age_range: '45-55',
    audio_sample_url: '/samples/narrator_sample.mp3',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'voice-6',
    voice_id: 'custom_villain',
    name: 'Dark Lord Voice',
    description: 'Ominous, echoing voice for the main antagonist.',
    project_id: 'proj-1',
    character_id: undefined,
    provider: 'custom',
    language: 'en',
    gender: 'male',
    age_range: 'ageless',
    audio_sample_url: '/samples/villain_sample.mp3',
    created_at: '2024-01-17T11:00:00Z',
    updated_at: '2024-01-17T11:00:00Z',
  },
];

export const mockVoiceConfigs: VoiceConfig[] = [
  {
    voice_id: 'el_aldric_noble',
    stability: 0.65,
    similarity_boost: 0.80,
    style: 0.45,
    speed: 0.95,
    use_speaker_boost: true,
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    voice_id: 'el_lyra_shadow',
    stability: 0.55,
    similarity_boost: 0.85,
    style: 0.60,
    speed: 1.05,
    use_speaker_boost: false,
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    voice_id: 'el_theron_dragon',
    stability: 0.70,
    similarity_boost: 0.75,
    style: 0.35,
    speed: 0.85,
    use_speaker_boost: true,
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    voice_id: 'el_elara_bright',
    stability: 0.60,
    similarity_boost: 0.82,
    style: 0.55,
    speed: 1.00,
    use_speaker_boost: false,
    updated_at: '2024-01-16T11:00:00Z',
  },
  {
    voice_id: 'openai_narrator',
    stability: 0.75,
    similarity_boost: 0.70,
    style: 0.50,
    speed: 0.92,
    use_speaker_boost: true,
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    voice_id: 'custom_villain',
    stability: 0.50,
    similarity_boost: 0.90,
    style: 0.70,
    speed: 0.80,
    use_speaker_boost: true,
    updated_at: '2024-01-17T11:00:00Z',
  },
];

export const mockAudioSamples: AudioSample[] = [
  {
    id: 'sample-1',
    voice_id: 'el_aldric_noble',
    file_path: '/audio/aldric/oath_speech.mp3',
    file_name: 'oath_speech.mp3',
    duration: 45.5,
    size: 728000,
    transcription: 'By the light of the eternal flame, I pledge my sword to the realm.',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'sample-2',
    voice_id: 'el_aldric_noble',
    file_path: '/audio/aldric/battle_cry.mp3',
    file_name: 'battle_cry.mp3',
    duration: 8.2,
    size: 131200,
    transcription: 'For the Silver Order! To battle!',
    created_at: '2024-01-15T10:45:00Z',
  },
  {
    id: 'sample-3',
    voice_id: 'el_lyra_shadow',
    file_path: '/audio/lyra/infiltration.mp3',
    file_name: 'infiltration.mp3',
    duration: 22.8,
    size: 364800,
    transcription: 'The shadows are my cloak, silence my companion.',
    created_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'sample-4',
    voice_id: 'el_lyra_shadow',
    file_path: '/audio/lyra/threat.mp3',
    file_name: 'threat.mp3',
    duration: 15.3,
    size: 244800,
    transcription: 'Cross me again, and you will never see the blade coming.',
    created_at: '2024-01-15T11:45:00Z',
  },
  {
    id: 'sample-5',
    voice_id: 'el_theron_dragon',
    file_path: '/audio/theron/warning.mp3',
    file_name: 'warning.mp3',
    duration: 38.7,
    size: 619200,
    transcription: 'The ancient ones have awakened. Fire returns to these lands.',
    created_at: '2024-01-16T10:30:00Z',
  },
  {
    id: 'sample-6',
    voice_id: 'openai_narrator',
    file_path: '/audio/narrator/opening.mp3',
    file_name: 'opening.mp3',
    duration: 62.4,
    size: 998400,
    transcription: 'In an age when dragons ruled the skies and magic flowed through every stream...',
    created_at: '2024-01-17T10:30:00Z',
  },
  {
    id: 'sample-7',
    voice_id: 'custom_villain',
    file_path: '/audio/villain/monologue.mp3',
    file_name: 'monologue.mp3',
    duration: 55.2,
    size: 883200,
    transcription: 'You think your petty resistance can stop what is coming? I have waited centuries...',
    created_at: '2024-01-17T11:30:00Z',
  },
];
