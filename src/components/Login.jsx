import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();

            if (normalizedEmail === 'test@gmail.com' && password === '111') {
                // 記錄超級管理者登入
                await supabase
                    .from('user_logins')
                    .insert({
                        email: 'test@gmail.com',
                        role: 'admin',
                        login_at: new Date().toISOString()
                    });

                onLoginSuccess({
                    email: 'test@gmail.com',
                    role: 'admin',
                    userIdString: 'SUPER_ADMIN',
                    profile: { name: '超級管理者', first_login_completed: true }
                });
                return;
            }

            // 一般帳號查詢權限表
            const { data: permission, error: permError } = await supabase
                .from('user_permissions')
                .select('*')
                .eq('email', normalizedEmail)
                .eq('password', password)
                .single();

            if (permError || !permission) {
                throw new Error('帳號或密碼錯誤');
            }

            // 如果是已註冊，檢查 profile 是否完成
            let profile = null;
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', normalizedEmail)
                .single();

            profile = profileData;

            // 如果是第一次登入 (status 為 '未註冊' 且非超級管理者)
            if (permission.status === '未註冊') {
                await supabase
                    .from('user_permissions')
                    .update({ status: '已註冊' })
                    .eq('email', normalizedEmail);
            }

            // 記錄本次登入 (供管理員儀表板統計)
            await supabase
                .from('user_logins')
                .insert({
                    email: normalizedEmail,
                    role: permission.role,
                    login_at: new Date().toISOString()
                });

            onLoginSuccess({
                email: normalizedEmail,
                role: permission.role,
                userIdString: permission.user_id_string,
                profile: profile
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Image Layer */}
            <div className="login-bg-image" style={{ backgroundImage: "url('/images/login-bg.png')" }}></div>
            <div className="login-overlay"></div>

            <div className="login-content">
                <div className="brand-header">
                    <h1 className="brand-logo">JENZiQ <span className="white-text">FITNESS</span></h1>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && <div className="error-msg">{error}</div>}

                    <div className="input-group">
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? <Loader2 className="spin" size={20} /> : 'Login'}
                    </button>

                    <p className="switch-text">
                        Don't have an account? <span className="highlight-text">Sign Up here</span>
                    </p>
                </form>
            </div>

            <style>{`
                .login-container {
                    height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    background-color: #050b10;
                }

                .login-bg-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 65%;
                    background-size: cover;
                    background-position: center 20%;
                    z-index: 1;
                }

                .login-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to bottom, 
                        rgba(5, 11, 16, 0.1) 0%, 
                        rgba(5, 11, 16, 0.4) 40%, 
                        rgba(5, 11, 16, 0.95) 75%, 
                        #050b10 100%);
                    z-index: 2;
                }

                .login-content {
                    width: 100%;
                    max-width: 420px;
                    padding: 0 32px 60px;
                    z-index: 10;
                    position: relative;
                }

                .brand-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                
                .welcome-text {
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    opacity: 0.9;
                }

                .brand-logo { 
                    font-size: 32px; 
                    font-weight: 900; 
                    color: var(--primary); 
                    margin-bottom: 8px;
                    letter-spacing: -1px;
                    text-transform: uppercase;
                }
                .white-text { color: white; }
                .brand-tagline { 
                    font-size: 14px; 
                    color: rgba(255,255,255,0.6); 
                    font-weight: 500;
                }
                
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .error-msg { 
                    background: rgba(239, 68, 68, 0.15); 
                    color: #EF4444; 
                    padding: 12px; 
                    border-radius: 12px; 
                    font-size: 13px; 
                    text-align: center;
                    border: 1px solid rgba(239, 68, 68, 0.3); 
                }
                
                .input-group { position: relative; }
                .input-wrapper { 
                    position: relative; 
                    background: white;
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .input-icon { 
                    position: absolute; 
                    left: 16px; 
                    top: 50%; 
                    transform: translateY(-50%); 
                    color: #94A3B8; 
                }
                .input-wrapper input { 
                    width: 100%; 
                    background: transparent; 
                    border: none; 
                    padding: 18px 18px 18px 48px; 
                    color: #1E293B; 
                    font-size: 16px;
                    outline: none; 
                    font-weight: 500;
                }
                .input-wrapper input::placeholder {
                    color: #94A3B8;
                    opacity: 0.7;
                }
                
                .login-btn { 
                    width: 100%; 
                    background: #FACC15; /* Yellow/Gold as in reference */
                    color: #000; 
                    padding: 18px; 
                    border-radius: 14px; 
                    font-size: 18px; 
                    font-weight: 800; 
                    margin-top: 8px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px rgba(250, 204, 21, 0.3);
                }
                .login-btn:hover {
                    box-shadow: 0 6px 20px rgba(250, 204, 21, 0.4);
                    transform: translateY(-2px);
                }
                .login-btn:active {
                    transform: translateY(0);
                }
                .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .divider {
                    display: flex;
                    align-items: center;
                    margin: 12px 0;
                    color: rgba(255,255,255,0.4);
                    font-size: 14px;
                }
                .divider::before, .divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.1);
                }
                .divider span {
                    padding: 0 16px;
                }

                .social-login {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                }
                .social-icon {
                    width: 54px;
                    height: 54px;
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .social-icon:hover {
                    transform: translateY(-3px);
                    background: #f8fafc;
                }
                .social-icon img {
                    width: 24px;
                    height: 24px;
                }

                .switch-text {
                    text-align: center;
                    color: rgba(255,255,255,0.6);
                    font-size: 14px;
                    margin-top: 24px;
                }
                .highlight-text {
                    color: #FACC15;
                    font-weight: 700;
                    cursor: pointer;
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Login;
