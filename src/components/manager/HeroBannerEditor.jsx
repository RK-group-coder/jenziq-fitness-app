import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Check, X, Image as ImageIcon, Loader2, Phone, RotateCcw } from 'lucide-react';
import { getCroppedImg } from '../../utils/imageCrop';
import { supabase } from '../../supabase';

const HeroBannerEditor = () => {
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    // 建議比例：1:1.1 (符合首頁實體顯示比例)
    const ASPECT_RATIO = 1 / 1.1;

    useEffect(() => {
        fetchCurrentSetting();
    }, []);

    const fetchCurrentSetting = async () => {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'hero_banner').single();
        if (data?.value?.url) setPreviewUrl(data.value.url);
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => setImage(reader.result);
        }
    };

    const handleUpload = async () => {
        if (!image) return;
        try {
            setIsUploading(true);
            const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
            const fileName = `hero-${Date.now()}.jpg`;

            const { error: storageError } = await supabase.storage
                .from('student-dashboard-image')
                .upload(`public/${fileName}`, croppedImageBlob);

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
                .from('student-dashboard-image')
                .getPublicUrl(`public/${fileName}`);

            await supabase.from('app_settings').upsert({
                key: 'hero_banner',
                value: { url: publicUrl, last_updated: new Date().toISOString() }
            });

            setPreviewUrl(publicUrl);
            setImage(null);
            alert('背景圖更新成功！');
        } catch (error) {
            console.error(error);
            alert(`更新失敗: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="hero-editor-container">
            <div className="editor-intro">
                <h3 className="editor-title">首頁形象圖管理</h3>
                <p className="editor-subtitle">調整學員進入 APP 時的第一印象，支援即時預覽。</p>
            </div>

            <div className="editor-main">
                {/* 左側：大螢幕裁切區 */}
                <div className="crop-zone-card">
                    <div className="phone-frame">
                        <div className="camera-dot"></div>
                        <div className="screen">
                            {!image ? (
                                <label className="upload-btn-full">
                                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                    <div className="pulse-icon"><Upload size={40} /></div>
                                    <span className="main-text">點擊上傳原始照片</span>
                                    <span className="sub-text">建議使用高解析度圖片</span>
                                </label>
                            ) : (
                                <div className="cropper-wrapper">
                                    <Cropper
                                        image={image}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={ASPECT_RATIO}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                    {/* 模擬學員端文字 UI */}
                                    <div className="ui-mockup-overlay">
                                        <div className="mock-content">
                                            <h1 className="mock-title"><span>JENZiQ</span> FITNESS</h1>
                                            <p className="mock-desc">數位管理職，JENZiQ FITNESS 的 APP 這裡將會提供服務多項上的所有資源</p>
                                            <div className="mock-btns">
                                                <div className="mock-btn primary">體驗 →</div>
                                                <div className="mock-btn outline">健康知識</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {image && (
                        <div className="editor-tools">
                            <div className="zoom-section">
                                <label>縮放縮放</label>
                                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} />
                            </div>
                            <div className="tool-actions">
                                <button className="btn-secondary" onClick={() => setImage(null)}><RotateCcw size={16} /> 重選</button>
                                <button className="btn-primary" onClick={handleUpload} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                                    確認更新
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 右側：規格與目前呈現 */}
                <div className="side-panel">
                    <div className="spec-card">
                        <h4 className="side-title">建議規格</h4>
                        <div className="spec-grid">
                            <div className="spec-item">比例: <span>4:5</span></div>
                            <div className="spec-item">解析度: <span>1080p+</span></div>
                            <div className="spec-item">格式: <span>JPG</span></div>
                        </div>
                    </div>

                    <div className="preview-card-v2">
                        <h4 className="side-title">目前線上預覽</h4>
                        <div className="mini-phone-preview">
                            <div className="mini-screen">
                                {previewUrl ? (
                                    <div className="mini-hero-item" style={{ backgroundImage: `url(${previewUrl})` }}>
                                        <div className="mini-overlay">
                                            <div className="m-text">JENZiQ...</div>
                                            <div className="m-btn"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-preview">
                                        <ImageIcon size={32} />
                                        <span>未設定背景</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hero-editor-container { padding: 4px; }
                .editor-intro { margin-bottom: 24px; }
                .editor-title { font-size: 20px; font-weight: 850; color: white; margin-bottom: 6px; }
                .editor-subtitle { font-size: 13px; color: var(--text-secondary); }

                .editor-main { display: flex; gap: 32px; align-items: flex-start; }
                
                /* Phone Mockup Styling */
                .phone-frame {
                    width: 320px;
                    height: 580px;
                    background: #000;
                    border: 8px solid #1a1a1b;
                    border-radius: 40px;
                    position: relative;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                    padding: 8px;
                    margin: 0 auto;
                }
                .camera-dot { width: 40px; height: 4px; background: #1a1a1b; margin: 10px auto; border-radius: 10px; }
                .screen {
                    width: 100%;
                    height: calc(100% - 24px);
                    background: #0a0a0b;
                    border-radius: 30px;
                    overflow: hidden;
                    position: relative;
                }

                .upload-btn-full { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; cursor: pointer; color: #fff; text-align: center; }
                .pulse-icon { width: 80px; height: 80px; background: rgba(255, 92, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: var(--primary); animation: pulse 2s infinite; }
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 92, 0, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(255, 92, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 92, 0, 0); } }
                .main-text { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
                .sub-text { font-size: 12px; color: var(--text-secondary); }

                .cropper-wrapper { position: absolute; inset: 0; }
                .ui-mockup-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
                    pointer-events: none;
                    display: flex;
                    align-items: flex-end;
                    padding: 24px;
                    z-index: 10;
                }
                .mock-content { width: 100%; }
                .mock-title { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; }
                .mock-title span { color: var(--primary); }
                .mock-desc { font-size: 11px; color: rgba(255,255,255,0.7); margin-bottom: 16px; line-height: 1.5; }
                .mock-btns { display: flex; gap: 8px; }
                .mock-btn { flex: 1; padding: 10px; border-radius: 8px; font-size: 10px; font-weight: 700; text-align: center; }
                .mock-btn.primary { background: var(--primary); color: #fff; }
                .mock-btn.outline { border: 1px solid #fff; color: #fff; }

                .editor-tools { margin-top: 24px; width: 320px; margin-left: auto; margin-right: auto; }
                .zoom-section { margin-bottom: 16px; }
                .zoom-section label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
                .zoom-section input { width: 100%; accent-color: var(--primary); }
                .tool-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; }
                .btn-primary { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
                .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); padding: 12px; border-radius: 12px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }

                .side-panel { flex: 1; max-width: 300px; }
                .spec-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 20px; padding: 20px; margin-bottom: 24px; }
                .side-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 16px; }
                .spec-grid { display: flex; flex-direction: column; gap: 12px; }
                .spec-item { font-size: 13px; color: var(--text-secondary); }
                .spec-item span { color: var(--primary); font-weight: 700; margin-left: 6px; }

                .mini-phone-preview {
                    width: 140px;
                    height: 250px;
                    background: #1a1a1b;
                    border-radius: 24px;
                    padding: 6px;
                    margin: 0 auto;
                    border: 1px solid var(--border);
                }
                .mini-screen { width: 100%; height: 100%; border-radius: 18px; overflow: hidden; background: #000; }
                .mini-hero-item { width: 100%; height: 100%; background-size: cover; background-position: center; position: relative; }
                .mini-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); }
                .m-text { font-size: 8px; color: #fff; margin-bottom: 4px; }
                .m-btn { width: 30px; height: 6px; background: var(--primary); border-radius: 2px; }
                .empty-preview { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); gap: 8px; font-size: 10px; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 800px) {
                    .editor-main { flex-direction: column; align-items: center; }
                    .side-panel { max-width: 100%; width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default HeroBannerEditor;
