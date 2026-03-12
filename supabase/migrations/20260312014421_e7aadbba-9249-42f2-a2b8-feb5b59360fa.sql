-- Drop unique constraint on key to allow multiple URLs per audio key
ALTER TABLE public.audio_settings DROP CONSTRAINT IF EXISTS audio_settings_key_key;

-- Add sort_order column
ALTER TABLE public.audio_settings ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;