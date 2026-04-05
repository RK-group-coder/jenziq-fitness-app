import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Loader2, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

const Locations = ({ showAll = false, onNavigate, onBack }) => {
  const [locations, setLocations] = useState([]);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch locations
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .select('*')
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (locError) throw locError;
        setLocations(locData || []);

        // Fetch articles
        const { data: artData, error: artError } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: true });

        if (artError) throw artError;

        if (artData && artData.length > 0) {
          setArticles(pickDailyArticles(artData));
        }
      } catch (err) {
        console.error('Fetch data error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayedLocations = showAll ? locations : locations.slice(0, 2);

  const handleArticleClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <section className={`locations-section ${showAll ? 'full-page' : ''}`}>
      <div className="section-header">
        <div className="header-left">
          {showAll && onBack && (
            <button className="back-btn" onClick={onBack}>
              <ChevronLeft size={20} color="white" />
            </button>
          )}
          <div>
            <h3 className="section-title">據點資訊</h3>
            {showAll && !isLoading && (
              <p className="location-count-label">統計共 {locations.length} 個據點</p>
            )}
          </div>
        </div>
        {!showAll && (
          <button className="view-all-btn" onClick={() => onNavigate && onNavigate('locations')}>
            查看全部 <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="locations-list">
        {isLoading ? (
          <div className="loader-box">
            <Loader2 className="spin" size={24} />
            <span>載入中...</span>
          </div>
        ) : displayedLocations.length === 0 ? (
          <div className="empty-box">目前暫無據點資訊</div>
        ) : (
          displayedLocations.map((loc) => (
            <div key={loc.id} className="location-card">
              <div className="card-content-left">
                <div className="location-header">
                  <h4 className="location-name">{loc.name}</h4>
                  <div className="location-tags">
                    {(loc.tags || []).map((tag, tIdx) => (
                      <span key={tIdx} className={`tag tag-${tag === '體驗' ? 'accent' : 'dim'}`}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="location-details">
                  <div className="detail-item">
                    <MapPin size={12} color="var(--primary)" />
                    <span>{loc.address}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={12} color="var(--primary)" />
                    <span>{loc.hours}</span>
                  </div>
                  <div className="detail-item">
                    <Phone size={12} color="var(--primary)" />
                    <span>{loc.phone}</span>
                  </div>
                </div>

                <button
                  className="map-link-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const target = loc.map_url || '';
                    const isUrl = /^(https?:\/\/|www\.|maps\.)|google\.com\/maps|goo\.gl\/maps/.test(target.toLowerCase());
                    if (isUrl) {
                      const url = target.startsWith('http') ? target : `https://${target}`;
                      window.open(url, '_blank');
                    } else if (target.trim() || loc.address) {
                      const query = `${loc.name} ${target.trim() || loc.address}`;
                      const searchQuery = encodeURIComponent(query);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
                    } else {
                      alert('尚未設定據點導覽資訊');
                    }
                  }}
                >
                  開啟地圖導覽 &gt;
                </button>
              </div>

              {loc.image_url && (
                <div className="location-image-container">
                  <img src={loc.image_url} alt={loc.name} className="location-bg-image" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recommended Articles Section - only show on homepage preview */}
      {!showAll && articles.length > 0 && (
        <div className="articles-section">
          <div className="section-header">
            <h3 className="section-title">為您推薦</h3>
          </div>

          <div className="articles-scroll">
            {articles.map((art) => (
              <div
                key={art.id}
                className={`article-card ${art.link_url ? 'cursor-pointer clickable' : ''}`}
                onClick={() => handleArticleClick(art.link_url)}
              >
                <div className="article-thumb">
                  <img src={art.image_url || '/images/art-nutrition.png'} alt={art.title} />
                  <span className="article-category">{art.category}</span>
                  {art.link_url && (
                    <div className="link-indicator">
                      <ExternalLink size={14} color="white" />
                    </div>
                  )}
                </div>
                <div className="article-info">
                  <h4 className="article-title">{art.title}</h4>
                  <div className="article-meta">
                    <span className="article-author">{art.author}</span>
                    {art.source && <span className="article-source">@{art.source}</span>}
                    <span className="dot">•</span>
                    <span className="article-date">{art.publish_date}</span>
                  </div>
                  <p className="article-excerpt">{art.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .locations-section { padding: 24px 16px; }
        .locations-section.full-page { background: var(--background); min-height: calc(100vh - 120px); padding-top: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .back-btn { background: rgba(255,255,255,0.05); border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .section-title { font-size: 20px; font-weight: 850; color: white; margin: 0; }
        .location-count-label { font-size: 12px; color: #888; margin: 2px 0 0 0; font-weight: 600; }
        .view-all-btn { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; }
        .locations-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

        .location-card { position: relative; background-color: #1a1a1b; border-radius: 20px; padding: 20px; border: 1px solid var(--border); transition: transform 0.2s; overflow: hidden; display: flex; align-items: stretch; }
        .location-card:active { transform: scale(0.98); }
        .card-content-left { flex: 1; position: relative; z-index: 2; }
        .location-name { font-size: 16px; font-weight: 800; color: white; margin-bottom: 12px; }
        .location-tags { display: flex; gap: 6px; margin-bottom: 20px; }
        .tag { font-size: 9px; padding: 3px 10px; border-radius: 8px; font-weight: 700; background: rgba(255,255,255,0.05); color: #888; }
        .location-details { display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px; }
        .detail-item { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-secondary); }
        .map-link-btn { background: none; border: none; display: block; font-size: 13px; color: var(--primary); font-weight: 700; margin-top: 24px; text-decoration: none; padding: 0; cursor: pointer; text-align: left; }

        .location-image-container { 
          position: absolute; 
          right: 0; 
          top: 0; 
          bottom: 0; 
          width: 50%; 
          z-index: 1; 
          pointer-events: none;
        }
        .location-bg-image { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);
          opacity: 0.85;
          transition: 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          filter: brightness(0.95) contrast(1.1);
        }
        .location-card:hover .location-bg-image {
          opacity: 1;
          transform: scale(1.1) rotate(1deg);
          filter: brightness(1) contrast(1.2);
        }

        .articles-section { margin-top: 40px; padding-bottom: 20px; }
        .articles-scroll { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: none; }
        .articles-scroll::-webkit-scrollbar { display: none; }
        
        .article-card { min-width: 280px; width: 280px; background: #1a1a1b; border-radius: 20px; overflow: hidden; border: 1px solid var(--border); scroll-snap-align: start; transition: transform 0.2s, background 0.2s; }
        .article-card.clickable:active { transform: scale(0.97); background: #222; }
        .article-thumb { height: 160px; position: relative; }
        .article-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .article-category { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); color: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; }
        .link-indicator { position: absolute; bottom: 12px; right: 12px; background: var(--primary); padding: 6px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        
        .article-info { padding: 16px; }
        .article-title { font-size: 16px; font-weight: 800; color: white; margin-bottom: 8px; line-height: 1.4; height: 44px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .article-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #666; margin-bottom: 10px; flex-wrap: wrap; }
        .article-source { color: var(--primary); font-weight: 700; opacity: 0.8; }
        .article-excerpt { font-size: 13px; color: #aaa; line-height: 1.5; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

        .loader-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; gap: 16px; color: var(--text-secondary); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </section>
  );
};

// Picking logic: 5 articles, no overlap with yesterday if total >= 10
const pickDailyArticles = (allArticles) => {
  const n = allArticles.length;
  if (n <= 5) return allArticles;

  const stableShuffle = (arr) => {
    let hash = 12345;
    const seedStr = "FitAdmin_Permanent_Seed";
    for (let i = 0; i < seedStr.length; i++) hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = (hash * 1664525 + 1013904223) | 0;
      const j = Math.abs(hash % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledPool = stableShuffle(allArticles);
  const dayIndex = Math.floor(Date.now() / 86400000);
  const startIndex = (dayIndex * 5) % n;
  const result = [];
  for (let i = 0; i < 5; i++) {
    result.push(shuffledPool[(startIndex + i) % n]);
  }
  return result;
};

export default Locations;
