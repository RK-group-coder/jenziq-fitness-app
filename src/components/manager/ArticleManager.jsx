import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import {
    Plus, Trash2, Edit2, Save, X, Image as ImageIcon,
    Loader2, Link as LinkIcon, Upload, Globe, User,
    FileText, Type, AlertCircle, CheckCircle2
} from 'lucide-react';

const ArticleManager = () => {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'Nutrition',
        author: '',
        source: '',
        excerpt: '',
        image_url: '',
        link_url: ''
    });

    const fileInputRef = useRef(null);
    const categories = ['Nutrition', 'Fitness', 'Pilates'];

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setArticles(data || []);
        } catch (err) {
            console.error('Fetch articles error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('圖片過大，請上傳小於 5MB 的檔案');
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('articles')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('articles')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (err) {
            console.error('Upload error:', err);
            alert(`圖片上傳失敗：${err.message || '請檢查 SQL 腳本是否執行'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.title || !formData.author) {
                alert('請填寫標題與作者');
                return;
            }

            if (editingId) {
                const { error } = await supabase.from('articles').update(formData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('articles').insert([formData]);
                if (error) throw error;
            }

            setFormData({ title: '', category: 'Nutrition', author: '', source: '', excerpt: '', image_url: '', link_url: '' });
            setIsAdding(false);
            setEditingId(null);
            fetchArticles();
        } catch (err) {
            console.error('Save error:', err);
            alert('儲存失敗');
        }
    };

    return (
        <div className="article-mgmt">
            <div className="header-bar">
                <h1>文章內容管理</h1>
                {!isAdding && (
                    <button className="add-btn" onClick={() => setIsAdding(true)}>
                        <Plus size={20} /> 新增內容
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="editor-overlay">
                    <div className="editor-main">
                        <div className="editor-top">
                            <h3>{editingId ? '編輯文章' : '發布新文章'}</h3>
                            <button className="close-x" onClick={() => { setIsAdding(false); setEditingId(null); }}><X /></button>
                        </div>

                        <div className="editor-scroller">
                            <div className="field-section">
                                <label><ImageIcon size={14} /> 封面圖片</label>
                                <div className="img-picker" onClick={() => fileInputRef.current.click()}>
                                    {formData.image_url ? (
                                        <div className="img-filled">
                                            <img src={formData.image_url} alt="预览" />
                                            <div className="hover-tip"><Upload /> 更換一張</div>
                                        </div>
                                    ) : (
                                        <div className="img-empty">
                                            {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                                            <p>{isUploading ? '正在上傳...' : '點擊選擇照片'}</p>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                                <input
                                    className="url-input"
                                    type="text"
                                    placeholder="或貼上網址: https://..."
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>

                            <div className="field-section">
                                <label><Type size={14} /> 標題 *</label>
                                <input type="text" placeholder="輸入文章標題" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>

                            <div className="grid-2">
                                <div className="field-section">
                                    <label><User size={14} /> 作者 *</label>
                                    <input type="text" placeholder="您的名字" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                                </div>
                                <div className="field-section">
                                    <label><Globe size={14} /> 類別</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="field-section">
                                    <label><AlertCircle size={14} /> 來源</label>
                                    <input type="text" placeholder="例如: 康健" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} />
                                </div>
                                <div className="field-section">
                                    <label><LinkIcon size={14} /> 跳轉連結</label>
                                    <input type="text" placeholder="https://..." value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} />
                                </div>
                            </div>

                            <div className="field-section">
                                <label><FileText size={14} /> 摘要內文</label>
                                <textarea rows="3" placeholder="簡短介紹這篇文章..." value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })}></textarea>
                            </div>
                        </div>

                        <div className="editor-footer">
                            <button className="cancel-btn" onClick={() => setIsAdding(false)}>取消</button>
                            <button className="submit-btn" onClick={handleSave} disabled={isUploading}>
                                <Save size={18} /> 儲存發布
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="list-view">
                {articles.map(art => (
                    <div key={art.id} className="item-card">
                        <div className="item-img">{art.image_url && <img src={art.image_url} />}</div>
                        <div className="item-content">
                            <h4>{art.title}</h4>
                            <p>By {art.author} @{art.category}</p>
                            <div className="item-actions">
                                <button className="edit-btn" onClick={() => { setFormData(art); setEditingId(art.id); setIsAdding(true); }}><Edit2 size={16} /></button>
                                <button className="del-btn" onClick={() => { if (confirm('確定刪除？')) supabase.from('articles').delete().eq('id', art.id).then(fetchArticles); }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .article-mgmt { padding: 20px; color: white; }
                .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .header-bar h1 { font-size: 20px; font-weight: 800; }
                .add-btn { background: var(--primary); color: white; border-radius: 12px; padding: 10px 20px; font-weight: 700; height: fit-content; }
                
                .editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .editor-main { background: #1E293B; width: 100%; max-width: 500px; max-height: 90vh; border-radius: 24px; display: flex; flex-direction: column; }
                .editor-top { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .editor-scroller { padding: 20px; overflow-y: auto; flex: 1; }
                
                .field-section { margin-bottom: 20px; }
                .field-section label { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; color: #64748B; margin-bottom: 8px; text-transform: uppercase; }
                .field-section input, .field-section select, .field-section textarea { width: 100%; background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 12px; color: white; outline: none; }
                .url-input { margin-top: 8px; font-size: 11px; opacity: 0.6; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                
                .img-picker { width: 100%; aspect-ratio: 16/9; background: #0F172A; border: 2px dashed #334155; border-radius: 16px; overflow: hidden; cursor: pointer; }
                .img-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #475569; }
                .img-filled { height: 100%; position: relative; }
                .img-filled img { width: 100%; height: 100%; object-fit: cover; }
                
                .editor-footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 12px; }
                .submit-btn { flex: 1; background: var(--primary); color: white; height: 48px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .cancel-btn { background: #334155; color: white; padding: 0 20px; border-radius: 14px; font-weight: 600; }
                
                .list-view { display: flex; flex-direction: column; gap: 12px; }
                .item-card { background: #1a1a1b; border-radius: 16px; padding: 12px; display: flex; gap: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .item-img { width: 80px; height: 80px; border-radius: 12px; background: #0F172A; overflow: hidden; flex-shrink: 0; }
                .item-img img { width: 100%; height: 100%; object-fit: cover; }
                .item-content h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
                .item-content p { font-size: 12px; color: #64748B; margin-bottom: 8px; }
                .item-actions { display: flex; gap: 12px; }
                .edit-btn { color: #94A3B8; }
                .del-btn { color: #EF4444; }
                .hidden { display: none; }
            `}</style>
        </div>
    );
};

export default ArticleManager;
