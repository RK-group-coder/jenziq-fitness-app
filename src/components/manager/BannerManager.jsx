import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Plus, Trash2, Edit2, Check, X, Upload, Link as LinkIcon, Loader2, GripVertical, Save } from 'lucide-react';
import { getCroppedImg } from '../../utils/imageCrop';
import { supabase } from '../../supabase';

const BannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBanner, setCurrentBanner] = useState({ image_url: '', link_url: '', order_index: 0 });

    // 裁剪相關狀態
    const [tempImage, setTempImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // 建議比例：2.5:1 (廣告橫幅)
    const ASPECT_RATIO = 2.5 / 1;

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('promo_banners')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            setBanners(data || []);
        } catch (err) {
            console.error('抓取廣告失敗:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e) => {
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

    const handleBannerSave = async () => {
        try {
            setIsUploading(true);
            let finalImageUrl = currentBanner.image_url;

            // 如果有新圖片，先上傳
            if (tempImage) {
                const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
                const fileName = `banner-${Date.now()}.jpg`;
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('student-dashboard-image')
                    .upload(`banners/${fileName}`, croppedBlob);

                if (storageError) throw storageError;

                const { data: { publicUrl } } = supabase.storage
                    .from('student-dashboard-image')
                    .getPublicUrl(`banners/${fileName}`);

                finalImageUrl = publicUrl;
            }

            if (!finalImageUrl) throw new Error('請先上傳廣告圖片');

            const bannerData = {
                image_url: finalImageUrl,
                link_url: currentBanner.link_url,
                order_index: currentBanner.id ? currentBanner.order_index : banners.length,
                is_active: true
            };

            const { data, error } = await supabase
                .from('promo_banners')
                .upsert(currentBanner.id ? { ...bannerData, id: currentBanner.id } : bannerData);

            if (error) throw error;

            await fetchBanners();
            resetForm();
            alert('保存成功！');
        } catch (err) {
            console.error('保存廣告失敗:', err);
            alert(`保存失敗: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBannerDelete = async (id) => {
        if (!confirm('確定要刪除這則廣告嗎？')) return;
        try {
            const { error } = await supabase.from('promo_banners').delete().eq('id', id);
            if (error) throw error;
            setBanners(banners.filter(b => b.id !== id));
        } catch (err) {
            console.error('刪除失敗:', err);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentBanner({ image_url: '', link_url: '', order_index: 0 });
        setTempImage(null);
    };

    return (
        <div className="banner-manager">
            <div className="section-header">
                <div className="header-info">
                    <h4 className="info-title">廣告輪播管理 (Banners)</h4>
                    <p className="info-desc">學員首頁的輪播廣告，建議比例 2:1。</p>
                </div>
                {!isEditing && (
                    <button className="add-btn" onClick={() => setIsEditing(true)}>
                        <Plus size={16} />
                        <span>新增廣告</span>
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="banner-form-card">
                    <div className="form-grid">
                        <div className="upload-zone">
                            {!tempImage && !currentBanner.image_url ? (
                                <label className="file-uploader">
                                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                    <Upload size={24} />
                                    <span>上傳圖片</span>
                                </label>
                            ) : tempImage ? (
                                <div className="crop-wrapper">
                                    <div className="crop-area">
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
                                    <div className="crop-footer">
                                        <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} />
                                        <span className="hint">拖動調整圖片位置</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="current-img-preview">
                                    <img src={currentBanner.image_url} alt="Current" />
                                    <button className="change-img-btn" onClick={() => setTempImage(null)}>更換圖片</button>
                                </div>
                            )}
                        </div>

                        <div className="link-zone">
                            <div className="input-group">
                                <label><LinkIcon size={14} /> 跳轉網址 (可選)</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com"
                                    value={currentBanner.link_url || ''}
                                    onChange={(e) => setCurrentBanner({ ...currentBanner, link_url: e.target.value })}
                                />
                                <p className="input-hint">學員點擊廣告後將會導向此連結</p>
                            </div>

                            <div className="form-actions">
                                <button className="btn-secondary" onClick={resetForm}>取消</button>
                                <button className="btn-primary" onClick={handleBannerSave} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    <span>保存廣告</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="banner-list">
                {isLoading ? (
                    <div className="loading-state"><Loader2 className="animate-spin" /> 讀取中...</div>
                ) : banners.length === 0 ? (
                    <div className="empty-state">目前尚未新增廣告</div>
                ) : (
                    <div className="banners-grid">
                        {banners.map(banner => (
                            <div key={banner.id} className="banner-item-card">
                                <div className="banner-preview">
                                    <img src={banner.image_url} alt="Banner" />
                                </div>
                                <div className="banner-details">
                                    <div className="banner-url">
                                        <LinkIcon size={10} />
                                        <span>{banner.link_url || '無連結'}</span>
                                    </div>
                                    <div className="banner-actions">
                                        <button className="icon-btn" onClick={() => {
                                            setCurrentBanner(banner);
                                            setIsEditing(true);
                                        }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="icon-btn delete" onClick={() => handleBannerDelete(banner.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .banner-manager { margin-top: 24px; border-top: 1px solid var(--border); padding-top: 24px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .info-title { font-size: 15px; font-weight: 700; color: white; margin-bottom: 4px; }
                .info-desc { font-size: 12px; color: var(--text-secondary); }
                .add-btn { background: var(--primary); color: white; padding: 8px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
                
                .banner-form-card { background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
                .form-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
                
                .upload-zone { background: #000; border-radius: 8px; position: relative; width: 100%; aspect-ratio: 2.5 / 1; overflow: hidden; border: 1px solid var(--border); }
                .file-uploader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; cursor: pointer; color: var(--text-secondary); gap: 12px; }
                .file-uploader:hover { color: white; background: rgba(255,255,255,0.05); }
                
                .crop-wrapper { width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; }
                .crop-area { flex: 1; position: relative; width: 100%; }
                .crop-footer { height: 44px; background: #111; display: flex; align-items: center; padding: 0 16px; gap: 12px; border-top: 1px solid var(--border); }
                .crop-footer input { flex: 1; accent-color: var(--primary); }
                .crop-footer .hint { font-size: 10px; color: var(--text-secondary); }

                .current-img-preview { position: relative; width: 100%; aspect-ratio: 2.5 / 1; }
                .current-img-preview img { width: 100%; height: 100%; object-fit: cover; }
                .change-img-btn { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; font-size: 12px; font-weight: 700; opacity: 0; transition: opacity 0.2s; }
                .current-img-preview:hover .change-img-btn { opacity: 1; }

                .link-zone { display: flex; flex-direction: column; gap: 20px; }
                .input-group label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: white; margin-bottom: 8px; }
                .input-group input { background: #111; border: 1px solid var(--border); border-radius: 8px; width: 100%; padding: 10px 12px; color: white; font-size: 13px; }
                .input-hint { font-size: 10px; color: var(--text-secondary); margin-top: 6px; }

                .form-actions { display: flex; gap: 12px; }
                .btn-primary, .btn-secondary { flex: 1; height: 40px; border-radius: 8px; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .btn-primary { background: var(--primary); color: white; }
                .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); }

                .banner-list { margin-top: 24px; }
                .banners-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                .banner-item-card { background: var(--secondary-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
                .banner-preview { height: 100px; }
                .banner-preview img { width: 100%; height: 100%; object-fit: cover; }
                .banner-details { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
                .banner-url { font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px; }
                .banner-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; }
                .icon-btn { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.05); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
                .icon-btn.delete { color: #EF4444; }

                @media (max-width: 600px) {
                    .form-grid { grid-template-columns: 1fr; }
                    .banners-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default BannerManager;
