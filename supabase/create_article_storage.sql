-- Create Article Storage Bucket
-- You need to run this in Supabase SQL editor to enable file uploads for articles
INSERT INTO storage.buckets (id, name, public) VALUES ('articles', 'articles', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public access to read article images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'articles');

-- Allow authenticated managers to upload/delete
CREATE POLICY "Manager Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'articles' 
  AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'))
);

CREATE POLICY "Manager Delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'articles' 
  AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'))
);
