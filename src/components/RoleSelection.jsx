import React from 'react';
import { User, Users } from 'lucide-react';

const RoleSelection = ({ onSelect }) => {
  return (
    <div className="role-selection">
      <div className="selection-content">
        <div className="brand-header">
          <h1 className="brand-logo"><span className="orange-text">JENZiQ</span> FITNESS</h1>
          <p className="brand-tagline">專業 ‧ 智能 ‧ 運動管理</p>
        </div>

        <h2 className="selection-title">請選擇您的角色</h2>

        <div className="role-cards">
          <div className="role-card" onClick={() => onSelect('student')}>
            <div className="role-icon-bg student-bg">
              <User size={40} color="white" />
            </div>
            <div className="role-info">
              <h3>我是學員</h3>
              <p>開始我的健身旅程</p>
            </div>
          </div>

          <div className="role-card" onClick={() => onSelect('coach')}>
            <div className="role-icon-bg coach-bg">
              <Users size={40} color="white" />
            </div>
            <div className="role-info">
              <h3>我是教練</h3>
              <p>管理我的專業職涯</p>
            </div>
          </div>

          <div className="role-card" onClick={() => onSelect('manager')}>
            <div className="role-icon-bg manager-bg">
              <Users size={40} color="white" />
            </div>
            <div className="role-info">
              <h3>我是管理者</h3>
              <p>掌握健身房全面營運</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .role-selection {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0A0A0B 0%, #18181B 100%);
          padding: 20px;
        }
        .selection-content {
          width: 100%;
          max-width: 360px;
          text-align: center;
        }
        .brand-header {
          margin-bottom: 60px;
        }
        .brand-logo {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
        }
        .brand-tagline {
          font-size: 14px;
          color: var(--text-secondary);
          letter-spacing: 4px;
        }
        .selection-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 32px;
          color: white;
        }
        .role-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .role-card {
          background-color: var(--secondary-bg);
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }
        .role-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          background-color: #27272A;
        }
        .role-icon-bg {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .student-bg {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
        }
        .coach-bg {
          background: linear-gradient(135deg, var(--primary) 0%, #E65300 100%);
        }
        .manager-bg {
          background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%);
        }
        .role-info h3 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        .role-info p {
          font-size: 13px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default RoleSelection;
