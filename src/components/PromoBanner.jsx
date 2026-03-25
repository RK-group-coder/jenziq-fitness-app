import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import { supabase } from '../supabase';
import { Loader2 } from 'lucide-react';

const PromoBanner = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (data) setBanners(data);
    } catch (err) {
      console.error('抓取廣告橫幅失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    dotsClass: "slick-dots promo-dots"
  };

  if (isLoading) {
    return (
      <div className="promo-loader">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="promo-slider">
      <Slider {...sliderSettings}>
        {banners.map(banner => (
          <div key={banner.id} className="banner-slide">
            <a
              href={banner.link_url || '#'}
              target={banner.link_url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="banner-link"
              onClick={(e) => !banner.link_url && e.preventDefault()}
            >
              <img src={banner.image_url} alt="Promo" className="banner-img" />
            </a>
          </div>
        ))}
      </Slider>

      <style>{`
        .promo-slider {
          margin: 16px 16px 24px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          position: relative;
        }
        .banner-slide {
          aspect-ratio: 2.5 / 1;
          outline: none;
        }
        .banner-link {
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
        }
        .banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius-lg);
        }
        .promo-loader {
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        
        /* Custom slicks dots */
        .promo-dots {
          bottom: 15px;
        }
        .promo-dots li button:before {
          color: white;
          opacity: 0.5;
          font-size: 8px;
        }
        .promo-dots li.slick-active button:before {
          color: var(--primary);
          opacity: 1;
        }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
};

export default PromoBanner;
