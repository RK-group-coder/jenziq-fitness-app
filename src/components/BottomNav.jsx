import React from 'react';
import { Home, ClipboardList, Calendar, Wrench, User } from 'lucide-react';

const BottomNav = ({ activePage, onPageChange }) => {
  const navItems = [
    { id: 'home', icon: Home, label: '首頁' },
    { id: 'records', icon: ClipboardList, label: '紀錄' },
    { id: 'events', icon: Calendar, label: '活動&課程' },
    { id: 'tools', icon: Wrench, label: '工具' },
    { id: 'profile', icon: User, label: '等級' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <div
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onPageChange(item.id)}
        >
          <item.icon size={22} />
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
      <style>{`
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
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
          transition: color 0.2s;
        }
        .nav-item.active {
          color: var(--primary);
        }
        .nav-label {
          font-size: 10px;
          font-weight: 500;
        }
      `}</style>
    </nav>
  );
};

export default BottomNav;
