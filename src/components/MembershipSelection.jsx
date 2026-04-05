import React, { useState, useEffect, useRef } from 'react';
import { 
    ChevronLeft, 
    CheckCircle2, 
    ShieldCheck, 
    Zap, 
    Star, 
    Calendar, 
    ArrowRight,
    X,
    ScrollText
} from 'lucide-react';

import { getPeriodicCheckoutPayload, redirectToECPay } from '../utils/ecpay_service';
import { supabase } from '../supabase';

const MembershipSelection = ({ user, onBack }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Contract States
    const [hasAgreed, setHasAgreed] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const contractRef = useRef(null);

    const contractContent = `第一條 應提供服務及說明內容
於營業時間內,本館應提供下列服務內容:一、合格可通正常使用之運動器材設備。各種設備使用方法之說明。二、若會員多次進場未出示會員卡,本館有權禁止會員進場。(須立即 補卡) 三、各種設備於明顯處所張貼不當使用可能產生危險之警告標示四、具有合法證照或專業資歷之教練或指導員。

第二條 開通條件
甲方申請開通,應完成下列手續:個人身分核對,並出示具有照片的下列任一佐證文件,如身分證、健保卡、駕駛執照、護照。

第三條 會費調整
除經甲方同意外,不得調高合約約定費用。

第四條 入會後使用設施前之解約
甲方於繳納費用後有下列情形之一者,得解除契約並請求全額退還已繳費用:一、所簽契約始期尚未屆至。二、契約生效後7日內未使用業者設施或課程。三、甲乙雙方係以訪問買 貴或郵購買賣訂約者,甲方雖已使用本館設施或個人教練課程,7日內仍可適用《消費者保護法》第19條及第19條之1規定解除契約。四、甲方與本館簽訂個人教練課程契約者 ,如本契約或個人教練課程契約終止 or 解除時,另一契約亦同時終止或解除,但甲方得保留本契約。

第五條 甲方終止契約之退費計算基準
甲方得於契約期限屆滿前,隨時終止契約。甲方依前項約定終止契約時,本館應就甲方已繳全部費用依下列方式之一退還其餘額:一、『附期限月繳型』會員,就已繳全部費用(含月費、 依合約履行期間例計算之入會及手續費)扣除依簽約時「單月使用費」該單月使用費,乘以實際經過月數(其為滿15日者,以半個月計:逾15日者,以1個月計)之繳費用之懲罰性違約 金(至多新臺幣3000元),以賠償本館所受損失。二、『附期限年繳型』會員,就已繳全部費用(含月費、依合約履行期間比例計算之入會及手續費)扣除依簽約時「單月使用費」該單月使用 費、乘以實際經過月數(其為滿15 日者,以半個月計:逾15日者,以1個月計)之繳費用,本館並得另外請求依退費金額百分之20%計算之懲罰性違約金,以賠償本館所受損 失。三、個人教練課程:因不可歸責於甲方事由而終止契約者,依簽約時單堂課程費用新臺幣乘以實際使用堂數。無法認定簽約時單堂課程費用者,以總費用 除以總堂數計算(小 數點無條件去除)。甲方因傷害或疾病等產生不可回復之健康問題,致不適宜運動須終止契約者,本館應依前項規定辦理退費,且不得向甲方收取任何費用或賠償。本館提供之 服務或器材設備有缺失,經主管機關限期改善或經甲方催告改善,仍未改善,甲方因此終止契約時,本館應按契約存續期間比例退還甲方已繳之費用。

第六條 未繳費用之處理
消費者未繳費用時,業者應依契約約定方式通知消費者定10日完成繳納。前項催告期限屆滿翌日起計二十(含)日、業者得停止消費者使用其設備,待繳清費用後,恢復其權利。逾 二十日仍未繳清者,契約自動終止,並依第9條規定退費。本館未能證明前項催繳通知,致甲方會員權利受損者,乙方無條件賠償,不收取任何費用。

第七條 贈與契約及其效果
本館以贈與商品或服務為內容所為之贈與,於契約終止或解除時,本館不得向甲方請求返還該贈與,亦不得向甲方主張自應返還之費用金額當中,扣除該贈與之價額。沐光以赠送會員 會籍期限為內容而簽訂契約者,應將該期限合併納入契約範圍。

第八條 會員權利義務
一、甲方自雙方所約定費用悉數完納之日起得行使其會員權利。但當事人另有約定者,不在此限。二、本館營業時間內,甲方有權使用本館設備及接受服務,參與本館舉辦免費運動 指導課程或各種場地設備講習說明。三、甲方應遵守本契約及本館管理規範,並應遵守本館指導。四、甲方應依合約約定繳交各種費用或其他有關繳費課程及活動費用。五、甲方 應配合本館確認其於本館設施內,是否適於進行各該相關類型活動。

第九條 會員權暫停
有下列情形之一者,甲方得事先以書面向乙方辦理暫停會員權之行使,於停權時間,免繳月費,會員權有效順延一、因出國逾兩個月。其會員權益暂停期間以兩個月為限(不得超過 6個月)。二、因傷害、疾病 or 身體不適致不宜運動者。三、因懷孕或有育養出生未逾6個月嬰兒之需要者。四、因服兵役致難以行使會員權者。五、其他雖不符合前列各款事由,但 不可歸責於甲方事由致無法使用健身設備者。前項情形,甲方應檢附各款事由相關證明或釋明文件。

第十條 會籍、個人教練課程轉讓
一、甲方會籍:經通知本館後,可讓予第三人,讓予時若甲方已為會員,則將酌收手續費新台幣300元整,並以轉讓一次為限,惟承接會籍之第三人所繳月費,於該承接會籍期滿 後辦理續約時,無法享有本館額外「續約價格」之優惠。二、個人教練課程:經通知本館後,可讓予第三人,讓予時甲方為會員,一份合約轉讓一次為限,惟承接課程之第三人所買 課程單堂使用,於該承接課程 期滿後續買課程時,無法享有本館額外「續約價格」之優惠。

第十一條 乙方事由變更會員權行使、服務內容
本館有下列情形之一者,應於1個月前依契約所載方式通知甲方,及於營業場所明顯處公告,甲方得變更會員權之行使:一、本館營業場所搬遷者,搬遷日起至回復營業期間,甲方 免繳月費,會員權有效期間順延。二、本館營業場所總面積縮減或搬遷者,甲方得自本館公告日起三十(含)日內終止契約,並依第9條規定退費,本館不收取任何費用。本館未能證 明前項通知及公告,致甲方會員權利受損,本館無條件補償,不收取任何費用。

第十二條 會員轉換使用業者其他營業場所
甲方於契約存續期間均可轉換使用 本館其他營業場所(下稱轉點)、轉點時收取轉點費新臺幣1500元整。

第十三條 健身中心相關義務
本館於其各該營業場所內,應遵守下列各款規定:一、提供運動器材設備及定期維護或更新。二、配置具有合法證照或專業資歷之教練或指導員。三、配置適當救生器材。四、配置具 有急救訓練資格之員工。五、本館因甲方簽訂本契約,或參加課程、活動、或申請會員權暫停,而知悉或持有甲方個人資料,應予保密及依「個人資料保護法」 相關規定處理。本館違反 前項規定者,甲方得請求損害賠償。六、本館不得向甲方強行推銷商品、課程或收取本契約未約約定之費用。七、本館對於依第3條約定未能成為會員者所提供之資料仍 應予以保密,並不得為不當之使用。

第十四條 營業時間
因天災、地變、政府法令或其他不可歸責於本館事由致無法營業者,本館得暫時停業或縮短營業時間。甲方消費金額以實際入場使用場館時間收取費用。

第十五條 設備使用
甲方使用本館設備,應遵守下列規範:一、應於接待櫃檯登記並出示會員證。其有參與本館各種活動者,亦同。二、使用本館設備或參加本館舉辦各種活動者,應著適當合宜服装。三、 不得攜帶違禁品或危險物品進入乙方營業場所,及勿攜帶貴重物品至乙方營業場所。四、甲方於每次使用乙方設備時,本館應配合備置櫥櫃而提供甲方暫時擺置隨身攜帶物品(不含易 腐敗物品)使用,甲方應於每次使用乙方設備完畢後即行攜離。其有甲方未攜離物品經乙方定六個月以上期間公告招領而仍未取回者,依《民法》第607條等相關規定處理。五、甲方 攜帶金錢、有價證券、珠寶或其他貴重物品,乙方不負保管之責任。六、本館營業場所內不得有賭博、喝酒、吸菸、吃檳榔、喧嘩、口出穢言或其他不當或足以影響其他會員權益等行為; 於乙方指定區域內並不得飲食。參與乙方所舉辦各種活動者,亦同。七、甲方應適當使用本館各種設備,並自行斟酌個人健康狀況,遵守本館指導、不作不當運動或參與其體力所無法 負荷之活動。八、甲方會員證不得出借或提供其他第三人使用。

第十六條 業者管理規範訂頒即修正
本館為便利甲方充分有效使用乙方運動器材設備,得為各種管理規範之訂頒及其修正。

第十七條 損害賠償責任
因甲方同行親友不當使用設備而導致本館或其人員受有損害者,甲方應負連帶損害賠償責任。本館對於客人所攜帶通常物品之毀損或喪失,負其責任,但其屬不可抗力或因物品性質或 因甲方本身或其伴侶、随從或來賓等故意或過失所致者,不在此限。當事人一方違反本契約而導致他方受損害者,應負損害賠償責任。

第十八條 合約之管理
甲方應妥善保存合約。其有遺失者,應即通知本館。

第十九條 合意管轄
因本契約涉訟者,雙方同意以台北地方法院為第1審管轄法院。但不得排除《消費者保護法》第47條或《民事訴訟法》第436條之9 有關小額訴訟管轄法院之適用。

第二十條 未盡事宜之處理
本契約有未盡事宜者,依相關法令、習慣及誠信原則公平解決之。

第二十一條 契約書之分執保管
本契約一式二份,由甲乙雙方各執一份為憑。(第一次上課時 請至櫃檯找專員領取)`;

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

    const handleContractScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Check if nearly at bottom
        if (scrollHeight - scrollTop - clientHeight < 20) {
            setScrolledToBottom(true);
        }
    };

    const handleCheckout = async () => {
        if (!selectedPlan || !hasAgreed) return;
        setIsProcessing(true);
        
        try {
            const payload = await getPeriodicCheckoutPayload(selectedPlan, user);
            console.log('ECPay Checkout Payload Ready:', payload);
            alert(`🛡️ 即將啟動綠界金流定期定額系統\n專案：${selectedPlan.name}\n月繳金額：NT$ ${selectedPlan.price}\n合約期數：${selectedPlan.months} 期\n\n點擊確定後將跳轉至綠界信用卡支付終端。`);
            redirectToECPay(payload);
        } catch (err) {
            alert(`金流啟動失敗：${err.message}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="membership-selection-page animate-fade-in">
            <header className="fixed-header">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} color="#1e293b" strokeWidth={3} />
                </button>
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
                            
                            {/* Agreement Area */}
                            <div className="agreement-box">
                                <label className={`agreement-label ${hasAgreed ? 'checked' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={hasAgreed} 
                                        onChange={(e) => setHasAgreed(e.target.checked)}
                                        disabled={!hasAgreed} // Force them to through the modal if not agreed yet
                                    />
                                    <span className="checkbox-ui"></span>
                                    <span className="agreement-text">
                                        已閱讀方案 <button className="contract-link" onClick={() => { setShowContractModal(true); setScrolledToBottom(false); }}>合約內容</button>
                                    </span>
                                </label>
                            </div>
                        </>
                    ) : (
                        <span className="o-hint">請選擇一個您感興趣的專案</span>
                    )}
                </div>
                <button 
                    className={`checkout-btn ${(!selectedPlan || !hasAgreed || isProcessing) ? 'disabled' : ''}`}
                    onClick={handleCheckout}
                    disabled={!selectedPlan || !hasAgreed || isProcessing}
                >
                    {isProcessing ? '啟動安全連線...' : '前往綠界安全支付'} <ArrowRight size={18} />
                </button>
            </div>

            {/* Contract Modal */}
            {showContractModal && (
                <div className="contract-modal-overlay">
                    <div className="contract-modal-container">
                        <div className="contract-modal-header">
                            <div className="header-icon"><ScrollText size={20} color="#FF7A00" /></div>
                            <h4>方案合約條款</h4>
                            <button className="close-modal" onClick={() => setShowContractModal(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="contract-scroll-area" onScroll={handleContractScroll}>
                            <div className="contract-text">
                                {contractContent.split('\n\n').map((para, idx) => (
                                    <p key={idx}>{para}</p>
                                ))}
                            </div>
                            <div className="scroll-indicator">已讀取至底部即可確認交易</div>
                        </div>

                        <div className="contract-modal-footer">
                            <button 
                                className={`agree-confirm-btn ${!scrolledToBottom ? 'locked' : ''}`}
                                disabled={!scrolledToBottom}
                                onClick={() => {
                                    setHasAgreed(true);
                                    setShowContractModal(false);
                                }}
                            >
                                {!scrolledToBottom ? '請滑動至合約最下方' : '勾選已閱讀並且同意此方案合約'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .membership-selection-page { position: fixed; inset: 0; background: #f8fafc; z-index: 10000; color: #1e293b; display: flex; flex-direction: column; }
                
                .fixed-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: white; border-bottom: 1px solid #f1f5f9; z-index: 100; }
                .fixed-header h3 { font-size: 18px; font-weight: 800; }
                .back-btn { background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                
                .scroll-content { flex: 1; overflow-y: auto; padding: 32px 20px 180px; scrollbar-width: none; }
                .scroll-content::-webkit-scrollbar { display: none; }
                
                .hero-banner { text-align: center; margin-bottom: 40px; }
                .hero-tag { font-size: 11px; font-weight: 900; color: #FF7A00; letter-spacing: 3px; margin-bottom: 8px; }
                .hero-banner h1 { font-size: 32px; font-weight: 950; line-height: 1.1; margin-bottom: 12px; }
                .highlight { color: #FF7A00; }
                .hero-banner p { font-size: 14px; color: #64748b; font-weight: 600; max-width: 80%; margin: 0 auto; line-height: 1.6; }
                
                .plans-stack { display: flex; flex-direction: column; gap: 20px; }
                .plan-card { background: white; border-radius: 32px; border: 2px solid transparent; padding: 32px; position: relative; cursor: pointer; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden; }
                .plan-card.active { border-color: #FF7A00; transform: translateY(-4px); box-shadow: 0 20px 50px rgba(255,107,0,0.1); }
                
                .plan-badge { position: absolute; top: 0; right: 0; background: #FF7A00; color: white; font-size: 10px; font-weight: 900; padding: 6px 14px; border-radius: 0 0 0 16px; }
                .plan-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .p-title-box h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 2px; }
                .p-price-box { display: flex; flex-direction: column; align-items: flex-end; }
                .price-main { display: flex; align-items: flex-end; }
                .p-val { font-size: 32px; font-weight: 950; letter-spacing: -1px; }
                .p-duration { font-size: 11px; background: #fff4ed; color: #FF7A00; padding: 2px 8px; border-radius: 6px; font-weight: 800; margin-top: 4px; }
                
                .p-features { display: flex; flex-direction: column; gap: 12px; }
                .f-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #475569; font-weight: 600; }
                .f-icon { color: #10b981; }
                
                .selected-indicator { position: absolute; bottom: -20px; right: -20px; width: 80px; height: 80px; background: #fff4ed; border-radius: 50%; display: flex; align-items: flex-start; justify-content: flex-start; padding: 15px; }
                .check-blob { width: 36px; height: 36px; background: #FF7A00; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255,107,0,0.4); }
                
                .security-info { margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 32px; display: flex; flex-direction: column; gap: 12px; }
                .info-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #94a3b8; font-weight: 700; justify-content: center; }
                
                .footer-action { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 24px 20px 44px; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid #f1f5f9; z-index: 110; box-shadow: 0 -10px 40px rgba(0,0,0,0.05); }
                .order-summary { display: flex; flex-direction: column; text-align: center; }
                .o-label { font-size: 12px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; margin-bottom: 2px; }
                .o-val { font-size: 24px; font-weight: 950; color: #1e293b; margin-bottom: 12px; }
                
                /* Agreement Styling */
                .agreement-box { display: flex; justify-content: center; margin-bottom: 4px; }
                .agreement-label { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 16px; border-radius: 12px; background: #f8fafc; transition: 0.3s; }
                .agreement-label.checked { background: #fff4ed; }
                .agreement-label input { display: none; }
                .checkbox-ui { width: 18px; height: 18px; border: 2.5px solid #cbd5e1; border-radius: 5px; position: relative; transition: 0.2s; }
                .checked .checkbox-ui { background: #FF7A00; border-color: #FF7A00; }
                .checked .checkbox-ui::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
                .agreement-text { font-size: 13px; font-weight: 700; color: #64748b; }
                .contract-link { background: none; border: none; padding: 0; color: #FF7A00; font-weight: 900; text-decoration: underline; cursor: pointer; font-size: 13px; margin-left: 2px; }
                
                .checkout-btn { background: #1e293b; color: white; border: none; padding: 18px; border-radius: 20px; font-size: 16px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.3s; }
                .checkout-btn.disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

                /* Modal Styling */
                .contract-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 20000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; }
                .contract-modal-container { background: white; width: 100%; max-width: 500px; height: 80vh; border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 30px 100px rgba(0,0,0,0.5); }
                .contract-modal-header { padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; }
                .header-icon { width: 40px; height: 40px; background: #fff4ed; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .contract-modal-header h4 { flex: 1; font-size: 18px; font-weight: 900; }
                .close-modal { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                
                .contract-scroll-area { flex: 1; overflow-y: auto; padding: 24px; }
                .contract-text { font-size: 14px; line-height: 1.8; color: #475569; font-weight: 500; }
                .contract-text p { margin-bottom: 16px; }
                .scroll-indicator { font-size: 11px; text-align: center; color: #94a3b8; font-weight: 800; padding: 20px 0; border-top: 1px dashed #e2e8f0; }
                
                .contract-modal-footer { padding: 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
                .agree-confirm-btn { width: 100%; padding: 18px; border-radius: 16px; border: none; font-size: 15px; font-weight: 900; cursor: pointer; transition: 0.3s; background: #FF7A00; color: white; box-shadow: 0 10px 20px rgba(255,107,0,0.2); }
                .agree-confirm-btn.locked { background: #cbd5e1; color: #64748b; box-shadow: none; cursor: default; }

                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default MembershipSelection;
