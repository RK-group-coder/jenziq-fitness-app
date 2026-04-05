import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import manualImg from '../assets/manual.png';
import { Loader2, ChevronRight } from 'lucide-react';
import EventModal from './EventModal';

const Events = ({ user, onSeeAll }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLevel, setUserLevel] = useState(1);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const searchEmail = user?.email?.trim().toLowerCase();

        // Fetch user profile for XP
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('total_xp')
          .eq('email', searchEmail)
          .maybeSingle();

        // Fetch levels
        const { data: levelsData } = await supabase
          .from('student_levels')
          .select('*')
          .order('level', { ascending: true });

        setLevels(levelsData || []);

        if (profile && levelsData) {
          const lv = levelsData.filter(l => profile.total_xp >= l.min_xp).pop() || levelsData[0];
          setUserLevel(lv?.level || 1);
        }

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;
        const sortedData = (eventsData || []).sort((a, b) => {
          if (!!a.is_featured === !!b.is_featured) return 0;
          return a.is_featured ? -1 : 1;
        });
        setEvents(sortedData);
      } catch (error) {
        console.error('抓取活動資料失敗:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <section className="events-section">
      <div className="section-header">
        <h3 className="section-title">最新活動</h3>
        <button onClick={onSeeAll} className="view-all" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          查看全部 <ChevronRight size={14} />
        </button>
      </div>

      <div className="events-scroll">
        {isLoading ? (
          <div className="loading-box">
            <Loader2 className="animate-spin" size={20} />
            <span>載入中...</span>
          </div>
        ) : events.length > 0 ? (
          events.map(event => (
            <div
              key={event.id}
              className={`event-card ${event.is_featured ? 'featured' : ''}`}
              onClick={() => setSelectedEvent(event)}
              style={{ cursor: 'pointer' }}
            >
              <div className="event-img-container">
                <img src={event.image_url || manualImg} alt={event.title} className="event-img" />
                {event.label && (
                  <div className="event-tag-badge">{event.label}</div>
                )}
                {event.is_featured && (
                  <div className="featured-ribbon">精選</div>
                )}
              </div>
              <div className="event-info">
                <h4 className="event-name">{event.title}</h4>
                <p className="event-meta">{event.subtitle}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-box">目前沒有進行中的活動</div>
        )}
      </div>

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        currentUserLevel={userLevel}
      />

      <style>{`
                .events-section {
                    padding: 24px 16px;
                    background: transparent;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .section-title {
                    font-size: 20px;
                    font-weight: 850;
                    color: white;
                    letter-spacing: -0.5px;
                }
                .view-all {
                    font-size: 13px;
                    color: var(--primary);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    text-decoration: none;
                }
                
                .events-scroll {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    margin-right: -16px;
                    padding-right: 16px;
                }
                .events-scroll::-webkit-scrollbar {
                    display: none;
                }

                .event-card {
                    min-width: 150px;
                    max-width: 150px;
                    flex-shrink: 0;
                    aspect-ratio: 1 / 1;
                    background-color: transparent;
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                    transition: all 0.3s ease;
                }
                .event-card.featured {
                    min-width: 280px;
                    max-width: 280px;
                    aspect-ratio: 16 / 9;
                }
                .event-card:active {
                    transform: scale(0.96);
                }
                
                .event-img-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    background: transparent;
                }
                .event-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .event-tag-badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: var(--primary);
                    color: white;
                    font-size: 9px;
                    font-weight: 800;
                    padding: 3px 8px;
                    border-radius: 6px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    z-index: 2;
                }
                .featured-ribbon {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #EAB308;
                    color: black;
                    font-size: 8px;
                    font-weight: 900;
                    padding: 2px 8px;
                    border-radius: 4px;
                    z-index: 2;
                }

                .event-info {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 12px;
                    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
                    z-index: 1;
                }
                .event-card.featured .event-info {
                    padding: 16px;
                }
                .event-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .event-card.featured .event-name {
                    font-size: 18px;
                }
                .event-meta {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .event-card.featured .event-meta {
                    font-size: 11px;
                }

                /* Modal Styles */
                .event-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    z-index: 2000;
                    animation: fadeIn 0.3s ease-out;
                }
                .event-modal-content {
                    background: #1e293b;
                    width: 100%;
                    max-width: 450px;
                    border-radius: 24px;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.1);
                    animation: slideUp 0.3s ease-out;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
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
                }
                .modal-banner {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    position: relative;
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
                }
                .modal-body {
                    padding: 24px;
                    flex: 1;
                    overflow-y: auto;
                    scrollbar-width: thin;
                }
                .modal-title {
                    font-size: 22px;
                    font-weight: 850;
                    color: white;
                    margin-bottom: 4px;
                    line-height: 1.2;
                }
                .modal-subtitle {
                    font-size: 14px;
                    color: var(--primary);
                    font-weight: 700;
                    margin-bottom: 20px;
                    opacity: 0.9;
                }
                .modal-description {
                    font-size: 15px;
                    color: rgba(255,255,255,0.7);
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                .modal-description p { margin-bottom: 12px; }
                .no-content { font-style: italic; color: rgba(255,255,255,0.4); }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    padding-top: 10px;
                }
                .learn-more-btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 14px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .learn-more-btn:active { transform: scale(0.95); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .loading-box, .empty-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 40px 0;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 13px;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
    </section>
  );
};

export default Events;
