import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Trash2, 
    Loader2, 
    MapPin, 
    User, 
    Users, 
    Type, 
    Hash,
    Layers,
    Clock,
    Check,
    FileText,
    Eye,
    Edit2,
    QrCode,
    Share2,
    Send
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';


const StudentCourseManager = () => {
    const [activeTab, setActiveTab] = useState('calendar'); 
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    
    // Branch / Studio Switcher for Manager View
    const [branches, setBranches] = useState(['沐光瑜珈健身空間', '晴天瑜珈健身俱樂部']);
    const [selectedBranch, setSelectedBranch] = useState('沐光瑜珈健身空間');
    
    // Day/Detail View state
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    // Coach Selection State
    const [coaches, setCoaches] = useState([]);
    const [showCoachSelector, setShowCoachSelector] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [teachers, setTeachers] = useState([
        'JENNY', 'HEBE', 'WINNIE', 'SURAJ', 'YUKI', 'GUA', 'JILL', 
        'BELLA', 'JOANN', '喵喵', 'NANA', 'MIKA', 'Lily', 'MOKA', 
        '多多', 'TOM', 'NABI'
    ]);
    const [courseTypes, setCourseTypes] = useState(['大地課程', '多元課程']);
    const [newTeacherName, setNewTeacherName] = useState('');
    const [newTypeName, setNewTypeName] = useState('');
    const [newBranchName, setNewBranchName] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialFormState = {
        course_name: '',
        description: '',
        type: '大地課程',
        teacher_name: 'JENNY',
        branch: '沐光瑜珈健身空間',
        capacity: 15,
        location: 'MU 沐光教室 A',
        course_date: new Date().toISOString().split('T')[0],
        course_phase: '',
        period: '11:00 ~ 11:50',
        points_type: '黑',
        points_amount: 1,
        repeat_weekly: false,
        infinite_repeat: true,
        repeat_weeks: 4
    };
    const [formData, setFormData] = useState(initialFormState);

    const pointTypes = ['黑', '白'];

    useEffect(() => {
        fetchConfig();
        fetchCourses();
    }, [currentMonth, selectedBranch]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('student_course_config')
                .select('*')
                .single();
            if (data) {
                if (data.teachers) setTeachers(data.teachers);
                if (data.types) setCourseTypes(data.types);
                if (data.branches) setBranches(data.branches);
            } else {
                const local = localStorage.getItem('student_course_config');
                if (local) {
                    const parsed = JSON.parse(local);
                    setTeachers(parsed.teachers);
                    setCourseTypes(parsed.types);
                    if (parsed.branches) setBranches(parsed.branches);
                }
            }
        } catch (err) {
            const local = localStorage.getItem('student_course_config');
            if (local) {
                const parsed = JSON.parse(local);
                setTeachers(parsed.teachers);
                setCourseTypes(parsed.types);
                if (parsed.branches) setBranches(parsed.branches);
            }
        }
    };

    const saveConfig = async (newTeachers, newTypes, newBranches = branches) => {
        const config = { teachers: newTeachers, types: newTypes, branches: newBranches };
        localStorage.setItem('student_course_config', JSON.stringify(config));
        try {
            await supabase.from('student_course_config').upsert({ id: 1, teachers: newTeachers, types: newTypes, branches: newBranches });
        } catch (err) {
            console.warn('DB Config save failed.');
        }
    };

    const addTeacher = () => {
        if (!newTeacherName) return;
        const updated = [...teachers, newTeacherName];
        setTeachers(updated);
        setNewTeacherName('');
        saveConfig(updated, courseTypes, branches);
    };

    const removeTeacher = (name) => {
        if (!confirm(`確定要移除老師 ${name} 嗎？`)) return;
        const updated = teachers.filter(t => t !== name);
        setTeachers(updated);
        saveConfig(updated, courseTypes, branches);
    };

    const addType = () => {
        if (!newTypeName) return;
        const updated = [...courseTypes, newTypeName];
        setCourseTypes(updated);
        setNewTypeName('');
        saveConfig(teachers, updated, branches);
    };

    const removeType = (name) => {
        if (!confirm(`確定要移除類型 ${name} 嗎？`)) return;
        const updated = courseTypes.filter(t => t !== name);
        setCourseTypes(updated);
        saveConfig(teachers, updated, branches);
    };

    const addBranch = () => {
        if (!newBranchName) return;
        const updated = [...branches, newBranchName];
        setBranches(updated);
        setNewBranchName('');
        saveConfig(teachers, courseTypes, updated);
    };

    const removeBranch = (name) => {
        if (!confirm(`確定要移除據點 ${name} 嗎？`)) return;
        const updated = branches.filter(b => b !== name);
        setBranches(updated);
        saveConfig(teachers, courseTypes, updated);
    };

    const [bookingsData, setBookingsData] = useState([]);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            const startDate = new Date(currentMonth);
            startDate.setDate(1);
            const endDate = new Date(currentMonth);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(0);
            const sStr = startDate.toISOString().split('T')[0];
            const eStr = endDate.toISOString().split('T')[0];

            // Fetch ALL Courses for the period
            const { data: coursesData, error: courseError } = await supabase
                .from('student_courses')
                .select('*')
                .gte('course_date', sStr)
                .lte('course_date', eStr)
                .order('course_date', { ascending: true });

            if (courseError) throw courseError;
            setCourses(coursesData || []);

            // Fetch all Bookings for this period to show counts in list
            const { data: bookingsItems, error: bookingError } = await supabase
                .from('student_bookings')
                .select('id, course_id, course_name, course_date, period')
                .gte('course_date', sStr)
                .lte('course_date', eStr);
            
            setBookingsData(bookingsItems || []);

        } catch (err) {
            console.warn('DB Fetch failed, using local.');
            const local = JSON.parse(localStorage.getItem('student_courses') || '[]');
            const sStr = currentMonth.toISOString().split('T')[0].substring(0, 7);
            const filtered = local.filter(c => c.course_date.startsWith(sStr));
            setCourses(filtered);
        } finally {
            setIsLoading(false);
        }
    };

    // New: Derived filtered list for UI consumption
    const filteredCourses = courses.filter(c => {
        if (!selectedBranch || selectedBranch === '全部') return true;
        
        // 1. If explicit branch field exists, follow it strictly
        if (c.branch && c.branch !== 'undefined' && c.branch !== null) {
            return c.branch === selectedBranch;
        }
        
        // 2. Fallback for legacy data (without branch field)
        const prefix = selectedBranch.substring(0, 2);
        const loc = c.location || '';
        
        // If it starts with the bracketed name of our branch, show it
        if (loc.startsWith(`(${prefix})`)) return true;
        
        // Otherwise, if it has a prefix of OTHER branches, hide it
        const otherBranches = branches.filter(b => b !== selectedBranch).map(b => b.substring(0, 2));
        for (const other of otherBranches) {
            if (loc.startsWith(`(${other})`)) return false;
        }
        
        // Fallback: search for keyword anywhere in location
        return loc.includes(prefix);
    });

    const openCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({
            ...initialFormState,
            course_date: new Date().toISOString().split('T')[0],
            branch: (selectedBranch && selectedBranch !== '全部') ? selectedBranch : '沐光瑜珈健身空間'
        });
        setShowModal(true);
    };

    const openEditModal = (course) => {
        setIsEditing(true);
        setEditingId(course.id || course.created_at);
        setFormData({
            ...initialFormState,
            course_name: course.course_name || '',
            description: course.description || '',
            type: course.type || '大地課程',
            teacher_name: course.teacher_name || 'JENNY',
            branch: course.branch || '沐光瑜珈健身空間',
            capacity: course.capacity || 15,
            location: course.location || '',
            course_date: course.course_date || '',
            course_phase: course.course_phase || '',
            period: course.period || '',
            points_type: course.points_type || '黑',
            points_amount: course.points_amount || 1,
            repeat_weekly: false 
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.course_name) return alert('請輸入課程名稱');
            setIsSaving(true);
            
            const entries = [];
            const weeks = formData.infinite_repeat ? 52 : formData.repeat_weeks;
            
            const branchPrefix = (formData.branch && formData.branch.length >= 2) ? formData.branch.substring(0, 2) : '沐光';
            const finalLocation = formData.location.startsWith(`(${branchPrefix})`) 
                ? formData.location 
                : `(${branchPrefix})${formData.location}`;

            if (!isEditing && formData.repeat_weekly) {
                const start = new Date(formData.course_date);
                for (let i = 0; i < weeks; i++) {
                    const next = new Date(start);
                    next.setDate(start.getDate() + (i * 7));
                    entries.push({
                        id: crypto.randomUUID(),
                        course_name: formData.course_name,
                        course_phase: formData.course_phase,
                        description: formData.description,
                        type: formData.type,
                        teacher_name: formData.teacher_name,
                        branch: formData.branch,
                        capacity: formData.capacity,
                        location: finalLocation,
                        course_date: next.toISOString().split('T')[0],
                        period: formData.period,
                        points_type: formData.points_type,
                        points_amount: formData.points_amount,
                        created_at: new Date().toISOString()
                    });
                }
            } else {
                entries.push({
                    id: isEditing ? editingId : crypto.randomUUID(),
                    course_name: formData.course_name,
                    course_phase: formData.course_phase,
                    description: formData.description,
                    type: formData.type,
                    teacher_name: formData.teacher_name,
                    branch: formData.branch,
                    capacity: formData.capacity,
                    location: finalLocation,
                    course_date: formData.course_date,
                    period: formData.period,
                    points_type: formData.points_type,
                    points_amount: formData.points_amount,
                    created_at: new Date().toISOString()
                });
            }

            // Always update local view for immediate feedback
            const local = JSON.parse(localStorage.getItem('student_courses') || '[]');
            let updatedLocal;
            
            if (isEditing) {
                updatedLocal = local.map(c => (c.id === editingId || c.created_at === editingId) ? entries[0] : c);
                setCourses(prev => prev.map(c => (c.id === editingId || c.created_at === editingId) ? entries[0] : c));
            } else {
                updatedLocal = [...local, ...entries];
                setCourses(prev => [...prev, ...entries]);
            }
            
            localStorage.setItem('student_courses', JSON.stringify(updatedLocal));

            // Sync with Supabase
            if (isEditing) {
                // Strip fields that are only used in UI or don't exist in the table
                const { 
                    id, created_at, 
                    infinite_repeat, repeat_weekly, repeat_weeks, 
                    course_phase, ...updateSet 
                } = { ...formData, ...entries[0] || {} };
                
                const { error: dbError } = await supabase.from('student_courses').update(updateSet).eq('id', editingId);
                
                if (dbError) {
                    console.error('Cloud Update Error:', dbError);
                    alert('⚠️ 雲端更新部分失敗: ' + dbError.message + '\n(但課程已成功儲存於本地)');
                } else {
                    alert('✅ 雲端編輯更新完成！');
                }
            } else {
                // For batch or single insert, strip UI-only props
                const dbEntries = entries.map(({
                    id, created_at, 
                    infinite_repeat, repeat_weekly, repeat_weeks, 
                    course_phase, ...rest
                }) => rest);
                
                const { error: dbError } = await supabase.from('student_courses').insert(dbEntries);
                
                if (dbError) {
                    console.error('Cloud Sync Error:', dbError);
                    alert('⚠️ 雲端同步失敗: ' + dbError.message + '\n(資料已儲存於本地)');
                } else {
                    alert('✅ 雲端同步成功！');
                }
            }

            setShowModal(false);
            setIsEditing(false);
            setEditingId(null);
            fetchCourses();
        } catch (err) {
            console.error('Save Flow Exception:', err);
            alert('系統儲存異常，請稍後再試。');
        } finally {
            setIsSaving(false);
        }
    };



    const handleDelete = async (courseId, date) => {
        if (!confirm('確定要刪除這堂課程嗎？')) return;
        try {
            const local = JSON.parse(localStorage.getItem('student_courses') || '[]');
            const updated = local.filter(c => c.id !== courseId && (c.id || c.created_at !== courseId));
            localStorage.setItem('student_courses', JSON.stringify(updated));

            if (courseId && typeof courseId === 'string' && courseId.length > 30) {
                await supabase.from('student_courses').delete().eq('id', courseId);
            }

            setCourses(prev => prev.filter(c => (c.id || c.created_at) !== courseId));
            if (showDetailModal) setShowDetailModal(false);
            if (showDayModal) {
                const dayCourses = updated.filter(c => c.course_date === date);
                if (dayCourses.length === 0) setShowDayModal(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteSeries = async (course) => {
        const displayName = course.course_name || '(未命名課程)';
        const msg = `⚠️ 注意：確定要刪除所有「${displayName}」(${course.teacher_name}) 在每周此時段的課程嗎？\n這將移除所有符合該時間與星期幾的課程紀錄。`;
        if (!confirm(msg)) return;

        try {
            setIsSaving(true);
            const targetWeekday = new Date(course.course_date).getDay();
            
            // 1. Fetch matching candidates from DB
            // Build query dynamically to handle null/empty names
            let query = supabase
                .from('student_courses')
                .select('*')
                .eq('teacher_name', course.teacher_name)
                .eq('period', course.period);

            if (!course.course_name) {
                query = query.or('course_name.is.null,course_name.eq.""');
            } else {
                query = query.eq('course_name', course.course_name);
            }

            const { data: candidates, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // 2. Filter by weekday and location locally
            const branchPrefix = (course.branch && course.branch.substring(0, 2)) || course.location?.match(/\((.*?)\)/)?.[1] || '';
            const toDelete = (candidates || []).filter(c => {
                const isSameWeekday = new Date(c.course_date).getDay() === targetWeekday;
                const loc = c.location || '';
                const isSameLocation = !branchPrefix || loc.startsWith(`(${branchPrefix})`) || (c.branch === course.branch);
                return isSameWeekday && isSameLocation;
            });

            if (toDelete.length === 0) {
                alert('未找到符合條件的系列課程。');
                return;
            }

            const ids = toDelete.map(c => c.id);
            
            // 3. Delete from Supabase
            const { error: delError } = await supabase
                .from('student_courses')
                .delete()
                .in('id', ids);

            if (delError) throw delError;

            // 4. Update local state & localStorage
            const local = JSON.parse(localStorage.getItem('student_courses') || '[]');
            const updatedLocal = local.filter(c => !ids.includes(c.id));
            localStorage.setItem('student_courses', JSON.stringify(updatedLocal));

            setCourses(prev => prev.filter(c => !ids.includes(c.id)));
            
            if (showDetailModal) setShowDetailModal(false);
            if (showDayModal) setShowDayModal(false);
            
            alert(`✅ 已成功刪除該系列共 ${ids.length} 堂課程！`);
            fetchCourses();
        } catch (err) {
            console.error('Delete series error:', err);
            alert('刪除系列課程失敗: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

    const generateCalendar = () => {
        const y = currentMonth.getFullYear();
        const m = currentMonth.getMonth();
        const days = [];
        for (let i = 0; i < getFirstDay(y, m); i++) days.push({ day: null });
        for (let d = 1; d <= getDaysInMonth(y, m); d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ day: d, date: dateStr, courses: filteredCourses.filter(c => c.course_date === dateStr) });
        }
        return days;
    };

    const renderConfigView = () => (
        <div className="config-view animate-fade-in">
            <div className="config-grid">
                <section className="config-card">
                    <div className="card-header">
                        <h4>據點管理 ({branches.length})</h4>
                    </div>
                    <div className="add-form">
                        <input 
                            type="text" 
                            placeholder="輸入新據點名稱..." 
                            value={newBranchName}
                            onChange={e => setNewBranchName(e.target.value)}
                        />
                        <button onClick={addBranch}><Plus size={18} /> 新增</button>
                    </div>
                    <div className="content-list">
                        {branches.map(b => (
                            <div key={b} className="item-pill">
                                <span>{b}</span>
                                <button onClick={() => removeBranch(b)}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="config-card">
                    <div className="card-header">
                        <h4>指導老師管理 ({teachers.length})</h4>
                    </div>
                    <div className="add-form">
                        <input 
                            type="text" 
                            placeholder="輸入新老師姓名..." 
                            value={newTeacherName}
                            onChange={e => setNewTeacherName(e.target.value)}
                        />
                        <button onClick={addTeacher}><Plus size={18} /> 新增</button>
                    </div>
                    <div className="content-list">
                        {teachers.map(t => (
                            <div key={t} className="item-pill">
                                <span>{t}</span>
                                <button onClick={() => removeTeacher(t)}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="config-card">
                    <div className="card-header">
                        <h4>課程類型管理 ({courseTypes.length})</h4>
                    </div>
                    <div className="add-form">
                        <input 
                            type="text" 
                            placeholder="輸入新課程類型..." 
                            value={newTypeName}
                            onChange={e => setNewTypeName(e.target.value)}
                        />
                        <button onClick={addType}><Plus size={18} /> 新增</button>
                    </div>
                    <div className="content-list">
                        {courseTypes.map(t => (
                            <div key={t} className="item-pill type">
                                <span>{t}</span>
                                <button onClick={() => removeType(t)}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );

    const renderCalendarView = () => (
        <div className="calendar-stack">
            <div className="calendar-container animate-fade-in">
                <div className="calendar-header">
                    <div className="month-display">
                        <button className="nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth()-1)))}><ChevronLeft size={18} /></button>
                        <h3>{currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月</h3>
                        <button className="nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth()+1)))}><ChevronRight size={18} /></button>
                    </div>
                </div>
                <div className="calendar-grid">
                    <div className="week-header">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => <span key={d}>{d}</span>)}
                    </div>
                    <div className="days-grid">
                        {generateCalendar().map((cell, idx) => (
                            <div 
                                key={idx} 
                                className={`day-cell ${cell.day ? '' : 'empty'} ${cell.courses?.length > 0 ? 'has-course' : ''}`}
                                onClick={() => cell.day && cell.courses.length > 0 && (setSelectedDay(cell.date), setShowDayModal(true))}
                            >
                                {cell.day && (
                                    <>
                                        <span className="day-number">{cell.day}</span>
                                        <div className="mini-courses">
                                            {cell.courses.map((c, ci) => (
                                                <div key={ci} className={`mini-course-badge ${c.type === '大地課程' ? 'earth' : 'multi'}`}>
                                                    {c.teacher_name}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="course-list-section animate-fade-in">
                <div className="section-header">
                    <h4>課程詳細紀錄 ({filteredCourses.length})</h4>
                    <p>管理所有報名狀態與課程詳情</p>
                </div>
                <div className="course-cards-container">
                    {filteredCourses.length === 0 ? <div className="empty-state">尚無課程紀錄</div> : 
                        filteredCourses.map((c, idx) => {
                            const enrollCount = bookingsData.filter(b => 
                                (b.course_id === c.id) || 
                                (b.course_date === c.course_date && b.period === c.period && b.course_name === c.course_name)
                            ).length;
                            const percent = Math.min(100, Math.round((enrollCount / (c.capacity || 15)) * 100));
                            
                            return (
                                <div key={c.id || idx} className="record-card">
                                    <div className="record-left">
                                        <div className={`record-type-label ${c.type === '大地課程' ? 'earth' : 'multi'}`}>{c.type}</div>
                                        <div className="record-main-info">
                                            <h5 title={c.course_name}>{c.course_name || '未命名課程'}</h5>
                                            <div className="record-meta">
                                                <span><CalendarIcon size={12} /> {c.course_date}</span>
                                                <span><Clock size={12} /> {c.period}</span>
                                                <span><User size={12} /> {c.teacher_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="record-right">
                                        <div className="record-stats">
                                            <span className="capacity-label">報名：{enrollCount} / {c.capacity}</span>
                                            <div className="progress-bar"><div className="fill" style={{ width: `${percent}%`, background: percent >= 100 ? '#EF4444' : '#10B981' }}></div></div>
                                        </div>
                                        <div className="record-actions">
                                            <button className="icon-btn info" onClick={() => { setSelectedCourse(c); setShowDetailModal(true); }} title="查看詳情"><Eye size={16} /></button>
                                            <button className="icon-btn qr" onClick={() => { setSelectedCourse(c); setShowQRModal(true); }} title="產生簽到條碼"><QrCode size={16} /></button>
                                            <button className="icon-btn edit" onClick={() => openEditModal(c)} title="編輯課程"><Edit2 size={16} /></button>
                                            <button className="icon-btn delete-all" onClick={() => handleDeleteSeries(c)} title="刪除每周此課程 (系列)"><Layers size={16} /></button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(c.id || c.created_at, c.course_date)} title="僅刪除此堂"><Trash2 size={16} /></button>
                                        </div>

                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

            </div>
        </div>
    );

    const [enrollments, setEnrollments] = useState([]);
    const [isFetchingEnrollments, setIsFetchingEnrollments] = useState(false);

    const fetchEnrollments = async (course) => {
        try {
            setIsFetchingEnrollments(true);
            setEnrollments([]); // Reset
            
            // To be accurate, we match by specific ID or combination for safety
            const query = supabase.from('student_bookings').select('*');
            
            if (course.id && course.id.length > 30) {
                query.eq('course_id', course.id);
            } else {
                // Fallback for locally saved or older data
                query.eq('course_name', course.course_name)
                     .eq('course_date', course.course_date)
                     .eq('period', course.period);
            }

            const { data, error } = await query;
            if (error) throw error;
            setEnrollments(data || []);
        } catch (err) {
            console.warn('Real enrollment fetch failed or table missing:', err);
            setEnrollments([]);
        } finally {
            setIsFetchingEnrollments(false);
        }
    };

    useEffect(() => {
        if ((showDetailModal || showQRModal) && selectedCourse) {
            fetchEnrollments(selectedCourse);
        }
    }, [showDetailModal, showQRModal, selectedCourse]);

    const fetchCoaches = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('email, name, role')
                .eq('role', 'coach');
            if (error) throw error;
            setCoaches(data || []);
            setShowCoachSelector(true);
        } catch (err) {
            alert('無法獲取教練列表: ' + err.message);
        }
    };

    const handleSendToCoach = async (coachEmail) => {
        if (!selectedCourse) return;
        setIsSending(true);
        try {
            const { error } = await supabase.from('notifications').insert([{
                title: `[課程點名授權] ${selectedCourse.course_name}`,
                content: `管理員已將此課程的點名權限分享給您。\n日期：${selectedCourse.course_date}\n時段：${selectedCourse.period}\n課程ID：${selectedCourse.id}\n(點擊下方按鈕開啟點名條碼與名單)\n[[AUTH_COURSE_ID:${selectedCourse.id}]]`,
                tag: '課程',
                target_role: 'coach',
                target_email: coachEmail.toLowerCase()
            }]);

            if (error) throw error;
            alert(`已成功發送點名授權訊息給 ${coachEmail}`);
            setShowCoachSelector(false);
        } catch (err) {
            alert('發送失敗: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="student-course-manager">
            <header className="manager-header">
                <div className="title-group">
                    <h2 className="title">學員課程系統管理</h2>
                    <div className="tab-group-container">
                        <div className="view-selector">
                            <button className={`view-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>日曆排課</button>
                            <button className={`view-tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>基礎設定</button>
                        </div>
                        {activeTab === 'calendar' && (
                            <div className="branch-manager-tabs">
                                {['全部', ...branches].map(b => (
                                    <button 
                                        key={b} 
                                        className={`branch-tab ${selectedBranch === b ? 'active' : ''}`}
                                        onClick={() => setSelectedBranch(b)}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button className="add-course-btn" onClick={openCreateModal}><Plus size={20} /><span>新增課程時段</span></button>
            </header>

            {activeTab === 'calendar' ? renderCalendarView() : renderConfigView()}

            {/* Day Hourly View Modal */}
            {showDayModal && (
                <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
                    <div className="day-schedule-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-title"><h3>{selectedDay} 課程行程</h3><p>24 小時時段分配分布</p></div>
                            <button className="close-btn" onClick={() => setShowDayModal(false)}><X size={24} /></button>
                        </div>
                        <div className="timeline-container">
                            {Array.from({length: 24}).map((_, h) => (
                                <div key={h} className="hour-row">
                                    <div className="hour-label">{String(h).padStart(2, '0')}:00</div>
                                    <div className="hour-slot">
                                        {filteredCourses.filter(c => c.course_date === selectedDay && (c.period || '').startsWith(String(h).padStart(2, '0'))).map((c, ci) => (
                                            <div key={ci} className={`timeline-course-card ${c.type === '大地課程' ? 'earth' : 'multi'}`} onClick={() => { setSelectedCourse(c); setShowDetailModal(true); }}>
                                                <div className="t-time">{c.period}</div>
                                                <div className="t-info"><strong>{c.course_name}</strong><span>{c.teacher_name} - {c.location}</span></div>
                                                <button className="t-edit-btn" onClick={(e) => { e.stopPropagation(); openEditModal(c); }}><Edit2 size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Course Detail Modal */}
            {showDetailModal && selectedCourse && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="detail-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-title">
                                <div className={`type-tag ${selectedCourse.type === '大地課程' ? 'earth' : 'multi'}`}>{selectedCourse.type}</div>
                                <h3>{selectedCourse.course_name} 課程詳情</h3>
                            </div>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="info-main">
                                    <div className="info-item">
                                        <label><MapPin size={16}/> 發布據點</label>
                                        <p className={`branch-label ${(selectedCourse.branch?.includes('晴天') || selectedCourse.location?.includes('晴天')) ? 'sunny' : (selectedCourse.branch?.includes('沐光') || selectedCourse.location?.includes('沐光')) ? 'muguang' : ''}`}>
                                            {selectedCourse.branch || (selectedCourse.location?.includes('晴天') ? '晴天瑜珈健身俱樂部' : selectedCourse.location?.includes('沐光') ? '沐光瑜珈健身空間' : '未設定據點')}
                                        </p>
                                    </div>
                                    <div className="info-item">
                                        <label><Clock size={16}/> 時段</label>
                                        <p>{selectedCourse.course_date} | {selectedCourse.period}</p>
                                    </div>
                                    <div className="info-item"><label><User size={16}/> 老師</label><p>{selectedCourse.teacher_name}</p></div>
                                    <div className="info-item"><label><Layers size={16}/> 課程期別</label><p>{selectedCourse.course_phase || '未設定'}</p></div>
                                    <div className="info-item"><label><Hash size={16}/> 點數限制</label><p>{selectedCourse.points_type}點 x {selectedCourse.points_amount}</p></div>
                                    <div className="info-item"><label><MapPin size={16}/> 地點</label><p>{selectedCourse.location}</p></div>
                                    <div className="info-item full"><label><FileText size={16}/> 簡介</label><p className="desc">{selectedCourse.description || '暫無說明'}</p></div>
                                </div>

                                <div className="info-sidebar">
                                    <div className="enrollment-box">
                                        <h4>報名狀況</h4>
                                        <div className="stat-circle">
                                            <span className="n">{enrollments.length}</span>
                                            <span className="t">/ {selectedCourse.capacity}</span>
                                        </div>
                                        <div className="action-stack">
                                            <button className="qr-btn-main" onClick={() => setShowQRModal(true)}><QrCode size={16}/> 產生課程簽到條碼</button>
                                            <button className="edit-btn-main" onClick={() => openEditModal(selectedCourse)}><Edit2 size={16}/> 編輯課程內容</button>
                                            <button className="del-series-btn" onClick={() => handleDeleteSeries(selectedCourse)}><Layers size={16}/> 刪除每周此課程 (系列)</button>
                                            <button className="del-btn" onClick={() => handleDelete(selectedCourse.id || selectedCourse.created_at, selectedCourse.course_date)}><Trash2 size={16}/> 僅刪除此堂課程</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="info-students grid-span-2">
                                    <h4>已報名學員資訊</h4>
                                    <div className="student-table">
                                        <div className="st-head"><span>姓名</span><span>電話</span><span>報名時間</span><span>狀態</span></div>
                                        {isFetchingEnrollments ? <div className="p-10 text-center"><Loader2 className="spin inline mx-auto" /> 讀取中...</div> : 
                                         enrollments.length === 0 ? <div className="p-10 text-center text-gray-500">目前尚無學員報名</div> :
                                         enrollments.map((s, i) => (
                                            <div key={i} className="st-row">
                                                <span>{s.student_name || '未登錄'}</span>
                                                <span>{s.phone || '無電話'}</span>
                                                <span>{s.created_at?.substring(0, 16).replace('T', ' ')}</span>
                                                <span className={`st-ok ${(['已點名', '已到'].includes(s.status)) ? 'attended' : ''}`}>
                                                    {s.status || '已報名'}
                                                </span>
                                            </div>
                                         ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showQRModal && selectedCourse && (
                <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
                    <div className="qr-display-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><QrCode /> 課程簽到條碼</h3>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="share-coach-btn" onClick={fetchCoaches}>
                                    <Send size={16} /> 傳送到教練收件夾
                                </button>
                                <button className="close-btn" onClick={() => setShowQRModal(false)}><X /></button>
                            </div>
                        </div>
                        <div className="modal-body qr-body">
                            <div className="qr-card">
                                <h4>{selectedCourse.course_name}</h4>
                                <p className="qr-meta">{selectedCourse.course_date} | {selectedCourse.period}</p>
                                <div className="qr-wrapper">
                                    <QRCodeCanvas 
                                        value={JSON.stringify({ type: 'attendance', courseId: selectedCourse.id })} 
                                        size={256}
                                        level={"H"}
                                        includeMargin={true}
                                    />
                                </div>
                                <p className="qr-instruction">請學員使用手機掃描此條碼完成點名</p>
                            </div>

                            <div className="qr-student-list-container">
                                <h3>即時簽到狀況 ({enrollments.filter(s => ['已點名', '已到'].includes(s.status)).length} / {enrollments.length})</h3>
                                <div className="qr-student-table">
                                    <div className="qr-st-head">
                                        <span>學員</span>
                                        <span>狀態</span>
                                    </div>
                                    <div className="qr-st-body">
                                        {enrollments.length === 0 ? <div className="qr-empty">尚無學員預約</div> :
                                         enrollments.map((s, i) => (
                                            <div key={i} className="qr-st-row">
                                                <div className="qr-st-name">
                                                    <strong>{s.student_name}</strong>
                                                    <span>{s.phone?.substring(s.phone.length - 4)}</span>
                                                </div>
                                                <span className={`qr-status-tag ${(['已點名', '已到'].includes(s.status)) ? 'done' : 'pending'}`}>
                                                    {(['已點名', '已到'].includes(s.status)) ? '已報到' : '未報到'}
                                                </span>
                                            </div>
                                         ))
                                        }
                                    </div>
                                </div>
                                <button className="refresh-qr-list" onClick={() => fetchEnrollments(selectedCourse)}>
                                    <Loader2 size={14} className={isFetchingEnrollments ? 'spin' : ''} /> 重新整理名單
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="save-btn" onClick={() => setShowQRModal(false)}>關閉視窗</button>
                        </div>
                    </div>
                </div>
            )}

            {showCoachSelector && (
                <div className="modal-overlay" onClick={() => setShowCoachSelector(false)}>
                    <div className="coach-selector-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Users size={20} /> 選擇要委託的教練</h3>
                            <button className="close-btn" onClick={() => setShowCoachSelector(false)}><X /></button>
                        </div>
                        <div className="coach-list-body">
                            {coaches.length === 0 ? <div className="empty-coaches">查無教練資料</div> :
                             coaches.map((c, i) => (
                                <div key={i} className="coach-item" onClick={() => handleSendToCoach(c.email)}>
                                    <div className="c-info">
                                        <div className="c-avatar">{c.name?.substring(0,1)}</div>
                                        <div className="c-text">
                                            <strong>{c.name}</strong>
                                            <span>{c.email}</span>
                                        </div>
                                    </div>
                                    <button className="c-send-btn" disabled={isSending}>
                                        {isSending ? '發送中...' : '選取並傳送'}
                                    </button>
                                </div>
                             ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="course-modal animate-scale-in">
                        <div className="modal-header"><h3>{isEditing ? '編輯課程時段' : '新增課程時段'}</h3><button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button></div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group grid-span-2"><label><Type size={16} /> 課程名稱</label><input type="text" placeholder="例如：核心強化瑜珈" value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})}/></div>
                                <div className="form-group grid-span-2"><label><MapPin size={16} /> 於據點發布</label>
                                    <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                                        {branches.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group"><label><Layers size={16} /> 課程期別</label><input type="text" placeholder="例如：2026 第一期" value={formData.course_phase} onChange={e => setFormData({...formData, course_phase: e.target.value})}/></div>
                                <div className="form-group"><label><Clock size={16} /> 上課時間段</label><input type="text" placeholder="例如：11:00 ~ 11:50" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})}/></div>
                                <div className="form-group"><label><Layers size={16} /> 課程類型</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>{courseTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div className="form-group"><label><User size={16} /> 指導老師</label><select value={formData.teacher_name} onChange={e => setFormData({...formData, teacher_name: e.target.value})}>{teachers.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div className="form-group"><label><CalendarIcon size={16} /> 上課日期</label><input type="date" value={formData.course_date} onChange={e => setFormData({...formData, course_date: e.target.value})}/></div>
                                <div className="form-group"><label><Users size={16} /> 人數限制</label><input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}/></div>
                                <div className="form-group grid-span-2"><label><MapPin size={16} /> 特定教室 (細項地點)</label><input type="text" placeholder="MU 沐光教室 B" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}/></div>
                                <div className="form-group grid-span-2"><label><FileText size={16} /> 課程簡介</label><textarea rows="3" placeholder="請輸入說明..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{width:'100%',background:'#0F172A',border:'1px solid rgba(255,255,255,0.1)',padding:'10px 14px',borderRadius:'10px',color:'white',outline:'none',resize:'vertical'}}/></div>
                                <div className="form-group"><label><Clock size={16} /> 點數類別</label>
                                    <div className="point-selector">
                                        {pointTypes.map(p => (<button key={p} className={`point-btn ${formData.points_type === p ? 'active' : ''}`} onClick={() => setFormData({...formData, points_type: p})}>{p}點</button>))}
                                    </div>
                                </div>
                                <div className="form-group"><label><Hash size={16} /> 點數數量</label><input type="number" value={formData.points_amount} onChange={e => setFormData({...formData, points_amount: parseInt(e.target.value)})}/></div>
                                <div className="form-group grid-span-2 recurring-container">
                                    <div className={`recurring-card ${formData.repeat_weekly ? 'active' : ''}`}>
                                        <label className="main-check">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.repeat_weekly} 
                                                onChange={e => setFormData({...formData, repeat_weekly: e.target.checked})}
                                            />
                                            <span className="box-label">每周同一時段自動補上</span>
                                        </label>
                                        
                                        {formData.repeat_weekly && (
                                            <div className="repeat-sub-options animate-fade-in">
                                                <div className="option-row">
                                                    <label className="radio-pill">
                                                        <input 
                                                            type="radio" 
                                                            name="repeat_type" 
                                                            checked={formData.infinite_repeat} 
                                                            onChange={() => setFormData({...formData, infinite_repeat: true})}
                                                        />
                                                        <span>持續無限週</span>
                                                    </label>
                                                    <label className="radio-pill">
                                                        <input 
                                                            type="radio" 
                                                            name="repeat_type" 
                                                            checked={!formData.infinite_repeat} 
                                                            onChange={() => setFormData({...formData, infinite_repeat: false})}
                                                        />
                                                        <span>自定義週數</span>
                                                    </label>
                                                </div>
                                                
                                                {!formData.infinite_repeat && (
                                                    <div className="custom-weeks-input animate-scale-in">
                                                        <span className="l">持續進行</span>
                                                        <input 
                                                            type="number" 
                                                            value={formData.repeat_weeks} 
                                                            onChange={e => setFormData({...formData, repeat_weeks: parseInt(e.target.value)})}
                                                        />
                                                        <span className="r">週課程</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer"><button className="cancel-btn" onClick={() => setShowModal(false)}>取消</button><button className="save-btn" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={20} /> : <Check size={20} />}保存並發布</button></div>
                    </div>
                </div>
            )}

            <style>{`
                .student-course-manager { height: 100%; padding: 24px; background: #0F172A; color: white; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; scrollbar-width: none; }
                .qr-display-modal { background: #1E293B; border-radius: 30px; width: 100%; max-width: 750px; display: flex; flex-direction: column; overflow: hidden; }
                .qr-body { display: flex; gap: 40px; padding: 40px; align-items: flex-start; flex-wrap: wrap; }
                .manager-header { display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0; }
                .title-group { display: flex; flex-direction: column; gap: 12px; }
                .qr-instruction { font-size: 14px; color: #94a3b8; font-weight: 600; }
                
                /* QR Modal Student List */
                .qr-student-list-container { flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 16px; }
                .qr-student-list-container h3 { font-size: 16px; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; }
                .qr-student-table { background: #0F172A; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
                .qr-st-head { display: grid; grid-template-columns: 1fr auto; padding: 12px 20px; background: rgba(255,255,255,0.02); font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.4); }
                .qr-st-body { max-height: 300px; overflow-y: auto; scrollbar-width: none; }
                .qr-st-row { display: grid; grid-template-columns: 1fr auto; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; }
                .qr-st-name { display: flex; flex-direction: column; gap: 2px; }
                .qr-st-name strong { font-size: 14px; color: white; }
                .qr-st-name span { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; }
                .qr-status-tag { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; }
                .qr-status-tag.done { background: rgba(16, 185, 129, 0.1); color: #10B981; }
                .qr-status-tag.pending { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
                .qr-empty { padding: 40px 20px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; font-weight: 700; }
                .refresh-qr-list { background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 8px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
                .refresh-qr-list:hover { background: rgba(255,255,255,0.05); color: white; }
                
                .share-coach-btn { 
                    background: rgba(249, 115, 22, 0.1); color: #f97316; 
                    border: 1px solid rgba(249, 115, 22, 0.2); 
                    padding: 6px 14px; border-radius: 8px; 
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; transition: 0.2s;
                }
                .share-coach-btn:hover { background: #f97316; color: white; }

                /* Coach Selector */
                .coach-selector-modal { background: #1E293B; border-radius: 30px; width: 100%; max-width: 450px; overflow: hidden; }
                .coach-list-body { padding: 20px; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
                .coach-item { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 12px 16px; background: rgba(255,255,255,0.03); 
                    border-radius: 16px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;
                }
                .coach-item:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
                .c-info { display: flex; align-items: center; gap: 12px; }
                .c-avatar { width: 36px; height: 36px; background: #3b82f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: white; }
                .c-text { display: flex; flex-direction: column; }
                .c-text strong { font-size: 14px; color: white; }
                .c-text span { font-size: 11px; color: rgba(255,255,255,0.4); }
                .c-send-btn { background: none; border: none; color: #3b82f6; font-size: 12px; font-weight: 700; cursor: pointer; }
                .empty-coaches { padding: 40px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; font-weight: 600; }
                
                .tab-group-container { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
                .view-selector { display: flex; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 12px; width: fit-content; border: 1px solid rgba(255,255,255,0.05); }
                .view-tab { border: none; background: none; color: rgba(255,255,255,0.4); padding: 6px 16px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: 0.2s; }
                .view-tab.active { background: white; color: black; }
                
                .branch-manager-tabs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; mask-image: linear-gradient(to right, black 90%, transparent 100%); }
                .branch-tab { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap; transition: 0.3s; }
                .branch-tab:hover { background: rgba(255,255,255,0.08); }
                .branch-tab.active { background: #F97316; color: white; border-color: #F97316; box-shadow: 0 4px 15px rgba(249,115,22,0.3); }

                .add-course-btn { background: #F97316; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s; font-size: 14px; }
                
                .form-group select { width: 100%; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; color: white; outline: none; -webkit-appearance: none; cursor: pointer; font-weight: 700; }
                .form-group select option { background: #1E293B; color: white; }
                
                .calendar-stack { display: flex; flex-direction: column; gap: 24px; }
                .calendar-container { background: #1E293B; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.05); }
                .calendar-header { display: flex; justify-content: center; margin-bottom: 16px; }
                .month-display { display: flex; align-items: center; gap: 24px; }
                .month-display h3 { font-size: 18px; font-weight: 800; min-width: 120px; text-align: center; }
                .nav-btn { background: rgba(255,255,255,0.05); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .calendar-grid { display: flex; flex-direction: column; }
                .week-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 12px; }
                .week-header span { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); }
                .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
                .day-cell { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; gap: 2px; border: 1px solid rgba(255,255,255,0.03); min-height: 60px; cursor: pointer; transition: 0.2s; }
                .day-cell:hover { background: rgba(255,255,255,0.05); }
                .day-cell.empty { background: transparent; border: none; cursor: default; }
                .day-cell.has-course { border-color: rgba(249, 115, 22, 0.3); }
                .day-number { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); }
                .mini-courses { display: flex; flex-direction: column; gap: 1px; }
                .mini-course-badge { font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 600; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .mini-course-badge.earth { color: #84cc16; background: rgba(132, 204, 22, 0.1); border-left: 2px solid #84cc16; }
                .mini-course-badge.multi { color: #3b82f6; background: rgba(59, 130, 246, 0.1); border-left: 2px solid #3b82f6; }

                .course-list-section { background: #1E293B; border-radius: 24px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); }
                .section-header { margin-bottom: 20px; }
                .section-header h4 { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
                .section-header p { font-size: 13px; color: rgba(255,255,255,0.4); }
                .record-card { 
                    background: #0F172A; 
                    border-radius: 20px; 
                    padding: 20px; 
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    align-items: flex-start;
                    margin-bottom: 16px; 
                    border: 1px solid rgba(255,255,255,0.05); 
                    gap: 20px;
                    transition: 0.3s;
                }
                .record-card:hover { border-color: rgba(249, 115, 22, 0.3); background: #151d33; }
                .record-left { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
                .record-type-label { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; width: fit-content; text-align: center; }
                .record-type-label.earth { background: rgba(132, 204, 22, 0.1); color: #84cc16; }
                .record-type-label.multi { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .record-main-info { min-width: 0; }
                .record-main-info h5 { font-size: 18px; font-weight: 800; margin-bottom: 12px; color: white; line-height: 1.3; }
                .record-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: rgba(255,255,255,0.5); }
                .record-meta span { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 8px; }
                
                .record-right { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; gap: 16px; min-width: 140px; }
                .record-stats { width: 100%; text-align: right; }
                .capacity-label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.6); margin-bottom: 6px; display: block; }
                .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; width: 120px; margin-left: auto; }
                .progress-bar .fill { height: 100%; background: #10B981; border-radius: 3px; }
                .record-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }

                @media (max-width: 650px) {
                    .record-card { grid-template-columns: 1fr; padding: 24px; gap: 24px; }
                    .record-left { width: 100%; }
                    .record-main-info h5 { font-size: 20px; }
                    .record-right { width: 100%; align-items: flex-start; min-width: 0; }
                    .record-stats { text-align: left; }
                    .progress-bar { margin-left: 0; width: 100%; }
                    .record-actions { justify-content: flex-start; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; width: 100%; }
                }
                
                .day-schedule-modal { background: #1E293B; border-radius: 30px; width: 100%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; }
                .timeline-container { flex: 1; overflow-y: auto; padding: 20px; scrollbar-width: none; }
                .hour-row { display: flex; min-height: 50px; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .hour-label { width: 60px; font-size: 11px; color: rgba(255,255,255,0.3); padding-top: 4px; font-weight: 700; }
                .hour-slot { flex: 1; padding: 4px 0; display: flex; flex-direction: column; gap: 4px; }
                
                .timeline-course-card { position: relative; background: #0F172A; border-radius: 12px; padding: 10px; border-left: 4px solid #3B82F6; cursor: pointer; transition: 0.2s; }
                .timeline-course-card:hover { transform: translateX(4px); background: rgba(59, 130, 246, 0.05); }
                .timeline-course-card.earth { border-left-color: #84CC16; }
                .timeline-course-card.earth:hover { background: rgba(132, 204, 22, 0.05); }
                .t-edit-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.3); border: none; color: white; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; cursor: pointer; }
                .timeline-course-card:hover .t-edit-btn { opacity: 1; }
                .t-edit-btn:hover { background: #3B82F6; }

                .detail-modal { background: #1E293B; border-radius: 30px; width: 100%; max-width: 750px; max-height: 90vh; overflow-y: auto; }
                .detail-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; padding: 0 4px; }
                .info-main { display: grid; gap: 20px; }
                .info-item label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
                .info-item p { font-size: 16px; font-weight: 700; }
                .branch-label { font-weight: 800 !important; }
                .branch-label.sunny { color: #3b82f6; }
                .branch-label.muguang { color: #F97316; }
                .info-item.full { grid-column: span 2; }
                .desc { line-height: 1.5; color: rgba(255,255,255,0.7); white-space: pre-wrap; font-weight: 400 !important; font-size: 14px; }
                .info-sidebar { background: #0F172A; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .enrollment-box { width: 100%; text-align: center; }
                .enrollment-box h4 { font-size: 14px; margin-bottom: 16px; color: rgba(255,255,255,0.5); }
                .stat-circle .n { font-size: 36px; font-weight: 900; color: #10B981; }
                .stat-circle .t { font-size: 14px; color: rgba(255,255,255,0.3); }
                .del-btn { width: 100%; padding: 12px; border-radius: 12px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
                
                .info-students { margin-top: 12px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
                .info-students h4 { font-size: 16px; margin-bottom: 16px; }
                .student-table { background: #0F172A; border-radius: 16px; overflow: hidden; width: 100%; }
                .st-head { display: grid; grid-template-columns: 1fr 1.2fr 1.5fr 0.8fr; padding: 12px 16px; background: rgba(255,255,255,0.02); font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.4); }
                .st-row { display: grid; grid-template-columns: 1fr 1.2fr 1.5fr 0.8fr; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; align-items: center; }
                .st-ok { color: #10B981; font-weight: 700; opacity: 0.8; }
                .st-ok.attended { 
                    color: #3b82f6; background: rgba(59, 130, 246, 0.1); 
                    padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2); 
                }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
                .modal-body { padding: 24px; max-height: 60vh; overflow-y: auto; scrollbar-width: none; }
                .modal-footer { padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0; background: #1E293B; border-radius: 0 0 30px 30px; }
                .course-modal { background: #1E293B; border-radius: 30px; width: 100%; max-width: 600px; display: flex; flex-direction: column; max-height: 90vh; }
                .close-btn { background: none; border: none; color: white; cursor: pointer; padding: 4px; }
                
                .config-view { display: flex; flex-direction: column; gap: 24px; }
                .config-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
                .config-card { background: #1E293B; border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); }
                .add-form { display: flex; gap: 10px; margin: 16px 0; }
                .add-form input { flex: 1; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; color: white; }
                .add-form button { background: white; color: black; border: none; padding: 0 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
                .content-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .item-pill { background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-size: 14px; border: 1px solid rgba(255,255,255,0.05); }
                .item-pill button { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; padding: 2px; transition: 0.2s; }
                .item-pill button:hover { color: #EF4444; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .form-group label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 8px; font-weight: 700; }
                .form-group input, .form-group select { width: 100%; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; color: white; outline: none; }
                .point-selector { display: flex; gap: 8px; }
                .point-btn { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: white; cursor: pointer; transition: 0.2s; }
                .point-btn.active { background: white; color: black; font-weight: 800; border-color: white; }
                
                .recurring-container { margin-top: 10px; }
                .recurring-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; transition: 0.3s; }
                .recurring-card.active { background: rgba(249, 115, 22, 0.05); border-color: rgba(249, 115, 22, 0.2); }
                .main-check { display: flex; align-items: center; gap: 12px; cursor: pointer; }
                .main-check input { width: 20px; height: 20px; cursor: pointer; }
                .box-label { font-size: 15px; font-weight: 800; color: white; }
                
                .repeat-sub-options { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 16px; }
                .option-row { display: flex; gap: 12px; }
                .radio-pill { flex: 1; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); transition: 0.2s; }
                .radio-pill:has(input:checked) { border-color: #F97316; color: white; background: rgba(249, 115, 22, 0.1); }
                .radio-pill input { width: 16px; height: 16px; cursor: pointer; accent-color: #F97316; }
                
                .custom-weeks-input { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 10px; }
                .custom-weeks-input .l, .custom-weeks-input .r { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.4); }
                .custom-weeks-input input { width: 60px !important; text-align: center; border-color: #F97316 !important; font-weight: 900 !important; color: #F97316 !important; }

                .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }

                .icon-btn.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .icon-btn.qr { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .icon-btn.edit { background: rgba(245, 158, 11, 0.1); color: #f59e0b; opacity: 1 !important; }
                .icon-btn.delete-all { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .icon-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                .action-stack { display: flex; flex-direction: column; gap: 8px; width: 100%; }
                .edit-btn-main { width: 100%; padding: 12px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .del-series-btn { width: 100%; padding: 12px; border-radius: 12px; background: rgba(249, 115, 22, 0.1); color: #f97316; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }

                .cancel-btn { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .cancel-btn:hover { background: rgba(255,255,255,0.1); color: white; }
                .save-btn { background: #F97316; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); }
                .save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4); background: #fb923c; }
                .save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default StudentCourseManager;
