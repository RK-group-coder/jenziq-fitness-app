import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Calendar, MapPin, Hash, Key, ExternalLink, Loader2, Info, Shield } from 'lucide-react';
import { supabase } from '../../supabase';

const UserDetailsManager = ({ targetRole }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [targetRole]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // 需要合併查詢 profiles 與 permissions
            const { data: profiles, error: profileError } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    user_permissions (
                        role,
                        user_id_string,
                        password,
                        status
                    )
                `)
                .filter('user_permissions.role', 'eq', targetRole);

            if (profileError) throw profileError;

            // 確保 profiles 是陣列且進行過濾
            const filtered = (profiles || []).filter(p =>
                p.user_permissions && p.user_permissions.role === targetRole
            );
            setUsers(filtered);
        } catch (err) {
            console.error('Fetch users error:', err);
            setUsers([]); // 發生錯誤時清空列表
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_permissions?.user_id_string.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roleTitle = targetRole === 'manager' ? '現有管理者' : targetRole === 'coach' ? '教練管理' : '學員管理';

    return (
        <div className="user-details-manager">
            <header className="manager-header">
                <div>
                    <h2>{roleTitle}</h2>
                    <p>查看並管理系統中的{targetRole === 'manager' ? '管理者' : targetRole === 'coach' ? '教練' : '學員'}資料</p>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="搜尋姓名或編號..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="user-list">
                {isLoading ? (
                    <div className="loading-state"><Loader2 className="spin" /> 讀取中...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">尚無資料</div>
                ) : (
                    <div className="user-grid">
                        {filteredUsers.map(user => (
                            <div key={user.email} className="user-card">
                                <div className="user-card-header">
                                    <div className="user-avatar">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="user-basic-info">
                                        <h3>{user.name}</h3>
                                        <span className="user-id">#{user.user_permissions?.user_id_string}</span>
                                    </div>
                                    <button className="details-btn" onClick={() => setSelectedUser(user)}>
                                        <Info size={16} /> 詳細資料
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>詳細帳號資料</h3>
                            <button className="close-btn" onClick={() => setSelectedUser(null)}><Hash size={20} /></button>
                        </div>
                        <div className="info-body">
                            <div className="info-section">
                                <h4 className="section-title">核心帳號資訊</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label><Mail size={14} /> GMAIL / 帳號</label>
                                        <span>{selectedUser.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <label><Shield size={14} /> 身分等級</label>
                                        <span className={`role-badge ${selectedUser.user_permissions?.role}`}>
                                            {selectedUser.user_permissions?.role === 'manager' ? '管理者' : selectedUser.user_permissions?.role === 'coach' ? '教練' : '學員'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <label><Hash size={14} /> 用戶編號</label>
                                        <span className="highlight-text">{selectedUser.user_permissions?.user_id_string}</span>
                                    </div>
                                    <div className="info-item">
                                        <label><Key size={14} /> 登入密碼</label>
                                        <span className="password-text">{selectedUser.user_permissions?.password}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-divider"></div>

                            <div className="info-section">
                                <h4 className="section-title">個人基本資料</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label><User size={14} /> 真實姓名</label>
                                        <span>{selectedUser.name}</span>
                                    </div>
                                    <div className="info-item">
                                        <label><Calendar size={14} /> 性別 / 年齡</label>
                                        <span>{selectedUser.gender} / {selectedUser.age}歲</span>
                                    </div>
                                    <div className="info-item">
                                        <label><Phone size={14} /> 聯絡電話</label>
                                        <span>{selectedUser.phone}</span>
                                    </div>
                                    {selectedUser.branch && (
                                        <div className="info-item">
                                            <label><MapPin size={14} /> 所屬分店</label>
                                            <span className="branch-tag">{selectedUser.branch}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .user-details-manager { padding: 32px; height: 100%; overflow-y: auto; }
                .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; gap: 20px; }
                .manager-header h2 { font-size: 28px; font-weight: 800; color: white; margin-bottom: 4px; }
                .manager-header p { color: var(--text-secondary); font-size: 14px; }
                
                .search-box { position: relative; flex: 1; max-width: 300px; }
                .search-box svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
                .search-box input { width: 100%; background: var(--secondary-bg); border: 1px solid var(--border); padding: 12px 16px 12px 48px; border-radius: 12px; color: white; outline: none; }
                
                .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .user-card { background: var(--secondary-bg); border: 1px solid var(--border); padding: 20px; border-radius: 20px; transition: 0.2s; }
                .user-card:hover { border-color: var(--primary); transform: translateY(-2px); }
                
                .user-card-header { display: flex; align-items: center; gap: 16px; position: relative; }
                .user-avatar { width: 50px; height: 50px; background: rgba(255, 92, 0, 0.1); color: var(--primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; border: 1px solid rgba(255, 92, 0, 0.2); }
                .user-basic-info h3 { font-size: 18px; font-weight: 700; color: white; margin-bottom: 2px; }
                .user-id { font-size: 12px; color: var(--primary); font-family: monospace; font-weight: 700; }
                
                .details-btn { margin-left: auto; background: rgba(255,255,255,0.05); color: white; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); }
                .details-btn:hover { background: rgba(255,255,255,0.1); }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content.info-modal { background: #121214; width: 100%; max-width: 500px; border-radius: 32px; border: 1px solid var(--border); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
                .info-body { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
                .section-title { font-size: 13px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; font-weight: 800; }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .info-item { display: flex; flex-direction: column; gap: 6px; }
                .info-item label { font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; font-weight: 600; }
                .info-item span { font-size: 15px; color: white; font-weight: 600; }
                
                .info-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }
                
                .role-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; width: fit-content; text-transform: uppercase; }
                .role-badge.manager { background: rgba(168, 85, 247, 0.1); color: #A855F7; }
                .role-badge.coach { background: rgba(255, 92, 0, 0.1); color: var(--primary); }
                .role-badge.student { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
                
                .highlight-text { color: var(--primary) !important; font-family: monospace; font-weight: 800 !important; }
                .password-text { font-family: monospace; opacity: 0.6; }
                .branch-tag { background: #fff1; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); width: fit-content; }

                .loading-state, .empty-state { padding: 100px; text-align: center; color: var(--text-secondary); font-size: 14px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default UserDetailsManager;
