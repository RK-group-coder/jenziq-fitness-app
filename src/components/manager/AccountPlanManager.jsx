import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, Coins, Plus, Minus, Save, Loader2, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../supabase';

const AccountPlanManager = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // User extended data (plans)
    const [userPlans, setUserPlans] = useState({});

    // Plan editing state
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planForm, setPlanForm] = useState({ name: '', months: 12, endDate: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data: profiles, error: profileError } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    user_permissions!inner (
                        role,
                        user_id_string
                    )
                `)
                .eq('user_permissions.role', 'student');

            if (profileError) throw profileError;
            setUsers(profiles || []);
            fetchUserPlans(profiles || []);
        } catch (err) {
            console.error('Fetch students error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserPlans = async (profiles) => {
        const planMap = {};
        try {
            const { data: notices, error } = await supabase
                .from('notifications')
                .select('target_email, content, created_at')
                .or('tag.eq.公告,tag.eq.繳費')
                .ilike('content', '%方案%')
                .order('created_at', { ascending: false });

            if (!error && notices) {
                notices.forEach(notice => {
                    if (notice.target_email && !planMap[notice.target_email]) {
                        const match = notice.content.match(/方案：([^ \n,]+)/) || notice.content.match(/訂閱 ([^ \n,]+)/);
                        planMap[notice.target_email] = match ? match[1] : '已購方案 (名稱未知)';
                    }
                });
            }
            setUserPlans(planMap);
        } catch (err) {
            console.error('Detect plans error:', err);
        }
    };

    const handleUpdateTokens = async (email, type, amount) => {
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex === -1) return;

        const updatedUsers = [...users];
        const field = type === 'black' ? 'black_tokens' : 'white_tokens';
        const newVal = Math.max(0, (updatedUsers[userIndex][field] || 0) + amount);

        updatedUsers[userIndex][field] = newVal;
        setUsers(updatedUsers);
    };

    const saveChanges = async (user) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    black_tokens: user.black_tokens,
                    white_tokens: user.white_tokens
                })
                .eq('email', user.email);

            if (error) throw error;
            alert(`✅ ${user.name} 的點數已成功更新！`);
        } catch (err) {
            alert('❌ 儲存失敗：' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePlan = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    membership_name: planForm.name,
                    membership_end_at: planForm.endDate,
                    months: planForm.months
                })
                .eq('email', selectedUser.email);

            if (error) throw error;

            // Refresh list
            fetchUsers();
            setShowPlanModal(false);
            alert(`✅ 已為 ${selectedUser.name} 設定方案：${planForm.name || '無'}`);
        } catch (err) {
            alert('❌ 儲存方案失敗：' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="account-plan-manager animate-fade-in">
            <header className="manager-header">
                <div className="header-text">
                    <h2>學員會籍與點數管理</h2>
                    <p>手動管理會籍合約、方案時數，並動態調整剩餘點數</p>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="搜尋學生姓名或 Email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="stats-summary">
                <div className="stat-pill">
                    <User size={16} />
                    <span>總計 {users.length} 位學員</span>
                </div>
                <div className="stat-pill success">
                    <CheckCircle2 size={16} />
                    <span>已完成同步</span>
                </div>
            </div>

            <div className="user-list-container">
                {isLoading ? (
                    <div className="loading-state">
                        <Loader2 className="spin" />
                        <p>正在載入數據...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={40} />
                        <p>未找到符合條件的學員</p>
                    </div>
                ) : (
                    <div className="user-cards-stack">
                        {filteredUsers.map(user => (
                            <div key={user.email} className="user-mgmt-card animate-fade-in">
                                <div className="card-top">
                                    <div className="user-info">
                                        <div className="avatar">{user.name?.charAt(0)}</div>
                                        <div className="text-info">
                                            <div className="name">{user.name}</div>
                                            <div className="email">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="plan-badge-v2">
                                        <CreditCard size={12} />
                                        <span>{user.membership_name || userPlans[user.email] || '無有效方案'}</span>
                                        <button className="edit-plan-btn" onClick={() => {
                                            setSelectedUser(user);
                                            setPlanForm({
                                                name: user.membership_name || '',
                                                months: user.months || 12,
                                                endDate: user.membership_end_at || new Date().toISOString().split('T')[0]
                                            });
                                            setShowPlanModal(true);
                                        }}>
                                            修
                                        </button>
                                    </div>
                                </div>

                                <div className="card-tokens">
                                    <div className="token-row">
                                        <div className="token-label">
                                            <Coins size={14} color="#A855F7" />
                                            <span>多元 (黑幣)</span>
                                        </div>
                                        <div className="token-adjust-v2">
                                            <button onClick={() => handleUpdateTokens(user.email, 'black', -1)}><Minus size={14} /></button>
                                            <span className="token-val-v2 black">{user.black_tokens || 0}</span>
                                            <button onClick={() => handleUpdateTokens(user.email, 'black', 1)}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="token-row">
                                        <div className="token-label">
                                            <Coins size={14} color="#FF7A00" />
                                            <span>大地 (白幣)</span>
                                        </div>
                                        <div className="token-adjust-v2">
                                            <button onClick={() => handleUpdateTokens(user.email, 'white', -1)}><Minus size={14} /></button>
                                            <span className="token-val-v2 white">{user.white_tokens || 0}</span>
                                            <button onClick={() => handleUpdateTokens(user.email, 'white', 1)}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="full-save-btn"
                                    onClick={() => saveChanges(user)}
                                    disabled={isSaving}
                                >
                                    <Save size={16} />
                                    <span>儲存修改</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showPlanModal && selectedUser && (
                <div className="plan-modal-overlay" onClick={() => setShowPlanModal(false)}>
                    <div className="plan-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-v2">
                            <h3>設定會籍方案</h3>
                            <button className="close-btn" onClick={() => setShowPlanModal(false)}>✕</button>
                        </div>
                        <div className="modal-body-v2">
                            <div className="form-group">
                                <label>方案名稱</label>
                                <select
                                    value={planForm.name}
                                    onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                >
                                    <option value="">請選擇方案</option>
                                    <option value="初衷隨享方案">初衷隨享方案 (4 Earth)</option>
                                    <option value="習慣養成方案">習慣養成方案 (8 Earth)</option>
                                    <option value="恆常習慣方案">恆常習慣方案 (8 Earth)</option>
                                    <option value="自在流動方案">自在流動方案 (Unlimited Earth)</option>
                                    <option value="深度沉浸方案">深度沉浸方案 (Unlimited Earth)</option>
                                    <option value="年度精英專案">年度精英專案 (8 Diverse / 12 Earth)</option>
                                    <option value="雙載巔峰專案">雙載巔峰專案 (10 Diverse / 15 Earth)</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>合約期數 (月)</label>
                                    <input
                                        type="number"
                                        value={planForm.months}
                                        onChange={e => setPlanForm({ ...planForm, months: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>會籍截止日</label>
                                    <input
                                        type="date"
                                        value={planForm.endDate}
                                        onChange={e => setPlanForm({ ...planForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-v2">
                            <button className="cancel-btn" onClick={() => setShowPlanModal(false)}>取消</button>
                            <button className="confirm-btn" onClick={handleSavePlan}>儲存方案</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .account-plan-manager { padding: 24px 16px; background: #0A0A0B; min-height: 100vh; color: white; padding-bottom: 100px; }
                
                .manager-header { margin-bottom: 24px; }
                .header-text h2 { font-size: 24px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px; }
                .header-text p { color: #64748B; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
                
                .search-box { position: relative; width: 100%; }
                .search-box svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #475569; }
                .search-box input { width: 100%; height: 48px; background: #121214; border: 1px solid rgba(255,255,255,0.05); padding: 0 16px 0 48px; border-radius: 16px; color: white; font-weight: 600; outline: none; transition: 0.3s; font-size: 14px; }
                .search-box input:focus { border-color: #FF7A00; background: #1A1A1C; }

                .stats-summary { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
                .stat-pill { background: rgba(255,255,255,0.03); padding: 6px 14px; border-radius: 12px; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #94A3B8; border: 1px solid rgba(255,255,255,0.05); }
                .stat-pill.success { color: #10B981; background: rgba(16, 185, 129, 0.05); }

                .user-cards-stack { display: flex; flex-direction: column; gap: 16px; }
                .user-mgmt-card { 
                    background: linear-gradient(135deg, #121214 0%, #0F0F10 100%); 
                    border-radius: 24px; padding: 20px; 
                    border: 1px solid rgba(255,255,255,0.02);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                
                .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; }
                .user-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
                .avatar { width: 44px; height: 44px; background: rgba(255, 122, 0, 0.1); color: #FF7A00; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; flex-shrink: 0; border: 1px solid rgba(255,122,0,0.1); }
                .text-info { min-width: 0; }
                .name { font-size: 16px; font-weight: 800; margin-bottom: 1px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .email { font-size: 11px; color: #64748B; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .plan-badge-v2 { display: flex; align-items: center; gap: 6px; background: rgba(59, 130, 246, 0.08); color: #3B82F6; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; white-space: nowrap; border: 1px solid rgba(59,130,246,0.1); }
                .edit-plan-btn { background: #3B82F6; color: white; border: none; padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 4px; }

                /* Modal Styling */
                .plan-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .plan-modal { width: 100%; max-width: 400px; background: #121214; border-radius: 28px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
                .modal-header-v2 { background: #1A1A1C; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
                .modal-header-v2 h3 { font-size: 18px; font-weight: 800; }
                .modal-body-v2 { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-size: 11px; color: #64748B; font-weight: 800; text-transform: uppercase; }
                .form-group select, .form-group input { background: #0A0A0B; border: 1px solid #1A1A1C; border-radius: 12px; height: 48px; padding: 0 16px; color: white; font-weight: 700; outline: none; font-size: 14px; }
                .form-row { display: flex; gap: 12px; }
                .flex-1 { flex: 1; }
                .modal-footer-v2 { padding: 20px; display: flex; justify-content: flex-end; gap: 12px; background: #0A0A0B; border-top: 1px solid #1A1A1C; }
                .cancel-btn { background: #1A1A1C; color: #94A3B8; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; }
                .confirm-btn { background: #FF7A00; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 900; cursor: pointer; }

                .card-tokens { background: rgba(255,255,255,0.02); border-radius: 16px; padding: 12px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; }
                .token-row { display: flex; justify-content: space-between; align-items: center; }
                .token-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #94A3B8; }
                
                .token-adjust-v2 { display: flex; align-items: center; gap: 10px; background: #0A0A0B; padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
                .token-adjust-v2 button { background: rgba(255,255,255,0.04); border: none; color: white; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .token-adjust-v2 button:active { transform: scale(0.9); }
                .token-val-v2 { font-size: 18px; font-weight: 950; min-width: 25px; text-align: center; }
                .token-val-v2.black { color: #A855F7; }
                .token-val-v2.white { color: #FF7A00; }

                .full-save-btn { width: 100%; background: #FF7A00; color: white; border: none; height: 48px; border-radius: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(255, 122, 0, 0.2); }
                .full-save-btn:active { transform: scale(0.98); }
                .full-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .loading-state, .empty-state { padding: 60px 40px; text-align: center; color: #475569; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default AccountPlanManager;
