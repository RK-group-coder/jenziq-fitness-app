
-- Disable RLS for now to ensure everything works, or add permissive policies
ALTER TABLE student_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_xp_rules DISABLE ROW LEVEL SECURITY;

-- If we wanted policies, we could use:
/*
ALTER TABLE student_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for student_levels" ON student_levels FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE student_xp_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for student_xp_rules" ON student_xp_rules FOR ALL USING (true) WITH CHECK (true);
*/

-- Also check if coach tables have RLS enabled (they might work because policies were already added)
-- But just in case, let's make sure our new tables are accessible.
