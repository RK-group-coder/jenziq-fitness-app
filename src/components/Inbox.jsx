import React, { useState, useEffect } from 'react';
import { Mail, Clock, ChevronRight, X, Inbox as InboxIcon, Filter, CheckCircle, XCircle, QrCode, RefreshCw, CreditCard as CardIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { getPeriodicCheckoutPayload, redirectToECPay } from '../utils/ecpay_service';
import { QRCodeCanvas } from 'qrcode.react';

const Inbox = ({ role = 'student', onBack, user, onUnreadChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [activeFilter, setActiveFilter] = useState('全部');
    const [authEnrollments, setAuthEnrollments] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filters = ['全部', '繳費', '活動', '課程', '公告', '優惠', '系統'];

    useEffect(() => {
        fetchNotifications();
    }, [role, user]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const myEmail = user?.email?.toLowerCase() || '';

            let filteredByRole = (data || []).filter(notif => {
                const target = notif.target_role || notif.role || 'all';
                const tEmail = notif.target_email?.toLowerCase();
                const uId = notif.user_id;

                if (tEmail) return tEmail === myEmail;
                if (uId) return uId === user?.id || uId === user?.userIdString;
                
                if (target === 'coach' && !uId && !tEmail && (notif.title?.includes('通過') || notif.title?.includes('駁回') || notif.title?.includes('退件'))) {
                    return false;
                }
                return target === role || target === 'all';
            });

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

    const fetchAuthEnrollments = async (courseId) => {
        if (!courseId) return;
        setIsRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('student_bookings')
                .select('*')
                .eq('course_id', courseId);
            if (error) throw error;
            setAuthEnrollments(data || []);
        } catch (err) {
            console.error('Fetch Auth Enrollments Error:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleMarkAsRead = async (msg) => {
        const AUTH_MARKER_REGEX = /\[\[AUTH_COURSE_ID[:\s]*([^\]\s]*?)\]\]/i;
        const authMatch = msg?.content?.match(AUTH_MARKER_REGEX);
        const authCourseId = authMatch ? authMatch[1]?.trim() : null;

        if (msg.is_read || msg.is_binding_request) {
            setSelectedMsg(msg);
            if (authCourseId) fetchAuthEnrollments(authCourseId);
            return;
        }

        try {
            setNotifications(prev => prev.map(n => n.id === msg.id ? { ...n, is_read: true } : n));
            if (onUnreadChange) {
                const currentUnread = notifications.filter(n => n.id !== msg.id && !n.is_read).length;
                onUnreadChange(currentUnread);
            }
            setSelectedMsg({ ...msg, is_read: true });
            if (authCourseId) fetchAuthEnrollments(authCourseId);
            await supabase.from('notifications').update({ is_read: true }).eq('id', msg.id);
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    };

    const handleBindingResponse = async (bindingId, studentEmail, isAccepted) => {
        try {
            const status = isAccepted ? 'accepted' : 'rejected';
            const { error } = await supabase.from('coach_bindings').update({ status }).eq('id', bindingId);
            if (error) throw error;

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
        const AUTH_MARKER_REGEX = /\[\[AUTH_COURSE_ID[:\s]*([^\]\s]*?)\]\]/i;
        const authMatch = selectedMsg.content?.match(AUTH_MARKER_REGEX);
        const authCourseId = authMatch ? authMatch[1]?.trim() : null;

        return (
            <div className="message-detail">
                <header className="detail-header">
                    <button className="back-btn" onClick={() => setSelectedMsg(null)}>
                        <ChevronRight size={24} color="white" strokeWidth={3} style={{ transform: 'rotate(180deg)' }} />
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
                        {(selectedMsg.content || '').split(/\[\[AUTH_COURSE_ID[:\s]*.*?\]\]/i)[0].split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>

                    {(selectedMsg.tag === '繳費' || (selectedMsg.tag === '公告' && (selectedMsg.title?.includes('繳費') || selectedMsg.content?.includes('應繳金額')))) && (
                        <div className="payment-action-card">
                            <div className="p-header">
                                <CardIcon size={20} />
                                <span>線上繳費終端</span>
                            </div>
                            <div className="p-details">
                                <div className="p-row">
                                    <span className="p-label">應繳總額</span>
                                    <span className="p-val">NT$ {selectedMsg.content?.match(/NT\$ (\d+)/)?.[1] || '---'}</span>
                                </div>
                                <p className="p-hint">點擊下方按鈕將對轉至綠界科技安全支付頁面</p>
                            </div>
                            <button className="pay-now-btn" onClick={async () => {
                                const match = selectedMsg.content?.match(/NT\$\s*(\d+)/i);
                                const amount = match ? Number(match[1]) : 0;
                                if (amount > 0) {
                                    try {
                                        const payload = await getPeriodicCheckoutPayload({ name: selectedMsg.title, price: amount, months: 1 }, user);
                                        redirectToECPay(payload);
                                    } catch (err) {
                                        alert('啟動金流失敗：' + err.message);
                                    }
                                } else {
                                    alert('金額解析錯誤');
                                }
                            }}>
                                <CardIcon size={18} /> 立即線上繳費
                            </button>
                        </div>
                    )}

                    {authCourseId && (
                        <div className="attendance-auth-card">
                            <div className="auth-header">
                                <QrCode size={20} />
                                <span>點名授權控制台</span>
                            </div>
                            <div className="auth-qr-section">
                                <div className="auth-qr-wrapper">
                                    <QRCodeCanvas value={JSON.stringify({ type: 'attendance', courseId: authCourseId })} size={180} level={"H"} includeMargin={true} />
                                </div>
                                <p>請向學員出示此條碼進行簽到</p>
                            </div>
                            <div className="auth-list-section">
                                <div className="list-top">
                                    <h4>即時報到狀況 ({ (authEnrollments || []).filter(e => e && ['已點名', '已到'].includes(e.status)).length } / { (authEnrollments || []).length })</h4>
                                    <button onClick={() => fetchAuthEnrollments(authCourseId)} disabled={isRefreshing}>
                                        <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                                    </button>
                                </div>
                                <div className="auth-scroll-list">
                                    {(!authEnrollments || authEnrollments.length === 0) ? <div className="empty">尚無學員預約</div> :
                                     authEnrollments.map((s, i) => (
                                        <div key={i} className="auth-st-row">
                                            <span>{s.student_name}</span>
                                            <span className={`status-pill ${(['已點名', '已到'].includes(s.status)) ? 'done' : 'pending'}`}>
                                                {(['已點名', '已到'].includes(s.status)) ? '已完成' : '未點名'}
                                            </span>
                                        </div>
                                     ))
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMsg.is_binding_request && (
                        <div className="binding-actions">
                            <button className="accept-btn" onClick={() => handleBindingResponse(selectedMsg.binding_id, selectedMsg.student_email, true)}>
                                <CheckCircle size={20} /> 同意綁定
                            </button>
                            <button className="reject-btn" onClick={() => handleBindingResponse(selectedMsg.binding_id, selectedMsg.student_email, false)}>
                                <XCircle size={20} /> 不同意
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
                    .message-detail { display: flex; flex-direction: column; height: 100%; background-color: var(--background); }
                    .detail-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
                    .detail-content { flex: 1; padding: 24px 20px; overflow-y: auto; }
                    .msg-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                    .msg-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; opacity: 0.8; }
                    .tag-公告 { background-color: rgba(59, 130, 246, 0.2); color: #3B82F6; }
                    .tag-課程 { background-color: rgba(168, 85, 247, 0.2); color: #A855F7; }
                    .tag-活動 { background-color: rgba(255, 92, 0, 0.2); color: var(--primary); }
                    .tag-優惠 { background-color: rgba(16, 185, 129, 0.2); color: #10B981; }
                    .tag-系統 { background-color: rgba(239, 68, 68, 0.2); color: #EF4444; }
                    .msg-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 16px; line-height: 1.4; }
                    .msg-divider { height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 20px; }
                    .msg-body { font-size: 15px; color: #CBD5E1; line-height: 1.8; }
                    .msg-body p { margin-bottom: 8px; }
                    .attendance-auth-card { background: #1E293B; border-radius: 20px; border: 1px solid rgba(59, 130, 246, 0.3); padding: 20px; margin-top: 24px; display: flex; flex-direction: column; gap: 20px; }
                    .auth-header { display: flex; align-items: center; gap: 10px; color: #3b82f6; font-weight: 800; font-size: 13px; }
                    .auth-qr-section { text-align: center; }
                    .auth-qr-wrapper { background: white; padding: 10px; border-radius: 12px; display: inline-block; margin-bottom: 8px; }
                    .auth-list-section { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 16px; }
                    .list-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                    .auth-scroll-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                    .auth-st-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 10px; }
                    .status-pill { font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: 800; }
                    .status-pill.done { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                    .status-pill.pending { background: rgba(255,255,255,0.05); color: #64748b; }
                    .binding-actions { display: flex; gap: 16px; margin-top: 30px; }
                    .binding-actions button { flex: 1; padding: 14px; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
                    .accept-btn { background: var(--primary); color: white; }
                    .reject-btn { background: rgba(255,255,255,0.05); color: #94A3B8; }
                    .payment-action-card { background: linear-gradient(135deg, rgba(255, 122, 0, 0.1), rgba(255, 122, 0, 0.02)); border: 1px solid rgba(255, 122, 0, 0.3); border-radius: 20px; padding: 24px; margin-top: 30px; display: flex; flex-direction: column; gap: 20px; }
                    .p-header { color: #FF7A00; font-weight: 800; font-size: 12px; }
                    .p-val { font-size: 28px; font-weight: 900; color: white; }
                    .pay-now-btn { background: #FF7A00; color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 900; cursor: pointer; }
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="inbox-container">
            <header className="inbox-header">
                <div className="header-top">
                    <h2 className="title">我的信件夾</h2>
                    {onBack && <button className="close-btn" onClick={onBack}><X size={24} color="white" strokeWidth={3} /></button>}
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
                ) : (notifications || []).filter(n => activeFilter === '全部' || n.tag === activeFilter).length > 0 ? (
                    (notifications || []).filter(n => activeFilter === '全部' || n.tag === activeFilter).map(notif => (
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
                                <p className="card-preview">{(notif.content || '').replace(/\[\[AUTH_COURSE_ID[:\s]*.*?\]\]/i, '').substring(0, 40)}...</p>
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
                .inbox-container { height: 100%; display: flex; flex-direction: column; background-color: var(--background); }
                .inbox-header { padding: 20px; border-bottom: 1px solid var(--border); }
                .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: 800; color: white; }
                .close-btn { background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: opacity 0.2s; }
                .close-btn:hover { opacity: 1; }
                .filter-scroll { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
                .filter-btn { padding: 8px 18px; border-radius: 20px; background: rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 12px; font-weight: 700; border: none; cursor: pointer; }
                .filter-btn.active { background: var(--primary); color: white; }
                .inbox-list { flex: 1; padding: 16px; overflow-y: auto; }
                .notification-card { display: flex; gap: 16px; background: var(--secondary-bg); border-radius: 16px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--border); cursor: pointer; }
                .tag-indicator { width: 4px; height: 40px; border-radius: 2px; }
                .tag-indicator.公告 { background: #3B82F6; }
                .tag-indicator.活動 { background: var(--primary); }
                .tag-indicator.課程 { background: #A855F7; }
                .tag-indicator.系統 { background: #EF4444; }
                .card-title { font-size: 15px; font-weight: 700; color: white; margin-bottom: 4px; }
                .unread-dot-small { width: 6px; height: 6px; background: #EF4444; border-radius: 50%; }
                .spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Inbox;
