import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Camera,
  Utensils,
  Check,
  X,
  Image as ImageIcon,
  Clock,
  MoreVertical,
  Activity,
  Trash2,
  Calendar,
  Layers,
  List,
  Info
} from 'lucide-react';

const RecordsPage = () => {
  const [habits, setHabits] = useState([
    { id: '1', name: '重訓', color: '#FF6B00' },
    { id: '2', name: '有氧', color: '#10B981' },
    { id: '3', name: '喝水', color: '#3B82F6' },
  ]);
  const [records, setRecords] = useState([]); // { id, habitId, startTime, endTime, type: 'habit' | 'diet', dietData?, date }
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', color: '#FF6B00' });
  
  // Navigation & View State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date()); // For calendar browsing grid
  const [showTimeline, setShowTimeline] = useState(false);
  const [completedHabits, setCompletedHabits] = useState({}); // { '2026-03-17': ['habitId1', 'habitId2'] }
  
  // Modals & Popovers
  const [viewedFood, setViewedFood] = useState(null);
  const [showActionPopover, setShowActionPopover] = useState(false);
  const [selection, setSelection] = useState(null); // { start, end }
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietForm, setDietForm] = useState({ photo: null, note: '' });
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [selectedReportWeek, setSelectedReportWeek] = useState(new Date());

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const timelineRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Helper: Same Day Check
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  // Habit Logic
  const handleAddHabit = () => {
    if (!newHabit.name) return;
    setHabits([...habits, { ...newHabit, id: Date.now().toString() }]);
    setNewHabit({ name: '', color: '#FF6B00' });
    setShowAddHabit(false);
  };

  const deleteHabit = (id) => {
    if (window.confirm('確定要刪除此習慣嗎？相關的歷史紀錄也會一併移除。')) {
      setHabits(habits.filter(h => h.id !== id));
      setRecords(records.filter(r => r.habitId !== id));
    }
  };

  const toggleHabitCompletion = (habitId) => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const currentCompleted = completedHabits[dateKey] || [];
    if (currentCompleted.includes(habitId)) {
      setCompletedHabits({
        ...completedHabits,
        [dateKey]: currentCompleted.filter(id => id !== habitId)
      });
    } else {
      setCompletedHabits({
        ...completedHabits,
        [dateKey]: [...currentCompleted, habitId]
      });
    }
  };

  // Timeline Selection Logic
  const handleTimeDown = (hour) => {
    const isInside = selection &&
      hour >= Math.min(selection.start, selection.end) &&
      hour <= Math.max(selection.start, selection.end);

    if (!isInside) {
      setIsSelecting(true);
      setSelection({ start: hour, end: hour });
      setShowActionPopover(false);
    } else {
      setIsSelecting(false);
    }
  };

  const handleTimeEnter = (hour) => {
    if (isSelecting && selection) {
      setSelection({ ...selection, end: hour });
    }
  };

  const handleTimeUp = () => setIsSelecting(false);

  const handleTouchMove = (e) => {
    if (!isSelecting) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const slot = el?.closest('.time-slot');
    if (slot) {
      const hour = parseInt(slot.getAttribute('data-hour'));
      if (!isNaN(hour)) setSelection(prev => ({ ...prev, end: hour }));
    }
  };

  const handleTimeClick = (hour) => {
    const isInside = selection && hour >= Math.min(selection.start, selection.end) && hour <= Math.max(selection.start, selection.end);
    if (isInside) {
      const existingDiet = records.find(r => r.type === 'diet' && hour >= r.startTime && hour <= r.endTime && isSameDay(r.date, selectedDate));
      if (existingDiet) {
        setViewedFood(existingDiet);
        return;
      }
      setShowActionPopover(true);
    } else {
      setSelection({ start: hour, end: hour });
      setShowActionPopover(false);
    }
  };

  const addHabitRecord = (habitId) => {
    const newRecord = {
      id: Date.now().toString(),
      date: new Date(selectedDate),
      habitId,
      startTime: Math.min(selection.start, selection.end),
      endTime: Math.max(selection.start, selection.end),
      type: 'habit'
    };
    setRecords([...records, newRecord]);
    setSelection(null);
    setShowActionPopover(false);
  };

  const submitDiet = () => {
    if (!dietForm.photo && !dietForm.note) {
      alert('請至少填寫備註或上傳一張照片');
      return;
    }
    const newRecord = {
      id: Date.now().toString(),
      date: new Date(selectedDate),
      startTime: Math.min(selection.start, selection.end),
      endTime: Math.max(selection.start, selection.end),
      type: 'diet',
      dietData: { ...dietForm }
    };
    setRecords([...records, newRecord]);
    setSelection(null);
    setShowActionPopover(false);
    setShowDietModal(false);
    setDietForm({ photo: null, note: '' });
  };

  const getWeekDays = (baseDate) => {
    const curr = new Date(baseDate);
    const day = curr.getDay(); // 0 is Sun, 1 is Mon
    const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
    const startOfWeek = new Date(curr.setDate(curr.getDate() + diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedReportWeek);

  // Calendar Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay: (firstDay + 6) % 7, totalDays }; // Mon-Sun
  };

  const { firstDay, totalDays } = getDaysInMonth(currentMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  useEffect(() => {
    const handleGlobalUp = () => setIsSelecting(false);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, []);

  return (
    <div className="records-page">
      {showTimeline ? (
        /* Detailed Schedule View (24h Timeline) */
        <div className="timeline-view">
          <div className="view-header">
            <button className="back-to-calendar" onClick={() => setShowTimeline(false)}>
              <ChevronLeft size={20} /> 返回行事曆
            </button>
            <h2 className="title">{selectedDate.getMonth() + 1}/{selectedDate.getDate()} 日間排程</h2>
          </div>

          <div className="timeline-container" ref={timelineRef}>
            <div className="timeline-labels">
              {hours.map(h => (
                <div key={h} className="hour-label">{`${h.toString().padStart(2, '0')}:00`}</div>
              ))}
            </div>
            <div className="timeline-slots">
              {hours.map(h => {
                const isSelected = selection && h >= Math.min(selection.start, selection.end) && h <= Math.max(selection.start, selection.end);
                return (
                  <div
                    key={h}
                    data-hour={h}
                    className={`time-slot ${isSelected ? 'selected' : ''}`}
                    onMouseDown={() => handleTimeDown(h)}
                    onMouseEnter={() => handleTimeEnter(h)}
                    onMouseUp={handleTimeUp}
                    onTouchStart={(e) => {
                      const isInside = selection && h >= Math.min(selection.start, selection.end) && h <= Math.max(selection.start, selection.end);
                      if (!isInside) {
                        e.preventDefault();
                        handleTimeDown(h);
                      } else {
                        handleTimeDown(h);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (isSelecting) e.preventDefault();
                      handleTouchMove(e);
                    }}
                    onTouchEnd={handleTimeUp}
                    onClick={() => handleTimeClick(h)}
                    style={{ userSelect: 'none', touchAction: 'pan-x' }}
                  />
                );
              })}

              {/* Records Overlay */}
              <div className="records-overlay">
                {(() => {
                  const dayRecords = records.filter(r => isSameDay(r.date, selectedDate));
                  const sorted = [...dayRecords].sort((a, b) => a.startTime - b.startTime || (b.endTime - b.startTime) - (a.endTime - a.startTime));
                  const lanes = [];
                  const rendered = sorted.map(r => {
                    let laneIndex = 0;
                    while (lanes[laneIndex] && lanes[laneIndex].some(other => (r.startTime >= other.startTime && r.startTime <= other.endTime) || (other.startTime >= r.startTime && other.startTime <= r.endTime))) {
                      laneIndex++;
                    }
                    if (!lanes[laneIndex]) lanes[laneIndex] = [];
                    lanes[laneIndex].push(r);
                    return { ...r, lane: laneIndex };
                  });

                  return rendered.map(r => {
                    const habit = r.type === 'habit' ? habits.find(h => h.id === r.habitId) : null;
                    const color = r.type === 'diet' ? '#FFD700' : (habit?.color || '#FF6B00');
                    const totalLanes = lanes.length;
                    
                    return (
                      <div 
                        key={r.id} 
                        className="timeline-card"
                        onClick={(e) => { e.stopPropagation(); if (r.type === 'diet') setViewedFood(r); }}
                        style={{
                          top: r.startTime * 50 + 2,
                          height: (r.endTime - r.startTime + 1) * 50 - 4,
                          left: (r.lane / totalLanes) * 100 + '%',
                          width: (100 / totalLanes) - 1 + '%',
                          backgroundColor: color + '15',
                          borderLeft: `4px solid ${color}`
                        }}
                      >
                        <div className="card-content">
                          <span className="card-title" style={{ color: color }}>
                            {r.type === 'diet' ? '飲食紀錄' : habit?.name}
                          </span>
                          <span className="card-time">
                            <Clock size={10} /> {r.startTime}:00 - {r.endTime + 1}:00
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Entry View: Calendar + Checklist */
        <div className="calendar-view">
          <div className="records-header">
            <div className="title-row">
              <h2 className="title">我的習慣紀錄</h2>
              <button className="xp-info-btn" onClick={() => alert('完成習慣記錄可獲得 XP 獎勵！(正在開發中)')}>
                <Info size={16} /> 如何獲得XP
              </button>
            </div>
            <button className="add-habit-main-btn" onClick={() => setShowAddHabit(true)}>
              <Plus size={20} /> 新增習慣
            </button>
          </div>

          {/* Month Stepper */}
          <div className="month-picker">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
              <ChevronLeft size={24} />
            </button>
            <span className="current-month-label">
              {currentMonth.toLocaleString('en-US', { month: 'long' })} {currentMonth.getFullYear()}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Month Grid */}
          <div className="calendar-grid-box">
            <div className="weekday-row">
              {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="weekday">{d}</div>)}
            </div>
            <div className="days-grid-body">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`calendar-day ${!day ? 'empty' : ''} ${day && isSameDay(day, selectedDate) ? 'selected' : ''} ${day && isSameDay(day, new Date()) ? 'today' : ''}`}
                  onClick={() => {
                    if (!day) return;
                    setSelectedDate(day);
                    if (isSameDay(day, new Date())) {
                      setShowTimeline(true);
                    } else {
                      alert('只能登記當天的排程紀錄');
                    }
                  }}
                >
                  {day && (
                    <>
                      <span className="day-number">{day.getDate()}</span>
                      {records.some(r => isSameDay(r.date, day)) && <div className="day-dot"></div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Habit Checklist Section */}
          <div className="habit-checklist-container">
            <div className="checklist-header">
              <h3>習慣紀錄表</h3>
              <button className="view-details-btn" onClick={() => setShowTimeline(true)}>
                今日排程 <ChevronRight size={16} />
              </button>
            </div>
            <div className="habits-list">
              {habits.length === 0 ? (
                <div className="empty-habits">尚未設定習慣，請點擊上方新增</div>
              ) : (
                habits.map(h => {
                  return (
                    <div key={h.id} className="habit-check-item">
                      <div className="habit-indicator-box" style={{ borderColor: h.color }}>
                        <div className="inner-dot" style={{ backgroundColor: h.color }}></div>
                      </div>
                      <span className="habit-label-name">{h.name}</span>
                      <div className="habit-actions-area">
                        <div className="habit-vertical-line" style={{ backgroundColor: h.color }}></div>
                        <button className="delete-habit-icon" onClick={(e) => { e.stopPropagation(); deleteHabit(h.id); }}>
                           <Trash2 size={14} color="#E11D48" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="diet-hint-box">
              <Utensils size={14} />
              <span>小撇步：新增飲食紀錄功能可供使用</span>
            </div>

            <button className="generate-weekly-btn" onClick={() => setShowWeeklyReport(true)}>
              <Calendar size={18} /> 產生周紀錄回顧
            </button>
          </div>
        </div>
      )}

      {/* Weekly Report Modal */}
      {showWeeklyReport && (
        <div className="modal-overlay full-screen" onClick={() => setShowWeeklyReport(false)}>
          <div className="weekly-report-container" onClick={e => e.stopPropagation()}>
            <div className="report-header">
              <div className="header-info">
                <h2>周計畫回顧回報表</h2>
                <span>{weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}</span>
              </div>
              <button className="close-report-btn" onClick={() => setShowWeeklyReport(false)}><X size={24} /></button>
            </div>

            <div className="report-content">
              <div className="report-time-labels">
                {hours.filter(h => h % 2 === 0).map(h => (
                  <div key={h} className="report-hour-label">{`${h.toString().padStart(2, '0')}:00`}</div>
                ))}
              </div>
              <div className="report-grid">
                {weekDays.map((day, dIdx) => {
                  const dayRecords = records.filter(r => isSameDay(r.date, day));
                  return (
                    <div key={dIdx} className="report-day-column">
                      <div className="report-day-header">
                        <span className="day-name">{['一', '二', '三', '四', '五', '六', '日'][dIdx]}</span>
                        <span className="day-date">{day.getDate()}</span>
                      </div>
                      <div className="report-day-timeline">
                        {dayRecords.map(r => {
                          const habit = r.type === 'habit' ? habits.find(h => h.id === r.habitId) : null;
                          const color = r.type === 'diet' ? '#FFD700' : (habit?.color || '#FF6B00');
                          return (
                            <div 
                              key={r.id} 
                              className="report-record-bar"
                              style={{
                                top: (r.startTime / 24) * 100 + '%',
                                height: ((r.endTime - r.startTime + 1) / 24) * 100 + '%',
                                backgroundColor: color
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="report-footer">
              <div className="footer-stat">
                <div className="stat-dot" style={{ backgroundColor: 'var(--primary)' }}></div>
                <span>習慣紀錄</span>
                <div className="stat-dot" style={{ backgroundColor: '#FFD700', marginLeft: '12px' }}></div>
                <span>飲食紀錄</span>
              </div>
              <button className="download-report-btn" onClick={() => alert('報表已存入相簿 (模擬效果)')}>
                下載保存圖片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Popover */}
      {showActionPopover && selection && (
        <div className="action-popover" style={{ top: `${Math.min(selection.start, selection.end) * 50 + 140}px` }}>
          <div className="popover-header">
            <span>選擇紀錄項目 ({Math.min(selection.start, selection.end)}:00 - {Math.max(selection.start, selection.end)}:00)</span>
            <button onClick={() => { setShowActionPopover(false); setSelection(null); }}><X size={16} /></button>
          </div>
          <div className="habit-selector">
            {habits.map(h => (
              <button key={h.id} className="habit-select-btn" onClick={() => addHabitRecord(h.id)}>
                <span style={{ color: h.color }}>●</span> {h.name}
              </button>
            ))}
          </div>
          <div className="divider"></div>
          <button className="diet-record-btn" onClick={() => { setShowDietModal(true); setShowActionPopover(false); }}>
            <Utensils size={16} /> 紀錄飲食
          </button>
        </div>
      )}

      {/* View Food Detail Modal */}
      {viewedFood && (
        <div className="modal-overlay" onClick={() => setViewedFood(null)}>
          <div className="modal-content diet-detail-popup" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h3>飲食紀錄細節</h3>
              <button onClick={() => setViewedFood(null)}><X size={20} /></button>
            </div>
            <div className="popup-body">
              <div className="diet-time-badge">
                <Clock size={14} /> {viewedFood.startTime}:00 - {viewedFood.endTime}:00
              </div>
              {viewedFood.dietData.photo ? (
                <img src={viewedFood.dietData.photo} alt="Food" className="detail-photo" />
              ) : (
                <div className="no-photo-placeholder"><ImageIcon size={48} /><span>未提供照片</span></div>
              )}
              <div className="detail-note-box">
                <label>備註內容</label>
                <p>{viewedFood.dietData.note || '無備註資訊'}</p>
              </div>
            </div>
            <button className="close-btn-full" onClick={() => setViewedFood(null)}>關閉視窗</button>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>新增習慣項目</h3>
            <div className="form-group">
              <label>習慣名稱</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="例如: 伸展、讀書..."
              />
            </div>
            <div className="form-group">
              <label>標記顏色</label>
              <div className="single-color-picker-row">
                <div className="color-preview-circle" style={{ backgroundColor: newHabit.color }}>
                  <input
                    type="color"
                    className="hidden-native-picker"
                    value={newHabit.color}
                    onChange={e => setNewHabit({ ...newHabit, color: e.target.value })}
                  />
                </div>
                <span className="color-picker-prompt">選擇標籤顏色</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btns" onClick={() => setShowAddHabit(false)}>取消</button>
              <button className="confirm-btns" onClick={handleAddHabit}>新增</button>
            </div>
          </div>
        </div>
      )}

      {/* Diet Record Modal */}
      {showDietModal && (
        <div className="modal-overlay">
          <div className="modal-content diet-modal">
            <h3>紀錄飲食內容</h3>
            <div className="diet-upload-zone" onClick={() => alert('此為功能演示，請在手機端開啟相機')}>
              <ImageIcon size={32} />
              <span>貼上照片或開啟相機</span>
            </div>
            <div className="form-group">
              <label>備註</label>
              <textarea
                value={dietForm.note}
                onChange={e => setDietForm({ ...dietForm, note: e.target.value })}
                placeholder="吃了什麼？心情如何？"
              />
            </div>
            <div className="modal-footer">
              <button className="cancel-btns" onClick={() => setShowDietModal(false)}>返回</button>
              <button className="confirm-btns orange" onClick={submitDiet}>送出紀錄</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .records-page {
          padding: 20px 16px 100px;
          background: var(--background);
          min-height: 100vh;
          position: relative;
        }
        .records-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .title-row { display: flex; flex-direction: column; gap: 4px; }
        .title { font-size: 22px; font-weight: 800; color: white; }
        .xp-info-btn { 
          background: rgba(255,107,0,0.1); 
          color: var(--primary); 
          border: none; 
          padding: 4px 8px; 
          border-radius: 6px; 
          font-size: 11px; 
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .add-habit-main-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Calendar View Styles */
        .month-picker {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
          background: rgba(26, 26, 28, 0.7);
          backdrop-filter: blur(10px);
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .month-picker button { background: none; border: none; color: var(--primary); display: flex; align-items: center; cursor: pointer; }
        .current-month-label { font-size: 16px; font-weight: 850; color: white; min-width: 140px; text-align: center; }

        .calendar-grid-box {
          background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/gym-bg.png');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 24px;
          padding: 16px;
          margin-bottom: 24px;
          overflow: hidden;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.6);
        }
        .weekday { flex: 1; text-align: center; font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
        .day-number { font-size: 15px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.9); }
        .calendar-day.selected .day-number { text-shadow: none; }
        .weekday-row { display: flex; margin-bottom: 12px; }
        .days-grid-body { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          transition: 0.2s;
        }
        .calendar-day.empty { cursor: default; }
        .calendar-day.selected { background: var(--primary); color: white; }
        .calendar-day.today .day-number { color: var(--primary); font-weight: 900; border-bottom: 2px solid var(--primary); }
        .calendar-day.selected.today .day-number { color: white; border-bottom: none; }
        .day-number { font-size: 15px; font-weight: 700; color: #ccc; }
        .day-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--primary); position: absolute; bottom: 4px; }
        .calendar-day.selected .day-dot { background: white; }

        /* Habit Checklist Section */
        .habit-checklist-container {
          background: rgba(26, 26, 27, 0.6);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 20px;
        }
        .checklist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .checklist-header h3 { font-size: 16px; font-weight: 800; color: white; }
        .view-details-btn { 
          background: rgba(255,107,0,0.1); 
          border: none; 
          color: var(--primary); 
          padding: 6px 12px; 
          border-radius: 100px; 
          font-size: 12px; 
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .habit-check-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: 0.2s;
        }
        .habit-check-item:active { background: rgba(255,255,255,0.02); }
        .habit-check-item:last-child { border-bottom: none; }
        
        .habit-indicator-box {
          width: 24px;
          height: 24px;
          border: 2px solid transparent;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }

        .habit-label-name { flex: 1; font-size: 15px; color: white; font-weight: 700; transition: 0.2s; }
        .habit-actions-area { display: flex; align-items: center; gap: 12px; }
        .habit-vertical-line { width: 3px; height: 16px; border-radius: 4px; }
        .delete-habit-icon { background: none; border: none; padding: 4px; opacity: 0.5; transition: 0.2s; }
        .delete-habit-icon:hover { opacity: 1; }

        .timeline-view { 
          animation: fadeIn 0.3s ease; 
          padding-top: 10px;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .view-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-top: 10px; }
        .back-to-calendar { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 8px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .timeline-view .title { font-size: 18px; margin: 0; }

        .timeline-container {
          display: flex;
          border-radius: 20px;
          background: rgba(21, 21, 22, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          margin-top: 10px;
        }
        .timeline-labels { width: 60px; background: rgba(26, 26, 28, 0.5); padding: 0; border-right: 1px solid rgba(255,255,255,0.05); }
        .hour-label { height: 50px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--primary); font-weight: 800; }
        .timeline-slots { flex: 1; position: relative; }
        .time-slot { height: 50px; border-bottom: 1px solid rgba(255,255,255,0.03); position: relative; }
        .time-slot.selected { background: rgba(255, 107, 0, 0.1); }
        
        .records-overlay { 
          position: absolute; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          pointer-events: none; 
          width: 100%;
        }
        .timeline-card {
          position: absolute;
          border-radius: 8px;
          padding: 8px;
          pointer-events: auto;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          transition: 0.2s;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
          z-index: 5;
        }
        .timeline-card:active { transform: scale(0.98); }
        .card-content { display: flex; flex-direction: column; gap: 2px; }
        .card-title { font-size: 12px; font-weight: 850; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-time { font-size: 10px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 4px; }

        .diet-marker { position: absolute; right: 10px; top: 10px; background: rgba(255,215,0,0.1); padding: 4px 8px; border-radius: 100px; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,215,0,0.3); z-index: 2; }
        .diet-label { font-size: 10px; color: #FFD700; font-weight: 800; }

        /* Shared Components */
        .action-popover {
          position: absolute; left: 80px; right: 20px; background: #1e1e20; border-radius: 18px; padding: 16px; border: 1px solid var(--primary); box-shadow: 0 12px 30px rgba(0,0,0,0.5); z-index: 200;
          animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        @keyframes popIn { from { opacity: 0; scale: 0.9; transform: translateY(20px); } to { opacity: 1; scale: 1; transform: translateY(0); } }
        .popover-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #888; margin-bottom: 12px; }
        .popover-header button { background: none; border: none; color: #888; }
        .habit-selector { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .habit-select-btn { background: #1a1a1c; border: 1px solid #333; padding: 10px; border-radius: 10px; color: white; font-size: 13px; font-weight: 600; text-align: left; }
        .divider { height: 1px; background: #333; margin: 12px 0; }
        .diet-record-btn { width: 100%; background: rgba(255,215,0,0.1); color: #FFD700; border: 1px dashed #FFD700; padding: 12px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
        .modal-content { background: #1a1a1c; width: 100%; max-width: 400px; border-radius: 28px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); }
        .popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .popup-header h3 { font-size: 18px; color: white; }
        .popup-header button { background: none; border: none; color: white; }
        .diet-detail-popup { max-height: 90vh; overflow-y: auto; }
        .diet-time-badge { background: rgba(255,215,0,0.1); color: #FFD700; padding: 6px 12px; border-radius: 100px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 16px; }
        .detail-photo { width: 100%; border-radius: 16px; margin-bottom: 20px; }
        .no-photo-placeholder { height: 180px; background: #222; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #444; gap: 8px; margin-bottom: 20px; }
        .detail-note-box { background: #222; padding: 12px; border-radius: 12px; }
        .detail-note-box label { font-size: 11px; color: #666; display: block; margin-bottom: 4px; }
        .detail-note-box p { color: #ccc; font-size: 14px; }
        .close-btn-full { width: 100%; margin-top: 20px; background: #333; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 13px; color: #555; margin-bottom: 8px; font-weight: 700; }
        .form-group input, .form-group textarea { width: 100%; background: #151516; border: 1px solid #333; border-radius: 12px; padding: 14px; color: white; outline: none; }
        .single-color-picker-row { display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .color-preview-circle { width: 44px; height: 44px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.1); position: relative; cursor: pointer; }
        .hidden-native-picker { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .modal-footer { display: flex; gap: 12px; margin-top: 24px; }
        .cancel-btns, .confirm-btns { flex: 1; padding: 14px; border-radius: 14px; font-weight: 800; cursor: pointer; border: none; }
        .cancel-btns { background: #333; color: white; }
        .confirm-btns { background: var(--primary); color: white; }
        .confirm-btns.orange { background: #FF6B00; }

        .diet-upload-zone { height: 160px; background: #222; border: 2px dashed #444; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; gap: 8px; margin-bottom: 20px; }
        .empty-habits { padding: 40px 0; text-align: center; color: #555; font-size: 14px; font-weight: 700; }

        .diet-hint-box {
          margin-top: 20px;
          background: rgba(255, 215, 0, 0.05);
          border: 1px dashed rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #FFD700;
          font-size: 13px;
          font-weight: 600;
        }

        .generate-weekly-btn {
          width: 100%;
          margin-top: 20px;
          background: linear-gradient(135deg, #1e1e20, #2a2a2d);
          color: #ccc;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 16px;
          border-radius: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        /* Weekly Report Modal Style */
        .modal-overlay.full-screen { padding: 0; align-items: flex-end; }
        .weekly-report-container {
          background: #151516;
          width: 100%;
          height: 90vh;
          border-radius: 32px 32px 0 0;
          display: flex;
          flex-direction: column;
          padding: 24px;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 3000;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .header-info h2 { font-size: 24px; color: white; margin: 0 0 4px 0; }
        .header-info span { color: #555; font-weight: 700; font-size: 14px; }
        .close-report-btn { background: none; border: none; color: #555; }

        .report-content {
          flex: 1;
          display: flex;
          gap: 10px;
          padding-bottom: 20px;
          overflow: hidden;
        }
        .report-time-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 45px 0 0 0;
          color: #444;
          font-size: 10px;
          font-weight: 800;
          width: 35px;
        }
        .report-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          height: 100%;
        }
        .report-day-column {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .report-day-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 0;
          background: rgba(255,255,255,0.03);
          border-radius: 8px 8px 0 0;
        }
        .day-name { font-size: 11px; color: #666; font-weight: 800; }
        .day-date { font-size: 16px; color: white; font-weight: 900; }
        
        .report-day-timeline {
          flex: 1;
          position: relative;
          margin: 4px;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
        }
        .report-record-bar {
          position: absolute;
          left: 0;
          right: 0;
          border-radius: 2px;
          min-height: 4px;
        }

        .report-footer {
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .footer-stat { display: flex; align-items: center; font-size: 12px; color: #666; font-weight: 700; justify-content: center; }
        .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
        .download-report-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 16px;
          font-weight: 850;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default RecordsPage;
