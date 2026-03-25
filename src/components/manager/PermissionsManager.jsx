import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Shield, Key, Mail, Hash, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../supabase';

const PermissionsManager = () => {
    const [permissions, setPermissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        role: 'student',
        userIdString: '',
        password: ''
    });

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('user_permissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPermissions(data);
        } else if (error) {
            console.error('Fetch permissions error:', error);
        }
        setIsLoading(false);
    };

    const handleAddPermission = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('user_permissions')
                .insert([{
                    email: formData.email,
                    role: formData.role,
                    user_id_string: formData.userIdString,
                    password: formData.password,
                    status: '未註冊'
                }]);

            if (error) throw error;

            alert('權限已新增');
            setIsModalOpen(false);
            setFormData({ email: '', role: 'student', userIdString: '', password: '' });
            fetchPermissions();
        } catch (err) {
            alert('新增失敗: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="permissions-manager">
            <header className="manager-header">
                <div>
                    <h2>權限設置</h2>
                    <p>管理系統存取權限與登入帳號</p>
                </div>
                <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={18} />
                    <span>新增權限</span>
                </button>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><Shield size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-label">總帳號數</span>
                        <span className="stat-value">{permissions?.length || 0}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle2 size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-label">已註冊</span>
                        <span className="stat-value">{permissions.filter(p => p.status === '已註冊').length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Clock size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-label">待註冊</span>
                        <span className="stat-value">{permissions.filter(p => p.status === '未註冊').length}</span>
                    </div>
                </div>
            </div>

            <div className="list-container">
                {isLoading ? (
                    <div className="loading-state"><Loader2 className="spin" /> 讀取中...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="permissions-table">
                            <thead>
                                <tr>
                                    <th>GMAIL / 帳號</th>
                                    <th>身分角色</th>
                                    <th>用戶編號</th>
                                    <th>登入密碼</th>
                                    <th>註冊狀態</th>
                                    <th>建立時間</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissions.map(p => (
                                    <tr key={p.email}>
                                        <td>
                                            <div className="email-cell">
                                                <Mail size={14} />
                                                <span>{p.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${p.role}`}>
                                                {p.role === 'manager' ? '管理者' : p.role === 'coach' ? '教練' : p.role === 'student' ? '學員' : '超級管理者'}
                                            </span>
                                        </td>
                                        <td><span className="id-text">#{p.user_id_string}</span></td>
                                        <td><span className="password-text">{p.password}</span></td>
                                        <td>
                                            <span className={`status-badge ${p.status === '已註冊' ? 'registered' : 'unregistered'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>新增系統權限</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><Hash size={20} /></button>
                        </div>
                        <form onSubmit={handleAddPermission} className="modal-form">
                            <div className="form-group">
                                <label>GMAIL 帳號</label>
                                <div className="input-wrapper">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        placeholder="user@gmail.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value.trim() })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>給予身分</label>
                                <div className="input-wrapper">
                                    <Shield size={18} />
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="student">學員</option>
                                        <option value="coach">教練</option>
                                        <option value="manager">管理者</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>用戶編號 (ID)</label>
                                    <div className="input-wrapper">
                                        <Hash size={18} />
                                        <input
                                            type="text"
                                            placeholder="如: S001"
                                            value={formData.userIdString}
                                            onChange={e => setFormData({ ...formData, userIdString: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>初始密碼</label>
                                    <div className="input-wrapper">
                                        <Key size={18} />
                                        <input
                                            type="text"
                                            placeholder="設定初始密碼"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="spin" size={18} /> : '確認新增'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .permissions-manager { padding: 32px; height: 100%; overflow-y: auto; }
                .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .manager-header h2 { font-size: 28px; font-weight: 800; color: white; margin-bottom: 4px; }
                .manager-header p { color: var(--text-secondary); font-size: 14px; }
                
                .add-btn { background: var(--primary); color: white; padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-weight: 700; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
                .stat-card { background: var(--secondary-bg); border: 1px solid var(--border); padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 16px; }
                .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-icon.purple { background: rgba(168, 85, 247, 0.1); color: #A855F7; }
                .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10B981; }
                .stat-icon.orange { background: rgba(255, 92, 0, 0.1); color: var(--primary); }
                .stat-label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600; }
                .stat-value { font-size: 20px; font-weight: 800; color: white; }

                .list-container { background: var(--secondary-bg); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; }
                .table-responsive { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
                .permissions-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 700px; }
                .permissions-table th { padding: 20px; background: rgba(255,255,255,0.02); color: var(--text-secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
                .permissions-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); color: white; font-size: 14px; white-space: nowrap; }
                
                .email-cell { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
                .role-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
                .role-badge.manager { background: rgba(168, 85, 247, 0.1); color: #A855F7; }
                .role-badge.coach { background: rgba(255, 92, 0, 0.1); color: var(--primary); }
                .role-badge.student { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
                .role-badge.admin { background: rgba(255, 255, 255, 0.1); color: white; }
                
                .id-text { color: var(--primary); font-family: monospace; font-weight: 700; }
                .password-text { font-family: monospace; opacity: 0.6; }
                
                .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .status-badge.registered { background: #10B981; color: white; }
                .status-badge.unregistered { background: rgba(255,255,255,0.05); color: var(--text-secondary); }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #18181B; width: 100%; max-width: 440px; border-radius: 24px; border: 1px solid var(--border); overflow: hidden; }
                .modal-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
                .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .input-wrapper { position: relative; }
                .input-wrapper svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
                input, select { width: 100%; background: #0A0A0B; border: 1px solid var(--border); padding: 14px 14px 14px 48px; border-radius: 12px; color: white; outline: none; }
                .submit-btn { background: var(--primary); color: white; padding: 16px; border-radius: 12px; font-weight: 800; font-size: 16px; margin-top: 10px; }
            `}</style>
        </div>
    );
};

export default PermissionsManager;
