
-- Add last_checkin_date to user_profiles
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
