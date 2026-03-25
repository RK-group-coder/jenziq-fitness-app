import React, { useState, useEffect } from 'react';

// Shopify 配置
const SHOPIFY_DOMAIN = '99wgu4-sm.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = '94a533863199a23bd21ac95b7dc1b5eb';

const ShopifyMall = () => {
    const [activeTab, setActiveTab] = useState('supplements');
    const [products, setProducts] = useState({ supplements: [], apparel: [] });
    const [loading, setLoading] = useState(true);

    // 透過 GraphQL API 抓取資料
    const fetchShopifyProducts = async (collectionId) => {
        const query = `
        {
          node(id: "gid://shopify/Collection/${collectionId}") {
            ... on Collection {
              products(first: 20) {
                edges {
                  node {
                    id
                    title
                    handle
                    priceRange {
                      minVariantPrice {
                        amount
                        currencyCode
                      }
                    }
                    images(first: 1) {
                      edges {
                        node {
                          url
                        }
                      }
                    }
                    variants(first: 1) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        `;

        try {
            const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({ query }),
            });
            const { data } = await response.json();
            return data.node.products.edges.map(edge => edge.node);
        } catch (error) {
            console.error('Fetch products error:', error);
            return [];
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            const [supps, apps] = await Promise.all([
                fetchShopifyProducts('487817904367'),
                fetchShopifyProducts('487936360687')
            ]);
            setProducts({ supplements: supps, apparel: apps });
            setLoading(false);
        };
        loadAll();
    }, []);

    // 點擊購買（直接跳轉到結帳，或產品頁）
    const handleBuy = (variantId) => {
        // 解碼變體 ID (Shopify 返回的是 gid://shopify/ProductVariant/12345)
        const numericId = variantId.split('/').pop();
        window.open(`https://${SHOPIFY_DOMAIN}/cart/${numericId}:1`, '_blank');
    };

    const currentProducts = activeTab === 'supplements' ? products.supplements : products.apparel;

    return (
        <section className="mall-section">
            <div className="mall-header">
                <div className="header-left">
                    <h3 className="mall-title">會員限定商城</h3>
                    <p className="mall-subtitle">官方正品 · 快速到貨</p>
                </div>
                <a
                    href={`https://${SHOPIFY_DOMAIN}`}
                    target="_blank"
                    rel="noreferrer"
                    className="visit-store-btn"
                >
                    前往官網
                </a>
            </div>

            {/* Tab Selector */}
            <div className="tab-container">
                <button
                    className={`tab-item ${activeTab === 'supplements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('supplements')}
                >
                    肌力補充
                </button>
                <button
                    className={`tab-item ${activeTab === 'apparel' ? 'active' : ''}`}
                    onClick={() => setActiveTab('apparel')}
                >
                    專業服飾
                </button>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>正在載入精選商品...</p>
                </div>
            ) : (
                <div className="product-grid">
                    {currentProducts.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="image-wrapper">
                                <img
                                    src={product.images.edges[0]?.node.url}
                                    alt={product.title}
                                    loading="lazy"
                                />
                                <div className="card-overlay">
                                    <span className="add-text">立即購買</span>
                                </div>
                            </div>
                            <div className="product-info">
                                <h4 className="product-name">{product.title}</h4>
                                <div className="price-row">
                                    <span className="price-currency">$</span>
                                    <span className="price-amount">
                                        {parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    className="buy-btn"
                                    onClick={() => handleBuy(product.variants.edges[0].node.id)}
                                >
                                    加入購物車
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .mall-section {
                    padding: 20px 16px 120px;
                    background-color: transparent;
                }
                .mall-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 24px;
                }
                .mall-title {
                    font-size: 22px;
                    font-weight: 850;
                    color: #fff;
                    margin-bottom: 4px;
                    letter-spacing: -0.5px;
                }
                .mall-subtitle {
                    font-size: 13px;
                    color: #888;
                }
                .visit-store-btn {
                    padding: 8px 14px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .visit-store-btn:hover {
                    background: var(--primary);
                    border-color: var(--primary);
                }

                .tab-container {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 4px;
                    border-radius: 16px;
                }
                .tab-item {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    background: transparent;
                    color: #888;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tab-item.active {
                    background: var(--primary);
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3);
                }

                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }
                .product-card {
                    background: #1a1a1b;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: transform 0.3s ease;
                }
                .product-card:active {
                    transform: scale(0.97);
                }
                .image-wrapper {
                    position: relative;
                    aspect-ratio: 1;
                    background: #252526;
                }
                .image-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .card-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .product-card:hover .card-overlay {
                    opacity: 1;
                }
                .add-text {
                    background: #fff;
                    color: #000;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .product-info {
                    padding: 12px;
                }
                .product-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                    height: 38px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    margin-bottom: 8px;
                }
                .price-row {
                    margin-bottom: 12px;
                    display: flex;
                    align-items: baseline;
                    gap: 2px;
                }
                .price-currency {
                    font-size: 12px;
                    color: var(--primary);
                    font-weight: 700;
                }
                .price-amount {
                    font-size: 18px;
                    color: var(--primary);
                    font-weight: 800;
                }
                .buy-btn {
                    width: 100%;
                    padding: 10px;
                    background: #252526;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .buy-btn:hover {
                    background: var(--primary);
                    border-color: var(--primary);
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 0;
                    color: #666;
                }
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 12px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </section>
    );
};

export default ShopifyMall;
