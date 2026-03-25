import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ChevronRight, 
  Clock, 
  User, 
  Activity, 
  X,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

const InjuryAlertManager = ({ onContactUser, onUpdate }) => {
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [activeFilter, setActiveFilter] = useState(false); // false = Pending, true = Confirmed

    useEffect(() => {
        cleanupOldAlerts();
        loadAlerts();
    }, []);

    const cleanupOldAlerts = () => {
        try {
            const currentAlerts = JSON.parse(localStorage.getItem('injury_alerts') || '[]');
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const validAlerts = currentAlerts.filter(a => {
                // 如果已確認，檢查 confirmedAt；如果是新的，檢查 timestamp
                const rawTime = a.confirmedAt || a.timestamp || 0;
                // 確保轉換為數字時間戳進行比較 (處理 ISO string 或數字)
                const referenceTime = typeof rawTime === 'string' ? new Date(rawTime).getTime() : rawTime;
                return referenceTime > sevenDaysAgo;
            });
            localStorage.setItem('injury_alerts', JSON.stringify(validAlerts));
        } catch (e) {
            console.error('Cleanup old alerts failed:', e);
        }
    };

    const loadAlerts = () => {
        try {
            const data = JSON.parse(localStorage.getItem('injury_alerts') || '[]');
            setAlerts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load injury alerts:', err);
            setAlerts([]);
        }
    };

    const handleConfirmAlert = (alertToConfirm, e) => {
        if (e) e.stopPropagation();
        
        try {
            const currentAlerts = JSON.parse(localStorage.getItem('injury_alerts') || '[]');
            const updatedAlerts = currentAlerts.map(a => {
                if (a.timestamp === alertToConfirm.timestamp) {
                    return { ...a, confirmed: true, confirmedAt: Date.now() };
                }
                return a;
            });
            localStorage.setItem('injury_alerts', JSON.stringify(updatedAlerts));
            
            setAlerts(updatedAlerts);
            if (selectedAlert?.timestamp === alertToConfirm.timestamp) {
                setSelectedAlert({ ...selectedAlert, confirmed: true });
            }
            
            // 通知父組件更新計數
            if (onUpdate) onUpdate();
            alert('狀況已確認，紀錄將保留 7 天後自動刪除');
        } catch (err) {
            console.error('Failed to confirm alert:', err);
        }
    };

    const formatDate = (isoStr) => {
        try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return '時間格式錯誤';
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        } catch (e) {
            return '未知時間';
        }
    };

    return (
        <div className="manager-home injury-alert-manager">
            <header className="manager-header">
                <div className="header-text">
                    <p className="sub-title">劇烈疼痛警報系統</p>
                    <h2 className="page-title">即時通報監測</h2>
                </div>
                <button className="refresh-btn" onClick={loadAlerts}>
                    <RefreshCw size={16} />
                    <span>重新整理</span>
                </button>
            </header>

            <div className="manager-scroll-content">
                <div className="alert-list-container">
                    <div className="alert-tabs">
                        <button 
                            className={`tab-btn ${!activeFilter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(false)}
                        >
                            待處理 ({alerts.filter(a => !a.confirmed).length})
                        </button>
                        <button 
                            className={`tab-btn ${activeFilter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(true)}
                        >
                            已確認 ({alerts.filter(a => a.confirmed).length})
                        </button>
                    </div>

                    {alerts.filter(a => !!a.confirmed === activeFilter).length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon-circle">
                                {activeFilter ? <ShieldCheck size={48} color="#1e293b" /> : <ShieldAlert size={48} color="#1e293b" />}
                            </div>
                            <h3>{activeFilter ? '目前無已確認紀錄' : '目前無緊急警訊'}</h3>
                            <p>{activeFilter ? '所有已處理的紀錄會在 7 天後自動清除' : '所有學員目前的訓練狀態回報均在正常範圍內'}</p>
                        </div>
                    ) : (
                        <div className="alert-grid">
                            {alerts.filter(a => a && typeof a === 'object' && !!a.confirmed === activeFilter).map((alert, idx) => (
                                <div key={idx} className={`alert-card-item ${alert.confirmed ? 'confirmed-style' : ''}`} onClick={() => setSelectedAlert(alert)}>
                                    <div className="card-top">
                                        <div className={`intensity-badge ${alert.confirmed ? 'confirmed-badge' : ''}`}>
                                            {alert.confirmed ? '已確認' : `LV ${alert?.intensity || '??'}`}
                                        </div>
                                        <span className="timestamp">{formatDate(alert?.timestamp)}</span>
                                    </div>
                                    <div className="card-user-row">
                                        <div className="user-avatar">{alert?.user?.name?.charAt(0) || alert?.user?.email?.charAt(0) || '?'}</div>
                                        <div className="user-text">
                                            <div className="user-name">{alert?.user?.name || alert?.user?.email || '未知使用者'}</div>
                                            <div className="user-subtext">{alert.confirmed ? '已完成確認' : '學員通報'}</div>
                                        </div>
                                    </div>
                                    <div className="injury-area-box">
                                        <div className="area-label">通報部位</div>
                                        <div className="area-value">{alert?.target || '無資料'}</div>
                                    </div>
                                    <div className="view-more-tag">
                                        <span>點擊查看完整分析</span>
                                        <ChevronRight size={14} />
                                    </div>
                                    {!alert.confirmed ? (
                                        <button 
                                            className="confirm-quick-btn"
                                            onClick={(e) => handleConfirmAlert(alert, e)}
                                        >
                                            <ShieldCheck size={14} />
                                            <span>確認情況</span>
                                        </button>
                                    ) : (
                                        <div className="confirmed-footprint">
                                            <ShieldCheck size={12} />
                                            <span>於 {new Date(alert.confirmedAt).toLocaleDateString()} 完成核對</span>
                                        </div>
                                    )}
                                    <div className={`danger-border-accent ${alert.confirmed ? 'confirmed-border' : ''}`}></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedAlert && (
                <div className="alert-detail-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedAlert(null)}>
                    <div className="alert-detail-modal">
                        <div className="detail-modal-header">
                            <div className="header-left">
                                <ShieldAlert size={20} color="#ef4444" />
                                <span>學員異常狀態報告</span>
                            </div>
                            <button className="close-modal-btn" onClick={() => setSelectedAlert(null)}><X size={20} /></button>
                        </div>
                        
                        <div className="detail-modal-scroll">
                            <div className="user-header-card">
                                <div className="big-avatar">{selectedAlert?.user?.name?.charAt(0) || selectedAlert?.user?.email?.charAt(0) || '?'}</div>
                                <h3>{selectedAlert?.user?.name || selectedAlert?.user?.email || '未知使用者'}</h3>
                                <div className="contact-pills">
                                    <div className="contact-pill"><Mail size={12} /> {selectedAlert?.user?.email || '無信箱'}</div>
                                    <div className="contact-pill"><Phone size={12} /> {selectedAlert?.user?.phone || '未提供'}</div>
                                </div>
                                <button 
                                    className="modal-contact-btn"
                                    onClick={() => onContactUser?.(selectedAlert?.user)}
                                >
                                    <MessageSquare size={16} />
                                    <span>立即聯繫學員</span>
                                </button>
                                {!selectedAlert.confirmed ? (
                                    <button 
                                        className="modal-confirm-scene-btn"
                                        onClick={() => handleConfirmAlert(selectedAlert)}
                                    >
                                        <ShieldCheck size={16} />
                                        <span>確認狀況並排除警報</span>
                                    </button>
                                ) : (
                                    <div className="modal-confirmed-badge">
                                        <ShieldCheck size={16} />
                                        <span>此警訊已於 {new Date(selectedAlert.confirmedAt).toLocaleString()} 完成確認</span>
                                    </div>
                                )}
                            </div>

                            <div className="report-content-grid">
                                <div className="report-section-title">評估數據詳情</div>
                                <div className="report-data-card">
                                    <div className="data-item">
                                        <label>受傷部位</label>
                                        <div className="val">{selectedAlert?.target || '無資料'}</div>
                                    </div>
                                    <div className="data-item">
                                        <label>發生時段</label>
                                        <div className="val">{selectedAlert?.timing || '無資料'}</div>
                                    </div>
                                    <div className="data-item">
                                        <label>痛感等級</label>
                                        <div className="val red-val">Level {selectedAlert?.intensity || '??'} (劇烈疼痛)</div>
                                    </div>
                                    <div className="data-item full">
                                        <label>補充詳情</label>
                                        <div className="val-box">{selectedAlert?.details || '學員未提供額外描述'}</div>
                                    </div>
                                    <div className="data-item full">
                                        <label>通報系統時間</label>
                                        <div className="val">{selectedAlert?.timestamp ? new Date(selectedAlert.timestamp).toLocaleString() : '未知時間'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .injury-alert-manager { 
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                  background-color: var(--background);
                }
                .manager-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 24px 20px;
                }
                .sub-title {
                  font-size: 11px;
                  color: var(--text-secondary);
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  margin-bottom: 2px;
                }
                .page-title {
                  font-size: 20px;
                  font-weight: 800;
                  color: white;
                }
                .manager-scroll-content {
                  flex: 1;
                  overflow-y: auto;
                  padding: 0 16px 20px;
                  scrollbar-width: none;
                }
                .manager-scroll-content::-webkit-scrollbar { display: none; }


                .alert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                .alert-card-item { 
                    background: #151516; border-radius: 28px; padding: 24px; position: relative; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; flex-direction: column; gap: 20px;
                }
                .alert-card-item:hover { transform: translateY(-8px); border-color: rgba(239, 68, 68, 0.4); background: #1a1a1c; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                
                .card-top { display: flex; justify-content: space-between; align-items: center; }
                .intensity-badge { background: #ef4444; color: white; padding: 4px 14px; border-radius: 100px; font-size: 12px; font-weight: 900; letter-spacing: 0.5px; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3); }
                .timestamp { font-size: 12px; color: #555; font-weight: 700; }

                .card-user-row { display: flex; align-items: center; gap: 14px; }
                .user-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; border: 1px solid rgba(255,255,255,0.1); }
                .user-name { font-size: 17px; font-weight: 800; color: white; }
                .user-subtext { font-size: 11px; color: #555; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-top: 2px; }

                .injury-area-box { background: rgba(255,255,255,0.02); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03); }
                .area-label { font-size: 10px; color: #666; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; }
                .area-value { font-size: 15px; font-weight: 700; color: #eee; }

                .view-more-tag { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #444; font-weight: 700; margin-top: auto; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .view-more-tag:hover { color: #ef4444; }

                .alert-tabs { display: flex; gap: 12px; margin-bottom: 24px; }
                .tab-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #888; padding: 10px 24px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; }
                .tab-btn.active { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }
                
                .confirmed-style { opacity: 0.7; border-color: rgba(16, 185, 129, 0.1); background: #0f1011; }
                .confirmed-badge { background: #10b981 !important; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important; }
                .confirmed-border { background: #10b981 !important; opacity: 0.4 !important; }
                .confirmed-footprint { display: flex; align-items: center; gap: 6px; color: #10b981; font-size: 11px; font-weight: 700; margin-top: 8px; }

                .confirm-quick-btn {
                    width: 100%;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    padding: 10px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 800;
                    margin-top: 4px;
                    transition: 0.2s;
                    cursor: pointer;
                }
                .confirm-quick-btn:hover {
                    background: #10b981;
                    color: white;
                    transform: scale(0.98);
                }

                .danger-border-accent { position: absolute; bottom: 0; left: 30px; right: 30px; height: 3px; background: #ef4444; border-radius: 3px 3px 0 0; opacity: 0.6; box-shadow: 0 -4px 12px rgba(239, 68, 68, 0.4); }

                .empty-state { padding: 120px 0; text-align: center; display: flex; flex-direction: column; align-items: center; width: 100%; }
                .empty-icon-circle { width: 100px; height: 100px; background: rgba(255,255,255,0.02); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
                .empty-state h3 { font-size: 20px; color: #ccc; font-weight: 800; margin-bottom: 8px; }
                .empty-state p { font-size: 14px; color: #555; font-weight: 600; }

                .refresh-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 10px 20px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .refresh-btn:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }

                .alert-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .alert-detail-modal { background: #0f172a; width: 100%; max-width: 500px; max-height: 90vh; border-radius: 36px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
                
                .detail-modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .header-left { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .close-modal-btn { background: rgba(255,255,255,0.05); border: none; color: white; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

                .detail-modal-scroll { flex: 1; overflow-y: auto; padding-bottom: 40px; }
                .user-header-card { padding: 40px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .big-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #991b1b); margin: 0 auto 20px; border-radius: 28px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: white; box-shadow: 0 15px 30px rgba(239, 68, 68, 0.2); }
                .user-header-card h3 { font-size: 24px; color: white; font-weight: 900; margin: 0 0 16px; }
                
                .contact-pills { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
                .contact-pill { padding: 6px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #888; font-weight: 700; }
                
                .modal-contact-btn { width: 100%; max-width: 240px; margin: 0 auto 12px; background: #3b82f6; color: white; border: none; padding: 16px; border-radius: 18px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 850; font-size: 15px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); transition: 0.2s; cursor: pointer; }
                .modal-contact-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4); }

                .modal-confirm-scene-btn {
                    width: 100%;
                    max-width: 240px;
                    margin: 0 auto;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    padding: 14px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-weight: 850;
                    font-size: 14px;
                    transition: 0.2s;
                    cursor: pointer;
                }
                .modal-confirm-scene-btn:hover {
                    background: #10b981;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
                }
                
                .modal-confirmed-badge { color: #10b981; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; }

                .report-content-grid { padding: 32px 24px; }
                .report-section-title { font-size: 12px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; border-left: 3px solid #ef4444; padding-left: 10px; }
                
                .report-data-card { background: rgba(0,0,0,0.2); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); padding: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; }
                .data-item { background: #0f172a; padding: 20px; border-radius: 4px; }
                .data-item.full { grid-column: span 2; }
                .data-item label { display: block; font-size: 11px; color: #555; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
                .data-item .val { font-size: 16px; font-weight: 700; color: #eee; }
                .val.red-val { color: #ef4444; }
                .val-box { background: rgba(255,255,255,0.02); padding: 16px; border-radius: 16px; font-size: 14px; color: #aaa; line-height: 1.6; font-weight: 500; border: 1px dashed rgba(255,255,255,0.05); }

                .detail-modal-scroll::-webkit-scrollbar { width: 6px; }
                .detail-modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default InjuryAlertManager;
