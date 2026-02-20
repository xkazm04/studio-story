/**
 * Mock Dataset Data
 * Datasets, dataset images, audio transcriptions, character extractions, youtube extractions
 */

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  type: 'image' | 'audio' | 'character' | 'mixed';
  created_at: string;
  updated_at: string;
}

export interface DatasetImage {
  id: string;
  dataset_id: string;
  image_url: string;
  internal_id?: string;
  thumbnail_url?: string;
  tags?: string[];
  description?: string;
  width?: number;
  height?: number;
  created_at: string;
}

export interface AudioTranscription {
  id: string;
  audio_file_url: string;
  filename: string;
  transcription_text: string;
  language: string;
  confidence?: number;
  engine: 'whisper' | 'elevenlabs' | 'assembly' | 'other';
  duration?: number;
  word_count?: number;
  segments?: {
    text: string;
    start: number;
    end: number;
    speaker_id?: string;
    confidence?: number;
  }[];
  created_at: string;
}

export interface CharacterExtraction {
  id: string;
  audio_transcription_id?: string;
  personality_analysis: string;
  traits?: string[];
  speaking_style?: string;
  emotional_range?: string;
  extracted_quotes?: string[];
  confidence_score?: number;
  created_at: string;
}

export interface YouTubeExtraction {
  id: string;
  youtube_url: string;
  video_title?: string;
  video_duration?: number;
  sample_length: number;
  samples_generated: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface YouTubeSample {
  id: string;
  extraction_id: string;
  sample_number: number;
  audio_url: string;
  start_time: number;
  end_time: number;
  duration: number;
  file_size?: number;
  created_at: string;
}

export const mockDatasets: Dataset[] = [
  {
    id: 'dataset-1',
    project_id: 'proj-1',
    name: 'Character Reference Images',
    description: 'Reference images for main character designs',
    type: 'image',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'dataset-2',
    project_id: 'proj-1',
    name: 'Environment Concepts',
    description: 'Landscape and location reference images',
    type: 'image',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'dataset-3',
    project_id: 'proj-1',
    name: 'Voice Reference Audio',
    description: 'Audio samples for character voice development',
    type: 'audio',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'dataset-4',
    project_id: 'proj-1',
    name: 'Character Personality Extractions',
    description: 'AI-extracted character personalities from audio/text',
    type: 'character',
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z',
  },
  {
    id: 'dataset-5',
    project_id: 'proj-2',
    name: 'Cyberpunk Aesthetics',
    description: 'Mixed media references for cyberpunk visual style',
    type: 'mixed',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
];

export const mockDatasetImages: DatasetImage[] = [
  {
    id: 'ds-img-1',
    dataset_id: 'dataset-1',
    image_url: '/datasets/characters/aldric_ref_01.jpg',
    internal_id: 'gen-img-001',
    thumbnail_url: '/datasets/characters/thumb_aldric_ref_01.jpg',
    tags: ['knight', 'armor', 'male', 'protagonist'],
    description: 'Aldric full armor reference - front view',
    width: 1024,
    height: 1024,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'ds-img-2',
    dataset_id: 'dataset-1',
    image_url: '/datasets/characters/aldric_ref_02.jpg',
    internal_id: 'gen-img-002',
    thumbnail_url: '/datasets/characters/thumb_aldric_ref_02.jpg',
    tags: ['knight', 'portrait', 'male'],
    description: 'Aldric portrait - close up face',
    width: 768,
    height: 768,
    created_at: '2024-01-15T10:45:00Z',
  },
  {
    id: 'ds-img-3',
    dataset_id: 'dataset-1',
    image_url: '/datasets/characters/lyra_ref_01.jpg',
    internal_id: 'gen-img-003',
    thumbnail_url: '/datasets/characters/thumb_lyra_ref_01.jpg',
    tags: ['rogue', 'assassin', 'female', 'shadows'],
    description: 'Lyra in shadow cloak - stealth pose',
    width: 1024,
    height: 1024,
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'ds-img-4',
    dataset_id: 'dataset-2',
    image_url: '/datasets/environments/dragon_mountains.jpg',
    thumbnail_url: '/datasets/environments/thumb_dragon_mountains.jpg',
    tags: ['mountains', 'volcanic', 'dragons', 'fortress'],
    description: 'Northern dragon mountains with volcanic activity',
    width: 1920,
    height: 1080,
    created_at: '2024-01-16T10:30:00Z',
  },
  {
    id: 'ds-img-5',
    dataset_id: 'dataset-2',
    image_url: '/datasets/environments/silver_citadel.jpg',
    thumbnail_url: '/datasets/environments/thumb_silver_citadel.jpg',
    tags: ['castle', 'citadel', 'silver', 'knights'],
    description: 'The Silver Order citadel - exterior view',
    width: 1920,
    height: 1080,
    created_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'ds-img-6',
    dataset_id: 'dataset-2',
    image_url: '/datasets/environments/shadow_guild.jpg',
    thumbnail_url: '/datasets/environments/thumb_shadow_guild.jpg',
    tags: ['underground', 'guild', 'dark', 'rogues'],
    description: 'Shadow Guild hideout - interior tunnels',
    width: 1920,
    height: 1080,
    created_at: '2024-01-16T11:30:00Z',
  },
];

export const mockAudioTranscriptions: AudioTranscription[] = [
  {
    id: 'trans-1',
    audio_file_url: '/audio/reference/knight_speech.mp3',
    filename: 'knight_speech.mp3',
    transcription_text: 'By the sacred oath I swear, to protect the innocent, to uphold justice, and to stand against the darkness. This I pledge until my last breath.',
    language: 'en',
    confidence: 0.95,
    engine: 'whisper',
    duration: 28,
    word_count: 32,
    segments: [
      { text: 'By the sacred oath I swear,', start: 0, end: 3.5, confidence: 0.98 },
      { text: 'to protect the innocent,', start: 3.5, end: 6.2, confidence: 0.96 },
      { text: 'to uphold justice,', start: 6.2, end: 8.8, confidence: 0.94 },
      { text: 'and to stand against the darkness.', start: 8.8, end: 13.5, confidence: 0.95 },
      { text: 'This I pledge until my last breath.', start: 13.5, end: 18.0, confidence: 0.97 },
    ],
    created_at: '2024-01-17T10:30:00Z',
  },
  {
    id: 'trans-2',
    audio_file_url: '/audio/reference/villain_monologue.mp3',
    filename: 'villain_monologue.mp3',
    transcription_text: 'Fools. You think your petty order can stop what has been set in motion? I have waited in the shadows for centuries, watching your kingdoms rise and fall.',
    language: 'en',
    confidence: 0.92,
    engine: 'whisper',
    duration: 35,
    word_count: 35,
    segments: [
      { text: 'Fools.', start: 0, end: 1.2, confidence: 0.98 },
      { text: 'You think your petty order can stop what has been set in motion?', start: 1.5, end: 8.0, confidence: 0.91 },
      { text: 'I have waited in the shadows for centuries,', start: 8.5, end: 14.0, confidence: 0.93 },
      { text: 'watching your kingdoms rise and fall.', start: 14.2, end: 19.0, confidence: 0.90 },
    ],
    created_at: '2024-01-17T11:00:00Z',
  },
  {
    id: 'trans-3',
    audio_file_url: '/audio/reference/rogue_whisper.mp3',
    filename: 'rogue_whisper.mp3',
    transcription_text: 'The shadows speak to those who listen. Every wall has a secret passage, every guard a moment of weakness.',
    language: 'en',
    confidence: 0.88,
    engine: 'elevenlabs',
    duration: 18,
    word_count: 22,
    segments: [
      { text: 'The shadows speak to those who listen.', start: 0, end: 4.5, confidence: 0.90 },
      { text: 'Every wall has a secret passage,', start: 5.0, end: 9.0, confidence: 0.87 },
      { text: 'every guard a moment of weakness.', start: 9.2, end: 13.5, confidence: 0.86 },
    ],
    created_at: '2024-01-17T11:30:00Z',
  },
];

export const mockCharacterExtractions: CharacterExtraction[] = [
  {
    id: 'extract-1',
    audio_transcription_id: 'trans-1',
    personality_analysis: 'Noble, duty-bound personality with strong moral compass. Speaks with conviction and authority. Values honor above personal gain.',
    traits: ['honorable', 'brave', 'loyal', 'idealistic', 'protective'],
    speaking_style: 'Formal, measured cadence. Uses declarative statements. Invokes sacred oaths and traditions.',
    emotional_range: 'Controlled emotions with moments of passionate conviction. Rarely shows fear or doubt.',
    extracted_quotes: [
      'By the sacred oath I swear',
      'to stand against the darkness',
      'until my last breath',
    ],
    confidence_score: 0.92,
    created_at: '2024-01-18T10:00:00Z',
  },
  {
    id: 'extract-2',
    audio_transcription_id: 'trans-2',
    personality_analysis: 'Megalomaniacal villain with ancient patience. Condescending toward enemies. Views self as inevitable force of nature.',
    traits: ['arrogant', 'patient', 'cunning', 'ruthless', 'theatrical'],
    speaking_style: 'Dramatic pauses, rhetorical questions. Speaks in absolutes. Mocking tone toward opponents.',
    emotional_range: 'Cold confidence with occasional displays of contempt. Controlled rage underlying surface calm.',
    extracted_quotes: [
      'Fools',
      'I have waited in the shadows for centuries',
      'watching your kingdoms rise and fall',
    ],
    confidence_score: 0.88,
    created_at: '2024-01-18T10:30:00Z',
  },
  {
    id: 'extract-3',
    audio_transcription_id: 'trans-3',
    personality_analysis: 'Mysterious, observant character who lives in the margins of society. Pragmatic survivalist with street wisdom.',
    traits: ['observant', 'cautious', 'resourceful', 'independent', 'secretive'],
    speaking_style: 'Hushed, economical speech. Speaks in metaphors about shadows and secrecy. Never wastes words.',
    emotional_range: 'Guarded emotions. Rarely shows true feelings. Analytical detachment.',
    extracted_quotes: [
      'The shadows speak to those who listen',
      'Every wall has a secret passage',
    ],
    confidence_score: 0.85,
    created_at: '2024-01-18T11:00:00Z',
  },
];

export const mockYouTubeExtractions: YouTubeExtraction[] = [
  {
    id: 'yt-extract-1',
    youtube_url: 'https://www.youtube.com/watch?v=example1',
    video_title: 'Epic Fantasy Voice Acting Compilation',
    video_duration: 1800,
    sample_length: 5,
    samples_generated: 6,
    status: 'completed',
    created_at: '2024-01-19T10:00:00Z',
    completed_at: '2024-01-19T10:15:00Z',
  },
  {
    id: 'yt-extract-2',
    youtube_url: 'https://www.youtube.com/watch?v=example2',
    video_title: 'Medieval Ambiance - Castle Sounds',
    video_duration: 3600,
    sample_length: 10,
    samples_generated: 6,
    status: 'completed',
    created_at: '2024-01-19T11:00:00Z',
    completed_at: '2024-01-19T11:25:00Z',
  },
  {
    id: 'yt-extract-3',
    youtube_url: 'https://www.youtube.com/watch?v=example3',
    video_title: 'Dragon Roars Sound Effects',
    video_duration: 600,
    sample_length: 2,
    samples_generated: 0,
    status: 'processing',
    created_at: '2024-01-19T12:00:00Z',
  },
];

export const mockYouTubeSamples: YouTubeSample[] = [
  {
    id: 'yt-sample-1',
    extraction_id: 'yt-extract-1',
    sample_number: 1,
    audio_url: '/youtube/yt-extract-1/sample_001.mp3',
    start_time: 0,
    end_time: 300,
    duration: 300,
    file_size: 4800000,
    created_at: '2024-01-19T10:05:00Z',
  },
  {
    id: 'yt-sample-2',
    extraction_id: 'yt-extract-1',
    sample_number: 2,
    audio_url: '/youtube/yt-extract-1/sample_002.mp3',
    start_time: 300,
    end_time: 600,
    duration: 300,
    file_size: 4750000,
    created_at: '2024-01-19T10:07:00Z',
  },
  {
    id: 'yt-sample-3',
    extraction_id: 'yt-extract-1',
    sample_number: 3,
    audio_url: '/youtube/yt-extract-1/sample_003.mp3',
    start_time: 600,
    end_time: 900,
    duration: 300,
    file_size: 4820000,
    created_at: '2024-01-19T10:09:00Z',
  },
  {
    id: 'yt-sample-4',
    extraction_id: 'yt-extract-2',
    sample_number: 1,
    audio_url: '/youtube/yt-extract-2/sample_001.mp3',
    start_time: 0,
    end_time: 600,
    duration: 600,
    file_size: 9600000,
    created_at: '2024-01-19T11:05:00Z',
  },
  {
    id: 'yt-sample-5',
    extraction_id: 'yt-extract-2',
    sample_number: 2,
    audio_url: '/youtube/yt-extract-2/sample_002.mp3',
    start_time: 600,
    end_time: 1200,
    duration: 600,
    file_size: 9550000,
    created_at: '2024-01-19T11:10:00Z',
  },
];
