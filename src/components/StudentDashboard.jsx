import React, { useState, useEffect } from 'react';
import TopNav from './TopNav';
import Hero from './Hero';
import PromoBanner from './PromoBanner';
import Events from './Events';
import Tools from './Tools';
import BottomNav from './BottomNav';
import ShopifyMall from './ShopifyMall';
import ActivitiesPage from './ActivitiesPage';
import RecordsPage from './RecordsPage';
import Locations from './Locations';
import Inbox from './Inbox';
import Chatroom from './Chatroom';
import StudentLevel from './StudentLevel';
import FriendList from './FriendList';

const StudentDashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('home');
  const [showInbox, setShowInbox] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [initialSelectedFriend, setInitialSelectedFriend] = useState(null);
  
  // 背景抓取未讀通知數
  useEffect(() => {
    fetchUnreadCount();
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
        .eq('is_read', false);

      if (error) throw error;

      const filtered = (data || []).filter(notif => {
        const target = notif.target_role || notif.role || 'all';
        const tEmail = notif.target_email?.toLowerCase();
        const uId = notif.user_id;

        if (tEmail) return tEmail === myEmail;
        if (uId) return uId === user?.id || uId === user?.userIdString;

        return target === 'student' || target === 'all';
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

  const renderPageContent = () => {
    switch (activePage) {
      case 'home':
        return (
          <>
            <Hero user={user} />
            <PromoBanner />
            <Events user={user} />
            <ShopifyMall />
            <Locations onNavigate={setActivePage} />
          </>
        );
      case 'records':
        return <RecordsPage />;
      case 'events':
        return <ActivitiesPage user={user} />;
      case 'tools':
        return <Tools user={user} />;
      case 'profile':
        return <StudentLevel user={user} />;
      case 'locations':
        return <Locations showAll={true} onBack={() => setActivePage('home')} />;
      default:
        return null;
    }
  };

  return (
    <div className="student-app">
      <TopNav
        unreadCount={unreadNotifications}
        onInboxClick={() => setShowInbox(true)}
        onChatClick={() => setShowChat(true)}
        onFriendListClick={() => setShowFriends(true)}
        onLogout={onLogout}
      />
      <main className="content">
        {renderPageContent()}
      </main>
      <BottomNav activePage={activePage} onPageChange={setActivePage} />

      {showInbox && (
        <div className="inbox-overlay">
          <Inbox 
            user={user} 
            role="student" 
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

      <style>{`
        .student-app {
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
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
        .content {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .content::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
