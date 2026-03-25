-- 擴展訊息表以支援媒體
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'; -- 'text', 'image', 'sticker'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 建立聊天媒體存儲桶 (需要手動在控制台確認，或透過 RPC)
-- 注意：Storage 權限通常需要另外設置，這裡建議用戶在 Supabase Dashbaord 建立一個名為 'chat-media' 的公共存儲桶
