import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, Calendar, MapPin, ChevronRight, Zap, Award, Star } from 'lucide-react';
import manualImg from '../assets/manual.png';
import EventModal from './EventModal';

const ActivitiesPage = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('全部');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [userLevel, setUserLevel] = useState(1);

    const categories = ['全部', '健身', '競賽', '課程', '優惠'];

    useEffect(() => {
        fetchData();
    }, [user]);

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

            if (profile && levelsData) {
                const lv = levelsData.filter(l => profile.total_xp >= l.min_xp).pop() || levelsData[0];
                setUserLevel(lv?.level || 1);
            }

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const sortedData = (data || []).sort((a, b) => {
                if (!!a.is_featured === !!b.is_featured) return 0;
                return a.is_featured ? -1 : 1;
            });
            setEvents(sortedData);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEvents = events.filter(e => activeTab === '全部' || e.category === activeTab);
    const featuredEvent = filteredEvents[0]; // Assume first is featured
    const remainingEvents = filteredEvents.slice(1);

    return (
        <div className="activities-wrapper">
            <div className="activities-tiled-bg"></div>
            
            <div className="activities-page">
                <header className="page-header">
                    <h1 className="brand-title">JENZiQ <span className="highlight">活動</span></h1>
                    <p className="subtitle">探索最新健身活動與課程</p>
                </header>

                {/* Category Filter */}
                <div className="filter-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`tab ${activeTab === cat ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

            <div className="page-scroll-content">
                {isLoading ? (
                    <div className="loader-box"><Loader2 className="spin" /> 載入中...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="empty-box">目前暫無活動</div>
                ) : (
                    <>
                        {/* Featured Event - Large Card */}
                        {featuredEvent && (
                            <div className="featured-card" onClick={() => setSelectedEvent(featuredEvent)}>
                                <img src={featuredEvent.image_url || manualImg} alt="Featured" className="card-bg" />
                                <div className="card-tag">
                                    <Zap size={10} fill="currentColor" /> 精選活動
                                </div>
                                {featuredEvent.label && <div className="hot-badge">{featuredEvent.label}</div>}
                                <div className="card-overlay">
                                    <h2 className="title">{featuredEvent.title}</h2>
                                    <p className="meta">JENZiQ | {featuredEvent.category} | {new Date(featuredEvent.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}

                        {/* Event List */}
                        <div className="events-list">
                            {remainingEvents.map(event => (
                                <div key={event.id} className="list-item" onClick={() => setSelectedEvent(event)}>
                                    <div className="item-img">
                                        <img src={event.image_url || manualImg} alt={event.title} />
                                    </div>
                                    <div className="item-details">
                                        <div className="item-top">
                                            <span className={`tag ${event.category === '課程' ? 'blue' : event.category === '競賽' ? 'red' : 'green'}`}>{event.label || event.category}</span>
                                            <span className="category">{event.category}</span>
                                        </div>
                                        <h3 className="item-title">{event.title}</h3>
                                        <p className="item-desc">{event.subtitle || '點開查看更多活動詳情內容...'}</p>
                                        <div className="item-footer">
                                            <div className="date-box">
                                                <Calendar size={12} />
                                                <span>{new Date(event.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <button className="join-btn">
                                                了解詳情 <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <EventModal
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                currentUserLevel={userLevel}
            />

            <style>{`
                .activities-wrapper { position: relative; height: 100%; overflow: hidden; background-color: #000000; }
                .activities-tiled-bg {
                    position: absolute;
                    top: -50%; left: -50%; right: -50%; bottom: -50%;
                    background-image: url('/images/cards-bg-v2.png');
                    background-size: 1000px auto; 
                    background-repeat: repeat;
                    transform: rotate(20deg);
                    opacity: 0.4;
                    z-index: 1;
                    pointer-events: none;
                }

                .activities-page {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    color: white;
                }
                .page-header { padding: 32px 20px 20px; background-color: #1a1a1a; }
                .brand-title { font-size: 24px; font-weight: 850; margin-bottom: 4px; }
                .highlight { color: var(--primary); }
                .subtitle { font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 500; }

                .filter-tabs { display: flex; gap: 10px; padding: 0 20px 24px; overflow-x: auto; scrollbar-width: none; background-color: #1a1a1a; }
                .filter-tabs::-webkit-scrollbar { display: none; }
                .tab { background: rgba(255,255,255,0.05); border: none; padding: 8px 20px; border-radius: 12px; color: var(--text-secondary); font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: 0.3s; }
                .tab.active { background: var(--primary); color: white; }

                .page-scroll-content { flex: 1; overflow-y: auto; padding: 0 20px 100px; scrollbar-width: none; }
                .page-scroll-content::-webkit-scrollbar { display: none; }

                .featured-card { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 20px; overflow: hidden; margin-bottom: 24px; cursor: pointer; border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 0 0 0.5px rgba(255,255,255,0.2); }
                .card-bg { width: 100%; height: 100%; object-fit: cover; }
                .card-tag { position: absolute; top: 16px; left: 16px; display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: var(--primary); }
                .hot-badge { position: absolute; top: 16px; right: 16px; background: #EF4444; color: white; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
                .card-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); }
                .title { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
                .meta { font-size: 11px; color: rgba(255,255,255,0.6); }

                .events-list { display: flex; flex-direction: column; gap: 16px; }
                .list-item { background: #1a1a1b; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; display: flex; padding: 12px; gap: 16px; cursor: pointer; }
                .item-img { width: 100px; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
                .item-img img { width: 100%; height: 100%; object-fit: cover; }
                
                .item-details { flex: 1; display: flex; flex-direction: column; }
                .item-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
                .tag { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 6px; color: white; }
                .tag.blue { background: #3B82F6; }
                .tag.red { background: #EF4444; }
                .tag.green { background: #10B981; }
                .category { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 600; }
                .item-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
                .item-desc { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; margin-bottom: 12px; }
                
                .item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
                .date-box { display: flex; align-items: center; gap: 6px; font-size: 10px; color: rgba(255,255,255,0.3); }
                .join-btn { font-size: 11px; font-weight: 800; color: var(--primary); display: flex; align-items: center; border: none; background: none; cursor: pointer; }

                .loader-box, .empty-box { padding: 60px; text-align: center; color: rgba(255,255,255,0.2); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
        </div>
    );
};

export default ActivitiesPage;
