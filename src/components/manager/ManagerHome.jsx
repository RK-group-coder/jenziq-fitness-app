import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserCheck, 
    Calendar, 
    ClipboardList, 
    TrendingUp, 
    ChevronRight, 
    Bell, 
    Settings, 
    Sun, 
    Moon, 
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    Search,
    Filter,
    Layers,
    X,
    ShieldCheck,
    ShieldAlert,
    Award,
    AlertCircle
} from 'lucide-react';

import { supabase } from '../../supabase';

const ManagerHome = ({ onNavigate, pendingCounts = {} }) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTaskTab, setActiveTaskTab] = useState('Pending');
    const [counts, setCounts] = useState({ 
        student: 0, 
        coach: 0, 
        totalCourses: 0, 
        appUsageMonth: 0,
        categoryStats: [
            { name: '健身課', count: 0, color: '#FF5C00' },
            { name: '皮拉提斯', count: 0, color: '#FFB800' },
            { name: '體驗課', count: 0, color: '#10B981' },
            { name: '其他課程', count: 0, color: '#3B82F6' }
        ],
        branchStats: []
    });

    const [statsData, setStatsData] = useState([
        { month: 'Jan', val: 0, secondary: 0 },
        { month: 'Feb', val: 0, secondary: 0 },
        { month: 'Mar', val: 0, secondary: 0 },
        { month: 'Apr', val: 0, secondary: 0 },
        { month: 'May', val: 0, secondary: 0 },
        { month: 'Jun', val: 0, secondary: 0 },
        { month: 'Jul', val: 0, secondary: 0 },
        { month: 'Aug', val: 0, secondary: 0 },
        { month: 'Sep', val: 0, secondary: 0 },
        { month: 'Oct', val: 0, secondary: 0 },
        { month: 'Nov', val: 0, secondary: 0 },
        { month: 'Dec', val: 0, secondary: 0 },
    ]);

    const [isFetching, setIsFetching] = useState(true);
    const [detailModal, setDetailModal] = useState({ isOpen: false, type: '', title: '', data: [] });

    useEffect(() => {
        const fetchCounts = async () => {
            setIsFetching(true);
            try {
                // 1. 抓身份權限與資料
                const { data: permissions, error: permErr } = await supabase
                    .from('user_permissions')
                    .select('email, role, user_id_string');
                if (permErr) throw permErr;

                const { data: userProfiles, error: profErr } = await supabase
                    .from('user_profiles')
                    .select('email, branch');
                if (profErr) throw profErr;

                // 合併權限與資料
                const profiles = permissions.map(perm => {
                    const prof = userProfiles.find(p => p.email === perm.email);
                    return {
                        ...perm,
                        branch: prof?.branch
                    };
                });

                const coaches = profiles.filter(p => p.role === 'coach');
                const studentCount = profiles.filter(p => p.role === 'student').length;
                const coachCount = coaches.length;
                
                // 2. 抓總核准課程數與類別分佈
                const { data: allCourses, error: courseErr } = await supabase
                    .from('coach_schedule')
                    .select('category, location, coach_id, date')
                    .eq('status', 'approved');
                
                if (courseErr) throw courseErr;

                const categoryCounts = { '健身課': 0, '皮拉提斯': 0, '體驗課': 0, '其他課程': 0 };
                (allCourses || []).forEach(c => {
                    if (categoryCounts.hasOwnProperty(c.category)) {
                        categoryCounts[c.category]++;
                    } else {
                        categoryCounts['其他課程']++;
                    }
                });

                // 3. 抓據點資料與統計 (據點授課占比)
                const { data: locations, error: locErr } = await supabase.from('locations').select('id, name');
                if (locErr) throw locErr;

                // 建立教練ID與據點名稱的對照
                const coachBranchMap = {}; // { coach_id: "SUNNY..." }
                coaches.forEach(c => {
                    // branch 如果包含據點名稱，則記錄下來
                    const userBranch = c.branch || '';
                    const matchedLoc = locations.find(l => userBranch.includes(l.name));
                    if (matchedLoc) {
                        coachBranchMap[c.user_id_string] = matchedLoc.name;
                    }
                });

                const branchTracking = (locations || []).map((loc, i) => {
                    // 計算此據點課程量
                    const count = (allCourses || []).filter(c => {
                        // 如果地點有填，則比對地點
                        if (c.location && c.location.trim() && c.location !== 'null') {
                            return c.location === loc.name;
                        }
                        // 如果地點沒填，比對教練所屬據點
                        return coachBranchMap[c.coach_id] === loc.name;
                    }).length;

                    return {
                        name: loc.name,
                        count: count,
                        color: i === 0 ? '#FF5C00' : (i === 1 ? '#FFB800' : (i === 2 ? '#10B981' : (i === 3 ? '#3B82F6' : '#A855F7')))
                    };
                });

                // 計算未分類的課程量 (總數 - 已分配總量)
                const assignedCount = branchTracking.reduce((sum, b) => sum + b.count, 0);
                const unassignedCount = (allCourses?.length || 0) - assignedCount;

                if (unassignedCount > 0) {
                    branchTracking.push({
                        name: '其他 / 未分類',
                        count: unassignedCount,
                        color: '#6B7280' // Gray
                    });
                }

                // 4. 抓本月 APP 使用次數 (登入次數)
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const { count: loginCount } = await supabase
                    .from('user_logins')
                    .select('*', { count: 'exact', head: true })
                    .gte('login_at', firstDay);

                // 5. 抓年度數據 (Statistics 圖表使用：課程量 vs. 登入次數)
                const currentYear = now.getFullYear();
                const yearStart = new Date(currentYear, 0, 1).toISOString();
                const { data: yearLogins } = await supabase
                    .from('user_logins')
                    .select('login_at')
                    .gte('login_at', yearStart);

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const yearlyStats = months.map(m => ({ month: m, val: 0, secondary: 0 }));

                (allCourses || []).forEach(c => {
                    const d = new Date(c.date);
                    if (d.getFullYear() === currentYear) {
                        const mIdx = d.getMonth();
                        if (mIdx >= 0 && mIdx < 12) yearlyStats[mIdx].val++;
                    }
                });

                (yearLogins || []).forEach(l => {
                    const d = new Date(l.login_at);
                    if (d.getFullYear() === currentYear) {
                        const mIdx = d.getMonth();
                        if (mIdx >= 0 && mIdx < 12) yearlyStats[mIdx].secondary++;
                    }
                });

                setStatsData(yearlyStats);

                setCounts({
                    student: studentCount || 0,
                    coach: coachCount || 0,
                    totalCourses: allCourses?.length || 0,
                    appUsageMonth: loginCount || 0,
                    categoryStats: [
                        { name: '健身課', count: categoryCounts['健身課'], color: '#FF5C00' },
                        { name: '皮拉提斯', count: categoryCounts['皮拉提斯'], color: '#FFB800' },
                        { name: '體驗課', count: categoryCounts['體驗課'], color: '#10B981' },
                        { name: '其他課程', count: categoryCounts['其他課程'], color: '#3B82F6' }
                    ],
                    branchStats: branchTracking
                });

            } catch (err) {
                console.error('Fetch dashboard counts error:', err);
            } finally {
                setIsFetching(false);
            }
        };

        fetchCounts();
    }, []);


    const topStats = [
        { id: 'students', label: '總學員人數', val: isFetching ? '--' : counts.student.toLocaleString(), growth: '+10.5%', isUp: true },
        { id: 'courses', label: '總課程數', val: isFetching ? '--' : counts.totalCourses.toLocaleString(), growth: '+8.4%', isUp: true },
        { id: 'coaches', label: '總教練人數', val: isFetching ? '--' : counts.coach.toLocaleString(), growth: '穩定', isUp: true },
        { id: 'usage', label: '本月APP使用次數', val: isFetching ? '--' : counts.appUsageMonth.toLocaleString(), growth: '+15.2%', isUp: true },
    ];

    const fetchMonthlyBreakdown = async (type, groupBy = null) => {
        setIsFetching(true);
        try {
            let tableName, dateColumn, filterCol, filterVal;
            
            if (type === 'courses') {
                tableName = 'coach_schedule';
                dateColumn = 'date';
                filterCol = 'status';
                filterVal = 'approved';
            } else if (type === 'usage') {
                tableName = 'user_logins';
                dateColumn = 'login_at';
            } else if (type === 'students' || type === 'coaches') {
                tableName = 'user_permissions';
                dateColumn = 'created_at';
                filterCol = 'role';
                filterVal = type === 'students' ? 'student' : 'coach';
            }
            
            let query = supabase.from(tableName).select(groupBy ? `*, ${dateColumn}` : dateColumn);
            if (filterCol) query = query.eq(filterCol, filterVal);

            const { data, error } = await query;
            if (error) throw error;

            // 處理據點與教練映射 (與列表統計邏輯保持同步)
            let locList = [];
            let coachBranchMap = {};
            if (groupBy === 'location') {
                const { data: lData } = await supabase.from('locations').select('name');
                locList = lData || [];
                
                // 抓取教練與據點的關係
                const { data: perms } = await supabase.from('user_permissions').select('email, user_id_string').eq('role', 'coach');
                const { data: profs } = await supabase.from('user_profiles').select('email, branch');
                
                (perms || []).forEach(p => {
                    const prof = (profs || []).find(pf => pf.email === p.email);
                    if (prof?.branch) {
                        const matchedLoc = locList.find(l => prof.branch.includes(l.name));
                        if (matchedLoc) coachBranchMap[p.user_id_string] = matchedLoc.name;
                    }
                });
            }

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            let groupedData = null;
            let displayData = [];
            
            if (groupBy) {
                groupedData = {};
                data.forEach(item => {
                    let gKey = '其他 / 未分類';
                    
                    if (groupBy === 'category') {
                        gKey = item.category || '其他課程';
                    } else if (groupBy === 'location') {
                        const val = item.location || '';
                        if (val && val.trim() && val !== 'null') {
                            const match = locList.find(l => val.includes(l.name) || l.name.includes(val));
                            if (match) gKey = match.name;
                        } else {
                            // 沒填地點則依照教練所屬據點
                            gKey = coachBranchMap[item.coach_id] || '其他 / 未分類';
                        }
                    }

                    if (!groupedData[gKey]) {
                        groupedData[gKey] = months.map(m => ({ month: m, count: 0 }));
                    }
                    const date = new Date(item[dateColumn]);
                    const mIdx = date.getMonth();
                    if (!isNaN(mIdx)) groupedData[gKey][mIdx].count++;
                });

                const sortedKeys = Object.keys(groupedData).sort();
                const firstKey = sortedKeys[0];
                displayData = groupedData[firstKey] || [];
            } else {
                displayData = months.map(m => ({ month: m, count: 0 }));
                data.forEach(item => {
                    const date = new Date(item[dateColumn]);
                    const mIdx = date.getMonth();
                    if (!isNaN(mIdx)) displayData[mIdx].count++;
                });
            }



            const titles = {
                courses: '年度各月課程分析',
                usage: '年度各月使用頻率',
                students: '年度學員註冊成長',
                coaches: '年度教練註冊成長'
            };

            const sortedKeys = groupedData ? Object.keys(groupedData).sort() : [];

            setDetailModal({
                isOpen: true,
                type,
                title: type === 'courses' && groupBy ? (groupBy === 'category' ? '課程類別分析' : '據點分析') : titles[type],
                data: displayData,
                fullGrouped: groupedData,
                activeGroupKey: groupedData ? sortedKeys[0] : null
            });
        } catch (err) {
            console.error('Failed to fetch breakdown:', err);
        } finally {
            setIsFetching(false);
        }
    };




    const taskCategories = [
        { id: 'courses', label: '課程申請', icon: ShieldCheck, tab: 'course_apps', countKey: 'courseApps', table: 'coach_schedule', statusCol: 'status', pendingVal: 'pending' },
        { id: 'leaves', label: '請假管理', icon: ClipboardList, tab: 'leaves', countKey: 'leaves', table: 'coach_leaves', statusCol: 'status', pendingVal: '待審核' },
        { id: 'certs', label: '證照審核', icon: Award, tab: 'certs', countKey: 'certs', table: 'coach_certifications', statusCol: 'status', pendingVal: '待審核' },
        { id: 'xp', label: 'XP 審核', icon: TrendingUp, tab: 'xp_review', countKey: 'xp', table: 'coach_xp_applications', statusCol: 'status', pendingVal: '待審核' },
        { id: 'injuries', label: '疼痛警訊', icon: ShieldAlert, tab: 'injury_alerts', countKey: 'injuries', table: 'local', statusCol: 'confirmed', pendingVal: false },
    ];

    const [activeCategory, setActiveCategory] = useState(taskCategories[0]);
    const [categoryTasks, setCategoryTasks] = useState([]);
    const [isTasksFetching, setIsTasksFetching] = useState(false);

    useEffect(() => {
        const fetchCategoryTasks = async () => {
            setIsTasksFetching(true);
            try {
                if (activeCategory.table === 'local') {
                    const alerts = JSON.parse(localStorage.getItem('injury_alerts') || '[]');
                    setCategoryTasks(alerts.filter(a => !a.confirmed).slice(0, 5));
                } else {
                    const { data, error } = await supabase
                        .from(activeCategory.table)
                        .select('*')
                        .eq(activeCategory.statusCol, activeCategory.pendingVal)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (error) throw error;
                    setCategoryTasks(data || []);
                }
            } catch (err) {
                console.error('Fetch tasks error:', err);
            } finally {
                setIsTasksFetching(false);
            }
        };

        fetchCategoryTasks();
    }, [activeCategory]);



    return (
        <div className={`manager-home ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <header className="manager-header">
                <div className="header-text">
                    <p className="sub-title">JZ ADMIN 健身管理後台</p>
                    <h2 className="page-title">總覽儀表板</h2>
                </div>
                <div className="header-actions">
                    <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="icon-btn"><Bell size={20} /></button>
                    <div className="admin-avatar">管</div>
                </div>
            </header>

            <div className="manager-scroll-content">
                {/* 1. Top Stats Grid */}
                <div className="stats-header-grid">
                    {topStats.map((stat, idx) => (
                        <div 
                            key={idx} 
                            className="stat-summary-card clickable"
                            onClick={() => fetchMonthlyBreakdown(stat.id)}
                        >
                            <div className="stat-info">
                                <p className="stat-label">{stat.label}</p>
                                <h3 className="stat-val">{stat.val}</h3>
                            </div>
                            <div className={`stat-badge ${stat.isUp ? 'up' : 'down'}`}>
                                {stat.growth} {stat.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            </div>
                            <div className="click-hint">點擊查看分析 <ChevronRight size={10} /></div>
                        </div>
                    ))}
                </div>


                {/* 2. Main Statistics Chart */}
                <div className="main-stat-section">
                    <div className="section-title-row">
                        <div className="title-group">
                            <TrendingUp size={18} color="#FF5C00" />
                            <h3>年度營運統計 (Yearly Data)</h3>
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item"><span className="dot" style={{ backgroundColor: '#FF5C00' }}></span> 課程總量</div>
                            <div className="legend-item"><span className="dot" style={{ backgroundColor: '#444' }}></span> APP 登入次數</div>
                        </div>
                    </div>
                    <div className="stats-main-chart">
                        {statsData.map((d, i) => {
                            const maxVal = Math.max(...statsData.map(s => s.val + s.secondary), 10);
                            const h1 = (d.val / maxVal) * 100;
                            const h2 = (d.secondary / maxVal) * 100;
                            return (
                                <div key={i} className="chart-col">
                                    <div className="bar-stacks">
                                        <div className="bar secondary" style={{ height: `${h2}%` }}></div>
                                        <div className="bar primary" style={{ height: `${h1}%` }}></div>
                                    </div>
                                    <span className="col-label">{d.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>


                {/* 3. Breakdown & Region Row */}
                <div className="breakdown-grid">
                    <div 
                        className="breakdown-card donut-section clickable"
                        onClick={() => fetchMonthlyBreakdown('courses', 'category')}
                    >
                        <div className="card-header">
                            <h4>課程類別佔比</h4>
                            <MoreHorizontal size={16} />
                        </div>
                        <div className="donut-center">
                            <div className="donut-chart" style={{ 
                                background: counts.totalCourses > 0 ? (() => {
                                    let currentPercent = 0;
                                    const gradients = counts.categoryStats.map(stat => {
                                        const percent = (stat.count / counts.totalCourses) * 100;
                                        const start = currentPercent;
                                        currentPercent += percent;
                                        return `${stat.color} ${start}% ${currentPercent}%`;
                                    });
                                    return `conic-gradient(${gradients.join(', ')})`;
                                })() : '#333'
                            }}>
                                <div className="donut-inner"></div>
                            </div>
                            <div className="donut-labels">
                                {counts.categoryStats.map((stat, i) => (
                                    <div key={i} className="d-label">
                                        <span className="dot-indicator" style={{ background: stat.color }}></span>
                                        {stat.name} 
                                        <span>{counts.totalCourses > 0 ? Math.round((stat.count / counts.totalCourses) * 100) : 0}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="click-hint">點擊查看年度月度分析 <ChevronRight size={10} /></div>
                    </div>

                    <div 
                        className="breakdown-card region-section clickable"
                        onClick={() => fetchMonthlyBreakdown('courses', 'location')}
                    >
                        <div className="card-header">
                            <h4>據點授課占比 (Branch Analysis)</h4>
                            <MoreHorizontal size={16} />
                        </div>
                        <div className="branch-list">
                            {counts.branchStats.length === 0 ? (
                                <p className="no-data-hint">尚無據點資料</p>
                            ) : (() => {
                                const maxCount = Math.max(...counts.branchStats.map(b => b.count), 1);
                                return counts.branchStats.map((b, i) => (
                                    <div key={i} className="branch-item">
                                        <div className="b-info-row">
                                            <p className="b-name">{b.name}</p>
                                            <span className="b-count">{b.count} 堂</span>
                                        </div>
                                        <div className="b-bar-wrap">
                                            <div 
                                                className="b-bar" 
                                                style={{ 
                                                    width: `${(b.count / maxCount) * 100}%`, 
                                                    backgroundColor: b.color 
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ));

                            })()}
                        </div>
                        <div className="click-hint" style={{ marginTop: '12px' }}>點擊查看年度月度分析 <ChevronRight size={10} /></div>
                    </div>

                </div>



                {/* 4. Filterable Task List */}
                <div className="upcoming-tasks-section">
                    <div className="tasks-header">
                        <h3>管理中心待辦事項 (Management Inbox)</h3>
                        <div className="total-pending-pill">
                            {Object.values(pendingCounts).reduce((a, b) => a + b, 0)} 件待辦
                        </div>
                    </div>
                    
                    <div className="category-button-bar">
                        {taskCategories.map(cat => (
                            <button 
                                key={cat.id} 
                                className={`cat-btn ${activeCategory.id === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {pendingCounts[cat.countKey] > 0 && <span className="red-dot-badge"></span>}
                                <span className="cat-label">{cat.label}</span>
                            </button>
                        ))}
                    </div>


                    <div className="task-list-container">
                        <div className="list-meta">
                            <p className="active-cat-title">{activeCategory.label} 詳細清單</p>
                            <button className="goto-link" onClick={() => onNavigate(activeCategory.tab)}>
                                進入管理頁面 <ChevronRight size={14} />
                            </button>
                        </div>

                        {isTasksFetching ? (
                            <div className="tasks-loading">載入中...</div>
                        ) : categoryTasks.length === 0 ? (
                            <div className="empty-tasks">
                                <div className="empty-icon"><Bell size={40} opacity={0.1} /></div>
                                <p>目前沒有待處理的{activeCategory.label}</p>
                            </div>
                        ) : (
                            <div className="task-scroll">
                                {categoryTasks.map((task, idx) => {
                                    const details = (() => {
                                        switch (activeCategory.id) {
                                            case 'courses': return { title: `${task.category || '健身'} 課程申請`, sub: `教練: ${task.coach_id}`, meta: task.date };
                                            case 'leaves': return { title: `請假申請: ${task.reason}`, sub: `教練: ${task.coach_email}`, meta: task.start_date };
                                            case 'certs': return { title: `證照審核: ${task.cert_name}`, sub: `教練: ${task.coach_email}`, meta: '待審核' };
                                            case 'xp': return { title: `XP 申請: ${task.reason}`, sub: `數量: ${task.amount} XP`, meta: '待審核' };
                                            case 'injuries': return { title: `疼痛警示: ${task.user_name}`, sub: `部位: ${task.body_part}`, meta: '立即處理' };
                                            default: return { title: '待處理項目', sub: '點擊查看', meta: '' };
                                        }
                                    })();

                                    return (
                                        <div 
                                            key={task.id || idx} 
                                            className="task-item-premium clickable"
                                            onClick={() => onNavigate(activeCategory.tab)}
                                        >
                                            <div className="ti-main">
                                                <p className="ti-title">{details.title}</p>
                                                <p className="ti-sub">{details.sub}</p>
                                            </div>
                                            <div className="ti-meta">
                                                <span className="ti-date">{details.meta}</span>
                                                <div className="ti-action-btn">處理</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {detailModal.isOpen && (
                <div className="detail-stat-overlay" onClick={() => setDetailModal({ ...detailModal, isOpen: false })}>
                    <div className="detail-stat-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="modal-sub">Data Analysis</p>
                                <h3>{detailModal.title}</h3>
                            </div>
                            <button className="close-btn" onClick={() => setDetailModal({ ...detailModal, isOpen: false })}><X size={20} /></button>
                        </div>
                        {detailModal.fullGrouped && (
                            <div className="modal-tabs">
                                {Object.keys(detailModal.fullGrouped).sort().map(key => (
                                    <button 
                                        key={key} 
                                        className={`m-tab ${detailModal.activeGroupKey === key ? 'active' : ''}`}
                                        onClick={() => setDetailModal({
                                            ...detailModal,
                                            activeGroupKey: key,
                                            data: detailModal.fullGrouped[key]
                                        })}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="modal-scroll">
                            <div className="monthly-chart-view">
                                {detailModal.data.map((m, i) => (
                                    <div key={i} className="monthly-row">
                                        <div className="m-label">{m.month}</div>
                                        <div className="m-bar-container">
                                            <div 
                                                className="m-bar" 
                                                style={{ 
                                                    width: `${Math.min(100, (m.count / Math.max(...detailModal.data.map(d => d.count), 1)) * 100)}%`,
                                                    background: detailModal.type === 'courses' ? 'linear-gradient(to right, #FF5C00, #FFB800)' : 'linear-gradient(to right, #3B82F6, #60A5FA)'
                                                }}
                                            ></div>
                                        </div>
                                        <div className="m-val">{m.count}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer-info">
                                <p>提示：此數據為系統自動統計之現有資料。課程統計僅計入「已核准」課程。目前顯示：<b>{detailModal.activeGroupKey || '全部'}</b></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <style>{`
                .manager-home { display: flex; flex-direction: column; height: 100%; transition: all 0.3s ease; }
                .manager-home.dark-mode { background-color: #0A0A0B; color: white; --bg-card: #18181B; --border-clr: rgba(255,255,255,0.05); --txt-sec: #A1A1AA; --bg-secondary: #000; }
                .manager-home.light-mode { background-color: #F8FAFC; color: #1E293B; --bg-card: #FFFFFF; --border-clr: #E2E8F0; --txt-sec: #64748B; --bg-secondary: #F1F5F9; }

                .manager-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 20px; }
                .page-title { font-size: 20px; font-weight: 850; margin-top: 4px; }
                .sub-title { font-size: 11px; font-weight: 700; color: #FF5C00; text-transform: uppercase; letter-spacing: 1px; }
                .header-actions { display: flex; gap: 16px; align-items: center; }
                .theme-toggle { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border-clr); color: var(--txt-sec); cursor: pointer; }
                .admin-avatar { width: 32px; height: 32px; background: #FF5C00; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }

                .manager-scroll-content { flex: 1; overflow-y: auto; padding: 0 16px 40px; }
                
                /* Grid 1 */
                .stats-header-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
                .stat-summary-card { background: var(--bg-card); padding: 16px; border-radius: 12px; border: 1px solid var(--border-clr); display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
                .stat-label { font-size: 12px; color: var(--txt-sec); font-weight: 600; }
                .stat-val { font-size: 20px; font-weight: 800; }
                .stat-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; width: fit-content; }
                .stat-badge.up { background: rgba(16, 185, 129, 0.1); color: #10B981; }
                .stat-badge.down { background: rgba(239, 68, 68, 0.1); color: #EF4444; }

                /* Large Chart Section */
                .main-stat-section { background: var(--bg-card); padding: 24px; border-radius: 20px; border: 1px solid var(--border-clr); margin-bottom: 24px; position: relative; overflow: hidden; }
                .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .title-group { display: flex; align-items: center; gap: 10px; }
                .title-group h3 { font-size: 16px; font-weight: 850; letter-spacing: -0.5px; }
                
                .chart-legend { display: flex; gap: 16px; align-items: center; }
                .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--txt-sec); }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                
                .stats-main-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 200px; padding: 20px 0 10px; gap: 4px; }
                .chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; gap: 12px; }
                .bar-stacks { width: 100%; max-width: 14px; height: 150px; background: rgba(255,255,255,0.03); border-radius: 100px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; border: 1px solid rgba(255,255,255,0.02); }
                .bar { width: 100%; transition: height 1s cubic-bezier(0.19, 1, 0.22, 1); min-height: 2px; }
                .bar.primary { background: linear-gradient(to top, #FF5C00, #FF8A00); box-shadow: 0 0 15px rgba(255, 92, 0, 0.2); z-index: 2; }
                .bar.secondary { background: #444; opacity: 0.8; z-index: 1; }
                .col-label { font-size: 10px; color: var(--txt-sec); font-weight: 800; opacity: 0.8; }


                /* Breakdown Row */
                .breakdown-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; }
                @media (min-width: 700px) { .breakdown-grid { grid-template-columns: 1fr 1fr; } }
                .breakdown-card { background: var(--bg-card); padding: 16px; border-radius: 16px; border: 1px solid var(--border-clr); }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .card-header h4 { font-size: 13px; font-weight: 700; color: var(--txt-sec); }
                
                .donut-center { display: flex; align-items: center; gap: 20px; }
                .donut-chart { width: 80px; height: 80px; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; }
                .donut-inner { width: 50px; height: 50px; background: var(--bg-card); border-radius: 50%; }
                .donut-labels { display: flex; flex-direction: column; gap: 4px; flex: 1; }
                .d-label { font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 8px; width: 100%; }
                .d-label span:last-child { margin-left: auto; color: var(--txt-sec); }
                .dot-indicator { width: 6px; height: 6px; border-radius: 50%; }

                .branch-list { display: flex; flex-direction: column; gap: 20px; padding: 10px 0; width: 100%; }
                .branch-item { display: flex; flex-direction: column; gap: 8px; width: 100%; }
                .b-info-row { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; }
                .b-name { font-size: 11px; font-weight: 700; color: var(--txt-sec); opacity: 0.9; }
                .b-bar-wrap { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; width: 100%; position: relative; border: 1px solid rgba(255,255,255,0.02); }
                .b-bar { height: 100%; border-radius: 4px; transition: width 1.2s cubic-bezier(0.19, 1, 0.22, 1); box-shadow: 0 0 10px rgba(0,0,0,0.4); }
                .b-count { font-size: 11px; font-weight: 800; color: white; opacity: 1; }
                .no-data-hint { font-size: 12px; color: #555; text-align: center; padding: 20px; }





                /* Management Inbox */
                .upcoming-tasks-section { background: var(--bg-card); padding: 24px; border-radius: 20px; border: 1px solid var(--border-clr); }
                .tasks-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .tasks-header h3 { font-size: 16px; font-weight: 850; letter-spacing: -0.5px; }
                .total-pending-pill { background: rgba(255, 92, 0, 0.1); color: #FF5C00; padding: 4px 10px; border-radius: 100px; font-size: 10px; font-weight: 800; border: 1px solid rgba(255, 92, 0, 0.2); }
                
                .category-button-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 24px; }
                .cat-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 14px 4px; display: flex; align-items: center; justify-content: center; color: var(--txt-sec); cursor: pointer; transition: 0.2s; position: relative; overflow: visible; }
                .cat-btn:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
                .cat-btn.active { background: #FF5C00; border-color: #FF5C00; color: white; box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3); }
                .cat-label { font-size: 11px; font-weight: 850; letter-spacing: 0.5px; }
                .red-dot-badge { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #EF4444; border-radius: 50%; border: 2px solid var(--bg-card); z-index: 5; }
                .cat-btn.active .red-dot-badge { border-color: #FF5C00; }


                .task-list-container { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.02); }
                .list-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.05); }
                .active-cat-title { font-size: 12px; font-weight: 800; color: var(--txt-sec); }
                .goto-link { font-size: 11px; font-weight: 700; color: #FF5C00; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; }

                .tasks-loading { text-align: center; padding: 40px; font-size: 13px; color: #555; }
                .empty-tasks { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; color: #555; }
                .empty-icon { opacity: 0.1; }

                .task-scroll { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 4px; }
                .task-item-premium { background: var(--bg-card); border: 1px solid var(--border-clr); border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
                .task-item-premium:hover { border-color: rgba(255, 92, 0, 0.5); transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .ti-title { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
                .ti-sub { font-size: 11px; color: var(--txt-sec); font-weight: 600; }
                .ti-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
                .ti-date { font-size: 10px; color: var(--txt-sec); font-weight: 700; opacity: 0.8; }
                .ti-action-btn { font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.05); color: white; padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); }
                .task-item-premium:hover .ti-action-btn { background: #FF5C00; border-color: #FF5C00; }




                /* Click Hint */
                .clickable { cursor: pointer; position: relative; overflow: hidden; transition: 0.2s; }
                .clickable:hover { transform: translateY(-4px); border-color: #FF5C00; box-shadow: 0 12px 24px rgba(0,0,0,0.4); }
                .click-hint { font-size: 9px; color: #FF5C00; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 4px; opacity: 0.7; }
                
                /* Modal */
                .detail-stat-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .detail-stat-modal { background: #18181B; width: 100%; max-width: 500px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
                .modal-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .modal-sub { font-size: 10px; color: #FF5C00; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .modal-header h3 { font-size: 18px; font-weight: 800; color: white; }
                .close-btn { background: none; border: none; color: #666; cursor: pointer; transition: 0.2s; }
                .close-btn:hover { color: white; transform: rotate(90deg); }
                
                .modal-tabs { display: flex; gap: 8px; padding: 16px 24px; background: rgba(255,255,255,0.02); overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .m-tab { padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 800; border: 1px solid rgba(255,255,255,0.05); color: #666; background: none; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                .m-tab:hover { color: #AAA; background: rgba(255,255,255,0.05); }
                .m-tab.active { background: #FF5C00; color: white; border-color: #FF5C00; }

                .modal-scroll { padding: 24px; max-height: 60vh; overflow-y: auto; }
                
                .monthly-chart-view { display: flex; flex-direction: column; gap: 16px; }
                .monthly-row { display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; gap: 16px; }
                .m-label { font-size: 12px; font-weight: 800; color: var(--txt-sec); }
                .m-bar-container { height: 8px; background: rgba(255,255,255,0.03); border-radius: 100px; overflow: hidden; }
                .m-bar { height: 100%; border-radius: 100px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
                .m-val { font-size: 12px; font-weight: 800; color: white; text-align: right; }
                
                .modal-footer-info { margin-top: 32px; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); }
                .modal-footer-info p { font-size: 11px; color: #555; font-weight: 600; line-height: 1.6; }
                .modal-footer-info b { color: #FF5C00; }

            `}</style>
        </div>
    );
};

export default ManagerHome;
