import React, { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

const RecommendedArticles = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const { data: artData, error: artError } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: true });

        if (artError) throw artError;

        if (artData && artData.length > 0) {
          setArticles(pickDailyArticles(artData));
        }
      } catch (err) {
        console.error('Fetch articles error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleArticleClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="articles-section-standalone" style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ marginTop: '10px', color: '#888', fontSize: '13px' }}>正在為您整理推薦文章...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="articles-section-standalone" style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ color: '#555', fontSize: '13px' }}>目前沒有推薦文章</p>
      </div>
    );
  }

  return (
    <div className="articles-section-standalone">
      <div className="section-header">
        <h3 className="section-title">為您推薦</h3>
        <button className="view-all-btn">查看更多 <ChevronRight size={14} /></button>
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

      <style>{`
        .articles-section-standalone { margin-top: 20px; padding-bottom: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-title { font-size: 20px; font-weight: 850; color: white; margin: 0; }
        .view-all-btn { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 0; }
        
        .articles-scroll { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: none; }
        .articles-scroll::-webkit-scrollbar { display: none; }
        
        .article-card { min-width: 280px; width: 280px; background: #1a1a1b; border-radius: 20px; overflow: hidden; border: 1px solid var(--border); scroll-snap-align: start; transition: transform 0.2s, background 0.2s; }
        .article-card.clickable:active { transform: scale(0.97); background: #222; }
        .article-thumb { height: 160px; position: relative; }
        .article-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .article-category { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); color: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; }
        .link-indicator { position: absolute; bottom: 12px; right: 12px; background: var(--primary); padding: 6px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        
        .article-info { padding: 16px; }
        .article-title { font-size: 16px; font-weight: 800; color: white; margin-bottom: 8px; line-height: 1.4; height: 44px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-top: 0;}
        .article-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #666; margin-bottom: 10px; flex-wrap: wrap; }
        .article-source { color: var(--primary); font-weight: 700; opacity: 0.8; }
        .article-excerpt { font-size: 13px; color: #aaa; line-height: 1.5; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin: 0; }
        
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
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

export default RecommendedArticles;
