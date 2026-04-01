# JENZIQ 健身系統 - 專業教練與學員管理平台 (JENZiQ App Ecosystem)

![JENZiQ Banner](https://img.shields.io/badge/Scale-Enterprise_Grade-gold?style=for-the-badge)
![UI/UX](https://img.shields.io/badge/Aesthetics-Premium_Dark-darkred?style=for-the-badge)
![Backend](https://img.shields.io/badge/Cloud-Supabase_Realtime-3EC78E?style=for-the-badge&logo=supabase)

JENZiQ 是一款專為現代健身、瑜珈及核心運動產業量身打造的全端管理平台。不同於市面上單一的功能性 App，JENZiQ 構建了一個無縫連結「管理者、教練、學員」三方角色的完整生態系統。透過精準的數據追蹤與遊戲化的激勵機制，讓專業教學能與學員成長產生深度共鳴。

---

## 🚀 線上 Demo
**[點此訪問作品網址](https://jenziq-fitness-app.vercel.app)**  
*(本APP主功能是會員APP 以手機版面來設計 建議使用手機操作進行最佳體驗)*

## 🔑 測試帳號 (Demo Accounts)
為了方便您快速體驗不同角色的操作深度，請使用以下帳號：
- **超級管理者 (Super Manager):** `test@gmail.com` / `111` (可自由切換三種視角)
- **管理者 (Manager):** `testmanager002@gmail.com` / `12345` 
- **專業教練 (Certified Coach):** `testcoach001@gmail.com` / `12345`
- **活躍學員 (Active Student):** `teststudent001@gmail.com` / `12345`

---

## 🛠️ 技術架構 (Technical Stack)

JENZiQ 採用當前最前沿的 Web 技術，旨在提供極致的響應速度與數據一致性：

### **開發語言與應用 (Languages & Applications)**
- **JavaScript (JS/JSX)**: 
    - **Frontend**: 作為核心開發語言，驅動 React 19 的組件邏輯與動態 UI。
    - **Automation**: 用於 `check_logins.js` 等資料校對腳本與 Node.js 輔助工具。
    - **Build**: 定義 Vite 與 ESLint 的配置鏈結。
- **SQL (PostgreSQL)**: 
    - **Database**: 掌管 Supabase (PostgreSQL) 的資料表結構與索引優化。
    - **Logic**: 撰寫預存程序 (Functions) 以處理自動化積分 (XP) 晉升與課程狀態轉變。
    - **Security**: 定義 RLS 安全政策，確保資料在連線級別的嚴格隔離。
- **Vanilla CSS**: 
    - **Aesthetics**: 高度定制化的介面美學，採用原生 CSS 確保極致的加載性能。
    - **UI/UX**: 打造 Premium Dark Theme (高級深色主題) 的視覺規範與響應式佈局。
- **HTML**:
    - **Core**: 作為 Single Page Application (SPA) 的根索引點。

### **技術框架與服務 (Frameworks & Services)**
- **前端框架**: `React 19` (利用其併發渲染能力提升性能)。
- **構建工具**: `Vite 7` (提供毫秒級的熱重載 HMR)。
- **後端服務**: `Supabase` (包含 Auth 驗證、Real-time DB 與 Storage)。
- **組件庫與工具**: 
    - `Lucide React`: 輕量化、像素級完美的圖標系統。
    - `React-Slick`: 用於動態看板、推薦文章的高流暢度輪播。
    - `html2canvas`: 實現學員等級雷達圖與教練證照的即時生成。
    - `React-Easy-Crop`: 用於學員與教練頭像的精準修剪與上傳。

---

## 🌟 核心功能模塊 (Key Modules)

### **1. 智能教練儀表板 (Coach Hub)**
- **動態課表管理**: 整合據點 (Locations) 的排課邏輯，支持一鍵查詢當日授課進度。
- **XP 經驗值成長系統**: 根據授課數與學員好評自動累計經驗值，驅動教練專業成長。
- **場館背景聯動**: 教練卡片背景會根據所屬健身房 (如 SUNNY, MU) 動態變換，增加品牌歸屬感。
- **自動化社交**: 同一據點的教練會自動出現在好友清單中，促進內部技術社群交流。

### **2. 學員成長體系 (Student Growth)**
- **遊戲化等級機制**: 包含 `Level 1` 到 `Legendary` 的進階路徑，視覺化展示力量、耐力與柔軟度雷達圖。
- **營養追蹤日誌 (Nutrition Records)**：精確記錄每日卡路里攝取、水分消耗與核心營養素。
- **好友互動與動態**: 尋找共同愛好的學員，查看彼此的運動等級與成就。

### **3. 管理者決策中心 (Manager Analytics)**
- **據點授課占比 (Branch Analysis)**：利用即時數據生成圓餅圖，掌握各分店（如 SUNNY 瑜珈、MU 沐光）的業績分布。
- **權限審核流**: 對教練發布的課程與上傳的專業證照進行即時審查與狀態變更 (Pending/Approved/Rejected)。
- **統一客服中心 (Support Hub)**: 管理者以「客服人員」身分與所有報修或提問之用戶、教練進行即時互動。

### **4. 智能 AI 助手與引導 (AI Support & Guidance)**
- **AI 全域引導**: 為新用戶提供互動式的 App 功能指引，降低操作門檻。
- **AI 營養師與拍照辨識**: 
    - 集成 AI 營養分析，根據學員上傳的飲食照片自動估算熱量與營養組成。
    - 提供個人化的飲食調整建議與營養攝取報告。
- **AI 傷害評估系統**: 
    - 透過問答與視覺化輔助，協助學員初步評估運動損傷風險。
    - 自動連結至管理者後台與教練，啟動傷病警報與預防建議。

### **5. 內容管理與動態版面 (Content & Layout Management)**
- **活動與廣告版面 (Promo Banners)**: 
    - 管理者可自定義首頁 Activity 與 Ad 輪播內容，即時發布優惠資訊與官方活動。
- **主題據點卡片 (Branch Cards)**: 
    - 根據據點類別 (如 瑜珈、健身、運動空間) 展示不同的專屬卡片視覺，強化品牌差異化。
- **智能文章推薦 (Article Recommendations)**: 
    - 根據學員的偏好與運動目標，自動推薦相關的健身、營養或放鬆文章。

### **6. 管理者高度自由化設置 (Manager Empowerment)**
- **全方位系統設置 (Global Settings)**: 
    - 管理者可高度自由化配置全站的等級權限、據點權益以及廣告投放策略。
- **教練課表審查 (Schedule Auditing)**: 
    - 管理端可直接查看並審查教練發布的課程表，確保課程資訊準確且符合教學規範。
- **電商整合與擴展**: 
    - 外接 **Shopify** 商城功能，學員可直接在 App 內瀏覽並購買運動補給品、裝備或週邊商品。

---

## 🗄️ 資料庫架構細節 (Database Design)

JENZiQ 的資料庫設計遵循高度標準化與安全性原則。

### **核心資料表 (Primary Tables)**
- **`profiles`**: 使用者身分資料中心（UUID, FullName, Role, BranchID, Avatar）。
- **`coach_schedule`**: 排課核心（CourseName, Location, MaxStudents, AuditStatus）。
- **`student_levels`**: 學員等級詳情與專屬權限定義。
- **`user_logins`**: 用於數據分析的登入足跡追蹤。
- **`locations`**: 分店與據點的地理位置與屬性定義。

### **安全與邏輯控管 (Logic Control)**
- **RLS 安全機制**: 
    - 使用者僅能 `SELECT` 自己的隱私資料。
    - 管理員可 `UPDATE` 課程審核狀態。
    - 數據讀取受到 `auth.uid()` 的強制限制。
- **Database Functions**: 內建 10+ 個核心函數，例如自動計算教練 XP 晉升與課程滿座率統計。

---

## 📂 專案結構深度說明 (File Architecture)

```text
JENZiQ/
├── src/
│   ├── components/            # 核心視圖組件
│   │   ├── coach/            # 教練端專屬視圖 (Schedule, Cards, XP)
│   │   ├── manager/          # 管理端數據分析與審核面板
│   │   ├── Chatroom.jsx      # 高度整合的即時通訊模塊
│   │   ├── Tools.jsx         # 包含 AI Support Bot 與常用工具
│   │   └── RecordsPage.jsx   # 學員運動與營養紀錄的核心實作
│   ├── utils/                # 通用工具函數 (日期格式化、數據過濾)
│   ├── App.jsx               # 全域路由分發與 Session 追蹤
│   ├── supabase.js           # Supabase Client 初始化與環境變數對接
│   └── index.css             # 基於 Premium Aesthetics 定義的全域樣式
├── supabase/
│   ├── init_auth_system.sql  # 初始化身分驗證與 Profile 聯動
│   ├── locations.sql         # 場館與據點的預設資料定義
│   ├── coach_xp_system.sql   # 關鍵腳本：教練等級晉升與公式定義
│   └── chatroom_ai.sql       # AI 支持中心與訊息持久化邏輯
├── check_*.cjs / .js         # 開發導航腳本：用於校對 SQL 與 API 整合正確性
└── package.json              # 定義依賴版本 (Node ESM Support)
```

---

## 🚀 部署與維護 (Deployment)

- **前端部署**: 部署於 **Vercel**，支持 CI/CD 自動構建。
- **資料庫擴展**: 基於 Supabase 的 Serverless 架构，可根據流量自動擴展數據讀寫能力。
- **代碼規範**: 強制執行 **ESLint** 檢查與 **Smart-Case** 檔案命名規範。

---