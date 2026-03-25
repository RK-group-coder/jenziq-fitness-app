-- 建立系統設定表
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 Hero Banner 的初始設定
INSERT INTO app_settings (key, value)
VALUES ('hero_banner', '{"url": null, "last_updated": null}')
ON CONFLICT (key) DO NOTHING;
