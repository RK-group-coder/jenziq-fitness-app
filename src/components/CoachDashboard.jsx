import React, { useState, useEffect } from 'react';
import { Home, Calendar, Zap, TrendingUp, FileText } from 'lucide-react';
import TopNav from './TopNav';
import CoachHome from './coach/CoachHome';
import CoachSchedule from './coach/CoachSchedule';
import CoachActivitiesPage from './coach/CoachActivitiesPage';
import CoachLevel from './coach/CoachLevel';
import CoachApply from './coach/CoachApply';
import Inbox from './Inbox';
import Chatroom from './Chatroom';
import FriendList from './FriendList';
import Tools from './Tools';

// 錯誤邊界組件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', color: '#fff', background: '#000', textAlign: 'center' }}>
          <h3>頁面載入出錯</h3>
          <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '20px 0' }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', background: '#FF5C00', borderRadius: '12px', fontWeight: 'bold' }}
          >
            重新整理
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CoachDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  // ... (rest of states)
  const [showInbox, setShowInbox] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [initialSelectedFriend, setInitialSelectedFriend] = useState(null);
  
  // 初始與背景抓取未讀通知數
  useEffect(() => {
    fetchUnreadCount();
    // 每分鐘輪詢一次
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const myEmail = user?.email?.toLowerCase() || '';
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false); // 只抓未讀的

      if (error) throw error;

      // 複用 Inbox.jsx 的過濾邏輯
      const filtered = (data || []).filter(notif => {
          const target = notif.target_role || notif.role || 'all';
          const tEmail = notif.target_email?.toLowerCase();
          const uId = notif.user_id;

          if (tEmail) return tEmail === myEmail;
          if (uId) return uId === user?.id || uId === user?.userIdString;

          // 隱藏針對個人的全局通知關鍵字 (與 Inbox.jsx 一致)
          if (target === 'coach' && !uId && !tEmail && (notif.title?.includes('通過') || notif.title?.includes('駁回') || notif.title?.includes('退件'))) {
              return false;
          }
          return target === 'coach' || target === 'all';
      });

      setUnreadNotifications(filtered.length);
    } catch (err) {
      console.error('Fetch unread count error:', err);
    }
  };

  const handleFriendChat = (friend) => {
    setInitialSelectedFriend(friend);
    setShowFriends(false);
    setShowChat(true);
  };

  const renderTab = () => {
    if (activeTab.startsWith('tools:')) {
      const toolId = activeTab.split(':')[1];
      return <Tools initialTool={toolId} onBack={() => setActiveTab('home')} user={user} />;
    }
    switch (activeTab) {
      case 'home': return <CoachHome user={user} onNavigate={setActiveTab} />;
      case 'schedule': return <CoachSchedule user={user} />;
      case 'activities': return <CoachActivitiesPage user={user} />;
      case 'level': return <CoachLevel user={user} />;
      case 'apply': return <CoachApply user={user} />;
      case 'tools': return <Tools onBack={() => setActiveTab('home')} user={user} />;
      default: return <CoachHome user={user} onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'home', label: '首頁', icon: Home },
    { id: 'schedule', label: '班表', icon: Calendar },
    { id: 'activities', label: '活動', icon: Zap },
    { id: 'apply', label: '申請', icon: FileText },
    { id: 'level', label: '等級', icon: TrendingUp },
  ];

  return (
    <div className="coach-app-container">
      <TopNav
        unreadCount={unreadNotifications}
        onInboxClick={() => setShowInbox(true)}
        onChatClick={() => setShowChat(true)}
        onFriendListClick={() => setShowFriends(true)}
        onLogout={onLogout}
      />
      <ErrorBoundary>
        <div className="tab-content">
          {renderTab()}
        </div>
      </ErrorBoundary>

      {showInbox && (
        <div className="inbox-overlay">
          <Inbox 
            user={user} 
            role="coach" 
            onBack={() => setShowInbox(false)} 
            onUnreadChange={setUnreadNotifications}
          />
        </div>
      )}

      {showChat && (
        <div className="inbox-overlay">
          <Chatroom 
            user={user} 
            onBack={() => { setShowChat(false); setInitialSelectedFriend(null); }} 
            initialFriend={initialSelectedFriend}
          />
        </div>
      )}

      {showFriends && (
        <div className="inbox-overlay">
          <FriendList 
            user={user} 
            onBack={() => setShowFriends(false)} 
            onSelectFriend={handleFriendChat}
          />
        </div>
      )}

      <nav className="bottom-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="icon-wrapper">
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <style>{`
        .coach-app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: var(--background);
          position: relative;
        }
        .tab-content {
          flex: 1;
          overflow: hidden;
          padding-bottom: var(--bottom-nav-height);
        }
        .inbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          background-color: var(--background);
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          height: var(--bottom-nav-height);
          background-color: var(--secondary-bg);
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid var(--border);
          z-index: 1000;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          width: 20%;
        }
        .nav-item.active {
          color: var(--primary);
        }
        .nav-item.active .icon-wrapper {
          transform: translateY(-2px);
          color: var(--primary);
        }
        .nav-label {
          font-size: 10px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default CoachDashboard;
