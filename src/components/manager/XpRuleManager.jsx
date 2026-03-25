import React, { useState, useEffect } from 'react';
import { Shield, Zap, Plus, Award, Star, Trash2, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';

const XpRuleManager = () => {
    const [rules, setRules] = useState([]);
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedType, setExpandedType] = useState('rules'); // 'rules' or 'levels'
    const [activeTab, setActiveTab] = useState('coach'); // 'coach' or 'student'
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        console.log('Tab changed to:', activeTab);
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (tab) => {
        const currentTab = tab || activeTab;
        setIsLoading(true);
        setDebugInfo(`Fetching ${currentTab}...`);

        try {
            const rulesTable = currentTab === 'coach' ? 'coach_xp_rules' : 'student_xp_rules';
            const levelsTable = currentTab === 'coach' ? 'coach_levels' : 'student_levels';

            console.log(`[XpRuleManager] Fetching ${currentTab} from ${levelsTable}`);

            const [rulesRes, levelsRes] = await Promise.all([
                supabase.from(rulesTable).select('*').order('created_at', { ascending: true }),
                supabase.from(levelsTable).select('*').order('level', { ascending: true })
            ]);

            if (rulesRes.error) {
                console.error('Rules fetch error:', rulesRes.error);
                setDebugInfo(prev => prev + ` | Rules Error: ${rulesRes.error.message}`);
                throw rulesRes.error;
            }
            if (levelsRes.error) {
                console.error('Levels fetch error:', levelsRes.error);
                setDebugInfo(prev => prev + ` | Levels Error: ${levelsRes.error.message}`);
                throw levelsRes.error;
            }

            console.log(`[XpRuleManager] Fetched ${levelsRes.data?.length} levels for ${currentTab}`);
            setRules(rulesRes.data || []);
            setLevels(levelsRes.data || []);
            setDebugInfo(prev => prev + ` | Success: ${levelsRes.data?.length} levels, ${rulesRes.data?.length} rules`);
        } catch (err) {
            console.error('Fetch error:', err);
            setDebugInfo(prev => prev + ` | Catch Error: ${err.message}`);
            // alert('讀取資料失敗: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRule = (id, field, value) => {
        setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleUpdateLevel = (level, field, value) => {
        setLevels(levels.map(l => l.level === level ? { ...l, [field]: value } : l));
    };

    const handleAddRule = () => {
        const newRule = {
            id: 'temp-' + Date.now(),
            category: 'other',
            title: '新規則',
            xp_value: 0,
            description: '',
            is_new: true
        };
        setRules([...rules, newRule]);
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const rulesTable = activeTab === 'coach' ? 'coach_xp_rules' : 'student_xp_rules';
            const levelsTable = activeTab === 'coach' ? 'coach_levels' : 'student_levels';

            // 處理 Rules
            for (const rule of rules) {
                const { id, is_new, ...rest } = rule;
                if (is_new) {
                    await supabase.from(rulesTable).insert([rest]);
                } else {
                    await supabase.from(rulesTable).update(rest).eq('id', id);
                }
            }

            // 處理 Levels
            for (const level of levels) {
                await supabase.from(levelsTable).update({
                    title: level.title,
                    min_xp: level.min_xp,
                    privileges: Array.isArray(level.privileges) ? level.privileges : (level.privileges ? level.privileges.split('\n').filter(p => p.trim()) : [])
                }).eq('level', level.level);
            }

            alert('所有設置已更新');
            fetchData();
        } catch (err) {
            alert('儲存失敗: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRule = async (id) => {
        if (String(id).startsWith('temp-')) {
            setRules(rules.filter(r => r.id !== id));
            return;
        }

        if (!window.confirm('確定要刪除此規則嗎？')) return;

        try {
            const rulesTable = activeTab === 'coach' ? 'coach_xp_rules' : 'student_xp_rules';
            const { error } = await supabase.from(rulesTable).delete().eq('id', id);
            if (error) throw error;
            setRules(rules.filter(r => r.id !== id));
        } catch (err) {
            alert('刪除失敗');
        }
    };

    const handleInitDefaults = async () => {
        if (!window.confirm('將會插入預設的 XP 規則與等級門檻，確定嗎？')) return;
        setIsSaving(true);
        try {
            if (activeTab === 'coach') {
                const defaultRules = [
                    { category: 'lesson', title: '每堂課程加成', xp_value: 10, description: '完成每堂課程登記後獲得' },
                    { category: 'certification', title: '四大證照 (運動相關、至少兩天課、有術科+筆試)', xp_value: 5000, description: '國際四大證照考核通過' },
                    { category: 'certification', title: '短期證照 (上課考試一天內結束)', xp_value: 400, description: '單日完成之證照考核' },
                    { category: 'certification', title: '研習證書', xp_value: 250, description: '研習或講習性質之證明文件' },
                    { category: 'review', title: 'Google 五星好評 (每 5 人)', xp_value: 30, description: '學員留下 5 星評論滿 5 人' },
                    { category: 'event', title: '參加官方活動', xp_value: 100, description: '參與公司舉辦之教育訓練或活動' }
                ];
                const defaultLevels = [
                    { level: 1, title: '見習教練', min_xp: 0, privileges: ['獲得見習教練稱號徽章'] },
                    { level: 2, title: 'LV2 入門教練', min_xp: 1000, privileges: ['獲得新晉教練稱號徽章', '可建立完整個人頁', '可上傳訓練成果照片'] },
                    { level: 3, title: 'LV3 初階教練', min_xp: 2000, privileges: ['獲得初階教練稱號徽章', '可設定個人課程價格', '可發布文章或小技巧貼文'] },
                    { level: 4, title: 'LV4 資深教練', min_xp: 3500, privileges: ['獲得資深教練稱號徽章', '搜尋排名小幅提升', '可參加官方活動', '個人頁可顯示近期成就或榮譽'] },
                    { level: 5, title: 'LV5 專業教練', min_xp: 5000, privileges: ['獲得專業教練稱號徽章', '搜尋排名中等優先', '平台抽成降低 2%', '可參與平台內容創作（文章、短片）'] },
                    { level: 6, title: 'LV6 菁英教練', min_xp: 6500, privileges: ['獲得菁英教練稱號徽章', '搜尋排名進一步提升', '平台抽稱再降低 2%', '可獲官方推薦曝光', '可帶學員參加官方比賽或活動'] },
                    { level: 7, title: 'LV7 專精教練', min_xp: 8000, privileges: ['獲得專精教練稱號徽章', '每月首頁曝光一次', '可參與官方品牌或活動合作', '可上平台推薦名單'] },
                    { level: 8, title: 'LV8 核心教練', min_xp: 10000, privileges: ['獲得核心教練稱號徽章', '可發布線上課程或教學影片', '搜尋排名接近頂級', '可參與平台內容策劃（文章、影片、課程）'] },
                    { level: 9, title: 'LV9 至尊教練', min_xp: 13000, privileges: ['獲得至尊教練稱號徽章', '搜尋排名頂級', '可參與大型官方活動或比賽指導', '可帶新教練或參與培訓計畫', '平台抽成再降低 1–2%'] },
                    { level: 10, title: 'LV10 首席教練', min_xp: 16000, privileges: ['獲得首席教練稱號徽章', '官方明星曝光，每月推薦', '可推出聯名課程或合作內容', '可參與品牌合作或代言活動'] },
                    { level: 11, title: 'LV:MAX 品牌代表教練', min_xp: 20000, privileges: ['獲得品牌代表教練稱號徽章', '平台最高榮譽', '專屬「傳奇徽章」', '每月固定首頁推薦', '可主導官方大型活動或品牌專案', '可解鎖專屬獎勵或實體資源'] }
                ];
                await Promise.all([
                    supabase.from('coach_xp_rules').insert(defaultRules),
                    supabase.from('coach_levels').upsert(defaultLevels)
                ]);
            } else {
                const defaultRules = [
                    { category: 'daily', title: '每日簽到', xp_value: 10, description: '每日首次開啟 APP 獲得' },
                    { category: 'exercise', title: '完成單次訓練', xp_value: 50, description: '完成一組預定的訓練內容' },
                    { category: 'goal', title: '達成周目標', xp_value: 200, description: '達成本周設定的運動次數目標' },
                    { category: 'social', title: '分享成果', xp_value: 20, description: '將訓練成果分享到社群媒體' },
                    { category: 'review', title: '給予課程評論', xp_value: 30, description: '完成課程後留下真實評價' }
                ];
                const defaultLevels = [
                    { level: 1, title: 'Lv1 新手學院', min_xp: 0, privileges: ['獲得新手徽章', '基礎訓練紀錄工具', '解鎖新手村計畫'] },
                    { level: 2, title: 'Lv2 基礎學員', min_xp: 100, privileges: ['獲得基礎學員勳章', '自定義訓練目標設定', '月度健康小撇步'] },
                    { level: 3, title: 'Lv3 成長學院', min_xp: 300, privileges: ['獲得成長動能徽章', '進階運動數據圖表', '專屬社群邀請'] },
                    { level: 4, title: 'Lv4 穩定學員', min_xp: 500, privileges: ['獲得規律律動徽章', '精選健康文章閱讀權', '分店設施優先體驗'] },
                    { level: 5, title: 'Lv5 資深學員', min_xp: 1000, privileges: ['獲得資深學員徽章', '課程購買 98 折優惠', 'Jenziq 專屬品牌周邊'] },
                    { level: 6, title: 'Lv6 精進學員', min_xp: 1500, privileges: ['獲得精進之星徽章', '隱藏訓練模式解鎖', 'VIP 休息區單次體驗'] },
                    { level: 7, title: 'Lv7 菁英學員', min_xp: 2000, privileges: ['獲得菁英領航徽章', '課程購買 95 折優惠', '私人教練 15 分鐘諮詢'] },
                    { level: 8, title: 'Lv8 核心學員', min_xp: 3000, privileges: ['獲得核心力量徽章', '每日簽到經驗值雙倍', '季末專屬活動邀請'] },
                    { level: 9, title: 'Lv9 典範學員', min_xp: 5000, privileges: ['獲得典範大師徽章', '專屬 VIP 線上客服', '品牌官網學員牆推薦'] },
                    { level: 10, title: 'Lv:Max 品牌模範學員', min_xp: 10000, privileges: ['品牌最高榮譽勳章', '官網封面人物露出', '受邀參加年度品牌拍攝', '終身活動優先參與權'] }
                ];
                await Promise.all([
                    supabase.from('student_xp_rules').insert(defaultRules),
                    supabase.from('student_levels').upsert(defaultLevels)
                ]);
            }

            alert('初始化完成！');
            fetchData(activeTab);
        } catch (err) {
            alert('初始化失敗: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="xp-rule-manager">
            <header className="manager-header">
                <div>
                    <h2>XP 與等級體系管理</h2>
                    <p>定義使用者的經驗值獲取規則與等級門檻</p>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>Debug: {debugInfo}</div>
                </div>
                <div className="tab-switcher">
                    <button
                        className={`tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coach')}
                    >
                        教練體系
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                        onClick={() => setActiveTab('student')}
                    >
                        學員體系
                    </button>
                </div>
                <div className="header-actions">
                    <button className="init-btn" onClick={handleInitDefaults} disabled={isSaving}>
                        初始化預設資料
                    </button>
                    <button className="save-all-btn" onClick={handleSaveAll} disabled={isSaving}>
                        {isSaving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                        <span>儲存所有變更</span>
                    </button>
                </div>
            </header>

            <div className="manager-content">
                {/* Rules Section */}
                <section className={`manager-section ${expandedType === 'rules' ? 'expanded' : ''}`}>
                    <div className="section-header" onClick={() => setExpandedType(expandedType === 'rules' ? '' : 'rules')}>
                        <div className="header-left">
                            <Zap size={20} className="icon-zap" />
                            <h3>XP 獲得規則設定</h3>
                        </div>
                        {expandedType === 'rules' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {expandedType === 'rules' && (
                        <div className="section-body">
                            <div className="rules-grid">
                                {rules.map(rule => (
                                    <div key={rule.id} className="edit-card">
                                        <div className="card-top-row">
                                            <div className="input-group">
                                                <label>規則名稱</label>
                                                <input
                                                    type="text"
                                                    placeholder="例如：每堂課點數"
                                                    value={rule.title}
                                                    onChange={e => handleUpdateRule(rule.id, 'title', e.target.value)}
                                                />
                                            </div>
                                            <div className="input-group small">
                                                <label>XP 分數</label>
                                                <input
                                                    type="number"
                                                    value={rule.xp_value}
                                                    onChange={e => handleUpdateRule(rule.id, 'xp_value', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <button className="delete-rule-btn" onClick={() => handleDeleteRule(rule.id)} title="刪除規則">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="input-group">
                                            <label>分類/描述 (顯示於教練端)</label>
                                            <input
                                                type="text"
                                                placeholder="說明規則詳情..."
                                                value={rule.description || ''}
                                                onChange={e => handleUpdateRule(rule.id, 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button className="add-rule-btn" onClick={handleAddRule}>
                                    <Plus size={20} />
                                    <span>新增 XP 規則</span>
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Levels Section */}
                <section className={`manager-section ${expandedType === 'levels' ? 'expanded' : ''}`}>
                    <div className="section-header" onClick={() => setExpandedType(expandedType === 'levels' ? '' : 'levels')}>
                        <div className="header-left">
                            <Award size={20} className="icon-award" />
                            <h3>{activeTab === 'coach' ? '教練' : '學員'}等級門檻設定</h3>
                        </div>
                        {expandedType === 'levels' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {expandedType === 'levels' && (
                        <div className="section-body">
                            <div className="levels-table-container">
                                <table className="levels-table">
                                    <thead>
                                        <tr>
                                            <th>等級</th>
                                            <th>稱號</th>
                                            <th>所需門檻 (XP)</th>
                                            <th>特權與獎勵 (每行一項)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {levels.map(level => (
                                            <tr key={level.level}>
                                                <td><span className="level-num">LV.{level.level === (activeTab === 'coach' ? 11 : 10) ? 'MAX' : level.level}</span></td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="title-input"
                                                        value={level.title}
                                                        onChange={e => handleUpdateLevel(level.level, 'title', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="xp-input"
                                                        value={level.min_xp}
                                                        onChange={e => handleUpdateLevel(level.level, 'min_xp', parseInt(e.target.value))}
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        className="privileges-input"
                                                        placeholder="每行輸入一項特權..."
                                                        value={Array.isArray(level.privileges) ? level.privileges.join('\n') : level.privileges || ''}
                                                        onChange={e => handleUpdateLevel(level.level, 'privileges', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <style>{`
                .xp-rule-manager { padding: 32px; height: 100%; overflow-y: auto; }
                .manager-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
                .manager-header h2 { font-size: 28px; font-weight: 800; color: white; margin-bottom: 4px; }
                .manager-header p { color: var(--text-secondary); font-size: 14px; }
                
                .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .tab-switcher { background: rgba(255,255,255,0.05); padding: 4px; border-radius: 12px; display: flex; gap: 4px; border: 1px solid var(--border); }
        .tab-btn { padding: 8px 16px; border-radius: 8px; border: none; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .tab-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

        .init-btn {
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid var(--border);
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
        }
        .init-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: var(--text-secondary);
        }
        .save-all-btn {
 background: #10B981; color: white; padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 700; border: none; cursor: pointer; }
                .save-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .manager-content { display: flex; flex-direction: column; gap: 24px; }
                .manager-section { background: var(--secondary-bg); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
                .section-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; }
                .section-header:hover { background: rgba(255,255,255,0.02); }
                .header-left { display: flex; align-items: center; gap: 12px; }
                .header-left h3 { font-size: 18px; font-weight: 700; color: white; }
                
                .icon-zap { color: #A855F7; }
                .icon-award { color: #FFB800; }

                .section-body { padding: 24px; border-top: 1px solid var(--border); background: rgba(0,0,0,0.1); }
                
                .rules-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
                .edit-card { 
                    background: #1a1a1b; 
                    border: 1px solid var(--border); 
                    padding: 16px; 
                    border-radius: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 12px;
                }
                .card-top-row { 
                    display: flex; 
                    gap: 12px; 
                    align-items: flex-end;
                }
                
                .input-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
                .input-group.small { flex: 0 0 70px; }
                .input-group label { font-size: 11px; color: var(--text-secondary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .input-group input { 
                    background: #0A0A0B; 
                    border: 1px solid var(--border); 
                    color: white; 
                    padding: 10px; 
                    border-radius: 8px; 
                    outline: none; 
                    font-size: 14px;
                    width: 100%;
                }
                
                .delete-rule-btn { 
                    background: rgba(239, 68, 68, 0.1); 
                    color: #EF4444; 
                    width: 38px; 
                    height: 38px; 
                    border-radius: 8px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    border: none; 
                    cursor: pointer; 
                    transition: 0.2s;
                    flex-shrink: 0;
                }
                .delete-rule-btn:hover { background: #EF4444; color: white; }

                @media (max-width: 400px) {
                    .card-top-row { flex-wrap: wrap; }
                    .input-group { flex: 1 1 100%; }
                    .input-group.small { flex: 1 1 100%; }
                }
                
                .add-rule-btn { background: transparent; border: 2px dashed var(--border); color: var(--text-secondary); padding: 20px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; }
                .add-rule-btn:hover { border-color: var(--primary); color: var(--primary); }

                .levels-table-container { overflow-x: auto; }
                .levels-table { width: 100%; border-collapse: collapse; text-align: left; }
                .levels-table th { padding: 12px 16px; color: var(--text-secondary); font-size: 12px; font-weight: 700; border-bottom: 1px solid var(--border); }
                .levels-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
                .level-num { font-family: monospace; font-weight: 800; color: var(--primary); display: inline-block; margin-top: 10px; }
                .levels-table input, .levels-table textarea { background: #0A0A0B; border: 1px solid var(--border); color: white; padding: 8px; border-radius: 6px; outline: none; width: 100%; transition: 0.2s; }
                .levels-table input:focus, .levels-table textarea:focus { border-color: var(--primary); background: #000; }
                .title-input { font-weight: 600; }
                .xp-input { width: 100px; }
                .privileges-input { min-height: 60px; font-size: 13px; line-height: 1.5; resize: vertical; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default XpRuleManager;
