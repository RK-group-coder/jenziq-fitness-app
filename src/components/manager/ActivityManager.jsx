import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Calendar, Link as LinkIcon, Upload, Loader2, Save, X, Tag, FileText } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/imageCrop';
import { supabase } from '../../supabase';

// 預設封面
import defaultImg from '../../assets/hero-bg.png';

const ActivityManager = () => {
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
        is_featured: false
    });

    // 裁剪相關狀態
    const [tempImage, setTempImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const categories = ['全部', '健身', '競賽', '課程', '優惠', '其他'];
    const ASPECT_RATIO = currentEvent.is_featured ? (16 / 9) : (1 / 1);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const sortedData = (data || []).sort((a, b) => {
                if (a.is_featured === b.is_featured) return 0;
                return a.is_featured ? -1 : 1;
            });
            setEvents(sortedData);
        } catch (err) {
            console.error('抓取活動失敗:', err);
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
                const fileName = `event-${Date.now()}.jpg`;
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('student-dashboard-image')
                    .upload(`events/${fileName}`, croppedBlob);

                if (storageError) throw storageError;

                const { data: { publicUrl } } = supabase.storage
                    .from('student-dashboard-image')
                    .getPublicUrl(`events/${fileName}`);

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
                is_featured: currentEvent.is_featured
            };

            if (currentEvent.is_featured) {
                await supabase
                    .from('events')
                    .update({ is_featured: false })
                    .eq('is_featured', true);
            }

            const { error } = await supabase
                .from('events')
                .upsert(currentEvent.id ? { ...eventData, id: currentEvent.id } : eventData);

            if (error) throw error;

            await fetchEvents();
            resetForm();
            alert('活動保存成功！');
        } catch (err) {
            console.error('保存活動失敗:', err);
            alert(`保存失敗: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return alert('無效的活動 ID');
        if (!window.confirm('📌 確定要刪除這項「學員活動」嗎？此操作無法還原。')) return;

        console.log('正在刪除學員活動，ID:', id);

        try {
            setIsLoading(true);
            const { error, status, count } = await supabase
                .from('events')
                .delete({ count: 'exact' })
                .eq('id', id);

            if (error) {
                console.error('資料庫刪除錯誤:', error);
                alert(`❌ 刪除失敗 (狀態碼 ${status}): ${error.message}\n${error.hint || ''}`);
                return;
            }

            if (count === 0) {
                alert('⚠️ 刪除指令無效：此活動未被成功刪除。\n如果是線上環境 (Host)，請確認資料庫 RLS 權限已開放。');
                await fetchEvents();
                return;
            }

            setEvents(prev => prev.filter(e => e.id !== id));
            alert('✅ 學員活動已成功刪除');
        } catch (err) {
            console.error('刪除執行錯誤:', err);
            if (!err.message.includes('alert')) {
                alert(`❌ 系統執行異常：${err.message}`);
            }
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
            category: '健身',
            is_featured: false
        });
        setTempImage(null);
    };

    const filteredEvents = events.filter(e => {
        const matchCategory = activeCategory === '全部' || e.category === activeCategory;
        const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="activity-manager">
            <header className="page-header">
                <div className="header-top">
                    <div className="title-wrap">
                        <h2 className="page-title">學員活動管理</h2>
                        <p className="page-count">共 {events.length} 筆活動</p>
                    </div>
                    <button className="add-btn" onClick={() => setIsEditing(true)}>
                        <Plus size={18} />
                        <span>新增活動</span>
                    </button>
                </div>

                <div className="search-bar-wrap">
                    <div className="search-input">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="搜尋活動名稱..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="category-scroll">
                    {categories.map(c => (
                        <button
                            key={c}
                            className={`cat-tab ${activeCategory === c ? 'active' : ''}`}
                            onClick={() => setActiveCategory(c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </header>

            <div className="manager-scroll-content">
                {isEditing ? (
                    <div className="edit-form">
                        <div className="form-sections">
                            <div className="form-left">
                                <label className="form-label">活動圖片 (建議 16:9)</label>
                                <div className="image-upload-area" style={{ aspectRatio: ASPECT_RATIO }}>
                                    {!tempImage && !currentEvent.image_url ? (
                                        <label className="upload-placeholder">
                                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                            <Upload size={32} />
                                            <span>點擊上傳原始圖片</span>
                                        </label>
                                    ) : tempImage ? (
                                        <div className="cropper-container">
                                            <div className="cropper-wrap">
                                                <Cropper
                                                    image={tempImage}
                                                    crop={crop}
                                                    zoom={zoom}
                                                    aspect={ASPECT_RATIO}
                                                    onCropChange={setCrop}
                                                    onCropComplete={onCropComplete}
                                                    onZoomChange={setZoom}
                                                />
                                            </div>
                                            <div className="cropper-controls">
                                                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="image-preview">
                                            <img src={currentEvent.image_url} alt="Preview" />
                                            <button className="change-img-overlay" onClick={() => setTempImage(null)}>
                                                更換圖片
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-right">
                                <div className="input-field">
                                    <label>活動標題</label>
                                    <input
                                        type="text"
                                        value={currentEvent.title}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                                        placeholder="活動名稱"
                                    />
                                </div>
                                <div className="input-field checkbox-field">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={currentEvent.is_featured}
                                            onChange={(e) => setCurrentEvent({ ...currentEvent, is_featured: e.target.checked })}
                                        />
                                        <span>設為精選 (16:9)</span>
                                    </label>
                                </div>
                                <div className="input-field">
                                    <label>內容詳情</label>
                                    <textarea
                                        rows="4"
                                        value={currentEvent.content}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, content: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="form-footer">
                            <button className="cancel-btn" onClick={resetForm}>取消</button>
                            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                                <span>保存活動</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="activity-list">
                        {isLoading && events.length === 0 ? (
                            <div className="loading-wrap"><Loader2 className="spin" /> 讀取中...</div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="empty-wrap">尚無活動內容</div>
                        ) : (
                            filteredEvents.map(event => (
                                <div key={event.id} className={`act-card ${event.is_featured ? 'featured' : ''}`}>
                                    <div className="act-img-wrap">
                                        <img src={event.image_url || defaultImg} alt={event.title} className="act-img" />
                                        {event.is_featured && <div className="featured-badge">精選</div>}
                                    </div>
                                    <div className="act-body">
                                        <h4 className="act-name">{event.title}</h4>
                                        <p className="act-subtitle">{event.subtitle}</p>
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="action-btn edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentEvent({ ...event, is_featured: !!event.is_featured });
                                                setIsEditing(true);
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(event.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .activity-manager { display: flex; flex-direction: column; height: 100%; color: white; background: #0F172A; }
                .page-header { padding: 24px 20px 0; }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .page-title { font-size: 20px; font-weight: 800; }
                .page-count { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
                .add-btn { background-color: var(--primary); color: white; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; border: none; cursor: pointer; }
                .search-bar-wrap { margin-bottom: 20px; padding: 0 4px; }
                .search-input { background-color: #1a1a1b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; padding: 0 16px; gap: 12px; height: 48px; }
                .search-input input { background: none; border: none; color: white; font-size: 14px; width: 100%; outline: none; }
                .category-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 0 4px 16px; scrollbar-width: none; }
                .cat-tab { background-color: rgba(255,255,255,0.05); color: var(--text-secondary); padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; white-space: nowrap; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
                .cat-tab.active { background-color: var(--primary); color: white; border-color: var(--primary); }
                .activity-list { display: flex; flex-wrap: wrap; gap: 16px; padding: 4px; }
                .act-card { position: relative; background-color: #1a1a1b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); width: calc(50% - 8px); aspect-ratio: 1 / 1; }
                @media (min-width: 600px) { .act-card { width: 180px; } }
                .act-card.featured { width: 100%; aspect-ratio: 16 / 9; }
                .act-img-wrap { width: 100%; height: 100%; position: relative; }
                .act-img { width: 100%; height: 100%; object-fit: cover; }
                .featured-badge { position: absolute; top: 12px; left: 12px; background: #EAB308; color: black; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 6px; z-index: 2; }
                .act-body { position: absolute; inset: 0; padding: 15px; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(transparent, rgba(0,0,0,0.9)); z-index: 1; }
                .act-name { font-size: 15px; font-weight: 800; color: white; margin-bottom: 2px; }
                .card-actions { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
                .action-btn { background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); color: white; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .action-btn.delete { color: #FF4D4D; }
                .loading-wrap, .empty-wrap { width: 100%; padding: 80px 20px; text-align: center; color: var(--text-secondary); }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default ActivityManager;
