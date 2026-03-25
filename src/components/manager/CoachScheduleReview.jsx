import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Clock, MapPin, Users, X, 
  CheckCircle2, AlertCircle, Loader2, Calendar,
  MoreVertical, Box, Globe, Search, Filter,
  User, Mail, Shield, Hash, Map, Check
} from 'lucide-react';
import { supabase } from '../../supabase';
import gymScheduleBg from '../../assets/gym-schedule-bg.png';

const CoachScheduleReview = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [coaches, setCoaches] = useState([]);
    const [levels, setLevels] = useState([]);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [branchFilter, setBranchFilter] = useState('全部');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [combinedSchedule, setCombinedSchedule] = useState([]);
    const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
    
    // 預定義顏色
    const coachColors = [
        '#FF5C00', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
        '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6'
    ];

    // 初始化快取
    useEffect(() => {
        fetchCoachesAndLevels();
    }, []);

    // 當選擇變動或月份變動時抓取課表
    useEffect(() => {
        if (selectedEmails.length > 0) {
            fetchCombinedSchedules();
        } else {
            setCombinedSchedule([]);
        }
    }, [selectedEmails, currentDate]);

    const fetchCoachesAndLevels = async () => {
        try {
            setIsLoading(true);
            
            // 抓取等級定義
            const { data: levelsData } = await supabase.from('coach_levels').select('*').order('level', { ascending: true });
            if (levelsData) setLevels(levelsData);

            // 抓取教練資料 (包含權限資料中的編號)
            const { data: profiles, error } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    user_permissions (
                        role,
                        user_id_string
                    )
                `);

            if (error) throw error;

            // 過濾出教練
            const coachProfiles = (profiles || [])
                .filter(p => p.user_permissions && p.user_permissions.role === 'coach')
                .map(p => ({
                    ...p,
                    id_string: p.user_permissions.user_id_string,
                    // 計算當前等級
                    levelTitle: levelsData ? (levelsData.filter(l => (p.total_xp || 0) >= l.min_xp).pop()?.title || '初級教練') : '教練'
                }))
                .sort((a, b) => {
                    // 按編號排序
                    const idA = parseInt(a.id_string) || 999;
                    const idB = parseInt(b.id_string) || 999;
                    return idA - idB;
                });

            setCoaches(coachProfiles);
        } catch (err) {
            console.error('Fetch coaches error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCombinedSchedules = async () => {
        try {
            setIsSchedulesLoading(true);
            
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1).toLocaleDateString('en-CA');
            const endOfMonth = new Date(year, month + 1, 0).toLocaleDateString('en-CA');

            // 找出這些 email 對應的 UUID 或 ID_STRING
            const selectedCoaches = coaches.filter(c => selectedEmails.includes(c.email));
            const coachIdsToQuery = selectedCoaches.flatMap(c => [c.id, c.id_string, c.email].filter(Boolean));

            // 抓取所有已選教練的課表 (匹配任一識別碼)
            const { data, error } = await supabase
                .from('coach_schedule')
                .select('*')
                .in('coach_id', coachIdsToQuery)
                .gte('date', startOfMonth)
                .lte('date', endOfMonth);

            if (error) throw error;
            setCombinedSchedule(data || []);
        } catch (err) {
            console.error('Fetch combined schedules error:', err);
        } finally {
            setIsSchedulesLoading(false);
        }
    };

    const branches = useMemo(() => {
        const b = new Set(['全部']);
        coaches.forEach(c => { if (c.branch) b.add(c.branch); });
        return Array.from(b);
    }, [coaches]);

    const filteredCoaches = coaches.filter(c => {
        const matchesBranch = branchFilter === '全部' || c.branch === branchFilter;
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.id_string?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesBranch && matchesSearch;
    });

    const toggleCoach = (email) => {
        setSelectedEmails(prev => {
            if (prev.includes(email)) {
                return prev.filter(e => e !== email);
            }
            if (prev.length >= 10) {
                alert('最多同時選擇 10 位教練');
                return prev;
            }
            return [...prev, email];
        });
    };

    // 建立 Email 對應顏色的 Map
    const coachColorMap = useMemo(() => {
        const map = {};
        selectedEmails.forEach((email, index) => {
            map[email] = coachColors[index % coachColors.length];
        });
        return map;
    }, [selectedEmails]);

    // 根據 coach_id 找到正確的顏色 (因為課表存的可能是 id, id_string 或 email)
    const getColorByCoachId = (coachId) => {
        const coach = coaches.find(c => c.id === coachId || c.id_string === coachId || c.email === coachId);
        return coach ? coachColorMap[coach.email] : '#666';
    };

    const renderCalendar = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayCells = [];

        for (let i = 0; i < adjustedFirstDay; i++) {
            dayCells.push(<div key={`empty-${i}`} className="date-cell empty"></div>);
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        const selectedDateStr = selectedDate.toLocaleDateString('en-CA');

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const dateStr = dateObj.toLocaleDateString('en-CA');
            const isSelected = selectedDateStr === dateStr;
            const isToday = todayStr === dateStr;
            
            // 抓取當天的所有課程，並按教練分組
            const dailyEvents = combinedSchedule.filter(s => s.date === dateStr);
            const coachesWithEvents = [...new Set(dailyEvents.map(s => {
                const c = coaches.find(coach => coach.id === s.coach_id || coach.id_string === s.coach_id || coach.email === s.coach_id);
                return c?.email;
            }))].filter(Boolean);

            dayCells.push(
                <div
                    key={d}
                    className={`date-cell ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
                    onClick={() => setSelectedDate(dateObj)}
                >
                    <span className="date-num">{d}</span>
                    <div className="event-dots-container">
                        {coachesWithEvents.slice(0, 5).map(email => (
                            <span 
                                key={email} 
                                className="coach-dot" 
                                style={{ backgroundColor: coachColorMap[email] }}
                            ></span>
                        ))}
                        {coachesWithEvents.length > 5 && <span className="more-dots">...</span>}
                    </div>
                </div>
            );
        }

        return (
            <div className="modern-calendar dark">
                <div className="cal-nav">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="nav-btn"><ChevronLeft size={20} /></button>
                    <div className="month-display">
                        <span className="m-name">{currentDate.toLocaleString('en-US', { month: 'long' })}</span>
                        <span className="y-num">{currentDate.getFullYear()}</span>
                    </div>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="nav-btn"><ChevronRight size={20} /></button>
                </div>
                <div className="days-header">
                    {days.map(d => <div key={d} className="day-name">{d}</div>)}
                </div>
                <div className="dates-grid">
                    {dayCells}
                </div>
            </div>
        );
    };

    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    const dailyEvents = combinedSchedule
        .filter(s => s.date === selectedDateStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
        <div className="coach-review-page">
            <div className="review-layout">
                {/* 左側教練列表 */}
                <aside className="coach-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            <Users size={20} />
                            <span>教練班表檢核</span>
                        </div>
                        <div className="selection-counter">
                            已選 {selectedEmails.length} / 10
                        </div>
                    </div>

                    <div className="filter-controls">
                        <div className="search-bar">
                            <Search size={14} />
                            <input 
                                type="text" 
                                placeholder="搜尋姓名或編號..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="branch-filter">
                            <MapPin size={14} />
                            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="coach-list-scroll">
                        {isLoading ? (
                            <div className="sidebar-loading"><Loader2 className="spin" /></div>
                        ) : (
                            filteredCoaches.map(coach => {
                                const isSelected = selectedEmails.includes(coach.email);
                                const color = coachColorMap[coach.email];
                                return (
                                    <div 
                                        key={coach.email} 
                                        className={`coach-item-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleCoach(coach.email)}
                                        style={isSelected ? { borderColor: color } : {}}
                                    >
                                        <div className="coach-card-left">
                                            <div className="checkbox-visual">
                                                {isSelected && <Check size={14} strokeWidth={4} style={{ color }} />}
                                            </div>
                                            <div className="coach-main-info">
                                                <div className="name-row">
                                                    <span className="coach-name">{coach.name}</span>
                                                    <span className="coach-id">#{coach.id_string}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="lvl-badge">{coach.levelTitle}</span>
                                                    <span className="branch-badge">{coach.branch || '未設定'}</span>
                                                </div>
                                                <div className="email-row">
                                                    <Mail size={10} />
                                                    <span>{coach.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="color-bar" style={{ backgroundColor: color }}></div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* 右側日曆與內容 */}
                <main className="calendar-main" style={{ backgroundImage: `url(${gymScheduleBg})` }}>
                    <div className="main-overlay"></div>
                    <div className="main-content-scroll">
                        <div className="calendar-card-wrap">
                            {renderCalendar()}
                        </div>

                        <div className="agenda-detailed-section">
                            <div className="agenda-header-row">
                                <div className="date-label">
                                    <div className="orange-dot"></div>
                                    <h3>{selectedDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'long' })} 程</h3>
                                </div>
                            </div>

                            <div className="agenda-list">
                                {isSchedulesLoading ? (
                                    <div className="agenda-loading"><Loader2 className="spin" /> 讀取班表中...</div>
                                ) : dailyEvents.length === 0 ? (
                                    <div className="empty-agenda">
                                        <Calendar size={48} />
                                        <p>此日期尚無已選教練的課表排程</p>
                                    </div>
                                ) : (
                                    dailyEvents.map(event => {
                                        const coach = coaches.find(c => c.id === event.coach_id || c.id_string === event.coach_id || c.email === event.coach_id);
                                        const color = getColorByCoachId(event.coach_id);
                                        return (
                                            <div key={event.id} className="manager-agenda-card" style={{ borderLeftColor: color }}>
                                                <div className="card-top">
                                                    <span className="time-tag">{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                                                    <div className="coach-tag" style={{ backgroundColor: `${color}15`, color }}>
                                                        <User size={12} />
                                                        <span>{coach?.name || '未知教練'}</span>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <h4 className="card-title">{event.title}</h4>
                                                    <div className="card-footer">
                                                        <MapPin size={12} />
                                                        <span>{event.location || '場館內'}</span>
                                                        {event.student_name && <>
                                                            <div className="footer-dot"></div>
                                                            <Users size={12} />
                                                            <span>{event.student_name}</span>
                                                        </>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                .coach-review-page { height: 100vh; background-color: #000; overflow: hidden; }
                .review-layout { display: flex; height: 100%; }
                
                /* Sidebar */
                .coach-sidebar { 
                    width: 320px; 
                    background: #121214; 
                    border-right: 1px solid #222; 
                    display: flex; 
                    flex-direction: column;
                    flex-shrink: 0;
                    z-index: 10;
                }
                .sidebar-header { padding: 24px; border-bottom: 1px solid #222; }
                .sidebar-title { display: flex; align-items: center; gap: 10px; color: white; font-weight: 800; font-size: 18px; margin-bottom: 8px; }
                .selection-counter { font-size: 12px; color: #64748B; font-weight: 600; }
                
                .filter-controls { padding: 16px 24px; background: #16161A; border-bottom: 1px solid #222; display: flex; flex-direction: column; gap: 12px; }
                .search-bar, .branch-filter { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    background: #000; 
                    border: 1px solid #333; 
                    padding: 8px 12px; 
                    border-radius: 10px; 
                    color: #94A3B8;
                }
                .search-bar input, .branch-filter select { 
                    flex: 1; 
                    background: transparent; 
                    border: none; 
                    outline: none; 
                    color: white; 
                    font-size: 13px; 
                }
                .branch-filter select { appearance: none; cursor: pointer; }

                .coach-list-scroll { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
                .coach-item-card { 
                    background: #1C1C1E; 
                    border: 1px solid #333; 
                    border-radius: 16px; 
                    padding: 16px; 
                    cursor: pointer; 
                    transition: 0.2s; 
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                }
                .coach-item-card:hover { border-color: #444; background: #222; }
                .coach-item-card.selected { background: #222; border-width: 2px; }
                
                .coach-card-left { display: flex; gap: 14px; }
                .checkbox-visual { 
                    width: 22px; 
                    height: 22px; 
                    border-radius: 6px; 
                    border: 1.5px solid #444; 
                    background: #000; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    margin-top: 2px;
                }
                .coach-item-card.selected .checkbox-visual { border-color: currentColor; }
                
                .coach-main-info { display: flex; flex-direction: column; gap: 4px; }
                .name-row { display: flex; align-items: baseline; gap: 8px; }
                .coach-name { color: white; font-weight: 700; font-size: 15px; }
                .coach-id { color: #64748B; font-size: 11px; font-family: monospace; }
                .meta-row { display: flex; gap: 6px; }
                .lvl-badge { background: #3B82F620; color: #3B82F6; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
                .branch-badge { background: #FFFFFF08; color: #94A3B8; font-size: 9px; padding: 2px 6px; border-radius: 4px; }
                .email-row { display: flex; align-items: center; gap: 6px; color: #475569; font-size: 10px; margin-top: 2px; }
                
                .color-bar { width: 4px; position: absolute; right: 0; top: 0; bottom: 0; }
                
                /* Calendar Main */
                .calendar-main { 
                    flex: 1; 
                    position: relative; 
                    background-size: cover; 
                    background-position: center; 
                    overflow: hidden; 
                    display: flex; 
                    flex-direction: column;
                }
                .main-overlay { 
                    position: absolute; 
                    inset: 0; 
                    background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.95)); 
                    backdrop-filter: blur(2px);
                }
                .main-content-scroll { 
                    position: relative; 
                    z-index: 2; 
                    height: 100%; 
                    overflow-y: auto; 
                    padding: 40px; 
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .calendar-card-wrap { 
                    width: 100%; 
                    max-width: 600px; 
                    background: rgba(18, 18, 18, 0.8); 
                    backdrop-filter: blur(20px);
                    padding: 30px; 
                    border-radius: 32px; 
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }

                /* Calendar Specific */
                .modern-calendar.dark .y-num { color: #64748B; }
                .modern-calendar.dark .day-name { color: #475569; }
                .modern-calendar.dark .date-cell { color: #94A3B8; background: rgba(255,255,255,0.02); }
                .modern-calendar.dark .date-cell:hover { background: rgba(255,255,255,0.05); }
                .modern-calendar.dark .date-cell.active { background: #FF5C00; color: white; }
                .modern-calendar.dark .date-cell.is-today { border-color: #FF5C00; }
                
                .event-dots-container { 
                    position: absolute; 
                    bottom: 6px; 
                    display: flex; 
                    gap: 3px; 
                    flex-wrap: wrap; 
                    justify-content: center; 
                    width: 80%; 
                }
                .coach-dot { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5); }
                .more-dots { font-size: 8px; color: #475569; }

                /* Agenda Section */
                .agenda-detailed-section { width: 100%; max-width: 600px; margin-top: 40px; }
                .agenda-header-row { margin-bottom: 24px; }
                .date-label { display: flex; align-items: center; gap: 12px; }
                .orange-dot { width: 8px; height: 8px; background: #FF5C00; border-radius: 50%; box-shadow: 0 0 10px #FF5C0080; }
                .date-label h3 { color: white; font-size: 18px; font-weight: 700; }
                
                .agenda-list { display: flex; flex-direction: column; gap: 16px; }
                .manager-agenda-card { 
                    background: #FFFFFF; 
                    border-radius: 16px; 
                    padding: 16px 20px; 
                    border-left: 5px solid #FF5C00; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    transition: 0.2s;
                }
                .manager-agenda-card:hover { transform: translateY(-2px); }
                
                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .time-tag { font-family: monospace; font-weight: 800; color: #64748B; font-size: 14px; }
                .coach-tag { 
                    display: flex; 
                    align-items: center; 
                    gap: 6px; 
                    padding: 4px 10px; 
                    border-radius: 8px; 
                    font-size: 11px; 
                    font-weight: 800; 
                }
                
                .card-body .card-title { font-size: 18px; font-weight: 800; color: #1E293B; margin-bottom: 6px; }
                .card-footer { display: flex; align-items: center; gap: 6px; color: #94A3B8; font-size: 12px; font-weight: 600; }
                .footer-dot { width: 4px; height: 4px; background: #CBD5E1; border-radius: 50%; }

                .empty-agenda { padding: 60px 0; text-align: center; color: #475569; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .sidebar-loading, .agenda-loading { padding: 40px; text-align: center; color: #64748B; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 900px) {
                    .review-layout { flex-direction: column; }
                    .coach-sidebar { width: 100%; height: 40vh; }
                    .calendar-main { height: 60vh; }
                    .main-content-scroll { padding: 20px; }
                }

                /* Reuse modern-calendar styles from CoachSchedule */
                .modern-calendar { width: 100%; }
                .cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .m-name { font-size: 24px; font-weight: 800; color: white; }
                .y-num { font-size: 14px; opacity: 0.5; }
                .nav-btn { background: rgba(255,255,255,0.05); border: none; padding: 10px; border-radius: 12px; color: white; cursor: pointer; }
                .days-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 15px; }
                .day-name { font-size: 11px; font-weight: 700; opacity: 0.4; text-transform: uppercase; }
                .dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
                .date-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; border-radius: 14px; transition: 0.2s; position: relative; cursor: pointer; }
                .date-num { z-index: 2; }
            `}</style>
        </div>
    );
};

export default CoachScheduleReview;
