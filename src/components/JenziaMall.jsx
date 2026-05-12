import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { ShoppingCart, CreditCard, ChevronRight, Package, Zap } from 'lucide-react';

const JenziaMall = ({ user }) => {
    const [activeTab, setActiveTab] = useState('supplements');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [ecpayParams, setEcpayParams] = useState(null);
    const ecpayFormRef = useRef(null);

    // 抓取 Supabase 商品
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            } catch (err) {
                console.error('Fetch products error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // 點擊購買
    const handleBuyNow = async (product) => {
        if (!user) {
            alert('請先登入會員');
            return;
        }

        setIsCheckingOut(true);
        try {
            // 1. 在資料庫建立訂單 (狀態為 pending)
            const merchantTradeNo = `JZ${Date.now()}${Math.floor(Math.random() * 100)}`;
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    amount: Math.round(product.price),
                    status: 'pending',
                    merchant_trade_no: merchantTradeNo,
                    items: [{ id: product.id, name: product.name, qty: 1, price: product.price }],
                    customer_name: user.profile?.name || '',
                    customer_phone: user.profile?.phone || '',
                    customer_email: user.email
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. 呼叫 Edge Function 取得綠界加密參數
            const { data: params, error: funcError } = await supabase.functions.invoke('create-ecpay-order', {
                body: { 
                    orderId: order.id,
                    baseUrl: window.location.origin.includes('localhost') 
                        ? 'https://nithgdwrzhdkghgnfzim.supabase.co' // 這裡是範例，實際需替換或由後端處理
                        : window.location.origin
                }
            });

            if (funcError) throw funcError;

            // 3. 設定參數並觸發隱藏表單提交
            setEcpayParams(params);
            setTimeout(() => {
                if (ecpayFormRef.current) {
                    ecpayFormRef.current.submit();
                }
            }, 100);

        } catch (err) {
            console.error('Checkout error:', err);
            alert('建立訂單失敗，請稍後再試');
            setIsCheckingOut(false);
        }
    };

    const currentProducts = products.filter(p => p.category === activeTab);

    return (
        <section className="mall-section">
            <div className="mall-header">
                <div className="header-left">
                    <h3 className="mall-title">JENZiQ 官方商城</h3>
                    <p className="mall-subtitle">專業補給 · 內建自營 · 快速到貨</p>
                </div>
                <div className="cart-icon-wrapper">
                    <ShoppingCart size={20} className="text-white opacity-40" />
                </div>
            </div>

            {/* Tab Selector */}
            <div className="tab-container">
                <button
                    className={`tab-item ${activeTab === 'supplements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('supplements')}
                >
                    <Zap size={14} className="mr-1" />
                    肌力補充
                </button>
                <button
                    className={`tab-item ${activeTab === 'apparel' ? 'active' : ''}`}
                    onClick={() => setActiveTab('apparel')}
                >
                    <Package size={14} className="mr-1" />
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
                        <div key={product.id} className="product-card group">
                            <div className="image-wrapper">
                                <img
                                    src={product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
                                    alt={product.name}
                                    loading="lazy"
                                />
                                <div className="card-overlay">
                                    <button 
                                        className="buy-now-overlay-btn"
                                        onClick={() => handleBuyNow(product)}
                                        disabled={isCheckingOut}
                                    >
                                        {isCheckingOut ? '處理中...' : '立即購買'}
                                    </button>
                                </div>
                            </div>
                            <div className="product-info">
                                <h4 className="product-name">{product.name}</h4>
                                <div className="price-row">
                                    <span className="price-currency">$</span>
                                    <span className="price-amount">
                                        {parseFloat(product.price).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    className="add-cart-btn"
                                    onClick={() => handleBuyNow(product)}
                                    disabled={isCheckingOut}
                                >
                                    <CreditCard size={14} className="mr-2" />
                                    {isCheckingOut ? '處理中...' : '立即下單'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden ECPay Form */}
            {ecpayParams && (
                <form 
                    ref={ecpayFormRef}
                    action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5" 
                    method="POST"
                    className="hidden"
                >
                    {Object.keys(ecpayParams).map(key => (
                        <input key={key} type="hidden" name={key} value={ecpayParams[key]} />
                    ))}
                </form>
            )}

            <style>{`
                .mall-section { padding: 20px 16px 120px; background-color: transparent; }
                .mall-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
                .mall-title { font-size: 22px; font-weight: 850; color: #fff; margin-bottom: 4px; letter-spacing: -0.5px; }
                .mall-subtitle { font-size: 13px; color: #888; }
                
                .tab-container { display: flex; gap: 10px; margin-bottom: 24px; background: rgba(255, 255, 255, 0.03); padding: 4px; border-radius: 16px; }
                .tab-item { flex: 1; padding: 10px; border: none; background: transparent; color: #888; font-size: 14px; font-weight: 600; border-radius: 12px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
                .tab-item.active { background: #FF5C00; color: #fff; box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3); }

                .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                .product-card { background: #1a1a1b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.3s ease; }
                .product-card:hover { border-color: rgba(255, 92, 0, 0.3); transform: translateY(-4px); }
                
                .image-wrapper { position: relative; aspect-ratio: 1; background: #252526; }
                .image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
                
                .card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
                .product-card:hover .card-overlay { opacity: 1; }
                
                .buy-now-overlay-btn { background: #fff; color: #000; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; border: none; cursor: pointer; }

                .product-info { padding: 12px; }
                .product-name { font-size: 13px; font-weight: 600; color: #fff; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 8px; }
                .price-row { margin-bottom: 12px; display: flex; align-items: baseline; gap: 2px; }
                .price-currency { font-size: 12px; color: #FF5C00; font-weight: 700; }
                .price-amount { font-size: 18px; color: #FF5C00; font-weight: 800; }
                
                .add-cart-btn { width: 100%; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .add-cart-btn:hover { background: #FF5C00; border-color: #FF5C00; }
                .add-cart-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: #666; }
                .spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #FF5C00; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .hidden { display: none; }
            `}</style>
        </section>
    );
};

export default JenziaMall;
