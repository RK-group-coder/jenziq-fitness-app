ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS manager_deletion_reason TEXT;
