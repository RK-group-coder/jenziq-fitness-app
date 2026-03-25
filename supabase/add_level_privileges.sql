-- Add privileges column to coach_levels
ALTER TABLE coach_levels ADD COLUMN IF NOT EXISTS privileges text[] DEFAULT '{}';

-- Update existing levels with default privileges
UPDATE coach_levels SET privileges = ARRAY['獲得見習教練稱號徽章'] WHERE level = 1;
UPDATE coach_levels SET privileges = ARRAY['獲得新晉教練稱號徽章', '可建立完整個人頁', '可上傳訓練成果照片'] WHERE level = 2;
UPDATE coach_levels SET privileges = ARRAY['獲得初階教練稱號徽章', '可設定個人課程價格', '可發布文章或小技巧貼文'] WHERE level = 3;
UPDATE coach_levels SET privileges = ARRAY['獲得資深教練稱號徽章', '搜尋排名小幅提升', '可參加官方活動', '個人頁可顯示近期成就或榮譽'] WHERE level = 4;
UPDATE coach_levels SET privileges = ARRAY['獲得專業教練稱號徽章', '搜尋排名中等優先', '平台抽成降低 2%', '可參與平台內容創作（文章、短片）'] WHERE level = 5;
UPDATE coach_levels SET privileges = ARRAY['獲得菁英教練稱號徽章', '搜尋排名進一步提升', '平台抽稱再降低 2%', '可獲官方推薦曝光', '可帶學員參加官方比賽或活動'] WHERE level = 6;
UPDATE coach_levels SET privileges = ARRAY['獲得專精教練稱號徽章', '每月首頁曝光一次', '可參與官方品牌或活動合作', '可上平台推薦名單'] WHERE level = 7;
UPDATE coach_levels SET privileges = ARRAY['獲得核心教練稱號徽章', '可發布線上課程或教學影片', '搜尋排名接近頂級', '可參與平台內容策劃（文章、影片、課程）'] WHERE level = 8;
UPDATE coach_levels SET privileges = ARRAY['獲得至尊教練稱號徽章', '搜尋排名頂級', '可參與大型官方活動或比賽指導', '可帶新教練或參與培訓計畫', '平台抽成再降低 1–2%'] WHERE level = 9;
UPDATE coach_levels SET privileges = ARRAY['獲得首席教練稱號徽章', '官方明星曝光，每月推薦', '可推出聯名課程或合作內容', '可參與品牌合作或代言活動'] WHERE level = 10;
UPDATE coach_levels SET privileges = ARRAY['獲得品牌代表教練稱號徽章', '平台最高榮譽', '專屬「傳奇徽章」', '每月固定首頁推薦', '可主導官方大型活動或品牌專案', '可解鎖專屬獎勵或實體資源'] WHERE level = 11;
