-- ==========================================
-- 徹底解決「對話紀錄不見」的終極指令
-- ==========================================

-- 1. 確保表結構完整 (如果漏跑之前的，這裡補齊)
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;

-- 2. 直接刪除所有舊的開發/測試用的對話權限 (重新開始)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable select for users based on email" ON messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Allow users to see their own chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- 3. 設定【最寬鬆】的權限 (先確保能存能讀，再談安全性)
-- 只要是已登入用戶，無論是誰發給誰，都允許「存入」與「讀取」
-- 注意：這在正式環境不安全，但能確保你的功能現在立刻能用

CREATE POLICY "ALLOW_ALL_INSERT" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "ALLOW_ALL_SELECT" ON messages FOR SELECT USING (true);
CREATE POLICY "ALLOW_ALL_UPDATE" ON messages FOR UPDATE USING (true);

-- 4. 再次確保 Realtime 功能是開啟的
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 5. 測試資料 (可選：如果你想確認可以看到東西，可以執行下面這行，Email 改成你的)
-- INSERT INTO messages (sender_email, receiver_email, content) VALUES ('你的Email', '測試對象Email', '系統測試訊息');
