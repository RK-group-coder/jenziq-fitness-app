ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT;
NOTIFY pgrst, 'reload schema';
