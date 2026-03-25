import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const ProfileForm = ({ user, onComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        gender: '男',
        age: '',
        phone: '',
        branch: ''
    });
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user.role === 'coach') {
            fetchLocations();
        }
    }, [user.role]);

    const fetchLocations = async () => {
        const { data } = await supabase.from('locations').select('name');
        if (data) setLocations(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 先確認是否有 profile 紀錄，若有就 update，無就 insert
            const normalizedEmail = user.email.toLowerCase();
            const { data: existing } = await supabase
                .from('user_profiles')
                .select('email')
                .eq('email', normalizedEmail)
                .single();

            const profileData = {
                email: normalizedEmail,
                name: formData.name,
                gender: formData.gender,
                age: parseInt(formData.age),
                phone: formData.phone,
                branch: user.role === 'coach' ? formData.branch : null,
                role: user.role, // 儲存角色以便後續友人搜尋過濾
                first_login_completed: true
            };

            if (existing) {
                const { error } = await supabase
                    .from('user_profiles')
                    .update(profileData)
                    .eq('email', normalizedEmail);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('user_profiles')
                    .insert(profileData);
                if (error) throw error;
            }

            // 自動加管理員為好友 (支援中心)
            await addAdminAsFriend(normalizedEmail);

            // 教練自動加同店教練好友
            if (user.role === 'coach' && profileData.branch) {
                await autoFriendSameBranch(normalizedEmail, profileData.branch);
            }

            onComplete({ ...user, profile: profileData });
        } catch (err) {
            alert('上傳資料失敗: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const autoFriendSameBranch = async (myEmail, branchName) => {
        try {
            const normalizedMyEmail = myEmail.toLowerCase();
            // 找出同一分店的所有教練
            const { data: colleagues } = await supabase
                .from('user_profiles')
                .select('email')
                .eq('branch', branchName)
                .eq('role', 'coach')
                .neq('email', normalizedMyEmail);

            if (colleagues && colleagues.length > 0) {
                const friendshipData = [];
                colleagues.forEach(c => {
                    const friendEmail = c.email.toLowerCase();
                    // 雙向好友
                    friendshipData.push({ user_email: normalizedMyEmail, friend_email: friendEmail });
                    friendshipData.push({ user_email: friendEmail, friend_email: normalizedMyEmail });
                });

                await supabase.from('friends').upsert(friendshipData, { onConflict: 'user_email,friend_email' });
            }
        } catch (error) {
            console.error('Auto-friendship error:', error);
        }
    };

    const addAdminAsFriend = async (myEmail) => {
        try {
            const adminEmail = 'test@gmail.com'; // 預設管理者 Email
            const normalizedMyEmail = myEmail.toLowerCase();
            
            const friendshipData = [
                { user_email: normalizedMyEmail, friend_email: adminEmail },
                { user_email: adminEmail, friend_email: normalizedMyEmail }
            ];

            await supabase.from('friends').upsert(friendshipData, { onConflict: 'user_email,friend_email' });

            // 發送初次歡迎訊息
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .or(`and(sender_email.eq.${normalizedMyEmail},receiver_email.eq.${adminEmail}),and(sender_email.eq.${adminEmail},receiver_email.eq.${normalizedMyEmail})`);

            if (count === 0) {
                await supabase.from('messages').insert([{
                    sender_email: adminEmail,
                    receiver_email: normalizedMyEmail,
                    content: '歡迎使用管理中心。\n如果您需要協助，請直接發送訊息。\n我們的團隊會盡快回覆您。',
                    is_ai: true,
                    message_type: 'text'
                }]);
            }
        } catch (error) {
            console.error('Add admin error:', error);
        }
    };

    return (
        <div className="profile-overlay">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>完善個人資料</h2>
                    <p>第一次登入請填寫基本資料，與您的編號 {user.userIdString} 綁定</p>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>真實姓名</label>
                        <div className="input-wrapper">
                            <User size={18} />
                            <input
                                type="text"
                                placeholder="請輸入姓名"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>性別</label>
                            <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option>男</option>
                                <option>女</option>
                                <option>其他</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>年齡</label>
                            <input
                                type="number"
                                placeholder="年齡"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>聯絡電話</label>
                        <div className="input-wrapper">
                            <Phone size={18} />
                            <input
                                type="tel"
                                placeholder="0912-345-678"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {user.role === 'coach' && (
                        <div className="form-group">
                            <label>所屬分店</label>
                            <div className="input-wrapper">
                                <MapPin size={18} />
                                <select
                                    value={formData.branch}
                                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                    required
                                >
                                    <option value="">請選擇店鋪</option>
                                    {locations.map(loc => (
                                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? <Loader2 className="spin" size={20} /> : '完成設置'}
                    </button>
                </form>
            </div>

            <style>{`
                .profile-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
                    z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 20px;
                }
                .profile-card { background: #18181B; width: 100%; max-width: 480px; border-radius: 28px; border: 1px solid var(--border); padding: 40px; }
                .profile-header { text-align: center; margin-bottom: 32px; }
                .profile-header h2 { font-size: 24px; font-weight: 800; color: white; margin-bottom: 8px; }
                .profile-header p { font-size: 14px; color: var(--text-secondary); }
                
                .profile-form { display: flex; flex-direction: column; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
                .input-wrapper { position: relative; }
                .input-wrapper svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
                
                input, select { 
                    width: 100%; background: #0A0A0B; border: 1px solid var(--border); 
                    padding: 14px 14px 14px 44px; border-radius: 14px; color: white; outline: none; transition: 0.2s; 
                }
                .form-row input, .form-row select { padding-left: 14px; }
                input:focus, select:focus { border-color: var(--primary); }

                .submit-btn { 
                    background: var(--primary); color: white; padding: 18px; border-radius: 16px; 
                    font-size: 16px; font-weight: 800; margin-top: 20px; display: flex; align-items: center; justify-content: center;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ProfileForm;
