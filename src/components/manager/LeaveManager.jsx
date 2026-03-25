import React, { useState, useEffect } from 'react';
import {
    Clock, CheckCircle2, XCircle, AlertCircle,
    ChevronRight, User, Image as ImageIcon, X,
    Send, Loader2, Check, FileText
} from 'lucide-react';
import { supabase } from '../../supabase';

const LeaveManager = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('coach_leaves')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async () => {
        if (actionType === 'reject' && !feedback) {
            alert('退件請務必填寫原因');
            return;
        }

        try {
            setIsSubmitting(true);
            const status = actionType === 'approve' ? '已通過' : '已退件';

            // 1. 更新請假狀態
            const { error: updateError } = await supabase
                .from('coach_leaves')
                .update({
                    status,
                    admin_feedback: actionType === 'reject' ? feedback : null
                })
                .eq('id', selectedRequest.id);

            if (updateError) throw updateError;

            if (actionType === 'reject') {
                console.log('正在嘗試發送退件通知 to coach_id:', selectedRequest.coach_id);
                const notificationData = {
                    title: '請假申請退件通知',
                    content: `您的請假申請 (${selectedRequest.leave_type}) 已被退件。\n原因：${feedback}`,
                    target_role: 'coach',
                    tag: '系統'
                };

                // 只有當 coach_id 存在時才加入 user_id，否則不傳（讓資料庫使用 null 或默認值）
                if (selectedRequest.coach_id) {
                    notificationData.user_id = selectedRequest.coach_id;
                }

                const { error: notifyError } = await supabase.from('notifications').insert(notificationData);

                if (notifyError) {
                    console.error('發送通知到資料庫失敗:', notifyError);
                    alert(`⚠️ 申請已退件，但通知發送失敗：${notifyError.message}\n請檢查 Supabase notifications 表結構是否包含 target_role 和 tag 欄位。`);
                }
            }

            alert(actionType === 'approve' ? '已核准申請' : '已退件並發送通知');
            setIsActionModalOpen(false);
            setSelectedRequest(null);
            setFeedback('');
            fetchRequests();
        } catch (err) {
            console.error('Action error:', err);
            alert(`操作失敗: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = [
        { label: '本月申請', val: requests.length, icon: Clock, color: '#3B82F6' },
        { label: '待審核', val: requests.filter(r => r.status === '待審核').length, icon: AlertCircle, color: '#FFB800' },
        { label: '已批准', val: requests.filter(r => r.status === '已通過').length, icon: CheckCircle2, color: '#10B981' },
        { label: '已拒絕', val: requests.filter(r => r.status === '已退件').length, icon: XCircle, color: '#EF4444' },
    ];

    return (
        <div className="leave-manager">
            <header className="page-header">
                <h2 className="page-title">請假管理</h2>
                <p className="page-subtitle">審理教練請假與課務代理</p>

                <div className="stats-grid">
                    {stats.map(s => (
                        <div key={s.label} className="stat-box">
                            <div className="stat-icon-bg" style={{ backgroundColor: `${s.color}15` }}>
                                <s.icon size={16} color={s.color} />
                            </div>
                            <div className="stat-val">{s.val}</div>
                            <div className="stat-lbl">{s.label}</div>
                        </div>
                    ))}
                </div>
            </header>

            <div className="manager-scroll-content">
                {requests.filter(r => r.status === '待審核').length > 0 && (
                    <div className="alert-banner">
                        <AlertCircle size={16} />
                        <span>您有 {requests.filter(r => r.status === '待審核').length} 筆請假申請等待處理。</span>
                    </div>
                )}

                <div className="request-list">
                    {isLoading ? (
                        <div className="loading-state"><Loader2 className="spin" /> 讀取中...</div>
                    ) : requests.length === 0 ? (
                        <div className="empty-state">尚無請假申請</div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="request-card">
                                <div className="req-header">
                                    <div className="coach-brief">
                                        <div className="mini-avatar">{req.coach_name.charAt(0)}</div>
                                        <div className="name-wrap">
                                            <span className="name">{req.coach_name}</span>
                                            <span className={`leave-type ${req.status === '已通過' ? 'approved' : req.status === '已退件' ? 'rejected' : 'pending'}`}>
                                                {req.leave_type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${req.status === '已通過' ? 'approved' : req.status === '已退件' ? 'rejected' : 'pending'}`}>
                                        {req.status}
                                    </div>
                                </div>

                                <div className="req-body">
                                    <div className="req-time">提交時間：{new Date(req.created_at).toLocaleString()}</div>
                                    <p className="req-reason">{req.reason}</p>

                                    {req.proof_images && req.proof_images.length > 0 && (
                                        <div className="proof-gallery">
                                            {req.proof_images.map((img, i) => (
                                                <div key={i} className="gallery-img" onClick={() => window.open(img, '_blank')}>
                                                    <img src={img} alt="proof" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="req-footer">
                                    <div className="duration-info">
                                        <span className="days">{new Date(req.start_at).toLocaleDateString()}</span>
                                        <span className="target-date">~ {new Date(req.end_at).toLocaleDateString()}</span>
                                    </div>
                                    {req.status === '待審核' && (
                                        <div className="action-buttons">
                                            <button
                                                className="btn-approve"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setActionType('approve');
                                                    setIsActionModalOpen(true);
                                                }}
                                            >
                                                <Check size={16} /> 批准
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setActionType('reject');
                                                    setIsActionModalOpen(true);
                                                }}
                                            >
                                                <X size={16} /> 拒絕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {isActionModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{actionType === 'approve' ? '核准請假' : '退件處理'}</h3>
                            <button onClick={() => setIsActionModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-info">教練：{selectedRequest.coach_name} | 假別：{selectedRequest.leave_type}</p>

                            {actionType === 'reject' ? (
                                <div className="feedback-area">
                                    <label>退件原因 (教練會收到此通知)</label>
                                    <textarea
                                        rows="4"
                                        placeholder="請填寫退件理由，例如：證明文件不足、當日人力不足..."
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                            ) : (
                                <p className="confirm-text">確定要核准這筆請假申請嗎？</p>
                            )}

                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={() => setIsActionModalOpen(false)}>取消</button>
                                <button
                                    className={`submit-btn ${actionType === 'approve' ? 'approve' : 'reject'}`}
                                    onClick={handleAction}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="spin" size={18} /> : (actionType === 'approve' ? '確認核准' : '確認退件')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .leave-manager { display: flex; flex-direction: column; height: 100%; }
                .page-header { padding: 24px 20px; }
                .page-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 4px; }
                .page-subtitle { font-size: 12px; color: var(--text-secondary); margin-bottom: 24px; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .stat-box { background-color: var(--card-bg); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid var(--border); }
                .stat-icon-bg { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
                .stat-val { font-size: 16px; font-weight: 800; color: white; margin-bottom: 2px; }
                .stat-lbl { font-size: 10px; color: var(--text-secondary); white-space: nowrap; }

                .manager-scroll-content { flex: 1; overflow-y: auto; padding: 0 16px 20px; scrollbar-width: none; }
                .alert-banner { background-color: rgba(255, 184, 0, 0.1); color: #FFB800; border: 1px solid rgba(255, 184, 0, 0.2); border-radius: 12px; padding: 12px 16px; font-size: 11px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                
                .request-list { display: flex; flex-direction: column; gap: 16px; }
                .request-card { background-color: var(--card-bg); border-radius: 16px; padding: 20px; border: 1px solid var(--border); }
                .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .coach-brief { display: flex; gap: 12px; align-items: center; }
                .mini-avatar { width: 36px; height: 36px; background-color: var(--primary); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
                .name-wrap { display: flex; flex-direction: column; }
                .name { font-size: 15px; font-weight: 700; color: white; }
                .leave-type { font-size: 11px; font-weight: 600; }
                .leave-type.pending { color: #FFB800; }
                .leave-type.approved { color: #10B981; }
                .leave-type.rejected { color: #EF4444; }

                .status-badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
                .status-badge.pending { color: #FFB800; background: rgba(255,184,0,0.1); border-color: rgba(255,184,0,0.2); }
                .status-badge.approved { color: #10B981; background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.2); }
                .status-badge.rejected { color: #EF4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); }
                
                .req-body { margin-bottom: 20px; }
                .req-time { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }
                .req-reason { font-size: 13px; color: white; line-height: 1.5; margin-bottom: 12px; }
                
                .proof-gallery { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; }
                .gallery-img { width: 60px; height: 60px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); flex-shrink: 0; }
                .gallery-img img { width: 100%; height: 100%; object-fit: cover; }

                .req-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
                .duration-info { display: flex; flex-direction: column; }
                .days { font-size: 14px; font-weight: 800; color: white; }
                .target-date { font-size: 10px; color: var(--text-secondary); }

                .action-buttons { display: flex; gap: 8px; }
                .btn-approve { background: #10B981; color: white; border: none; padding: 8px 16px; border-radius: 10px; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }
                .btn-reject { background: transparent; border: 1px solid #EF4444; color: #EF4444; padding: 8px 16px; border-radius: 10px; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }

                /* Action Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 2500; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #1a1a1b; width: 100%; max-width: 400px; border-radius: 20px; border: 1px solid var(--border); overflow: hidden; }
                .modal-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
                .modal-body { padding: 20px; }
                .modal-info { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }
                .feedback-area { display: flex; flex-direction: column; gap: 10px; }
                .feedback-area label { font-size: 13px; color: white; font-weight: 600; }
                .feedback-area textarea { background: #000; border: 1px solid var(--border); border-radius: 12px; padding: 12px; color: white; outline: none; }
                
                .modal-footer { display: flex; gap: 10px; margin-top: 24px; }
                .cancel-btn { flex: 1; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.05); color: white; font-weight: 600; }
                .submit-btn { flex: 2; padding: 12px; border-radius: 12px; color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .submit-btn.approve { background: #10B981; }
                .submit-btn.reject { background: #EF4444; }
                
                .loading-state, .empty-state { padding: 80px 0; text-align: center; color: var(--text-secondary); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default LeaveManager;
