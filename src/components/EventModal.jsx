import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import manualImg from '../assets/manual.png';

const EventModal = ({ event, onClose, currentUserLevel = 1 }) => {
    if (!event) return null;

    const minReq = event.min_level || 1;
    const isLevelLocked = currentUserLevel < minReq;

    const handleLearnMore = () => {
        if (isLevelLocked) {
            alert(`⚠️ 等級不足！此活動限定 Lv.${minReq} 以上參加。\n您目前的等級為 Lv.${currentUserLevel}，請繼續加油升級！`);
            return;
        }
        if (event.link_url) {
            window.open(event.link_url, '_blank');
        }
    };

    return (
        <div className="event-modal-overlay" onClick={onClose}>
            <div className="event-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-banner">
                    <img src={event.image_url || manualImg} alt={event.title} />
                    {event.label && (
                        <div className="modal-tag">{event.label}</div>
                    )}
                    {minReq > 1 && (
                        <div className={`level-lock-badge ${isLevelLocked ? 'locked' : 'unlocked'}`}>
                            {isLevelLocked ? '🔒' : '🔓'} Lv.{minReq}+
                        </div>
                    )}
                </div>

                <div className="modal-body-wrapper">
                    <div className="modal-body-content">
                        <div className="modal-header-info">
                            <h2 className="modal-title">{event.title}</h2>
                            <p className="modal-subtitle">{event.subtitle}</p>
                        </div>

                        <div className="modal-description">
                            {event.content ? (
                                event.content.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))
                            ) : (
                                <p className="no-content">暫無活動詳情介紹...</p>
                            )}
                        </div>
                    </div>

                    <div className="modal-fixed-footer">
                        {event.link_url ? (
                            <button
                                className={`learn-more-btn ${isLevelLocked ? 'locked-btn' : ''}`}
                                onClick={handleLearnMore}
                            >
                                <span>{isLevelLocked ? `Lv.${minReq} 限定` : '立即報名'}</span>
                                <ExternalLink size={16} />
                            </button>
                        ) : (
                            <p className="no-link-hint">此活動暫無外部連結</p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .event-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 3000;
            animation: fadeIn 0.3s ease-out;
        }
        .event-modal-content {
            background: #1e293b;
            width: 100%;
            max-width: 450px;
            border-radius: 28px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255,255,255,0.1);
            animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .close-modal-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 10;
            cursor: pointer;
            backdrop-filter: blur(4px);
        }
        .modal-banner {
            width: 100%;
            aspect-ratio: 16 / 9;
            position: relative;
            flex-shrink: 0;
        }
        .modal-banner img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .modal-tag {
            position: absolute;
            bottom: 16px;
            left: 20px;
            background: var(--primary);
            color: white;
            font-size: 11px;
            font-weight: 850;
            padding: 4px 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
        }
        
        .modal-body-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: linear-gradient(to bottom, #1e293b, #0f172a);
        }
        .modal-body-content {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
        }
        .modal-title {
            font-size: 22px;
            font-weight: 850;
            color: white;
            margin-bottom: 6px;
            line-height: 1.2;
            letter-spacing: -0.5px;
        }
        .modal-subtitle {
            font-size: 14px;
            color: var(--primary);
            font-weight: 700;
            margin-bottom: 24px;
        }
        .modal-description {
            font-size: 15px;
            color: rgba(255,255,255,0.8);
            line-height: 1.7;
            margin-bottom: 20px;
        }
        .modal-description p { margin-bottom: 16px; }
        .no-content { font-style: italic; color: rgba(255,255,255,0.4); text-align: center; padding: 20px 0; }

        .modal-fixed-footer {
            padding: 16px 24px 24px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: flex-end;
            align-items: center;
        }
        .learn-more-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 16px;
            font-weight: 850;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 8px 20px rgba(255, 92, 0, 0.3);
        }
        .learn-more-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(255, 92, 0, 0.4);
        }
        .learn-more-btn:active { transform: scale(0.96); }
        
        .no-link-hint {
            font-size: 12px;
            color: rgba(255,255,255,0.3);
            font-weight: 600;
        }

        .level-lock-badge {
            position: absolute;
            top: 16px;
            left: 20px;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            color: white;
            padding: 4px 10px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 5;
        }
        .level-lock-badge.locked { color: #FF4D4D; border-color: rgba(255, 77, 77, 0.3); }
        .level-lock-badge.unlocked { color: #10B981; border-color: rgba(16, 185, 129, 0.3); }

        .learn-more-btn.locked-btn {
            background: #4B5563;
            cursor: not-allowed;
            opacity: 0.8;
            box-shadow: none;
        }
        .learn-more-btn.locked-btn:hover {
            transform: none;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
            from { transform: translateY(40px) scale(0.95); opacity: 0; } 
            to { transform: translateY(0) scale(1); opacity: 1; } 
        }
      `}</style>
        </div>
    );
};

export default EventModal;
