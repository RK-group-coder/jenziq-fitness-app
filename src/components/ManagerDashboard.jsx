import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
    LayoutDashboard,
    Calendar,
    Users,
    ClipboardList,
    Settings,
    Menu,
    X,
    Bell,
    LogOut,
    ChevronRight,
    MapPin,
    Zap,
    Award,
    ShieldAlert,
    UserCheck,
    Briefcase,
    ShieldCheck,
    Image as ImageIcon,
    CreditCard
} from 'lucide-react';
import ManagerHome from './manager/ManagerHome';
import TopNav from './TopNav';
import UnifiedActivityManager from './manager/UnifiedActivityManager';
import PermissionsManager from './manager/PermissionsManager';
import SettingsManager from './manager/SettingsManager';
import LocationManager from './manager/LocationManager';
import LeaveManager from './manager/LeaveManager';
import NotificationManager from './manager/NotificationManager';
import CertificationManager from './manager/CertificationManager';
import XpRuleManager from './manager/XpRuleManager';
import XpApplicationReview from './manager/XpApplicationReview';
import UserDetailsManager from './manager/UserDetailsManager';
import Inbox from './Inbox';
import Chatroom from './Chatroom';
import FriendList from './FriendList';
import ArticleManager from './manager/ArticleManager';
import CoachScheduleReview from './manager/CoachScheduleReview';
import InjuryAlertManager from './manager/InjuryAlertManager';
import HeroBannerEditor from './manager/HeroBannerEditor';
import BannerManager from './manager/BannerManager';
import CourseApplicationReview from './manager/CourseApplicationReview';
import StudentCourseManager from './manager/StudentCourseManager';
import PaymentRequestManager from './manager/PaymentRequestManager';
import MembershipPlanManager from './manager/MembershipPlanManager';
import PaymentHistoryManager from './manager/PaymentHistoryManager';
import AccountPlanManager from './manager/AccountPlanManager';

const ManagerDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [initialChatFriend, setInitialChatFriend] = useState(null);
    const [showFriends, setShowFriends] = useState(false);
    const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
    const [pendingCertCount, setPendingCertCount] = useState(0);
    const [pendingXpCount, setPendingXpCount] = useState(0);
    const [pendingInjuryCount, setPendingInjuryCount] = useState(0);
    const [pendingCourseAppCount, setPendingCourseAppCount] = useState(0);

    useEffect(() => {
        fetchPendingCounts();

        const interval = setInterval(() => {
            fetchPendingCounts();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleContactUser = (userData) => {
        if (!userData) return;
        setInitialChatFriend(userData);
        setShowChat(true);
    };

    const fetchPendingCounts = async () => {
        try {
            // 抓請假待審核
            const { count: leaveCount } = await supabase
                .from('coach_leaves')
                .select('*', { count: 'exact', head: true })
                .eq('status', '待審核');
            setPendingLeaveCount(leaveCount || 0);

            // 抓證照待審核
            const { count: certCount } = await supabase
                .from('coach_certifications')
                .select('*', { count: 'exact', head: true })
                .eq('status', '待審核');
            setPendingCertCount(certCount || 0);

            // 抓 XP 申請待審核
            const { count: xpCount } = await supabase
                .from('coach_xp_applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', '待審核');
            setPendingXpCount(xpCount || 0);

            // 抓疼痛警訊 (從 localStorage)
            try {
                const alerts = JSON.parse(localStorage.getItem('injury_alerts') || '[]');
                const unconfirmed = Array.isArray(alerts) ? alerts.filter(a => !a.confirmed).length : 0;
                setPendingInjuryCount(unconfirmed);
            } catch (e) {
                setPendingInjuryCount(0);
            }

            // 抓課程申請待審核
            const { count: courseAppCount } = await supabase
                .from('coach_schedule')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            setPendingCourseAppCount(courseAppCount || 0);
        } catch (err) {
            console.error('Fetch counts error:', err);
        }
    };

    const menuSections = [
        {
            title: '學生專區',
            items: [
                { id: 'student_mgmt', label: '學員管理', icon: UserCheck },
                { id: 'student_courses', label: '學員課程管理', icon: Calendar },
                { id: 'payment_mgmt', label: '應收帳款管理', icon: CreditCard },
                { id: 'payment_history', label: '金流對帳中心', icon: CreditCard },
                { id: 'membership_plans', label: '會籍方案管理', icon: Zap },
                { id: 'student_plans', label: '學員方案與點數', icon: UserCheck },
                { id: 'activities', label: '學員活動管理', icon: Calendar },
                { id: 'locations', label: '據點管理', icon: MapPin },
                { id: 'hero_banner', label: '首頁形象管理', icon: ImageIcon },
                { id: 'ad_banners', label: '廣告輪播管理', icon: Zap },
            ]
        },
        {
            title: '教練專區',
            items: [
                { id: 'coach_mgmt', label: '教練管理', icon: Briefcase },
                { id: 'course_apps', label: '課程申請審核', icon: ShieldCheck, badge: pendingCourseAppCount },
                { id: 'coach_schedule_review', label: '教練班表總覽', icon: Calendar },
                { id: 'coach_activities', label: '教練活動管理', icon: Zap },
                { id: 'leaves', label: '請假管理', icon: ClipboardList, badge: pendingLeaveCount },
                { id: 'certs', label: '證照審核', icon: Award, badge: pendingCertCount },
                { id: 'xp_review', label: 'XP申請審核', icon: Award, badge: pendingXpCount },
            ]
        },
        {
            title: '共用區域',
            items: [
                { id: 'home', label: '總覽儀表板', icon: LayoutDashboard },
                { id: 'injury_alerts', label: '疼痛警訊系統', icon: ShieldAlert, badge: pendingInjuryCount },
                { id: 'permissions', label: '權限設置', icon: ShieldAlert },
                { id: 'manager_mgmt', label: '現有管理者', icon: ShieldCheck },
                { id: 'xp_rules', label: 'XP規則管理', icon: Zap },
                { id: 'notifications', label: '發送通知', icon: Bell },
                { id: 'articles', label: '文章管理', icon: ClipboardList },
                { id: 'settings', label: '系統設定', icon: Settings },
            ]
        }
    ];

    const pendingCounts = {
        leaves: pendingLeaveCount,
        certs: pendingCertCount,
        xp: pendingXpCount,
        injuries: pendingInjuryCount,
        courseApps: pendingCourseAppCount
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <ManagerHome onNavigate={setActiveTab} pendingCounts={pendingCounts} />;
            case 'injury_alerts': return <InjuryAlertManager onContactUser={handleContactUser} onUpdate={fetchPendingCounts} />;
            case 'permissions': return <PermissionsManager />;
            case 'xp_rules': return <XpRuleManager />;
            case 'student_mgmt': return <UserDetailsManager targetRole="student" />;
            case 'course_apps': return <CourseApplicationReview onUpdate={() => fetchPendingCounts()} />;
            case 'coach_schedule_review': return <CoachScheduleReview />;
            case 'coach_mgmt': return <UserDetailsManager targetRole="coach" />;
            case 'manager_mgmt': return <UserDetailsManager targetRole="manager" />;
            case 'student_courses': return <StudentCourseManager />;
            case 'activities': return <UnifiedActivityManager initialTab="student" />;
            case 'coach_activities': return <UnifiedActivityManager initialTab="coach" />;
            case 'locations': return <LocationManager />;
            case 'notifications': return <NotificationManager />;
            case 'leaves': return <LeaveManager onUpdate={() => fetchPendingCounts()} />;
            case 'certs': return <CertificationManager onUpdate={() => fetchPendingCounts()} />;
            case 'xp_review': return <XpApplicationReview onUpdate={() => fetchPendingCounts()} />;
            case 'articles': return <ArticleManager />;
            case 'payment_mgmt': return <PaymentRequestManager />;
            case 'membership_plans': return <MembershipPlanManager />;
            case 'student_plans': return <AccountPlanManager />;
            case 'payment_history': return <PaymentHistoryManager onBack={() => setActiveTab('home')} />;
            case 'hero_banner': return <HeroBannerEditor />;
            case 'ad_banners': return <BannerManager />;
            case 'settings': return <SettingsManager />;
            default: return <ManagerHome onNavigate={setActiveTab} pendingCounts={pendingCounts} />;
        }
    };


    const activeLabel = menuSections.flatMap(s => s.items).find(m => m.id === activeTab)?.label || '管理中心';

    return (
        <div className="manager-dashboard">
            <TopNav
                onMenuClick={() => setIsMenuOpen(true)}
                onInboxClick={() => setShowInbox(true)}
                onChatClick={() => setShowChat(true)}
                onFriendListClick={() => setShowFriends(true)}
            />

            {showInbox && (
                <div className="inbox-overlay">
                    <Inbox user={user} role="admin" onBack={() => setShowInbox(false)} />
                </div>
            )}

            {showChat && (
                <div className="inbox-overlay">
                    <Chatroom 
                        user={user} 
                        onBack={() => {
                            setShowChat(false);
                            setInitialChatFriend(null);
                        }} 
                        initialFriend={initialChatFriend}
                    />
                </div>
            )}

            {showFriends && (
                <div className="inbox-overlay">
                    <FriendList user={user} onBack={() => setShowFriends(false)} />
                </div>
            )}

            {isMenuOpen && <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}></div>}

            <aside className={`side-drawer ${isMenuOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div className="manager-brand">
                        <div className="brand-dot"></div>
                        <span>JZ Admin</span>
                    </div>
                    <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="drawer-nav">
                    {menuSections.map(section => (
                        <div key={section.title} className="nav-section">
                            <h3 className="section-title">{section.title}</h3>
                            {section.items.map(item => (
                                <button
                                    key={item.id}
                                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <div className="nav-left">
                                        <item.icon size={20} />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                                    <ChevronRight size={16} className="arrow" />
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="drawer-footer">
                    <div className="admin-profile">
                        <div className="prof-avatar">{user?.profile?.name?.charAt(0) || user?.email.charAt(0).toUpperCase()}</div>
                        <div className="prof-info">
                            <p className="prof-name">{user?.profile?.name || '系統管理者'}</p>
                            <p className="prof-email">{user?.email}</p>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={onLogout}>
                        <LogOut size={18} />
                        <span>登出系統</span>
                    </button>
                </div>
            </aside>

            <main className="manager-main-content">
                {renderContent()}
            </main>

            <style>{`
        .manager-dashboard { display: flex; flex-direction: column; height: 100vh; background-color: var(--background); overflow: hidden; position: relative; }
        .inbox-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; background-color: var(--background); }
        .manager-main-content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .drawer-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; }
        .side-drawer { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background-color: #0F172A; z-index: 1001; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; }
        .side-drawer.open { left: 0; }
        .drawer-header { padding: 32px 24px; display: flex; justify-content: space-between; align-items: center; }
        .manager-brand { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 800; color: white; }
        .brand-dot { width: 12px; height: 12px; background-color: var(--primary); border-radius: 50%; }
        .close-btn { color: var(--text-secondary); background: none; }
        .drawer-nav { flex: 1; padding: 0 16px; overflow-y: auto; scrollbar-width: none; }
        .drawer-nav::-webkit-scrollbar { display: none; }
        .nav-item { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; margin-bottom: 4px; color: var(--text-secondary); transition: all 0.2s; white-space: nowrap; }
        .nav-section { margin-bottom: 24px; }
        .section-title { padding: 0 16px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
        .nav-item.active { background-color: rgba(255, 92, 0, 0.1); color: var(--primary); }
        .nav-left { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; }
        .nav-badge { background-color: var(--primary); color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 10px; }
        .arrow { opacity: 0; transition: opacity 0.2s; }
        .nav-item.active .arrow { opacity: 1; }
        .drawer-footer { padding: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
        .admin-profile { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .prof-avatar { width: 40px; height: 40px; background-color: var(--secondary-bg); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--border); }
        .prof-info { flex: 1; }
        .prof-name { font-size: 14px; font-weight: 700; color: white; }
        .prof-email { font-size: 11px; color: var(--text-secondary); }
        .logout-btn { width: 100%; display: flex; align-items: center; gap: 12px; color: #EF4444; font-size: 14px; font-weight: 600; background: none; }
      `}</style>
        </div>
    );
};

export default ManagerDashboard;
