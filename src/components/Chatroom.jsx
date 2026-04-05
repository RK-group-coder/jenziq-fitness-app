import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Image as ImageIcon, 
  Heart, 
  Send, 
  Info, 
    Camera,
  Mic,
  Smile,
  X,
  Loader2,
  Sticker,
  Brain,
  Bot as BotIcon
} from 'lucide-react';
import { supabase } from '../supabase';

const JZLogoAvatar = ({ size = 40 }) => (
    <div className="jz-logo-avatar" style={{ 
        width: size, height: size, 
        background: 'linear-gradient(135deg, #FF5C00, #E11D48)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: '900', fontSize: size * 0.4,
        boxShadow: '0 0 15px rgba(255, 92, 0, 0.3)'
    }}>
        JZ
    </div>
);

const Chatroom = ({ user, onBack, initialFriend }) => {
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(initialFriend || null);
    const [messages, setMessages] = useState([]);
    const SUPPORT_EMAIL = 'test@gmail.com';
    const SUPPORT_AVATAR = 'https://ai-assistant-avatar.png'; // Placeholder for constant check
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const [showMentionSuggest, setShowMentionSuggest] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const stickers = [
        '🔥', '💪', '🏋️', '🥗', '💯', '✨', '👟', '🍎', '🙌', '👏', 
        '🤩', '😎', '🔥', '💧', '⚡', '🏆', '🎯', '🏃', '🚴', '🧘'
    ];

    const myEmail = user.email.toLowerCase();
    const isAdmin = user?.profile?.role === 'manager' || user?.role === 'manager' || myEmail === SUPPORT_EMAIL.toLowerCase();
    const effectiveEmail = isAdmin ? SUPPORT_EMAIL.toLowerCase() : myEmail;

    // 1. 獲取人員列表 (管理員顯示全體，用戶顯示好友)
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setIsLoadingFriends(true);

                let profiles = [];

                if (isAdmin) {
                    // 管理員模式：向資料庫抓取所有使用者資料，不在資料庫層級過濾以防 NULL role 漏掉
                    const { data: allUsers, error: userError } = await supabase
                        .from('user_profiles')
                        .select('email, name, avatar_url, role, branch');

                    if (userError) throw userError;
                    
                    // 在 JS 端過濾：排除「目前的管理者自己」以及「其他標記為 manager 的人」(除非是支援中心)
                    profiles = (allUsers || []).filter(p => {
                        const isMe = p.email.toLowerCase() === myEmail;
                        const isOtherManager = p.role === 'manager' && p.email.toLowerCase() !== SUPPORT_EMAIL.toLowerCase();
                        // 我們希望看到教練、學員，以及那個「支援中心」(test@gmail.com) 帳號供管理者之間協作(若需要)
                        // 或者依照使用者要求「管理者以外的使用者」，那我們排除所有 role 為 manager 的
                        return !isMe && p.role !== 'manager';
                    });
                    
                    // 為了確保「支援中心」這個對象能出現供其他管理員看到（或者身為管理員要看支援機器人訊息）
                    // 如果名單沒抓到 test@gmail.com，且我自己不是 test@gmail.com，則手動補上
                    if (myEmail !== SUPPORT_EMAIL.toLowerCase() && !profiles.some(p => p.email.toLowerCase() === SUPPORT_EMAIL.toLowerCase())) {
                        const { data: supportProf } = await supabase
                            .from('user_profiles')
                            .select('email, name, avatar_url, role, branch')
                            .eq('email', SUPPORT_EMAIL.toLowerCase())
                            .maybeSingle();
                        if (supportProf) profiles.push(supportProf);
                    }
                } else {
                    // 普通用戶模式：從 friends 表獲取好友
                    let { data: friendshipData, error: friendError } = await supabase
                        .from('friends')
                        .select('friend_email')
                        .eq('user_email', myEmail);

                    if (friendError) throw friendError;
                    const friendEmails = friendshipData ? friendshipData.map(f => f.friend_email.toLowerCase()) : [];

                    // 確保每個帳號都有支援中心
                    if (!friendEmails.includes(SUPPORT_EMAIL.toLowerCase())) {
                        await supabase.from('friends').upsert([
                            { user_email: myEmail, friend_email: SUPPORT_EMAIL },
                            { user_email: SUPPORT_EMAIL, friend_email: myEmail }
                        ], { onConflict: 'user_email,friend_email' });
                        if (!friendEmails.includes(SUPPORT_EMAIL.toLowerCase())) {
                            friendEmails.push(SUPPORT_EMAIL.toLowerCase());
                        }
                    }

                    // 獲取好友的個人資料
                    const { data: friendProfiles, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('email, name, avatar_url, role, branch')
                        .in('email', friendEmails);

                    if (profileError) throw profileError;
                    profiles = friendProfiles || [];
                }

                if (profiles.length > 0) {
                    // 為原本名單中的每個人獲取最後一條訊息與未讀數
                    const profilesWithData = await Promise.all(profiles.map(async (p) => {
                        const { data: lastMsg } = await supabase
                            .from('messages')
                            .select('content, message_type, created_at')
                            .or(`and(sender_email.eq.${effectiveEmail},receiver_email.eq.${p.email}),and(sender_email.eq.${p.email},receiver_email.eq.${effectiveEmail})`)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                        
                        const { count: unreadCount } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('sender_email', p.email)
                            .eq('receiver_email', effectiveEmail)
                            .eq('is_read', false);
                        
                        return { 
                            ...p, 
                            lastMessage: lastMsg, 
                            unreadCount: unreadCount || 0,
                            displayName: p.email.toLowerCase() === SUPPORT_EMAIL.toLowerCase() ? 'JENZiQ AI' : (p.name || p.email)
                        };
                    }));

                    // 排序：有新訊息或身為初始對象的在前
                    profilesWithData.sort((a, b) => {
                        if (initialFriend && a.email.toLowerCase() === initialFriend.email.toLowerCase()) return -1;
                        if (initialFriend && b.email.toLowerCase() === initialFriend.email.toLowerCase()) return 1;
                        
                        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
                        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
                        return timeB - timeA;
                    });

                    setFriends(profilesWithData);

                    // 如果有 initialFriend，根據資料更新當前選中的對象
                    if (initialFriend) {
                        const found = profilesWithData.find(f => f.email.toLowerCase() === initialFriend.email.toLowerCase());
                        if (found) setSelectedFriend(found);
                    } else if (isAdmin && profilesWithData.length > 0 && !selectedFriend) {
                        // 管理員首次進入，預設不強制選擇，讓管理員自己挑選
                    }
                }
            } catch (err) {
                console.error('Fetch friends error:', err);
            } finally {
                setIsLoadingFriends(false);
            }
        };

        if (user?.email) fetchFriends();
    }, [user.email, initialFriend]);

    // 2. 選擇好友後獲取訊息並開啟即時訂閱
    useEffect(() => {
        if (!selectedFriend) return;

        const fetchMessages = async () => {
            try {
                const friendEmail = selectedFriend.email.toLowerCase();

                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .or(`and(sender_email.eq.${effectiveEmail},receiver_email.eq.${friendEmail}),and(sender_email.eq.${friendEmail},receiver_email.eq.${effectiveEmail})`)
                    .order('created_at', { ascending: true });

                if (error) {
                    // ... 略 ...
                    if (error.code === '42P01') {
                        console.warn('Messages table not found. Please run the SQL migration.');
                        setMessages([]);
                    } else {
                        throw error;
                    }
                } else {
                    setMessages(data || []);
                    // 將訊息設為已讀
                    await supabase
                        .from('messages')
                        .update({ is_read: true })
                        .eq('sender_email', friendEmail)
                        .eq('receiver_email', effectiveEmail)
                        .eq('is_read', false);
                    
                    // 更新本地好友清單的未讀數
                    setFriends(prev => prev.map(f => 
                        f.email === friendEmail ? { ...f, unreadCount: 0 } : f
                    ));
                }
            } catch (err) {
                console.error('Fetch messages error:', err);
            }
        };

        fetchMessages();

        // 訂閱即時訊息
        const channel = supabase
            .channel(`chat_${selectedFriend.email}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `receiver_email=eq.${effectiveEmail}`
            }, async (payload) => {
                const senderEmail = payload.new.sender_email;
                
                // 如果當前正在與該發送者聊天，直接設為已讀
                if (senderEmail === selectedFriend.email.toLowerCase()) {
                    await supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id);
                    setMessages(prev => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                } else {
                    // 否則增加未讀數
                    setFriends(prev => prev.map(f => {
                        if (f.email === senderEmail) {
                            return { 
                                ...f, 
                                unreadCount: (f.unreadCount || 0) + 1,
                                lastMessage: {
                                    content: payload.new.content,
                                    message_type: payload.new.message_type,
                                    created_at: payload.new.created_at
                                }
                            };
                        }
                        return f;
                    }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedFriend, user.email]);

    // 3. 自動捲動到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. 發送訊息
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const content = newMessage.trim();
        if (!content || !selectedFriend) return;

        const friendEmail = selectedFriend.email.toLowerCase();

        const messageData = {
            sender_email: effectiveEmail,
            receiver_email: friendEmail,
            content: content,
            message_type: 'text',
            is_ai: false,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, messageData]);
        setNewMessage('');

        try {
            const { error } = await supabase.from('messages').insert([messageData]);
            if (error) console.error('Insert error:', error);

            if (content.toLowerCase().includes('@jenziq')) {
                handleAiTrigger(content, effectiveEmail, friendEmail);
            } else if (friendEmail === SUPPORT_EMAIL && !isAdmin) {
                // 如果是發給支援中心，且非管理員發送，則自動觸發支援 AI
                handleSupportAiTrigger(content, effectiveEmail, friendEmail);
            }
        } catch (err) {
            console.error('Send message exception:', err);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setNewMessage(val);
        if (val.endsWith('@')) {
            setShowMentionSuggest(true);
        } else {
            setShowMentionSuggest(false);
        }
    };

    const applyMention = () => {
        setNewMessage(prev => prev + 'JENZiQ ');
        setShowMentionSuggest(false);
    };

    // 4.5 AI 處理邏輯
    const handleAiTrigger = async (userMsg, myEmail, friendEmail) => {
        setIsTyping(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: `你是一位 JENZiQ FITNESS 的 AI 助手。請提供專業、幽默且簡短的建議。` },
                        { role: 'user', content: userMsg }
                    ]
                })
            });

            const data = await response.json();
            const botReply = data.choices[0].message.content;

            const aiMessage = {
                sender_email: myEmail,
                receiver_email: friendEmail,
                content: botReply,
                message_type: 'text',
                is_ai: true,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('messages').insert([aiMessage]);
            if (!error) {
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (err) {
            console.error('AI Error:', err);
        } finally {
            setIsTyping(false);
        }
    };

    // 4.6 支援中心 AI 自動回覆
    const handleSupportAiTrigger = async (userMsg, myEmail, friendEmail) => {
        setIsTyping(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { 
                            role: 'system', 
                            content: `你現在是 JENZiQ FITNESS 的「支援中心」AI 助手。\n1. 負責回答用戶關於 APP 功能或健身的基本問題。\n2. 語氣要親切、專業、有耐心。\n3. 在回覆的最後，請務必加上一段溫馨提示：「💡 我已收到您的訊息，若上述回答未能完全解決您的問題，請在此稍候，我們的『真人專業服務組』已收到通知並會盡速與您聯繫協助。」`
                        },
                        { role: 'user', content: userMsg }
                    ]
                })
            });

            const data = await response.json();
            const botReply = data.choices[0].message.content;

            const aiMessage = {
                sender_email: friendEmail, // 作為支援中心(管理員)回覆
                receiver_email: myEmail,
                content: botReply,
                message_type: 'text',
                is_ai: true,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('messages').insert([aiMessage]);
            // 注意：這裡不呼叫 setMessages，因為 Realtime 監聽器會抓到 receiver_email 是自己的訊息並顯示
        } catch (err) {
            console.error('Support AI Error:', err);
        } finally {
            setIsTyping(false);
        }
    };

    // 5. 發送貼圖
    const handleSendSticker = async (sticker) => {
        if (!selectedFriend) return;
        const myEmail = user.email.toLowerCase();
        const friendEmail = selectedFriend.email.toLowerCase();

        const messageData = {
            sender_email: myEmail,
            receiver_email: friendEmail,
            content: sticker,
            message_type: 'sticker',
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, messageData]);
        setShowStickers(false);

        try {
            const { error } = await supabase.from('messages').insert([messageData]);
            if (error) throw error;
        } catch (err) {
            console.error('Send sticker error:', err);
        }
    };

    // 6. 處理檔案上傳 / 拍攝
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !selectedFriend) return;

        try {
            setIsUploading(true);
            const myEmail = user.email.toLowerCase();
            const friendEmail = selectedFriend.email.toLowerCase();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `chat/${myEmail}/${fileName}`;

            // 上傳到 Supabase Storage (假設已有 chat-media bucket)
            const { error: uploadError, data } = await supabase.storage
                .from('chat-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 獲取公開 URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            const messageData = {
                sender_email: myEmail,
                receiver_email: friendEmail,
                content: '[圖片]',
                message_type: 'image',
                image_url: publicUrl,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, messageData]);
            const { error: msgError } = await supabase.from('messages').insert([messageData]);
            if (msgError) throw msgError;

        } catch (err) {
            console.error('Upload error:', err);
            alert('媒體上傳失敗，請確認存儲桶權限');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const filteredFriends = friends.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 渲染好友列表介面 (IG Style)
    const renderFriendList = () => (
        <div className="friend-list-view">
            <header className="ig-header">
                <button className="back-btn" onClick={onBack}><ChevronLeft size={28} color="white" strokeWidth={3} /></button>
                <h2 className="title">{user?.profile?.name || '我的訊息'}</h2>
                <div className="header-actions">
                </div>
            </header>

            <div className="ig-search">
                <Search size={18} className="search-icon" />
                <input 
                    type="text" 
                    placeholder="搜尋" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="conversations-list">
                {isLoadingFriends ? (
                    <div className="loading-state"><Loader2 className="spin" /></div>
                ) : filteredFriends.length > 0 ? (
                    filteredFriends.map(friend => (
                        <div 
                            key={friend.email} 
                            className="conversation-item"
                            onClick={() => setSelectedFriend(friend)}
                        >
                            <div className="avatar-box">
                                {friend.email === SUPPORT_EMAIL ? (
                                    <div className="support-robot-avatar">
                                        <JZLogoAvatar size={44} />
                                    </div>
                                ) : friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.name} className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder">{(friend.displayName || '?').charAt(0)}</div>
                                )}
                                <div className="online-status"></div>
                                {friend.unreadCount > 0 && (
                                    <div className="unread-badge">
                                        {friend.unreadCount > 4 ? '4+' : friend.unreadCount}
                                    </div>
                                )}
                            </div>
                            <div className="conv-info">
                                <h4 className="conv-name">
                                    {friend.displayName}
                                </h4>
                                <p className="conv-last">
                                    {friend.lastMessage 
                                        ? (friend.lastMessage.message_type === 'image' ? ' [傳送了一張照片]' : 
                                           friend.lastMessage.message_type === 'sticker' ? ` [發送了貼圖 ${friend.lastMessage.content}]` :
                                           friend.lastMessage.content.length > 20 ? friend.lastMessage.content.substring(0, 20) + '...' : friend.lastMessage.content)
                                        : '點擊發送第一則訊息...'}
                                </p>
                            </div>
                            <div className="conv-meta">
                                <Camera size={18} color="#A1A1AA" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-chat-state">
                        <p>尚無好友</p>
                        <span>去尋找朋友來聊天吧！</span>
                    </div>
                )}
            </div>
        </div>
    );

    // 渲染單個對話介面 (IG Style)
    const renderChatRoom = () => (
        <div className="chatroom-view">
            <header className="chat-header">
                <button className="back-btn" onClick={() => setSelectedFriend(null)}><ChevronLeft size={28} color="white" strokeWidth={3} /></button>
                <div className="header-friend-info">
                    <div className={`mini-avatar ${selectedFriend.email === SUPPORT_EMAIL ? 'support-glow' : ''}`}>
                        {selectedFriend.email === SUPPORT_EMAIL ? (
                            <JZLogoAvatar size={34} />
                        ) : selectedFriend.avatar_url ? (
                            <img src={selectedFriend.avatar_url} alt={selectedFriend.name} />
                        ) : (
                            <span>{selectedFriend.name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="header-text">
                        <span className="friend-name">
                            {selectedFriend.email === SUPPORT_EMAIL ? 'JENZiQ AI' : selectedFriend.name}
                        </span>
                        <span className="active-status">剛剛在線上</span>
                    </div>
                </div>
                <div className="chat-actions">
                </div>
            </header>

            <div className="messages-area">
                <div className="chat-intro">
                    <div className={`large-avatar ${selectedFriend.email === SUPPORT_EMAIL ? 'support-glow-large' : ''}`}>
                        {selectedFriend.email === SUPPORT_EMAIL ? (
                            <JZLogoAvatar size={80} />
                        ) : selectedFriend.avatar_url ? (
                            <img src={selectedFriend.avatar_url} alt={selectedFriend.name} />
                        ) : (
                            <span>{selectedFriend.name.charAt(0)}</span>
                        )}
                    </div>
                    <h3>{selectedFriend.email === SUPPORT_EMAIL ? 'JENZiQ AI' : selectedFriend.email === user.email.toLowerCase() ? '我' : selectedFriend.name}</h3>
                    <p>{selectedFriend.role === 'coach' ? 'JENZiQ 教練' : 'JENZiQ 學員'} ‧ {selectedFriend.branch || '未分店'}</p>
                    <button className="view-profile-btn">查看個人檔案</button>
                </div>

                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`message-bubble ${msg.is_ai ? 'ai-bubble' : (msg.sender_email === effectiveEmail ? 'own' : 'other')} ${msg.message_type}`}
                    >
                        {msg.is_ai ? (
                            <div className="ai-badge-chat">
                                <span>JENZiQ AI</span>
                            </div>
                        ) : (msg.sender_email === SUPPORT_EMAIL && msg.sender_email !== effectiveEmail) ? (
                            <div className="admin-badge-chat">
                                <Info size={12} color="white" />
                                <span>🛡️ 專業服務組 (真人)</span>
                            </div>
                        ) : null}
                        <div className="bubble-content">
                            {msg.message_type === 'image' ? (
                                <img src={msg.image_url} alt="Shared" className="msg-image" />
                            ) : msg.message_type === 'sticker' ? (
                                <span className="msg-sticker">{msg.content}</span>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message-bubble ai-bubble typing-robot">
                        <div className="bubble-content">
                            <div className="typing-dots">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="typing-text">JENZiQ AI 正在處理中...</span>
                            </div>
                        </div>
                    </div>
                )}
                {isUploading && (
                    <div className="message-bubble own">
                        <div className="bubble-content loading">
                            <Loader2 className="spin" size={20} /> 上傳中...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-bottom-container">
                {showMentionSuggest && (
                    <div className="mention-suggest-box" onClick={applyMention}>
                        <div className="mention-item">
                            <div className="ai-mini-icon"><Brain size={14} /></div>
                            <span>JENZiQ AI 助手</span>
                        </div>
                    </div>
                )}

                {showStickers && (
                    <div className="sticker-panel">
                        <div className="sticker-grid">
                            {stickers.map(s => (
                                <button key={s} onClick={() => handleSendSticker(s)} className="sticker-btn">{s}</button>
                            ))}
                        </div>
                    </div>
                )}

                <form className="chat-input-bar" onSubmit={handleSendMessage}>
                    {/* 隱藏的檔案輸入 */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload} 
                    />
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        ref={cameraInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload} 
                    />

                    <div className="input-wrapper">
                        <button 
                            type="button" 
                            className="camera-btn" 
                            onClick={() => cameraInputRef.current.click()}
                        >
                            <Camera size={24} />
                        </button>
                        <input 
                            type="text" 
                            placeholder="發送訊息..." 
                            value={newMessage}
                            onChange={handleInputChange}
                            onFocus={() => setShowStickers(false)}
                        />
                        <div className="input-icons">
                            {newMessage ? (
                                <button type="submit" className="send-btn">發送</button>
                            ) : (
                                <>
                                    <button type="button" className="icon-btn" onClick={() => setShowStickers(!showStickers)}>
                                        <Smile size={24} color={showStickers ? '#FF5C00' : 'white'} />
                                    </button>
                                    <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()}>
                                        <ImageIcon size={24} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="ig-chat-container">
            {selectedFriend ? renderChatRoom() : renderFriendList()}

            <style>{`
                .ig-chat-container {
                    height: 100%;
                    background: var(--background);
                    color: white;
                    display: flex;
                    flex-direction: column;
                }

                /* List View Styles */
                .ig-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border);
                }
                .title { font-size: 20px; font-weight: 800; }
                .ig-search {
                    padding: 12px 16px;
                    position: relative;
                }
                .ig-search input {
                    width: 100%;
                    background: #262626;
                    border: none;
                    border-radius: 10px;
                    padding: 8px 12px 8px 40px;
                    color: white;
                    font-size: 16px;
                }
                .search-icon {
                    position: absolute;
                    left: 28px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #8E8E8E;
                }

                .conversations-list { flex: 1; overflow-y: auto; }
                .conversation-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    gap: 12px;
                    cursor: pointer;
                }
                .conversation-item:active { background: rgba(255,255,255,0.05); }
                
                .avatar-box { position: relative; }
                .avatar-img, .avatar-placeholder {
                    width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
                }
                .avatar-placeholder {
                    background: linear-gradient(135deg, #3B82F6, #2563EB);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 24px; font-weight: 800;
                }
                .support-robot-avatar { 
                    width: 56px; height: 56px; background: #18181B; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; 
                    border: 2px solid rgba(0, 242, 255, 0.4); overflow: hidden;
                    box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
                }
                .robot-img { width: 100%; height: 100%; object-fit: cover; }
                .support-glow { border: 2px solid #00f2ff; box-shadow: 0 0 10px rgba(0, 242, 255, 0.4); overflow: hidden; }
                .support-glow img { width: 100%; height: 100%; object-fit: cover; }
                .support-glow-large { 
                    width: 90px; height: 90px; border-radius: 50%; overflow: hidden;
                    border: 3px solid #00f2ff; box-shadow: 0 0 25px rgba(0, 242, 255, 0.4);
                    margin-bottom: 16px; background: #18181B;
                    display: flex; align-items: center; justify-content: center;
                }
                
                /* Robot Avatar Component Styles */
                .robot-head-avatar-ui {
                    background: radial-gradient(circle at 30% 30%, #fff 0%, #eef2f3 100%);
                    border-radius: 50% 50% 45% 45%;
                    position: relative;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                .visor-avatar-ui {
                    width: 75%; height: 45%;
                    background: #0a0a0a;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                }
                .eyes-avatar-ui { display: flex; gap: 5px; }
                .eye-avatar-ui {
                    width: 4px; height: 4px;
                    background: #00f2ff;
                    border-radius: 50%;
                    box-shadow: 0 0 6px #00f2ff;
                }
                .ear-glow-l-ui, .ear-glow-r-ui {
                    position: absolute; width: 10%; height: 35%;
                    background: rgba(0, 242, 255, 0.4);
                    border-radius: 50%; top: 35%; filter: blur(1px);
                }
                .ear-glow-l-ui { left: -1px; }
                .ear-glow-r-ui { right: -1px; }
                
                .typing-robot .bubble-content { 
                    display: flex; align-items: center; gap: 12px; 
                    background: rgba(16, 185, 129, 0.1) !important;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    color: #10B981; font-weight: 600;
                }
                .robot-animation {
                    width: 24px; height: 24px; background: #10B981; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
                .robot-icon-move { animation: robotFlight 1.5s ease-in-out infinite; color: white; }
                @keyframes robotFlight {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .online-status {
                    position: absolute; bottom: 0; right: 0;
                    width: 16px; height: 16px; border-radius: 50%;
                    background: #4ADE80; border: 3px solid var(--background);
                }
                .unread-badge {
                    position: absolute; top: -5px; right: -5px;
                    background: #FF8A00; color: white;
                    min-width: 22px; height: 22px; border-radius: 11px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px; font-weight: 800; border: 2px solid #000;
                    padding: 0 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    z-index: 10;
                }

                .conv-info { flex: 1; }
                .conv-name { font-size: 15px; font-weight: 500; margin-bottom: 2px; color: white; }
                .conv-last { font-size: 14px; color: #8E8E8E; }

                /* Chat View Styles */
                .chatroom-view { height: 100%; display: flex; flex-direction: column; position: relative; }
                .chat-header {
                    display: flex; align-items: center; padding: 12px 16px;
                    border-bottom: 1px solid var(--border); gap: 12px;
                    background: rgba(10, 10, 11, 0.8); backdrop-filter: blur(10px);
                    position: sticky; top: 0; z-index: 10;
                }
                .header-friend-info { flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; }
                .mini-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: #333; display: flex; align-items: center; justify-content: center; font-size: 14px; }
                .mini-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .header-text { display: flex; flex-direction: column; line-height: 1.2; }
                .friend-name { font-size: 15px; font-weight: 600; color: white; }
                .active-status { font-size: 12px; color: #8E8E8E; }
                .chat-actions { display: flex; gap: 20px; color: white; margin-left: 10px; }

                .messages-area {
                    flex: 1; overflow-y: auto; padding: 16px;
                    display: flex; flex-direction: column;
                    gap: 12px; scrollbar-width: none;
                }
                .messages-area::-webkit-scrollbar { display: none; }

                .chat-intro {
                    display: flex; flex-direction: column; align-items: center;
                    padding: 60px 20px; text-align: center;
                }
                .large-avatar {
                    width: 100px; height: 100px; border-radius: 50%;
                    overflow: hidden; background: #333; margin-bottom: 16px;
                    display: flex; align-items: center; justify-content: center; font-size: 40px;
                    border: 1px solid var(--border);
                }
                .large-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .chat-intro h3 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: white; }
                .chat-intro p { font-size: 14px; color: #8E8E8E; margin-bottom: 20px; }
                .view-profile-btn {
                    background: #262626; color: white; padding: 8px 16px;
                    border-radius: 10px; font-size: 14px; font-weight: 600;
                    border: 1px solid #363636;
                }

                .message-bubble {
                    max-width: 70%; font-size: 16px;
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .bubble-content {
                    padding: 12px 18px; border-radius: 22px;
                    line-height: 1.4;
                }
                .message-bubble.other { align-self: flex-start; }
                .message-bubble.other .bubble-content {
                    background: #262626; color: white;
                    border-bottom-left-radius: 4px;
                }
                .message-bubble.own { align-self: flex-end; }
                .message-bubble.own .bubble-content {
                    background: linear-gradient(135deg, #FF5C00, #E11D48);
                    color: white; border-bottom-right-radius: 4px;
                    box-shadow: 0 4px 12px rgba(255, 92, 0, 0.2);
                }

                .message-bubble.ai-bubble {
                    align-self: flex-start;
                    max-width: 85%;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 24px;
                }
                .message-bubble.ai-bubble .bubble-content {
                    background: linear-gradient(135deg, #064E3B 0%, #065F46 100%);
                    color: #D1FAE5;
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 4px 15px rgba(6, 78, 59, 0.3);
                }
                .ai-badge-chat, .admin-badge-chat {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 800;
                    margin-left: 4px;
                    text-transform: uppercase;
                }
                .ai-badge-chat span { color: #10B981; }
                .admin-badge-chat span { color: #FACC15; }
                
                .message-bubble.image { max-width: 240px; }
                .message-bubble.image .bubble-content { padding: 4px; border-radius: 12px; overflow: hidden; }
                .msg-image { width: 100%; border-radius: 8px; display: block; }

                .message-bubble.sticker .bubble-content { background: none !important; padding: 0; box-shadow: none !important; }
                .msg-sticker { font-size: 48px; }

                .bubble-content.loading { display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8; }

                .chat-bottom-container { position: sticky; bottom: 0; background: var(--background); }
                .sticker-panel {
                    background: #1A1A1A; border-top: 1px solid var(--border);
                    max-height: 200px; overflow-y: auto; padding: 16px;
                    animation: slideUp 0.2s ease;
                }
                .sticker-grid {
                    display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
                }
                .sticker-btn {
                    font-size: 32px; background: none; border: none; padding: 8px;
                    transition: transform 0.2s;
                }
                .sticker-btn:active { transform: scale(1.2); }

                .chat-input-bar {
                    padding: 16px; background: var(--background);
                }
                .icon-btn { color: white; background: none; display: flex; align-items: center; justify-content: center; padding: 0; }
                
                .mention-suggest-box {
                    background: #262626;
                    border-top: 1px solid var(--border);
                    padding: 8px 16px;
                    cursor: pointer;
                    animation: slideUp 0.15s ease;
                }
                .mention-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                }
                .ai-mini-icon {
                    width: 24px;
                    height: 24px;
                    background: #10B981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .input-wrapper {
                    background: #262626; border-radius: 28px;
                    padding: 6px 12px 6px 8px; display: flex; align-items: center;
                    border: 1px solid #363636;
                }
                .camera-btn {
                    width: 38px; height: 38px; background: #3797F0;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    color: white; margin-right: 10px; flex-shrink: 0;
                }
                .input-wrapper input {
                    flex: 1; background: none; border: none; padding: 8px;
                    color: white; font-size: 15px; outline: none;
                }
                .input-icons { display: flex; gap: 12px; padding: 0 8px; color: white; }
                .send-btn {
                    color: #3797F0; font-weight: 700; padding: 0 12px;
                    font-size: 15px;
                }

                .empty-chat-state {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 100px 40px; text-align: center; color: #8E8E8E;
                }
                .empty-chat-state p { font-size: 18px; font-weight: 700; color: white; margin-bottom: 8px; }
                .loading-state { display: flex; justify-content: center; padding: 40px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Chatroom;
