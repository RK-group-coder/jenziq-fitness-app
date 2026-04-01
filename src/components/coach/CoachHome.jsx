import React, { useState, useEffect } from 'react';
import { Bell, Flame, Users, Award, ChevronRight, Zap, Loader2, Brain, Activity, CalendarDays, Camera, Edit2, Trophy, X, Eye, Image as ImageIcon, FileBadge, Bot } from 'lucide-react';
import { supabase } from '../../supabase';
import coachAvatarDefault from '../../assets/coach-avatar.png';
import gymBg from '../../assets/gym-bg.png';
import RecommendedArticles from '../RecommendedArticles';
import certIcon from '../../assets/certificate-premium-v2.png';
import injuryIcon from '../../assets/injury-assessment-v2.png';
import toolNutrition from '../../assets/tool-nutrition.png';
import toolInjury from '../../assets/tool-injury.png';
import toolPlanner from '../../assets/tool-planner.png';
import toolPhotoCal from '../../assets/tool-photo-cal.png';
import toolExerciseDb from '../../assets/tool-exercise-db.png';


const FloatingCoachGuideBot = ({ onClick, isVisible, setIsVisible }) => {
  return (
    <div className={`floating-guide-bot ${isVisible ? 'show' : 'hide'}`}>
      <div className="bot-bubble" onClick={onClick}>
        <p>教練你好！需要了解如何使用 APP 的功能嗎？點我聊聊吧！👋</p>
      </div>
      <div className="bot-trigger" onClick={onClick}>
        <div className="robot-body-anim">
          {/* Head */}
          <div className="robot-head-v2">
            <div className="visor-v2">
              <div className="bot-eyes-v2">
                <span className="eye-v2"></span>
                <span className="eye-v2"></span>
              </div>
            </div>
            <div className="ear-glow-left"></div>
            <div className="ear-glow-right"></div>
          </div>
          
          {/* Neck Ring */}
          <div className="neck-ring"></div>
          
          {/* Torso & Shoulders */}
          <div className="body-container">
            <div className="shoulder-v2 left"></div>
            <div className="shoulder-v2 right"></div>
            <div className="robot-torso-v2">
              <div className="torso-detail"></div>
            </div>
          </div>
        </div>
        <div className="robot-platform-v2"></div>
      </div>
    </div>
  );
};

