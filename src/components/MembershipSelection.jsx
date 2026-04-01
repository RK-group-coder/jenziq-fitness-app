import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, 
    CheckCircle2, 
    CreditCard, 
    ShieldCheck, 
    Zap, 
    Star, 
    Calendar, 
    Info,
    ArrowRight
} from 'lucide-react';

import { getPeriodicCheckoutPayload, redirectToECPay } from '../utils/ecpay_service';
import { supabase } from '../supabase';

const MembershipSelection = ({ user, onBack }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const defaultPlans = [
        {
            id: 'year_1',
            name: '年度精英專案',
            subtitle: '12個月固定課程規劃',
            price: 1600,
            originalPrice: 1980,
            months: 12,
            tag: '熱門選擇',
            features: [
                '每月自動扣款 無壓力付款',
                '每月發放 8 枚黑幣 (多元課程)',
                '每月發放 12 枚白幣 (大地課程)',
                '黑白點數可累積不歸零',
                'VIP 課程優先預約權'
            ]
        },
        {
            id: 'year_2',
            name: '雙載巔峰專案',
            subtitle: '24個月長期健康承諾',
            price: 1200,
            originalPrice: 1980,
            months: 24,
            tag: '最划算',
            features: [
                '史上最低月費 節省近 40%',
                '每月自動扣款 終身鎖定優惠',
                '每月發放 10 枚黑幣 (超額贈送)',
                '每月發放 15 枚白幣 (深耕計畫)',
                '專屬教練年度健康評估',
                '贈送 JENZiQ 聯名瑜珈墊'
            ]
        }
    ];

    useEffect(() => {
        fetchPlans();
        
        // Safety: Catch any unhandled errors within this component tree
        const handleError = (e) => {
            console.error('MembershipSelection Internal Error:', e.error);
            alert('系統偵測到渲染錯誤，正在嘗試修復...\n錯誤原因：' + (e.error?.message || '未知資料錯誤'));
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                setPlans(data);
            } else {
                setPlans(defaultPlans);
            }
        } catch (err) {
            console.warn('Fetch membership plans failed, using defaults:', err.message);
            setPlans(defaultPlans);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!selectedPlan) return;
        setIsProcessing(true);
        
        try {
            // --- ECPay Periodic Payment Flow ---
            // 1. Call local API server to get payload with server-side CheckMacValue
            const payload = await getPeriodicCheckoutPayload(selectedPlan, user);
            
            // 2. Alert for UX
            console.log('ECPay Checkout Payload Ready:', payload);
            alert(`🛡️ 即將啟動綠界金流定期定額系統\n專案：${selectedPlan.name}\n月繳金額：NT$ ${selectedPlan.price}\n合約期數：${selectedPlan.months} 期\n\n點擊確定後將跳轉至綠界信用卡支付終端。`);

            // 3. Perform POST Redirect to ECPay
            redirectToECPay(payload);
        } catch (err) {
            alert(`金流啟動失敗：${err.message}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="membership-selection-page animate-fade-in">
            <header className="fixed-header">
                <button className="back-btn" onClick={onBack}><ChevronLeft size={24} /></button>
                <h3>選擇會員方案</h3>
                <div style={{width: 44}}></div>
            </header>

            <div className="scroll-content">
                <div className="hero-banner">
                    <div className="hero-tag">MEMBERSHIP</div>
                    <h1>解鎖您的 <span className="highlight">頂級訓練</span></h1>
                    <p>選擇最適合您的長期計畫，透過定期定額享受最優質的師資與設施。</p>
                </div>

                <div className="plans-stack">
                    {isLoading ? (
                        <div className="plans-loading">
                            <div className="loader-ring"></div>
                            <p>正在為您載入最新方案...</p>
                        </div>
                    ) : (
                        plans.length === 0 ? (
                            <div className="empty-state">
                                <Zap size={48} />
                                <p>目前尚無方案資料，請洽管理員。</p>
                                <button className="mini-back-btn" onClick={onBack}>返回上頁</button>
                            </div>
                        ) : (
                            plans.map((plan, idx) => {
                                // Data Integrity Check
                                if (!plan) return null;
                                const planId = plan.id || `plan-${idx}`;
                                const planFeatures = Array.isArray(plan.features) ? plan.features : [];
                                
                                return (
                                    <div 
                                        key={planId} 
                                        className={`plan-card ${selectedPlan?.id === planId ? 'active' : ''}`}
                                        onClick={() => setSelectedPlan(plan)}
                                    >
                                        {plan.tag && <div className="plan-badge">{plan.tag}</div>}
                                        <div className="plan-header">
                                            <div className="p-title-box">
                                                <h3>{plan.name || '未命名方案'}</h3>
                                                <p>{plan.subtitle || '合約方案詳情'}</p>
                                            </div>
                                            <div className="p-price-box">
                                                <div className="price-main">
                                                    <span className="p-curr">NT$</span>
                                                    <span className="p-val">{plan.price || 0}</span>
                                                    <span className="p-unit">/mo</span>
                                                </div>
                                                <div className="p-duration">共 {plan.months || 0} 個月</div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-features">
                                            {planFeatures.map((f, i) => (
                                                <div key={i} className="f-item">
                                                    <CheckCircle2 size={16} className="f-icon" />
                                                    <span>{f}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {selectedPlan?.id === planId && (
                                            <div className="selected-indicator">
                                                <div className="check-blob"><Star size={20} fill="white" stroke="none" /></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )
                    )}
                </div>

                <div className="security-info">
                    <div className="info-item">
                        <ShieldCheck size={18} className="s-icon" />
                        <span>由 綠界科技 (ECPay) 提供安全金流保護</span>
                    </div>
                    <div className="info-item">
                        <Calendar size={18} className="s-icon" />
                        <span>定期定額自動扣款，隨時掌握消費明細</span>
                    </div>
                </div>
            </div>

            <div className="footer-action">
                <div className="order-summary">
                    {selectedPlan ? (
                        <>
                            <span className="o-label">預計月繳金額 (共 {selectedPlan.months} 期)</span>
                            <span className="o-val">NT$ {selectedPlan.price} <small>/月</small></span>
                        </>
                    ) : (
                        <span className="o-hint">請選擇一個您感興趣的專案</span>
                    )}
                </div>
                <button 
                    className={`checkout-btn ${!selectedPlan || isProcessing ? 'disabled' : ''}`}
                    onClick={handleCheckout}
                    disabled={!selectedPlan || isProcessing}
                >
                    {isProcessing ? '啟動安全連線...' : '前往綠界安全支付'} <ArrowRight size={18} />
                </button>
            </div>

            <style>{`
                .membership-selection-page { position: fixed; inset: 0; background: #f8fafc; z-index: 10000; color: #1e293b; display: flex; flex-direction: column; }
                
                .fixed-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: white; border-bottom: 1px solid #f1f5f9; z-index: 100; }
                .fixed-header h3 { font-size: 18px; font-weight: 800; }
                .back-btn { background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                
                .scroll-content { flex: 1; overflow-y: auto; padding: 32px 20px 140px; scrollbar-width: none; }
                .scroll-content::-webkit-scrollbar { display: none; }
                
                .hero-banner { text-align: center; margin-bottom: 40px; }
                .hero-tag { font-size: 11px; font-weight: 900; color: #FF7A00; letter-spacing: 3px; margin-bottom: 8px; }
                .hero-banner h1 { font-size: 32px; font-weight: 950; line-height: 1.1; margin-bottom: 12px; }
                .highlight { color: #FF7A00; }
                .hero-banner p { font-size: 14px; color: #64748b; font-weight: 600; max-width: 80%; margin: 0 auto; line-height: 1.6; }
                
                .plans-stack { display: flex; flex-direction: column; gap: 20px; }
                .plan-card { background: white; border-radius: 32px; border: 2px solid transparent; padding: 32px; position: relative; cursor: pointer; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden; }
                .plan-card:active { transform: scale(0.98); }
                .plan-card.active { border-color: #FF7A00; transform: translateY(-4px); box-shadow: 0 20px 50px rgba(255,107,0,0.1); }
                
                .plan-badge { position: absolute; top: 0; right: 0; background: #FF7A00; color: white; font-size: 10px; font-weight: 900; padding: 6px 14px; border-radius: 0 0 0 16px; }
                
                .plan-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .p-title-box h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 2px; }
                .p-title-box p { font-size: 12px; color: #94a3b8; font-weight: 700; }
                
                .p-price-box { display: flex; flex-direction: column; align-items: flex-end; color: #1e293b; }
                .price-main { display: flex; align-items: flex-end; }
                .p-curr { font-size: 14px; font-weight: 900; margin-bottom: 4px; margin-right: 2px; }
                .p-val { font-size: 32px; font-weight: 950; letter-spacing: -1px; }
                .p-unit { font-size: 14px; color: #94a3b8; font-weight: 700; margin-bottom: 6px; margin-left: 2px; }
                .p-duration { font-size: 11px; background: #fff4ed; color: #FF7A00; padding: 2px 8px; border-radius: 6px; font-weight: 800; margin-top: 4px; }
                
                .p-features { display: flex; flex-direction: column; gap: 12px; }
                .f-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #475569; font-weight: 600; }
                .f-icon { color: #10b981; flex-shrink: 0; }
                
                .selected-indicator { position: absolute; bottom: -20px; right: -20px; width: 80px; height: 80px; background: #fff4ed; border-radius: 50%; display: flex; align-items: flex-start; justify-content: flex-start; padding: 15px; }
                .check-blob { width: 36px; height: 36px; background: #FF7A00; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255,107,0,0.4); }
                
                .security-info { margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 32px; display: flex; flex-direction: column; gap: 12px; }
                .info-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #94a3b8; font-weight: 700; justify-content: center; }
                .s-icon { color: #cbd5e1; }
                
                .footer-action { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 24px 20px 44px; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid #f1f5f9; z-index: 110; }
                .order-summary { display: flex; flex-direction: column; text-align: center; }
                .o-label { font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
                .o-val { font-size: 24px; font-weight: 950; color: #1e293b; }
                .o-val small { font-size: 14px; opacity: 0.5; }
                .o-hint { font-size: 14px; color: #94a3b8; font-weight: 700; padding: 10px 0; }
                
                .checkout-btn { background: #1e293b; color: white; border: none; padding: 18px; border-radius: 20px; font-size: 16px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                .checkout-btn.disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
                .checkout-btn:active { transform: scale(0.96); }

                .plans-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 16px; color: #94a3b8; }
                .loader-ring { width: 32px; height: 32px; border: 3px solid rgba(255,122,0,0.1); border-top-color: #FF7A00; border-radius: 50%; animation: spin 1s linear infinite; }
                
                .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 20px; color: #94a3b8; text-align: center; }
                .empty-state svg { color: #e2e8f0; }
                .mini-back-btn { background: #1e293b; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }

                @keyframes spin { to { transform: rotate(360deg); } }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default MembershipSelection;
