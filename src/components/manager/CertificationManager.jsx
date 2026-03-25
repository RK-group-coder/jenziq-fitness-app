import React, { useState, useEffect } from 'react';
import {
    Clock, CheckCircle2, XCircle, AlertCircle,
    X, Send, Loader2, Check, Award, Eye, FileText
} from 'lucide-react';
import { supabase } from '../../supabase';

const CertificationManager = () => {
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
                .from('coach_certifications')
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
            alert('駁回請務必填寫原因');
            return;
        }

        try {
            setIsSubmitting(true);
            const status = actionType === 'approve' ? '核准' : '未通過';

            // 1. 更新狀態
            const { error: updateError } = await supabase
                .from('coach_certifications')
                .update({
                    status,
                    admin_feedback: actionType === 'reject' ? feedback : null
                })
                .eq('id', selectedRequest.id);

            if (updateError) throw updateError;

            if (actionType === 'approve' && selectedRequest.xp_reward > 0) {
                // Fetch current XP
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('total_xp')
                    .eq('email', selectedRequest.coach_email)
                    .single();
                
                if (profile) {
                    const newXp = (profile.total_xp || 0) + selectedRequest.xp_reward;
                    await supabase
                        .from('user_profiles')
                        .update({ total_xp: newXp })
                        .eq('email', selectedRequest.coach_email);
                }
            }

            // 2. 發送通知
            const notificationData = {
                title: actionType === 'approve' ? '證照審核通過通知' : '證照審核未通過通知',
                content: actionType === 'approve'
                    ? `您的證照 [${selectedRequest.cert_name}] 已審核通過。${selectedRequest.xp_reward > 0 ? `\n恭喜獲得 ${selectedRequest.xp_reward} XP！` : ''}`
                    : `您的證照 [${selectedRequest.cert_name}] 審核未通過。\n原因：${feedback}`,
                target_role: 'coach',
                target_email: selectedRequest.coach_email,
                tag: '系統'
            };

            if (selectedRequest.coach_id) {
                notificationData.user_id = selectedRequest.coach_id;
            }

            await supabase.from('notifications').insert(notificationData);

            alert(actionType === 'approve' ? '已核准證照' : '已駁回並發送通知');
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
        { label: '待處理', val: requests.filter(r => r.status === '待審核').length, icon: Clock, color: '#FFB800' },
        { label: '已核准', val: requests.filter(r => r.status === '核准').length, icon: CheckCircle2, color: '#10B981' },
        { label: '未通過', val: requests.filter(r => r.status === '未通過').length, icon: XCircle, color: '#EF4444' },
    ];

    return (
        <div className="cert-manager">
            <header className="page-header">
                <h2 className="page-title">證照審核管理</h2>
                <p className="page-subtitle">核可教練專業證照與專業資歷</p>

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
                <div className="request-list">
                    {isLoading ? (
                        <div className="loading-state"><Loader2 className="spin" /> 讀取中...</div>
                    ) : requests.length === 0 ? (
                        <div className="empty-state">尚無證照申請</div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="request-card">
                                <div className="req-header">
                                    <div className="coach-brief">
                                        <div className="mini-avatar">{req.coach_name.charAt(0)}</div>
                                        <div className="name-wrap">
                                            <span className="name">{req.coach_name}</span>
                                            <span className="cert-badge">{req.cert_name}</span>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${req.status === '核准' ? 'approved' : req.status === '未通過' ? 'rejected' : 'pending'}`}>
                                        {req.status}
                                    </div>
                                </div>

                                <div className="req-body">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-lbl">發證機構</span>
                                            <span className="info-val">{req.organization}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-lbl">獲得日期</span>
                                            <span className="info-val">{req.obtained_date}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-lbl">證照類別與XP</span>
                                            <span className="info-val" style={{ color: '#F59E0B' }}>
                                                {req.category || '未分類'} 
                                                {req.xp_reward > 0 ? ` (+${req.xp_reward} XP)` : ''}
                                            </span>
                                        </div>
                                        {req.expiry_date && (
                                            <div className="info-item">
                                                <span className="info-lbl">到期日期</span>
                                                <span className="info-val">{req.expiry_date}</span>
                                            </div>
                                        )}
                                    </div>

                                    {req.proof_images && req.proof_images.length > 0 && (
                                        <div className="proof-gallery">
                                            {req.proof_images.map((img, i) => (
                                                <div key={i} className="gallery-img" onClick={() => window.open(img, '_blank')}>
                                                    <img src={img} alt="proof" />
                                                    <div className="img-overlay"><Eye size={16} /></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="req-footer">
                                    <div className="apply-time">提交時間：{new Date(req.created_at).toLocaleString()}</div>
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
                                                <Check size={16} /> 核准
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setActionType('reject');
                                                    setIsActionModalOpen(true);
                                                }}
                                            >
                                                <X size={16} /> 駁回
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
                            <h3>{actionType === 'approve' ? '核准證照' : '駁回證照'}</h3>
                            <button onClick={() => setIsActionModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-info">
                                教練：{selectedRequest.coach_name} <br/> 
                                證照：{selectedRequest.cert_name} <br/>
                                類別：{selectedRequest.category || '未分類'} (+{selectedRequest.xp_reward || 0} XP)
                            </p>

                            {actionType === 'reject' ? (
                                <div className="feedback-area">
                                    <label>駁回原因 (教練會收到此通知)</label>
                                    <textarea
                                        rows="4"
                                        placeholder="例如：照片模糊、證照已過期、非認可之發證機構..."
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                            ) : (
                                <p className="confirm-text">確定要核准這筆證照審核嗎？核准後將正式生效。</p>
                            )}

                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={() => setIsActionModalOpen(false)}>取消</button>
                                <button
                                    className={`submit-btn ${actionType === 'approve' ? 'approve' : 'reject'}`}
                                    onClick={handleAction}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="spin" size={18} /> : (actionType === 'approve' ? '確認核准' : '確認駁回')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .cert-manager { display: flex; flex-direction: column; height: 100%; }
                .page-header { padding: 24px 20px; }
                .page-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 4px; }
                .page-subtitle { font-size: 12px; color: var(--text-secondary); margin-bottom: 24px; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .stat-box { background-color: var(--card-bg); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid var(--border); }
                .stat-icon-bg { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
                .stat-val { font-size: 16px; font-weight: 800; color: white; margin-bottom: 2px; }
                .stat-lbl { font-size: 10px; color: var(--text-secondary); }

                .manager-scroll-content { flex: 1; overflow-y: auto; padding: 0 16px 20px; scrollbar-width: none; }
                .request-list { display: flex; flex-direction: column; gap: 16px; }
                .request-card { background-color: var(--card-bg); border-radius: 16px; padding: 20px; border: 1px solid var(--border); }
                .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .coach-brief { display: flex; gap: 12px; align-items: center; }
                .mini-avatar { width: 36px; height: 36px; background-color: var(--primary); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
                .name-wrap { display: flex; flex-direction: column; }
                .name { font-size: 15px; font-weight: 700; color: white; }
                .cert-badge { font-size: 11px; color: #3B82F6; font-weight: 600; }

                .status-badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
                .status-badge.pending { color: #FFB800; background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.2); }
                .status-badge.approved { color: #10B981; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
                .status-badge.rejected { color: #EF4444; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }

                .req-body { margin-bottom: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
                .info-item { display: flex; flex-direction: column; gap: 4px; }
                .info-lbl { font-size: 11px; color: var(--text-secondary); }
                .info-val { font-size: 13px; color: white; font-weight: 600; }
                
                .proof-gallery { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
                .gallery-img { width: 80px; height: 80px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); position: relative; flex-shrink: 0; }
                .gallery-img img { width: 100%; height: 100%; object-fit: cover; }
                .img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.2s; }
                .gallery-img:hover .img-overlay { opacity: 1; }

                .req-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
                .apply-time { font-size: 11px; color: var(--text-secondary); }
                .action-buttons { display: flex; gap: 8px; }
                .btn-approve { background: #10B981; color: white; border: none; padding: 8px 16px; border-radius: 10px; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }
                .btn-reject { background: transparent; border: 1px solid #EF4444; color: #EF4444; padding: 8px 16px; border-radius: 10px; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }

                /* Modal */
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
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default CertificationManager;
