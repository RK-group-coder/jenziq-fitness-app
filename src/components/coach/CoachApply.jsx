import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, CheckCircle2, AlertCircle,
  X, Upload, Image as ImageIcon, Loader2, Send,
  ChevronRight, Info, Award, Zap, Trophy, TrendingUp
} from 'lucide-react';
import { supabase } from '../../supabase';

const CoachApply = ({ user }) => {
  const [activeTab, setActiveTab] = useState('xp'); // 'leave' or 'xp'
  const [activeXpType, setActiveXpType] = useState('weekly'); // 'weekly', 'event', 'cert'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 資料列表
  const [records, setRecords] = useState([]);
  const [xpRules, setXpRules] = useState({});

  // 表單狀態
  const [leaveData, setLeaveData] = useState({ startAt: '', endAt: '', leaveType: '事假', reason: '', images: [] });
  const [xpFormData, setXpFormData] = useState({
    lessonsCount: '',
    applyXp: '',
    notes: '',
    certName: '',
    organization: '',
    certCategory: '四大證照',
    obtainedDate: '',
    expiryDate: '',
    images: []
  });

  const CERT_CATEGORIES = [
    { label: '四大證照 (+5000 XP)', value: '四大證照', xp: 5000 },
    { label: '運動相關證照 (+1000 XP)', value: '運動相關證照', xp: 1000 },
    { label: '短期證照 (+400 XP)', value: '短期證照', xp: 400 },
    { label: '研習證書 (+250 XP)', value: '研習證書', xp: 250 }
  ];

  const [previews, setPreviews] = useState([]);

  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
    fetchRules();
  }, [activeTab]);

  const fetchRules = async () => {
    const { data } = await supabase.from('coach_xp_rules').select('*');
    if (data) {
      const rulesObj = {};
      data.forEach(r => { rulesObj[r.category] = r.xp_value; });
      setXpRules(rulesObj);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'leave') {
        const { data, error } = await supabase
          .from('coach_leaves')
          .select('*')
          .eq('coach_email', user?.email)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRecords(data || []);
      } else {
        const { data, error } = await supabase
          .from('coach_xp_applications')
          .select('*')
          .eq('coach_email', user?.email)
          .order('created_at', { ascending: false });
        // 同時抓證照
        const { data: certs } = await supabase
          .from('coach_certifications')
          .select('*')
          .eq('coach_email', user?.email);

        const combined = [
          ...(data || []).map(d => ({ ...d, isXpApp: true })),
          ...(certs || []).map(c => ({ ...c, isCert: true, apply_xp: 0, type: 'cert' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setRecords(combined);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const currentImages = activeTab === 'leave' ? leaveData.images : xpFormData.images;

    if (currentImages.length + files.length > 5) {
      alert('最多只能上傳 5 張照片');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);

    if (activeTab === 'leave') {
      setLeaveData({ ...leaveData, images: [...leaveData.images, ...files] });
    } else {
      setXpFormData({ ...xpFormData, images: [...xpFormData.images, ...files] });
    }
  };

  const removeImage = (index) => {
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);

    if (activeTab === 'leave') {
      const newImages = [...leaveData.images];
      newImages.splice(index, 1);
      setLeaveData({ ...leaveData, images: newImages });
    } else {
      const newImages = [...xpFormData.images];
      newImages.splice(index, 1);
      setXpFormData({ ...xpFormData, images: newImages });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 驗證
      const files = activeTab === 'leave' ? leaveData.images : xpFormData.images;
      if (files.length === 0) throw new Error('請至少上傳一張證明照片');

      // 1. 上傳照片
      const imageUrls = [];
      const bucketName = 'student-dashboard-image';
      const folder = activeTab === 'leave' ? 'leaves' : 'xp-apps';

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const safeName = Math.random().toString(36).substring(2, 10);
        const fileName = `${folder}-${Date.now()}-${safeName}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`${folder}/${fileName}`, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${folder}/${fileName}`);
        imageUrls.push(publicUrl);
      }

      // 2. 寫入資料庫
      if (activeTab === 'leave') {
        const { error } = await supabase.from('coach_leaves').insert({
          coach_email: user?.email,
          coach_name: user?.profile?.name || '教練',
          start_at: leaveData.startAt,
          end_at: leaveData.endAt,
          leave_type: leaveData.leaveType,
          reason: leaveData.reason,
          proof_images: imageUrls,
          status: '待審核'
        });
        if (error) throw error;
      } else if (activeXpType === 'cert') {
        const selectedCategory = CERT_CATEGORIES.find(c => c.value === xpFormData.certCategory) || CERT_CATEGORIES[0];
        
        const { error } = await supabase.from('coach_certifications').insert({
          coach_email: user?.email,
          coach_name: user?.profile?.name || '教練',
          cert_name: xpFormData.certName,
          organization: xpFormData.organization,
          category: xpFormData.certCategory,
          xp_reward: selectedCategory.xp,
          obtained_date: xpFormData.obtainedDate,
          expiry_date: xpFormData.expiryDate || null,
          proof_images: imageUrls,
          status: '待審核'
        });
        if (error) throw error;
      } else {
        const calculatedXp = activeXpType === 'weekly'
          ? parseInt(xpFormData.lessonsCount) * (xpRules.lesson || 10)
          : parseInt(xpFormData.applyXp);

        const { error } = await supabase.from('coach_xp_applications').insert({
          coach_email: user?.email,
          type: activeXpType,
          lessons_count: activeXpType === 'weekly' ? parseInt(xpFormData.lessonsCount) : null,
          apply_xp: calculatedXp,
          notes: xpFormData.notes,
          images: imageUrls,
          status: '待審核'
        });
        if (error) throw error;
      }

      alert('申請已送出');
      setIsModalOpen(false);
      resetForm();
      fetchRecords();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeaveData({ startAt: '', endAt: '', leaveType: '事假', reason: '', images: [] });
    setXpFormData({ lessonsCount: '', applyXp: '', notes: '', certName: '', organization: '', certCategory: '四大證照', obtainedDate: '', expiryDate: '', images: [] });
    setPreviews([]);
  };

  const totalExpectedXp = (activeTab === 'xp' ? records : []).reduce((sum, r) => {
    if (r.status === '已退件' || r.status === '未通過') return sum;
    return sum + (r.apply_xp || r.xp_reward || 0);
  }, 0);
  const approvedCount = (activeTab === 'xp' ? records : []).filter(r => r.status === '核准' || r.status === '已核准').length;
  
  const counts = {
    weekly: records.filter(r => !r.isCert && r.type === 'weekly').length,
    event: records.filter(r => !r.isCert && r.type === 'event').length,
    cert: records.filter(r => r.isCert).length,
  };

  const visibleRecords = activeTab === 'leave' ? records : records.filter(r => {
    if (activeXpType === 'cert') return r.isCert;
    if (activeXpType === 'weekly') return r.type === 'weekly';
    if (activeXpType === 'event') return r.type === 'event';
    return true;
  });

  return (
    <div className="coach-apply">
      <header className="page-header">
        <div className="breadcrumb">
            <span className="dim">請假申請</span>
            <ChevronRight size={12} className="dim" />
            <span className="highlight">XP 點數申請與審核</span>
        </div>
        <h2 className="page-title">申請管理</h2>
      </header>

      <div className="apply-content">
        {activeTab === 'xp' && (
          <div className="summary-card">
            <div className="summary-left">
              <p className="summary-label">本頁預計獲得</p>
              <h3 className="summary-value">+{totalExpectedXp.toLocaleString()} <span className="xp-unit">XP</span></h3>
            </div>
            <div className="summary-right">
              <div className="summary-badge green">
                  <CheckCircle2 size={14} />
                  <span>{approvedCount} 筆已核准</span>
              </div>
              <div className="summary-badge dark">
                  <TrendingUp size={14} />
                  <span>本月成長</span>
              </div>
            </div>
          </div>
        )}

        <div className="main-tabs">
          <button className={`main-tab-btn ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')}>
            <Clock size={16} />
            <span>請假申請</span>
          </button>
          <button className={`main-tab-btn ${activeTab === 'xp' ? 'active' : ''}`} onClick={() => setActiveTab('xp')}>
            <Zap size={16} />
            <span>XP 申請</span>
          </button>
        </div>

        {activeTab === 'xp' && (
          <div className="xp-sub-tabs-pills">
            <button className={`pill-btn ${activeXpType === 'weekly' ? 'active' : ''}`} onClick={() => setActiveXpType('weekly')}>
              <Calendar size={14} /> 周課堂 <span className="badge">{counts.weekly}</span>
            </button>
            <button className={`pill-btn ${activeXpType === 'event' ? 'active' : ''}`} onClick={() => setActiveXpType('event')}>
              <Zap size={14} /> 活動申請 <span className="badge">{counts.event}</span>
            </button>
            <button className={`pill-btn ${activeXpType === 'cert' ? 'active' : ''}`} onClick={() => setActiveXpType('cert')}>
              <Award size={14} /> 證照審核 <span className="badge">{counts.cert}</span>
            </button>
          </div>
        )}

        <button className="new-apply-btn-pill" onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <div className="icon-circle"><Plus size={14} color="#f97316" /></div>
          <span>新增申請</span>
        </button>

        <div className="apply-list">
          {isLoading ? (
            <div className="loader-box"><Loader2 className="spin" /> 載入中...</div>
          ) : visibleRecords.length === 0 ? (
            <div className="empty-box" style={{textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0'}}>目前無申請紀錄</div>
          ) : (
            visibleRecords.map((record) => (
              <div key={record.id} className="modern-card" onClick={() => setSelectedRecord(record)}>
                <div className="modern-card-left-line"></div>
                
                <div className="modern-card-content">
                    <div className="m-card-top">
                        <div className="modern-card-icon">
                            {record.isCert ? <Award size={18} color="#f97316"/> : record.isXpApp ? <Zap size={18} color="#f97316"/> : <Calendar size={18} color="#f97316"/>}
                        </div>
                        <div className="m-card-title-area">
                            <h4 className="m-card-title">
                                {record.isCert ? record.cert_name :
                                record.type === 'weekly' ? `${record.lessons_count} 堂課堂申請` :
                                record.type === 'event' ? '活動 XP 申請' : (record.leave_type || 'XP 申請')}
                            </h4>
                            <p className="m-card-sub">
                                {record.isCert ? '證照審核' :
                                record.type === 'weekly' ? '周課堂出席紀錄' :
                                record.type === 'event' ? '活動紀錄' : '請假紀錄'}
                            </p>
                        </div>
                        <div className={`m-status-pill ${record.status === '待審核' ? 'pending' : record.status === '已退件' || record.status === '未通過' ? 'rejected' : 'approved'}`}>
                            {record.status === '核准' ? '已核准' : record.status}
                        </div>
                    </div>
                    
                    <div className="m-card-bottom">
                        <div className="m-card-date">
                            <Clock size={12}/>
                            <span>{new Date(record.created_at).toLocaleDateString()}</span>
                        </div>
                        {((record.apply_xp > 0) || (record.xp_reward > 0)) && (
                            <div className={`m-card-xp-pill ${record.status === '已退件' || record.status === '未通過' ? 'dimmed' : ''}`}>
                                <Zap size={12}/>
                                <span>+{(record.apply_xp || record.xp_reward).toLocaleString()} XP</span>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Application Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{activeTab === 'leave' ? '請假申請' : activeXpType === 'weekly' ? '周課堂申請' : activeXpType === 'event' ? '活動申請' : '證照完成申請'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              {activeTab === 'leave' ? (
                <>
                  <div className="form-group row">
                    <div className="input-item">
                      <label>開始時間</label>
                      <input type="datetime-local" required value={leaveData.startAt} onChange={e => setLeaveData({ ...leaveData, startAt: e.target.value })} />
                    </div>
                    <div className="input-item">
                      <label>結束時間</label>
                      <input type="datetime-local" required value={leaveData.endAt} onChange={e => setLeaveData({ ...leaveData, endAt: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>請假原因</label>
                    <textarea rows="3" required value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}></textarea>
                  </div>
                </>
              ) : activeXpType === 'weekly' ? (
                <>
                  <div className="form-group">
                    <label>本周上課堂數 (必填)</label>
                    <input type="number" required placeholder="輸入堂數" value={xpFormData.lessonsCount}
                      onChange={e => setXpFormData({ ...xpFormData, lessonsCount: e.target.value })}
                    />
                    {xpFormData.lessonsCount && (
                      <p className="calc-hint">預計可獲得：{parseInt(xpFormData.lessonsCount) * (xpRules.lesson || 10)} XP</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>備註</label>
                    <textarea rows="2" value={xpFormData.notes} onChange={e => setXpFormData({ ...xpFormData, notes: e.target.value })}></textarea>
                  </div>
                </>
              ) : activeXpType === 'event' ? (
                <>
                  <div className="form-group">
                    <label>申請 XP 分數 (必填)</label>
                    <input type="number" required placeholder="輸入分數" value={xpFormData.applyXp}
                      onChange={e => setXpFormData({ ...xpFormData, applyXp: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>活動備註</label>
                    <textarea rows="2" value={xpFormData.notes} onChange={e => setXpFormData({ ...xpFormData, notes: e.target.value })}></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>選擇證照類別</label>
                    <select value={xpFormData.certCategory} onChange={e => setXpFormData({ ...xpFormData, certCategory: e.target.value })}>
                      {CERT_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>證照名稱</label>
                    <input type="text" required placeholder="例如：NASM-CPT" value={xpFormData.certName} onChange={e => setXpFormData({ ...xpFormData, certName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>發照機構</label>
                    <input type="text" required value={xpFormData.organization} onChange={e => setXpFormData({ ...xpFormData, organization: e.target.value })} />
                  </div>
                  <div className="form-group row">
                    <div className="input-item">
                      <label>獲得日期</label>
                      <input type="date" required value={xpFormData.obtainedDate} onChange={e => setXpFormData({ ...xpFormData, obtainedDate: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>證明照片 (1-5張)</label>
                <div className="image-grid">
                  {previews.map((src, i) => (
                    <div key={i} className="img-preview-box">
                      <img src={src} />
                      <button type="button" className="remove-img" onClick={() => removeImage(i)}><X size={10} /></button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <label className="upload-box">
                      <input type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
                      <Upload size={20} />
                      <span>上傳</span>
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                <span>確認送出</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>申請詳情</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}><X size={20} /></button>
            </div>
            <div className="modal-body detail-view">
              <div className="detail-header">
                <div className={`status-pill ${selectedRecord.status === '待審核' ? 'pending' : selectedRecord.status === '已退件' || selectedRecord.status === '未通過' ? 'rejected' : 'approved'}`}>
                  {selectedRecord.status}
                </div>
                <span className="apply-time">{new Date(selectedRecord.created_at).toLocaleString()}</span>
              </div>

              <div className="info-section">
                <label>申請類型</label>
                <p>{selectedRecord.isCert ? '證照審核' : (selectedRecord.type === 'weekly' ? '課堂 XP' : selectedRecord.type === 'event' ? '活動 XP' : selectedRecord.leave_type)}</p>
              </div>

              {selectedRecord.isCert ? (
                <>
                  <div className="info-section">
                    <label>證照類別與XP</label>
                    <p>{selectedRecord.category || '未設定'} {selectedRecord.xp_reward ? `(預計獲得 +${selectedRecord.xp_reward} XP)` : ''}</p>
                  </div>
                  <div className="info-section">
                    <label>證照名稱</label>
                    <p>{selectedRecord.cert_name}</p>
                  </div>
                  <div className="info-section">
                    <label>機構</label>
                    <p>{selectedRecord.organization}</p>
                  </div>
                </>
              ) : selectedRecord.type === 'weekly' ? (
                <div className="info-section">
                  <label>上課堂數</label>
                  <p>{selectedRecord.lessons_count} 堂 (預計獲得 {selectedRecord.apply_xp} XP)</p>
                </div>
              ) : (
                <div className="info-section">
                  <label>申請內容/原因</label>
                  <p>{selectedRecord.reason || selectedRecord.notes || '無備註'}</p>
                </div>
              )}

              <div className="info-section">
                <label>證明照片</label>
                <div className="detail-image-grid">
                  {(selectedRecord.proof_images || selectedRecord.images || []).map((img, i) => (
                    <div key={i} className="detail-img-box">
                      <img src={img} alt="proof" onClick={() => window.open(img, '_blank')} />
                    </div>
                  ))}
                </div>
              </div>

              {(selectedRecord.status === '已退件' || selectedRecord.status === '未通過') && (
                <div className="rejection-box">
                  <label>退件原因</label>
                  <p>{selectedRecord.admin_notes || selectedRecord.admin_feedback || '未註明原因'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .coach-apply { 
          display: flex; 
          flex-direction: column; 
          height: 100%; 
          border-radius: 30px; 
          background: #0a0a0b;
          background-image: url("data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='75' y='75' font-family='Arial, sans-serif' font-weight='900' font-size='22' fill='white' fill-opacity='0.07' text-anchor='middle' transform='rotate(-35, 75, 75)'%3EJENZiQ%3C/text%3E%3C/svg%3E");
          background-attachment: fixed;
        }
        .page-header { padding: 24px 20px 16px; }
        .breadcrumb { font-size: 11px; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .breadcrumb .dim { color: rgba(255,255,255,0.4); }
        .breadcrumb .highlight { color: #f97316; font-weight: 600; }
        .page-title { font-size: 24px; font-weight: 800; color: white; margin: 0; }
        .apply-content { flex: 1; overflow-y: auto; padding: 0 16px 20px; scrollbar-width: none; }
        
        /* Summary Card */
        .summary-card {
            background: linear-gradient(145deg, #1c1511 0%, #17131a 100%);
            border: 1px solid rgba(255, 115, 0, 0.2);
            border-radius: 20px;
            padding: 24px 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }
        .summary-card::after {
            content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
        }
        .summary-left { display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 2; }
        .summary-label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; margin: 0; }
        .summary-value { font-size: 36px; font-weight: 800; color: #f97316; margin: 0; display: flex; align-items: baseline; gap: 6px; }
        .summary-value .xp-unit { font-size: 16px; color: rgba(255,255,255,0.5); font-weight: 600; }
        .summary-right { display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 2; }
        .summary-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .summary-badge.green { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .summary-badge.dark { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.08); }

        /* Main Tabs */
        .main-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .main-tab-btn {
            background: #18181b; border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px; padding: 14px 0; color: rgba(255,255,255,0.4);
            font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: 0.3s; cursor: pointer;
        }
        .main-tab-btn.active {
            background: linear-gradient(135deg, #FF7E27 0%, #FF5C00 100%);
            color: white; border-color: transparent;
            box-shadow: 0 4px 15px rgba(255, 92, 0, 0.25);
        }

        /* Sub Tabs Pills */
        .xp-sub-tabs-pills { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .pill-btn {
            background: #111; border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.5); border-radius: 24px; padding: 8px 16px;
            font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;
            white-space: nowrap; transition: 0.2s; cursor: pointer;
        }
        .pill-btn.active {
            border-color: #f97316; color: #f97316;
            background: rgba(249, 115, 22, 0.05);
        }
        .badge { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 10px; font-size: 10px; color: rgba(255,255,255,0.6); margin-left: 2px; }
        .pill-btn.active .badge { background: #f97316; color: white; }

        /* Add Button Pill */
        .new-apply-btn-pill {
            width: 100%; background: linear-gradient(135deg, #FF8933 0%, #FF5C00 100%);
            border-radius: 16px; padding: 14px; display: flex; align-items: center; justify-content: center; gap: 10px;
            color: white; font-weight: 700; font-size: 15px; border: none; margin-bottom: 24px;
            box-shadow: 0 6px 20px rgba(255, 92, 0, 0.2); cursor: pointer; transition: 0.2s;
        }
        .new-apply-btn-pill:active { transform: scale(0.98); }
        .icon-circle { background: rgba(255,255,255,0.2); border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; }

        /* Modern Cards */
        .apply-list { display: flex; flex-direction: column; gap: 12px; }
        .modern-card {
            background: #0f0f13; border: 1px solid rgba(255,255,255,0.05);
            border-radius: 20px; padding: 18px 20px; display: flex; gap: 16px;
            cursor: pointer; transition: 0.2s; position: relative; overflow: hidden;
            align-items: center;
        }
        .modern-card:active { transform: scale(0.98); }
        .modern-card-left-line { position: absolute; left: 0; top: 20px; bottom: 20px; width: 3px; background: linear-gradient(to bottom, #f97316, transparent); border-radius: 0 4px 4px 0; }
        
        .modern-card-content { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .m-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;}
        .modern-card-icon {
            width: 44px; height: 44px; border-radius: 50%; background: #221a15;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            margin-right: 12px;
        }
        .m-card-title-area { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .m-card-title { font-size: 15px; font-weight: 800; color: white; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .m-card-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; }
        .m-status-pill { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; white-space: nowrap; height: fit-content; }
        .m-status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
        .m-status-pill.approved { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .m-status-pill.approved::before { background: #10B981; }
        .m-status-pill.pending { background: rgba(255, 184, 0, 0.1); color: #FFB800; }
        .m-status-pill.pending::before { background: #FFB800; }
        .m-status-pill.rejected { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
        .m-status-pill.rejected::before { background: #EF4444; }

        .m-card-bottom { display: flex; justify-content: space-between; align-items: center; padding-left: 56px; }
        .m-card-date { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500; }
        .m-card-xp-pill { display: flex; align-items: center; gap: 4px; border: 1px solid rgba(249, 115, 22, 0.3); color: #f97316; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; }
        .m-card-xp-pill.dimmed { border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); text-decoration: line-through; }

        .calc-hint { margin-top: 8px; font-size: 12px; color: var(--primary); font-weight: 700; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { background: #1a1a1b; width: 100%; max-width: 440px; border-radius: 28px; border: 1px solid var(--border); }
        .modal-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; max-height: 75vh; overflow-y: auto; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea { background: #000; border: 1px solid var(--border); border-radius: 12px; padding: 12px; color: white; outline: none; }
        .form-group.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        .image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 4px; }
        .img-preview-box { height: 80px; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid var(--border); }
        .img-preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .remove-img { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.73); color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .upload-box { height: 80px; border: 2px dashed var(--border); border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 11px; gap: 4px; }
        .submit-btn { background: var(--primary); color: white; border-radius: 14px; padding: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px; }
        
        .detail-view { gap: 20px; }
        .detail-header { display: flex; justify-content: space-between; align-items: center; }
        .apply-time { font-size: 12px; color: var(--text-secondary); }
        .info-section label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; }
        .info-section p { color: white; font-size: 14px; line-height: 1.6; }
        .detail-image-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .detail-img-box { height: 140px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
        .detail-img-box img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
        .rejection-box { background: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.3); padding: 16px; border-radius: 16px; }
        .rejection-box label { display: block; font-size: 12px; color: #EF4444; font-weight: 700; margin-bottom: 8px; }
        .rejection-box p { color: white; font-size: 13px; line-height: 1.5; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CoachApply;
