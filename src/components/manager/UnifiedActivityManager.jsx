import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Calendar, Link as LinkIcon, Upload, Loader2, Save, X, Tag, FileText, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/imageCrop';
import { supabase } from '../../supabase';

// 預設封面
import defaultImg from '../../assets/hero-bg.png';

const UnifiedActivityManager = ({ initialTab = 'student' }) => {
    const [activeTab, setActiveTab] = useState(initialTab); // 'student' or 'coach'
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('全部');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentEvent, setCurrentEvent] = useState({
        title: '',
        subtitle: '',
        content: '',
        image_url: '',
        link_url: '',
        label: '',
        category: '健身',
        is_featured: false,
        min_level: 1
    });

    // 裁剪相關狀態
    const [tempImage, setTempImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const studentCategories = ['全部', '健身', '競賽', '優惠', '其他'];
    const coachCategories = ['全部', '交流', '認證', '競賽', '課程', '其他'];
    const categories = activeTab === 'student' ? studentCategories : coachCategories;

    const ASPECT_RATIO = currentEvent.is_featured ? (16 / 9) : (1 / 1);
    const tableName = activeTab === 'student' ? 'events' : 'coach_events';

    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        fetchEvents();
        // Reset category when switching tabs
        setActiveCategory('全部');
    }, [activeTab]);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const sortedData = (data || []).sort((a, b) => {
                if (a.is_featured === b.is_featured) return 0;
                return a.is_featured ? -1 : 1;
            });
            setEvents(sortedData);
        } catch (err) {
            console.error(`抓取${activeTab === 'student' ? '學員' : '教練'}活動失敗:`, err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => setTempImage(reader.result);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!currentEvent.title) return alert('請填寫活動名稱');

        try {
            setIsSaving(true);
            let finalImageUrl = currentEvent.image_url;

            if (tempImage) {
                const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
                const fileName = `${activeTab}-event-${Date.now()}.jpg`;
                const folder = activeTab === 'student' ? 'events' : 'coach-events';

                const { data: storageData, error: storageError } = await supabase.storage
                    .from('student-dashboard-image')
                    .upload(`${folder}/${fileName}`, croppedBlob);

                if (storageError) throw storageError;

                const { data: { publicUrl } } = supabase.storage
                    .from('student-dashboard-image')
                    .getPublicUrl(`${folder}/${fileName}`);

                finalImageUrl = publicUrl;
            }

            const eventData = {
                title: currentEvent.title,
                subtitle: currentEvent.subtitle,
                content: currentEvent.content,
                image_url: finalImageUrl,
                link_url: currentEvent.link_url,
                label: currentEvent.label,
                category: currentEvent.category,
                is_featured: currentEvent.is_featured,
                min_level: currentEvent.min_level || 1
            };

            if (currentEvent.is_featured) {
                await supabase
                    .from(tableName)
                    .update({ is_featured: false })
                    .eq('is_featured', true);
            }

            const { error } = await supabase
                .from(tableName)
                .upsert(currentEvent.id ? { ...eventData, id: currentEvent.id } : eventData);

            if (error) throw error;

            await fetchEvents();
            resetForm();
            alert(`${activeTab === 'student' ? '學員' : '教練'}活動保存成功！`);
        } catch (err) {
            console.error('保存活動失敗:', err);
            alert(`保存失敗: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return alert('無效的活動 ID');
        const typeStr = activeTab === 'student' ? '學員' : '教練';
        if (!window.confirm(`📌 確定要刪除這項「${typeStr}活動」嗎？此操作無法還原。`)) return;

        try {
            setIsLoading(true);
            const { error, count } = await supabase
                .from(tableName)
                .delete({ count: 'exact' })
                .eq('id', id);

            if (error) throw error;

            setEvents(prev => prev.filter(e => e.id !== id));
            alert(`✅ ${typeStr}活動已成功刪除`);
        } catch (err) {
            console.error('刪除執行錯誤:', err);
            alert(`❌ 刪除失敗: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentEvent({
            title: '',
            subtitle: '',
            content: '',
            image_url: '',
            link_url: '',
            label: '',
            category: activeTab === 'student' ? '健身' : '交流',
            is_featured: false,
            min_level: 1
        });
        setTempImage(null);
    };

    const filteredEvents = events.filter(e => {
        const matchCategory = activeCategory === '全部' || e.category === activeCategory;
        const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="unified-activity-manager">
            <header className="manager-header">
                <div className="header-left-group">
                    <h2 className="title">活動發布管理</h2>
                    <div className="tab-switcher">
                        <button
                            className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                            onClick={() => setActiveTab('student')}
                        >
                            學員活動
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
                            onClick={() => setActiveTab('coach')}
                        >
                            教練活動
                        </button>
                    </div>
                </div>
                {!isEditing && (
                    <button className="add-btn" onClick={() => setIsEditing(true)}>
                        <Plus size={20} />
                        <span>新增{activeTab === 'student' ? '學員' : '教練'}活動</span>
                    </button>
                )}
            </header>

            {!isEditing && (
                <div className="filter-bar">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="搜尋活動名稱..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="category-tabs">
                        {categories.map(c => (
                            <button
                                key={c}
                                className={`cat-btn ${activeCategory === c ? 'active' : ''}`}
                                onClick={() => setActiveCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="manager-body">
                {isEditing ? (
                    <div className="edit-container animate-fade-in">
                        <div className="edit-card-header">
                            <button className="back-btn" onClick={resetForm}>
                                <ChevronLeft size={20} />
                                <span>返回列表</span>
                            </button>
                            <h3>{currentEvent.id ? '編輯' : '新增'}{activeTab === 'student' ? '學員' : '教練'}活動</h3>
                        </div>

                        <div className="edit-grid">
                            <div className="edit-left">
                                <div className="field-group">
                                    <label>活動封面圖片</label>
                                    <div className="upload-container" style={{ aspectRatio: ASPECT_RATIO }}>
                                        {!tempImage && !currentEvent.image_url ? (
                                            <label className="upload-trigger">
                                                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                                <div className="trigger-content">
                                                    <div className="icon-circle">
                                                        <ImageIcon size={32} />
                                                    </div>
                                                    <p>點擊上傳統一比例圖片</p>
                                                    <span>(建議 16:9 或 1:1)</span>
                                                </div>
                                            </label>
                                        ) : tempImage ? (
                                            <div className="cropper-box">
                                                <Cropper
                                                    image={tempImage}
                                                    crop={crop}
                                                    zoom={zoom}
                                                    aspect={ASPECT_RATIO}
                                                    onCropChange={setCrop}
                                                    onCropComplete={onCropComplete}
                                                    onZoomChange={setZoom}
                                                />
                                                <div className="zoom-slid-box">
                                                    <span>縮放</span>
                                                    <input
                                                        type="range"
                                                        value={zoom}
                                                        min={1}
                                                        max={3}
                                                        step={0.1}
                                                        onChange={(e) => setZoom(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="preview-box">
                                                <img src={currentEvent.image_url} alt="Preview" />
                                                <button className="re-upload" onClick={() => setTempImage(null)}>
                                                    <Upload size={16} />
                                                    更換圖片
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="edit-right">
                                <div className="input-row">
                                    <div className="input-group">
                                        <label>活動標題</label>
                                        <input
                                            type="text"
                                            placeholder="主標題..."
                                            value={currentEvent.title}
                                            onChange={e => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>活動副標題 (選填)</label>
                                        <input
                                            type="text"
                                            placeholder="簡短摘要..."
                                            value={currentEvent.subtitle || ''}
                                            onChange={e => setCurrentEvent({ ...currentEvent, subtitle: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-row">
                                    <div className="input-group">
                                        <label>分類</label>
                                        <select
                                            value={currentEvent.category}
                                            onChange={e => setCurrentEvent({ ...currentEvent, category: e.target.value })}
                                        >
                                            {categories.filter(c => c !== '全部').map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>標籤 (預定標籤)</label>
                                        <input
                                            type="text"
                                            placeholder="例如：熱門、限時"
                                            value={currentEvent.label || ''}
                                            onChange={e => setCurrentEvent({ ...currentEvent, label: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-row">
                                    <div className="input-group">
                                        <label>限定參與等級 (Lv.{currentEvent.min_level}+)</label>
                                        <select
                                            value={currentEvent.min_level}
                                            onChange={e => setCurrentEvent({ ...currentEvent, min_level: parseInt(e.target.value) })}
                                        >
                                            {[...Array(activeTab === 'student' ? 10 : 11)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Lv.{i + 1} {i + 1 === (activeTab === 'student' ? 10 : 11) ? 'MAX' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>跳轉連結 (選填)</label>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            value={currentEvent.link_url || ''}
                                            onChange={e => setCurrentEvent({ ...currentEvent, link_url: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-group checkbox-wrapper">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={currentEvent.is_featured}
                                            onChange={e => setCurrentEvent({ ...currentEvent, is_featured: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="text">設為精選活動 (將顯示於頂部大圖)</span>
                                    </label>
                                </div>

                                <div className="input-group">
                                    <label>內容詳細描述</label>
                                    <textarea
                                        rows="6"
                                        placeholder="活動的具體細節、時間、地點、參與方式等..."
                                        value={currentEvent.content}
                                        onChange={e => setCurrentEvent({ ...currentEvent, content: e.target.value })}
                                    />
                                </div>

                                <div className="action-buttons">
                                    <button className="cancel-button" onClick={resetForm}>取消</button>
                                    <button className="submit-button" onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                                        保存活動內容
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="list-container">
                        {isLoading ? (
                            <div className="loading-state">
                                <Loader2 className="spin" size={48} />
                                <p>正在載入{activeTab === 'student' ? '學員' : '教練'}活動列表...</p>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={64} className="empty-icon" />
                                <h3>目前尚無活動</h3>
                                <p>點擊右上角的按鈕來建立您的第一個活動吧！</p>
                            </div>
                        ) : (
                            <div className="events-masonry">
                                {filteredEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`event-card ${event.is_featured ? 'featured' : ''}`}
                                        onClick={() => {
                                            setCurrentEvent({ ...event, is_featured: !!event.is_featured });
                                            setIsEditing(true);
                                        }}
                                    >
                                        <div className="card-media">
                                            <img src={event.image_url || defaultImg} alt={event.title} />
                                            <div className="category-tag">{event.category}</div>
                                            {event.is_featured && <div className="featured-tag">精選</div>}
                                            <div className="card-overlay">
                                                <div className="overlay-btns">
                                                    <button className="icon-btn edit"><Edit2 size={18} /></button>
                                                    <button
                                                        className="icon-btn delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(event.id);
                                                        }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-info">
                                            <h4 className="card-title">{event.title}</h4>
                                            <p className="card-desc">{event.content?.substring(0, 60)}...</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .unified-activity-manager {
                    height: 100%;
                    background: #0F172A;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow: hidden;
                }

                .manager-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .header-left-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .manager-header .title {
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }

                .tab-switcher {
                    display: flex;
                    background: rgba(255,255,255,0.05);
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    width: fit-content;
                }

                .tab-btn {
                    padding: 8px 20px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: rgba(255,255,255,0.5);
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-btn.active {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
                }

                .add-btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 14px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .add-btn:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(255, 92, 0, 0.4);
                }

                .filter-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 24px;
                }

                .search-box {
                    flex: 1;
                    max-width: 400px;
                    position: relative;
                }

                .search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.3);
                }

                .search-box input {
                    width: 100%;
                    background: #1E293B;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 14px 16px 14px 48px;
                    border-radius: 16px;
                    color: white;
                    outline: none;
                    transition: all 0.3s;
                }

                .search-box input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(255, 92, 0, 0.1);
                }

                .category-tabs {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }

                .cat-btn {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    padding: 10px 18px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .cat-btn.active {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border-color: rgba(255,255,255,0.3);
                }

                .manager-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 4px;
                    scrollbar-width: thin;
                }

                /* Masonry List Layout */
                .events-masonry {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }

                .event-card {
                    background: #1E293B;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .event-card:hover {
                    transform: scale(1.02);
                    border-color: rgba(255,255,255,0.15);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.3);
                }

                .card-media {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/9;
                    background: #000;
                }

                .card-media img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .category-tag {
                    position: absolute;
                    bottom: 12px;
                    left: 12px;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(8px);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }

                .featured-tag {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: #EAB308;
                    color: #000;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 900;
                    box-shadow: 0 4px 10px rgba(234, 179, 8, 0.4);
                }

                .card-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .event-card:hover .card-overlay {
                    opacity: 1;
                }

                .overlay-btns {
                    display: flex;
                    gap: 12px;
                }

                .icon-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn.edit { background: white; color: black; }
                .icon-btn.delete { background: #EF4444; color: white; }
                .icon-btn:hover { transform: scale(1.1); }

                .card-info {
                    padding: 20px;
                }

                .card-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: white;
                }

                .card-desc {
                    font-size: 13px;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.6;
                }

                /* Edit Form Layout */
                .edit-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .edit-card-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .back-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .edit-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: 40px;
                    background: #1E293B;
                    padding: 40px;
                    border-radius: 30px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                @media (max-width: 900px) {
                    .edit-grid { grid-template-columns: 1fr; }
                }

                .field-group label {
                    display: block;
                    font-size: 14px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 12px;
                }

                .upload-container {
                    width: 100%;
                    background: #0F172A;
                    border: 2px dashed rgba(255,255,255,0.1);
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                }

                .upload-trigger {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .upload-trigger:hover {
                    background: rgba(255,255,255,0.02);
                    border-color: var(--primary);
                }

                .trigger-content { text-align: center; }
                .icon-circle {
                    width: 70px;
                    height: 70px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: var(--primary);
                }

                .trigger-content p { font-weight: 700; margin-bottom: 4px; }
                .trigger-content span { font-size: 12px; color: rgba(255,255,255,0.4); }

                .preview-box { width: 100%; height: 100%; position: relative; }
                .preview-box img { width: 100%; height: 100%; object-fit: cover; }
                .re-upload {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(0,0,0,0.8);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    cursor: pointer;
                    backdrop-filter: blur(8px);
                }

                .cropper-box { width: 100%; height: 100%; position: relative; }
                .zoom-slid-box {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.7);
                    padding: 12px 20px;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .input-group { margin-bottom: 24px; }
                .input-group label { display: block; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
                .input-group input, .input-group textarea, .input-group select {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 14px 16px;
                    border-radius: 12px;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .input-group input:focus, .input-group textarea:focus { border-color: var(--primary); }

                .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                .checkbox-wrapper { margin: 10px 0 24px; }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    user-select: none;
                }

                .checkbox-label .text { color: white; font-weight: 600; font-size: 14px; }

                .action-buttons {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 16px;
                    margin-top: 40px;
                }

                .cancel-button {
                    background: rgba(255,255,255,0.05);
                    border: none;
                    color: white;
                    padding: 16px;
                    border-radius: 16px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .submit-button {
                    background: #10B981;
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                }

                .submit-button:disabled { opacity: 0.6; cursor: not-allowed; }

                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default UnifiedActivityManager;
