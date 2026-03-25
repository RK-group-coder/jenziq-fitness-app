import React, { useState, useEffect, useRef } from 'react';
import { Award, Zap, Star, Users, Briefcase, ChevronDown, ChevronUp, ChevronRight, Info, Loader2, Camera, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../supabase';

const StudentLevel = ({ user }) => {
    const [rules, setRules] = useState([]);
    const [levels, setLevels] = useState([]);
    const [xpData, setXpData] = useState({ total_xp: 0, avatar_url: null, bio: '', name: '', gender: '', last_checkin_date: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showAllRules, setShowAllRules] = useState(false);
    const [showAllLevels, setShowAllLevels] = useState(false);

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState('');
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchLevelData();
    }, [user]);

    const fetchLevelData = async () => {
        const searchEmail = user?.email?.trim().toLowerCase();
        setIsLoading(true);
        try {
            // 1. 抓取規則與等級
            const { data: rulesData } = await supabase.from('student_xp_rules').select('*').order('xp_value', { ascending: false });
            const { data: levelsData } = await supabase.from('student_levels').select('*').order('level', { ascending: true });

            if (rulesData) setRules(rulesData);
            if (levelsData) setLevels(levelsData);

            // 2. 抓取用戶資料
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', searchEmail)
                .maybeSingle();

            if (profile) {
                setXpData({
                    id: profile.id,
                    total_xp: profile.total_xp || 0,
                    avatar_url: profile.avatar_url,
                    bio: profile.bio || '',
                    name: profile.name || '',
                    gender: profile.gender || '',
                    last_checkin_date: profile.last_checkin_date
                });
                setTempBio(profile.bio || '');
            } else if (searchEmail) {
                setXpData({ total_xp: 0, avatar_url: null, bio: '', name: '', gender: '', last_checkin_date: null });
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateCurrentLevel = () => {
        if (!levels || levels.length === 0) return { title: '載入中...', level: 1, min_xp: 0 };
        return levels.filter(l => xpData.total_xp >= l.min_xp).pop() || levels[0];
    };

    const currentLevel = calculateCurrentLevel();
    const nextLevel = levels ? levels.find(l => l.min_xp > xpData.total_xp) : null;
    const progress = (nextLevel && currentLevel)
        ? ((xpData.total_xp - currentLevel.min_xp) / (nextLevel.min_xp - currentLevel.min_xp)) * 100
        : 100;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('圖片大小不能超過 2MB');
            return;
        }

        setIsUpdating(true);
        try {
            const bucketName = 'student-dashboard-image';
            const fileExt = file.name.split('.').pop();
            const searchEmail = user?.email?.trim().toLowerCase();
            const safeId = xpData.id || searchEmail?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
            const fileName = `avatars/${safeId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .upsert({
                    email: searchEmail,
                    avatar_url: publicUrl,
                    name: user?.user_metadata?.full_name || '學員',
                    first_login_completed: true
                }, { onConflict: 'email' });

            if (updateError) throw updateError;

            setXpData(prev => ({ ...prev, avatar_url: publicUrl }));
            alert('大頭貼更新成功');
            fetchLevelData();
        } catch (err) {
            console.error('Upload error:', err);
            alert('上傳失敗: ' + (err.message || '請確認網路狀態'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleBioSave = async () => {
        if (!isEditingBio) return;
        setIsUpdating(true);
        try {
            const searchEmail = user?.email?.trim().toLowerCase();
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    email: searchEmail,
                    bio: tempBio,
                    name: user?.user_metadata?.full_name || '學員',
                    first_login_completed: true
                }, { onConflict: 'email' });

            if (error) throw error;
            setXpData(prev => ({ ...prev, bio: tempBio }));
            setIsEditingBio(false);
            fetchLevelData();
        } catch (err) {
            alert('儲存失敗: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCheckin = async () => {
        if (isUpdating) return;

        const today = new Date().toISOString().split('T')[0];
        if (xpData.last_checkin_date === today) {
            alert('今天已經簽到過了喔！明天再來吧 ✨');
            return;
        }

        setIsUpdating(true);
        try {
            const searchEmail = user?.email?.trim().toLowerCase();
            const newXp = (xpData.total_xp || 0) + 10;

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    total_xp: newXp,
                    last_checkin_date: today
                })
                .eq('email', searchEmail);

            if (error) throw error;

            alert('簽到成功！獲得 +10 XP 🎊');
            fetchLevelData();
        } catch (err) {
            console.error('Checkin error:', err);
            alert('簽到失敗，請稍後再試');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="loader-container"><Loader2 className="spin" /> 載入中...</div>;

    return (
        <div className="student-level">
            <header className="page-header">
                <h2 className="page-title">等級與成就</h2>
                <p className="page-subtitle">持續運動、獲取經驗值，解鎖更多功能！</p>
            </header>

            <div className="level-content">
                {/* Level Summary Card */}
                <div className="level-summary-card">
                    <div className="avatar-wrapper" onClick={handleAvatarClick}>
                        <div className={`avatar-container ${isUpdating ? 'blur' : ''}`}>
                            {xpData.avatar_url ? (
                                <img src={xpData.avatar_url} alt="avatar" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <Award size={40} className="medal-icon" />
                                </div>
                            )}
                            <div className="avatar-overlay">
                                <Camera size={20} />
                            </div>
                        </div>
                        <div className="badge-small">Lv.{currentLevel.level === 10 ? 'MAX' : currentLevel.level}</div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <div className="summary-info">
                        <div className="top-row">
                            <span className="level-badge">{currentLevel.title}</span>
                        </div>

                        <div className="profile-main-info">
                            <h3 className="user-name">{xpData.name || user?.user_metadata?.full_name || '學員'}</h3>
                            <span className={`gender-tag ${xpData.gender === '女' ? 'female' : 'male'}`}>
                                {xpData.gender === '女' ? '♀' : (xpData.gender === '男' ? '♂' : '??')}
                            </span>
                        </div>

                        <p className="total-xp">總經驗值：<span className="blue-text">{xpData.total_xp.toLocaleString()} XP</span></p>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="progress-section">
                    <div className="progress-header">
                        <span className="target-label">{nextLevel ? `距離 ${nextLevel.title}` : '已達成最高等級'}</span>
                        <span className="needed-xp">{nextLevel ? `還需 ${(nextLevel.min_xp - xpData.total_xp).toLocaleString()} XP` : '恭喜達成最高榮譽！'}</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-thumb" style={{ width: `${Math.min(100, progress)}%` }}></div>
                    </div>
                    <div className="progress-footer">
                        <span>{xpData.total_xp.toLocaleString()} XP</span>
                        <span>{nextLevel ? `${nextLevel.min_xp.toLocaleString()} XP` : 'MAX'}</span>
                    </div>

                    {/* Daily Check-in Button */}
                    <button
                        className={`checkin-btn ${xpData.last_checkin_date === new Date().toISOString().split('T')[0] ? 'disabled' : ''}`}
                        onClick={handleCheckin}
                        disabled={isUpdating || xpData.last_checkin_date === new Date().toISOString().split('T')[0]}
                    >
                        {isUpdating ? (
                            <Loader2 size={18} className="spin" />
                        ) : xpData.last_checkin_date === new Date().toISOString().split('T')[0] ? (
                            <><Check size={18} /> 今日已簽到</>
                        ) : (
                            <><Award size={18} /> 每日簽到領取 10 XP</>
                        )}
                    </button>
                </div>

                {/* Bio Section */}
                <div className="bio-container show">
                    <div className="bio-header">
                        <span className="bio-label">個人自介</span>
                        {!isEditingBio ? (
                            <button className="edit-bio-btn" onClick={() => setIsEditingBio(true)}>
                                <Edit2 size={14} /> 編輯
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button className="save-bio-btn" onClick={handleBioSave} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                                </button>
                                <button className="cancel-bio-btn" onClick={() => { setIsEditingBio(false); setTempBio(xpData.bio || ''); }}>
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {isEditingBio ? (
                        <textarea
                            className="bio-textarea"
                            value={tempBio}
                            onChange={e => setTempBio(e.target.value)}
                            placeholder="簡單介紹一下你自己吧..."
                            maxLength={150}
                            autoFocus
                        />
                    ) : (
                        <p className={`bio-text ${!xpData.bio ? 'empty' : ''}`}>
                            {xpData.bio || '尚未填寫自介。分享一點你的運動座右銘吧！'}
                        </p>
                    )}
                </div>

                {/* Level Roadmap */}
                <section className="dashboard-section roadmap-section">
                    <div className="section-title-row">
                        <h3 className="section-title">升級之路</h3>
                        <button className="expand-btn" onClick={() => setShowAllLevels(!showAllLevels)}>
                            {showAllLevels ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>

                    <div className="roadmap">
                        {(showAllLevels ? (levels || []) : (levels || []).filter(l => currentLevel.level === l.level)).map((l) => (
                            <div
                                key={l.level}
                                className={`roadmap-item ${xpData.total_xp >= l.min_xp ? 'completed' : ''} ${currentLevel.level === l.level ? 'current' : ''}`}
                                onClick={() => setSelectedLevel(l)}
                            >
                                <div className="roadmap-icon"><Award size={16} /></div>
                                <div className="roadmap-info">
                                    <div className="rm-top">
                                        <h4 className="rm-name">{l.title}</h4>
                                        {currentLevel.level === l.level && <span className="current-tag">目前等級</span>}
                                    </div>
                                    <p className="rm-meta">Lv.{l.level === 10 ? 'MAX' : l.level} ‧ 需要 {l.min_xp.toLocaleString()} XP</p>
                                </div>
                                <div className="rm-action">
                                    <ChevronRight size={16} color="#444" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How to earn XP - Always visible below Roadmap */}
                <section className="dashboard-section earn-section">
                    <div className="section-title-row">
                        <h3 className="section-title">如何獲得經驗值</h3>
                    </div>

                    <div className="earn-form">
                        {(rules || []).map((rule, idx) => (
                            <div key={rule.id || idx} className="earn-form-item">
                                <div className="earn-dot"></div>
                                <span className="earn-name">{rule.title}</span>
                                <span className="earn-val">+{rule.xp_value} XP</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {selectedLevel && (
                <div className="level-modal-overlay" onClick={() => setSelectedLevel(null)}>
                    <div className="level-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-icon-bg">
                                <Award size={24} color="#3B82F6" />
                            </div>
                            <div className="modal-title-wrap">
                                <h3 className="modal-title">{selectedLevel.title}</h3>
                                <p className="modal-subtitle">Lv.{selectedLevel.level === 10 ? 'MAX' : selectedLevel.level} 等級權益</p>
                            </div>
                            <button className="close-modal" onClick={() => setSelectedLevel(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="privilege-section">
                                <h4 className="privilege-title">等級獎勵</h4>
                                <div className="privilege-list">
                                    {((selectedLevel.privileges && Array.isArray(selectedLevel.privileges)) ? selectedLevel.privileges : []).map((p, i) => (
                                        <div className="privilege-item" key={i}>
                                            <div className="check-icon">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="level-requirement">
                                <div className="req-label">晉升門檻</div>
                                <div className="req-val">{selectedLevel.min_xp.toLocaleString()} XP</div>
                            </div>
                        </div>

                        <button className="modal-action-btn" onClick={() => setSelectedLevel(null)}>
                            太棒了！
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        .student-level { display: flex; flex-direction: column; height: 100%; color: white; }
        .page-header { padding: 24px 20px 16px; }
        .page-title { font-size: 24px; font-weight: 800; color: white; }
        .page-subtitle { font-size: 13px; color: #94A3B8; }
        .level-content { flex: 1; overflow-y: auto; padding: 0 16px 20px; scrollbar-width: none; }
        .level-content::-webkit-scrollbar { display: none; }
        
        .level-summary-card { background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 24px; padding: 24px; display: flex; align-items: center; gap: 24px; border: 1px solid rgba(59, 130, 246, 0.2); margin-bottom: 24px; position: relative; }
        
        .avatar-wrapper { position: relative; cursor: pointer; }
        .avatar-container { width: 88px; height: 88px; background: rgba(255, 255, 255, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(59, 130, 246, 0.3); position: relative; transition: 0.3s; }
        .avatar-container.blur { opacity: 0.5; }
        .avatar-container:hover .avatar-overlay { opacity: 1; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.1); }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.2s; }
        .badge-small { position: absolute; bottom: 0; right: 0; background-color: #3B82F6; color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px; border: 2px solid #0F172A; }
        
        .level-badge { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 8px; display: inline-flex; align-items: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); text-transform: uppercase; letter-spacing: 0.5px; }
        .profile-main-info { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
        .user-name { font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .gender-tag { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; }
        .gender-tag.male { background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); }
        .gender-tag.female { background: rgba(236, 72, 153, 0.2); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3); }
        .total-xp { font-size: 13px; color: #94A3B8; }
        .blue-text { color: #3B82F6; font-weight: 700; }
        
        .progress-section { margin-bottom: 24px; }
        .progress-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
        .target-label { color: white; font-weight: 600; }
        .progress-track { height: 8px; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-bottom: 6px; }
        .progress-thumb { height: 100%; background: linear-gradient(to right, #6366F1, #3B82F6); border-radius: 4px; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); transition: width 0.5s ease; }
        .progress-footer { display: flex; justify-content: space-between; font-size: 11px; color: #94A3B8; margin-bottom: 16px; }

        .checkin-btn {
            width: 100%;
            padding: 14px;
            border-radius: 16px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            background: rgba(59, 130, 246, 0.1);
            color: #60A5FA;
            font-size: 15px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            transition: 0.3s;
        }
        .checkin-btn:not(.disabled):hover {
            background: rgba(59, 130, 246, 0.2);
            transform: translateY(-2px);
        }
        .checkin-btn:active {
            transform: translateY(0);
        }
        .checkin-btn.disabled {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
            color: #64748B;
            cursor: default;
        }

        .bio-container { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 16px; margin-bottom: 32px; }
        .bio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .bio-label { font-size: 13px; font-weight: 700; color: #94A3B8; }
        .edit-bio-btn { background: none; border: none; color: #3B82F6; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer; }
        .edit-actions { display: flex; gap: 8px; }
        .save-bio-btn, .cancel-bio-btn { width: 28px; height: 28px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .save-bio-btn { background: #3B82F6; color: white; }
        .cancel-bio-btn { background: rgba(255,255,255,0.05); color: #94A3B8; }
        .bio-text { font-size: 14px; color: #CBD5E1; line-height: 1.6; }
        .bio-text.empty { font-style: italic; color: #64748B; }
        .bio-textarea { width: 100%; background: #000; border: 1px solid #3B82F6; border-radius: 12px; padding: 12px; color: white; font-size: 14px; line-height: 1.6; outline: none; resize: none; min-height: 80px; }
        
        .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .section-title { font-size: 18px; font-weight: 800; color: white; }
        .expand-btn { background: none; border: none; color: #64748B; cursor: pointer; }
        
        .earn-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .earn-item { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
        .earn-name { color: white; font-size: 14px; font-weight: 600; }
        .earn-val { color: #3B82F6; font-size: 15px; font-weight: 800; }

        .earn-form { 
          background: rgba(255,255,255,0.03); 
          border-radius: 20px; 
          padding: 8px 0; 
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 32px;
        }
        .earn-form-item {
          display: flex;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .earn-form-item:last-child { border-bottom: none; }
        .earn-dot { width: 6px; height: 6px; background: #3B82F6; border-radius: 50%; margin-right: 12px; }
        .earn-form-item .earn-name { flex: 1; font-size: 14px; color: #E2E8F0; }
        .earn-form-item .earn-val { color: #3B82F6; font-weight: 800; }
        
        .roadmap { display: flex; flex-direction: column; gap: 12px; }
        .roadmap-item { background-color: rgba(255,255,255,0.03); border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 16px; border: 1px solid rgba(255,255,255,0.05); transition: 0.2s; cursor: pointer; }
        .roadmap-item:active { transform: scale(0.98); background: rgba(255,255,255,0.02); }
        .roadmap-item.completed { border-color: rgba(16, 185, 129, 0.3); opacity: 0.7; }
        .roadmap-item.current { border-color: #3B82F6; background: rgba(59, 130, 246, 0.05); opacity: 1; }
        .roadmap-icon { width: 40px; height: 40px; background-color: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
        .roadmap-info { flex: 1; }
        .rm-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
        .rm-name { font-size: 15px; font-weight: 700; color: white; }
        .rm-meta { font-size: 11px; color: #94A3B8; }
        .current-tag { background-color: #3B82F6; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
        
        .level-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 2000; animation: fadeIn 0.3s ease; }
        .level-modal { background: #0F172A; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 28px; width: 100%; max-width: 360px; overflow: hidden; animation: slideUp 0.3s ease; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .modal-header { padding: 24px; display: flex; align-items: center; gap: 16px; position: relative; background: linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent); }
        .modal-icon-bg { width: 52px; height: 52px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(59, 130, 246, 0.2); }
        .modal-title { font-size: 20px; font-weight: 800; color: white; }
        .modal-subtitle { font-size: 12px; color: #3B82F6; font-weight: 600; margin-top: 2px; }
        .close-modal { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.05); border: none; width: 32px; height: 32px; border-radius: 50%; color: #94A3B8; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .modal-content { padding: 0 24px 24px; }
        .privilege-section { margin-top: 8px; }
        .privilege-title { font-size: 14px; font-weight: 700; color: #94A3B8; margin-bottom: 16px; }
        .privilege-list { display: flex; flex-direction: column; gap: 12px; }
        .privilege-item { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; color: #E2E8F0; line-height: 1.5; font-weight: 500; }
        .check-icon { width: 20px; height: 20px; background: rgba(59, 130, 246, 0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #3B82F6; flex-shrink: 0; margin-top: 1px; }
        
        .level-requirement { margin-top: 32px; padding: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05); }
        .req-label { font-size: 13px; color: #94A3B8; font-weight: 600; }
        .req-val { font-size: 15px; color: #3B82F6; font-weight: 800; }
        
        .modal-action-btn { width: calc(100% - 48px); margin: 0 24px 24px; padding: 14px; background: #3B82F6; color: white; border: none; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .modal-action-btn:active { transform: scale(0.96); opacity: 0.9; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .loader-container { display: flex; flex-direction: column; height: 100%; align-items: center; justify-content: center; color: #64748B; gap: 12px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default StudentLevel;
