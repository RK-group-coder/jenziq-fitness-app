-- Create user_logins table for tracking app usage
CREATE TABLE IF NOT EXISTS user_logins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    login_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster monthly aggregation
CREATE INDEX IF NOT EXISTS idx_user_logins_login_at ON user_logins(login_at);
