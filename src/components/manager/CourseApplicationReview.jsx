import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, Filter, X, Send, Loader2, Calendar, Users, MapPin, User, Zap } from 'lucide-react';
import { supabase } from '../../supabase';

const CourseApplicationReview = ({ onUpdate }) => {
    const [apps, setApps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [coaches, setCoaches] = useState({});
    const [previewImage, setPreviewImage] = useState(null); // 新增燈箱狀態

    useEffect(() => {
        fetchApps();
        fetchCoaches();
    }, []);

    const fetchCoaches = async () => {
        try {
            // 同時抓取 Profile 與 Permissions 以獲得完整識別碼
            const { data: profiles } = await supabase.from('user_profiles').select('id, name, email');
            const { data: perms } = await supabase.from('user_permissions').select('user_uuid, user_id_string');
            
            const map = {};
            profiles?.forEach(p => {
                const pInfo = { ...p };
                // 1. 以 UUID (id) 作為鍵
                map[p.id] = pInfo;
                // 2. 以 Email 作為鍵 (備用)
                if (p.email) map[p.email] = pInfo;
                
                // 3. 找出對應的工號
                const perm = perms?.find(rm => rm.user_uuid === p.id);
                if (perm?.user_id_string) {
                    map[perm.user_id_string] = pInfo;
                }
            });
            setCoaches(map);
        } catch (err) {
            console.error('Fetch coaches error:', err);
        }
    };

    const fetchApps = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coach_schedule')
                .select('*')
                .or('status.eq.pending,status.eq.pending_deletion')
                .order('date', { ascending: true });
            
            if (error) throw error;
            setApps(data || []);
        } catch (err) {
            console.error('Fetch course apps error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (record, status) => {
        const isDeleteRequest = record.status === 'pending_deletion';

        if (status === 'rejected' && !rejectReason.trim()) {
            alert('不通過請填寫原因');
            return;
        }

        if (isDeleteRequest && status === 'approved' && !rejectReason.trim()) {
            // 用戶要求刪除通過也要寫原因
            alert('刪除通過請填寫原因 (回覆教練)');
            return;
        }

        setIsProcessing(true);
        try {
            if (isDeleteRequest && status === 'approved') {
                // 如果通過刪除申請 -> 直接刪除該課程
                const { error: deleteError } = await supabase
                    .from('coach_schedule')
                    .delete()
                    .eq('id', record.id);
                if (deleteError) throw deleteError;
            } else {
                // 如果是新課申請通過/不通過，或是刪除申請被拒絕 (恢復 approved)
                const newStatus = isDeleteRequest && status === 'rejected' ? 'approved' : status;
                const { error: updateError } = await supabase
                    .from('coach_schedule')
                    .update({
                        status: newStatus,
                        reject_reason: rejectReason || null
                    })
                    .eq('id', record.id);
                if (updateError) throw updateError;
            }

            // 發送通知給教練
            const coachId = record.coach_id;
            let statusLabel = '';
            let content = '';
            
            if (isDeleteRequest) {
                statusLabel = status === 'approved' ? '刪除申請通過' : '刪除申請被拒絕';
                content = status === 'approved'
                    ? `您的課程刪除申請【${record.category}】於 ${record.date} 已由管理員核准並移除。備註：${rejectReason}`
                    : `您的課程刪除申請【${record.category}】於 ${record.date} 已被拒絕。原因：${rejectReason}`;
            } else {
                statusLabel = status === 'approved' ? '已通過' : '未通過';
                content = status === 'approved' 
                    ? `您的課程申請【${record.category}】於 ${record.date} 已通過審核！` 
                    : `您的課程申請【${record.category}】於 ${record.date} 未通過。原因：${rejectReason}`;
            }

            const coach = coaches[coachId];
            const coachEmail = coach?.email;

            await supabase.from('notifications').insert({
                user_id: coachId,
                target_email: coachEmail,
                title: isDeleteRequest ? `課程刪除申請 ${status === 'approved' ? '已核准' : '不通過'}` : `課程申請 ${statusLabel}`,
                content: content,
                target_role: 'coach',
                tag: '系統'
            });

            alert('處理完成');
            setSelectedApp(null);
            setRejectReason('');
            fetchApps();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('處理失敗: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="course-app-review">
            <header className="manager-header">
                <div className="header-left">
                    <p className="sub-title">COACH MANAGEMENT</p>
                    <h2>課程申請審核</h2>
                </div>
            </header>

            <div className="review-list">
                {isLoading ? (
                    <div className="loader-box"><Loader2 className="spin" size={32} /> <p>載入申請中...</p></div>
                ) : apps.length === 0 ? (
                    <div className="empty-box">
                        <CheckCircle2 size={48} color="#10B981" />
                        <p>目前沒有待處理的課程申請</p>
                    </div>
                ) : (
                    apps.map(app => {
                        const coach = coaches[app.coach_id];
                        return (
                            <div key={app.id} className="app-card-v2">
                                <div className={`card-status-bar ${app.status}`}></div>
                                <div className="card-main">
                                    <div className="card-info">
                                        <div className="coach-brief">
                                            <div className="avatar-small">
                                                {coach?.name?.charAt(0) || <User size={16} />}
                                            </div>
                                            <div className="brief-text">
                                                <span className="coach-name">{coach?.name || `教練 (${app.coach_id.slice(0,5)})`}</span>
                                                <div className="flex-row gap-8">
                                                    <span className="apply-time">{new Date(app.created_at).toLocaleDateString()} 申請</span>
                                                    {app.status === 'pending_deletion' && <span className="delete-req-pill">申請刪除</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="course-summary-grid">
                                            <div className="summary-item">
                                                <Calendar size={14} />
                                                <span className="nowrap">{app.date}</span>
                                            </div>
                                            <div className="summary-item">
                                                <Clock size={14} />
                                                <span className="nowrap">{app.start_time.slice(0, 5)} - {app.end_time.slice(0, 5)}</span>
                                            </div>
                                            <div className="summary-item category">
                                                <Zap size={14} fill="#FF5C00" />
                                                <span className="cat-text">{app.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-actions">
                                        <button className="view-detail-btn" onClick={() => setSelectedApp(app)}>
                                            查看詳情並審核
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedApp && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <div className="header-title">
                                <h3>{selectedApp.status === 'pending_deletion' ? '課程刪除申請詳情' : '課程申請詳情'}</h3>
                                <span className={`status-pill ${selectedApp.status}`}>
                                    {selectedApp.status === 'pending_deletion' ? '申請刪除中' : '待審核'}
                                </span>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedApp(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <label className="section-label">基本資訊</label>
                                <div className="info-grid">
                                    <div className="info-row">
                                        <span className="label">教練姓名</span>
                                        <span className="val">{coaches[selectedApp.coach_id]?.name || '未知'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">課程類別</span>
                                        <span className="val highlight">{selectedApp.category}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">上課日期</span>
                                        <span className="val">{selectedApp.date}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">上課時段</span>
                                        <span className="val">{selectedApp.start_time.slice(0, 5)} - {selectedApp.end_time.slice(0, 5)}</span>
                                    </div>
                                    {selectedApp.status === 'pending_deletion' && (
                                        <div className="info-row deletion-reason-row">
                                            <span className="label highlight-red">教練刪除原因</span>
                                            <span className="val">{selectedApp.reject_reason || '無填寫原因'}</span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="label">學員人數</span>
                                        <span className="val">{selectedApp.student_count} 人</span>
                                    </div>
                                    <div className="info-row full">
                                        <span className="label">學員名單</span>
                                        <span className="val">{selectedApp.student_name || '未填寫'}</span>
                                    </div>
                                    <div className="info-row full">
                                        <span className="label">上課地點</span>
                                        <span className="val">{selectedApp.location || '場館內'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <label className="section-label">備註內容</label>
                                <div className="notes-display">
                                    {selectedApp.content || '無額外備註'}
                                </div>
                            </div>

                            {selectedApp.images && selectedApp.images.length > 0 && (
                                <div className="detail-section">
                                    <label className="section-label">證明照片</label>
                                    <div className="image-preview-row">
                                        {selectedApp.images.map((img, i) => (
                                            <div key={i} className="preview-img-box" onClick={() => setPreviewImage(img)}>
                                                <img src={img} alt="proof" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <div className="reason-field">
                                <label>{selectedApp.status === 'pending_deletion' ? '回覆教練原因 (必填)' : '不通過原因 (若拒絕請必填)'}</label>
                                <textarea
                                    className="reject-textarea"
                                    placeholder={selectedApp.status === 'pending_deletion' ? "請在此處回覆教練..." : "不通過原因..."}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="action-btns">
                                <button
                                    className="btn-fail"
                                    onClick={() => handleAction(selectedApp, 'rejected')}
                                    disabled={isProcessing}
                                >
                                    <XCircle size={18} />
                                    <span>{selectedApp.status === 'pending_deletion' ? '拒絕刪除' : '不通過'}</span>
                                </button>
                                <button
                                    className="btn-pass"
                                    onClick={() => handleAction(selectedApp, 'approved')}
                                    disabled={isProcessing}
                                >
                                    <CheckCircle2 size={18} />
                                    <span>{selectedApp.status === 'pending_deletion' ? '核准刪除' : '核准通過'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 照片大圖燈箱 */}
            {previewImage && (
                <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="lightbox-content">
                        <img src={previewImage} alt="Large proof" />
                        <button className="lightbox-close"><X size={32} /></button>
                    </div>
                </div>
            )}

            <style>{`
                .course-app-review { padding: 32px; height: 100%; overflow-y: auto; background-color: #0A0A0B; color: white; }
                .manager-header { margin-bottom: 32px; }
                .sub-title { font-size: 11px; font-weight: 800; color: #FF5C00; letter-spacing: 1.5px; margin-bottom: 4px; }
                .manager-header h2 { font-size: 28px; font-weight: 900; }

                .review-list { display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
                .app-card-v2 { background: #18181B; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; display: flex; transition: 0.2s; }
                .app-card-v2:hover { border-color: rgba(255,92,0,0.3); transform: translateX(4px); }
                .card-status-bar { width: 4px; }
                .card-status-bar.pending { background: #FFB800; box-shadow: 0 0 10px rgba(255, 184, 0, 0.4); }
                .card-main { flex: 1; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
                
                .coach-brief { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .avatar-small { width: 36px; height: 36px; background: #2D2D30; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #FF5C00; border: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
                .brief-text { display: flex; flex-direction: column; overflow: hidden; }
                .coach-name { font-size: 16px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .apply-time { font-size: 11px; color: #666; }

                .course-summary-grid { display: grid; grid-template-columns: auto auto auto; gap: 16px; align-items: center; width: fit-content; }
                .summary-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #999; font-weight: 600; white-space: nowrap; }
                .summary-item.category { 
                    background: rgba(255, 92, 0, 0.1); 
                    padding: 4px 10px; 
                    border-radius: 8px; 
                    color: #FF5C00; 
                    border: 1px solid rgba(255, 92, 0, 0.2);
                }
                .cat-text { font-weight: 800; }
                .nowrap { white-space: nowrap; }

                .view-detail-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .view-detail-btn:hover { background: #FF5C00; border-color: #FF5C00; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #121214; width: 100%; max-width: 520px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
                .modal-header { padding: 24px 30px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .header-title { display: flex; align-items: center; gap: 12px; }
                .status-pill { font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 100px; }
                .status-pill.pending { background: rgba(255, 184, 0, 0.1); color: #FFB800; border: 1px solid rgba(255, 184, 0, 0.2); }
                
                .modal-body { padding: 30px; display: flex; flex-direction: column; gap: 28px; }
                .section-label { font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; display: block; }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .info-row { display: flex; flex-direction: column; gap: 4px; }
                .info-row.full { grid-column: span 2; }
                .info-row .label { font-size: 12px; color: #555; font-weight: 600; }
                .info-row .val { font-size: 15px; font-weight: 700; color: white; }
                .info-row .val.highlight { color: #FF5C00; }

                .notes-display { background: #18181B; padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03); font-size: 14px; line-height: 1.6; color: #BBB; }

                .image-preview-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
                .preview-img-box { width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; cursor: pointer; }
                .preview-img-box img { width: 100%; height: 100%; object-fit: cover; transition: 0.2s; }
                .preview-img-box:hover img { transform: scale(1.1); }

                .lightbox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 40px; }
                .lightbox-content { position: relative; max-width: 90%; max-height: 90%; display: flex; align-items: center; justify-content: center; }
                .lightbox-content img { max-width: 100%; max-height: 90vh; border-radius: 12px; object-fit: contain; }
                .lightbox-close { position: fixed; top: 30px; right: 30px; background: none; border: none; color: white; cursor: pointer; }

                .reject-textarea { width: 100%; background: #000; border: 1.5px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; color: white; font-size: 14px; outline: none; transition: 0.2s; margin-bottom: 20px; }
                .reject-textarea:focus { border-color: #FF5C00; background: #080808; }

                .action-btns { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; }
                .action-btns button { padding: 16px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 800; border: none; cursor: pointer; transition: 0.2s; }
                .btn-fail { background: rgba(18, 18, 18, 0.6); border: 1px solid #333 !important; color: #666; }
                .btn-fail:hover { background: rgba(239, 68, 68, 0.1); color: #EF4444; border-color: #EF4444 !important; }
                .btn-pass { background: #FF5C00; color: white; box-shadow: 0 10px 20px rgba(255, 92, 0, 0.3); }
                .btn-pass:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(255, 92, 0, 0.4); }

                .loader-box, .empty-box { padding: 80px 0; text-align: center; color: #666; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

                .delete-req-pill {
                    background: rgba(225, 29, 72, 0.1);
                    color: #E11D48;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 2px 8px;
                    border-radius: 4px;
                    border: 1px solid rgba(225, 29, 72, 0.2);
                }
                .flex-row.gap-8 { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
                .status-pill.pending_deletion { background: rgba(225, 29, 72, 0.1); color: #E11D48; }
                .card-status-bar.pending_deletion { background: #E11D48; }
                .highlight-red { color: #E11D48 !important; font-weight: 800; }
                .deletion-reason-row { background: rgba(225, 29, 72, 0.03); border-radius: 8px; padding: 12px !important; margin-top: 10px; border: 1px dashed rgba(225, 29, 72, 0.2); }
            `}</style>
        </div>
    );
};

export default CourseApplicationReview;
