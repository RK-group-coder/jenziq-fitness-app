-- Fix coach_schedule table to support custom string IDs (like 'B001')
-- 1. Drop the foreign key constraint if it exists (it prevents changing the type)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'coach_schedule_coach_id_fkey' 
        AND table_name = 'coach_schedule'
    ) THEN
        ALTER TABLE coach_schedule DROP CONSTRAINT coach_schedule_coach_id_fkey;
    END IF;
END $$;

-- 2. Change the column type from UUID to TEXT
ALTER TABLE coach_schedule 
ALTER COLUMN coach_id TYPE TEXT;

-- 3. Ensure RLS is disabled or permissive
ALTER TABLE coach_schedule DISABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on coach_schedule" ON coach_schedule FOR ALL USING (true) WITH CHECK (true);
