import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import heroBg from '../assets/hero-bg.png';

const Hero = () => {
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
            <button className="btn-primary">開始訓練</button>
            <button className="btn-secondary">健康百科</button>
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
        }
        .hero-tagline {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .hero-btns {
          display: flex;
          gap: 12px;
        }
        .btn-primary {
          background-color: var(--primary);
          color: white;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
        }
        .btn-secondary {
          background-color: transparent;
          color: white;
          border: 1px solid white;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </section>
  );
};

export default Hero;
