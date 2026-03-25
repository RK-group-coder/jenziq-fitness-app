-- Add min_level column to events (student activities)
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;
UPDATE events SET min_level = 1 WHERE min_level IS NULL;

-- Add min_level column to coach_events (coach activities)
ALTER TABLE coach_events ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;
UPDATE coach_events SET min_level = 1 WHERE min_level IS NULL;

-- Ensure RLS is handled if needed (assuming manager can update anything)
NOTIFY pgrst, 'reload schema';
