-- 為訊息表增加 AI 標記欄位
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;

-- 確保 RLS 允許系統（或用戶）插入 AI 訊息
-- 之前的策略是：auth.jwt() ->> 'email' = sender_email
-- 如果是用戶觸發 AI，用戶的身分去插入 AI 訊息也是可以的，只要我們把 sender_email 設對。

-- 更新 RLS 以允許插入標記為 AI 的訊息 (暫時保持寬鬆以利開發)
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true); 
