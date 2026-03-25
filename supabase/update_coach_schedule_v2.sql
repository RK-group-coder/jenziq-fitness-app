-- Add new fields to coach_schedule for the premium UI
ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FF7A00';
