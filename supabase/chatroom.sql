-- 建立聊天訊息表
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_email TEXT NOT NULL,
    receiver_email TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 開啟即時更新 (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 設置 RLS 策略 (簡易版)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = sender_email);

CREATE POLICY "Users can view messages they sent or received" ON messages
    FOR SELECT USING (auth.jwt() ->> 'email' = sender_email OR auth.jwt() ->> 'email' = receiver_email);
