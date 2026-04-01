import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    Loader2, 
    Calendar, 
    MapPin, 
    ChevronRight, 
    Zap, 
    Award, 
    Star, 
    Wrench, 
    Cpu, 
    ChevronLeft,
    Clock,
    User,
    Search,
    Filter,
    X,
    QrCode
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import manualImg from '../assets/manual.png';
import EventModal from './EventModal';
import MembershipSelection from './MembershipSelection';

const ActivitiesPage = ({ user }) => {
    // UI State
    const [activeView, setActiveView] = useState('activities'); // 'activities' or 'courses'
    const [isLoading, setIsLoading] = useState(true);
    const [userLevel, setUserLevel] = useState(1);
    const [activeTab, setActiveTab] = useState('全部'); 
    
    // User Profile
    const [userProfile, setUserProfile] = useState({ black_tokens: 0, white_tokens: 0, total_xp: 0 });
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // Courses State
    const [courses, setCourses] = useState([]);
    
    const getLocalYYYYMMDD = (d = new Date()) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const [selectedFullDate, setSelectedFullDate] = useState(getLocalYYYYMMDD());
    const [showCourseDetail, setShowCourseDetail] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCoach, setFilterCoach] = useState('全部');
    const [filterType, setFilterType] = useState('全部');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [configCoaches, setConfigCoaches] = useState(['全部']);
    const [configTypes, setConfigTypes] = useState(['全部', '大地課程', '多元課程']);
    
    // Branch / Studio State
    const [studios, setStudios] = useState([{ id: 'MU', name: '沐光瑜珈健身空間', en: 'MU LIGHT STUDIO' }]);
    const [selectedStudio, setSelectedStudio] = useState('沐光瑜珈健身空間');
    
    // Terms and booking states
    const [hasAgreed, setHasAgreed] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingsData, setBookingsData] = useState([]);
    
    // Membership / ECPay
    const [showMembership, setShowMembership] = useState(false);
    
    // QR Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const generateWeekDates = (baseDate = new Date()) => {
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const dates = [];
        for (let i = -1; i < 6; i++) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + i);
            dates.push({ label: days[d.getDay()], date: String(d.getDate()).padStart(2, '0'), fullDate: getLocalYYYYMMDD(d) });
        }
        return dates;
    };

    const [weekDates, setWeekDates] = useState(generateWeekDates());

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            const { data: coursesData } = await supabase.from('student_courses').select('*').order('course_date', { ascending: true });
            
            // Fetch multiple sources in parallel
            const [profileRes, eventsRes, bookingsRes, configRes] = await Promise.all([
                fetchUserProfile(),
                fetchEvents(),
                supabase.from('student_bookings').select('*'),
                supabase.from('student_course_config').select('*').eq('id', 1).maybeSingle()
            ]);

            if (coursesData) setCourses(coursesData);
            if (bookingsRes.data) setBookingsData(bookingsRes.data);

            // Handle Studio / Branch Sync (Enhanced Detection)
            const configBranches = (configRes.data && configRes.data.branches) || ['沐光瑜珈健身空間'];
            
            // Fallback: Detect branches from existing courses data
            const courseBranches = [];
            (coursesData || []).forEach(c => {
                if (c.branch && !courseBranches.includes(c.branch)) courseBranches.push(c.branch);
                // Also detect from (Prefix) in location
                if (c.location && c.location.startsWith('(')) {
                    const match = c.location.match(/^\((.*?)\)/);
                    if (match && match[1]) {
                        const bShort = match[1];
                        const fullMatch = bShort === '晴天' ? '晴天瑜珈健身俱樂部' : (bShort === '沐光' ? '沐光瑜珈健身空間' : null);
                        if (fullMatch && !courseBranches.includes(fullMatch)) courseBranches.push(fullMatch);
                    }
                }
            });

            const mergedBranches = [...new Set([...configBranches, ...courseBranches])];
            const detectedStudios = mergedBranches.map(bName => ({
                id: bName.includes('沐光') ? 'MU' : (bName.includes('晴天') ? 'SUNNY' : 'OTHER'),
                name: bName,
                en: bName.includes('沐光') ? 'MU LIGHT STUDIO' : (bName.includes('晴天') ? 'SUNNY YOGA CLUB' : 'BRANCH')
            }));

            setStudios(detectedStudios);
            if (detectedStudios.length > 0 && !selectedStudio) {
                setSelectedStudio(detectedStudios[0].name);
            }

            if (configRes.data) {
                // ... Handle Filter Config (Coaches & Types)
                const masterTeachers = configRes.data.teachers || [];
                const courseTeachers = (coursesData || []).map(c => c.teacher_name).filter(Boolean);
                const allTeachers = [...new Set(['全部', ...masterTeachers, ...courseTeachers])].sort((a,b) => a === '全部' ? -1 : a.localeCompare(b, 'zh-Hant'));
                setConfigCoaches(allTeachers);
                
                const masterTypes = configRes.data.types || [];
                const allTypes = [...new Set(['全部', ...masterTypes])];
                setConfigTypes(allTypes);
            }
        } catch (err) { console.error('Data sync failed:', err); }
        finally { setIsLoading(false); }
    };

    const fetchUserProfile = async () => {
        try {
            const searchEmail = user?.email?.trim().toLowerCase();
            if (!searchEmail) return;

            const { data: profile, error: pError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', searchEmail)
                .maybeSingle();

            if (pError) throw pError;

            if (profile) {
                // --- Monthly Membership Point Sync Logic ---
                if (profile.membership_name && profile.membership_end_at) {
                    const now = new Date();
                    const endDate = new Date(profile.membership_end_at);
                    
                    if (now < endDate) {
                        const lastGrant = profile.last_point_grant_date ? new Date(profile.last_point_grant_date) : null;
                        
                        // Check if it's time for a new grant (new month or first grant)
                        const isNewMonth = !lastGrant || 
                            (now.getFullYear() > lastGrant.getFullYear()) || 
                            (now.getMonth() > lastGrant.getMonth());

                        if (isNewMonth) {
                            // Points to grant per plan (from MembershipSelection)
                            const planRules = {
                                '年度精英專案': { black: 8, white: 12 },
                                '雙載巔峰專案': { black: 10, white: 15 },
                                '初衷隨享方案': { black: 0, white: 4 },
                                '習慣養成方案': { black: 0, white: 8 },
                                '恆常習慣方案': { black: 0, white: 8 },
                                '自在流動方案': { black: 0, white: 999 }, // Unlimited
                                '深度沉浸方案': { black: 0, white: 999 }  // Unlimited
                            };

                            const rule = planRules[profile.membership_name] || { black: 0, white: 0 };
                            
                            if (rule.black > 0 || rule.white > 0) {
                                const newBlack = (profile.black_tokens || 0) + rule.black;
                                const newWhite = (profile.white_tokens || 0) + rule.white;
                                
                                // Update locally first for immediate UI feedback
                                profile.black_tokens = newBlack;
                                profile.white_tokens = newWhite;
                                profile.last_point_grant_date = now.toISOString();

                                // Update Supabase
                                await supabase
                                    .from('user_profiles')
                                    .update({ 
                                        black_tokens: newBlack, 
                                        white_tokens: newWhite,
                                        last_point_grant_date: now.toISOString()
                                    })
                                    .eq('email', searchEmail);
                                    
                                console.log(`Monthly Reward! Granted ${rule.black}B / ${rule.white}W for ${profile.membership_name}`);
                            }
                        }
                    }
                }

                setUserProfile({
                    ...profile,
                    membership_name: profile.membership_name || null,
                    membership_end_at: profile.membership_end_at || null,
                    months: profile.months || 0,
                    points_details: profile.points_details || ''
                });

                // --- XP / Level Logic ---
                const { data: levelsData, error: lError } = await supabase
                    .from('student_levels')
                    .select('*')
                    .order('level', { ascending: true });

                if (!lError && levelsData && levelsData.length > 0) {
                    const currentXP = profile.total_xp || 0;
                    const lv = levelsData.filter(l => currentXP >= l.min_xp).pop() || levelsData[0];
                    setUserLevel(lv?.level || 1);
                }
            }
        } catch (err) {
            console.error('Fetch user profile failed:', err.message);
        }
    };

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (data) setEvents(data);
    };

    const getEnrollCount = (c) => {
        return bookingsData.filter(b => (b.course_id === c.id) || (b.course_date === c.course_date && b.period === c.period && b.course_name === c.course_name)).length;
    };

    const handleBookCourse = async (course) => {
        try {
            if (!user) return alert('請先登入後再進行預約');
            if (!hasAgreed) return alert('請先閱讀並勾選同意課程條款');
            
            // Time Window Logic
            const now = new Date();
            const startTimeStr = course.period.split('~')[0].trim();
            const courseDateTime = new Date(`${course.course_date.replace(/\//g, '-')}T${startTimeStr}:00`);
            
            const openTime = new Date(courseDateTime);
            openTime.setDate(openTime.getDate() - 7);
            openTime.setHours(0, 0, 0, 0); // 7 days before, 00:00
            
            const closeTime = new Date(courseDateTime.getTime() - 30 * 60000); // 30 mins before
            
            if (now < openTime) return alert(`預約尚未開放！\n開放時間：${openTime.toLocaleString()}`);
            if (now > closeTime) return alert('預約已截止！課程即將開始或已結束。');

            // Token Check
            const pType = course.points_type || (course.type === '多元課程' ? '黑' : '白');
            const pAmount = course.points_amount || 1;
            const balance = pType === '黑' ? userProfile.black_tokens : userProfile.white_tokens;
            
            if (balance < pAmount) return alert(`點數不足！\n您剩餘 ${balance} 枚${pType}點，此課程需 ${pAmount} 枚。`);

            setIsBooking(true);
            const count = getEnrollCount(course);
            if (count >= course.capacity) return alert('預約失敗：該時段人數已滿！');
            
            const isAlreadyBooked = bookingsData.find(b => (b.email?.toLowerCase() === user.email?.toLowerCase() || b.user_id === user.id) && ((b.course_id === course.id) || (b.course_name === course.course_name && b.course_date === course.course_date && b.period === course.period)));
            if (isAlreadyBooked) return alert('您已經預約過這堂課程囉！');
            
            if (!confirm(`確定要消耗 ${pAmount} 枚${pType}點預約這堂課嗎？`)) return;

            // 1. Deduct Token
            const tokenField = pType === '黑' ? 'black_tokens' : 'white_tokens';
            const { error: updError } = await supabase.from('user_profiles').update({ [tokenField]: balance - pAmount }).eq('email', user.email.toLowerCase());
            if (updError) throw new Error('點數扣除失敗，請重新嘗試');

            // 2. Create Booking
            const newBooking = { 
                user_id: user.id, 
                course_id: (course.id && course.id.length > 30) ? course.id : null, 
                course_name: course.course_name, 
                course_date: course.course_date, 
                period: course.period, 
                student_name: user?.user_metadata?.full_name || user?.email?.split('@')[0], 
                email: user?.email, 
                phone: user?.user_metadata?.phone || '未提供', 
                status: '已完成' 
            };
            const { error: dbError } = await supabase.from('student_bookings').insert(newBooking);
            if (dbError) throw dbError;
            
            alert('🎉 預約成功！消耗點數已自動扣除。');
            fetchAllData();
            setShowCourseDetail(false);
            setHasAgreed(false); 
        } catch (err) { alert(`預約失敗：${err.message}`); }
        finally { setIsBooking(false); }
    };

    const handleCancelBooking = async (course) => {
        try {
            const booking = bookingsData.find(b => (b.email?.toLowerCase() === user.email?.toLowerCase() || b.user_id === user.id) && (b.course_name === course.course_name && b.course_date === course.course_date && b.period === course.period));
            if (!booking) return;

            const now = new Date();
            const startTimeStr = course.period.split('~')[0].trim();
            const courseDateTime = new Date(`${course.course_date.replace(/\//g, '-')}T${startTimeStr}:00`);
            const refundDeadline = new Date(courseDateTime.getTime() - 2 * 3600000); // 2 hours before

            const pType = course.points_type || (course.type === '多元課程' ? '黑' : '白');
            const pAmount = course.points_amount || 1;

            if (now >= refundDeadline) {
                return alert('⚠️ 無法取消預約！\n依據規定，課程開始前 2 小時內不可取消，點數將不予退還。');
            }

            if (!confirm(`確定要取消預約嗎？\n系統將會歸還 ${pAmount} 枚${pType}點。`)) return;

            setIsBooking(true);
            // 1. Refund Token
            const tokenField = pType === '黑' ? 'black_tokens' : 'white_tokens';
            const currentToken = pType === '黑' ? userProfile.black_tokens : userProfile.white_tokens;
            await supabase.from('user_profiles').update({ [tokenField]: currentToken + pAmount }).eq('email', user.email.toLowerCase());

            // 2. Delete Booking
            await supabase.from('student_bookings').delete().eq('id', booking.id);
            
            alert('✅ 預約已取消，點數已原路歸還。');
            fetchAllData();
            setShowCourseDetail(false);
        } catch (err) { alert(`取消報名失敗：${err.message}`); }
        finally { setIsBooking(false); }
    };

    const handleAttendanceScan = async (courseId) => {
        try {
            if (!user) return alert('請先登入');
            
            // 1. Find the booking for this user and this course
            const { data: bookings, error: fError } = await supabase
                .from('student_bookings')
                .select('*')
                .eq('email', user.email.toLowerCase())
                .eq('course_id', courseId)
                .maybeSingle();

            if (fError) throw fError;
            
            if (!bookings) {
                // Try searching with the legacy fields if ID fails
                return alert('⚠️ 簽到失敗：找不到您的預約紀錄。\n請確認您是否有預約此堂課程。');
            }

            if (bookings.status === '已點名' || bookings.status === '已到') {
                return alert('您已經完成此課程的點名囉！');
            }

            // 2. Update status
            const { error: uError } = await supabase
                .from('student_bookings')
                .update({ status: '已點名' })
                .eq('id', bookings.id);

            if (uError) throw uError;

            // 3. Award XP
            const currentXP = userProfile.total_xp || 0;
            await supabase.from('user_profiles').update({ total_xp: currentXP + 10 }).eq('email', user.email.toLowerCase());
            
            alert('🎉 簽到成功！祝您上課愉快。\n已獲得 10 經驗值。');
            setShowScanner(false);
            fetchAllData();
        } catch (err) {
            console.error('Attendance Scan Failed:', err);
            alert(`簽到出錯：${err.message}`);
        }
    };

    const filteredEvents = events.filter(e => e.category !== '課程' && (activeTab === '全部' || e.category === activeTab));

    const displayCourses = courses.filter(c => {
        const matchesDate = c.course_date === selectedFullDate;
        
        // Safety checks for text search to prevent black screen (null property access)
        const name = c.course_name || '';
        const teacher = c.teacher_name || '';
        const query = searchQuery?.toLowerCase() || '';

        const matchesQuery = !searchQuery || 
                           name.toLowerCase().includes(query) || 
                           teacher.toLowerCase().includes(query);
                           
        const matchesCoach = filterCoach === '全部' || c.teacher_name === filterCoach;
        const matchesType = filterType === '全部' || c.type === filterType;
        
        // Studio filter (Strict Isolation)
        let matchesStudio = true;
        if (selectedStudio) {
            const studioShort = selectedStudio.substring(0, 2); // '沐光' or '晴天'
            const branchMatch = c.branch === selectedStudio;
            
            // Check for prefix in location, e.g., "(晴天)MU A"
            const locationStr = c.location || '';
            const hasPrefix = locationStr.startsWith('(');
            let prefixMatch = false;
            
            if (hasPrefix) {
                const match = locationStr.match(/^\((.*?)\)/);
                if (match && match[1]) {
                    prefixMatch = match[1] === studioShort;
                }
                // If it HAS a prefix, it MUST match the prefix to be shown
                matchesStudio = prefixMatch;
            } else {
                // If NO prefix, fall back to branch match or loose location match
                matchesStudio = branchMatch || locationStr.includes(studioShort);
            }
        }
        
        return matchesDate && matchesQuery && matchesCoach && matchesType && matchesStudio;
    });

    const renderActivities = () => {
        const featuredEvent = filteredEvents[0];
        const otherEvents = filteredEvents.slice(1);

        return (
            <div className="activities-view-container animate-fade-in">
                <div className="activities-tiled-bg"></div>
                <div className="activities-vignette"></div>
                
                <div className="page-scroll-content">
                    <header className="page-header">
                        <h1 className="brand-title">JENZiQ <span className="highlight">活動</span></h1>
                        <p className="subtitle">探索最新健身活動與課程</p>
                    </header>
                    
                    <div className="filter-tabs">
                        {['全部', '健身', '競賽', '課程', '優惠'].map(cat => (
                            <button key={cat} className={`tab ${activeTab === cat ? 'active' : ''}`} onClick={() => setActiveTab(cat)}>{cat}</button>
                        ))}
                    </div>

                    {isLoading ? <div className="loader-box"><Loader2 className="spin" /> 探索中...</div> : 
                     filteredEvents.length === 0 ? <div className="empty-box">目前暫無活動</div> :
                     (
                        <>
                            {featuredEvent && (
                                <div className="featured-hero-card" onClick={() => setSelectedEvent(featuredEvent)}>
                                    <div className="f-img-wrapper">
                                        <img src={featuredEvent.image_url || manualImg} alt={featuredEvent.title} />
                                        <div className="f-overlay-top">
                                            <span className="badge-select"><Zap size={10} fill="white" /> 精選活動</span>
                                            <span className="badge-rush">搶購</span>
                                        </div>
                                        <div className="f-overlay-bottom">
                                            <h2 className="f-title">{featuredEvent.title}</h2>
                                            <div className="f-meta">JENZiQ | {featuredEvent.category} | {new Date(featuredEvent.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="activities-list-stack">
                                {otherEvents.map((event, idx) => {
                                    // Simulated dynamic badges based on index for the looks
                                    const badgeType = idx % 3 === 0 ? { text: '名師', class: 'blue' } : (idx % 3 === 1 ? { text: '限額', class: 'red' } : { text: '推薦', class: 'green' });
                                    
                                    return (
                                        <div key={event.id} className="activity-list-item-fixed" onClick={() => setSelectedEvent(event)}>
                                            <div className="li-img-box"><img src={event.image_url || manualImg} alt={event.title} /></div>
                                            <div className="li-info-box">
                                                <div className="li-header-row">
                                                    <span className={`li-badge ${badgeType.class}`}>{badgeType.text}</span>
                                                    <span className="li-cat">{event.category}</span>
                                                </div>
                                                <h3 className="li-title">{event.title}</h3>
                                                <p className="li-desc">{event.description?.substring(0, 20) || '立即探索課程內容，開啟您的健身之旅'}...</p>
                                                <div className="li-footer-row">
                                                    <div className="li-date"><Calendar size={12}/> {new Date(event.created_at).toLocaleDateString()}</div>
                                                    <div className="li-more">了解詳情 <ChevronRight size={14}/></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                     )
                    }
                </div>
            </div>
        );
    };

    const renderCourses = () => (
        <div className="courses-view-container animate-fade-in">
            <div className="courses-tiled-bg"></div>
            
            {/* NEW Premium Header with dynamic studio info */}
            <header className="course-header-modern">
                <div className="studio-brand-box">
                    <div className="studio-avatar">
                        {selectedStudio?.includes('沐光') ? 
                            <img src="/images/mu_logo_light.png" alt="MU" /> : 
                            <div className="sunny-placeholder">S</div>
                        }
                    </div>
                    <div className="studio-meta">
                        {userProfile.membership_name ? (
                            <div className="active-membership-status">
                                <button className="membership-name-glow" disabled>
                                    {userProfile.membership_name}
                                </button>
                                <div className="membership-mini-details">
                                    <span>{userProfile.points_details}</span>
                                    <span className="dot">・</span>
                                    <span>持續 {userProfile.months} 個月</span>
                                    <span className="dot">・</span>
                                    <span className="end-date">{userProfile.membership_end_at} 結束</span>
                                </div>
                            </div>
                        ) : (
                            <button className="buy-membership-btn" onClick={() => setShowMembership(true)}>
                                購買會籍 <ChevronRight size={12}/>
                            </button>
                        )}
                        <span className="studio-label">當前顯示據點</span>
                        <h2 className="studio-name-v2">{selectedStudio || '選擇據點'}</h2>
                    </div>
                </div>
                <div className="header-badges">
                    <div className="token-status-pill">
                        <div className="t-item"><span className="t-label">多元</span><div className="t-icon-box black">J</div><span>{userProfile.black_tokens}</span></div>
                        <div className="t-item"><span className="t-label">大地</span><div className="t-icon-box white">J</div><span>{userProfile.white_tokens}</span></div>
                    </div>
                    <button className="qr-scan-entry-btn" onClick={() => setShowScanner(true)}>
                        <QrCode size={20} />
                        <span>掃描簽到</span>
                    </button>
                </div>
            </header>

            {/* Premium Studio Switcher (Horizontal Cards) */}
            <div className="branch-selector-wrapper">
                <div className="branch-list-scroller">
                    {studios.map(s => (
                        <button key={s.name} className={`branch-card ${selectedStudio === s.name ? 'active' : ''}`} onClick={() => setSelectedStudio(s.name)}>
                            <span className="b-en">{s.en?.split(' ')[0]}</span>
                            <span className="b-name">{s.name.substring(0, 4)}</span>
                            {selectedStudio === s.name && <div className="b-active-glow" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="course-filter-bar">
                <div className="search-pill">
                    <Search size={18} className="search-icon-l" />
                    <input type="text" className="search-input-field" placeholder="搜尋 教練、課程、地點..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button className={`filter-icon-btn ${(filterCoach !== '全部' || filterType !== '全部') ? 'active-badge' : ''}`} onClick={() => setShowFilterModal(true)}><Filter size={18} /></button>
                </div>
            </div>
            <div className="calendar-section-container">
                <div className="calendar-section">
                    <div className="cal-header"><div className="cal-title-box"><div className="cal-today-indicator">TODAY</div><div className="cal-title">{selectedFullDate}</div></div><button className="today-reset-btn" onClick={() => { setSelectedFullDate(getLocalYYYYMMDD()); setWeekDates(generateWeekDates()); }}>回到今天</button></div>
                    <div className="week-selector">
                        {weekDates.map((w, idx) => (
                            <div key={idx} className={`week-day ${selectedFullDate === w.fullDate ? 'active' : ''}`} onClick={() => setSelectedFullDate(w.fullDate)}>
                                <span className="label" style={{ color: w.label === '日' ? '#ef4444' : (w.label === '六' ? '#3b82f6' : 'inherit') }}>{w.label}</span>
                                <span className="date">{w.date}</span>
                                {selectedFullDate === w.fullDate && <div className="active-dot"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="course-list">
                <div className="list-status-header"><span>共有 {displayCourses.length} 堂精選課程</span></div>
                {isLoading ? <div className="loader-box"><Loader2 className="spin" /> 載入課程中...</div> : 
                 displayCourses.length === 0 ? <div className="empty-box-large"><Calendar size={48} /><p>今日尚無課程排程</p><span>您可以切換日期查看其他課程</span></div> :
                 displayCourses.map((c, idx) => (
                    <div key={c.id || idx} className={`course-card-premium ${c.type === '大地課程' ? 'earth-theme' : 'diverse-theme'}`} onClick={() => { setSelectedCourse(c); setShowCourseDetail(true); }}>
                        <div className={`course-accent ${c.type === '大地課程' ? 'earth' : 'diverse'}`}></div>
                        <div className="card-top">
                            <div className="c-info-main"><span className="c-type">{c.type}</span><h3 className="course-title">{c.course_name}</h3><div className="c-meta-row"><div className="meta-item"><Clock size={12}/> {c.period}</div><div className="meta-item"><User size={12}/> {c.teacher_name} 老師</div></div></div>
                            <div className="c-enroll-status"><div className="enroll-percent">{Math.round((getEnrollCount(c) / (c.capacity || 1)) * 100)}%</div><div className="enroll-label">已滿</div></div>
                        </div>
                        <div className="card-footer-premium"><div className="c-location"><MapPin size={12} /> {c.location || '沐光瑜珈教室'}</div><div className="c-spots">{getEnrollCount(c)} / {c.capacity} 席</div></div>
                    </div>
                 ))
                }
            </div>
        </div>
    );

    return (
        <div className="activities-wrapper">
            <div className="view-switcher-container">
                <div className="view-switch">
                    <div className={`switch-indicator ${activeView}`} />
                    <button className={`switch-btn ${activeView === 'activities' ? 'active' : ''}`} onClick={() => setActiveView('activities')}>活動</button>
                    <button className={`switch-btn ${activeView === 'courses' ? 'active' : ''}`} onClick={() => setActiveView('courses')}>課程</button>
                </div>
            </div>

            {activeView === 'activities' ? renderActivities() : renderCourses()}

            <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} currentUserLevel={userLevel} />

            {showMembership && (
                <MembershipSelection 
                    user={user} 
                    onBack={() => setShowMembership(false)} 
                />
            )}

            {showCourseDetail && selectedCourse && (
                <div className="course-overlay-page animate-fade-in">
                    <div className="overlay-header">
                        <button className="back-btn" onClick={() => setShowCourseDetail(false)}><ChevronLeft size={24}/></button>
                        <h2>課程詳情頁面</h2>
                        <div style={{width: 24}}></div>
                    </div>
                    <div className="overlay-content">
                        <div className="detail-hero">
                             <div className="type-badge">{selectedCourse.type}</div>
                             <h1>{selectedCourse.course_name}</h1>
                             <p className="subtitle">{selectedCourse.teacher_name} 老師 ・ {selectedCourse.location || '沐光教室'}</p>
                        </div>
                        <div className="detail-section">
                            <h4 className="section-label">COURSE DESCRIPTION / 課程簡介</h4>
                            <div className="desc-box">{selectedCourse.description || '教練尚未提供詳細介紹。歡迎在課堂中直接向教練詢問更多細節！'}</div>
                        </div>
                        <div className="info-cards">
                            <div className="i-card"><Calendar size={20} className="icon-orange" /><div className="i-info"><label>上課日期</label><span>{selectedCourse.course_date}</span></div></div>
                            <div className="i-card"><Clock size={20} className="icon-orange" /><div className="i-info"><label>上課時段</label><span>{selectedCourse.period}</span></div></div>
                            <div className="i-card"><Award size={20} className="icon-orange" /><div className="i-info"><label>課程期別</label><span>{selectedCourse.course_phase || '未設定'}</span></div></div>
                            <div className="i-card"><MapPin size={20} className="icon-orange" /><div className="i-info"><label>上課地點</label><span>{selectedCourse.location || '沐光瑜珈教室'}</span></div></div>
                            <div className="i-card"><Star size={20} className="icon-orange" /><div className="i-info"><label>所需點數</label><span>{selectedCourse.points_amount} {selectedCourse.points_type}點</span></div></div>
                            <div className="i-card"><User size={20} className="icon-orange" /><div className="i-info"><label>剩餘名額</label><span>{Math.max(0, (selectedCourse.capacity || 0) - getEnrollCount(selectedCourse))} 席</span></div></div>
                        </div>
                        <div className="bottom-action-bar">
                             <div className="terms-agreement"><input type="checkbox" id="agree-terms" checked={hasAgreed} onChange={(e) => setHasAgreed(e.target.checked)} /><label htmlFor="agree-terms">我已詳閱 <span className="terms-link" onClick={() => setShowTermsModal(true)}>(課程條款)</span></label></div>
                             <div className="booking-row">
                                <div className="booking-info">
                                    <span className="l">{bookingsData.some(b => (b.email?.toLowerCase() === user?.email?.toLowerCase() || b.user_id === user?.id) && (b.course_id === selectedCourse.id || (b.course_name === selectedCourse.course_name && b.course_date === selectedCourse.course_date && b.period === selectedCourse.period))) ? '當前預約狀態' : '已預約人數'}</span>
                                    <span className="v">{bookingsData.some(b => (b.email?.toLowerCase() === user?.email?.toLowerCase() || b.user_id === user?.id) && (b.course_id === selectedCourse.id || (b.course_name === selectedCourse.course_name && b.course_date === selectedCourse.course_date && b.period === selectedCourse.period))) ? '預約成功' : `${getEnrollCount(selectedCourse)} / ${selectedCourse.capacity} 人`}</span>
                                 </div>
                                 {(() => {
                                     const count = getEnrollCount(selectedCourse);
                                     const isFull = count >= selectedCourse.capacity;
                                     const userHasBooked = bookingsData.some(b => (b.email?.toLowerCase() === user?.email?.toLowerCase() || b.user_id === user?.id) && (b.course_id === selectedCourse.id || (b.course_name === selectedCourse.course_name && b.course_date === selectedCourse.course_date && b.period === selectedCourse.period)));
                                     
                                     if (userHasBooked) {
                                         return (
                                            <button className="book-btn cancel" onClick={() => handleCancelBooking(selectedCourse)} disabled={isBooking}>
                                                {isBooking ? '取消中...' : '取消課程預約'}
                                            </button>
                                         );
                                     }
                                     return (
                                         <button className={`book-btn ${isBooking || isFull || !hasAgreed ? 'disabled' : ''}`} onClick={() => handleBookCourse(selectedCourse)} disabled={isBooking || isFull || !hasAgreed}>
                                             {isBooking ? '預約處理中...' : isFull ? '本時段人數已滿' : `立即預約 (消耗 1 枚${selectedCourse.points_type}點)`}
                                         </button>
                                     );
                                 })()}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {showTermsModal && (
                <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
                    <div className="terms-content-box animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="terms-header"><h3>課程預約服務條款</h3></div>
                        <div className="terms-body">
                            <div className="terms-text-content">
                                <p>1. 課程預約開放時間為，<br />上課前 7 天 的 24點0分 開放預約，最晚上課前 30 分鐘可以進行預約。</p>
                                <p>2. 每堂課需使用1個點數。<br />報到系統於上課前 10 分鐘自動點名，請務必準時到達。</p>
                                <p>3. 若須取消預約，<br />請在上課前 2 小時取消完成，系統將會歸還點數。</p>
                                <p>4. 上課前 2 小時內不可取消預約，且點數將不予退還。</p>
                                <p>5. 預約當月未取消點名3次會鎖卡，需要到櫃檯付300元開卡。</p>
                                <p>6. 本場館對於臨時取消與惡意棄課行為有嚴格規範。請提前安排，避免影響課程安排及其他學員。<br />如有特殊情況，請在可接受時間內辦理取消。</p>
                                <p>7. 請避免中途離場或中途進入教室，這將影響課程的流暢性及其他學員的體驗。如有特殊需求，請提前與我們聯繫以獲取必要的協助。<br />另外，開課前5分鐘內進場可接受，超過5分鐘將不得進場。</p>
                                <p>8. 請穿著運動服或休閒服，建議使用緊身褲或寬鬆短褲。為確保舒適與衛生，請自備水壺和毛巾。</p>
                            </div>
                            <div className="terms-end-guard">—— 閱讀完畢 ——</div>
                        </div>
                        <div className="terms-footer"><button className="confirm-terms-btn" onClick={() => { setHasAgreed(true); setShowTermsModal(false); }}>同意並關閉彈窗</button></div>
                    </div>
                </div>
            )}

            {showFilterModal && (
                <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
                    <div className="filter-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-top">
                            <h3>進階篩選條件</h3>
                            <button className="close-btn" onClick={() => setShowFilterModal(false)}><X size={24}/></button>
                        </div>
                        
                        <div className="filter-group">
                            <label>依照課程類別篩選</label>
                            <div className="category-select-grid">
                                <button className={`cat-opt-btn ${filterType === '全部' ? 'active' : ''}`} onClick={() => setFilterType('全部')}>
                                    <span>全部課程</span>
                                </button>
                                <button className={`cat-opt-btn ${filterType === '大地課程' ? 'active' : ''}`} onClick={() => setFilterType('大地課程')}>
                                    <span>大地課程</span>
                                </button>
                                <button className={`cat-opt-btn ${filterType === '多元課程' ? 'active' : ''}`} onClick={() => setFilterType('多元課程')}>
                                    <span>多元課程</span>
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions-fixed">
                            <button className="reset-btn-v2" onClick={() => { setFilterType('全部'); setFilterCoach('全部'); setSearchQuery(''); }}>清空全部條件</button>
                            <button className="apply-btn-v2" onClick={() => setShowFilterModal(false)}>套用篩選</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showScanner && (
                <ScannerModal 
                    onClose={() => setShowScanner(false)} 
                    onResult={(text) => {
                        try {
                            const data = JSON.parse(text);
                            if (data.type === 'attendance' && data.courseId) {
                                handleAttendanceScan(data.courseId);
                            } else {
                                alert('這不是有效的點名 QR 碼');
                            }
                        } catch (e) {
                            alert('無法解析二維碼內容');
                        }
                    }} 
                />
            )}

            <style>{`
                .activities-wrapper { position: relative; height: 100%; overflow: hidden; background-color: #000; display: flex; flex-direction: column; }
                .view-switcher-container { padding: 16px 20px; background: #000; display: flex; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.03); z-index: 100; }
                .view-switch { display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 50px; width: 100%; max-width: 180px; position: relative; border: 1px solid rgba(255,255,255,0.05); }
                .switch-btn { flex: 1; border: none; background: none; color: rgba(255,255,255,0.3); font-size: 13px; font-weight: 800; padding: 8px 0; border-radius: 40px; cursor: pointer; z-index: 2; transition: 0.3s; }
                .switch-btn.active { color: white; }
                .switch-indicator { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); background: linear-gradient(135deg, #FF6B00 0%, #FF9E00 100%); border-radius: 40px; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1; }
                .switch-indicator.courses { transform: translateX(100%); }

                .activities-view-container { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; background: #121212; }
                .activities-tiled-bg { position: absolute; inset: -400px; background-image: url('/images/cards-bg-v2.png'); background-size: 1000px auto; opacity: 0.35; transform: rotate(18deg); z-index: 1; pointer-events: none; }
                .activities-vignette { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.7) 100%); z-index: 2; pointer-events: none; }
                
                .page-scroll-content { position: relative; z-index: 10; flex: 1; overflow-y: auto; padding: 32px 20px 120px; scrollbar-width: none; }
                .brand-title { font-size: 26px; font-weight: 900; color: white; margin-bottom: 4px; }
                .highlight { color: #FF7A00; }
                .subtitle { font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 600; margin-bottom: 24px; }

                .filter-tabs { display: flex; gap: 10px; margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; }
                .tab { background: rgba(255,255,255,0.1); border: none; padding: 10px 22px; border-radius: 12px; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .tab.active { background: #FF7A00; color: white; }

                .featured-hero-card { width: 100%; border-radius: 30px; overflow: hidden; margin-bottom: 24px; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); transition: 0.3s; }
                .f-img-wrapper { height: 240px; position: relative; background: #000; }
                .f-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
                .f-overlay-top { position: absolute; top: 16px; left: 16px; right: 16px; display: flex; justify-content: space-between; }
                .badge-select { background: #FF7A00; color: white; font-size: 10px; font-weight: 900; padding: 5px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
                .badge-rush { background: #ef4444; color: white; font-size: 10px; font-weight: 900; padding: 5px 10px; border-radius: 6px; }
                .f-overlay-bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 20px; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%); }
                .f-title { font-size: 24px; font-weight: 900; color: white; line-height: 1.2; margin-bottom: 6px; }
                .f-meta { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; }

                .activities-list-stack { display: flex; flex-direction: column; gap: 16px; }
                .activity-list-item-fixed { background: rgba(26, 26, 28, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 14px; display: flex; gap: 16px; cursor: pointer; transition: 0.3s; }
                .li-img-box { width: 100px; height: 100px; border-radius: 18px; overflow: hidden; flex-shrink: 0; }
                .li-img-box img { width: 100%; height: 100%; object-fit: cover; }
                .li-info-box { flex: 1; display: flex; flex-direction: column; }
                .li-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
                .li-badge { font-size: 9px; font-weight: 900; color: white; padding: 3px 8px; border-radius: 6px; }
                .li-badge.blue { background: #3b82f6; }
                .li-badge.red { background: #ef4444; }
                .li-badge.green { background: #10b981; }
                .li-cat { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.3); }
                .li-title { font-size: 17px; font-weight: 900; color: white; margin-bottom: 4px; }
                .li-desc { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 600; margin-bottom: 12px; }
                .li-footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
                .li-date { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 600; }
                .li-more { color: #FF7A00; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 2px; }

                .courses-view-container { flex: 1; display: flex; flex-direction: column; background: #f1f5f9; color: #1e293b; overflow-y: auto; padding-bottom: 120px; position: relative; }
                .courses-tiled-bg { position: fixed; inset: -50%; background-image: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.03; transform: rotate(15deg); pointer-events: none; }
                
                /* Modern Multi-Studio Header */
                .course-header-modern { padding: 32px 20px 20px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 10; }
                .studio-brand-box { display: flex; align-items: center; gap: 16px; }
                .studio-avatar { width: 48px; height: 48px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.02); overflow: hidden; }
                .studio-avatar img { width: 32px; height: auto; }
                .sunny-placeholder { font-weight: 950; font-size: 20px; color: #FF7A00; }
                .studio-meta { display: flex; flex-direction: column; gap: 4px; }
                .studio-label { font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
                .studio-name-v2 { font-size: 19px; font-weight: 950; color: #1e293b; letter-spacing: -0.5px; }

                /* Active Membership Status */
                .active-membership-status { display: flex; flex-direction: column; gap: 6px; margin-bottom: 2px; }
                .membership-name-glow { 
                    background: #334155; color: #94A3B8; border: none; padding: 6px 14px; border-radius: 50px; 
                    font-size: 12px; font-weight: 950; width: fit-content; cursor: default;
                    box-shadow: 0 0 15px rgba(148, 163, 184, 0.2);
                    animation: pulse-glow 2s infinite ease-in-out;
                }
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 5px rgba(148, 163, 184, 0.1); }
                    50% { box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); transform: scale(1.02); }
                    100% { box-shadow: 0 0 5px rgba(148, 163, 184, 0.1); }
                }
                .membership-mini-details { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #64748b; font-weight: 800; white-space: nowrap; }
                .membership-mini-details .dot { opacity: 0.3; }
                .membership-mini-details .end-date { color: #FF7A00; }

                .buy-membership-btn { background: linear-gradient(135deg, #FF6B00 0%, #FF9E00 100%); color: white; border: none; padding: 4px 12px; border-radius: 50px; font-size: 10px; font-weight: 950; display: flex; align-items: center; gap: 4px; margin-bottom: 6px; width: fit-content; box-shadow: 0 4px 10px rgba(255,107,0,0.25); cursor: pointer; transition: 0.3s; }
                .buy-membership-btn:active { transform: scale(0.95); }
                .premium-badge-v2 { background: #1e293b; color: white; padding: 6px 12px; border-radius: 12px; display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 900; }

                .branch-selector-wrapper { padding: 0 20px 24px; position: relative; z-index: 10; }
                .branch-list-scroller { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; padding: 4px 0; }
                .branch-card { min-width: 110px; height: 110px; background: white; border-radius: 28px; border: 1px solid rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; cursor: pointer; transition: 0.4s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
                .branch-card .b-en { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .branch-card .b-name { font-size: 16px; font-weight: 950; color: #334155; }
                .branch-card.active { border-color: #FF7A00; background: #1e293b; transform: translateY(-4px); box-shadow: 0 15px 35px rgba(255,107,0,0.15); }
                .branch-card.active .b-en { color: rgba(255,255,255,0.4); }
                .branch-card.active .b-name { color: white; }
                .b-active-glow { position: absolute; bottom: 12px; width: 4px; height: 4px; background: #FF7A00; border-radius: 50%; box-shadow: 0 0 10px #FF7A00; }
                
                .calendar-section-container { padding: 0 20px 24px; position: relative; z-index: 2; }
                .calendar-section { background: white; border-radius: 28px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.02); }
                .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
                .cal-title-box { display: flex; flex-direction: column; }
                .cal-today-indicator { font-size: 9px; font-weight: 900; color: #FF7A00; letter-spacing: 2px; margin-bottom: 2px; }
                .cal-title { font-size: 16px; font-weight: 900; color: #334155; }
                .today-reset-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .week-selector { display: flex; justify-content: space-between; }
                .week-day { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 10px 0; min-width: 40px; transition: 0.3s; position: relative; }
                .week-day.active { background: #1e293b; border-radius: 16px; color: white; transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
                .week-day .label { font-size: 11px; color: #94a3b8; font-weight: 800; }
                .week-day.active .label { color: rgba(255,255,255,0.5); }
                .active-dot { width: 4px; height: 4px; background: #FF7A00; border-radius: 50%; position: absolute; bottom: 8px; }

                .course-filter-bar { padding: 0 20px 20px; position: relative; z-index: 10; }
                .search-pill { background: white; border-radius: 50px; padding: 6px 6px 6px 18px; display: flex; align-items: center; box-shadow: 0 12px 30px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.02); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .search-pill:focus-within { box-shadow: 0 15px 40px rgba(255,107,0,0.12); transform: translateY(-1px); border-color: rgba(255,107,0,0.2); }
                .search-icon-l { color: #94a3b8; flex-shrink: 0; }
                .search-input-field { flex: 1; border: none; background: none; padding: 12px; font-size: 14px; font-weight: 700; color: #1e293b; outline: none; }
                .search-input-field::placeholder { color: #cbd5e1; font-weight: 600; }
                
                .filter-icon-btn { background: #1e293b; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .filter-icon-btn:active { transform: scale(0.9); }
                .filter-icon-btn.active-badge { background: #FF7A00; box-shadow: 0 6px 20px rgba(255,122,0,0.3); }

                .course-list { padding: 0 20px; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 2; }
                .course-card-premium { background: white; border-radius: 24px; padding: 0; overflow: hidden; position: relative; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02); transition: 0.3s; }
                .course-card-premium:active { transform: scale(0.97); }
                
                .course-card-premium.diverse-theme { background: #000; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.3); }
                .token-status-pill { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
                .t-item { display: flex; align-items: center; gap: 8px; background: white; padding: 4px 10px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.02); min-width: 70px; justify-content: space-between; }
                .t-icon-box { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 950; flex-shrink: 0; box-shadow: inset 0 0 5px rgba(255,255,255,0.2); }
                .t-icon-box.black { background: #000; color: white; border: 1.5px solid #333; }
                .t-icon-box.white { background: #fff; color: #000; border: 1.5px solid #eee; }
                .t-item span { font-size: 13px; font-weight: 950; color: #1e293b; }
                .t-label { font-size: 10px; font-weight: 900; color: #94a3b8; margin-right: 2px; }
                .course-card-premium.diverse-theme .course-title { color: white; }
                .course-card-premium.diverse-theme .meta-item { color: rgba(255,255,255,0.5); }
                .course-card-premium.diverse-theme .card-footer-premium { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); }
                .course-card-premium.diverse-theme .c-location { color: rgba(255,255,255,0.4); }
                .course-card-premium.diverse-theme .c-enroll-status { border-left: 1px solid rgba(255,255,255,0.05); }
                .course-card-premium.diverse-theme .enroll-label { color: rgba(255,255,255,0.4); }
                .course-card-premium.diverse-theme .enroll-percent { color: white; }
                .course-card-premium.diverse-theme .c-spots { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.1); }
                
                /* Theme: Earth - Light */
                .course-card-premium.earth-theme { background: white; }
                
                .course-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; }
                .course-accent.earth { background: linear-gradient(to bottom, #FF6B00, #FF9E00); }
                .course-accent.diverse { background: linear-gradient(to bottom, #10b981, #34d399); }
                .card-top { display: flex; justify-content: space-between; padding: 24px 24px 16px; }
                .c-type { font-size: 10px; font-weight: 900; color: #FF7A00; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; }
                .course-title { font-size: 20px; font-weight: 950; color: #1e293b; margin-bottom: 12px; line-height: 1.2; }
                .c-meta-row { display: flex; gap: 16px; }
                .meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; font-weight: 700; }
                .c-enroll-status { width: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #f1f5f9; }
                .enroll-percent { font-size: 14px; font-weight: 900; color: #1e293b; }
                .enroll-label { font-size: 10px; font-weight: 700; color: #94a3b8; }
                .card-footer-premium { background: #f8fafc; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; }
                .c-location { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; font-weight: 700; }
                .c-spots { background: #1e293b; color: white; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 900; }

                .course-overlay-page { position: fixed; inset: 0; background: #0f172a; z-index: 5000; overflow-y: auto; color: white; }
                .overlay-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(15px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .overlay-header h2 { font-size: 18px; font-weight: 800; }
                .back-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                
                .detail-hero { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 24px; position: relative; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .type-badge { background: #FF7A00; color: white; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; margin-bottom: 16px; display: inline-block; }
                .detail-hero h1 { font-size: 34px; font-weight: 950; margin: 0 0 12px; letter-spacing: -1px; }
                .detail-hero .subtitle { font-size: 15px; color: rgba(255,255,255,0.5); font-weight: 600; margin: 0; }
                
                .detail-section { padding: 32px 24px 16px; }
                .section-label { font-size: 12px; font-weight: 900; color: #FF7A00; letter-spacing: 1px; margin-bottom: 16px; display: block; opacity: 0.8; }
                .desc-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.7); font-weight: 500; }
                
                .info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 24px; }
                .i-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 18px 14px; border-radius: 20px; display: flex; align-items: center; gap: 12px; }
                .icon-orange { color: #FF7A00; flex-shrink: 0; }
                .i-info label { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 800; display: block; text-transform: uppercase; margin-bottom: 2px; }
                .i-info span { font-size: 14px; font-weight: 800; color: white; }

                .bottom-action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); padding: 24px 24px 44px; border-top: 1px solid rgba(255,255,255,0.1); z-index: 150; }
                .terms-agreement { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 700; }
                .terms-agreement input { width: 20px; height: 20px; accent-color: #FF7A00; }
                .terms-link { color: #FF7A00; text-decoration: underline; cursor: pointer; }
                .booking-row { display: flex; align-items: center; gap: 20px; }
                .booking-info { display: flex; flex-direction: column; min-width: 100px; }
                .booking-info .l { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 700; }
                .booking-info .v { font-size: 16px; color: white; font-weight: 900; }
                .book-btn { flex: 1; background: linear-gradient(135deg, #FF6B00 0%, #FF9E00 100%); color: white; border: none; padding: 18px; border-radius: 18px; font-size: 16px; font-weight: 950; cursor: pointer; box-shadow: 0 8px 25px rgba(255,107,0,0.3); transition: 0.3s; }
                .book-btn:active { transform: scale(0.96); }
                .book-btn.disabled { background: #334155; color: #64748b; box-shadow: none; cursor: not-allowed; }

                .terms-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .terms-content-box { background: #1e293b; color: white; width: 100%; max-width: 500px; border-radius: 32px; overflow: hidden; display: flex; flex-direction: column; max-height: 85vh; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
                .terms-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; }
                .terms-header h3 { font-size: 20px; font-weight: 900; color: #FF7A00; }
                .terms-body { padding: 24px; overflow-y: auto; flex: 1; scrollbar-width: none; }
                .terms-text-content p { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.8); margin-bottom: 20px; font-weight: 500; }
                .terms-end-guard { text-align: center; padding: 20px 0; color: rgba(255,255,255,0.2); font-size: 12px; font-weight: 800; letter-spacing: 2px; }
                .terms-footer { padding: 20px 24px 32px; background: #1e293b; border-top: 1px solid rgba(255,255,255,0.05); }
                .confirm-terms-btn { width: 100%; background: #FF7A00; color: white; border: none; padding: 16px; border-radius: 16px; font-size: 16px; font-weight: 900; cursor: pointer; }

                .filter-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 9000; display: flex; align-items: flex-end; justify-content: center; }
                .filter-modal-content { background: white; width: 100%; max-width: 500px; border-radius: 32px 32px 0 0; padding: 24px 24px 44px; color: #1e293b; box-shadow: 0 -10px 40px rgba(0,0,0,0.2); }
                .modal-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
                .modal-top h3 { font-size: 18px; font-weight: 900; }
                .modal-top .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
                
                .filter-group { margin-bottom: 32px; }
                .filter-group label { display: block; font-size: 12px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; text-align: center; }
                
                .category-select-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .cat-opt-btn { background: #f8fafc; border: 2px solid transparent; padding: 24px 10px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; }
                .cat-opt-btn .icon { color: #94a3b8; transition: 0.3s; }
                .cat-opt-btn span { font-size: 13px; font-weight: 800; color: #64748b; }
                
                .cat-opt-btn.active { border-color: #FF7A00; background: #fff4ed; box-shadow: 0 10px 25px rgba(255,107,0,0.1); }
                .cat-opt-btn.active .icon { color: #FF7A00; transform: scale(1.2); }
                .cat-opt-btn.active span { color: #FF7A00; }
                
                .modal-actions-fixed { display: flex; gap: 12px; }
                .reset-btn-v2 { flex: 1; background: #f1f5f9; border: none; padding: 18px; border-radius: 20px; font-size: 14px; font-weight: 800; color: #94a3b8; cursor: pointer; }
                .apply-btn-v2 { flex: 2; background: #1e293b; color: white; border: none; padding: 18px; border-radius: 20px; font-size: 15px; font-weight: 950; cursor: pointer; box-shadow: 0 8px 20px rgba(30,41,59,0.2); }
                .apply-btn-v2:active { transform: scale(0.96); }

                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-fade-in { animation: fadeIn 0.4s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                 .apply-btn-v2 { flex: 1; background: #FF7A00; color: white; border: none; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 900; box-shadow: 0 4px 15px rgba(255,122,0,0.3); } 

                /* QR Scanner Button & Modal */
                .qr-scan-entry-btn { 
                    width: 100%; margin-top: 10px; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); 
                    padding: 8px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;
                    color: #1e293b; font-size: 13px; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .scanner-overlay { position: fixed; inset: 0; background: #000; z-index: 2000; display: flex; flex-direction: column; }
                .scanner-header { padding: 40px 20px 20px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); z-index: 10; }
                .scanner-header h3 { color: white; font-weight: 950; font-size: 20px; }
                .scanner-close { background: none; border: none; color: white; }
                .scanner-preview-box { flex: 1; position: relative; overflow: hidden; }
                #qr-reader { width: 100% !important; height: 100% !important; object-fit: cover !pointer-events: none; }
                .scanner-guide-overlay { position: absolute; inset: 0; border: 40px solid rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; pointer-events: none; }
                .target-frame { width: 250px; height: 250px; border: 2px solid #FF7A00; border-radius: 30px; box-shadow: 0 0 0 1000px rgba(0,0,0,0.5); }
                .scanner-footer { padding: 40px 20px; text-align: center; color: white; background: rgba(0,0,0,0.8); }
                .scanner-footer p { font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 10px; }
            `}</style>
        </div>
    );
};

const ScannerModal = ({ onClose, onResult }) => {
    React.useEffect(() => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start(
            { facingMode: "environment" }, 
            config,
            (decodedText) => {
                html5QrCode.stop().then(() => {
                    onResult(decodedText);
                });
            }
        ).catch(err => {
            console.error("Scanner error:", err);
            alert("掃描器啟動失敗，請確認是否提供相機權限。");
            onClose();
        });

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Scanner cleanup error:", err));
            }
        };
    }, []);

    return (
        <div className="scanner-overlay animate-fade-in">
            <div className="scanner-header">
                <h3>相機簽到掃描</h3>
                <button className="scanner-close" onClick={onClose}><X size={28}/></button>
            </div>
            <div className="scanner-preview-box">
                <div id="qr-reader"></div>
                <div className="scanner-guide-overlay">
                    <div className="target-frame"></div>
                </div>
            </div>
            <div className="scanner-footer">
                <div className="pulse-dot"></div>
                <p>將鏡頭對準管理員提供的課程 QR 碼</p>
            </div>
        </div>
    );
};

export default ActivitiesPage;
