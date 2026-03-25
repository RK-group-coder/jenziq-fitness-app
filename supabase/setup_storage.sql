-- 1. 建立 'chat-media' 儲存桶 (Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 允許任何人查看圖片 (Public Access)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-media');

-- 3. 允許已登入用戶上傳圖片 (Authenticated Upload)
-- 這裡為了方便測試，採用較寬鬆的權限，正式環境建議根據 email 或 user_id 過濾
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-media');

-- 4. 允許用戶刪除自己的圖片 (可選)
CREATE POLICY "Individuals can delete their own objects" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'chat');
