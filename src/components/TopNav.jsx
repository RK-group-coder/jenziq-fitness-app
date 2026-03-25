import { Mail, MessageSquare, Menu, LogOut, Users } from 'lucide-react';

const TopNav = ({ onMenuClick, onInboxClick, onChatClick, onFriendListClick, onLogout, logoOnly = false, unreadCount = 0 }) => {
  return (
    <nav className="top-nav">
      <div className="nav-left">
        {onMenuClick && (
          <button className="menu-btn" onClick={onMenuClick}>
            <Menu size={24} />
          </button>
        )}
        <div className="logo">
          <span className="orange-text">JENZiQ</span> FITNESS
        </div>
      </div>
      <div className="nav-actions">
        <button 
          className="nav-icon-btn inbox-nav-btn" 
          aria-label="Inbox" 
          onClick={onInboxClick}
        >
          <Mail size={22} />
          {unreadCount > 0 && <span className="unread-badge"></span>}
        </button>
        <button className="nav-icon-btn" aria-label="Friend List" onClick={onFriendListClick}>
          <Users size={22} />
        </button>
        <button className="nav-icon-btn" aria-label="Chatroom" onClick={onChatClick}>
          <MessageSquare size={22} />
        </button>
        {onLogout && (
          <button className="nav-icon-btn logout-btn-top" aria-label="Logout" onClick={onLogout}>
            <LogOut size={22} color="#EF4444" />
          </button>
        )}
      </div>
      <style>{`
        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          position: sticky;
          top: 0;
          background-color: var(--background);
          z-index: 1000;
          border-bottom: 1px solid var(--border);
          height: 64px;
        }
        .nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .menu-btn {
          background: none;
          border: none;
          color: white;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }
        .orange-text {
          color: var(--primary);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-icon-btn {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .nav-icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-2px);
        }
        .inbox-nav-btn { position: relative; }
        .unread-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background-color: #EF4444;
          border-radius: 50%;
          border: 2px solid var(--background);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }
        .nav-icon-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </nav>
  );
};

export default TopNav;
