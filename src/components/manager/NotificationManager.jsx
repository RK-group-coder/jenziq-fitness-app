import React, { useState } from 'react';
import { Send, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';

const NotificationManager = () => {
    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('公告');
    const [target, setTarget] = useState('student');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'

    const tags = ['活動', '課程', '公告', '優惠'];
    const targets = [
        { id: 'student', label: '所有學生' },
        { id: 'coach', label: '所有教練' },
        { id: 'all', label: '所有人' }
    ];

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        setIsSending(true);
        setStatus(null);

        try {
            const { error } = await supabase
                .from('notifications')
                .insert([
                    {
                        title,
                        tag,
                        content,
                        target_role: target,
                    }
                ]);

            if (error) throw error;

            setStatus('success');
            setTitle('');
            setContent('');
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error('Error sending notification:', error);
            setStatus('error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="notification-manager">
            <div className="manager-page-header">
                <h2 className="page-title">發送系統通知</h2>
                <p className="page-subtitle">發送訊息給指定的對象，訊息將出現在對方的信件夾中。</p>
            </div>

            <div className="form-container">
                <form onSubmit={handleSend}>
                    <div className="form-section">
                        <label className="form-label">通知標題</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="請輸入標題..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-section">
                            <label className="form-label">選擇標籤</label>
                            <div className="tag-chips">
                                {tags.map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        className={`tag-chip ${tag === t ? 'active' : ''}`}
                                        onClick={() => setTag(t)}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-section">
                            <label className="form-label">發送對象</label>
                            <select
                                className="form-select"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            >
                                {targets.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">通知內文</label>
                        <textarea
                            className="form-textarea"
                            placeholder="請輸入通知詳細內容..."
                            rows="6"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className={`send-btn ${isSending ? 'loading' : ''}`}
                            disabled={isSending}
                        >
                            {isSending ? '發送中...' : (
                                <>
                                    <Send size={18} />
                                    <span>立即發送</span>
                                </>
                            )}
                        </button>
                    </div>

                    {status === 'success' && (
                        <div className="alert success">
                            <CheckCircle2 size={18} />
                            <span>通知已成功發送！</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="alert error">
                            <AlertCircle size={18} />
                            <span>發送失敗，請稍後再試。</span>
                        </div>
                    )}
                </form>
            </div>

            <style>{`
                .notification-manager {
                    padding: 24px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .manager-page-header {
                    margin-bottom: 32px;
                }
                .page-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 8px;
                }
                .page-subtitle {
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                .form-container {
                    background-color: var(--secondary-bg);
                    border-radius: 20px;
                    padding: 28px;
                    border: 1px solid var(--border);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .form-section {
                    margin-bottom: 24px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                .form-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 10px;
                }
                .form-input, .form-select, .form-textarea {
                    width: 100%;
                    background-color: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: white;
                    font-size: 15px;
                    transition: all 0.2s;
                }
                .form-input:focus, .form-select:focus, .form-textarea:focus {
                    border-color: var(--primary);
                    background-color: rgba(255, 92, 0, 0.05);
                    outline: none;
                }
                .tag-chips {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .tag-chip {
                    padding: 8px 16px;
                    border-radius: 10px;
                    background-color: rgba(255, 255, 255, 0.05);
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .tag-chip.active {
                    background-color: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 12px;
                }
                .send-btn {
                    background-color: var(--primary);
                    color: white;
                    padding: 14px 28px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s;
                    cursor: pointer;
                    border: none;
                }
                .send-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 92, 0, 0.4);
                    background-color: var(--primary-hover);
                }
                .send-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .alert {
                    margin-top: 20px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    animation: slideUp 0.3s ease-out;
                }
                .alert.success {
                    background-color: rgba(16, 185, 129, 0.1);
                    color: #10B981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .alert.error {
                    background-color: rgba(239, 68, 68, 0.1);
                    color: #EF4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @media (max-width: 600px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default NotificationManager;
