import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import heroBg from '../assets/hero-bg.png';

const Hero = ({ onNavigate }) => {
  const [bgUrl, setBgUrl] = useState(heroBg);

  useEffect(() => {
    fetchHeroBanner();
  }, []);

  const fetchHeroBanner = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'hero_banner')
        .single();
      if (settingsData?.value?.url) setBgUrl(settingsData.value.url);
    } catch (err) {
      console.error('Fetch Hero banner error:', err);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-banner" style={{ backgroundImage: `linear-gradient(to top, rgba(10, 10, 11, 0.95), rgba(10, 10, 11, 0.2)), url(${bgUrl})` }}>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="orange-text">JENZiQ</span> FITNESS
          </h1>
          <p className="hero-tagline">
            您的專屬訓練管家，在這裡掌握所有運動與成長資源
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => onNavigate && onNavigate('tools')}>AI 工具</button>
            <button className="btn-secondary" onClick={() => onNavigate && onNavigate('records')}>健康紀錄</button>
          </div>
        </div>
      </div>
      <style>{`
        .hero-section {
          margin: 10px 16px 24px;
        }

        .hero-banner {
          position: relative;
          aspect-ratio: 1 / 1.1;
          display: flex;
          align-items: flex-end;
          padding: 32px 20px;
          background-size: cover;
          background-position: center;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .hero-content {
          z-index: 10;
        }
        .hero-title {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }
        .hero-tagline {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 24px;
          line-height: 1.6;
          font-weight: 500;
        }
        .hero-btns {
          display: flex;
          gap: 12px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #FF5C00 0%, #E11D48 100%);
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15px;
          border: none;
          box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3);
          transition: 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .btn-primary:active { transform: scale(0.95); }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          color: #FF5C00;
          border: 1.5px solid rgba(255, 92, 0, 0.4);
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15px;
          transition: 0.3s;
          letter-spacing: 0.5px;
        }
        .btn-secondary:active { transform: scale(0.95); }
      `}</style>
    </section>
  );
};

export default Hero;
