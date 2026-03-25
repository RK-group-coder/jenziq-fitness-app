import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, MessageCircle, MoreHorizontal, Loader2, UserCheck, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabase';

const COACH_LEVELS = [
  { level: 1, title: '見習教練', min_xp: 0 },
  { level: 2, title: 'LV2 入門教練', min_xp: 1000 },
  { level: 3, title: 'LV3 初階教練', min_xp: 2000 },
  { level: 4, title: 'LV4 資深教練', min_xp: 3500 },
  { level: 5, title: 'LV5 專業教練', min_xp: 5000 },
  { level: 6, title: 'LV6 菁英教練', min_xp: 6500 },
  { level: 7, title: 'LV7 專精教練', min_xp: 8000 },
  { level: 8, title: 'LV8 核心教練', min_xp: 10000 },
  { level: 9, title: 'LV9 至尊教練', min_xp: 13000 },
  { level: 10, title: 'LV10 首席教練', min_xp: 16000 },
  { level: 11, title: 'LV:MAX 品牌代表教練', min_xp: 20000 },
];

const STUDENT_LEVELS = [
  { level: 1, title: '新手學院', min_xp: 0 },
  { level: 2, title: '基礎學員', min_xp: 100 },
  { level: 3, title: '成長學院', min_xp: 300 },
  { level: 4, title: '穩定學員', min_xp: 500 },
  { level: 5, title: '資深學員', min_xp: 1000 },
  { level: 6, title: '精進學員', min_xp: 1500 },
  { level: 7, title: '菁英學員', min_xp: 2000 },
  { level: 8, title: '核心學員', min_xp: 3000 },
  { level: 9, title: '典範學員', min_xp: 5000 },
  { level: 10, title: '品牌模範學員', min_xp: 10000 },
];

const getLevelInfo = (role, xp) => {
  const levels = role === 'coach' ? COACH_LEVELS : STUDENT_LEVELS;
  let currentLevel = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].min_xp) {
      currentLevel = levels[i];
      break;
    }
  }
  return currentLevel;
};

