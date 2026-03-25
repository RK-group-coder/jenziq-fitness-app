import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Clock, Phone, Tag, Edit2, Trash2, Save, X, ExternalLink, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../supabase';

const LocationManager = () => {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [currentLocation, setCurrentLocation] = useState({
        name: '',
        address: '',
        map_url: '',
        hours: '',
        phone: '',
        tags: [],
        is_featured: false,
        image_url: ''
    });

    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLocations(data || []);
        } catch (err) {
            console.error('Fetch locations error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentLocation.name) return alert('請填寫據點名稱');

        try {
            setIsSaving(true);
            let finalImageUrl = currentLocation.image_url;

            // 1. 如果有新選擇的圖片，先上傳
            if (imageFile) {
                setIsUploadingImage(true);
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `location-${Date.now()}.${fileExt}`;
                const filePath = `locations/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('student-dashboard-image')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('student-dashboard-image')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrl;
                setIsUploadingImage(false);
            }

            // 2. 儲存/更新資料
            const { error } = await supabase
                .from('locations')
                .upsert(currentLocation.id ? 
                    { ...currentLocation, image_url: finalImageUrl } : 
                    { ...currentLocation, image_url: finalImageUrl });

            if (error) throw error;

            await fetchLocations();
            resetForm();
            alert('據點保存成功！');
        } catch (err) {
            alert(`保存失敗: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除此據點嗎？')) return;
        try {
            const { error } = await supabase.from('locations').delete().eq('id', id);
            if (error) throw error;
            setLocations(locations.filter(l => l.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentLocation({
            name: '',
            address: '',
            map_url: '',
            hours: '',
            phone: '',
            tags: [],
            is_featured: false,
            image_url: ''
        });
        setTagInput('');
        setImageFile(null);
        setImagePreview(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('圖片大小不能超過 2MB');
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const addTag = () => {
        if (!tagInput.trim()) return;
        if (currentLocation.tags.includes(tagInput.trim())) return;
        setCurrentLocation({
            ...currentLocation,
            tags: [...currentLocation.tags, tagInput.trim()]
        });
        setTagInput('');
    };

    const removeTag = (tagToRemove) => {
        setCurrentLocation({
            ...currentLocation,
            tags: currentLocation.tags.filter(t => t !== tagToRemove)
        });
    };

    const filteredLocations = locations.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="location-manager">
            <header className="page-header">
                <div className="header-top">
                    <div className="title-wrap">
                        <h2 className="page-title">據點管理</h2>
                        <p className="page-count">共 {locations.length} 個據點</p>
                    </div>
                    <button className="add-btn" onClick={() => setIsEditing(true)}>
                        <Plus size={18} />
                        <span>新增據點</span>
                    </button>
                </div>

                <div className="search-bar-wrap">
                    <div className="search-input">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="搜尋據點名稱或地址..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="manager-scroll-content">
                {isEditing ? (
                    <div className="edit-form">
                        <div className="form-sections">
                            <div className="input-field">
                                <label>據點名稱</label>
                                <input
                                    type="text"
                                    value={currentLocation.name}
                                    onChange={(e) => setCurrentLocation({ ...currentLocation, name: e.target.value })}
                                    placeholder="例如：MU沐光瑜珈運動空間"
                                />
                            </div>

                            <div className="input-field">
                                <label>地址區域</label>
                                <input
                                    type="text"
                                    value={currentLocation.address}
                                    onChange={(e) => setCurrentLocation({ ...currentLocation, address: e.target.value })}
                                    placeholder="例如：桃園市 | 大溪區"
                                />
                            </div>

                            <div className="input-field">
                                <label>地圖導覽連結 (Google Maps URL)</label>
                                <div className="input-with-icon">
                                    <ExternalLink size={16} />
                                    <input
                                        type="text"
                                        value={currentLocation.map_url}
                                        onChange={(e) => setCurrentLocation({ ...currentLocation, map_url: e.target.value })}
                                        placeholder="https://maps.app.goo.gl/..."
                                    />
                                </div>
                            </div>

                            <div className="row-fields">
                                <div className="input-field">
                                    <label>營業時間</label>
                                    <div className="input-with-icon">
                                        <Clock size={16} />
                                        <input
                                            type="text"
                                            value={currentLocation.hours}
                                            onChange={(e) => setCurrentLocation({ ...currentLocation, hours: e.target.value })}
                                            placeholder="平日每日 10:00-22:00"
                                        />
                                    </div>
                                </div>
                                <div className="input-field">
                                    <label>聯絡電話</label>
                                    <div className="input-with-icon">
                                        <Phone size={16} />
                                        <input
                                            type="text"
                                            value={currentLocation.phone}
                                            onChange={(e) => setCurrentLocation({ ...currentLocation, phone: e.target.value })}
                                            placeholder="033808737"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-field">
                                <label>特色標籤 (Tags)</label>
                                <div className="tag-input-wrap">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                        placeholder="輸入標籤後按 Enter"
                                    />
                                    <button onClick={addTag} className="tag-add-btn">新增</button>
                                </div>
                                <div className="tags-display">
                                    {currentLocation.tags.map(tag => (
                                        <span key={tag} className="form-tag">
                                            {tag}
                                            <X size={12} onClick={() => removeTag(tag)} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                             <div className="input-field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={currentLocation.is_featured}
                                        onChange={(e) => setCurrentLocation({ ...currentLocation, is_featured: e.target.checked })}
                                    />
                                    <span>設為精選據點 (優先排序)</span>
                                </label>
                            </div>

                            <div className="input-field image-upload-field">
                                <label>據點照片 (建議比例 4:3 或 16:9)</label>
                                <div className="image-uploader-box">
                                    {(imagePreview || currentLocation.image_url) ? (
                                        <div className="preview-container">
                                            <img src={imagePreview || currentLocation.image_url} alt="Preview" />
                                            <button className="remove-img-btn" onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                                setCurrentLocation({ ...currentLocation, image_url: '' });
                                            }}>更換照片</button>
                                        </div>
                                    ) : (
                                        <label className="upload-placeholder">
                                            <Upload size={24} />
                                            <span>點擊上傳據點照片</span>
                                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-footer">
                            <button className="cancel-btn" onClick={resetForm}>取消</button>
                            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                                <span>保存據點</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="location-grid">
                        {isLoading ? (
                            <div className="loader-box"><Loader2 className="spin" size={24} /> 載入中...</div>
                        ) : filteredLocations.length === 0 ? (
                            <div className="empty-box">查無據點資料</div>
                        ) : (
                            filteredLocations.map(loc => (
                                <div key={loc.id} className="location-card-managed">
                                    <div className="card-content">
                                        <div className="name-row">
                                            <h4 className="loc-name">{loc.name}</h4>
                                            {loc.is_featured && <span className="featured-badge">精選</span>}
                                        </div>
                                        <div className="loc-tags">
                                            {loc.tags.map(t => <span key={t} className="loc-tag">{t}</span>)}
                                        </div>
                                        <div className="loc-info">
                                            <p>
                                                <MapPin size={12} /> {loc.address}
                                                {loc.map_url && (
                                                    <button
                                                        className="preview-map-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const target = loc.map_url || '';
                                                            const isUrl = /^(https?:\/\/|www\.|maps\.)|google\.com\/maps|goo\.gl\/maps/.test(target.toLowerCase());

                                                            if (isUrl) {
                                                                const url = target.startsWith('http') ? target : `https://${target}`;
                                                                window.open(url, '_blank');
                                                            } else if (target.trim() || loc.address) {
                                                                // 預覽同樣組合名稱與地址，確保搜尋結果正確
                                                                const query = `${loc.name} ${target.trim() || loc.address}`;
                                                                const searchQuery = encodeURIComponent(query);
                                                                window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
                                                            }
                                                        }}
                                                        title="測試地圖連結"
                                                    >
                                                        <ExternalLink size={10} />
                                                    </button>
                                                )}
                                            </p>
                                            <p><Clock size={12} /> {loc.hours}</p>
                                            <p><Phone size={12} /> {loc.phone}</p>
                                        </div>
                                    </div>
                                    <div className="card-actions">
                                        <button className="action-btn" onClick={() => {
                                            setCurrentLocation(loc);
                                            setIsEditing(true);
                                        }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(loc.id)}>
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
                .location-manager { height: 100%; display: flex; flex-direction: column; color: white; background: #000; }
                .page-header { padding: 24px 20px 0; }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .page-title { font-size: 20px; font-weight: 850; }
                .page-count { font-size: 12px; color: var(--text-secondary); }
                .add-btn { background: var(--primary); color: white; padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; border: none; }
                
                .search-bar-wrap { margin-bottom: 20px; }
                .search-input { background: #1a1a1b; border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; padding: 0 16px; gap: 12px; height: 44px; }
                .search-input input { background: none; border: none; color: white; width: 100%; outline: none; }

                .manager-scroll-content { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
                .edit-form { background: #1a1a1b; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
                .form-sections { display: flex; flex-direction: column; gap: 20px; }
                .input-field { display: flex; flex-direction: column; gap: 8px; }
                .input-field label { font-size: 13px; color: var(--text-secondary); }
                .input-field input, .input-field select { background: #000; border: 1px solid var(--border); border-radius: 10px; padding: 12px; color: white; outline: none; }
                
                .input-with-icon { position: relative; display: flex; align-items: center; }
                .input-with-icon svg { position: absolute; left: 12px; color: var(--primary); }
                .input-with-icon input { padding-left: 40px; width: 100%; }

                .tag-input-wrap { display: flex; gap: 8px; }
                .tag-input-wrap input { flex: 1; }
                .tag-add-btn { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 0 16px; font-size: 12px; font-weight: 700; }
                .tags-display { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
                .form-tag { background: #333; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); }
                .form-tag svg { cursor: pointer; color: #EF4444; }

                .checkbox-field { flex-direction: row; align-items: center; gap: 10px; margin-top: 10px; }
                .checkbox-label { display: flex; align-items: center; gap: 10px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; }
                .checkbox-label input { width: 18px; height: 18px; accent-color: var(--primary); }

                .row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
                .cancel-btn { padding: 10px 24px; background: none; border: 1px solid var(--border); border-radius: 10px; color: white; }
                .save-btn { padding: 10px 24px; background: var(--primary); border: none; border-radius: 10px; color: white; font-weight: 700; display: flex; align-items: center; gap: 8px; }

                .location-grid { display: flex; flex-direction: column; gap: 16px; }
                .location-card-managed { background: #1a1a1b; border: 1px solid var(--border); border-radius: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
                .name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .loc-name { font-size: 16px; font-weight: 800; }
                .featured-badge { background: #EAB308; color: black; font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 4px; }
                .loc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
                .loc-tag { font-size: 9px; padding: 2px 8px; border-radius: 10px; background: rgba(255, 92, 0, 0.1); color: var(--primary); border: 1px solid var(--primary); font-weight: 700; }
                .loc-info p { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
                
                .card-actions { display: flex; gap: 8px; }
                .action-btn { background: #333; border: 1px solid var(--border); color: white; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .action-btn:hover { background: #444; }
                .action-btn.delete { color: #EF4444; }

                .preview-map-btn { background: none; border: 1px solid var(--primary); color: var(--primary); width: 20px; height: 20px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; margin-left: 8px; cursor: pointer; transition: all 0.2s; }
                .preview-map-btn:hover { background: var(--primary); color: white; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .loader-box { padding: 60px; text-align: center; color: var(--text-secondary); font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
                .empty-box { padding: 60px; text-align: center; color: var(--text-secondary); background: #1a1a1b; border-radius: 16px; border: 1px dashed var(--border); }

                .image-uploader-box { margin-top: 8px; }
                .upload-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 160px; background: #000; border: 1px dashed var(--border); border-radius: 12px; cursor: pointer; color: var(--text-secondary); transition: 0.3s; }
                .upload-placeholder:hover { border-color: var(--primary); color: white; background: rgba(255,255,255,0.02); }
                .preview-container { position: relative; height: 160px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
                .preview-container img { width: 100%; height: 100%; object-fit: cover; }
                .remove-img-btn { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; opacity: 0; transition: 0.3s; border: none; }
                .preview-container:hover .remove-img-btn { opacity: 1; pointer-events: auto; }
            `}</style>
        </div>
    );
};

export default LocationManager;
