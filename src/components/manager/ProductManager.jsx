import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Package, DollarSign, Tag } from 'lucide-react';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: 'supplements',
        stock: 0,
        is_active: true
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error('Fetch products error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            alert('請填寫商品名稱與價格');
            return;
        }

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('products')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([formData]);
                if (error) throw error;
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({ name: '', description: '', price: '', image_url: '', category: 'supplements', stock: 0, is_active: true });
            fetchProducts();
        } catch (err) {
            alert('儲存失敗: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此商品嗎？')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (err) {
            alert('刪除失敗: ' + err.message);
        }
    };

    const startEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            description: p.description,
            price: p.price,
            image_url: p.image_url,
            category: p.category,
            stock: p.stock,
            is_active: p.is_active
        });
        setIsAdding(true);
    };

    return (
        <div className="product-manager p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight">商品上架管理</h2>
                    <p className="text-sm text-gray-500">管理商城內的補給品與服飾商品</p>
                </div>
                <button 
                    onClick={() => { setIsAdding(true); setEditingId(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all"
                >
                    <Plus size={18} />
                    新增商品
                </button>
            </div>

            {isAdding && (
                <div className="bg-[#1a1a1b] p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-white">{editingId ? '編輯商品' : '新增商品'}</h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">商品名稱</label>
                            <input 
                                type="text" value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">類別</label>
                            <select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                            >
                                <option value="supplements">肌力補充 (Supplements)</option>
                                <option value="apparel">專業服飾 (Apparel)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">價格 (TWD)</label>
                            <input 
                                type="number" value={formData.price} 
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">庫存數量</label>
                            <input 
                                type="number" value={formData.stock} 
                                onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">圖片 URL</label>
                            <input 
                                type="text" value={formData.image_url} 
                                onChange={e => setFormData({...formData, image_url: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">商品描述</label>
                            <textarea 
                                rows={3} value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={handleSave} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all">儲存商品</button>
                        <button onClick={() => setIsAdding(false)} className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">取消</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                    <div key={p.id} className="bg-[#1a1a1b] rounded-3xl border border-white/10 overflow-hidden group">
                        <div className="aspect-square relative bg-black/20">
                            {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700"><ImageIcon size={48} /></div>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(p)} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-orange-600 transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(p.id)} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-red-600 transition-all"><Trash2 size={16} /></button>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${p.category === 'supplements' ? 'bg-orange-500' : 'bg-blue-500'} text-white`}>
                                    {p.category === 'supplements' ? '肌力補充' : '專業服飾'}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <h4 className="font-bold text-white text-lg">{p.name}</h4>
                                <p className="text-xs text-gray-500 line-clamp-1 mt-1">{p.description}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <div className="flex items-center gap-1 text-orange-500 font-black text-xl italic">
                                    <span className="text-xs not-italic">$</span>
                                    {parseFloat(p.price).toLocaleString()}
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">目前庫存</p>
                                    <p className="font-bold text-white">{p.stock}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
                    <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="font-bold italic">載入商品中...</p>
                </div>
            )}
        </div>
    );
};

export default ProductManager;
