import React, { useState } from 'react';
import RoleSelection from './components/RoleSelection';
import StudentDashboard from './components/StudentDashboard';
import CoachDashboard from './components/CoachDashboard';
import ManagerDashboard from './components/ManagerDashboard';

import Login from './components/Login';
import ProfileForm from './components/ProfileForm';
import { supabase } from './supabase';
import { useEffect } from 'react';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fit_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tempRole, setTempRole] = useState(null);
  const [hasTrackedThisSession, setHasTrackedThisSession] = useState(false);

  // 當使用者狀態改變，儲存至 localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('fit_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fit_user');
    }
  }, [user]);

  // 偵測「點開程式」的紀錄
  useEffect(() => {
    const trackAppOpen = async () => {
      if (user && !hasTrackedThisSession) {
        try {
          await supabase
            .from('user_logins')
            .insert({
              email: user.email,
              role: user.role || 'unknown',
              login_at: new Date().toISOString()
            });
          setHasTrackedThisSession(true);
        } catch (err) {
          console.error('Failed to track app open:', err);
        }
      }
    };
    trackAppOpen();
  }, [user, hasTrackedThisSession]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setTempRole(null);
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
  };

  // 渲染邏輯
  const renderContent = () => {
    // 1. 如果沒登入，顯示登入頁面
    if (!user) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    // 2. 如果是超級管理者 test@gmail.com
    if (user.email === 'test@gmail.com') {
      if (!tempRole) {
        return <RoleSelection onSelect={setTempRole} />;
      }
      switch (tempRole) {
        case 'student': return <StudentDashboard user={user} onLogout={handleLogout} />;
        case 'coach': return <CoachDashboard user={user} onLogout={handleLogout} />;
        case 'manager': return <ManagerDashboard user={user} onLogout={handleLogout} />;
        default: return <RoleSelection onSelect={setTempRole} />;
      }
    }

    // 3. 如果資料還沒完善 (非超級管理者)
    if (!user.profile || !user.profile.first_login_completed) {
      return <ProfileForm user={user} onComplete={handleProfileComplete} />;
    }

    // 4. 一般登入後的角色介面
    switch (user.role) {
      case 'student': return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'coach': return <CoachDashboard user={user} onLogout={handleLogout} />;
      case 'manager': return <ManagerDashboard user={user} onLogout={handleLogout} />;
      default: return <Login onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="app-container">
      {renderContent()}
    </div>
  );
}

export default App;
