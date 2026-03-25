import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Clock, MapPin, Users, X, Plus,
  CheckCircle2, AlertCircle, Camera, Loader2, Calendar,
  MoreVertical, Box, Briefcase, Bell, Palette, Paperclip, Globe, Trash2,
  Bot, Sparkles, Zap
} from 'lucide-react';
import { supabase } from '../../supabase';
import gymScheduleBg from '../../assets/gym-schedule-bg.png';

// 錯誤邊界組件，防止單個組件崩潰導致整個頁面黑屏
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CoachSchedule Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2>組件發生錯誤</h2>
          <pre style={{ margin: '12px 0', fontSize: '12px', opacity: 0.7 }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#FF5C00', color: '#fff', borderRadius: '12px', fontWeight: 'bold' }}>
            重新整理頁面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const FloatingCoachBot = ({ lastAction }) => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (lastAction === 'add') {
      setMessage("太棒了！新課程已排入！教練加油！✨");
      setIsVisible(true);
    } else if (lastAction === 'delete') {
      setMessage("行程已移除，時間騰出來也可以做其他的規劃喔！💪");
      setIsVisible(true);
    } else {
      const pool = [
        "哈囉！今天也要一起加油喔！",
        "教練加油！你是學員最好的榜樣！",
        "今天也要充滿熱情地教學喔！",
        "每堂課程都是成長的養分，GOGOGO！",
        "你是最專業的，把正能量傳給學員吧！"
      ];
      setMessage(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [lastAction]);

  return (
    <div className={`floating-bot-container ${isVisible ? 'show' : 'hide'}`}>
      <div className="bot-speech-bubble" onClick={() => setIsVisible(false)}>
        <p className="bubble-text">{message}</p>
      </div>
      
      <div className="bot-trigger-group" onClick={() => setIsVisible(!isVisible)}>
        <div className="bot-head-icon">
          <div className="bot-eyes">
            <span className="eye"></span>
            <span className="eye"></span>
          </div>
        </div>
        <div className="bot-bottom-icon">
          <Zap size={14} className="pulse-icon" />
        </div>
      </div>
    </div>
  );
};

const CoachScheduleContent = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastBotAction, setLastBotAction] = useState(null);

    const [formData, setFormData] = useState({
    titleType: '學員課',
    title: '學員課',
    notes: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'course',
    category: '健身課',
    studentNames: [''], // 改用陣列存多位學員
    studentCount: '1',
    color: '#FF5C00', // 固定橘色
    location: '',
    images: [] // 新增照片欄位
  });

  const handleStudentCountChange = (count) => {
    const newCount = parseInt(count);
    let newNames = [...formData.studentNames];
    
    if (newCount > newNames.length) {
      // 增加格子
      const diff = newCount - newNames.length;
      newNames = [...newNames, ...Array(diff).fill('')];
    } else {
      // 縮減格子
      newNames = newNames.slice(0, newCount);
    }
    
    setFormData({ ...formData, studentCount: count, studentNames: newNames });
  };

  const handleStudentNameChange = (idx, val) => {
    const newNames = [...formData.studentNames];
    newNames[idx] = val;
    setFormData({ ...formData, studentNames: newNames });
  };
  const [typeColors, setTypeColors] = useState({
    '學員課': '#FF7A00',
    '教練進修': '#805AD5'
  });

  const fetchTypeColors = async () => {
    try {
      const userId = user?.id || user?.userIdString || 'global';
      const { data, error } = await supabase
        .from('coach_schedule_types')
        .select('title, color')
        .or(`coach_id.eq.${userId},coach_id.eq.global`);

      if (data) {
        const colors = {};
        data.forEach(item => {
          colors[item.title] = item.color;
        });
        setTypeColors(prev => ({ ...prev, ...colors }));
      }
    } catch (err) {
      console.error('Fetch type colors error:', err);
    }
  };

  useEffect(() => {
    if (user?.id || user?.userIdString) {
      fetchSchedule();
      fetchTypeColors();
    } else {
      console.warn("CoachScheduleContent: No user ID provided");
    }
  }, [user, currentDate]);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || user?.userIdString;
      if (!userId) {
        setSchedule([]);
        return;
      }

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const startOfMonth = new Date(year, month, 1).toLocaleDateString('en-CA');
      const endOfMonth = new Date(year, month + 1, 0).toLocaleDateString('en-CA');

      const { data, error } = await supabase
        .from('coach_schedule')
        .select('*')
        .eq('coach_id', userId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedule(data || []);
    } catch (err) {
      console.error('Fetch schedule error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    const course = schedule.find(c => c.id === id);
    if (!course) return;

    if (course.status === 'pending') {
      if (!window.confirm('確定要直接刪除這項待審核行程嗎？')) return;
      try {
        const { error } = await supabase.from('coach_schedule').delete().eq('id', id);
        if (error) throw error;
        setSchedule(prev => prev.filter(item => item.id !== id));
        setLastBotAction('delete');
        setTimeout(() => setLastBotAction(null), 3000);
      } catch (err) {
        alert('刪除失敗: ' + err.message);
      }
    } else if (course.status === 'approved') {
      setDeletingCourseId(id);
      setIsDeleteModalOpen(true);
    } else if (course.status === 'pending_deletion') {
      alert('此課程已在申請刪除審核中');
    }
  };

  const handleSubmitDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      alert('請填寫請求刪除原因');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('coach_schedule')
        .update({ 
          status: 'pending_deletion',
          reject_reason: deleteReason // 暫存教練申請原因
        })
        .eq('id', deletingCourseId);

      if (error) throw error;
      
      alert('刪除申請已提交，待管理者審核');
      setIsDeleteModalOpen(false);
      setDeleteReason('');
      fetchSchedule();
    } catch (err) {
      alert('申請失敗: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTypeColor = async (title, newColor) => {
    try {
      const userId = user?.id || user?.userIdString;
      if (!userId) return;

      // Update type definition
      await supabase
        .from('coach_schedule_types')
        .upsert({ coach_id: userId, title, color: newColor }, { onConflict: 'coach_id,title' });

      // Update all existing items with this title
      await supabase
        .from('coach_schedule')
        .update({ color: newColor })
        .eq('coach_id', userId)
        .eq('title', title);

      // Refresh local state
      setTypeColors(prev => ({ ...prev, [title]: newColor }));
      setFormData(prev => prev.title === title ? { ...prev, color: newColor } : prev);
      fetchSchedule();
    } catch (err) {
      console.error('Update color error:', err);
    }
  };

  const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
  const dailyCourses = (Array.isArray(schedule) ? schedule : [])
    .filter(s => s.date === selectedDateStr && s.status !== 'rejected');

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      if (formData.images.length === 0) {
        alert('請至少附加一張照片作為證明');
        return;
      }

      setIsSubmitting(true);

      const userId = user?.id || user?.userIdString;
      if (!userId) throw new Error("無法辨識教練 ID，請重新登入");

      const insertData = {
        coach_id: userId,
        date: formData.date || selectedDateStr,
        start_time: formData.startTime,
        end_time: formData.endTime,
        type: formData.type,
        category: formData.category,
        student_name: formData.studentNames.filter(n => n.trim()).join(', '), // 儲存合併後的姓名
        student_count: parseInt(formData.studentCount) || 1,
        title: formData.category, // 使用課程類別作為標題
        content: formData.notes,
        location: formData.location || '',
        color: '#FF5C00', // 固定橘色
        is_completed: false,
        status: 'pending', // 設定初始為待審核
        images: formData.images // 儲存照片
      };

      const { error } = await supabase.from('coach_schedule').insert(insertData);
      if (error) throw error;

      setIsAddModalOpen(false);
      // 重置表單
      setFormData({
        ...formData,
        notes: '',
        category: '健身課',
        studentCount: '1',
        studentNames: [''],
        images: []
      });
      fetchSchedule();
      
      // Trigger bot animation
      setLastBotAction('add');
      setTimeout(() => setLastBotAction(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
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

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const dateStr = dateObj.toLocaleDateString('en-CA');
      const isSelected = selectedDateStr === dateStr;
      const isToday = todayStr === dateStr;
      const dailyEvents = (schedule || []).filter(s => s.date === dateStr && s.status !== 'rejected');
      const hasEvents = dailyEvents.length > 0;

      dayCells.push(
        <div
          key={d}
          className={`date-cell ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
          onClick={() => setSelectedDate(dateObj)}
        >
          <span className="date-num">{d}</span>
          {hasEvents && <div className="event-dots">
            {dailyEvents.slice(0, 3).map((ev, idx) => (
              <span
                key={ev.id || idx}
                className="dot"
                style={{ backgroundColor: ev.color || '#FF5C00' }}
              ></span>
            ))}
          </div>}
        </div>
      );
    }

    return (
      <div className="modern-calendar">
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

  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 處理拖動邏輯
  const handleTouchStart = (e) => {
    setDragY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragY;

    // 如果向下拖動且已經收起，或向上拖動且已經展開，則根據阻力調整
    const sheet = document.getElementById('agenda-sheet');
    if (sheet) {
      const moveAmount = isSheetExpanded ? Math.max(0, diff) : Math.min(0, diff);
      sheet.style.transform = `translateY(${moveAmount}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    const sheet = document.getElementById('agenda-sheet');
    if (!sheet) return;

    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - dragY;

    // 門檻值：拖動超過 50px 就切換狀態
    if (Math.abs(diff) > 50) {
      setIsSheetExpanded(diff < 0);
    }
    sheet.style.transform = '';
  };

  return (
    <div className="coach-agenda-view" style={{ backgroundImage: `url(${gymScheduleBg})` }}>
      <div className="bg-overlay"></div>
      <div className="relative-content">
        <div className="agenda-header">
          <div className="tz-info">
            <Globe size={14} />
            <span>Time Zone: <b>Taipei (GMT+8)</b></span>
          </div>
          <button className="user-avatar-btn">
            <div className="avatar-placeholder"></div>
          </button>
        </div>

        <div className="calendar-section">
          {renderCalendar()}
        </div>

        <div
          id="agenda-sheet"
          className={`agenda-section ${isSheetExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="sheet-handle-area">
            <div className="section-divider"></div>
          </div>

          <div className="agenda-content-scroll">
            <div className="agenda-title-row">
              <div className="agenda-dot"></div>
              <h2>{selectedDate.toLocaleDateString('zh-TW', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</h2>
            </div>

            <div className="agenda-list">
              {isLoading ? (
                <div className="empty-agenda"><Loader2 className="animate-spin" size={32} /><p>載入中...</p></div>
              ) : dailyCourses.length === 0 ? (
                <div className="empty-agenda">
                  <Calendar size={48} />
                  <p>今日尚無行程安排</p>
                </div>
              ) : (
                dailyCourses.map((item, idx) => (
                  <div key={item.id || idx} className="agenda-card-premium" style={{ borderLeft: `5px solid ${item.color || '#4FD1C5'}` }}>
                    <div className="card-top-row">
                      <div className="card-type-icon" style={{ color: item.color || '#4FD1C5' }}>
                        <Box size={18} />
                      </div>
                      <span className="card-time">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</span>
                      {item.status === 'pending' && (
                        <div className="status-badge-pending">
                          <span className="pulse-yellow"></span>
                          <span>待審核</span>
                        </div>
                      )}
                      {item.status === 'pending_deletion' && (
                        <div className="status-badge-deleting">
                          <span className="pulse-red"></span>
                          <span>待刪除審核</span>
                        </div>
                      )}
                      <div className="card-actions">
                        <button className="card-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(item.id); }}>
                          <Trash2 size={16} />
                        </button>
                        <button className="card-more-btn"><MoreVertical size={18} /></button>
                      </div>
                    </div>

                    <div className="card-main-content">
                      <h3 className="card-title">{item.title || (item.type === 'course' ? item.category : '未命名行程')}</h3>
                      <p className="card-snippet">{item.content || item.student_name || '無備註資訊'}</p>
                    </div>

                    <div className="card-footer-row">
                      <MapPin size={14} />
                      <span>{item.location || '未設定地點'}</span>
                    </div>

                    {item.is_completed && <div className="card-done-overlay"><CheckCircle2 size={16} /></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <button className="fab-add" onClick={() => setIsAddModalOpen(true)}>
        <Plus size={32} />
      </button>

      <FloatingCoachBot lastAction={lastBotAction} />

      {isDeleteModalOpen && (
        <div className="agenda-modal-overlay">
          <div className="delete-request-container">
            <div className="form-header">
              <button className="form-close" onClick={() => setIsDeleteModalOpen(false)}><X size={24} /></button>
              <h2>確定刪除課程?</h2>
              <button 
                className="form-save-btn red" 
                onClick={handleSubmitDeleteRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : '提交申請'}
              </button>
            </div>
            <div className="form-content">
              <div className="input-field">
                <label className="field-label">請寫上刪除原因</label>
                <textarea
                  placeholder="請在此處描述刪除原因... (必填)"
                  rows="4"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                ></textarea>
              </div>
              <div className="delete-warning">
                <AlertCircle size={16} />
                <span>此課程已通過審核，刪除須經由管理者確認。</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="agenda-modal-overlay">
          <div className="agenda-form-container">
            <div className="form-header">
              <button className="form-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={24} />
              </button>
              <h2>新增行程</h2>
              <button className="form-save-btn" onClick={handleAddCourse} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : '申請'}
              </button>
            </div>

            <div className="form-content">
              <div className="input-field">
                <label className="field-label">課程類別*</label>
                <div className="category-tabs-row">
                  {['健身課', '皮拉提斯', '體驗課', '其他課程'].map(cat => (
                    <button 
                      key={cat} 
                      className={`cat-pill ${formData.category === cat ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, category: cat })}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-field">
                <label className="field-label">備註內容</label>
                <textarea
                  placeholder="備註內容..."
                  rows="3"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="field-group">
                <div className="icon-input">
                  <Calendar size={18} />
                  <input
                    type="date"
                    value={formData.date || selectedDateStr}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-field">
                <label className="field-label">學員人數</label>
                <div className="icon-input">
                  <Users size={18} />
                  <select 
                    className="inline-select"
                    value={formData.studentCount}
                    onChange={(e) => handleStudentCountChange(e.target.value)}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} 人</option>)}
                  </select>
                </div>
              </div>

              <div className="student-names-section animate-in">
                <label className="field-label">學員姓名</label>
                <div className="student-names-grid">
                  {formData.studentNames.map((name, idx) => (
                    <div key={idx} className="icon-row-item">
                      <div className="name-idx-circle">{idx + 1}</div>
                      <input
                        type="text"
                        className="inline-input"
                        placeholder={`點擊輸入第 ${idx + 1} 位姓名`}
                        value={name}
                        onChange={(e) => handleStudentNameChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="time-row">
                <div className="time-input-group">
                  <label className="time-label">上課時間</label>
                  <div className="icon-input">
                    <Clock size={18} />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="time-input-group">
                  <label className="time-label">結束時間</label>
                  <div className="icon-input">
                    <Clock size={18} />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="icon-row-item">
                <MapPin size={18} />
                <input
                  type="text"
                  className="inline-input"
                  placeholder="+ 新增地點"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="input-field">
                <label className="field-label">課程證明照片* (至少一張)</label>
                <div className="photo-upload-container">
                  <div className="photo-preview-scroll">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="preview-box">
                        <img src={img} alt="preview" />
                        <button className="del-img" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}><X size={14} /></button>
                      </div>
                    ))}
                    <label className="add-photo-card">
                      <Camera size={24} />
                      <span>新增</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        hidden 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, images: [...formData.images, reader.result] });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .coach-agenda-view {
            background-color: #000;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            height: 100vh;
            color: #fff;
            font-family: 'Inter', 'Noto Sans TC', sans-serif;
            position: relative;
            overflow: hidden;
        }
        .bg-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.9) 100%);
            backdrop-filter: blur(1px);
            z-index: 1;
        }
        .relative-content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .agenda-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .tz-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.7); }
        .avatar-placeholder { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .modern-calendar { padding: 0 20px; flex-shrink: 0; }
        .cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .m-name { font-size: 20px; font-weight: 800; color: #fff; display: block; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .y-num { font-size: 13px; color: rgba(255,255,255,0.5); }
        .nav-btn { background: rgba(255,255,255,0.05); border: none; padding: 10px; cursor: pointer; color: #fff; border-radius: 12px; }
        .days-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 16px; }
        .day-name { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); }
        .dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .date-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; border-radius: 16px; cursor: pointer; position: relative; color: rgba(255,255,255,0.8); transition: 0.2s; }
        .date-cell.active { background: #FF5C00; color: white; box-shadow: 0 8px 20px rgba(255, 92, 0, 0.4); }
        .date-cell.is-today { font-weight: 800; color: #fff; border: 1.5px solid #FF5C00; }
        .event-dots { position: absolute; bottom: 6px; display: flex; gap: 3px; }
        .dot { width: 4px; height: 4px; border-radius: 50%; }
        
        .agenda-section { 
            background: rgba(18, 18, 18, 0.98); 
            border-radius: 40px 40px 0 0; 
            padding: 0;
            flex: 1;
            margin-top: 20px;
            box-shadow: 0 -15px 40px rgba(0,0,0,0.6); 
            border-top: 1px solid rgba(255,255,255,0.08); 
            position: relative;
            z-index: 10;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            touch-action: none;
        }
        .agenda-section.expanded {
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 0;
            margin-top: 0;
            border-radius: 40px 40px 0 0;
            height: calc(100vh - 60px);
        }
        .agenda-section.dragging {
            transition: none;
        }
        .sheet-handle-area {
            padding: 15px 0 25px;
            cursor: grab;
        }
        .section-divider { width: 40px; height: 5px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 0 auto; }
        
        .agenda-content-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 0 24px 100px;
            touch-action: pan-y;
        }
        .agenda-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .agenda-dot { width: 8px; height: 8px; background: #FF5C00; border-radius: 50%; box-shadow: 0 0 10px rgba(255, 92, 0, 0.5); }
        .agenda-title-row h2 { font-size: 16px; color: rgba(255,255,255,0.7); font-weight: 600; }
        .agenda-list { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 500px; margin: 0 auto; }
        
        .agenda-card-premium {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 16px 20px;
            position: relative;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: transform 0.2s;
        }
        
        .card-top-row {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #A0AEC0;
            font-size: 13px;
            font-weight: 600;
        }
        
        .card-type-icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .card-time {
            flex: 1;
            letter-spacing: 0.5px;
        }
        
        .card-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .card-more-btn, .card-delete-btn {
            background: none;
            border: none;
            color: #CBD5E0;
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: 0.2s;
        }

        .card-delete-btn:hover {
            color: #E53E3E;
            background: rgba(229, 62, 62, 0.1);
        }

        .card-more-btn:hover {
            background: rgba(0,0,0,0.05);
            color: #4A5568;
        }
        
        .card-main-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .card-title {
            font-size: 17px;
            font-weight: 800;
            color: #1A202C;
            margin: 0;
            line-height: 1.3;
        }
        
        .card-snippet {
            font-size: 13px;
            color: #718096;
            margin: 0;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .card-footer-row {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4A5568;
            font-size: 13px;
            font-weight: 600;
            margin-top: 4px;
        }
        
        .card-done-overlay {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #10B981;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
        }

        .empty-agenda { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; color: rgba(255,255,255,0.15); gap: 20px; }
        .fab-add { position: fixed; bottom: 30px; right: 24px; width: 70px; height: 70px; background: #FF5C00; color: white; border: none; border-radius: 22px; display: flex; align-items: center; justify-content: center; z-index: 1000; box-shadow: 0 12px 30px rgba(255, 92, 0, 0.4); cursor: pointer; transition: transform 0.2s; }
        .fab-add:active { transform: scale(0.9); }
        .agenda-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 9999; display: flex; flex-direction: column; animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); align-items: flex-end; justify-content: flex-end; }
        .agenda-form-container, .delete-request-container { background: #1A1A1C; width: 100%; border-top-left-radius: 32px; border-top-right-radius: 32px; padding-bottom: 40px; max-height: 95vh; overflow-y: auto; display: flex; flex-direction: column; }
        .delete-request-container { border-top: 2px solid #E11D48; }

        .form-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: #1A1A1C; z-index: 10; }
        .form-close { background: none; border: none; color: #fff; cursor: pointer; }
        .form-save-btn { background: #FF5C00; color: white; border: none; padding: 10px 28px; border-radius: 14px; font-weight: 800; cursor: pointer; }
        .form-save-btn.red { background: #E11D48; }
        .form-save-btn:disabled { opacity: 0.5; }

        .form-content { flex: 1; padding: 30px 24px; display: flex; flex-direction: column; gap: 24px; }
        
        .input-field { margin-bottom: 8px; }
        .field-label { display: block; color: #888; font-size: 13px; font-weight: 800; margin-bottom: 12px; }
        
        .input-field input { width: 100%; border: none; border-bottom: 1.5px solid rgba(255,255,255,0.1); padding: 12px 0; font-size: 24px; font-weight: 800; outline: none; color: #fff; background: transparent; transition: border-color 0.2s; }
        .input-field input:focus { border-color: #FF5C00; }
        .input-field textarea { width: 100%; border: 1.5px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; font-size: 16px; outline: none; background: #18181B; color: #fff; resize: none; transition: border-color 0.2s; }
        .input-field textarea:focus { border-color: #FF5C00; }
        
        .delete-request-container textarea:focus { border-color: #E11D48; }
        .delete-warning { display: flex; align-items: center; gap: 10px; background: rgba(225, 29, 72, 0.05); padding: 12px; border-radius: 12px; color: #E11D48; font-size: 12px; font-weight: 600; }

        .icon-input { display: flex; align-items: center; gap: 16px; border: 1.5px solid rgba(255,255,255,0.05); padding: 16px 20px; border-radius: 20px; background: #18181B; color: rgba(255,255,255,0.4); }
        .icon-input input { flex: 1; border: none; outline: none; background: transparent; font-weight: 600; color: #fff; font-size: 16px; }
        .icon-row-item { display: flex; align-items: center; gap: 16px; padding: 4px 0; color: rgba(255,255,255,0.6); font-size: 16px; font-weight: 600; }
        .inline-input { flex: 1; border: none; outline: none; background: transparent; color: #fff; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 4px 0; }
        .inline-input:focus { border-color: #FF5C00; }
        
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .type-options-list { display: flex; flex-direction: column; gap: 10px; }
        .type-option-item {
            background: #1A1A1E;
            border: 1.5px solid rgba(255,255,255,0.06);
            border-radius: 18px;
            padding: 18px 22px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .type-option-item:hover { border-color: rgba(255, 92, 0, 0.3); background: rgba(255, 255, 255, 0.02); }
        .type-option-item.selected { 
            border-color: #FF5C00; 
            background: rgba(255, 92, 0, 0.08); 
            box-shadow: 0 4px 20px rgba(255, 92, 0, 0.15);
        }
        .type-info { display: flex; align-items: center; gap: 14px; font-weight: 700; font-size: 17px; color: #fff; }
        .color-indicator { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3); }
        .plus-icon-dim { color: rgba(255,255,255,0.3); }
        .color-picker-mini { width: 30px; height: 30px; border: none; background: none; cursor: pointer; padding: 0; outline: none; }
        
        .custom-title-row { display: flex; align-items: center; gap: 15px; background: #1A1A1E; border: 1.5px solid #FF5C00; border-radius: 18px; padding: 10px 22px; }
        .premium-input-line { flex: 1; background: transparent; border: none; color: #fff; font-size: 19px; font-weight: 700; outline: none; padding: 8px 0; }
        .color-picker-wrapper { display: flex; align-items: center; gap: 8px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px; }
        .palette-icon { color: rgba(255,255,255,0.4); }

        .add-file-btn { margin-left: auto; width: 32px; height: 32px; background: rgba(255,255,255,0.08); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6); }

        .photo-upload-container { margin-top: 8px; }
        .photo-preview-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
        .photo-preview-scroll::-webkit-scrollbar { display: none; }
        .preview-box { width: 80px; height: 80px; border-radius: 14px; position: relative; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .del-img { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .add-photo-card { width: 80px; height: 80px; background: rgba(255,255,255,0.03); border: 1.5px dashed rgba(255,255,255,0.1); border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .add-photo-card:active { transform: scale(0.95); background: rgba(255,255,255,0.05); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Floating Bot UI - Based on User Reference */
        .floating-bot-container {
            position: fixed;
            bottom: 110px;
            right: 24px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 12px;
            z-index: 1100;
            pointer-events: none;
        }
        .floating-bot-container * { pointer-events: auto; }
        
        .bot-speech-bubble {
            background: #FFFFFF;
            border-radius: 20px 20px 4px 20px;
            padding: 16px;
            width: 220px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            position: relative;
            transform-origin: bottom right;
            transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            animation: bounceIn 0.5s ease;
            cursor: pointer;
        }
        @keyframes bounceIn {
            from { opacity: 0; transform: scale(0.5) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .floating-bot-container.hide .bot-speech-bubble {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            pointer-events: none;
        }
        
        .bubble-text {
            color: #2D3748;
            font-size: 15px;
            font-weight: 800;
            margin: 0 0 12px 0;
            line-height: 1.4;
        }
        .bubble-progress {
            height: 24px;
            background: #EDF2F7;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .progress-fill {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            background: #CBD5E0;
            transition: width 0.6s ease;
        }
        .progress-label {
            position: relative;
            z-index: 2;
            font-size: 12px;
            font-weight: 800;
            color: #4A5568;
        }
        
        .bot-trigger-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: center;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .bot-trigger-group:active { transform: scale(0.9); }

        .bot-head-icon {
            width: 48px;
            height: 36px;
            background: #2D3748;
            border: 2px solid #E2E8F0;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .bot-eyes { display: flex; gap: 8px; }
        .eye { width: 5px; height: 5px; background: #FF5C00; border-radius: 50%; box-shadow: 0 0 5px #FF5C00; }
        
        .bot-bottom-icon {
            width: 36px;
            height: 28px;
            background: #2D3748;
            border: 2px solid #E2E8F0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .pulse-icon { color: #FF5C00; }
        
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        /* New Category Tabs Styles */
        .category-tabs-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .cat-pill { padding: 8px 16px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #888; font-size: 13px; font-weight: 700; transition: 0.2s; }
        .cat-pill.active { background: rgba(255, 92, 0, 0.1); border-color: #FF5C00; color: #FF5C00; }
        .req-msg { font-size: 11px; color: #FF5C00; font-weight: 800; margin-left: 8px; }
        
        .inline-select { flex: 1; border: none; outline: none; background: transparent; color: #fff; font-size: 16px; min-height: 24px; cursor: pointer; }
        .inline-select option { background-color: #1a1a1e; color: #fff; }
        .student-names-section { display: flex; flex-direction: column; gap: 12px; }
        .student-names-grid { display: flex; flex-direction: column; gap: 4px; padding-left: 8px; }
        .name-idx-circle { width: 20px; height: 20px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #FF5C00; flex-shrink: 0; }
        
        /* Pending Status Styles */
        .status-badge-pending { display: flex; align-items: center; gap: 6px; background: rgba(255, 184, 0, 0.1); color: #FFB800; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; border: 1px solid rgba(255, 184, 0, 0.2); }
        .pulse-yellow { width: 6px; height: 6px; background: #FFB800; border-radius: 50%; animation: blink-yellow 1s infinite; box-shadow: 0 0 8px #FFB800; }
        @keyframes blink-yellow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.8); } }

        .status-badge-deleting {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(225, 29, 72, 0.1);
          padding: 4px 10px;
          border-radius: 8px;
        }
        .status-badge-deleting span:nth-child(2) { color: #E11D48; font-size: 11px; font-weight: 800; }
        .pulse-red {
          width: 8px; height: 8px; background: #E11D48; border-radius: 50%;
          box-shadow: 0 0 10px #E11D48;
          animation: beat 1.5s infinite;
        }
        @keyframes beat { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

// 最終導出的組件封裝了 ErrorBoundary
const CoachSchedule = (props) => (
  <ErrorBoundary>
    <CoachScheduleContent {...props} />
  </ErrorBoundary>
);

export default CoachSchedule;
