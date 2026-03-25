import React, { useState, useEffect, useRef } from 'react';
import { Award, Zap, Star, Users, Briefcase, ChevronDown, ChevronUp, ChevronRight, Info, Loader2, Camera, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../../supabase';

const CoachLevel = ({ user }) => {
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
  const [showGainAnim, setShowGainAnim] = useState(false);
  const fileInputRef = useRef(null);



  useEffect(() => {
    fetchLevelData();
  }, [user]);

  const fetchLevelData = async () => {
    const searchEmail = user?.email?.trim().toLowerCase();
    setIsLoading(true);
    try {
      // 1. 抓取規則與等級
      const { data: rulesData } = await supabase.from('coach_xp_rules').select('*').order('xp_value', { ascending: false });
      const { data: levelsData } = await supabase.from('coach_levels').select('*').order('level', { ascending: true });

      if (rulesData) setRules(rulesData);
      if (levelsData) setLevels(levelsData);

      // 2. 抓取用戶資料 (直接用 eq 以確保精準)
      console.log('--- 正在向 Supabase 請求資料 ---');
      console.log('目標 Email:', searchEmail);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', searchEmail)
        .maybeSingle();

      if (error) {
        console.error('查詢出錯:', error);
      }

      if (profile) {
        console.log('✅ 找到資料了！內容如下：');
        console.log('姓名:', profile.name);
        console.log('XP:', profile.total_xp);
        console.log('大頭照:', profile.avatar_url ? '已設定' : '未設定');

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
      } else {
        console.warn('❌ 資料庫中找不到此 Email 的 Profiles 紀錄');
        setXpData({ total_xp: 0, avatar_url: null, bio: '', name: '', gender: '', last_checkin_date: null });
      }
    } catch (err) {
      console.error('執行過程中崩潰:', err);
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
      // 生成安全的文件名：使用 UUID + 時間戳，並過濾掉非法字元
      const fileExt = file.name.split('.').pop();
      // 如果沒有 ID (比如測試帳號)，使用 email 的 hash 或簡單字串
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

      // 使用 upsert 確保即便資料庫沒這筆資料也能建立
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          email: searchEmail,
          avatar_url: publicUrl,
          name: user?.profile?.name || '教練',
          first_login_completed: true
        }, { onConflict: 'email' });

      if (updateError) throw updateError;

      setXpData(prev => ({ ...prev, avatar_url: publicUrl }));
      alert('大頭貼更新成功');
      fetchLevelData(); // 重新整理以獲取 ID
    } catch (err) {
      console.error('Upload error:', err);
      alert('上傳失敗: ' + (err.message || '請確認網路狀態'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBioSave = async () => {
    if (!isEditingBio) return; // Use isEditingBio for consistency
    setIsUpdating(true);
    try {
      // 使用 upsert 確保即便資料庫沒這筆資料也能建立
      const searchEmail = user?.email?.trim().toLowerCase();
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          email: searchEmail,
          bio: tempBio,
          name: user?.profile?.name || '教練',
          first_login_completed: true
        }, { onConflict: 'email' });

      if (error) throw error;
      setXpData(prev => ({ ...prev, bio: tempBio }));
      setIsEditingBio(false); // Use isEditingBio for consistency
      fetchLevelData(); // 重新整理以獲取 ID
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
        .upsert({
          email: searchEmail,
          total_xp: newXp,
          last_checkin_date: today,
          name: user?.profile?.name || '教練',
          first_login_completed: true
        }, { onConflict: 'email' });

      if (error) throw error;

      alert('簽到成功！獲得 +10 XP 🎊');
      setShowGainAnim(true);
      setTimeout(() => setShowGainAnim(false), 2000);
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
    <div className="coach-level">
      <header className="page-header">
        <h2 className="page-title">教練等級系統</h2>
        <p className="page-subtitle">升級解鎖更多福利與特權</p>
        {xpData.total_xp === 0 && (
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
            系統辨識帳號：{user?.email || '未偵測'}
          </p>
        )}
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
            <div className="badge-small">Lv.{currentLevel?.level === 11 ? 'MAX' : (currentLevel?.level || 1)}</div>
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
              <h3 className="user-name">{xpData.name || user?.profile?.name || '教練'}</h3>
              <span className={`gender-tag ${xpData.gender === '女' ? 'female' : 'male'}`}>
                {xpData.gender === '女' ? '♀' : (xpData.gender === '男' ? '♂' : '??')}
              </span>
            </div>

            <p className="total-xp">總 XP：<span className="blue-text">{xpData.total_xp.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="target-label">{nextLevel ? `距離 ${nextLevel.title}` : '已達成最高等級'}</span>
            <span className="needed-xp">{nextLevel ? `還需 ${(nextLevel.min_xp - xpData.total_xp).toLocaleString()} XP` : '恭喜！'}</span>
          </div>
          <div className="progress-track">
            <div className={`progress-thumb ${showGainAnim ? 'gain-pulse' : ''}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
          </div>
          <div className="progress-footer">
            <span>{xpData.total_xp.toLocaleString()} XP</span>
            <span>{nextLevel ? `${nextLevel.min_xp.toLocaleString()} XP` : 'MAX'}</span>
          </div>

          {/* Daily Check-in Button */}
          <div className="checkin-container">
            {showGainAnim && <div className="flying-xp">+10 XP</div>}
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
        </div>

        {/* Bio Section */}
        <div className="bio-container show">
          <div className="bio-header">
            <span className="bio-label">個人簡介</span>
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
              placeholder="介紹一下你自己吧..."
              maxLength={150}
              autoFocus
            />
          ) : (
            <p className={`bio-text ${!xpData.bio ? 'empty' : ''}`}>
              {xpData.bio || '點擊編輯新增個人簡介，讓學員更認識你！'}
            </p>
          )}
        </div>

        {/* Level Roadmap */}
        <section className="dashboard-section">
          <div className="section-title-row">
            <h3 className="section-title">等級路線圖</h3>
            <button className="expand-btn" onClick={() => setShowAllLevels(!showAllLevels)}>
              {showAllLevels ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className="roadmap">
            {(showAllLevels 
              ? (levels || []) 
              : (levels || []).filter(l => currentLevel.level === l.level)
            ).map((l) => (
              <div
                key={l.level}
                className={`roadmap-item ${xpData.total_xp >= l.min_xp ? 'completed' : ''} ${currentLevel.level === l.level ? 'current' : ''}`}
                onClick={() => setSelectedLevel(l)}
              >
                <div className="roadmap-icon"><Award size={16} /></div>
                <div className="roadmap-info">
                  <div className="rm-top">
                    <h4 className="rm-name">{l.title}</h4>
                    {currentLevel.level === l.level && <span className="current-tag">當前</span>}
                  </div>
                  <p className="rm-meta">Lv.{l.level === 11 ? 'MAX' : l.level} ‧ 需要 {l.min_xp.toLocaleString()} XP</p>
                </div>
                <div className="rm-action">
                  <ChevronRight size={16} color="#444" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to earn XP */}
        <section className="dashboard-section" style={{ marginTop: '32px' }}>
          <div className="section-title-row">
            <h3 className="section-title">如何獲得 XP</h3>
          </div>

          <div className="earn-form-card">
            <div className="form-header">
              <div className="col-label">獎勵項目</div>
              <div className="col-value">XP 點數</div>
            </div>
            <div className="form-body">
              {(rules || []).map((rule, idx) => (
                <div key={rule.id || idx} className="form-row">
                  <div className="item-title">{rule.title}</div>
                  <div className="item-xp">+{rule.xp_value} <span className="xp-label">XP</span></div>
                </div>
              ))}
            </div>
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
                <p className="modal-subtitle">Lv.{selectedLevel.level === 11 ? 'MAX' : selectedLevel.level} 等級權益</p>
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
                <div className="req-label">晉升要求</div>
                <div className="req-val">{selectedLevel.min_xp.toLocaleString()} XP</div>
              </div>
            </div>

            <button className="modal-action-btn" onClick={() => setSelectedLevel(null)}>
              我知道了
            </button>
          </div>
        </div>
      )}

      <style>{`
        .coach-level { 
          display: flex; 
          flex-direction: column; 
          height: 100%; 
          border-radius: 30px; 
          background: #0a0a0b;
          background-image: url("data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='75' y='75' font-family='Arial, sans-serif' font-weight='900' font-size='22' fill='white' fill-opacity='0.06' text-anchor='middle' transform='rotate(-35, 75, 75)'%3EJENZiQ%3C/text%3E%3C/svg%3E");
          background-attachment: fixed;
        }
        .page-header { padding: 24px 20px 16px; position: relative; z-index: 10; }
        .page-title { font-size: 26px; font-weight: 900; color: white; letter-spacing: -1px; }
        .page-subtitle { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 600; }
        .level-content { flex: 1; overflow-y: auto; padding: 0 16px 20px; scrollbar-width: none; position: relative; z-index: 10; }
        .level-content::-webkit-scrollbar { display: none; }
        
        .level-summary-card { 
          background: linear-gradient(to bottom, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop'); 
          background-size: cover;
          background-position: center;
          border-radius: 28px; 
          padding: 24px; 
          display: flex; 
          align-items: center; 
          gap: 24px; 
          border: 1px solid rgba(59, 130, 246, 0.3); 
          margin-bottom: 24px; 
          position: relative;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .level-summary-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 100%;
          background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), transparent);
          pointer-events: none;
        }
        
        .avatar-wrapper { position: relative; cursor: pointer; }
        .avatar-container { 
          width: 92px; height: 92px; 
          background: rgba(255, 255, 255, 0.05); 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          overflow: hidden; 
          border: 3px solid rgba(59, 130, 246, 0.5); 
          position: relative; 
          transition: 0.3s;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        .avatar-container.blur { opacity: 0.5; }
        .avatar-container:hover .avatar-overlay { opacity: 1; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.15); }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.2s; }
        .badge-small { 
          position: absolute; bottom: -2px; right: -2px; 
          background: linear-gradient(135deg, #3B82F6, #2563EB); 
          color: white; font-size: 11px; font-weight: 900; 
          padding: 3px 10px; border-radius: 12px; 
          border: 2px solid #0F172A; 
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        }
        
        .level-badge { 
          background: rgba(59, 130, 246, 0.2); 
          color: #60A5FA; 
          font-size: 11px; font-weight: 800; 
          padding: 4px 12px; border-radius: 8px; 
          display: inline-flex; align-items: center; gap: 4px; 
          border: 1px solid rgba(59, 130, 246, 0.3);
          text-transform: uppercase; letter-spacing: 0.5px; 
        }
        .profile-main-info { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
        .user-name { font-size: 26px; font-weight: 900; color: white; letter-spacing: -0.5px; }
        .gender-tag { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
        .gender-tag.male { background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); }
        .gender-tag.female { background: rgba(236, 72, 153, 0.2); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3); }
        .total-xp { font-size: 14px; color: rgba(255,255,255,0.6); font-weight: 600; }
        .blue-text { color: #60A5FA; font-weight: 900; }
        
        .progress-section { 
          background: rgba(255,255,255,0.03); 
          border: 1px solid rgba(255,255,255,0.05); 
          border-radius: 24px; 
          padding: 20px; 
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }
        .progress-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; }
        .target-label { color: white; font-weight: 800; font-size: 13px; }
        .needed-xp { color: rgba(255,255,255,0.4); font-weight: 600; }
        .progress-track { height: 10px; background-color: rgba(255, 255, 255, 0.05); border-radius: 10px; margin-bottom: 8px; overflow: hidden; position: relative; }
        .progress-thumb { 
          height: 100%; 
          background: linear-gradient(to right, #6366F1, #3B82F6, #60A5FA); 
          border-radius: 10px; 
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); 
          transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .progress-thumb::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; width: 30px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          animation: scanLine 2s infinite linear;
        }
        @keyframes scanLine {
          from { transform: translateX(-100px); }
          to { transform: translateX(100px); }
        }
        .progress-footer { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 4px; font-weight: 700; }

        .checkin-btn {
          width: 100%;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
          margin-top: 12px;
        }
        .checkin-btn:not(.disabled):hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
        }
        .checkin-btn:active { transform: translateY(-1px); }
        .checkin-btn.disabled {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          color: rgba(255,255,255,0.2);
          cursor: default;
          box-shadow: none;
        }

        .bio-container { 
          background: rgba(25, 25, 27, 0.6); 
          border: 1px solid rgba(255,255,255,0.08); 
          border-radius: 24px; 
          padding: 20px; 
          margin-bottom: 32px;
          backdrop-filter: blur(10px);
        }
        .bio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .bio-label { font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.5); }
        .edit-bio-btn { background: none; border: none; color: #60A5FA; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .edit-actions { display: flex; gap: 10px; }
        .save-bio-btn, .cancel-bio-btn { width: 32px; height: 32px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .save-bio-btn { background: #3B82F6; color: white; }
        .cancel-bio-btn { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
        .bio-text { font-size: 15px; color: #eee; line-height: 1.6; font-weight: 600; }
        .bio-text.empty { font-style: italic; color: rgba(255,255,255,0.3); }
        .bio-textarea { width: 100%; background: #000; border: 1px solid #3B82F6; border-radius: 16px; padding: 14px; color: white; font-size: 15px; line-height: 1.6; outline: none; resize: none; min-height: 100px; }
        
        .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 4px; }
        .section-title { font-size: 20px; font-weight: 900; color: white; letter-spacing: -0.5px; }
        .expand-btn { background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.4); width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .expand-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        
        /* Reward Form Styles */
        .earn-form-card {
          background: rgba(20, 20, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(15px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .form-body { display: flex; flex-direction: column; }
        .form-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: 0.2s;
        }
        .form-row:last-child { border-bottom: none; }
        .form-row:hover { background: rgba(255, 255, 255, 0.02); }
        .item-title { color: #ccc; font-size: 14px; font-weight: 700; flex: 1; padding-right: 12px; line-height: 1.4; }
        .item-xp { color: #f97316; font-size: 15px; font-weight: 900; white-space: nowrap; }
        .xp-label { font-size: 10px; color: rgba(255,255,255,0.4); margin-left: 2px; }
        
        .roadmap { display: flex; flex-direction: column; gap: 14px; }
        .roadmap-item { 
          background: rgba(255,255,255,0.02); 
          border-radius: 22px; 
          padding: 18px; 
          display: flex; 
          align-items: center; 
          gap: 18px; 
          border: 1px solid rgba(255,255,255,0.05); 
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
          cursor: pointer; 
        }
        .roadmap-item:active { transform: scale(0.97); }
        .roadmap-item.completed { border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.02); }
        .roadmap-item.current { 
          border-color: #3B82F6; 
          background: rgba(59, 130, 246, 0.08); 
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1);
        }
        .roadmap-icon { 
          width: 48px; height: 48px; 
          background: rgba(255,255,255,0.04); 
          border-radius: 16px; 
          display: flex; align-items: center; justify-content: center; 
          color: white; 
          border: 1px solid rgba(255,255,255,0.05);
        }
        .roadmap-item.current .roadmap-icon { background: #3B82F6; color: white; border-color: transparent; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
        .roadmap-info { flex: 1; }
        .rm-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .rm-name { font-size: 16px; font-weight: 800; color: white; }
        .rm-meta { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 600; }
        .current-tag { 
          background: #3B82F6; 
          color: white; 
          font-size: 10px; font-weight: 900; 
          padding: 3px 10px; border-radius: 8px; 
          text-transform: uppercase;
        }
        
        /* Modal Styles */
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
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* XP Gain Animations */
        .checkin-container { position: relative; }
        .flying-xp {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          color: #60A5FA;
          font-weight: 900;
          font-size: 18px;
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
          pointer-events: none;
          animation: floatUpAndFade 1.5s ease-out forwards;
          z-index: 100;
        }
        @keyframes floatUpAndFade {
          0% { opacity: 0; transform: translate(-50%, 0); scale: 0.5; }
          20% { opacity: 1; transform: translate(-50%, -20px); scale: 1.2; }
          100% { opacity: 0; transform: translate(-50%, -80px); scale: 1; }
        }
        .progress-thumb.gain-pulse {
          animation: barGlow 1.5s ease;
        }
        @keyframes barGlow {
          0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); filter: brightness(1); }
          50% { box-shadow: 0 0 30px rgba(96, 165, 250, 1); filter: brightness(1.5); }
          100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); filter: brightness(1); }
        }

        .loader-container { display: flex; flex-direction: column; height: 100%; align-items: center; justify-content: center; color: var(--text-secondary); gap: 12px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CoachLevel;
