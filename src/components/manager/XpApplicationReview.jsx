import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, Filter, Image as ImageIcon, X, Send, Loader2, Award, Zap } from 'lucide-react';
import { supabase } from '../../supabase';

const XpApplicationReview = ({ onUpdate }) => {
    const [apps, setApps] = useState([]);
    const [certs, setCerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('xp_apps'); // 'xp_apps' or 'certs'
    const [selectedApp, setSelectedApp] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coach_xp_applications')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setApps(data || []);
        } catch (err) {
            console.error('Fetch apps error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (record, status) => {
        if (status === '已退件' && !adminNotes) {
            alert('退回請填寫原因');
            return;
        }

        setIsProcessing(true);
        try {
            const { error: updateError } = await supabase
                .from('coach_xp_applications')
                .update({
                    status,
                    admin_notes: adminNotes
                })
                .eq('id', record.id);

            if (updateError) throw updateError;

            // 獲取教練的 UUID 以便發送個人通知
            const { data: userData } = await supabase
                .from('user_profiles')
                .select('id, total_xp')
                .eq('email', record.coach_email)
                .single();

            const coachId = userData?.id;

            // 如果核准，增加 XP
            if (status === '已核准') {
                const xpToAdd = record.apply_xp || 0;

                if (xpToAdd > 0 && userData) {
                    const newXp = (userData.total_xp || 0) + xpToAdd;
                    await supabase
                        .from('user_profiles')
                        .update({ total_xp: newXp })
                        .eq('email', record.coach_email);
                }

                // 發送通知 (切換到統一的 notifications 表)
                const notifTag = record.type === 'weekly' ? '課程' : '活動';
                await supabase.from('notifications').insert({
                    user_id: coachId,
                    title: `【申請核准】${record.type === 'weekly' ? '周課堂' : '活動'}通過`,
                    content: `您的申請已通過審核，系統已發放 ${xpToAdd} XP 獎勵。繼續加油！`,
                    target_role: 'coach',
                    tag: notifTag
                });
            } else if (status === '已退件') {
                // 發送退件通知
                const notifTag = record.type === 'weekly' ? '課程' : '活動';
                await supabase.from('notifications').insert({
                    user_id: coachId,
                    title: `【申請退回】${record.type === 'weekly' ? '周課堂' : '活動'}退回`,
                    content: `您的申請已被退回。退回原因：${adminNotes || '未註明'}。請修正後重新送出。`,
                    target_role: 'coach',
                    tag: notifTag
                });
            }

            alert('處理完成');
            setSelectedApp(null);
            setAdminNotes('');
            fetchApps();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('處理失敗: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="xp-app-review">
            <header className="manager-header">
                <h2>XP 申請審核</h2>
            </header>

            <div className="review-list">
                {isLoading ? (
                    <div className="loader-box"><Loader2 className="spin" /> 載入中...</div>
                ) : apps.length === 0 ? (
                    <div className="empty-box">目前無待處理申請</div>
                ) : (
                    apps.map(app => (
                        <div key={app.id} className="app-card">
                            <div className="card-left">
                                <div className="coach-info">
                                    <span className="coach-name">{app.coach_name || app.coach_email}</span>
                                    <span className="app-time">{new Date(app.created_at).toLocaleString()}</span>
                                </div>
                                <div className="app-type">
                                    <Zap size={16} />
                                    <span>{app.type === 'weekly' ? `周課堂 (${app.lessons_count}堂)` : '活動申請'}</span>
                                </div>
                            </div>
                            <div className="card-right">
                                <div className="xp-chip">+{app.apply_xp || 0} XP</div>
                                <div className={`status-tag ${app.status}`}>{app.status}</div>
                                {app.status === '待審核' && (
                                    <button className="view-btn" onClick={() => setSelectedApp(app)}>查看並審核</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedApp && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>申請詳情 ‧ 審核</h3>
                            <button className="close-btn" onClick={() => setSelectedApp(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>教練</label>
                                    <p>{selectedApp.coach_name || selectedApp.coach_email}</p>
                                </div>
                                <div className="info-item">
                                    <label>類型</label>
                                    <p>{selectedApp.cert_name || (selectedApp.type === 'weekly' ? '周課堂' : '活動申請')}</p>
                                </div>
                                {selectedApp.lessons_count && (
                                    <div className="info-item">
                                        <label>堂數</label>
                                        <p>{selectedApp.lessons_count} 堂</p>
                                    </div>
                                )}
                                <div className="info-item">
                                    <label>申請 XP</label>
                                    <p className="xp-highlight">+{selectedApp.apply_xp || (activeTab === 'certs' ? '待定' : 0)} XP</p>
                                </div>
                            </div>

                            {selectedApp.notes && (
                                <div className="notes-box">
                                    <label>備註內容</label>
                                    <p>{selectedApp.notes}</p>
                                </div>
                            )}

                            <div className="images-section">
                                <label>證明照片</label>
                                <div className="image-scroll">
                                    {(selectedApp.images || selectedApp.proof_images || []).map((img, i) => (
                                        <div key={i} className="img-box">
                                            <img src={img} alt="proof" onClick={() => window.open(img, '_blank')} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="review-action">
                                <label>審核意見 / 退件原因</label>
                                <textarea
                                    placeholder="請輸入審核註記..."
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                ></textarea>

                                <div className="action-buttons">
                                    <button className="reject-btn" onClick={() => handleAction(selectedApp, '已退件')} disabled={isProcessing}>
                                        <XCircle size={18} />
                                        <span>退回申請</span>
                                    </button>
                                    <button className="approve-btn" onClick={() => handleAction(selectedApp, '已核准')} disabled={isProcessing}>
                                        <CheckCircle2 size={18} />
                                        <span>核准通過</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .xp-app-review { padding: 32px; height: 100%; overflow-y: auto; }
                .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .manager-header h2 { font-size: 24px; font-weight: 800; color: white; }
                
                .tab-pills { display: flex; background: var(--secondary-bg); padding: 4px; border-radius: 12px; gap: 4px; }
                .pill { background: none; border: none; color: var(--text-secondary); padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .pill.active { background: var(--primary); color: white; }

                .review-list { display: flex; flex-direction: column; gap: 16px; }
                .app-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
                .coach-info { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
                .coach-name { font-size: 16px; font-weight: 700; color: white; }
                .app-time { font-size: 11px; color: var(--text-secondary); }
                .app-type { display: flex; align-items: center; gap: 8px; color: var(--primary); font-size: 13px; font-weight: 600; }
                
                .card-right { display: flex; align-items: center; gap: 16px; }
                .xp-chip { background: rgba(255, 92, 0, 0.1); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 13px; }
                .status-tag { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }
                .status-tag.待審核 { background: rgba(255, 184, 0, 0.1); color: #FFB800; }
                .view-btn { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 2500; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #1a1a1b; width: 100%; max-width: 500px; border-radius: 30px; border: 1px solid var(--border); overflow: hidden; }
                .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
                .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .info-item label { display: block; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600; }
                .info-item p { color: white; font-weight: 700; }
                .xp-highlight { color: var(--primary) !important; font-size: 18px !important; }

                .notes-box { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid var(--border); }
                .notes-box label { font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; display: block; }
                .notes-box p { font-size: 14px; color: white; }

                .images-section label { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; display: block; }
                .image-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
                .img-box { flex: 0 0 120px; height: 120px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
                .img-box img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }

                .review-action label { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; display: block; }
                .review-action textarea { width: 100%; background: #000; border: 1px solid var(--border); border-radius: 12px; padding: 12px; color: white; margin-bottom: 16px; outline: none; }
                
                .action-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .action-buttons button { padding: 14px; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; border: none; cursor: pointer; }
                .reject-btn { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
                .approve-btn { background: var(--primary); color: white; }
                
                .loader-box, .empty-box { padding: 60px 0; text-align: center; color: var(--text-secondary); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default XpApplicationReview;