const CoachChatModal = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: '您好！我是教練專屬導航助手。我可以教您如何查看排課、管理學員人數，或是如何使用 AI 助手工具。請問有什麼我可以幫您的？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `你是一位 JENZiQ FITNESS APP 的「教練專用」智慧導覽導師。
              
              你的任務是教會教練如何使用此 APP，包含：
              1. 課表管理：如何點擊「查看班表」來新增、刪除或修改課程。
              2. 學員管理：如何查看已綁定的學員清單。
              3. 經驗值系統：教練如何透過教學、打卡、上傳證照來獲得 XP 並升級。
              4. AI 助手工具：
                 - AI 營養師：為學員規劃飲食。
                 - AI 傷害評估：幫學員檢測傷勢。
                 - 自動排課：快速生成動作組合。
                 - 照片熱量計算：拍食物照片錄入。
              
              請對教練展現出極具專業度、協助性且親切的態度。若教練問及「如何升級」，請說明 XP 的獲取規則（如教學、證照等）。`
            },
            ...messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: userMsg }
          ]
        })
      });

      const data = await response.json();
      const botReply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'bot', content: botReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: '抱歉，系統服務繁忙，請稍後再試。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="coach-chat-overlay" onClick={onClose}>
      <div className="coach-chat-modal" onClick={e => e.stopPropagation()}>
        <div className="cc-header">
          <div className="cc-title-row">
            <div className="cc-bot-icon">
              {/* Mini Robot Head for Avatar */}
              <div className="robot-head-v2" style={{ width: '28px', height: '26px', boxShadow: 'none' }}>
                <div className="visor-v2" style={{ width: '20px', height: '10px' }}>
                  <div className="bot-eyes-v2" style={{ gap: '4px' }}>
                    <span className="eye-v2" style={{ width: '4px', height: '4px' }}></span>
                    <span className="eye-v2" style={{ width: '4px', height: '4px' }}></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cc-title-group">
              <span className="cc-main-title">JENZiQ AI 助教</span>
              <span className="cc-status"><span className="status-dot"></span> 伺服器已連線</span>
            </div>
          </div>
          <button className="cc-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="cc-messages">
          {messages.map((m, i) => (
            <div key={i} className={`cc-bubble-wrap ${m.role === 'bot' ? 'bot' : 'user'}`}>
              <div className="cc-bubble">{m.content}</div>
            </div>
          ))}
          {isTyping && <div className="cc-typing">助教正在思考中...</div>}
        </div>
        
        <div className="cc-input-area">
          <input 
            type="text" 
            placeholder="請輸入您的問題..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <button className="cc-send-btn" onClick={handleSend}><Zap size={18} fill="white" /></button>
        </div>
      </div>
    </div>
  );
};

const CoachHome = ({ user, onNavigate }) => {
  const [profile, setProfile] = useState(null);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [todayCourses, setTodayCourses] = useState([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [certCount, setCertCount] = useState(0);

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showCertsModal, setShowCertsModal] = useState(false);
  const [modalStudents, setModalStudents] = useState([]);
  const [modalCerts, setModalCerts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isBotVisible, setIsBotVisible] = useState(true);

  const aiTools = [
    {
      id: 'nutrition',
      title: 'AI 營養師',
      badge: 'Smart Diet',
      description: '智慧飲食規劃，搭配三大營養素，自動生成每週菜單與 TDEE 計算',
      bgImage: toolNutrition,
      color: '#f97316',
      btnText: '開始規劃'
    },
    {
      id: 'injury',
      title: 'AI 傷害評估',
      badge: 'Injury Scan',
      description: '結合動態分析與壓力偵測，智慧偵測潛在傷害風險，提供復健建議',
      bgImage: toolInjury,
      color: '#ec4899',
      btnText: '即刻評估'
    },
    {
      id: 'planner',
      title: '自動排課系統',
      badge: 'Auto Plan',
      description: '依課程天數與區塊方式自動生成個人化課表與動作組合配置',
      bgImage: toolPlanner,
      color: '#3b82f6',
      btnText: '快速排課'
    },
    {
      id: 'photo_cal',
      title: '照片熱量計算',
      badge: 'Photo Cal',
      description: '拍攝食物照片，AI 自動分析組成、熱量及三大營養素含量',
      bgImage: toolPhotoCal,
      color: '#10b981',
      btnText: '拍照紀錄'
    },
    {
      id: 'warmup',
      title: '動作資料庫',
      badge: 'Exercise DB',
      description: '搜尋動作名稱與目標肌群，自動生成專業訓練計劃與組數建議',
      bgImage: toolExerciseDb,
      color: '#8b5cf6',
      btnText: '搜尋動作'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [user]);

  const openStudentsModal = async () => {
    setShowStudentsModal(true);
    setModalLoading(true);
    const searchEmail = user?.email?.trim().toLowerCase();
    const { data } = await supabase
      .from('coach_bindings')
      .select('student_email, status, created_at')
      .eq('coach_email', searchEmail)
      .eq('status', 'accepted');
    if (data && data.length > 0) {
      const emails = data.map(d => d.student_email);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('email, name, avatar_url, gender, total_xp')
        .in('email', emails);
      setModalStudents(profiles || []);
    } else {
      setModalStudents([]);
    }
    setModalLoading(false);
  };

  const openCertsModal = async () => {
    setShowCertsModal(true);
    setModalLoading(true);
    const searchEmail = user?.email?.trim().toLowerCase();
    const { data } = await supabase
      .from('coach_certifications')
      .select('*')
      .eq('coach_email', searchEmail)
      .eq('status', '核准')
      .order('created_at', { ascending: false });
    setModalCerts(data || []);
    setModalLoading(false);
  };

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const searchEmail = user?.email?.trim().toLowerCase();
      const userId = user?.id || user?.userIdString;
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const startOfMonth = `${yyyy}-${mm}-01`;
      const endOfMonth = new Date(yyyy, now.getMonth() + 1, 0);
      const endOfMonthStr = `${yyyy}-${mm}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

      const [userProfileRes, levelsRes, certCountRes, studentCountRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('email', searchEmail).maybeSingle(),
        supabase.from('coach_levels').select('*').order('min_xp', { ascending: true }),
        supabase.from('coach_certifications').select('count', { count: 'exact', head: true }).eq('coach_email', searchEmail).eq('status', '核准'),
        supabase.from('coach_bindings').select('count', { count: 'exact', head: true }).eq('coach_email', searchEmail).eq('status', 'accepted'),
      ]);

      setProfile(userProfileRes.data);
      setLevels(levelsRes.data || []);
      setCertCount(certCountRes.count || 0);
      setStudentCount(studentCountRes.count || 0);

      if (userId) {
        const [schedulesRes, monthlyRes] = await Promise.all([
          supabase.from('coach_schedule').select('*').eq('coach_id', userId).eq('date', todayStr).in('status', ['approved', 'pending']).order('start_time'),
          supabase.from('coach_schedule').select('count', { count: 'exact', head: true }).eq('coach_id', userId).gte('date', startOfMonth).lte('date', endOfMonthStr).eq('status', 'approved'),
        ]);

        const courses = (schedulesRes.data || []).map(s => ({ ...s, type: 'course' }));
        setTodayCourses(courses);
        setMonthlyCount(monthlyRes.count || 0);
      }
    } catch (err) {
      console.error('CoachHome fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const levelList = levels.length > 0 ? levels : [{ level: 1, title: '新手教練', min_xp: 0 }];
  const totalXp = profile?.total_xp || 0;
  const currentLevel = [...levelList].reverse().find(l => totalXp >= l.min_xp) || levelList[0];
  const nextLevel = levelList.find(l => l.min_xp > totalXp);
  const progress = nextLevel
    ? ((totalXp - currentLevel.min_xp) / (nextLevel.min_xp - currentLevel.min_xp)) * 100
    : 100;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={32} color="#f97316" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="coach-home">
      <div className="coach-scroll-content">
        <div className="top-header-bars">
           <div className="top-pill-left">
              <Zap size={14} fill="currentColor" />
              <span>{currentLevel.title.startsWith('LV') ? currentLevel.title : `LV${currentLevel.level === 11 ? 'MAX' : currentLevel.level} ${currentLevel.title}`}</span>
           </div>
           <div className="top-level-right">
              Level {currentLevel.level === 11 ? 'MAX' : currentLevel.level}
           </div>
        </div>

        <div className="premium-coach-card">
          <img src={gymBg} alt="" className="pc-gym-bg" />
          <div className="pc-gym-overlay"></div>

          <div className="pc-card-content">
            <div className="pc-top">
              <div className="pc-avatar">
                <img src={profile?.avatar_url || coachAvatarDefault} alt="Coach" />
                <div className="pc-trophy"><Trophy size={14} fill="currentColor" color="#fff" /></div>
              </div>
              
              <div className="pc-info">
                <div className="pc-name-row">
                  <h3 className="pc-name">{profile?.name || user?.profile?.name || '未設名稱'}</h3>
                  <Edit2 size={12} color="rgba(255,255,255,0.4)" />
                </div>
                
                <div className="pc-xp-row">
                  <Flame size={14} color="#f97316" fill="currentColor" />
                  <span className="pc-xp-val">{(profile?.total_xp || 0).toLocaleString()} XP</span>
                  <span className="pc-xp-total">/ {nextLevel ? nextLevel.min_xp.toLocaleString() : 'MAX'}</span>
                </div>
                
                <div className="pc-progress-wrap">
                  <div className="pc-progress-bar">
                    <div className="pc-progress-fill" style={{ width: `${Math.min(100, progress)}%` }}></div>
                  </div>
                  <div className="pc-progress-labels">
                    <span>0</span>
                    <span>{Math.floor(Math.min(100, progress))}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pc-divider"></div>
            
            <div className="pc-stats">
              <div className="pc-stat-item clickable" onClick={() => onNavigate('schedule')}>
                <div className="pc-stat-icon" style={{ borderColor: 'rgba(249,115,22,0.5)', color: '#f97316', background: 'rgba(249,115,22,0.15)' }}>
                  <CalendarDays size={18} />
                </div>
                <div className="pc-stat-val">{monthlyCount}</div>
                <div className="pc-stat-label">本月課程</div>
              </div>
              <div className="pc-stat-item clickable" onClick={openStudentsModal}>
                <div className="pc-stat-icon" style={{ borderColor: 'rgba(59,130,246,0.5)', color: '#3b82f6', background: 'rgba(59,130,246,0.15)' }}>
                  <Users size={18} />
                </div>
                <div className="pc-stat-val">{studentCount}</div>
                <div className="pc-stat-label">學員人數</div>
              </div>
              <div className="pc-stat-item clickable" onClick={openCertsModal}>
                <div className="pc-stat-icon premium-cert-icon">
                  <FileBadge size={22} />
                </div>
                <div className="pc-stat-val">{certCount}</div>
                <div className="pc-stat-label">持有證照</div>
              </div>
            </div>
          </div>
        </div>

        <section className="dashboard-section mt-30">
          <div className="section-header">
            <h3 className="section-title">今日課程</h3>
            <button className="view-link" onClick={() => onNavigate('schedule')}>查看班表 &gt;</button>
          </div>
          <div className="schedule-list">
            {todayCourses.length > 0 ? (
              todayCourses.map((item, idx) => (
                <div key={item.id || idx} className="schedule-item-premium">
                  <div className="schedule-color-bar" style={{ backgroundColor: item.color || '#f97316' }}></div>
                  <div
                    className="time-bubble-premium"
                    style={{ backgroundColor: item.color || '#f97316', boxShadow: `0 0 15px ${item.color || '#f97316'}40, inset 0 2px 5px rgba(255,255,255,0.2)` }}
                  >
                    {item.start_time?.slice(0, 5) || '??:??'}
                  </div>
                  <div className="schedule-info-p">
                    <h4 className="item-name-p">{item.title || (item.type === 'course' ? item.category : '未命名行程')}</h4>
                    <p className="item-detail-p">
                      {item.type === 'course'
                        ? `${item.student_name || '學員'} (${item.student_count || 1}位) ‧ ${item.status === 'pending' ? '待審核' : (item.is_completed ? '已完課' : '等待上課')}`
                        : `${item.content || '無備註'} ‧ ${item.status === 'pending' ? '待審核' : (item.is_completed ? '已完成' : '進行中')}`}
                    </p>
                  </div>
                  <div className={`status-dot-p ${item.is_completed ? 'completed' : ''}`} style={{ backgroundColor: item.is_completed ? '#10B981' : (item.color || '#f97316') }}></div>
                </div>
              ))
            ) : (
              <div className="empty-schedule-box">
                <p>今日課程空空如也 🏖️</p>
                <span>好好享受這難得的放空時光吧！</span>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section ai-tools-section">
          <div className="section-header-styled">
            <div className="section-accent" style={{ background: '#f97316' }}></div>
            <h3 className="section-title">AI 助手工具</h3>
          </div>
          <div className="ai-tools-list">
            {aiTools.map((tool, idx) => {
              const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              };
              return (
              <div 
                key={idx} 
                className="ai-banner-card" 
                style={{ 
                  '--tool-color': tool.color,
                  '--tool-glow': hexToRgba(tool.color, 0.25)
                }}
                onClick={() => onNavigate('tools:' + tool.id)}
              >
                <div className="ai-banner-content">
                  <div className="ai-banner-badge">{tool.badge}</div>
                  <h4 className="ai-banner-title">{tool.title}</h4>
                  <p className="ai-banner-desc">{tool.description}</p>
                  
                  <button className="ai-banner-btn">
                    {tool.btnText}
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div className="ai-banner-image-container">
                  <img src={tool.bgImage} alt="" className="ai-banner-3d-img" />
                </div>
              </div>
            )})}
          </div>
        </section>

        <RecommendedArticles />
      </div>

      {showStudentsModal && (
        <div className="home-modal-overlay" onClick={() => setShowStudentsModal(false)}>
          <div className="home-modal" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <h3>我的學員資料</h3>
              <button className="home-modal-close" onClick={() => setShowStudentsModal(false)}><X size={20} /></button>
            </div>
            <div className="home-modal-body">
              {modalLoading ? (
                <div className="home-modal-loading"><Loader2 className="spin" /></div>
              ) : modalStudents.length > 0 ? (
                <div className="home-modal-list">
                  {modalStudents.map((s, idx) => (
                    <div key={idx} className="home-modal-item">
                      <div className="hm-avatar">
                        <img src={s.avatar_url || coachAvatarDefault} alt="" />
                      </div>
                      <div className="hm-info">
                        <div className="hm-name-row">
                          <span className="hm-name">{s.name}</span>
                          <span className={`hm-gender-badge ${s.gender === '女' ? 'female' : 'male'}`}>
                            {s.gender === '女' ? '♀' : '♂'}
                          </span>
                        </div>
                        <span className="hm-xp">LV.{Math.floor((s.total_xp || 0) / 1000) + 1} ‧ {s.total_xp || 0} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="home-modal-empty">尚無綁定學員資料</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCertsModal && (
        <div className="home-modal-overlay" onClick={() => setShowCertsModal(false)}>
          <div className="home-modal" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <h3>持有證照資料</h3>
              <button className="home-modal-close" onClick={() => setShowCertsModal(false)}><X size={20} /></button>
            </div>
            <div className="home-modal-body">
              {modalLoading ? (
                <div className="home-modal-loading"><Loader2 className="spin" /></div>
              ) : modalCerts.length > 0 ? (
                <div className="home-modal-list">
                  {modalCerts.map((c, idx) => (
                    <div key={idx} className="home-modal-cert-item-expanded">
                      <div className="hm-cert-top">
                        <div className="hm-cert-icon premium-cert-icon-small">
                          <FileBadge size={22} />
                        </div>
                        <div className="hm-cert-main-info">
                          <span className="hm-cert-name-large">{c.cert_name || '未命名證照'}</span>
                          <span className="hm-cert-org">{c.organization || '未填寫機構'}</span>
                        </div>
                        <div className="hm-cert-xp-badge">+{c.xp_reward} XP</div>
                      </div>
                      <div className="hm-cert-footer">
                        <div className="hm-cert-cat">
                          <div className="cat-dot"></div>
                          {c.category === 'major' ? '四大證照 (四大證照)' : 
                           c.category === 'general' ? '一般證照 (一般證照)' :
                           c.category === 'short' ? '短期證照 (上課考試一天內)' : '研習證書'}
                        </div>
                        {c.proof_images && c.proof_images.length > 0 && (
                          <button 
                            className="hm-cert-view-btn"
                            onClick={() => setSelectedImg(c.proof_images[0])}
                          >
                            <ImageIcon size={14} />
                            展示大圖
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="home-modal-empty">尚無持有證照資料</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedImg && (
        <div className="img-viewer-overlay" onClick={() => setSelectedImg(null)}>
          <div className="img-viewer-container" onClick={e => e.stopPropagation()}>
            <button className="img-viewer-close" onClick={() => setSelectedImg(null)}><X size={24} /></button>
            <img src={selectedImg} alt="Certificate Proof" className="full-image" />
          </div>
        </div>
      )}

      <FloatingCoachGuideBot 
        isVisible={isBotVisible} 
        setIsVisible={setIsBotVisible} 
        onClick={() => setShowChatModal(true)} 
      />

      <CoachChatModal 
        isOpen={showChatModal} 
        onClose={() => setShowChatModal(false)} 
        user={user} 
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .coach-home {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .coach-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 20px;
        }
        .coach-scroll-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 20px 16px;
          scrollbar-width: none;
        }
        .coach-scroll-content::-webkit-scrollbar {
          display: none;
        }

        .top-header-bars {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          margin-top: 12px;
          padding: 0 4px;
        }
        .top-pill-left {
          background: linear-gradient(135deg, #FF8A00 0%, #FF5C00 100%);
          border-radius: 20px;
          padding: 6px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: white;
          font-weight: 800;
          font-size: 13px;
          box-shadow: 0 4px 15px rgba(255, 92, 0, 0.4);
        }
        .top-level-right {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          font-weight: 700;
        }

        .premium-coach-card {
          border: 1px solid rgba(255, 115, 0, 0.2);
          border-radius: 24px;
          padding: 0;
          margin-bottom: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }
        .pc-gym-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 0;
        }
        .pc-gym-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, rgba(10,7,10,0.88) 0%, rgba(18,12,10,0.80) 50%, rgba(10,7,10,0.88) 100%);
          z-index: 1;
        }
        .pc-card-content {
          position: relative;
          z-index: 2;
          padding: 24px;
        }

        .pc-top {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .pc-avatar {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          padding: 2px;
          background: linear-gradient(135deg, #f97316, transparent 60%);
          flex-shrink: 0;
        }
        .pc-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 18px;
          object-fit: cover;
          background: #111;
        }
        .pc-trophy {
          position: absolute;
          bottom: -6px;
          right: -6px;
          background: linear-gradient(135deg, #FF8A00 0%, #FF5C00 100%);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #110e11;
          box-shadow: 0 2px 8px rgba(255,92,0,0.5);
        }

        .pc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pc-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pc-name {
          font-size: 20px;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .pc-xp-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .pc-xp-val {
          color: #f97316;
          font-weight: 800;
        }
        .pc-xp-total {
          color: rgba(255,255,255,0.4);
          font-weight: 600;
        }

        .pc-progress-wrap {
          margin-top: 4px;
        }
        .pc-progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          margin-bottom: 6px;
          overflow: hidden;
        }
        .pc-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #f97316, #fbbf24);
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(249,115,22,0.5);
        }
        .pc-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-weight: 700;
        }

        .pc-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin-bottom: 24px;
        }

        .pc-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .pc-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .pc-stat-item.clickable {
          cursor: pointer;
          transition: transform 0.2s;
        }
        .pc-stat-item.clickable:active {
          transform: scale(0.95);
        }
        .pc-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .premium-cert-icon {
          border-color: rgba(168,85,247,0.6) !important;
          color: #a855f7 !important;
          background: rgba(168,85,247,0.15) !important;
          box-shadow: 0 0 15px rgba(168,85,247,0.2);
        }
        .premium-cert-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px dashed rgba(168,85,247,0.4);
          animation: spin 8s linear infinite;
          pointer-events: none;
        }
        .premium-cert-icon-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.3);
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .premium-cert-icon-small::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1px dashed rgba(249, 115, 22, 0.4);
          animation: spin 8s linear infinite;
        }
        .pc-stat-val {
          font-size: 20px;
          font-weight: 800;
          color: white;
          line-height: 1;
        }
        .pc-stat-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-weight: 600;
        }

        .mt-30 { margin-top: 30px; }
        .mb-16 { margin-bottom: 16px; }

        .dashboard-section {
          margin-bottom: 28px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .view-link {
          font-size: 13px;
          color: #f97316;
          font-weight: 700;
          background: none;
          padding: 0;
          border: none;
          cursor: pointer;
        }

        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .schedule-item-premium {
          background: #1a1a1e;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transition: transform 0.2s;
          position: relative;
          overflow: hidden;
        }
        .schedule-item-premium:active { transform: scale(0.98); }
        .schedule-color-bar {
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 4px;
          border-radius: 0 4px 4px 0;
        }
        .time-bubble-premium {
          color: white;
          font-size: 14px;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: 10px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          min-width: 65px;
          text-align: center;
        }
        .schedule-info-p {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .item-name-p {
          font-size: 16px;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .item-detail-p {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          margin: 0;
        }
        .status-dot-p {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }
        .status-dot-p.completed {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .empty-schedule-box {
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .empty-schedule-box p {
          color: white;
          font-weight: 700;
          font-size: 15px;
          margin: 0;
        }
        .empty-schedule-box span {
          color: rgba(255,255,255,0.4);
          font-size: 12px;
        }

        .section-header-styled {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .section-accent {
          width: 4px;
          height: 18px;
          border-radius: 4px;
        }

        .ai-tools-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .no-shadow { box-shadow: none !important; }

        .ai-banner-card {
          background: #111116;
          border-radius: 24px;
          height: 165px;
          position: relative;
          overflow: hidden;
          display: flex;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ai-banner-card:active { transform: scale(0.97); }

        .ai-banner-content {
          flex: 1.5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          z-index: 5;
          padding: 24px 0 24px 24px;
          background: linear-gradient(90deg, #111116 45%, rgba(17,17,22,0.8) 70%, transparent 100%);
        }
        .ai-banner-badge {
          font-size: 10px;
          font-weight: 800;
          color: var(--tool-color);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          opacity: 0.9;
        }
        .ai-banner-title {
          font-size: 22px;
          font-weight: 800;
          color: white;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        .ai-banner-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          margin: 0;
          line-height: 1.4;
          max-width: 220px;
          display: block;
          overflow: visible;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        }

        .ai-banner-btn {
          margin-top: 10px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 7px 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          transition: all 0.3s ease;
        }
        .ai-banner-card:hover .ai-banner-btn {
          background: var(--tool-color);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px var(--tool-glow);
        }

        .ai-banner-image-container {
          position: absolute;
          top: 0;
          right: 0;
          width: 65%;
          height: 100%;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
        }
        .ai-banner-3d-img {
          height: 160%;
          width: auto;
          object-fit: cover;
          opacity: 0.9;
          mask-image: linear-gradient(to left, black 30%, transparent 95%);
          -webkit-mask-image: linear-gradient(to left, black 30%, transparent 95%);
          transform: translateX(10%);
          transition: transform 0.5s ease;
        }
        .ai-banner-card:hover .ai-banner-3d-img {
          transform: translateX(5%) scale(1.05);
          opacity: 1;
        }

        .home-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }
        .home-modal {
          background: #1a1a1e;
          border: 1px solid rgba(255,122,0,0.3);
          border-radius: 28px;
          width: 100%;
          max-width: 380px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .home-modal-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .home-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: white;
        }
        .home-modal-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          padding: 4px;
        }
        .home-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .home-modal-loading {
          display: flex;
          justify-content: center;
          padding: 40px;
        }
        .home-modal-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .home-modal-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .home-modal-item:last-child { border-bottom: none; }
        .hm-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          overflow: hidden;
        }
        .hm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .hm-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .hm-name-row { display: flex; align-items: center; gap: 8px; }
        .hm-name { color: white; font-weight: 700; font-size: 16px; }
        .hm-gender-badge { font-size: 10px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .hm-gender-badge.male { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .hm-gender-badge.female { background: rgba(236,72,193,0.2); color: #ec4899; }
        .hm-xp { font-size: 12px; color: rgba(255,255,255,0.4); }

        .home-modal-cert-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .hm-cert-icon {
          width: 40px;
          height: 40px;
          background: rgba(249,115,22,0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hm-cert-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .hm-cert-name { color: white; font-weight: 700; font-size: 14px; }
        .hm-cert-meta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.4); }
        .hm-cert-xp { color: #f97316; font-weight: 800; }
        
        .home-modal-cert-item-expanded {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .hm-cert-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .hm-cert-main-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hm-cert-name-large {
          color: white;
          font-weight: 800;
          font-size: 16px;
        }
        .hm-cert-org {
          color: rgba(255,255,255,0.4);
          font-size: 12px;
        }
        .hm-cert-xp-badge {
          background: rgba(249,115,22,0.15);
          color: #f97316;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(249,115,22,0.2);
        }
        .hm-cert-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .hm-cert-cat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
        }
        .cat-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #f97316;
        }
        .hm-cert-view-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .hm-cert-view-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }

        .img-viewer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.95);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .img-viewer-container {
          position: relative;
          max-width: 95vw;
          max-height: 90vh;
        }
        .img-viewer-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }
        .full-image {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 0 40px rgba(0,0,0,0.5);
        }

        .home-modal-empty {
          text-align: center;
          color: rgba(255,255,255,0.3);
          padding: 40px 0;
          font-size: 14px;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        /* Floating Coach Guide Bot */
        .floating-guide-bot {
          position: fixed;
          bottom: 120px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          z-index: 1000;
          pointer-events: none;
        }
        .floating-guide-bot * { pointer-events: auto; }
        
        .bot-bubble {
          background: #FFFFFF;
          border-radius: 20px 20px 4px 20px;
          padding: 12px 16px;
          max-width: 180px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.25);
          cursor: pointer;
          animation: bounceInBot 0.5s ease;
          transition: 0.3s;
        }
        .bot-bubble p {
          color: #2D3748;
          font-size: 13px;
          font-weight: 800;
          margin: 0;
          line-height: 1.4;
        }
        .floating-guide-bot.hide .bot-bubble { opacity: 0; transform: scale(0.8); pointer-events: none; }
        
        .bot-trigger {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: auto;
        }
        
        .robot-body-anim { 
          width: 80px; height: 100px; 
          display: flex; flex-direction: column; align-items: center; 
          animation: robotHoverV2 4s ease-in-out infinite; 
          z-index: 2;
        }
        
        /* Head Structure */
        .robot-head-v2 { 
          width: 54px; height: 50px; 
          background: radial-gradient(circle at 30% 30%, #fff 0%, #eef2f3 100%); 
          border-radius: 50% 50% 45% 45%; 
          position: relative; 
          display: flex; align-items: center; justify-content: center; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.05);
          z-index: 10;
        }
        .visor-v2 {
          width: 38px; height: 20px;
          background: #0a0a0a;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
          margin-top: 2px;
        }
        .bot-eyes-v2 { display: flex; gap: 10px; }
        .eye-v2 { 
          width: 7px; height: 7px; 
          background: #00f2ff; 
          border-radius: 50%; 
          animation: robotBlinkV2 5s infinite; 
          box-shadow: 0 0 10px #00f2ff, 0 0 20px rgba(0,242,255,0.4);
        }
        .ear-glow-left, .ear-glow-right {
          position: absolute;
          width: 6px; height: 14px;
          background: rgba(0, 242, 255, 0.4);
          border-radius: 50%;
          top: 35%;
          filter: blur(2px);
        }
        .ear-glow-left { left: -2px; }
        .ear-glow-right { right: -2px; }

        /* Neck Ring */
        .neck-ring {
          width: 22px; height: 4px;
          background: #00f2ff;
          border-radius: 4px;
          margin-top: -2px;
          box-shadow: 0 0 10px #00f2ff;
          z-index: 8;
          animation: glowPulseV2 2s ease-in-out infinite;
        }

        /* Body Structure */
        .body-container {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          margin-top: -1px;
          position: relative;
        }
        .robot-torso-v2 { 
          width: 44px; height: 42px; 
          background: radial-gradient(circle at 40% 40%, #fff 0%, #dae1e7 100%); 
          border-radius: 20px 20px 30px 30px; 
          position: relative;
          box-shadow: 0 5px 15px rgba(0,0,0,0.15);
          z-index: 5;
        }
        .torso-detail {
          position: absolute;
          bottom: 8px; left: 50%;
          transform: translateX(-50%);
          width: 14px; height: 2px;
          background: #dae1e7;
          border-radius: 2px;
        }

        .shoulder-v2 {
          width: 18px; height: 20px;
          background: #7f8c8d;
          border-radius: 10px;
          position: absolute;
          top: 2px;
          box-shadow: inset 2px 2px 5px rgba(255,255,255,0.2), 0 2px 5px rgba(0,0,0,0.3);
          z-index: 4;
        }
        .shoulder-v2.left { left: -14px; transform: rotate(-15deg); }
        .shoulder-v2.right { right: -14px; transform: rotate(15deg); }

        .robot-platform-v2 { 
          width: 50px; height: 6px; 
          background: rgba(0, 242, 255, 0.2); 
          border-radius: 50%; 
          filter: blur(4px); 
          margin-top: 5px; 
          animation: shadowPulseV2 4s ease-in-out infinite; 
        }

        @keyframes glowPulseV2 { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes robotHoverV2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes shadowPulseV2 { 0%, 100% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(0.6); opacity: 0.05; } }
        @keyframes robotBlinkV2 { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes bounceInBot {
          from { opacity: 0; transform: scale(0.5) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Coach Chat Modal */
        .coach-chat-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .coach-chat-modal {
          width: 100%;
          max-width: 450px;
          height: 80vh;
          background: rgba(13, 17, 23, 0.9);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 30px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0, 242, 255, 0.3);
          box-shadow: 0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(0, 242, 255, 0.1);
          animation: modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .cc-header {
          padding: 24px;
          background: rgba(26, 26, 28, 0.4);
          border-bottom: 2px solid rgba(0, 242, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cc-title-row { display: flex; align-items: center; gap: 14px; }
        .cc-bot-icon {
          width: 42px;
          height: 42px;
          background: #000;
          border: 2px solid #00f2ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
          position: relative;
          overflow: visible;
        }
        .cc-bot-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 1px solid rgba(0, 242, 255, 0.2);
          border-radius: 14px;
          animation: borderPulse 2s linear infinite;
        }
        @keyframes borderPulse { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.05); } }
        .cc-title-group { display: flex; flex-direction: column; }
        .cc-main-title { font-size: 17px; font-weight: 900; color: #fff; letter-spacing: 0.5px; text-shadow: 0 0 10px rgba(0, 242, 255, 0.3); }
        .cc-status { font-size: 11px; color: #00f2ff; font-weight: 800; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 1px; }
        .status-dot { width: 8px; height: 8px; background: #00f2ff; border-radius: 50%; box-shadow: 0 0 12px #00f2ff; animation: pulseGlow 1.5s infinite; }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 5px #00f2ff; } 50% { box-shadow: 0 0 20px #00f2ff; } 100% { box-shadow: 0 0 5px #00f2ff; } }
        .cc-close { background: rgba(0, 242, 255, 0.1); border: 1px solid rgba(0, 242, 255, 0.2); color: #00f2ff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .cc-close:hover { background: rgba(0, 242, 255, 0.2); transform: rotate(90deg); }
        
        .cc-messages { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; scrollbar-width: thin; scrollbar-color: rgba(0, 242, 255, 0.2) transparent; }
        .cc-bubble-wrap { display: flex; width: 100%; position: relative; }
        .cc-bubble-wrap.bot { justify-content: flex-start; }
        .cc-bubble-wrap.user { justify-content: flex-end; }
        .cc-bubble { max-width: 85%; padding: 16px 20px; font-size: 15px; font-weight: 600; line-height: 1.6; position: relative; }
        .cc-bubble-wrap.bot .cc-bubble { 
          background: rgba(255,255,255,0.03); 
          color: #e2e8f0; 
          border-radius: 20px 20px 20px 4px; 
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .cc-bubble-wrap.user .cc-bubble { 
          background: linear-gradient(135deg, #0066cc 0%, #004499 100%); 
          color: white; 
          border-radius: 20px 20px 4px 20px; 
          border: 1px solid rgba(0, 242, 255, 0.3);
          box-shadow: 0 8px 20px rgba(0, 71, 171, 0.3);
        }
        .cc-typing { font-size: 12px; color: #00f2ff; padding-left: 10px; font-style: italic; opacity: 0.7; }
        
        .cc-input-area {
          padding: 24px;
          background: rgba(26, 26, 28, 0.6);
          border-top: 1px solid rgba(0, 242, 255, 0.1);
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .cc-input-area input {
          flex: 1;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(0, 242, 255, 0.2);
          border-radius: 16px;
          padding: 16px 22px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: 0.3s;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .cc-input-area input:focus { 
          border-color: #00f2ff; 
          box-shadow: 0 0 15px rgba(0, 242, 255, 0.2), inset 0 2px 4px rgba(0,0,0,0.2);
          background: rgba(0,0,0,0.6);
        }
        .cc-send-btn {
          width: 54px;
          height: 54px;
          background: linear-gradient(135deg, #00f2ff 0%, #0066cc 100%);
          border: none;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
          color: white;
        }
        .cc-send-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0, 242, 255, 0.5); }
        .cc-send-btn:active { transform: scale(0.95); }
        .cc-send-btn:active { transform: scale(0.9); }
      `}</style>
    </div>
  );
};

export default CoachHome;