const FriendList = ({ user, onBack, onSelectFriend }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bindings, setBindings] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'find'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (mode === 'list') {
      fetchFriends();
    } else if (mode === 'find' && !searchQuery.trim()) {
      fetchAllCoaches();
    }
  }, [user.email, mode]);

  const fetchAllCoaches = async () => {
    try {
      setIsSearching(true);
      const myEmail = user?.email?.toLowerCase();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email, name, role, total_xp, avatar_url, gender, branch')
        .eq('role', 'coach')
        .neq('email', myEmail)
        .order('name');

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Fetch all coaches error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      const normalizedEmail = user?.email?.toLowerCase();
      console.log('Fetching friends for:', normalizedEmail);

      const { data, error } = await supabase
        .from('friends')
        .select('friend_email')
        .eq('user_email', normalizedEmail);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Friend emails found:', data);
        const friendEmails = data.map(f => f.friend_email);
        const { data: profiles, error: pError } = await supabase
          .from('user_profiles')
          .select('email, name, role, total_xp, avatar_url, gender, branch')
          .in('email', friendEmails);

        if (pError) throw pError;
        console.log('Friend profiles found:', profiles);
        // 過濾掉「支援中心」
        const filteredProfiles = (profiles || []).filter(p => p.name !== '支援中心');
        setFriends(filteredProfiles);

        // 抓取綁定資料
        if (user?.role === 'student') {
          const { data: bData } = await supabase
            .from('coach_bindings')
            .select('*')
            .eq('student_email', normalizedEmail)
            .in('status', ['pending', 'accepted']);
          setBindings(bData || []);
        } else if (user?.role === 'coach') {
          const { data: bData } = await supabase
            .from('coach_bindings')
            .select('*')
            .eq('coach_email', normalizedEmail)
            .in('status', ['pending', 'accepted']);
          setBindings(bData || []);
        }
      } else {
        console.log('No friendships found in database for this email.');
        setFriends([]);
      }
    } catch (err) {
      console.error('Fetch friends error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchAllCoaches();
      return;
    }

    if (mode === 'find') {
      setIsSearching(true);
      try {
        const myEmail = user?.email?.toLowerCase();
        const { data, error } = await supabase
          .from('user_profiles')
          .select('email, name, role, total_xp, avatar_url, gender, branch')
          .eq('role', 'coach') // 強制過濾只能搜尋教練
          .neq('email', myEmail)
          .ilike('name', `%${query}%`);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const addFriend = async (friendEmail) => {
    try {
      // 雙向好友
      const friendshipData = [
        { user_email: user.email.toLowerCase(), friend_email: friendEmail.toLowerCase() },
        { user_email: friendEmail.toLowerCase(), friend_email: user.email.toLowerCase() }
      ];

      const { error } = await supabase.from('friends').upsert(friendshipData, { onConflict: 'user_email,friend_email' });
      if (error) throw error;

      alert('好友添加成功！');
      fetchFriends(); // 重新整理清單
    } catch (err) {
      alert('添加失敗: ' + err.message);
    }
  };

  const requestBinding = async (coachEmail) => {
    try {
      const { error } = await supabase.from('coach_bindings').insert([{
        student_email: user.email.toLowerCase(),
        coach_email: coachEmail.toLowerCase(),
        status: 'pending'
      }]);
      if (error) throw error;
      alert('已送出綁定申請！');
      fetchFriends();
    } catch (err) {
      alert('申請失敗: ' + err.message);
    }
  };

  const cancelBinding = async (bindingId) => {
    if (!window.confirm('確定要取消與這位教練的綁定/申請嗎？')) return;
    try {
      const { error } = await supabase
        .from('coach_bindings')
        .update({ status: 'unbound' })
        .eq('id', bindingId);
      if (error) throw error;
      alert('已取消！');
      fetchFriends();
    } catch (err) {
      alert('取消失敗: ' + err.message);
    }
  };

  const handleShowProfile = async (friend) => {
    try {
      setProfileLoading(true);
      setSelectedProfile({ ...friend, bio: '', certificates: [] });

      // Fetch more details (bio from profiles, and certificates if coach)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('bio')
        .eq('email', friend.email)
        .single();
      
      let certs = [];
      if (friend.role === 'coach') {
        const { data: certData } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_email', friend.email);
        certs = certData || [];
      }

      setSelectedProfile(prev => ({
        ...prev,
        bio: profileData?.bio || '這位用戶還沒有填寫自我介紹。',
        certificates: certs
      }));
    } catch (err) {
      console.error('Error fetching profile details:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // 排序：已綁定的教練置頂
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    let aBound, bBound;
    if (user?.role === 'student') {
      aBound = bindings.some(bd => bd.coach_email === a.email && bd.status === 'accepted');
      bBound = bindings.some(bd => bd.coach_email === b.email && bd.status === 'accepted');
    } else if (user?.role === 'coach') {
      aBound = bindings.some(bd => bd.student_email === a.email && bd.status === 'accepted');
      bBound = bindings.some(bd => bd.student_email === b.email && bd.status === 'accepted');
    } else {
      return 0;
    }
    
    if (aBound && !bBound) return -1;
    if (!aBound && bBound) return 1;
    return 0;
  });

  return (
    <div className="friend-list-panel">
      <header className="panel-header">
        {mode === 'find' ? (
          <button className="back-btn" onClick={() => { setMode('list'); setSearchQuery(''); }}><ChevronLeft size={24} /></button>
        ) : (
          <button className="back-btn" onClick={onBack}><X size={24} /></button>
        )}
        <h2 className="panel-title">{mode === 'find' ? '尋找朋友 (僅限教練)' : '朋友清單'}</h2>
        <div className="header-actions">
          {mode === 'list' && (
            <>
              <button className="icon-btn-small" onClick={fetchFriends} title="重新整理">
                <Loader2 size={18} className={isLoading ? 'spin' : ''} />
              </button>
              <button className="icon-btn-small" onClick={() => setMode('find')} title="尋找朋友">
                <UserPlus size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder={mode === 'find' ? "輸入姓名搜尋教練..." : "搜尋現有好友..."}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="friends-container">
        {isLoading && mode === 'list' ? (
          <div className="empty-state"><Loader2 className="spin" /></div>
        ) : mode === 'find' ? (
          isSearching ? (
            <div className="empty-state"><Loader2 className="spin" /></div>
          ) : (
            searchResults.length > 0 ? (
              searchResults.map(person => (
                <div key={person.email} className="friend-item">
                  <div className="friend-avatar">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt={person.name} className="avatar-img" />
                    ) : (
                      <div className="avatar-placeholder">{person.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="friend-info">
                    <div className="name-row">
                      <span className="name">{person.name}</span>
                      <span className={`role-tag ${person.role}`}>
                        {person.role === 'coach' ? '教練' : '學員'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="gender-tag">{person.gender || '?'}</span>
                      <span className="branch-text">{person.branch || '未分店'}</span>
                    </div>
                    <div className="level-info">
                      <span className="level-badge">LV.{getLevelInfo(person.role, person.total_xp).level}</span>
                      <span className="title-text">{getLevelInfo(person.role, person.total_xp).title}</span>
                    </div>
                  </div>
                  <div className="friend-actions">
                    {friends.some(f => f.email === person.email) ? (
                      <span className="already-friend"><UserCheck size={18} /> 已是好友</span>
                    ) : (
                      <button className="add-action-btn" onClick={() => addFriend(person.email)}>
                        <UserPlus size={18} /> 加好友
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                {searchQuery ? '找不到符合條件的教練' : '輸入姓名或關鍵字來尋找教練'}
              </div>
            )
          )
        ) : (
          sortedFriends.length > 0 ? (
            sortedFriends.map(friend => {
              const boundRecord = user?.role === 'student' 
                ? bindings.find(b => b.coach_email === friend.email) 
                : bindings.find(b => b.student_email === friend.email);
              const hasActiveBinding = user?.role === 'student' ? bindings.some(b => b.status === 'accepted' || b.status === 'pending') : false;

              return (
              <div key={friend.email} className={`friend-item ${boundRecord?.status === 'accepted' ? 'bound-item' : ''}`}>
                <div className="friend-avatar">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt={friend.name} className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">{friend.name.charAt(0)}</div>
                  )}
                  <div className="status-indicator online"></div>
                </div>
                <div className="friend-info">
                  <div className="name-row">
                    <span className="name">{friend.name}</span>
                    <span className={`role-tag ${friend.role}`}>{friend.role === 'coach' ? '教練' : '學員'}</span>
                    {boundRecord?.status === 'accepted' && (
                      <span className="bound-indicator">
                        <UserCheck size={12}/> {user?.role === 'coach' ? '您的綁定學員' : '已綁定此教練'}
                      </span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="gender-tag">{friend.gender || '?'}</span>
                    <span className="branch-text">{friend.branch || '未分店'}</span>
                  </div>
                  <div className="level-info">
                    <span className="level-badge">LV.{getLevelInfo(friend.role, friend.total_xp).level}</span>
                    <span className="title-text">{getLevelInfo(friend.role, friend.total_xp).title}</span>
                  </div>
                </div>
                <div className="friend-actions">
                  {user?.role === 'student' && friend.role === 'coach' && friend.email !== 'test@gmail.com' && (
                    boundRecord ? (
                      boundRecord.status === 'accepted' ? (
                        <button className="add-action-btn bound-btn" onClick={() => cancelBinding(boundRecord.id)}>解除綁定</button>
                      ) : (
                        <button className="add-action-btn pending-btn" onClick={() => cancelBinding(boundRecord.id)}>取消申請</button>
                      )
                    ) : (
                      <button 
                        className="add-action-btn bind-btn" 
                        onClick={() => requestBinding(friend.email)}
                        disabled={hasActiveBinding}
                        style={{ opacity: hasActiveBinding ? 0.3 : 1 }}
                      >
                        {hasActiveBinding ? '已申請' : '綁定教練'}
                      </button>
                    )
                  )}
                  <button className="chat-btn" onClick={() => onSelectFriend(friend)}><MessageCircle size={18} /></button>
                  <button className="more-btn" onClick={() => handleShowProfile(friend)}><MoreHorizontal size={18} /></button>
                </div>
              </div>
            )})
          ) : (
            <div className="empty-state">
              {searchQuery ? '找不到好友' : '尚無好友，去尋找朋友吧！'}
            </div>
          )
        )}
      </div>

      {/* Profile Detail Overlay */}
      {selectedProfile && (
        <div className="profile-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="profile-card" onClick={e => e.stopPropagation()}>
            <button className="close-profile" onClick={() => setSelectedProfile(null)}><X size={20} /></button>
            <div className="profile-header">
              <div className="profile-avatar-large">
                {selectedProfile.avatar_url ? (
                  <img src={selectedProfile.avatar_url} alt={selectedProfile.name} />
                ) : (
                  <div className="placeholder">{selectedProfile.name.charAt(0)}</div>
                )}
              </div>
              <h3 className="profile-name">{selectedProfile.name}</h3>
              <p className="profile-role">
                {selectedProfile.role === 'coach' ? 'JENZiQ 教練' : 'JENZiQ 學員'} ‧ {selectedProfile.branch || '未分店'}
              </p>
            </div>
            
            <div className="profile-body">
              <div className="profile-section">
                <h4>自我介紹</h4>
                {profileLoading ? (
                  <div className="mini-loader"><Loader2 size={16} className="spin" /> 載入中...</div>
                ) : (
                  <p className="bio-text">{selectedProfile.bio}</p>
                )}
              </div>

              {selectedProfile.role === 'coach' && (
                <div className="profile-section">
                  <h4>專業證照</h4>
                  {profileLoading ? (
                    <div className="mini-loader"><Loader2 size={16} className="spin" /> 載入中...</div>
                  ) : selectedProfile.certificates?.length > 0 ? (
                    <div className="cert-list">
                      {selectedProfile.certificates.map(cert => (
                        <div key={cert.id} className="cert-item">
                          <UserCheck size={14} className="cert-icon" />
                          <span>{cert.certificate_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">尚無證照資訊</p>
                  )}
                </div>
              )}
            </div>
            
            <button className="profile-chat-btn" onClick={() => { onSelectFriend(selectedProfile); setSelectedProfile(null); }}>
              直接發送訊息
            </button>
          </div>
        </div>
      )}

      <style>{`
        .friend-list-panel {
          height: 100%; display: flex; flex-direction: column;
          background-color: var(--background); color: white;
        }
        .panel-header {
          padding: 12px 16px; display: flex; align-items: center;
          background: #111827; border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 100;
        }
        .panel-title { font-size: 17px; font-weight: 700; flex: 1; text-align: center; color: white; margin: 0; }
        .back-btn { 
          background: none; border: none; color: white; cursor: pointer; 
          padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s; margin-right: 4px;
        }
        .back-btn:hover { background: rgba(255,255,255,0.1); }
        .header-actions { display: flex; gap: 4px; }
        .icon-btn-small {
          background: none; border: none; color: white;
          width: 40px; height: 40px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          transition: background 0.2s;
        }
        .icon-btn-small:hover { background: rgba(255,255,255,0.1); }
        .icon-btn-small:active { transform: scale(0.95); }
        .search-bar { margin: 16px 20px; position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 12px; color: var(--text-secondary); }
        .search-bar input {
          width: 100%; padding: 12px 12px 12px 40px; background: var(--secondary-bg);
          border: 1px solid var(--border); border-radius: 12px; color: white; font-size: 14px;
        }
        .friends-container { flex: 1; overflow-y: auto; padding: 0 20px; }
        .friend-item { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .friend-item.bound-item { background: linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%); border-radius: 8px; padding-left: 10px; border-left: 3px solid #10B981; margin: 4px 0; }
        .bound-indicator { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.3); }
        
        .friend-avatar { position: relative; margin-right: 12px; }
        .avatar-placeholder {
          width: 48px; height: 48px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px;
        }
        .status-indicator {
          position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
          border-radius: 50%; border: 2px solid var(--background);
        }
        .status-indicator.online { background-color: #10B981; }
        
        .avatar-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        
        .friend-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .name-row { display: flex; align-items: center; gap: 8px; }
        .name { font-weight: 600; font-size: 15px; }
        
        .detail-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary); }
        .gender-tag { background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 4px; }
        .branch-text { opacity: 0.8; }
        
        .level-info { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .level-badge { font-size: 10px; font-weight: 800; color: #F59E0B; background: rgba(245, 158, 11, 0.1); padding: 1px 4px; border-radius: 3px; border: 1px solid rgba(245, 158, 11, 0.2); }
        .title-text { font-size: 11px; color: #94A3B8; }

        .role-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
        .role-tag.coach { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
        .role-tag.student { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .role-tag.student { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .status-text { font-size: 12px; color: var(--text-secondary); }
        
        .friend-actions { display: flex; gap: 12px; align-items: center; }
        .chat-btn, .more-btn, .add-action-btn {
          background: rgba(255,255,255,0.05); border: none; color: var(--text-secondary);
          height: 36px; border-radius: 10px; display: flex; align-items: center; 
          justify-content: center; cursor: pointer; padding: 0 12px; gap: 6px; font-size: 13px; font-weight: 600;
          transition: all 0.2s ease;
        }
        .chat-btn:hover, .more-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .chat-btn:active, .more-btn:active { transform: scale(0.95); }
        .chat-btn, .more-btn { width: 36px; padding: 0; }
        .add-action-btn { background: var(--primary); color: white; }
        .add-action-btn:hover { background: #FF7D1A; box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3); }
        .add-action-btn:active { transform: scale(0.95); }
        
        .bound-btn { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.3); }
        .bound-btn:hover { background: rgba(239, 68, 68, 0.2); }
        .pending-btn { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
        .pending-btn:hover { background: rgba(245, 158, 11, 0.2); }
        .bind-btn { background: #3B82F6; color: white; border: none; }
        .bind-btn:hover { background: #2563EB; box-shadow: 0 0 10px rgba(59,130,246,0.3); }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--text-secondary); font-size: 14px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Profile Detail Styles */
        .profile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          display: flex; align-items: flex-end; justify-content: center; z-index: 1100;
          backdrop-filter: blur(8px); padding-bottom: 20px;
        }
        .profile-card {
          width: 95%; max-width: 450px; background: #1a1a1a;
          border-radius: 28px; padding: 32px 24px; position: relative;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .close-profile {
          position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.05);
          border: none; color: white; width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .profile-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; text-align: center; }
        .profile-avatar-large { width: 90px; height: 90px; margin-bottom: 16px; position: relative; }
        .profile-avatar-large img, .profile-avatar-large .placeholder {
          width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
          border: 3px solid var(--primary); background: linear-gradient(135deg, #3B82F6, #2563EB);
          display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800;
        }
        .profile-name { font-size: 20px; font-weight: 800; margin-bottom: 4px; color: white; }
        .profile-role { font-size: 14px; color: #94A3B8; }
        
        .profile-body { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
        .profile-section h4 { font-size: 14px; font-weight: 700; color: var(--primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .bio-text { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.8); white-space: pre-wrap; }
        .mini-loader { font-size: 12px; color: #888; display: flex; align-items: center; gap: 6px; }
        
        .cert-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .cert-item {
          background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10B981; padding: 4px 10px; border-radius: 8px; font-size: 12px;
          display: flex; align-items: center; gap: 6px; font-weight: 600;
        }
        .empty-text { font-size: 14px; color: #555; }
        .profile-chat-btn {
          width: 100%; background: var(--primary); border: none; color: white;
          padding: 14px; border-radius: 12px; font-weight: 800; font-size: 16px;
          cursor: pointer; transition: all 0.2s;
        }
        .profile-chat-btn:hover { background: #FF7D1A; box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3); }
      `}</style>
    </div>
  );
};

export default FriendList;
