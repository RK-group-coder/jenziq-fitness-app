import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
    Zap, 
    Plus, 
    Edit, 
    Trash2, 
    Save, 
    X, 
    MoreVertical,
    CheckCircle2,
    DollarSign,
    Calendar,
    ArrowUp,
    ArrowDown,
    Menu
} from 'lucide-react';

const MembershipPlanManager = () => {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        subtitle: '',
        price: '',
        months: '12',
        tag: '',
        features: '',
        display_order: 0
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist
                    console.log('Membership plans table missing');
                } else {
                    throw error;
                }
            }
            setPlans(data || []);
        } catch (err) {
            console.error('Fetch plans error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const featuresArray = formData.features.split('\n').filter(f => f.trim());
        
        const payload = {
            name: formData.name,
            subtitle: formData.subtitle,
            price: parseFloat(formData.price),
            months: parseInt(formData.months),
            tag: formData.tag,
            features: featuresArray,
            display_order: parseInt(formData.display_order)
        };

        try {
            if (editingPlan) {
                const { error } = await supabase
                    .from('membership_plans')
                    .update(payload)
                    .eq('id', editingPlan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('membership_plans')
                    .insert([payload]);
                if (error) throw error;
            }
            
            setEditingPlan(null);
            setIsAdding(false);
            resetForm();
            fetchPlans();
        } catch (err) {
            alert('儲存失敗: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此方案嗎？')) return;
        try {
            const { error } = await supabase
                .from('membership_plans')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (err) {
            alert('刪除失敗: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subtitle: '',
            price: '',
            months: '12',
            tag: '',
            features: '',
            display_order: plans.length
        });
    };

    const startEdit = (plan) => {
        setEditingPlan(plan);
        setIsAdding(false);
        setFormData({
            name: plan.name,
            subtitle: plan.subtitle || '',
            price: plan.price.toString(),
            months: plan.months.toString(),
            tag: plan.tag || '',
            features: plan.features.join('\n'),
            display_order: plan.display_order
        });
    };

    if (isLoading) {
        return (
            <div className="p-manager-container loading">
                <div className="spinner"></div>
                <p>載入方案中...</p>
            </div>
        );
    }

    return (
        <div className="p-manager-container animate-fade-in">
            <header className="p-header">
                <div className="p-header-left">
                    <div className="p-icon-box"><Zap size={24} /></div>
                    <div className="p-info">
                        <h2>會籍方案管理</h2>
                        <div className="management-status-pill">
                            <span className="status-dot"></span>
                            <p>方案內容已由系統固定，僅限調整價格</p>
                        </div>
                    </div>
                </div>
                {/* Fixed plans: Add button removed */}
            </header>

            <div className="admin-notice-banner animate-fade-in">
                <div className="notice-icon">ℹ️</div>
                <div className="notice-text">
                    <strong>管理限制說明：</strong>
                    為了確保會籍契約的一致性，目前系統中的「方案名稱」、「合約月數」、「方案特點」均已鎖定。如需調整價格，請點選下方方案卡片的編輯按鈕。
                </div>
            </div>

            {(isAdding || editingPlan) && (
                <div className="plan-editor-card animate-slide-up">
                    <div className="card-header">
                        <h3>{editingPlan ? '編輯方案' : '新增方案'}</h3>
                        <button className="close-btn" onClick={() => { setEditingPlan(null); setIsAdding(false); }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSave} className="plan-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>方案名稱</label>
                                <input 
                                    disabled
                                    placeholder="例如：年度精英專案"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>副標題 / 描述</label>
                                <input 
                                    disabled
                                    placeholder="例如：12個月固定課程規劃"
                                    value={formData.subtitle}
                                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>月付金額 (NT$)</label>
                                <div className="input-with-icon">
                                    <DollarSign size={16} />
                                    <input 
                                        required
                                        type="number"
                                        placeholder="1600"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>合約月數 (月份)</label>
                                <div className="input-with-icon">
                                    <Calendar size={16} />
                                    <input 
                                        disabled
                                        type="number"
                                        placeholder="12"
                                        value={formData.months}
                                        onChange={e => setFormData({...formData, months: e.target.value})}
                                    />
                                </div>
                            </div>
                             <div className="form-group">
                                <label>標籖</label>
                                <input 
                                    disabled
                                    placeholder="例如：熱門選擇"
                                    value={formData.tag}
                                    onChange={e => setFormData({...formData, tag: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>顯示順序</label>
                                <input 
                                    disabled
                                    type="number"
                                    value={formData.display_order}
                                    onChange={e => setFormData({...formData, display_order: e.target.value})}
                                />
                            </div>
                             <div className="form-group full-width">
                                <label>方案特點 (唯讀)</label>
                                <textarea 
                                    disabled
                                    rows="5"
                                    placeholder="..."
                                    value={formData.features}
                                    onChange={e => setFormData({...formData, features: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={() => { setEditingPlan(null); setIsAdding(false); }}>取消</button>
                            <button type="submit" className="save-btn">
                                <Save size={18} />
                                {editingPlan ? '更新方案' : '建立方案'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="plans-grid">
                {plans.length === 0 ? (
                    <div className="empty-state">
                        <Zap size={48} />
                        <p>目前尚無方案，請點擊右上方新增。</p>
                        <p className="hint">提醒：資料庫中需有 membership_plans 資料表。</p>
                    </div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className="plan-admin-card">
                            <div className="plan-admin-header">
                                <div className="p-main-info">
                                    <div className="p-order">#{plan.display_order}</div>
                                    <h4>{plan.name}</h4>
                                    {plan.tag && <span className="p-tag">{plan.tag}</span>}
                                </div>
                                 <div className="p-actions">
                                    <button onClick={() => startEdit(plan)} className="p-edit"><Edit size={16} /></button>
                                    {/* Delete button removed */}
                                </div>
                            </div>
                            <div className="p-details">
                                <div className="p-summary">
                                    <div className="p-stat">
                                        <span className="l">月費</span>
                                        <span className="v">NT$ {plan.price}</span>
                                    </div>
                                    <div className="p-stat">
                                        <span className="l">期數</span>
                                        <span className="v">{plan.months} 個月</span>
                                    </div>
                                </div>
                                <div className="p-feature-list">
                                    {plan.features?.slice(0, 3).map((f, i) => (
                                        <div key={i} className="mini-feature">
                                            <CheckCircle2 size={12} />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                    {plan.features?.length > 3 && <div className="more-count">+{plan.features.length - 3} 更多...</div>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .p-manager-container { padding: 32px; color: white; max-width: 1200px; margin: 0 auto; }
                .p-manager-container.loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 20px; }
                
                .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .p-header-left { display: flex; align-items: center; gap: 20px; }
                .p-icon-box { background: rgba(255, 122, 0, 0.1); color: #FF7A00; padding: 14px; border-radius: 16px; }
                .p-info h2 { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
                .management-status-pill { 
                    display: flex; align-items: center; gap: 8px; 
                    background: rgba(255, 122, 0, 0.1); padding: 4px 12px; border-radius: 50px;
                    border: 1px solid rgba(255, 122, 0, 0.2);
                }
                .status-dot { width: 6px; height: 6px; background: #FF7A00; border-radius: 50%; box-shadow: 0 0 10px #FF7A00; }
                .management-status-pill p { color: #FF7A00; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
                
                .admin-notice-banner {
                    background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); 
                    border-radius: 20px; padding: 20px; margin-bottom: 32px; display: flex; gap: 16px; align-items: flex-start;
                }
                .notice-icon { font-size: 20px; flex-shrink: 0; }
                .notice-text { color: #94A3B8; font-size: 14px; line-height: 1.6; }
                .notice-text strong { color: white; display: block; margin-bottom: 4px; }
                .add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255, 122, 0, 0.4); }

                .plan-editor-card { background: #1E293B; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; margin-bottom: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
                .card-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .plan-form { padding: 24px; }
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
                .full-width { grid-column: 1 / -1; }
                
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-size: 13px; font-weight: 700; color: #94A3B8; }
                .form-group input, .form-group textarea { background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 14px; color: white; font-size: 14px; }
                .input-with-icon { position: relative; }
                .input-with-icon svg { position: absolute; left: 14px; top: 15px; color: #475569; }
                .input-with-icon input { padding-left: 40px; width: 100%; }
                
                .form-actions { margin-top: 32px; display: flex; justify-content: flex-end; gap: 16px; border-top: 1px solid rgba(255,255,255,0.05); pt: 24px; padding-top: 24px; }
                .save-btn { background: #10B981; color: white; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; }
                .cancel-btn { background: transparent; color: #94A3B8; border: 1px solid #334155; padding: 12px 24px; border-radius: 12px; cursor: pointer; }
                
                .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .plan-admin-card { background: #1E293B; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); padding: 24px; transition: 0.3s; }
                .plan-admin-card:hover { border-color: rgba(255, 122, 0, 0.3); transform: translateY(-4px); }
                
                .plan-admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .p-order { display: inline-block; background: #0F172A; color: #FF7A00; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; margin-bottom: 4px; }
                .plan-admin-header h4 { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
                .p-tag { font-size: 10px; font-weight: 700; background: rgba(255, 122, 0, 0.1); color: #FF7A00; padding: 2px 8px; border-radius: 6px; }
                
                .p-actions { display: flex; gap: 8px; }
                .p-actions button { background: #0F172A; border: none; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94A3B8; cursor: pointer; transition: 0.2s; }
                .p-edit:hover { color: #3B82F6; background: rgba(59, 130, 246, 0.1); }
                .p-delete:hover { color: #EF4444; background: rgba(239, 68, 68, 0.1); }
                
                .p-details { background: #0F172A; border-radius: 16px; padding: 16px; }
                .p-summary { display: flex; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 12px; margin-bottom: 12px; }
                .p-stat { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                .p-stat .l { font-size: 10px; color: #475569; font-weight: 700; }
                .p-stat .v { font-size: 14px; font-weight: 800; color: white; }
                
                .p-feature-list { display: flex; flex-direction: column; gap: 8px; }
                .mini-feature { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #94A3B8; }
                .mini-feature svg { color: #10B981; }
                .more-count { font-size: 10px; color: #475569; font-weight: 700; margin-top: 4px; }
                
                .empty-state { text-align: center; padding: 60px 40px; color: #475569; }
                .empty-state p { margin-top: 16px; font-size: 15px; font-weight: 600; }
                .empty-state .hint { font-size: 12px; color: #334155; margin-top: 8px; }
                
                .spinner { width: 32px; height: 32px; border: 4px solid rgba(255, 122, 0, 0.1); border-top-color: #FF7A00; border-radius: 50%; animate: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default MembershipPlanManager;
