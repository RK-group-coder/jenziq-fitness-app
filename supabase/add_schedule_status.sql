-- ⚠️ 請將以下 SQL 貼入 Supabase 的 SQL Editor 並執行

-- 1. 修正教練課表 (coach_schedule) 增加審核與照片欄位
ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS reject_reason text;
ALTER TABLE coach_schedule ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';

-- 將舊有課表標記為已通過
UPDATE coach_schedule SET status = 'approved' WHERE status IS NULL;

-- 2. 修正通知系統 (notifications) 增加個人識別功能
-- 如果您尚未建立 notifications 資料表，請先執行 notifications.sql
-- 為了相容 UUID 與「工號/字串」，將 user_id 設為 text 型別
ALTER TABLE notifications DROP COLUMN IF EXISTS user_id;
ALTER TABLE notifications ADD COLUMN user_id text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_email text;

-- 確保 tag 欄位包含「系統」標籤
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_tag_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_tag_check CHECK (tag IN ('活動', '課程', '公告', '優惠', '系統'));

-- 3. 新增以讀取狀態功能
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 3. 確保 RLS 權限正確
-- 您可以根據需要在 SQL Editor 中手動調整權限
-- ALTER TABLE coach_schedule DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
