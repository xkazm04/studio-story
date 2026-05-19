-- Add metadata JSONB column to scenes table for rich scene context
-- (timeOfDay, weather, season, mood, temperature, lighting, soundscape, customNotes)
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
