import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import coachCampImg from '../../assets/coach-camp.png';
import competitionImg from '../../assets/competition.png';

const CoachActivities = () => {
    const [filter, setFilter] = useState('all');

    return (
        <div className="coach-activities">
            <header className="page-header">
                <div className="header-top">
                    <h2 className="page-title">教練活動專區</h2>
                    <div className="lv-badge">Lv.3</div>
                </div>
                <p className="page-subtitle">★ 教練獨家活動 ‧ 升級解鎖更多</p>
            </header>

            <div className="activities-content">
                {/* Featured Card */}
                <div className="featured-card">
                    <img src={coachCampImg} alt="Growth Plan" className="featured-img" />
                    <div className="featured-overlay">
                        <span className="featured-tag">精選活動</span>
                        <h3 className="featured-title">2026 教練成長計劃</h3>
                        <p className="featured-desc">參加活動 ‧ 累積 XP ‧ 解鎖更高等級</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-scroll">
                    {['全部', '報名中', '即將截止', '已報名'].map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${f === '全部' ? 'active' : ''}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Activity List */}
                <div className="activity-list">
                    <div className="activity-card">
                        <div className="card-image-wrapper">
                            <img src={competitionImg} alt="Competition" className="card-img" />
                            <div className="label-group">
                                <span className="label-orange">★ 教練限定</span>
                                <span className="label-dark">競技</span>
                                <span className="label-dark">交流</span>
                            </div>
                            <div className="status-badge">
                                <span className="dot teal"></span>
                                報名中
                            </div>
                        </div>
                        <div className="card-body">
                            <h4 className="activity-name">2026 台北健身大賽</h4>
                            <p className="activity-type">教練競技交流</p>

                            <div className="activity-meta">
                                <div className="meta-row">
                                    <Calendar size={14} /> 2026/03/15
                                </div>
                                <div className="meta-row">
                                    <Clock size={14} /> 09:00 - 18:00
                                </div>
                                <div className="meta-row">
                                    <MapPin size={14} /> 台北市體育館
                                </div>
                            </div>

                            <div className="attendance-info">
                                <div className="attendance-header">
                                    <div className="count"><Users size={14} /> 48/60 人</div>
                                    <div className="xp-label">+100 XP</div>
                                </div>
                                <div className="progress-bg">
                                    <div className="progress-fill" style={{ width: '80%' }}></div>
                                </div>
                            </div>

                            <button className="register-btn">立即報名 →</button>
                        </div>
                    </div>

                    <div className="activity-card dim">
                        <div className="card-image-wrapper">
                            <img src={coachCampImg} alt="Workshop" className="card-img" />
                            <div className="label-group">
                                <span className="label-orange">★ 教練限定</span>
                                <span className="label-dark">認證</span>
                                <span className="label-dark">重訓</span>
                            </div>
                            <div className="status-badge orange">
                                <span className="dot orange"></span>
                                即將截止
                            </div>
                        </div>
                        <div className="card-body">
                            <h4 className="activity-name">進階肌力訓練工作坊</h4>
                            <p className="activity-type">認證課程 ‧ 8小時</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .coach-activities {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .page-header {
          padding: 24px 20px 16px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .lv-badge {
          background-color: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 800;
          color: white;
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--primary);
          font-weight: 500;
        }
        .activities-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 20px;
          scrollbar-width: none;
        }
        .activities-content::-webkit-scrollbar {
          display: none;
        }
        .featured-card {
          position: relative;
          height: 160px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 24px;
          border: 1px solid var(--border);
        }
        .featured-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.6);
        }
        .featured-overlay {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
        }
        .featured-tag {
          font-size: 10px;
          color: var(--primary);
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }
        .featured-title {
          font-size: 18px;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
        }
        .featured-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }
        .filter-scroll {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .filter-scroll::-webkit-scrollbar {
          display: none;
        }
        .filter-btn {
          background-color: var(--secondary-bg);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--border);
          white-space: nowrap;
        }
        .filter-btn.active {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .activity-card {
          background-color: var(--card-bg);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border);
          margin-bottom: 20px;
        }
        .card-image-wrapper {
          position: relative;
          height: 180px;
        }
        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .label-group {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 6px;
        }
        .label-orange {
          background-color: var(--primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .label-dark {
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          backdrop-filter: blur(4px);
        }
        .status-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-badge .dot.teal { background-color: #10B981; }
        .status-badge .dot.orange { background-color: #FFB800; }
        .card-body {
          padding: 20px;
        }
        .activity-name {
          font-size: 17px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        .activity-type {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .activity-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .attendance-info {
          margin-bottom: 20px;
        }
        .attendance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .count {
          font-size: 13px;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .xp-label {
          font-size: 12px;
          color: #10B981;
          font-weight: 700;
        }
        .progress-bg {
          height: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .progress-fill {
          height: 100%;
          background-color: #10B981;
          border-radius: 4px;
        }
        .register-btn {
          width: 100%;
          background-color: var(--primary);
          color: white;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
        }
        .activity-card.dim {
          opacity: 0.8;
        }
      `}</style>
        </div>
    );
};

export default CoachActivities;
