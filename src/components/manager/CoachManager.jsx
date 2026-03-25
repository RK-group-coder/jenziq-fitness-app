import React, { useEffect, useState } from 'react';
import { Search, Plus, Star, BookOpen, Users, Phone, Mail, MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';

const CoachManager = () => {
    const [coaches, setCoaches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCoaches();
    }, []);

    const fetchCoaches = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('coaches')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            setCoaches(data || []);
        } catch (error) {
            console.error('抓取教練資料失敗:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="coach-manager">
            <header className="page-header">
                <div className="header-top">
                    <div className="title-wrap">
                        <h2 className="page-title">教練管理</h2>
                        <p className="page-count">共 {coaches.length} 位教練</p>
                    </div>
                    <button className="add-btn">
                        <Plus size={18} />
                        <span>新增教練</span>
                    </button>
                </div>

                <div className="search-bar-wrap">
                    <div className="search-input">
                        <Search size={18} />
                        <input type="text" placeholder="搜尋教練姓名或專長..." />
                    </div>
                </div>

                <div className="stats-strip">
                    <div className="mini-stat"><span>{coaches.filter(c => c.status === '在職').length}</span> 在職教練</div>
                    <div className="mini-stat"><span>{coaches.filter(c => c.status === '請假中').length}</span> 請假中</div>
                    <div className="mini-stat"><span>{coaches.length}</span> 總教練數</div>
                </div>
            </header>

            <div className="manager-scroll-content">
                <div className="coach-grid">
                    {isLoading ? (
                        <div className="loading-box">
                            <Loader2 className="animate-spin" size={24} />
                            <span>讀取中...</span>
                        </div>
                    ) : coaches.length > 0 ? (
                        coaches.map(coach => (
                            <div key={coach.id} className="coach-card">
                                <div className="card-header">
                                    <div className={`avatar-circle status-${coach.status === '在職' ? 'active' : 'idle'}`}>
                                        {coach.name?.charAt(0)}
                                    </div>
                                    <div className="coach-main-info">
                                        <div className="name-row">
                                            <h3 className="coach-name">{coach.name}</h3>
                                            <span className={`status-label ${coach.status === '在職' ? 'active' : 'idle'}`}>{coach.status}</span>
                                        </div>
                                        <div className="tag-row">
                                            {coach.tags?.map(t => <span key={t} className="coach-tag">{t}</span>)}
                                        </div>
                                    </div>
                                </div>

                                <p className="coach-bio">{coach.bio}</p>

                                <div className="performance-stats">
                                    <div className="p-stat">
                                        <Star size={14} color="#FFB800" fill="#FFB800" />
                                        <span className="p-val">{coach.rating}</span>
                                        <span className="p-lbl">評分</span>
                                    </div>
                                    <div className="line-sep"></div>
                                    <div className="p-stat">
                                        <BookOpen size={14} color="#3B82F6" />
                                        <span className="p-val">{coach.courses_count || coach.courses || 0}</span>
                                        <span className="p-lbl">課程</span>
                                    </div>
                                    <div className="line-sep"></div>
                                    <div className="p-stat">
                                        <Users size={14} color="#10B981" />
                                        <span className="p-val">{coach.students_count || coach.students || 0}</span>
                                        <span className="p-lbl">學員</span>
                                    </div>
                                </div>

                                <div className="contact-info">
                                    <div className="contact-item"><Phone size={14} /> {coach.phone}</div>
                                    <div className="contact-item"><Mail size={14} /> {coach.email}</div>
                                </div>

                                <div className="card-actions">
                                    <button className="act-btn detail">查看詳情</button>
                                    <div className="btn-group">
                                        <button className="act-btn-icon"><Edit2 size={16} /></button>
                                        <button className="act-btn-icon delete"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-box">目前沒有教練資料</div>
                    )}
                </div>
            </div>

            <style>{`
        .coach-manager { display: flex; flex-direction: column; height: 100%; }
        .page-header { padding: 24px 20px 0; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .page-title { font-size: 20px; font-weight: 800; color: white; }
        .page-count { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .add-btn { background-color: var(--primary); color: white; padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        
        .search-bar-wrap { margin-bottom: 20px; }
        .search-input { background-color: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; padding: 0 16px; gap: 12px; height: 44px; }
        .search-input input { background: none; border: none; color: white; font-size: 14px; width: 100%; }

        .stats-strip { display: flex; justify-content: space-between; background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid var(--border); }
        .mini-stat { font-size: 11px; color: var(--text-secondary); font-weight: 600; }
        .mini-stat span { color: white; font-weight: 800; margin-right: 4px; }

        .manager-scroll-content { flex: 1; overflow-y: auto; padding: 0 16px 20px; scrollbar-width: none; }
        .manager-scroll-content::-webkit-scrollbar { display: none; }
        
        .coach-grid { display: flex; flex-direction: column; gap: 16px; }
        .coach-card { background-color: var(--card-bg); border-radius: var(--radius-lg); padding: 20px; border: 1px solid var(--border); }
        .card-header { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
        .avatar-circle { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white; }
        .avatar-circle.status-active { background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%); }
        .avatar-circle.status-idle { background: linear-gradient(135deg, #F97316 0%, #F59E0B 100%); }
        
        .coach-main-info { flex: 1; }
        .name-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .coach-name { font-size: 16px; font-weight: 700; color: white; }
        .status-label { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
        .status-label.active { background-color: rgba(16, 185, 129, 0.1); color: #10B981; }
        .status-label.idle { background-color: rgba(245, 158, 11, 0.1); color: #F59E0B; }
        
        .tag-row { display: flex; gap: 6px; }
        .coach-tag { font-size: 10px; color: var(--primary); font-weight: 600; background-color: rgba(255, 92, 0, 0.1); padding: 2px 6px; border-radius: 4px; }
        
        .coach-bio { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5; }
        
        .performance-stats { display: flex; justify-content: space-around; background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .p-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .p-val { font-size: 15px; font-weight: 800; color: white; }
        .p-lbl { font-size: 10px; color: var(--text-secondary); }
        .line-sep { width: 1px; height: 20px; background-color: var(--border); }
        
        .contact-info { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
        .contact-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
        
        .card-actions { display: flex; justify-content: space-between; align-items: center; }
        .act-btn.detail { background-color: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 8px; }
        .btn-group { display: flex; gap: 8px; }
        .act-btn-icon { width: 34px; height: 34px; background-color: var(--secondary-bg); border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
        .act-btn-icon.delete { color: #EF4444; }

        .loading-box, .empty-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--text-secondary); gap: 12px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default CoachManager;
