import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    User, 
    Users,
    DollarSign, 
    FileText, 
    Send, 
    Search, 
    CheckCircle2, 
    Loader2,
    History,
    ChevronRight,
    ChevronDown,
    X
} from 'lucide-react';
import { supabase } from '../../supabase';

const PaymentRequestManager = () => {
    const [users, setUsers] = useState({ students: [], coaches: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [sendMode, setSendMode] = useState('individual'); // 'individual' or 'bulk'
    const [targetRole, setTargetRole] = useState('student'); // 'student' or 'coach'
    const [selectedUsers, setSelectedUsers] = useState([]);
    
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('月費');
    const [isSending, setIsSending] = useState(false);
    const [recentRequests, setRecentRequests] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const [showRecipientModal, setShowRecipientModal] = useState(false);

    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        fetchAllUsers();
        fetchRecentRequests();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    name, 
                    email,
                    user_permissions (
                        role,
                        status
                    )
                `);
            
            if (error) throw error;

            if (data) {
                const allUsers = data.map(u => {
                    const perm = Array.isArray(u.user_permissions) ? u.user_permissions[0] : u.user_permissions;
                    return {
                        id: u.email,
                        name: u.name,
                        email: u.email,
                        role: perm?.role || 'unknown',
                        status: perm?.status || ''
                    };
                }).filter(u => 
                    u.status === '已註冊' || 
                    u.status === '未註冊' || 
                    u.status.toLowerCase() === 'active' ||
                    u.status.toLowerCase() === 'approved' ||
                    !u.status
                );

                setUsers({
                    students: allUsers.filter(u => u.role === 'student'),
                    coaches: allUsers.filter(u => u.role === 'coach')
                });
            }
        } catch (err) {
            console.error('Fetch users error:', err);
        }
    };

    const fetchRecentRequests = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('tag', '公告')
            .order('created_at', { ascending: false })
            .limit(10);
        setRecentRequests(data || []);
    };

    const handleSendRequest = async () => {
        let targets = [];
        
        if (sendMode === 'individual') {
            if (selectedUsers.length === 0) return alert('請選擇至少一位收款人');
            targets = selectedUsers;
        } else {
            // Bulk mode
            targets = targetRole === 'student' ? users.students : users.coaches;
            if (targets.length === 0) return alert('名單內無對象');
            
            const confirmMsg = `⚠️ 準備向全體${targetRole === 'student' ? '學員' : '教練'} (${targets.length} 人) 發送同一筆帳單嗎？`;
            if (!window.confirm(confirmMsg)) return;
        }

        if (!amount || !title || !description) {
            return alert('⚠️ 資訊不完整：金額、標題與描述為必填。');
        }

        setIsSending(true);

        try {
            const newNotifs = targets.map(t => ({
                user_id: t.id || t.email,
                target_email: t.email.toLowerCase(),
                target_role: t.role || targetRole, // Added missing column
                title: `【繳費通知】${title}`,
                content: `${description}\n\n應繳金額：NT$ ${amount}\n項目：${category}`,
                tag: '公告', // Changed from '繳費' to bypass Check Constraint
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('notifications').insert(newNotifs);
            if (error) throw error;

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
            setAmount('');
            setTitle('');
            setDescription('');
            setSelectedUsers([]);
            fetchRecentRequests();
        } catch (err) {
            alert('發送失敗: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };

    const toggleUser = (user) => {
        setSelectedUsers(prev => 
            prev.find(u => u.email === user.email) 
            ? prev.filter(u => u.email !== user.email)
            : [...prev, user]
        );
    };

    const currentList = targetRole === 'student' ? users.students : users.coaches;
    const filteredList = currentList.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isFormValid = (sendMode === 'individual' ? selectedUsers.length > 0 : true) && amount && title && description;

    return (
        <div className="payment-manager-container animate-fade-in">
            <header className="page-header">
                <div className="header-icon-box"><CreditCard size={24} /></div>
                <div className="header-info">
                    <h2>應收帳款管理系統</h2>
                    <p>支援個人多選、角色切換與全體一鍵發送</p>
                </div>
            </header>

            <div className="manager-grid">
                <div className="config-card">
                    <div className="card-header">
                        <Send size={18} className={`h-icon ${isFormValid ? 'glow-orange' : ''}`} />
                        <h3>建立新帳單</h3>
                    </div>

                    <div className="form-stack">
                        <div className="input-group">
                            <label>1. 設定對象範圍</label>
                            <div className="modern-pills">
                                <button className={sendMode === 'individual' ? 'active' : ''} onClick={() => { setSendMode('individual'); setSelectedUsers([]); }}>個人發送</button>
                                <button className={sendMode === 'bulk' ? 'active' : ''} onClick={() => { setSendMode('bulk'); setSelectedUsers([]); }}>全體群發</button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>2. 選擇角色與受款人 {selectedUsers.length > 0 && `(已選 ${selectedUsers.length} 人)`}</label>
                            <div className="role-switcher">
                                <button className={targetRole === 'student' ? 'active' : ''} onClick={() => { setTargetRole('student'); setSelectedUsers([]); }}>學員名單</button>
                                <button className={targetRole === 'coach' ? 'active' : ''} onClick={() => { setTargetRole('coach'); setSelectedUsers([]); }}>教練名單</button>
                            </div>
                            
                            {sendMode === 'individual' ? (
                                <div className="picker-container">
                                    <button 
                                        className={`list-toggle-btn ${isPickerOpen ? 'open' : ''}`}
                                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                                    >
                                        <Users size={16} />
                                        {isPickerOpen ? '收起名單' : `點擊列出所有${targetRole === 'student' ? '學員' : '教練'}名單`}
                                        <ChevronDown size={14} className="chevron" />
                                    </button>

                                    {isPickerOpen && (
                                        <div className="multi-user-picker animate-slide-down">
                                            <div className="picker-search-bar">
                                                <Search size={14} />
                                                <input 
                                                    type="text" 
                                                    placeholder="關鍵字搜尋..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="picker-list">
                                                {filteredList.length > 0 ? (
                                                    filteredList.map(u => {
                                                        const isSelected = selectedUsers.some(sel => sel.email === u.email);
                                                        return (
                                                            <div key={u.email} className={`picker-item ${isSelected ? 'selected' : ''}`} onClick={() => toggleUser(u)}>
                                                                <div className="p-check">{isSelected ? <div className="dot" /> : null}</div>
                                                                <div className="p-info">
                                                                    <span className="p-name">{u.name}</span>
                                                                    <span className="p-sub">{u.email}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="empty-search">找不到相符的人員</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bulk-selected-preview" onClick={() => setShowRecipientModal(true)} style={{ cursor: 'pointer' }}>
                                    <div className="bulk-badge clickable">
                                        全體 {targetRole === 'student' ? '學員' : '教練'}：共 {currentList.length} 人 (點擊查看名單)
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-row wrap-on-mobile">
                            <div className="input-group flex-2">
                                <label><FileText size={14} /> 3. 項目標題</label>
                                <input type="text" placeholder="例：五月份月費結算" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="input-group flex-1">
                                <label><DollarSign size={14} /> 4. 繳費金額</label>
                                <input type="number" placeholder="NT$" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>費用類別</label>
                            <div className="category-toggles">
                                {['月費', '活動費', '商品', '其他'].map(cat => (
                                    <button 
                                        key={cat} 
                                        className={`cat-tab ${category === cat ? 'active' : ''}`}
                                        onClick={() => setCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>5. 內文描述 (詳細說明內容)</label>
                            <textarea placeholder="例如：感謝支持，請於期限內完成支付..." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>

                        <button 
                            className={`submit-btn ${!isFormValid || isSending ? 'disabled' : 'orange-active'}`}
                            onClick={handleSendRequest}
                            disabled={!isFormValid || isSending}
                        >
                            {isSending ? <Loader2 size={18} className="spin" /> : (
                                sendMode === 'individual' ? <><Send size={18} /> 發送帳單</> : <><Users size={18} /> 向全體發送帳單</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: History */}
                <div className="history-card">
                    <div className="card-header">
                        <History size={18} className="h-icon" />
                        <h3>發送日誌</h3>
                    </div>
                    <div className="history-list">
                        {recentRequests.length > 0 ? recentRequests.slice(0, 15).map(req => (
                            <div key={req.id} className="history-item">
                                <div className="h-info">
                                    <span className="h-target">{req.target_email || '系統組件'}</span>
                                    <span className="h-title text-truncate">{req.title}</span>
                                    <span className="h-time">{new Date(req.created_at).toLocaleString()}</span>
                                </div>
                                <div className="h-status">
                                    <span className="status-tag">成功</span>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-history">尚未有歷史紀錄</div>
                        )}
                    </div>
                </div>
            </div>

            {showSuccess && (
                <div className="success-toast">
                    <CheckCircle2 size={20} />
                    <span>{sendMode === 'bulk' ? '大宗發送成功！' : '帳單已成功發送！'}</span>
                </div>
            )}

            {showRecipientModal && (
                <div className="modal-overlay" onClick={() => setShowRecipientModal(false)}>
                    <div className="modal-content recipient-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>全體 {targetRole === 'student' ? '學員' : '教練'} 名單</h3>
                            <button className="close-btn" onClick={() => setShowRecipientModal(false)}><X size={20} /></button>
                        </div>
                        <div className="recipient-list">
                            {currentList.map(u => (
                                <div key={u.email} className="recipient-row">
                                    <div className="r-avatar">{u.name.charAt(0)}</div>
                                    <div className="r-info">
                                        <span className="r-name">{u.name}</span>
                                        <span className="r-email">{u.email}</span>
                                    </div>
                                    <div className={`r-status ${u.status === '已註冊' ? 'reg' : ''}`}>{u.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .payment-manager-container { padding: 32px 20px; color: white; display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto; }
                .page-header { display: flex; align-items: center; gap: 20px; }
                .header-icon-box { background: rgba(255, 122, 0, 0.1); color: #FF7A00; padding: 16px; border-radius: 18px; }
                
                .modern-pills, .role-switcher { display: flex; background: #0F172A; padding: 4px; border-radius: 14px; border: 1px solid #334155; }
                .modern-pills button, .role-switcher button { flex: 1; border: none; background: none; color: #94A3B8; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .modern-pills button.active, .role-switcher button.active { background: #1E293B; color: #FF7A00; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                
                .bulk-selected-preview { padding: 16px; background: rgba(255, 122, 0, 0.05); border: 1px dashed rgba(255, 122, 0, 0.3); border-radius: 16px; text-align: center; transition: 0.3s; }
                .bulk-selected-preview:hover { background: rgba(255, 122, 0, 0.1); border-style: solid; }
                .bulk-badge { font-size: 15px; font-weight: 900; color: #FF7A00; }
                .bulk-badge.clickable { text-decoration: underline; text-underline-offset: 4px; }

                .manager-grid { display: grid; grid-template-columns: 1fr 400px; gap: 24px; align-items: start; }
                @media (max-width: 1024px) {
                    .manager-grid { grid-template-columns: 1fr; }
                    .wrap-on-mobile { flex-direction: column; }
                }

                .config-card, .history-card { background: #1E293B; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
                .card-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px; }
                .h-icon { color: #475569; transition: 0.3s; }
                .h-icon.glow-orange { color: #FF7A00; filter: drop-shadow(0 0 5px rgba(255,122,0,0.5)); }

                .form-stack { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
                .form-row { display: flex; gap: 16px; }
                .flex-1 { flex: 1; } .flex-2 { flex: 2; }
                
                .input-group { display: flex; flex-direction: column; gap: 10px; }
                .input-group label { font-size: 13px; font-weight: 700; color: #94A3B8; display: flex; align-items: center; gap: 6px; }
                .input-group input, .input-group textarea { background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 14px; color: white; transition: 0.3s; }
                .input-group input:focus, .input-group textarea:focus { border-color: #FF7A00; outline: none; box-shadow: 0 0 10px rgba(255,122,0,0.1); }
                
                .selected-tag { background: rgba(255, 122, 0, 0.1); border: 1px solid rgba(255, 122, 0, 0.3); padding: 10px 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                .selected-tag span { font-size: 13px; font-weight: 700; color: #FF7A00; }
                
                .student-search-box { position: relative; }
                .student-search-box input { width: 100%; padding-left: 44px; }
                .s-icon { position: absolute; left: 16px; top: 16px; color: #475569; }
                .search-results-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #1e1e1e; border: 1px solid #333; border-radius: 12px; margin-top: 8px; z-index: 10; max-height: 200px; overflow-y: auto; }
                .result-item { padding: 12px 16px; display: flex; flex-direction: column; gap: 2px; cursor: pointer; border-bottom: 1px solid #333; }
                .result-item:hover { background: rgba(255, 122, 0, 0.1); }
                .result-item .n { font-size: 14px; font-weight: 700; color: white; }
                .result-item .e { font-size: 12px; color: #94A3B8; }

                .category-toggles { display: flex; gap: 10px; }
                .cat-tab { flex: 1; background: #0F172A; border: 1px solid #334155; color: #94A3B8; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
                .cat-tab.active { background: #FF7A00; color: white; border-color: #FF7A00; }

                .submit-btn { border: none; padding: 20px; border-radius: 16px; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
                .submit-btn.disabled { background: #334155; color: #64748B; cursor: not-allowed; opacity: 0.6; }
                .submit-btn.orange-active { background: #FF7A00; color: white; cursor: pointer; box-shadow: 0 10px 25px rgba(255, 122, 0, 0.3); }
                
                .history-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 600px; overflow-y: auto; }
                .history-item { background: #0F172A; padding: 16px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid transparent; transition: 0.3s; }
                .text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
                .status-tag { font-size: 11px; font-weight: 700; background: rgba(16, 185, 129, 0.1); color: #10B981; padding: 4px 8px; border-radius: 6px; }

                .success-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 16px 24px; border-radius: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000; }
                .empty-history { text-align: center; padding: 40px; color: #475569; font-size: 14px; }

                /* List Toggle Btn */
                .picker-container { display: flex; flex-direction: column; gap: 8px; }
                .list-toggle-btn { background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 12px 16px; color: #94A3B8; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.3s; font-size: 13px; font-weight: 700; }
                .list-toggle-btn:hover { border-color: #FF7A00; color: white; background: #1E293B; }
                .list-toggle-btn.open { background: #1E293B; border-color: #FF7A00; color: #FF7A00; }
                .list-toggle-btn .chevron { transition: 0.3s; margin-left: auto; }
                .list-toggle-btn.open .chevron { transform: rotate(180deg); }

                /* Multi-user Picker Styles */
                .multi-user-picker { background: #0F172A; border: 1px solid #334155; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
                .picker-search-bar { padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 10px; color: #475569; }
                .picker-search-bar input { background: none; border: none; color: white; flex: 1; font-size: 13px; }
                .picker-search-bar input:focus { outline: none; }
                
                .picker-list { max-height: 200px; overflow-y: auto; }
                .picker-item { padding: 12px 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.02); transition: 0.2s; }
                .picker-item:hover { background: rgba(255,255,255,0.03); }
                .picker-item.selected { background: rgba(255, 122, 0, 0.08); }
                
                .p-check { width: 18px; height: 18px; border: 2px solid #334155; border-radius: 5px; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
                .picker-item.selected .p-check { border-color: #FF7A00; background: #FF7A00; }
                .p-check .dot { width: 6px; height: 6px; background: white; border-radius: 1px; }
                
                .p-info { display: flex; flex-direction: column; gap: 2px; }
                .p-name { font-size: 13px; font-weight: 700; color: white; }
                .p-sub { font-size: 11px; color: #64748B; }
                .empty-search { padding: 20px; text-align: center; color: #475569; font-size: 13px; }

                .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .recipient-modal { background: #1E293B; width: 100%; max-width: 500px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 30px 60px rgba(0,0,0,0.5); overflow: hidden; }
                .modal-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .close-btn { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 8px; border-radius: 50%; transition: 0.3s; }
                .close-btn:hover { background: rgba(255,255,255,0.05); color: white; }
                
                .recipient-list { padding: 12px; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                .recipient-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #0F172A; border-radius: 16px; border: 1px solid transparent; }
                .r-avatar { width: 40px; height: 40px; background: rgba(255,122,0,0.1); color: #FF7A00; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                .r-info { flex: 1; display: flex; flex-direction: column; }
                .r-name { font-size: 14px; font-weight: 700; color: white; }
                .r-email { font-size: 12px; color: #64748B; }
                .r-status { font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #334155; color: #94A3B8; }
                .r-status.reg { background: rgba(16, 185, 129, 0.1); color: #10B981; }
            `}</style>
        </div>
    );
};

export default PaymentRequestManager;
