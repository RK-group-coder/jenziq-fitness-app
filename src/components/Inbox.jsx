import React, { useState, useEffect } from 'react';
import { Mail, Clock, ChevronRight, X, Inbox as InboxIcon, Filter, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../supabase';

const Inbox = ({ role = 'student', onBack, user, onUnreadChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [activeFilter, setActiveFilter] = useState('全部');

    const filters = ['全部', '活動', '課程', '公告', '優惠', '系統'];

    useEffect(() => {
        fetchNotifications();
    }, [role, user]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // 抓取所有通知，並在前端依角色過濾，避免因資料庫缺少特定欄位 (role / target_role) 導致查詢失敗
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const myEmail = user?.email?.toLowerCase() || '';

            // 在前端過濾角色
            let filteredByRole = (data || []).filter(notif => {
                const target = notif.target_role || notif.role || 'all';
                const tEmail = notif.target_email?.toLowerCase();
                const uId = notif.user_id;

                // 如果有指定特定信箱
                if (tEmail) {
                    return tEmail === myEmail;
                }

                // 如果有指定特定 user_id，以 user_id 匹配結果為準
                if (uId) {
                    return uId === user?.id || uId === user?.userIdString;
                }

                // 如果這則通知看起來像是系統發給個人的 (全局通知但包含關鍵字)，為了避免所有教練看見，我們隱藏它
                if (target === 'coach' && !uId && !tEmail && (notif.title?.includes('通過') || notif.title?.includes('駁回') || notif.title?.includes('退件'))) {
                    return false;
                }

                return target === role || target === 'all';
            });

            // 如果是教練，額外抓取未處理的綁定申請
            if (role === 'coach' && myEmail) {
                const { data: bindings } = await supabase
                    .from('coach_bindings')
                    .select('id, student_email, created_at')
                    .eq('coach_email', myEmail)
                    .eq('status', 'pending');
                
                if (bindings && bindings.length > 0) {
                    const bindingNotifs = bindings.map(b => ({
                        id: `bind_${b.id}`,
                        title: '專屬教練綁定申請',
                        content: `學員 (${b.student_email}) 申請綁定您為專屬教練。\n請儘速回覆是否同意。`,
                        tag: '系統',
                        created_at: b.created_at,
                        is_binding_request: true,
                        binding_id: b.id,
                        student_email: b.student_email
                    }));
                    filteredByRole = [...bindingNotifs, ...filteredByRole];
                }
            }

            const finalNotifs = filteredByRole.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
            setNotifications(finalNotifs);
            
            // 計算未讀總數並回傳給父組件
            if (onUnreadChange) {
                const unreadCount = finalNotifs.filter(n => !n.is_read).length;
                onUnreadChange(unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredNotifications = activeFilter === '全部'
        ? notifications
        : notifications.filter(n => n.tag === activeFilter);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleMarkAsRead = async (msg) => {
        if (msg.is_read || msg.is_binding_request) {
            setSelectedMsg(msg);
            return;
        }

        try {
            // 先在前端更新狀態，提升流暢感
            setNotifications(prev => prev.map(n => n.id === msg.id ? { ...n, is_read: true } : n));
            // 如果有給回呼，立即重新計算給父組件
            if (onUnreadChange) {
                const currentUnread = notifications.filter(n => n.id !== msg.id && !n.is_read).length;
                onUnreadChange(currentUnread);
            }

            setSelectedMsg({ ...msg, is_read: true });

            // 資料庫更新
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', msg.id);
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    };

    const handleBindingResponse = async (bindingId, studentEmail, isAccepted) => {
        try {
            const status = isAccepted ? 'accepted' : 'rejected';
            const { error } = await supabase
                .from('coach_bindings')
                .update({ status })
                .eq('id', bindingId);
            
            if (error) throw error;

            // Notify student
            const targetEmail = studentEmail.toLowerCase();
            const message = isAccepted 
                ? `您的專屬教練綁定申請已通過！教練 (${user?.email}) 已同意您的邀請。`
                : `教練 (${user?.email}) 婉拒了您的專屬教練綁定申請。`;
            
            await supabase.from('notifications').insert([{
                title: '綁定申請結果',
                content: message,
                tag: '系統',
                target_email: targetEmail
            }]);

            alert(isAccepted ? '已同意綁定' : '已婉拒綁定');
            setSelectedMsg(null);
            fetchNotifications();
        } catch (err) {
            alert('處理失敗: ' + err.message);
        }
    };

    if (selectedMsg) {
        return (
            <div className="message-detail">
                <header className="detail-header">
                    <button className="back-btn" onClick={() => setSelectedMsg(null)}>
                        <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <h2 className="header-title">通知詳情</h2>
                    <div style={{ width: 44 }}></div>
                </header>

                <div className="detail-content">
                    <div className="msg-meta">
                        <span className={`msg-tag tag-${selectedMsg.tag}`}>{selectedMsg.tag}</span>
                        <span className="msg-time">{formatDate(selectedMsg.created_at)}</span>
                    </div>
                    <h1 className="msg-title">{selectedMsg.title}</h1>
                    <div className="msg-divider"></div>
                    <div className="msg-body">
                        {selectedMsg.content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    {selectedMsg.is_binding_request && (
                        <div className="binding-actions">
                            <button 
                                className="accept-btn"
                                onClick={() => handleBindingResponse(selectedMsg.binding_id, selectedMsg.student_email, true)}
                            >
                                <CheckCircle size={20} /> 同意綁定
                            </button>
                            <button 
                                className="reject-btn"
                                onClick={() => handleBindingResponse(selectedMsg.binding_id, selectedMsg.student_email, false)}
                            >
                                <XCircle size={20} /> 不同意
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
                    .message-detail {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        background-color: var(--background);
                        animation: slideIn 0.3s ease-out;
                    }
                    .detail-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 20px;
                        border-bottom: 1px solid var(--border);
                    }
                    .detail-content {
                        flex: 1;
                        padding: 24px 20px;
                        overflow-y: auto;
                    }
                    .msg-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    }
                    .msg-tag {
                        padding: 4px 10px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 700;
                    }
                    .tag-公告 { background-color: rgba(59, 130, 246, 0.1); color: #3B82F6; }
                    .tag-課程 { background-color: rgba(168, 85, 247, 0.1); color: #A855F7; }
                    .tag-活動 { background-color: rgba(255, 92, 0, 0.1); color: var(--primary); }
                    .tag-優惠 { background-color: rgba(16, 185, 129, 0.1); color: #10B981; }
                    .tag-系統 { background-color: rgba(239, 68, 68, 0.1); color: #EF4444; }
                    
                    .msg-time { font-size: 12px; color: var(--text-secondary); }
                    .msg-title { font-size: 22px; font-weight: 800; color: white; margin-bottom: 20px; line-height: 1.4; }
                    .msg-divider { height: 1px; background: var(--border); margin-bottom: 24px; }
                    .msg-body { font-size: 16px; color: #CBD5E1; line-height: 1.8; }
                    .msg-body p { margin-bottom: 12px; }
                    .binding-actions { 
                        display: flex; gap: 16px; margin-top: 30px; 
                        padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); 
                    }
                    .binding-actions button {
                        flex: 1; padding: 14px; border: none; border-radius: 12px;
                        font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .accept-btn { background: var(--primary); color: white; }
                    .accept-btn:active { transform: scale(0.95); opacity: 0.8; }
                    .reject-btn { background: rgba(255,255,255,0.05); color: #94A3B8; }
                    .reject-btn:active { transform: scale(0.95); background: rgba(255,255,255,0.1); }
                    @keyframes slideIn {
                        from { transform: translateX(30px); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="inbox-container">
            <header className="inbox-header">
                <div className="header-top">
                    <h2 className="title">我的信件夾</h2>
                    {onBack && <button className="close-btn" onClick={onBack}><X size={24} /></button>}
                </div>
                <div className="filter-bar">
                    <div className="filter-scroll">
                        {filters.map(f => (
                            <button
                                key={f}
                                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="inbox-list">
                {loading ? (
                    <div className="empty-state">
                        <div className="spinner"></div>
                        <p>正在讀取...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notif => (
                        <div key={notif.id} className={`notification-card ${!notif.is_read ? 'unread' : ''}`} onClick={() => handleMarkAsRead(notif)}>
                            <div className={`tag-indicator ${notif.tag}`}></div>
                            <div className="card-content">
                                <div className="card-top">
                                    <div className="tag-and-dot">
                                        <span className={`tag-text tag-${notif.tag}`}>{notif.tag}</span>
                                        {!notif.is_read && <span className="unread-dot-small"></span>}
                                    </div>
                                    <span className="time-text">{formatDate(notif.created_at)}</span>
                                </div>
                                <h3 className="card-title">{notif.title}</h3>
                                <p className="card-preview">{notif.content.substring(0, 40)}{notif.content.length > 40 ? '...' : ''}</p>
                            </div>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <InboxIcon size={48} color="rgba(255,255,255,0.1)" />
                        <p>尚無通知</p>
                    </div>
                )}
            </div>

            <style>{`
                .inbox-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background-color: var(--background);
                }
                .inbox-header {
                    padding: 20px 20px 10px 20px;
                    background-color: var(--background);
                    border-bottom: 1px solid var(--border);
                }
                .header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .title { font-size: 20px; font-weight: 800; color: white; }
                .close-btn { color: var(--text-secondary); background: none; }
                
                .filter-bar { padding-bottom: 10px; }
                .filter-scroll { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
                .filter-scroll::-webkit-scrollbar { display: none; }
                .filter-btn {
                    padding: 8px 18px;
                    border-radius: 20px;
                    background-color: rgba(255,255,255,0.05);
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                    border: 1px solid transparent;
                }
                .filter-btn.active {
                    background-color: var(--primary);
                    color: white;
                }
                
                .inbox-list {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                }
                .notification-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background-color: var(--secondary-bg);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border: 1px solid var(--border);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .notification-card:active { transform: scale(0.98); }
                .tag-indicator { width: 4px; height: 40px; border-radius: 2px; }
                .tag-indicator.公告 { background-color: #3B82F6; }
                .tag-indicator.課程 { background-color: #A855F7; }
                .tag-indicator.活動 { background-color: var(--primary); }
                .tag-indicator.優惠 { background-color: #10B981; }
                .tag-indicator.系統 { background-color: #EF4444; }
                
                .card-content { flex: 1; }
                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                .tag-text { font-size: 10px; font-weight: 800; }
                .tag-text.tag-公告 { color: #3B82F6; }
                .tag-text.tag-課程 { color: #A855F7; }
                .tag-text.tag-活動 { color: var(--primary); }
                .tag-text.tag-優惠 { color: #10B981; }
                .time-text { font-size: 11px; color: var(--text-secondary); }
                .tag-and-dot { display: flex; align-items: center; gap: 6px; }
                .unread-dot-small { width: 6px; height: 6px; background-color: #EF4444; border-radius: 50%; box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
                .notification-card.unread { background-color: rgba(255,255,255,0.02); border-left: 2px solid #EF4444; }
                .card-title { font-size: 15px; font-weight: 700; color: white; margin-bottom: 4px; }
                .notification-card.unread .card-title { font-weight: 800; color: #fff; }
                .card-preview { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
                
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 300px;
                    gap: 16px;
                    color: var(--text-secondary);
                }
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Inbox;
