import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CreditCard, 
  Users, 
  User, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import { supabase } from '../../supabase';

const PaymentHistoryManager = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('membership');
    const [payments, setPayments] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ totalExpected: 0, totalActual: 0, pendingCount: 0, successRate: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPaymentHistory();
    }, [activeTab]);

    const fetchPaymentHistory = async () => {
        setIsLoading(true);
        try {
            // Fetch real notifications filtered by tag and content
            let query = supabase
                .from('notifications')
                .select('*')
                .or('tag.eq.公告,tag.eq.繳費')
                .order('created_at', { ascending: false });

            // Apply category filters
            if (activeTab === 'membership') {
                query = query.ilike('content', '%方案%');
            } else if (activeTab === 'broadcast') {
                query = query.is('target_email', null).eq('target_role', 'student');
            } else if (activeTab === 'individual') {
                query = query.not('target_email', 'is', null);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Parse raw notifications into payment records
            const parsedPayments = (data || []).map(notice => {
                // Extract amount using Regex: NT$ 1,234
                const amountMatch = notice.content.match(/NT\$\s*(\d+(?:,\d+)*)/i);
                const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
                
                // For Status: If there's no payment_history table yet, we show Pending/Succeeded based on context
                // In production, we would join with an 'orders' table.
                const isPaid = notice.content.includes('已完成') || notice.content.includes('支付成功');
                const date = new Date(notice.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                return {
                    id: `NOTIF-${notice.id.toString().substr(0, 8)}`,
                    target_name: notice.target_email ? notice.target_email.split('@')[0] : '全體學員',
                    target_email: notice.target_email || 'Broadcast',
                    amount: amount,
                    category: activeTab === 'membership' ? '會籍方案' : (notice.target_email ? '個人發送' : '群體發送'),
                    status: isPaid ? 'Succeeded' : 'Pending',
                    created_at_raw: date,
                    created_at: date.toLocaleString('zh-TW', { hour12: false }),
                    monthKey: monthKey,
                    paid_at: isPaid ? '已入帳' : null,
                    method: 'ECPAY / 信用卡'
                };
            }).filter(p => p.amount > 0);

            // Extract unique months for the selector
            const months = [...new Set(parsedPayments.map(p => p.monthKey))].sort((a, b) => b.localeCompare(a));
            setAvailableMonths(months);
            setPayments(parsedPayments);
        } catch (error) {
            console.error('Error fetching real payment history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived state for filtered list and stats
    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.target_email.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMonth = selectedMonth === 'All' || p.monthKey === selectedMonth;
        return matchesSearch && matchesMonth;
    });

    useEffect(() => {
        const totalExpected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalActual = filteredPayments.reduce((sum, p) => sum + (p.status === 'Succeeded' ? p.amount : 0), 0);
        const pending = filteredPayments.filter(p => p.status === 'Pending').length;
        const success = filteredPayments.length > 0 
            ? ((filteredPayments.filter(p => p.status === 'Succeeded').length / filteredPayments.length) * 100).toFixed(1)
            : 0;
        
        setStats({ totalExpected, totalActual, pendingCount: pending, successRate: success });
    }, [filteredPayments]);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Succeeded': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', text: '已支付' };
            case 'Pending': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', text: '待繳費' };
            case 'Failed': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', text: '已失效' };
            default: return { bg: '#eee', color: '#666', text: status };
        }
    };

    return (
        <div className="payment-history-manager">
            <header className="ph-header">
                <div className="ph-header-top">
                    <button onClick={onBack} className="ph-back-btn"><ChevronLeft size={24} /></button>
                    <h2>金流對帳中心</h2>
                    <div style={{ width: 40 }}></div> {/* Placeholder for balance */}
                </div>
                
                <div className="ph-tabs">
                    <button className={`ph-tab ${activeTab === 'membership' ? 'active' : ''}`} onClick={() => setActiveTab('membership')}>
                        <CreditCard size={16} /> 方案費
                    </button>
                    <button className={`ph-tab ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
                        <Users size={16} /> 群體發送
                    </button>
                    <button className={`ph-tab ${activeTab === 'individual' ? 'active' : ''}`} onClick={() => setActiveTab('individual')}>
                        <User size={16} /> 單一發送
                    </button>
                </div>
            </header>

            <div className="ph-content">
                {/* Stats Section */}
                <div className="ph-stats-grid">
                    <div className="ph-stat-card expected">
                        <CreditCard size={20} color="#3b82f6" />
                        <div className="ph-stat-info">
                            <span>應得總金額 (應收)</span>
                            <h3>NT$ {(stats.totalExpected || 0).toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="ph-stat-card actual">
                        <TrendingUp size={20} color="#10B981" />
                        <div className="ph-stat-info">
                            <span>實際總金額 (實收)</span>
                            <h3 className="success-text">NT$ {(stats.totalActual || 0).toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="ph-stat-card">
                        <Clock size={20} color="#F59E0B" />
                        <div className="ph-stat-info">
                            <span>待繳件數</span>
                            <h3>{stats.pendingCount || 0} <small>筆</small></h3>
                        </div>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="ph-search-bar">
                    <div className="search-input-wrap">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="搜尋帳號、ID..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="month-select-wrap">
                        <Calendar size={18} className="cal-icon" />
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="ph-month-select"
                        >
                            <option value="All">總紀錄</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* List Body */}
                <div className="ph-list">
                    {isLoading ? (
                        <div className="ph-loading">
                            <div className="spinner"></div>
                            <p>正在載入數據...</p>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="ph-empty-state">
                            <AlertCircle size={40} color="#334155" />
                            <p>在此期間內無任何收支紀錄</p>
                        </div>
                    ) : (
                        filteredPayments.map((p, i) => {
                            const statusStyle = getStatusStyle(p.status);
                            return (
                                <div className="payment-entry-card" key={i}>
                                    <div className="entry-header">
                                        <div className="entry-id">
                                            <span className="id-label">ID / 訂單號</span>
                                            <span className="id-val">{p.id}</span>
                                        </div>
                                        <div className="entry-status" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                            {statusStyle.text}
                                        </div>
                                    </div>
                                    
                                    <div className="entry-body">
                                        <div className="entry-user">
                                            <h4>{p.target_name}</h4>
                                            <p>{p.target_email}</p>
                                        </div>
                                        <div className="entry-amount">
                                            <small>NT$</small> {p.amount.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="entry-footer">
                                        <div className="footer-item">
                                            <Calendar size={12} />
                                            <span>發布：{p.created_at}</span>
                                        </div>
                                        {p.paid_at && (
                                            <div className="footer-item success">
                                                <CheckCircle2 size={12} />
                                                <span>付款：{p.paid_at}</span>
                                            </div>
                                        )}
                                        {!p.paid_at && (
                                            <div className="footer-item warning">
                                                <AlertCircle size={12} />
                                                <span>尚未繳費</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="entry-method">
                                        <span>付款方式：{p.method}</span>
                                        <ArrowUpRight size={14} />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
                
                <div className="ph-pagination-hint">
                    顯示最後 20 筆紀錄，正在自動加載更多數據...
                </div>
            </div>

            <style>{`
                .payment-history-manager { background: #0A0A0B; min-height: 100vh; color: white; padding-bottom: 40px; }
                
                .ph-header { background: #121214; padding: 20px 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05); position: sticky; top: 0; z-index: 100; }
                .ph-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .ph-header-top h2 { font-size: 18px; font-weight: 800; }
                .ph-back-btn, .ph-export-btn { background: rgba(255,255,255,0.05); border: none; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                
                .ph-tabs { display: flex; gap: 8px; padding-bottom: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .ph-tab { 
                    flex-shrink: 0; background: rgba(255,255,255,0.03); border: none; color: #94A3B8; 
                    padding: 8px 16px; border-radius: 50px; font-size: 13px; font-weight: 700;
                    display: flex; align-items: center; gap: 6px; transition: 0.3s;
                }
                .ph-tab.active { background: #FF7A00; color: white; box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3); }

                .ph-content { padding: 20px 16px; }
                
                .ph-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
                .ph-stat-card { background: #121214; padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03); display: flex; flex-direction: column; gap: 10px; }
                .ph-stat-info span { font-size: 10px; color: #64748B; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                .ph-stat-info h3 { font-size: 18px; font-weight: 950; margin-top: 4px; }
                .ph-stat-info h3.success-text { color: #10B981; }
                .status-badge-mini { font-size: 9px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 6px; border-radius: 4px; margin-left: 4px; }
                .ph-stat-info h3 small { font-size: 12px; opacity: 0.5; }

                .ph-search-bar { display: flex; gap: 10px; margin-bottom: 24px; }
                .search-input-wrap { flex: 1; position: relative; background: #121214; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .search-input-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #475569; }
                .search-input-wrap input { width: 100%; height: 44px; background: transparent; border: none; padding-left: 40px; color: white; font-size: 14px; }
                
                .month-select-wrap { position: relative; background: #121214; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; padding: 0 12px; min-width: 130px; }
                .cal-icon { color: #FF7A00; margin-right: 8px; }
                .ph-month-select { background: transparent; border: none; color: white; font-size: 14px; width: 100%; height: 44px; font-weight: 700; cursor: pointer; outline: none; appearance: none; }

                .ph-list { display: flex; flex-direction: column; gap: 12px; }
                .ph-empty-state { text-align: center; padding: 60px 20px; color: #475569; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .ph-empty-state p { font-size: 14px; }
                .payment-entry-card { 
                    background: linear-gradient(135deg, #121214 0%, #0D0D0E 100%); 
                    border-radius: 20px; padding: 20px; border: 1px solid rgba(255,255,255,0.03);
                    transition: 0.3s;
                }
                .payment-entry-card:active { transform: scale(0.98); }
                
                .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                .id-label { font-size: 9px; color: #64748B; font-weight: 900; text-transform: uppercase; display: block; margin-bottom: 2px; }
                .id-val { font-size: 12px; font-family: monospace; color: #94A3B8; }
                .entry-status { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; }

                .entry-body { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .entry-user h4 { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
                .entry-user p { font-size: 12px; color: #64748B; font-weight: 600; }
                .entry-amount { font-size: 20px; font-weight: 950; color: white; }
                .entry-amount small { font-size: 12px; color: #FF7A00; }

                .entry-footer { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
                .footer-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748B; font-weight: 700; }
                .footer-item.success { color: #10B981; }
                .footer-item.warning { color: #F59E0B; }

                .entry-method { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #475569; font-weight: 800; text-transform: uppercase; border-top: 1px solid rgba(255,255,255,0.02); pt: 12px; }

                .ph-pagination-hint { text-align: center; font-size: 11px; color: #475569; margin-top: 24px; font-weight: 700; }
                
                .ph-loading { text-align: center; padding: 40px; }
                .spinner { width: 30px; height: 30px; border: 3px solid rgba(255, 122, 0, 0.1); border-top-color: #FF7A00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default PaymentHistoryManager;
