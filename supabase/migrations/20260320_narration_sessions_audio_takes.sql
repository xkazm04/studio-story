-- Narration sessions and audio takes persistence layer.
-- Mirrors the existing Supabase pattern for other entities (voices, scenes, etc.)
-- so that expensive TTS-generated audio survives page refreshes.

-- narration_sessions: one per scene (or ad-hoc script), tracks overall progress
CREATE TABLE IF NOT EXISTS narration_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL,
  scene_id      UUID,
  name          TEXT NOT NULL DEFAULT 'Untitled Session',
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'generating', 'partial', 'complete', 'exported')),
  voice_settings JSONB DEFAULT '{}'::jsonb,
  script_lines  JSONB DEFAULT '[]'::jsonb,
  placement     JSONB,
  total_duration DOUBLE PRECISION DEFAULT 0,
  lines_total   INT DEFAULT 0,
  lines_done    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_narration_sessions_project
  ON narration_sessions (project_id);

CREATE INDEX IF NOT EXISTS idx_narration_sessions_scene
  ON narration_sessions (scene_id)
  WHERE scene_id IS NOT NULL;

-- audio_takes: individual TTS generations, linked to a session + script line
CREATE TABLE IF NOT EXISTS audio_takes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES narration_sessions(id) ON DELETE CASCADE,
  line_id       TEXT NOT NULL,
  character     TEXT NOT NULL,
  voice_id      TEXT NOT NULL,
  text          TEXT NOT NULL,
  emotion       TEXT DEFAULT 'neutral',
  delivery      TEXT DEFAULT 'narration',
  intensity     INT DEFAULT 70,
  audio_url     TEXT NOT NULL,
  duration      DOUBLE PRECISION NOT NULL,
  waveform_data JSONB,
  rating        INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  selected      BOOLEAN DEFAULT false,
  provider      TEXT DEFAULT 'elevenlabs',
  cost_chars    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audio_takes_session
  ON audio_takes (session_id);

CREATE INDEX IF NOT EXISTS idx_audio_takes_line
  ON audio_takes (session_id, line_id);
